/**
 * Heap snapshot session lifecycle (§24 resource ownership):
 * snapshots are loaded from live CDP captures, .heapsnapshot files or
 * raw JSON, registered with an id, analyzed lazily and released via
 * dt_close_heapsnapshot. Bounded resource usage (RESOURCE_EXHAUSTED
 * when too many snapshots are held open).
 */

import { HeapSnapshotParser } from './heap-snapshot-parser';
import { RawHeapSnapshot } from '../types';

export interface LoadedHeapSnapshot {
  snapshotId: string;
  parser: HeapSnapshotParser;
  origin: string;
  simulated: boolean;
  loadedAt: number;
  lastAccessAt: number;
}

const MAX_OPEN_SNAPSHOTS = 6;

export class HeapSnapshotStore {
  private snapshots = new Map<string, LoadedHeapSnapshot>();
  private counter = 0;

  loadFromRaw(raw: unknown, origin: string, simulated: boolean): LoadedHeapSnapshot {
    this.evictIfNeeded();
    const parser = new HeapSnapshotParser(raw);
    const snapshotId = `heap_${++this.counter}`;
    const entry: LoadedHeapSnapshot = { snapshotId, parser, origin, simulated, loadedAt: Date.now(), lastAccessAt: Date.now() };
    this.snapshots.set(snapshotId, entry);
    return entry;
  }

  loadFromJsonString(json: string, origin: string): LoadedHeapSnapshot {
    let raw: unknown;
    try {
      raw = JSON.parse(json);
    } catch (err: any) {
      throw new Error(`INVALID_INPUT: heap snapshot JSON is not parseable (${err.message}).`);
    }
    return this.loadFromRaw(raw, origin, false);
  }

  get(snapshotId: string): LoadedHeapSnapshot | undefined {
    const entry = this.snapshots.get(snapshotId);
    if (entry) entry.lastAccessAt = Date.now();
    return entry;
  }

  require(snapshotId: string): LoadedHeapSnapshot {
    const entry = this.get(snapshotId);
    if (!entry) {
      const known = Array.from(this.snapshots.keys()).join(', ') || 'none';
      throw new Error(`RESOURCE_EXHAUSTED: unknown heap snapshot '${snapshotId}'. Open snapshots: ${known}.`);
    }
    return entry;
  }

  close(snapshotId: string): boolean {
    return this.snapshots.delete(snapshotId);
  }

  list(): Array<Record<string, unknown>> {
    return Array.from(this.snapshots.values()).map(s => ({
      snapshotId: s.snapshotId,
      origin: s.origin,
      simulated: s.simulated,
      loadedAt: s.loadedAt,
      nodeCount: s.parser.nodeCount(),
      edgeCount: s.parser.edgeCount(),
    }));
  }

  private evictIfNeeded(): void {
    if (this.snapshots.size < MAX_OPEN_SNAPSHOTS) return;
    // evict the least recently accessed
    let oldest: string | null = null;
    let oldestAt = Infinity;
    for (const [id, s] of this.snapshots) {
      if (s.lastAccessAt < oldestAt) { oldestAt = s.lastAccessAt; oldest = id; }
    }
    if (oldest) this.snapshots.delete(oldest);
    if (this.snapshots.size >= MAX_OPEN_SNAPSHOTS) {
      throw new Error('RESOURCE_EXHAUSTED: too many open heap snapshots. Close unused ones with dt_close_heapsnapshot.');
    }
  }
}

export const heapStore = new HeapSnapshotStore();

/** Type re-export for the raw snapshot format. */
export type { RawHeapSnapshot };
