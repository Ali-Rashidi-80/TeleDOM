/**
 * CAP 29 — Forensic Evidence Scoring model (§11/§12/§17).
 *
 * Every conclusion produced by the 30 native capabilities carries:
 *   confidence ∈ [0,1], evidence count, evidence types, supporting records.
 * Confidence combines evidence WEIGHTS (independent-source diversity)
 * via a noisy-OR style aggregation — more independent corroboration
 * pushes confidence up; contradictions pull it down.
 */

export type EvidenceSource =
  | 'DOM_OBSERVATION'
  | 'MUTATION_RECORD'
  | 'NETWORK_CORRELATION'
  | 'CONSOLE_EVIDENCE'
  | 'SCREENSHOT_EVIDENCE'
  | 'PERFORMANCE_TRACE'
  | 'MEMORY_EVIDENCE'
  | 'NAVIGATION_RECORD'
  | 'USER_INTERACTION'
  | 'STYLE_EVIDENCE'
  | 'INFERRED';

export interface EvidenceItem {
  source: EvidenceSource;
  description: string;
  /** Reference into recorded data (eventId, requestId, snapshotId…). */
  ref?: string;
  timestamp?: number;
  /** How strongly this single item supports the conclusion [0..1]. */
  weight: number;
}

export interface EvidenceFinding {
  id: string;
  conclusion: string;
  confidence: number;
  /** Human band of the confidence (VERY_HIGH…VERY_LOW). */
  band: string;
  evidenceCount: number;
  evidenceTypes: EvidenceSource[];
  evidence: EvidenceItem[];
  contradictoryEvidence?: EvidenceItem[];
  method: string;
}

/** Intrinsic weight per evidence source — conservative defaults. */
export const SOURCE_WEIGHTS: Record<EvidenceSource, number> = {
  DOM_OBSERVATION: 0.72,
  MUTATION_RECORD: 0.8,
  NETWORK_CORRELATION: 0.55,
  CONSOLE_EVIDENCE: 0.68,
  SCREENSHOT_EVIDENCE: 0.5,
  PERFORMANCE_TRACE: 0.55,
  MEMORY_EVIDENCE: 0.45,
  NAVIGATION_RECORD: 0.6,
  USER_INTERACTION: 0.7,
  STYLE_EVIDENCE: 0.66,
  INFERRED: 0.3,
};

let findingCounter = 0;

export class EvidenceBuilder {
  private items: EvidenceItem[] = [];
  private contradictions: EvidenceItem[] = [];
  private conclusion: string;
  private method: string;

  constructor(conclusion: string, method: string) {
    this.conclusion = conclusion;
    this.method = method;
  }

  add(source: EvidenceSource, description: string, ref?: string, timestamp?: number): this {
    this.items.push({ source, description, ref, timestamp, weight: SOURCE_WEIGHTS[source] });
    return this;
  }

  contradict(source: EvidenceSource, description: string, ref?: string): this {
    this.contradictions.push({ source, description, ref, weight: SOURCE_WEIGHTS[source] });
    return this;
  }

  /** Build the scored finding. */
  build(): EvidenceFinding {
    const confidence = scoreConfidence(this.items, this.contradictions);
    const types = Array.from(new Set(this.items.map(i => i.source)));
    return {
      id: `find_${++findingCounter}_${Date.now().toString(36)}`,
      conclusion: this.conclusion,
      confidence: Number(confidence.toFixed(3)),
      band: confidenceBand(confidence),
      evidenceCount: this.items.length,
      evidenceTypes: types,
      evidence: this.items,
      contradictoryEvidence: this.contradictions.length ? this.contradictions : undefined,
      method: this.method,
    };
  }
}

/**
 * Confidence aggregation:
 *   base = noisy-OR over item weights, capped by diversity bonus,
 *   reduced by contradicting evidence, floored at 0.05 when any
 *   evidence exists (never 0 with real records) and capped at 0.98
 *   (forensic conclusions are never 100%).
 */
export function scoreConfidence(supporting: EvidenceItem[], contradicting: EvidenceItem[] = []): number {
  if (supporting.length === 0) return 0;
  let noisyOr = 0;
  for (const item of supporting) {
    const clamped = Math.min(1, Math.max(0.05, item.weight));
    noisyOr = noisyOr + clamped * (1 - noisyOr);
  }
  // Diversity bonus: independent source types corroborate stronger.
  const types = new Set(supporting.map(i => i.source));
  const diversity = Math.min(0.08, 0.02 * (types.size - 1));
  let confidence = Math.min(0.98, noisyOr + diversity);

  for (const contra of contradicting) {
    confidence *= (1 - Math.min(0.6, contra.weight));
  }
  if (supporting.length === 1) confidence = Math.min(confidence, 0.75);
  return Math.max(0.05, confidence);
}

/** Standalone scoring entry (fx_evidence_scoring tool). */
export function scoreFinding(conclusion: string, supporting: Array<{ source: EvidenceSource; description: string; ref?: string; timestamp?: number; weight?: number }>, contradicting: Array<{ source: EvidenceSource; description: string; weight?: number }> = []): EvidenceFinding {
  const items: EvidenceItem[] = supporting.map(s => ({
    source: s.source,
    description: s.description,
    ref: s.ref,
    timestamp: s.timestamp,
    weight: s.weight !== undefined ? Math.min(1, Math.max(0, s.weight)) : SOURCE_WEIGHTS[s.source],
  }));
  const contra: EvidenceItem[] = contradicting.map(c => ({
    source: c.source,
    description: c.description,
    weight: c.weight !== undefined ? c.weight : SOURCE_WEIGHTS[c.source],
  }));
  return {
    id: `find_manual_${Date.now().toString(36)}`,
    conclusion,
    confidence: Number(scoreConfidence(items, contra).toFixed(3)),
    band: confidenceBand(scoreConfidence(items, contra)),
    evidenceCount: items.length,
    evidenceTypes: Array.from(new Set(items.map(i => i.source))),
    evidence: items,
    contradictoryEvidence: contra.length ? contra : undefined,
    method: 'Direct evidence scoring (fx_evidence_scoring)',
  };
}

/** Interpret a confidence value for reports. */
export function confidenceBand(confidence: number): 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' {
  if (confidence >= 0.85) return 'VERY_HIGH';
  if (confidence >= 0.65) return 'HIGH';
  if (confidence >= 0.4) return 'MEDIUM';
  if (confidence >= 0.2) return 'LOW';
  return 'VERY_LOW';
}
