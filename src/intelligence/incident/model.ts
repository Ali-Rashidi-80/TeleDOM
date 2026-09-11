/**
 * TeleDOM v4 Incident — First-class Incident Object + lifecycle.
 *
 * An Incident captures the whole story of a bug: identity, objective,
 * scope, reproduction, timeline, state frames, evidence, causal graph,
 * hypotheses, counterfactuals, remediation, verification, proof,
 * artifacts, audit trail. Lifecycle is explicit and auditable.
 */

import { computeHash } from '../kernel/integrity';
import type { EventEnvelope } from '../kernel/events';
import type { EvidenceGraph } from '../evidence/graph';
import type { CausalChain, Hypothesis } from '../causality/engine';
import type { CounterfactualOutcome } from '../simulation/counterfactual';
import type { VerificationReport } from '../verification/proof';
import type { ProofRecord } from '../verification/proof';

export type IncidentState =
  | 'CREATED' | 'SCOPED' | 'OBSERVING' | 'REPRODUCED' | 'ANALYZING'
  | 'HYPOTHESIS_FORMED' | 'VERIFYING' | 'REMEDIATING' | 'RETESTING'
  | 'RESOLVED' | 'INCONCLUSIVE' | 'FAILED' | 'ABANDONED';

export const INCIDENT_LIFECYCLE: IncidentState[] = [
  'CREATED', 'SCOPED', 'OBSERVING', 'REPRODUCED', 'ANALYZING',
  'HYPOTHESIS_FORMED', 'VERIFYING', 'REMEDIATING', 'RETESTING', 'RESOLVED',
];

export interface IncidentScope {
  pageUrl?: string;
  entityIds: string[];
  selectors: string[];
  timeWindow?: { fromLogical: number; toLogical: number };
  reproduction?: {
    steps: string[];
    controlledState?: Record<string, unknown>;
    deterministic?: boolean;
  };
}

export interface IncidentAuditEntry {
  at: number;
  from: IncidentState;
  to: IncidentState;
  note: string;
  evidenceRefs?: string[];
}

export interface Incident {
  incidentId: string;
  createdAt: number;
  objective: string;
  state: IncidentState;
  scope: IncidentScope;
  timeline: EventEnvelope[];
  evidenceGraph: EvidenceGraph | null;
  causalChain: CausalChain | null;
  hypotheses: Hypothesis[];
  counterfactuals: CounterfactualOutcome[];
  remediation: { plan: string; appliedMutation?: string; risk?: string } | null;
  verification: VerificationReport | null;
  proof: ProofRecord | null;
  artifacts: string[];
  audit: IncidentAuditEntry[];
  /** Learning retained for future investigations (agent memory). */
  lessons: string[];
}

const VALID_TRANSITIONS: Record<IncidentState, IncidentState[]> = {
  CREATED: ['SCOPED', 'ABANDONED'],
  SCOPED: ['OBSERVING', 'ABANDONED'],
  OBSERVING: ['REPRODUCED', 'ANALYZING', 'INCONCLUSIVE', 'ABANDONED'],
  REPRODUCED: ['ANALYZING', 'INCONCLUSIVE', 'RESOLVED'],
  ANALYZING: ['HYPOTHESIS_FORMED', 'INCONCLUSIVE', 'FAILED'],
  HYPOTHESIS_FORMED: ['VERIFYING', 'INCONCLUSIVE', 'ABANDONED'],
  VERIFYING: ['REMEDIATING', 'REPRODUCED', 'INCONCLUSIVE', 'ABANDONED', 'ANALYZING'],
  REMEDIATING: ['RETESTING', 'FAILED'],
  RETESTING: ['RESOLVED', 'INCONCLUSIVE', 'FAILED', 'REMEDIATING'],
  RESOLVED: [],
  INCONCLUSIVE: ['ANALYZING', 'ABANDONED'],
  FAILED: ['ANALYZING', 'ABANDONED'],
  ABANDONED: [],
};

export class IncidentManager {
  private incidents = new Map<string, Incident>();
  private seq = 0;

  create(objective: string, scope: Partial<IncidentScope> = {}): Incident {
    this.seq += 1;
    const incidentId = `incident:${this.seq}:${computeHash({ objective, at: Date.now() }).slice(0, 8)}`;
    const incident: Incident = {
      incidentId,
      createdAt: Date.now(),
      objective,
      state: 'CREATED',
      scope: { entityIds: scope.entityIds ?? [], selectors: scope.selectors ?? [], pageUrl: scope.pageUrl, timeWindow: scope.timeWindow, reproduction: scope.reproduction },
      timeline: [],
      evidenceGraph: null,
      causalChain: null,
      hypotheses: [],
      counterfactuals: [],
      remediation: null,
      verification: null,
      proof: null,
      artifacts: [],
      audit: [],
      lessons: [],
    };
    this.incidents.set(incidentId, incident);
    return incident;
  }

  /** Enforce explicit, valid lifecycle transitions with audit trail. */
  transition(incidentId: string, to: IncidentState, note: string, evidenceRefs?: string[]): IncidentAuditEntry {
    const incident = this.incidents.get(incidentId);
    if (!incident) throw new Error(`unknown incident ${incidentId}`);
    const allowed = VALID_TRANSITIONS[incident.state];
    if (!allowed.includes(to)) {
      throw new Error(`invalid lifecycle transition ${incident.state} → ${to} (allowed: ${allowed.join(', ') || 'terminal'})`);
    }
    const entry: IncidentAuditEntry = { at: Date.now(), from: incident.state, to, note, evidenceRefs };
    incident.state = to;
    incident.audit.push(entry);
    return entry;
  }

  attachTimeline(incidentId: string, events: EventEnvelope[]): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.timeline = events;
  }

  attachEvidence(incidentId: string, graph: EvidenceGraph): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.evidenceGraph = graph;
  }

  attachCausalChain(incidentId: string, chain: CausalChain): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.causalChain = chain;
  }

  attachHypotheses(incidentId: string, hypotheses: Hypothesis[]): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.hypotheses = hypotheses;
  }

  attachCounterfactual(incidentId: string, outcome: CounterfactualOutcome): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.counterfactuals.push(outcome);
  }

  attachRemediation(incidentId: string, remediation: Incident['remediation']): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.remediation = remediation;
  }

  attachVerification(incidentId: string, report: VerificationReport): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.verification = report;
  }

  attachProof(incidentId: string, proof: ProofRecord): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.proof = proof;
  }

  recordLesson(incidentId: string, lesson: string): void {
    const incident = this.incidents.get(incidentId);
    if (incident) incident.lessons.push(lesson);
  }

  get(incidentId: string): Incident | undefined {
    return this.incidents.get(incidentId);
  }

  list(): Incident[] {
    return [...this.incidents.values()];
  }
}
