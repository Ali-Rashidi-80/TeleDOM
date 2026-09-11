/**
 * TeleDOM v4 Temporal — Branch Manager.
 *
 * Branchable browser-state reasoning. A branch NEVER overwrites original
 * evidence; it maintains parent + mutation set + assumptions + simulation
 * policy + result + confidence + provenance + verification status.
 */

import { computeHash } from '../kernel/integrity';
import type { EventEnvelope } from '../kernel/events';

export type BranchMutationKind =
  | 'modify-event' | 'modify-response' | 'modify-state' | 'suppress-mutation'
  | 'modify-style' | 'alter-timing' | 'remove-event';

export interface BranchMutation {
  kind: BranchMutationKind;
  /** Sequence of the targeted event. */
  targetSequence: number;
  /** Replacement payload (modify) or reason (suppress/remove). */
  patch?: Record<string, unknown>;
  reason: string;
}

export interface SimulationPolicy {
  /** Deterministic replay of the mutated stream. */
  mode: 'deterministic-replay';
  /** Max events the branch will replay before degrading. */
  maxEvents: number;
}

export type BranchVerificationStatus = 'UNVERIFIED' | 'SIMULATED' | 'VERIFIED' | 'DISPROVEN';

export interface TemporalBranch {
  branchId: string;
  parentId: string; // 'reality' or another branch id
  createdAt: number;
  forkAtLogical: number;
  mutations: BranchMutation[];
  assumptions: string[];
  policy: SimulationPolicy;
  /** Replayed event stream (reality up to fork + mutations after). */
  simulatedEvents: EventEnvelope[];
  result: Record<string, unknown> | null;
  confidence: number;
  provenance: string[];
  verification: BranchVerificationStatus;
}

export class BranchManager {
  private branches = new Map<string, TemporalBranch>();
  private nextBranch = 0;

  /**
   * Fork reality (or another branch) at a logical time and apply mutations
   * to the post-fork stream. Original evidence is untouched.
   */
  fork(
    reality: EventEnvelope[],
    forkAtLogical: number,
    mutations: BranchMutation[],
    opts: { parentId?: string; assumptions?: string[]; policy?: Partial<SimulationPolicy> } = {},
  ): TemporalBranch {
    this.nextBranch += 1;
    const branchId = `branch:${this.nextBranch}:${computeHash({ forkAtLogical, mutations }).slice(0, 8)}`;
    const policy: SimulationPolicy = {
      mode: 'deterministic-replay',
      maxEvents: opts.policy?.maxEvents ?? 100_000,
    };
    const ordered = [...reality].sort((a, b) => a.logicalTime - b.logicalTime);
    const before = ordered.filter((e) => e.logicalTime <= forkAtLogical);
    const after = ordered.filter((e) => e.logicalTime > forkAtLogical);
    const directlySuppressed = new Set(
      mutations.filter((m) => m.kind === 'suppress-mutation' || m.kind === 'remove-event').map((m) => m.targetSequence),
    );
    // Causal dependency propagation: suppressing an event also suppresses
    // its transitive causal descendants — in deterministic replay they
    // would never have happened without their cause.
    const suppressSet = this.expandCausalDescendants(directlySuppressed, after);
    const simulatedEvents: EventEnvelope[] = [];
    let replayed = 0;
    for (const ev of after) {
      if (replayed >= policy.maxEvents) break;
      if (suppressSet.has(ev.sequence)) {
        replayed += 1;
        continue;
      }
      const mutation = mutations.find(
        (m) => m.targetSequence === ev.sequence && (m.kind === 'modify-event' || m.kind === 'modify-response' || m.kind === 'modify-state' || m.kind === 'modify-style'),
      );
      if (mutation?.patch) {
        simulatedEvents.push({
          ...ev,
          payload: { ...ev.payload, ...mutation.patch, __mutatedBy: branchId },
          causalParentIds: [...ev.causalParentIds, `${branchId}`],
        });
      } else if (mutation?.kind === 'alter-timing') {
        const shift = typeof mutation.patch?.shiftMs === 'number' ? (mutation.patch.shiftMs as number) : 0;
        simulatedEvents.push({ ...ev, logicalTime: ev.logicalTime + shift, payload: { ...ev.payload, __mutatedBy: branchId } });
      } else {
        simulatedEvents.push(ev);
      }
      replayed += 1;
    }
    const branch: TemporalBranch = {
      branchId,
      parentId: opts.parentId ?? 'reality',
      createdAt: Date.now(),
      forkAtLogical,
      mutations,
      assumptions: opts.assumptions ?? [],
      policy,
      simulatedEvents: [...before, ...simulatedEvents],
      result: null,
      confidence: 0.5,
      provenance: [`fork:${branchId}`, `parent:${opts.parentId ?? 'reality'}`, `mutations:${mutations.length}`],
      verification: 'UNVERIFIED',
    };
    this.branches.set(branchId, branch);
    return branch;
  }

  /**
   * Expand a set of suppressed sequences with their transitive causal
   * descendants (events whose causalParentIds chain reaches a suppressed
   * event). Branch-local: original evidence is never modified.
   */
  private expandCausalDescendants(suppressed: Set<number>, events: EventEnvelope[]): Set<number> {
    if (suppressed.size === 0) return suppressed;
    const byEventId = new Map(events.map((e) => [e.eventId, e]));
    const suppressedEventIds = new Set(
      [...suppressed].map((seq) => events.find((e) => e.sequence === seq)?.eventId).filter(Boolean) as string[],
    );
    const result = new Set(suppressed);
    // Iterate to fixpoint (bounded by events length).
    let changed = true;
    let rounds = 0;
    while (changed && rounds < 100) {
      changed = false;
      rounds += 1;
      for (const ev of events) {
        if (result.has(ev.sequence)) continue;
        if (ev.causalParentIds.some((parentId) => {
          const parent = byEventId.get(parentId);
          return suppressedEventIds.has(parentId) || (parent && result.has(parent.sequence));
        })) {
          result.add(ev.sequence);
          suppressedEventIds.add(ev.eventId);
          changed = true;
        }
      }
    }
    return result;
  }

  get(branchId: string): TemporalBranch | undefined {
    const b = this.branches.get(branchId);
    return b ? { ...b } : undefined;
  }

  /** Record a simulation result + confidence on a branch. */
  recordResult(branchId: string, result: Record<string, unknown>, confidence: number): void {
    const b = this.branches.get(branchId);
    if (!b) throw new Error(`unknown branch ${branchId}`);
    b.result = result;
    b.confidence = Math.max(0, Math.min(1, confidence));
    b.verification = 'SIMULATED';
  }

  setVerification(branchId: string, status: BranchVerificationStatus, note: string): void {
    const b = this.branches.get(branchId);
    if (!b) throw new Error(`unknown branch ${branchId}`);
    b.verification = status;
    b.provenance.push(`verification:${status}:${note}`);
  }

  list(): TemporalBranch[] {
    return [...this.branches.values()].map((b) => ({ ...b }));
  }

  /**
   * Compare reality vs branch: which events diverge, and what outcomes
   * (event types) exist only in one stream.
   */
  compare(branchId: string, reality: EventEnvelope[]): BranchComparison {
    const branch = this.branches.get(branchId);
    if (!branch) throw new Error(`unknown branch ${branchId}`);
    const realitySeqs = new Set(reality.map((e) => e.sequence));
    const branchSeqs = new Set(branch.simulatedEvents.map((e) => e.sequence));
    const removed = branch.simulatedEvents.filter((e) => !realitySeqs.has(e.sequence));
    const added = reality.filter((e) => !branchSeqs.has(e.sequence));
    const realityTypes = new Map<string, number>();
    for (const e of reality) realityTypes.set(e.type, (realityTypes.get(e.type) ?? 0) + 1);
    const branchTypes = new Map<string, number>();
    for (const e of branch.simulatedEvents) branchTypes.set(e.type, (branchTypes.get(e.type) ?? 0) + 1);
    const outcomeDeltas: { type: string; realityCount: number; branchCount: number }[] = [];
    for (const [type, count] of realityTypes) {
      const bCount = branchTypes.get(type) ?? 0;
      if (bCount !== count) outcomeDeltas.push({ type, realityCount: count, branchCount: bCount });
    }
    for (const [type, count] of branchTypes) {
      if (!realityTypes.has(type)) outcomeDeltas.push({ type, realityCount: 0, branchCount: count });
    }
    return { branchId, mutations: branch.mutations, removed, added, outcomeDeltas };
  }
}

export interface BranchComparison {
  branchId: string;
  mutations: BranchMutation[];
  /** Events present in branch but not reality (suppressed in reality terms). */
  removed: EventEnvelope[];
  /** Events present in reality but not the branch. */
  added: EventEnvelope[];
  /** Event-type outcome deltas. */
  outcomeDeltas: { type: string; realityCount: number; branchCount: number }[];
}
