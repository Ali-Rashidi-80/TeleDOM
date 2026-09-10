# MCP Tools Reference — MCPDOM Browser v3

> 121 tools across 15 groups. Tool discovery tools: get_tool_groups, get_tool_catalog.

## Tool Groups

### session-forensics (21)
Historical forensic session management and analysis (recorded sessions, timelines, DOM states, diffs, lifecycle tracing).

`list_sessions` · `get_session` · `export_session` · `import_session` · `delete_session` · `get_timeline` · `get_events` · `get_events_around` · `get_dom_state` · `get_dom_node` · `get_dom_subtree` · `diff_dom` · `trace_element` · `find_disappearing_elements` · `why_did_element_disappear` · `get_diagnostics` · `get_network_events` · `get_screenshots` · `annotate_session` · `get_annotations` · `get_recording_health`

### inspection (14)
Live page and element inspection: page metadata, element deep-info, visual state, DOM snapshots and analyzers.

`inspect_live_page` · `inspect_live_element` · `get_element_visual_state` · `get_live_dom_snapshot` · `get_live_dom_subtree` · `get_tab_console_logs` · `get_tab_network_requests` · `get_element_ancestry` · `get_element_accessibility` · `get_computed_style` · `analyze_dom` · `search_dom` · `get_page_blueprint` · `get_element_fingerprint`

### targeting (3)
Element targeting resilience: TARGET generation, selector candidates with confidence, recovery, diagnostics.

`generate_element_target` · `recover_selector` · `diagnose_selector_failure`

### interaction (16)
Page interaction: clicks, typing, hover, focus, keyboard, drag-and-drop, checkboxes, selects, waits.

`interact_with_element` · `click_element` · `type_text` · `hover_element` · `focus_element` · `blur_element` · `press_keyboard_shortcut` · `scroll_to_element` · `scroll_page` · `drag_and_drop` · `set_input_checked` · `select_option` · `wait_for_condition` · `wait_for_dom_stable` · `set_interaction_profile` · `get_interaction_profile`

### tabs-browser (11)
Tab lifecycle and browser control: open/close/switch tabs, extension management, navigation, reload.

`list_tabs` · `focus_tab` · `reload_tab` · `close_tab` · `open_tab` · `list_extensions` · `set_extension_enabled` · `toggle_extension` · `reload_extension` · `compare_extension_states` · `get_browser_session`

### selection-capture (5)
Interactive element selection (Ctrl+Shift+Click / picker) and element observation.

`get_selected_element` · `start_element_picker` · `stop_element_picker` · `start_element_observation` · `stop_element_observation`

### viewport-responsive (5)
Viewport control and responsive testing: resize, presets, device emulation, multi-viewport workflows.

`resize_viewport` · `reset_viewport` · `get_viewport_state` · `run_responsive_test` · `emulate_device`

### javascript (2)
Observable JavaScript execution with explicit outcome states and change capture.

`execute_javascript` · `execute_js_and_capture_changes`

### dom-mutation (8)
First-class DOM mutation engine: operations with diff, transactions, undo/redo, history, preview.

`mutate_dom` · `mutate_dom_transaction` · `undo_dom_mutation` · `redo_dom_mutation` · `get_mutation_history` · `preview_dom_mutation` · `preview_command` · `clone_dom_subtree`

### command-sequences (10)
Command sequences, recording, replay, import/export of deterministic command data.

`execute_pipeline` · `execute_command_sequence` · `record_commands_start` · `record_commands_stop` · `list_command_recordings` · `get_command_recording` · `replay_command_recording` · `export_command_recording` · `import_command_recording` · `delete_command_recording`

### page-state (5)
Page state snapshots and time-travel comparison.

`capture_page_state` · `compare_page_states` · `list_page_states` · `get_action_timeline` · `get_operation_trace`

### projects-knowledge (14)
Project folders, region capture/annotation, relationship graphs, reconstruction specs, agent packages.

`create_page_project` · `list_projects` · `get_project` · `delete_project` · `capture_page_region` · `annotate_element` · `list_region_annotations` · `get_region_annotation` · `update_region_annotation` · `delete_region_annotation` · `get_region_relationship_graph` · `generate_reconstruction_spec` · `export_agent_package` · `import_project`

### screenshots (2)
Visual capture: page and element screenshots with geometry metadata.

`capture_page_screenshot` · `capture_element_screenshot`

### security-privacy (2)
Capture redaction configuration and exclusion rules.

`get_redaction_rules` · `set_redaction_rules`

### discovery (2)
Meta-tools: tool catalog and group discovery for agent self-orientation.

`get_tool_catalog` · `get_tool_groups`

## Complete Tool List

| # | Tool | Group | Description |
|---|------|-------|-------------|
| 1 | `list_sessions` | session-forensics | List all recorded browser forensic debugging sessions with metadata, timestamps, and stats. |
| 2 | `get_session` | session-forensics | Retrieve full metadata, capabilities, health status, and statistics for a specific debugging session. |
| 3 | `export_session` | session-forensics | Export a complete recording session as a portable, self-contained JSON bundle. |
| 4 | `import_session` | session-forensics | Import a recording session bundle from raw JSON string. |
| 5 | `delete_session` | session-forensics | Delete a recording session from storage. |
| 6 | `get_timeline` | session-forensics | Retrieve summary breakdown of events across the session timeline, including event categories and significant milestones. |
| 7 | `get_events` | session-forensics | Query recorded events with filtering by category (DOM, USER, ERROR, CONSOLE, NETWORK, etc.), type, timestamp range, target node, or search query. |
| 8 | `get_events_around` | session-forensics | Retrieve a focused contextual window of events occurring immediately before and after a specific timestamp or event ID. |
| 9 | `get_dom_state` | session-forensics | Reconstruct the complete DOM snapshot at an arbitrary timestamp or event ID using checkpoint delta replay. |
| 10 | `get_dom_node` | session-forensics | Inspect detailed properties of a specific DOM node at a given timestamp (tag, attributes, text, parent, children, visibility state). |
| 11 | `get_dom_subtree` | session-forensics | Reconstruct and extract the HTML of a specific subtree (e.g. #app or .gpt-panel) at a given timestamp. |
| 12 | `diff_dom` | session-forensics | Compare two DOM states between timestamp T1 and T2 (or event E1 and E2) and return structured additions, removals, moves, attribute, style, and text changes. |
| 13 | `trace_element` | session-forensics | Trace the entire chronological lifecycle of a DOM element from creation, mounting, mutations, style changes to unmounting/removal. |
| 14 | `find_disappearing_elements` | session-forensics | Automatically scan the session and identify all elements that existed temporarily and were subsequently removed or hidden. |
| 15 | `why_did_element_disappear` | session-forensics | Forensic root-cause diagnosis for why an injected or existing UI element disappeared. Pinpoints removal mechanism, ancestor container destruction, style changes, and correlated errors/network triggers. |
| 16 | `get_diagnostics` | session-forensics | Query recorded console messages, runtime errors, and unhandled promise rejections with stack traces. |
| 17 | `get_network_events` | session-forensics | Query recorded network requests and responses correlated with timing and duration. |
| 18 | `get_screenshots` | session-forensics | List visual checkpoints and screenshot checkpoints captured during the recording session. |
| 19 | `annotate_session` | session-forensics | Add an investigative annotation or hypothesis to the session timeline. |
| 20 | `get_annotations` | session-forensics | Retrieve all human and AI annotations created for a session. |
| 21 | `get_recording_health` | session-forensics | Run an automated integrity audit on a recording session to check sequence monotonicity, missing nodes, and capability health. |
| 22 | `inspect_live_page` | inspection | Inspect the current live browser page state, including URL, title, viewport dimensions, scroll positions, readyState, active and focused elements. |
| 23 | `inspect_live_element` | inspection | Deeply inspect a live DOM element on the active browser page by CSS selector, LogicalNodeId, or selectedElementRef, returning bounds, computed styles, visibility, attributes, state, role, aria, and parent context. |
| 24 | `get_element_visual_state` | inspection | Inspect detailed visual layout, occlusion, clipping, opacity, z-index, and viewport visibility for a live element. |
| 25 | `get_live_dom_snapshot` | inspection | Capture the current live virtual DOM state snapshot of the active or specified browser tab in HTML or structured JSON format. |
| 26 | `get_live_dom_subtree` | inspection | Reconstruct and extract the live HTML or node structure of a specific subtree on the active or specified browser tab. |
| 27 | `get_tab_console_logs` | inspection | Retrieve live intercepted console logs, uncaught JavaScript errors, and unhandled promise rejections for a specific tab or the active tab. |
| 28 | `get_tab_network_requests` | inspection | Retrieve live intercepted network requests and responses (Fetch, XHR) for a specific tab or the active tab, including method, URL, status, duration, and errors. |
| 29 | `get_element_ancestry` | inspection | Analyze element ancestry: ancestors chain (tag, selector, role, text, child index, sibling count, distance), nearby siblings (before/after with distance), and descendant summary (count, max depth, tags, interactive desce |
| 30 | `get_element_accessibility` | inspection | Extract accessibility metadata: explicit/implicit role, accessible name with sources, description, value, states, heading level, focusability, tabIndex, all aria-* attributes, and detected a11y issues. Input: target/sele |
| 31 | `get_computed_style` | inspection | Extract computed CSS style properties for an element. Input: target/selector + optional properties list (defaults to a layout-relevant set). Output: property→value map. Fails with STYLE_UNAVAILABLE when getComputedStyle  |
| 32 | `analyze_dom` | inspection | Run a named DOM analyzer: analyze_forms, extract_links, analyze_media, get_css_variables, analyze_fonts, extract_color_palette, detect_zindex_conflicts, detect_layout_issues, census_interactive_elements, detect_semantic_ |
| 33 | `search_dom` | inspection | Search the DOM by text, tag and attribute patterns with scored results (selector, role, text, visibility, bounds). The fastest way to find elements without knowing selectors. Input: query (required), optional tag, attr,  |
| 34 | `get_page_blueprint` | inspection | Generate a page blueprint: major sections with bounds and roles, hierarchy tree, key interactive elements, repeated components (patterns with occurrence counts), layout relationships and semantic regions. The architectur |
| 35 | `get_element_fingerprint` | inspection | Compute the structural DOM fingerprint of an element: stable hash, tag hierarchy, stable attributes, meaningful text, class list, role, dimensions, ancestor/descendant patterns, plus a volatility risk assessment with rea |
| 36 | `generate_element_target` | targeting | Build the canonical multi-strategy TARGET object for an element: ranked selector candidates with confidence, xpath, DOM path, text/attribute/structural fingerprints and bounds. Use before storing or acting on elements to |
| 37 | `recover_selector` | targeting | Recover a failed element selector via fingerprint matching: inspects the previous target snapshot, searches candidate matches, scores them, and attempts SAFE recovery (refuses below 0.62 confidence or ambiguous matches). |
| 38 | `diagnose_selector_failure` | targeting | Diagnose WHY a selector fails: syntax validity, match count, relaxation attempts that work, and human-readable diagnosis. Complements recover_selector (which attempts to fix). Input: selector. Output: validity, matches,  |
| 39 | `interact_with_element` | interaction | Perform an interaction (click, double_click, right_click, hover, focus, blur, type, clear, press_key, select_option, scroll_into_view, scroll) on a live element and return before/after state and effect measurements. |
| 40 | `click_element` | interaction | Production-grade click with explicit mode: normal (synthetic pointer event sequence), double, right, or human-like (movement trajectory + click delay from the active interaction profile). Records which mode was actually  |
| 41 | `type_text` | interaction | Robust typing into inputs, textareas and contenteditable with mode: append, replace (clear then type) or clear. Framework-sensitive: dispatches keydown/keypress/input/change per character. Input: target/selector, text, m |
| 42 | `hover_element` | interaction | Hover an element: pointerenter/mouseenter/mouseover/mousemove event sequence. Input: target/selector. Output: InteractionResult. |
| 43 | `focus_element` | interaction | Focus an element (native focus() + focus event). Input: target/selector. Output: InteractionResult. |
| 44 | `blur_element` | interaction | Blur (defocus) an element (native blur() + blur event). Input: target/selector. Output: InteractionResult. |
| 45 | `press_keyboard_shortcut` | interaction | Press a key or keyboard shortcut on an element (or the active element): keydown+keyup per key with modifier flags. Input: keys (e.g. ["Control","Shift","P"] or "Control+Shift+P"), optional target. Output: events fired an |
| 46 | `scroll_to_element` | interaction | Scroll an element into view (block: center). Input: target/selector. Output: before/after scroll positions and target selector. |
| 47 | `scroll_page` | interaction | Scroll the page by a distance: x/y pixel offsets. Input: x, y. Output: before/after scroll positions. |
| 48 | `drag_and_drop` | interaction | Drag and drop: HTML5 drag events (dragstart/dragenter/dragover/drop/dragend) plus pointer events between source and target (or by pixel offsets). Input: source (target specifier), optional target specifier or offsets. Ou |
| 49 | `set_input_checked` | interaction | Check/uncheck a checkbox or select a radio (peer radios with the same name are deselected). Dispatches input + change events. Input: target/selector, checked (default true). Output: checkedBefore/checkedAfter and events  |
| 50 | `select_option` | interaction | Select an option in a dropdown: sets value and dispatches change. Input: target/selector, value. Output: InteractionResult. |
| 51 | `wait_for_condition` | interaction | Wait for a meaningful condition instead of arbitrary sleeps: dom_stable, selector_present, selector_visible, selector_absent, text_present, url_contains, element_count, readiness_state. Input: kind + condition params, ti |
| 52 | `wait_for_dom_stable` | interaction | Convenience wrapper for wait_for_condition {kind: dom_stable}: polls until two consecutive DOM length observations match. Input: timeoutMs. Output: satisfied + waitedMs. |
| 53 | `set_interaction_profile` | interaction | Set the human-interaction profile for subsequent interactions: DETERMINISTIC (zero delay), BALANCED (small natural delays), HUMAN_LIKE (realistic cadence, trajectories, hesitation) or CUSTOM (user timing parameters, seed |
| 54 | `get_interaction_profile` | interaction | Inspect the active interaction profile and the timing of the last action (requested mode, actual mode, per-phase timings, total duration). Output: InteractionProfileReport. |
| 55 | `list_tabs` | tabs-browser | List all open Chrome browser tabs across windows with tab ID, title, URL, active state, window ID, status, and recording status. |
| 56 | `focus_tab` | tabs-browser | Switch active focus to a specific browser tab by tabId and bring its window to the foreground. |
| 57 | `reload_tab` | tabs-browser | Reload a specific browser tab or the active tab with optional hard refresh (bypassCache). |
| 58 | `close_tab` | tabs-browser | Close a specific browser tab by tabId, URL substring, or pattern (e.g., "meet", "calendar"). |
| 59 | `open_tab` | tabs-browser | Open a new browser tab with the specified URL, meeting link, web page, or local file path in Chrome. |
| 60 | `list_extensions` | tabs-browser | List all installed Chrome extensions with ID, name, version, enabled status, installation type, and permissions. |
| 61 | `set_extension_enabled` | tabs-browser | Enable or disable a specific Chrome extension by ID (e.g. turn off extension to observe native clean UI, then turn back on). |
| 62 | `toggle_extension` | tabs-browser | Toggle the enabled status of a specific Chrome extension by ID. |
| 63 | `reload_extension` | tabs-browser | Reload an extension under development. If extensionId is provided, toggles and reloads that extension. If omitted, reloads the Forensic Recorder extension itself. |
| 64 | `compare_extension_states` | tabs-browser | Automatically perform a complete before/after comparative forensic audit: disables extension, reloads and captures clean native state/screenshot, enables extension, reloads and captures injected state/screenshot, and ret |
| 65 | `get_browser_session` | tabs-browser | Inspect the coherent browser session model: tabs with stable session identities, active tab, viewport state, extension state, snapshot count, command count, mutation history count, timeline event count, bound project id. |
| 66 | `get_selected_element` | selection-capture | Retrieve the DOM element visually selected by the user via Ctrl + Shift + Mouse Click in the live browser. |
| 67 | `start_element_picker` | selection-capture | Activate the interactive visual element picker mode in the live browser with hover highlighting and click selection. |
| 68 | `stop_element_picker` | selection-capture | Deactivate the visual element picker mode in the browser and restore normal cursor and interaction state. |
| 69 | `start_element_observation` | selection-capture | Start focused continuous recording and observation around a target element and its subtree/ancestors. |
| 70 | `stop_element_observation` | selection-capture | Stop focused element observation and assemble a complete correlation bundle with mutations, diagnostics, network activity, and root-cause analysis. |
| 71 | `resize_viewport` | viewport-responsive | Resize the viewport (width/height in pixels or a named preset). ALWAYS reversible: the original size is recorded on first use. Captures before/after page digests. Input: width+height, or preset (desktop-hd, tablet-ipad,  |
| 72 | `reset_viewport` | viewport-responsive | Restore the original viewport size recorded before the first resize (guaranteed RESET_VIEWPORT semantics). Also clears the active preset/device. Input: none. Output: ViewportResizeResult with restored dimensions. |
| 73 | `get_viewport_state` | viewport-responsive | Inspect the viewport: current width/height/dpr/scroll plus the recorded original and whether it is currently modified. Input: none. |
| 74 | `run_responsive_test` | viewport-responsive | Run a multi-viewport responsive workflow: applies each size, records DOM length/interactive count/horizontal overflow per step, compares steps, then RESTORES the original viewport (unless restore:false). Input: sizes arr |
| 75 | `emulate_device` | viewport-responsive | Emulate a device profile: viewport + devicePixelRatio + touch metadata + reported UA (UA override applied only in a real browser session; honestly reported otherwise). Input: device (iphone-13, ipad-air, pixel-7, galaxy- |
| 76 | `execute_javascript` | javascript | Execute JavaScript with explicit outcome states: EXECUTED_SUCCESSFULLY, EXECUTED_WITH_ERROR, TIMED_OUT, SERIALIZATION_FAILED, BLOCKED_BY_CONTEXT, NOT_CONNECTED. Captures console output, duration, and DOM-change indicatio |
| 77 | `execute_js_and_capture_changes` | javascript | Composite: execute JavaScript AND capture the DOM state before/after with a structural diff summary + page-state snapshots. Same input as execute_javascript. Output: JSExecutionResult + before/after PageStateSnapshot + c |
| 78 | `mutate_dom` | dom-mutation | Apply a first-class DOM mutation with full observability (BEFORE → ACTION → AFTER → DIFF) and a guaranteed undo record. Operations: set_attribute, remove_attribute, set_text, replace_text, set_inner_html, set_outer_html, |
| 79 | `mutate_dom_transaction` | dom-mutation | Transactional DOM mutation: mode=begin opens a transaction, subsequent mutate_dom calls join it, mode=commit verifies and commits (all-or-nothing), mode=rollback reverts every step in reverse order. Input: mode, optional |
| 80 | `undo_dom_mutation` | dom-mutation | Undo the last DOM mutation (or the last mutation of the open transaction) using its immutable inverse record. Input: none. Output: success + undone mutation id. Idempotent-safe: reports "nothing to undo" when the stack i |
| 81 | `redo_dom_mutation` | dom-mutation | Redo the last undone DOM mutation (forward patch re-applied only when safe). Input: none. Output: success + redone mutation id. |
| 82 | `get_mutation_history` | dom-mutation | Inspect the DOM mutation history: entries (operation, target, summary, undo/redo flags), undo depth, redo depth, open transaction id. Input: limit (default 100). Side effect: none. |
| 83 | `preview_dom_mutation` | dom-mutation | Dry-run a mutation: validates the target, describes the expected change, counts affected nodes and warns about destructive operations — WITHOUT modifying anything. Input: identical to mutate_dom. Output: MutationPreview. |
| 84 | `preview_command` | dom-mutation | Dry-run preview of a DOM mutation: valid flag, expected change description, affected node count and warnings — WITHOUT applying anything. Input: operation + target + params (same as mutate_dom). Output: MutationPreview.  |
| 85 | `clone_dom_subtree` | dom-mutation | Clone a DOM subtree (deep clone appended to a parent or the original parent; ids are never duplicated). Input: target, optional parent, copyAttributes. Output: DOMMutationResult (undoable). Side effect: adds cloned nodes |
| 86 | `execute_pipeline` | command-sequences | Execute a batch sequence of browser and extension actions in one call (e.g. reload extension, wait, reload tab, take screenshot directly to file, dump DOM to file) and aggregate all results. |
| 87 | `execute_command_sequence` | command-sequences | Execute a command sequence with per-command records (id, timestamp, target, args, status, result, duration, error): sequential execution, conditional continuation (condition.previousStepSucceeded), explicit stop-on-error |
| 88 | `record_commands_start` | command-sequences | Start recording subsequent tool invocations into a named command recording. Input: name, description, tags. Output: active recording metadata. Side effect: recording mode ON (adds latency-free capture to every tool call) |
| 89 | `record_commands_stop` | command-sequences | Stop the active command recording and persist it to storage (.mcpdom_recordings). Input: none (uses active recording). Output: the finished CommandRecording. |
| 90 | `list_command_recordings` | command-sequences | List saved command recordings with metadata (id, name, command count, timestamps, tags). Input: none. Side effect: none. |
| 91 | `get_command_recording` | command-sequences | Load one command recording in full (all commands with args and outcomes). Input: recordingId. Output: CommandRecording. Side effect: none. |
| 92 | `replay_command_recording` | command-sequences | Replay a saved command recording: executes each recorded tool call in order with deterministic arguments. Input: recordingId, stopOnError (default true). Output: CommandSequenceResult. Side effects: those of the recorded |
| 93 | `export_command_recording` | command-sequences | Export a command recording as portable JSON (with schema version) for another agent or session. Input: recordingId, outputPath (optional). Output: the exported JSON + save info. |
| 94 | `import_command_recording` | command-sequences | Import a command recording from JSON (previously exported). Input: recordingJson. Output: imported recording metadata. Side effect: writes to recordings storage. |
| 95 | `delete_command_recording` | command-sequences | Delete a saved command recording. Input: recordingId. Side effect: removes stored data (irreversible). |
| 96 | `capture_page_state` | page-state | Capture a page state snapshot (comparison anchor): url, title, viewport, dom length + hash, interactive count, extension state, pending mutations, annotation count. Input: none. Output: PageStateSnapshot (also recorded i |
| 97 | `compare_page_states` | page-state | Compare two page state snapshots ("what changed after this command?"): field-level diffs, DOM size delta, summary. Input: snapshotIdA + snapshotIdB (omit both to compare the two most recent snapshots). Side effect: none. |
| 98 | `list_page_states` | page-state | List captured page state snapshots (ids, timestamps, urls, dom sizes). Input: none. Side effect: none. |
| 99 | `get_action_timeline` | page-state | Query the chronological action timeline (TAB_OPENED, CLICKED, DOM_MUTATED, SNAPSHOT_CREATED, ERROR_OCCURRED, …) with optional filters (kind, sinceTimestamp, limit). The platform observability layer. Input: optional filte |
| 100 | `get_operation_trace` | page-state | Trace a single operation by its operationId: tool, start/end, duration, status, correlated timeline events, related error. Input: operationId (or latest). Side effect: none. |
| 101 | `create_page_project` | projects-knowledge | Create a portable page-analysis project folder (project.json, page.json, regions/, screenshots/, dom/, commands/, diffs/, metadata/, instructions/). The DOM snapshot is captured CLEANED: MCPDOM-injected artifacts exclude |
| 102 | `list_projects` | projects-knowledge | List page-analysis projects with manifests (names, page counts, region counts, timestamps). Input: none. Side effect: none. |
| 103 | `get_project` | projects-knowledge | Load a project in full: manifest, page manifest, and all region annotations. Input: projectName. Side effect: none. |
| 104 | `delete_project` | projects-knowledge | Delete a project folder permanently. Input: projectName. Side effect: irreversible file removal. |
| 105 | `capture_page_region` | projects-knowledge | Capture a page region into a project: resolves the element, captures LOCAL DOM + RELEVANT CONTEXT DOM (meaningful boundary), ranked selector candidates, fingerprint, styles, dimensions, auto-generated name and (optionall |
| 106 | `annotate_element` | projects-knowledge | Annotate a live element and capture it into a project (alias of capture_page_region with annotation semantics front and center): OBSERVED element data, USER comment/name/tags, INTENDED CHANGE and VERIFICATION CONDITIONS  |
| 107 | `list_region_annotations` | projects-knowledge | List region annotations in a project (names, selectors, quality grades, intended changes). Input: projectName. Side effect: none. |
| 108 | `get_region_annotation` | projects-knowledge | Load one region annotation in full (observed facts, user fields, intended change, verification, quality score). Input: projectName, regionId. Side effect: none. |
| 109 | `update_region_annotation` | projects-knowledge | Update the USER fields of a region annotation (name, description, comment, tags, notes, intendedChange, verification). Observed facts are never editable. Quality is recomputed. Input: projectName, regionId, updates. Side |
| 110 | `delete_region_annotation` | projects-knowledge | Delete a region annotation from a project. Input: projectName, regionId. Side effect: removes the region file and updates manifests. |
| 111 | `get_region_relationship_graph` | projects-knowledge | Build the region relationship graph for a project: nodes (page + regions) and edges (contains, sibling-of, ancestor-of, overlaps) derived from live DOM containment. Input: projectName. Side effect: none. |
| 112 | `generate_reconstruction_spec` | projects-knowledge | Generate (and persist) the canonical page reconstruction specification for a project: metadata, viewport, structure, regions with selector candidates, hierarchy, semantic roles, visual constraints, interactions, selector |
| 113 | `export_agent_package` | projects-knowledge | Export a self-contained Agent handoff package for another AI agent: README.md, PROJECT.md, agent-instructions.md, project.json, pages/, regions/, snapshots/, diffs/, commands/, assets/, schemas/, verification/. The packa |
| 114 | `import_project` | projects-knowledge | Import a project previously exported via export_agent_package or a project folder copy: restores manifest, page, regions, diffs and command recordings into working storage. Input: projectDir. Side effect: copies files in |
| 115 | `capture_page_screenshot` | screenshots | Capture a screenshot of the visible browser page viewport with temporal, scroll, and viewport metadata. When outputPath is provided, saves decoded image directly to disk. |
| 116 | `capture_element_screenshot` | screenshots | Capture an element-specific screenshot bounded to the target element exact geometry and device pixel ratio. When outputPath is provided, saves decoded image directly to disk. |
| 117 | `get_redaction_rules` | security-privacy | Inspect the capture redaction configuration: all rules (key patterns, value patterns, attribute patterns) with enabled flags, and capture exclusions. Input: none. Side effect: none. |
| 118 | `set_redaction_rules` | security-privacy | Configure capture redaction: enable/disable existing rules, add custom key/value/attribute patterns, or add capture exclusions (selectors never captured). Built-in rules can be disabled but never removed. Input: enable/d |
| 119 | `get_tool_catalog` | discovery | Return the full MCP tool catalog with per-tool metadata: purpose, required context, accepted input, output, side effects, failure conditions, recovery strategy, and tool group. The meta-tool an agent calls FIRST to decid |
| 120 | `get_tool_groups` | discovery | List discoverable tool groups (inspection, targeting, interaction, viewport, javascript, mutation, sequences, session, projects, security, discovery) with descriptions and member tool names. Input: none. Side effect: non |
