/**
 * TeleDOM v12+ Causality — Correlation + Inference + Root Cause + Hypotheses.
 *
 * NEVER labels "A happened before B" as "A caused B". Causal conclusions
 * expose evidence, confidence, temporal relation, alternative hypotheses,
 * counterevidence and a verification method. Correlation ≠ causation is
 * enforced by classification.
 */

import type { EventEnvelope } from '../kernel/events';
import { EvidenceGraph, EvidenceNode } from '../evidence/graph';
import { assessConfidence, ProvenanceRecord } from '../evidence/confidence';

export type CausalClassification =
  | 'OBSERVED' | 'CORRELATED' | 'SUPPORTED' | 'STRONG_HYPOTHESIS'
  | 'COUNTERFACTUALLY_SUPPORTED' | 'VERIFIED' | 'DISPROVEN' | 'UNKNOWN';

export interface CausalLink {
  fromEvent: EventEnvelope;
  toEvent: EventEnvelope;
  deltaMs: number;
  classification: CausalClassification;
  confidence: number;
  evidence: string[];
  alternatives: string[];
  verificationMethod: string;
}

export interface CausalChain {
  /** Ordered causal events from trigger to symptom. */
  events: EventEnvelope[];
  links: CausalLink[];
  rootCause: string;
  confidence: number;
  classification: CausalClassification;
  alternatives: string[];
  evidenceRefs: string[];
}

export interface Hypothesis {
  id: string;
  statement: string;
  causalChain: CausalChain | null;
  confidence: number;
  evidenceRefs: string[];
  counterevidence: string[];
  verificationMethod: string;
  rank: number;
  status: 'UNTESTED' | 'TESTED-SUPPORTED' | 'TESTED-REJECTED' | 'INCONCLUSIVE';
}

/** Known deterministic causal rules: source order → effect order. */
const CAUSAL_RULES: { from: string[]; to: string; reason: string }[] = [
  { from: ['user'], to: 'network', reason: 'user action preceded a network request within window' },
  { from: ['network'], to: 'runtime', reason: 'network response preceded runtime state change' },
  { from: ['network'], to: 'console', reason: 'network failure preceded console error' },
  { from: ['runtime'], to: 'dom', reason: 'runtime state change preceded DOM mutation' },
  { from: ['dom'], to: 'performance', reason: 'DOM mutation preceded layout/performance event' },
  { from: ['performance'], to: 'visual', reason: 'layout event preceded visual change' },
  { from: ['dom'], to: 'dom', reason: 'ancestor mutation preceded descendant removal' },
  { from: ['network'], to: 'storage', reason: 'network response preceded storage change' },
  { from: ['security'], to: 'network', reason: 'security signal tied to network flow' },
];

/** Precomputed source-pair rule lookup (O(1) per pair instead of array scan). */
const RULE_PAIR_MAP: Map<string, { from: string[]; to: string; reason: string }> = (() => {
  const map = new Map<string, { from: string[]; to: string; reason: string }>();
  for (const rule of CAUSAL_RULES) {
    for (const from of rule.from) map.set(`${from}->${rule.to}`, rule);
  }
  return map;
})();

/** Bounded correlation: links per correlate() call (deterministic truncation). */
const MAX_LINKS_PER_CORRELATE = 20_000;

const SOURCE_TO_NODE_TYPE: Record<string, string> = {
  user: 'UserAction', network: 'NetworkRequest', runtime: 'RuntimeEvent',
  console: 'ConsoleError', dom: 'DOMMutation', performance: 'PerformanceEvent',
  visual: 'VisualFrame', security: 'SecuritySignal', storage: 'StorageEvent',
  navigation: 'RuntimeEvent',
};

export class CausalEngine {
  constructor(private graph: EvidenceGraph) {}

  /**
   * Correlate independent signals into candidate causal chains inside a
   * temporal window. Returns links with EXPLICIT classification — only
   * rule-supported, corroborated links are ever called causal candidates.
   */
  correlate(events: EventEnvelope[], windowMs = 250): CausalLink[] {
    const ordered = [...events].sort((a, b) => a.logicalTime - b.logicalTime);
    const links: CausalLink[] = [];
    outer:
    for (let i = 0; i < ordered.length; i++) {
      for (let j = i + 1; j < ordered.length; j++) {
        const a = ordered[i];
        const b = ordered[j];
        const deltaMs = b.logicalTime - a.logicalTime;
        if (deltaMs > windowMs) break;
        const rule = RULE_PAIR_MAP.get(`${a.source}->${b.source}`);
        const sharedEntity = a.entityIds.some((id) => b.entityIds.includes(id));
        if (!rule && !sharedEntity) continue;
        const classification: CausalClassification = rule && sharedEntity ? 'SUPPORTED' : rule ? 'CORRELATED' : 'OBSERVED';
        const confidence = Math.max(0, Math.min(0.95, (rule ? 0.6 : 0.3) + (sharedEntity ? 0.25 : 0) - Math.min(0.2, deltaMs / 2000)));
        links.push({
          fromEvent: a,
          toEvent: b,
          deltaMs,
          classification,
          confidence,
          evidence: [
            `event:${a.eventId}`, `event:${b.eventId}`,
            rule ? `rule:${rule.reason}` : 'shared-entity',
          ],
          alternatives: sharedEntity ? [] : ['common-cause', 'coincidence-within-window'],
          verificationMethod: 'counterfactual suppression + replay comparison',
        });
        if (links.length >= MAX_LINKS_PER_CORRELATE) break outer; // bounded, deterministic
      }
    }
    return links;
  }

  /** Build the causal graph nodes/edges around an incident's events. */
  buildGraph(events: EventEnvelope[], links: CausalLink[]): { nodes: EvidenceNode[] } {
    const nodes: EvidenceNode[] = [];
    const nodeFor = (ev: EventEnvelope): EvidenceNode => {
      const type = (SOURCE_TO_NODE_TYPE[ev.source] ?? 'RuntimeEvent') as EvidenceNode['type'];
      const node = this.graph.addNode(type as any, `${ev.source}:${ev.type}`, {
        eventId: ev.eventId,
        sequence: ev.sequence,
        payload: ev.payload,
      }, `event:${ev.eventId}`);
      nodes.push(node);
      return node;
    };
    for (const link of links) {
      const fromNode = nodeFor(link.fromEvent);
      const toNode = nodeFor(link.toEvent);
      const edgeType = link.classification === 'SUPPORTED' ? 'CAUSES' : link.classification === 'CORRELATED' ? 'CORRELATED_WITH' : 'PRECEDES';
      this.graph.addEdge(fromNode, toNode, edgeType as any, link.evidence, link.confidence);
    }
    return { nodes };
  }

  /**
   * Trace likely causes of a symptom event backwards through links,
   * producing a full chain (root → … → symptom) with alternatives.
   */
  rootCauseChain(symptom: EventEnvelope, events: EventEnvelope[], windowMs = 250): CausalChain {
    const links = this.correlate(events, windowMs);
    // Walk backwards from symptom through the strongest supported links.
    const chainEvents: EventEnvelope[] = [symptom];
    const chainLinks: CausalLink[] = [];
    let frontier: EventEnvelope = symptom;
    for (let depth = 0; depth < 12; depth++) {
      const incoming = links
        .filter((l) => l.toEvent.eventId === frontier.eventId)
        .sort((x, y) => y.confidence - x.confidence);
      const best = incoming[0];
      if (!best || best.confidence < 0.35) break;
      chainLinks.unshift(best);
      chainEvents.unshift(best.fromEvent);
      frontier = best.fromEvent;
    }
    const root = chainEvents[0];
    const provenance: ProvenanceRecord[] = chainLinks.map((l) => ({
      origin: `causal-rule:${l.fromEvent.source}→${l.toEvent.source}`,
      quality: 'derived',
      evidenceRefs: l.evidence,
      recordedAt: Date.now(),
      notes: [`${l.deltaMs}ms gap`],
    }));
    const assessment = assessConfidence({
      provenance,
      corroboration: chainLinks.filter((l) => l.classification === 'SUPPORTED').length,
      verified: false,
      contradicted: false,
    });
    return {
      events: chainEvents,
      links: chainLinks,
      rootCause: root ? `${root.source}:${root.type} (seq ${root.sequence})` : 'unknown',
      confidence: assessment.confidence,
      classification: assessment.classification as CausalClassification,
      alternatives: chainLinks.flatMap((l) => l.alternatives).filter((v, i, arr) => arr.indexOf(v) === i),
      evidenceRefs: chainLinks.flatMap((l) => l.evidence),
    };
  }

  /**
   * Generate + rank competing root-cause hypotheses for a symptom.
   * Ranking uses confidence × chain length penalty, and each hypothesis
   * carries a concrete verification method.
   */
  generateHypotheses(symptom: EventEnvelope, events: EventEnvelope[], windowMs = 250): Hypothesis[] {
    const chains: { seed: EventEnvelope; chain: CausalChain }[] = [];
    const links = this.correlate(events, windowMs);
    const seeds = new Set<string>();
    for (const l of links) {
      if (!seeds.has(l.fromEvent.eventId)) {
        seeds.add(l.fromEvent.eventId);
        chains.push({ seed: l.fromEvent, chain: this.rootCauseChainFrom(links, l.fromEvent, symptom) });
      }
    }
    const hypotheses: Hypothesis[] = chains.map((c, idx) => ({
      id: `hyp:${idx + 1}`,
      statement: `Root cause candidate: ${c.chain.rootCause}`,
      causalChain: c.chain,
      // Deeper chains explain MORE (reach further back to the true root):
      // depth is rewarded, not penalized. Short chains are alternative
      // explanations, ranked below complete ones at equal confidence.
      confidence: c.chain.confidence * (1 + Math.min(0.2, (c.chain.events.length - 1) * 0.04)),
      evidenceRefs: c.chain.evidenceRefs,
      counterevidence: c.chain.alternatives,
      verificationMethod: 'suppress the seed event in a counterfactual branch and re-run replay',
      rank: 0,
      status: 'UNTESTED' as const,
    }));
    hypotheses.sort((a, b) => b.confidence - a.confidence);
    hypotheses.forEach((h, i) => (h.rank = i + 1));
    return hypotheses;
  }

  private rootCauseChainFrom(links: CausalLink[], seed: EventEnvelope, symptom: EventEnvelope): CausalChain {
    const chainLinks: CausalLink[] = [];
    let frontier: EventEnvelope = symptom;
    for (let depth = 0; depth < 12; depth++) {
      const incoming = links
        .filter((l) => l.toEvent.eventId === frontier.eventId)
        .sort((x, y) => y.confidence - x.confidence);
      const best = incoming[0];
      if (!best || best.confidence < 0.35) break;
      chainLinks.unshift(best);
      if (best.fromEvent.eventId === seed.eventId) break;
      frontier = best.fromEvent;
    }
    const chainEvents = chainLinks.length ? [chainLinks[0].fromEvent, ...chainLinks.map((l) => l.toEvent)] : [seed, symptom];
    const provenance: ProvenanceRecord[] = chainLinks.map((l) => ({
      origin: `causal-rule`,
      quality: 'derived',
      evidenceRefs: l.evidence,
      recordedAt: Date.now(),
    }));
    const assessment = assessConfidence({
      provenance,
      corroboration: chainLinks.filter((l) => l.classification === 'SUPPORTED').length,
      verified: false,
      contradicted: false,
    });
    return {
      events: chainEvents,
      links: chainLinks,
      rootCause: `${seed.source}:${seed.type} (seq ${seed.sequence})`,
      confidence: assessment.confidence,
      classification: assessment.classification as CausalClassification,
      alternatives: chainLinks.flatMap((l) => l.alternatives).filter((v, i, arr) => arr.indexOf(v) === i),
      evidenceRefs: chainLinks.flatMap((l) => l.evidence),
    };
  }

  /**
   * Find the earliest causal divergence between two event streams
   * (reality vs branch) — the "breakpoint" where outcomes split.
   */
  earliestDivergence(reality: EventEnvelope[], branch: EventEnvelope[]): EventEnvelope | null {
    const branchSeqs = new Set(branch.map((e) => e.sequence));
    const ordered = [...reality].sort((a, b) => a.logicalTime - b.logicalTime);
    for (const ev of ordered) {
      if (!branchSeqs.has(ev.sequence)) return ev;
    }
    return null;
  }
}
