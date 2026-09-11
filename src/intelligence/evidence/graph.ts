/**
 * TeleDOM v4 Evidence — Typed Evidence Graph.
 *
 * Everything becomes a typed node (Page..Proof) connected by typed edges
 * (CAUSES..REPRODUCES). Edges carry provenance. Claims link to evidence
 * with confidence — no claim without provenance.
 */

import { computeHash } from '../kernel/integrity';

export type EvidenceNodeType =
  | 'Page' | 'Document' | 'Component' | 'Element' | 'Entity' | 'UserAction'
  | 'NetworkRequest' | 'NetworkResponse' | 'RuntimeEvent' | 'ConsoleError'
  | 'Exception' | 'DOMMutation' | 'StateFrame' | 'VisualFrame'
  | 'PerformanceEvent' | 'SecuritySignal' | 'StorageEvent' | 'CookieSignal'
  | 'Worker' | 'Iframe' | 'ServiceWorker' | 'Script' | 'Resource'
  | 'Hypothesis' | 'Finding' | 'Fix' | 'Verification' | 'Proof' | 'Incident';

export type EvidenceEdgeType =
  | 'CAUSES' | 'TRIGGERS' | 'CORRELATED_WITH' | 'PRECEDES' | 'REMOVES'
  | 'RENDERS' | 'REPLACES' | 'DEPENDS_ON' | 'BLOCKS' | 'AFFECTS'
  | 'VERIFIED_BY' | 'DERIVED_FROM' | 'CONTRADICTS' | 'SUPPORTS' | 'REPRODUCES';

export interface EvidenceNode {
  id: string;
  type: EvidenceNodeType;
  label: string;
  /** Immutable content hash of the observation. */
  hash: string;
  observedAt: number;
  /** Original event/entity reference. */
  sourceRef?: string;
  payload?: Record<string, unknown>;
}

export interface EvidenceEdge {
  id: string;
  from: string;
  to: string;
  type: EvidenceEdgeType;
  /** Provenance: why do we believe this edge exists. */
  provenance: string[];
  confidence: number;
  createdAt: number;
}

export interface GraphQueryOptions {
  types?: EvidenceNodeType[];
  edgeTypes?: EvidenceEdgeType[];
  minConfidence?: number;
  limit?: number;
}

/** Bounded to MAX_GRAPH_NODES — graceful degradation, never a crash. */
export class EvidenceGraph {
  private nodes = new Map<string, EvidenceNode>();
  private edges: EvidenceEdge[] = [];
  private adjacencyOut = new Map<string, EvidenceEdge[]>();
  private adjacencyIn = new Map<string, EvidenceEdge[]>();
  private maxNodes: number;
  private degraded = false;

  constructor(maxNodes = 250_000) {
    this.maxNodes = maxNodes;
  }

  addNode(type: EvidenceNodeType, label: string, payload?: Record<string, unknown>, sourceRef?: string): EvidenceNode {
    const hash = computeHash({ type, label, payload, sourceRef });
    // Content-addressed dedup: same observation, same node.
    const existing = this.nodes.get(hash);
    if (existing) return existing;
    if (this.nodes.size >= this.maxNodes) {
      // Degrade gracefully: MAX_GRAPH_NODES is a hard bound. The overflow
      // observation gets a lightweight identity node (not stored) so the
      // caller keeps a reference, and the graph flags degradation.
      this.degraded = true;
      return { id: `en:overflow:${hash.slice(0, 16)}`, type, label, hash, observedAt: Date.now(), sourceRef, payload: undefined };
    }
    const node: EvidenceNode = {
      id: `en:${hash.slice(0, 20)}`,
      type,
      label,
      hash,
      observedAt: Date.now(),
      sourceRef,
      payload,
    };
    this.nodes.set(hash, node);
    return node;
  }

  addEdge(
    from: EvidenceNode | string,
    to: EvidenceNode | string,
    type: EvidenceEdgeType,
    provenance: string[],
    confidence = 0.8,
  ): EvidenceEdge {
    const fromId = typeof from === 'string' ? from : from.id;
    const toId = typeof to === 'string' ? to : to.id;
    // Dedup key is (from, to, type) — corroboration strengthens the SAME
    // edge instead of creating near-duplicates.
    const edgeId = computeHash({ fromId, toId, type });
    const existing = this.edges.find((e) => e.id === edgeId);
    if (existing) {
      // Corroboration strengthens confidence (bounded).
      existing.confidence = Math.min(1, existing.confidence + 0.05);
      existing.provenance.push(...provenance);
      return existing;
    }
    const edge: EvidenceEdge = { id: edgeId, from: fromId, to: toId, type, provenance, confidence, createdAt: Date.now() };
    this.edges.push(edge);
    const out = this.adjacencyOut.get(fromId) ?? [];
    out.push(edge);
    this.adjacencyOut.set(fromId, out);
    const inc = this.adjacencyIn.get(toId) ?? [];
    inc.push(edge);
    this.adjacencyIn.set(toId, inc);
    return edge;
  }

  getNode(id: string): EvidenceNode | undefined {
    for (const n of this.nodes.values()) if (n.id === id) return n;
    return undefined;
  }

  nodesAll(q: GraphQueryOptions = {}): EvidenceNode[] {
    const out: EvidenceNode[] = [];
    const limit = q.limit ?? Number.MAX_SAFE_INTEGER;
    for (const n of this.nodes.values()) {
      if (q.types?.length && !q.types.includes(n.type)) continue;
      out.push(n);
      if (out.length >= limit) break;
    }
    return out;
  }

  edgesAll(q: { edgeTypes?: EvidenceEdgeType[]; minConfidence?: number } = {}): EvidenceEdge[] {
    return this.edges.filter((e) => {
      if (q.edgeTypes?.length && !q.edgeTypes!.includes(e.type)) return false;
      if (q.minConfidence !== undefined && e.confidence < q.minConfidence) return false;
      return true;
    });
  }

  /** Directed traversal from a node (BFS, bounded). */
  neighbors(nodeId: string, depth = 1, edgeTypes?: EvidenceEdgeType[]): EvidenceNode[] {
    const visited = new Set<string>([nodeId]);
    let frontier = [nodeId];
    for (let d = 0; d < depth; d++) {
      const next: string[] = [];
      for (const id of frontier) {
        for (const edge of this.adjacencyOut.get(id) ?? []) {
          if (edgeTypes?.length && !edgeTypes.includes(edge.type)) continue;
          if (!visited.has(edge.to)) {
            visited.add(edge.to);
            next.push(edge.to);
          }
        }
        for (const edge of this.adjacencyIn.get(id) ?? []) {
          if (edgeTypes?.length && !edgeTypes.includes(edge.type)) continue;
          if (!visited.has(edge.from)) {
            visited.add(edge.from);
            next.push(edge.from);
          }
        }
      }
      frontier = next;
    }
    return [...visited].map((id) => this.getNode(id)!).filter(Boolean);
  }

  /** Paths between two nodes (bounded DFS) — used for "explain" chains. */
  paths(fromId: string, toId: string, maxDepth = 6): EvidenceEdge[][] {
    const results: EvidenceEdge[][] = [];
    const stack: { node: string; path: EvidenceEdge[] }[] = [{ node: fromId, path: [] }];
    let steps = 0;
    while (stack.length && results.length < 16) {
      const { node, path } = stack.pop()!;
      steps += 1;
      if (steps > 10_000) break; // bounded traversal
      if (node === toId && path.length > 0) {
        results.push(path);
        continue;
      }
      if (path.length >= maxDepth) continue;
      for (const edge of this.adjacencyOut.get(node) ?? []) {
        if (path.some((p) => p.id === edge.id)) continue;
        stack.push({ node: edge.to, path: [...path, edge] });
      }
    }
    return results;
  }

  stats(): { nodes: number; edges: number; degraded: boolean; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const n of this.nodes.values()) byType[n.type] = (byType[n.type] ?? 0) + 1;
    return { nodes: this.nodes.size, edges: this.edges.length, degraded: this.degraded, byType };
  }

  serialize(): { nodes: EvidenceNode[]; edges: EvidenceEdge[] } {
    return { nodes: [...this.nodes.values()], edges: [...this.edges] };
  }

  restore(data: { nodes: EvidenceNode[]; edges: EvidenceEdge[] }): void {
    this.nodes.clear();
    this.edges = [];
    this.adjacencyOut.clear();
    this.adjacencyIn.clear();
    for (const n of data.nodes) this.nodes.set(n.hash, n);
    for (const e of data.edges) {
      this.edges.push(e);
      const out = this.adjacencyOut.get(e.from) ?? [];
      out.push(e);
      this.adjacencyOut.set(e.from, out);
      const inc = this.adjacencyIn.get(e.to) ?? [];
      inc.push(e);
      this.adjacencyIn.set(e.to, inc);
    }
  }
}
