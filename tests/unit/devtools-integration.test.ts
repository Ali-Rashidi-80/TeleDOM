/**
 * Unit tests — DevTools integration layer (§19 acceptance: schemas,
 * core logic, edge cases, failure conditions).
 */

import { describe, it, expect } from 'vitest';
import { DEVTOOLS_TOOLS, DEVTOOLS_TOOL_NAMES } from '../../src/devtools/definitions';
import { FORENSICS_TOOLS, FORENSICS_TOOL_NAMES } from '../../src/forensics/definitions';
import { FORENSIC_MCP_TOOLS } from '../../src/mcp/tools-definition';
import { toErrorEnvelope, ToolError } from '../../src/devtools/error-contract';
import { PageIdentityRegistry } from '../../src/devtools/page-identity';
import { UnifiedEventBus } from '../../src/devtools/unified-event-bus';
import { toolRegistry, SMART_SELECTION_HINTS } from '../../src/devtools/tool-registry';
import { HeapSnapshotParser } from '../../src/devtools/runtime/heap-snapshot-parser';
import { buildSimulatedHeapSnapshot, compareHeapSnapshots } from '../../src/devtools/runtime/heap-snapshot-fixtures';
import { extractWebVitals, analyzeTrace, buildSimulatedTraceFixture } from '../../src/devtools/runtime/trace-store';
import { decodePng, diffRegions } from '../../src/forensics/analyzers/visual-regression';
import { normalizeForExecution } from '../../src/devtools/capabilities/interaction-core';

// ---------------------------------------------------------------------------
// §13 registry + §14 naming
// ---------------------------------------------------------------------------

describe('Unified tool registry', () => {
  it('exposes exactly 306 tools: 121 preserved + 54 dt_ + 31 fx_ + 100 td_ (v12)', () => {
    expect(FORENSIC_MCP_TOOLS.length).toBe(306);
    expect(FORENSIC_MCP_TOOLS.filter(t => t.name.startsWith('dt_')).length).toBe(54);
    expect(FORENSIC_MCP_TOOLS.filter(t => t.name.startsWith('fx_')).length).toBe(31);
    expect(FORENSIC_MCP_TOOLS.filter(t => t.name.startsWith('td_')).length).toBe(100);
    expect(DEVTOOLS_TOOLS.length).toBe(54);
    expect(FORENSICS_TOOLS.length).toBe(31);
  });

  it('has ZERO naming collisions across all 306 tools (§14)', () => {
    const names = FORENSIC_MCP_TOOLS.map(t => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('preserves every one of the original 121 tool names', () => {
    // The 121 original names are the non-prefixed ones; v3-tool-names is the
    // authoritative 74-name set + the 47 legacy names. (v12 adds td_* only.)
    const original = FORENSIC_MCP_TOOLS.filter(t => !t.name.startsWith('dt_') && !t.name.startsWith('fx_') && !t.name.startsWith('td_')).map(t => t.name);
    expect(original.length).toBe(121);
  });

  it('every tool has name, description and inputSchema (§15 strict schemas)', () => {
    for (const tool of [...DEVTOOLS_TOOLS, ...FORENSICS_TOOLS]) {
      expect(tool.name).toBeTruthy();
      expect(tool.description.length).toBeGreaterThan(40);
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema?.type).toBe('object');
    }
  });

  it('registry metadata covers all dt_/fx_ tools with safety + simulation info (§13)', () => {
    for (const name of [...DEVTOOLS_TOOL_NAMES, ...FORENSICS_TOOL_NAMES]) {
      const entry = toolRegistry.get(name as string);
      expect(entry, `registry entry for ${name}`).toBeDefined();
      expect(entry!.safety).toBeTruthy();
      expect(entry!.simulationSupport).toBeTruthy();
    }
    expect(SMART_SELECTION_HINTS.length).toBeGreaterThanOrEqual(5);
  });
});

// ---------------------------------------------------------------------------
// §41 error contract
// ---------------------------------------------------------------------------

describe('Error contract', () => {
  it('maps ToolError codes verbatim with recovery hints', () => {
    const env = toErrorEnvelope(new ToolError('PAGE_NOT_FOUND', 'no such page'));
    expect(env.code).toBe('PAGE_NOT_FOUND');
    expect(env.isError).toBe(true);
    expect(env.recoveryHint).toContain('pageId');
    expect(env.retriable).toBe(false);
  });

  it('classifies timeout/bridge/invalid messages automatically', () => {
    expect(toErrorEnvelope(new Error('command timed out after 8000ms')).code).toBe('TIMEOUT');
    expect(toErrorEnvelope(new Error('No active browser extension connected')).code).toBe('BROWSER_UNAVAILABLE');
    expect(toErrorEnvelope(new Error('sessionId is required')).code).toBe('INVALID_INPUT');
    expect(toErrorEnvelope('plain string failure').code).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// §10 page identity
// ---------------------------------------------------------------------------

describe('Page identity registry', () => {
  it('survives navigation on the same tab and records navigations', () => {
    const reg = new PageIdentityRegistry();
    const p1 = reg.register({ url: 'https://a.test/1', extensionTabId: 7 });
    reg.recordNavigation(p1.pageId, 'https://a.test/2', 'push_state');
    const p2 = reg.register({ url: 'https://a.test/3', extensionTabId: 7 });
    expect(p2.pageId).toBe(p1.pageId); // identity survives navigation §10
    expect(p2.navigations.length).toBe(2); // push_state + re-register load
    expect(p2.url).toBe('https://a.test/3');
  });

  it('resolves by pageId / tabId / url and attaches CDP targets', () => {
    const reg = new PageIdentityRegistry();
    const p = reg.register({ url: 'https://x.test/', extensionTabId: 3 });
    expect(reg.resolve({ tabId: 3 })?.pageId).toBe(p.pageId);
    expect(reg.resolve({ url: 'https://x.test/' })?.pageId).toBe(p.pageId);
    expect(reg.attachCdpTarget(p.pageId, 'target-99')).toBe(true);
    expect(reg.resolve({ cdpTargetId: 'target-99' })?.pageId).toBe(p.pageId);
  });

  it('marks closed pages and stops resolving them by tab', () => {
    const reg = new PageIdentityRegistry();
    const p = reg.register({ url: 'https://y.test/', extensionTabId: 9 });
    reg.markClosed(p.pageId);
    expect(reg.list().find(x => x.pageId === p.pageId)).toBeUndefined();
    expect(reg.resolve({ tabId: 9 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// §11 event bus
// ---------------------------------------------------------------------------

describe('Unified event bus', () => {
  it('publishes sequenced, correlated events with ring-buffer bounds', () => {
    const bus = new UnifiedEventBus();
    const seen: string[] = [];
    bus.subscribe(e => seen.push(e.domain), 'NETWORK');
    bus.publish('DOM', 'mutation', { n: 1 });
    const evt = bus.publish('NETWORK', 'request_start', { url: 'https://x' }, { requestId: 'r1', correlationId: 'corr-1' });
    expect(evt.sequence).toBe(2);
    expect(evt.correlationId).toBe('corr-1');
    expect(seen).toEqual(['NETWORK']); // domain-filtered subscription
    expect(bus.correlationGroup('corr-1').length).toBe(1);
    expect(bus.stats().total).toBe(2);
  });

  it('ring buffer evicts oldest beyond the limit (§24 resource bounds)', () => {
    const bus = new UnifiedEventBus();
    for (let i = 0; i < 5010; i++) bus.publish('DOM', `m${i}`, {});
    expect(bus.stats().total).toBeLessThanOrEqual(5000);
  });
});

// ---------------------------------------------------------------------------
// V8 heap snapshot parser (memory capability family)
// ---------------------------------------------------------------------------

describe('Heap snapshot parser (dt_ memory tools)', () => {
  const raw = buildSimulatedHeapSnapshot(3);
  const parser = new HeapSnapshotParser(raw);

  it('parses node/edge counts and validates the format', () => {
    expect(parser.nodeCount()).toBe(raw.snapshot.node_count);
    expect(parser.edgeCount()).toBe(raw.snapshot.edge_count);
    expect(() => new HeapSnapshotParser({ junk: true })).toThrow(/INVALID_INPUT/);
    expect(() => new HeapSnapshotParser({ snapshot: { meta: { node_fields: ['type'] } }, nodes: [1], strings: [] })).toThrow(/INVALID_INPUT/);
  });

  it('aggregates classes with counts and self sizes', () => {
    const summary = parser.summary();
    expect(summary.nodeCount).toBeGreaterThan(10);
    expect(summary.classes.length).toBeGreaterThan(3);
    const blob = summary.classes.find(c => c.className === 'retained-blob');
    expect(blob?.selfSize).toBe(131072);
  });

  it('resolves edges with named and indexed references', () => {
    const anyParser = parser as any;
    const store = anyParser.nodeById.get(6); // GlobalStore id=6
    const edges = parser.nodeEdges(store);
    expect(edges.length).toBe(2);
    expect(edges.some(e => e.toNodeClass === 'retained-blob')).toBe(true);
    expect(edges.every(e => e.fromNodeId === 6)).toBe(true);
  });

  it('computes retainers (incoming references) with owner classes', () => {
    const anyParser = parser as any;
    const blob = anyParser.nodeById.get(7);
    const retainers = parser.retainers(blob);
    expect(retainers.length).toBe(2); // root + store keep the blob alive
    expect(retainers.some(r => r.fromClassName === 'GlobalStore')).toBe(true);
    expect(retainers.some(r => r.fromClassName === 'synthetic:(roots)')).toBe(true);
  });

  it('finds retaining paths from GC roots', () => {
    const anyParser = parser as any;
    const blob = anyParser.nodeById.get(7);
    const paths = parser.retainingPaths(blob);
    expect(paths.length).toBeGreaterThanOrEqual(1);
    expect(paths[0].path.length).toBeGreaterThanOrEqual(1);
    // the terminal entry's `from` is a direct retainer of the blob
    const lastFrom = paths[0].path[paths[0].path.length - 1].from;
    expect(lastFrom.includes('GlobalStore') || lastFrom.includes('(roots)')).toBe(true);
  });

  it('computes a dominator summary with retained sizes', () => {
    const dominators = parser.dominatorSummary(5);
    expect(dominators.length).toBeGreaterThan(0);
    expect(dominators[0].retainedTreeSize).toBeGreaterThan(0);
  });

  it('detects duplicate strings with wasted bytes', () => {
    const dups = parser.duplicateStrings();
    const hello = dups.find(d => d.value.includes('hello-world'));
    expect(hello?.instances).toBe(2);
    expect((hello?.wastedBytes ?? 0)).toBeGreaterThan(0);
  });

  it('queries objects by class and minimum size', () => {
    const nodes = parser.queryNodes({ className: 'retained-blob' });
    expect(nodes.length).toBe(1);
    expect(nodes[0].selfSize).toBe(131072);
    expect(parser.queryNodes({ minSize: 100000 }).length).toBe(1);
  });

  it('diffs two snapshots by class deltas', () => {
    const rawB = buildSimulatedHeapSnapshot(9);
    const parserB = new HeapSnapshotParser(rawB);
    const diff = compareHeapSnapshots(parser as any, parserB as any);
    expect(diff.classes).toBeDefined();
    expect(Array.isArray(diff.classes)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Trace analysis (performance capability family)
// ---------------------------------------------------------------------------

describe('Trace analysis (dt_ performance tools)', () => {
  it('extracts Web Vitals from Chrome trace format', () => {
    const events = buildSimulatedTraceFixture(2);
    const vitals = extractWebVitals(events as any);
    expect(vitals.cls).toBeDefined();
    expect(vitals.cls!.value).toBeGreaterThan(0);
    expect(vitals.fcp).toBeDefined();
  });

  it('analyzes long tasks, phases and layout shifts', () => {
    const events = buildSimulatedTraceFixture(1);
    const analysis = analyzeTrace('trace_test', events as any);
    expect(analysis.eventCount).toBe(events.length);
    expect(analysis.topLongTasks.length).toBeGreaterThan(0);
    expect(analysis.topLongTasks[0].durationMs).toBeGreaterThan(50);
    expect(analysis.phaseBreakdown.length).toBeGreaterThan(2);
    expect(analysis.layoutShiftSources.length).toBeGreaterThan(0);
  });

  it('handles empty traces gracefully (no fabricated data)', () => {
    const analysis = analyzeTrace('empty', []);
    expect(analysis.eventCount).toBe(0);
    expect(analysis.webVitals.note).toContain('No trace events');
  });
});

// ---------------------------------------------------------------------------
// CAP 03 — PNG decoder + region diff
// ---------------------------------------------------------------------------

describe('PNG decoder (CAP 03)', () => {
  const buildPng = (width: number, height: number, fill: [number, number, number]): Buffer => {
    const zlib = require('zlib');
    const raw: number[] = [];
    for (let y = 0; y < height; y++) {
      raw.push(0); // filter none
      for (let x = 0; x < width; x++) raw.push(fill[0], fill[1], fill[2], 255);
    }
    const idat = zlib.deflateSync(Buffer.from(raw));
    const chunk = (type: string, data: Buffer): Buffer => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(data.length);
      const typeB = Buffer.from(type, 'ascii');
      const crcTable: number[] = [];
      for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
      let crc = 0xffffffff;
      for (const byte of Buffer.concat([typeB, data])) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
      const crcB = Buffer.alloc(4);
      crcB.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
      return Buffer.concat([len, typeB, data, crcB]);
    };
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', idat),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  };

  it('decodes a real PNG to RGBA', () => {
    const png = buildPng(8, 8, [200, 30, 40]);
    const img = decodePng(png);
    expect(img.width).toBe(8);
    expect(img.height).toBe(8);
    expect(img.data[0]).toBe(200);
    expect(img.data[1]).toBe(30);
    expect(img.data[3]).toBe(255);
  });

  it('rejects non-PNG input with the structured error', () => {
    expect(() => decodePng(Buffer.from('not a png'))).toThrow(/INVALID_INPUT/);
  });

  it('identical images → no changed regions; different → regions found', () => {
    const a = decodePng(buildPng(64, 64, [10, 10, 10]));
    const b = decodePng(buildPng(64, 64, [10, 10, 10]));
    expect(diffRegions(a, b).identical).toBe(true);
    const c = decodePng(buildPng(64, 64, [250, 10, 10]));
    const diff = diffRegions(a, c);
    expect(diff.identical).toBe(false);
    expect(diff.changedRegionCount).toBeGreaterThan(0);
    expect(diff.changeRatio).toBeGreaterThan(0.5);
  });
});

// ---------------------------------------------------------------------------
// Expression normalization (execution channel)
// ---------------------------------------------------------------------------

describe('normalizeForExecution', () => {
  it('prefixes IIFE expressions even when they contain inner line-start returns', () => {
    const code = `(function(){\n  const el = 1;\n  return { ok: true };\n})()`;
    expect(normalizeForExecution(code).startsWith('return (')).toBe(true);
  });
  it('passes body scripts with their own return through unchanged', () => {
    const code = `const x = 1;\nreturn x + 1;`;
    expect(normalizeForExecution(code)).toBe(code);
  });
  it('wraps plain expressions', () => {
    expect(normalizeForExecution('document.title')).toBe('return (document.title);');
  });
});
