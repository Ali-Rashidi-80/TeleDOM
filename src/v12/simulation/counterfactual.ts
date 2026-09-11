/**
 * TeleDOM v12+ Simulation — Counterfactual Engine.
 *
 * Answers "what would happen if this cause were removed?" by forking a
 * recorded stream, applying mutations (suppress event, modify response,
 * modify state, modify style, alter timing), deterministically replaying,
 * and comparing to reality. Never destroys original evidence.
 */

import { EventEnvelope } from '../kernel/events';
import { BranchManager, BranchMutation } from '../temporal/branching';
import { CausalEngine, CausalChain } from '../causality/engine';

export type CounterfactualKind =
  | 'suppress-event' | 'modify-response' | 'modify-state'
  | 'modify-style' | 'alter-timing' | 'remove-mutation';

export interface CounterfactualSpec {
  kind: CounterfactualKind;
  /** Target event sequence. */
  targetSequence: number;
  patch?: Record<string, unknown>;
  reason: string;
}

export interface CounterfactualOutcome {
  branchId: string;
  spec: CounterfactualSpec;
  /** Did the symptom disappear in the branch? */
  symptomResolved: boolean;
  /** Honest comparison verdict. */
  verdict: 'CAUSE_SUPPPORTED' | 'NOT_SUPPORTED' | 'INCONCLUSIVE';
  confidence: number;
  comparison: {
    outcomeDeltas: { type: string; realityCount: number; branchCount: number }[];
  };
  assumptions: string[];
  evidenceRefs: string[];
}

/**
 * Replay fidelity levels (§42): DOM/runtime/network/performance/console
 * events are RECORDED signals — their suppression replay is deterministic.
 * VISUAL state (screenshots / pixel evidence) is PARTIAL fidelity: a visual
 * difference consistent with a branch can never PROVE causation — the
 * verdict stays INCONCLUSIVE. Never claim deterministic replay where it
 * does not exist.
 */
const DETERMINISTIC_REPLAY_SOURCES = new Set(['dom', 'runtime', 'network', 'performance', 'console', 'user', 'storage', 'security', 'navigation', 'system', 'extension', 'worker']);

export function replayFidelityOf(source: string): 'deterministic' | 'partial' {
  return DETERMINISTIC_REPLAY_SOURCES.has(source) ? 'deterministic' : 'partial';
}

/**
 * Pattern-level symptoms need SUSTAINED observation to prove, not a single
 * suppression: memory growth / leak / retention patterns accumulate over
 * time, so removing one candidate cause and seeing the next sample event
 * disappear does not prove the pattern is gone. Honest INCONCLUSIVE.
 */
const PARTIAL_FIDELITY_SYMPTOM_PATTERNS = /memory|growth|leak|retained|accumulat/i;

export function symptomFidelity(source: string, type: string): 'deterministic' | 'partial' {
  if (PARTIAL_FIDELITY_SYMPTOM_PATTERNS.test(type)) return 'partial';
  return replayFidelityOf(source);
}

export class CounterfactualEngine {
  private branches = new BranchManager();

  constructor(private causal: CausalEngine) {}

  /**
   * Run a counterfactual: remove/modify the candidate cause and check
   * whether the symptom outcome changes. INCONCLUSIVE is reported when
   * comparison cannot establish a difference (never a silent PASS).
   */
  run(
    reality: EventEnvelope[],
    spec: CounterfactualSpec,
    symptomPredicate: (e: EventEnvelope) => boolean,
  ): CounterfactualOutcome {
    const target = reality.find((e) => e.sequence === spec.targetSequence);
    if (!target) {
      return {
        branchId: '',
        spec,
        symptomResolved: false,
        verdict: 'INCONCLUSIVE',
        confidence: 0,
        comparison: { outcomeDeltas: [] },
        assumptions: ['target event not found in reality stream'],
        evidenceRefs: [],
      };
    }
    const mutation: BranchMutation = this.toMutation(spec);
    const branch = this.branches.fork(reality, 0, [mutation], {
      assumptions: [spec.reason, 'branch replay is deterministic given recorded stream'],
    });
    const realitySymptom = reality.some(symptomPredicate);
    const branchSymptom = branch.simulatedEvents.some(symptomPredicate);
    const comparison = this.branches.compare(branch.branchId, reality);
    const symptomEvent = reality.find(symptomPredicate);
    // Fidelity gate: partial-fidelity symptoms (visual/performance) can be
    // consistent with the branch, but suppression can never PROVE causation
    // for them. Honest INCONCLUSIVE — never a silent PASS.
    const fidelity = symptomEvent ? symptomFidelity(symptomEvent.source, symptomEvent.type) : ('deterministic' as const);
    // Symptom must exist in reality and vanish in branch to support cause.
    let verdict: CounterfactualOutcome['verdict'];
    if (fidelity === 'partial') {
      verdict = 'INCONCLUSIVE';
    } else if (realitySymptom && !branchSymptom) {
      verdict = 'CAUSE_SUPPPORTED';
    } else if (!realitySymptom) {
      verdict = 'INCONCLUSIVE';
    } else if (realitySymptom && branchSymptom) {
      verdict = 'NOT_SUPPORTED';
    } else {
      verdict = 'INCONCLUSIVE';
    }
    const confidence =
      verdict === 'CAUSE_SUPPPORTED' ? Math.min(0.95, 0.75 + (comparison.outcomeDeltas.length > 0 ? 0.1 : 0)) :
      verdict === 'NOT_SUPPORTED' ? 0.7 : 0.35;
    this.branches.recordResult(branch.branchId, { symptomResolved: !branchSymptom, fidelity }, confidence);
    if (verdict === 'CAUSE_SUPPPORTED') {
      this.branches.setVerification(branch.branchId, 'VERIFIED', 'symptom vanished under suppression (deterministic replay)');
    }
    return {
      branchId: branch.branchId,
      spec,
      symptomResolved: !branchSymptom,
      verdict,
      confidence,
      comparison: { outcomeDeltas: comparison.outcomeDeltas },
      assumptions: fidelity === 'partial'
        ? [...branch.assumptions, `symptom dimension (${symptomEvent?.source}) has PARTIAL replay fidelity — suppression cannot prove causation`]
        : branch.assumptions,
      evidenceRefs: [
        `event:${target.eventId}`,
        `branch:${branch.branchId}`,
        ...comparison.outcomeDeltas.slice(0, 5).map((d) => `outcome-delta:${d.type}`),
      ],
    };
  }

  private toMutation(spec: CounterfactualSpec): BranchMutation {
    switch (spec.kind) {
      case 'suppress-event':
      case 'remove-mutation':
        return { kind: 'suppress-mutation', targetSequence: spec.targetSequence, reason: spec.reason };
      case 'alter-timing':
        return { kind: 'alter-timing', targetSequence: spec.targetSequence, patch: spec.patch ?? { shiftMs: -250 }, reason: spec.reason };
      default:
        return { kind: spec.kind === 'modify-response' ? 'modify-response' : spec.kind === 'modify-state' ? 'modify-state' : 'modify-style', targetSequence: spec.targetSequence, patch: spec.patch, reason: spec.reason };
    }
  }

  /**
   * Verify a causal chain hypothesis through counterfactual suppression:
   * remove the root-cause event; if the symptom disappears the hypothesis
   * is COUNTERFACTUALLY_SUPPORTED.
   */
  verifyHypothesis(
    reality: EventEnvelope[],
    chain: CausalChain,
    symptomPredicate: (e: EventEnvelope) => boolean,
  ): CounterfactualOutcome {
    const rootEvent = chain.events[0];
    if (!rootEvent) {
      return {
        branchId: '', spec: { kind: 'suppress-event', targetSequence: -1, reason: 'empty chain' },
        symptomResolved: false, verdict: 'INCONCLUSIVE', confidence: 0,
        comparison: { outcomeDeltas: [] }, assumptions: ['no root event'], evidenceRefs: [],
      };
    }
    return this.run(
      reality,
      { kind: 'suppress-event', targetSequence: rootEvent.sequence, reason: `verify hypothesis: ${chain.rootCause}` },
      symptomPredicate,
    );
  }

  get branchManager(): BranchManager {
    return this.branches;
  }
}
