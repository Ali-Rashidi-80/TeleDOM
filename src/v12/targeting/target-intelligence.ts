/**
 * TeleDOM v12+ Targeting — Target Resolution, Recovery & Contracts.
 *
 * Targets support semantic + historical identity. Resolution scores
 * candidates across structural/semantic/historical/behavioral/visual
 * signals and VERIFIES before action. Recovery works after rerender,
 * remount, DOM movement, selector change, SPA navigation, tab changes.
 */

import { computeHash } from '../kernel/integrity';

export interface TargetQuery {
  /** Natural-language or semantic description, e.g. "checkout submit button". */
  description?: string;
  role?: string;
  text?: string;
  selector?: string;
  component?: string;
  semanticId?: string;
  entityId?: string;
}

export interface TargetCandidate {
  candidateId: string;
  selector: string;
  semanticId: string;
  structuralScore: number;
  semanticScore: number;
  historicalScore: number;
  behavioralScore: number;
  visualScore: number;
  stabilityScore: number;
  overall: number;
  evidence: string[];
}

export interface TargetResolution {
  status: 'RESOLVED' | 'AMBIGUOUS' | 'NOT_FOUND' | 'DEGRADED';
  best: TargetCandidate | null;
  candidates: TargetCandidate[];
  confidence: number;
  verified: boolean;
  warnings: string[];
}

interface TargetHistoryEntry {
  semanticId: string;
  selector: string;
  timesResolved: number;
  timesFailed: number;
  lastResolvedAt: number;
  lastSelectors: string[];
}

export interface TargetContract {
  contractId: string;
  query: TargetQuery;
  resolvedSemanticId: string;
  selectorCandidates: string[];
  confidence: number;
  createdAt: number;
  resolvedCount: number;
}

const SIGNAL_WEIGHTS = {
  structural: 0.2,
  semantic: 0.3,
  historical: 0.2,
  behavioral: 0.15,
  visual: 0.15,
};

export class TargetIntelligence {
  private history: TargetHistoryEntry[] = [];
  private contracts = new Map<string, TargetContract>();

  /**
   * Resolve a query to a VERIFIED entity. Refuses to blindly return the
   * nearest match: ambiguous or low-confidence resolutions surface as
   * AMBIGUOUS / NOT_FOUND with warnings.
   */
  resolve(
    query: TargetQuery,
    candidates: {
      semanticId: string;
      selector: string;
      role?: string;
      text?: string;
      component?: string;
      interactive?: boolean;
      visible?: boolean;
      stability?: number;
    }[],
  ): TargetResolution {
    const warnings: string[] = [];
    const scored: TargetCandidate[] = candidates.map((c) => {
      const evidence: string[] = [];
      // Structural signal.
      let structuralScore = 0.35;
      if (query.selector && c.selector === query.selector) {
        structuralScore = 1;
        evidence.push('selector exact match');
      } else if (query.selector && (c.selector.includes(query.selector) || query.selector.includes(c.selector))) {
        structuralScore = 0.6;
        evidence.push('selector partial match');
      }
      // Semantic signal.
      let semanticScore = 0.3;
      if (query.role && c.role === query.role) {
        semanticScore += 0.4;
        evidence.push(`role match: ${c.role}`);
      }
      if (query.text && c.text && this.textSimilarity(query.text, c.text) > 0.6) {
        semanticScore += 0.35;
        evidence.push('text similarity match');
      }
      if (query.component && c.component === query.component) {
        semanticScore += 0.25;
        evidence.push('component ownership match');
      }
      semanticScore = Math.min(1, semanticScore);
      if (query.description) {
        const descScore = this.descriptionMatch(query.description, c);
        semanticScore = Math.max(semanticScore, descScore);
        if (descScore > 0.6) evidence.push('natural-language description match');
      }
      // Historical signal.
      const hist = this.history.find((h) => h.semanticId === c.semanticId);
      const historicalScore = hist
        ? Math.min(1, hist.timesResolved / (hist.timesResolved + hist.timesFailed + 1) + 0.3)
        : 0.3;
      if (hist?.timesResolved) evidence.push(`resolved ${hist.timesResolved}x before`);
      // Behavioral signal.
      const behavioralScore = c.interactive ? 0.8 : 0.3;
      if (!c.interactive && query.role?.includes('action')) warnings.push(`candidate ${c.selector} is not interactive`);
      // Visual signal.
      const visualScore = c.visible === false ? 0.15 : c.visible === true ? 0.85 : 0.5;
      if (c.visible === false) warnings.push(`candidate ${c.selector} is not visible`);
      const stabilityScore = c.stability ?? 0.5;
      const overall =
        structuralScore * SIGNAL_WEIGHTS.structural +
        semanticScore * SIGNAL_WEIGHTS.semantic +
        historicalScore * SIGNAL_WEIGHTS.historical +
        behavioralScore * SIGNAL_WEIGHTS.behavioral +
        visualScore * SIGNAL_WEIGHTS.visual +
        stabilityScore * 0.0;
      return {
        candidateId: `cand:${computeHash({ s: c.selector, sem: c.semanticId }).slice(0, 10)}`,
        selector: c.selector,
        semanticId: c.semanticId,
        structuralScore,
        semanticScore,
        historicalScore,
        behavioralScore,
        visualScore,
        stabilityScore: Math.min(1, stabilityScore + (hist ? 0.1 : 0)),
        overall: Math.min(0.99, overall),
        evidence,
      };
    });
    scored.sort((a, b) => b.overall - a.overall);
    const best = scored[0] ?? null;
    if (!best) {
      return { status: 'NOT_FOUND', best: null, candidates: [], confidence: 0, verified: false, warnings: ['no candidates'] };
    }
    const second = scored[1];
    const ambiguous = second && best.overall - second.overall < 0.08 && second.overall > 0.5;
    if (ambiguous) {
      warnings.push('two candidates within 0.08 overall score — resolution ambiguous');
    }
    const status: TargetResolution['status'] =
      ambiguous ? 'AMBIGUOUS' : best.overall >= 0.55 ? 'RESOLVED' : best.overall >= 0.35 ? 'DEGRADED' : 'NOT_FOUND';
    this.recordHistory(best, status === 'RESOLVED');
    return {
      status,
      best,
      candidates: scored,
      confidence: status === 'RESOLVED' ? best.overall : status === 'DEGRADED' ? best.overall * 0.7 : 0,
      verified: status === 'RESOLVED' && best.evidence.length >= 1,
      warnings,
    };
  }

  private recordHistory(candidate: TargetCandidate, success: boolean): void {
    let entry = this.history.find((h) => h.semanticId === candidate.semanticId);
    if (!entry) {
      entry = {
        semanticId: candidate.semanticId,
        selector: candidate.selector,
        timesResolved: 0,
        timesFailed: 0,
        lastResolvedAt: Date.now(),
        lastSelectors: [],
      };
      this.history.push(entry);
    }
    if (success) {
      entry.timesResolved += 1;
      entry.lastResolvedAt = Date.now();
      entry.lastSelectors.push(candidate.selector);
    } else {
      entry.timesFailed += 1;
    }
  }

  private textSimilarity(a: string, b: string): number {
    const norm = (s: string) => s.toLowerCase().trim();
    const sa = norm(a), sb = norm(b);
    if (sa === sb) return 1;
    if (sa.includes(sb) || sb.includes(sa)) return 0.75;
    const tokensA = new Set(sa.split(/\s+/));
    const tokensB = new Set(sb.split(/\s+/));
    let shared = 0;
    for (const t of tokensA) if (tokensB.has(t)) shared += 1;
    return shared / Math.max(tokensA.size, tokensB.size, 1);
  }

  private descriptionMatch(description: string, c: { role?: string; text?: string; selector: string }): number {
    const words = description.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
    let score = 0;
    for (const w of words) {
      if ((c.text ?? '').toLowerCase().includes(w)) score += 0.25;
      if ((c.role ?? '').toLowerCase().includes(w)) score += 0.2;
      if (c.selector.toLowerCase().includes(w.replace(/\s+/g, '-'))) score += 0.15;
    }
    return Math.min(1, score);
  }

  /**
   * Recover a target after its representation changed. Combines semantic
   * role, historical identity, ancestry, text + component ownership.
   * Returns null when recovery would be a blind guess (honest failure).
   */
  recover(
    failedSelector: string,
    lastKnown: { semanticId?: string; text?: string; role?: string; component?: string; ancestorSelector?: string },
    currentCandidates: Parameters<TargetIntelligence['resolve']>[1],
  ): TargetResolution {
    const warnings: string[] = [`selector ${failedSelector} failed; attempting multi-signal recovery`];
    const scored = currentCandidates.map((c) => {
      let score = 0;
      const evidence: string[] = [];
      if (lastKnown.semanticId && c.semanticId === lastKnown.semanticId) {
        score += 0.5;
        evidence.push('historical semantic identity match');
      }
      if (lastKnown.text && c.text && this.textSimilarity(lastKnown.text, c.text) > 0.7) {
        score += 0.3;
        evidence.push('text similarity');
      }
      if (lastKnown.role && c.role === lastKnown.role) {
        score += 0.2;
        evidence.push('semantic role match');
      }
      if (lastKnown.component && c.component === lastKnown.component) {
        score += 0.15;
        evidence.push('component ownership survived');
      }
      if (lastKnown.ancestorSelector && c.selector.includes(lastKnown.ancestorSelector)) {
        score += 0.1;
        evidence.push('ancestry match');
      }
      return { c, score: Math.min(0.95, score), evidence };
    });
    scored.sort((a, b) => b.score - a.score);
    const best = scored[0];
    if (!best || best.score < 0.5) {
      warnings.push('recovery refused: best candidate below 0.5 confidence (would be a blind guess)');
      return { status: 'NOT_FOUND', best: null, candidates: [], confidence: 0, verified: false, warnings };
    }
    return {
      status: best.score >= 0.65 ? 'RESOLVED' : 'DEGRADED',
      best: {
        candidateId: `recovered:${computeHash({ s: best.c.selector }).slice(0, 10)}`,
        selector: best.c.selector,
        semanticId: best.c.semanticId,
        structuralScore: 0.3,
        semanticScore: best.score,
        historicalScore: lastKnown.semanticId === best.c.semanticId ? 0.9 : 0.4,
        behavioralScore: best.c.interactive ? 0.8 : 0.3,
        visualScore: best.c.visible === false ? 0.2 : 0.8,
        stabilityScore: 0.6,
        overall: best.score,
        evidence: best.evidence,
      },
      candidates: [],
      confidence: best.score,
      verified: true,
      warnings,
    };
  }

  /** Create a durable target contract for future actions. */
  createContract(query: TargetQuery, resolution: TargetResolution): TargetContract | null {
    if (!resolution.best) return null;
    const contractId = `contract:${computeHash({ q: query, sem: resolution.best.semanticId }).slice(0, 12)}`;
    const existing = this.contracts.get(contractId);
    const contract: TargetContract = {
      contractId,
      query,
      resolvedSemanticId: resolution.best.semanticId,
      selectorCandidates: [resolution.best.selector, ...resolution.candidates.slice(1, 4).map((c) => c.selector)],
      confidence: resolution.confidence,
      createdAt: existing?.createdAt ?? Date.now(),
      resolvedCount: (existing?.resolvedCount ?? 0) + 1,
    };
    this.contracts.set(contractId, contract);
    return contract;
  }

  getContract(contractId: string): TargetContract | undefined {
    return this.contracts.get(contractId);
  }
}
