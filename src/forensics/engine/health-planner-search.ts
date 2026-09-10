/**
 * Engine suite (1/3):
 *   CAP 19 — Page health score
 *   CAP 20 — Agent exploration planner
 *   CAP 22 — Cross-signal search engine
 */

import { BaseEvent } from '../../types/events';
import { DOMSnapshot } from '../../types/dom-node';
import { TemporalCorrelationEngine } from '../temporal-correlation';
import { analyzeA11yDivergence } from '../analyzers/a11y-divergence';

// ---------------------------------------------------------------------------
// CAP 19 — PAGE HEALTH SCORE
// ---------------------------------------------------------------------------

export interface HealthSubscore {
  key: string;
  score: number; // 0..100 (100 = healthy)
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'NO_DATA';
  detail: string;
  metrics: Record<string, number>;
}

export interface PageHealthResult {
  overall: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  subscores: HealthSubscore[];
  topIssues: Array<{ area: string; issue: string; severity: 'error' | 'warn' | 'info' }>;
  methodology: string;
}

export function computePageHealth(input: { events: BaseEvent[]; snapshot?: DOMSnapshot; traceVitals?: { cls?: number; lcp?: number; inp?: number }; failedInteractions?: number }): PageHealthResult {
  const events = input.events || [];
  const subscores: HealthSubscore[] = [];

  // 1. Console errors
  const consoleErrors = events.filter(e => e.type === 'RUNTIME_CONSOLE_ERROR' || (e.type.startsWith('RUNTIME_CONSOLE') && e.type.includes('ERROR')));
  const consoleWarns = events.filter(e => e.type === 'RUNTIME_CONSOLE_WARN');
  const consoleScore = consoleErrors.length === 0 && consoleWarns.length === 0 ? 100
    : Math.max(0, 100 - consoleErrors.length * 18 - consoleWarns.length * 4);
  subscores.push({
    key: 'console', score: consoleScore,
    status: consoleScore >= 85 ? 'HEALTHY' : consoleScore >= 50 ? 'DEGRADED' : 'CRITICAL',
    detail: `${consoleErrors.length} error(s), ${consoleWarns.length} warning(s) recorded.`,
    metrics: { errors: consoleErrors.length, warnings: consoleWarns.length },
  });

  // 2. Failed network requests
  const netEvents = events.filter(e => e.category === 'NETWORK');
  const failedRequests = netEvents.filter(e => e.type === 'NETWORK_REQUEST_FAILED' || Number((e.payload as any).status) >= 400);
  const netScore = netEvents.length === 0 ? 100 : Math.max(0, 100 - (failedRequests.length / netEvents.length) * 100);
  subscores.push({
    key: 'network', score: Math.round(netScore),
    status: netScore >= 90 ? 'HEALTHY' : netScore >= 60 ? 'DEGRADED' : 'CRITICAL',
    detail: `${failedRequests.length} failed of ${netEvents.length} requests (${((failedRequests.length / Math.max(1, netEvents.length)) * 100).toFixed(1)}%).`,
    metrics: { total: netEvents.length, failed: failedRequests.length },
  });

  // 3. Accessibility issues
  const a11y = analyzeA11yDivergence({ snapshot: input.snapshot });
  const a11yErrors = a11y.divergence.filter(d => d.severity === 'error').length;
  const a11yWarns = a11y.divergence.filter(d => d.severity === 'warn').length;
  const a11yScore = Math.max(0, 100 - a11yErrors * 15 - a11yWarns * 5);
  subscores.push({
    key: 'accessibility', score: a11yScore,
    status: a11yScore >= 85 ? 'HEALTHY' : a11yScore >= 50 ? 'DEGRADED' : 'CRITICAL',
    detail: `${a11yErrors} critical + ${a11yWarns} moderate a11y divergences (missing names, alt, semantics).`,
    metrics: { errors: a11yErrors, warnings: a11yWarns, interactiveWithoutName: a11y.summary.interactiveWithoutName },
  });

  // 4. Performance signals (from trace vitals when available)
  const vitals = input.traceVitals || {};
  let perfScore = 100;
  const perfMetrics: Record<string, number> = {};
  if (vitals.lcp !== undefined) { perfMetrics.lcpMs = vitals.lcp; perfScore -= Math.max(0, (vitals.lcp - 2500) / 40); }
  if (vitals.inp !== undefined) { perfMetrics.inpMs = vitals.inp; perfScore -= Math.max(0, (vitals.inp - 200) / 4); }
  if (vitals.cls !== undefined) { perfMetrics.cls = vitals.cls; perfScore -= Math.max(0, (vitals.cls - 0.1) * 200); }
  const mutationChurn = events.filter(e => e.category === 'DOM').length;
  perfMetrics.domMutations = mutationChurn;
  if (mutationChurn > 200) perfScore -= Math.min(15, (mutationChurn - 200) / 20);
  perfScore = Math.max(0, Math.round(Math.min(100, perfScore)));
  subscores.push({
    key: 'performance', score: perfScore,
    status: perfScore >= 85 ? 'HEALTHY' : perfScore >= 60 ? 'DEGRADED' : 'CRITICAL',
    detail: Object.keys(perfMetrics).length ? `LCP=${perfMetrics.lcpMs ?? 'n/a'}ms INP=${perfMetrics.inpMs ?? 'n/a'}ms CLS=${perfMetrics.cls ?? 'n/a'} mutations=${mutationChurn}.` : 'No trace vitals available; mutation churn only.',
    metrics: perfMetrics,
  });

  // 5. Memory warnings — from recorded events carrying memory payload
  const memoryWarnings = events.filter(e => String((e.payload as any).type || '').includes('memory') || String((e.payload as any).kind || '').includes('memory'));
  const memScore = memoryWarnings.length === 0 ? 100 : Math.max(0, 100 - memoryWarnings.length * 20);
  subscores.push({ key: 'memory', score: memScore, status: memScore >= 80 ? 'HEALTHY' : 'DEGRADED', detail: `${memoryWarnings.length} memory warning(s) recorded.`, metrics: { warnings: memoryWarnings.length } });

  // 6. Layout instability — style/mutation bursts
  const styleEvents = events.filter(e => e.category === 'STYLE' || (e.type === 'DOM_MUTATION_ATTR' && String((e.payload as any).attributeName) === 'style'));
  const layoutMutations = events.filter(e => e.type === 'DOM_MUTATION_MOVE' || (e.type === 'DOM_MUTATION_ATTR' && ['width', 'height', 'class'].includes(String((e.payload as any).attributeName))));
  const instability = styleEvents.length + layoutMutations.length * 0.6;
  const layoutScore = Math.max(0, Math.round(100 - instability * 3));
  subscores.push({
    key: 'layout-stability', score: layoutScore,
    status: layoutScore >= 80 ? 'HEALTHY' : layoutScore >= 50 ? 'DEGRADED' : 'CRITICAL',
    detail: `${layoutMutations.length} layout-affecting mutations + ${styleEvents.length} style changes.`,
    metrics: { styleChanges: styleEvents.length, layoutMutations: layoutMutations.length },
  });

  // 7. Broken interactions
  const failed = input.failedInteractions ?? 0;
  const userEvents = events.filter(e => e.category === 'USER');
  const interactionScore = failed === 0 ? 100 : Math.max(0, 100 - failed * 25);
  subscores.push({
    key: 'interactions', score: interactionScore,
    status: interactionScore >= 80 ? 'HEALTHY' : interactionScore >= 50 ? 'DEGRADED' : 'CRITICAL',
    detail: `${failed} failed interaction(s) of ${userEvents.length} user events.`,
    metrics: { failed, userEvents: userEvents.length },
  });

  // 8. DOM anomalies — orphaned removals (removed without recorded parent)
  const removes = events.filter(e => e.type === 'DOM_MUTATION_REMOVE');
  const suspiciousRemoves = removes.filter(e => Number((e.payload as any).removedSubtreeNodeCount ?? 0) > 20);
  const domScore = Math.max(0, 100 - suspiciousRemoves.length * 12);
  subscores.push({ key: 'dom-anomalies', score: domScore, status: domScore >= 80 ? 'HEALTHY' : 'DEGRADED', detail: `${suspiciousRemoves.length} large subtree removal(s) (possible re-render churn).`, metrics: { subtreeRemovals: suspiciousRemoves.length, totalRemovals: removes.length } });

  // Weighted composite: critical areas weigh more.
  const WEIGHTS: Record<string, number> = { console: 0.2, network: 0.2, accessibility: 0.15, performance: 0.2, memory: 0.05, 'layout-stability': 0.1, interactions: 0.05, 'dom-anomalies': 0.05 };
  let weighted = 0, weightSum = 0;
  for (const s of subscores) {
    const w = WEIGHTS[s.key] ?? 0.1;
    weighted += s.score * w;
    weightSum += w;
  }
  const overall = Math.round(weighted / (weightSum || 1));
  const grade = overall >= 90 ? 'A' : overall >= 75 ? 'B' : overall >= 60 ? 'C' : overall >= 40 ? 'D' : 'F';

  const topIssues: Array<{ area: string; issue: string; severity: 'error' | 'warn' | 'info' }> = [];
  for (const e of consoleErrors.slice(0, 3)) topIssues.push({ area: 'console', issue: String((e.payload as any).message || (e.payload as any).text || e.type).slice(0, 120), severity: 'error' });
  for (const r of failedRequests.slice(0, 3)) topIssues.push({ area: 'network', issue: `${String((r.payload as any).url || '?')} ${r.type === 'NETWORK_REQUEST_FAILED' ? 'failed' : `status ${String((r.payload as any).status)}`}`, severity: 'error' });
  for (const d of a11y.divergence.filter(x => x.severity === 'error').slice(0, 3)) topIssues.push({ area: 'a11y', issue: `${d.kind}: ${d.selector}`, severity: 'error' });

  return {
    overall,
    grade,
    subscores,
    topIssues,
    methodology: 'Weighted composite: console 20%, network 20%, performance 20%, a11y 15%, layout stability 10%, memory/interactions/DOM anomalies 5% each. Every subscore is independently inspectable above.',
  };
}

// ---------------------------------------------------------------------------
// CAP 20 — AGENT EXPLORATION PLANNER
// ---------------------------------------------------------------------------

export interface PlannedAction {
  order: number;
  action: string;
  tool: string;
  rationale: string;
  expectedOutcome: string;
}

export function planNextActions(input: { symptom?: string; events: BaseEvent[]; engine?: TemporalCorrelationEngine }): { currentUnderstanding: string; plannedActions: PlannedAction[]; dataGaps: string[] } {
  const events = input.events || [];
  const symptom = (input.symptom || '').toLowerCase();
  const has = (frag: string) => symptom.includes(frag);
  const planned: PlannedAction[] = [];
  const gaps: string[] = [];

  const domCount = events.filter(e => e.category === 'DOM').length;
  const netCount = events.filter(e => e.category === 'NETWORK').length;
  const consoleCount = events.filter(e => e.category === 'CONSOLE' || e.category === 'ERROR').length;
  const userCount = events.filter(e => e.category === 'USER').length;
  const shotCount = events.filter(e => e.category === 'SCREENSHOT').length;

  // Symptom-driven ordering
  if (has('disappear') || has('removed') || has('unmount') || has('vanish') || symptom === '') {
    planned.push({ order: 1, action: 'Inspect parent mutation history for the disappeared element', tool: 'get_mutation_history + trace_element', rationale: 'Removal is usually a parent-subtree replacement; the parent chain tells whether the element was unmounted, replaced or hidden.', expectedOutcome: 'Removal mechanism + responsible mutation event id.' });
    if (netCount > 0) planned.push({ order: 2, action: 'Correlate DOM removal with nearby network responses', tool: 'fx_correlate_dom_network', rationale: `${netCount} network events recorded — response-driven re-renders are the top cause of element disappearance.`, expectedOutcome: 'Ranked request→mutation causal candidates with confidence.' });
    if (consoleCount > 0) planned.push({ order: 3, action: 'Check console errors around the removal time', tool: 'fx_error_root_cause', rationale: `${consoleCount} console events — a runtime error can abort a render and unmount the subtree.`, expectedOutcome: 'Error → mutation root-cause graph.' });
    planned.push({ order: 4, action: 'Diff the DOM state before/after the disappearance', tool: 'fx_dom_regression_diff', rationale: 'Full-dimension diff reveals whether the element was replaced, moved, or restyled into invisibility.', expectedOutcome: 'Machine+human diff across 8 dimensions.' });
  } else if (has('slow') || has('performance') || has('lag') || has('cls') || has('shift')) {
    planned.push({ order: 1, action: 'Analyze layout shift evidence chain', tool: 'fx_layout_shift_forensics', rationale: 'Layout instability requires mutation+network+style attribution.', expectedOutcome: 'Shift element, trigger mutation, concurrent requests.' });
    planned.push({ order: 2, action: 'Build the resource waterfall', tool: 'fx_resource_waterfall', rationale: 'Loading order explains most perceived slowness and CLS.', expectedOutcome: 'Waterfall with milestones and slowest resources.' });
    planned.push({ order: 3, action: 'Score page health', tool: 'fx_page_health', rationale: 'Composite view prevents single-metric tunnel vision.', expectedOutcome: 'Weighted health score with subscores.' });
  } else if (has('error') || has('exception') || has('crash') || has('fail')) {
    planned.push({ order: 1, action: 'Build the error root-cause graph', tool: 'fx_error_root_cause', rationale: 'Connects console error → stack → failed request → mutation → symptom.', expectedOutcome: 'Ranked root causes with evidence.' });
    planned.push({ order: 2, action: 'Check failed network requests preceding the error', tool: 'get_network_events / fx_resource_waterfall', rationale: 'Failed fetches are the most common external trigger.', expectedOutcome: 'Failed request list with timing.' });
    planned.push({ order: 3, action: 'Replay the failure scenario', tool: 'fx_failure_replay', rationale: 'Deterministic reproduction material for verification.', expectedOutcome: 'Structured replay bundle.' });
  } else if (has('click') || has('interact') || has('button') || has('input')) {
    planned.push({ order: 1, action: 'Inspect event listeners on the failing element', tool: 'fx_event_listeners', rationale: 'Interaction failures are usually handler-level (no listener, capture interception).', expectedOutcome: 'Listener inventory with framework ownership hints.' });
    planned.push({ order: 2, action: 'Check occlusion / hit-test conflicts', tool: 'fx_zindex_occlusion', rationale: 'Clicks landing on overlays/occluders are the second most common cause.', expectedOutcome: 'Stacking contexts + hit-test result at element center.' });
    planned.push({ order: 3, action: 'Verify the selector survives re-renders', tool: 'fx_selector_survivability', rationale: 'Stale selectors produce silent no-op clicks.', expectedOutcome: 'Survivability score with ranked alternatives.' });
  } else {
    planned.push({ order: 1, action: 'Run cross-signal search for the symptom keywords', tool: 'fx_cross_signal_search', rationale: 'Unknown symptoms need broad evidence gathering first.', expectedOutcome: 'Cross-domain evidence bundle.' });
    planned.push({ order: 2, action: 'Score overall page health', tool: 'fx_page_health', rationale: 'Subscores point to the weakest area to investigate.', expectedOutcome: 'Health composite with inspectable subscores.' });
  }

  // Data gaps
  if (domCount === 0) gaps.push('No DOM mutations recorded — time-travel analysis unavailable (was recording active?).');
  if (netCount === 0) gaps.push('No network events recorded — response causality cannot be established.');
  if (consoleCount === 0) gaps.push('No console messages recorded — error attribution limited.');
  if (shotCount === 0) gaps.push('No screenshots recorded — visual regression analysis unavailable for this session.');
  if (userCount === 0) gaps.push('No user interactions recorded — interaction replay cannot be reconstructed.');

  return {
    currentUnderstanding: `${events.length} events recorded (DOM ${domCount}, network ${netCount}, console ${consoleCount}, user ${userCount}, screenshots ${shotCount}). Symptom: ${input.symptom ? `"${input.symptom}"` : 'unspecified (generic investigation plan)'}.`,
    plannedActions: planned.slice(0, 6),
    dataGaps: gaps,
  };
}

// ---------------------------------------------------------------------------
// CAP 22 — CROSS-SIGNAL SEARCH ENGINE
// ---------------------------------------------------------------------------

export interface SearchHit {
  domain: string;
  eventId: string;
  timestamp: number;
  selector?: string;
  excerpt: string;
  score: number;
}

export function crossSignalSearch(input: { query: string; events: BaseEvent[]; engine?: TemporalCorrelationEngine; limit?: number }): {
  query: string;
  hits: SearchHit[];
  byDomain: Record<string, number>;
  relatedEvidence: Array<{ domain: string; eventId: string; relation: string; excerpt: string }>;
  suggestions: string[];
} {
  const query = String(input.query || '').toLowerCase().trim();
  const limit = input.limit ?? 40;
  if (!query) return { query: '', hits: [], byDomain: {}, relatedEvidence: [], suggestions: ['Provide a search query — keywords, selectors (#id, .class), URLs, error text or element text.'] };

  const events = input.events || [];
  const hits: SearchHit[] = [];
  const tokens = query.split(/\s+/).filter(Boolean);

  for (const e of events) {
    const haystack = JSON.stringify({ t: e.type, s: e.targetSelector, p: e.payload }).toLowerCase();
    let score = 0;
    for (const token of tokens) {
      if (haystack.includes(token)) score += token.startsWith('#') || token.startsWith('.') ? 5 : 2;
      // exact selector match is a strong signal
      if (e.targetSelector && e.targetSelector.toLowerCase().includes(token)) score += 3;
    }
    if (score > 0) {
      hits.push({
        domain: e.category,
        eventId: e.id,
        timestamp: e.timestamp,
        selector: e.targetSelector,
        excerpt: `${e.type} ${e.targetSelector || ''} ${JSON.stringify(e.payload).slice(0, 140)}`.trim(),
        score,
      });
    }
  }

  // dedupe by eventId, keep max score
  const byId = new Map<string, SearchHit>();
  for (const h of hits) {
    const prev = byId.get(h.eventId);
    if (!prev || h.score > prev.score) byId.set(h.eventId, h);
  }
  const unique = Array.from(byId.values()).sort((a, b) => b.score - a.score || a.timestamp - b.timestamp).slice(0, limit);

  // related evidence: events temporally adjacent to the top hits
  const related: Array<{ domain: string; eventId: string; relation: string; excerpt: string }> = [];
  const topTimes = unique.slice(0, 3).map(h => h.timestamp);
  for (const e of events) {
    for (const t of topTimes) {
      const delta = e.timestamp - t;
      if (delta !== 0 && Math.abs(delta) <= 250 && !byId.has(e.id)) {
        related.push({ domain: e.category, eventId: e.id, relation: delta < 0 ? `${-delta}ms before top hit` : `${delta}ms after top hit`, excerpt: `${e.type} ${e.targetSelector || ''} ${JSON.stringify(e.payload).slice(0, 100)}`.trim() });
        break;
      }
    }
  }

  const byDomain: Record<string, number> = {};
  for (const h of unique) byDomain[h.domain] = (byDomain[h.domain] || 0) + 1;

  const suggestions: string[] = [];
  if (Object.keys(byDomain).length === 1) suggestions.push(`All matches are in the "${Object.keys(byDomain)[0]}" domain — broaden the query or check adjacent domains with get_events.`);
  if (unique.length === 0) suggestions.push('No matches. Try: shorter keywords, a selector fragment (#id without tag), a URL substring, or the element text.');
  if (unique.length >= limit) suggestions.push(`Results truncated at ${limit} — refine the query for precision.`);

  return { query: input.query, hits: unique, byDomain, relatedEvidence: related.slice(0, 25), suggestions };
}
