# MCP Capability Discovery Report

**Total Discovered Tools**: 121
**Discovery Timestamp**: 2026-09-10T01:21:53.184Z

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
