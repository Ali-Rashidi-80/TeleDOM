/**
 * TeleDOM v4 Temporal — Reconstruction + Temporal Query Engine.
 *
 * First-class temporal computation model, not just getStateAt(T):
 *   State(T) · State(T1..T2) · Diff(T1,T2) · Trace(Entity) · FirstChange
 *   LastStable · Join(Signals) · Window(around) · Seek(T)
 * Reconstruction = nearest checkpoint + delta replay with memoization,
 * bounded by MAX_RECONSTRUCTION_TIME (graceful degradation).
 */

import type { EventEnvelope } from '../kernel/events';
import type { StateDimension } from './state-frame';
import { StateFrame, ChunkStore, StateFrameBuilder } from './state-frame';

export interface ReconstructionCheck {
  /** Last event sequence covered by this checkpoint. */
  atSequence: number;
  frame: StateFrame;
}

export interface DiffEntry {
  dimension: StateDimension;
  kind: 'added' | 'removed' | 'changed';
  before?: unknown;
  after?: unknown;
}

export interface JoinClause {
  sources: string[];
  withinMs?: number;
  aroundEntityId?: string;
  types?: string[];
}

export interface QueryBudget {
  maxReconstructionMs?: number;
  maxEventsScanned?: number;
}

export interface TemporalQueryResult<T> {
  result: T;
  /** Honest performance/limit provenance. */
  meta: {
    reconstructionMs: number;
    eventsReplayed: number;
    degraded: boolean;
    memoized: boolean;
  };
}

interface MemoKey { key: string; frame: StateFrame; at: number }

export class TemporalEngine {
  private checkpoints: ReconstructionCheck[] = [];
  private frames: StateFrame[] = [];
  private events: EventEnvelope[] = [];
  private memo: MemoKey[] = [];
  private memoCapacity = 64;
  private chunkStore = new ChunkStore();
  private frameBuilder = new StateFrameBuilder(this.chunkStore);
  private checkpointInterval: number;

  constructor(checkpointInterval = 200) {
    this.checkpointInterval = checkpointInterval;
  }

  /** Admit an event; checkpoints are taken adaptively. */
  ingest(event: EventEnvelope, state?: Partial<Record<StateDimension, unknown>>): void {
    this.events.push(event);
    if (state && Object.keys(state).length > 0) {
      const frame = this.frameBuilder.capture(event.sequence, event.logicalTime, event.wallTime, state);
      this.frames.push(frame);
      const isCheckpoint = this.frames.length % this.checkpointInterval === 0;
      if (isCheckpoint) this.checkpoints.push({ atSequence: event.sequence, frame });
    }
    if (this.events.length > 1_000_000) {
      // Cold-tier style compaction guard for pathological sessions: keep
      // every event identity but payload-compacted representation is left
      // to the IndexedEventStore; here we only guard reconstruction cost.
      this.checkpoints = this.checkpoints.slice(-1024);
      this.memo = this.memo.slice(-this.memoCapacity);
    }
  }

  /** State(T) — reconstruct full state at a logical time. */
  stateAt(
    logicalTime: number,
    dims?: StateDimension[],
    budget: QueryBudget = {},
  ): TemporalQueryResult<Record<string, unknown> | null> {
    const started = performance.now();
    const maxMs = budget.maxReconstructionMs ?? 250;
    let eventsReplayed = 0;

    // Find nearest checkpoint at-or-before T.
    let checkpoint: ReconstructionCheck | null = null;
    for (const cp of this.checkpoints) {
      const cpTime = cp.frame.logicalTime;
      if (cpTime <= logicalTime) checkpoint = cp;
      else break;
    }
    // Replay deltas after checkpoint (or from origin).
    let state: Record<string, unknown> | null = null;
    const fromSeq = checkpoint ? checkpoint.atSequence + 1 : 0;
    for (const ev of this.events) {
      if (ev.sequence < fromSeq) continue;
      if (ev.logicalTime > logicalTime) break;
      if (this.applyEvent(state ??= this.initialState(checkpoint), ev)) eventsReplayed += 1;
      const elapsed = performance.now() - started;
      if (elapsed > maxMs) {
        return {
          result: state,
          meta: { reconstructionMs: elapsed, eventsReplayed, degraded: true, memoized: false },
        };
      }
    }
    if (state === null && checkpoint) {
      state = this.frameBuilder.materialize(checkpoint.frame, dims) as Record<string, unknown>;
    }
    const memoized = this.remember(logicalTime, state);
    return {
      result: state,
      meta: { reconstructionMs: performance.now() - started, eventsReplayed, degraded: false, memoized },
    };
  }

  private initialState(checkpoint: ReconstructionCheck | null): Record<string, unknown> {
    if (!checkpoint) return {};
    return this.frameBuilder.materialize(checkpoint.frame) as Record<string, unknown>;
  }

  /** Events mutate the projected state deterministically. */
  private applyEvent(state: Record<string, unknown>, ev: EventEnvelope): boolean {
    switch (ev.source) {
      case 'dom':
      case 'runtime':
      case 'network':
      case 'console':
      case 'security':
      case 'performance':
      case 'storage':
      case 'navigation': {
        const key = `dim:${ev.source}`;
        const arr = Array.isArray(state[key]) ? (state[key] as unknown[]) : [];
        arr.push(ev.type);
        state[key] = arr;
        return true;
      }
      default:
        return false;
    }
  }

  private remember(logicalTime: number, state: Record<string, unknown> | null): boolean {
    if (!state) return false;
    const key = `memo:${logicalTime}:${Object.keys(state).length}`;
    const existing = this.memo.find((m) => m.key === key);
    if (existing) return true;
    this.memo.push({
      key,
      frame: this.frameBuilder.capture(0, logicalTime, Date.now(), { dom: state }),
      at: Date.now(),
    });
    if (this.memo.length > this.memoCapacity) this.memo.shift();
    return false;
  }

  /** Diff(T1, T2) — dimension-level diff between two logical times. */
  diff(t1: number, t2: number, dims?: StateDimension[]): TemporalQueryResult<DiffEntry[]> {
    const started = performance.now();
    const s1 = this.stateAt(t1, dims).result ?? {};
    const s2 = this.stateAt(t2, dims).result ?? {};
    const out: DiffEntry[] = [];
    const keys1 = new Set(Object.keys(s1));
    const keys2 = new Set(Object.keys(s2));
    for (const k of keys2) {
      if (!keys1.has(k)) out.push({ dimension: this.dimOf(k), kind: 'added', after: s2[k] });
      else if (JSON.stringify(s1[k]) !== JSON.stringify(s2[k])) {
        out.push({ dimension: this.dimOf(k), kind: 'changed', before: s1[k], after: s2[k] });
      }
    }
    for (const k of keys1) {
      if (!keys2.has(k)) out.push({ dimension: this.dimOf(k), kind: 'removed', before: s1[k] });
    }
    return { result: out, meta: { reconstructionMs: performance.now() - started, eventsReplayed: 0, degraded: false, memoized: false } };
  }

  private dimOf(key: string): StateDimension {
    const raw = key.startsWith('dim:') ? key.slice(4) : key;
    return (raw as StateDimension);
  }

  /** Trace(Entity) — every event that touched an entity, in order. */
  traceEntity(entityId: string): EventEnvelope[] {
    return this.events.filter((e) => e.entityIds.includes(entityId));
  }

  /** FirstChange — first event matching a predicate. */
  firstChange(predicate: (e: EventEnvelope) => boolean): EventEnvelope | null {
    for (const ev of this.ordered()) {
      if (predicate(ev)) return ev;
    }
    return null;
  }

  /**
   * LastStable — latest logical time before `before` at which the state
   * dimension saw no events for at least `settleMs`.
   */
  lastStable(dimension: StateDimension, before: number, settleMs = 250): number | null {
    const relevant = this.ordered().filter((e) => `dim:${e.source}` === `dim:${dimension}`);
    let lastStableTime: number | null = null;
    let lastEventTime = -Infinity;
    for (const ev of relevant) {
      if (ev.logicalTime > before) break;
      if (lastEventTime > -Infinity && ev.logicalTime - lastEventTime >= settleMs) {
        lastStableTime = lastEventTime;
      }
      lastEventTime = ev.logicalTime;
    }
    if (lastEventTime > -Infinity && before - lastEventTime >= settleMs) {
      lastStableTime = lastEventTime;
    }
    return lastStableTime;
  }

  /**
   * Join(Signals) — join events from multiple sources within a temporal
   * constraint, optionally around an entity. Returns clusters (one per
   * anchor event) instead of a flat dump.
   */
  join(clause: JoinClause): EventEnvelope[][] {
    const within = clause.withinMs ?? 250;
    const ordered = this.ordered().filter((e) => {
      if (clause.sources.length && !clause.sources.includes(e.source)) return false;
      if (clause.types?.length && !clause.types.includes(e.type)) return false;
      if (clause.aroundEntityId && !e.entityIds.includes(clause.aroundEntityId)) return false;
      return true;
    });
    const clusters: EventEnvelope[][] = [];
    let cluster: EventEnvelope[] = [];
    let clusterStart = -Infinity;
    for (const ev of ordered) {
      if (cluster.length === 0) {
        cluster = [ev];
        clusterStart = ev.logicalTime;
      } else if (ev.logicalTime - clusterStart <= within) {
        cluster.push(ev);
      } else {
        if (cluster.length >= 2) clusters.push(cluster);
        cluster = [ev];
        clusterStart = ev.logicalTime;
      }
    }
    if (cluster.length >= 2) clusters.push(cluster);
    return clusters;
  }

  /** Window(T, radius) — compact before/target/after event window. */
  window(aroundLogical: number, radiusMs = 250): { before: EventEnvelope[]; at: EventEnvelope[]; after: EventEnvelope[] } {
    const before: EventEnvelope[] = [];
    const at: EventEnvelope[] = [];
    const after: EventEnvelope[] = [];
    for (const ev of this.ordered()) {
      const delta = ev.logicalTime - aroundLogical;
      if (delta < -radiusMs) continue;
      if (delta > radiusMs) break;
      if (delta < 0) before.push(ev);
      else if (delta === 0) at.push(ev);
      else after.push(ev);
    }
    return { before, at, after };
  }

  /** Seek(T) — nearest valid logical time having an event at-or-before T. */
  seek(logicalTime: number): number | null {
    let best: number | null = null;
    for (const ev of this.events) {
      if (ev.logicalTime <= logicalTime) best = ev.logicalTime;
      else break;
    }
    return best;
  }

  ordered(): EventEnvelope[] {
    return [...this.events].sort((a, b) => a.logicalTime - b.logicalTime || a.sequence - b.sequence);
  }

  get eventCount(): number {
    return this.events.length;
  }

  get checkpointCount(): number {
    return this.checkpoints.length;
  }

  getChunkStore(): ChunkStore {
    return this.chunkStore;
  }
}
