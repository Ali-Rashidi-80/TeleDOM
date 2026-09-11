/**
 * TeleDOM v4.1 — Agent-Owned Workflow Domain.
 *
 * ARCHITECTURAL CONTRACT (red line):
 *   TeleDOM is the enabler — hands, eyes, memory and toolbox of the browser.
 *   The AGENT is the brain. TeleDOM NEVER designs, optimizes, repairs or
 *   "understands" workflows. It stores them, retrieves them, executes the
 *   primitives they request and records deterministically what happened.
 *
 * Everything the agent authors (workflows, custom tools, scripts, policies,
 * learned targets, memories) is an AGENT artifact. TeleDOM persists it
 * verbatim, validates only the structural envelope, and never interprets
 * the agent's intent.
 *
 * ── The agent-owned model this formalizes ──
 *   Agent
 *    ├── Workflows        (kind: workflow)
 *    ├── Custom Tools     (kind: custom-tool)
 *    ├── Scripts          (kind: script)
 *    ├── Policies         (kind: policy)
 *    ├── Learned Targets  (kind: target)
 *    └── Memories         (kind: memory)
 *   TeleDOM: Browser Runtime
 */

// ─────────────────────────────────────────────────────────────────────────
// Workflow envelope (structural validation only — semantics belong to agent)
// ─────────────────────────────────────────────────────────────────────────

export const WORKFLOW_SCHEMA = 'teledom.agent-workflow/1.0';

/** A single step the agent authored. Dumb, deterministic execution. */
export interface WorkflowStep {
  /** Agent-chosen unique step id within the workflow. */
  id: string;
  /** ANY TeleDOM MCP tool name (td_*, dt_*, fx_ or base live tools). */
  tool: string;
  /** Step arguments; string values may embed {{templates}}. */
  args?: Record<string, unknown>;
  /** What to do when the step fails. Default: abort. */
  onError?: 'abort' | 'continue' | 'skip';
  /** Dumb retry (bounded count, optional delay). Default 0. */
  retry?: { count: number; delayMs?: number };
  /** Human-in-the-loop gate: step BLOCKS until agent-side approval. */
  requireApproval?: boolean;
  /** Per-step timeout (ms). Default: policy.maxStepMs or 60000. */
  timeoutMs?: number;
  /** Agent's own human description — stored verbatim, never interpreted. */
  description?: string;
}

/** Configurable execution authority — capability ≠ authorization. */
export interface ExecutionPolicy {
  /** Glob-ish tool patterns allowed (e.g. ['td_*', 'inspect_*']). */
  allowedTools?: string[];
  /** Glob-ish tool patterns denied. Denied wins over allowed. */
  deniedTools?: string[];
  /** Hard step cap. Default 200. */
  maxSteps?: number;
  /** Hard wall-clock cap (ms). Default 300000. */
  maxRuntimeMs?: number;
  /** Per-step cap (ms). Default 60000. */
  maxStepMs?: number;
  /** Tool patterns requiring approval before execution (human-in-the-loop). */
  requireApprovalFor?: string[];
  /** Navigation domain allowlist (applies to steps with a url arg). */
  allowedDomains?: string[];
  /** Navigation domain denylist. Denied wins. */
  deniedDomains?: string[];
}

/** The agent-authored workflow artifact. TeleDOM stores it verbatim. */
export interface AgentWorkflow {
  schema: string;
  id: string;
  name: string;
  version: string;
  description?: string;
  tags?: string[];
  /** Declared inputs: name → { description, required, default }. */
  inputs?: Record<string, { description?: string; required?: boolean; default?: unknown }>;
  steps: WorkflowStep[];
  policy?: ExecutionPolicy;
  /** Verbatim agent metadata (site, author, notes, KPIs…). Never interpreted. */
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Deterministic Execution Record
// ─────────────────────────────────────────────────────────────────────────

export type StepRunStatus = 'PASS' | 'FAIL' | 'SKIPPED' | 'BLOCKED';

export interface StepRun {
  stepId: string;
  tool: string;
  /** Arguments AS EXECUTED (templates already resolved). */
  args: Record<string, unknown>;
  status: StepRunStatus;
  attempts: number;
  startedAt: number;
  durationMs: number;
  /** Summarized (bounded) tool result payload. */
  result?: unknown;
  error?: string;
}

export type WorkflowRunStatus =
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'PARTIAL'
  | 'BLOCKED'
  | 'ABORTED';

export interface WorkflowRun {
  id: string;
  workflowId: string;
  workflowName: string;
  workflowVersion: string;
  status: WorkflowRunStatus;
  startedAt: number;
  finishedAt?: number;
  /** Inputs as provided (defaults merged, templates NOT resolved here). */
  inputs: Record<string, unknown>;
  steps: StepRun[];
  metrics: {
    stepsPlanned: number;
    stepsExecuted: number;
    toolCalls: number;
    domScans: number;
    retries: number;
    durationMs: number;
    tokensSavedEstimate: number;
  };
  error?: string;
  /** Steps waiting for agent-side approval when BLOCKED. */
  pendingApprovals?: { stepId: string; tool: string }[];
  /** When this run re-executed a previous run's recorded steps. */
  replayOf?: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Learned targets (Target Memory) — "DOM rescans not required every run"
// ─────────────────────────────────────────────────────────────────────────

export interface LearnedTarget {
  id: string;
  /** Site scope the agent chose (origin, or '*'). */
  site: string;
  /** Agent's semantic identifier, e.g. comments_tab / compose_button. */
  semanticId: string;
  identity: {
    role?: string;
    accessibleName?: string;
    component?: string;
    route?: string;
    text?: string;
  };
  locators: {
    aria?: string;
    role?: string;
    text?: string;
    css?: string;
    xpath?: string;
    geometry?: { x?: number; y?: number; width?: number; height?: number };
  };
  history: {
    successfulSelectors: string[];
    failedSelectors: string[];
    resolvedCount: number;
    lastResolvedAt?: number;
  };
  confidence: { current: number; historical: number };
  /** Verbatim agent notes — how to re-verify, when to repair. */
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Generic agent artifacts (custom tools, scripts, policies, memories…)
// ─────────────────────────────────────────────────────────────────────────

export type AgentArtifactKind =
  | 'custom-tool'
  | 'script'
  | 'policy'
  | 'memory'
  | 'note';

export interface AgentArtifact {
  id: string;
  kind: AgentArtifactKind;
  name: string;
  /** The agent's own payload — stored verbatim, never interpreted. */
  content: unknown;
  description?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Store envelope types + validation results
// ─────────────────────────────────────────────────────────────────────────

export interface WorkflowEnvelope {
  current: AgentWorkflow;
  versions: { version: string; savedAt: string; workflow: AgentWorkflow }[];
}

export interface WorkflowValidationIssue {
  path: string;
  message: string;
}

export interface WorkflowValidation {
  valid: boolean;
  issues: WorkflowValidationIssue[];
}
