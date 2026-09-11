/**
 * TeleDOM v12+ evidence + causality + verification tests.
 * Key invariants: correlation ≠ causation, INCONCLUSIVE never becomes
 * PASS, proof records verify, confidence derives from provenance.
 */

import { describe, it, expect } from 'vitest';
import { EvidenceGraph } from '../../src/v12/evidence/graph';
import { assessConfidence } from '../../src/v12/evidence/confidence';
import { CausalEngine } from '../../src/v12/causality/engine';
import { EventMesh, EventEnvelope } from '../../src/v12/kernel';
import { VerificationEngine, ProofEngine } from '../../src/v12/verification';
import { CounterfactualEngine } from '../../src/v12/simulation';
import { PredictionEngine } from '../../src/v12/simulation';

function checkoutFailureStream(): EventEnvelope[] {
  const mesh = new EventMesh();
  const events: EventEnvelope[] = [];
  let t = 1000;
  const entity = 'entity:checkout-btn';
  const chain: [string, string][] = [
    ['user', 'click-submit'],
    ['network', 'request-failed'],
    ['console', 'error-log'],
    ['runtime', 'state-update'],
    ['dom', 'ancestor-rerender'],
    ['dom', 'node-removed'],
  ];
  let parent: string | undefined;
  for (const [source, type] of chain) {
    const ev = mesh.emit(source as any, type, { case: 'checkout' }, { entityIds: [entity], causalParentIds: parent ? [parent] : [] });
    parent = ev.eventId;
    events.push({ ...ev, logicalTime: t });
    t += 30;
  }
  return events;
}

describe('v12 evidence graph', () => {
  it('typed nodes + edges with provenance; content-addressed dedup', () => {
    const graph = new EvidenceGraph();
    const n1 = graph.addNode('UserAction', 'user clicked submit', { seq: 1 });
    const n1again = graph.addNode('UserAction', 'user clicked submit', { seq: 1 });
    expect(n1.id).toBe(n1again.id);
    const n2 = graph.addNode('NetworkRequest', 'POST /checkout failed', { seq: 2 });
    const n3 = graph.addNode('DOMMutation', 'button removed', { seq: 3 });
    graph.addEdge(n1, n2, 'CAUSES', ['rule:user→network', 'event:seq2'], 0.8);
    graph.addEdge(n2, n3, 'CAUSES', ['rule:network→dom'], 0.75);
    graph.addEdge(n2, n3, 'CAUSES', ['corroboration:chain'], 0.75); // strengthens
    const edges = graph.edgesAll({ edgeTypes: ['CAUSES'] });
    expect(edges).toHaveLength(2);
    expect(edges.find((e) => e.from === n2.id && e.to === n3.id)!.confidence).toBeGreaterThan(0.75);
    expect(graph.stats().nodes).toBe(3);
  });

  it('bounded graph degrades gracefully instead of crashing', () => {
    const graph = new EvidenceGraph(10);
    for (let i = 0; i < 50; i++) graph.addNode('DOMMutation', `m${i}`, { i });
    expect(graph.stats().degraded).toBe(true);
    expect(graph.stats().nodes).toBeLessThanOrEqual(12);
  });

  it('neighbors + paths support explain chains', () => {
    const graph = new EvidenceGraph();
    const a = graph.addNode('UserAction', 'a');
    const b = graph.addNode('NetworkRequest', 'b');
    const c = graph.addNode('DOMMutation', 'c');
    graph.addEdge(a, b, 'TRIGGERS', ['t'], 0.9);
    graph.addEdge(b, c, 'CAUSES', ['t'], 0.9);
    expect(graph.neighbors(a.id, 2)).toHaveLength(3);
    const paths = graph.paths(a.id, c.id);
    expect(paths).toHaveLength(1);
    expect(paths[0]).toHaveLength(2);
  });
});

describe('v12 confidence — evidence before assertions', () => {
  it('no provenance → UNKNOWN, confidence 0', () => {
    const assessment = assessConfidence({ provenance: [], corroboration: 0, verified: false, contradicted: false });
    expect(assessment.classification).toBe('UNKNOWN');
    expect(assessment.confidence).toBe(0);
  });

  it('verified direct observation with corroboration → VERIFIED', () => {
    const assessment = assessConfidence({
      provenance: [{ origin: 'mesh', quality: 'direct-observation', evidenceRefs: ['e1'], recordedAt: Date.now() }],
      corroboration: 2,
      verified: true,
      contradicted: false,
    });
    expect(assessment.confidence).toBeGreaterThan(0.9);
    expect(assessment.classification).toBe('VERIFIED');
  });

  it('counterevidence halves confidence and can disprove', () => {
    const assessment = assessConfidence({
      provenance: [{ origin: 'h', quality: 'inferred', evidenceRefs: [], recordedAt: Date.now() }],
      corroboration: 0,
      verified: false,
      contradicted: true,
    });
    expect(assessment.confidence).toBeLessThan(0.35);
  });

  it('kernel uncertainty downgrades confidence', () => {
    const base = assessConfidence({
      provenance: [{ origin: 'mesh', quality: 'direct-observation', evidenceRefs: ['e'], recordedAt: Date.now() }],
      corroboration: 0, verified: false, contradicted: false,
    });
    const downgraded = assessConfidence({
      provenance: [{ origin: 'mesh', quality: 'direct-observation', evidenceRefs: ['e'], recordedAt: Date.now() }],
      corroboration: 0, verified: false, contradicted: false, kernelConfidenceMultiplier: 0.4,
    });
    expect(downgraded.confidence).toBeLessThan(base.confidence);
  });
});

describe('v12 causal engine — correlation ≠ causation', () => {
  it('builds the checkout causal chain and ranks hypotheses', () => {
    const events = checkoutFailureStream();
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const symptom = events[events.length - 1];
    const hypotheses = causal.generateHypotheses(symptom, events, 250);
    expect(hypotheses.length).toBeGreaterThan(0);
    const best = hypotheses[0];
    expect(best.rank).toBe(1);
    expect(best.causalChain).not.toBeNull();
    expect(best.causalChain!.rootCause).toContain('click-submit');
    // Chain ordered root → symptom.
    expect(best.causalChain!.events[0].type).toBe('click-submit');
    expect(best.causalChain!.events[best.causalChain!.events.length - 1].type).toBe('node-removed');
    // Alternatives and verification method exposed.
    expect(best.verificationMethod).toContain('counterfactual');
  });

  it('links carry classification, confidence, evidence and alternatives', () => {
    const events = checkoutFailureStream();
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const links = causal.correlate(events, 250);
    expect(links.length).toBeGreaterThan(3);
    for (const link of links) {
      expect(link.confidence).toBeGreaterThan(0);
      expect(link.confidence).toBeLessThanOrEqual(1);
      expect(link.evidence.length).toBeGreaterThan(0);
      expect(Array.isArray(link.alternatives)).toBe(true);
    }
    // rule-supported + shared entity → SUPPORTED
    expect(links.some((l) => l.classification === 'SUPPORTED')).toBe(true);
  });

  it('noise outside the window is not correlated', () => {
    const mesh = new EventMesh();
    const events: EventEnvelope[] = [
      { ...mesh.emit('dom', 'far-noise', {}), logicalTime: 0 },
      { ...mesh.emit('dom', 'symptom', {}), logicalTime: 5000 },
    ];
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const links = causal.correlate(events, 250);
    expect(links).toHaveLength(0);
  });

  it('earliestDivergence finds the split point between streams', () => {
    const mesh = new EventMesh();
    const a: EventEnvelope[] = [];
    for (let i = 0; i < 5; i++) a.push({ ...mesh.emit('dom', `m${i}`, {}), logicalTime: i * 10 });
    const b = a.filter((_, i) => i !== 3);
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    expect(causal.earliestDivergence(a, b)?.sequence).toBe(a[3].sequence);
  });
});

describe('v12 verification — no synthetic success', () => {
  const verifier = new VerificationEngine();

  const contract = {
    action: 'verify checkout fix',
    preconditions: [],
    expectedBehavior: 'button remains visible',
    mustHold: [
      { description: 'button present', check: (obs: Record<string, unknown>) => obs.buttonPresent === true },
    ],
    mustNotHold: [
      { description: 'no runtime error', check: (obs: Record<string, unknown>) => obs.runtimeError === true },
    ],
    timeWindowMs: 2000,
    evidenceRequired: ['postcondition-screenshot', 'network-log'],
  };

  it('PASS requires postconditions AND required evidence', () => {
    const report = verifier.verify(contract, { buttonPresent: true }, [{ ref: 'postcondition-screenshot' }, { ref: 'network-log' }]);
    expect(report.result).toBe('PASS');
  });

  it('missing evidence → INCONCLUSIVE (never PASS)', () => {
    const report = verifier.verify(contract, { buttonPresent: true }, [{ ref: 'postcondition-screenshot' }]);
    expect(report.result).toBe('INCONCLUSIVE');
    expect(report.missingEvidence).toEqual(['network-log']);
  });

  it('failed postcondition → FAIL', () => {
    const report = verifier.verify(contract, { buttonPresent: true, runtimeError: true }, [{ ref: 'postcondition-screenshot' }, { ref: 'network-log' }]);
    expect(report.result).toBe('FAIL');
  });

  it('throwing checks count as failed, not crashed', () => {
    const badContract = {
      ...contract,
      mustHold: [{ description: 'throws', check: () => { throw new Error('boom'); } }],
    };
    const report = verifier.verify(badContract, {}, []);
    expect(report.result).toBe('FAIL');
  });
});

describe('v12 proof engine', () => {
  it('proofs verify and tampering breaks them', () => {
    const engine = new ProofEngine();
    const proof = engine.generate(
      [{ statement: 'root cause is X', evidenceNodeIds: ['n1'], confidence: 0.9 }],
      [{ step: 1, statement: 'observed', justification: 'e1', evidenceRefs: ['e1'] }],
      'X is the root cause',
      'PASS',
    );
    expect(engine.verifyProof(proof)).toBe(true);
    const tampered = { ...proof, conclusion: 'Y is the root cause' };
    expect(engine.verifyProof(tampered)).toBe(false);
  });

  it('proofs chain via previousProofHash', () => {
    const engine = new ProofEngine();
    const p1 = engine.generate([{ statement: 'a', evidenceNodeIds: [], confidence: 1 }], [], 'A', 'PASS');
    const p2 = engine.generate([{ statement: 'b', evidenceNodeIds: [], confidence: 1 }], [], 'B', 'PASS');
    expect(p2.previousProofHash).toBe(p1.proofHash);
  });
});

describe('v12 counterfactual — what-if debugging', () => {
  it('suppressing the real cause removes the symptom → CAUSE_SUPPPORTED', () => {
    const events = checkoutFailureStream();
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const rootCause = events[1]; // request-failed
    const outcome = counterfactual.run(
      events,
      { kind: 'suppress-event', targetSequence: rootCause.sequence, reason: 'test suppression' },
      (e) => e.type === 'node-removed',
    );
    expect(outcome.verdict).toBe('CAUSE_SUPPPORTED');
    expect(outcome.symptomResolved).toBe(true);
    expect(outcome.confidence).toBeGreaterThan(0.7);
    expect(outcome.evidenceRefs.length).toBeGreaterThan(0);
  });

  it('suppressing an unrelated event → NOT_SUPPORTED', () => {
    const events = checkoutFailureStream();
    // Append a genuinely unrelated event (no causal parent, no shared entity)
    // AFTER the symptom — its suppression cannot affect the symptom.
    const mesh = new EventMesh();
    const unrelated = mesh.emit('console', 'unrelated-log', { noise: true }, { entityIds: ['entity:other'] });
    const stream = [...events, { ...unrelated, sequence: 999, logicalTime: 5000 }];
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const outcome = counterfactual.run(
      stream,
      { kind: 'suppress-event', targetSequence: 999, reason: 'control' },
      (e) => e.type === 'node-removed',
    );
    // Symptom still occurs → not supported as cause.
    expect(outcome.verdict).toBe('NOT_SUPPORTED');
  });

  it('counterfactual never mutates the original stream', () => {
    const events = checkoutFailureStream();
    const before = JSON.stringify(events.map((e) => e.payload));
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    counterfactual.run(events, { kind: 'suppress-event', targetSequence: events[1].sequence, reason: 'r' }, () => true);
    expect(JSON.stringify(events.map((e) => e.payload))).toBe(before);
  });
});

describe('v12 prediction — guesses are never facts', () => {
  it('predictions expose confidence, assumptions, horizon and verification path', () => {
    const mesh = new EventMesh();
    const recent: EventEnvelope[] = [
      { ...mesh.emit('network', 'request-failed', {}), logicalTime: 100 },
      { ...mesh.emit('network', 'request-error', {}), logicalTime: 110 },
    ];
    const engine = new PredictionEngine();
    const predictions = engine.predict({ recentEvents: recent, horizonMs: 5000 });
    expect(predictions.length).toBeGreaterThan(0);
    for (const p of predictions) {
      expect(p.confidence).toBeLessThan(1);
      expect(p.assumptions.length).toBeGreaterThan(0);
      expect(p.counterevidence.length).toBeGreaterThanOrEqual(0);
      expect(p.verificationPath).toContain('td_');
      expect(p.timeHorizonMs).toBeGreaterThan(0);
    }
  });

  it('no trigger patterns → no predictions (no noise)', () => {
    const engine = new PredictionEngine();
    expect(engine.predict({ recentEvents: [], horizonMs: 1000 })).toHaveLength(0);
  });
});
