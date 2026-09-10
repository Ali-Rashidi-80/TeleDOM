/**
 * Session access for the forensics layer — loads recorded events,
 * snapshots and metadata from the ForensicStorageProvider and exposes
 * the virtual DOM state at a timestamp through the EXISTING
 * reconstruction engine (time-travel preserved, §29).
 */

import { ForensicStorageProvider } from '../storage/storage-interface';
import { BaseEvent } from '../types/events';
import { DOMSnapshot } from '../types/dom-node';
import { TemporalCorrelationEngine } from './temporal-correlation';
import { unifiedRuntime } from '../devtools/runtime/unified-browser-runtime';

export class SessionAccess {
  constructor(private storage: ForensicStorageProvider) {}

  async requireSession(sessionId: string) {
    const meta = await this.storage.getSession(sessionId);
    if (!meta) {
      const known = (await this.storage.listSessions()).slice(0, 10).map(s => s.id).join(', ');
      throw new Error(`INVALID_INPUT: session '${sessionId}' not found. Known sessions: ${known || 'none recorded yet'}.`);
    }
    return meta;
  }

  async events(sessionId: string): Promise<BaseEvent[]> {
    return this.storage.getEvents(sessionId, { limit: 100000 });
  }

  async correlation(sessionId: string): Promise<TemporalCorrelationEngine> {
    const events = await this.events(sessionId);
    return new TemporalCorrelationEngine(events, unifiedRuntime.bus.snapshot({ limit: 500 }));
  }

  async initialSnapshot(sessionId: string): Promise<DOMSnapshot | null> {
    return this.storage.getInitialSnapshot(sessionId);
  }

  /** Reconstruct DOM state at timestamp T using the EXISTING reconstruction stack. */
  async domStateAt(sessionId: string, timestamp: number): Promise<DOMSnapshot | null> {
    const { StateReconstructor } = await import('../reconstruction/state-reconstructor');
    const events = await this.events(sessionId);
    const initial = await this.initialSnapshot(sessionId);
    const checkpoints = await this.storage.getCheckpoints(sessionId);
    // Include the initial snapshot as an INITIAL checkpoint when the storage
    // has no checkpoint covering sequence 1 (same pattern as the recorder).
    const allCheckpoints = initial && !checkpoints.some(c => c.sequence <= 1)
      ? [{
          checkpointId: `init_${sessionId}`,
          sessionId,
          timestamp: initial.timestamp ?? 0,
          sequence: 1,
          wallClockTime: 0,
          snapshot: initial,
          eventIndex: 0,
          eventsSinceLastCheckpoint: 0,
          trigger: 'INITIAL' as const,
        }, ...checkpoints]
      : checkpoints;
    const reconstructor = new StateReconstructor(allCheckpoints, events);
    const snapshot = reconstructor.getStateAt({ timestamp });
    if (!snapshot || (snapshot as any).snapshotId === 'snap_empty') {
      // No reconstruction possible — fall back to the raw initial snapshot.
      return initial;
    }
    return snapshot;
  }

  /** Events filtered around a timestamp window. */
  async eventsAround(sessionId: string, timestamp: number, windowMs: number): Promise<BaseEvent[]> {
    const all = await this.events(sessionId);
    return all.filter(e => Math.abs(e.timestamp - timestamp) <= windowMs);
  }

  /** Latest snapshot at or before T among initial + checkpoints. */
  async latestSnapshotBefore(sessionId: string, timestamp: number): Promise<{ snapshot: DOMSnapshot; at: number } | null> {
    const initial = await this.initialSnapshot(sessionId);
    const checkpoints = await this.storage.getCheckpoints(sessionId);
    let best: { snapshot: DOMSnapshot; at: number } | null = null;
    if (initial) best = { snapshot: initial, at: initial.timestamp ?? 0 };
    for (const cp of checkpoints) {
      const t = cp.timestamp ?? cp.snapshot?.timestamp ?? 0;
      if (t <= timestamp && (!best || t > best.at)) {
        best = { snapshot: (cp.snapshot as DOMSnapshot) || (cp as any), at: t };
      }
    }
    return best;
  }
}

/**
 * Serialized DOM tree utilities — flatten a DOMSnapshot into an
 * element list for analyzers (works for both session snapshots and
 * live JSDOM documents).
 */

export interface FlatElement {
  id: number;
  parentId?: number | null;
  tagName: string;
  attributes: Record<string, string>;
  textContent: string;
  childCount: number;
  depth: number;
}

export function flattenSnapshot(snapshot: DOMSnapshot): { elements: FlatElement[]; byId: Map<number, FlatElement> } {
  const elements: FlatElement[] = [];
  const byId = new Map<number, FlatElement>();
  const nodes = snapshot.nodes || {};
  const walk = (id: number, depth: number, parentId: number | null) => {
    const node: any = (nodes as any)[id];
    if (!node) return;
    if (node.nodeType === 1) {
      const el: FlatElement = {
        id: node.id,
        parentId,
        tagName: String(node.tagName || '').toLowerCase(),
        attributes: { ...(node.attributes || {}) },
        textContent: String(node.textContent || ''),
        childCount: (node.children || []).length,
        depth,
      };
      elements.push(el);
      byId.set(el.id, el);
      for (const childId of node.children || []) walk(childId, depth + 1, node.id);
    } else {
      for (const childId of node.children || []) walk(childId, depth, parentId);
    }
  };
  walk(snapshot.rootId, 0, null);
  return { elements, byId };
}

/** Build a selector hint for a flat element from a snapshot. */
export function selectorOfFlat(el: FlatElement, byId: Map<number, FlatElement>): string {
  if (el.attributes.id) return `#${el.attributes.id}`;
  const path: string[] = [];
  let cursor: FlatElement | undefined = el;
  while (cursor && path.length < 6) {
    let seg = cursor.tagName;
    if (cursor.attributes.id) { path.unshift(`#${cursor.attributes.id}`); break; }
    if (cursor.attributes.class) {
      const cls = cursor.attributes.class.split(/\s+/).filter(Boolean)[0];
      if (cls) seg += `.${cls}`;
    }
    path.unshift(seg);
    cursor = cursor.parentId !== null && cursor.parentId !== undefined ? byId.get(cursor.parentId) : undefined;
  }
  return path.join(' > ');
}
