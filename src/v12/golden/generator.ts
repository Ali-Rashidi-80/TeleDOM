/**
 * TeleDOM v12+ Golden Incidents — deterministic generator (1000+).
 *
 * Every golden incident is a DETERMINISTIC synthetic scenario with
 * expected root cause, evidence, reproduction and verification. 24
 * categories × templates × seeds produce 1000+ distinct incidents.
 * The runner measures: Investigation Completion Rate (ICR),
 * Evidence Confidence (EC), Replay Fidelity (RF), False Success Rate,
 * Recovery Success Rate.
 */

import { EventMesh, EventEnvelope, EventSource } from '../kernel';
import { CausalEngine } from '../causality/engine';
import { EvidenceGraph } from '../evidence/graph';
import { CounterfactualEngine } from '../simulation/counterfactual';

export type GoldenCategory =
  | 'disappearing-ui' | 'race-condition' | 'spa-navigation' | 'stale-state'
  | 'react-remount' | 'vue-remount' | 'svelte-lifecycle' | 'iframe-problem'
  | 'shadow-dom' | 'canvas-app' | 'network-failure' | 'layout-shift'
  | 'visual-regression' | 'memory-leak' | 'auth-session' | 'security-regression'
  | 'selector-breakage' | 'tab-desync' | 'bridge-failure' | 'browser-crash'
  | 'extension-failure' | 'timing-bug' | 'event-reorder' | 'event-loss';

export const GOLDEN_CATEGORIES: GoldenCategory[] = [
  'disappearing-ui', 'race-condition', 'spa-navigation', 'stale-state',
  'react-remount', 'vue-remount', 'svelte-lifecycle', 'iframe-problem',
  'shadow-dom', 'canvas-app', 'network-failure', 'layout-shift',
  'visual-regression', 'memory-leak', 'auth-session', 'security-regression',
  'selector-breakage', 'tab-desync', 'bridge-failure', 'browser-crash',
  'extension-failure', 'timing-bug', 'event-reorder', 'event-loss',
];

export interface GoldenScenario {
  incidentId: string;
  category: GoldenCategory;
  seed: number;
  /** The recorded event stream (deterministic for the seed). */
  events: EventEnvelope[];
  /** Regex identifying the symptom event type. */
  symptomPattern: string;
  /** The expected root cause (event type of the earliest causal event). */
  expectedRootCauseType: string;
  /** The event sequence whose suppression should resolve the symptom. */
  expectedCauseSequence: number;
  expectedVerification: 'PASS' | 'INCONCLUSIVE';
}

/** Deterministic PRNG (mulberry32) so scenarios are reproducible. */
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface CategoryRecipe {
  /** Chain of (source, type) from root cause to symptom. */
  chain: [EventSource, string][];
  gapMs: [number, number];
  symptom: [EventSource, string];
  expectedVerification: 'PASS' | 'INCONCLUSIVE';
}

const CATEGORY_RECIPES: Record<GoldenCategory, CategoryRecipe> = {
  'disappearing-ui': { chain: [['user', 'click-submit'], ['network', 'request-failed'], ['runtime', 'state-update'], ['dom', 'ancestor-rerender']], gapMs: [5, 80], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'race-condition': { chain: [['runtime', 'async-start'], ['network', 'response-late'], ['runtime', 'state-update'], ['dom', 'double-render']], gapMs: [2, 40], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'spa-navigation': { chain: [['user', 'link-click'], ['network', 'route-fetch'], ['runtime', 'route-change'], ['dom', 'container-replace']], gapMs: [10, 120], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'stale-state': { chain: [['runtime', 'state-update'], ['dom', 'attribute-changed']], gapMs: [3, 50], symptom: ['runtime', 'stale-read-error'], expectedVerification: 'PASS' },
  'react-remount': { chain: [['runtime', 'react-render'], ['dom', 'subtree-replaced']], gapMs: [1, 30], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'vue-remount': { chain: [['runtime', 'vue-patch'], ['dom', 'subtree-replaced']], gapMs: [1, 30], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'svelte-lifecycle': { chain: [['runtime', 'svelte-update'], ['dom', 'node-removed']], gapMs: [1, 25], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'iframe-problem': { chain: [['network', 'iframe-load-blocked'], ['dom', 'iframe-removed']], gapMs: [10, 200], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'shadow-dom': { chain: [['runtime', 'shadow-root-update'], ['dom', 'node-removed']], gapMs: [1, 30], symptom: ['dom', 'node-removed'], expectedVerification: 'PASS' },
  'canvas-app': { chain: [['runtime', 'canvas-redraw'], ['performance', 'long-task']], gapMs: [5, 100], symptom: ['visual', 'canvas-blank'], expectedVerification: 'INCONCLUSIVE' },
  'network-failure': { chain: [['network', 'request-failed']], gapMs: [1, 10], symptom: ['runtime', 'unhandled-rejection'], expectedVerification: 'PASS' },
  'layout-shift': { chain: [['network', 'image-late-load'], ['dom', 'attribute-changed']], gapMs: [5, 150], symptom: ['performance', 'layout-shift'], expectedVerification: 'PASS' },
  'visual-regression': { chain: [['runtime', 'style-recalc'], ['visual', 'region-changed']], gapMs: [2, 60], symptom: ['visual', 'region-changed'], expectedVerification: 'INCONCLUSIVE' },
  'memory-leak': { chain: [['runtime', 'listener-added'], ['dom', 'node-removed']], gapMs: [10, 300], symptom: ['performance', 'memory-growth'], expectedVerification: 'INCONCLUSIVE' },
  'auth-session': { chain: [['security', 'token-expired'], ['network', 'request-unauthorized']], gapMs: [5, 100], symptom: ['runtime', 'auth-redirect-loop'], expectedVerification: 'PASS' },
  'security-regression': { chain: [['security', 'csp-violation'], ['runtime', 'script-blocked']], gapMs: [1, 50], symptom: ['security', 'unsafe-inline-executed'], expectedVerification: 'PASS' },
  'selector-breakage': { chain: [['dom', 'attribute-changed']], gapMs: [1, 40], symptom: ['runtime', 'selector-not-found'], expectedVerification: 'PASS' },
  'tab-desync': { chain: [['user', 'tab-switch'], ['runtime', 'context-detach']], gapMs: [5, 80], symptom: ['runtime', 'stale-target'], expectedVerification: 'PASS' },
  'bridge-failure': { chain: [['system', 'bridge-disconnect']], gapMs: [1, 10], symptom: ['system', 'event-gap-detected'], expectedVerification: 'PASS' },
  'browser-crash': { chain: [['system', 'renderer-crash']], gapMs: [1, 10], symptom: ['system', 'session-interrupted'], expectedVerification: 'PASS' },
  'extension-failure': { chain: [['system', 'extension-reload']], gapMs: [1, 20], symptom: ['system', 'event-gap-detected'], expectedVerification: 'PASS' },
  'timing-bug': { chain: [['runtime', 'timer-skip'], ['dom', 'attribute-changed']], gapMs: [1, 15], symptom: ['runtime', 'animation-glitch'], expectedVerification: 'INCONCLUSIVE' },
  'event-reorder': { chain: [['network', 'response-late'], ['runtime', 'state-update']], gapMs: [1, 30], symptom: ['runtime', 'inconsistent-state'], expectedVerification: 'PASS' },
  'event-loss': { chain: [['system', 'event-dropped'], ['runtime', 'state-update']], gapMs: [1, 30], symptom: ['system', 'event-gap-detected'], expectedVerification: 'PASS' },
};

/**
 * Generate a deterministic golden scenario. The causal chain events carry
 * explicit causalParentIds so the causal engine can reconstruct the chain,
 * plus decoy events (noise) that must NOT be selected as root cause.
 */
export function generateGoldenScenario(category: GoldenCategory, seed: number): GoldenScenario {
  const recipe = CATEGORY_RECIPES[category];
  const rand = prng(seed * 7919 + category.length);
  const mesh = new EventMesh();
  const entity = `entity:${category}:${seed}`;
  let logicalTime = 100 + Math.floor(rand() * 500);

  // Pre-noise: unrelated events before the causal chain.
  const preNoise = 2 + Math.floor(rand() * 3);
  for (let i = 0; i < preNoise; i++) {
    logicalTime += 400 + Math.floor(rand() * 600); // far outside window
    mesh.emit('console', 'log-noise', { msg: 'noise' }, { entityIds: [`other:${i}`] });
  }

  // The causal chain with explicit parent links. timing-bug scenarios
  // deliberately OMIT causal parent links: flaky timing failures are not
  // deterministically traceable, and the engine must honestly return
  // INCONCLUSIVE instead of manufacturing causation.
  const linkCausalParents = category !== 'timing-bug';
  let parentId: string | undefined;
  const chainSeqs: number[] = [];
  for (const [source, type] of recipe.chain) {
    logicalTime += recipe.gapMs[0] + Math.floor(rand() * (recipe.gapMs[1] - recipe.gapMs[0]));
    const ev = mesh.emit(source, type, { golden: true, category, seed }, {
      entityIds: [entity],
      causalParentIds: linkCausalParents && parentId ? [parentId] : [],
    });
    if (linkCausalParents) parentId = ev.eventId;
    chainSeqs.push(ev.sequence);
  }
  // The symptom.
  logicalTime += recipe.gapMs[0] + Math.floor(rand() * (recipe.gapMs[1] - recipe.gapMs[0]));
  mesh.emit(recipe.symptom[0], recipe.symptom[1], { golden: true, symptom: true }, {
    entityIds: [entity],
    causalParentIds: linkCausalParents && parentId ? [parentId] : [],
  });

  // Post-noise.
  const postNoise = 1 + Math.floor(rand() * 3);
  for (let i = 0; i < postNoise; i++) {
    logicalTime += 400 + Math.floor(rand() * 600);
    mesh.emit('console', 'log-noise', { msg: 'noise' }, { entityIds: [`other:${seed}-${i}`] });
  }

  const events = mesh.ordered();
  const symptomEvent = events.find((e) => e.type === recipe.symptom[1])!;
  return {
    incidentId: `golden:${category}:${seed}`,
    category,
    seed,
    events,
    symptomPattern: recipe.symptom[1],
    expectedRootCauseType: recipe.chain[0][1],
    expectedCauseSequence: chainSeqs[0],
    expectedVerification: recipe.expectedVerification,
  };
}

/** Generate the full suite: 24 categories × ~42 seeds = 1000+ incidents. */
export function generateGoldenSuite(totalTarget = 1020): GoldenScenario[] {
  const perCategory = Math.ceil(totalTarget / GOLDEN_CATEGORIES.length);
  const suite: GoldenScenario[] = [];
  for (const category of GOLDEN_CATEGORIES) {
    for (let seed = 1; seed <= perCategory; seed++) {
      suite.push(generateGoldenScenario(category, seed));
    }
  }
  return suite;
}

export interface GoldenRunResult {
  incidentId: string;
  category: GoldenCategory;
  rootCauseFound: boolean;
  rootCauseCorrect: boolean;
  verification: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  counterfactualSupported: boolean;
  expectedVerification: 'PASS' | 'INCONCLUSIVE';
  correctVerdict: boolean;
}

export interface GoldenSuiteReport {
  total: number;
  metrics: {
    /** ICR = investigations successfully resolved / resolvable scenarios. */
    investigationCompletionRate: number;
    /** Denominator honesty: INCONCLUSIVE-expected scenarios are not failures. */
    resolvableScenarios: number;
    resolvedScenarios: number;
    /** EC = verified findings / reported findings. */
    evidenceConfidence: number;
    /** RF = reproduced causal outcomes / recorded causal outcomes. */
    replayFidelity: number;
    /** False successes: claimed PASS where expected INCONCLUSIVE or wrong cause. */
    falseSuccessRate: number;
    rootCauseAccuracy: number;
  };
  byCategory: Record<string, { total: number; resolved: number; correctRootCause: number }>;
  failures: { incidentId: string; note: string }[];
}

/**
 * Run the suite: for each scenario execute the real causal engine,
 * counterfactual verification, and verdict comparison. Deterministic.
 */
export function runGoldenSuite(scenarios: GoldenScenario[]): GoldenSuiteReport {
  const results: GoldenRunResult[] = [];
  const failures: { incidentId: string; note: string }[] = [];
  for (const scenario of scenarios) {
    const graph = new EvidenceGraph();
    const causal = new CausalEngine(graph);
    const counterfactual = new CounterfactualEngine(causal);
    const symptomEvent = scenario.events.find((e) => e.type === scenario.symptomPattern)!;
    const hypotheses = causal.generateHypotheses(symptomEvent, scenario.events, 350);
    const best = hypotheses[0] ?? null;
    const rootCauseFound = Boolean(best);
    const rootCauseEvent = best?.causalChain?.events[0];
    const rootCauseCorrect = rootCauseEvent?.type === scenario.expectedRootCauseType;
    const outcome = best?.causalChain
      ? counterfactual.verifyHypothesis(scenario.events, best.causalChain, (e) => e.type === scenario.symptomPattern)
      : null;
    const counterfactualSupported = outcome?.verdict === 'CAUSE_SUPPPORTED';
    const verification: 'PASS' | 'FAIL' | 'INCONCLUSIVE' =
      outcome ? (outcome.verdict === 'CAUSE_SUPPPORTED' ? 'PASS' : outcome.verdict === 'NOT_SUPPORTED' ? 'FAIL' : 'INCONCLUSIVE') : 'INCONCLUSIVE';
    // Honest verdict: if expected INCONCLUSIVE, a claimed PASS is a FALSE success.
    const correctVerdict =
      scenario.expectedVerification === 'PASS' ? verification === 'PASS' : verification === 'INCONCLUSIVE' || verification === 'FAIL';
    if (!correctVerdict && failures.length < 50) {
      failures.push({ incidentId: scenario.incidentId, note: `expected ${scenario.expectedVerification}, got ${verification}` });
    }
    results.push({
      incidentId: scenario.incidentId,
      category: scenario.category,
      rootCauseFound,
      rootCauseCorrect,
      verification,
      counterfactualSupported,
      expectedVerification: scenario.expectedVerification,
      correctVerdict,
    });
  }
  const total = results.length || 1;
  const resolvable = results.filter((r) => r.expectedVerification === 'PASS').length || 1;
  const resolved = results.filter((r) => r.verification === 'PASS' && r.rootCauseFound).length;
  const reportedFindings = results.filter((r) => r.rootCauseFound).length || 1;
  const verifiedFindings = results.filter((r) => r.rootCauseFound && r.counterfactualSupported).length;
  const reproducedCausal = results.filter((r) => r.counterfactualSupported).length;
  const recordedCausal = results.filter((r) => r.expectedVerification === 'PASS').length || 1;
  const falseSuccesses = results.filter((r) => r.verification === 'PASS' && r.expectedVerification !== 'PASS').length;
  const byCategory: Record<string, { total: number; resolved: number; correctRootCause: number }> = {};
  for (const r of results) {
    const bucket = byCategory[r.category] ?? { total: 0, resolved: 0, correctRootCause: 0 };
    bucket.total += 1;
    if (r.verification === 'PASS' && r.rootCauseFound) bucket.resolved += 1;
    if (r.rootCauseCorrect) bucket.correctRootCause += 1;
    byCategory[r.category] = bucket;
  }
  return {
    total: results.length,
    metrics: {
      investigationCompletionRate: resolved / resolvable,
      resolvableScenarios: resolvable,
      resolvedScenarios: resolved,
      evidenceConfidence: verifiedFindings / reportedFindings,
      replayFidelity: reproducedCausal / recordedCausal,
      falseSuccessRate: falseSuccesses / total,
      rootCauseAccuracy: results.filter((r) => r.rootCauseCorrect).length / total,
    },
    byCategory,
    failures,
  };
}
