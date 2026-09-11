/**
 * TeleDOM v4 Resilience — Self-Healing Runtime + Resource Guardian.
 *
 * The browser is an unreliable dependency. Explicit runtime state machine:
 * CONNECTED → DEGRADED → DISCONNECTED → RECOVERING → REATTACHED →
 * RECONCILED. Recovery preserves incidents, identity, evidence,
 * checkpoints, temporal continuity, tab mapping, pending workflows.
 * Bounded retries — never infinite loops. Resource Guardian enforces
 * budgets with adaptive modes: HEALTHY/FULL_FIDELITY, PRESSURED/COMPACT,
 * CRITICAL/SAMPLING, EMERGENCY/PRESERVE.
 */

export type RuntimeState =
  | 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED' | 'RECOVERING'
  | 'REATTACHED' | 'RECONCILED';

export type FailureKind =
  | 'renderer-crash' | 'browser-crash' | 'tab-closed' | 'bridge-disconnect'
  | 'extension-reload' | 'page-navigation' | 'stale-target' | 'storage-interruption'
  | 'artifact-corruption' | 'memory-pressure';

export interface RecoveryAttempt {
  at: number;
  failure: FailureKind;
  attempt: number;
  outcome: 'RECOVERED' | 'PARTIAL' | 'FAILED';
  preserved: string[];
  lost: string[];
  reason: string;
}

export interface RecoverySnapshot {
  activeIncidentIds: string[];
  entityCount: number;
  evidenceCount: number;
  checkpointCount: number;
  headSequence: number;
  tabMapping: Record<string, string>;
}

export class SelfHealingRuntime {
  private state: RuntimeState = 'DISCONNECTED';
  private attempts: RecoveryAttempt[] = [];
  private maxAttemptsPerFailure = 3;
  private backoffBaseMs = 50;
  private snapshot: RecoverySnapshot | null = null;
  private stateHistory: { at: number; from: RuntimeState | 'INIT'; to: RuntimeState }[] = [];

  constructor(private captureSnapshot: () => RecoverySnapshot) {}

  markConnected(): void {
    this.record('CONNECTED');
  }

  markDegraded(reason: string): void {
    if (this.state === 'CONNECTED') {
      this.record('DEGRADED');
      this.lastReason = reason;
    }
  }
  private lastReason = '';

  get currentState(): RuntimeState {
    return this.state;
  }

  get degradationReason(): string {
    return this.lastReason;
  }

  /**
   * Handle a failure with a bounded, reason-aware recovery policy.
   * Preserves the snapshot (evidence/identity/checkpoints) BEFORE any
   * recovery attempt. Returns the recovery outcome — never loops forever.
   */
  async handleFailure(failure: FailureKind, tryRecover: (failure: FailureKind, attempt: number, snapshot: RecoverySnapshot) => Promise<{ recovered: boolean; partial?: string[]; reason: string }>): Promise<RecoveryAttempt> {
    // Preserve state first — evidence safety over everything.
    this.snapshot = this.captureSnapshot();
    if (this.state === 'CONNECTED') this.record('DEGRADED');
    this.record('DISCONNECTED');
    this.record('RECOVERING');

    let lastOutcome: RecoveryAttempt = {
      at: Date.now(), failure, attempt: 0, outcome: 'FAILED',
      preserved: recoveryPreserved(this.snapshot), lost: [], reason: 'no attempts made',
    };
    for (let attempt = 1; attempt <= this.maxAttemptsPerFailure; attempt++) {
      await delay(this.backoffBaseMs * Math.pow(2, attempt - 1));
      const result = await tryRecover(failure, attempt, this.snapshot);
      if (result.recovered) {
        this.record('REATTACHED');
        const attemptRecord: RecoveryAttempt = {
          at: Date.now(), failure, attempt,
          outcome: result.partial?.length ? 'PARTIAL' : 'RECOVERED',
          preserved: recoveryPreserved(this.snapshot),
          lost: result.partial ?? [],
          reason: result.reason,
        };
        this.attempts.push(attemptRecord);
        this.record('RECONCILED');
        return attemptRecord;
      }
      lastOutcome = {
        at: Date.now(), failure, attempt, outcome: 'FAILED',
        preserved: recoveryPreserved(this.snapshot),
        lost: ['live-connection'],
        reason: result.reason,
      };
      this.attempts.push(lastOutcome);
    }
    return lastOutcome;
  }

  private record(to: RuntimeState): void {
    this.stateHistory.push({ at: Date.now(), from: this.stateHistory.length ? this.state : 'INIT', to });
    this.state = to;
  }

  get recoveryLog(): readonly RecoveryAttempt[] {
    return this.attempts;
  }

  get stateTransitions(): readonly { at: number; from: string; to: RuntimeState }[] {
    return this.stateHistory;
  }
}

function recoveryPreserved(snapshot: RecoverySnapshot | null): string[] {
  if (!snapshot) return [];
  return [
    `incidents(${snapshot.activeIncidentIds.length})`,
    `entities(${snapshot.entityCount})`,
    `evidence(${snapshot.evidenceCount})`,
    `checkpoints(${snapshot.checkpointCount})`,
    `temporal-head(${snapshot.headSequence})`,
    `tab-mapping(${Object.keys(snapshot.tabMapping).length})`,
  ];
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Resource Guardian
// ---------------------------------------------------------------------------

export type ResourceMode = 'HEALTHY' | 'PRESSURED' | 'CRITICAL' | 'EMERGENCY';

export interface ResourceBudgets {
  maxEvents: number;
  maxBytes: number;
  maxMemoryMB: number;
  maxFrameDepth: number;
  maxReconstructionMs: number;
  maxGraphNodes: number;
  maxNetworkCapture: number;
  maxScreenshotArea: number;
  maxConcurrentAnalyzers: number;
}

export const DEFAULT_BUDGETS: ResourceBudgets = {
  maxEvents: 10_000_000,
  maxBytes: 2 * 1024 * 1024 * 1024,
  maxMemoryMB: 1024,
  maxFrameDepth: 8,
  maxReconstructionMs: 250,
  maxGraphNodes: 250_000,
  maxNetworkCapture: 200_000,
  maxScreenshotArea: 4096 * 4096,
  maxConcurrentAnalyzers: 8,
};

export interface ResourceUsage {
  events: number;
  bytes: number;
  memoryMB: number;
  graphNodes: number;
  networkCaptured: number;
  queueDepth: number;
  concurrentAnalyzers: number;
}

export interface GuardianDecision {
  mode: ResourceMode;
  capturePolicy: 'FULL_FIDELITY' | 'COMPACT' | 'SAMPLING' | 'PAUSE_OPTIONAL' | 'PRESERVE_EVIDENCE';
  actions: string[];
  degraded: boolean;
}

/**
 * TeleDOM itself must never become the resource problem. The guardian
 * computes the current mode from usage vs budgets and prescribes a
 * graceful degradation policy — never a crash.
 */
export class ResourceGuardian {
  private usage: ResourceUsage = {
    events: 0, bytes: 0, memoryMB: 0, graphNodes: 0, networkCaptured: 0, queueDepth: 0, concurrentAnalyzers: 0,
  };

  constructor(private budgets: ResourceBudgets = { ...DEFAULT_BUDGETS }) {}

  report(usage: Partial<ResourceUsage>): void {
    this.usage = { ...this.usage, ...usage };
  }

  reportEvent(): void {
    this.usage.events += 1;
  }

  current(): ResourceUsage {
    return { ...this.usage };
  }

  decide(): GuardianDecision {
    const pressure = this.pressure();
    if (pressure >= 1) {
      return {
        mode: 'EMERGENCY',
        capturePolicy: 'PRESERVE_EVIDENCE',
        actions: ['freeze non-essential capture', 'persist evidence + checkpoints', 'prepare recovery snapshot'],
        degraded: true,
      };
    }
    if (pressure >= 0.85) {
      return {
        mode: 'CRITICAL',
        capturePolicy: 'SAMPLING',
        actions: ['sample optional capture streams', 'drop payload payloads (keep identity)', 'alert td_health_snapshot'],
        degraded: true,
      };
    }
    if (pressure >= 0.65) {
      return {
        mode: 'PRESSURED',
        capturePolicy: 'COMPACT',
        actions: ['switch outputs to compact mode', 'reduce screenshot/network body retention'],
        degraded: true,
      };
    }
    return { mode: 'HEALTHY', capturePolicy: 'FULL_FIDELITY', actions: [], degraded: false };
  }

  /** Max utilization ratio across budgeted resources. */
  private pressure(): number {
    const b = this.budgets;
    const u = this.usage;
    return Math.max(
      u.events / b.maxEvents,
      u.bytes / b.maxBytes,
      u.memoryMB / b.maxMemoryMB,
      u.graphNodes / b.maxGraphNodes,
      u.networkCaptured / b.maxNetworkCapture,
      u.queueDepth / 10_000,
      u.concurrentAnalyzers / Math.max(1, b.maxConcurrentAnalyzers * 2),
    );
  }

  get budgetsSnapshot(): ResourceBudgets {
    return { ...this.budgets };
  }
}
