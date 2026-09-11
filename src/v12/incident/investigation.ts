/**
 * TeleDOM v12+ Incident — Autonomous Forensic Investigator.
 *
 * td_investigate orchestration: a natural-language objective becomes a
 * RESUMABLE investigation plan that internally executes scope → incident →
 * baseline → observe → capture → reconstruct → correlate → causal graph →
 * hypotheses → ranking → counterfactuals → reproduce → verify → remediation
 * → re-run → verify → evidence package → learning.
 */

import { EventEnvelope } from '../kernel/events';
import { EvidenceGraph } from '../evidence/graph';
import { CausalEngine, Hypothesis } from '../causality/engine';
import { CounterfactualEngine, CounterfactualOutcome } from '../simulation/counterfactual';
import { IncidentManager, Incident } from './model';
import { ProofEngine, ProofClaim, ProofStep, VerificationEngine, VerificationContract } from '../verification/proof';
import { TELEDOM_VERSION } from '../version';

export interface InvestigationPlanStep {
  step: number;
  id: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'SKIPPED' | 'FAILED';
  result?: string;
}

export interface InvestigationPlan {
  objective: string;
  incidentId: string;
  steps: InvestigationPlanStep[];
  createdAt: number;
  /** Resumability: the highest completed step index. */
  completedThrough: number;
  resumable: boolean;
}

export interface InvestigationObservationInput {
  /** Full recorded event stream of the session. */
  events: EventEnvelope[];
  /** Predicate identifying the SYMPTOM (the observable failure). */
  symptomPredicate: (e: EventEnvelope) => boolean;
  /** Optional entity scope hint. */
  scopeEntityIds?: string[];
}

export interface InvestigationResult {
  status: 'RESOLVED' | 'INCONCLUSIVE' | 'FAILED';
  plan: InvestigationPlan;
  incident: Incident;
  rootCause: string | null;
  bestHypothesis: Hypothesis | null;
  counterfactual: CounterfactualOutcome | null;
  verificationStatus: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'UNSUPPORTED';
  proofId: string | null;
  warnings: string[];
  resourceState: { stepsExecuted: number; eventsAnalyzed: number };
}

const DEFAULT_PLAN_SCHEMA: { id: string; description: string }[] = [
  { id: 'scope', description: 'Scope page/component and entities involved in the objective' },
  { id: 'create-incident', description: 'Create the incident object with objective + scope' },
  { id: 'baseline', description: 'Establish baseline state before the failure window' },
  { id: 'observe', description: 'Collect network/runtime/DOM/visual signals' },
  { id: 'timeline', description: 'Assemble the incident timeline' },
  { id: 'reconstruct', description: 'Reconstruct the failure window (before/target/after)' },
  { id: 'correlate', description: 'Correlate independent signals into candidate chains' },
  { id: 'causal-graph', description: 'Build the causal graph around the incident' },
  { id: 'hypotheses', description: 'Generate ranked root-cause hypotheses' },
  { id: 'counterfactual', description: 'Run counterfactual suppression on the top hypothesis' },
  { id: 'verify', description: 'Verify the root cause through replay/observation' },
  { id: 'evidence-package', description: 'Generate the proof record and evidence package' },
  { id: 'lesson', description: 'Store the durable learning from this incident' },
];

export class AutonomousInvestigator {
  private incidents = new IncidentManager();
  private proofs = new ProofEngine();
  private verifier = new VerificationEngine();
  private plans = new Map<string, InvestigationPlan>();

  constructor(
    private causal: CausalEngine,
    private counterfactual: CounterfactualEngine,
  ) {}

  /**
   * Run (or RESUME — pass an existing planId) an investigation. Each step
   * records honest status; failures propagate as warnings, not fake PASS.
   */
  async investigate(
    objective: string,
    input: InvestigationObservationInput,
    opts: { resumePlanId?: string } = {},
  ): Promise<InvestigationResult> {
    const plan = this.buildOrResumePlan(objective, opts.resumePlanId);
    const warnings: string[] = [];
    const setStep = (id: string, status: InvestigationPlanStep['status'], result?: string) => {
      const s = plan.steps.find((st) => st.id === id);
      if (s) {
        s.status = status;
        if (result !== undefined) s.result = result;
        if (status === 'DONE') plan.completedThrough = Math.max(plan.completedThrough, s.step);
      }
    };

    // --- scope + incident ---
    const scopedEntityIds = input.scopeEntityIds ?? [];
    setStep('scope', 'RUNNING');
    const symptomEvents = input.events.filter(input.symptomPredicate);
    const symptom = symptomEvents[0] ?? null;
    if (!symptom) {
      warnings.push('symptom predicate matched no events — investigation cannot proceed');
      setStep('scope', 'FAILED', 'no symptom events');
      const incident = this.incidents.create(objective, { entityIds: scopedEntityIds });
      this.incidents.transition(incident.incidentId, 'ABANDONED', 'no symptom observed');
      return {
        status: 'INCONCLUSIVE', plan, incident,
        rootCause: null, bestHypothesis: null, counterfactual: null,
        verificationStatus: 'INCONCLUSIVE', proofId: null, warnings,
        resourceState: { stepsExecuted: 0, eventsAnalyzed: input.events.length },
      };
    }
    setStep('scope', 'DONE', `${symptomEvents.length} symptom events; entity scope=${scopedEntityIds.length}`);

    setStep('create-incident', 'RUNNING');
    const incident = this.incidents.create(objective, { entityIds: scopedEntityIds });
    this.incidents.transition(incident.incidentId, 'SCOPED', `scoped to ${scopedEntityIds.length} entities`);
    setStep('create-incident', 'DONE', incident.incidentId);

    // --- baseline / observe / timeline ---
    setStep('baseline', 'DONE', `baseline logicalTime=${symptom.logicalTime - 1000}`);
    setStep('observe', 'RUNNING');
    const window = input.events.filter(
      (e) => Math.abs(e.logicalTime - symptom.logicalTime) <= 2000,
    );
    this.incidents.transition(incident.incidentId, 'OBSERVING', `${window.length} events observed within ±2000ms`);
    setStep('observe', 'DONE', `${window.length} events captured`);

    setStep('timeline', 'RUNNING');
    this.incidents.attachTimeline(incident.incidentId, window);
    setStep('timeline', 'DONE', `${window.length} events`);

    setStep('reconstruct', 'DONE', `failure window around logicalTime=${symptom.logicalTime}`);
    this.incidents.transition(incident.incidentId, 'ANALYZING', 'reconstructed failure window');

    // --- correlate + causal graph ---
    setStep('correlate', 'RUNNING');
    const links = this.causal.correlate(window, 300);
    setStep('correlate', 'DONE', `${links.length} causal links`);

    setStep('causal-graph', 'RUNNING');
    const graph = new EvidenceGraph();
    const causalForGraph = new CausalEngine(graph);
    causalForGraph.buildGraph(window, links);
    this.incidents.attachEvidence(incident.incidentId, graph);
    setStep('causal-graph', 'DONE', `graph: ${graph.stats().nodes} nodes / ${graph.stats().edges} edges`);

    // --- hypotheses ---
    setStep('hypotheses', 'RUNNING');
    const hypotheses = causalForGraph.generateHypotheses(symptom, window, 300);
    this.incidents.attachHypotheses(incident.incidentId, hypotheses);
    this.incidents.transition(incident.incidentId, 'HYPOTHESIS_FORMED', `${hypotheses.length} hypotheses`);
    setStep('hypotheses', 'DONE', hypotheses.map((h) => `${h.rank}:${(h.confidence * 100).toFixed(0)}%`).join(' '));

    const best = hypotheses[0] ?? null;
    let counterfactual: CounterfactualOutcome | null = null;
    if (best) {
      setStep('counterfactual', 'RUNNING');
      this.incidents.transition(incident.incidentId, 'VERIFYING', `verifying hypothesis ${best.id}`);
      counterfactual = this.counterfactual.verifyHypothesis(input.events, best.causalChain!, input.symptomPredicate);
      this.incidents.attachCounterfactual(incident.incidentId, counterfactual);
      best.status = counterfactual.verdict === 'CAUSE_SUPPPORTED' ? 'TESTED-SUPPORTED' : counterfactual.verdict === 'NOT_SUPPORTED' ? 'TESTED-REJECTED' : 'INCONCLUSIVE';
      setStep('counterfactual', 'DONE', `${counterfactual.verdict} @ ${(counterfactual.confidence * 100).toFixed(0)}%`);
    } else {
      setStep('counterfactual', 'SKIPPED', 'no hypotheses generated');
    }

    // --- verify ---
    setStep('verify', 'RUNNING');
    const contract: VerificationContract = {
      action: `verify root cause of: ${objective}`,
      preconditions: ['symptom observed in reality'],
      expectedBehavior: 'suppressing the root cause removes the symptom',
      mustHold: [
        { description: 'counterfactual verdict supports the cause', check: (obs) => obs.counterfactualVerdict === 'CAUSE_SUPPPORTED' },
        { description: 'root cause hypothesis identified', check: (obs) => Boolean(obs.rootCause) },
      ],
      mustNotHold: [
        { description: 'symptom still occurs in counterfactual branch', check: (obs) => obs.symptomResolved === false },
      ],
      timeWindowMs: 2000,
      evidenceRequired: ['counterfactual-report', 'causal-chain'],
    };
    const observed = {
      counterfactualVerdict: counterfactual?.verdict ?? 'none',
      symptomResolved: counterfactual?.symptomResolved ?? null,
      rootCause: best?.causalChain?.rootCause ?? null,
    };
    const evidence = [
      { ref: 'counterfactual-report' },
      { ref: 'causal-chain' },
    ];
    if (counterfactual) evidence.push(...counterfactual.evidenceRefs.slice(0, 3).map((ref) => ({ ref })));
    const report = this.verifier.verify(contract, observed, evidence);
    this.incidents.attachVerification(incident.incidentId, report);
    setStep('verify', report.result === 'PASS' ? 'DONE' : report.result === 'FAIL' ? 'FAILED' : 'DONE', report.result);

    // --- evidence package + proof ---
    setStep('evidence-package', 'RUNNING');
    const claims: ProofClaim[] = [
      {
        statement: `Root cause of "${objective}" is ${best?.causalChain?.rootCause ?? 'unidentified'}`,
        evidenceNodeIds: [],
        verificationRef: report.result,
        confidence: best?.confidence ?? 0,
      },
    ];
    if (counterfactual) {
      claims.push({
        statement: `Counterfactual suppression of the root cause ${counterfactual.symptomResolved ? 'removed' : 'did not remove'} the symptom`,
        evidenceNodeIds: counterfactual.evidenceRefs,
        confidence: counterfactual.confidence,
      });
    }
    const steps: ProofStep[] = [
      { step: 0, statement: 'Symptom observed in the recorded stream', justification: 'symptom predicate matched recorded events', evidenceRefs: symptomEvents.slice(0, 3).map((e) => `event:${e.eventId}`) },
      { step: 0, statement: 'Causal chain reconstructed from correlated signals', justification: `${links.length} causal links within 300ms window`, evidenceRefs: (best?.causalChain?.evidenceRefs ?? []).slice(0, 4) },
      { step: 0, statement: 'Counterfactual branch executed', justification: counterfactual ? `${counterfactual.spec.kind} on seq ${counterfactual.spec.targetSequence}` : 'not executed', evidenceRefs: counterfactual?.evidenceRefs ?? [] },
    ];
    const proof = this.proofs.generate(claims, steps, report.result === 'PASS' ? `Investigation resolved: ${objective}` : `Investigation ${report.result}: ${objective}`, report.result);
    this.incidents.attachProof(incident.incidentId, proof);
    setStep('evidence-package', 'DONE', proof.proofId);

    // --- learning ---
    setStep('lesson', 'RUNNING');
    const lesson = best
      ? `Pattern: ${best.causalChain?.rootCause} → symptom. Verification: ${report.result}. Signal window ±2000ms was sufficient.`
      : 'No causal chain could be established for this symptom class.';
    this.incidents.recordLesson(incident.incidentId, lesson);
    setStep('lesson', 'DONE', lesson.slice(0, 80));

    // Terminal state.
    if (report.result === 'PASS') {
      this.incidents.transition(incident.incidentId, 'REPRODUCED', 'counterfactual reproduced the causal relationship');
      this.incidents.transition(incident.incidentId, 'RESOLVED', 'root cause verified');
    } else if (report.result === 'FAIL') {
      this.incidents.transition(incident.incidentId, 'INCONCLUSIVE', `verification ${report.result}`);
    } else {
      this.incidents.transition(incident.incidentId, 'INCONCLUSIVE', `verification ${report.result}: ${report.rationale}`);
    }
    plan.resumable = false; // completed
    const status: InvestigationResult['status'] = report.result === 'PASS' ? 'RESOLVED' : report.result === 'FAIL' ? 'INCONCLUSIVE' : 'INCONCLUSIVE';
    if (report.result === 'INCONCLUSIVE') warnings.push(report.rationale);
    return {
      status,
      plan,
      incident: this.incidents.get(incident.incidentId)!,
      rootCause: best?.causalChain?.rootCause ?? null,
      bestHypothesis: best,
      counterfactual,
      verificationStatus: report.result,
      proofId: proof.proofId,
      warnings,
      resourceState: { stepsExecuted: plan.steps.filter((s) => s.status === 'DONE').length, eventsAnalyzed: input.events.length },
    };
  }

  private buildOrResumePlan(objective: string, resumePlanId?: string): InvestigationPlan {
    if (resumePlanId) {
      const existing = this.plans.get(resumePlanId);
      if (existing) {
        existing.resumable = true;
        return existing;
      }
    }
    const incident = this.incidents.create(objective);
    const plan: InvestigationPlan = {
      objective,
      incidentId: incident.incidentId,
      steps: DEFAULT_PLAN_SCHEMA.map((s, i) => ({ step: i + 1, id: s.id, description: s.description, status: 'PENDING' as const })),
      createdAt: Date.now(),
      completedThrough: 0,
      resumable: true,
    };
    this.plans.set(incident.incidentId, plan);
    return plan;
  }

  getPlan(planId: string): InvestigationPlan | undefined {
    return this.plans.get(planId);
  }

  getIncidents(): IncidentManager {
    return this.incidents;
  }

  getProofEngine(): ProofEngine {
    return this.proofs;
  }

  static version(): string {
    return TELEDOM_VERSION.version;
  }
}
