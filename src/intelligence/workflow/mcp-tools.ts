/**
 * TeleDOM v4.1 MCP — Agent-Owned Workflow + Browser Primitive tools.
 *
 * Implements the three v4.1 tool families on top of the dumb primitives:
 *
 *   1. Browser primitives (td_browser_* / td_dom_* / td_target_* /
 *      td_action_* / td_wait / td_screenshot / td_execute_script /
 *      td_network_inspect / td_console_read) — thin, stable facade over
 *      the existing live pipeline. Browser-first; no API required.
 *
 *   2. Workflow persistence (td_workflow_*) — CRUD + versioning + diff +
 *      export/import + DUMB execution (td_workflow_run) + deterministic
 *      execution records + verbatim replay. TeleDOM never designs,
 *      optimizes or repairs workflows — the agent owns them.
 *
 *   3. Agent-owned tooling (td_target_memory_* / td_agent_artifact_*) —
 *      learned targets (target memory) and generic agent artifacts
 *      (custom tools, scripts, policies, memories, notes).
 *
 * Honest status taxonomy: PASS / FAIL / INCONCLUSIVE / UNSUPPORTED /
 * DEGRADED / PARTIAL (same contract as the rest of td_*).
 */

import type { IntelligenceResult } from '../mcp/intelligence-handler';
import { AgentStore, diffWorkflows, safeName, validateWorkflow } from './store';
import { WorkflowExecutor, ToolPipeline } from './executor';
import { BrowserFacade } from './facade';
import {
  AgentArtifactKind,
  AgentWorkflow,
  LearnedTarget,
} from './domain';

export interface WorkflowToolDeps {
  /** Root MCP pipeline (any tool: td_*, dt_*, fx_, base live tools). */
  pipeline: ToolPipeline | null;
  store: AgentStore;
}

// ── Tool name registry ────────────────────────────────────────────────────

export const BROWSER_PRIMITIVE_TOOLS = [
  'td_browser_navigate', 'td_browser_back', 'td_browser_forward', 'td_browser_refresh',
  'td_dom_inspect', 'td_dom_query', 'td_dom_extract', 'td_dom_snapshot',
  'td_target_find', 'td_target_check', 'td_target_describe',
  'td_action_click', 'td_action_type', 'td_action_select', 'td_action_hover', 'td_action_press', 'td_action_scroll',
  'td_wait', 'td_screenshot', 'td_execute_script', 'td_network_inspect', 'td_console_read',
] as const;

export const WORKFLOW_TOOLS = [
  'td_workflow_save', 'td_workflow_get', 'td_workflow_list', 'td_workflow_update', 'td_workflow_delete',
  'td_workflow_clone', 'td_workflow_diff', 'td_workflow_export', 'td_workflow_import',
  'td_workflow_validate', 'td_workflow_run', 'td_workflow_runs', 'td_workflow_run_get', 'td_workflow_replay',
] as const;

export const AGENT_OWNED_TOOLS = [
  'td_target_memory_save', 'td_target_memory_get', 'td_target_memory_list', 'td_target_memory_delete',
  'td_agent_artifact_save', 'td_agent_artifact_get', 'td_agent_artifact_list', 'td_agent_artifact_delete',
] as const;

export const WORKFLOW_TOOL_NAMES: Set<string> = new Set<string>([
  ...BROWSER_PRIMITIVE_TOOLS,
  ...WORKFLOW_TOOLS,
  ...AGENT_OWNED_TOOLS,
]);

const ARTIFACT_KINDS: AgentArtifactKind[] = ['custom-tool', 'script', 'policy', 'memory', 'note'];

// ── Dispatch entry ────────────────────────────────────────────────────────

const runDepth = { count: 0 };

export async function handleWorkflowTool(
  name: string,
  args: Record<string, any>,
  deps: WorkflowToolDeps,
): Promise<IntelligenceResult> {
  if (BROWSER_PRIMITIVE_TOOLS.includes(name as any)) {
    return handleBrowserPrimitive(name, args, deps);
  }
  if (WORKFLOW_TOOLS.includes(name as any)) {
    return handleWorkflowToolCall(name, args, deps);
  }
  return handleAgentOwnedTool(name, args, deps);
}

// ── 1. Browser primitives (thin facade) ──────────────────────────────────

async function handleBrowserPrimitive(name: string, args: Record<string, any>, deps: WorkflowToolDeps): Promise<IntelligenceResult> {
  if (!deps.pipeline) {
    return { status: 'UNSUPPORTED', note: 'browser primitives require the root MCP pipeline (live bridge or JSDOM fixture)' };
  }
  const facade = new BrowserFacade(deps.pipeline);
  try {
    switch (name) {
      case 'td_browser_navigate': {
        if (typeof args.url !== 'string') return { status: 'INCONCLUSIVE', error: 'url (string) is required' };
        const r = await facade.navigate(args.url, { newTab: args.newTab === true, waitForStable: args.waitForStable !== false });
        return { status: 'PASS', action: 'navigate', url: args.url, routedTo: r.routedTo, result: r.payload };
      }
      case 'td_browser_back': {
        const r = await facade.back();
        return { status: 'PASS', action: 'back', result: r.payload };
      }
      case 'td_browser_forward': {
        const r = await facade.forward();
        return { status: 'PASS', action: 'forward', result: r.payload };
      }
      case 'td_browser_refresh': {
        const r = await facade.refresh();
        return { status: 'PASS', action: 'refresh', result: r.payload };
      }
      case 'td_dom_inspect': {
        const r = await facade.inspect(args.tabId !== undefined ? { tabId: args.tabId } : undefined);
        return { status: 'PASS', result: r.payload };
      }
      case 'td_dom_query': {
        if (typeof args.query !== 'string') return { status: 'INCONCLUSIVE', error: 'query (string) is required' };
        const r = await facade.query({ query: args.query, tag: args.tag, attr: args.attr, attrValue: args.attrValue, limit: args.limit });
        return { status: 'PASS', result: r.payload };
      }
      case 'td_dom_extract': {
        if (typeof args.selector !== 'string') return { status: 'INCONCLUSIVE', error: 'selector (string) is required' };
        const r = await facade.extract({ selector: args.selector, fields: args.fields, limit: args.limit });
        return { status: 'PASS', selector: args.selector, result: r.payload };
      }
      case 'td_dom_snapshot': {
        const r = await facade.snapshot(args.format === 'json' ? 'json' : 'html');
        return { status: 'PASS', format: args.format ?? 'html', result: bounded(r.payload, 4096) };
      }
      case 'td_target_find': {
        const spec: any = {};
        if (typeof args.selector === 'string') spec.selector = args.selector;
        else if (typeof args.xpath === 'string') spec.xpath = args.xpath;
        else if (typeof args.text === 'string') spec.text = args.text;
        else return { status: 'INCONCLUSIVE', error: 'one of selector | xpath | text is required' };
        const r = await facade.findTarget(spec);
        return { status: 'PASS', intent: 'find_target', result: bounded(r.payload, 4096) };
      }
      case 'td_target_check': {
        if (typeof args.selector !== 'string') return { status: 'INCONCLUSIVE', error: 'selector (string) is required' };
        const r = await facade.verifyTarget(args.selector, { minConfidence: args.minConfidence });
        const payload = r.payload as any;
        return { status: payload?.resolvable ? 'PASS' : 'INCONCLUSIVE', ...payload };
      }
      case 'td_target_describe': {
        if (typeof args.selector !== 'string') return { status: 'INCONCLUSIVE', error: 'selector (string) is required' };
        const r = await facade.describeTarget(args.selector);
        return { status: 'PASS', selector: args.selector, result: bounded(r.payload, 4096) };
      }
      case 'td_action_click': {
        if (typeof args.selector !== 'string') return { status: 'INCONCLUSIVE', error: 'selector (string) is required' };
        const r = await facade.click(args.selector);
        return { status: 'PASS', action: 'click', selector: args.selector, result: bounded(r.payload, 3072) };
      }
      case 'td_action_type': {
        if (typeof args.selector !== 'string' || typeof args.text !== 'string') return { status: 'INCONCLUSIVE', error: 'selector and text are required' };
        const r = await facade.type(args.selector, args.text);
        return { status: 'PASS', action: 'type', selector: args.selector, result: bounded(r.payload, 3072) };
      }
      case 'td_action_select': {
        if (typeof args.selector !== 'string' || typeof args.value !== 'string') return { status: 'INCONCLUSIVE', error: 'selector and value are required' };
        const r = await facade.select(args.selector, args.value);
        return { status: 'PASS', action: 'select', selector: args.selector, result: bounded(r.payload, 3072) };
      }
      case 'td_action_hover': {
        if (typeof args.selector !== 'string') return { status: 'INCONCLUSIVE', error: 'selector (string) is required' };
        const r = await facade.hover(args.selector);
        return { status: 'PASS', action: 'hover', selector: args.selector, result: bounded(r.payload, 3072) };
      }
      case 'td_action_press': {
        if (typeof args.key !== 'string') return { status: 'INCONCLUSIVE', error: 'key (string) is required' };
        const r = await facade.press(args.key);
        return { status: 'PASS', action: 'press', key: args.key, result: bounded(r.payload, 3072) };
      }
      case 'td_action_scroll': {
        const r = 'selector' in args && typeof args.selector === 'string'
          ? await facade.scroll({ selector: args.selector })
          : await facade.scroll({ x: args.x ?? 0, y: args.y ?? 0 });
        return { status: 'PASS', action: 'scroll', result: bounded(r.payload, 3072) };
      }
      case 'td_wait': {
        if (typeof args.kind !== 'string') return { status: 'INCONCLUSIVE', error: 'kind is required (dom_stable, selector_present, …)' };
        const r = await facade.wait({
          kind: args.kind,
          selector: args.selector,
          text: args.text,
          count: args.count,
          timeoutMs: args.timeoutMs,
        } as any);
        const payload = r.payload as any;
        return { status: payload?.satisfied === false ? 'INCONCLUSIVE' : 'PASS', ...boundedObj(payload, 2048) };
      }
      case 'td_screenshot': {
        const r = await facade.screenshot();
        return { status: 'PASS', artifact: 'screenshot', result: bounded(r.payload, 2048) };
      }
      case 'td_execute_script': {
        if (typeof args.code !== 'string') return { status: 'INCONCLUSIVE', error: 'code (string) is required' };
        const r = await facade.executeScript(args.code, args.timeoutMs);
        const payload = r.payload as any;
        const ok = payload?.outcome === 'EXECUTED_SUCCESSFULLY' || payload?.status === 'PASS' || payload?.success === true;
        return { status: ok || payload?.outcome === undefined ? 'PASS' : 'DEGRADED', result: bounded(payload, 4096) };
      }
      case 'td_network_inspect': {
        const r = await facade.networkInspect({ urlContains: args.urlContains, limit: args.limit });
        return { status: 'PASS', result: bounded(r.payload, 4096) };
      }
      case 'td_console_read': {
        const r = await facade.consoleRead(args.level);
        return { status: 'PASS', result: bounded(r.payload, 4096) };
      }
    }
  } catch (err: any) {
    return { status: 'FAIL', error: String(err?.message ?? err) };
  }
  return { status: 'UNSUPPORTED', note: `unknown browser primitive ${name}` };
}

// ── 2. Workflow persistence + dumb execution ─────────────────────────────

async function handleWorkflowToolCall(name: string, args: Record<string, any>, deps: WorkflowToolDeps): Promise<IntelligenceResult> {
  const store = deps.store;
  try {
    switch (name) {
      // ── CRUD (envelope validation only — semantics belong to the agent) ──
      case 'td_workflow_save': {
        const validation = validateWorkflow(args.workflow);
        if (!validation.valid) return { status: 'INCONCLUSIVE', error: 'workflow envelope invalid', issues: validation.issues };
        const wf = args.workflow as AgentWorkflow;
        const envelope = store.saveWorkflow(wf);
        return {
          status: 'PASS',
          saved: { name: envelope.current.name, version: envelope.current.version, steps: envelope.current.steps.length, versions: envelope.versions.length },
          note: 'stored verbatim — TeleDOM does not interpret workflow semantics',
        };
      }
      case 'td_workflow_get': {
        if (typeof args.name !== 'string') return { status: 'INCONCLUSIVE', error: 'name (string) is required' };
        const wf = store.getWorkflow(args.name, args.version);
        if (!wf) return { status: 'INCONCLUSIVE', error: `workflow "${args.name}"${args.version ? `@${args.version}` : ''} not found`, available: store.listWorkflows().map((w) => w.name).slice(0, 30) };
        return { status: 'PASS', workflow: wf };
      }
      case 'td_workflow_list': {
        const list = store.listWorkflows();
        return { status: 'PASS', count: list.length, workflows: list };
      }
      case 'td_workflow_update': {
        const validation = validateWorkflow(args.workflow);
        if (!validation.valid) return { status: 'INCONCLUSIVE', error: 'workflow envelope invalid', issues: validation.issues };
        const wf = args.workflow as AgentWorkflow;
        if (!store.getWorkflow(wf.name)) return { status: 'INCONCLUSIVE', error: `workflow "${wf.name}" not found — use td_workflow_save to create` };
        const envelope = store.saveWorkflow(wf);
        return { status: 'PASS', updated: { name: envelope.current.name, version: envelope.current.version, versions: envelope.versions.length } };
      }
      case 'td_workflow_delete': {
        if (typeof args.name !== 'string') return { status: 'INCONCLUSIVE', error: 'name (string) is required' };
        const deleted = store.deleteWorkflow(args.name);
        return { status: deleted ? 'PASS' : 'INCONCLUSIVE', deleted: args.name, note: deleted ? 'workflow + version history removed (runs are kept as evidence)' : 'not found' };
      }
      case 'td_workflow_clone': {
        if (typeof args.name !== 'string') return { status: 'INCONCLUSIVE', error: 'name (string) is required' };
        const source = store.getWorkflow(args.name, args.version);
        if (!source) return { status: 'INCONCLUSIVE', error: `workflow "${args.name}" not found` };
        const targetName = safeName(args.as ?? `${source.name}_copy`);
        if (!targetName) return { status: 'INCONCLUSIVE', error: 'invalid clone name (as)' };
        const clone: AgentWorkflow = {
          ...source,
          name: targetName,
          id: `${targetName}-${Date.now()}`,
          version: args.newVersion ?? source.version,
          description: args.description ?? `cloned from ${source.name}@${source.version}`,
          metadata: { ...(source.metadata ?? {}), clonedFrom: `${source.name}@${source.version}` },
        };
        const envelope = store.saveWorkflow(clone);
        return { status: 'PASS', cloned: { from: `${source.name}@${source.version}`, to: `${envelope.current.name}@${envelope.current.version}` } };
      }
      case 'td_workflow_diff': {
        const a = store.getWorkflow(args.a ?? args.name, args.aVersion);
        const b = store.getWorkflow(args.b ?? args.name, args.bVersion);
        if (!a || !b) return { status: 'INCONCLUSIVE', error: 'both workflows (a/b with versions) must exist' };
        const diff = diffWorkflows(a, b);
        return { status: 'PASS', a: `${a.name}@${a.version}`, b: `${b.name}@${b.version}`, ...diff };
      }
      case 'td_workflow_export': {
        const envelope = store.getWorkflowEnvelope(args.name ?? '');
        if (!envelope) return { status: 'INCONCLUSIVE', error: `workflow "${args.name}" not found` };
        const exportPayload = {
          format: 'teledom.agent-workflow.export/1.0',
          exportedAt: new Date().toISOString(),
          name: envelope.current.name,
          current: envelope.current,
          versions: envelope.versions,
        };
        return { status: 'PASS', name: envelope.current.name, versions: envelope.versions.length, export: exportPayload };
      }
      case 'td_workflow_import': {
        const payload = args.export ?? args.workflow;
        if (!payload || typeof payload !== 'object') return { status: 'INCONCLUSIVE', error: 'export (object from td_workflow_export) is required' };
        const candidate = (payload as any).current ?? payload;
        const validation = validateWorkflow(candidate);
        if (!validation.valid) return { status: 'INCONCLUSIVE', error: 'imported workflow envelope invalid', issues: validation.issues };
        const wf = candidate as AgentWorkflow;
        const envelope = store.saveWorkflow(wf);
        if (args.includeVersions && Array.isArray((payload as any).versions)) {
          for (const v of (payload as any).versions) {
            if (v?.workflow && v.version !== envelope.current.version) store.saveWorkflow(v.workflow as AgentWorkflow);
          }
        }
        return { status: 'PASS', imported: { name: envelope.current.name, version: envelope.current.version, versions: envelope.versions.length } };
      }
      case 'td_workflow_validate': {
        const validation = validateWorkflow(args.workflow);
        return {
          status: validation.valid ? 'PASS' : 'INCONCLUSIVE',
          valid: validation.valid,
          issues: validation.issues,
          stepCount: Array.isArray((args.workflow as any)?.steps) ? (args.workflow as any).steps.length : 0,
          note: 'structural envelope validation only — semantics are the agent\u2019s responsibility',
        };
      }

      // ── Dumb execution + records ──
      case 'td_workflow_run': {
        if (!deps.pipeline) return { status: 'UNSUPPORTED', note: 'workflow execution requires the root MCP pipeline' };
        if (runDepth.count >= 2) return { status: 'FAIL', error: 'nested workflow execution too deep (max 2 levels)' };
        let wf: AgentWorkflow | null = null;
        if (args.workflow && typeof args.workflow === 'object') {
          const validation = validateWorkflow(args.workflow);
          if (!validation.valid) return { status: 'INCONCLUSIVE', error: 'workflow envelope invalid', issues: validation.issues };
          wf = args.workflow as AgentWorkflow;
        } else if (typeof args.name === 'string') {
          wf = store.getWorkflow(args.name, args.version);
          if (!wf) return { status: 'INCONCLUSIVE', error: `workflow "${args.name}" not found`, available: store.listWorkflows().map((w) => w.name).slice(0, 30) };
        } else {
          return { status: 'INCONCLUSIVE', error: 'provide name (saved workflow) or workflow (inline object)' };
        }
        if (wf.steps.length === 0) return { status: 'INCONCLUSIVE', error: 'workflow has no steps — nothing to execute' };
        const executor = new WorkflowExecutor(deps.pipeline);
        runDepth.count += 1;
        try {
          const run = await executor.execute({
            workflow: wf,
            inputs: (args.inputs ?? {}) as Record<string, unknown>,
            approvedSteps: args.approvedSteps,
            dryRun: args.dryRun === true,
          });
          store.saveRun(run);
          return { status: run.status === 'SUCCESS' ? 'PASS' : run.status === 'BLOCKED' ? 'DEGRADED' : run.status === 'PARTIAL' ? 'PARTIAL' : 'FAIL', runId: run.id, workflow: `${run.workflowName}@${run.workflowVersion}`, run: boundedRun(run) };
        } finally {
          runDepth.count -= 1;
        }
      }
      case 'td_workflow_runs': {
        const list = store.listRuns({ workflowName: args.name, limit: args.limit ?? 50 });
        return { status: 'PASS', count: list.length, runs: list };
      }
      case 'td_workflow_run_get': {
        if (typeof args.runId !== 'string') return { status: 'INCONCLUSIVE', error: 'runId (string) is required' };
        const run = store.getRun(args.runId);
        if (!run) return { status: 'INCONCLUSIVE', error: `run "${args.runId}" not found` };
        return { status: 'PASS', run };
      }
      case 'td_workflow_replay': {
        if (!deps.pipeline) return { status: 'UNSUPPORTED', note: 'workflow replay requires the root MCP pipeline' };
        if (typeof args.runId !== 'string') return { status: 'INCONCLUSIVE', error: 'runId (string) is required' };
        const source = store.getRun(args.runId);
        if (!source) return { status: 'INCONCLUSIVE', error: `run "${args.runId}" not found` };
        if (runDepth.count >= 2) return { status: 'FAIL', error: 'nested workflow execution too deep (max 2 levels)' };
        const executor = new WorkflowExecutor(deps.pipeline);
        runDepth.count += 1;
        try {
          const replay = await executor.replaySteps(
            { workflowId: source.workflowId, workflowName: source.workflowName, workflowVersion: source.workflowVersion },
            source.steps,
            source.id,
          );
          store.saveRun(replay);
          return { status: replay.status === 'SUCCESS' ? 'PASS' : replay.status === 'PARTIAL' ? 'PARTIAL' : 'FAIL', replayedFrom: source.id, runId: replay.id, run: boundedRun(replay) };
        } finally {
          runDepth.count -= 1;
        }
      }
    }
  } catch (err: any) {
    return { status: 'FAIL', error: String(err?.message ?? err) };
  }
  return { status: 'UNSUPPORTED', note: `unknown workflow tool ${name}` };
}

// ── 3. Agent-owned tooling (target memory + artifacts) ──────────────────

async function handleAgentOwnedTool(name: string, args: Record<string, any>, deps: WorkflowToolDeps): Promise<IntelligenceResult> {
  const store = deps.store;
  try {
    switch (name) {
      // ── Learned targets: "DOM rescans not required every run" ──
      case 'td_target_memory_save': {
        if (typeof args.site !== 'string' || typeof args.semanticId !== 'string') {
          return { status: 'INCONCLUSIVE', error: 'site and semanticId are required' };
        }
        const existing = store.getTarget(args.site, args.semanticId);
        const target = store.saveTarget({
          site: args.site,
          semanticId: args.semanticId,
          identity: {
            role: args.identity?.role,
            accessibleName: args.identity?.accessibleName,
            component: args.identity?.component,
            route: args.identity?.route,
            text: args.identity?.text,
          },
          locators: {
            aria: args.locators?.aria,
            role: args.locators?.role,
            text: args.locators?.text,
            css: args.locators?.css,
            xpath: args.locators?.xpath,
            geometry: args.locators?.geometry,
          },
          history: {
            successfulSelectors: args.locators?.css ? [args.locators.css] : [],
            failedSelectors: args.failedSelector ? [args.failedSelector] : [],
            resolvedCount: existing?.history.resolvedCount ?? 0,
            lastResolvedAt: existing?.history.lastResolvedAt,
          },
          confidence: {
            current: typeof args.confidence === 'number' ? args.confidence : 0.8,
            historical: existing?.confidence.historical ?? typeof args.confidence === 'number' ? args.confidence : 0.8,
          },
          notes: args.notes,
        } as Omit<LearnedTarget, 'createdAt' | 'updatedAt'>);
        return { status: 'PASS', saved: { id: target.id, site: target.site, semanticId: target.semanticId, confidence: target.confidence.current }, note: 'target memory stored — resolve against it before re-analyzing the DOM' };
      }
      case 'td_target_memory_get': {
        if (typeof args.site !== 'string' || typeof args.semanticId !== 'string') {
          return { status: 'INCONCLUSIVE', error: 'site and semanticId are required' };
        }
        const target = store.getTarget(args.site, args.semanticId);
        if (!target) return { status: 'INCONCLUSIVE', error: `no learned target for site="${args.site}" semanticId="${args.semanticId}"` };
        return { status: 'PASS', target };
      }
      case 'td_target_memory_list': {
        const list = store.listTargets({ site: args.site, semanticId: args.semanticId });
        return { status: 'PASS', count: list.length, targets: list };
      }
      case 'td_target_memory_delete': {
        if (typeof args.site !== 'string' || typeof args.semanticId !== 'string') {
          return { status: 'INCONCLUSIVE', error: 'site and semanticId are required' };
        }
        const deleted = store.deleteTarget(args.site, args.semanticId);
        return { status: deleted ? 'PASS' : 'INCONCLUSIVE', deleted: deleted ? `${args.site}__${args.semanticId}` : null };
      }

      // ── Generic agent artifacts (custom tools / scripts / policies…) ──
      case 'td_agent_artifact_save': {
        const kind = args.kind as AgentArtifactKind;
        if (!ARTIFACT_KINDS.includes(kind)) return { status: 'INCONCLUSIVE', error: `kind must be one of ${ARTIFACT_KINDS.join(', ')}` };
        if (typeof args.name !== 'string' || args.content === undefined) return { status: 'INCONCLUSIVE', error: 'name and content are required' };
        const artifact = store.saveArtifact(kind, args.name, args.content, { description: args.description, tags: args.tags });
        return { status: 'PASS', saved: { id: artifact.id, kind: artifact.kind, name: artifact.name }, note: 'stored verbatim — TeleDOM never interprets agent tooling' };
      }
      case 'td_agent_artifact_get': {
        const kind = args.kind as AgentArtifactKind;
        if (!ARTIFACT_KINDS.includes(kind)) return { status: 'INCONCLUSIVE', error: `kind must be one of ${ARTIFACT_KINDS.join(', ')}` };
        if (typeof args.name !== 'string') return { status: 'INCONCLUSIVE', error: 'name (string) is required' };
        const artifact = store.getArtifact(kind, args.name);
        if (!artifact) return { status: 'INCONCLUSIVE', error: `artifact ${kind}/${args.name} not found` };
        return { status: 'PASS', artifact };
      }
      case 'td_agent_artifact_list': {
        const kind = args.kind as AgentArtifactKind | undefined;
        if (kind && !ARTIFACT_KINDS.includes(kind)) return { status: 'INCONCLUSIVE', error: `kind must be one of ${ARTIFACT_KINDS.join(', ')}` };
        const list = store.listArtifacts(kind, args.tag);
        return { status: 'PASS', count: list.length, artifacts: list };
      }
      case 'td_agent_artifact_delete': {
        const kind = args.kind as AgentArtifactKind;
        if (!ARTIFACT_KINDS.includes(kind)) return { status: 'INCONCLUSIVE', error: `kind must be one of ${ARTIFACT_KINDS.join(', ')}` };
        if (typeof args.name !== 'string') return { status: 'INCONCLUSIVE', error: 'name (string) is required' };
        const deleted = store.deleteArtifact(kind, args.name);
        return { status: deleted ? 'PASS' : 'INCONCLUSIVE', deleted: deleted ? `${kind}/${args.name}` : null };
      }
    }
  } catch (err: any) {
    return { status: 'FAIL', error: String(err?.message ?? err) };
  }
  return { status: 'UNSUPPORTED', note: `unknown agent-owned tool ${name}` };
}

// ── bounded payloads (keep MCP responses + run records small) ────────────

function bounded(value: unknown, budget: number): unknown {
  try {
    const json = JSON.stringify(value);
    if (json.length <= budget) return value;
    return { truncated: true, preview: json.slice(0, budget), bytes: json.length };
  } catch {
    return { unserializable: true };
  }
}

function boundedObj(value: Record<string, unknown>, budget: number): Record<string, unknown> {
  const b = bounded(value, budget);
  return typeof b === 'object' && b !== null ? (b as Record<string, unknown>) : { truncated: true };
}

function boundedRun(run: any): unknown {
  return {
    id: run.id,
    workflowId: run.workflowId,
    workflowName: run.workflowName,
    workflowVersion: run.workflowVersion,
    status: run.status,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    inputs: run.inputs,
    steps: run.steps?.map((s: any) => ({ stepId: s.stepId, tool: s.tool, status: s.status, attempts: s.attempts, durationMs: s.durationMs, error: s.error })),
    metrics: run.metrics,
    error: run.error,
    pendingApprovals: run.pendingApprovals,
    replayOf: run.replayOf,
    plan: run.plan,
  };
}
