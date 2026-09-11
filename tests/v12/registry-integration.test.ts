/**
 * TeleDOM v12+ registry + MCP integration + golden/chaos suites.
 * Verifies: exactly 100 td_* tools, no duplicates, single source of truth
 * generation, MCP dispatch works end-to-end, tool list includes td_*,
 * version sync, golden suite metrics, chaos containment.
 */

import { describe, it, expect } from 'vitest';
import { CAPABILITY_REGISTRY, registryStats, validateRegistry, capabilityById } from '../../src/v12/registry/capabilities';
import { TELEDOM_V12_TOOLS, TD_TOOL_NAMES } from '../../src/v12/registry/td-tools';
import { generateCompatibilityMatrix } from '../../src/v12/registry/compatibility';
import { IntelligenceToolsHandler } from '../../src/v12/mcp/intelligence-handler';
import { FORENSIC_MCP_TOOLS } from '../../src/mcp/tools-definition';
import { TELEDOM_VERSION, VERSION_HISTORY } from '../../src/v12/version';
import { generateGoldenSuite, runGoldenSuite, GOLDEN_CATEGORIES } from '../../src/v12/golden/generator';
import { runChaosSuite } from '../../src/v12/chaos/chaos';
import { EventMesh, EventEnvelope } from '../../src/v12/kernel';

describe('v12 capability registry — single source of truth', () => {
  it('contains exactly 100 td_* capabilities in 10 categories of 10', () => {
    const validation = validateRegistry();
    expect(validation.problems).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(CAPABILITY_REGISTRY.length).toBe(100);
    const stats = registryStats();
    expect(Object.keys(stats.byCategory)).toHaveLength(10);
  });

  it('every capability declares full metadata (security, cost, modes, deps, tests, docs)', () => {
    for (const cap of CAPABILITY_REGISTRY) {
      expect(cap.version).toBe(TELEDOM_VERSION.version);
      expect(cap.description.length).toBeGreaterThan(20);
      expect(['read-only', 'read-mostly', 'side-effects', 'reversible', 'dangerous', 'policy-gated']).toContain(cap.securityClass);
      expect(['minimal', 'low', 'medium', 'high']).toContain(cap.resourceCost);
      expect(cap.supportedModes.length).toBeGreaterThan(0);
      expect(cap.dependencies.length).toBeGreaterThan(0);
      expect(cap.tests.length).toBeGreaterThan(0);
      expect(cap.docs).toContain(cap.id);
      expect(cap.compatibility.minKernelVersion).toBe('12.0.0');
    }
  });

  it('MCP tool definitions are GENERATED from the registry (no drift possible)', () => {
    expect(TELEDOM_V12_TOOLS.length).toBe(100);
    expect(TELEDOM_V12_TOOLS.map((t) => t.name)).toEqual(CAPABILITY_REGISTRY.map((c) => c.id));
    for (const tool of TELEDOM_V12_TOOLS) {
      const cap = capabilityById(tool.name)!;
      expect(tool.description).toContain(cap.securityClass);
      expect(tool.inputSchema.required ?? []).toEqual(cap.inputSchema.required ?? []);
    }
  });

  it('the 10 flagship v4 capabilities are all present', () => {
    for (const flagship of ['td_investigate', 'td_temporal_join', 'td_temporal_branch', 'td_evidence_proof', 'td_cause_graph', 'td_cause_counterfactual', 'td_component_lifecycle', 'td_resolve_target', 'td_simulate_network', 'td_incident_close']) {
      expect(TD_TOOL_NAMES.has(flagship)).toBe(true);
    }
  });

  it('compatibility matrix is generated with full totals', () => {
    const matrix = generateCompatibilityMatrix();
    expect(matrix.totals.td).toBe(100);
    expect(matrix.totals.surfaces.total).toBe(306);
    expect(matrix.rows.length).toBe(100);
    expect(matrix.rows.every((r) => r.schemaParity === 'full')).toBe(true);
  });

  it('version history documents the v4→v12 progression', () => {
    expect(VERSION_HISTORY).toHaveLength(9);
    expect(VERSION_HISTORY[0].version).toBe('4.0.0');
    expect(VERSION_HISTORY[8].version).toBe('12.0.0');
    expect(TELEDOM_VERSION.version).toBe('12.0.0');
  });
});

describe('v12 MCP integration — the full tool surface', () => {
  it('FORENSIC_MCP_TOOLS includes 306 tools (206 legacy + 100 td_*) with no collisions', () => {
    expect(FORENSIC_MCP_TOOLS.length).toBe(306);
    const names = FORENSIC_MCP_TOOLS.map((t) => t.name);
    const dupes = names.filter((n, i) => names.indexOf(n) !== i);
    expect(dupes).toEqual([]);
    expect(names.filter((n) => n.startsWith('td_'))).toHaveLength(100);
    expect(names.filter((n) => n.startsWith('dt_'))).toHaveLength(54);
    expect(names.filter((n) => n.startsWith('fx_'))).toHaveLength(31);
  });

  it('td_* dispatch returns structured results with honest statuses', async () => {
    const handler = new IntelligenceToolsHandler();
    expect(handler.knows('td_health_snapshot')).toBe(true);
    expect(handler.knows('list_sessions')).toBe(false);

    // Record a causal chain through the platform (mesh + store + temporal).
    let parent: string | undefined;
    for (const [source, type] of [['user', 'click'], ['network', 'request-failed'], ['dom', 'node-removed']] as const) {
      const ev = handler.platform.record('test-1', source as any, type, { test: true }, { entityIds: ['entity:btn'], causalParentIds: parent ? [parent] : [] });
      parent = ev.eventId;
    }

    const health = await handler.handleToolCall('td_health_snapshot', {});
    const healthBody = JSON.parse((health.content[0] as any).text as string);
    expect(healthBody.status).toBe('PASS');
    expect(healthBody.health.overall).toBe('HEALTHY');
    expect(healthBody.platform.version).toBe('12.0.0');

    const query = await handler.handleToolCall('td_temporal_query', { sessionId: 'test-1' });
    const queryBody = JSON.parse((query.content[0] as any).text as string);
    expect(queryBody.status).toBe('PASS');
    expect(queryBody.matched).toBe(3);

    const diff = await handler.handleToolCall('td_temporal_diff', { sessionId: 'test-1', t1: 100, t2: 140 });
    expect(JSON.parse((diff.content[0] as any).text as string).status).toBe('PASS');

    const trace = await handler.handleToolCall('td_temporal_trace_entity', { sessionId: 'test-1', entityId: 'entity:btn' });
    const traceBody = JSON.parse((trace.content[0] as any).text as string);
    expect(traceBody.status).toBe('PASS');
    expect(traceBody.events).toHaveLength(3);

    const hypotheses = await handler.handleToolCall('td_diagnose', { sessionId: 'test-1', symptom: 'node-removed' });
    const hypBody = JSON.parse((hypotheses.content[0] as any).text as string);
    expect(hypBody.status).toBe('PASS');
    expect(hypBody.hypotheses.length).toBeGreaterThan(0);

    const investigation = await handler.handleToolCall('td_investigate', {
      sessionId: 'test-1',
      objective: 'Why does the button disappear?',
      symptomPattern: 'node-removed',
    });
    const invBody = JSON.parse((investigation.content[0] as any).text as string);
    expect(invBody.status).toBe('PASS');
    expect(invBody.investigation.status).toBe('RESOLVED');
    expect(invBody.investigation.rootCause).toContain('click');
    expect(invBody.investigation.verification).toBe('PASS');
    expect(invBody.investigation.proofId).toBeTruthy();

    // UNSUPPORTED honesty: live-adapter tools.
    const apply = await handler.handleToolCall('td_safe_apply', { plan: { operation: 'set-attribute' } });
    const applyBody = JSON.parse((apply.content[0] as any).text as string);
    expect(['UNSUPPORTED', 'DEGRADED']).toContain(applyBody.status);

    // Unknown tool name.
    const unknown = await handler.handleToolCall('td_nonexistent_tool', {});
    const unknownBody = JSON.parse((unknown.content[0] as any).text as string);
    expect(unknownBody.status).toBe('UNSUPPORTED');
  });

  it('every one of the 100 td_* tools dispatches without crashing (smoke matrix)', async () => {
    const handler = new IntelligenceToolsHandler();
    // Seed a REAL causal chain session so intelligence tools have substance.
    const chain: [string, string][] = [
      ['user', 'click-submit'], ['network', 'request-failed'],
      ['runtime', 'state-update'], ['dom', 'ancestor-rerender'], ['dom', 'node-removed'],
    ];
    let parent: string | undefined;
    for (const [source, type] of chain) {
      const ev = handler.platform.record('smoke', source as any, type, { smoke: true }, { entityIds: ['entity:btn'], causalParentIds: parent ? [parent] : [] });
      parent = ev.eventId;
    }
    const results: { tool: string; status: string }[] = [];
    for (const tool of TELEDOM_V12_TOOLS) {
      const args = smokeArgs(tool.name);
      const res = await handler.handleToolCall(tool.name, args);
      const body = JSON.parse((res.content[0] as any).text as string);
      results.push({ tool: tool.name, status: body.status });
      expect(['PASS', 'FAIL', 'INCONCLUSIVE', 'UNSUPPORTED', 'DEGRADED', 'PARTIAL']).toContain(body.status);
      expect(body.status).not.toBe('');
    }
    // Honest status taxonomy: every tool returned a valid status without
    // crashing. Live-adapter-only tools may be UNSUPPORTED/DEGRADED/PARTIAL.
    const unsupported = results.filter((r) => r.status === 'UNSUPPORTED').length;
    expect(unsupported).toBeLessThanOrEqual(10); // live-adapter-only tools
    // The core intelligence loop must be functional (PASS) with real data.
    for (const flagship of [
      'td_health_snapshot', 'td_temporal_query', 'td_temporal_diff',
      'td_temporal_trace_entity', 'td_temporal_join', 'td_cause_trace',
      'td_cause_rank', 'td_cause_graph', 'td_diagnose', 'td_investigate',
      'td_cause_counterfactual', 'td_security_posture', 'td_evidence_proof',
      'td_run_workflow', 'td_run_playbook', 'td_memory', 'td_context_optimize',
    ]) {
      const r = results.find((x) => x.tool === flagship);
      expect(r, flagship).toBeDefined();
      expect(r!.status, `${flagship} should be functional`).toBe('PASS');
    }
  }, 120_000);
});

function smokeArgs(tool: string): Record<string, any> {
  const base: Record<string, Record<string, any>> = {
    td_temporal_query: { sessionId: 'smoke' },
    td_temporal_seek: { sessionId: 'smoke', logicalTime: 10 },
    td_temporal_window: { sessionId: 'smoke', aroundLogical: 10 },
    td_temporal_diff: { sessionId: 'smoke', t1: 0, t2: 10 },
    td_temporal_trace_entity: { sessionId: 'smoke', entityId: 'entity:btn' },
    td_temporal_first_change: { sessionId: 'smoke' },
    td_temporal_last_stable: { sessionId: 'smoke', dimension: 'dom', before: 100 },
    td_temporal_join: { sessionId: 'smoke', sources: ['dom'] },
    td_temporal_branch: { sessionId: 'smoke', forkAtLogical: 5, mutations: [{ kind: 'suppress-mutation', targetSequence: 1, reason: 'r' }] },
    td_temporal_rewind: { sessionId: 'smoke', logicalTime: 10 },
    td_evidence_capture: { incidentId: 'i1', kind: 'Finding', label: 'test finding' },
    td_evidence_search: { text: 'test' },
    td_evidence_chain: { claim: 'c', evidenceRefs: ['e1'] },
    td_evidence_confidence: { provenance: [{ origin: 'x', quality: 'derived', evidenceRefs: [] }], corroboration: 1 },
    td_evidence_verify: { claim: 'c', mustHold: ['x'] },
    td_evidence_hash: { artifact: { a: 1 } },
    td_evidence_compare: { packageA: { a: 1 }, packageB: { a: 2 } },
    td_evidence_export: { incidentId: 'none' },
    td_evidence_timeline: { incidentId: 'none' },
    td_evidence_proof: { claims: [{ statement: 's', evidenceNodeIds: [], confidence: 0.8 }], conclusion: 'c', verificationStatus: 'PASS' },
    td_cause_trace: { sessionId: 'smoke' },
    td_cause_graph: { sessionId: 'smoke' },
    td_cause_rank: { sessionId: 'smoke' },
    td_cause_explain: { finding: 'f', evidenceRefs: ['e1'] },
    td_cause_correlate: { sessionId: 'smoke', sources: ['dom'] },
    td_cause_breakpoint: { branchId: 'nope', sessionId: 'smoke' },
    td_cause_impact: { eventId: 'nope', sessionId: 'smoke' },
    td_cause_dependency: { entityId: 'e', sessionId: 'smoke' },
    td_cause_counterfactual: { sessionId: 'smoke', targetSequence: 2, kind: 'suppress-event', reason: 'r', symptomPattern: 'node-removed' },
    td_cause_verify: { sessionId: 'smoke', hypothesisId: 'nope' },
    td_semantic_page: { sessionId: 'smoke' },
    td_semantic_element: { selector: '#x' },
    td_component_map: { sessionId: 'smoke' },
    td_component_lifecycle: { componentId: '#comp', sessionId: 'smoke' },
    td_component_dependencies: { componentId: 'c1' },
    td_component_state: { componentId: 'c1', sessionId: 'smoke' },
    td_accessibility_model: { sessionId: 'smoke' },
    td_visual_semantics: { sessionId: 'smoke' },
    td_page_intent: { sessionId: 'smoke' },
    td_state_summary: { intent: 'page state' },
    td_resolve_target: { description: 'login button' },
    td_rank_targets: { candidates: [], query: {} },
    td_target_recover: { failedSelector: '#x', lastKnown: {} },
    td_target_verify: { selector: '#login', intent: 'login' },
    td_target_history: { entityId: 'e' },
    td_target_contract: { query: {}, resolution: {} },
    td_interaction_plan: { intent: 'click login' },
    td_interaction_execute: { planId: 'p1' },
    td_interaction_observe: { interactionRef: 'i1' },
    td_interaction_repair: { failedPlanId: 'p1', reason: 'r' },
    td_simulate_change: { sessionId: 'smoke', change: { x: 1 } },
    td_simulate_network: { sessionId: 'smoke', targetSequence: 1, responsePatch: { status: 200 } },
    td_simulate_dom: { sessionId: 'smoke', mutations: [{ op: 'remove' }] },
    td_simulate_style: { sessionId: 'smoke', targetSequence: 1, stylePatch: { color: 'red' } },
    td_simulate_runtime: { sessionId: 'smoke', condition: { state: 'x' } },
    td_simulate_failure: { sessionId: 'smoke', failureKind: 'renderer-crash' },
    td_compare_branches: { branchIds: [], sessionId: 'smoke' },
    td_predict_impact: { change: { op: 'x' }, scope: { selectors: ['#a'] } },
    td_safe_apply: { plan: { operation: 'set-attribute' }, scope: {} },
    td_branch_merge: { branchId: 'nope', sessionId: 'smoke' },
    td_health_snapshot: {},
    td_recover_browser: { failureKind: 'browser-crash' },
    td_recover_page: { pageId: 'p1' },
    td_recover_bridge: {},
    td_reconcile_tabs: {},
    td_reconcile_events: { sessionId: 'smoke' },
    td_resource_guard: { usage: { events: 100 } },
    td_leak_watch: { windowMs: 1000 },
    td_failure_containment: { capabilityId: 'td_x' },
    td_session_repair: { sessionId: 'smoke' },
    td_security_posture: {},
    td_security_surface: {},
    td_security_flow: { sessionId: 'smoke' },
    td_dom_xss_audit: {},
    td_injection_surface_audit: {},
    td_auth_session_audit: {},
    td_cookie_storage_audit: {},
    td_csp_security_audit: {},
    td_cors_security_audit: {},
    td_security_regression: { beforeRef: 'a', afterRef: 'b' },
    td_performance_profile: { sessionId: 'smoke' },
    td_performance_budget: { sessionId: 'smoke' },
    td_long_task_trace: { sessionId: 'smoke' },
    td_layout_causality: { sessionId: 'smoke' },
    td_memory_profile: { sessionId: 'smoke' },
    td_memory_leak_trace: { sessionId: 'smoke' },
    td_retention_graph: { sessionId: 'smoke' },
    td_visual_regression: { baselineRef: 'a', currentRef: 'b' },
    td_visual_causality: { region: { x: 0, y: 0 }, sessionId: 'smoke' },
    td_render_stability: { sessionId: 'smoke' },
    td_investigate: { sessionId: 'smoke', objective: 'why did the button disappear', symptomPattern: 'node-removed' },
    td_reproduce_incident: { incidentId: 'nope' },
    td_diagnose: { symptom: 'node-removed', sessionId: 'smoke' },
    td_plan_fix: { incidentId: 'nope' },
    td_validate_fix: { incidentId: 'nope', fixRef: 'f' },
    td_run_workflow: { workflow: [{ id: 's1', tool: 'td_evidence_hash', args: { artifact: { a: 1 } } }] },
    td_run_playbook: { playbookId: 'security-passive' },
    td_memory: { action: 'query' },
    td_context_optimize: { intent: 'status' },
    td_incident_close: { incidentId: 'nope' },
  };
  return base[tool] ?? {};
}

describe('v12 golden incident suite (1000+ deterministic incidents)', () => {
  it('generates 1000+ scenarios across 24 categories', () => {
    const suite = generateGoldenSuite(1020);
    expect(suite.length).toBeGreaterThanOrEqual(1020);
    const categories = new Set(suite.map((s) => s.category));
    expect(categories.size).toBe(24);
    // Deterministic: same seed → identical stream.
    const a = generateGoldenSuite(24)[0];
    const b = generateGoldenSuite(24)[0];
    expect(JSON.stringify(a.events.map((e) => e.type))).toBe(JSON.stringify(b.events.map((e) => e.type)));
  });

  it('runGoldenSuite: ICR / EC / RF metrics + near-zero false success', () => {
    const suite = generateGoldenSuite(240); // 10 per category for CI speed
    const report = runGoldenSuite(suite);
    expect(report.total).toBe(240);
    // The causal engine must resolve the RESOLVABLE deterministic chains
    // (INCONCLUSIVE-expected scenarios are honest non-resolutions by design).
    expect(report.metrics.investigationCompletionRate).toBeGreaterThan(0.85);
    expect(report.metrics.replayFidelity).toBeGreaterThan(0.8);
    expect(report.metrics.rootCauseAccuracy).toBeGreaterThan(0.8);
    // False success (claimed PASS where INCONCLUSIVE expected) must be tiny.
    expect(report.metrics.falseSuccessRate).toBeLessThan(0.08);
  }, 120_000);
});

describe('v12 chaos engineering — failure is contained, observed, explained, recoverable', () => {
  it('all 15 chaos injections are contained and observed', () => {
    const report = runChaosSuite();
    expect(report.totalInjections).toBe(16);
    expect(report.contained).toBe(16);
    expect(report.observed).toBe(16);
    expect(report.explained).toBe(16);
    expect(report.recoverable).toBe(16);
    expect(report.pass).toBe(true);
    for (const outcome of report.outcomes) {
      expect(outcome.detail.length).toBeGreaterThan(10);
    }
  });
});
