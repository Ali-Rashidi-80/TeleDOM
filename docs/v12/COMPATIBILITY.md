# TeleDOM v12 — Compatibility Matrix (generated)

Generated: 2026-09-11T04:49:32.829Z · TeleDOM version: 12.0.0

**Surfaces**: td_=100 · dt_=54 · fx_=31 · base=47 · v3=74 · **total=306**

| Capability | Version | Implementation | Schema parity | Behavior parity | Browser support | Simulation | Test status | Experimental |
|---|---|---|---|---|---|---|---|---|
| `td_temporal_query` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_seek` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_window` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_diff` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_trace_entity` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_first_change` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_last_stable` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_join` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_branch` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_temporal_rewind` | 12.0.0 | src/v12 (kernel:events + temporal:queries) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_capture` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_search` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_chain` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_confidence` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_verify` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_hash` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_compare` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_export` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_timeline` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_evidence_proof` | 12.0.0 | src/v12 (evidence:graph + evidence:confidence) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_trace` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_graph` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_rank` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_explain` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_correlate` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_breakpoint` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_impact` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_dependency` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_counterfactual` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cause_verify` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_semantic_page` | 12.0.0 | src/v12 (semantics:semantic-engine) | full | full | recorded+simulation | yes | PASS | no |
| `td_semantic_element` | 12.0.0 | src/v12 (semantics:semantic-engine) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_map` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_lifecycle` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_dependencies` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_component_state` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_accessibility_model` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_visual_semantics` | 12.0.0 | src/v12 (semantics:semantic-engine) | full | full | recorded+simulation | yes | PASS | no |
| `td_page_intent` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_state_summary` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_resolve_target` | 12.0.0 | src/v12 (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_rank_targets` | 12.0.0 | src/v12 (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_recover` | 12.0.0 | src/v12 (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_verify` | 12.0.0 | src/v12 (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_history` | 12.0.0 | src/v12 (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_target_contract` | 12.0.0 | src/v12 (targeting:target-intelligence) | full | full | recorded+simulation | yes | PASS | no |
| `td_interaction_plan` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_interaction_execute` | 12.0.0 | src/v12 (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_interaction_observe` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_interaction_repair` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_change` | 12.0.0 | src/v12 (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_network` | 12.0.0 | src/v12 (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_dom` | 12.0.0 | src/v12 (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_style` | 12.0.0 | src/v12 (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_runtime` | 12.0.0 | src/v12 (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_simulate_failure` | 12.0.0 | src/v12 (temporal:branching + simulation:counterfactual) | full | full | recorded+simulation | yes | PASS | no |
| `td_compare_branches` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_predict_impact` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_safe_apply` | 12.0.0 | src/v12 (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_branch_merge` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_health_snapshot` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_recover_browser` | 12.0.0 | src/v12 (resilience:guardian) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_recover_page` | 12.0.0 | src/v12 (resilience:guardian) | full | full | recorded+simulation | yes | PASS | no |
| `td_recover_bridge` | 12.0.0 | src/v12 (resilience:guardian) | full | full | recorded+simulation | yes | PASS | no |
| `td_reconcile_tabs` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_reconcile_events` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_resource_guard` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_leak_watch` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_failure_containment` | 12.0.0 | src/v12 (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_session_repair` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_posture` | 12.0.0 | src/v12 (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_surface` | 12.0.0 | src/v12 (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_flow` | 12.0.0 | src/v12 (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_dom_xss_audit` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_injection_surface_audit` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_auth_session_audit` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_cookie_storage_audit` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_csp_security_audit` | 12.0.0 | src/v12 (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_cors_security_audit` | 12.0.0 | src/v12 (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_security_regression` | 12.0.0 | src/v12 (security:analyzers + security:zero-trust) | full | full | recorded+simulation | yes | PASS | no |
| `td_performance_profile` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_performance_budget` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_long_task_trace` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_layout_causality` | 12.0.0 | src/v12 (causality:engine + evidence:graph) | full | full | recorded+simulation | yes | PASS | no |
| `td_memory_profile` | 12.0.0 | src/v12 (agent:memory) | full | full | recorded+simulation | yes | PASS | no |
| `td_memory_leak_trace` | 12.0.0 | src/v12 (agent:memory) | full | full | recorded+simulation | yes | PASS | no |
| `td_retention_graph` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | YES |
| `td_visual_regression` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_visual_causality` | 12.0.0 | src/v12 (causality:engine + evidence:graph) | full | full | recorded+simulation | yes | PASS | no |
| `td_render_stability` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_investigate` | 12.0.0 | src/v12 (incident:investigation + causality:engine + simulation:counterfactual + verification:proof) | full | full | recorded+simulation | yes | PASS | no |
| `td_reproduce_incident` | 12.0.0 | src/v12 (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_diagnose` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_plan_fix` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_validate_fix` | 12.0.0 | src/v12 (kernel:events) | full | full | live+recorded+simulation | yes | PASS | no |
| `td_run_workflow` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_run_playbook` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_memory` | 12.0.0 | src/v12 (agent:memory) | full | full | recorded+simulation | yes | PASS | no |
| `td_context_optimize` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
| `td_incident_close` | 12.0.0 | src/v12 (kernel:events) | full | full | recorded+simulation | yes | PASS | no |
