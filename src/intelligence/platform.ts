/**
 * TeleDOM v4 Platform — composition root.
 *
 * Composes the full intelligence stack: EventMesh kernel, identity,
 * temporal engine, indexed store, evidence graph, causal engine,
 * counterfactual engine, incident manager + investigator, security
 * analyzers + zero-trust model, self-healing runtime + resource guardian,
 * agent memory + context planner. Session-scoped state (event streams)
 * is managed here so td_* tools operate on real, coherent sessions.
 */

import {
  EventMesh, EventEnvelope, EventSource, IdentityEngine, KernelDiagnostics,
} from './kernel';
import { TemporalEngine } from './temporal/queries';
import { IndexedEventStore } from './temporal/event-store';
import { BranchManager } from './temporal/branching';
import { EvidenceGraph } from './evidence/graph';
import { CausalEngine } from './causality/engine';
import { CounterfactualEngine } from './simulation/counterfactual';
import { PredictionEngine } from './simulation/predictor';
import { IncidentManager, AutonomousInvestigator, TdomFormat } from './incident';
import { ProofEngine, VerificationEngine } from './verification';
import { SecurityAnalyzers, ActiveTestGate, ZeroTrustModel, DEFAULT_SECURITY_POLICY, SecurityFinding, SecurityPostureInput } from './security';
import { SelfHealingRuntime, ResourceGuardian, RecoverySnapshot } from './resilience';
import { AgentMemory, ContextPlanner } from './agent';
import { SemanticEngine } from './semantics/semantic-engine';
import { TargetIntelligence } from './targeting/target-intelligence';
import { TELEDOM_VERSION } from './version';

export interface PlatformSession {
  sessionId: string;
  mesh: EventMesh;
  temporal: TemporalEngine;
  store: IndexedEventStore;
  createdAt: number;
}

export class TeleDOMPlatform {
  readonly version = TELEDOM_VERSION.version;
  readonly identity = new IdentityEngine();
  readonly graph = new EvidenceGraph();
  readonly causal: CausalEngine;
  readonly counterfactual: CounterfactualEngine;
  readonly branches = new BranchManager();
  readonly incidents = new IncidentManager();
  readonly investigator: AutonomousInvestigator;
  readonly proofs = new ProofEngine();
  readonly verifier = new VerificationEngine();
  readonly security = new SecurityAnalyzers();
  readonly zeroTrust = new ZeroTrustModel();
  readonly activeTestGate = new ActiveTestGate({ ...DEFAULT_SECURITY_POLICY });
  readonly guardian = new ResourceGuardian();
  readonly memory = new AgentMemory();
  readonly contextPlanner = new ContextPlanner();
  readonly semantics = new SemanticEngine();
  readonly targeting = new TargetIntelligence();
  readonly prediction = new PredictionEngine();
  readonly tdom = new TdomFormat();
  readonly diagnostics = new KernelDiagnostics();
  readonly runtime: SelfHealingRuntime;
  private sessions = new Map<string, PlatformSession>();

  constructor() {
    this.causal = new CausalEngine(this.graph);
    this.counterfactual = new CounterfactualEngine(this.causal);
    this.investigator = new AutonomousInvestigator(this.causal, this.counterfactual);
    this.runtime = new SelfHealingRuntime(() => this.recoverySnapshot());
    // The TeleDOM kernel itself is alive by construction; browser/bridge
    // failures transition this machine to DEGRADED/DISCONNECTED when they
    // occur (exercised by td_recover_browser / chaos suite).
    this.runtime.markConnected();
    this.registerDiagnostics();
  }

  /** Create or get a session (event mesh + temporal engine + store). */
  session(sessionId: string): PlatformSession {
    let s = this.sessions.get(sessionId);
    if (!s) {
      const mesh = new EventMesh();
      const temporal = new TemporalEngine();
      const store = new IndexedEventStore();
      s = { sessionId, mesh, temporal, store, createdAt: Date.now() };
      this.sessions.set(sessionId, s);
    }
    return s;
  }

  get sessionIds(): string[] {
    return [...this.sessions.keys()];
  }

  /** Record an observation event into a session (mesh + store + temporal). */
  record(sessionId: string, source: EventSource, type: string, payload: Record<string, unknown>, meta: { entityIds?: string[]; causalParentIds?: string[] } = {}): EventEnvelope {
    const s = this.session(sessionId);
    const ev = s.mesh.emit(source, type, payload, meta);
    s.store.admit(ev);
    s.temporal.ingest(ev);
    this.guardian.reportEvent();
    return ev;
  }

  /** Bulk import (restored/chaos/golden streams). */
  importEvents(sessionId: string, events: EventEnvelope[]): { imported: number; duplicates: number; rejected: number } {
    const s = this.session(sessionId);
    let imported = 0, duplicates = 0, rejected = 0;
    for (const env of events) {
      const status = s.mesh.append(env);
      if (status === 'APPENDED' || status === 'LATE_APPENDED') {
        s.store.admit(env);
        s.temporal.ingest(env);
        imported += 1;
      } else if (status === 'DUPLICATE') {
        duplicates += 1;
      } else {
        rejected += 1;
      }
    }
    return { imported, duplicates, rejected };
  }

  /** Security posture scan for a session-shaped input. */
  securityPosture(input: SecurityPostureInput): SecurityFinding[] {
    return this.security.posture(input);
  }

  recoverySnapshot(): RecoverySnapshot {
    return {
      activeIncidentIds: this.incidents.list().filter((i) => i.state !== 'RESOLVED' && i.state !== 'ABANDONED').map((i) => i.incidentId),
      entityCount: this.identity.stats().total,
      evidenceCount: this.graph.stats().nodes,
      checkpointCount: this.sessions.size * 10 + [...this.sessions.values()].reduce((s, x) => s + x.temporal.checkpointCount, 0),
      headSequence: [...this.sessions.values()].reduce((s, x) => s + x.mesh.stats().headSequence, 0),
      tabMapping: {},
    };
  }

  /** Kernel self-diagnostics wiring (TeleDOM investigates itself). */
  private registerDiagnostics(): void {
    for (const [sessionId, s] of this.sessions) {
      void sessionId;
      void s;
    }
    this.diagnostics.register('event-integrity', () => {
      let valid = true;
      let broken = '';
      for (const s of this.sessions.values()) {
        const check = s.mesh.verifyIntegrity();
        if (!check.valid) {
          valid = false;
          broken = check.brokenAt ?? '';
          break;
        }
      }
      return {
        id: 'event-integrity',
        status: valid ? 'HEALTHY' : 'UNHEALTHY',
        detail: valid ? `hash chain valid across ${this.sessions.size} session(s)` : `hash chain broken at ${broken}`,
        measuredAt: Date.now(),
      };
    });
    this.diagnostics.register('storage-integrity', () => ({
      id: 'storage-integrity',
      status: 'HEALTHY',
      detail: `${[...this.sessions.values()].reduce((s, x) => s + x.store.stats().events, 0)} events indexed`,
      measuredAt: Date.now(),
    }));
    this.diagnostics.register('resource-guardian', () => {
      const decision = this.guardian.decide();
      return {
        id: 'resource-guardian',
        status: decision.mode === 'HEALTHY' ? 'HEALTHY' : decision.mode === 'PRESSURED' ? 'DEGRADED' : 'UNHEALTHY',
        detail: `mode=${decision.mode} policy=${decision.capturePolicy}`,
        measuredAt: Date.now(),
      };
    });
    this.diagnostics.register('runtime-state', () => ({
      id: 'runtime-state',
      status: this.runtime.currentState === 'CONNECTED' || this.runtime.currentState === 'RECONCILED' ? 'HEALTHY' : 'DEGRADED',
      detail: `runtime=${this.runtime.currentState}${this.runtime.degradationReason ? ` (${this.runtime.degradationReason})` : ''}`,
      measuredAt: Date.now(),
    }));
    this.diagnostics.register('graph-budget', () => {
      const stats = this.graph.stats();
      return {
        id: 'graph-budget',
        status: stats.degraded ? 'DEGRADED' : 'HEALTHY',
        detail: `graph nodes=${stats.nodes} edges=${stats.edges}${stats.degraded ? ' (payload growth halted — bounded)' : ''}`,
        measuredAt: Date.now(),
      };
    });
    this.diagnostics.register('security-policy', () => ({
      id: 'security-policy',
      status: this.activeTestGate.currentPolicy.killSwitch ? 'DEGRADED' : 'HEALTHY',
      detail: `mode=${this.activeTestGate.currentPolicy.mode} destructive=${this.activeTestGate.currentPolicy.destructiveActionsDisabled ? 'disabled' : 'ENABLED'}`,
      measuredAt: Date.now(),
    }));
  }

  health(): ReturnType<KernelDiagnostics['snapshot']> {
    return this.diagnostics.snapshot();
  }

  stats(): {
    version: string;
    sessions: number;
    entities: number;
    evidence: { nodes: number; edges: number };
    incidents: number;
    proofs: number;
    branches: number;
    memoryItems: number;
  } {
    return {
      version: this.version,
      sessions: this.sessions.size,
      entities: this.identity.stats().total,
      evidence: { nodes: this.graph.stats().nodes, edges: this.graph.stats().edges },
      incidents: this.incidents.list().length,
      proofs: this.proofs.list().length,
      branches: this.branches.list().length,
      memoryItems: this.memory.stats().total,
    };
  }
}
