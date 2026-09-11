/**
 * TeleDOM v12+ Evidence — Provenance & Confidence.
 *
 * Confidence is RECALCULATED from source quality + corroboration +
 * verification — never a marketing number. Uncertain memory is never
 * treated as fact.
 */

export type SourceQuality =
  | 'direct-observation'   // measured by the platform itself
  | 'runtime-reported'     // console/network/runtime APIs
  | 'derived'              // computed by an analyzer
  | 'inferred'             // heuristic inference
  | 'assumed';             // explicit assumption

export const SOURCE_QUALITY_WEIGHT: Record<SourceQuality, number> = {
  'direct-observation': 1.0,
  'runtime-reported': 0.9,
  derived: 0.75,
  inferred: 0.6,
  assumed: 0.4,
};

export interface ProvenanceRecord {
  /** What produced this claim. */
  origin: string;
  quality: SourceQuality;
  /** References to underlying events/evidence. */
  evidenceRefs: string[];
  recordedAt: number;
  notes?: string[];
}

export interface ConfidenceInput {
  provenance: ProvenanceRecord[];
  /** Number of INDEPENDENT corroborating sources. */
  corroboration: number;
  /** Was the claim verified by a verification contract? */
  verified: boolean;
  /** Was any counterevidence observed? */
  contradicted: boolean;
  /** Kernel health multiplier (self-diagnostics). */
  kernelConfidenceMultiplier?: number;
}

export interface ConfidenceAssessment {
  confidence: number;
  classification: 'OBSERVED' | 'CORRELATED' | 'SUPPORTED' | 'STRONG_HYPOTHESIS' | 'COUNTERFACTUALLY_SUPPORTED' | 'VERIFIED' | 'DISPROVEN' | 'UNKNOWN';
  rationale: string[];
}

/**
 * Confidence = weighted source quality × corroboration factor × verification
 * bonus, penalized by counterevidence and kernel uncertainty.
 */
export function assessConfidence(input: ConfidenceInput): ConfidenceAssessment {
  const rationale: string[] = [];
  if (input.provenance.length === 0) {
    return { confidence: 0, classification: 'UNKNOWN', rationale: ['no provenance — refused'] };
  }
  let bestQuality = 0;
  let qualitySum = 0;
  for (const p of input.provenance) {
    const w = SOURCE_QUALITY_WEIGHT[p.quality];
    bestQuality = Math.max(bestQuality, w);
    qualitySum += w;
    rationale.push(`source ${p.origin}: quality=${p.quality} (${w})`);
  }
  const avgQuality = qualitySum / input.provenance.length;
  const corroborationFactor = 1 + Math.min(0.25, input.corroboration * 0.08);
  rationale.push(`corroboration x${input.corroboration} → factor ${corroborationFactor.toFixed(2)}`);
  let confidence = avgQuality * corroborationFactor;
  if (input.verified) {
    confidence = Math.min(1, confidence + 0.2);
    rationale.push('verified by contract: +0.2');
  }
  if (input.contradicted) {
    confidence *= 0.5;
    rationale.push('counterevidence observed: ×0.5');
  }
  if (input.kernelConfidenceMultiplier !== undefined && input.kernelConfidenceMultiplier < 1) {
    confidence *= input.kernelConfidenceMultiplier;
    rationale.push(`kernel confidence multiplier ${input.kernelConfidenceMultiplier} applied`);
  }
  confidence = Math.max(0, Math.min(1, confidence));

  let classification: ConfidenceAssessment['classification'];
  if (input.contradicted && confidence < 0.4) classification = 'DISPROVEN';
  else if (input.verified && confidence >= 0.8) classification = 'VERIFIED';
  else if (bestQuality >= 1 && input.corroboration >= 1) classification = 'SUPPORTED';
  else if (bestQuality >= 0.9) classification = 'OBSERVED';
  else if (input.corroboration >= 1) classification = 'CORRELATED';
  else if (confidence >= 0.6) classification = 'STRONG_HYPOTHESIS';
  else classification = 'UNKNOWN';
  return { confidence, classification, rationale };
}
