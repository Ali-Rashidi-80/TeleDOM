# 📚 Complete Tool Catalog — TeleDOM 121 Tools Reference

TeleDOM provides a production-certified suite of **121 tools** across **15 functional groups**, compliant with the **Model Context Protocol (MCP) JSON-RPC 2.0** specification.

Every tool adheres to the **Agent Discovery Contract (§44)**: tools communicate their purpose, required context, parameters, return types, side effects, failure modes, and deterministic recovery strategies.

---

## 🧭 Tool Discovery Meta-Tools

Agents can inspect tool metadata dynamically at runtime:
- `get_tool_groups`: Lists all 15 functional tool groups and their member tools.
- `get_tool_catalog`: Returns the complete structured schema for all 121 tools.

---

## 📑 15 Functional Groups Breakdown

| # | Group | Tool Count | Primary Responsibility |
|---|-------|:----------:|------------------------|
| 1 | `session-forensics` | 21 | Historical recorded sessions, time-travel timeline, DOM diffs & lifecycle tracing |
| 2 | `inspection` | 14 | Live page & element deep-inspection, visual geometry, computed styles & accessibility |
| 3 | `targeting` | 3 | Resilient multi-strategy TARGET generation, selector recovery & failure diagnosis |
| 4 | `interaction` | 16 | Clicks, typing modes, hover, focus, keyboard shortcuts, drag-and-drop & waits |
| 5 | `tabs-browser` | 11 | Chrome tabs lifecycle, extension management, toggle, reload & state comparisons |
| 6 | `selection-capture` | 5 | Interactive element picking (`Ctrl+Shift+Click`), live element observation |
| 7 | `viewport-responsive`| 5 | Dynamic viewport resizing, presets, device emulation & responsive test workflows |
| 8 | `javascript` | 2 | Observable JavaScript execution with state mutation and side-effect capture |
| 9 | `dom-mutation` | 8 | First-class DOM mutation engine, atomic transactions, undo/redo & previews |
| 10 | `command-sequences` | 10 | Deterministic action recording, replay pipelines, import/export of workflows |
| 11 | `page-state` | 5 | Whole-page snapshots, time-travel comparisons, action timelines & operation traces |
| 12 | `projects-knowledge`| 14 | Project workspaces, region annotations, relationship graphs & reconstruction specs |
| 13 | `screenshots` | 2 | Element-cropped & full-page screenshot capture with geometry metadata |
| 14 | `security-privacy` | 2 | Automatic PII redaction rules and DOM sanitization exclusions |
| 15 | `discovery` | 2 | Runtime tool catalog and capability group self-orientation |

---

## 🛠️ Complete 121 Tools Exhaustive Matrix

### Group 1: Session Forensics (`session-forensics` - 21 Tools)
1. `list_sessions`: List all recorded browser forensic debugging sessions with metadata and statistics.
2. `get_session`: Retrieve full metadata, capabilities, health status, and statistics for a session.
3. `export_session`: Export a complete recording session as a portable, self-contained JSON bundle.
4. `import_session`: Import a recording session bundle from a JSON string.
5. `delete_session`: Delete a recording session from persistent storage.
6. `get_timeline`: Retrieve summary breakdown of events across the session timeline.
7. `get_events`: Query recorded events with filtering by category (DOM, USER, ERROR, CONSOLE, NETWORK, etc.).
8. `get_events_around`: Retrieve a focused contextual window of events occurring around a timestamp.
9. `get_dom_state`: Reconstruct the complete DOM snapshot at an arbitrary timestamp or event ID.
10. `get_dom_node`: Inspect detailed properties of a specific DOM node at a given timestamp.
11. `get_dom_subtree`: Reconstruct and extract the HTML of a specific subtree at a given timestamp.
12. `diff_dom`: Compare two DOM states between timestamp T1 and T2 with structured diff output.
13. `trace_element`: Trace the entire chronological lifecycle of an element from mount to unmount.
14. `find_disappearing_elements`: Scan the session and identify elements that were removed or hidden.
15. `why_did_element_disappear`: Forensic root-cause diagnosis for why an element disappeared.
16. `get_diagnostics`: Extract all console logs, runtime errors, and network anomalies for a session.
17. `get_network_events`: Retrieve network request/response lifecycle records.
18. `get_screenshots`: Retrieve all visual checkpoint screenshots associated with a session.
19. `annotate_session`: Attach investigative notes and root-cause labels to a session.
20. `get_annotations`: List all user and agent annotations on a session.
21. `get_recording_health`: Audit recording integrity, sequence continuity, and dropped frames.

### Group 2: Live Inspection (`inspection` - 14 Tools)
22. `inspect_live_page`: Inspect active page URL, dimensions, title, readyState, and viewport metrics.
23. `inspect_live_element`: Inspect live element attributes, bounding rect, visibility, and parent chain.
24. `get_element_visual_state`: Check computed visibility, z-index stacking, occlusion, and opacity.
25. `get_live_dom_snapshot`: Capture full live page DOM as sanitized HTML or VirtualDOM tree.
26. `get_live_dom_subtree`: Extract outerHTML and metadata of an element and its descendants.
27. `get_tab_console_logs`: Retrieve buffered live console logs (log, warn, error, info).
28. `get_tab_network_requests`: Retrieve buffered network requests with status, timing, and errors.
29. `get_element_ancestry`: Analyze ancestor hierarchy, siblings, and descendant statistics.
30. `get_element_accessibility`: Evaluate ARIA role, accessible name, computed label, and keyboard focusability.
31. `get_computed_style`: Read computed CSS styles for specified properties.
32. `analyze_dom`: Run one of 27 DOM analyzers (layout, interactive, form, storage, etc.).
33. `search_dom`: Find elements by text, tag, CSS selector, attribute pattern, or ARIA role.
34. `get_page_blueprint`: Generate structured architectural blueprint of the page.
35. `get_element_fingerprint`: Compute structural, text, and attribute hashes for an element.

### Group 3: Targeting Resilience (`targeting` - 3 Tools)
36. `generate_element_target`: Build canonical multi-strategy TARGET object with confidence scores.
37. `recover_selector`: Safely recover a failed selector using fingerprint matching (gates at 0.62 confidence).
38. `diagnose_selector_failure`: Diagnose why a selector failed (syntax, match count, relaxation suggestions).

### Group 4: Synthetic & Human-Like Interaction (`interaction` - 16 Tools)
39. `interact_with_element`: Universal action executor (click, type, hover, clear) with stabilization wait.
40. `click_element`: Click element with mode (`normal`, `double`, `right`, `human-like`).
41. `type_text`: Type text with configurable cadence, focus, and input events.
42. `hover_element`: Move cursor over element to trigger hover states and dropdowns.
43. `focus_element`: Set focus on an interactive element.
44. `blur_element`: Remove focus from an active element.
45. `press_keyboard_shortcut`: Dispatch keyboard shortcut combinations (e.g., `Control+Shift+KeyK`, `Enter`).
46. `scroll_to_element`: Scroll viewport until target element is centered in view.
47. `scroll_page`: Scroll page by delta X/Y or to specific top/bottom positions.
48. `drag_and_drop`: Drag source element and drop onto target element coordinates.
49. `set_input_checked`: Toggle or set checkbox / radio input checked state.
50. `select_option`: Select option in a `<select>` dropdown by value, label, or index.
51. `wait_for_condition`: Wait until CSS selector, text content, or predicate condition is met.
52. `wait_for_dom_stable`: Wait until DOM mutations settle for a specified quiet period.
53. `set_interaction_profile`: Set cadence profile (`DETERMINISTIC`, `BALANCED`, `HUMAN_LIKE`, `CUSTOM`).
54. `get_interaction_profile`: Read active interaction timing parameters.

### Group 5: Browser & Tab Control (`tabs-browser` - 11 Tools)
55. `list_tabs`: List all open browser tabs with tab IDs, URLs, and active status.
56. `focus_tab`: Switch active focus to a specific browser tab.
57. `reload_tab`: Reload active tab with soft or hard cache bypass.
58. `close_tab`: Close a specific tab or active tab.
59. `open_tab`: Open a new browser tab with target URL.
60. `list_extensions`: List installed Chrome extensions and their enabled status.
61. `set_extension_enabled`: Enable or disable a specific extension.
62. `toggle_extension`: Toggle extension state on/off.
63. `reload_extension`: Hot-reload extension service worker and content scripts.
64. `compare_extension_states`: Compare page DOM with extension enabled vs disabled to detect injected artifacts.
65. `get_browser_session`: Inspect current browser session identity and bridge connection status.

### Group 6: Selection & Interactive Capture (`selection-capture` - 5 Tools)
66. `get_selected_element`: Retrieve element chosen via `Ctrl+Shift+Click` or picker mode.
67. `start_element_picker`: Activate interactive on-page element visual picker.
68. `stop_element_picker`: Deactivate visual element picker.
69. `start_element_observation`: Start recording high-resolution mutations on a specific element.
70. `stop_element_observation`: Stop observation and receive forensic mutation bundle with root-cause analysis.

### Group 7: Viewport & Responsive Testing (`viewport-responsive` - 5 Tools)
71. `resize_viewport`: Resize browser viewport to width/height or preset (`mobile`, `tablet`, `desktop`).
72. `reset_viewport`: Revert viewport to original dimensions.
73. `get_viewport_state`: Read current viewport dimensions, device pixel ratio, and orientation.
74. `run_responsive_test`: Execute test workflow across mobile, tablet, and desktop viewports with per-step DOM digests.
75. `emulate_device`: Emulate specific mobile device profiles (iPhone, Pixel, iPad).

### Group 8: JavaScript Execution (`javascript` - 2 Tools)
76. `execute_javascript`: Execute JavaScript snippet in page context and return serialized outcome.
77. `execute_js_and_capture_changes`: Execute JavaScript and return snapshot diff of all DOM mutations caused.

### Group 9: DOM Mutation Engine (`dom-mutation` - 8 Tools)
78. `mutate_dom`: Apply first-class DOM mutation (`set_attribute`, `remove_attribute`, `insert_html`, `remove_element`, `replace_text`, etc.) with diff.
79. `mutate_dom_transaction`: Execute multiple atomic DOM mutations with automatic rollback on error.
80. `undo_dom_mutation`: Revert the last applied DOM mutation.
81. `redo_dom_mutation`: Re-apply previously undone DOM mutation.
82. `get_mutation_history`: Inspect chronological log of all applied DOM mutations and their diffs.
83. `preview_dom_mutation`: Preview mutation effects without applying side effects to live page.
84. `preview_command`: Preview any interaction or mutation before executing.
85. `clone_dom_subtree`: Clone and insert DOM subtree into another parent container.

### Group 10: Command Sequences & Pipelines (`command-sequences` - 10 Tools)
86. `execute_pipeline`: Execute multi-step command pipeline with condition branching.
87. `execute_command_sequence`: Execute linear sequence of tool calls with error-handling policy.
88. `record_commands_start`: Begin recording all subsequent tool calls into a named workflow.
89. `record_commands_stop`: Stop recording and save reproducible workflow script.
90. `list_command_recordings`: List all saved command recording workflows.
91. `get_command_recording`: Retrieve details and steps of a specific command recording.
92. `replay_command_recording`: Replay a recorded workflow against the active page.
93. `export_command_recording`: Export recording workflow as portable JSON.
94. `import_command_recording`: Import recording workflow from JSON.
95. `delete_command_recording`: Delete a saved recording workflow.

### Group 11: Page State & Timelines (`page-state` - 5 Tools)
96. `capture_page_state`: Capture unified immutable page state snapshot.
97. `compare_page_states`: Compute structured diff between any two captured page states.
98. `list_page_states`: List all captured state snapshots in the current session.
99. `get_action_timeline`: Retrieve consolidated chronological timeline of all user and agent actions.
100. `get_operation_trace`: Trace operation IDs and correlated network/error diagnostics.

### Group 12: Projects & Reconstruction Knowledge (`projects-knowledge` - 14 Tools)
101. `create_page_project`: Initialize a structured page project folder for reverse-engineering.
102. `list_projects`: List all project knowledge workspaces.
103. `get_project`: Retrieve project manifest, captured regions, and blueprints.
104. `delete_project`: Delete a project knowledge folder.
105. `capture_page_region`: Capture an element as an isolated component region with styles and assets.
106. `annotate_element`: Create rich region annotation with user intent, observed facts, and change spec.
107. `list_region_annotations`: List all annotated component regions in a project.
108. `get_region_annotation`: Retrieve full annotation details for a specific region.
109. `update_region_annotation`: Update region intent, notes, or verification criteria.
110. `delete_region_annotation`: Remove a region annotation from a project.
111. `get_region_relationship_graph`: Generate dependency and containment graph between component regions.
112. `generate_reconstruction_spec`: Synthesize machine-readable reconstruction specification.
113. `export_agent_package`: Package project into a portable handoff archive for another agent.
114. `import_project`: Import a shared agent project package.

### Group 13: Visual Screenshots (`screenshots` - 2 Tools)
115. `capture_page_screenshot`: Capture viewport or full-page PNG screenshot with geometry metadata.
116. `capture_element_screenshot`: Capture pixel-perfect cropped screenshot of a specific element.

### Group 14: Security & Privacy (`security-privacy` - 2 Tools)
117. `get_redaction_rules`: Read active PII redaction patterns (passwords, emails, tokens).
118. `set_redaction_rules`: Configure custom regex patterns and element exclusion selectors.

### Group 15: Discovery (`discovery` - 2 Tools)
119. `get_tool_catalog`: Retrieve machine-readable catalog of all 121 tools with inputs/outputs.
120. `get_tool_groups`: List all 15 tool groups with tool memberships.
121. `detect_semantic_elements`: Identify high-level semantic regions (headers, navs, modals, forms).
