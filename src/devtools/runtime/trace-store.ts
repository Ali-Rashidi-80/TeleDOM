/**
 * Performance trace sessions + web-vitals extraction from Chrome trace
 * event format. The analyzer operates on the standard Chrome
 * DevTools trace JSON (cat/name/ts/dur/ph/tid) — the SAME code path
 * runs for live CDP traces and for deterministic simulation fixtures
 * (always marked simulated: true, §16).
 */

import { TraceEventRecord, TraceSessionInfo, WebVitalsMetrics, ModeInfo } from '../types';

export interface TraceInsight {
  kind: 'long-task' | 'layout-shift' | 'lcp' | 'fcp' | 'script' | 'layout' | 'paint' | 'parse' | 'network';
  name: string;
  startUs: number;
  durationMs: number;
  details?: Record<string, unknown>;
}

export class TraceSessionStore {
  private sessions = new Map<string, { info: TraceSessionInfo; events: TraceEventRecord[] }>();
  private counter = 0;

  start(pageId: string, categories: string[]): { info: TraceSessionInfo; mode: ModeInfo } {
    for (const s of this.sessions.values()) {
      if (s.info.pageId === pageId && !s.info.stoppedAt) {
        throw new Error(`MUTATION_CONFLICT-like state: a trace is already active for page ${pageId} (${s.info.traceId}). Stop it first (dt_performance_stop_trace).`);
      }
    }
    const traceId = `trace_${++this.counter}`;
    const sim = typeof (globalThis as any).__FORENSIC_SIMULATION__ !== 'undefined';
    const info: TraceSessionInfo = {
      traceId,
      pageId,
      mode: sim ? 'SIMULATED' : 'LIVE',
      startedAt: Date.now(),
      categories,
      eventCount: 0,
      simulated: sim,
    };
    this.sessions.set(traceId, { info, events: [] });
    return { info, mode: { mode: info.mode, simulated: sim, note: sim ? 'Deterministic simulated trace buffer — NOT real Chrome trace data.' : 'Live trace via CDP Tracing domain.', source: sim ? 'simulation' : 'cdp' } };
  }

  /** Append raw trace events (live CDP or deterministic fixture). */
  append(traceId: string, events: TraceEventRecord[]): number {
    const session = this.sessions.get(traceId);
    if (!session) throw new Error(`RESOURCE_EXHAUSTED: unknown trace session '${traceId}'.`);
    session.events.push(...events);
    session.info.eventCount = session.events.length;
    return session.events.length;
  }

  stop(traceId: string): { info: TraceSessionInfo; events: TraceEventRecord[] } {
    const session = this.sessions.get(traceId);
    if (!session) throw new Error(`RESOURCE_EXHAUSTED: unknown trace session '${traceId}'.`);
    if (session.info.stoppedAt) throw new Error(`UNSUPPORTED_OPERATION: trace '${traceId}' already stopped.`);
    session.info.stoppedAt = Date.now();
    return { info: session.info, events: session.events.slice() };
  }

  get(traceId: string): { info: TraceSessionInfo; events: TraceEventRecord[] } | undefined {
    return this.sessions.get(traceId);
  }

  close(traceId: string): boolean {
    return this.sessions.delete(traceId);
  }

  list(): TraceSessionInfo[] {
    return Array.from(this.sessions.values()).map(s => s.info);
  }
}

// ---------------------------------------------------------------------------
// Trace analysis — real algorithms over Chrome trace format
// ---------------------------------------------------------------------------

export interface TraceAnalysis {
  traceId: string;
  eventCount: number;
  durationMs: number;
  webVitals: WebVitalsMetrics;
  insights: TraceInsight[];
  topLongTasks: TraceInsight[];
  layoutShiftSources: TraceInsight[];
  phaseBreakdown: Array<{ phase: string; totalMs: number; events: number }>;
}

/** Extract Web Vitals (LCP/INP/CLS/FCP) from a Chrome trace event list. */
export function extractWebVitals(events: TraceEventRecord[]): WebVitalsMetrics {
  let lcp: { value: number; timestamp: number; elementHint?: string } | undefined;
  let fcp: { value: number; timestamp: number } | undefined;
  let cls = 0;
  const clsSources: string[] = [];
  let inpCandidate: number | undefined;

  for (const e of events) {
    const name = e.name || '';
    if (name === 'largestContentfulPaint::Candidate' || name === 'largestContentfulPaint') {
      const value = Number(e.args?.['size'] ?? e.args?.['candidateIndex'] ?? 0);
      const ts = Number(e.args?.['timestamp'] ?? e.ts) / 1000;
      // keep the latest candidate before trace end
      if (!lcp || ts >= lcp.timestamp) {
        lcp = { value: Number(e.args?.['paintTime'] ?? ts) * 1000, timestamp: ts, elementHint: String(e.args?.['nodeName'] || e.args?.['elementId'] || '') || undefined };
      }
    } else if (name === 'firstContentfulPaint') {
      fcp = { value: e.ts / 1000, timestamp: e.ts / 1000 };
    } else if (name === 'LayoutShift' || name === 'layout-shift') {
      const score = Number(e.args?.['score'] ?? e.args?.['weightedScoreDelta'] ?? 0);
      cls += score;
      const hint = String(e.args?.['nodeNames'] || e.args?.['impactedNodes'] || e.name);
      if (hint && clsSources.length < 10) clsSources.push(hint);
    } else if (name === 'EventTiming' && e.ph === 'b') {
      // Interaction candidates use duration on the end event; approximate via dur.
      if (e.dur && e.dur > 0) {
        const ms = e.dur / 1000;
        if (inpCandidate === undefined || ms > inpCandidate) inpCandidate = ms;
      }
    }
  }

  const metrics: WebVitalsMetrics = {};
  if (lcp) metrics.lcp = { value: lcp.value, timestamp: lcp.timestamp, elementHint: lcp.elementHint };
  if (fcp) metrics.fcp = fcp;
  if (cls > 0) metrics.cls = { value: Number(cls.toFixed(4)), sourceHints: clsSources };
  if (inpCandidate !== undefined) metrics.inp = { value: Number(inpCandidate.toFixed(2)) };
  return metrics;
}

/** Full insight extraction: long tasks, shifts, phase totals. */
export function analyzeTrace(traceId: string, events: TraceEventRecord[]): TraceAnalysis {
  if (events.length === 0) {
    return {
      traceId,
      eventCount: 0,
      durationMs: 0,
      webVitals: { note: 'No trace events captured.' },
      insights: [],
      topLongTasks: [],
      layoutShiftSources: [],
      phaseBreakdown: [],
    };
  }
  const sorted = events.slice().sort((a, b) => a.ts - b.ts);
  const firstTs = sorted[0].ts;
  const lastTs = Math.max(...sorted.map(e => e.ts + (e.dur || 0)));
  const durationMs = (lastTs - firstTs) / 1000;

  const insights: TraceInsight[] = [];
  const phaseTotals = new Map<string, { totalMs: number; events: number }>();

  for (const e of sorted) {
    const durMs = (e.dur || 0) / 1000;
    const cat = (e.cat || '').split(',')[0];
    const isComplete = e.ph === 'X' || e.ph === 'B';

    if (isComplete && durMs > 0) {
      const entry = phaseTotals.get(cat) || { totalMs: 0, events: 0 };
      entry.totalMs += durMs;
      entry.events++;
      phaseTotals.set(cat, entry);
    }

    // Long tasks: >50ms on the main thread per RUM guidance.
    if (isComplete && durMs > 50 && (cat.includes('devtools.timeline') || cat.includes('toplevel') || e.name === 'RunTask' || e.name === 'FunctionCall')) {
      insights.push({ kind: 'long-task', name: e.name, startUs: e.ts, durationMs: durMs, details: { cat: e.cat, tid: e.tid } });
    }
    if (e.name === 'LayoutShift' || e.name === 'layout-shift') {
      insights.push({ kind: 'layout-shift', name: e.name, startUs: e.ts, durationMs: durMs, details: { score: e.args?.['score'] ?? e.args?.['weightedScoreDelta'], sources: e.args?.['nodeNames'] } });
    }
    if (e.name === 'largestContentfulPaint::Candidate') {
      insights.push({ kind: 'lcp', name: e.name, startUs: e.ts, durationMs: durMs, details: e.args });
    }
    if (e.name === 'ParseHTML' || cat === 'blink.ParseHTML') {
      insights.push({ kind: 'parse', name: e.name, startUs: e.ts, durationMs: durMs });
    }
    if (e.name === 'Layout' || e.name === 'UpdateLayoutTree') {
      insights.push({ kind: 'layout', name: e.name, startUs: e.ts, durationMs: durMs });
    }
    if (e.name === 'Paint' || e.name === 'CompositeLayers') {
      insights.push({ kind: 'paint', name: e.name, startUs: e.ts, durationMs: durMs });
    }
    if (cat.includes('netlog') || e.name.startsWith('Resource')) {
      insights.push({ kind: 'network', name: e.name, startUs: e.ts, durationMs: durMs });
    }
  }

  const topLongTasks = insights.filter(i => i.kind === 'long-task').sort((a, b) => b.durationMs - a.durationMs).slice(0, 10);
  const layoutShiftSources = insights.filter(i => i.kind === 'layout-shift');

  return {
    traceId,
    eventCount: events.length,
    durationMs,
    webVitals: extractWebVitals(sorted),
    insights: insights.slice(0, 400),
    topLongTasks,
    layoutShiftSources,
    phaseBreakdown: Array.from(phaseTotals.entries())
      .map(([phase, v]) => ({ phase, totalMs: Number(v.totalMs.toFixed(2)), events: v.events }))
      .sort((a, b) => b.totalMs - a.totalMs),
  };
}

/**
 * Deterministic simulation fixture: generates trace events in the SAME
 * Chrome trace format the analyzer consumes. Used only when no CDP
 * session exists; every result carries simulated: true (§16) and the
 * data is explicitly NOT presented as real Chrome measurements.
 */
export function buildSimulatedTraceFixture(seed: number = 1): TraceEventRecord[] {
  let s = seed * 2654435761 % 2147483647;
  const rnd = (mod: number) => { s = (s * 16807) % 2147483647; return (s % mod) + 1; };
  const base = 1000;
  const events: TraceEventRecord[] = [];
  events.push({ name: 'TracingStartedInBrowser', cat: 'disabled-by-default-devtools.trace', ts: base, dur: 0, pid: 1, tid: 1, ph: 'I' });
  events.push({ name: 'firstContentfulPaint', cat: 'loading,rail,devtools.timeline', ts: base + 120, dur: 0, pid: 1, tid: 1, ph: 'R' });
  events.push({ name: 'largestContentfulPaint::Candidate', cat: 'loading,rail,devtools.timeline', ts: base + 320 + rnd(200), dur: 0, pid: 1, tid: 1, ph: 'R', args: { size: 42000, paintTime: 0.32 } });
  // main-thread tasks
  for (let i = 0; i < 6; i++) {
    events.push({ name: 'RunTask', cat: 'toplevel', ts: base + i * 300, dur: rnd(40) * 1000, pid: 1, tid: 2, ph: 'X' });
  }
  events.push({ name: 'FunctionCall', cat: 'devtools.timeline', ts: base + 900, dur: 82000, pid: 1, tid: 2, ph: 'X', args: { functionName: 'renderDashboard' } });
  events.push({ name: 'UpdateLayoutTree', cat: 'devtools.timeline', ts: base + 1000, dur: 24000, pid: 1, tid: 2, ph: 'X' });
  events.push({ name: 'Layout', cat: 'devtools.timeline', ts: base + 1030, dur: 18000, pid: 1, tid: 2, ph: 'X' });
  events.push({ name: 'Paint', cat: 'devtools.timeline', ts: base + 1050, dur: 12000, pid: 1, tid: 2, ph: 'X' });
  events.push({ name: 'ParseHTML', cat: 'devtools.timeline', ts: base + 10, dur: 15000, pid: 1, tid: 2, ph: 'X' });
  events.push({ name: 'LayoutShift', cat: 'loading,rail,devtools.timeline', ts: base + 1100, dur: 0, pid: 1, tid: 2, ph: 'R', args: { score: 0.113, nodeNames: 'div#banner img.hero' } });
  events.push({ name: 'EventTiming', cat: 'devtools.timeline.event', ts: base + 1400, dur: 96000, pid: 1, tid: 2, ph: 'X', args: { interactionId: 7 } });
  return events;
}

export const traceStore = new TraceSessionStore();
