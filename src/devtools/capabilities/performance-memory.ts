/**
 * PERFORMANCE + MEMORY capability families.
 *
 * Performance: trace lifecycle via the CDP gateway when live; a
 * deterministic SIMULATED buffer (clearly labeled, §16) otherwise.
 * The analyzer (extractWebVitals/analyzeTrace) runs real algorithms
 * over Chrome trace format in both cases.
 *
 * Memory: V8 .heapsnapshot parser in runtime/heap-snapshot-parser.ts
 * powers all 13 tools; live capture uses CDP HeapProfiler.
 */

import { unifiedRuntime } from '../runtime/unified-browser-runtime';
import { cdpGateway } from '../runtime/cdp-gateway';
import { traceStore, analyzeTrace, buildSimulatedTraceFixture } from '../runtime/trace-store';
import { heapStore } from '../runtime/heap-snapshot-store';
import { compareHeapSnapshots } from '../runtime/heap-snapshot-fixtures';
import { buildSimulatedHeapSnapshot } from '../runtime/heap-snapshot-fixtures';
import { resolvePageId } from './interaction-core';
import * as fs from 'fs';
import * as path from 'path';

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

export async function dtPerformanceStartTrace(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  const categories = Array.isArray(args.categories) && args.categories.length > 0
    ? args.categories.map(String)
    : ['devtools.timeline', 'loading', 'netlog'];

  if (unifiedRuntime.cdpAvailable() || (unifiedRuntime.hasBridge() && !isSimulation())) {
    // Live: attach CDP, enable domains, start tracing.
    try {
      const session = await cdpGateway.attach({ tabId });
      unifiedRuntime.markCdpAttached(true);
      await cdpGateway.send(session.sessionId, 'Tracing.start', { categories: categories.join(','), transferMode: 'ReturnAsStream' });
      const { info } = traceStore.start(pageId, categories);
      return { traceId: info.traceId, pageId, started: true, categories, mode: 'LIVE', simulated: false, cdpSession: session.sessionId };
    } catch (err: any) {
      // Fall through to simulation contract if the transport refuses CDP.
      if (!isSimulation()) throw err;
    }
  }

  // Simulation: deterministic trace buffer (explicitly labeled).
  const { info, mode } = traceStore.start(pageId, categories);
  traceStore.append(info.traceId, buildSimulatedTraceFixture(pageId.length));
  unifiedRuntime.bus.publish('PERFORMANCE', 'trace_start', { traceId: info.traceId, simulated: true }, { pageId, traceId: info.traceId });
  return {
    traceId: info.traceId,
    pageId,
    started: true,
    categories,
    ...mode,
    note: `${mode.note} Analysis algorithms are identical to live traces; the DATA here is a deterministic fixture, not real Chrome measurements.`,
  };
}

function isSimulation(): boolean {
  return typeof (globalThis as any).__FORENSIC_SIMULATION__ !== 'undefined';
}

export async function dtPerformanceStopTrace(args: Record<string, any>): Promise<Record<string, unknown>> {
  let traceId = args.traceId ? String(args.traceId) : undefined;
  const { pageId } = await resolvePageId(args);

  if (!traceId) {
    const active = traceStore.list().find(t => t.pageId === pageId && !t.stoppedAt);
    if (!active) throw new Error('RESOURCE_EXHAUSTED: no active trace for this page. Start one with dt_performance_start_trace.');
    traceId = active.traceId;
  }

  // Live CDP: collect streamed events into the store before stopping.
  const session = traceStore.get(traceId);
  if (session && session.info.mode === 'LIVE' && !session.info.stoppedAt && unifiedRuntime.cdpAvailable()) {
    for (const s of cdpGateway.listSessions()) {
      const stream = await cdpGateway.send(s.sessionId, 'Tracing.end', {}).catch(() => null);
      if (stream) {
        const events = Array.isArray((stream as any).events) ? (stream as any).events : [];
        traceStore.append(traceId, events);
      }
      break;
    }
  }

  const { info, events } = traceStore.stop(traceId);
  const analysis = analyzeTrace(traceId, events);
  unifiedRuntime.bus.publish('PERFORMANCE', 'trace_stop', { traceId, events: events.length }, { pageId, traceId });
  return {
    traceId,
    pageId,
    stopped: true,
    mode: info.mode,
    simulated: info.simulated,
    eventCount: events.length,
    durationMs: analysis.durationMs,
    webVitals: analysis.webVitals,
    topLongTasks: analysis.topLongTasks,
    layoutShifts: analysis.layoutShiftSources.slice(0, 20),
    phaseBreakdown: analysis.phaseBreakdown,
  };
}

export async function dtPerformanceAnalyzeInsight(args: Record<string, any>): Promise<Record<string, unknown>> {
  let events: any[] = [];
  let traceId = args.traceId ? String(args.traceId) : '';

  if (Array.isArray(args.events) && args.events.length > 0) {
    events = args.events;
    traceId = traceId || 'adhoc';
  } else if (traceId) {
    const session = traceStore.get(traceId);
    if (!session) throw new Error(`RESOURCE_EXHAUSTED: trace '${traceId}' not found.`);
    events = session.events;
  } else {
    throw new Error('INVALID_INPUT: provide traceId or events[] to analyze.');
  }

  const focus = String(args.insight || 'all');
  const analysis = analyzeTrace(traceId, events);
  const result: Record<string, unknown> = { traceId, eventCount: analysis.eventCount, durationMs: analysis.durationMs };
  switch (focus) {
    case 'long-tasks':
      return { ...result, topLongTasks: analysis.topLongTasks, longTaskCount: analysis.topLongTasks.length };
    case 'layout-shifts':
      return { ...result, layoutShifts: analysis.layoutShiftSources, cls: analysis.webVitals.cls };
    case 'web-vitals':
      return { ...result, webVitals: analysis.webVitals };
    case 'phases':
      return { ...result, phaseBreakdown: analysis.phaseBreakdown };
    default:
      return { ...result, webVitals: analysis.webVitals, topLongTasks: analysis.topLongTasks, layoutShifts: analysis.layoutShiftSources.slice(0, 20), phaseBreakdown: analysis.phaseBreakdown, insights: analysis.insights.slice(0, 100) };
  }
}

// ---------------------------------------------------------------------------
// Memory — heap snapshot tools
// ---------------------------------------------------------------------------

export async function dtTakeHeapsnapshot(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);

  // Pre-captured raw snapshot JSON (file path or inline).
  if (args.raw) {
    let rawText = String(args.raw);
    if (rawText.trim().startsWith('/') && fs.existsSync(rawText)) {
      rawText = fs.readFileSync(rawText, 'utf-8');
    }
    const entry = heapStore.loadFromJsonString(rawText, 'provided-json');
    return reportLoadedSnapshot(entry.snapshotId, entry.parser.nodeCount(), entry.parser.edgeCount(), 'LIVE', false, pageId, 'Provided snapshot JSON parsed and registered.');
  }
  if (args.saveToPath && !path.isAbsolute(String(args.saveToPath))) {
    throw new Error('INVALID_INPUT: saveToPath must be absolute.');
  }

  // Live capture via CDP HeapProfiler.
  if (unifiedRuntime.cdpAvailable()) {
    const session = await cdpGateway.attach({ tabId });
    const chunks: string[] = [];
    const stopListening = cdpGateway.onRemoteEvent(session.sessionId, (evt: any) => {
      if (evt?.method === 'HeapProfiler.addHeapSnapshotChunk') {
        chunks.push(String(evt.params?.chunk || ''));
      }
    });
    const result = await cdpGateway.send(session.sessionId, 'HeapProfiler.takeHeapSnapshot', { reportProgress: false });
    stopListening();
    const rawJson = chunks.join('');
    if (rawJson) {
      const entry = heapStore.loadFromJsonString(rawJson, `cdp:${session.targetId}`);
      if (args.saveToPath) fs.writeFileSync(String(args.saveToPath), rawJson);
      unifiedRuntime.bus.publish('MEMORY', 'heapsnapshot_taken', { snapshotId: entry.snapshotId, nodes: entry.parser.nodeCount() }, { pageId, snapshotId: entry.snapshotId });
      return reportLoadedSnapshot(entry.snapshotId, entry.parser.nodeCount(), entry.parser.edgeCount(), 'LIVE', false, pageId, 'Captured via CDP HeapProfiler.', args.saveToPath ? String(args.saveToPath) : undefined, result);
    }
    return { taken: false, mode: 'UNAVAILABLE', note: 'CDP attached but no snapshot stream was returned.', pageId };
  }

  // Simulation: deterministic fixture in the REAL .heapsnapshot format.
  const raw = buildSimulatedHeapSnapshot(pageId.length + 1);
  const rawText = JSON.stringify(raw);
  const entry = heapStore.loadFromRaw(raw, 'simulation-fixture', true);
  if (args.saveToPath) fs.writeFileSync(String(args.saveToPath), rawText);
  unifiedRuntime.bus.publish('MEMORY', 'heapsnapshot_taken', { snapshotId: entry.snapshotId, simulated: true }, { pageId, snapshotId: entry.snapshotId });
  return reportLoadedSnapshot(entry.snapshotId, entry.parser.nodeCount(), entry.parser.edgeCount(), 'SIMULATED', true, pageId,
    'Deterministic fixture in the REAL .heapsnapshot JSON format. Parser/analysis code paths are identical to live captures, but THIS DATA IS NOT a real V8 heap — contract validation only.',
    args.saveToPath ? String(args.saveToPath) : undefined);
}

function reportLoadedSnapshot(snapshotId: string, nodes: number, edges: number, mode: string, simulated: boolean, pageId: string, note: string, savedTo?: string, detail?: unknown): Record<string, unknown> {
  return { taken: true, snapshotId, nodeCount: nodes, edgeCount: edges, mode, simulated, pageId, note, savedTo, detail };
}

export async function dtCloseHeapsnapshot(args: Record<string, any>): Promise<Record<string, unknown>> {
  const closed = heapStore.close(String(args.snapshotId));
  if (!closed) throw new Error(`RESOURCE_EXHAUSTED: snapshot '${args.snapshotId}' is not open.`);
  return { closed: true, snapshotId: args.snapshotId };
}

export async function dtHeapsnapshotSummary(args: Record<string, any>): Promise<Record<string, unknown>> {
  const entry = heapStore.require(String(args.snapshotId));
  const limit = Number(args.limit) || 50;
  const summary = entry.parser.summary();
  return {
    snapshotId: entry.snapshotId,
    simulated: entry.simulated,
    nodeCount: summary.nodeCount,
    edgeCount: summary.edgeCount,
    totalSelfSize: summary.totalSelfSize,
    stringCount: summary.strings,
    classes: summary.classes.slice(0, limit),
  };
}

export async function dtHeapsnapshotDetails(args: Record<string, any>): Promise<Record<string, unknown>> {
  const entry = heapStore.require(String(args.snapshotId));
  const raw = entry.parser.rawSnapshot();
  return {
    snapshotId: entry.snapshotId,
    simulated: entry.simulated,
    origin: entry.origin,
    loadedAt: entry.loadedAt,
    parseDurationMs: entry.parser.parseDurationMs(),
    nodeCount: entry.parser.nodeCount(),
    edgeCount: entry.parser.edgeCount(),
    meta: raw.snapshot.meta,
    declaredCounts: { nodes: raw.snapshot.node_count, edges: raw.snapshot.edge_count },
  };
}

export async function dtHeapsnapshotClassNodes(args: Record<string, any>): Promise<Record<string, unknown>> {
  const entry = heapStore.require(String(args.snapshotId));
  if (!args.className) throw new Error('INVALID_INPUT: className is required.');
  const result = entry.parser.classNodes(String(args.className), Number(args.offset) || 0, Number(args.limit) || 50);
  return { snapshotId: entry.snapshotId, className: args.className, ...result, simulated: entry.simulated };
}

function findNodeParserTarget(args: Record<string, any>): { entry: ReturnType<typeof heapStore.require>; nodeId?: number; nodeIndex?: number } {
  const entry = heapStore.require(String(args.snapshotId));
  if (args.nodeId === undefined && args.nodeIndex === undefined) {
    throw new Error('INVALID_INPUT: provide nodeId (V8 object id) or nodeIndex.');
  }
  return { entry, nodeId: args.nodeId !== undefined ? Number(args.nodeId) : undefined, nodeIndex: args.nodeIndex !== undefined ? Number(args.nodeIndex) : undefined };
}

export async function dtHeapsnapshotEdges(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { entry, nodeId, nodeIndex } = findNodeParserTarget(args);
  const parser = entry.parser;
  const node = nodeId !== undefined ? (parser as any).nodeById.get(nodeId) : parser ? (undefined as any) : undefined;
  const resolved = nodeId !== undefined
    ? ((parser as any).nodeById.get(nodeId) || (parser as any).nodes[nodeIndex!])
    : (parser as any).nodes[nodeIndex!];
  if (!resolved) throw new Error(`RESOURCE_EXHAUSTED: node not found (nodeId=${nodeId}, nodeIndex=${nodeIndex}).`);
  const edges = parser.nodeEdges(resolved).slice(0, Number(args.limit) || 100);
  return { snapshotId: entry.snapshotId, node: { id: resolved.id, className: resolved.className, selfSize: resolved.selfSize }, edgeCount: resolved.edgeCount, edges, simulated: entry.simulated };
}

export async function dtHeapsnapshotRetainers(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { entry, nodeId, nodeIndex } = findNodeParserTarget(args);
  const parser = entry.parser as any;
  const resolved = nodeId !== undefined ? (parser.nodeById.get(nodeId) || parser.nodes[nodeIndex!]) : parser.nodes[nodeIndex!];
  if (!resolved) throw new Error(`RESOURCE_EXHAUSTED: node not found (nodeId=${nodeId}, nodeIndex=${nodeIndex}).`);
  const retainers = parser.retainers(resolved).slice(0, Number(args.limit) || 100);
  return { snapshotId: entry.snapshotId, node: { id: resolved.id, className: resolved.className, selfSize: resolved.selfSize }, retainerCount: retainers.length, retainers, simulated: entry.simulated };
}

export async function dtHeapsnapshotRetainingPaths(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { entry, nodeId, nodeIndex } = findNodeParserTarget(args);
  const parser = entry.parser as any;
  const resolved = nodeId !== undefined ? (parser.nodeById.get(nodeId) || parser.nodes[nodeIndex!]) : parser.nodes[nodeIndex!];
  if (!resolved) throw new Error(`RESOURCE_EXHAUSTED: node not found (nodeId=${nodeId}, nodeIndex=${nodeIndex}).`);
  const paths = parser.retainingPaths(resolved, Number(args.maxPaths) || 3);
  return { snapshotId: entry.snapshotId, node: { id: resolved.id, className: resolved.className }, pathCount: paths.length, paths, simulated: entry.simulated };
}

export async function dtHeapsnapshotDominators(args: Record<string, any>): Promise<Record<string, unknown>> {
  const entry = heapStore.require(String(args.snapshotId));
  const parser = entry.parser as any;
  const dominators = parser.dominatorSummary(Number(args.limit) || 20);
  return { snapshotId: entry.snapshotId, dominators, simulated: entry.simulated, algorithm: 'Iterative dominator computation (Cooper–Harvey–Kennedy) over the retained edge graph, retained sizes summed per dominated subtree.' };
}

export async function dtHeapsnapshotDuplicateStrings(args: Record<string, any>): Promise<Record<string, unknown>> {
  const entry = heapStore.require(String(args.snapshotId));
  const parser = entry.parser as any;
  const duplicates = parser.duplicateStrings().slice(0, Number(args.limit) || 50);
  let wasted = 0;
  for (const d of duplicates) wasted += d.wastedBytes;
  return { snapshotId: entry.snapshotId, duplicateGroups: duplicates.length, totalWastedBytes: wasted, duplicates, simulated: entry.simulated };
}

export async function dtHeapsnapshotObjectDetails(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { entry, nodeId, nodeIndex } = findNodeParserTarget(args);
  const parser = entry.parser as any;
  const details = parser.objectDetails(nodeId !== undefined ? nodeId : nodeIndex!);
  if (!details) throw new Error(`RESOURCE_EXHAUSTED: node not found (nodeId=${nodeId}, nodeIndex=${nodeIndex}).`);
  return { snapshotId: entry.snapshotId, ...details, simulated: entry.simulated } as Record<string, unknown>;
}

export async function dtQueryHeapsnapshotObjects(args: Record<string, any>): Promise<Record<string, unknown>> {
  const entry = heapStore.require(String(args.snapshotId));
  const parser = entry.parser as any;
  const nodes = parser.queryNodes({
    type: args.type ? String(args.type) : undefined,
    className: args.className ? String(args.className) : undefined,
    minSize: args.minSize !== undefined ? Number(args.minSize) : undefined,
    limit: Number(args.limit) || 50,
  });
  return { snapshotId: entry.snapshotId, matched: nodes.length, nodes, simulated: entry.simulated };
}

export async function dtCompareHeapsnapshots(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.snapshotA || !args.snapshotB) throw new Error('INVALID_INPUT: snapshotA and snapshotB are required.');
  const a = heapStore.require(String(args.snapshotA));
  const b = heapStore.require(String(args.snapshotB));
  const diff = compareHeapSnapshots(a.parser as any, b.parser as any);
  return {
    snapshotA: args.snapshotA,
    snapshotB: args.snapshotB,
    addedNodes: diff.addedNodes,
    removedNodes: diff.removedNodes,
    classes: diff.classes,
    simulatedA: a.simulated,
    simulatedB: b.simulated,
  };
}
