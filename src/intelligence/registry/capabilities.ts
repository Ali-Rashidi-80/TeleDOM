/**
 * TeleDOM v4 Registry — Capability Registry (SINGLE SOURCE OF TRUTH).
 *
 * Version, tool count, schema, documentation, test mapping, compatibility
 * and capability metadata are generated from HERE — never manually
 * duplicated across files. Every capability declares: id, version,
 * category, inputSchema, outputSchema, securityClass, stateRequirements,
 * resourceCost, supportedModes, dependencies, tests, docs, compatibility,
 * experimental.
 *
 * The 100 td_* tools are the v4 intelligence surface, organized in 10
 * families of 10. Internally they compose kernel/temporal/evidence/
 * causality/... primitives through the intent router — never 100 isolated
 * handlers.
 */

export type CapabilityCategory =
  | 'temporal-intelligence' | 'evidence-provenance' | 'causal-intelligence'
  | 'semantic-component' | 'targeting-interaction' | 'counterfactual-simulation'
  | 'reliability-recovery' | 'security-intelligence' | 'performance-memory-visual'
  | 'investigation-orchestration'
  // v4.1 — Agent-Owned Workflow Runtime families
  | 'browser-primitives' | 'workflow-runtime' | 'agent-owned-tooling';

export type SecurityClass = 'read-only' | 'read-mostly' | 'side-effects' | 'reversible' | 'dangerous' | 'policy-gated';

export type ResourceCost = 'minimal' | 'low' | 'medium' | 'high';

export interface Capability {
  id: string;
  version: string;
  category: CapabilityCategory;
  description: string;
  inputSchema: { type: 'object'; properties: Record<string, { type: string; description: string; required?: boolean; enum?: string[] }>; required?: string[] };
  outputSchema: { type: 'object'; description: string };
  securityClass: SecurityClass;
  stateRequirements: string[];
  resourceCost: ResourceCost;
  supportedModes: ('live' | 'recorded' | 'simulation')[];
  dependencies: string[];
  tests: string[];
  docs: string;
  compatibility: { minKernelVersion: string; notes?: string };
  experimental: boolean;
}

const TD_TOOLS_SPEC: {
  id: string;
  cat: CapabilityCategory;
  desc: string;
  props: Record<string, { type: string; description: string; required?: boolean; enum?: string[] }>;
  required?: string[];
  security?: SecurityClass;
  cost?: ResourceCost;
  modes?: Capability['supportedModes'];
  experimental?: boolean;
  tests?: string[];
}[] = [
  // ================= A. Temporal Intelligence (10) =================
  { id: 'td_temporal_query', cat: 'temporal-intelligence', desc: 'Query any state/entity across a time range (State(T), State(T1..T2)).', props: { sessionId: { type: 'string', description: 'Session to query', required: true }, fromLogical: { type: 'number', description: 'Range start (logical ms)' }, toLogical: { type: 'number', description: 'Range end (logical ms)' }, entityIds: { type: 'array', description: 'Restrict to entities' }, dimensions: { type: 'array', description: 'State dimensions to include' } }, required: ['sessionId'], tests: ['tests/intelligence/temporal.test.ts'] },
  { id: 'td_temporal_seek', cat: 'temporal-intelligence', desc: 'Seek to the nearest valid state for an event/time.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, logicalTime: { type: 'number', description: 'Target logical time', required: true } }, required: ['sessionId', 'logicalTime'] },
  { id: 'td_temporal_window', cat: 'temporal-intelligence', desc: 'Return a compact before/target/after state window around an event.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, aroundLogical: { type: 'number', description: 'Center logical time', required: true }, radiusMs: { type: 'number', description: 'Window radius in ms (default 250)' } }, required: ['sessionId', 'aroundLogical'] },
  { id: 'td_temporal_diff', cat: 'temporal-intelligence', desc: 'Diff(T1,T2): compare two arbitrary points in time across all state dimensions.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, t1: { type: 'number', description: 'First logical time', required: true }, t2: { type: 'number', description: 'Second logical time', required: true } }, required: ['sessionId', 't1', 't2'] },
  { id: 'td_temporal_trace_entity', cat: 'temporal-intelligence', desc: 'Trace one entity through its full lifetime (every touching event).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, entityId: { type: 'string', description: 'Entity to trace', required: true } }, required: ['sessionId', 'entityId'] },
  { id: 'td_temporal_first_change', cat: 'temporal-intelligence', desc: 'Find the first event matching a predicate (e.g. first invalid state).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, source: { type: 'string', description: 'Event source filter' }, typePattern: { type: 'string', description: 'Type regex filter' } }, required: ['sessionId'] },
  { id: 'td_temporal_last_stable', cat: 'temporal-intelligence', desc: 'Find the last state in which a dimension was stable before a time.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, dimension: { type: 'string', description: 'State dimension', required: true }, before: { type: 'number', description: 'Search horizon (logical ms)', required: true }, settleMs: { type: 'number', description: 'Quiet period that counts as stable (default 250)' } }, required: ['sessionId', 'dimension', 'before'] },
  { id: 'td_temporal_join', cat: 'temporal-intelligence', desc: 'Join DOM/runtime/network/visual/security events inside temporal constraints (Join(Signals)).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, sources: { type: 'array', description: 'Signal sources to join', required: true }, withinMs: { type: 'number', description: 'Cluster window (default 250)' }, aroundEntityId: { type: 'string', description: 'Optional entity scope' } }, required: ['sessionId', 'sources'] },
  { id: 'td_temporal_branch', cat: 'temporal-intelligence', desc: 'Branch(T): fork a historical state into a simulation branch (never overwrites reality).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, forkAtLogical: { type: 'number', description: 'Fork point', required: true }, mutations: { type: 'array', description: 'Branch mutations (kind, targetSequence, patch, reason)', required: true } }, security: 'reversible', required: ['sessionId', 'forkAtLogical', 'mutations'] },
  { id: 'td_temporal_rewind', cat: 'temporal-intelligence', desc: 'Reconstruct and activate a safe inspection state (read-only rewind).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, logicalTime: { type: 'number', description: 'Target time', required: true } }, required: ['sessionId', 'logicalTime'] },

  // ================= B. Evidence & Provenance (10) =================
  { id: 'td_evidence_capture', cat: 'evidence-provenance', desc: 'Capture a typed evidence bundle for the current investigation.', props: { incidentId: { type: 'string', description: 'Incident to attach evidence to', required: true }, kind: { type: 'string', description: 'Evidence node type', required: true }, label: { type: 'string', description: 'Human label', required: true }, payload: { type: 'object', description: 'Evidence payload' } }, required: ['incidentId', 'kind', 'label'] },
  { id: 'td_evidence_search', cat: 'evidence-provenance', desc: 'Search evidence semantically and structurally.', props: { sessionId: { type: 'string', description: 'Session scope' }, text: { type: 'string', description: 'Text query' }, types: { type: 'array', description: 'Node type filter' }, limit: { type: 'number', description: 'Max results' } } },
  { id: 'td_evidence_chain', cat: 'evidence-provenance', desc: 'Build the provenance chain for a claim (claim → evidence → verification).', props: { claim: { type: 'string', description: 'The claim to ground', required: true }, evidenceRefs: { type: 'array', description: 'Candidate evidence refs', required: true } }, required: ['claim', 'evidenceRefs'] },
  { id: 'td_evidence_confidence', cat: 'evidence-provenance', desc: 'Recalculate confidence using source quality and corroboration.', props: { provenance: { type: 'array', description: 'Provenance records', required: true }, corroboration: { type: 'number', description: 'Independent corroborating sources', required: true }, verified: { type: 'boolean', description: 'Verified by contract?' }, contradicted: { type: 'boolean', description: 'Counterevidence observed?' } }, required: ['provenance', 'corroboration'] },
  { id: 'td_evidence_verify', cat: 'evidence-provenance', desc: 'Verify a claim against current or replayed state.', props: { claim: { type: 'string', description: 'Claim statement', required: true }, mustHold: { type: 'array', description: 'Postconditions that must hold', required: true }, mustNotHold: { type: 'array', description: 'Conditions that must not hold' }, evidenceRequired: { type: 'array', description: 'Required evidence refs' } }, required: ['claim', 'mustHold'] },
  { id: 'td_evidence_hash', cat: 'evidence-provenance', desc: 'Hash a state/evidence artifact and attach integrity metadata.', props: { artifact: { type: 'object', description: 'Artifact to hash', required: true } }, required: ['artifact'] },
  { id: 'td_evidence_compare', cat: 'evidence-provenance', desc: 'Compare two evidence packages (structural + provenance diff).', props: { packageA: { type: 'object', description: 'First package', required: true }, packageB: { type: 'object', description: 'Second package', required: true } }, required: ['packageA', 'packageB'] },
  { id: 'td_evidence_export', cat: 'evidence-provenance', desc: 'Export a portable forensic evidence package (.tdom).', props: { incidentId: { type: 'string', description: 'Incident to export', required: true }, compress: { type: 'boolean', description: 'Gzip the artifact' }, outputPath: { type: 'string', description: 'Optional file path' } }, required: ['incidentId'] },
  { id: 'td_evidence_timeline', cat: 'evidence-provenance', desc: 'Produce a human-readable evidence timeline for an incident.', props: { incidentId: { type: 'string', description: 'Incident id', required: true } }, required: ['incidentId'] },
  { id: 'td_evidence_proof', cat: 'evidence-provenance', desc: 'Generate a machine-verifiable proof record for a finding.', props: { claims: { type: 'array', description: 'Claims with evidence refs', required: true }, steps: { type: 'array', description: 'Reasoning steps' }, conclusion: { type: 'string', description: 'Conclusion statement', required: true }, verificationStatus: { type: 'string', description: 'PASS/FAIL/INCONCLUSIVE', required: true } }, required: ['claims', 'conclusion', 'verificationStatus'] },

  // ================= C. Causal Intelligence (10) =================
  { id: 'td_cause_trace', cat: 'causal-intelligence', desc: 'Trace likely causes of a selected symptom (root-cause chain).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, symptomEventId: { type: 'string', description: 'Symptom event', required: true }, windowMs: { type: 'number', description: 'Correlation window (default 250)' } }, required: ['sessionId', 'symptomEventId'] },
  { id: 'td_cause_graph', cat: 'causal-intelligence', desc: 'Build a causal graph around an incident (typed nodes + provenance edges).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, windowMs: { type: 'number', description: 'Correlation window' } }, required: ['sessionId'] },
  { id: 'td_cause_rank', cat: 'causal-intelligence', desc: 'Rank competing root-cause hypotheses by evidence strength.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, symptomEventId: { type: 'string', description: 'Symptom event', required: true } }, required: ['sessionId', 'symptomEventId'] },
  { id: 'td_cause_explain', cat: 'causal-intelligence', desc: 'Explain a finding from evidence — claim + chain + confidence + alternatives.', props: { finding: { type: 'string', description: 'Finding to explain', required: true }, evidenceRefs: { type: 'array', description: 'Evidence to ground the explanation', required: true } }, required: ['finding', 'evidenceRefs'] },
  { id: 'td_cause_correlate', cat: 'causal-intelligence', desc: 'Correlate independent signals into candidate causal chains.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, sources: { type: 'array', description: 'Sources to correlate', required: true }, withinMs: { type: 'number', description: 'Window (default 250)' } }, required: ['sessionId', 'sources'] },
  { id: 'td_cause_breakpoint', cat: 'causal-intelligence', desc: 'Find the earliest causal divergence between two streams (reality vs branch).', props: { branchId: { type: 'string', description: 'Branch to compare', required: true }, sessionId: { type: 'string', description: 'Session id', required: true } }, required: ['branchId', 'sessionId'] },
  { id: 'td_cause_impact', cat: 'causal-intelligence', desc: 'Estimate downstream impact of a cause (affected entities/components).', props: { eventId: { type: 'string', description: 'Cause event', required: true }, sessionId: { type: 'string', description: 'Session id', required: true } }, required: ['eventId', 'sessionId'] },
  { id: 'td_cause_dependency', cat: 'causal-intelligence', desc: 'Trace dependencies that could produce a state (dependency chains).', props: { entityId: { type: 'string', description: 'Entity to analyze', required: true }, sessionId: { type: 'string', description: 'Session id', required: true } }, required: ['entityId', 'sessionId'] },
  { id: 'td_cause_counterfactual', cat: 'causal-intelligence', desc: 'Test whether removing a candidate cause changes the outcome (branch + replay + compare).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, targetSequence: { type: 'number', description: 'Event sequence to suppress/modify', required: true }, kind: { type: 'string', description: 'suppress-event | modify-response | modify-state | modify-style | alter-timing', required: true }, patch: { type: 'object', description: 'Mutation payload' }, reason: { type: 'string', description: 'Why this counterfactual', required: true } }, security: 'reversible', required: ['sessionId', 'targetSequence', 'kind', 'reason'] },
  { id: 'td_cause_verify', cat: 'causal-intelligence', desc: 'Verify a root-cause hypothesis through replay/observation (never guess).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, hypothesisId: { type: 'string', description: 'Hypothesis to verify', required: true } }, required: ['sessionId', 'hypothesisId'] },

  // ================= D. Semantic & Component Intelligence (10) =================
  { id: 'td_semantic_page', cat: 'semantic-component', desc: 'Build a compact semantic model of the page (roles, intents, stability).', props: { sessionId: { type: 'string', description: 'Session id' }, includeHidden: { type: 'boolean', description: 'Include hidden elements' } } },
  { id: 'td_semantic_element', cat: 'semantic-component', desc: "Explain an element's role, intent and state (semantic identity).", props: { selector: { type: 'string', description: 'Element selector', required: true } }, required: ['selector'] },
  { id: 'td_component_map', cat: 'semantic-component', desc: 'Infer component boundaries and ownership (React/Vue/Svelte/custom/microfrontend).', props: { sessionId: { type: 'string', description: 'Session id' } } },
  { id: 'td_component_lifecycle', cat: 'semantic-component', desc: 'Trace mount/update/unmount behavior of a component.', props: { componentId: { type: 'string', description: 'Component id or root selector', required: true }, sessionId: { type: 'string', description: 'Session id', required: true } }, required: ['componentId', 'sessionId'] },
  { id: 'td_component_dependencies', cat: 'semantic-component', desc: 'Map component dependencies and affected nodes.', props: { componentId: { type: 'string', description: 'Component id', required: true } }, required: ['componentId'] },
  { id: 'td_component_state', cat: 'semantic-component', desc: 'Reconstruct component-facing state signals.', props: { componentId: { type: 'string', description: 'Component id', required: true }, sessionId: { type: 'string', description: 'Session id' } }, required: ['componentId'] },
  { id: 'td_accessibility_model', cat: 'semantic-component', desc: 'Build a normalized accessibility model (role/name/state/relationships/focus).', props: { sessionId: { type: 'string', description: 'Session id' } } },
  { id: 'td_visual_semantics', cat: 'semantic-component', desc: 'Associate visual regions with semantic entities.', props: { sessionId: { type: 'string', description: 'Session id' }, regions: { type: 'array', description: 'Visual regions to associate' } } },
  { id: 'td_page_intent', cat: 'semantic-component', desc: 'Infer major page workflows and interaction zones.', props: { sessionId: { type: 'string', description: 'Session id' } } },
  { id: 'td_state_summary', cat: 'semantic-component', desc: 'Return a token-minimal state digest suitable for agents (L0/L1).', props: { intent: { type: 'string', description: 'The next decision the agent must make', required: true }, level: { type: 'string', description: 'L0|L1|L2|L3|L4' } }, required: ['intent'] },

  // ================= E. Targeting & Interaction Intelligence (10) =================
  { id: 'td_resolve_target', cat: 'targeting-interaction', desc: 'Resolve a natural-language or semantic target to a VERIFIED entity with confidence.', props: { description: { type: 'string', description: 'Natural-language target description' }, role: { type: 'string', description: 'Semantic role' }, text: { type: 'string', description: 'Text content' }, selector: { type: 'string', description: 'Seed selector' } }, required: [] },
  { id: 'td_rank_targets', cat: 'targeting-interaction', desc: 'Rank target candidates by historical, semantic and visual stability.', props: { candidates: { type: 'array', description: 'Candidate descriptors', required: true }, query: { type: 'object', description: 'Target query', required: true } }, required: ['candidates', 'query'] },
  { id: 'td_target_recover', cat: 'targeting-interaction', desc: 'Recover a target after selector/DOM changes (multi-signal recovery; refuses blind guesses).', props: { failedSelector: { type: 'string', description: 'The selector that failed', required: true }, lastKnown: { type: 'object', description: 'Last known target snapshot', required: true } }, required: ['failedSelector', 'lastKnown'] },
  { id: 'td_target_verify', cat: 'targeting-interaction', desc: 'Verify that the selected target matches the requested intent.', props: { selector: { type: 'string', description: 'Selected selector', required: true }, intent: { type: 'string', description: 'Requested intent', required: true } }, required: ['selector', 'intent'] },
  { id: 'td_target_history', cat: 'targeting-interaction', desc: 'Show how a target changed over time (identity versions).', props: { entityId: { type: 'string', description: 'Target entity', required: true } }, required: ['entityId'] },
  { id: 'td_target_contract', cat: 'targeting-interaction', desc: 'Create a durable target contract for future actions.', props: { query: { type: 'object', description: 'Target query', required: true }, resolution: { type: 'object', description: 'Resolution result', required: true } }, required: ['query', 'resolution'] },
  { id: 'td_interaction_plan', cat: 'targeting-interaction', desc: 'Generate a verified interaction plan from intent (target + steps + postconditions).', props: { intent: { type: 'string', description: 'What the interaction should achieve', required: true } }, required: ['intent'] },
  { id: 'td_interaction_execute', cat: 'targeting-interaction', desc: 'Execute an interaction plan with postconditions (transactional).', props: { planId: { type: 'string', description: 'Plan to execute', required: true } }, security: 'side-effects', required: ['planId'] },
  { id: 'td_interaction_observe', cat: 'targeting-interaction', desc: 'Observe effects of one interaction across state dimensions.', props: { interactionRef: { type: 'string', description: 'Executed interaction reference', required: true } }, required: ['interactionRef'] },
  { id: 'td_interaction_repair', cat: 'targeting-interaction', desc: 'Repair a failed interaction without restarting the whole task.', props: { failedPlanId: { type: 'string', description: 'Failed plan', required: true }, reason: { type: 'string', description: 'Failure reason', required: true } }, required: ['failedPlanId', 'reason'] },

  // ================= F. Counterfactual & Simulation Intelligence (10) =================
  { id: 'td_simulate_change', cat: 'counterfactual-simulation', desc: 'Simulate a proposed change without committing it (dry-run on a branch).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, change: { type: 'object', description: 'Change spec', required: true } }, security: 'read-only', required: ['sessionId', 'change'] },
  { id: 'td_simulate_network', cat: 'counterfactual-simulation', desc: 'Simulate alternate network responses (modify-response branch).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, targetSequence: { type: 'number', description: 'Network event to alter', required: true }, responsePatch: { type: 'object', description: 'Response override', required: true } }, required: ['sessionId', 'targetSequence', 'responsePatch'] },
  { id: 'td_simulate_dom', cat: 'counterfactual-simulation', desc: 'Simulate DOM mutations against a branch.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, mutations: { type: 'array', description: 'DOM mutations', required: true } }, required: ['sessionId', 'mutations'] },
  { id: 'td_simulate_style', cat: 'counterfactual-simulation', desc: 'Simulate style/CSS changes (modify-style branch).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, targetSequence: { type: 'number', description: 'Style event to alter', required: true }, stylePatch: { type: 'object', description: 'Style override', required: true } }, required: ['sessionId', 'targetSequence', 'stylePatch'] },
  { id: 'td_simulate_runtime', cat: 'counterfactual-simulation', desc: 'Simulate selected runtime conditions (state/event patches).', props: { sessionId: { type: 'string', description: 'Session id', required: true }, condition: { type: 'object', description: 'Runtime condition spec', required: true } }, required: ['sessionId', 'condition'] },
  { id: 'td_simulate_failure', cat: 'counterfactual-simulation', desc: 'Reproduce a controlled failure condition in an authorized environment.', props: { sessionId: { type: 'string', description: 'Session id', required: true }, failureKind: { type: 'string', description: 'Failure to inject', required: true } }, security: 'policy-gated', required: ['sessionId', 'failureKind'] },
  { id: 'td_compare_branches', cat: 'counterfactual-simulation', desc: 'Compare reality against one or more counterfactual branches.', props: { branchIds: { type: 'array', description: 'Branches to compare', required: true }, sessionId: { type: 'string', description: 'Session id', required: true } }, required: ['branchIds', 'sessionId'] },
  { id: 'td_predict_impact', cat: 'counterfactual-simulation', desc: 'Predict affected components/entities before a mutation (impact analysis).', props: { change: { type: 'object', description: 'Proposed change', required: true }, scope: { type: 'object', description: 'Scope hints' } }, required: ['change'] },
  { id: 'td_safe_apply', cat: 'counterfactual-simulation', desc: 'Apply a verified low-risk mutation transaction (PLAN→…→VERIFY→COMMIT/ROLLBACK).', props: { plan: { type: 'object', description: 'Mutation plan', required: true }, scope: { type: 'object', description: 'Allowed selectors/origins', required: true } }, security: 'side-effects', required: ['plan', 'scope'] },
  { id: 'td_branch_merge', cat: 'counterfactual-simulation', desc: 'Merge a successful simulation branch into a controlled mutation plan.', props: { branchId: { type: 'string', description: 'Verified branch', required: true }, sessionId: { type: 'string', description: 'Session id', required: true } }, security: 'reversible', required: ['branchId', 'sessionId'] },

  // ================= G. Reliability & Recovery (10) =================
  { id: 'td_health_snapshot', cat: 'reliability-recovery', desc: 'Return full TeleDOM runtime health + integrity state (self-diagnostics).', props: {} },
  { id: 'td_recover_browser', cat: 'reliability-recovery', desc: 'Recover from browser/renderer disconnect where possible (bounded retries).', props: { failureKind: { type: 'string', description: 'Failure kind', required: true } }, security: 'side-effects', required: ['failureKind'] },
  { id: 'td_recover_page', cat: 'reliability-recovery', desc: 'Re-resolve a dead or replaced page identity.', props: { pageId: { type: 'string', description: 'Page identity', required: true } }, required: ['pageId'] },
  { id: 'td_recover_bridge', cat: 'reliability-recovery', desc: 'Recover or reconnect the bridge without losing state.', props: {} },
  { id: 'td_reconcile_tabs', cat: 'reliability-recovery', desc: 'Reconcile page identity after tabs/windows change.', props: {} },
  { id: 'td_reconcile_events', cat: 'reliability-recovery', desc: 'Detect and repair event-order inconsistencies (mesh admission report).', props: { sessionId: { type: 'string', description: 'Session to reconcile', required: true } }, required: ['sessionId'] },
  { id: 'td_resource_guard', cat: 'reliability-recovery', desc: 'Enforce memory/CPU/concurrency budgets (guardian decision + mode).', props: { usage: { type: 'object', description: 'Reported usage' } } },
  { id: 'td_leak_watch', cat: 'reliability-recovery', desc: 'Continuously detect memory/resource growth patterns.', props: { windowMs: { type: 'number', description: 'Observation window' } } },
  { id: 'td_failure_containment', cat: 'reliability-recovery', desc: 'Isolate a broken capability without killing the whole session.', props: { capabilityId: { type: 'string', description: 'Capability to isolate', required: true } }, security: 'side-effects', required: ['capabilityId'] },
  { id: 'td_session_repair', cat: 'reliability-recovery', desc: 'Repair a partially corrupted session from checkpoints + evidence (hash-verified).', props: { sessionId: { type: 'string', description: 'Session to repair', required: true } }, required: ['sessionId'] },

  // ================= H. Security Intelligence (10) =================
  { id: 'td_security_posture', cat: 'security-intelligence', desc: 'Produce a browser-side security posture summary (passive, evidence-driven).', props: { sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_security_surface', cat: 'security-intelligence', desc: 'Map client-visible attack surfaces and trust boundaries.', props: { sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_security_flow', cat: 'security-intelligence', desc: 'Trace sensitive-data flows through the browser runtime.', props: { sessionId: { type: 'string', description: 'Session scope', required: true } }, required: ['sessionId'] },
  { id: 'td_dom_xss_audit', cat: 'security-intelligence', desc: 'Trace browser-side sources, transformations and dangerous sinks (passive).', props: { sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_injection_surface_audit', cat: 'security-intelligence', desc: 'Identify injection-sensitive DOM/runtime surfaces WITHOUT executing payloads.', props: { sessionId: { type: 'string', description: 'Session scope' } }, security: 'read-only' },
  { id: 'td_auth_session_audit', cat: 'security-intelligence', desc: 'Audit authentication/session behavior, expiry and state transitions.', props: { sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_cookie_storage_audit', cat: 'security-intelligence', desc: 'Audit cookie, storage and client-secret handling.', props: { sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_csp_security_audit', cat: 'security-intelligence', desc: 'Analyze CSP posture and runtime violations.', props: { sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_cors_security_audit', cat: 'security-intelligence', desc: 'Analyze observed CORS behavior against scoped trust expectations.', props: { sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_security_regression', cat: 'security-intelligence', desc: 'Compare security posture before/after a code or deployment change.', props: { beforeRef: { type: 'string', description: 'Baseline posture ref', required: true }, afterRef: { type: 'string', description: 'Current posture ref', required: true } }, required: ['beforeRef', 'afterRef'] },

  // ================= I. Performance, Memory & Visual Intelligence (10) =================
  { id: 'td_performance_profile', cat: 'performance-memory-visual', desc: 'Build an end-to-end performance profile (events → spans → vitals).', props: { sessionId: { type: 'string', description: 'Session scope' } }, cost: 'medium' },
  { id: 'td_performance_budget', cat: 'performance-memory-visual', desc: 'Evaluate the page against declared performance budgets.', props: { budgets: { type: 'object', description: 'Budget thresholds' }, sessionId: { type: 'string', description: 'Session scope' } } },
  { id: 'td_long_task_trace', cat: 'performance-memory-visual', desc: 'Trace long tasks to affected DOM/components.', props: { sessionId: { type: 'string', description: 'Session scope', required: true }, thresholdMs: { type: 'number', description: 'Long-task threshold (default 50)' } }, required: ['sessionId'] },
  { id: 'td_layout_causality', cat: 'performance-memory-visual', desc: 'Connect layout shifts to runtime/DOM/network causes.', props: { sessionId: { type: 'string', description: 'Session scope', required: true } }, required: ['sessionId'] },
  { id: 'td_memory_profile', cat: 'performance-memory-visual', desc: 'Build a memory profile for the browser/page/session.', props: { sessionId: { type: 'string', description: 'Session scope' } }, cost: 'medium' },
  { id: 'td_memory_leak_trace', cat: 'performance-memory-visual', desc: 'Find retained-growth patterns over time.', props: { sessionId: { type: 'string', description: 'Session scope', required: true }, windowMs: { type: 'number', description: 'Observation window' } }, required: ['sessionId'] },
  { id: 'td_retention_graph', cat: 'performance-memory-visual', desc: 'Build a retaining/reference graph for selected runtime objects where supported.', props: { sessionId: { type: 'string', description: 'Session scope' }, objectId: { type: 'string', description: 'Object to trace' } }, experimental: true },
  { id: 'td_visual_regression', cat: 'performance-memory-visual', desc: 'Compare visual state with DOM/runtime evidence.', props: { baselineRef: { type: 'string', description: 'Baseline visual ref' }, currentRef: { type: 'string', description: 'Current visual ref' } } },
  { id: 'td_visual_causality', cat: 'performance-memory-visual', desc: 'Explain why a region changed visually (visual↔DOM↔runtime correlation).', props: { region: { type: 'object', description: 'Visual region', required: true }, sessionId: { type: 'string', description: 'Session scope' } }, required: ['region'] },
  { id: 'td_render_stability', cat: 'performance-memory-visual', desc: 'Determine when the page reaches a stable render state.', props: { sessionId: { type: 'string', description: 'Session scope' }, settleMs: { type: 'number', description: 'Quiet period (default 250)' } } },

  // ================= J. Investigation, Orchestration & Agent OS (10) =================
  { id: 'td_investigate', cat: 'investigation-orchestration', desc: 'Run a complete autonomous investigation from a natural-language objective (resumable plan: scope→…→proof).', props: { objective: { type: 'string', description: 'Natural-language objective, e.g. "Why does checkout freeze after payment?"', required: true }, symptomPattern: { type: 'string', description: 'Regex identifying symptom events', required: true }, sessionId: { type: 'string', description: 'Session to investigate', required: true }, resumePlanId: { type: 'string', description: 'Resume an existing plan' } }, cost: 'high', required: ['objective', 'symptomPattern', 'sessionId'] },
  { id: 'td_reproduce_incident', cat: 'investigation-orchestration', desc: 'Reproduce a captured incident with controlled state.', props: { incidentId: { type: 'string', description: 'Incident to reproduce', required: true } }, security: 'side-effects', required: ['incidentId'] },
  { id: 'td_diagnose', cat: 'investigation-orchestration', desc: 'Generate ranked diagnostic hypotheses with evidence (no guesswork).', props: { symptom: { type: 'string', description: 'Symptom description', required: true }, sessionId: { type: 'string', description: 'Session scope', required: true } }, required: ['symptom', 'sessionId'] },
  { id: 'td_plan_fix', cat: 'investigation-orchestration', desc: 'Build a fix plan linked to observed causes and affected entities.', props: { incidentId: { type: 'string', description: 'Incident to fix', required: true } }, required: ['incidentId'] },
  { id: 'td_validate_fix', cat: 'investigation-orchestration', desc: 'Verify a proposed fix against the original failure (original FAIL → patched PASS).', props: { incidentId: { type: 'string', description: 'Incident being fixed', required: true }, fixRef: { type: 'string', description: 'Fix reference', required: true } }, security: 'side-effects', required: ['incidentId', 'fixRef'] },
  { id: 'td_run_workflow', cat: 'investigation-orchestration', desc: 'Execute a declarative multi-step workflow with recovery.', props: { workflow: { type: 'array', description: 'Workflow steps', required: true } }, required: ['workflow'] },
  { id: 'td_run_playbook', cat: 'investigation-orchestration', desc: 'Run a reusable investigation/security/performance playbook.', props: { playbookId: { type: 'string', description: 'Playbook to run', required: true } }, required: ['playbookId'] },
  { id: 'td_memory', cat: 'investigation-orchestration', desc: 'Store and retrieve durable project/session investigation knowledge (provenance + confidence).', props: { action: { type: 'string', description: 'store | query | validate', required: true }, kind: { type: 'string', description: 'Memory kind' }, statement: { type: 'string', description: 'Memory statement' }, query: { type: 'object', description: 'Query filter' } }, required: ['action'] },
  { id: 'td_context_optimize', cat: 'investigation-orchestration', desc: 'Select the smallest sufficient evidence/state set for the agent (L0–L4).', props: { intent: { type: 'string', description: 'The decision the agent must make next', required: true }, requestedLevel: { type: 'string', description: 'L0|L1|L2|L3|L4' } }, required: ['intent'] },
  { id: 'td_incident_close', cat: 'investigation-orchestration', desc: 'Close an incident ONLY after reproduction, remediation and verification criteria pass.', props: { incidentId: { type: 'string', description: 'Incident to close', required: true } }, security: 'policy-gated', required: ['incidentId'] },

  // ================= K. Browser Primitives (v4.1, 22) =================
  // Thin, stable facade over the live pipeline. Browser-first; no API ever
  // required. These are the verbs agents compose into their own workflows.
  { id: 'td_browser_navigate', cat: 'browser-primitives', desc: 'Navigate the browser to a URL (optionally in a new tab, then wait for DOM stability).', props: { url: { type: 'string', description: 'Target URL', required: true }, newTab: { type: 'boolean', description: 'Open in a new tab instead of the current one' }, waitForStable: { type: 'boolean', description: 'Wait for DOM stability after navigation (default true)' } }, required: ['url'], security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_browser_back', cat: 'browser-primitives', desc: 'Go back one step in browser history.', props: {}, security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_browser_forward', cat: 'browser-primitives', desc: 'Go forward one step in browser history.', props: {}, security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_browser_refresh', cat: 'browser-primitives', desc: 'Reload the current tab.', props: {}, security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_dom_inspect', cat: 'browser-primitives', desc: 'Observe the current page (structure, ready state, url, interactive inventory) — the agent\u2019s eyes.', props: { tabId: { type: 'number', description: 'Optional tab id' } }, modes: ['live', 'simulation'] },
  { id: 'td_dom_query', cat: 'browser-primitives', desc: 'Search the DOM by text/tag/attribute patterns with scored results — find elements without knowing selectors.', props: { query: { type: 'string', description: 'Search text (matched against text, tags, attributes)', required: true }, tag: { type: 'string', description: 'Restrict to tag name' }, attr: { type: 'string', description: 'Require attribute name' }, attrValue: { type: 'string', description: 'Attribute value filter' }, limit: { type: 'number', description: 'Max results (default 50)' } }, required: ['query'], modes: ['live', 'simulation'] },
  { id: 'td_dom_extract', cat: 'browser-primitives', desc: 'Extract structured data from any selector with per-field expressions (works on ANY site — no API needed).', props: { selector: { type: 'string', description: 'CSS selector for the collection', required: true }, fields: { type: 'object', description: 'Output name → JS expression per element (default: text/tag/attrs)' }, limit: { type: 'number', description: 'Max elements (default 100)' } }, required: ['selector'], modes: ['live', 'simulation'] },
  { id: 'td_dom_snapshot', cat: 'browser-primitives', desc: 'Capture the current DOM snapshot (html or structured json).', props: { format: { type: 'string', description: 'html | json', enum: ['html', 'json'] } }, modes: ['live', 'simulation'] },
  { id: 'td_target_find', cat: 'browser-primitives', desc: 'Find an element by selector, xpath or text and build the canonical multi-strategy TARGET object with confidence.', props: { selector: { type: 'string', description: 'CSS selector' }, xpath: { type: 'string', description: 'XPath expression' }, text: { type: 'string', description: 'Text to discover by intent' } }, modes: ['live', 'simulation'] },
  { id: 'td_target_check', cat: 'browser-primitives', desc: 'Verify a target is still resolvable at the required confidence — the cheap check that replaces full DOM re-analysis.', props: { selector: { type: 'string', description: 'CSS selector to verify', required: true }, minConfidence: { type: 'number', description: 'Minimum confidence threshold (default 0)' } }, required: ['selector'], modes: ['live', 'simulation'] },
  { id: 'td_target_describe', cat: 'browser-primitives', desc: 'Describe a target\u2019s identity: accessibility properties + structural fingerprint (what to store in target memory).', props: { selector: { type: 'string', description: 'CSS selector to describe', required: true } }, required: ['selector'], modes: ['live', 'simulation'] },
  { id: 'td_action_click', cat: 'browser-primitives', desc: 'Click an element with before/after state and effect measurement.', props: { selector: { type: 'string', description: 'CSS selector of the element', required: true } }, required: ['selector'], security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_action_type', cat: 'browser-primitives', desc: 'Type text into an input element.', props: { selector: { type: 'string', description: 'CSS selector of the input', required: true }, text: { type: 'string', description: 'Text to type', required: true } }, required: ['selector', 'text'], security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_action_select', cat: 'browser-primitives', desc: 'Select an option in a select element.', props: { selector: { type: 'string', description: 'CSS selector of the select', required: true }, value: { type: 'string', description: 'Value or label to select', required: true } }, required: ['selector', 'value'], security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_action_hover', cat: 'browser-primitives', desc: 'Hover over an element (menus, tooltips).', props: { selector: { type: 'string', description: 'CSS selector of the element', required: true } }, required: ['selector'], security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_action_press', cat: 'browser-primitives', desc: 'Press a keyboard key / combo page-wide (Enter, Escape, ctrl+s…).', props: { key: { type: 'string', description: 'Key or combo', required: true } }, required: ['key'], security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_action_scroll', cat: 'browser-primitives', desc: 'Scroll the page by deltas or scroll an element into view.', props: { x: { type: 'number', description: 'Horizontal pixel delta' }, y: { type: 'number', description: 'Vertical pixel delta' }, selector: { type: 'string', description: 'Scroll this element into view instead' } }, security: 'side-effects', modes: ['live', 'simulation'] },
  { id: 'td_wait', cat: 'browser-primitives', desc: 'Wait for a meaningful condition (dom_stable, selector_present/visible/absent, text_present, url_contains, element_count, readiness_state).', props: { kind: { type: 'string', description: 'Condition kind', required: true }, selector: { type: 'string', description: 'Selector for selector_* / element_count' }, text: { type: 'string', description: 'Text for text_present / url_contains' }, count: { type: 'number', description: 'Expected count' }, timeoutMs: { type: 'number', description: 'Timeout (default 5000ms)' } }, required: ['kind'], modes: ['live', 'simulation'] },
  { id: 'td_screenshot', cat: 'browser-primitives', desc: 'Capture a screenshot of the current page as visual evidence.', props: {}, modes: ['live'] },
  { id: 'td_execute_script', cat: 'browser-primitives', desc: 'Escape hatch: execute JavaScript in the page (Shadow DOM, canvas UI, virtualized lists — the agent decides the method).', props: { code: { type: 'string', description: 'JavaScript source (async/await supported; use return)', required: true }, timeoutMs: { type: 'number', description: 'Timeout (default 5000ms)' } }, required: ['code'], security: 'dangerous', modes: ['live', 'simulation'] },
  { id: 'td_network_inspect', cat: 'browser-primitives', desc: 'Escape hatch: read captured network requests (optionally filtered by URL substring).', props: { urlContains: { type: 'string', description: 'URL substring filter' }, limit: { type: 'number', description: 'Max entries (default 50)' } }, modes: ['live', 'simulation'] },
  { id: 'td_console_read', cat: 'browser-primitives', desc: 'Escape hatch: read captured console logs (optionally filtered by level).', props: { level: { type: 'string', description: 'Level filter: all | error | warning | log | info' } }, modes: ['live', 'simulation'] },

  // ================= L. Workflow Runtime (v4.1, 14) =================
  // Agent-owned workflows: TeleDOM stores, retrieves, executes (dumb),
  // records and replays. It NEVER designs, optimizes or repairs them.
  { id: 'td_workflow_save', cat: 'workflow-runtime', desc: 'Save an agent-authored workflow (envelope-validated, stored verbatim with full version history).', props: { workflow: { type: 'object', description: 'teledom.agent-workflow/1.0 object: { schema, name, version, steps[{id,tool,args,onError,retry,requireApproval,timeoutMs}], inputs, policy, metadata }', required: true } }, required: ['workflow'], security: 'reversible', tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_get', cat: 'workflow-runtime', desc: 'Get a saved workflow (current or a specific version).', props: { name: { type: 'string', description: 'Workflow name', required: true }, version: { type: 'string', description: 'Specific version (default: current)' } }, required: ['name'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_list', cat: 'workflow-runtime', desc: 'List saved workflows with versions, step counts and tags.', props: {}, tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_update', cat: 'workflow-runtime', desc: 'Update an existing workflow (agent edits the definition; version history preserved).', props: { workflow: { type: 'object', description: 'Updated workflow object', required: true } }, required: ['workflow'], security: 'reversible', tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_clone', cat: 'workflow-runtime', desc: 'Clone a workflow (optionally to a new name/version) — the agent\u2019s edit starting point.', props: { name: { type: 'string', description: 'Source workflow', required: true }, version: { type: 'string', description: 'Source version' }, as: { type: 'string', description: 'Clone name (default <name>_copy)' }, newVersion: { type: 'string', description: 'Clone version' }, description: { type: 'string', description: 'Clone description' } }, required: ['name'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_diff', cat: 'workflow-runtime', desc: 'Structural diff between two workflows or two versions of one workflow.', props: { name: { type: 'string', description: 'Workflow name' }, a: { type: 'string', description: 'Workflow A' }, aVersion: { type: 'string', description: 'Version A' }, b: { type: 'string', description: 'Workflow B' }, bVersion: { type: 'string', description: 'Version B' } }, tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_export', cat: 'workflow-runtime', desc: 'Export a workflow (+ version history) as a portable JSON package.', props: { name: { type: 'string', description: 'Workflow name', required: true } }, required: ['name'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_import', cat: 'workflow-runtime', desc: 'Import a workflow package from td_workflow_export (cross-project portability).', props: { export: { type: 'object', description: 'Export package object', required: true }, includeVersions: { type: 'boolean', description: 'Also import version history' } }, required: ['export'], security: 'reversible', tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_validate', cat: 'workflow-runtime', desc: 'Validate a workflow envelope (structure only — semantics are the agent\u2019s responsibility).', props: { workflow: { type: 'object', description: 'Workflow object to validate', required: true } }, required: ['workflow'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_run', cat: 'workflow-runtime', desc: 'DUMB execution: run a saved or inline workflow step-by-step through the full MCP pipeline with policy enforcement (approval gates, tool/domain allowlists, caps), template variables and a deterministic execution record.', props: { name: { type: 'string', description: 'Saved workflow name' }, version: { type: 'string', description: 'Version to run' }, workflow: { type: 'object', description: 'Inline workflow object' }, inputs: { type: 'object', description: 'Input values for {{inputs.*}} templates' }, approvedSteps: { type: 'array', description: 'Step ids approved after a BLOCKED run' }, dryRun: { type: 'boolean', description: 'Validate + plan only, do not execute' } }, security: 'policy-gated', cost: 'high', tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_runs', cat: 'workflow-runtime', desc: 'List deterministic execution records (optionally filtered by workflow).', props: { name: { type: 'string', description: 'Filter by workflow name' }, limit: { type: 'number', description: 'Max entries (default 50)' } }, tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_run_get', cat: 'workflow-runtime', desc: 'Get a full execution record: per-step status, args-as-executed, timing, metrics, errors.', props: { runId: { type: 'string', description: 'Run id', required: true } }, required: ['runId'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_replay', cat: 'workflow-runtime', desc: 'Deterministically re-execute a recorded run\u2019s steps verbatim (replay run #183 — why did it succeed last week?).', props: { runId: { type: 'string', description: 'Run to replay', required: true } }, required: ['runId'], security: 'policy-gated', cost: 'high', tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_workflow_delete', cat: 'workflow-runtime', desc: 'Delete a workflow and its version history (execution runs are kept as evidence).', props: { name: { type: 'string', description: 'Workflow name', required: true } }, required: ['name'], security: 'reversible', tests: ['tests/intelligence/workflow.test.ts'] },

  // ================= M. Agent-Owned Tooling (v4.1, 8) =================
  // The agent builds its own tools; TeleDOM stores them without
  // interpreting them. Learned targets kill repeated DOM analysis.
  { id: 'td_target_memory_save', cat: 'agent-owned-tooling', desc: 'Save a learned target (semantic identity + locators + confidence + history) so future runs skip DOM re-analysis.', props: { site: { type: 'string', description: 'Site scope (origin or *)', required: true }, semanticId: { type: 'string', description: 'Agent-chosen semantic id, e.g. comments_tab', required: true }, identity: { type: 'object', description: '{ role, accessibleName, component, route, text }' }, locators: { type: 'object', description: '{ aria, role, text, css, xpath, geometry }' }, confidence: { type: 'number', description: 'Current confidence 0..1 (default 0.8)' }, failedSelector: { type: 'string', description: 'Selector that failed (history)' }, notes: { type: 'string', description: 'Agent notes (how to re-verify, when to repair)' } }, required: ['site', 'semanticId'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_target_memory_get', cat: 'agent-owned-tooling', desc: 'Get a learned target by site + semanticId.', props: { site: { type: 'string', description: 'Site scope', required: true }, semanticId: { type: 'string', description: 'Semantic id', required: true } }, required: ['site', 'semanticId'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_target_memory_list', cat: 'agent-owned-tooling', desc: 'List learned targets (optionally filtered by site/semanticId).', props: { site: { type: 'string', description: 'Filter by site' }, semanticId: { type: 'string', description: 'Filter by semanticId' } }, tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_target_memory_delete', cat: 'agent-owned-tooling', desc: 'Delete a learned target.', props: { site: { type: 'string', description: 'Site scope', required: true }, semanticId: { type: 'string', description: 'Semantic id', required: true } }, required: ['site', 'semanticId'], security: 'reversible', tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_agent_artifact_save', cat: 'agent-owned-tooling', desc: 'Save an agent artifact (custom tool, script, policy, memory, note) — stored verbatim, never interpreted.', props: { kind: { type: 'string', description: 'custom-tool | script | policy | memory | note', required: true }, name: { type: 'string', description: 'Artifact name', required: true }, content: { type: 'object', description: 'Agent payload (any JSON)', required: true }, description: { type: 'string', description: 'Optional description' }, tags: { type: 'array', description: 'Optional tags' } }, required: ['kind', 'name', 'content'], security: 'reversible', tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_agent_artifact_get', cat: 'agent-owned-tooling', desc: 'Get an agent artifact by kind + name.', props: { kind: { type: 'string', description: 'Artifact kind', required: true }, name: { type: 'string', description: 'Artifact name', required: true } }, required: ['kind', 'name'], tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_agent_artifact_list', cat: 'agent-owned-tooling', desc: 'List agent artifacts (optionally by kind/tag).', props: { kind: { type: 'string', description: 'Filter by kind' }, tag: { type: 'string', description: 'Filter by tag' } }, tests: ['tests/intelligence/workflow.test.ts'] },
  { id: 'td_agent_artifact_delete', cat: 'agent-owned-tooling', desc: 'Delete an agent artifact.', props: { kind: { type: 'string', description: 'Artifact kind', required: true }, name: { type: 'string', description: 'Artifact name', required: true } }, required: ['kind', 'name'], security: 'reversible', tests: ['tests/intelligence/workflow.test.ts'] },
];

import { TELEDOM_VERSION } from '../version';

const CAPABILITY_VERSION = TELEDOM_VERSION.version;

/** The canonical registry — everything else is GENERATED from this. */
export const CAPABILITY_REGISTRY: Capability[] = TD_TOOLS_SPEC.map((spec) => ({
  id: spec.id,
  version: CAPABILITY_VERSION,
  category: spec.cat,
  description: spec.desc,
  inputSchema: {
    type: 'object' as const,
    properties: Object.fromEntries(
      Object.entries(spec.props).map(([name, p]) => [name, { type: p.type, description: p.description }]),
    ),
    ...(spec.required ? { required: spec.required } : {}),
  },
  outputSchema: { type: 'object' as const, description: `${spec.id} structured result with status, confidence, evidenceRefs and provenance` },
  securityClass: spec.security ?? 'read-only',
  stateRequirements: spec.security === 'side-effects' || spec.security === 'dangerous' ? ['live-browser'] : ['session-or-live'],
  resourceCost: spec.cost ?? 'low',
  supportedModes: spec.modes ?? ['live', 'recorded', 'simulation'],
  dependencies: internalDependencies(spec.id),
  tests: spec.tests ?? [testFor(spec.id)],
  docs: `docs/intelligence/CAPABILITIES.md#${spec.id}`,
  compatibility: { minKernelVersion: CAPABILITY_VERSION },
  experimental: spec.experimental ?? false,
}));

function internalDependencies(toolId: string): string[] {
  const map: Record<string, string[]> = {
    temporal: ['kernel:events', 'temporal:queries'],
    evidence: ['evidence:graph', 'evidence:confidence'],
    causal: ['causality:engine', 'evidence:graph'],
    semantic: ['semantics:semantic-engine'],
    target: ['targeting:target-intelligence'],
    simulate: ['temporal:branching', 'simulation:counterfactual'],
    recover: ['resilience:guardian'],
    security: ['security:analyzers', 'security:zero-trust'],
    memory: ['agent:memory'],
    investigate: ['incident:investigation', 'causality:engine', 'simulation:counterfactual', 'verification:proof'],
  };
  for (const [prefix, deps] of Object.entries(map)) {
    if (toolId.includes(prefix)) return deps;
  }
  return ['kernel:events'];
}

function testFor(toolId: string): string {
  return `tests/intelligence/registry-integration.test.ts (${toolId})`;
}

export interface RegistryStats {
  total: number;
  byCategory: Record<string, number>;
  bySecurityClass: Record<string, number>;
  experimental: number;
  stable: number;
}

export function registryStats(): RegistryStats {
  const byCategory: Record<string, number> = {};
  const bySecurityClass: Record<string, number> = {};
  let experimental = 0;
  for (const cap of CAPABILITY_REGISTRY) {
    byCategory[cap.category] = (byCategory[cap.category] ?? 0) + 1;
    bySecurityClass[cap.securityClass] = (bySecurityClass[cap.securityClass] ?? 0) + 1;
    if (cap.experimental) experimental += 1;
  }
  return {
    total: CAPABILITY_REGISTRY.length,
    byCategory,
    bySecurityClass,
    experimental,
    stable: CAPABILITY_REGISTRY.length - experimental,
  };
}

export function capabilityById(id: string): Capability | undefined {
  return CAPABILITY_REGISTRY.find((c) => c.id === id);
}

/** Verify the tool set is exactly the planned surface, no dupes. */
const EXPECTED_CATEGORY_COUNTS: Record<string, number> = {
  'temporal-intelligence': 10,
  'evidence-provenance': 10,
  'causal-intelligence': 10,
  'semantic-component': 10,
  'targeting-interaction': 10,
  'counterfactual-simulation': 10,
  'reliability-recovery': 10,
  'security-intelligence': 10,
  'performance-memory-visual': 10,
  'investigation-orchestration': 10,
  'browser-primitives': 22,
  'workflow-runtime': 14,
  'agent-owned-tooling': 8,
};

export function validateRegistry(): { valid: boolean; problems: string[] } {
  const problems: string[] = [];
  const expectedTotal = Object.values(EXPECTED_CATEGORY_COUNTS).reduce((a, b) => a + b, 0);
  const ids = CAPABILITY_REGISTRY.map((c) => c.id);
  if (ids.length !== expectedTotal) problems.push(`expected ${expectedTotal} td_* capabilities, found ${ids.length}`);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length) problems.push(`duplicate capability ids: ${dupes.join(', ')}`);
  const nonTd = ids.filter((id) => !id.startsWith('td_'));
  if (nonTd.length) problems.push(`non-td_ ids in registry: ${nonTd.join(', ')}`);
  const byCategory: Record<string, number> = {};
  for (const cap of CAPABILITY_REGISTRY) byCategory[cap.category] = (byCategory[cap.category] ?? 0) + 1;
  for (const [category, expected] of Object.entries(EXPECTED_CATEGORY_COUNTS)) {
    const count = byCategory[category] ?? 0;
    if (count !== expected) problems.push(`category ${category} has ${count} tools (expected ${expected})`);
  }
  for (const category of Object.keys(byCategory)) {
    if (!(category in EXPECTED_CATEGORY_COUNTS)) problems.push(`unknown category ${category} (${byCategory[category]} tools)`);
  }
  return { valid: problems.length === 0, problems };
}
