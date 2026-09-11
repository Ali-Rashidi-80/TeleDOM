/**
 * TeleDOM v12+ Benchmarks — REAL measurements, not marketing.
 *
 * Matrix: 10K / 100K / 1M events (10M documented as extrapolation guard
 * bound). Measures capture overhead (admission), bytes/event,
 * reconstruction p50/p95/p99, temporal query p50/p95/p99, graph query
 * latency, investigation latency, branch simulation latency, recovery
 * time. Timestamp RESOLUTION is never conflated with reconstruction or
 * query LATENCY — separate columns.
 */

import { EventMesh, EventEnvelope, EventSource } from '../kernel';
import { TemporalEngine } from '../temporal/queries';
import { IndexedEventStore } from '../temporal/event-store';
import { CausalEngine } from '../causality/engine';
import { EvidenceGraph } from '../evidence/graph';
import { CounterfactualEngine } from '../simulation/counterfactual';

export interface ScaleResult {
  events: number;
  /** One-decimal ms precision; timestamp resolution is tracked separately. */
  timestampResolutionMs: number;
  captureOverheadMsPer10k: number;
  bytesPerEvent: number;
  reconstructionP50: number;
  reconstructionP95: number;
  reconstructionP99: number;
  temporalQueryP50: number;
  temporalQueryP95: number;
  temporalQueryP99: number;
  graphQueryLatencyMs: number;
  investigationLatencyMs: number;
  branchSimulationLatencyMs: number;
  recoveryTimeMs: number;
  degraded: boolean;
}

export interface BenchmarkReport {
  results: ScaleResult[];
  notes: string[];
  generatedAt: string;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return Math.round(sorted[idx] * 100) / 100;
}

function buildStream(count: number, mesh: EventMesh): EventEnvelope[] {
  const events: EventEnvelope[] = [];
  const sources: EventSource[] = ['dom', 'network', 'runtime', 'console', 'user'];
  for (let i = 0; i < count; i++) {
    const ev = mesh.emit(sources[i % 5], `bench-${sources[i % 5]}`, { i: i % 100 }, { entityIds: [`e:${i % 50}`] });
    events.push(ev);
  }
  return events;
}

/** Run the benchmark matrix for one scale. */
export function benchmarkScale(count: number): ScaleResult {
  // --- capture overhead ---
  const mesh = new EventMesh();
  const captureStart = performance.now();
  const events = buildStream(count, mesh);
  const captureMs = performance.now() - captureStart;

  // --- storage ---
  const store = new IndexedEventStore(Math.min(count, 50_000));
  const storeStart = performance.now();
  for (const ev of events) store.admit(ev);
  const storeMs = performance.now() - storeStart;
  const stats = store.stats();
  const bytesPerEvent = Math.round(stats.bytesEstimate / Math.max(1, stats.events));

  // --- temporal engine: reconstruction + query latency ---
  const temporal = new TemporalEngine(200);
  for (const ev of events) temporal.ingest(ev, undefined);
  const reconstructionSamples: number[] = [];
  const querySamples: number[] = [];
  const probes = Math.min(60, Math.max(10, Math.floor(count / 1000)));
  for (let i = 0; i < probes; i++) {
    const t = Math.floor((events.length / probes) * (i + 1));
    const target = events[Math.min(t, events.length - 1)];
    // State(T) reconstruction.
    const r = temporal.stateAt(target.logicalTime);
    reconstructionSamples.push(r.meta.reconstructionMs);
    // Temporal window query.
    const qStart = performance.now();
    temporal.window(target.logicalTime, 250);
    querySamples.push(performance.now() - qStart);
  }
  reconstructionSamples.sort((a, b) => a - b);
  querySamples.sort((a, b) => a - b);

  // --- causal graph query ---
  const graph = new EvidenceGraph();
  const causal = new CausalEngine(graph);
  const graphStart = performance.now();
  const links = causal.correlate(events.slice(-2000), 250);
  causal.buildGraph(events.slice(-2000), links.slice(0, 500));
  const graphQueryMs = performance.now() - graphStart;

  // --- investigation latency (hypotheses on a bounded window) ---
  const investigationStart = performance.now();
  const window = events.slice(-2000);
  const symptom = window[window.length - 1];
  const hypotheses = causal.generateHypotheses(symptom, window, 250);
  const investigationMs = performance.now() - investigationStart;

  // --- branch simulation latency ---
  const counterfactual = new CounterfactualEngine(causal);
  const branchStart = performance.now();
  const outcome = counterfactual.run(
    events,
    { kind: 'suppress-event', targetSequence: Math.max(1, events.length - 50), reason: 'bench' },
    (e) => e.type === 'bench-dom',
  );
  const branchMs = performance.now() - branchStart;
  void outcome;

  // --- recovery time (serialize + restore into a fresh mesh) ---
  const recoveryStart = performance.now();
  const serialized = mesh.serialize();
  const probeMesh = new EventMesh();
  probeMesh.restore({ events: serialized.events, chainTip: serialized.chainTip });
  const recoveryMs = performance.now() - recoveryStart;

  return {
    events: count,
    timestampResolutionMs: 0.01,
    captureOverheadMsPer10k: Math.round((captureMs / count) * 10_000 * 100) / 100,
    bytesPerEvent,
    reconstructionP50: percentile(reconstructionSamples, 50),
    reconstructionP95: percentile(reconstructionSamples, 95),
    reconstructionP99: percentile(reconstructionSamples, 99),
    temporalQueryP50: percentile(querySamples, 50),
    temporalQueryP95: percentile(querySamples, 95),
    temporalQueryP99: percentile(querySamples, 99),
    graphQueryLatencyMs: Math.round(graphQueryMs * 100) / 100,
    investigationLatencyMs: Math.round(investigationMs * 100) / 100,
    branchSimulationLatencyMs: Math.round(branchMs * 100) / 100,
    recoveryTimeMs: Math.round(recoveryMs * 100) / 100,
    degraded: hypotheses.length === 0 && count > 100,
  };
}

export function runBenchmarks(scales: number[] = [10_000, 100_000, 1_000_000]): BenchmarkReport {
  const results = scales.map((s) => benchmarkScale(s));
  return {
    results,
    notes: [
      'timestamp resolution (0.01ms) is reported SEPARATELY from reconstruction/query latency — never conflated',
      'capture overhead = mesh admission (integrity hashing + dedup + gap detection) per 10K events',
      '1M-event scale exercises tiered store demotion (hot→warm→cold) and bounded reconstruction budgets',
      '10M-event scale: the same admission path applies; IndexedEventStore hot capacity bounds memory; results are bounded by the same code paths (documented, not claimed as measured)',
      'these are local deterministic measurements on this machine, not marketing numbers',
    ],
    generatedAt: new Date().toISOString(),
  };
}
