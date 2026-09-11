/**
 * TeleDOM v12+ incident + investigation + .tdom tests — including the
 * §78 FINAL SELF-CHALLENGE end-to-end workflow.
 */

import { describe, it, expect } from 'vitest';
import { EventMesh, EventEnvelope } from '../../src/v12/kernel';
import { EvidenceGraph } from '../../src/v12/evidence/graph';
import { CausalEngine } from '../../src/v12/causality/engine';
import { CounterfactualEngine } from '../../src/v12/simulation';
import { IncidentManager, AutonomousInvestigator, TdomFormat } from '../../src/v12/incident';
import { TeleDOMPlatform } from '../../src/v12/platform';
import { SafeMutationEngine, MutationPlan, MutationScope } from '../../src/v12/mutation';

function recordedCheckoutSession(): { platform: TeleDOMPlatform; sessionId: string; events: EventEnvelope[] } {
  const platform = new TeleDOMPlatform();
  const sessionId = 'sess-checkout-1';
  const mesh = platform.session(sessionId).mesh;
  const events: EventEnvelope[] = [];
  let t = 1000;
  const entity = 'entity:checkout-btn';
  const chain: [string, string][] = [
    ['user', 'click-submit'],
    ['network', 'request-failed'],
    ['runtime', 'state-update'],
    ['dom', 'ancestor-rerender'],
  ];
  let parent: string | undefined;
  for (const [source, type] of chain) {
    const ev = mesh.emit(source as any, type, { case: 'checkout' }, { entityIds: [entity], causalParentIds: parent ? [parent] : [] });
    parent = ev.eventId;
    events.push({ ...ev, logicalTime: t });
    t += 30;
  }
  const symptom = mesh.emit('dom', 'node-removed', { case: 'checkout' }, { entityIds: [entity], causalParentIds: parent ? [parent] : [] });
  events.push({ ...symptom, logicalTime: t });
  platform.importEvents(sessionId, events.map((e) => ({ ...e })));
  return { platform, sessionId, events };
}

describe('v12 incident lifecycle', () => {
  it('enforces explicit valid transitions with audit trail', () => {
    const manager = new IncidentManager();
    const incident = manager.create('why does checkout freeze');
    manager.transition(incident.incidentId, 'SCOPED', 'scoped');
    manager.transition(incident.incidentId, 'OBSERVING', 'observing');
    manager.transition(incident.incidentId, 'REPRODUCED', 'reproduced');
    manager.transition(incident.incidentId, 'ANALYZING', 'analyzing');
    manager.transition(incident.incidentId, 'HYPOTHESIS_FORMED', '3 hypotheses');
    manager.transition(incident.incidentId, 'VERIFYING', 'verifying');
    manager.transition(incident.incidentId, 'REMEDIATING', 'applying fix');
    manager.transition(incident.incidentId, 'RETESTING', 're-run');
    manager.transition(incident.incidentId, 'RESOLVED', 'verified');
    expect(manager.get(incident.incidentId)!.state).toBe('RESOLVED');
    expect(manager.get(incident.incidentId)!.audit).toHaveLength(9);
  });

  it('rejects invalid transitions', () => {
    const manager = new IncidentManager();
    const incident = manager.create('objective');
    expect(() => manager.transition(incident.incidentId, 'RESOLVED', 'skip')).toThrow(/invalid lifecycle transition/);
    manager.transition(incident.incidentId, 'ABANDONED', 'no scope');
    expect(() => manager.transition(incident.incidentId, 'SCOPED', 'terminal')).toThrow(/terminal/);
  });
});

describe('v12 autonomous investigation (§78 final self-challenge core)', () => {
  it('end-to-end: objective → causal chain → hypothesis → counterfactual → verification → proof', async () => {
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const investigator = new AutonomousInvestigator(causal, counterfactual);
    const { events } = recordedCheckoutSession();
    const result = await investigator.investigate('Why does the checkout button disappear after submit?', {
      events,
      symptomPredicate: (e) => e.type === 'node-removed',
    });
    expect(result.status).toBe('RESOLVED');
    expect(result.rootCause).toContain('click-submit');
    expect(result.bestHypothesis).not.toBeNull();
    expect(result.counterfactual?.verdict).toBe('CAUSE_SUPPPORTED');
    expect(result.verificationStatus).toBe('PASS');
    expect(result.proofId).not.toBeNull();
    // Plan executed every step.
    const executed = result.plan.steps.filter((s) => s.status === 'DONE');
    expect(executed.length).toBe(result.plan.steps.length);
    // Incident terminal state.
    expect(result.incident.state).toBe('RESOLVED');
    // Learning recorded.
    expect(result.incident.lessons.length).toBeGreaterThan(0);
  });

  it('returns INCONCLUSIVE (not fake PASS) when the symptom is absent', async () => {
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const investigator = new AutonomousInvestigator(causal, counterfactual);
    const mesh = new EventMesh();
    const events = [{ ...mesh.emit('dom', 'normal-mutation', {}), logicalTime: 10 }];
    const result = await investigator.investigate('ghost bug', { events, symptomPredicate: () => false });
    expect(result.status).toBe('INCONCLUSIVE');
    expect(result.warnings.join(' ')).toContain('symptom');
  });

  it('plans are resumable objects', async () => {
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const investigator = new AutonomousInvestigator(causal, counterfactual);
    const { events } = recordedCheckoutSession();
    const result = await investigator.investigate('checkout freeze', { events, symptomPredicate: (e) => e.type === 'node-removed' });
    const plan = investigator.getPlan(result.plan.incidentId);
    expect(plan).toBeDefined();
    expect(plan!.resumable).toBe(false);
    expect(plan!.completedThrough).toBe(plan!.steps.length);
  });
});

describe('v12 .tdom portable format', () => {
  it('export → import round-trip preserves content and integrity', () => {
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const investigator = new AutonomousInvestigator(causal, counterfactual);
    const { events } = recordedCheckoutSession();
    return investigator.investigate('checkout freeze', { events, symptomPredicate: (e) => e.type === 'node-removed' }).then((result) => {
      const tdom = new TdomFormat();
      const exported = tdom.export(result.incident);
      expect(exported.bytes.length).toBeGreaterThan(500);
      expect(exported.manifest.format).toBe('tdom');
      expect(Object.keys(exported.manifest.sections).length).toBeGreaterThanOrEqual(10);
      const imported = tdom.import(exported.bytes);
      expect(imported.integrityValid).toBe(true);
      expect(imported.content.incident.objective).toBe('checkout freeze');
      expect(imported.compatibility.ok).toBe(true);
    });
  });

  it('compressed export round-trips', () => {
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const investigator = new AutonomousInvestigator(causal, counterfactual);
    const { events } = recordedCheckoutSession();
    return investigator.investigate('checkout freeze', { events, symptomPredicate: (e) => e.type === 'node-removed' }).then((result) => {
      const tdom = new TdomFormat();
      const exported = tdom.export(result.incident, { compress: true });
      expect(exported.manifest.compression).toBe('gzip');
      const imported = tdom.import(exported.bytes);
      expect(imported.integrityValid).toBe(true);
    });
  });

  it('tamper detection: modified section breaks integrity', async () => {
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const investigator = new AutonomousInvestigator(causal, counterfactual);
    const { events } = recordedCheckoutSession();
    const result = await investigator.investigate('checkout freeze', { events, symptomPredicate: (e) => e.type === 'node-removed' });
    const tdom = new TdomFormat();
    const exported = tdom.export(result.incident);
    const raw = JSON.parse(exported.bytes.toString('utf-8'));
    raw.content.incident.objective = 'TAMPERED';
    const tamperedBytes = Buffer.from(JSON.stringify(raw), 'utf-8');
    const imported = tdom.import(tamperedBytes);
    expect(imported.integrityValid).toBe(false);
    expect(imported.brokenSection).toBe('incident');
  });
});

describe('v12 safe mutation transactions', () => {
  it('successful transaction: scope → risk → preconditions → simulate → apply → observe → verify → commit', async () => {
    const engine = new SafeMutationEngine();
    const state = new Map<string, Record<string, unknown>>();
    const adapter = {
      apply: async (plan: MutationPlan) => { state.set(plan.targetSelector, { ...(state.get(plan.targetSelector) ?? {}), ...plan.payload, mutated: true }); return state.get(plan.targetSelector)!; },
      observe: async (sel: string) => state.get(sel) ?? {},
      restore: async (sel: string, before: Record<string, unknown>) => { state.set(sel, before); return true; },
      simulate: async () => ({ outcomePredicted: 'attribute set', affectedComponents: ['Form'], predictedImpact: 'low' }),
    };
    const scope: MutationScope = { allowedSelectors: ['#btn'], allowedOrigins: [] };
    const tx = await engine.execute(
      { operation: 'set-attribute', targetSelector: '#btn', payload: { disabled: 'false' }, reason: 'enable button' },
      scope,
      adapter,
      { verifyPostconditions: (after) => ({ status: after.mutated === true ? 'PASS' : 'FAIL', details: ['mutation observable'] }) },
    );
    expect(tx.phase).toBe('COMMITTED');
    expect(tx.audit.join(' ')).toContain('committed');
    expect(tx.rollbackAvailable).toBe(false);
  });

  it('verification failure triggers rollback', async () => {
    const engine = new SafeMutationEngine();
    const state = new Map<string, Record<string, unknown>>();
    const adapter = {
      apply: async (plan: MutationPlan) => { state.set(plan.targetSelector, { mutated: true }); return {}; },
      observe: async (sel: string) => state.get(sel) ?? {},
      restore: async (sel: string, before: Record<string, unknown>) => { state.set(sel, before); return true; },
      simulate: async () => ({ outcomePredicted: 'x', affectedComponents: [], predictedImpact: 'low' }),
    };
    const tx = await engine.execute(
      { operation: 'set-attribute', targetSelector: '#btn', payload: { a: 1 }, reason: 'r' },
      { allowedSelectors: [], allowedOrigins: [] },
      adapter,
      { verifyPostconditions: () => ({ status: 'FAIL' as const, details: ['button vanished'] }) },
    );
    expect(tx.phase).toBe('ROLLED_BACK');
    expect(tx.audit.join(' ')).toContain('rolled back');
  });

  it('out-of-scope mutations are rejected before apply', async () => {
    const engine = new SafeMutationEngine();
    let applied = false;
    const adapter = {
      apply: async () => { applied = true; return {}; },
      observe: async () => ({}),
      restore: async () => true,
      simulate: async () => ({ outcomePredicted: '', affectedComponents: [], predictedImpact: '' }),
    };
    const tx = await engine.execute(
      { operation: 'set-attribute', targetSelector: '#other', payload: {}, reason: 'r' },
      { allowedSelectors: ['#allowed-only'], allowedOrigins: [] },
      adapter,
    );
    expect(tx.phase).toBe('SCOPE_REJECTED');
    expect(applied).toBe(false);
  });

  it('destructive operations are blocked by default', async () => {
    const engine = new SafeMutationEngine();
    const adapter = {
      apply: async () => ({}),
      observe: async () => ({ x: 1 }),
      restore: async () => true,
      simulate: async () => ({ outcomePredicted: '', affectedComponents: [], predictedImpact: '' }),
    };
    const tx = await engine.execute(
      { operation: 'remove-node', targetSelector: '#root', payload: {}, reason: 'r' },
      { allowedSelectors: [], allowedOrigins: [] },
      adapter,
    );
    expect(tx.phase).toBe('RISK_REJECTED');
    expect(tx.risk).toBe('DESTRUCTIVE');
    expect(tx.audit.join(' ')).toContain('destructive');
  });
});
