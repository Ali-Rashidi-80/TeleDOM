# TeleDOM v4 — Compatibility Matrix (generated)

Generated: 2026-09-11T15:28:09.587Z · TeleDOM version: 12.0.0

**Surfaces**: td_=100 · dt_=54 · fx_=31 · base=47 · v3=74 · **total=306**

| Capability | Version | Implementation | Schema parity | Behavior parity | Browser support | Simulation | Test status | Experimental |
|---|---|---|---|---|---|---|---|---|
| `td_temporal_query` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_seek` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_window` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_diff` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_trace_entity` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_first_change` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_last_stable` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_join` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_branch` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_rewind` | 4.0.0 | src/intelligence (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_capture` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_search` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_chain` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_confidence` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_verify` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_hash` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_compare` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_export` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_timeline` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_proof` | 4.0.0 | src/intelligence (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_trace` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_graph` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_rank` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_explain` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_correlate` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_breakpoint` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_impact` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_dependency` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_counterfactual` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_verify` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_semantic_page` | 4.0.0 | src/intelligence (semantics:semantic-engine) | full | full | recorded+simulation | yes | PASS | no |
| `td_semantic_element` | 4.0.0 | src/intelligence (semantics:semantic-engine) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_map` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_lifecycle` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_dependencies` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_state` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_accessibility_model` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_visual_semantics` | 4.0.0 | src/intelligence (semantics:semantic-engine) | full | full | recorded+simulation | yes | PASS | no |
| `td_page_intent` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_state_summary` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_resolve_target` | 4.0.0 | src/intelligence (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_rank_targets` | 4.0.0 | src/intelligence (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_recover` | 4.0.0 | src/intelligence (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_verify` | 4.0.0 | src/intelligence (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_history` | 4.0.0 | src/intelligence (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_contract` | 4.0.0 | src/intelligence (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_interaction_plan` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_interaction_execute` | 4.0.0 | src/intelligence (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_interaction_observe` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_interaction_repair` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_change` | 4.0.0 | src/intelligence (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_network` | 4.0.0 | src/intelligence (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_dom` | 4.0.0 | src/intelligence (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_style` | 4.0.0 | src/intelligence (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_runtime` | 4.0.0 | src/intelligence (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_failure` | 4.0.0 | src/intelligence (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_compare_branches` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_predict_impact` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_safe_apply` | 4.0.0 | src/intelligence (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_branch_merge` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_health_snapshot` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_recover_browser` | 4.0.0 | src/intelligence (resilience:guardian) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_recover_page` | 4.0.0 | src/intelligence (resilience:guardian) | full | full | recorded+simulation | yes | PASS | no |
| `td_recover_bridge` | 4.0.0 | src/intelligence (resilience:guardian) | full | full | recorded+simulation | yes | PASS | no |
| `td_reconcile_tabs` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_reconcile_events` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_resource_guard` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_leak_watch` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_failure_containment` | 4.0.0 | src/intelligence (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_session_repair` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_posture` | 4.0.0 | src/intelligence (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_surface` | 4.0.0 | src/intelligence (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_flow` | 4.0.0 | src/intelligence (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_dom_xss_audit` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_injection_surface_audit` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_auth_session_audit` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cookie_storage_audit` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_csp_security_audit` | 4.0.0 | src/intelligence (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_cors_security_audit` | 4.0.0 | src/intelligence (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_regression` | 4.0.0 | src/intelligence (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_performance_profile` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_performance_budget` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_long_task_trace` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_layout_causality` | 4.0.0 | src/intelligence (causality:engine + evidence:graph) | full | full | recorded+simulation | yes | PASS | no |
| `td_memory_profile` | 4.0.0 | src/intelligence (agent:memory) | full | full | recorded+simulation | yes | PASS | no |
| `td_memory_leak_trace` | 4.0.0 | src/intelligence (agent:memory) | full | full | recorded+simulation | yes | PASS | no |
| `td_retention_graph` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | YES |
| `td_visual_regression` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_visual_causality` | 4.0.0 | src/intelligence (causality:engine + evidence:graph) | full | full | recorded+simulation | yes | PASS | no |
| `td_render_stability` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_investigate` | 4.0.0 | src/intelligence (incident:investigation + causality:engine + simulation:counterfactual + verification:proof) | full | full | recorded+simulation | yes | PASS | no |
| `td_reproduce_incident` | 4.0.0 | src/intelligence (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_diagnose` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_plan_fix` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_validate_fix` | 4.0.0 | src/intelligence (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_run_workflow` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_run_playbook` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_memory` | 4.0.0 | src/intelligence (agent:memory) | full | full | recorded+simulation | yes | PASS | no |
| `td_context_optimize` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_incident_close` | 4.0.0 | src/intelligence (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
