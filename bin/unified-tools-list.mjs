// §7/§13 — Unified tool registry additions (dt_ + fx_ + td_ namespaces).
// Imported by bin/cli.js so the CLI/mcp_config authorize every unified
// platform tool (350 total: 121 base + 54 DevTools + 31 forensic + 144 TeleDOM intelligence).

export const TELEDOM_TOOLS = [
// §v4.1 — TeleDOM intelligence surface (td_ namespace, 144 tools).
// GENERATED from src/intelligence/registry/capabilities.ts — regenerate with:
//   node scripts/sync-cli-tool-lists.js
// temporal-intelligence (10)
  'td_temporal_query', 'td_temporal_seek', 'td_temporal_window', 'td_temporal_diff', 'td_temporal_trace_entity', 'td_temporal_first_change', 'td_temporal_last_stable', 'td_temporal_join', 'td_temporal_branch', 'td_temporal_rewind',
// evidence-provenance (10)
  'td_evidence_capture', 'td_evidence_search', 'td_evidence_chain', 'td_evidence_confidence', 'td_evidence_verify', 'td_evidence_hash', 'td_evidence_compare', 'td_evidence_export', 'td_evidence_timeline', 'td_evidence_proof',
// causal-intelligence (10)
  'td_cause_trace', 'td_cause_graph', 'td_cause_rank', 'td_cause_explain', 'td_cause_correlate', 'td_cause_breakpoint', 'td_cause_impact', 'td_cause_dependency', 'td_cause_counterfactual', 'td_cause_verify',
// semantic-component (10)
  'td_semantic_page', 'td_semantic_element', 'td_component_map', 'td_component_lifecycle', 'td_component_dependencies', 'td_component_state', 'td_accessibility_model', 'td_visual_semantics', 'td_page_intent', 'td_state_summary',
// targeting-interaction (10)
  'td_resolve_target', 'td_rank_targets', 'td_target_recover', 'td_target_verify', 'td_target_history', 'td_target_contract', 'td_interaction_plan', 'td_interaction_execute', 'td_interaction_observe', 'td_interaction_repair',
// counterfactual-simulation (10)
  'td_simulate_change', 'td_simulate_network', 'td_simulate_dom', 'td_simulate_style', 'td_simulate_runtime', 'td_simulate_failure', 'td_compare_branches', 'td_predict_impact', 'td_safe_apply', 'td_branch_merge',
// reliability-recovery (10)
  'td_health_snapshot', 'td_recover_browser', 'td_recover_page', 'td_recover_bridge', 'td_reconcile_tabs', 'td_reconcile_events', 'td_resource_guard', 'td_leak_watch', 'td_failure_containment', 'td_session_repair',
// security-intelligence (10)
  'td_security_posture', 'td_security_surface', 'td_security_flow', 'td_dom_xss_audit', 'td_injection_surface_audit', 'td_auth_session_audit', 'td_cookie_storage_audit', 'td_csp_security_audit', 'td_cors_security_audit', 'td_security_regression',
// performance-memory-visual (10)
  'td_performance_profile', 'td_performance_budget', 'td_long_task_trace', 'td_layout_causality', 'td_memory_profile', 'td_memory_leak_trace', 'td_retention_graph', 'td_visual_regression', 'td_visual_causality', 'td_render_stability',
// investigation-orchestration (10)
  'td_investigate', 'td_reproduce_incident', 'td_diagnose', 'td_plan_fix', 'td_validate_fix', 'td_run_workflow', 'td_run_playbook', 'td_memory', 'td_context_optimize', 'td_incident_close',
// browser-primitives (22)
  'td_browser_navigate', 'td_browser_back', 'td_browser_forward', 'td_browser_refresh', 'td_dom_inspect', 'td_dom_query', 'td_dom_extract', 'td_dom_snapshot', 'td_target_find', 'td_target_check', 'td_target_describe', 'td_action_click', 'td_action_type', 'td_action_select', 'td_action_hover', 'td_action_press', 'td_action_scroll', 'td_wait', 'td_screenshot', 'td_execute_script', 'td_network_inspect', 'td_console_read',
// workflow-runtime (14)
  'td_workflow_save', 'td_workflow_get', 'td_workflow_list', 'td_workflow_update', 'td_workflow_clone', 'td_workflow_diff', 'td_workflow_export', 'td_workflow_import', 'td_workflow_validate', 'td_workflow_run', 'td_workflow_runs', 'td_workflow_run_get', 'td_workflow_replay', 'td_workflow_delete',
// agent-owned-tooling (8)
  'td_target_memory_save', 'td_target_memory_get', 'td_target_memory_list', 'td_target_memory_delete', 'td_agent_artifact_save', 'td_agent_artifact_get', 'td_agent_artifact_list', 'td_agent_artifact_delete',
];

export const DEVTOOLS_TOOLS = [
  // input automation (10)
  'dt_click', 'dt_click_at', 'dt_drag', 'dt_fill', 'dt_fill_form', 'dt_handle_dialog', 'dt_hover', 'dt_press_key', 'dt_type_text', 'dt_upload_file',
  // navigation (7)
  'dt_list_pages', 'dt_select_page', 'dt_new_page', 'dt_close_page', 'dt_navigate_page', 'dt_history_navigation', 'dt_wait_for',
  // emulation (2)
  'dt_emulate', 'dt_resize_page',
  // performance (3)
  'dt_performance_start_trace', 'dt_performance_stop_trace', 'dt_performance_analyze_insight',
  // network (2)
  'dt_list_network_requests', 'dt_get_network_request',
  // debugging (8)
  'dt_evaluate_script', 'dt_list_console_messages', 'dt_get_console_message', 'dt_take_screenshot', 'dt_take_snapshot', 'dt_screencast_start', 'dt_screencast_stop', 'dt_lighthouse_audit',
  // memory (13)
  'dt_take_heapsnapshot', 'dt_close_heapsnapshot', 'dt_heapsnapshot_summary', 'dt_heapsnapshot_details', 'dt_heapsnapshot_class_nodes', 'dt_heapsnapshot_edges', 'dt_heapsnapshot_retainers', 'dt_heapsnapshot_retaining_paths', 'dt_heapsnapshot_dominators', 'dt_heapsnapshot_duplicate_strings', 'dt_heapsnapshot_object_details', 'dt_query_heapsnapshot_objects', 'dt_compare_heapsnapshots',
  // extensions (5)
  'dt_install_extension', 'dt_list_extensions', 'dt_reload_extension', 'dt_trigger_extension_action', 'dt_uninstall_extension',
  // third-party (2)
  'dt_list_3p_developer_tools', 'dt_execute_3p_developer_tool',
  // webmcp (2)
  'dt_list_webmcp_tools', 'dt_execute_webmcp_tool',
];

export const FORENSICS_TOOLS = [
  'fx_correlate_dom_network', 'fx_dom_regression_diff', 'fx_visual_regression_forensics', 'fx_layout_shift_forensics',
  'fx_record_interactions', 'fx_replay_interactions', 'fx_failure_replay', 'fx_selector_survivability',
  'fx_component_boundaries', 'fx_frame_forensics', 'fx_shadow_dom_forensics', 'fx_css_influence',
  'fx_zindex_occlusion', 'fx_event_listeners', 'fx_error_root_cause', 'fx_network_dom_binding',
  'fx_resource_waterfall', 'fx_font_forensics', 'fx_a11y_divergence', 'fx_page_health',
  'fx_exploration_planner', 'fx_smart_snapshot', 'fx_cross_signal_search', 'fx_forensic_export',
  'fx_forensic_import', 'fx_impact_prediction', 'fx_safe_mutation_guard', 'fx_transaction_journal',
  'fx_session_graph', 'fx_evidence_scoring', 'fx_incident_report',
];

export const ALL_UNIFIED_TOOLS = [...DEVTOOLS_TOOLS, ...FORENSICS_TOOLS, ...TELEDOM_TOOLS];
