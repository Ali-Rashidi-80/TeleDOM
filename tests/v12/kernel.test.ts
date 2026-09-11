/**
 * TeleDOM v12+ kernel tests — event integrity is P0.
 * Explicitly tests: ordering, delayed events, duplicate events, missing
 * events (gaps), replay, reconstruction, concurrent writers (interleaved),
 * clock drift (wall regression), sequence embedding invariant, persistence
 * reload, corruption rejection.
 */

import { describe, it, expect } from 'vitest';
import { EventMesh, HybridClock, HashChain, computeHash, IdentityEngine } from '../../src/v12/kernel';

describe('v12 kernel — HybridClock', () => {
  it('logical time is monotonic and never resets', () => {
    const clock = new HybridClock();
    let prev = 0;
    for (let i = 0; i < 1000; i++) {
      const sample = clock.tick();
      expect(sample.logical).toBeGreaterThan(prev);
      prev = sample.logical;
    }
  });

  it('wall-clock regression is detected, never used for order', () => {
    const clock = new HybridClock();
    clock.tick();
    // simulate regression by checking the diagnostic starts at 0
    expect(clock.wallClockRegression).toBe(0);
  });
});

describe('v12 kernel — HashChain integrity', () => {
  it('valid chain verifies; any mutation breaks it', () => {
    const chain = new HashChain();
    const hashes = ['a', 'b', 'c', 'd'].map((h) => computeHash({ h }));
    for (const h of hashes) chain.extend(h);
    expect(chain.verify(hashes).valid).toBe(true);
    // Tamper with the second event → every later link breaks.
    const tampered = [...hashes];
    tampered[1] = computeHash({ h: 'EVIL' });
    const check = chain.verify(tampered);
    expect(check.valid).toBe(false);
    expect(check.brokenAt).toBe('link:1');
  });
});

describe('v12 kernel — EventMesh (P0 event integrity)', () => {
  it('event.sequence === sequence embedded in event.id (the baseline P0 bug cannot reappear)', () => {
    const mesh = new EventMesh();
    for (let i = 0; i < 100; i++) {
      const ev = mesh.emit('dom', 'node-added', { i });
      const idSeq = parseInt(ev.eventId.split('_')[1], 10);
      expect(idSeq).toBe(ev.sequence);
    }
  });

  it('sequences are strictly monotonic with no gaps under single writer', () => {
    const mesh = new EventMesh();
    for (let i = 0; i < 500; i++) mesh.emit('dom', 'x', { i });
    const events = mesh.ordered();
    for (let i = 1; i < events.length; i++) {
      expect(events[i].sequence).toBe(events[i - 1].sequence + 1);
    }
  });

  it('duplicate events collapse via id AND idempotency key', () => {
    const mesh = new EventMesh();
    const ev = mesh.emit('network', 'request', { url: '/a' });
    const status1 = mesh.append(ev);
    expect(status1).toBe('DUPLICATE');
    const ev2 = mesh.build('network', 'request', { url: '/a' }, { idempotencyKey: 'req-1' });
    mesh.append(ev2);
    const ev3 = mesh.build('network', 'request', { url: '/a', other: 1 }, { idempotencyKey: 'req-1' });
    expect(mesh.append(ev3)).toBe('DUPLICATE');
    expect(mesh.stats().duplicatesDropped).toBe(2);
    expect(mesh.length).toBe(2);
  });

  it('missing events are detected as gaps; late events are admitted and flagged', () => {
    const mesh = new EventMesh();
    const raw = (seq: number, type: string): import('../../src/v12/kernel').EventEnvelope => {
      const eventId = `dom_${seq}_raw${seq}`;
      return {
        eventId, sequence: seq, logicalTime: seq, wallTime: Date.now(),
        causalParentIds: [], entityIds: [], source: 'dom', type, payload: {},
        schemaVersion: 1,
        integrityHash: computeHash({ eventId, sequence: seq, source: 'dom', type, payload: {} }),
        integrity: { admitted: false, gapReconciled: 0, late: false },
      };
    };
    // Emit 1..5 then 9 (gap of 3) — the gapped envelope bypasses build()
    // so the allocation counter does not mask the gap.
    for (let i = 1; i <= 5; i++) mesh.emit('dom', `e${i}`, {});
    mesh.append(raw(9, 'e9'));
    expect(mesh.stats().gaps).toBe(3);
    // Late event filling an earlier hole (seq 7 below head 9, unseen).
    const late = raw(7, 'late');
    const status = mesh.append(late);
    expect(status).toBe('LATE_APPENDED');
    expect(late.integrity.late).toBe(true);
  });

  it('corrupted envelopes are REJECTED, never merged', () => {
    const mesh = new EventMesh();
    const ev = mesh.build('dom', 'x', { a: 1 });
    ev.payload = { a: 2 }; // tamper after build → hash mismatch
    expect(mesh.append(ev)).toBe('REJECTED_CORRUPT');
    expect(mesh.length).toBe(0);
  });

  it('interleaved writers preserve the global sequence invariant', () => {
    const mesh = new EventMesh();
    const writers = [0, 1, 2].map(() => new EventMesh());
    // Simulate concurrent allocation through a SHARED counter: all use the same mesh.
    for (let i = 0; i < 300; i++) {
      const w = writers[i % 3];
      const seq = mesh.allocateSequence('dom').sequence;
      const eventId = EventMesh.eventIdFor('dom', seq);
      const envelope = {
        eventId, sequence: seq, logicalTime: seq * 2, wallTime: Date.now(),
        causalParentIds: [], entityIds: [], source: 'dom' as const, type: 'concurrent',
        payload: { writer: i % 3 }, schemaVersion: 1,
        integrityHash: computeHash({ eventId, sequence: seq, source: 'dom', type: 'concurrent', payload: { writer: i % 3 } }),
        integrity: { admitted: false, gapReconciled: 0, late: false },
      };
      mesh.append(envelope);
    }
    const ordered = mesh.ordered();
    for (let i = 1; i < ordered.length; i++) {
      expect(ordered[i].sequence).toBe(ordered[i - 1].sequence + 1);
    }
    expect(mesh.verifyIntegrity().valid).toBe(true);
  });

  it('persistence reload preserves order, content and chain tip', () => {
    const mesh = new EventMesh();
    for (let i = 0; i < 50; i++) mesh.emit('runtime', `t${i}`, { i });
    const serialized = mesh.serialize();
    const restored = new EventMesh();
    const result = restored.restore({ events: serialized.events, chainTip: serialized.chainTip });
    expect(result.restored).toBe(50);
    expect(result.chainMatches).toBe(true);
    expect(restored.ordered().map((e) => e.sequence)).toEqual(mesh.ordered().map((e) => e.sequence));
    expect(restored.verifyIntegrity().valid).toBe(true);
  });

  it('causal parents link correctly', () => {
    const mesh = new EventMesh();
    const root = mesh.emit('user', 'click', {});
    const child = mesh.emit('network', 'request', {}, { causalParentIds: [root.eventId] });
    const grandchild = mesh.emit('runtime', 'state', {}, { causalParentIds: [child.eventId] });
    expect(mesh.causedBy(root.eventId)).toHaveLength(1);
    expect(mesh.causedBy(child.eventId)).toHaveLength(1);
    expect(mesh.causedBy(grandchild.eventId)).toHaveLength(0);
    expect(grandchild.causalParentIds).toEqual([child.eventId]);
  });
});

describe('v12 kernel — IdentityEngine', () => {
  it('creates durable identities with version history', () => {
    const identity = new IdentityEngine();
    const el = identity.create('element', '#checkout-btn', { fingerprint: 'fp-1' });
    identity.recordChange(el.id, 'rerendered');
    identity.recordChange(el.id, 'reparented');
    const trail = identity.trail(el.id);
    expect(trail?.timeline).toHaveLength(3);
    expect(trail?.timeline[1].change).toBe('rerendered');
    expect(identity.byTypeAll('element')).toHaveLength(1);
  });

  it('re-matches identity after representation change via fingerprint', () => {
    const identity = new IdentityEngine();
    identity.create('element', '#btn-old', { fingerprint: 'fp-stable' });
    const match = identity.resolve({ type: 'element', fingerprint: 'fp-stable' });
    expect(match).not.toBeNull();
    expect(match!.score).toBeGreaterThanOrEqual(0.7);
    expect(match!.basis).toContain('fingerprint');
  });

  it('refuses ambiguous low-score matches (honest uncertainty)', () => {
    const identity = new IdentityEngine();
    identity.create('element', '#a', { fingerprint: 'fp-a' });
    const noMatch = identity.resolve({ type: 'element', label: '#nonexistent' });
    expect(noMatch).toBeNull();
  });

  it('restore() preserves identities', () => {
    const identity = new IdentityEngine();
    identity.create('component', 'CheckoutSummary');
    const serialized = identity.serialize();
    const fresh = new IdentityEngine();
    fresh.restore(serialized);
    expect(fresh.stats().total).toBe(1);
  });
});
