/**
 * TeleDOM v4 Agent — Durable Memory.
 *
 * Structured project/session knowledge with MANDATORY provenance and
 * confidence per item: known component, target, failure, causal relation,
 * selector, unstable selector, environment, workaround, verified fix,
 * invariant, security condition, benchmark. Uncertain memory is never
 * treated as fact. Learning influences rankings/heuristics/prioritization
 * only — never security policy, never code execution.
 */

export type MemoryKind =
  | 'known-component' | 'known-target' | 'known-failure' | 'known-causal-relation'
  | 'known-selector' | 'known-unstable-selector' | 'known-environment'
  | 'known-workaround' | 'known-verified-fix' | 'known-invariant'
  | 'known-security-condition' | 'known-benchmark';

export interface MemoryItem {
  memoryId: string;
  kind: MemoryKind;
  statement: string;
  /** Provenance: which incident/evidence produced this memory. */
  provenance: { incidentId?: string; evidenceRefs: string[]; origin: string };
  confidence: number;
  timesReused: number;
  createdAt: number;
  lastValidatedAt: number | null;
  validated: boolean;
}

export interface MemoryQuery {
  kinds?: MemoryKind[];
  minConfidence?: number;
  searchText?: string;
  onlyValidated?: boolean;
  limit?: number;
}

export class AgentMemory {
  private items: MemoryItem[] = [];
  private seq = 0;

  /**
   * Store a memory item. Items below the confidence floor are stored but
   * flagged unvalidated — consumers must check `validated` before treating
   * a memory as fact.
   */
  store(
    kind: MemoryKind,
    statement: string,
    provenance: MemoryItem['provenance'],
    confidence: number,
  ): MemoryItem {
    this.seq += 1;
    const item: MemoryItem = {
      memoryId: `mem:${this.seq}`,
      kind,
      statement,
      provenance,
      confidence: Math.max(0, Math.min(1, confidence)),
      timesReused: 0,
      createdAt: Date.now(),
      lastValidatedAt: null,
      validated: confidence >= 0.75,
    };
    this.items.push(item);
    return item;
  }

  query(q: MemoryQuery = {}): MemoryItem[] {
    const out = this.items.filter((item) => {
      if (q.kinds?.length && !q.kinds.includes(item.kind)) return false;
      if (q.minConfidence !== undefined && item.confidence < q.minConfidence) return false;
      if (q.onlyValidated && !item.validated) return false;
      if (q.searchText && !item.statement.toLowerCase().includes(q.searchText.toLowerCase())) return false;
      return true;
    });
    out.sort((a, b) => b.confidence - a.confidence);
    const limited = q.limit ? out.slice(0, q.limit) : out;
    for (const item of limited) item.timesReused += 1;
    return limited.map((i) => ({ ...i }));
  }

  /** Validation feedback from later investigations. */
  validate(memoryId: string, outcome: 'CONFIRMED' | 'CONTRADICTED'): void {
    const item = this.items.find((i) => i.memoryId === memoryId);
    if (!item) return;
    item.lastValidatedAt = Date.now();
    if (outcome === 'CONFIRMED') {
      item.confidence = Math.min(1, item.confidence + 0.1);
      item.validated = item.confidence >= 0.75;
    } else {
      item.confidence = Math.max(0, item.confidence - 0.3);
      item.validated = false;
    }
  }

  /**
   * Learning influences only rankings/heuristics: e.g. boosting selector
   * candidates whose patterns were historically stable.
   */
  heuristicBoost(kind: MemoryKind, predicate: (statement: string) => boolean): number {
    const matches = this.items.filter((i) => i.kind === kind && predicate(i.statement) && i.validated);
    if (matches.length === 0) return 0;
    const avgConfidence = matches.reduce((s, i) => s + i.confidence, 0) / matches.length;
    return Math.min(0.2, matches.length * 0.02 + avgConfidence * 0.05);
  }

  stats(): { total: number; validated: number; byKind: Record<string, number> } {
    const byKind: Record<string, number> = {};
    for (const i of this.items) byKind[i.kind] = (byKind[i.kind] ?? 0) + 1;
    return { total: this.items.length, validated: this.items.filter((i) => i.validated).length, byKind };
  }

  serialize(): MemoryItem[] {
    return [...this.items];
  }

  restore(items: MemoryItem[]): void {
    this.items = [...items];
    this.seq = items.length;
  }
}
