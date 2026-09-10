/**
 * Heap snapshot DIFF + deterministic format-faithful fixtures.
 *
 * Split from heap-snapshot-parser.ts (§31 modularization): the parser class
 * stays focused on parsing/analysis; comparison and fixture generation live
 * here. The fixture produces REAL .heapsnapshot-format JSON (node_fields /
 * edge_fields / flat nodes / edges / strings) so the parser's code paths are
 * identical for fixtures and live captures — always labeled simulated: true.
 */

import { HeapSnapshotParser } from './heap-snapshot-parser';
import { RawHeapSnapshot } from '../types';

// ---------------------------------------------------------------------------
// Snapshot diff (dt_compare_heapsnapshots)
// ---------------------------------------------------------------------------

export interface HeapDiffClassEntry {
  className: string;
  addedCount: number;
  removedCount: number;
  countDelta: number;
  addedSize: number;
  removedSize: number;
  sizeDelta: number;
}

export function compareHeapSnapshots(a: HeapSnapshotParser, b: HeapSnapshotParser): { classes: HeapDiffClassEntry[]; addedNodes: number; removedNodes: number } {
  const aggA = new Map(a.classAggregates().map(c => [c.className, c]));
  const aggB = new Map(b.classAggregates().map(c => [c.className, c]));
  const classNames = new Set([...aggA.keys(), ...aggB.keys()]);
  const classes: HeapDiffClassEntry[] = [];
  let addedNodes = 0;
  let removedNodes = 0;
  for (const className of classNames) {
    const ca = aggA.get(className);
    const cb = aggB.get(className);
    const addedCount = (cb?.count || 0) - (ca?.count || 0);
    const addedSize = (cb?.selfSize || 0) - (ca?.selfSize || 0);
    if (ca === undefined) {
      addedNodes += cb?.count || 0;
      classes.push({ className, addedCount: cb?.count || 0, removedCount: 0, countDelta: cb?.count || 0, addedSize: cb?.selfSize || 0, removedSize: 0, sizeDelta: cb?.selfSize || 0 });
    } else if (cb === undefined) {
      removedNodes += ca.count;
      classes.push({ className, addedCount: 0, removedCount: ca.count, countDelta: -ca.count, addedSize: 0, removedSize: ca.selfSize, sizeDelta: -ca.selfSize });
    } else if (addedCount !== 0 || addedSize !== 0) {
      if (addedCount > 0) addedNodes += addedCount; else removedNodes += -addedCount;
      classes.push({ className, addedCount: Math.max(0, addedCount), removedCount: Math.max(0, -addedCount), countDelta: addedCount, addedSize: Math.max(0, addedSize), removedSize: Math.max(0, -addedSize), sizeDelta: addedSize });
    }
  }
  classes.sort((x, y) => Math.abs(y.sizeDelta) - Math.abs(x.sizeDelta));
  return { classes: classes.slice(0, 200), addedNodes, removedNodes };
}

/**
 * Deterministic fixture in the REAL .heapsnapshot JSON format (used for
 * simulation contract validation and unit tests of the parser). NOT a
 * real V8 capture — always paired with simulated: true labels.
 */
export function buildSimulatedHeapSnapshot(seed = 1): RawHeapSnapshot {
  let s = seed * 40503 % 2147483647;
  const rnd = (mod: number) => { s = (s * 16807) % 2147483647; return s % mod; };
  const nodeFields = ['type', 'name', 'id', 'self_size', 'edge_count', 'trace_node_id', 'detachedness'];
  const strings: string[] = [
    '(roots)', 'internal', 'native', 'object', 'string', 'closure', 'element', 'shortcut', 'weak',
    'Window', 'HTMLDivElement', 'Object', 'Array', 'system / Context',
    'hello-world', 'dashboard-state', 'GlobalStore', 'retained-blob', 'anonymous',
  ];
  const nodes: number[] = [];
  const edges: number[] = [];
  const mkNode = (typeIdx: number, nameIdx: number, id: number, selfSize: number, edgeCount: number) => {
    nodes.push(typeIdx, nameIdx, id, selfSize, edgeCount, 0, 0);
    return nodes.length / nodeFields.length - 1;
  };
  // node_types: 0=hidden 1=array 2=string 3=object 4=code 5=closure 6=number 7=native 8=synthetic
  // 0: (roots) — synthetic root node
  const rootIdx = mkNode(8, 0, 1, 0, 4);
  const windowIdx = mkNode(7, 9, 2, 1024, 3);   // native Window
  const divIdx = mkNode(7, 10, 3, 512, 2);     // native HTMLDivElement
  const objIdx = mkNode(3, 11, 4, 256, 2);     // object Object
  const arrIdx = mkNode(3, 12, 5, 384, 1);     // object Array
  const storeIdx = mkNode(3, 16, 6, 2048, 2);  // object GlobalStore
  const blobIdx = mkNode(3, 17, 7, 131072, 0); // object retained-blob
  const ctxIdx = mkNode(7, 13, 8, 8192, 1);    // native system / Context
  // duplicate strings (type 2)
  const strA1 = mkNode(2, 14, 101, 48, 0);
  const strA2 = mkNode(2, 14, 102, 48, 0);
  const strB1 = mkNode(2, 15, 103, 64, 0);
  const strB2 = mkNode(2, 15, 104, 64, 0);
  const strB3 = mkNode(2, 15, 105, 64, 0);
  // closures (type 5, anonymous)
  const cl1 = mkNode(5, 18, 201, 128, 1);
  const cl2 = mkNode(5, 18, 202, 128, 0);
  // extra randomized objects
  const extras: number[] = [];
  for (let i = 0; i < 12 + rnd(10); i++) {
    const idx = mkNode(3, 11, 300 + i, rnd(4096), rnd(3));
    extras.push(idx);
  }
  // edges: (type, name_or_index, to_node) — to_node is node INDEX in flat nodes array (multiple of stride)
  const E = (type: number, name: number, toFlatIdx: number) => edges.push(type, name, toFlatIdx);
  const stride = nodeFields.length;
  E(4, 0, rootIdx * stride); // shortcut? use internal(1)/element(6)
  edges.length = 0;
  E(1, 0, windowIdx * stride); // internal root→window
  E(1, 1, ctxIdx * stride);    // root→context
  E(1, 2, storeIdx * stride);  // root→store
  E(1, 3, blobIdx * stride);   // root→blob
  E(6, 0, divIdx * stride);    // window -[element 0]-> div
  E(6, 1, objIdx * stride);
  E(6, 2, arrIdx * stride);
  E(6, 0, strA1 * stride);     // div -> strA1
  E(6, 1, strB1 * stride);     // div -> strB1
  E(6, 0, cl1 * stride);       // obj -> closure
  E(6, 1, strA2 * stride);     // obj -> strA2
  E(6, 0, strB2 * stride);     // arr -> strB2
  E(6, 0, strB3 * stride);     // store -> strB3
  E(6, 1, blobIdx * stride);   // store -> blob
  E(6, 0, cl2 * stride);       // context -> closure2
  for (let i = 0; i < extras.length; i++) E(6, i, extras[i] * stride);

  const edgeFields = ['type', 'name_or_index', 'to_node'];
  return {
    snapshot: {
      meta: {
        node_fields: nodeFields,
        node_types: [['hidden', 'array', 'string', 'object', 'code', 'closure', 'number', 'native', 'synthetic'], 'string', 'number', 'number', 'number', 'number', 'number'],
        edge_fields: edgeFields,
        edge_types: [['element', 'hidden', 'internal', 'shortcut', 'weak'], 'string_or_number', 'node'],
      },
      node_count: nodes.length / stride,
      edge_count: edges.length / edgeFields.length,
    },
    nodes,
    edges,
    strings,
  };
}
