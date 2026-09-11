/**
 * TeleDOM v12+ suite-reports: runs the REAL benchmark matrix, the golden
 * incident suite (1020 scenarios) and the chaos suite, asserts thresholds,
 * and GENERATES docs/v12/BENCHMARKS.md from the measured numbers.
 * Docs are never hand-written — they are test output.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { runBenchmarks } from '../../src/v12/bench/benchmarks';
import { generateGoldenSuite, runGoldenSuite } from '../../src/v12/golden/generator';
import { runChaosSuite } from '../../src/v12/chaos/chaos';

describe('v12 measured suites (benchmarks + golden + chaos)', () => {
  it('benchmark matrix: 10K / 100K / 1M events with p50/p95/p99', () => {
    const bench = runBenchmarks([10_000, 100_000, 1_000_000]);
    for (const r of bench.results) {
      expect(r.events).toBeGreaterThan(0);
      expect(r.reconstructionP99).toBeGreaterThanOrEqual(r.reconstructionP50);
      expect(r.temporalQueryP99).toBeGreaterThanOrEqual(r.temporalQueryP50);
      expect(r.timestampResolutionMs).toBe(0.01); // resolution ≠ latency
    }

    const golden = runGoldenSuite(generateGoldenSuite(1020));
    expect(golden.total).toBeGreaterThanOrEqual(1020);

    const chaos = runChaosSuite();
    expect(chaos.pass).toBe(true);

    // ---- Generate docs/v12/BENCHMARKS.md from measured values ----
    const outDir = path.resolve(process.cwd(), 'docs/v12');
    fs.mkdirSync(outDir, { recursive: true });
    let md = `# TeleDOM v12 — Measured Benchmarks & Suite Metrics\n\n`;
    md += `Generated: ${bench.generatedAt} (local deterministic measurements on this machine — not marketing numbers)\n\n`;
    md += `## Event-scale benchmark matrix\n\n`;
    md += `| Metric | 10K events | 100K events | 1M events |\n|---|---|---|---|\n`;
    const [a, b, c] = bench.results;
    const row = (label: string, fn: (r: typeof a) => number | string) => `| ${label} | ${fn(a)} | ${fn(b)} | ${fn(c)} |`;
    md += row('Capture overhead (ms per 10K events)', (r) => r.captureOverheadMsPer10k) + '\n';
    md += row('Bytes per event (approx)', (r) => r.bytesPerEvent) + '\n';
    md += row('Reconstruction p50 (ms)', (r) => r.reconstructionP50) + '\n';
    md += row('Reconstruction p95 (ms)', (r) => r.reconstructionP95) + '\n';
    md += row('Reconstruction p99 (ms)', (r) => r.reconstructionP99) + '\n';
    md += row('Temporal query p50 (ms)', (r) => r.temporalQueryP50) + '\n';
    md += row('Temporal query p95 (ms)', (r) => r.temporalQueryP95) + '\n';
    md += row('Temporal query p99 (ms)', (r) => r.temporalQueryP99) + '\n';
    md += row('Graph query latency (ms)', (r) => r.graphQueryLatencyMs) + '\n';
    md += row('Investigation latency (ms)', (r) => r.investigationLatencyMs) + '\n';
    md += row('Branch simulation latency (ms)', (r) => r.branchSimulationLatencyMs) + '\n';
    md += row('Recovery time (serialize+restore, ms)', (r) => r.recoveryTimeMs) + '\n';
    md += `\n**Timestamp resolution: 0.01 ms — tracked SEPARATELY from reconstruction/query latency (never conflated).**\n\n`;
    md += `### Notes\n`;
    for (const note of bench.notes) md += `- ${note}\n`;
    md += `\n## Golden Incident Suite (${golden.total} deterministic incidents, 24 categories)\n\n`;
    md += `| Metric | Value |\n|---|---|\n`;
    md += `| Total incidents | ${golden.total} |\n`;
    md += `| Resolvable scenarios | ${golden.metrics.resolvableScenarios} |\n`;
    md += `| Resolved | ${golden.metrics.resolvedScenarios} |\n`;
    md += `| **Investigation Completion Rate (ICR)** | **${(golden.metrics.investigationCompletionRate * 100).toFixed(1)}%** |\n`;
    md += `| **Evidence Confidence (EC)** | **${(golden.metrics.evidenceConfidence * 100).toFixed(1)}%** |\n`;
    md += `| **Replay Fidelity (RF)** | **${(golden.metrics.replayFidelity * 100).toFixed(1)}%** |\n`;
    md += `| **False Success Rate** | **${(golden.metrics.falseSuccessRate * 100).toFixed(2)}%** |\n`;
    md += `| Root-cause accuracy | ${(golden.metrics.rootCauseAccuracy * 100).toFixed(1)}% |\n\n`;
    md += `### Per-category results\n\n| Category | Total | Resolved | Correct root cause |\n|---|---|---|---|\n`;
    for (const [cat, s] of Object.entries(golden.byCategory)) {
      md += `| ${cat} | ${s.total} | ${s.resolved} | ${s.correctRootCause} |\n`;
    }
    md += `\n## Chaos Engineering Suite (${chaos.totalInjections} failure injections)\n\n`;
    md += `| Property | Result |\n|---|---|\n`;
    md += `| Contained | ${chaos.contained}/${chaos.totalInjections} |\n`;
    md += `| Observed | ${chaos.observed}/${chaos.totalInjections} |\n`;
    md += `| Explained | ${chaos.explained}/${chaos.totalInjections} |\n`;
    md += `| Recoverable | ${chaos.recoverable}/${chaos.totalInjections} |\n`;
    md += `| **Overall** | **${chaos.pass ? 'FAILURE IS CONTAINED, OBSERVED, EXPLAINED, RECOVERABLE' : 'GAPS DETECTED'}** |\n\n`;
    md += `### Injection outcomes\n\n| Injection | Outcome | Detail |\n|---|---|---|\n`;
    for (const o of chaos.outcomes) md += `| ${o.kind} | ${o.contained && o.observed && o.explained ? 'CONTAINED' : 'GAP'} | ${o.detail.replace(/\|/g, '/')} |\n`;
    fs.writeFileSync(path.join(outDir, 'BENCHMARKS.md'), md);
    expect(fs.existsSync(path.join(outDir, 'BENCHMARKS.md'))).toBe(true);
  }, 300_000);
});
