/**
 * Correlator suite:
 *   CAP 01 — DOM ↔ network causal correlation
 *   CAP 04 — layout shift forensics evidence chains
 *   CAP 14 — runtime error root-cause graph
 *   CAP 15 — network-to-DOM binding analyzer
 *   CAP 16 — resource waterfall forensics
 */

import { TemporalCorrelationEngine, TimelineSignal } from '../temporal-correlation';
import { EvidenceBuilder, confidenceBand } from '../evidence-model';

// ---------------------------------------------------------------------------
// CAP 01 — DOM + NETWORK CAUSAL CORRELATOR
// ---------------------------------------------------------------------------

export interface CausalCandidate {
  rank: number;
  chain: string[];
  request: TimelineSignal | null;
  response: TimelineSignal | null;
  beforeMutation: TimelineSignal | null;
  afterMutation: TimelineSignal | null;
  temporalGapMs: number;
  confidence: number;
  evidenceCount: number;
  band: string;
}

export function correlateDomNetwork(
  engine: TemporalCorrelationEngine,
  options: { anchor?: 'mutation' | 'request'; eventId?: string; timestamp?: number; windowMs?: number; limit?: number },
): { anchor: { kind: string; eventId?: string; timestamp?: number }; candidates: CausalCandidate[]; timelineSlice: TimelineSignal[] } {
  const windowMs = options.windowMs ?? 800;
  const limit = options.limit ?? 8;

  // Resolve the focal signal.
  let focal: TimelineSignal | null = null;
  if (options.eventId) focal = engine.signal(options.eventId) || null;
  if (!focal && options.timestamp !== undefined) {
    // closest DOM mutation (or request) to the timestamp
    focal = engine.nearest(options.timestamp, 'DOM') || engine.nearest(options.timestamp, 'NETWORK');
  }
  if (!focal) {
    // default anchor: the first DOM mutation burst
    const dom = engine.byDomain('DOM');
    focal = dom.find(s => s.type === 'DOM_MUTATION_ADD' || s.type === 'DOM_MUTATION_REMOVE') || dom[0] || null;
  }
  if (!focal) {
    return { anchor: { kind: 'none' }, candidates: [], timelineSlice: [] };
  }

  // If focal is a mutation → find requests before it and renders after it.
  // If focal is a request → find mutations after it.
  const isRequestFocal = focal.domain === 'NETWORK' || options.anchor === 'request';

  const candidates: CausalCandidate[] = [];
  if (isRequestFocal) {
    const request = focal;
    const response = engine.signals.find(s => s.domain === 'NETWORK' && s.type === 'NETWORK_RESPONSE_COMPLETE' && s.payload.url === request.payload.url && s.timestamp >= request.timestamp) || null;
    const finish = response?.timestamp ?? request.timestamp;
    // mutations right AFTER the response = render effect
    const afterMutations = engine.range(finish, finish + windowMs).filter(s => s.domain === 'DOM' && s.type.startsWith('DOM_MUTATION'));
    for (const m of afterMutations.slice(0, limit)) {
      const ev = new EvidenceBuilder(
        `Response of ${String(request.payload.url || '?')} caused ${m.summary}`,
        'Temporal correlation: request → response → mutation chain (CAP 01)',
      )
        .add('NETWORK_CORRELATION', `Request ${request.summary}`, request.eventId, request.timestamp)
        .add('NETWORK_CORRELATION', `Response ${response?.summary ?? 'no response recorded (still in flight or failed)'}`, response?.eventId, response?.timestamp)
        .add('MUTATION_RECORD', m.summary, m.eventId, m.timestamp);
      if (response?.payload.status && Number(response.payload.status) >= 400) {
        ev.contradict('NETWORK_CORRELATION', `Response status ${response.payload.status} — error responses rarely render new content`, response.eventId);
      }
      const finding = ev.build();
      candidates.push({
        rank: 0,
        chain: [request.summary, response?.summary ?? '…', m.summary],
        request,
        response: response || null,
        beforeMutation: null,
        afterMutation: m,
        temporalGapMs: m.timestamp - finish,
        confidence: finding.confidence,
        evidenceCount: finding.evidenceCount,
        band: confidenceBand(finding.confidence),
      });
    }
  } else {
    const mutation = focal;
    // requests BEFORE the mutation = candidate causes
    const requests = engine.range(mutation.timestamp - windowMs * 4, mutation.timestamp)
      .filter(s => s.domain === 'NETWORK' && (s.type === 'NETWORK_RESPONSE_COMPLETE' || s.type === 'NETWORK_REQUEST_START'));
    const ranked = engine.rankCausalCandidates(mutation, ['NETWORK'], limit);
    const usedRequests = ranked.map(r => r.signal);
    const pool = usedRequests.length > 0 ? usedRequests : requests.slice(0, limit);
    for (const request of pool) {
      const response = engine.signals.find(s => s.domain === 'NETWORK' && s.type === 'NETWORK_RESPONSE_COMPLETE' && s.payload.url === request.payload.url && s.timestamp >= request.timestamp) || null;
      const before = engine.range(request.timestamp - windowMs, request.timestamp).filter(s => s.domain === 'DOM').pop() || null;
      const after = engine.range(mutation.timestamp, mutation.timestamp + windowMs).filter(s => s.domain === 'DOM' && s.eventId !== mutation.eventId)[0] || null;
      const ev = new EvidenceBuilder(
        `${request.summary} → ${mutation.summary}`,
        'Temporal correlation: mutation anchored, request/response chain reconstructed (CAP 01)',
      )
        .add('MUTATION_RECORD', mutation.summary, mutation.eventId, mutation.timestamp)
        .add('NETWORK_CORRELATION', request.summary, request.eventId, request.timestamp);
      if (response) ev.add('NETWORK_CORRELATION', response.summary, response.eventId, response.timestamp);
      if (before) ev.add('DOM_OBSERVATION', `Prior DOM state: ${before.summary}`, before.eventId, before.timestamp);
      const finding = ev.build();
      candidates.push({
        rank: 0,
        chain: [before?.summary || '(prior DOM)', request.summary, response?.summary || '…', mutation.summary, after?.summary || '(next DOM)'],
        request,
        response,
        beforeMutation: before,
        afterMutation: after,
        temporalGapMs: mutation.timestamp - (response?.timestamp ?? request.timestamp),
        confidence: finding.confidence,
        evidenceCount: finding.evidenceCount,
        band: confidenceBand(finding.confidence),
      });
    }
  }

  candidates.sort((a, b) => b.confidence - a.confidence || a.temporalGapMs - b.temporalGapMs);
  candidates.forEach((c, i) => { c.rank = i + 1; });

  return {
    anchor: { kind: isRequestFocal ? 'request' : 'mutation', eventId: focal.eventId, timestamp: focal.timestamp },
    candidates: candidates.slice(0, limit),
    timelineSlice: engine.around(focal.timestamp, windowMs * 2).slice(0, 60),
  };
}

// ---------------------------------------------------------------------------
// CAP 04 — LAYOUT SHIFT FORENSICS
// ---------------------------------------------------------------------------

export interface LayoutShiftEvidenceChain {
  shiftEvent: { type: string; eventId: string; timestamp: number } | null;
  affectedElement: { selector: string; nodeId?: number; tagName: string } | null;
  previousPosition: { source: string; described: string } | null;
  newPosition: { source: string; described: string } | null;
  triggerMutations: Array<{ summary: string; eventId: string; timestamp: number; deltaMs: number }>;
  networkActivity: Array<{ summary: string; eventId: string; timestamp: number }>;
  styleChanges: Array<{ summary: string; eventId: string; timestamp: number }>;
  confidence: number;
  band: string;
  evidenceCount: number;
}

export function analyzeLayoutShift(engine: TemporalCorrelationEngine, options: { timestamp?: number; eventId?: string; selector?: string; windowMs?: number }): LayoutShiftEvidenceChain {
  const windowMs = options.windowMs ?? 600;

  // Locate the shift signal: explicit event, or the largest REMOVE/ATTR
  // burst affecting layout-ish attributes (height/style/display).
  let shift: TimelineSignal | null = null;
  if (options.eventId) shift = engine.signal(options.eventId) || null;
  if (!shift && options.timestamp !== undefined) shift = engine.nearest(options.timestamp, 'DOM');
  if (!shift) {
    // Heuristic: attribute mutations that change layout (style/class/width/height)
    const attrMutations = engine.byDomain('DOM').filter(s =>
      s.type === 'DOM_MUTATION_ATTR' && ['style', 'class', 'width', 'height', 'hidden'].includes(String(s.payload.attributeName)));
    shift = attrMutations[0] || engine.byDomain('DOM').find(s => s.type === 'DOM_MUTATION_REMOVE') || null;
  }
  if (!shift) {
    return { shiftEvent: null, affectedElement: null, previousPosition: null, newPosition: null, triggerMutations: [], networkActivity: [], styleChanges: [], confidence: 0, band: 'NO_DATA', evidenceCount: 0 };
  }

  const affected = {
    selector: String(shift.targetSelector || (shift.payload as any).selectorHint || `node=${shift.targetNodeId ?? (shift.payload as any).nodeId ?? '?'}`),
    nodeId: shift.targetNodeId ?? (shift.payload as any).nodeId,
    tagName: String((shift.payload as any).tagName || 'element'),
  };

  const nearby = engine.around(shift.timestamp, windowMs);
  const triggerMutations = nearby
    .filter(s => s.domain === 'DOM' && s.eventId !== shift!.eventId)
    .map(s => ({ summary: s.summary, eventId: s.eventId, timestamp: s.timestamp, deltaMs: s.timestamp - shift!.timestamp }));
  const networkActivity = nearby.filter(s => s.domain === 'NETWORK').map(s => ({ summary: s.summary, eventId: s.eventId, timestamp: s.timestamp }));
  const styleChanges = nearby.filter(s => s.domain === 'STYLE' || (s.domain === 'DOM' && s.type === 'DOM_MUTATION_ATTR' && String(s.payload.attributeName) === 'style')).map(s => ({ summary: s.summary, eventId: s.eventId, timestamp: s.timestamp }));

  // positions: reconstructed from nearby DOM snapshots (before/after)
  const beforeSnapshotEvent = engine.byDomain('SCREENSHOT').filter(s => s.timestamp <= shift.timestamp).pop();
  const afterSnapshotEvent = engine.byDomain('SCREENSHOT').filter(s => s.timestamp >= shift.timestamp)[0];

  const ev = new EvidenceBuilder(
    `Layout instability around ${affected.selector} at t=${shift.timestamp}ms`,
    'Layout-shift evidence chain reconstruction (CAP 04)',
  )
    .add('MUTATION_RECORD', shift.summary, shift.eventId, shift.timestamp)
    .add('DOM_OBSERVATION', `Affected element: ${affected.selector}`);
  for (const m of triggerMutations.slice(0, 4)) ev.add('MUTATION_RECORD', m.summary, m.eventId, m.timestamp);
  for (const n of networkActivity.slice(0, 4)) ev.add('NETWORK_CORRELATION', `Concurrent request: ${n.summary}`, n.eventId, n.timestamp);
  for (const st of styleChanges.slice(0, 3)) ev.add('STYLE_EVIDENCE', st.summary, st.eventId, st.timestamp);
  if (beforeSnapshotEvent) ev.add('SCREENSHOT_EVIDENCE', `Visual state before shift: ${beforeSnapshotEvent.summary}`, beforeSnapshotEvent.eventId, beforeSnapshotEvent.timestamp);
  if (afterSnapshotEvent) ev.add('SCREENSHOT_EVIDENCE', `Visual state after shift: ${afterSnapshotEvent.summary}`, afterSnapshotEvent.eventId, afterSnapshotEvent.timestamp);
  if (networkActivity.length === 0 && triggerMutations.length === 0) {
    ev.contradict('INFERRED', 'No concurrent network or mutation activity found — the shift may originate from unrecorded causes (e.g. CSS animation)');
  }
  const finding = ev.build();

  return {
    shiftEvent: { type: shift.type, eventId: shift.eventId, timestamp: shift.timestamp },
    affectedElement: affected,
    previousPosition: beforeSnapshotEvent ? { source: 'screenshot checkpoint before shift', described: beforeSnapshotEvent.summary } : null,
    newPosition: afterSnapshotEvent ? { source: 'screenshot checkpoint after shift', described: afterSnapshotEvent.summary } : null,
    triggerMutations,
    networkActivity,
    styleChanges,
    confidence: finding.confidence,
    band: finding.band,
    evidenceCount: finding.evidenceCount,
  };
}

// ---------------------------------------------------------------------------
// CAP 14 — RUNTIME ERROR ROOT-CAUSE GRAPH
// ---------------------------------------------------------------------------

export interface RootCauseGraph {
  error: { eventId: string; type: string; message: string; timestamp: number; stack?: string };
  nodes: Array<{ id: string; kind: string; label: string; timestamp?: number }>;
  edges: Array<{ from: string; to: string; relation: string }>;
  rankedRootCauses: Array<{ label: string; confidence: number; band: string; evidenceCount: number; evidenceTypes: string[] }>;
}

export function buildErrorRootCauseGraph(engine: TemporalCorrelationEngine, options: { eventId?: string; timestamp?: number }): RootCauseGraph {
  // locate error signal
  let error: TimelineSignal | null = null;
  const errorSignals = engine.signals.filter(s => s.domain === 'ERROR' || (s.domain === 'CONSOLE' && s.type.includes('ERROR')));
  if (options.eventId) error = errorSignals.find(s => s.eventId === options.eventId) || engine.signal(options.eventId) || null;
  if (!error && options.timestamp !== undefined) {
    error = errorSignals.reduce<TimelineSignal | null>((best, s) => {
      if (!best) return s;
      return Math.abs(s.timestamp - options.timestamp!) < Math.abs(best.timestamp - options.timestamp!) ? s : best;
    }, null);
  }
  if (!error) error = errorSignals[0] || null;
  if (!error) {
    return { error: { eventId: '', type: 'NONE', message: 'No runtime errors recorded in this session.', timestamp: 0 }, nodes: [], edges: [], rankedRootCauses: [] };
  }

  const nodes: RootCauseGraph['nodes'] = [{ id: 'error', kind: 'runtime-error', label: String(error.payload.message || error.summary), timestamp: error.timestamp }];
  const edges: RootCauseGraph['edges'] = [];

  // stack trace node
  const stack = String(error.payload.stack || error.payload.stackTrace || '');
  if (stack) {
    nodes.push({ id: 'stack', kind: 'stack-trace', label: stack.split('\n').slice(0, 4).join(' | ') });
    edges.push({ from: 'error', to: 'stack', relation: 'stackTrace' });
    const sourceLine = /at\s+.+?\((.*?):(\d+):(\d+)\)/.exec(stack);
    if (sourceLine) {
      nodes.push({ id: 'source', kind: 'source-location', label: `${sourceLine[1]}:${sourceLine[2]}` });
      edges.push({ from: 'stack', to: 'source', relation: 'sourceLocation' });
    }
  }

  // failed network request before error
  const failedRequest = engine.range(error.timestamp - 3000, error.timestamp).filter(s => s.domain === 'NETWORK' && (s.type === 'NETWORK_REQUEST_FAILED' || Number(s.payload.status) >= 400)).pop();
  if (failedRequest) {
    nodes.push({ id: 'request', kind: 'network-request', label: failedRequest.summary, timestamp: failedRequest.timestamp });
    edges.push({ from: 'request', to: 'error', relation: 'preceded' });
  }

  // mutations around the error
  const mutations = engine.range(error.timestamp - 800, error.timestamp + 800).filter(s => s.domain === 'DOM');
  for (const m of mutations.slice(0, 5)) {
    const id = `mut_${m.eventId}`;
    nodes.push({ id, kind: 'dom-mutation', label: m.summary, timestamp: m.timestamp });
    edges.push({ from: id, to: 'error', relation: m.timestamp <= error.timestamp ? 'preceded' : 'followed' });
  }

  // visible symptom: removals after the error
  const removals = engine.range(error.timestamp, error.timestamp + 2000).filter(s => s.domain === 'DOM' && s.type === 'DOM_MUTATION_REMOVE');
  for (const r of removals.slice(0, 3)) {
    const id = `sym_${r.eventId}`;
    nodes.push({ id, kind: 'visible-symptom', label: `Element disappeared: ${r.summary}`, timestamp: r.timestamp });
    edges.push({ from: 'error', to: id, relation: 'likelyCaused' });
  }

  // rank root causes
  const ranked: RootCauseGraph['rankedRootCauses'] = [];
  if (failedRequest) {
    const f = new EvidenceBuilder(`Failed request ${failedRequest.summary} is the root cause of ${String(error.payload.message || 'the runtime error')}`, 'Root-cause ranking (CAP 14)')
      .add('NETWORK_CORRELATION', failedRequest.summary, failedRequest.eventId, failedRequest.timestamp)
      .add('CONSOLE_EVIDENCE', String(error.payload.message || error.summary), error.eventId, error.timestamp)
      .add('INFERRED', 'Failed request occurred before the error within 3s').build();
    ranked.push({ label: failedRequest.summary, confidence: f.confidence, band: f.band, evidenceCount: f.evidenceCount, evidenceTypes: f.evidenceTypes as unknown as string[] });
  }
  for (const m of mutations.slice(0, 3)) {
    if (m.timestamp > error.timestamp) continue;
    const f = new EvidenceBuilder(`Mutation ${m.summary} is the root cause of the error`, 'Root-cause ranking (CAP 14)')
      .add('MUTATION_RECORD', m.summary, m.eventId, m.timestamp)
      .add('CONSOLE_EVIDENCE', String(error.payload.message || error.summary), error.eventId, error.timestamp).build();
    ranked.push({ label: m.summary, confidence: f.confidence, band: f.band, evidenceCount: f.evidenceCount, evidenceTypes: f.evidenceTypes as unknown as string[] });
  }
  if (ranked.length === 0) {
    const f = new EvidenceBuilder('No correlated pre-failure activity — error is likely script-internal', 'Root-cause ranking (CAP 14)')
      .add('CONSOLE_EVIDENCE', String(error.payload.message || error.summary), error.eventId, error.timestamp)
      .add('INFERRED', 'No network failures or mutations within the causality window').build();
    ranked.push({ label: 'script-internal failure (no external trigger found)', confidence: f.confidence, band: f.band, evidenceCount: f.evidenceCount, evidenceTypes: f.evidenceTypes as unknown as string[] });
  }
  ranked.sort((a, b) => b.confidence - a.confidence);

  return {
    error: { eventId: error.eventId, type: error.type, message: String(error.payload.message || error.summary), timestamp: error.timestamp, stack: stack || undefined },
    nodes,
    edges,
    rankedRootCauses: ranked.slice(0, 5),
  };
}

// ---------------------------------------------------------------------------
// CAP 15 — NETWORK-TO-DOM BINDING ANALYZER
// ---------------------------------------------------------------------------

export interface DomRegionBinding {
  requestUrl: string;
  requestEventId: string;
  responseEventId?: string;
  responseStatus?: number;
  contentType?: string;
  boundRegions: Array<{ selector: string; nodeId?: number; mutationType: string; summary: string; delayMs: number }>;
  confidence: number;
  band: string;
}

export function analyzeNetworkDomBindings(engine: TemporalCorrelationEngine, options: { windowMs?: number; minConfidence?: number; limit?: number }): { bindings: DomRegionBinding[]; unboundRequests: Array<{ url: string; eventId: string; reason: string }> } {
  const windowMs = options.windowMs ?? 1000;
  const minConfidence = options.minConfidence ?? 0.3;
  const limit = options.limit ?? 10;

  const responses = engine.byDomain('NETWORK').filter(s => s.type === 'NETWORK_RESPONSE_COMPLETE');
  const bindings: DomRegionBinding[] = [];
  const unbound: Array<{ url: string; eventId: string; reason: string }> = [];

  for (const response of responses.slice(0, 60)) {
    const url = String(response.payload.url || '?');
    const status = Number(response.payload.status ?? 0);
    const contentType = String(response.payload.mimeType || response.payload.contentType || (/\.(json)$/i.test(url) ? 'application/json' : ''));

    // mutations in the render window after this response
    const effects = engine.range(response.timestamp, response.timestamp + windowMs)
      .filter(s => s.domain === 'DOM' && s.type.startsWith('DOM_MUTATION'));

    if (effects.length === 0) {
      unbound.push({ url, eventId: response.eventId, reason: 'No DOM mutations within the binding window after this response.' });
      continue;
    }

    // Group effects by region (parent selector of the mutated node).
    const regionMap = new Map<string, DomRegionBinding['boundRegions']>();
    for (const eff of effects) {
      const selector = String(eff.targetSelector || (eff.payload as any).selectorHint || `node=${eff.targetNodeId ?? (eff.payload as any).nodeId ?? '?'}`);
      const region = selector.replace(/[>:]\s*[^>]+$/, '').trim() || selector;
      const arr = regionMap.get(region) || [];
      arr.push({
        selector,
        nodeId: eff.targetNodeId ?? (eff.payload as any).nodeId,
        mutationType: eff.type,
        summary: eff.summary,
        delayMs: eff.timestamp - response.timestamp,
      });
      regionMap.set(region, arr);
    }

    const ev = new EvidenceBuilder(`Response ${url} drives ${regionMap.size} DOM region(s)`, 'Network→DOM binding (CAP 15)')
      .add('NETWORK_CORRELATION', `Response: ${response.summary}`, response.eventId, response.timestamp);
    for (const [region, muts] of regionMap) {
      ev.add('MUTATION_RECORD', `${muts.length} mutation(s) in ${region} after response`, muts[0]?.summary ? undefined : undefined, muts[0]?.delayMs);
    }
    if (/json|javascript/i.test(contentType)) ev.add('INFERRED', 'JSON/JS content type is a strong prior for state-driven rendering');
    if (status >= 400) ev.contradict('NETWORK_CORRELATION', `Error status ${status} — response unlikely to produce render mutations`, response.eventId);
    const finding = ev.build();

    if (finding.confidence >= minConfidence) {
      bindings.push({
        requestUrl: url,
        requestEventId: response.eventId,
        responseEventId: response.eventId,
        responseStatus: status || undefined,
        contentType: contentType || undefined,
        boundRegions: Array.from(regionMap.entries()).flatMap(([, muts]) => muts).slice(0, 12),
        confidence: finding.confidence,
        band: finding.band,
      });
    } else {
      unbound.push({ url, eventId: response.eventId, reason: `Binding confidence ${finding.confidence} below threshold ${minConfidence}.` });
    }
  }

  bindings.sort((a, b) => b.confidence - a.confidence);
  return { bindings: bindings.slice(0, limit), unboundRequests: unbound.slice(0, 20) };
}

// ---------------------------------------------------------------------------
// CAP 16 — RESOURCE WATERFALL FORENSICS
// ---------------------------------------------------------------------------

export interface WaterfallEntry {
  url: string;
  resourceType: string;
  startMs: number;
  durationMs: number;
  status?: number;
  size?: number;
  phase: 'request' | 'complete' | 'failed';
}

export function buildResourceWaterfall(engine: TemporalCorrelationEngine, options: { from?: number; to?: number }): {
  waterfall: WaterfallEntry[];
  milestones: Array<{ milestone: string; timestamp: number; source: string }>;
  summary: { totalRequests: number; failed: number; totalBytes: number; slowest: WaterfallEntry | null; byType: Record<string, number> };
} {
  const net = engine.byDomain('NETWORK').filter(s => (options.from !== undefined ? s.timestamp >= options.from : true) && (options.to !== undefined ? s.timestamp <= options.to : true));

  const requests = new Map<string, TimelineSignal>();
  const completions = new Map<string, TimelineSignal>();
  const failures = new Map<string, TimelineSignal>();
  for (const s of net) {
    const url = String(s.payload.url || '?');
    if (s.type === 'NETWORK_REQUEST_START') requests.set(url, s);
    else if (s.type === 'NETWORK_RESPONSE_COMPLETE') completions.set(url, s);
    else if (s.type === 'NETWORK_REQUEST_FAILED') failures.set(url, s);
  }

  const classify = (url: string, rt?: string): string => {
    if (rt) return rt;
    if (/\.css(\?|$)/i.test(url)) return 'stylesheet';
    if (/\.m?js(\?|$)/i.test(url)) return 'script';
    if (/\.(png|jpe?g|gif|webp|svg|ico|avif)(\?|$)/i.test(url)) return 'image';
    if (/\.(woff2?|ttf|otf|eot)(\?|$)/i.test(url)) return 'font';
    if (/data:|api\/|\/graphql|\.json(\?|$)/i.test(url)) return 'fetch';
    return 'other';
  };

  const firstStart = requests.size > 0 ? Math.min(...Array.from(requests.values()).map(s => s.timestamp)) : 0;
  const waterfall: WaterfallEntry[] = [];
  for (const [url, req] of requests) {
    const complete = completions.get(url);
    const failed = failures.get(url);
    const end = complete?.timestamp ?? failed?.timestamp ?? req.timestamp;
    waterfall.push({
      url,
      resourceType: classify(url, String(req.payload.resourceType || '')),
      startMs: req.timestamp - firstStart,
      durationMs: end - req.timestamp,
      status: Number(complete?.payload.status ?? failed?.payload.status ?? 0) || undefined,
      size: Number(complete?.payload.size ?? complete?.payload.responseSize ?? 0) || undefined,
      phase: complete ? 'complete' : failed ? 'failed' : 'request',
    });
  }
  for (const [url, complete] of completions) {
    if (!requests.has(url)) {
      waterfall.push({ url, resourceType: classify(url), startMs: complete.timestamp - firstStart, durationMs: 0, status: Number(complete.payload.status ?? 0) || undefined, size: Number(complete.payload.size ?? 0) || undefined, phase: 'complete' });
    }
  }
  waterfall.sort((a, b) => a.startMs - b.startMs);

  // milestones: DOM readiness + visual
  const milestones: Array<{ milestone: string; timestamp: number; source: string }> = [];
  for (const s of engine.signals) {
    if (s.type === 'NAV_DOM_LOADED') milestones.push({ milestone: 'domContentLoaded', timestamp: s.timestamp, source: s.eventId });
    if (s.type === 'NAV_LOAD') milestones.push({ milestone: 'load', timestamp: s.timestamp, source: s.eventId });
    if (s.domain === 'SCREENSHOT') milestones.push({ milestone: `visual checkpoint (${s.summary.slice(0, 40)})`, timestamp: s.timestamp, source: s.eventId });
  }
  milestones.sort((a, b) => a.timestamp - b.timestamp);

  const byType: Record<string, number> = {};
  let totalBytes = 0;
  for (const w of waterfall) {
    byType[w.resourceType] = (byType[w.resourceType] || 0) + 1;
    totalBytes += w.size ?? 0;
  }
  const slowest = waterfall.length ? waterfall.reduce((a, b) => (b.durationMs > a.durationMs ? b : a)) : null;

  return {
    waterfall: waterfall.slice(0, 80),
    milestones: milestones.slice(0, 20),
    summary: {
      totalRequests: waterfall.length,
      failed: waterfall.filter(w => w.phase === 'failed').length,
      totalBytes,
      slowest,
      byType,
    },
  };
}
