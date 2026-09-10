/**
 * Unit tests — the 30 MCPDOM-native forensic capabilities (CAP 01–30)
 * exercising schemas, core algorithms, edge cases and failure conditions
 * against deterministic session data (§19 acceptance).
 */

import { describe, it, expect } from 'vitest';
import { EvidenceBuilder, scoreFinding, scoreConfidence, confidenceBand } from '../../src/forensics/evidence-model';
import { TemporalCorrelationEngine } from '../../src/forensics/temporal-correlation';
import { correlateDomNetwork, analyzeLayoutShift, buildErrorRootCauseGraph, analyzeNetworkDomBindings, buildResourceWaterfall } from '../../src/forensics/correlators/causality';
import { regressionDiff } from '../../src/forensics/analyzers/regression-diff';
import { correlateVisualWithDom } from '../../src/forensics/analyzers/visual-regression';
import { scoreSelectorSurvivability, detectComponentBoundaries, analyzeFrames, analyzeShadowDom } from '../../src/forensics/analyzers/structure';
import { analyzeA11yDivergence } from '../../src/forensics/analyzers/a11y-divergence';
import { computePageHealth, planNextActions, crossSignalSearch } from '../../src/forensics/engine/health-planner-search';
import { smartSnapshot, recommendSnapshotMode, predictChangeImpact, evaluateMutationGuard, transactionJournal, journalMutationResult } from '../../src/forensics/engine/snapshot-impact-journal';
import { buildSessionGraph, generateIncidentReport, buildForensicExport, verifyForensicImport } from '../../src/forensics/engine/graph-report-portability';
import { BaseEvent } from '../../src/types/events';
import { DOMSnapshot } from '../../src/types/dom-node';

// ---------------------------------------------------------------------------
// Deterministic fixture: a session where a click triggers an API call whose
// response renders a list, then a parent subtree replacement removes it.
// ---------------------------------------------------------------------------

const mkEvent = (id: string, timestamp: number, type: any, category: any, payload: any, targetSelector?: string, targetNodeId?: number): BaseEvent =>
  ({ id, sessionId: 's1', timestamp, sequence: 0, wallClockTime: 0, type, category, source: 'CONTENT_SCRIPT', targetSelector, targetNodeId, payload } as unknown as BaseEvent);

const events: BaseEvent[] = [
  mkEvent('m1', 50, 'DOM_MUTATION_ADD', 'DOM', { node: { id: 10, nodeType: 1, tagName: 'button', attributes: { id: 'load-btn' } }, parentId: 4, index: 0 }, '#load-btn', 10),
  mkEvent('u1', 100, 'USER_CLICK', 'USER', { x: 10, y: 20 }, '#load-btn', 10),
  mkEvent('n1', 150, 'NETWORK_REQUEST_START', 'NETWORK', { method: 'GET', url: 'https://api.test/items' }),
  mkEvent('n2', 300, 'NETWORK_RESPONSE_COMPLETE', 'NETWORK', { status: 200, url: 'https://api.test/items', size: 512, mimeType: 'application/json' }),
  mkEvent('m2', 360, 'DOM_MUTATION_ADD', 'DOM', { node: { id: 20, nodeType: 1, tagName: 'ul', attributes: { id: 'item-list' } }, parentId: 5, index: 0 }, '#item-list', 20),
  mkEvent('m3', 380, 'DOM_MUTATION_ADD', 'DOM', { node: { id: 21, nodeType: 1, tagName: 'li', textContent: 'Item A' }, parentId: 20, index: 0 }),
  mkEvent('c1', 400, 'RUNTIME_CONSOLE_ERROR', 'CONSOLE', { level: 'error', message: 'Uncaught TypeError: render failed at list.jsx:42', stack: 'at render (https://cdn.test/app.js:12:34)' }),
  mkEvent('e1', 410, 'RUNTIME_ERROR', 'ERROR', { message: 'Uncaught TypeError: render failed', stack: 'at render (https://cdn.test/app.js:12:34)' }),
  mkEvent('m4', 500, 'DOM_MUTATION_REMOVE', 'DOM', { nodeId: 20, tagName: 'ul', parentId: 5, index: 0, selectorHint: '#item-list', removedSubtreeNodeCount: 6 }, '#item-list', 20),
  mkEvent('nav1', 600, 'NAV_DOM_LOADED', 'NAVIGATION', { url: 'https://app.test/' }),
  mkEvent('shot1', 700, 'SCREENSHOT_CHECKPOINT', 'SCREENSHOT', { dataUrl: 'data:image/png;base64,AAAA' }),
];

const snapshot = (nodes: Record<number, any>, rootId = 1): DOMSnapshot =>
  ({ snapshotId: 'snap', sessionId: 's1', timestamp: 0, sequence: 1, rootId, nodes, title: 'T', url: 'https://app.test/', origin: 'https://app.test', viewport: { width: 1200, height: 800, scrollX: 0, scrollY: 0, devicePixelRatio: 1 }, totalNodeCount: Object.keys(nodes).length } as DOMSnapshot);

const snapA = snapshot({
  1: { id: 1, nodeType: 9, children: [2], parentId: null },
  2: { id: 2, nodeType: 1, tagName: 'body', children: [50], parentId: 1 },
  50: { id: 50, nodeType: 1, tagName: 'main', attributes: { id: 'content' }, children: [3, 30], parentId: 2 },
  3: { id: 3, nodeType: 1, tagName: 'div', attributes: { id: 'item-list' }, textContent: 'Item A Item B', children: [], parentId: 50 },
  30: { id: 30, nodeType: 1, tagName: 'button', attributes: { id: 'load-btn', class: 'btn', 'aria-label': 'Load items' }, textContent: 'Load', children: [], parentId: 50 },
});
const snapB = snapshot({
  1: { id: 1, nodeType: 9, children: [2], parentId: null },
  2: { id: 2, nodeType: 1, tagName: 'body', children: [50], parentId: 1 },
  50: { id: 50, nodeType: 1, tagName: 'main', attributes: { id: 'content' }, children: [3, 30, 40], parentId: 2 },
  3: { id: 3, nodeType: 1, tagName: 'div', attributes: { id: 'item-list', class: 'list error-state' }, textContent: 'Error occurred', children: [31], parentId: 50 },
  31: { id: 31, nodeType: 1, tagName: 'p', attributes: { role: 'alert' }, textContent: 'Failed to render', children: [], parentId: 3 },
  30: { id: 30, nodeType: 1, tagName: 'button', attributes: { id: 'load-btn', class: 'btn-primary' }, textContent: 'Reload', children: [], parentId: 50 },
  40: { id: 40, nodeType: 1, tagName: 'img', attributes: { id: 'hero' }, children: [], parentId: 50 },
});

// ---------------------------------------------------------------------------
// CAP 29 — evidence model
// ---------------------------------------------------------------------------

describe('CAP 29 — evidence scoring', () => {
  it('confidence rises with corroborating independent sources', () => {
    const one = scoreConfidence([{ source: 'MUTATION_RECORD', description: 'd', weight: 0.8 }]);
    const three = scoreConfidence([
      { source: 'MUTATION_RECORD', description: 'd', weight: 0.8 },
      { source: 'NETWORK_CORRELATION', description: 'd', weight: 0.55 },
      { source: 'CONSOLE_EVIDENCE', description: 'd', weight: 0.68 },
    ]);
    expect(three).toBeGreaterThan(one);
    expect(one).toBeLessThanOrEqual(0.75); // single-evidence cap
    expect(three).toBeLessThanOrEqual(0.98); // never 100%
  });

  it('contradictions pull confidence down', () => {
    const clean = scoreConfidence([{ source: 'DOM_OBSERVATION', description: 'd', weight: 0.7 }]);
    const contradicted = scoreConfidence([{ source: 'DOM_OBSERVATION', description: 'd', weight: 0.7 }], [{ source: 'CONSOLE_EVIDENCE', description: 'contra', weight: 0.6 }]);
    expect(contradicted).toBeLessThan(clean);
  });

  it('findings carry confidence, band, counts and types', () => {
    const f = new EvidenceBuilder('test conclusion', 'unit-test')
      .add('MUTATION_RECORD', 'mutation evidence', 'm1', 50)
      .add('NETWORK_CORRELATION', 'request evidence', 'n1', 150)
      .build();
    expect(f.confidence).toBeGreaterThan(0.5);
    expect(f.band).toBeOneOf(['VERY_HIGH', 'HIGH', 'MEDIUM', 'LOW', 'VERY_LOW']);
    expect(f.evidenceCount).toBe(2);
    expect(f.evidenceTypes).toEqual(['MUTATION_RECORD', 'NETWORK_CORRELATION']);
    expect(confidenceBand(0.9)).toBe('VERY_HIGH');
  });

  it('scoreFinding validates the standalone scoring entry', () => {
    const f = scoreFinding('c', [{ source: 'INFERRED', description: 'weak' }]);
    expect(f.confidence).toBeLessThanOrEqual(0.75);
    expect(f.method).toContain('fx_evidence_scoring');
  });
});

// ---------------------------------------------------------------------------
// CAP 01 / 04 / 14 / 15 / 16 — correlators
// ---------------------------------------------------------------------------

describe('CAP 01 — DOM↔network causal correlator', () => {
  const engine = new TemporalCorrelationEngine(events);
  it('ranks the response→mutation chain with confidence', () => {
    const result = correlateDomNetwork(engine, { timestamp: 360 });
    expect(result.candidates.length).toBeGreaterThan(0);
    const top = result.candidates[0];
    expect(top.request).toBeTruthy();
    expect(top.afterMutation).toBeTruthy();
    expect(top.confidence).toBeGreaterThan(0.3);
    expect(top.chain.length).toBeGreaterThanOrEqual(3);
    expect(result.candidates[0].rank).toBe(1);
  });
  it('request-anchored mode finds render mutations after responses', () => {
    const result = correlateDomNetwork(engine, { anchor: 'request', eventId: 'n1' });
    expect(result.candidates.length).toBeGreaterThan(0);
    expect(result.candidates.some(c => c.request?.eventId === 'n1')).toBe(true);
  });
  it('empty session returns an explicit no-anchor result', () => {
    const result = correlateDomNetwork(new TemporalCorrelationEngine([]), {});
    expect(result.candidates).toHaveLength(0);
    expect(result.anchor.kind).toBe('none');
  });
});

describe('CAP 04 — layout shift forensics', () => {
  it('builds an evidence chain with mutations and network context', () => {
    const engine = new TemporalCorrelationEngine(events);
    const chain = analyzeLayoutShift(engine, { timestamp: 500 });
    expect(chain.shiftEvent).toBeTruthy();
    expect(chain.triggerMutations.length + chain.networkActivity.length).toBeGreaterThan(0);
    expect(chain.confidence).toBeGreaterThan(0);
    expect(chain.affectedElement!.selector).toContain('item-list');
  });
});

describe('CAP 14 — error root-cause graph', () => {
  it('connects error → stack → request → mutations → symptom and ranks causes', () => {
    const engine = new TemporalCorrelationEngine(events);
    const graph = buildErrorRootCauseGraph(engine, { eventId: 'e1' });
    expect(graph.error.eventId).toBe('e1');
    expect(graph.nodes.some(n => n.kind === 'stack-trace')).toBe(true);
    expect(graph.nodes.some(n => n.kind === 'source-location')).toBe(true);
    expect(graph.rankedRootCauses.length).toBeGreaterThan(0);
    expect(graph.rankedRootCauses[0].confidence).toBeGreaterThan(0);
  });
  it('reports no-errors state honestly', () => {
    const graph = buildErrorRootCauseGraph(new TemporalCorrelationEngine([]), {});
    expect(graph.error.type).toBe('NONE');
    expect(graph.rankedRootCauses).toHaveLength(0);
  });
});

describe('CAP 15 — network-to-DOM binding', () => {
  it('binds the items response to the item-list region', () => {
    const engine = new TemporalCorrelationEngine(events);
    const { bindings, unboundRequests } = analyzeNetworkDomBindings(engine, {});
    expect(bindings.length).toBe(1);
    expect(bindings[0].requestUrl).toContain('api.test/items');
    expect(bindings[0].boundRegions.length).toBeGreaterThan(0);
    expect(bindings[0].confidence).toBeGreaterThan(0.3);
    expect(Array.isArray(unboundRequests)).toBe(true);
  });
});

describe('CAP 16 — resource waterfall', () => {
  it('builds the waterfall with milestones and summary', () => {
    const engine = new TemporalCorrelationEngine(events);
    const wf = buildResourceWaterfall(engine, {});
    expect(wf.waterfall.length).toBeGreaterThan(0);
    expect(wf.waterfall[0].url).toContain('api.test/items');
    expect(wf.summary.totalRequests).toBe(1);
    expect(wf.milestones.some(m => m.milestone === 'domContentLoaded')).toBe(true);
    expect(wf.summary.slowest).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// CAP 02 — regression diff
// ---------------------------------------------------------------------------

describe('CAP 02 — DOM regression diff', () => {
  it('detects added/removed/attrs/styles/text across two states', () => {
    const diff = regressionDiff(snapA, snapB);
    const totals = diff.machine.totals;
    expect(totals.added).toBeGreaterThan(0); // img#hero + p
    expect(totals.text).toBeGreaterThan(0); // Item A Item B → Error occurred
    expect(totals.styles).toBeGreaterThan(0); // class changed on #item-list
    expect(diff.human).toContain('# DOM Regression Diff');
    expect(diff.human).toContain('#item-list');
  });
  it('identical states produce no differences', () => {
    const diff = regressionDiff(snapA, snapA);
    expect(Object.keys(diff.machine.totals)).toHaveLength(0);
    expect(diff.human).toContain('No differences');
  });
});

// ---------------------------------------------------------------------------
// CAP 03 — visual regression correlation
// ---------------------------------------------------------------------------

describe('CAP 03 — visual regression forensics', () => {
  it('attributes visual change to structural DOM changes', () => {
    const diff = regressionDiff(snapA, snapB);
    const report = correlateVisualWithDom({
      pixel: { identical: false, changedRegions: [{ x: 0, y: 0, width: 100, height: 50, changedPixels: 500, changeRatio: 0.8 }], changedRegionCount: 1, totalChangedPixels: 500, changeRatio: 0.5 },
      domDiff: { totals: diff.machine.totals, topChanges: diff.machine.dimensions.flatMap(d => d.changes.slice(0, 3).map(c => ({ dimension: d.dimension, summary: `${c.selector}: ${c.detail}` }))) },
      screenshots: { before: { label: 'a' }, after: { label: 'b' } },
    });
    expect(report.conclusion).toContain('correlate');
    expect(report.domCorrelation.likelyRootCauses.length).toBeGreaterThan(0);
    expect(report.domCorrelation.likelyRootCauses[0].confidence).toBeGreaterThan(0.5);
  });
  it('pixel change WITHOUT DOM change is flagged as animation/canvas territory', () => {
    const report = correlateVisualWithDom({
      pixel: { identical: false, changedRegions: [{ x: 0, y: 0, width: 10, height: 10, changedPixels: 50, changeRatio: 0.2 }], changedRegionCount: 1, totalChangedPixels: 50, changeRatio: 0.2 },
      domDiff: { totals: {}, topChanges: [] },
      screenshots: { before: { label: 'a' }, after: { label: 'b' } },
    });
    expect(report.conclusion).toContain('WITHOUT recorded DOM changes');
  });
});

// ---------------------------------------------------------------------------
// CAP 07 — selector survivability
// ---------------------------------------------------------------------------

describe('CAP 07 — selector survivability scorer', () => {
  it('ranks robust ID selectors above framework-hash and positional selectors', () => {
    const scores = scoreSelectorSurvivability({
      candidateSelectors: [
        { selector: '#item-list', matches: 1 },
        { selector: 'div[data-v-7f3a2b]', matches: 1 },
        { selector: 'ul > li:nth-child(3)', matches: 1 },
      ],
    });
    const idScore = scores.find(s => s.selector === '#item-list')!;
    const frameworkScore = scores.find(s => s.selector.includes('data-v-'))!;
    const positionalScore = scores.find(s => s.selector.includes('nth-child'))!;
    expect(idScore.survivability).toBeGreaterThan(frameworkScore.survivability);
    expect(idScore.survivability).toBeGreaterThan(positionalScore.survivability);
    expect(frameworkScore.notes.join(' ')).toContain('framework');
    expect(idScore.breakdown).toHaveProperty('uniqueness');
  });
  it('mutation churn reduces DOM stability', () => {
    const stable = scoreSelectorSurvivability({ selector: '#x' })[0];
    const churned = scoreSelectorSurvivability({ selector: '#x', mutationHistory: events.filter(e => e.targetSelector === '#item-list').map(e => ({ ...e, targetSelector: '#x' })) })[0];
    expect(churned.breakdown.domStability).toBeLessThan(stable.breakdown.domStability);
  });
});

// ---------------------------------------------------------------------------
// CAP 08 — component boundaries
// ---------------------------------------------------------------------------

describe('CAP 08 — component boundary detector', () => {
  it('infers framework and boundaries with evidence + confidence', () => {
    const vueSnap = snapshot({
      1: { id: 1, nodeType: 9, children: [2], parentId: null },
      2: { id: 2, nodeType: 1, tagName: 'div', attributes: { 'data-v-7f3a2b': '' }, children: [3, 4], parentId: 1 },
      3: { id: 3, nodeType: 1, tagName: 'h1', children: [], parentId: 2 },
      4: { id: 4, nodeType: 1, tagName: 'my-widget', children: [], parentId: 2 },
    });
    const result = detectComponentBoundaries({ snapshot: vueSnap, events });
    expect(result.framework.detected).toBe('vue');
    expect(result.components.length).toBeGreaterThan(0);
    expect(result.components[0].framework).toBe('vue');
    expect(result.components[0].confidence).toBeGreaterThan(0);
  });
  it('whole-subtree replacements add re-render evidence', () => {
    const result = detectComponentBoundaries({ snapshot: snapA, events });
    expect(result.framework.evidence.join(' ')).toContain('subtree');
  });
});

// ---------------------------------------------------------------------------
// CAP 09 / 10 — frames + shadow DOM
// ---------------------------------------------------------------------------

describe('CAP 09 — frame forensics', () => {
  it('builds frame hierarchy and attributes events per frame', () => {
    const frameSnap = snapshot({
      1: { id: 1, nodeType: 9, children: [2], parentId: null },
      2: { id: 2, nodeType: 1, tagName: 'body', children: [3], parentId: 1 },
      3: { id: 3, nodeType: 1, tagName: 'iframe', attributes: { id: 'ad-frame', src: 'https://ads.test/frame' }, children: [], parentId: 2 },
    });
    const result = analyzeFrames({ snapshot: frameSnap, events });
    expect(result.frames.length).toBe(1);
    expect(result.frames[0].crossOrigin).toBe(true);
    expect(result.totalFrames).toBe(1);
  });
  it('no-frames state is explicit', () => {
    const result = analyzeFrames({ snapshot: snapA, events });
    expect(result.frames).toHaveLength(0);
    expect(result.notes.join(' ')).toContain('No frames');
  });
});

describe('CAP 10 — shadow DOM forensics', () => {
  it('analyzes recorded shadow hosts with slot distribution', () => {
    const shadowSnap = snapshot({
      1: { id: 1, nodeType: 9, children: [2], parentId: null },
      2: { id: 2, nodeType: 1, tagName: 'body', children: [3], parentId: 1 },
      3: { id: 3, nodeType: 1, tagName: 'my-host', attributes: { id: 'shadow-host' }, isShadowHost: true, shadowMode: 'open', children: [4, 5], parentId: 2 },
      4: { id: 4, nodeType: 1, tagName: 'span', attributes: { slot: 'title' }, children: [], parentId: 3 },
      5: { id: 5, nodeType: 1, tagName: 'span', attributes: { slot: 'title' }, children: [], parentId: 3 },
    });
    const result = analyzeShadowDom({ snapshot: shadowSnap, events });
    expect(result.roots.length).toBe(1);
    expect(result.roots[0].mode).toBe('open');
    expect(result.roots[0].slotDistribution[0]).toEqual({ slotName: 'title', assignedCount: 2 });
  });
});

// ---------------------------------------------------------------------------
// CAP 18 — a11y divergence
// ---------------------------------------------------------------------------

describe('CAP 18 — accessibility divergence', () => {
  it('finds missing names, missing alt and semantic mismatches', () => {
    const a11ySnap = snapshot({
      1: { id: 1, nodeType: 9, children: [2], parentId: null },
      2: { id: 2, nodeType: 1, tagName: 'body', children: [3, 4, 5], parentId: 1 },
      3: { id: 3, nodeType: 1, tagName: 'button', attributes: {}, textContent: '', children: [], parentId: 2 }, // no name!
      4: { id: 4, nodeType: 1, tagName: 'img', attributes: { id: 'pic' }, children: [], parentId: 2 }, // no alt!
      5: { id: 5, nodeType: 1, tagName: 'div', attributes: { onclick: 'go()' }, textContent: 'Buy', children: [], parentId: 2 }, // clickable div
    });
    const result = analyzeA11yDivergence({ snapshot: a11ySnap });
    expect(result.divergence.some(d => d.kind === 'missing-name')).toBe(true);
    expect(result.divergence.some(d => d.kind === 'img-missing-alt')).toBe(true);
    expect(result.divergence.some(d => d.kind === 'semantic-mismatch')).toBe(true);
    expect(result.summary.domElements).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// CAP 19 / 20 / 22 — health, planner, search
// ---------------------------------------------------------------------------

describe('CAP 19 — page health score', () => {
  it('computes weighted composite with inspectable subscores', () => {
    const health = computePageHealth({ events, snapshot: snapB });
    expect(health.overall).toBeGreaterThanOrEqual(0);
    expect(health.overall).toBeLessThanOrEqual(100);
    expect(health.subscores.length).toBe(8);
    for (const s of health.subscores) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.detail.length).toBeGreaterThan(3);
    }
    expect(health.methodology).toContain('Weighted');
  });
  it('console errors degrade the console subscore', () => {
    const clean = computePageHealth({ events: events.filter(e => e.category !== 'ERROR' && e.type !== 'RUNTIME_CONSOLE_ERROR'), snapshot: snapA });
    const dirty = computePageHealth({ events, snapshot: snapA });
    expect(dirty.subscores.find(s => s.key === 'console')!.score).toBeLessThan(clean.subscores.find(s => s.key === 'console')!.score);
  });
});

describe('CAP 20 — exploration planner', () => {
  it('recommends disappearance workflow for vanished-element symptoms', () => {
    const plan = planNextActions({ symptom: 'checkout button disappeared', events });
    expect(plan.plannedActions.length).toBeGreaterThanOrEqual(3);
    expect(plan.plannedActions[0].tool).toContain('mutation');
    expect(Array.isArray(plan.dataGaps)).toBe(true);
  });
  it('reports data gaps when signal domains are missing', () => {
    const plan = planNextActions({ symptom: 'button disappeared', events: [] });
    expect(plan.dataGaps.length).toBeGreaterThanOrEqual(4);
    expect(plan.dataGaps.some(g => g.includes('network'))).toBe(true);
  });
  it('routes performance symptoms to the shift/waterfall workflow', () => {
    const plan = planNextActions({ symptom: 'page is slow with layout shifts', events });
    expect(plan.plannedActions.some(a => a.tool.includes('layout_shift') || a.tool.includes('waterfall'))).toBe(true);
  });
});

describe('CAP 22 — cross-signal search', () => {
  it('finds hits across DOM, network and console domains with scores', () => {
    const result = crossSignalSearch({ query: 'item-list', events });
    expect(result.hits.length).toBeGreaterThan(0);
    expect(result.hits.some(h => h.domain === 'DOM')).toBe(true);
    expect(result.hits[0].score).toBeGreaterThan(0);
    expect(result.byDomain.DOM).toBeGreaterThan(0);
  });
  it('selector queries weight stronger than plain text', () => {
    const result = crossSignalSearch({ query: '#load-btn', events });
    expect(result.hits.length).toBeGreaterThan(0);
  });
  it('empty query returns usage guidance, not fake results', () => {
    const result = crossSignalSearch({ query: '', events });
    expect(result.hits).toHaveLength(0);
    expect(result.suggestions[0]).toContain('Provide a search query');
  });
});

// ---------------------------------------------------------------------------
// CAP 21 / 25 / 26 / 27 — snapshot compression, impact, guard, journal
// ---------------------------------------------------------------------------

describe('CAP 21 — smart snapshot compression', () => {
  it('all modes produce bounded representations with compression stats', () => {
    for (const mode of ['MINIMAL', 'SEMANTIC', 'INTERACTION', 'FORENSIC', 'FULL'] as const) {
      const result = smartSnapshot({ snapshot: snapB, mode });
      expect(result.mode).toBe(mode);
      expect(result.nodeCount).toBeGreaterThan(0);
      expect(result.fullNodeCount).toBe(6);
      expect(result.estimatedTokens).toBeGreaterThan(0);
    }
  });
  it('MINIMAL keeps landmarks only; fullNodeCount matches the fixture', () => {
    const minimal = smartSnapshot({ snapshot: snapB, mode: 'MINIMAL' });
    expect(minimal.nodeCount).toBe(1); // only <main>
    expect(minimal.fullNodeCount).toBe(6);
  });
});

describe('CAP 25 — change impact predictor', () => {
  it('destructive operations on big subtrees are HIGH risk', () => {
    const prediction = predictChangeImpact({ operation: 'set_outer_html', selector: '#item-list', snapshot: snapB, storedSelectors: ['#item-list li'] });
    expect(prediction.affectedSubtreeSize).toBeGreaterThan(0);
    expect(prediction.selectorBreakage.some(b => b.risk === 'HIGH')).toBe(true);
    expect(prediction.layoutImpact.severity).toBe('HIGH');
    expect(prediction.overallRisk).toBe('HIGH');
  });
  it('surgical attribute changes stay bounded', () => {
    const prediction = predictChangeImpact({ operation: 'set_attribute', selector: '#load-btn', snapshot: snapA });
    expect(prediction.overallRisk).toBeOneOf(['LOW', 'MEDIUM']);
    expect(prediction.formStateImpact.affected).toBe(false);
  });
});

describe('CAP 26 — safe mutation guard', () => {
  it('BLOCKS page-level destruction and irreversible state loss', () => {
    const guard = evaluateMutationGuard({
      operation: 'set_outer_html',
      selector: 'body',
      prediction: predictChangeImpact({ operation: 'set_outer_html', selector: 'body', snapshot: snapA }),
    });
    expect(guard.verdict).toBe('BLOCKED');
    expect(guard.reasons[0]).toContain('Refusing');
  });
  it('surgical changes pass as SAFE with reasons', () => {
    const guard = evaluateMutationGuard({
      operation: 'set_attribute',
      selector: '#load-btn',
      prediction: predictChangeImpact({ operation: 'set_attribute', selector: '#load-btn', snapshot: snapA }),
    });
    expect(guard.verdict).toBe('SAFE');
    expect(guard.reversible).toBe(true);
  });
});

describe('CAP 27 — transaction journal', () => {
  it('records BEFORE/AFTER/DIFF/ROLLBACK entries from mutation results', () => {
    journalMutationResult({
      operation: 'set_attribute', intent: 'test mutation',
      before: { selector: '#item-list', attributes: { class: 'list' }, textContent: 'x' },
      after: { selector: '#item-list', attributes: { class: 'list active' }, textContent: 'x' },
      success: true, undoRecord: { operation: 'undo' },
    });
    const { entries, total } = transactionJournal.query({});
    const stats = transactionJournal.stats();
    expect(total).toBeGreaterThanOrEqual(1);
    expect(entries[0].operation).toBe('set_attribute');
    expect(entries[0].diff).toContain('class');
    expect(entries[0].rollbackInfo.undoRecordAvailable).toBe(true);
    expect(stats.committed).toBeGreaterThanOrEqual(1);
  });
  it('filters by transactionId and marks outcomes', () => {
    journalMutationResult({ operation: 'set_text', intent: 'tx test', transactionId: 'tx_99', before: { selector: '#x', attributes: {}, textContent: 'a' }, after: { selector: '#x', attributes: {}, textContent: 'b' }, success: true, committed: false });
    const { entries } = transactionJournal.query({ transactionId: 'tx_99' });
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries.some(e => e.outcome === 'ROLLED_BACK')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CAP 28 / 30 / 23 / 24 — session graph, incident report, portability
// ---------------------------------------------------------------------------

describe('CAP 28 — multi-page session graph', () => {
  it('connects pages, requests, interactions and dom states', () => {
    const graph = buildSessionGraph({
      session: { id: 's1', url: 'https://app.test/', title: 'T', name: 'n', startTime: 0 } as any,
      events,
      livePages: [{ pageId: 'page_2', url: 'https://other.test/', tabId: 9, frames: 2, navigations: 1 }],
    });
    expect(graph.nodes.some(n => n.kind === 'page')).toBe(true);
    expect(graph.nodes.some(n => n.kind === 'request')).toBe(true);
    expect(graph.nodes.some(n => n.kind === 'interaction')).toBe(true);
    expect(graph.edges.some(e => e.relation === 'triggered-request')).toBe(true);
    expect(graph.summary.pages).toBe(2);
  });
});

describe('CAP 30 — incident report generator', () => {
  it('produces structured JSON + Markdown with remediation and confidence', () => {
    const report = generateIncidentReport({
      session: { id: 's1', url: 'https://app.test/', title: 'T', name: 'n', startTime: 0 } as any,
      events,
      detectedIssue: 'item list disappeared after API response',
    });
    expect(report.formatVersion).toBe('1.0.0');
    expect(report.incidentSummary).toContain('item list');
    expect(report.affectedDom.length).toBeGreaterThan(0);
    expect(report.recommendedRemediation.length).toBeGreaterThan(0);
    expect(report.validationSteps.length).toBe(3);
    expect(report.confidence.overall).toBeGreaterThan(0);
    expect(report.markdown).toContain('# Incident Report');
    expect(report.markdown).toContain('## Root Cause');
  });
});

describe('CAP 23/24 — forensic export/import', () => {
  it('exports a deterministic bundle with a verifiable content hash', () => {
    const session = { id: 's1', url: 'https://app.test/', title: 'T', name: 'n', startTime: 0 } as any;
    const findings = [new EvidenceBuilder('x', 'm').add('MUTATION_RECORD', 'd', 'm1').build()];
    const bundle = buildForensicExport({ session, events, findings });
    expect(bundle.format).toBe('mcpdom-forensic-investigation');
    expect(bundle.contentHash).toHaveLength(64);
    const verify = verifyForensicImport(bundle);
    expect(verify.valid).toBe(true);
    expect(verify.errors).toHaveLength(0);
  });
  it('tampered bundles are rejected by the hash check', () => {
    const session = { id: 's1', url: 'https://app.test/', title: 'T', name: 'n', startTime: 0 } as any;
    const bundle = buildForensicExport({ session, events, findings: [] });
    bundle.timeline.push({ timestamp: 999, domain: 'DOM', type: 'FAKE', summary: 'tampered' });
    const verify = verifyForensicImport(bundle);
    expect(verify.valid).toBe(false);
    expect(verify.errors.join(' ')).toContain('contentHash mismatch');
  });
  it('invalid format bundles are rejected with explicit errors', () => {
    const verify = verifyForensicImport({ junk: true });
    expect(verify.valid).toBe(false);
    expect(verify.errors.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// §12 temporal correlation engine
// ---------------------------------------------------------------------------

describe('§12 temporal correlation engine', () => {
  const engine = new TemporalCorrelationEngine(events);
  it('orders the shared timeline and answers around()/nearest()', () => {
    expect(engine.stats().total).toBe(events.length);
    const around = engine.around(310, 100);
    expect(around.some(s => s.eventId === 'n2')).toBe(true);
    expect(engine.nearest(410, 'NETWORK', 'before')?.eventId).toBe('n2');
    expect(engine.nearest(300, 'DOM', 'after')?.eventId).toBe('m2');
  });
  it('ranks causal candidates with domain priors and temporal decay', () => {
    const m2 = engine.signal('m2')!;
    const ranked = engine.rankCausalCandidates(m2, ['NETWORK']);
    expect(ranked[0].signal.eventId).toBe('n2');
    expect(ranked[0].score).toBeGreaterThan(ranked[ranked.length - 1].score);
  });
  it('summarizes events for human-readable timelines', () => {
    expect(engine.signal('n1')!.summary).toContain('GET');
    expect(engine.signal('m4')!.summary).toContain('#item-list');
  });
});
