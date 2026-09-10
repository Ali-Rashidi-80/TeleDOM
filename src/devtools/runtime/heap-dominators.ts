/**
 * Dominator computation for V8 heap snapshots (§31 modularization).
 *
 * Iterative Cooper–Harvey–Kennedy dominator computation over the retained
 * edge graph, with retained sizes summed per dominated subtree. Extracted
 * from HeapSnapshotParser to keep both modules under the 500-line gate.
 */

import { HeapSnapshotParser, ParsedHeapNode } from './heap-snapshot-parser';

export interface DominatorEntry {
  nodeId: number;
  className: string;
  retainedTreeSize: number;
  dominatorClass: string;
}

/** Compute the dominator summary for a parsed snapshot. */
export function dominatorSummary(parser: HeapSnapshotParser, limit = 20): DominatorEntry[] {
  const p = parser as any;

  // 1. Reachable set from the synthetic root via BFS (edge ordinal indexing).
  const roots = p.nodes.filter((n: ParsedHeapNode) => n.index === 0).slice(0, 1);
  const reachable = new Set<number>(roots.map((r: ParsedHeapNode) => r.index));
  let frontier = roots.map((r: ParsedHeapNode) => r.index);
  const order: number[] = [];
  while (frontier.length) {
    const next: number[] = [];
    for (const idx of frontier) {
      order.push(idx);
      const owner = p.nodes[idx];
      for (let e = 0; e < owner.edgeCount; e++) {
        const edge = p.edges[owner.edgeStart + e];
        if (!edge || reachable.has(edge.toNodeIndex)) continue;
        reachable.add(edge.toNodeIndex);
        next.push(edge.toNodeIndex);
      }
    }
    frontier = next;
  }

  // 2. Immediate dominators — iterative data-flow with intersect on the
  //    parent chain (Cooper–Harvey–Kennedy).
  const idom = new Map<number, number>();
  const parent = new Map<number, number>();
  for (const idx of order) {
    const owner = p.nodes[idx];
    for (let e = 0; e < owner.edgeCount; e++) {
      const edge = p.edges[owner.edgeStart + e];
      if (!edge || !reachable.has(edge.toNodeIndex)) continue;
      if (!parent.has(edge.toNodeIndex) && edge.toNodeIndex !== order[0]) {
        parent.set(edge.toNodeIndex, idx);
      }
    }
  }
  idom.set(order[0], order[0]);
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 20) {
    changed = false;
    for (const idx of order) {
      if (idx === order[0]) continue;
      const preds: number[] = [];
      const incoming = p.retainersOf.get(idx) || [];
      for (const ei of incoming) {
        const owner = p.findOwnerNodeOfEdge(p.edges[ei]);
        if (owner && reachable.has(owner.index) && isForwardEdge(p, owner, idx)) preds.push(owner.index);
      }
      let newIdom: number | undefined;
      for (const pred of preds) {
        if (idom.has(pred)) {
          if (newIdom === undefined) newIdom = pred;
          else newIdom = intersect(idom, parent, newIdom, pred);
        }
      }
      if (newIdom !== undefined && idom.get(idx) !== newIdom) {
        idom.set(idx, newIdom);
        changed = true;
      }
    }
  }

  // 3. Retained sizes = self sizes summed over each dominated subtree.
  const children = new Map<number, number[]>();
  for (const [idx, dom] of idom) {
    if (idx === dom) continue;
    const arr = children.get(dom) || [];
    arr.push(idx);
    children.set(dom, arr);
  }
  const retained = new Map<number, number>();
  const computeRetained = (idx: number): number => {
    let size = p.nodes[idx].selfSize;
    for (const child of children.get(idx) || []) size += computeRetained(child);
    retained.set(idx, size);
    return size;
  };
  for (const idx of order) {
    if (!children.has(idx) || (children.get(idx) || []).length === 0) {
      retained.set(idx, p.nodes[idx].selfSize);
    }
  }
  if (order.length) computeRetained(order[0]);

  // 4. Rank by retained size.
  return Array.from(idom.entries())
    .map(([idx, dom]) => ({
      nodeId: p.nodes[idx].id,
      className: p.nodes[idx].className,
      retainedTreeSize: retained.get(idx) || p.nodes[idx].selfSize,
      dominatorClass: p.nodes[dom]?.className || 'root',
    }))
    .sort((a, b) => b.retainedTreeSize - a.retainedTreeSize)
    .slice(0, limit);
}

function isForwardEdge(p: any, from: ParsedHeapNode, toIndex: number): boolean {
  for (let e = 0; e < from.edgeCount; e++) {
    const edge = p.edges[from.edgeStart + e];
    if (edge && edge.toNodeIndex === toIndex) return true;
  }
  return false;
}

function intersect(idom: Map<number, number>, parent: Map<number, number>, a: number, b: number): number {
  let x = a, y = b;
  while (x !== y) {
    while (parent.has(x) && x !== a) x = parent.get(x)!;
    while (parent.has(y) && y !== b) y = parent.get(y)!;
    if (x === y) break;
    if (!parent.has(x)) return y;
    if (!parent.has(y)) return x;
    x = parent.get(x)!;
    y = parent.get(y)!;
  }
  return x;
}
