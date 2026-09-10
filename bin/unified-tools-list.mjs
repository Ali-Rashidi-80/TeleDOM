// §7/§13 — Unified tool registry additions (dt_ + fx_ namespaces).
// Imported by bin/cli.js so the CLI/mcp_config authorize every unified
// platform tool (206 total: 121 existing + 54 DevTools + 31 forensic).
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
