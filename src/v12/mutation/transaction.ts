/**
 * TeleDOM v12+ Mutation — Safe Mutation Transactions.
 *
 * Every meaningful mutation runs as a transaction:
 * PLAN → SCOPE CHECK → RISK ANALYSIS → PRECONDITIONS → SIMULATION →
 * APPLY → OBSERVE → POSTCONDITIONS → VERIFY → COMMIT (or ROLLBACK
 * unless rollback itself is unsafe). Destructive actions are explicitly
 * classified and gated.
 */

import { computeHash } from '../kernel/integrity';

export type MutationOperation =
  | 'set-attribute' | 'remove-attribute' | 'set-text' | 'set-style'
  | 'remove-node' | 'insert-node' | 'set-value' | 'dispatch-event'
  | 'evaluate-script';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'DESTRUCTIVE';

export interface MutationPlan {
  operation: MutationOperation;
  targetSelector: string;
  payload?: Record<string, unknown>;
  reason: string;
}

export interface MutationScope {
  allowedSelectors: string[];   // selectors the plan may touch
  allowedOrigins: string[];
}

export interface MutationPreconditions {
  checks: { description: string; passes: boolean }[];
}

export interface ObservationSnapshot {
  at: number;
  observedState: Record<string, unknown>;
}

export interface MutationTransaction {
  transactionId: string;
  plan: MutationPlan;
  phase:
  | 'PLANNED' | 'SCOPE_REJECTED' | 'RISK_REJECTED' | 'PRECONDITIONS_FAILED'
  | 'SIMULATED' | 'APPLIED' | 'OBSERVED' | 'VERIFIED' | 'COMMITTED'
  | 'ROLLED_BACK' | 'ROLLBACK_UNSAFE' | 'FAILED';
  risk: RiskLevel;
  riskReasons: string[];
  simulationResult?: { outcomePredicted: string; affectedComponents: string[]; predictedImpact: string };
  before?: ObservationSnapshot;
  after?: ObservationSnapshot;
  verification?: { status: 'PASS' | 'FAIL' | 'INCONCLUSIVE'; details: string[] };
  rollbackAvailable: boolean;
  audit: string[];
}

export interface MutationAdapter {
  /** Apply the mutation to the live/simulated document. */
  apply(plan: MutationPlan): Promise<Record<string, unknown>>;
  /** Observe current relevant state. */
  observe(targetSelector: string): Promise<Record<string, unknown>>;
  /** Restore the previously observed state (best effort). */
  restore(targetSelector: string, before: Record<string, unknown>): Promise<boolean>;
  /** Simulate without committing (dry-run against a model). */
  simulate(plan: MutationPlan): Promise<{ outcomePredicted: string; affectedComponents: string[]; predictedImpact: string }>;
}

const DESTRUCTIVE_OPERATIONS = new Set<MutationOperation>(['remove-node', 'evaluate-script']);
const HIGH_RISK_OPERATIONS = new Set<MutationOperation>(['insert-node', 'dispatch-event']);

export class SafeMutationEngine {
  private history: MutationTransaction[] = [];

  /**
   * Execute the full transactional pipeline. The adapter is the ONLY way
   * mutations touch a document (single choke point for audit + rollback).
   */
  async execute(
    plan: MutationPlan,
    scope: MutationScope,
    adapter: MutationAdapter,
    opts: { verifyPostconditions?: (after: Record<string, unknown>) => { status: 'PASS' | 'FAIL' | 'INCONCLUSIVE'; details: string[] }; allowHighRisk?: boolean; allowDestructive?: boolean } = {},
  ): Promise<MutationTransaction> {
    const tx: MutationTransaction = {
      transactionId: `mtx:${computeHash({ plan, at: Date.now() }).slice(0, 12)}`,
      plan,
      phase: 'PLANNED',
      risk: 'LOW',
      riskReasons: [],
      rollbackAvailable: true,
      audit: [`planned: ${plan.operation} on ${plan.targetSelector} (${plan.reason})`],
    };

    // 1. SCOPE CHECK
    const inScope = this.selectorInScope(plan.targetSelector, scope);
    if (!inScope) {
      tx.phase = 'SCOPE_REJECTED';
      tx.audit.push('scope check FAILED: target selector outside allowed scope');
      this.history.push(tx);
      return tx;
    }
    tx.audit.push('scope check passed');

    // 2. RISK ANALYSIS
    tx.risk = DESTRUCTIVE_OPERATIONS.has(plan.operation)
      ? 'DESTRUCTIVE'
      : HIGH_RISK_OPERATIONS.has(plan.operation)
        ? 'HIGH'
        : plan.operation === 'set-style' || plan.operation === 'set-attribute'
          ? 'MEDIUM'
          : 'LOW';
    if (plan.operation === 'remove-node') tx.riskReasons.push('node removal destroys state; rollback = re-insert');
    if (plan.operation === 'evaluate-script') tx.riskReasons.push('arbitrary script execution');
    if (tx.risk === 'DESTRUCTIVE' && !opts.allowDestructive) {
      tx.phase = 'RISK_REJECTED';
      tx.audit.push('destructive operation blocked by policy (allowDestructive=false)');
      this.history.push(tx);
      return tx;
    }
    if (tx.risk === 'HIGH' && !opts.allowHighRisk) {
      tx.phase = 'RISK_REJECTED';
      tx.audit.push('high-risk operation blocked by policy (allowHighRisk=false)');
      this.history.push(tx);
      return tx;
    }

    // 3. PRECONDITIONS
    const before = await adapter.observe(plan.targetSelector);
    const preconditionChecks = [
      { description: 'mutation adapter reachable and target observable', passes: typeof before === 'object' && before !== null },
    ];
    if (!preconditionChecks.every((c) => c.passes)) {
      tx.phase = 'PRECONDITIONS_FAILED';
      tx.audit.push(`preconditions failed: ${preconditionChecks.filter((c) => !c.passes).map((c) => c.description).join(', ')}`);
      this.history.push(tx);
      return tx;
    }

    // 4. SIMULATION
    tx.simulationResult = await adapter.simulate(plan);
    tx.phase = 'SIMULATED';
    tx.audit.push(`simulated: ${tx.simulationResult.outcomePredicted}; affected: ${tx.simulationResult.affectedComponents.join(', ') || 'none'}`);

    // 5. APPLY
    tx.before = { at: Date.now(), observedState: before };
    try {
      await adapter.apply(plan);
      tx.phase = 'APPLIED';
      tx.audit.push('applied');
    } catch (err: any) {
      tx.phase = 'FAILED';
      tx.audit.push(`apply failed: ${err?.message ?? 'unknown'}`);
      this.history.push(tx);
      return tx;
    }

    // 6. OBSERVE + 7. VERIFY POSTCONDITIONS
    const after = await adapter.observe(plan.targetSelector);
    tx.after = { at: Date.now(), observedState: after };
    tx.phase = 'OBSERVED';
    const verifier = opts.verifyPostconditions ?? ((a) => ({
      status: Object.keys(a).length > 0 ? 'PASS' : 'FAIL',
      details: [Object.keys(a).length > 0 ? 'target still observable after mutation' : 'target missing after mutation'],
    }));
    tx.verification = verifier(after);
    if (tx.verification.status === 'FAIL') {
      // 8. ROLLBACK on failed verification.
      const restored = await adapter.restore(plan.targetSelector, before);
      if (restored) {
        tx.phase = 'ROLLED_BACK';
        tx.rollbackAvailable = false;
        tx.audit.push('verification FAILED → rolled back to pre-mutation state');
      } else {
        tx.phase = 'ROLLBACK_UNSAFE';
        tx.audit.push('verification FAILED → rollback unavailable/unsafe; state left modified (flagged)');
      }
      this.history.push(tx);
      return tx;
    }
    if (tx.verification.status === 'INCONCLUSIVE') {
      tx.audit.push('verification INCONCLUSIVE — transaction NOT committed (no silent success)');
      this.history.push(tx);
      return tx;
    }

    // 9. COMMIT
    tx.phase = 'VERIFIED';
    tx.rollbackAvailable = false;
    tx.phase = 'COMMITTED';
    tx.audit.push('verification PASS → committed');
    this.history.push(tx);
    return tx;
  }

  private selectorInScope(selector: string, scope: MutationScope): boolean {
    if (scope.allowedSelectors.length === 0) return true;
    return scope.allowedSelectors.some(
      (allowed) => selector === allowed || selector.startsWith(allowed) || selector.includes(allowed),
    );
  }

  transactions(): readonly MutationTransaction[] {
    return this.history;
  }
}
