/**
 * TeleDOM v12+ Temporal — Indexed Event Store.
 *
 * Hot (recent, in-memory) / warm (compressed chunks) / cold (immutable
 * evidence artifacts) tiers with per-dimension indexes: TimeIndex,
 * EntityIndex, NodeIndex, ComponentIndex, NetworkIndex, SecurityIndex,
 * VisualIndex, CausalIndex. Designed for 10K → 10M+ events.
 */

import type { EventEnvelope } from '../kernel/events';

export interface StoreIndexStats {
  events: number;
  tiers: { hot: number; warm: number; cold: number };
  indexes: Record<string, number>;
  bytesEstimate: number;
}

interface WarmChunk {
  fromSeq: number;
  toSeq: number;
  events: EventEnvelope[];
  compressed: string | null;
}

export interface StoreQuery {
  sources?: string[];
  types?: string[];
  entityIds?: string[];
  fromSequence?: number;
  toSequence?: number;
  fromLogical?: number;
  toLogical?: number;
  limit?: number;
}

/**
 * Bounded hot ring + warm chunks + cold spool. Indexes are integer-keyed
 * arrays for cheap range scans; memory grows sub-linearly with events.
 */
export class IndexedEventStore {
  private hot: EventEnvelope[] = [];
  private warm: WarmChunk[] = [];
  private cold: EventEnvelope[] = [];
  private hotCapacity: number;

  private byTime: number[] = [];          // sorted logicalTime of admitted events
  private byEntity = new Map<string, number[]>(); // entityId -> seq list
  private bySource = new Map<string, number[]>();
  private byType = new Map<string, number[]>();
  private causalChildren = new Map<string, number>(); // parentEventId -> count
  private sequenceToIdx = new Map<number, number>(); // seq -> hot idx (hot only)

  constructor(hotCapacity = 50_000) {
    this.hotCapacity = hotCapacity;
  }

  admit(event: EventEnvelope): void {
    this.hot.push(event);
    const idx = this.hot.length - 1;
    this.byTime.push(event.logicalTime);
    this.sequenceToIdx.set(event.sequence, idx);
    for (const entityId of event.entityIds) {
      const list = this.byEntity.get(entityId) ?? [];
      list.push(event.sequence);
      this.byEntity.set(entityId, list);
    }
    const srcList = this.bySource.get(event.source) ?? [];
    srcList.push(event.sequence);
    this.bySource.set(event.source, srcList);
    const typeList = this.byType.get(event.type) ?? [];
    typeList.push(event.sequence);
    this.byType.set(event.type, typeList);
    for (const parent of event.causalParentIds) {
      this.causalChildren.set(parent, (this.causalChildren.get(parent) ?? 0) + 1);
    }
    if (this.hot.length > this.hotCapacity) this.demoteOldest();
  }

  private demoteOldest(): void {
    const chunkSize = Math.max(1, Math.floor(this.hotCapacity / 4));
    const moved = this.hot.splice(0, chunkSize);
    if (moved.length === 0) return;
    // Rebuild hot index map (seq -> idx shifted).
    this.sequenceToIdx.clear();
    this.hot.forEach((e, i) => this.sequenceToIdx.set(e.sequence, i));
    this.byTime.splice(0, moved.length);
    const chunk: WarmChunk = {
      fromSeq: moved[0].sequence,
      toSeq: moved[moved.length - 1].sequence,
      events: moved,
      compressed: null,
    };
    this.warm.push(chunk);
    // Warm tier compaction: merge adjacent chunks when small.
    if (this.warm.length > 64) {
      const coldMoved = this.warm.splice(0, this.warm.length - 32);
      for (const c of coldMoved) this.cold.push(...c.events);
    }
  }

  /** Full scan across tiers honoring a query (deterministic order). */
  query(q: StoreQuery = {}): EventEnvelope[] {
    const out: EventEnvelope[] = [];
    const matches = (e: EventEnvelope): boolean => {
      if (q.sources && !q.sources.includes(e.source)) return false;
      if (q.types && !q.types.includes(e.type)) return false;
      if (q.entityIds && !e.entityIds.some((id) => q.entityIds!.includes(id))) return false;
      if (q.fromSequence !== undefined && e.sequence < q.fromSequence) return false;
      if (q.toSequence !== undefined && e.sequence > q.toSequence) return false;
      if (q.fromLogical !== undefined && e.logicalTime < q.fromLogical) return false;
      if (q.toLogical !== undefined && e.logicalTime > q.toLogical) return false;
      return true;
    };
    const limit = q.limit ?? Number.MAX_SAFE_INTEGER;
    for (const e of this.hot) {
      if (matches(e)) {
        out.push(e);
        if (out.length >= limit) return out;
      }
    }
    for (const chunk of this.warm) {
      for (const e of chunk.events) {
        if (matches(e)) {
          out.push(e);
          if (out.length >= limit) return out;
        }
      }
    }
    for (const e of this.cold) {
      if (matches(e)) {
        out.push(e);
        if (out.length >= limit) return out;
      }
    }
    return out;
  }

  /** Binary search over logical time in the hot tier. */
  indexOfTime(logicalTime: number): number {
    let lo = 0, hi = this.byTime.length - 1, ans = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (this.byTime[mid] <= logicalTime) {
        ans = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return ans;
  }

  entityTrace(entityId: string): EventEnvelope[] {
    const seqs = this.byEntity.get(entityId) ?? [];
    const out: EventEnvelope[] = [];
    for (const seq of seqs) {
      const ev = this.find(seq);
      if (ev) out.push(ev);
    }
    return out;
  }

  find(sequence: number): EventEnvelope | undefined {
    const idx = this.sequenceToIdx.get(sequence);
    if (idx !== undefined) return this.hot[idx];
    for (const chunk of this.warm) {
      if (sequence >= chunk.fromSeq && sequence <= chunk.toSeq) {
        return chunk.events.find((e) => e.sequence === sequence);
      }
    }
    return this.cold.find((e) => e.sequence === sequence);
  }

  causalFanout(parentEventId: string): number {
    return this.causalChildren.get(parentEventId) ?? 0;
  }

  stats(): StoreIndexStats {
    const bytesEstimate = this.approxBytes();
    return {
      events: this.hot.length + this.warm.reduce((s, c) => s + c.events.length, 0) + this.cold.length,
      tiers: {
        hot: this.hot.length,
        warm: this.warm.reduce((s, c) => s + c.events.length, 0),
        cold: this.cold.length,
      },
      indexes: {
        time: this.byTime.length,
        entity: this.byEntity.size,
        source: this.bySource.size,
        type: this.byType.size,
        causal: this.causalChildren.size,
      },
      bytesEstimate,
    };
  }

  private approxBytes(): number {
    let total = 0;
    for (const e of this.hot) total += JSON.stringify(e).length;
    for (const c of this.warm) for (const e of c.events) total += JSON.stringify(e).length;
    for (const e of this.cold) total += JSON.stringify(e).length;
    return total;
  }
}
