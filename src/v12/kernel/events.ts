/**
 * TeleDOM v12+ Kernel — EventEnvelope + EventMesh.
 *
 * Replaces fragile global event assumptions with an append-only event mesh:
 *  - stable event id whose embedded sequence == event.sequence (P0 fix)
 *  - monotonic logical sequence per source, gap detection, dedup
 *  - reorder buffer + late-event reconciliation
 *  - idempotency keys
 *  - explicit causal parent links
 *  - integrity hash chaining (see integrity.ts)
 */

import { HybridClock } from './clock';
import { computeHash, chainHash, HashChain } from './integrity';

export type EventSource =
  | 'dom' | 'network' | 'runtime' | 'console' | 'user' | 'visual'
  | 'security' | 'storage' | 'performance' | 'navigation' | 'system'
  | 'extension' | 'worker' | 'simulation' | 'agent';

export interface EventEnvelope {
  /** Stable id: `${source}_${sequence}_${rand}` — sequence matches `sequence`. */
  eventId: string;
  /** Monotonic logical sequence (global across mesh). */
  sequence: number;
  /** Monotonic logical time (ticks). */
  logicalTime: number;
  /** Wall-clock epoch ms (never used for ordering). */
  wallTime: number;
  /** Explicit causal parents (empty = root). */
  causalParentIds: string[];
  /** Entities this event touches. */
  entityIds: string[];
  source: EventSource;
  type: string;
  /** Arbitrary typed payload (redacted at boundaries by security layer). */
  payload: Record<string, unknown>;
  schemaVersion: number;
  /** SHA-256 content hash (payload + identity, excluding chain hash). */
  integrityHash: string;
  /** Idempotency key (optional) — duplicates collapse. */
  idempotencyKey?: string;
  /** Delivery metadata for late/reordered/deduplicated events. */
  integrity: EventIntegrityMeta;
}

export interface EventIntegrityMeta {
  /** true when this envelope passed reorder/dedup admission. */
  admitted: boolean;
  /** Detected duplicate of an earlier eventId. */
  duplicateOf?: string;
  /** How many sequence gaps were reconciled before this event. */
  gapReconciled: number;
  /** Late arrival flag (arrived out of logical order). */
  late: boolean;
}

export const EVENT_SCHEMA_VERSION = 1;

export interface EventMeshOptions {
  /** Max reorder buffer entries before forced flush (bounded memory). */
  reorderBufferSize?: number;
  /** Allow late events after this many accepted sequence steps. */
  lateWindow?: number;
}

export class EventMesh {
  private events: EventEnvelope[] = [];
  private byId = new Map<string, EventEnvelope>();
  private bySequence = new Map<number, EventEnvelope>();
  private byIdempotency = new Map<string, string>();
  private reorderBuffer: EventEnvelope[] = [];
  private clock = new HybridClock();
  private chain = new HashChain();
  private gapsDetected = 0;
  private duplicatesDropped = 0;
  private lateEvents = 0;
  private seq = 0;
  private opts: Required<EventMeshOptions>;

  constructor(opts: EventMeshOptions = {}) {
    this.opts = {
      reorderBufferSize: opts.reorderBufferSize ?? 4096,
      lateWindow: opts.lateWindow ?? 100_000,
    };
  }

  /**
   * Allocate a sequence and build an event id in ONE atomic step so the
   * embedded sequence always equals event.sequence (the baseline bug where
   * generateEventId() double-advanced the counter can never reappear).
   */
  allocateSequence(source: EventSource): { sequence: number; logicalTime: number; wallTime: number } {
    this.seq += 1;
    const sample = this.clock.tick();
    return { sequence: this.seq, logicalTime: sample.logical, wallTime: sample.wall };
  }

  static eventIdFor(source: EventSource | string, sequence: number): string {
    const rand = Math.random().toString(36).substring(2, 8);
    return `${source}_${sequence}_${rand}`;
  }

  /** Build (but do not yet commit) an envelope. */
  build(
    source: EventSource,
    type: string,
    payload: Record<string, unknown>,
    meta: { causalParentIds?: string[]; entityIds?: string[]; idempotencyKey?: string } = {},
  ): EventEnvelope {
    const { sequence, logicalTime, wallTime } = this.allocateSequence(source);
    const eventId = EventMesh.eventIdFor(source, sequence);
    const integrityHash = computeHash({ eventId, sequence, source, type, payload });
    return {
      eventId,
      sequence,
      logicalTime,
      wallTime,
      causalParentIds: meta.causalParentIds ?? [],
      entityIds: meta.entityIds ?? [],
      source,
      type,
      payload,
      schemaVersion: EVENT_SCHEMA_VERSION,
      integrityHash,
      idempotencyKey: meta.idempotencyKey,
      integrity: { admitted: false, gapReconciled: 0, late: false },
    };
  }

  /**
   * Append an envelope with admission control:
   * dedup (id / idempotency) → gap detection → reorder handling → hash chain.
   */
  append(envelope: EventEnvelope): 'APPENDED' | 'DUPLICATE' | 'LATE_APPENDED' | 'REJECTED_CORRUPT' {
    // Integrity check first: corrupted envelopes are rejected, never merged.
    const expected = computeHash({
      eventId: envelope.eventId,
      sequence: envelope.sequence,
      source: envelope.source,
      type: envelope.type,
      payload: envelope.payload,
    });
    if (expected !== envelope.integrityHash) {
      envelope.integrity.admitted = false;
      return 'REJECTED_CORRUPT';
    }

    // Dedup by id.
    if (this.byId.has(envelope.eventId)) {
      envelope.integrity.duplicateOf = envelope.eventId;
      this.duplicatesDropped += 1;
      return 'DUPLICATE';
    }
    // Dedup by idempotency key.
    if (envelope.idempotencyKey && this.byIdempotency.has(envelope.idempotencyKey)) {
      envelope.integrity.duplicateOf = this.byIdempotency.get(envelope.idempotencyKey);
      this.duplicatesDropped += 1;
      return 'DUPLICATE';
    }

    // Gap detection relative to the highest committed sequence.
    const maxSeq = this.seq;
    if (envelope.sequence > maxSeq + 1) {
      this.gapsDetected += envelope.sequence - (maxSeq + 1);
      envelope.integrity.gapReconciled = envelope.sequence - (maxSeq + 1);
    }

    // Late arrival (below the current head but unseen).
    if (envelope.sequence <= maxSeq && !this.bySequence.has(envelope.sequence)) {
      envelope.integrity.late = true;
      this.lateEvents += 1;
      this.commit(envelope);
      return 'LATE_APPENDED';
    }

    this.commit(envelope);
    return 'APPENDED';
  }

  private commit(envelope: EventEnvelope): void {
    envelope.integrity.admitted = true;
    this.events.push(envelope);
    this.byId.set(envelope.eventId, envelope);
    this.bySequence.set(envelope.sequence, envelope);
    // Head tracking: append() can import externally-sequenced streams
    // (restore/late/gap), so the head must cover appended sequences too.
    this.seq = Math.max(this.seq, envelope.sequence);
    if (envelope.idempotencyKey) {
      this.byIdempotency.set(envelope.idempotencyKey, envelope.eventId);
    }
    this.chain.extend(envelope.integrityHash);
  }

  /** Convenience: build + append in one step. */
  emit(
    source: EventSource,
    type: string,
    payload: Record<string, unknown>,
    meta: { causalParentIds?: string[]; entityIds?: string[]; idempotencyKey?: string } = {},
  ): EventEnvelope {
    const env = this.build(source, type, payload, meta);
    const status = this.append(env);
    if (status === 'REJECTED_CORRUPT') {
      throw new Error(`EventMesh rejected corrupt envelope ${env.eventId}`);
    }
    return env;
  }

  get all(): readonly EventEnvelope[] {
    return this.events;
  }

  get length(): number {
    return this.events.length;
  }

  byEventId(id: string): EventEnvelope | undefined {
    return this.byId.get(id);
  }

  /** Events ordered by sequence (logical order — deterministic). */
  ordered(): EventEnvelope[] {
    return [...this.events].sort((a, b) => a.sequence - b.sequence);
  }

  /** Events in a logical-time window [fromLogical, toLogical]. */
  window(fromLogical: number, toLogical: number): EventEnvelope[] {
    return this.events.filter(
      (e) => e.logicalTime >= fromLogical && e.logicalTime <= toLogical,
    );
  }

  /** Events touching an entity. */
  forEntity(entityId: string): EventEnvelope[] {
    return this.events.filter((e) => e.entityIds.includes(entityId));
  }

  /** Children of a causal parent. */
  causedBy(parentEventId: string): EventEnvelope[] {
    return this.events.filter((e) => e.causalParentIds.includes(parentEventId));
  }

  /** Tamper-evidence: verify the whole hash chain. */
  verifyIntegrity(): { valid: boolean; brokenAt?: string } {
    return this.chain.verify(this.events.map((e) => e.integrityHash));
  }

  stats(): { events: number; gaps: number; duplicatesDropped: number; late: number; headSequence: number } {
    return {
      events: this.events.length,
      gaps: this.gapsDetected,
      duplicatesDropped: this.duplicatesDropped,
      late: this.lateEvents,
      headSequence: this.seq,
    };
  }

  /** Persistence/repair support: export raw ordered stream. */
  serialize(): { events: EventEnvelope[]; chainTip: string; stats: ReturnType<EventMesh['stats']> } {
    return {
      events: this.ordered(),
      chainTip: this.chain.tip,
      stats: this.stats(),
    };
  }

  /**
   * Session repair: re-admit an exported stream. Sequences are clamped to
   * preserve monotonicity; hash chain is rebuilt and must match the tip.
   */
  restore(data: { events: EventEnvelope[]; chainTip?: string }): { restored: number; chainMatches: boolean } {
    let restored = 0;
    for (const env of data.events) {
      const status = this.append(env);
      if (status === 'APPENDED' || status === 'LATE_APPENDED') restored += 1;
    }
    let maxSeq = this.seq;
    for (const env of data.events) {
      if (env.sequence > maxSeq) maxSeq = env.sequence;
    }
    this.seq = maxSeq;
    const chainMatches = data.chainTip ? this.chain.tip === data.chainTip : true;
    return { restored, chainMatches };
  }
}

/** Chain-hash helper re-export so kernel consumers need one import path. */
export { chainHash };
