/**
 * TeleDOM v4 temporal tests — the temporal engine as first-class
 * computation model: State(T), Diff, Trace, Join, Window, Seek,
 * FirstChange, LastStable, Branching, plus 100K-event scale behavior.
 */

import { describe, it, expect } from 'vitest';
import { EventMesh, EventEnvelope } from '../../src/intelligence/kernel';
import { TemporalEngine } from '../../src/intelligence/temporal/queries';
import { IndexedEventStore } from '../../src/intelligence/temporal/event-store';
import { BranchManager } from '../../src/intelligence/temporal/branching';
import { StateFrameBuilder, ChunkStore } from '../../src/intelligence/temporal/state-frame';

function buildTimeline(): { mesh: EventMesh; temporal: TemporalEngine; events: EventEnvelope[] } {
  const mesh = new EventMesh();
  const temporal = new TemporalEngine(5);
  const events: EventEnvelope[] = [];
  let t = 0;
  for (let i = 0; i < 60; i++) {
    const source = (['dom', 'network', 'runtime', 'console'] as const)[i % 4];
    const ev = mesh.emit(source, `type-${source}-${i}`, { i });
    // Temporal uses logicalTime: rebuild with controlled logical times.
    events.push({ ...ev, logicalTime: t });
    t += 10;
  }
  for (const ev of events) temporal.ingest(ev);
  return { mesh, temporal, events };
}

describe('v4 temporal — State(T) & Seek', () => {
  it('stateAt returns non-null state for times inside the stream', () => {
    const { temporal } = buildTimeline();
    const r = temporal.stateAt(300);
    expect(r.result).not.toBeNull();
    expect(r.meta.degraded).toBe(false);
  });

  it('seek returns the nearest valid logical time at-or-before T', () => {
    const { temporal, events } = buildTimeline();
    const t = events[42].logicalTime;
    expect(temporal.seek(t)).toBe(t);
    expect(temporal.seek(t + 5)).toBe(t); // between events → floor
    expect(temporal.seek(-1)).toBeNull();
  });
});

describe('v4 temporal — Diff(T1,T2)', () => {
  it('diff detects dimension changes between two times', () => {
    const { temporal, events } = buildTimeline();
    const d = temporal.diff(events[5].logicalTime, events[50].logicalTime);
    expect(d.result.length).toBeGreaterThan(0);
    expect(d.result.some((entry) => entry.kind === 'added' || entry.kind === 'changed')).toBe(true);
  });

  it('diff of identical times is empty', () => {
    const { temporal, events } = buildTimeline();
    const d = temporal.diff(events[20].logicalTime, events[20].logicalTime);
    expect(d.result).toHaveLength(0);
  });
});

describe('v4 temporal — Trace(Entity) & Join(Signals)', () => {
  it('traceEntity returns every touching event in order', () => {
    const mesh = new EventMesh();
    const temporal = new TemporalEngine();
    const entity = 'entity:checkout-btn';
    const events: EventEnvelope[] = [];
    for (let i = 0; i < 20; i++) {
      const ev = mesh.emit('dom', `mut-${i}`, {}, { entityIds: i % 2 === 0 ? [entity] : ['other'] });
      events.push({ ...ev, logicalTime: i * 10 });
    }
    for (const ev of events) temporal.ingest(ev);
    const trace = temporal.traceEntity(entity);
    expect(trace).toHaveLength(10);
    expect(trace.every((e) => e.entityIds.includes(entity))).toBe(true);
  });

  it('join clusters multi-signal events within a window', () => {
    const mesh = new EventMesh();
    const temporal = new TemporalEngine();
    const events: EventEnvelope[] = [];
    let t = 0;
    // Cluster 1: user+network+runtime within 30ms.
    for (const [source, type] of [['user', 'click'], ['network', 'req'], ['runtime', 'state']] as const) {
      const ev = mesh.emit(source, type, {});
      events.push({ ...ev, logicalTime: t });
      t += 10;
    }
    // Silence 600ms.
    t += 600;
    // Cluster 2: dom+dom.
    for (let i = 0; i < 2; i++) {
      const ev = mesh.emit('dom', `mut-${i}`, {});
      events.push({ ...ev, logicalTime: t });
      t += 10;
    }
    for (const ev of events) temporal.ingest(ev);
    const clusters = temporal.join({ sources: ['user', 'network', 'runtime', 'dom'], withinMs: 250 });
    expect(clusters).toHaveLength(2);
    expect(clusters[0]).toHaveLength(3);
    expect(clusters[1]).toHaveLength(2);
  });

  it('join scoped around an entity filters correctly', () => {
    const mesh = new EventMesh();
    const temporal = new TemporalEngine();
    const events: EventEnvelope[] = [];
    for (let i = 0; i < 6; i++) {
      const ev = mesh.emit('dom', `m${i}`, {}, { entityIds: i < 3 ? ['ent-1'] : ['ent-2'] });
      events.push({ ...ev, logicalTime: i * 5 });
    }
    for (const ev of events) temporal.ingest(ev);
    const clusters = temporal.join({ sources: ['dom'], withinMs: 250, aroundEntityId: 'ent-1' });
    expect(clusters).toHaveLength(1);
    expect(clusters[0]).toHaveLength(3);
  });
});

describe('v4 temporal — FirstChange / LastStable / Window', () => {
  it('firstChange finds the first matching event', () => {
    const { temporal } = buildTimeline();
    const first = temporal.firstChange((e) => e.source === 'network');
    expect(first).not.toBeNull();
    expect(first!.source).toBe('network');
  });

  it('window returns before/at/after around a target time', () => {
    const { temporal } = buildTimeline();
    const w = temporal.window(300, 30);
    expect(w.before.length).toBeGreaterThan(0);
    expect(w.before.length + w.after.length).toBeGreaterThan(0);
  });
});

describe('v4 temporal — StateFrame chunks', () => {
  it('frames reference immutable chunks; materialization is selective', () => {
    const chunks = new ChunkStore();
    const builder = new StateFrameBuilder(chunks);
    const f1 = builder.capture(1, 100, Date.now(), { dom: { nodes: 42 }, network: { reqs: 3 } });
    const f2 = builder.capture(2, 200, Date.now(), { dom: { nodes: 43 }, network: { reqs: 3 } });
    expect(f1.frameId).not.toBe(f2.frameId);
    const domOnly = builder.materialize(f2, ['dom']);
    expect(domOnly).toEqual({ dom: { nodes: 43 } });
    expect(chunks.size).toBe(3); // dom changed, network chunk is shared
  });

  it('chunk store GC drops unreferenced chunks', () => {
    const chunks = new ChunkStore();
    const builder = new StateFrameBuilder(chunks);
    const f1 = builder.capture(1, 100, Date.now(), { dom: { nodes: 1 } });
    const f2 = builder.capture(2, 200, Date.now(), { dom: { nodes: 2 } });
    const dropped = chunks.collect([f2]);
    expect(dropped).toBe(1);
    expect(chunks.get(f1.refs.dom!)).toBeUndefined();
    expect(chunks.get(f2.refs.dom!)).toBeDefined();
  });
});

describe('v4 temporal — Branching never overwrites reality', () => {
  it('branch mutations suppress/modify events; original stream untouched', () => {
    const mesh = new EventMesh();
    const events: EventEnvelope[] = [];
    for (let i = 0; i < 20; i++) {
      const ev = mesh.emit('dom', `mut-${i}`, { i });
      events.push({ ...ev, logicalTime: i * 10 });
    }
    const manager = new BranchManager();
    const branch = manager.fork(events, 50, [
      { kind: 'suppress-mutation', targetSequence: events[7].sequence, reason: 'test' },
      { kind: 'modify-response', targetSequence: events[8].sequence, patch: { status: 200 }, reason: 'test' },
    ]);
    expect(branch.simulatedEvents.some((e) => e.sequence === events[7].sequence)).toBe(false);
    expect(branch.simulatedEvents.find((e) => e.sequence === events[8].sequence)?.payload.status).toBe(200);
    // Reality untouched.
    expect(events[7].payload).toEqual({ i: 7 });
    expect(events[8].payload).toEqual({ i: 8 });
    expect(branch.parentId).toBe('reality');
  });

  it('branch comparison reports outcome deltas', () => {
    const mesh = new EventMesh();
    const events: EventEnvelope[] = [];
    for (let i = 0; i < 10; i++) {
      const ev = mesh.emit('dom', `mut-${i}`, { i });
      events.push({ ...ev, logicalTime: i * 10 });
    }
    const manager = new BranchManager();
    const branch = manager.fork(events, 0, [{ kind: 'suppress-mutation', targetSequence: events[5].sequence, reason: 'r' }]);
    const comparison = manager.compare(branch.branchId, events);
    expect(comparison.outcomeDeltas).toHaveLength(1);
    // The suppressed event's type exists in reality (1) but not the branch (0).
    expect(comparison.outcomeDeltas[0].branchCount).toBe(0);
    expect(comparison.outcomeDeltas[0].realityCount).toBe(1);
  });
});

describe('v4 temporal — 100K event scale', () => {
  it('indexed store tiers and query under 100K events', () => {
    const mesh = new EventMesh();
    const store = new IndexedEventStore(1000); // small hot ring to force tiering
    const events: EventEnvelope[] = [];
    for (let i = 0; i < 100_000; i++) {
      const source = (['dom', 'network', 'runtime'] as const)[i % 3];
      const ev = mesh.emit(source, `t${i % 50}`, { i: i % 20 }, { entityIds: [`e${i % 100}`] });
      store.admit(ev);
      events.push(ev);
    }
    const stats = store.stats();
    expect(stats.events).toBe(100_000);
    expect(stats.tiers.hot).toBeLessThanOrEqual(1250); // hot ring bounded
    expect(stats.tiers.warm + stats.tiers.cold).toBeGreaterThan(90_000);
    const queried = store.query({ entityIds: ['e5'], limit: 10 });
    expect(queried.length).toBe(10);
    expect(queried.every((e) => e.entityIds.includes('e5'))).toBe(true);
    const start = performance.now();
    store.query({ sources: ['dom'] });
    const scanMs = performance.now() - start;
    expect(scanMs).toBeLessThan(2000); // bounded scan
  }, 60_000);
});
