# TeleDOM v12 — Capability Surface (generated)

Version: 12.0.0 · td_* capabilities: 100 · categories: 10 × 10 · experimental: 1

## temporal-intelligence

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_temporal_query` | read-only | low | live/recorded/simulation | no | Query any state/entity across a time range (State(T), State(T1..T2)). |
| `td_temporal_seek` | read-only | low | live/recorded/simulation | no | Seek to the nearest valid state for an event/time. |
| `td_temporal_window` | read-only | low | live/recorded/simulation | no | Return a compact before/target/after state window around an event. |
| `td_temporal_diff` | read-only | low | live/recorded/simulation | no | Diff(T1,T2): compare two arbitrary points in time across all state dimensions. |
| `td_temporal_trace_entity` | read-only | low | live/recorded/simulation | no | Trace one entity through its full lifetime (every touching event). |
| `td_temporal_first_change` | read-only | low | live/recorded/simulation | no | Find the first event matching a predicate (e.g. first invalid state). |
| `td_temporal_last_stable` | read-only | low | live/recorded/simulation | no | Find the last state in which a dimension was stable before a time. |
| `td_temporal_join` | read-only | low | live/recorded/simulation | no | Join DOM/runtime/network/visual/security events inside temporal constraints (Join(Signals)). |
| `td_temporal_branch` | reversible | low | live/recorded/simulation | no | Branch(T): fork a historical state into a simulation branch (never overwrites reality). |
| `td_temporal_rewind` | read-only | low | live/recorded/simulation | no | Reconstruct and activate a safe inspection state (read-only rewind). |

## evidence-provenance

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_evidence_capture` | read-only | low | live/recorded/simulation | no | Capture a typed evidence bundle for the current investigation. |
| `td_evidence_search` | read-only | low | live/recorded/simulation | no | Search evidence semantically and structurally. |
| `td_evidence_chain` | read-only | low | live/recorded/simulation | no | Build the provenance chain for a claim (claim → evidence → verification). |
| `td_evidence_confidence` | read-only | low | live/recorded/simulation | no | Recalculate confidence using source quality and corroboration. |
| `td_evidence_verify` | read-only | low | live/recorded/simulation | no | Verify a claim against current or replayed state. |
| `td_evidence_hash` | read-only | low | live/recorded/simulation | no | Hash a state/evidence artifact and attach integrity metadata. |
| `td_evidence_compare` | read-only | low | live/recorded/simulation | no | Compare two evidence packages (structural + provenance diff). |
| `td_evidence_export` | read-only | low | live/recorded/simulation | no | Export a portable forensic evidence package (.tdom). |
| `td_evidence_timeline` | read-only | low | live/recorded/simulation | no | Produce a human-readable evidence timeline for an incident. |
| `td_evidence_proof` | read-only | low | live/recorded/simulation | no | Generate a machine-verifiable proof record for a finding. |

## causal-intelligence

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_cause_trace` | read-only | low | live/recorded/simulation | no | Trace likely causes of a selected symptom (root-cause chain). |
| `td_cause_graph` | read-only | low | live/recorded/simulation | no | Build a causal graph around an incident (typed nodes + provenance edges). |
| `td_cause_rank` | read-only | low | live/recorded/simulation | no | Rank competing root-cause hypotheses by evidence strength. |
| `td_cause_explain` | read-only | low | live/recorded/simulation | no | Explain a finding from evidence — claim + chain + confidence + alternatives. |
| `td_cause_correlate` | read-only | low | live/recorded/simulation | no | Correlate independent signals into candidate causal chains. |
| `td_cause_breakpoint` | read-only | low | live/recorded/simulation | no | Find the earliest causal divergence between two streams (reality vs branch). |
| `td_cause_impact` | read-only | low | live/recorded/simulation | no | Estimate downstream impact of a cause (affected entities/components). |
| `td_cause_dependency` | read-only | low | live/recorded/simulation | no | Trace dependencies that could produce a state (dependency chains). |
| `td_cause_counterfactual` | reversible | low | live/recorded/simulation | no | Test whether removing a candidate cause changes the outcome (branch + replay + compare). |
| `td_cause_verify` | read-only | low | live/recorded/simulation | no | Verify a root-cause hypothesis through replay/observation (never guess). |

## semantic-component

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_semantic_page` | read-only | low | live/recorded/simulation | no | Build a compact semantic model of the page (roles, intents, stability). |
| `td_semantic_element` | read-only | low | live/recorded/simulation | no | Explain an element's role, intent and state (semantic identity). |
| `td_component_map` | read-only | low | live/recorded/simulation | no | Infer component boundaries and ownership (React/Vue/Svelte/custom/microfrontend). |
| `td_component_lifecycle` | read-only | low | live/recorded/simulation | no | Trace mount/update/unmount behavior of a component. |
| `td_component_dependencies` | read-only | low | live/recorded/simulation | no | Map component dependencies and affected nodes. |
| `td_component_state` | read-only | low | live/recorded/simulation | no | Reconstruct component-facing state signals. |
| `td_accessibility_model` | read-only | low | live/recorded/simulation | no | Build a normalized accessibility model (role/name/state/relationships/focus). |
| `td_visual_semantics` | read-only | low | live/recorded/simulation | no | Associate visual regions with semantic entities. |
| `td_page_intent` | read-only | low | live/recorded/simulation | no | Infer major page workflows and interaction zones. |
| `td_state_summary` | read-only | low | live/recorded/simulation | no | Return a token-minimal state digest suitable for agents (L0/L1). |

## targeting-interaction

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_resolve_target` | read-only | low | live/recorded/simulation | no | Resolve a natural-language or semantic target to a VERIFIED entity with confidence. |
| `td_rank_targets` | read-only | low | live/recorded/simulation | no | Rank target candidates by historical, semantic and visual stability. |
| `td_target_recover` | read-only | low | live/recorded/simulation | no | Recover a target after selector/DOM changes (multi-signal recovery; refuses blind guesses). |
| `td_target_verify` | read-only | low | live/recorded/simulation | no | Verify that the selected target matches the requested intent. |
| `td_target_history` | read-only | low | live/recorded/simulation | no | Show how a target changed over time (identity versions). |
| `td_target_contract` | read-only | low | live/recorded/simulation | no | Create a durable target contract for future actions. |
| `td_interaction_plan` | read-only | low | live/recorded/simulation | no | Generate a verified interaction plan from intent (target + steps + postconditions). |
| `td_interaction_execute` | side-effects | low | live/recorded/simulation | no | Execute an interaction plan with postconditions (transactional). |
| `td_interaction_observe` | read-only | low | live/recorded/simulation | no | Observe effects of one interaction across state dimensions. |
| `td_interaction_repair` | read-only | low | live/recorded/simulation | no | Repair a failed interaction without restarting the whole task. |

## counterfactual-simulation

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_simulate_change` | read-only | low | live/recorded/simulation | no | Simulate a proposed change without committing it (dry-run on a branch). |
| `td_simulate_network` | read-only | low | live/recorded/simulation | no | Simulate alternate network responses (modify-response branch). |
| `td_simulate_dom` | read-only | low | live/recorded/simulation | no | Simulate DOM mutations against a branch. |
| `td_simulate_style` | read-only | low | live/recorded/simulation | no | Simulate style/CSS changes (modify-style branch). |
| `td_simulate_runtime` | read-only | low | live/recorded/simulation | no | Simulate selected runtime conditions (state/event patches). |
| `td_simulate_failure` | policy-gated | low | live/recorded/simulation | no | Reproduce a controlled failure condition in an authorized environment. |
| `td_compare_branches` | read-only | low | live/recorded/simulation | no | Compare reality against one or more counterfactual branches. |
| `td_predict_impact` | read-only | low | live/recorded/simulation | no | Predict affected components/entities before a mutation (impact analysis). |
| `td_safe_apply` | side-effects | low | live/recorded/simulation | no | Apply a verified low-risk mutation transaction (PLAN→…→VERIFY→COMMIT/ROLLBACK). |
| `td_branch_merge` | reversible | low | live/recorded/simulation | no | Merge a successful simulation branch into a controlled mutation plan. |

## reliability-recovery

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_health_snapshot` | read-only | low | live/recorded/simulation | no | Return full TeleDOM runtime health + integrity state (self-diagnostics). |
| `td_recover_browser` | side-effects | low | live/recorded/simulation | no | Recover from browser/renderer disconnect where possible (bounded retries). |
| `td_recover_page` | read-only | low | live/recorded/simulation | no | Re-resolve a dead or replaced page identity. |
| `td_recover_bridge` | read-only | low | live/recorded/simulation | no | Recover or reconnect the bridge without losing state. |
| `td_reconcile_tabs` | read-only | low | live/recorded/simulation | no | Reconcile page identity after tabs/windows change. |
| `td_reconcile_events` | read-only | low | live/recorded/simulation | no | Detect and repair event-order inconsistencies (mesh admission report). |
| `td_resource_guard` | read-only | low | live/recorded/simulation | no | Enforce memory/CPU/concurrency budgets (guardian decision + mode). |
| `td_leak_watch` | read-only | low | live/recorded/simulation | no | Continuously detect memory/resource growth patterns. |
| `td_failure_containment` | side-effects | low | live/recorded/simulation | no | Isolate a broken capability without killing the whole session. |
| `td_session_repair` | read-only | low | live/recorded/simulation | no | Repair a partially corrupted session from checkpoints + evidence (hash-verified). |

## security-intelligence

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_security_posture` | read-only | low | live/recorded/simulation | no | Produce a browser-side security posture summary (passive, evidence-driven). |
| `td_security_surface` | read-only | low | live/recorded/simulation | no | Map client-visible attack surfaces and trust boundaries. |
| `td_security_flow` | read-only | low | live/recorded/simulation | no | Trace sensitive-data flows through the browser runtime. |
| `td_dom_xss_audit` | read-only | low | live/recorded/simulation | no | Trace browser-side sources, transformations and dangerous sinks (passive). |
| `td_injection_surface_audit` | read-only | low | live/recorded/simulation | no | Identify injection-sensitive DOM/runtime surfaces WITHOUT executing payloads. |
| `td_auth_session_audit` | read-only | low | live/recorded/simulation | no | Audit authentication/session behavior, expiry and state transitions. |
| `td_cookie_storage_audit` | read-only | low | live/recorded/simulation | no | Audit cookie, storage and client-secret handling. |
| `td_csp_security_audit` | read-only | low | live/recorded/simulation | no | Analyze CSP posture and runtime violations. |
| `td_cors_security_audit` | read-only | low | live/recorded/simulation | no | Analyze observed CORS behavior against scoped trust expectations. |
| `td_security_regression` | read-only | low | live/recorded/simulation | no | Compare security posture before/after a code or deployment change. |

## performance-memory-visual

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_performance_profile` | read-only | medium | live/recorded/simulation | no | Build an end-to-end performance profile (events → spans → vitals). |
| `td_performance_budget` | read-only | low | live/recorded/simulation | no | Evaluate the page against declared performance budgets. |
| `td_long_task_trace` | read-only | low | live/recorded/simulation | no | Trace long tasks to affected DOM/components. |
| `td_layout_causality` | read-only | low | live/recorded/simulation | no | Connect layout shifts to runtime/DOM/network causes. |
| `td_memory_profile` | read-only | medium | live/recorded/simulation | no | Build a memory profile for the browser/page/session. |
| `td_memory_leak_trace` | read-only | low | live/recorded/simulation | no | Find retained-growth patterns over time. |
| `td_retention_graph` | read-only | low | live/recorded/simulation | YES | Build a retaining/reference graph for selected runtime objects where supported. |
| `td_visual_regression` | read-only | low | live/recorded/simulation | no | Compare visual state with DOM/runtime evidence. |
| `td_visual_causality` | read-only | low | live/recorded/simulation | no | Explain why a region changed visually (visual↔DOM↔runtime correlation). |
| `td_render_stability` | read-only | low | live/recorded/simulation | no | Determine when the page reaches a stable render state. |

## investigation-orchestration

| Tool | Security | Cost | Modes | Experimental | Description |
|---|---|---|---|---|---|
| `td_investigate` | read-only | high | live/recorded/simulation | no | Run a complete autonomous investigation from a natural-language objective (resumable plan: scope→…→proof). |
| `td_reproduce_incident` | side-effects | low | live/recorded/simulation | no | Reproduce a captured incident with controlled state. |
| `td_diagnose` | read-only | low | live/recorded/simulation | no | Generate ranked diagnostic hypotheses with evidence (no guesswork). |
| `td_plan_fix` | read-only | low | live/recorded/simulation | no | Build a fix plan linked to observed causes and affected entities. |
| `td_validate_fix` | side-effects | low | live/recorded/simulation | no | Verify a proposed fix against the original failure (original FAIL → patched PASS). |
| `td_run_workflow` | read-only | low | live/recorded/simulation | no | Execute a declarative multi-step workflow with recovery. |
| `td_run_playbook` | read-only | low | live/recorded/simulation | no | Run a reusable investigation/security/performance playbook. |
| `td_memory` | read-only | low | live/recorded/simulation | no | Store and retrieve durable project/session investigation knowledge (provenance + confidence). |
| `td_context_optimize` | read-only | low | live/recorded/simulation | no | Select the smallest sufficient evidence/state set for the agent (L0–L4). |
| `td_incident_close` | policy-gated | low | live/recorded/simulation | no | Close an incident ONLY after reproduction, remediation and verification criteria pass. |

