/**
 * Self-contained V8 heap snapshot (.heapsnapshot) parser and analyzer.
 *
 * Implements the memory capability family (13 tools of
 * chrome-devtools-mcp) against the documented V8 snapshot JSON format:
 *   { snapshot: { meta: { node_fields, node_types, edge_fields, edge_types },
 *                 node_count, edge_count },
 *     nodes:  [flat numbers — node_count × len(node_fields)],
 *     edges:  [flat numbers — edge_count × len(edge_fields)],
 *     strings: [...] }
 *
 * The parser runs the SAME real algorithms for live CDP captures and
 * for test fixtures in the .heapsnapshot format. Simulation results
 * are always marked simulated: true (§16) — a synthetic snapshot is
 * contract validation, never presented as a real V8 capture.
 */

import { RawHeapSnapshot, HeapNodeInfo, HeapEdgeInfo, HeapClassAggregate, HeapSnapshotAnalysis } from '../types';
import { dominatorSummary as dominatorSummaryImpl } from './heap-dominators';

const NODE_TYPE_KEYS = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'];
const EDGE_TYPE_KEYS = ['type', 'name_or_index', 'to_node'];

export interface ParsedHeapNode {
  index: number;
  type: string;
  nameIdx: number;
  className: string;
  id: number;
  selfSize: number;
  edgeCount: number;
  edgeStart: number;
  detached: number;
}

export interface ParsedHeapEdge {
  index: number;
  type: string;
  /** string index for named edges, element index for element edges. */
  nameOrIndex: number;
  isNameString: boolean;
  toNodeIndex: number;
}

export class HeapSnapshotParser {
  private raw: RawHeapSnapshot;
  private nodeFieldIndex: Record<string, number> = {};
  private edgeFieldIndex: Record<string, number> = {};
  private nodes: ParsedHeapNode[] = [];
  private edges: ParsedHeapEdge[] = [];
  private nodeById = new Map<number, ParsedHeapNode>();
  /** reverse edges: toNodeIndex → edge indexes. */
  private retainersOf = new Map<number, number[]>();
  private classNameCache = new Map<string, string>();
  readonly parsedAt: number;
  private parseMs: number;

  constructor(raw: unknown) {
    const started = Date.now();
    this.raw = this.validate(raw);
    this.parse();
    this.parsedAt = started;
    this.parseMs = Date.now() - started;
  }

  private validate(input: unknown): RawHeapSnapshot {
    if (!input || typeof input !== 'object') {
      throw new Error('INVALID_INPUT: heap snapshot must be a JSON object.');
    }
    const raw = input as RawHeapSnapshot;
    if (!raw.snapshot?.meta?.node_fields || !Array.isArray(raw.nodes) || !Array.isArray(raw.strings)) {
      throw new Error('INVALID_INPUT: heap snapshot is missing snapshot.meta.node_fields / nodes / strings.');
    }
    const nodeFields: string[] = raw.snapshot.meta.node_fields as unknown as string[];
    for (const required of ['type', 'id']) {
      if (!nodeFields.includes(required)) {
        throw new Error(`INVALID_INPUT: node_fields must contain '${required}' (found: ${nodeFields.join(',')}).`);
      }
    }
    const expectedLen = nodeFields.length * (raw.snapshot.node_count ?? raw.nodes.length / nodeFields.length);
    if (raw.nodes.length < expectedLen - nodeFields.length) {
      throw new Error(`INVALID_INPUT: nodes array too short: ${raw.nodes.length} for node_count ${raw.snapshot.node_count}.`);
    }
    return raw;
  }

  private parse(): void {
    const nodeFields = this.raw.snapshot.meta.node_fields;
    NODE_TYPE_KEYS.forEach(k => { this.nodeFieldIndex[k] = nodeFields.indexOf(k as never); });
    const edgeFields = this.raw.snapshot.meta.edge_fields || EDGE_TYPE_KEYS;
    EDGE_TYPE_KEYS.forEach(k => { this.edgeFieldIndex[k] = edgeFields.indexOf(k as never); });

    const nodeStride = nodeFields.length;
    const nodeCount = this.raw.snapshot.node_count ?? Math.floor(this.raw.nodes.length / nodeStride);
    let edgeCursor = 0;
    for (let i = 0; i < nodeCount; i++) {
      const base = i * nodeStride;
      const typeIdx = this.raw.nodes[base + this.nodeFieldIndex['type']];
      const nameIdx = this.nodeFieldIndex['name'] >= 0 ? this.raw.nodes[base + this.nodeFieldIndex['name']] : -1;
      const id = this.raw.nodes[base + this.nodeFieldIndex['id']];
      const selfSize = this.nodeFieldIndex['self_size'] >= 0 ? this.raw.nodes[base + this.nodeFieldIndex['self_size']] : 0;
      const edgeCount = this.nodeFieldIndex['edge_count'] >= 0 ? this.raw.nodes[base + this.nodeFieldIndex['edge_count']] : 0;
      const detached = this.nodeFieldIndex['detachedness'] >= 0 ? this.raw.nodes[base + this.nodeFieldIndex['detachedness']] : 0;
      const nodeType = this.typeName(typeIdx);
      const node: ParsedHeapNode = {
        index: i,
        type: nodeType,
        nameIdx,
        className: this.classKey(nodeType, nameIdx),
        id,
        selfSize,
        edgeCount,
        edgeStart: edgeCursor,
        detached,
      };
      this.nodes.push(node);
      if (id !== 0 && !this.nodeById.has(id)) this.nodeById.set(id, node);
      edgeCursor += edgeCount;
    }

    // Edges.
    const edgeStride = (this.raw.snapshot.meta.edge_fields || EDGE_TYPE_KEYS).length;
    const edgeCount = this.raw.snapshot.edge_count ?? Math.floor(this.raw.edges.length / edgeStride);
    for (let i = 0; i < edgeCount; i++) {
      const base = i * edgeStride;
      const typeIdx = this.raw.edges[base + this.edgeFieldIndex['type']];
      const nameOrIndex = this.raw.edges[base + this.edgeFieldIndex['name_or_index']];
      // For element edges the name is an index; for named edges a string index.
      const edgeType = this.edgeTypeName(typeIdx);
      const toNodeRaw = this.raw.edges[base + this.edgeFieldIndex['to_node']];
      // V8 format: `to_node` is the FLAT index into the nodes array
      // (a multiple of the node stride). Convert to the node ORDINAL so
      // this.nodes[…] addressing is consistent everywhere.
      const toNodeOrdinal = Number.isInteger(toNodeRaw / nodeStride) && toNodeRaw >= 0
        ? toNodeRaw / nodeStride
        : Math.floor(toNodeRaw / nodeStride);
      const edge: ParsedHeapEdge = {
        index: i,
        type: edgeType,
        nameOrIndex,
        isNameString: edgeType !== 'element' && edgeType !== 'hidden',
        toNodeIndex: toNodeOrdinal,
      };
      this.edges.push(edge);
      if (toNodeOrdinal >= 0 && toNodeOrdinal < this.nodes.length) {
        const bucket = this.retainersOf.get(toNodeOrdinal) || [];
        bucket.push(i);
        this.retainersOf.set(toNodeOrdinal, bucket);
      }
    }
  }

  private typeName(idx: number): string {
    // node type field: either a string index or a number mapped via node_types.
    const types = this.raw.snapshot.meta.node_types?.[0];
    if (Array.isArray(types)) {
      return types[idx] ?? `type_${idx}`;
    }
    return this.raw.strings[idx] ?? `type_${idx}`;
  }

  private edgeTypeName(idx: number): string {
    const types = this.raw.snapshot.meta.edge_types?.[0];
    if (Array.isArray(types)) {
      return types[idx] ?? `edge_${idx}`;
    }
    return this.raw.strings[idx] ?? `edge_${idx}`;
  }

  private classKey(nodeType: string, nameIdx: number): string {
    const cacheKey = `${nodeType}:${nameIdx}`;
    const cached = this.classNameCache.get(cacheKey);
    if (cached !== undefined) return cached;
    const name = nameIdx >= 0 ? (this.raw.strings[nameIdx] ?? '') : '';
    const result = nodeType === 'object' || nodeType === 'native'
      ? (name || nodeType)
      : nodeType === 'closure' ? `closure:${name || 'anonymous'}`
      : nodeType === 'string' ? 'string'
      : `${nodeType}:${name}`;
    this.classNameCache.set(cacheKey, result);
    return result;
  }

  // -----------------------------------------------------------------------
  // Accessors
  // -----------------------------------------------------------------------

  nodeCount(): number { return this.nodes.length; }
  edgeCount(): number { return this.edges.length; }
  parseDurationMs(): number { return this.parseMs; }

  summary(): HeapSnapshotAnalysis {
    const aggregates = this.classAggregates();
    let total = 0;
    for (const a of aggregates) total += a.selfSize;
    return {
      snapshotId: '',
      source: 'LIVE',
      nodeCount: this.nodes.length,
      edgeCount: this.edges.length,
      totalSelfSize: total,
      classes: aggregates,
      strings: this.raw.strings.length,
    };
  }

  classAggregates(): HeapClassAggregate[] {
    const agg = new Map<string, HeapClassAggregate>();
    for (const node of this.nodes) {
      const entry = agg.get(node.className) || { className: node.className, count: 0, selfSize: 0 };
      entry.count++;
      entry.selfSize += node.selfSize;
      agg.set(node.className, entry);
    }
    return Array.from(agg.values()).sort((a, b) => b.selfSize - a.selfSize || b.count - a.count);
  }

  classNodes(className: string, offset = 0, limit = 50): { total: number; nodes: HeapNodeInfo[] } {
    const all = this.nodes.filter(n => this.matchesClass(n, className));
    return {
      total: all.length,
      nodes: all.slice(offset, offset + limit).map(n => this.toNodeInfo(n)),
    };
  }

  private matchesClass(node: ParsedHeapNode, className: string): boolean {
    if (node.className === className) return true;
    // Allow bare type/class matching: "object" matches object:Foo? No —
    // match by exact classKey, case-insensitive fallback on substring for
    // user convenience ("Foo" matches "closure:Foo" or object "Foo").
    const q = className.toLowerCase();
    if (node.className.toLowerCase() === q) return true;
    return node.className.toLowerCase().includes(q) && q.length >= 3;
  }

  nodeByIdOrIndex(idOrIndex: number): HeapNodeInfo | null {
    const node = this.nodeById.get(idOrIndex) || this.nodes[idOrIndex];
    return node ? this.toNodeInfo(node) : null;
  }

  objectDetails(idOrIndex: number): Record<string, unknown> | null {
    const node = this.nodeById.get(idOrIndex) || this.nodes[idOrIndex];
    if (!node) return null;
    const outgoing = this.nodeEdges(node);
    const incoming = this.retainers(node);
    return {
      ...this.toNodeInfo(node),
      name: node.nameIdx >= 0 ? this.raw.strings[node.nameIdx] : undefined,
      outgoingEdgeCount: outgoing.length,
      outgoingEdges: outgoing.slice(0, 100),
      retainerCount: incoming.length,
      retainers: incoming.slice(0, 100),
      detached: node.detached === 1,
    };
  }

  nodeEdges(node: ParsedHeapNode): HeapEdgeInfo[] {
    const result: HeapEdgeInfo[] = [];
    for (let e = 0; e < node.edgeCount; e++) {
      // edgeStart counts EDGE ORDINALS (not flat-array positions).
      const edge = this.edges[node.edgeStart + e];
      if (!edge) continue;
      const toNode = this.nodes[edge.toNodeIndex];
      result.push({
        index: edge.index,
        type: edge.type,
        nameOrIndex: edge.isNameString ? (this.raw.strings[edge.nameOrIndex] ?? String(edge.nameOrIndex)) : String(edge.nameOrIndex),
        fromNodeId: node.id,
        toNodeId: toNode ? toNode.id : -1,
        toNodeClass: toNode ? toNode.className : 'unknown',
        toSelfSize: toNode ? toNode.selfSize : 0,
      });
    }
    return result;
  }

  retainers(node: ParsedHeapNode): Array<HeapEdgeInfo & { fromClassName: string }> {
    const edgeIndexes = this.retainersOf.get(node.index) || [];
    const result: Array<HeapEdgeInfo & { fromClassName: string }> = [];
    for (const ei of edgeIndexes) {
      const edge = this.edges[ei];
      if (!edge) continue;
      // find source node via edge position in the flat array
      const fromNode = this.findOwnerNodeOfEdge(edge);
      if (!fromNode) continue;
      result.push({
        index: edge.index,
        type: edge.type,
        nameOrIndex: edge.isNameString ? (this.raw.strings[edge.nameOrIndex] ?? String(edge.nameOrIndex)) : String(edge.nameOrIndex),
        fromNodeId: fromNode.id,
        fromClassName: fromNode.className,
        toNodeId: node.id,
        toNodeClass: node.className,
        toSelfSize: node.selfSize,
      });
    }
    return result;
  }

  private edgeOwner = new Map<number, number>();
  private buildEdgeOwnerIndex(): void {
    if (this.edgeOwner.size) return;
    for (const node of this.nodes) {
      for (let e = 0; e < node.edgeCount; e++) {
        // edgeStart is an edge ORDINAL — index edges directly.
        this.edgeOwner.set(node.edgeStart + e, node.index);
      }
    }
  }

  private findOwnerNodeOfEdge(edge: ParsedHeapEdge): ParsedHeapNode | null {
    this.buildEdgeOwnerIndex();
    const owner = this.edgeOwner.get(edge.index);
    return owner !== undefined ? this.nodes[owner] : null;
  }

  /** Retaining paths: BFS from synthetic roots to the target node. */
  retainingPaths(node: ParsedHeapNode, maxPaths = 3): Array<{ path: Array<{ from: string; edge: string }>; length: number }> {
    // Build reverse BFS from roots.
    const roots = this.nodes.filter(n => n.type === 'synthetic' || n.className === '(roots)' || n.index === 0).slice(0, 5);
    const prevEdge = new Map<number, number>(); // nodeIndex → edge index used to reach it
    const visited = new Set<number>(roots.map(r => r.index));
    let frontier = roots.map(r => r.index);
    while (frontier.length && !visited.has(node.index)) {
      const next: number[] = [];
      for (const idx of frontier) {
        const owner = this.nodes[idx];
        for (let e = 0; e < owner.edgeCount; e++) {
          const edgeIndex = owner.edgeStart + e;
          const edge = this.edges[edgeIndex];
          if (!edge || visited.has(edge.toNodeIndex)) continue;
          visited.add(edge.toNodeIndex);
          prevEdge.set(edge.toNodeIndex, edgeIndex);
          next.push(edge.toNodeIndex);
        }
      }
      frontier = next;
    }
    if (!visited.has(node.index)) return [];
    // reconstruct one shortest path
    const paths: Array<{ path: Array<{ from: string; edge: string }>; length: number }> = [];
    let cursor = node.index;
    const chain: Array<{ from: string; edge: string }> = [];
    while (cursor !== undefined && prevEdge.has(cursor)) {
      const edgeIndex = prevEdge.get(cursor)!;
      const edge = this.edges[edgeIndex];
      const owner = this.findOwnerNodeOfEdge(edge);
      if (!owner) break;
      chain.push({
        from: `${owner.className}@${owner.id}`,
        edge: edge.isNameString ? (this.raw.strings[edge.nameOrIndex] ?? String(edge.nameOrIndex)) : `[${edge.nameOrIndex}]`,
      });
      cursor = owner.index;
    }
    chain.reverse();
    paths.push({ path: chain, length: chain.length });
    return paths.slice(0, maxPaths);
  }

  /**
   * Dominator analysis (Cooper–Harvey–Kennedy + retained sizes).
   * Implementation lives in heap-dominators.ts (§31 modularization).
   */
  dominatorSummary(limit = 20): Array<{ nodeId: number; className: string; retainedTreeSize: number; dominatorClass: string }> {
    return dominatorSummaryImpl(this, limit);
  }

  duplicateStrings(): Array<{ value: string; instances: number; wastedBytes: number }> {
    const counts = new Map<string, { instances: number; wastedBytes: number }>();
    for (const node of this.nodes) {
      if (node.type !== 'string' || node.nameIdx < 0) continue;
      const value = this.raw.strings[node.nameIdx];
      if (!value) continue;
      const entry = counts.get(value) || { instances: 0, wastedBytes: 0 };
      entry.instances++;
      entry.wastedBytes += node.selfSize;
      counts.set(value, entry);
    }
    return Array.from(counts.entries())
      .filter(([, v]) => v.instances > 1)
      .map(([value, v]) => ({ value: value.length > 120 ? value.slice(0, 120) + '…' : value, instances: v.instances, wastedBytes: v.wastedBytes }))
      .sort((a, b) => b.wastedBytes - a.wastedBytes);
  }

  queryNodes(filter: { type?: string; className?: string; minSize?: number; limit?: number }): HeapNodeInfo[] {
    let list = this.nodes;
    if (filter.type) {
      const t = filter.type.toLowerCase();
      list = list.filter(n => n.type.toLowerCase() === t || n.className.toLowerCase().includes(t));
    }
    if (filter.className) {
      list = list.filter(n => this.matchesClass(n, filter.className!));
    }
    if (filter.minSize !== undefined) {
      list = list.filter(n => n.selfSize >= filter.minSize!);
    }
    return list.slice(0, filter.limit || 50).map(n => this.toNodeInfo(n));
  }

  private toNodeInfo(node: ParsedHeapNode): HeapNodeInfo {
    return {
      id: node.id,
      index: node.index,
      type: node.type,
      className: node.className,
      name: node.nameIdx >= 0 ? this.raw.strings[node.nameIdx] : undefined,
      selfSize: node.selfSize,
      edgeCount: node.edgeCount,
      detached: node.detached === 1,
    };
  }

  rawSnapshot(): RawHeapSnapshot { return this.raw; }
}
