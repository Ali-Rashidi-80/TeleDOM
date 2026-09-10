# MCP Capability Discovery Report

**Total Discovered Tools**: 206
**Discovery Timestamp**: 2026-09-09T21:15:24.957Z

| # | Tool Name | Mode | Category | Visual Evidence | Required Arguments |
|---|---|---|---|---|---|
| 1 | `list_sessions` | historical | historical | NO | None |
| 2 | `get_session` | historical | historical | NO | sessionId |
| 3 | `export_session` | historical | historical | NO | sessionId |
| 4 | `import_session` | historical | historical | NO | bundleJson |
| 5 | `delete_session` | historical | historical | NO | sessionId |
| 6 | `get_timeline` | historical | historical | NO | sessionId |
| 7 | `get_events` | historical | historical | NO | sessionId |
| 8 | `get_events_around` | historical | historical | NO | sessionId |
| 9 | `get_dom_state` | historical | historical | NO | sessionId |
| 10 | `get_dom_node` | historical | historical | NO | sessionId |
| 11 | `get_dom_subtree` | historical | historical | NO | sessionId |
| 12 | `diff_dom` | historical | historical | NO | sessionId |
| 13 | `trace_element` | historical | historical | NO | sessionId |
| 14 | `find_disappearing_elements` | historical | historical | NO | sessionId |
| 15 | `why_did_element_disappear` | historical | historical | NO | sessionId, target |
| 16 | `get_diagnostics` | historical | historical | NO | sessionId |
| 17 | `get_network_events` | historical | historical | NO | sessionId |
| 18 | `get_screenshots` | historical | historical | YES | sessionId |
| 19 | `annotate_session` | historical | historical | NO | sessionId, label, comment |
| 20 | `get_annotations` | historical | historical | NO | sessionId |
| 21 | `get_recording_health` | historical | historical | NO | sessionId |
| 22 | `list_tabs` | historical | historical | NO | None |
| 23 | `focus_tab` | historical | historical | NO | tabId |
| 24 | `reload_tab` | historical | historical | NO | None |
| 25 | `close_tab` | historical | historical | NO | None |
| 26 | `open_tab` | historical | historical | NO | url |
| 27 | `list_extensions` | historical | historical | NO | None |
| 28 | `set_extension_enabled` | historical | historical | NO | extensionId, enabled |
| 29 | `toggle_extension` | historical | historical | NO | extensionId |
| 30 | `execute_pipeline` | historical | historical | NO | steps |
| 31 | `compare_extension_states` | historical | historical | NO | extensionId |
| 32 | `reload_extension` | historical | historical | NO | None |
| 33 | `get_tab_console_logs` | historical | historical | NO | None |
| 34 | `get_tab_network_requests` | historical | historical | NO | None |
| 35 | `inspect_live_page` | live | live_browser_control | NO | None |
| 36 | `inspect_live_element` | live | live_browser_control | NO | None |
| 37 | `get_selected_element` | live | live_browser_control | NO | None |
| 38 | `start_element_picker` | live | live_browser_control | NO | None |
| 39 | `stop_element_picker` | live | live_browser_control | NO | None |
| 40 | `capture_page_screenshot` | live | live_browser_control | YES | None |
| 41 | `capture_element_screenshot` | live | live_browser_control | YES | None |
| 42 | `interact_with_element` | live | live_browser_control | NO | action |
| 43 | `start_element_observation` | live | live_browser_control | NO | None |
| 44 | `stop_element_observation` | live | live_browser_control | NO | None |
| 45 | `get_live_dom_snapshot` | live | live_browser_control | NO | None |
| 46 | `get_live_dom_subtree` | live | live_browser_control | NO | None |
| 47 | `get_element_visual_state` | live | live_browser_control | YES | None |
| 48 | `generate_element_target` | historical | historical | NO | None |
| 49 | `recover_selector` | historical | historical | NO | selector |
| 50 | `diagnose_selector_failure` | historical | historical | NO | selector |
| 51 | `get_element_ancestry` | historical | historical | NO | None |
| 52 | `get_element_fingerprint` | historical | historical | NO | None |
| 53 | `get_element_relationships` | historical | historical | NO | None |
| 54 | `get_element_accessibility` | historical | historical | NO | None |
| 55 | `get_computed_style` | historical | historical | NO | None |
| 56 | `search_dom` | historical | historical | NO | query |
| 57 | `analyze_dom` | historical | historical | NO | analyzer |
| 58 | `get_page_blueprint` | historical | historical | NO | None |
| 59 | `click_element` | historical | historical | NO | None |
| 60 | `type_text` | historical | historical | NO | None |
| 61 | `hover_element` | historical | historical | NO | None |
| 62 | `focus_element` | historical | historical | NO | None |
| 63 | `blur_element` | historical | historical | NO | None |
| 64 | `press_keyboard_shortcut` | historical | historical | NO | keys |
| 65 | `scroll_to_element` | historical | historical | NO | None |
| 66 | `scroll_page` | historical | historical | NO | None |
| 67 | `drag_and_drop` | historical | historical | NO | source |
| 68 | `set_input_checked` | historical | historical | NO | None |
| 69 | `select_option` | historical | historical | NO | value |
| 70 | `wait_for_condition` | historical | historical | NO | kind |
| 71 | `wait_for_dom_stable` | historical | historical | NO | None |
| 72 | `set_interaction_profile` | historical | historical | NO | profile |
| 73 | `get_interaction_profile` | historical | historical | NO | None |
| 74 | `preview_command` | historical | historical | NO | operation, target |
| 75 | `resize_viewport` | historical | historical | NO | None |
| 76 | `reset_viewport` | historical | historical | NO | None |
| 77 | `get_viewport_state` | historical | historical | NO | None |
| 78 | `run_responsive_test` | historical | historical | NO | None |
| 79 | `emulate_device` | historical | historical | NO | device |
| 80 | `execute_javascript` | historical | historical | NO | code |
| 81 | `execute_js_and_capture_changes` | historical | historical | NO | code |
| 82 | `mutate_dom` | historical | historical | NO | operation, target |
| 83 | `mutate_dom_transaction` | historical | historical | NO | mode |
| 84 | `undo_dom_mutation` | historical | historical | NO | None |
| 85 | `redo_dom_mutation` | historical | historical | NO | None |
| 86 | `get_mutation_history` | historical | historical | NO | None |
| 87 | `preview_dom_mutation` | historical | historical | NO | operation, target |
| 88 | `clone_dom_subtree` | historical | historical | NO | target |
| 89 | `execute_command_sequence` | historical | historical | NO | steps |
| 90 | `record_commands_start` | historical | historical | NO | name |
| 91 | `record_commands_stop` | historical | historical | NO | None |
| 92 | `list_command_recordings` | historical | historical | NO | None |
| 93 | `get_command_recording` | historical | historical | NO | recordingId |
| 94 | `replay_command_recording` | historical | historical | NO | recordingId |
| 95 | `export_command_recording` | historical | historical | NO | recordingId |
| 96 | `import_command_recording` | historical | historical | NO | recordingJson |
| 97 | `delete_command_recording` | historical | historical | NO | recordingId |
| 98 | `get_browser_session` | historical | historical | NO | None |
| 99 | `get_action_timeline` | historical | historical | NO | None |
| 100 | `get_operation_trace` | historical | historical | NO | None |
| 101 | `capture_page_state` | live | live_browser_control | NO | None |
| 102 | `compare_page_states` | historical | historical | NO | None |
| 103 | `list_page_states` | historical | historical | NO | None |
| 104 | `create_page_project` | historical | historical | NO | name |
| 105 | `list_projects` | historical | historical | NO | None |
| 106 | `get_project` | historical | historical | NO | projectName |
| 107 | `capture_page_region` | live | live_browser_control | NO | projectName |
| 108 | `annotate_element` | historical | historical | NO | projectName |
| 109 | `list_region_annotations` | historical | historical | NO | projectName |
| 110 | `get_region_annotation` | historical | historical | NO | projectName, regionId |
| 111 | `update_region_annotation` | historical | historical | NO | projectName, regionId |
| 112 | `delete_region_annotation` | historical | historical | NO | projectName, regionId |
| 113 | `get_region_relationship_graph` | historical | historical | NO | projectName |
| 114 | `generate_reconstruction_spec` | historical | historical | NO | projectName |
| 115 | `export_agent_package` | historical | historical | NO | projectName |
| 116 | `delete_project` | historical | historical | NO | projectName |
| 117 | `import_project` | historical | historical | NO | projectDir |
| 118 | `get_redaction_rules` | historical | historical | NO | None |
| 119 | `set_redaction_rules` | historical | historical | NO | None |
| 120 | `get_tool_catalog` | historical | historical | NO | None |
| 121 | `get_tool_groups` | historical | historical | NO | None |
| 122 | `dt_click` | live | devtools_capability | NO | None |
| 123 | `dt_click_at` | live | devtools_capability | NO | x, y |
| 124 | `dt_drag` | live | devtools_capability | NO | None |
| 125 | `dt_fill` | live | devtools_capability | NO | value |
| 126 | `dt_fill_form` | live | devtools_capability | NO | fields |
| 127 | `dt_handle_dialog` | live | devtools_capability | NO | accept |
| 128 | `dt_hover` | live | devtools_capability | NO | None |
| 129 | `dt_press_key` | live | devtools_capability | NO | key |
| 130 | `dt_type_text` | live | devtools_capability | NO | text |
| 131 | `dt_upload_file` | live | devtools_capability | NO | files |
| 132 | `dt_list_pages` | live | devtools_capability | NO | None |
| 133 | `dt_select_page` | live | devtools_capability | NO | None |
| 134 | `dt_new_page` | live | devtools_capability | NO | url |
| 135 | `dt_close_page` | live | devtools_capability | NO | None |
| 136 | `dt_navigate_page` | live | devtools_capability | NO | url |
| 137 | `dt_history_navigation` | live | devtools_capability | NO | direction |
| 138 | `dt_wait_for` | live | devtools_capability | NO | condition |
| 139 | `dt_emulate` | live | devtools_capability | NO | None |
| 140 | `dt_resize_page` | live | devtools_capability | NO | width, height |
| 141 | `dt_performance_start_trace` | live | devtools_capability | NO | None |
| 142 | `dt_performance_stop_trace` | live | devtools_capability | NO | None |
| 143 | `dt_performance_analyze_insight` | live | devtools_capability | NO | None |
| 144 | `dt_list_network_requests` | live | devtools_capability | NO | None |
| 145 | `dt_get_network_request` | live | devtools_capability | NO | requestId |
| 146 | `dt_evaluate_script` | live | devtools_capability | NO | script |
| 147 | `dt_list_console_messages` | live | devtools_capability | NO | None |
| 148 | `dt_get_console_message` | live | devtools_capability | NO | messageId |
| 149 | `dt_take_screenshot` | live | devtools_capability | YES | None |
| 150 | `dt_take_snapshot` | live | devtools_capability | NO | None |
| 151 | `dt_screencast_start` | live | devtools_capability | NO | None |
| 152 | `dt_screencast_stop` | live | devtools_capability | NO | None |
| 153 | `dt_lighthouse_audit` | live | devtools_capability | NO | None |
| 154 | `dt_take_heapsnapshot` | live | devtools_capability | NO | None |
| 155 | `dt_close_heapsnapshot` | live | devtools_capability | NO | snapshotId |
| 156 | `dt_heapsnapshot_summary` | live | devtools_capability | NO | snapshotId |
| 157 | `dt_heapsnapshot_details` | live | devtools_capability | NO | snapshotId |
| 158 | `dt_heapsnapshot_class_nodes` | live | devtools_capability | NO | snapshotId, className |
| 159 | `dt_heapsnapshot_edges` | live | devtools_capability | NO | snapshotId |
| 160 | `dt_heapsnapshot_retainers` | live | devtools_capability | NO | snapshotId |
| 161 | `dt_heapsnapshot_retaining_paths` | live | devtools_capability | NO | snapshotId |
| 162 | `dt_heapsnapshot_dominators` | live | devtools_capability | NO | snapshotId |
| 163 | `dt_heapsnapshot_duplicate_strings` | live | devtools_capability | NO | snapshotId |
| 164 | `dt_heapsnapshot_object_details` | live | devtools_capability | NO | snapshotId |
| 165 | `dt_query_heapsnapshot_objects` | live | devtools_capability | NO | snapshotId |
| 166 | `dt_compare_heapsnapshots` | live | devtools_capability | NO | snapshotA, snapshotB |
| 167 | `dt_install_extension` | live | devtools_capability | NO | None |
| 168 | `dt_list_extensions` | live | devtools_capability | NO | None |
| 169 | `dt_reload_extension` | live | devtools_capability | NO | extensionId |
| 170 | `dt_trigger_extension_action` | live | devtools_capability | NO | extensionId |
| 171 | `dt_uninstall_extension` | live | devtools_capability | NO | extensionId |
| 172 | `dt_list_3p_developer_tools` | live | devtools_capability | NO | None |
| 173 | `dt_execute_3p_developer_tool` | live | devtools_capability | NO | toolId |
| 174 | `dt_list_webmcp_tools` | live | devtools_capability | NO | None |
| 175 | `dt_execute_webmcp_tool` | live | devtools_capability | NO | toolName |
| 176 | `fx_correlate_dom_network` | historical | forensics_capability | NO | None |
| 177 | `fx_dom_regression_diff` | historical | forensics_capability | NO | sessionId, t1, t2 |
| 178 | `fx_visual_regression_forensics` | historical | forensics_capability | YES | sessionId |
| 179 | `fx_layout_shift_forensics` | historical | forensics_capability | NO | None |
| 180 | `fx_record_interactions` | historical | forensics_capability | NO | mode |
| 181 | `fx_replay_interactions` | historical | forensics_capability | NO | recordingId |
| 182 | `fx_failure_replay` | historical | forensics_capability | NO | mode |
| 183 | `fx_selector_survivability` | historical | forensics_capability | NO | None |
| 184 | `fx_component_boundaries` | historical | forensics_capability | NO | None |
| 185 | `fx_frame_forensics` | historical | forensics_capability | NO | None |
| 186 | `fx_shadow_dom_forensics` | historical | forensics_capability | NO | None |
| 187 | `fx_css_influence` | historical | forensics_capability | NO | selector |
| 188 | `fx_zindex_occlusion` | historical | forensics_capability | NO | selector |
| 189 | `fx_event_listeners` | historical | forensics_capability | NO | None |
| 190 | `fx_error_root_cause` | historical | forensics_capability | NO | None |
| 191 | `fx_network_dom_binding` | historical | forensics_capability | NO | None |
| 192 | `fx_resource_waterfall` | historical | forensics_capability | NO | None |
| 193 | `fx_font_forensics` | historical | forensics_capability | NO | None |
| 194 | `fx_a11y_divergence` | historical | forensics_capability | NO | None |
| 195 | `fx_page_health` | historical | forensics_capability | NO | None |
| 196 | `fx_exploration_planner` | historical | forensics_capability | NO | None |
| 197 | `fx_smart_snapshot` | historical | forensics_capability | NO | None |
| 198 | `fx_cross_signal_search` | historical | forensics_capability | NO | query |
| 199 | `fx_forensic_export` | historical | forensics_capability | NO | None |
| 200 | `fx_forensic_import` | historical | forensics_capability | NO | bundleJson |
| 201 | `fx_impact_prediction` | historical | forensics_capability | NO | operation, selector |
| 202 | `fx_safe_mutation_guard` | historical | forensics_capability | NO | operation, selector |
| 203 | `fx_transaction_journal` | historical | forensics_capability | NO | None |
| 204 | `fx_session_graph` | historical | forensics_capability | NO | None |
| 205 | `fx_evidence_scoring` | historical | forensics_capability | NO | conclusion, supporting |
| 206 | `fx_incident_report` | historical | forensics_capability | NO | None |
