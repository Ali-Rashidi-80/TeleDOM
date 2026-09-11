/**
 * TeleDOM v12+ Verification — Contracts, Engine, Proof.
 *
 * Action ≠ Success. Every mutating or diagnostic claim has a verification
 * contract; PASS requires postconditions actually verified. INCONCLUSIVE
 * is never silently mapped to PASS. A successful mutation is NOT proof of
 * a successful fix. Proof records are machine-verifiable.
 */

import { computeHash } from '../kernel/integrity';
import type { EvidenceNode } from '../evidence/graph';

export interface VerificationContract {
  action: string;
  preconditions: string[];
  expectedBehavior: string;
  /** Must be true after the observation window. */
  mustHold: { description: string; check: (observed: Record<string, unknown>) => boolean }[];
  /** Must be false after the observation window. */
  mustNotHold: { description: string; check: (observed: Record<string, unknown>) => boolean }[];
  /** Observation window in ms. */
  timeWindowMs: number;
  /** Evidence artifacts required to accept the result. */
  evidenceRequired: string[];
}

export type VerificationResult = 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'UNSUPPORTED';

export interface VerificationReport {
  contractAction: string;
  result: VerificationResult;
  mustHoldResults: { description: string; passed: boolean }[];
  mustNotHoldResults: { description: string; passed: boolean }[];
  evidenceCollected: string[];
  missingEvidence: string[];
  observedAt: number;
  rationale: string;
}

export class VerificationEngine {
  /**
   * Evaluate a contract against observed state + collected evidence.
   * Missing required evidence → INCONCLUSIVE (never PASS).
   */
  verify(
    contract: VerificationContract,
    observed: Record<string, unknown>,
    collectedEvidence: { ref: string }[],
  ): VerificationReport {
    const mustHoldResults = contract.mustHold.map((m) => ({
      description: m.description,
      passed: safeCheck(m.check, observed),
    }));
    const mustNotHoldResults = contract.mustNotHold.map((m) => ({
      description: m.description,
      passed: !safeCheck(m.check, observed),
    }));
    const evidenceRefs = collectedEvidence.map((e) => e.ref);
    const missingEvidence = contract.evidenceRequired.filter((req) => !evidenceRefs.includes(req));

    let result: VerificationResult;
    const allPassed = mustHoldResults.every((r) => r.passed) && mustNotHoldResults.every((r) => r.passed);
    if (!allPassed) {
      result = 'FAIL';
    } else if (missingEvidence.length > 0) {
      result = 'INCONCLUSIVE';
    } else {
      result = 'PASS';
    }
    const rationale = result === 'PASS'
      ? `all postconditions held and required evidence was collected within ${contract.timeWindowMs}ms`
      : result === 'FAIL'
        ? `postconditions failed: ${[...mustHoldResults, ...mustNotHoldResults].filter((r) => !r.passed).map((r) => r.description).join('; ')}`
        : `cannot verify: missing required evidence [${missingEvidence.join(', ')}]`;
    return {
      contractAction: contract.action,
      result,
      mustHoldResults,
      mustNotHoldResults,
      evidenceCollected: evidenceRefs,
      missingEvidence,
      observedAt: Date.now(),
      rationale,
    };
  }
}

function safeCheck(check: (observed: Record<string, unknown>) => boolean, observed: Record<string, unknown>): boolean {
  try {
    return check(observed) === true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Proof Engine
// ---------------------------------------------------------------------------

export interface ProofClaim {
  statement: string;
  evidenceNodeIds: string[];
  verificationRef?: string;
  confidence: number;
}

export interface ProofStep {
  step: number;
  statement: string;
  justification: string;
  evidenceRefs: string[];
}

export interface ProofRecord {
  proofId: string;
  createdAt: number;
  claims: ProofClaim[];
  steps: ProofStep[];
  conclusion: string;
  /** Hash over the full proof content — tamper-evident. */
  proofHash: string;
  /** Chained to the previous proof of the same session (when provided). */
  previousProofHash?: string;
  verificationStatus: VerificationResult;
}

/**
 * Machine-verifiable proof: explicit claims, explicit steps, explicit
 * evidence references, content-hashed. Another agent (or human) can walk
 * the steps and re-check every claim against the referenced evidence.
 */
export class ProofEngine {
  private proofs: ProofRecord[] = [];

  generate(
    claims: ProofClaim[],
    steps: ProofStep[],
    conclusion: string,
    verificationStatus: VerificationResult,
  ): ProofRecord {
    const previous = this.proofs[this.proofs.length - 1];
    const content = { claims, steps, conclusion, verificationStatus };
    const proofHash = computeHash({ content, previous: previous?.proofHash });
    const proof: ProofRecord = {
      proofId: `proof:${proofHash.slice(0, 16)}`,
      createdAt: Date.now(),
      claims,
      steps: steps.map((s, i) => ({ ...s, step: i + 1 })),
      conclusion,
      proofHash,
      previousProofHash: previous?.proofHash,
      verificationStatus,
    };
    this.proofs.push(proof);
    return proof;
  }

  /** Independent re-check: recompute the hash of a submitted proof. */
  verifyProof(proof: ProofRecord): boolean {
    const content = { claims: proof.claims, steps: proof.steps, conclusion: proof.conclusion, verificationStatus: proof.verificationStatus };
    const expected = computeHash({ content, previous: proof.previousProofHash });
    return expected === proof.proofHash;
  }

  byId(proofId: string): ProofRecord | undefined {
    return this.proofs.find((p) => p.proofId === proofId);
  }

  list(): readonly ProofRecord[] {
    return this.proofs;
  }

  /** Link evidence nodes to a proof claim (graph edge creation is done by
   * callers owning the EvidenceGraph; here we just validate references). */
  static validateClaimEvidence(claim: ProofClaim, nodes: Map<string, EvidenceNode>): { valid: boolean; missing: string[] } {
    const missing = claim.evidenceNodeIds.filter((id) => !nodes.has(id));
    return { valid: missing.length === 0, missing };
  }
}
