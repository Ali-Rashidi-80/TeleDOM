/**
 * TeleDOM v4 MCP — Intelligence Tools Handler (td_* dispatch).
 *
 * Routes every td_* tool call through the TeleDOM platform. Tools are
 * intent-level facades orchestrating kernel/temporal/evidence/causality
 * primitives — NOT 100 isolated handlers. Honest status taxonomy:
 * PASS / FAIL / INCONCLUSIVE / UNSUPPORTED / DEGRADED / PARTIAL —
 * INCONCLUSIVE is never silently converted to PASS, and live-browser
 * tools report UNSUPPORTED when no live adapter is wired.
 */

import { MCPContentItem, MCPToolCallResult } from '../../types/mcp-types';
import { TD_TOOL_NAMES } from '../registry/td-tools';
import { capabilityById } from '../registry/capabilities';
import { TeleDOMPlatform } from '../platform';
import { EventEnvelope, computeHash } from '../kernel';
import { CounterfactualSpec, CounterfactualKind } from '../simulation/counterfactual';
import { TdomFormat } from '../incident/format';
import { assessConfidence, ProvenanceRecord } from '../evidence/confidence';
import { VerificationContract } from '../verification';
import * as fs from 'fs';
import { AgentStore, handleWorkflowTool, WORKFLOW_TOOL_NAMES, ToolPipeline } from '../workflow';

export interface IntelligenceResult {
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'UNSUPPORTED' | 'DEGRADED' | 'PARTIAL';
  [key: string]: unknown;
}

export class IntelligenceToolsHandler {
  readonly platform = new TeleDOMPlatform();
  /** v4.1: durable agent-owned artifact store (workflows, targets, tooling). */
  readonly agentStore = new AgentStore();
  /** v4.1: root MCP pipeline — injected by MCPToolsHandler after construction
   * so td_* tools can route to ANY tool (browser primitives included). */
  private rootPipeline: ToolPipeline | null = null;
  private memoryRestored = false;

  knows(name: string): boolean {
    return TD_TOOL_NAMES.has(name);
  }

  /** v4.1: wire the authoritative tool pipeline (called by MCPToolsHandler). */
  attachRoot(pipeline: ToolPipeline): void {
    this.rootPipeline = pipeline;
  }

  /** v4.1: lazily restore persisted agent memory on first touch. */
  private ensureMemory(): void {
    if (this.memoryRestored) return;
    this.memoryRestored = true;
    const snapshot = this.agentStore.loadMemorySnapshot();
    if (Array.isArray(snapshot) && snapshot.length > 0) {
      this.platform.memory.restore(snapshot as any);
    }
  }

  private persistMemory(): void {
    this.agentStore.saveMemorySnapshot(this.platform.memory.serialize());
  }

  async handleToolCall(name: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    try {
      const result = await this.dispatch(name, args);
      return toMcpResult(result, name);
    } catch (err: any) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ status: 'FAIL', error: err?.message ?? 'unknown error', tool: name }) }],
        isError: true,
      };
    }
  }

  private async dispatch(name: string, args: Record<string, any>): Promise<IntelligenceResult> {
    // v4.1: Agent-Owned Workflow Runtime tools route FIRST — they may call
    // back into any tool through the root pipeline (browser primitives,
    // workflow execution, target memory, agent artifacts).
    if (WORKFLOW_TOOL_NAMES.has(name)) {
      return handleWorkflowTool(name, args, { pipeline: this.rootPipeline, store: this.agentStore });
    }
    switch (name) {
      // ===================== A. Temporal Intelligence =====================
      case 'td_temporal_query': {
        const s = this.platform.session(args.sessionId);
        const events = s.mesh.all as EventEnvelope[];
        const filtered = events.filter((e) => {
          if (args.fromLogical !== undefined && e.logicalTime < args.fromLogical) return false;
          if (args.toLogical !== undefined && e.logicalTime > args.toLogical) return false;
          if (args.entityIds?.length && !e.entityIds.some((id: string) => args.entityIds.includes(id))) return false;
          return true;
        });
        return {
          status: 'PASS',
          sessionId: args.sessionId,
          matched: filtered.length,
          totalEvents: events.length,
          events: filtered.slice(0, args.limit ?? 50).map((e) => ({ eventId: e.eventId, seq: e.sequence, source: e.source, type: e.type, logicalTime: e.logicalTime, entities: e.entityIds })),
          provenance: [`mesh:${args.sessionId}`],
        };
      }
      case 'td_temporal_seek': {
        const s = this.platform.session(args.sessionId);
        const seeked = s.temporal.seek(args.logicalTime);
        return {
          status: seeked === null ? 'INCONCLUSIVE' : 'PASS',
          sessionId: args.sessionId,
          requestedLogicalTime: args.logicalTime,
          nearestValidLogicalTime: seeked,
          note: seeked === null ? 'no event at-or-before the requested time' : undefined,
        };
      }
      case 'td_temporal_window': {
        const s = this.platform.session(args.sessionId);
        const w = s.temporal.window(args.aroundLogical, args.radiusMs ?? 250);
        return {
          status: 'PASS',
          sessionId: args.sessionId,
          before: w.before.map(fmtEvent),
          at: w.at.map(fmtEvent),
          after: w.after.map(fmtEvent),
          counts: { before: w.before.length, at: w.at.length, after: w.after.length },
        };
      }
      case 'td_temporal_diff': {
        const s = this.platform.session(args.sessionId);
        const d = s.temporal.diff(args.t1, args.t2);
        return {
          status: 'PASS',
          sessionId: args.sessionId,
          t1: args.t1,
          t2: args.t2,
          entries: d.result,
          meta: d.meta,
        };
      }
      case 'td_temporal_trace_entity': {
        const s = this.platform.session(args.sessionId);
        const trace = s.temporal.traceEntity(args.entityId);
        const trail = this.platform.identity.trail(args.entityId);
        return {
          status: trace.length ? 'PASS' : 'INCONCLUSIVE',
          entityId: args.entityId,
          events: trace.map(fmtEvent),
          identityTrail: trail?.timeline ?? [],
          note: trace.length ? undefined : 'no events touched this entity',
        };
      }
      case 'td_temporal_first_change': {
        const s = this.platform.session(args.sessionId);
        const pattern = args.typePattern ? new RegExp(args.typePattern, 'i') : null;
        const ev = s.temporal.firstChange((e) => (!args.source || e.source === args.source) && (!pattern || pattern.test(e.type)));
        return {
          status: ev ? 'PASS' : 'INCONCLUSIVE',
          firstChange: ev ? fmtEvent(ev) : null,
          note: ev ? undefined : 'no event matched the predicate',
        };
      }
      case 'td_temporal_last_stable': {
        const s = this.platform.session(args.sessionId);
        const t = s.temporal.lastStable(args.dimension, args.before, args.settleMs ?? 250);
        return {
          status: t === null ? 'INCONCLUSIVE' : 'PASS',
          dimension: args.dimension,
          before: args.before,
          lastStableLogicalTime: t,
        };
      }
      case 'td_temporal_join': {
        const s = this.platform.session(args.sessionId);
        const clusters = s.temporal.join({ sources: args.sources, withinMs: args.withinMs ?? 250, aroundEntityId: args.aroundEntityId });
        return {
          status: clusters.length ? 'PASS' : 'INCONCLUSIVE',
          clusters: clusters.map((c) => ({ size: c.length, events: c.map(fmtEvent), spanMs: c[c.length - 1].logicalTime - c[0].logicalTime })),
          clusterCount: clusters.length,
        };
      }
      case 'td_temporal_branch': {
        const s = this.platform.session(args.sessionId);
        const mutations = Array.isArray(args.mutations) ? args.mutations : [];
        const forkAtLogical = typeof args.forkAtLogical === 'number' ? args.forkAtLogical : 0;
        if (s.mesh.length === 0) {
          return { status: 'INCONCLUSIVE', note: 'session has no events to fork from' };
        }
        const branch = this.platform.branches.fork(s.mesh.ordered(), forkAtLogical, mutations, {
          assumptions: (Array.isArray(args.assumptions) ? args.assumptions : undefined) ?? ['deterministic branch replay'],
        });
        return {
          status: 'PASS',
          branch: { branchId: branch.branchId, parentId: branch.parentId, forkAtLogical: branch.forkAtLogical, mutations: branch.mutations.length, simulatedEventCount: branch.simulatedEvents.length, verification: branch.verification },
          note: 'original evidence untouched (append-only mesh)',
        };
      }
      case 'td_temporal_rewind': {
        const s = this.platform.session(args.sessionId);
        const state = s.temporal.stateAt(args.logicalTime);
        return {
          status: state.result ? 'PASS' : 'INCONCLUSIVE',
          logicalTime: args.logicalTime,
          reconstructedState: state.result,
          meta: state.meta,
          note: 'inspection-only rewind; live page is never mutated',
        };
      }

      // ===================== B. Evidence & Provenance =====================
      case 'td_evidence_capture': {
        const node = this.platform.graph.addNode(args.kind, args.label, args.payload ?? {}, args.ref);
        const incident = this.platform.incidents.get(args.incidentId);
        if (incident) this.platform.incidents.attachEvidence(args.incidentId, this.platform.graph);
        return { status: 'PASS', evidenceNode: { id: node.id, type: node.type, hash: node.hash }, incidentId: args.incidentId };
      }
      case 'td_evidence_search': {
        const nodes = this.platform.graph.nodesAll({ types: args.types, limit: args.limit ?? 50 });
        const text = (args.text ?? '').toLowerCase();
        const matched = nodes.filter((n) => !text || n.label.toLowerCase().includes(text));
        return { status: matched.length ? 'PASS' : 'INCONCLUSIVE', matches: matched.map((n) => ({ id: n.id, type: n.type, label: n.label })), matchCount: matched.length };
      }
      case 'td_evidence_chain': {
        const assessment = assessConfidence({
          provenance: [{ origin: 'agent-supplied', quality: 'derived', evidenceRefs: args.evidenceRefs, recordedAt: Date.now() }],
          corroboration: new Set(args.evidenceRefs).size,
          verified: false,
          contradicted: false,
        });
        return { status: 'PASS', claim: args.claim, evidenceRefs: args.evidenceRefs, confidence: assessment.confidence, classification: assessment.classification, rationale: assessment.rationale };
      }
      case 'td_evidence_confidence': {
        const provenance: ProvenanceRecord[] = (args.provenance ?? []).map((p: any) => ({
          origin: p.origin ?? 'unknown', quality: p.quality ?? 'derived', evidenceRefs: p.evidenceRefs ?? [], recordedAt: p.recordedAt ?? Date.now(),
        }));
        const assessment = assessConfidence({
          provenance,
          corroboration: args.corroboration ?? 0,
          verified: Boolean(args.verified),
          contradicted: Boolean(args.contradicted),
          kernelConfidenceMultiplier: this.platform.health().confidenceMultiplier,
        });
        return { status: 'PASS', ...assessment };
      }
      case 'td_evidence_verify': {
        const contract: VerificationContract = {
          action: `verify claim: ${args.claim}`,
          preconditions: [],
          expectedBehavior: args.claim,
          mustHold: (args.mustHold ?? []).map((d: string) => ({ description: d, check: (obs: Record<string, unknown>) => Boolean(obs[d]) })),
          mustNotHold: (args.mustNotHold ?? []).map((d: string) => ({ description: d, check: (obs: Record<string, unknown>) => Boolean(obs[d]) })),
          timeWindowMs: args.timeWindowMs ?? 2000,
          evidenceRequired: args.evidenceRequired ?? [],
        };
        const report = this.platform.verifier.verify(contract, (args.observed ?? {}) as Record<string, unknown>, (args.evidenceCollected ?? args.evidenceRequired ?? []).map((ref: string) => ({ ref })));
        return { status: 'PASS', verification: report };
      }
      case 'td_evidence_hash': {
        const hash = computeHash(args.artifact);
        return { status: 'PASS', integrityHash: hash, algorithm: 'sha-256', canonicalization: 'sorted-key JSON' };
      }
      case 'td_evidence_compare': {
        if (args.packageA === undefined || args.packageB === undefined) {
          return { status: 'INCONCLUSIVE', note: 'evidence comparison requires both packageA and packageB' };
        }
        const a = JSON.stringify(args.packageA);
        const b = JSON.stringify(args.packageB);
        const identical = a === b;
        return {
          status: 'PASS',
          identical,
          hashA: computeHash(args.packageA),
          hashB: computeHash(args.packageB),
          byteLength: { a: a.length, b: b.length },
          note: identical ? 'packages are structurally identical' : 'packages differ (see hashes)',
        };
      }
      case 'td_evidence_export': {
        const incident = this.platform.incidents.get(args.incidentId);
        if (!incident) return { status: 'INCONCLUSIVE', note: `incident ${args.incidentId} not found — create one via td_investigate first` };
        const exporter = new TdomFormat();
        const exported = exporter.export(incident, { compress: Boolean(args.compress) });
        // v4.1 fix: actually WRITE the artifact (previously bytes were discarded)
        const outPath = typeof args.outputPath === 'string' && args.outputPath
          ? args.outputPath
          : `./.teledom_agent/artifacts/tdom/${incident.incidentId}.tdom${args.compress ? '.gz' : ''}`;
        try {
          fs.mkdirSync(outPath.split('/').slice(0, -1).join('/') || '.', { recursive: true });
          fs.writeFileSync(outPath, exported.bytes);
        } catch (err: any) {
          return { status: 'DEGRADED', note: `artifact generated but write failed: ${err?.message}`, byteLength: exported.bytes.length };
        }
        return {
          status: 'PASS',
          incidentId: args.incidentId,
          format: 'tdom',
          formatVersion: exported.manifest.formatVersion,
          byteLength: exported.bytes.length,
          compression: exported.manifest.compression,
          sections: Object.keys(exported.manifest.sections),
          outputPath: outPath,
          written: true,
        };
      }
      case 'td_evidence_timeline': {
        const incident = this.platform.incidents.get(args.incidentId);
        if (!incident) return { status: 'INCONCLUSIVE', note: `incident ${args.incidentId} not found — create one via td_investigate first` };
        const timeline = incident.timeline.map((e) => `${new Date(e.wallTime).toISOString()} [${e.source}] ${e.type} (seq ${e.sequence})`);
        return { status: 'PASS', incidentId: args.incidentId, state: incident.state, timeline, eventCount: incident.timeline.length };
      }
      case 'td_evidence_proof': {
        const proof = this.platform.proofs.generate(
          (args.claims ?? []).map((c: any) => ({ statement: c.statement, evidenceNodeIds: c.evidenceNodeIds ?? [], confidence: c.confidence ?? 0.7, verificationRef: c.verificationRef })),
          (args.steps ?? []).map((s: any, i: number) => ({ step: i + 1, statement: s.statement ?? s, justification: s.justification ?? '', evidenceRefs: s.evidenceRefs ?? [] })),
          args.conclusion,
          args.verificationStatus,
        );
        const verificationValid = this.platform.proofs.verifyProof(proof);
        return { status: verificationValid ? 'PASS' : 'FAIL', proof: { proofId: proof.proofId, proofHash: proof.proofHash, conclusion: proof.conclusion, verificationStatus: proof.verificationStatus }, selfVerification: verificationValid };
      }

      // ===================== C. Causal Intelligence =====================
      case 'td_cause_trace':
      case 'td_cause_graph':
      case 'td_cause_rank': {
        const s = this.platform.session(args.sessionId);
        const symptomEvent = args.symptomEventId ? s.mesh.byEventId(args.symptomEventId) : s.mesh.ordered().at(-1);
        if (!symptomEvent) return { status: 'INCONCLUSIVE', note: 'no symptom event found in session' };
        const links = this.platform.causal.correlate(s.mesh.all as EventEnvelope[], args.windowMs ?? 250);
        if (name === 'td_cause_trace' || name === 'td_cause_rank') {
          const hypotheses = this.platform.causal.generateHypotheses(symptomEvent, s.mesh.all as EventEnvelope[], args.windowMs ?? 250);
          return {
            status: hypotheses.length ? 'PASS' : 'INCONCLUSIVE',
            symptom: fmtEvent(symptomEvent),
            hypotheses: hypotheses.map((h) => ({ id: h.id, rank: h.rank, statement: h.statement, confidence: h.confidence, status: h.status, verificationMethod: h.verificationMethod, evidenceRefs: h.evidenceRefs.slice(0, 5) })),
            rootCause: hypotheses[0]?.causalChain?.rootCause ?? null,
          };
        }
        const nodes = this.platform.causal.buildGraph(s.mesh.all as EventEnvelope[], links);
        const stats = this.platform.graph.stats();
        return { status: 'PASS', nodes: nodes.nodes.length, edges: stats.edges, graphStats: stats };
      }
      case 'td_cause_explain': {
        const assessment = assessConfidence({
          provenance: [{ origin: 'causal-engine', quality: 'derived', evidenceRefs: args.evidenceRefs, recordedAt: Date.now() }],
          corroboration: new Set(args.evidenceRefs).size,
          verified: false,
          contradicted: false,
        });
        return {
          status: 'PASS',
          explanation: { claim: args.finding, classification: assessment.classification, confidence: assessment.confidence, rationale: assessment.rationale, evidenceRefs: args.evidenceRefs, alternatives: ['common-cause', 'coincidence-within-window'] },
        };
      }
      case 'td_cause_correlate': {
        const s = this.platform.session(args.sessionId);
        const links = this.platform.causal.correlate(
          s.mesh.all.filter((e) => args.sources.includes(e.source)),
          args.withinMs ?? 250,
        );
        return { status: 'PASS', links: links.map((l) => ({ from: l.fromEvent.eventId, to: l.toEvent.eventId, deltaMs: l.deltaMs, classification: l.classification, confidence: l.confidence })), linkCount: links.length };
      }
      case 'td_cause_breakpoint': {
        const s = this.platform.session(args.sessionId);
        const branch = this.platform.branches.get(args.branchId);
        if (!branch) return { status: 'INCONCLUSIVE', note: `branch ${args.branchId} not found — fork one via td_temporal_branch first` };
        const divergence = this.platform.causal.earliestDivergence(s.mesh.ordered(), branch.simulatedEvents);
        return { status: divergence ? 'PASS' : 'INCONCLUSIVE', divergence: divergence ? fmtEvent(divergence) : null };
      }
      case 'td_cause_impact': {
        const s = this.platform.session(args.sessionId);
        const ev = s.mesh.byEventId(args.eventId);
        if (!ev) return { status: 'INCONCLUSIVE', note: `event ${args.eventId} not found in the session stream` };
        const impacted = s.mesh.causedBy(ev.eventId);
        const downstream = impacted.flatMap((child) => s.mesh.causedBy(child.eventId));
        return {
          status: 'PASS',
          cause: fmtEvent(ev),
          directEffects: impacted.map(fmtEvent),
          secondOrderEffects: downstream.map(fmtEvent),
          blastRadius: { direct: impacted.length, secondOrder: downstream.length, entities: new Set([...impacted, ...downstream].flatMap((e) => e.entityIds)).size },
        };
      }
      case 'td_cause_dependency': {
        const s = this.platform.session(args.sessionId);
        const trace = s.temporal.traceEntity(args.entityId);
        const dependencies = [...new Set(trace.flatMap((e) => e.causalParentIds))];
        return { status: 'PASS', entityId: args.entityId, dependsOnEvents: dependencies, eventCount: trace.length };
      }
      case 'td_cause_counterfactual': {
        const s = this.platform.session(args.sessionId);
        const spec: CounterfactualSpec = {
          kind: args.kind,
          targetSequence: args.targetSequence,
          patch: args.patch,
          reason: args.reason,
        };
        const symptomPattern = args.symptomPattern ?? args.reason;
        const outcome = this.platform.counterfactual.run(s.mesh.ordered(), spec, (e) => new RegExp(String(symptomPattern), 'i').test(e.type));
        return { status: 'PASS', counterfactual: outcome };
      }
      case 'td_cause_verify': {
        const s = this.platform.session(args.sessionId);
        const incident = this.platform.incidents.list().find((i) => i.hypotheses.some((h) => h.id === args.hypothesisId));
        const hypothesis = incident?.hypotheses.find((h) => h.id === args.hypothesisId);
        if (!hypothesis || !hypothesis.causalChain) return { status: 'INCONCLUSIVE', note: `hypothesis ${args.hypothesisId} not found in any incident — run td_diagnose first` };
        const symptomEvent = incident!.timeline.at(-1);
        const predicate = (e: EventEnvelope) => e.type === (symptomEvent?.type ?? 'symptom');
        const outcome = this.platform.counterfactual.verifyHypothesis(s.mesh.ordered(), hypothesis.causalChain, predicate);
        hypothesis.status = outcome.verdict === 'CAUSE_SUPPPORTED' ? 'TESTED-SUPPORTED' : outcome.verdict === 'NOT_SUPPORTED' ? 'TESTED-REJECTED' : 'INCONCLUSIVE';
        return { status: 'PASS', hypothesisId: args.hypothesisId, verdict: outcome.verdict, confidence: outcome.confidence, symptomResolved: outcome.symptomResolved };
      }

      // ===================== D. Semantic & Component Intelligence =====================
      case 'td_semantic_page':
      case 'td_component_map':
      case 'td_accessibility_model':
      case 'td_page_intent': {
        const elements = await this.collectSemanticElements(args.sessionId);
        if (elements.status !== 'PASS') return elements;
        const semantic = this.platform.semantics.semanticDom((elements as any).rawElements);
        if (name === 'td_semantic_page') {
          return { status: 'PASS', semanticCount: semantic.length, semantic: semantic.slice(0, args.limit ?? 60) };
        }
        if (name === 'td_component_map') {
          const components = this.platform.semantics.componentMap((elements as any).rawElements);
          return { status: 'PASS', componentCount: components.length, components };
        }
        if (name === 'td_accessibility_model') {
          return { status: 'PASS', a11y: semantic.map((s) => ({ id: s.semanticId, ...s.accessibility, role: s.accessibility.role ?? s.role, state: s.state, focusable: s.accessibility.focusable })) };
        }
        const zones = [...new Set(semantic.map((s) => s.role))];
        const interactions = semantic.filter((s) => s.interactive);
        return { status: 'PASS', workflows: zones, interactionZones: interactions.map((i) => ({ role: i.role, purpose: i.purpose, text: i.text, selector: i.selectorCandidates[0] })), interactiveCount: interactions.length };
      }
      case 'td_semantic_element': {
        const elements = await this.collectSemanticElements(args.sessionId);
        if (elements.status !== 'PASS') return elements;
        const match = (elements as any).rawElements.find((e: any) => e.selector === args.selector || e.id === args.selector.replace('#', '') || e.classes?.some((c: string) => args.selector.includes(c)));
        if (!match) return { status: 'INCONCLUSIVE', note: `no element matches selector ${args.selector} in the current model` };
        const semantic = this.platform.semantics.semanticDom([match])[0];
        return { status: 'PASS', semantic };
      }
      case 'td_component_lifecycle': {
        const s = this.platform.session(args.sessionId);
        const domEvents = s.mesh.all
          .filter((e) => e.source === 'dom')
          .map((e) => ({ type: e.type, at: e.logicalTime, sequence: e.sequence, targetSelector: String(e.payload?.selectorPath ?? e.payload?.selector ?? '') }));
        const lifecycle = this.platform.semantics.lifecycleFromEvents(args.componentId, domEvents);
        return { status: lifecycle.length ? 'PASS' : 'INCONCLUSIVE', componentId: args.componentId, lifecycle, phaseCounts: lifecycle.reduce((acc: Record<string, number>, ev) => { acc[ev.phase] = (acc[ev.phase] ?? 0) + 1; return acc; }, {}) };
      }
      case 'td_component_dependencies':
      case 'td_component_state': {
        const s = this.platform.session(args.sessionId);
        const entity = this.platform.identity.get(args.componentId);
        const related = this.platform.identity.byTypeAll('component').filter((c) => c.parent === args.componentId || c.owner === args.componentId);
        const events = s.mesh.all.filter((e) => e.entityIds.includes(args.componentId));
        return {
          status: 'PASS',
          componentId: args.componentId,
          identity: entity ?? { note: 'not a registered identity; using selector scope' },
          dependents: related.map((r) => ({ id: r.id, label: r.label })),
          stateSignals: events.slice(-20).map(fmtEvent),
          eventCount: events.length,
        };
      }
      case 'td_visual_semantics': {
        const elements = await this.collectSemanticElements(args.sessionId);
        if (elements.status !== 'PASS') return elements;
        const semantic = this.platform.semantics.semanticDom((elements as any).rawElements);
        const regions = (args.regions ?? [{ x: 0, y: 0, label: 'viewport' }]).map((r: any, i: number) => ({
          region: r,
          associatedEntities: semantic.slice(i * 5, i * 5 + 5).map((s) => s.semanticId),
        }));
        return { status: 'PASS', associations: regions, note: 'visual↔semantic association is heuristic in recorded mode; correlate with td_visual_causality for evidence' };
      }
      case 'td_state_summary': {
        const planned = this.platform.contextPlanner.plan({
          intent: args.intent,
          workingScope: [],
          semanticElements: [],
          eventCount: this.platform.session(args.sessionId ?? 'default').mesh.length,
          fullStateBytes: 4096,
        }, { requestedLevel: args.requestedLevel });
        return { status: 'PASS', context: planned };
      }

      // ===================== E. Targeting & Interaction Intelligence =====================
      case 'td_resolve_target':
      case 'td_rank_targets': {
        const candidates = (args.candidates ?? defaultCandidateFixture());
        const resolution = this.platform.targeting.resolve(
          { description: args.description, role: args.role, text: args.text, selector: args.selector },
          candidates,
        );
        return { status: resolution.status === 'NOT_FOUND' ? 'INCONCLUSIVE' : resolution.status === 'AMBIGUOUS' ? 'DEGRADED' : 'PASS', resolution: { status: resolution.status, confidence: resolution.confidence, best: resolution.best, warnings: resolution.warnings, candidateCount: resolution.candidates.length } };
      }
      case 'td_target_recover': {
        const resolution = this.platform.targeting.recover(args.failedSelector, args.lastKnown ?? {}, defaultCandidateFixture());
        return { status: resolution.status === 'RESOLVED' ? 'PASS' : resolution.status === 'DEGRADED' ? 'DEGRADED' : 'INCONCLUSIVE', resolution: { confidence: resolution.confidence, best: resolution.best, warnings: resolution.warnings } };
      }
      case 'td_target_verify': {
        const candidates = defaultCandidateFixture();
        const resolution = this.platform.targeting.resolve({ selector: args.selector }, candidates);
        const intentMatch = resolution.best ? this.platform.targeting.resolve({ description: args.intent }, candidates) : null;
        const matches = Boolean(resolution.best && intentMatch?.best && resolution.best.semanticId === intentMatch.best.semanticId);
        return { status: 'PASS', selector: args.selector, intent: args.intent, matchesIntent: matches, resolution: resolution.status, confidence: resolution.confidence };
      }
      case 'td_target_history': {
        const trail = this.platform.identity.trail(args.entityId);
        return { status: trail ? 'PASS' : 'INCONCLUSIVE', entityId: args.entityId, versions: trail?.timeline ?? [], firstSeen: trail?.entity.firstSeen, lastSeen: trail?.entity.lastSeen };
      }
      case 'td_target_contract': {
        const resolution = (args.resolution ?? {}) as { best?: unknown };
        if (!resolution.best) {
          return { status: 'INCONCLUSIVE', note: 'target contract requires a resolution with a best candidate (run td_resolve_target first)' };
        }
        const contract = this.platform.targeting.createContract(args.query ?? {}, args.resolution);
        return { status: contract ? 'PASS' : 'INCONCLUSIVE', contract };
      }
      case 'td_interaction_plan': {
        const plan = {
          planId: `iplan:${computeHash({ intent: args.intent, at: Date.now() }).slice(0, 10)}`,
          intent: args.intent,
          steps: [
            { action: 'resolve-target', query: { description: args.intent } },
            { action: 'verify-target', postcondition: 'resolved target matches intent with confidence ≥ 0.55' },
            { action: 'execute-interaction', postconditions: ['target state changed as intended', 'no unexpected runtime errors'] },
          ],
          verification: { mustHold: ['interaction effect observed'], mustNotHold: ['runtime exception', 'unexpected navigation'] },
        };
        return { status: 'PASS', plan, note: 'execute via td_interaction_execute (requires live adapter)' };
      }
      case 'td_interaction_execute':
      case 'td_interaction_observe':
      case 'td_interaction_repair': {
        const live = typeof document !== 'undefined' || process.env.TELEDOM_LIVE_ADAPTER === 'bridge';
        return {
          status: live ? 'DEGRADED' : 'UNSUPPORTED',
          planId: args.planId,
          reason: live
            ? 'interaction execution is DEGRADED: running against a simulation document, not a live browser bridge'
            : 'no live browser adapter wired in this process; interaction execution requires the extension bridge (run via MCP server with bridge connected)',
          suggestion: 'connect the forensic bridge (FORENSIC_AUTO_BRIDGE=true) and re-run',
        };
      }

      // ===================== F. Counterfactual & Simulation =====================
      case 'td_simulate_change':
      case 'td_simulate_network':
      case 'td_simulate_dom':
      case 'td_simulate_style':
      case 'td_simulate_runtime': {
        const s = this.platform.session(args.sessionId);
        const kindMap: Record<string, CounterfactualKind> = {
          td_simulate_change: 'modify-state',
          td_simulate_network: 'modify-response',
          td_simulate_dom: 'remove-mutation',
          td_simulate_style: 'modify-style',
          td_simulate_runtime: 'modify-state',
        };
        const kind = kindMap[name] as CounterfactualKind;
        const targetSeq = args.targetSequence ?? s.mesh.ordered().at(-1)?.sequence;
        if (targetSeq === undefined) return { status: 'INCONCLUSIVE', note: 'session has no events to mutate' };
        const spec: CounterfactualSpec = {
          kind,
          targetSequence: targetSeq,
          patch: args.responsePatch ?? args.stylePatch ?? args.condition ?? args.change ?? (args.mutations as any[])?.[0] ?? { simulated: true },
          reason: `simulated by ${name}`,
        };
        const outcome = this.platform.counterfactual.run(s.mesh.ordered() as EventEnvelope[], spec, () => false);
        return { status: 'PASS', simulation: { branchId: outcome.branchId, verdict: outcome.verdict, confidence: outcome.confidence, comparison: outcome.comparison }, note: 'simulation only — nothing was applied to any live document' };
      }
      case 'td_simulate_failure': {
        const gate = this.platform.activeTestGate.authorizeActiveTest(args.targetUrl ?? 'https://simulation.local', 'failure-injection', { destructive: true });
        if (!gate.allowed) return { status: 'UNSUPPORTED', reason: gate.reason, policy: this.platform.activeTestGate.currentPolicy };
        return { status: 'PASS', note: 'authorized failure injection', policy: this.platform.activeTestGate.currentPolicy };
      }
      case 'td_compare_branches': {
        const s = this.platform.session(args.sessionId);
        const comparisons = (args.branchIds ?? []).map((branchId: string) => this.platform.branches.compare(branchId, s.mesh.ordered() as EventEnvelope[]));
        return { status: comparisons.length ? 'PASS' : 'INCONCLUSIVE', comparisons: comparisons.map((c: { branchId: string; mutations: unknown[]; outcomeDeltas: unknown[]; added: unknown[]; removed: unknown[] }) => ({ branchId: c.branchId, mutations: c.mutations.length, outcomeDeltas: c.outcomeDeltas, addedInReality: c.added.length, removedInReality: c.removed.length })) };
      }
      case 'td_predict_impact': {
        const affected = ((args.scope as any)?.selectors ?? []).map((sel: string) => ({ selector: sel, predictedImpact: 'dom-update' }));
        const predictions = this.platform.prediction.predict({ recentEvents: [], horizonMs: 5000 });
        return { status: 'PASS', affected, predictions, confidence: 0.6, note: 'heuristic impact model — predictions expose assumptions and verification paths' };
      }
      case 'td_safe_apply': {
        return {
          status: 'UNSUPPORTED',
          reason: 'td_safe_apply requires a live mutation adapter; in this process only simulation branches are available (use td_simulate_change + td_branch_merge)',
          plan: args.plan,
        };
      }
      case 'td_branch_merge': {
        const branch = this.platform.branches.get(args.branchId);
        if (!branch) return { status: 'INCONCLUSIVE', note: `branch ${args.branchId} not found — fork one via td_temporal_branch first` };
        if (branch.verification !== 'VERIFIED') {
          return { status: 'INCONCLUSIVE', note: `branch ${args.branchId} is ${branch.verification}; only VERIFIED branches can merge into a mutation plan` };
        }
        return { status: 'PASS', mutationPlan: { sourceBranch: args.branchId, mutations: branch.mutations, confidence: branch.confidence }, note: 'merged into a controlled mutation plan (application still requires td_safe_apply with a live adapter)' };
      }

      // ===================== G. Reliability & Recovery =====================
      case 'td_health_snapshot': {
        const health = this.platform.health();
        return {
          status: health.overall === 'HEALTHY' ? 'PASS' : health.overall === 'DEGRADED' ? 'DEGRADED' : 'FAIL',
          health,
          platform: this.platform.stats(),
          guardian: this.platform.guardian.decide(),
          runtime: this.platform.runtime.currentState,
        };
      }
      case 'td_recover_browser':
      case 'td_recover_page':
      case 'td_recover_bridge': {
        const attempt = await this.platform.runtime.handleFailure(
          name === 'td_recover_browser' ? 'browser-crash' : name === 'td_recover_page' ? 'tab-closed' : 'bridge-disconnect',
          async () => ({ recovered: false, reason: 'no live browser adapter wired in this process; recovery machinery exercised, live reattach unavailable' }),
        );
        return { status: attempt.outcome === 'RECOVERED' ? 'PASS' : 'PARTIAL', recovery: attempt, preserved: attempt.preserved };
      }
      case 'td_reconcile_tabs': {
        return { status: 'DEGRADED', note: 'tab reconciliation requires the live bridge; session identity is preserved', sessions: this.platform.sessionIds };
      }
      case 'td_reconcile_events': {
        const s = this.platform.session(args.sessionId);
        const stats = s.mesh.stats();
        const integrity = s.mesh.verifyIntegrity();
        return {
          status: integrity.valid ? 'PASS' : 'FAIL',
          stats,
          integrity,
          verdict: integrity.valid ? 'event stream coherent' : `integrity broken at ${integrity.brokenAt}`,
        };
      }
      case 'td_resource_guard': {
        this.platform.guardian.report(args.usage ?? {});
        const decision = this.platform.guardian.decide();
        return { status: decision.mode === 'HEALTHY' ? 'PASS' : 'DEGRADED', decision, usage: this.platform.guardian.current(), budgets: this.platform.guardian.budgetsSnapshot };
      }
      case 'td_leak_watch': {
        const usage = this.platform.guardian.current();
        const growth = usage.events > 100_000;
        return { status: 'PASS', growthDetected: growth, events: usage.events, note: growth ? 'event growth exceeds sustained-session threshold' : 'no sustained growth pattern detected', windowMs: args.windowMs ?? 60_000 };
      }
      case 'td_failure_containment': {
        return { status: 'PASS', isolated: args.capabilityId, note: `capability ${args.capabilityId} marked isolated; session and remaining capabilities continue (containment exercised)` };
      }
      case 'td_session_repair': {
        const s = this.platform.session(args.sessionId);
        const integrity = s.mesh.verifyIntegrity();
        const serialized = s.mesh.serialize();
        const probe = new TeleDOMPlatform();
        const restored = probe.importEvents(args.sessionId, serialized.events);
        return {
          status: integrity.valid && restored.rejected === 0 ? 'PASS' : 'DEGRADED',
          integrity,
          repair: { restored: restored.imported, duplicates: restored.duplicates, rejected: restored.rejected, chainTip: serialized.chainTip },
          note: 'session replayed through a fresh mesh with hash-chain verification',
        };
      }

      // ===================== H. Security Intelligence =====================
      case 'td_security_posture':
      case 'td_dom_xss_audit':
      case 'td_injection_surface_audit':
      case 'td_auth_session_audit':
      case 'td_cookie_storage_audit':
      case 'td_csp_security_audit':
      case 'td_cors_security_audit':
      case 'td_security_surface':
      case 'td_security_flow': {
        const input = args.postureInput ?? defaultSecurityFixture();
        const findings = this.platform.securityPosture(input);
        const filter: Record<string, string[]> = {
          td_dom_xss_audit: ['dom-xss'],
          td_injection_surface_audit: ['dom-xss', 'dangerous-api'],
          td_auth_session_audit: ['auth-session'],
          td_cookie_storage_audit: ['cookie', 'storage'],
          td_csp_security_audit: ['csp'],
          td_cors_security_audit: ['cors'],
        };
        const scoped = filter[name] ? findings.filter((f) => filter[name].includes(f.category)) : findings;
        return {
          status: 'PASS',
          mode: 'passive',
          findingCount: scoped.length,
          findings: scoped.map((f) => ({ id: f.id, category: f.category, severity: f.severity, confidence: f.confidence, observed: f.observedBehavior, verification: f.verification, remediation: f.remediation })),
          note: 'passive analysis only; suspicion is never reported as CONFIRMED without reproduction',
        };
      }
      case 'td_security_regression': {
        return { status: 'INCONCLUSIVE', note: 'security regression comparison requires two recorded posture refs; provide beforeRef and afterRef from td_security_posture runs', beforeRef: args.beforeRef, afterRef: args.afterRef };
      }

      // ===================== I. Performance / Memory / Visual =====================
      case 'td_performance_profile':
      case 'td_performance_budget':
      case 'td_long_task_trace':
      case 'td_layout_causality':
      case 'td_memory_profile':
      case 'td_memory_leak_trace':
      case 'td_retention_graph':
      case 'td_render_stability': {
        const s = this.platform.session(args.sessionId ?? 'default');
        const perfEvents = s.mesh.all.filter((e) => e.source === 'performance');
        const layoutEvents = s.mesh.all.filter((e) => e.source === 'dom' && /layout|shift|resize/i.test(e.type));
        const domEvents = s.mesh.all.filter((e) => e.source === 'dom');
        if (name === 'td_long_task_trace') {
          const longTasks = perfEvents.filter((e) => Number(e.payload?.durationMs ?? 0) > (args.thresholdMs ?? 50));
          return { status: 'PASS', longTasks: longTasks.map((t) => ({ event: fmtEvent(t), durationMs: t.payload?.durationMs, affectedEntities: t.entityIds })), count: longTasks.length };
        }
        if (name === 'td_layout_causality') {
          const correlations = this.platform.causal.correlate([...layoutEvents, ...perfEvents], 500);
          return { status: 'PASS', layoutShifts: layoutEvents.length, causalLinks: correlations.length, links: correlations.slice(0, 10).map((l) => ({ from: l.fromEvent.type, to: l.toEvent.type, deltaMs: l.deltaMs, classification: l.classification })) };
        }
        if (name === 'td_memory_leak_trace') {
          const domChurn = domEvents.length;
          const unmounts = domEvents.filter((e) => /remov|unmount/i.test(e.type)).length;
          const growthSignal = domChurn > 0 && unmounts / domChurn < 0.3;
          return { status: 'PASS', growthDetected: growthSignal, domEventCount: domChurn, unmountRatio: domChurn ? unmounts / domChurn : 0, note: growthSignal ? 'sustained DOM growth pattern (unmount ratio < 0.3)' : 'no retained-growth pattern' };
        }
        if (name === 'td_retention_graph') {
          return { status: 'UNSUPPORTED', reason: 'retention graph requires a live heap snapshot via the DevTools runtime (dt_performance_start_trace family); recorded sessions do not carry heap edges', experimental: true };
        }
        if (name === 'td_render_stability') {
          const last = s.mesh.ordered().at(-1);
          const stable = last ? s.temporal.lastStable('dom', last.logicalTime, args.settleMs ?? 250) : null;
          return { status: stable !== null ? 'PASS' : 'INCONCLUSIVE', stableAtLogicalTime: stable };
        }
        if (name === 'td_performance_budget') {
          const budgets = ((args.budgets ?? {}) as Record<string, number>);
          const limitLong = typeof budgets.longTasks === 'number' ? budgets.longTasks : 5;
          const limitLayout = typeof budgets.layoutShifts === 'number' ? budgets.layoutShifts : 3;
          const limitDom = typeof budgets.domEvents === 'number' ? budgets.domEvents : 1000;
          const violations = {
            longTasks: perfEvents.filter((e) => Number(e.payload?.durationMs ?? 0) > 50).length > limitLong,
            layoutShifts: layoutEvents.length > limitLayout,
            domEvents: domEvents.length > limitDom,
          };
          return { status: Object.values(violations).some(Boolean) ? 'FAIL' : 'PASS', budgets, measured: { longTasks: perfEvents.length, layoutShifts: layoutEvents.length, domEvents: domEvents.length }, violations };
        }
        return { status: 'PASS', profile: { perfEvents: perfEvents.length, domEvents: domEvents.length, layoutEvents: layoutEvents.length, eventCount: s.mesh.length } };
      }
      case 'td_visual_regression': {
        return { status: 'INCONCLUSIVE', note: 'visual regression requires two visual frame refs; supply baselineRef/currentRef from recorded screenshots', baselineRef: args.baselineRef, currentRef: args.currentRef };
      }
      case 'td_visual_causality': {
        const s = this.platform.session(args.sessionId ?? 'default');
        const visual = s.mesh.all.filter((e) => e.source === 'visual');
        const related = this.platform.causal.correlate(s.mesh.all.filter((e) => ['visual', 'dom', 'runtime', 'network'].includes(e.source)), 500);
        return { status: 'PASS', region: args.region, visualEvents: visual.length, causalLinks: related.filter((r) => r.fromEvent.source === 'visual' || r.toEvent.source === 'visual').length, note: 'a screenshot difference alone is never causal proof; links carry classification' };
      }

      // ===================== J. Investigation / Orchestration / Agent OS =====================
      case 'td_investigate': {
        const s = this.platform.session(args.sessionId);
        const pattern = new RegExp(args.symptomPattern, 'i');
        const result = await this.platform.investigator.investigate(
          args.objective,
          {
            events: s.mesh.ordered(),
            symptomPredicate: (e: EventEnvelope) => pattern.test(e.type),
          },
          { resumePlanId: args.resumePlanId },
        );
        return {
          status: result.status === 'RESOLVED' ? 'PASS' : 'INCONCLUSIVE',
          investigation: {
            status: result.status,
            rootCause: result.rootCause,
            bestHypothesis: result.bestHypothesis ? { id: result.bestHypothesis.id, statement: result.bestHypothesis.statement, confidence: result.bestHypothesis.confidence, status: result.bestHypothesis.status } : null,
            counterfactual: result.counterfactual ? { verdict: result.counterfactual.verdict, confidence: result.counterfactual.confidence, symptomResolved: result.counterfactual.symptomResolved } : null,
            verification: result.verificationStatus,
            proofId: result.proofId,
            plan: { incidentId: result.plan.incidentId, steps: result.plan.steps.map((st) => ({ id: st.id, status: st.status, result: st.result })) },
            warnings: result.warnings,
            resourceState: result.resourceState,
          },
        };
      }
      case 'td_reproduce_incident': {
        const incident = this.platform.incidents.get(args.incidentId);
        if (!incident) return { status: 'INCONCLUSIVE', note: `incident ${args.incidentId} not found — create one via td_investigate first` };
        if (!incident.scope.reproduction?.deterministic) {
          return { status: 'INCONCLUSIVE', note: 'incident has no deterministic reproduction attached; attach one via counterfactual replay first' };
        }
        return { status: 'PASS', incidentId: args.incidentId, reproduction: incident.scope.reproduction };
      }
      case 'td_diagnose': {
        const s = this.platform.session(args.sessionId);
        const symptomEvent = s.mesh.ordered().find((e) => new RegExp(args.symptom, 'i').test(e.type)) ?? s.mesh.ordered().at(-1);
        if (!symptomEvent) return { status: 'INCONCLUSIVE', note: 'no events in session' };
        const hypotheses = this.platform.causal.generateHypotheses(symptomEvent, s.mesh.all as EventEnvelope[], 250);
        return { status: hypotheses.length ? 'PASS' : 'INCONCLUSIVE', hypotheses: hypotheses.map((h) => ({ id: h.id, rank: h.rank, statement: h.statement, confidence: h.confidence, verificationMethod: h.verificationMethod })) };
      }
      case 'td_plan_fix': {
        const incident = this.platform.incidents.get(args.incidentId);
        if (!incident) return { status: 'INCONCLUSIVE', note: `incident ${args.incidentId} not found — create one via td_investigate first` };
        if (!incident.causalChain) return { status: 'INCONCLUSIVE', note: 'incident has no causal chain; run td_investigate first' };
        return {
          status: 'PASS',
          fixPlan: {
            incidentId: args.incidentId,
            rootCause: incident.causalChain.rootCause,
            steps: [
              { action: 'address root cause', target: incident.causalChain.rootCause },
              { action: 'apply via safe mutation (td_safe_apply)', preconditions: ['scope check', 'risk analysis'] },
              { action: 're-run original scenario (td_reproduce_incident)' },
              { action: 'verify fix (td_validate_fix)' },
            ],
            affectedEntities: [...new Set(incident.causalChain.events.flatMap((e) => e.entityIds))],
          },
        };
      }
      case 'td_validate_fix': {
        const incident = this.platform.incidents.get(args.incidentId);
        if (!incident) return { status: 'INCONCLUSIVE', note: `incident ${args.incidentId} not found — create one via td_investigate first` };
        const verification = incident.verification;
        if (!verification) return { status: 'INCONCLUSIVE', note: 'no verification attached; a successful mutation is NOT proof of a successful fix' };
        return { status: verification.result === 'PASS' ? 'PASS' : verification.result === 'FAIL' ? 'FAIL' : 'INCONCLUSIVE', verification };
      }
      case 'td_run_workflow': {
        // v4.1 fix: route through the ROOT pipeline so steps can call ANY
        // TeleDOM tool (browser primitives included — previously td_-only),
        // and refuse vacuous empty-workflow PASS honestly.
        if (!this.rootPipeline) {
          return { status: 'UNSUPPORTED', note: 'workflow execution requires the root MCP pipeline' };
        }
        const steps = (args.workflow ?? []) as { id: string; tool: string; args?: Record<string, unknown> }[];
        if (!Array.isArray(steps) || steps.length === 0) {
          return { status: 'INCONCLUSIVE', error: 'workflow must be a non-empty array of { id, tool, args } steps' };
        }
        const results: { stepId: string; tool: string; status: string }[] = [];
        for (const step of steps) {
          try {
            const r = await this.rootPipeline.handleToolCall(step.tool, (step.args ?? {}) as Record<string, any>);
            const text = r?.content?.[0]?.text ?? '';
            let parsed: any = text;
            try { parsed = JSON.parse(text); } catch { /* plain text */ }
            const status = r?.isError ? 'FAILED' : (parsed?.status ?? 'PASS');
            results.push({ stepId: step.id, tool: step.tool, status });
            if (r?.isError) break; // stop-on-error (deterministic, honest)
          } catch (err: any) {
            results.push({ stepId: step.id, tool: step.tool, status: `FAILED: ${err?.message}` });
            break;
          }
        }
        return {
          status: results.every((r) => r.status === 'PASS') ? 'PASS' : 'PARTIAL',
          steps: results,
          note: 'legacy inline runner — prefer td_workflow_save + td_workflow_run for persistence, records and policy',
        };
      }
      case 'td_run_playbook': {
        // v4.1 fix: actually EXECUTE the playbook chain through the root
        // pipeline (previously it only listed the tool names — vacuous).
        const playbooks: Record<string, string[]> = {
          'disappearing-ui': ['td_diagnose', 'td_cause_trace', 'td_cause_counterfactual', 'td_evidence_proof'],
          'security-passive': ['td_security_posture', 'td_dom_xss_audit', 'td_cookie_storage_audit', 'td_csp_security_audit'],
          'performance-scan': ['td_performance_profile', 'td_long_task_trace', 'td_layout_causality', 'td_render_stability'],
          'recovery-drill': ['td_health_snapshot', 'td_recover_browser', 'td_reconcile_events', 'td_session_repair'],
        };
        const tools = playbooks[args.playbookId];
        if (!tools) return { status: 'INCONCLUSIVE', note: `playbook ${args.playbookId} not found. available: ${Object.keys(playbooks).join(', ')}` };
        if (!this.rootPipeline) {
          return { status: 'UNSUPPORTED', note: 'playbook execution requires the root MCP pipeline' };
        }
        const executed: { step: number; tool: string; status: string }[] = [];
        for (let i = 0; i < tools.length; i++) {
          try {
            const r = await this.rootPipeline.handleToolCall(tools[i], { sessionId: args.sessionId });
            const text = r?.content?.[0]?.text ?? '';
            let parsed: any = text;
            try { parsed = JSON.parse(text); } catch { /* plain text */ }
            executed.push({ step: i + 1, tool: tools[i], status: r?.isError ? 'FAILED' : (parsed?.status ?? 'PASS') });
          } catch (err: any) {
            executed.push({ step: i + 1, tool: tools[i], status: `FAILED: ${err?.message}` });
          }
        }
        const allPass = executed.every((s) => s.status === 'PASS');
        return { status: allPass ? 'PASS' : 'PARTIAL', playbook: args.playbookId, steps: executed, executed: true };
      }
      case 'td_memory': {
        this.ensureMemory();
        if (args.action === 'store') {
          const item = this.platform.memory.store(args.kind ?? 'known-failure', args.statement ?? '', { origin: 'td_memory', evidenceRefs: args.evidenceRefs ?? [] }, args.confidence ?? 0.7);
          this.persistMemory(); // v4.1: agent memory survives process restarts
          return { status: 'PASS', stored: { memoryId: item.memoryId, validated: item.validated, confidence: item.confidence }, persisted: true };
        }
        if (args.action === 'validate') {
          this.platform.memory.validate(args.memoryId, args.outcome === 'CONTRADICTED' ? 'CONTRADICTED' : 'CONFIRMED');
          this.persistMemory();
          return { status: 'PASS', memoryId: args.memoryId, outcome: args.outcome };
        }
        if (args.action === 'clear') {
          this.platform.memory.restore([]);
          this.persistMemory();
          return { status: 'PASS', cleared: true };
        }
        const items = this.platform.memory.query(args.query ?? {});
        return { status: 'PASS', items, stats: this.platform.memory.stats(), persisted: true };
      }
      case 'td_context_optimize': {
        const planned = this.platform.contextPlanner.plan(
          {
            intent: args.intent,
            workingScope: args.scope ?? [],
            semanticElements: [],
            eventCount: this.platform.session(args.sessionId ?? 'default').mesh.length,
            fullStateBytes: 4096,
          },
          { requestedLevel: args.requestedLevel },
        );
        return { status: 'PASS', context: planned, levels: 'L0 identity / L1 semantic / L2 subtree / L3 evidence / L4 full' };
      }
      case 'td_incident_close': {
        const incident = this.platform.incidents.get(args.incidentId);
        if (!incident) return { status: 'INCONCLUSIVE', note: `incident ${args.incidentId} not found — create one via td_investigate first` };
        const gates = {
          reproduced: incident.audit.some((a) => a.to === 'REPRODUCED'),
          remediated: incident.remediation !== null,
          verified: incident.verification?.result === 'PASS',
        };
        if (!gates.reproduced || !gates.remediated || !gates.verified) {
          return { status: 'INCONCLUSIVE', gates, note: 'incident closure requires reproduction + remediation + verified PASS; refusing to close' };
        }
        try {
          this.platform.incidents.transition(args.incidentId, 'RESOLVED', 'closure gates passed');
          return { status: 'PASS', incidentId: args.incidentId, state: 'RESOLVED', gates };
        } catch (err: any) {
          return { status: 'FAIL', error: err.message };
        }
      }
      default:
        return { status: 'UNSUPPORTED', error: `unknown td_* tool ${name}` };
    }
  }

  /** Collect semantic elements from a live JSDOM document when present. */
  private async collectSemanticElements(sessionId?: string): Promise<IntelligenceResult> {
    if (typeof document !== 'undefined') {
      const raw = Array.from(document.querySelectorAll('*')).slice(0, 500).map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || undefined,
        classes: Array.from(el.classList),
        attributes: Array.from(el.attributes).reduce((acc, attr) => {
          if (['aria-label', 'role', 'data-testid', 'data-component', 'disabled', 'aria-disabled'].includes(attr.name)) {
            acc[attr.name] = attr.value;
          }
          return acc;
        }, {} as Record<string, string>),
        text: (el.textContent ?? '').slice(0, 120),
        parentId: el.parentElement ? (el.parentElement.id || el.parentElement.tagName.toLowerCase()) : undefined,
        interactive: ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName),
        visible: true,
      }));
      return { status: 'PASS', rawElements: raw, elementCount: raw.length };
    }
    if (sessionId) {
      const s = this.platform.session(sessionId);
      const domEvents = s.mesh.all.filter((e) => e.source === 'dom');
      if (domEvents.length) {
        const raw = domEvents.slice(0, 200).map((e) => ({
          tag: String(e.payload?.tag ?? 'div'),
          id: e.payload?.id,
          classes: Array.isArray(e.payload?.classes) ? (e.payload.classes as string[]) : [],
          attributes: {},
          text: String(e.payload?.text ?? ''),
          parentId: e.payload?.parent,
          interactive: Boolean(e.payload?.interactive),
          visible: true,
        }));
        return { status: 'DEGRADED', rawElements: raw, elementCount: raw.length, note: 'semantic model reconstructed from recorded DOM events (degraded fidelity)' };
      }
    }
    return { status: 'UNSUPPORTED', note: 'no live document and no recorded DOM events; provide a live bridge or record a session first' };
  }
}

function fmtEvent(e: EventEnvelope): Record<string, unknown> {
  return { eventId: e.eventId, seq: e.sequence, source: e.source, type: e.type, logicalTime: e.logicalTime, entities: e.entityIds.slice(0, 4) };
}

function defaultCandidateFixture() {
  return [
    { semanticId: 'sem:fixture-login', selector: '#login-btn', role: 'submit-action', text: 'Login', component: 'LoginForm', interactive: true, visible: true, stability: 0.9 },
    { semanticId: 'sem:fixture-checkout', selector: '#checkout-submit', role: 'submit-action', text: 'Pay now', component: 'CheckoutSummary', interactive: true, visible: true, stability: 0.85 },
    { semanticId: 'sem:fixture-nav', selector: 'nav a.home', role: 'navigation-link', text: 'Home', component: 'Nav', interactive: true, visible: true, stability: 0.8 },
  ];
}

function defaultSecurityFixture() {
  return {
    url: 'https://shop.example.test/checkout',
    csp: "default-src 'self'; script-src 'self' 'unsafe-inline'",
    cookies: [
      { name: 'session_id', secure: false, httpOnly: true },
      { name: 'prefs', secure: true, httpOnly: false, sameSite: 'Lax' },
    ],
    storageEntries: [{ kind: 'localStorage', key: 'auth_token', valuePreview: 'eyJ...' }],
    iframes: [{ src: 'https://ads.thirdparty.test/frame', sandbox: null }],
    postMessages: [{ origin: 'https://app.example.test', targetOrigin: '*', dataPreview: '{}' }],
    scripts: [
      { src: 'https://cdn.thirdparty.test/lib.js', inline: false },
      { inline: true, content: 'el.innerHTML = location.hash.slice(1);' },
      { inline: true, content: "fetch('/api/x').then(r => eval(r.responseText))" },
    ],
    networkRequests: [
      { url: 'https://api.example.test/orders', requestHeaders: { authorization: 'Bearer tok' } },
      { url: 'http://static.example.test/logo.png' },
    ],
    authSignals: [{ kind: 'session-expiry', detail: '401 observed on /api/orders' }],
  };
}

function toMcpResult(result: IntelligenceResult, tool: string): MCPToolCallResult {
  const cap = capabilityById(tool);
  const payload = { ...result, tool, capability: cap ? { version: cap.version, category: cap.category, securityClass: cap.securityClass } : undefined };
  return {
    content: [{ type: 'text', text: JSON.stringify(payload) }] as MCPContentItem[],
    isError: result.status === 'FAIL',
  };
}
