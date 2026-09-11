/**
 * TeleDOM v12+ Temporal — StateFrame.
 *
 * A page state is a versioned vector (DOM + semantics + layout + styles +
 * runtime + network + console + navigation + storage + frames + components +
 * interactions + performance + security), stored as references to immutable
 * chunks instead of one giant copy.
 */

import { computeHash } from '../kernel/integrity';

export type StateDimension =
  | 'dom' | 'styles' | 'layout' | 'accessibility' | 'network' | 'console'
  | 'runtime' | 'navigation' | 'storage' | 'frames' | 'components'
  | 'interactions' | 'performance' | 'security' | 'visual' | 'semantic';

export const ALL_DIMENSIONS: StateDimension[] = [
  'dom', 'styles', 'layout', 'accessibility', 'network', 'console',
  'runtime', 'navigation', 'storage', 'frames', 'components',
  'interactions', 'performance', 'security', 'visual', 'semantic',
];

export interface StateChunk {
  /** Content-addressed id: `chunk:<sha256[:16]>`. */
  chunkId: string;
  dimension: StateDimension;
  payload: unknown;
}

export interface StateFrame {
  frameId: string;
  /** Logical sequence this frame was captured at. */
  sequence: number;
  logicalTime: number;
  wallTime: number;
  /** Immutable chunk references per dimension. */
  refs: Partial<Record<StateDimension, string>>;
  /** Frame content hash over the referenced chunk ids. */
  frameHash: string;
}

export class ChunkStore {
  private chunks = new Map<string, StateChunk>();

  put(dimension: StateDimension, payload: unknown): StateChunk {
    const hash = computeHash({ dimension, payload });
    const chunkId = `chunk:${hash.slice(0, 16)}`;
    if (!this.chunks.has(chunkId)) {
      this.chunks.set(chunkId, { chunkId, dimension, payload });
    }
    return this.chunks.get(chunkId)!;
  }

  get(chunkId: string): StateChunk | undefined {
    return this.chunks.get(chunkId);
  }

  /** Storage hygiene: drop chunks unreferenced by the given frames. */
  collect(frames: StateFrame[]): number {
    const live = new Set<string>();
    for (const f of frames) for (const ref of Object.values(f.refs)) if (ref) live.add(ref);
    let dropped = 0;
    for (const id of this.chunks.keys()) {
      if (!live.has(id)) {
        this.chunks.delete(id);
        dropped += 1;
      }
    }
    return dropped;
  }

  get size(): number {
    return this.chunks.size;
  }
}

export class StateFrameBuilder {
  constructor(private chunks: ChunkStore) {}

  capture(
    sequence: number,
    logicalTime: number,
    wallTime: number,
    state: Partial<Record<StateDimension, unknown>>,
  ): StateFrame {
    const refs: Partial<Record<StateDimension, string>> = {};
    for (const [dim, payload] of Object.entries(state)) {
      if (payload === undefined) continue;
      const chunk = this.chunks.put(dim as StateDimension, payload);
      refs[dim as StateDimension] = chunk.chunkId;
    }
    const frameHash = computeHash({ sequence, refs });
    return {
      frameId: `frame:${sequence}:${frameHash.slice(0, 10)}`,
      sequence,
      logicalTime,
      wallTime,
      refs,
      frameHash,
    };
  }

  /** Materialize a frame's dimensions (selective materialization). */
  materialize(frame: StateFrame, dims?: StateDimension[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    const wanted = dims ?? (Object.keys(frame.refs) as StateDimension[]);
    for (const dim of wanted) {
      const ref = frame.refs[dim];
      if (!ref) continue;
      const chunk = this.chunks.get(ref);
      if (chunk) out[dim] = chunk.payload;
    }
    return out;
  }
}
