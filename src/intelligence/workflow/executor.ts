/**
 * TeleDOM v4.1 — Workflow Executor (DETERMINISTIC, DUMB).
 *
 * The executor is intentionally brainless:
 *   - it NEVER designs, reorders, optimizes or repairs the agent's workflow
 *   - it resolves {{templates}}, enforces the execution policy,
 *     calls the FULL MCP tool pipeline for each step and records exactly
 *     what happened (Observation, Action, Target, Outcome, Timing)
 *   - failures are returned honestly; recovery reasoning is the AGENT's job
 *
 * Approval model (human-in-the-loop): when a step requires approval, the
 * run BLOCKS and reports pendingApprovals back to the agent. The agent
 * obtains user consent out-of-band and re-runs with approvedSteps.
 * TeleDOM never auto-approves anything.
 */

import { randomUUID } from 'crypto';
import {
  AgentWorkflow,
  ExecutionPolicy,
  StepRun,
  WorkflowRun,
  WorkflowStep,
} from './domain';

/** The tool-call pipeline — injected from the root MCPToolsHandler. */
export interface ToolPipeline {
  handleToolCall(name: string, args: Record<string, any>): Promise<{ content?: { type: string; text?: string }[]; isError?: boolean }>;
}

export interface RunRequest {
  workflow: AgentWorkflow;
  inputs: Record<string, unknown>;
  /** Steps the agent has explicitly approved (from pendingApprovals). */
  approvedSteps?: string[];
  /** Validate + plan only, do not execute. */
  dryRun?: boolean;
}

// Exact tool set counted as "DOM scans" for the KPI metric (a health
// snapshot is NOT a DOM analysis — precise semantics, honest metrics).
const DOM_SCAN_TOOLS = new Set([
  'inspect_live_page', 'inspect_live_element', 'get_live_dom_snapshot', 'get_live_dom_subtree',
  'search_dom', 'analyze_dom', 'get_page_blueprint', 'capture_page_state',
  'td_dom_inspect', 'td_dom_query', 'td_dom_snapshot', 'td_semantic_page',
]);

/** Glob-ish pattern match supporting only leading/trailing `*`. */
export function toolMatches(pattern: string, tool: string): boolean {
  if (pattern === '*' || pattern === tool) return true;
  if (pattern.startsWith('*') && pattern.endsWith('*') && pattern.length > 1) {
    return tool.includes(pattern.slice(1, -1));
  }
  if (pattern.startsWith('*')) return tool.endsWith(pattern.slice(1));
  if (pattern.endsWith('*')) return tool.startsWith(pattern.slice(0, -1));
  return pattern === tool;
}

function parsePathSegments(rawPath: string): string[] {
  const normalized = rawPath
    .replace(/\[['"]?([^'"\]]+)['"]?\]/g, '.$1')
    .replace(/^\./, '');
  return normalized.split('.').filter(Boolean);
}

function getByPath(obj: unknown, rawPath: string): unknown {
  const segments = parsePathSegments(rawPath);
  let cur: unknown = obj;
  for (const key of segments) {
    if (cur === null || cur === undefined) return undefined;
    if (typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

function evaluateExpression(expr: string, lookup: (path: string) => unknown): unknown {
  const trimmed = expr.trim();
  // Support fallback: {{var | "default"}} or {{var || "default"}}
  const pipeIdx = trimmed.search(/\s*(\|\||\|)\s*/);
  if (pipeIdx > 0) {
    const mainPath = trimmed.slice(0, pipeIdx).trim();
    const fallbackRaw = trimmed.slice(pipeIdx).replace(/^(\|\||\|)/, '').trim();
    const resolved = lookup(mainPath);
    if (resolved !== undefined && resolved !== null && resolved !== '') {
      return resolved;
    }
    // Parse fallback literal if quoted, or resolve as secondary path
    if ((fallbackRaw.startsWith('"') && fallbackRaw.endsWith('"')) || (fallbackRaw.startsWith("'") && fallbackRaw.endsWith("'"))) {
      return fallbackRaw.slice(1, -1);
    }
    if (fallbackRaw === 'true') return true;
    if (fallbackRaw === 'false') return false;
    if (!isNaN(Number(fallbackRaw))) return Number(fallbackRaw);
    return lookup(fallbackRaw) ?? fallbackRaw;
  }
  return lookup(trimmed);
}

function deepTemplate(value: unknown, lookup: (path: string) => unknown): unknown {
  if (typeof value === 'string') {
    const full = value.match(/^\{\{([^{}]+)\}\}$/);
    if (full) {
      const resolved = evaluateExpression(full[1], lookup);
      return resolved === undefined ? value : resolved;
    }
    return value.replace(/\{\{([^{}]+)\}\}/g, (_m, expr: string) => {
      const resolved = evaluateExpression(expr, lookup);
      return resolved === undefined ? `{{${expr}}}` : (typeof resolved === 'object' ? JSON.stringify(resolved) : String(resolved));
    });
  }
  if (Array.isArray(value)) return value.map((v) => deepTemplate(v, lookup));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepTemplate(v, lookup);
    return out;
  }
  return value;
}

/** Bounded JSON summary for run records (keeps files small + deterministic). */
function summarize(value: unknown, budget = 2048): unknown {
  try {
    const json = JSON.stringify(value);
    if (json.length <= budget) return value;
    return { truncated: true, preview: json.slice(0, budget), bytes: json.length };
  } catch (err: any) {
    return { unserializable: String(err?.message ?? err) };
  }
}

export class WorkflowExecutor {
  constructor(private readonly pipeline: ToolPipeline) {}

  async execute(req: RunRequest): Promise<WorkflowRun> {
    const wf = req.workflow;
    const policy: ExecutionPolicy = {
      maxSteps: wf.policy?.maxSteps ?? 200,
      maxRuntimeMs: wf.policy?.maxRuntimeMs ?? 300000,
      maxStepMs: wf.policy?.maxStepMs ?? 60000,
      ...wf.policy,
    };
    const startedAt = Date.now();
    const run: WorkflowRun = {
      id: `run_${startedAt}_${randomUUID().slice(0, 8)}`,
      workflowId: wf.id,
      workflowName: wf.name,
      workflowVersion: wf.version,
      status: 'RUNNING',
      startedAt,
      inputs: req.inputs,
      steps: [],
      metrics: { stepsPlanned: wf.steps.length, stepsExecuted: 0, toolCalls: 0, domScans: 0, retries: 0, durationMs: 0, tokensSavedEstimate: 0 },
    };

    // Merge declared input defaults (agent-declared; TeleDOM is dumb here)
    const inputValues: Record<string, unknown> = {};
    for (const [name, spec] of Object.entries(wf.inputs ?? {})) {
      inputValues[name] = req.inputs[name] !== undefined ? req.inputs[name] : spec?.default;
    }
    for (const [k, v] of Object.entries(req.inputs)) inputValues[k] = v;

    const stepResults = new Map<string, unknown>();

    if (req.dryRun) {
      run.status = 'SUCCESS';
      run.metrics.stepsExecuted = 0;
      run.finishedAt = Date.now();
      run.metrics.durationMs = run.finishedAt - startedAt;
      (run as any).plan = wf.steps.map((s) => ({ stepId: s.id, tool: s.tool, args: deepTemplate(s.args ?? {}, (p) => getByPath({ inputs: inputValues }, p)) }));
      return run;
    }

    for (const step of wf.steps) {
      // Policy: step cap
      if (run.steps.length >= (policy.maxSteps ?? 200)) {
        run.status = 'ABORTED';
        run.error = `execution policy: maxSteps ${policy.maxSteps} reached`;
        break;
      }
      // Policy: wall-clock cap
      if (Date.now() - startedAt > (policy.maxRuntimeMs ?? 300000)) {
        run.status = 'ABORTED';
        run.error = `execution policy: maxRuntimeMs ${policy.maxRuntimeMs} exceeded`;
        break;
      }

      const stepRun = await this.executeStep(step, {
        policy,
        inputs: inputValues,
        stepResults,
        approvedSteps: req.approvedSteps ?? [],
        startedAt,
      });
      run.steps.push(stepRun);
      run.metrics.stepsExecuted += stepRun.status === 'SKIPPED' ? 0 : 1;
      run.metrics.toolCalls += stepRun.attempts;
      if (DOM_SCAN_TOOLS.has(step.tool)) run.metrics.domScans += stepRun.attempts;
      run.metrics.retries += Math.max(0, stepRun.attempts - 1);
      if (stepRun.status === 'PASS') stepResults.set(step.id, stepRun.result);

      if (stepRun.status === 'BLOCKED') {
        run.status = 'BLOCKED';
        run.pendingApprovals = [{ stepId: step.id, tool: step.tool }];
        run.error = `step "${step.id}" requires approval — obtain user consent and re-run with approvedSteps: ["${step.id}"]`;
        break;
      }
      if (stepRun.status === 'FAIL') {
        const onError = step.onError ?? 'abort';
        if (onError === 'abort') {
          run.status = run.steps.some((s) => s.status === 'PASS') ? 'PARTIAL' : 'FAILED';
          run.error = `step "${step.id}" (${step.tool}) failed: ${stepRun.error}`;
          break;
        }
        // continue / skip: keep going, verdict at the end
      }
    }

    if (run.status === 'RUNNING') {
      const failed = run.steps.filter((s) => s.status === 'FAIL');
      const passed = run.steps.filter((s) => s.status === 'PASS');
      run.status = failed.length === 0 ? 'SUCCESS' : passed.length > 0 ? 'PARTIAL' : 'FAILED';
    }

    run.finishedAt = Date.now();
    run.metrics.durationMs = run.finishedAt - startedAt;
    // Honest, dumb estimate: each tool call ≈ one MCP round-trip the agent
    // no longer has to make individually (workflow call itself is 1).
    run.metrics.tokensSavedEstimate = Math.max(0, run.metrics.toolCalls - 1) * 380;
    return run;
  }

  /** Deterministic re-execution of a recorded run's steps, verbatim. */
  async replaySteps(meta: { workflowId: string; workflowName: string; workflowVersion: string }, steps: StepRun[], replayOf: string): Promise<WorkflowRun> {
    const startedAt = Date.now();
    const run: WorkflowRun = {
      id: `run_${startedAt}_${randomUUID().slice(0, 8)}`,
      workflowId: meta.workflowId,
      workflowName: meta.workflowName,
      workflowVersion: meta.workflowVersion,
      status: 'RUNNING',
      startedAt,
      inputs: {},
      steps: [],
      replayOf,
      metrics: { stepsPlanned: steps.length, stepsExecuted: 0, toolCalls: 0, domScans: 0, retries: 0, durationMs: 0, tokensSavedEstimate: 0 },
    };
    for (const recorded of steps) {
      if (recorded.status === 'SKIPPED') {
        run.steps.push({ ...recorded, attempts: 0, durationMs: 0, startedAt: Date.now() });
        continue;
      }
      const executed = await this.callTool(recorded.tool, recorded.args, 60000);
      const stepRun: StepRun = {
        ...recorded,
        status: executed.ok ? 'PASS' : 'FAIL',
        attempts: 1,
        startedAt: Date.now(),
        durationMs: executed.durationMs,
        result: executed.ok ? summarize(executed.parsed) : undefined,
        error: executed.ok ? undefined : executed.error,
      };
      run.steps.push(stepRun);
      run.metrics.stepsExecuted += 1;
      run.metrics.toolCalls += 1;
      if (DOM_SCAN_TOOLS.has(recorded.tool)) run.metrics.domScans += 1;
      if (!executed.ok) {
        run.status = 'PARTIAL';
        run.error = `replayed step "${recorded.stepId}" failed: ${executed.error}`;
        break;
      }
    }
    if (run.status === 'RUNNING') run.status = 'SUCCESS';
    run.finishedAt = Date.now();
    run.metrics.durationMs = run.finishedAt - startedAt;
    run.metrics.tokensSavedEstimate = Math.max(0, run.metrics.toolCalls - 1) * 380;
    return run;
  }

  // ── internals ──────────────────────────────────────────────────────────

  private async executeStep(
    step: WorkflowStep,
    ctx: {
      policy: ExecutionPolicy;
      inputs: Record<string, unknown>;
      stepResults: Map<string, unknown>;
      approvedSteps: string[];
      startedAt: number;
    },
  ): Promise<StepRun> {
    const stepRun: StepRun = {
      stepId: step.id,
      tool: step.tool,
      args: {},
      status: 'FAIL',
      attempts: 0,
      startedAt: Date.now(),
      durationMs: 0,
    };

    // 1. resolve templates {{inputs.x}} / {{steps.y.path}}
    const lookup = (expr: string): unknown => {
      if (expr.startsWith('inputs.')) return getByPath({ inputs: ctx.inputs }, expr);
      if (expr.startsWith('steps.')) {
        const rest = expr.slice('steps.'.length);
        const dot = rest.indexOf('.');
        if (dot === -1) return ctx.stepResults.get(rest);
        const stepId = rest.slice(0, dot);
        return getByPath(ctx.stepResults.get(stepId), rest.slice(dot + 1));
      }
      return undefined;
    };
    stepRun.args = deepTemplate(step.args ?? {}, lookup) as Record<string, unknown>;

    // 2. policy: tool allow/deny
    const tool = step.tool;
    if (ctx.policy.deniedTools?.some((p) => toolMatches(p, tool))) {
      stepRun.status = 'FAIL';
      stepRun.error = `execution policy: tool "${tool}" is denied by workflow policy`;
      return stepRun;
    }
    if (ctx.policy.allowedTools?.length && !ctx.policy.allowedTools.some((p) => toolMatches(p, tool))) {
      stepRun.status = 'FAIL';
      stepRun.error = `execution policy: tool "${tool}" is not in allowedTools`;
      return stepRun;
    }

    // 3. policy: navigation domain guard (any step carrying a url arg)
    const urlArg = stepRun.args?.url ?? stepRun.args?.targetUrl;
    if (typeof urlArg === 'string' && /^https?:\/\//i.test(urlArg)) {
      try {
        const host = new URL(urlArg).hostname;
        if (ctx.policy.deniedDomains?.some((d) => host === d || host.endsWith(`.${d}`))) {
          stepRun.status = 'FAIL';
          stepRun.error = `execution policy: domain "${host}" is denied`;
          return stepRun;
        }
        if (ctx.policy.allowedDomains?.length && !ctx.policy.allowedDomains.some((d) => host === d || host.endsWith(`.${d}`))) {
          stepRun.status = 'FAIL';
          stepRun.error = `execution policy: domain "${host}" is not in allowedDomains`;
          return stepRun;
        }
      } catch { /* unparseable URL: let the tool itself report honestly */ }
    }

    // 4. approval gate (BLOCKED — never auto-approve)
    const needsApproval =
      step.requireApproval === true ||
      ctx.policy.requireApprovalFor?.some((p) => toolMatches(p, tool)) === true;
    if (needsApproval && !ctx.approvedSteps.includes(step.id)) {
      stepRun.status = 'BLOCKED';
      stepRun.error = 'approval required — human-in-the-loop gate';
      return stepRun;
    }

    // 5. dumb retry loop (bounded)
    const timeoutMs = step.timeoutMs ?? ctx.policy.maxStepMs ?? 60000;
    const retryCount = Math.min(10, Math.max(0, step.retry?.count ?? 0));
    const delayMs = Math.min(5000, Math.max(0, step.retry?.delayMs ?? 0));
    let last: { ok: boolean; parsed?: unknown; error?: string; durationMs: number };
    do {
      stepRun.attempts += 1;
      last = await this.callTool(tool, stepRun.args, timeoutMs);
      if (last.ok) break;
      if (stepRun.attempts <= retryCount && delayMs > 0) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    } while (!last.ok && stepRun.attempts <= retryCount);

    stepRun.durationMs = Date.now() - stepRun.startedAt;
    if (last.ok) {
      stepRun.status = 'PASS';
      stepRun.result = summarize(last.parsed);
    } else {
      stepRun.status = 'FAIL';
      stepRun.error = last.error;
    }
    return stepRun;
  }

  /** One tool call through the authoritative MCP pipeline. */
  private async callTool(
    tool: string,
    args: Record<string, unknown>,
    timeoutMs: number,
  ): Promise<{ ok: boolean; parsed?: unknown; error?: string; durationMs: number }> {
    const started = Date.now();
    try {
      const result = await Promise.race([
        this.pipeline.handleToolCall(tool, args),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`step timeout after ${timeoutMs}ms`)), timeoutMs)),
      ]);
      const durationMs = Date.now() - started;
      const text = result?.content?.[0]?.text ?? '';
      let parsed: unknown = text;
      try { parsed = JSON.parse(text); } catch { /* plain text result */ }
      if (result?.isError) {
        return { ok: false, parsed, error: ((parsed as any)?.error ?? text.slice(0, 500)) || 'tool reported error', durationMs };
      }
      return { ok: true, parsed, durationMs };
    } catch (err: any) {
      return { ok: false, error: String(err?.message ?? err), durationMs: Date.now() - started };
    }
  }
}
