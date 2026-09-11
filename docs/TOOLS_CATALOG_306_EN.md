# TeleDOM v4 — Complete 306 Tools Catalog & Reference Manual

**Platform Version**: 4.0.0  
**Total Agent-Facing Tools**: 306  
**Tool Namespaces**: 
- `td_*`: 100 TeleDOM Temporal Intelligence & Cognitive Tools
- `dt_*`: 54 Chrome DevTools Protocol Compatibility Tools
- `fx_*`: 31 Advanced Forensic Primitives & Diagnostic Tools
- Base / v3: 121 Core Session Recording, Live DOM Inspection & Safe Mutation Tools

---

## Table of Contents
1. [Overview & Architecture](#overview--architecture)
2. [TeleDOM v4 Intelligence Tools (100 td_* Tools)](#1-teledom-v4-intelligence-tools-td_)
3. [Chrome DevTools Compatibility Tools (54 dt_* Tools)](#2-chrome-devtools-compatibility-tools-dt_)
4. [Advanced Forensic Diagnostic Tools (31 fx_* Tools)](#3-advanced-forensic-diagnostic-tools-fx_)
5. [Core Session, Live Inspection & Mutation Tools (121 Tools)](#4-core-session-live-inspection--mutation-tools)

---


## Core Forensic Recording & Sessions (28 Tools)

### 1. `list_sessions`

**Description**: List all recorded browser forensic debugging sessions with metadata, timestamps, and stats.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `limit` | `number` | No | Maximum number of sessions to return |

---

### 2. `get_session`

**Description**: Retrieve full metadata, capabilities, health status, and statistics for a specific debugging session.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Unique identifier of the recording session |

---

### 3. `export_session`

**Description**: Export a complete recording session as a portable, self-contained JSON bundle.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Unique identifier of the recording session |

---

### 4. `import_session`

**Description**: Import a recording session bundle from raw JSON string.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `bundleJson` | `string` | Yes | Raw JSON string of the session bundle |

---

### 5. `delete_session`

**Description**: Delete a recording session from storage.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Unique identifier of the recording session |

---

### 6. `get_timeline`

**Description**: Retrieve summary breakdown of events across the session timeline, including event categories and significant milestones.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |

---

### 19. `annotate_session`

**Description**: Add an investigative annotation or hypothesis to the session timeline.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `label` | `string` | Yes | Short title for annotation |
| `comment` | `string` | Yes | Detailed investigative note or root-cause finding |
| `nodeId` | `number` | No | Optional associated LogicalNodeId |
| `category` | `string` | No | - |

---

### 21. `get_recording_health`

**Description**: Run an automated integrity audit on a recording session to check sequence monotonicity, missing nodes, and capability health.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |

---

### 22. `list_tabs`

**Description**: List all open Chrome browser tabs across windows with tab ID, title, URL, active state, window ID, status, and recording status.

*No parameters required.*

---

### 23. `focus_tab`

**Description**: Switch active focus to a specific browser tab by tabId and bring its window to the foreground.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | Yes | The unique Chrome tab ID to activate and focus |

---

### 24. `reload_tab`

**Description**: Reload a specific browser tab or the active tab with optional hard refresh (bypassCache).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Target Chrome tab ID (defaults to currently active tab if omitted) |
| `bypassCache` | `boolean` | No | Whether to ignore cached assets and perform a hard reload (default: false) |

---

### 25. `close_tab`

**Description**: Close a specific browser tab by tabId, URL substring, or pattern (e.g., "meet", "calendar").

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Target Chrome tab ID to close |
| `url` | `string` | No | URL substring or pattern of tabs to close (e.g. "meet.google.com") |

---

### 26. `open_tab`

**Description**: Open a new browser tab with the specified URL, meeting link, web page, or local file path in Chrome.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `url` | `string` | Yes | The URL, web link, meeting link, or file:// path to open |
| `active` | `boolean` | No | Whether the new tab should become the active and focused tab (default: true) |
| `pinned` | `boolean` | No | Whether the tab should be pinned (default: false) |

---

### 33. `get_tab_console_logs`

**Description**: Retrieve live intercepted console logs, uncaught JavaScript errors, and unhandled promise rejections for a specific tab or the active tab.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Target Chrome tab ID (defaults to currently active tab if omitted) |
| `level` | `string` | No | Filter by log severity level (default: all) |
| `searchQuery` | `string` | No | Filter logs containing this text or source |
| `limit` | `number` | No | Maximum number of recent log entries to return (default: 100) |
| `clearAfterRead` | `boolean` | No | Clear the internal log buffer after reading (default: false) |

---

### 34. `get_tab_network_requests`

**Description**: Retrieve live intercepted network requests and responses (Fetch, XHR) for a specific tab or the active tab, including method, URL, status, duration, and errors.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Target Chrome tab ID (defaults to currently active tab if omitted) |
| `method` | `string` | No | Filter by HTTP method (GET, POST, PUT, DELETE, etc.) |
| `status` | `number` | No | Filter by HTTP status code (e.g. 200, 404, 500) |
| `onlyErrors` | `boolean` | No | Return only failed requests or HTTP status >= 400 (default: false) |
| `searchQuery` | `string` | No | Filter requests by URL substring |
| `limit` | `number` | No | Maximum number of recent network requests to return (default: 100) |
| `clearAfterRead` | `boolean` | No | Clear the internal network buffer after reading (default: false) |

---

### 71. `wait_for_dom_stable`

**Description**: Convenience wrapper for wait_for_condition {kind: dom_stable}: polls until two consecutive DOM length observations match. Input: timeoutMs. Output: satisfied + waitedMs.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `timeoutMs` | `number` | No | Timeout (default 5000ms) |

---

### 92. `list_command_recordings`

**Description**: List saved command recordings with metadata (id, name, command count, timestamps, tags). Input: none. Side effect: none.

*No parameters required.*

---

### 93. `get_command_recording`

**Description**: Load one command recording in full (all commands with args and outcomes). Input: recordingId. Output: CommandRecording. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `recordingId` | `string` | Yes | Recording identifier |

---

### 94. `replay_command_recording`

**Description**: Replay a saved command recording: executes each recorded tool call in order with deterministic arguments. Input: recordingId, stopOnError (default true). Output: CommandSequenceResult. Side effects: those of the recorded commands — review get_command_recording first.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `recordingId` | `string` | Yes | - |
| `stopOnError` | `boolean` | No | Stop on first failure (default true) |

---

### 95. `export_command_recording`

**Description**: Export a command recording as portable JSON (with schema version) for another agent or session. Input: recordingId, outputPath (optional). Output: the exported JSON + save info.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `recordingId` | `string` | Yes | - |
| `outputPath` | `string` | No | Optional file path to write the JSON |

---

### 96. `import_command_recording`

**Description**: Import a command recording from JSON (previously exported). Input: recordingJson. Output: imported recording metadata. Side effect: writes to recordings storage.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `recordingJson` | `string` | Yes | Serialized CommandRecording JSON |

---

### 97. `delete_command_recording`

**Description**: Delete a saved command recording. Input: recordingId. Side effect: removes stored data (irreversible).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `recordingId` | `string` | Yes | - |

---

### 98. `get_browser_session`

**Description**: Inspect the coherent browser session model: tabs with stable session identities, active tab, viewport state, extension state, snapshot count, command count, mutation history count, timeline event count, bound project id. Input: none. Side effect: none.

*No parameters required.*

---

### 99. `get_action_timeline`

**Description**: Query the chronological action timeline (TAB_OPENED, CLICKED, DOM_MUTATED, SNAPSHOT_CREATED, ERROR_OCCURRED, …) with optional filters (kind, sinceTimestamp, limit). The platform observability layer. Input: optional filters. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `kind` | `string` | No | Filter by event kind |
| `sinceTimestamp` | `number` | No | Only events at/after this epoch ms |
| `limit` | `number` | No | Max events (default 200) |

---

### 115. `export_agent_package`

**Description**: Export a self-contained Agent handoff package for another AI agent: README.md, PROJECT.md, agent-instructions.md, project.json, pages/, regions/, snapshots/, diffs/, commands/, assets/, schemas/, verification/. The package fully separates OBSERVED FACTS / USER REQUESTS / EXPECTED CHANGES / VERIFICATION CONDITIONS. Input: projectName, outputDir (default ./mcpdom_agent_packages/<name>). Side effect: writes the package directory.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |
| `outputDir` | `string` | No | Output directory (default ./mcpdom_agent_packages/<name>) |

---

### 117. `import_project`

**Description**: Import a project previously exported via export_agent_package or a project folder copy: restores manifest, page, regions, diffs and command recordings into working storage. Input: projectDir. Side effect: copies files into .mcpdom_projects.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectDir` | `string` | Yes | Path to the exported project folder |

---

### 271. `td_reconcile_tabs`

**Description**: Reconcile page identity after tabs/windows change. [security: read-only; cost: low; modes: live/recorded/simulation]

*No parameters required.*

---

### 282. `td_auth_session_audit`

**Description**: Audit authentication/session behavior, expiry and state transitions. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---


## General Browser Intelligence & Control (95 Tools)

### 7. `get_events`

**Description**: Query recorded events with filtering by category (DOM, USER, ERROR, CONSOLE, NETWORK, etc.), type, timestamp range, target node, or search query.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `category` | `string` | No | Filter by category (DOM, USER, ERROR, CONSOLE, NETWORK, NAVIGATION, etc.) |
| `type` | `string` | No | Filter by exact event type (e.g. DOM_MUTATION_ADD, RUNTIME_ERROR, USER_CLICK) |
| `fromTimestamp` | `number` | No | Start timestamp in milliseconds |
| `toTimestamp` | `number` | No | End timestamp in milliseconds |
| `targetNodeId` | `number` | No | Filter by affected LogicalNodeId |
| `targetSelector` | `string` | No | Filter by CSS selector substring |
| `searchQuery` | `string` | No | Search term inside event payload |
| `limit` | `number` | No | Max events to return (default: 50) |
| `offset` | `number` | No | Offset for pagination |

---

### 8. `get_events_around`

**Description**: Retrieve a focused contextual window of events occurring immediately before and after a specific timestamp or event ID.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `timestamp` | `number` | No | Target timestamp in milliseconds |
| `eventId` | `string` | No | Target event ID |
| `windowMs` | `number` | No | Window radius in milliseconds (default: 300ms) |

---

### 9. `get_dom_state`

**Description**: Reconstruct the complete DOM snapshot at an arbitrary timestamp or event ID using checkpoint delta replay.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `timestamp` | `number` | No | Target timestamp in milliseconds |
| `eventId` | `string` | No | Target event ID |
| `format` | `string` | No | Output format (default: html) |

---

### 10. `get_dom_node`

**Description**: Inspect detailed properties of a specific DOM node at a given timestamp (tag, attributes, text, parent, children, visibility state).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `timestamp` | `number` | No | Timestamp in milliseconds |
| `nodeId` | `number` | No | LogicalNodeId to inspect |
| `selector` | `string` | No | CSS selector query if nodeId is unknown |

---

### 12. `diff_dom`

**Description**: Compare two DOM states between timestamp T1 and T2 (or event E1 and E2) and return structured additions, removals, moves, attribute, style, and text changes.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `t1` | `number` | No | Start timestamp in milliseconds |
| `t2` | `number` | No | End timestamp in milliseconds |
| `e1` | `string` | No | Start event ID (alternative to t1) |
| `e2` | `string` | No | End event ID (alternative to t2) |

---

### 13. `trace_element`

**Description**: Trace the entire chronological lifecycle of a DOM element from creation, mounting, mutations, style changes to unmounting/removal.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `nodeId` | `number` | No | LogicalNodeId of the element |
| `selector` | `string` | No | CSS selector hint for the element |

---

### 14. `find_disappearing_elements`

**Description**: Automatically scan the session and identify all elements that existed temporarily and were subsequently removed or hidden.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `maxLifespanMs` | `number` | No | Maximum lifespan in ms to consider (default: 5000ms) |

---

### 15. `why_did_element_disappear`

**Description**: Forensic root-cause diagnosis for why an injected or existing UI element disappeared. Pinpoints removal mechanism, ancestor container destruction, style changes, and correlated errors/network triggers.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `target` | `string` | Yes | CSS selector or LogicalNodeId of the target element |

---

### 16. `get_diagnostics`

**Description**: Query recorded console messages, runtime errors, and unhandled promise rejections with stack traces.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `level` | `string` | No | Log level filter |
| `fromTimestamp` | `number` | No | Start timestamp |
| `toTimestamp` | `number` | No | End timestamp |

---

### 17. `get_network_events`

**Description**: Query recorded network requests and responses correlated with timing and duration.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `statusFilter` | `string` | No | HTTP status filter |

---

### 18. `get_screenshots`

**Description**: List visual checkpoints and screenshot checkpoints captured during the recording session.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |

---

### 27. `list_extensions`

**Description**: List all installed Chrome extensions with ID, name, version, enabled status, installation type, and permissions.

*No parameters required.*

---

### 28. `set_extension_enabled`

**Description**: Enable or disable a specific Chrome extension by ID (e.g. turn off extension to observe native clean UI, then turn back on).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionId` | `string` | Yes | The Chrome extension ID to enable or disable |
| `enabled` | `boolean` | Yes | True to enable the extension, false to disable it |

---

### 29. `toggle_extension`

**Description**: Toggle the enabled status of a specific Chrome extension by ID.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionId` | `string` | Yes | The Chrome extension ID to toggle |

---

### 30. `execute_pipeline`

**Description**: Execute a batch sequence of browser and extension actions in one call (e.g. reload extension, wait, reload tab, take screenshot directly to file, dump DOM to file) and aggregate all results.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `steps` | `array` | Yes | Ordered array of actions to execute sequentially |
| `outputPath` | `string` | No | Optional file path to save consolidated JSON report of all pipeline steps |

---

### 31. `compare_extension_states`

**Description**: Automatically perform a complete before/after comparative forensic audit: disables extension, reloads and captures clean native state/screenshot, enables extension, reloads and captures injected state/screenshot, and returns a detailed differential analysis.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionId` | `string` | Yes | Target Chrome extension ID |
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to active tab) |
| `waitDurationMs` | `number` | No | Wait time in ms after each reload for DOM to settle (default: 2500) |
| `cleanDomPath` | `string` | No | File path to save clean native DOM snapshot HTML |
| `injectedDomPath` | `string` | No | File path to save injected DOM snapshot HTML |
| `cleanScreenshotPath` | `string` | No | File path to save clean native screenshot PNG |
| `injectedScreenshotPath` | `string` | No | File path to save injected screenshot PNG |
| `diffOutputPath` | `string` | No | File path to save JSON differential report |

---

### 32. `reload_extension`

**Description**: Reload an extension under development. If extensionId is provided, toggles and reloads that extension. If omitted, reloads the Forensic Recorder extension itself.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionId` | `string` | No | Extension ID to reload (defaults to current extension if omitted) |

---

### 37. `get_selected_element`

**Description**: Retrieve the DOM element visually selected by the user via Ctrl + Shift + Mouse Click in the live browser.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 40. `capture_page_screenshot`

**Description**: Capture a screenshot of the visible browser page viewport with temporal, scroll, and viewport metadata. When outputPath is provided, saves decoded image directly to disk.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `format` | `string` | No | Image format (default: png) |
| `outputPath` | `string` | No | Optional file path to save decoded PNG/JPEG image directly to disk |

---

### 41. `capture_element_screenshot`

**Description**: Capture an element-specific screenshot bounded to the target element exact geometry and device pixel ratio. When outputPath is provided, saves decoded image directly to disk.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `outputPath` | `string` | No | Optional file path to save decoded element PNG/JPEG image directly to disk |
| `selector` | `string` | No | CSS selector of the target element |
| `nodeId` | `number` | No | LogicalNodeId of the target element |
| `selectedElementRef` | `string` | No | Selected element reference token |

---

### 42. `interact_with_element`

**Description**: Perform an interaction (click, double_click, right_click, hover, focus, blur, type, clear, press_key, select_option, scroll_into_view, scroll) on a live element and return before/after state and effect measurements.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `action` | `string` | Yes | The user action to perform |
| `selector` | `string` | No | CSS selector of the target element |
| `nodeId` | `number` | No | LogicalNodeId of the target element |
| `selectedElementRef` | `string` | No | Selected element reference token |
| `text` | `string` | No | Text string for type action |
| `key` | `string` | No | Key name for press_key action (e.g. Enter, Escape, Tab, ArrowDown) |
| `optionValue` | `string` | No | Value or label for select_option action |
| `scrollDelta` | `object` | No | Scroll deltas for scroll action |
| `waitForStabilization` | `boolean` | No | Wait for DOM and network stabilization after interaction (default: true) |
| `stabilizationTimeoutMs` | `number` | No | Max wait time in milliseconds (default: 300ms) |

---

### 47. `get_element_visual_state`

**Description**: Inspect detailed visual layout, occlusion, clipping, opacity, z-index, and viewport visibility for a live element.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | No | CSS selector of the target element |
| `nodeId` | `number` | No | LogicalNodeId of the target element |

---

### 48. `generate_element_target`

**Description**: Build the canonical multi-strategy TARGET object for an element: ranked selector candidates with confidence, xpath, DOM path, text/attribute/structural fingerprints and bounds. Use before storing or acting on elements to maximize targeting resilience. Input: target (selector/xpath/selectedElementRef). Output: TARGET with confidence in [0,1]. Fails with TARGET_NOT_FOUND when no strategy resolves.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier (selector, xpath, nodeId, or selectedElementRef) |
| `selector` | `string` | No | Shorthand: CSS selector for the target element |

---

### 51. `get_element_ancestry`

**Description**: Analyze element ancestry: ancestors chain (tag, selector, role, text, child index, sibling count, distance), nearby siblings (before/after with distance), and descendant summary (count, max depth, tags, interactive descendants). Input: target/selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |

---

### 52. `get_element_fingerprint`

**Description**: Compute the structural DOM fingerprint of an element: stable hash, tag hierarchy, stable attributes, meaningful text, class list, role, dimensions, ancestor/descendant patterns, plus a volatility risk assessment with reasons. Use for cross-navigation element identity. Input: target/selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |

---

### 53. `get_element_relationships`

**Description**: Build the element relationship graph: self, parents (up to 4 levels), children and siblings as nodes with edges (parent-of, contains, sibling-of). Use to understand page region architecture around a target. Input: target/selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |

---

### 54. `get_element_accessibility`

**Description**: Extract accessibility metadata: explicit/implicit role, accessible name with sources, description, value, states, heading level, focusability, tabIndex, all aria-* attributes, and detected a11y issues. Input: target/selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |

---

### 56. `search_dom`

**Description**: Search the DOM by text, tag and attribute patterns with scored results (selector, role, text, visibility, bounds). The fastest way to find elements without knowing selectors. Input: query (required), optional tag, attr, attrValue, limit. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `query` | `string` | Yes | Search text (matched against text, tags and attributes) |
| `tag` | `string` | No | Restrict to tag name |
| `attr` | `string` | No | Require this attribute name |
| `attrValue` | `string` | No | Attribute value substring filter |
| `limit` | `number` | No | Max results (default 50, max 200) |

---

### 57. `analyze_dom`

**Description**: Run a named DOM analyzer: analyze_forms, extract_links, analyze_media, get_css_variables, analyze_fonts, extract_color_palette, detect_zindex_conflicts, detect_layout_issues, census_interactive_elements, detect_semantic_elements, scan_accessibility_issues, detect_dead_click_targets, inventory_animations, map_frame_tree, inventory_shadow_roots, inspect_page_storage, get_performance_metrics, extract_seo_metadata, extract_structured_data, extract_tables, extract_lists, analyze_page_content, inventory_ctas, detect_focus_traps, infer_responsive_breakpoints, get_selection_state. Input: analyzer (required) + analyzer-specific options. Output: structured analysis with count, items, warnings.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `analyzer` | `string` | Yes | Analyzer name (see tool description for the full list) |
| `query` | `string` | No | Optional search query (search_dom) |
| `limit` | `number` | No | Optional result cap |

---

### 58. `get_page_blueprint`

**Description**: Generate a page blueprint: major sections with bounds and roles, hierarchy tree, key interactive elements, repeated components (patterns with occurrence counts), layout relationships and semantic regions. The architectural map for page understanding. Input: projectName (optional — generated in the live DOM otherwise). Output: PageBlueprint.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | No | Optional project name to persist the blueprint |

---

### 59. `click_element`

**Description**: Production-grade click with explicit mode: normal (synthetic pointer event sequence), double, right, or human-like (movement trajectory + click delay from the active interaction profile). Records which mode was actually used. Input: target/selector, mode, waitForStabilization. Output: InteractionResult with before/after state and measured effects.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |
| `mode` | `string` | No | Click mode (default normal). Never silently falls back — the used mode is reported. |
| `waitForStabilization` | `boolean` | No | Wait for DOM stabilization after the click |

---

### 60. `type_text`

**Description**: Robust typing into inputs, textareas and contenteditable with mode: append, replace (clear then type) or clear. Framework-sensitive: dispatches keydown/keypress/input/change per character. Input: target/selector, text, mode. Output: InteractionResult; resulting value visible in afterState.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |
| `text` | `string` | No | Text to type |
| `mode` | `string` | No | Typing mode (default append) |
| `waitForStabilization` | `boolean` | No | - |

---

### 61. `hover_element`

**Description**: Hover an element: pointerenter/mouseenter/mouseover/mousemove event sequence. Input: target/selector. Output: InteractionResult.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | - |
| `selector` | `string` | No | - |

---

### 62. `focus_element`

**Description**: Focus an element (native focus() + focus event). Input: target/selector. Output: InteractionResult.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | - |
| `selector` | `string` | No | - |

---

### 63. `blur_element`

**Description**: Blur (defocus) an element (native blur() + blur event). Input: target/selector. Output: InteractionResult.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | - |
| `selector` | `string` | No | - |

---

### 64. `press_keyboard_shortcut`

**Description**: Press a key or keyboard shortcut on an element (or the active element): keydown+keyup per key with modifier flags. Input: keys (e.g. ["Control","Shift","P"] or "Control+Shift+P"), optional target. Output: events fired and target selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `keys` | `string` | Yes | Shortcut, e.g. "Control+Shift+P" or "Enter" |
| `keyList` | `array` | No | Alternative: keys as array |
| `target` | `object` | No | Optional target specifier; defaults to activeElement |

---

### 65. `scroll_to_element`

**Description**: Scroll an element into view (block: center). Input: target/selector. Output: before/after scroll positions and target selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | - |
| `selector` | `string` | No | - |
| `behavior` | `string` | No | Scroll behavior (default auto) |

---

### 66. `scroll_page`

**Description**: Scroll the page by a distance: x/y pixel offsets. Input: x, y. Output: before/after scroll positions.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `x` | `number` | No | Horizontal pixel delta |
| `y` | `number` | No | Vertical pixel delta |

---

### 67. `drag_and_drop`

**Description**: Drag and drop: HTML5 drag events (dragstart/dragenter/dragover/drop/dragend) plus pointer events between source and target (or by pixel offsets). Input: source (target specifier), optional target specifier or offsets. Output: events fired, final position, whether HTML5 DnD was used.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `source` | `object` | Yes | Source element target specifier |
| `target` | `object` | No | Drop target specifier (or use offsets) |
| `offsets` | `object` | No | Pixel offsets when no drop target |

---

### 68. `set_input_checked`

**Description**: Check/uncheck a checkbox or select a radio (peer radios with the same name are deselected). Dispatches input + change events. Input: target/selector, checked (default true). Output: checkedBefore/checkedAfter and events fired.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | - |
| `selector` | `string` | No | - |
| `checked` | `boolean` | No | Desired state (default true) |

---

### 69. `select_option`

**Description**: Select an option in a dropdown: sets value and dispatches change. Input: target/selector, value. Output: InteractionResult.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | - |
| `selector` | `string` | No | - |
| `value` | `string` | Yes | Option value to select |

---

### 70. `wait_for_condition`

**Description**: Wait for a meaningful condition instead of arbitrary sleeps: dom_stable, selector_present, selector_visible, selector_absent, text_present, url_contains, element_count, readiness_state. Input: kind + condition params, timeoutMs (default 5000, max 30000), pollIntervalMs. Output: satisfied, waitedMs, detail. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `kind` | `string` | Yes | Condition kind |
| `selector` | `string` | No | Selector for selector_* and element_count conditions |
| `text` | `string` | No | Text for text_present / url_contains |
| `count` | `number` | No | Expected count for element_count |
| `state` | `string` | No | Expected readyState (default complete) |
| `timeoutMs` | `number` | No | Timeout (default 5000ms) |
| `pollIntervalMs` | `number` | No | Poll interval (default 100ms) |

---

### 72. `set_interaction_profile`

**Description**: Set the human-interaction profile for subsequent interactions: DETERMINISTIC (zero delay), BALANCED (small natural delays), HUMAN_LIKE (realistic cadence, trajectories, hesitation) or CUSTOM (user timing parameters, seed). The seed makes HUMAN_LIKE reproducible. Input: profile, optional custom timings + seed. Output: active profile report.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `profile` | `string` | Yes | Profile name |
| `seed` | `number` | No | PRNG seed for reproducible human-like timing |
| `custom` | `object` | No | CUSTOM profile overrides: moveDelayMs, clickDelayMs, typeDelayMs, keyDelayMs {min,max}, hesitationProbability, trajectorySteps |

---

### 73. `get_interaction_profile`

**Description**: Inspect the active interaction profile and the timing of the last action (requested mode, actual mode, per-phase timings, total duration). Output: InteractionProfileReport.

*No parameters required.*

---

### 74. `preview_command`

**Description**: Dry-run preview of a DOM mutation: valid flag, expected change description, affected node count and warnings — WITHOUT applying anything. Input: operation + target + params (same as mutate_dom). Output: MutationPreview. Side effect: none (guaranteed).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `operation` | `string` | Yes | Mutation operation (see mutate_dom) |
| `target` | `object` | Yes | Element target specifier |
| `attribute` | `string` | No | - |
| `value` | `string` | No | - |
| `classes` | `array` | No | - |
| `text` | `string` | No | - |
| `replacement` | `string` | No | - |
| `html` | `string` | No | - |
| `newElementHtml` | `string` | No | - |
| `parent` | `object` | No | - |
| `position` | `string` | No | - |

---

### 78. `run_responsive_test`

**Description**: Run a multi-viewport responsive workflow: applies each size, records DOM length/interactive count/horizontal overflow per step, compares steps, then RESTORES the original viewport (unless restore:false). Input: sizes array (or defaults 1440x900, 1024x768, 768x1024, 375x667), restore. Output: ResponsiveTestResult with comparisons.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sizes` | `array` | No | Custom viewport sequence |
| `restore` | `boolean` | No | Restore original viewport afterwards (default true) |

---

### 79. `emulate_device`

**Description**: Emulate a device profile: viewport + devicePixelRatio + touch metadata + reported UA (UA override applied only in a real browser session; honestly reported otherwise). Input: device (iphone-13, ipad-air, pixel-7, galaxy-s23, macbook-pro-16, windows-desktop). Output: resize result + profile + userAgentNote.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `device` | `string` | Yes | Device profile name |

---

### 80. `execute_javascript`

**Description**: Execute JavaScript with explicit outcome states: EXECUTED_SUCCESSFULLY, EXECUTED_WITH_ERROR, TIMED_OUT, SERIALIZATION_FAILED, BLOCKED_BY_CONTEXT, NOT_CONNECTED. Captures console output, duration, and DOM-change indication (length before/after). The code may use `return value;`. Input: code, timeoutMs (default 5000, max 30000), world (ISOLATED default). Output: JSExecutionResult. Side effect: arbitrary code execution in the page context.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `code` | `string` | Yes | JavaScript source (async/await supported; use `return`) |
| `timeoutMs` | `number` | No | Timeout (default 5000ms) |
| `world` | `string` | No | Execution world (ISOLATED default) |

---

### 81. `execute_js_and_capture_changes`

**Description**: Composite: execute JavaScript AND capture the DOM state before/after with a structural diff summary + page-state snapshots. Same input as execute_javascript. Output: JSExecutionResult + before/after PageStateSnapshot + comparison.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `code` | `string` | Yes | JavaScript source |
| `timeoutMs` | `number` | No | - |
| `world` | `string` | No | - |

---

### 86. `get_mutation_history`

**Description**: Inspect the DOM mutation history: entries (operation, target, summary, undo/redo flags), undo depth, redo depth, open transaction id. Input: limit (default 100). Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `limit` | `number` | No | Max entries (default 100) |

---

### 87. `preview_dom_mutation`

**Description**: Dry-run a mutation: validates the target, describes the expected change, counts affected nodes and warns about destructive operations — WITHOUT modifying anything. Input: identical to mutate_dom. Output: MutationPreview. Side effect: none (guaranteed).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `operation` | `string` | Yes | Mutation operation |
| `target` | `object` | Yes | Element target specifier |
| `attribute` | `string` | No | - |
| `value` | `string` | No | - |
| `classes` | `array` | No | - |
| `text` | `string` | No | - |
| `replacement` | `string` | No | - |
| `html` | `string` | No | - |
| `newElementHtml` | `string` | No | - |
| `parent` | `object` | No | - |
| `position` | `string` | No | - |

---

### 90. `record_commands_start`

**Description**: Start recording subsequent tool invocations into a named command recording. Input: name, description, tags. Output: active recording metadata. Side effect: recording mode ON (adds latency-free capture to every tool call).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `name` | `string` | Yes | Recording name |
| `description` | `string` | No | - |
| `tags` | `array` | No | - |

---

### 91. `record_commands_stop`

**Description**: Stop the active command recording and persist it to storage (.mcpdom_recordings). Input: none (uses active recording). Output: the finished CommandRecording.

*No parameters required.*

---

### 100. `get_operation_trace`

**Description**: Trace a single operation by its operationId: tool, start/end, duration, status, correlated timeline events, related error. Input: operationId (or latest). Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `operationId` | `string` | No | Operation id to trace (omit for recent list) |
| `limit` | `number` | No | Recent operations limit when no id (default 20) |

---

### 101. `capture_page_state`

**Description**: Capture a page state snapshot (comparison anchor): url, title, viewport, dom length + hash, interactive count, extension state, pending mutations, annotation count. Input: none. Output: PageStateSnapshot (also recorded in the session).

*No parameters required.*

---

### 102. `compare_page_states`

**Description**: Compare two page state snapshots ("what changed after this command?"): field-level diffs, DOM size delta, summary. Input: snapshotIdA + snapshotIdB (omit both to compare the two most recent snapshots). Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotIdA` | `string` | No | First snapshot id (default: second-most-recent) |
| `snapshotIdB` | `string` | No | Second snapshot id (default: most-recent) |

---

### 103. `list_page_states`

**Description**: List captured page state snapshots (ids, timestamps, urls, dom sizes). Input: none. Side effect: none.

*No parameters required.*

---

### 108. `annotate_element`

**Description**: Annotate a live element and capture it into a project (alias of capture_page_region with annotation semantics front and center): OBSERVED element data, USER comment/name/tags, INTENDED CHANGE and VERIFICATION CONDITIONS are stored as strictly separate fields. Input: identical to capture_page_region.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |
| `target` | `object` | No | - |
| `selector` | `string` | No | - |
| `name` | `string` | No | - |
| `description` | `string` | No | - |
| `comment` | `string` | No | - |
| `tags` | `array` | No | - |
| `behavioralNotes` | `string` | No | - |
| `visualNotes` | `string` | No | - |
| `intendedChange` | `string` | No | - |
| `verification` | `array` | No | - |
| `screenshot` | `boolean` | No | - |

---

### 118. `get_redaction_rules`

**Description**: Inspect the capture redaction configuration: all rules (key patterns, value patterns, attribute patterns) with enabled flags, and capture exclusions. Input: none. Side effect: none.

*No parameters required.*

---

### 119. `set_redaction_rules`

**Description**: Configure capture redaction: enable/disable existing rules, add custom key/value/attribute patterns, or add capture exclusions (selectors never captured). Built-in rules can be disabled but never removed. Input: enable/disable ruleIds, addRule {kind, pattern, description}, addExclusion {selector, reason}. Side effect: changes capture behavior for all subsequent captures.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `enable` | `array` | No | Rule ids to enable |
| `disable` | `array` | No | Rule ids to disable |
| `addRule` | `object` | No | Add a custom redaction rule |
| `addExclusion` | `object` | No | Add a capture exclusion selector |

---

### 120. `get_tool_catalog`

**Description**: Return the full MCP tool catalog with per-tool metadata: purpose, required context, accepted input, output, side effects, failure conditions, recovery strategy, and tool group. The meta-tool an agent calls FIRST to decide which tools to use. Input: optional group filter. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `group` | `string` | No | Optional group filter (see get_tool_groups) |

---

### 121. `get_tool_groups`

**Description**: List discoverable tool groups (inspection, targeting, interaction, viewport, javascript, mutation, sequences, session, projects, security, discovery) with descriptions and member tool names. Input: none. Side effect: none.

*No parameters required.*

---

### 245. `td_page_intent`

**Description**: Infer major page workflows and interaction zones. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session id |

---

### 246. `td_state_summary`

**Description**: Return a token-minimal state digest suitable for agents (L0/L1). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `intent` | `string` | Yes | The next decision the agent must make |
| `level` | `string` | No | L0|L1|L2|L3|L4 |

---

### 247. `td_resolve_target`

**Description**: Resolve a natural-language or semantic target to a VERIFIED entity with confidence. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `description` | `string` | No | Natural-language target description |
| `role` | `string` | No | Semantic role |
| `text` | `string` | No | Text content |
| `selector` | `string` | No | Seed selector |

---

### 248. `td_rank_targets`

**Description**: Rank target candidates by historical, semantic and visual stability. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `candidates` | `array` | Yes | Candidate descriptors |
| `query` | `object` | Yes | Target query |

---

### 253. `td_interaction_plan`

**Description**: Generate a verified interaction plan from intent (target + steps + postconditions). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `intent` | `string` | Yes | What the interaction should achieve |

---

### 254. `td_interaction_execute`

**Description**: Execute an interaction plan with postconditions (transactional). [security: side-effects; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `planId` | `string` | Yes | Plan to execute |

---

### 255. `td_interaction_observe`

**Description**: Observe effects of one interaction across state dimensions. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `interactionRef` | `string` | Yes | Executed interaction reference |

---

### 256. `td_interaction_repair`

**Description**: Repair a failed interaction without restarting the whole task. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `failedPlanId` | `string` | Yes | Failed plan |
| `reason` | `string` | Yes | Failure reason |

---

### 263. `td_compare_branches`

**Description**: Compare reality against one or more counterfactual branches. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `branchIds` | `array` | Yes | Branches to compare |
| `sessionId` | `string` | Yes | Session id |

---

### 265. `td_safe_apply`

**Description**: Apply a verified low-risk mutation transaction (PLAN→…→VERIFY→COMMIT/ROLLBACK). [security: side-effects; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `plan` | `object` | Yes | Mutation plan |
| `scope` | `object` | Yes | Allowed selectors/origins |

---

### 268. `td_recover_browser`

**Description**: Recover from browser/renderer disconnect where possible (bounded retries). [security: side-effects; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `failureKind` | `string` | Yes | Failure kind |

---

### 269. `td_recover_page`

**Description**: Re-resolve a dead or replaced page identity. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | Yes | Page identity |

---

### 270. `td_recover_bridge`

**Description**: Recover or reconnect the bridge without losing state. [security: read-only; cost: low; modes: live/recorded/simulation]

*No parameters required.*

---

### 272. `td_reconcile_events`

**Description**: Detect and repair event-order inconsistencies (mesh admission report). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session to reconcile |

---

### 273. `td_resource_guard`

**Description**: Enforce memory/CPU/concurrency budgets (guardian decision + mode). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `usage` | `object` | No | Reported usage |

---

### 274. `td_leak_watch`

**Description**: Continuously detect memory/resource growth patterns. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `windowMs` | `number` | No | Observation window |

---

### 275. `td_failure_containment`

**Description**: Isolate a broken capability without killing the whole session. [security: side-effects; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `capabilityId` | `string` | Yes | Capability to isolate |

---

### 280. `td_dom_xss_audit`

**Description**: Trace browser-side sources, transformations and dangerous sinks (passive). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 281. `td_injection_surface_audit`

**Description**: Identify injection-sensitive DOM/runtime surfaces WITHOUT executing payloads. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 283. `td_cookie_storage_audit`

**Description**: Audit cookie, storage and client-secret handling. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 284. `td_csp_security_audit`

**Description**: Analyze CSP posture and runtime violations. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 285. `td_cors_security_audit`

**Description**: Analyze observed CORS behavior against scoped trust expectations. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 287. `td_performance_profile`

**Description**: Build an end-to-end performance profile (events → spans → vitals). [security: read-only; cost: medium; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 288. `td_performance_budget`

**Description**: Evaluate the page against declared performance budgets. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `budgets` | `object` | No | Budget thresholds |
| `sessionId` | `string` | No | Session scope |

---

### 289. `td_long_task_trace`

**Description**: Trace long tasks to affected DOM/components. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session scope |
| `thresholdMs` | `number` | No | Long-task threshold (default 50) |

---

### 293. `td_retention_graph`

**Description**: Build a retaining/reference graph for selected runtime objects where supported. [security: read-only; cost: low; modes: live/recorded/simulation; EXPERIMENTAL]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |
| `objectId` | `string` | No | Object to trace |

---

### 298. `td_reproduce_incident`

**Description**: Reproduce a captured incident with controlled state. [security: side-effects; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `incidentId` | `string` | Yes | Incident to reproduce |

---

### 299. `td_diagnose`

**Description**: Generate ranked diagnostic hypotheses with evidence (no guesswork). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `symptom` | `string` | Yes | Symptom description |
| `sessionId` | `string` | Yes | Session scope |

---

### 300. `td_plan_fix`

**Description**: Build a fix plan linked to observed causes and affected entities. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `incidentId` | `string` | Yes | Incident to fix |

---

### 301. `td_validate_fix`

**Description**: Verify a proposed fix against the original failure (original FAIL → patched PASS). [security: side-effects; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `incidentId` | `string` | Yes | Incident being fixed |
| `fixRef` | `string` | Yes | Fix reference |

---

### 302. `td_run_workflow`

**Description**: Execute a declarative multi-step workflow with recovery. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `workflow` | `array` | Yes | Workflow steps |

---

### 303. `td_run_playbook`

**Description**: Run a reusable investigation/security/performance playbook. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `playbookId` | `string` | Yes | Playbook to run |

---

### 304. `td_memory`

**Description**: Store and retrieve durable project/session investigation knowledge (provenance + confidence). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `action` | `string` | Yes | store | query | validate |
| `kind` | `string` | No | Memory kind |
| `statement` | `string` | No | Memory statement |
| `query` | `object` | No | Query filter |

---


## Live DOM Inspection & Observation (15 Tools)

### 11. `get_dom_subtree`

**Description**: Reconstruct and extract the HTML of a specific subtree (e.g. #app or .gpt-panel) at a given timestamp.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |
| `timestamp` | `number` | No | Timestamp in milliseconds |
| `selector` | `string` | No | CSS selector for the root of the subtree |
| `nodeId` | `number` | No | LogicalNodeId for the root of the subtree |

---

### 35. `inspect_live_page`

**Description**: Inspect the current live browser page state, including URL, title, viewport dimensions, scroll positions, readyState, active and focused elements.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 36. `inspect_live_element`

**Description**: Deeply inspect a live DOM element on the active browser page by CSS selector, LogicalNodeId, or selectedElementRef, returning bounds, computed styles, visibility, attributes, state, role, aria, and parent context.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | No | CSS selector of the target element |
| `nodeId` | `number` | No | LogicalNodeId of the element if recorded |
| `selectedElementRef` | `string` | No | Reference token of the last selected element |
| `xpath` | `string` | No | XPath expression for the element |

---

### 38. `start_element_picker`

**Description**: Activate the interactive visual element picker mode in the live browser with hover highlighting and click selection.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `highlightColor` | `string` | No | Hex color for hover highlighter (default: #0ea5e9) |

---

### 39. `stop_element_picker`

**Description**: Deactivate the visual element picker mode in the browser and restore normal cursor and interaction state.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 43. `start_element_observation`

**Description**: Start focused continuous recording and observation around a target element and its subtree/ancestors.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | No | CSS selector of the target element |
| `nodeId` | `number` | No | LogicalNodeId of the target element |

---

### 44. `stop_element_observation`

**Description**: Stop focused element observation and assemble a complete correlation bundle with mutations, diagnostics, network activity, and root-cause analysis.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 45. `get_live_dom_snapshot`

**Description**: Capture the current live virtual DOM state snapshot of the active or specified browser tab in HTML or structured JSON format.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `format` | `string` | No | Output format (default: html) |

---

### 46. `get_live_dom_subtree`

**Description**: Reconstruct and extract the live HTML or node structure of a specific subtree on the active or specified browser tab.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | No | CSS selector of the subtree root |
| `nodeId` | `number` | No | LogicalNodeId of the subtree root |

---

### 49. `recover_selector`

**Description**: Recover a failed element selector via fingerprint matching: inspects the previous target snapshot, searches candidate matches, scores them, and attempts SAFE recovery (refuses below 0.62 confidence or ambiguous matches). Input: selector + snapshot (tag, text, classes, stableAttributes, fingerprintHash, parentSelector). Output: RecoveryOutcome with alternatives and diagnostics. Side effect: none (read-only diagnosis).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | Yes | The failing CSS selector |
| `snapshot` | `object` | No | Previous target snapshot evidence (from generate_element_target or a region annotation) |

---

### 50. `diagnose_selector_failure`

**Description**: Diagnose WHY a selector fails: syntax validity, match count, relaxation attempts that work, and human-readable diagnosis. Complements recover_selector (which attempts to fix). Input: selector. Output: validity, matches, closest working selectors, diagnosis steps.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | Yes | The selector to diagnose |

---

### 55. `get_computed_style`

**Description**: Extract computed CSS style properties for an element. Input: target/selector + optional properties list (defaults to a layout-relevant set). Output: property→value map. Fails with STYLE_UNAVAILABLE when getComputedStyle is not exposed (rare).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |
| `properties` | `array` | No | CSS property names to extract |

---

### 75. `resize_viewport`

**Description**: Resize the viewport (width/height in pixels or a named preset). ALWAYS reversible: the original size is recorded on first use. Captures before/after page digests. Input: width+height, or preset (desktop-hd, tablet-ipad, mobile-iphone-12, …). Output: ViewportResizeResult with previous/original dimensions.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `width` | `number` | No | Target width (200–7680) |
| `height` | `number` | No | Target height (200–4320) |
| `preset` | `string` | No | Named preset (overrides width/height) |

---

### 76. `reset_viewport`

**Description**: Restore the original viewport size recorded before the first resize (guaranteed RESET_VIEWPORT semantics). Also clears the active preset/device. Input: none. Output: ViewportResizeResult with restored dimensions.

*No parameters required.*

---

### 77. `get_viewport_state`

**Description**: Inspect the viewport: current width/height/dpr/scroll plus the recorded original and whether it is currently modified. Input: none.

*No parameters required.*

---


## Project Capture & Page Reconstruction (12 Tools)

### 20. `get_annotations`

**Description**: Retrieve all human and AI annotations created for a session.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session ID |

---

### 104. `create_page_project`

**Description**: Create a portable page-analysis project folder (project.json, page.json, regions/, screenshots/, dom/, commands/, diffs/, metadata/, instructions/). The DOM snapshot is captured CLEANED: MCPDOM-injected artifacts excluded, secrets redacted. Input: name, description, url/title/viewport metadata (defaults from the live page). Output: ProjectManifest. Side effect: creates files under .mcpdom_projects/<name>/.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `name` | `string` | Yes | Project name (folder name) |
| `description` | `string` | No | - |
| `url` | `string` | No | Page URL (default: live page URL) |
| `title` | `string` | No | Page title (default: live page title) |

---

### 105. `list_projects`

**Description**: List page-analysis projects with manifests (names, page counts, region counts, timestamps). Input: none. Side effect: none.

*No parameters required.*

---

### 106. `get_project`

**Description**: Load a project in full: manifest, page manifest, and all region annotations. Input: projectName. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |

---

### 107. `capture_page_region`

**Description**: Capture a page region into a project: resolves the element, captures LOCAL DOM + RELEVANT CONTEXT DOM (meaningful boundary), ranked selector candidates, fingerprint, styles, dimensions, auto-generated name and (optionally) a screenshot. Input: projectName, target/selector, user annotation fields (name, description, comment, tags), intendedChange, verification, screenshot. Output: RegionAnnotation (OBSERVED/USER/INTENDED/VERIFICATION separated). Side effect: writes region files.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | Target project name |
| `target` | `object` | No | Element target specifier |
| `selector` | `string` | No | Shorthand: CSS selector |
| `name` | `string` | No | User override name (auto name preserved) |
| `description` | `string` | No | User description |
| `comment` | `string` | No | User comment, e.g. "make this collapsible" |
| `tags` | `array` | No | - |
| `behavioralNotes` | `string` | No | - |
| `visualNotes` | `string` | No | - |
| `intendedChange` | `string` | No | What the user wants changed |
| `verification` | `array` | No | Success conditions |
| `screenshot` | `boolean` | No | Capture a region screenshot (default false) |

---

### 109. `list_region_annotations`

**Description**: List region annotations in a project (names, selectors, quality grades, intended changes). Input: projectName. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |

---

### 110. `get_region_annotation`

**Description**: Load one region annotation in full (observed facts, user fields, intended change, verification, quality score). Input: projectName, regionId. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |
| `regionId` | `string` | Yes | - |

---

### 111. `update_region_annotation`

**Description**: Update the USER fields of a region annotation (name, description, comment, tags, notes, intendedChange, verification). Observed facts are never editable. Quality is recomputed. Input: projectName, regionId, updates. Side effect: rewrites the region file.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |
| `regionId` | `string` | Yes | - |
| `name` | `string` | No | - |
| `description` | `string` | No | - |
| `comment` | `string` | No | - |
| `tags` | `array` | No | - |
| `behavioralNotes` | `string` | No | - |
| `visualNotes` | `string` | No | - |
| `intendedChange` | `string` | No | - |
| `verification` | `array` | No | - |

---

### 112. `delete_region_annotation`

**Description**: Delete a region annotation from a project. Input: projectName, regionId. Side effect: removes the region file and updates manifests.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |
| `regionId` | `string` | Yes | - |

---

### 113. `get_region_relationship_graph`

**Description**: Build the region relationship graph for a project: nodes (page + regions) and edges (contains, sibling-of, ancestor-of, overlaps) derived from live DOM containment. Input: projectName. Side effect: none.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |

---

### 114. `generate_reconstruction_spec`

**Description**: Generate (and persist) the canonical page reconstruction specification for a project: metadata, viewport, structure, regions with selector candidates, hierarchy, semantic roles, visual constraints, interactions, selectors with fallbacks, content, styles, annotations, expected modifications and verification rules — with a versioned schema. Input: projectName. Side effect: writes metadata/reconstruction-spec.json.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |

---

### 116. `delete_project`

**Description**: Delete a project folder permanently. Input: projectName. Side effect: irreversible file removal.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `projectName` | `string` | Yes | - |

---


## DOM Mutation & Safe Transactions (6 Tools)

### 82. `mutate_dom`

**Description**: Apply a first-class DOM mutation with full observability (BEFORE → ACTION → AFTER → DIFF) and a guaranteed undo record. Operations: set_attribute, remove_attribute, set_text, replace_text, set_inner_html, set_outer_html, add_class, remove_class, replace_class, set_style, remove_style, add_element, remove_element, replace_element, move_element, wrap_element, unwrap_element, clone_subtree. Input: operation, target, plus operation-specific params. Output: DOMMutationResult. Side effect: modifies live DOM (undoable).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `operation` | `string` | Yes | Mutation operation |
| `target` | `object` | Yes | Element target specifier |
| `attribute` | `string` | No | Attribute name (set/remove_attribute) |
| `value` | `string` | No | Attribute value or replacement class (replace_class) |
| `text` | `string` | No | Text content (set_text) or search pattern (replace_text) |
| `replacement` | `string` | No | Replacement text (replace_text) |
| `classes` | `array` | No | Class names (add/remove/replace_class) or style props (remove_style) |
| `style` | `object` | No | Style property map (set_style) |
| `html` | `string` | No | HTML content (set_inner_html) |
| `newElementHtml` | `string` | No | HTML for new/replacement/wrapper element |
| `parent` | `object` | No | Parent target (move_element, add_element) |
| `position` | `string` | No | Insertion position (add_element/move_element) |
| `copyAttributes` | `boolean` | No | clone_subtree: copy attributes (ids never duplicated) |

---

### 83. `mutate_dom_transaction`

**Description**: Transactional DOM mutation: mode=begin opens a transaction, subsequent mutate_dom calls join it, mode=commit verifies and commits (all-or-nothing), mode=rollback reverts every step in reverse order. Input: mode, optional reason (rollback). Output: transaction status with per-step results. Side effect: none for begin; commits/rolls back DOM changes.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `mode` | `string` | Yes | Transaction phase |
| `reason` | `string` | No | Rollback reason (recorded) |

---

### 84. `undo_dom_mutation`

**Description**: Undo the last DOM mutation (or the last mutation of the open transaction) using its immutable inverse record. Input: none. Output: success + undone mutation id. Idempotent-safe: reports "nothing to undo" when the stack is empty.

*No parameters required.*

---

### 85. `redo_dom_mutation`

**Description**: Redo the last undone DOM mutation (forward patch re-applied only when safe). Input: none. Output: success + redone mutation id.

*No parameters required.*

---

### 88. `clone_dom_subtree`

**Description**: Clone a DOM subtree (deep clone appended to a parent or the original parent; ids are never duplicated). Input: target, optional parent, copyAttributes. Output: DOMMutationResult (undoable). Side effect: adds cloned nodes.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `target` | `object` | Yes | Element to clone |
| `parent` | `object` | No | Optional append target (defaults to original parent) |
| `copyAttributes` | `boolean` | No | Copy attributes except id (default true) |

---

### 89. `execute_command_sequence`

**Description**: Execute a command sequence with per-command records (id, timestamp, target, args, status, result, duration, error): sequential execution, conditional continuation (condition.previousStepSucceeded), explicit stop-on-error (default) or per-step continueOnError. Input: steps array + stopOnError. Output: CommandSequenceResult. Side effects: those of the executed tools.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `steps` | `array` | Yes | Ordered command steps |
| `stopOnError` | `boolean` | No | Default stop-on-error policy (default true) |

---


## DevTools Input Automation (dt_*) (10 Tools)

### 122. `dt_click`

**Description**: Clicks an element (chrome-devtools-mcp click). Input: uid/selector (+pageId/tabId). Options: dblClick, includeSnapshot. Dispatches a real synthetic click through the unified runtime; verifies the element becomes interactive, else fails with actionable error.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `uid` | `string` | No | Element uid from dt_take_snapshot |
| `selector` | `string` | No | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | No | Unified page id (defaults to active page) |
| `tabId` | `number` | No | Extension tab id (alias for the page) |
| `dblClick` | `boolean` | No | Double click (default false) |
| `includeSnapshot` | `boolean` | No | Include an updated page snapshot in the response |

---

### 123. `dt_click_at`

**Description**: Click at viewport coordinates with vision-assisted element resolution: reports which element the point hits before clicking. Input: x, y (+page). Use when only a screenshot position is known.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `x` | `number` | Yes | X coordinate in CSS pixels |
| `y` | `number` | Yes | Y coordinate in CSS pixels |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |
| `includeSnapshot` | `boolean` | No | - |

---

### 124. `dt_drag`

**Description**: Drag an element onto another element (or coordinates). Input: from(uid/selector), to(uid/selector or x/y). Uses real pointer event sequences when live.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `fromUid` | `string` | No | Uid of the element to drag |
| `fromSelector` | `string` | No | CSS selector of the element to drag |
| `toUid` | `string` | No | Uid of the drop target |
| `toSelector` | `string` | No | CSS selector of the drop target |
| `toX` | `number` | No | - |
| `toY` | `number` | No | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 125. `dt_fill`

**Description**: Set the value of a form field (clear + type) with optional submit key. Input: uid/selector, value, submitKey.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `uid` | `string` | No | Element uid from dt_take_snapshot |
| `selector` | `string` | No | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | No | Unified page id (defaults to active page) |
| `tabId` | `number` | No | Extension tab id (alias for the page) |
| `value` | `string` | Yes | Value to set |
| `submitKey` | `string` | No | Key pressed after typing, e.g. "Enter" |
| `includeSnapshot` | `boolean` | No | - |

---

### 126. `dt_fill_form`

**Description**: Fill MULTIPLE form fields in one batched call (§39: prefer this over repeated dt_fill). Input: fields[] each {uid/selector, value, submitKey}.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `fields` | `array` | Yes | Fields to fill |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 127. `dt_handle_dialog`

**Description**: Accept or dismiss an open JavaScript dialog (alert/confirm/prompt). Input: accept (boolean), promptText.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `accept` | `boolean` | Yes | true to accept, false to dismiss |
| `promptText` | `string` | No | Text to enter in a prompt dialog |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 128. `dt_hover`

**Description**: Hover over an element. Input: uid/selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `uid` | `string` | No | Element uid from dt_take_snapshot |
| `selector` | `string` | No | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | No | Unified page id (defaults to active page) |
| `tabId` | `number` | No | Extension tab id (alias for the page) |

---

### 129. `dt_press_key`

**Description**: Press a key or key combination, e.g. "a", "Enter", "Control+Or,Control+a". Input: key.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `key` | `string` | Yes | Key or combo string |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 130. `dt_type_text`

**Description**: Type text into a field (keystroke by keystroke), optional submit key. Input: uid/selector, text, submitKey.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `uid` | `string` | No | Element uid from dt_take_snapshot |
| `selector` | `string` | No | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | No | Unified page id (defaults to active page) |
| `tabId` | `number` | No | Extension tab id (alias for the page) |
| `text` | `string` | Yes | Text to type |
| `submitKey` | `string` | No | - |

---

### 131. `dt_upload_file`

**Description**: Set the files of a file input programmatically. Input: uid/selector, files[] (paths or names).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `uid` | `string` | No | Element uid from dt_take_snapshot |
| `selector` | `string` | No | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | No | Unified page id (defaults to active page) |
| `tabId` | `number` | No | Extension tab id (alias for the page) |
| `files` | `array` | Yes | File paths/names to attach |

---


## DevTools Page & Navigation (dt_*) (9 Tools)

### 132. `dt_list_pages`

**Description**: List all pages/tabs known to the unified runtime with the canonical page identity mapping (pageId ↔ tabId ↔ url ↔ frames). Read-only.

*No parameters required.*

---

### 133. `dt_select_page`

**Description**: Bring a page to focus. Input: pageId / tabId / index (0-based).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |
| `index` | `number` | No | 0-based index into the page list |

---

### 134. `dt_new_page`

**Description**: Open a new page/tab. Input: url. Returns the new canonical page identity.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `url` | `string` | Yes | Initial URL (http/https/file) |

---

### 135. `dt_close_page`

**Description**: Close a page. Input: pageId/tabId. Fails with PAGE_NOT_FOUND when the page is unknown.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 136. `dt_navigate_page`

**Description**: Navigate a page to a URL. Records a NavigationRecord on the page identity (identity survives navigation). Input: url (+page).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `url` | `string` | Yes | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 137. `dt_history_navigation`

**Description**: Navigate browser history: back / forward / reload. Input: direction (+page).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `direction` | `string` | Yes | History direction |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 138. `dt_wait_for`

**Description**: Wait until a condition: "load", "domcontentloaded", "networkidle" (0 inflight ≥500ms) or a selector becoming visible. Input: condition, selector?, timeoutMs (default 8000).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `condition` | `string` | Yes | What to wait for |
| `selector` | `string` | No | CSS selector to wait for (selector-visible) |
| `timeoutMs` | `number` | No | Timeout in ms (default 8000) |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 139. `dt_emulate`

**Description**: Emulate device/page characteristics in one call: viewport, deviceScaleFactor, userAgent, cpuThrottlingRate (×), network conditions (downloadKbps/uploadKbps/latencyMs), geolocation, colorScheme, extra headers, locale, timezone. All reversible via dt_emulate reset:true. Integrates with MCPDOM viewport controller for live extension tabs.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `reset` | `boolean` | No | Reset all emulation to defaults |
| `viewport` | `object` | No | - |
| `deviceScaleFactor` | `number` | No | - |
| `userAgent` | `string` | No | - |
| `cpuThrottlingRate` | `number` | No | CPU throttle multiplier (1–20), e.g. 4 = 4× slower |
| `networkConditions` | `object` | No | - |
| `geolocation` | `object` | No | - |
| `colorScheme` | `string` | No | - |
| `extraHeaders` | `object` | No | Extra HTTP headers (name → value) |
| `locale` | `string` | No | - |
| `timezoneId` | `string` | No | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 140. `dt_resize_page`

**Description**: Resize the page viewport. Input: width, height (+page). Reversible (call again with the original size or dt_emulate reset).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `width` | `number` | Yes | - |
| `height` | `number` | Yes | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---


## DevTools Performance, Memory & Lighthouse (dt_*) (17 Tools)

### 141. `dt_performance_start_trace`

**Description**: Start a performance trace on a page (CDP Tracing/Performance domains through the extension gateway). One trace per page at a time (NAVIGATION_CONFLICT-style guard). Without a CDP session, runs a deterministic SIMULATED trace buffer clearly labeled simulated:true — never presented as real Chrome data.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `categories` | `array` | No | Trace categories (default devtools.timeline) |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 142. `dt_performance_stop_trace`

**Description**: Stop the active trace and return normalized trace events, Web Vitals (LCP/INP/CLS/FCP), long tasks, layout shifts and phase breakdown. Input: traceId (optional — active trace of the page is used).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `traceId` | `string` | No | - |
| `pageId` | `string` | No | - |

---

### 143. `dt_performance_analyze_insight`

**Description**: Analyze a stopped trace or a provided Chrome trace-events array: extracts insights (long tasks, layout shifts, LCP candidates, parse/layout/paint/network phases) with durations. Input: traceId or events[].

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `traceId` | `string` | No | - |
| `events` | `array` | No | Raw Chrome trace events to analyze (ts/dur/name/cat/ph) |
| `insight` | `string` | No | Focus of the analysis (default all) |

---

### 153. `dt_lighthouse_audit`

**Description**: EXPERIMENTAL: run a Lighthouse audit via the DevTools connection. Requires live CDP session — in simulation reports mode UNAVAILABLE (Lighthouse results are never synthesized).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `categories` | `array` | No | Audit categories (default performance,accessibility,best-practices) |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 154. `dt_take_heapsnapshot`

**Description**: Capture a V8 heap snapshot of a page via CDP HeapProfiler (live). In simulation, registers a deterministic fixture snapshot in the REAL .heapsnapshot format, marked simulated:true — analysis code paths are identical; the DATA is explicitly not a real V8 capture. Input: pageId/tabId, raw (optional: pre-captured snapshot JSON string).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |
| `raw` | `string` | No | Optional pre-captured .heapsnapshot JSON string to register instead of live capture |
| `saveToPath` | `string` | No | Optional path to persist the raw snapshot JSON |

---

### 155. `dt_close_heapsnapshot`

**Description**: Release a loaded heap snapshot (§24 lifecycle). Input: snapshotId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |

---

### 156. `dt_heapsnapshot_summary`

**Description**: Class aggregates of a heap snapshot: per-class object counts and self sizes, totals, top retainers of size. Input: snapshotId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `limit` | `number` | No | Max classes returned (default 50) |

---

### 157. `dt_heapsnapshot_details`

**Description**: Snapshot details: node/edge counts, meta field layout, parse duration. Input: snapshotId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |

---

### 158. `dt_heapsnapshot_class_nodes`

**Description**: List the node ids of a class with pagination. Input: snapshotId, className, offset, limit.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `className` | `string` | Yes | - |
| `offset` | `number` | No | - |
| `limit` | `number` | No | - |

---

### 159. `dt_heapsnapshot_edges`

**Description**: Outgoing edges (references) of a node. Input: snapshotId, nodeId (V8 object id) or nodeIndex.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `nodeId` | `number` | No | - |
| `nodeIndex` | `number` | No | - |
| `limit` | `number` | No | - |

---

### 160. `dt_heapsnapshot_retainers`

**Description**: Retainers (incoming references) of a node — who keeps it alive. Input: snapshotId, nodeId/nodeIndex.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `nodeId` | `number` | No | - |
| `nodeIndex` | `number` | No | - |
| `limit` | `number` | No | - |

---

### 161. `dt_heapsnapshot_retaining_paths`

**Description**: Retaining paths from GC roots to a node (shortest path reconstruction). Input: snapshotId, nodeId/nodeIndex, maxPaths.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `nodeId` | `number` | No | - |
| `nodeIndex` | `number` | No | - |
| `maxPaths` | `number` | No | - |

---

### 162. `dt_heapsnapshot_dominators`

**Description**: Dominator analysis: nodes ranked by retained tree size with their immediate dominator class. Input: snapshotId, limit.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `limit` | `number` | No | - |

---

### 163. `dt_heapsnapshot_duplicate_strings`

**Description**: Duplicate string instances in the heap — wasted memory detection with instance counts and bytes. Input: snapshotId, limit.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `limit` | `number` | No | - |

---

### 164. `dt_heapsnapshot_object_details`

**Description**: Full details of one object: type, class, self size, outgoing edges, retainers, detachedness. Input: snapshotId, nodeId (V8 id) or nodeIndex.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `nodeId` | `number` | No | - |
| `nodeIndex` | `number` | No | - |

---

### 165. `dt_query_heapsnapshot_objects`

**Description**: Query heap objects by type, className (substring match) and minimum self size. Input: snapshotId + filters.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotId` | `string` | Yes | - |
| `type` | `string` | No | - |
| `className` | `string` | No | - |
| `minSize` | `number` | No | - |
| `limit` | `number` | No | - |

---

### 166. `dt_compare_heapsnapshots`

**Description**: Compare two heap snapshots: per-class added/removed objects and size deltas, plus totals. Input: snapshotA, snapshotB.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `snapshotA` | `string` | Yes | Baseline snapshot id |
| `snapshotB` | `string` | Yes | Comparison snapshot id |

---


## DevTools Network, Console & Snapshot (dt_*) (9 Tools)

### 144. `dt_list_network_requests`

**Description**: List captured network requests from the unified runtime network log (shared with MCPDOM capture). Filters: urlPattern, method, status (number|"error"|"success"), resourceType; pagination offset/limit; includeBody.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `urlPattern` | `string` | No | - |
| `method` | `string` | No | - |
| `status` | `any` | No | Exact status code, "error", or "success" |
| `resourceType` | `string` | No | - |
| `offset` | `number` | No | - |
| `limit` | `number` | No | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |
| `ingestTabId` | `number` | No | First ingest MCPDOM-captured requests for this tab (bridge) before listing |

---

### 145. `dt_get_network_request`

**Description**: Inspect one network request in full: headers, body (when captured), timings, cache state. Input: requestId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `requestId` | `string` | Yes | Request id from dt_list_network_requests |
| `includeBody` | `boolean` | No | Include captured bodies (default true) |

---

### 146. `dt_evaluate_script`

**Description**: Evaluate JavaScript in page context and return the serialized result. EXPLICIT tool — other capabilities must not wrap everything through this. Input: script (expression or statements), awaitPromise.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `script` | `string` | Yes | JavaScript to evaluate |
| `awaitPromise` | `boolean` | No | Await returned promises (default true) |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 147. `dt_list_console_messages`

**Description**: List console messages captured by the unified runtime (shares capture with MCPDOM console interception). Filters: level (log,info,warn,error or csv), searchQuery; pagination. In simulation, first ingests MCPDOM-captured console logs for the tab.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `level` | `string` | No | - |
| `searchQuery` | `string` | No | - |
| `offset` | `number` | No | - |
| `limit` | `number` | No | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |
| `ingestTabId` | `number` | No | - |

---

### 148. `dt_get_console_message`

**Description**: Inspect one console message with full text, source and stack. Input: messageId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `messageId` | `string` | Yes | - |

---

### 149. `dt_take_screenshot`

**Description**: Capture a page screenshot (png/jpeg), viewport or element-bounded. Routes through MCPDOM capture (DPR-preserving). Input: format, uid/selector for element capture, outputPath to persist.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `format` | `string` | No | Image format (default png) |
| `uid` | `string` | No | Element uid for element-bounded capture |
| `selector` | `string` | No | CSS selector for element-bounded capture |
| `outputPath` | `string` | No | Optional file path to persist the capture |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 150. `dt_take_snapshot`

**Description**: Take a semantic text snapshot of the page (a11y-structured, uid-addressable) used by uid-based input tools. Returns node tree with roles/names and uids. §39: prefer this compact snapshot over full DOM dumps for page understanding.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |
| `selector` | `string` | No | Limit the snapshot to a subtree |

---

### 151. `dt_screencast_start`

**Description**: EXPERIMENTAL: start screencast frame streaming (CDP Page.screencast). Requires live CDP session; UNSUPPORTED in simulation (reports mode UNAVAILABLE, never fake frames).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |
| `maxDurationMs` | `number` | No | - |

---

### 152. `dt_screencast_stop`

**Description**: EXPERIMENTAL: stop screencast streaming and return captured frame metadata. Requires live CDP session.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---


## DevTools Extensions & WebMCP (dt_*) (9 Tools)

### 167. `dt_install_extension`

**Description**: Install (load) a browser extension by path/id (live extension management via chrome.management). DANGEROUS: changes browser state. Input: extensionPath or extensionId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionPath` | `string` | No | - |
| `extensionId` | `string` | No | - |

---

### 168. `dt_list_extensions`

**Description**: List installed browser extensions with enable state. Shares capture with MCPDOM list_extensions but returns the DevTools-normalized extension model.

*No parameters required.*

---

### 169. `dt_reload_extension`

**Description**: Reload an extension by id (dev workflow). Input: extensionId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionId` | `string` | Yes | - |

---

### 170. `dt_trigger_extension_action`

**Description**: Trigger (activate) an extension action by id. Input: extensionId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionId` | `string` | Yes | - |

---

### 171. `dt_uninstall_extension`

**Description**: Uninstall an extension by id. DANGEROUS: destructive. Input: extensionId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `extensionId` | `string` | Yes | - |

---

### 172. `dt_list_3p_developer_tools`

**Description**: Discover third-party developer tools exposed by the page (window-registered devtools integrations). Returns registry with invocation contracts.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 173. `dt_execute_3p_developer_tool`

**Description**: Execute a discovered third-party developer tool. EXPERIMENTAL. Input: toolId + args (validated against the discovered contract).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `toolId` | `string` | Yes | - |
| `args` | `object` | No | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 174. `dt_list_webmcp_tools`

**Description**: Discover WebMCP tools exposed by the page (navigator.webMCP registrations per the WebMCP draft). Returns tool schemas for remote execution.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---

### 175. `dt_execute_webmcp_tool`

**Description**: Execute a WebMCP tool exposed by the page. Input: toolName + args (validated against the discovered schema).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `toolName` | `string` | Yes | - |
| `args` | `object` | No | - |
| `pageId` | `string` | No | - |
| `tabId` | `number` | No | - |

---


## Advanced Forensic Capabilities (fx_*) (31 Tools)

### 176. `fx_correlate_dom_network`

**Description**: CAP 01 — DOM↔network causal correlator: anchors on a mutation (or request) and reconstructs request → response → render chains with RANKED causal candidates, temporal gaps and evidence-based confidence. Input: sessionId (+ eventId | timestamp | anchor, windowMs, limit).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `eventId` | `string` | No | Focal event id (mutation or request) |
| `timestamp` | `number` | No | Focal timestamp (ms) — closest mutation/request is used |
| `anchor` | `string` | No | - |
| `windowMs` | `number` | No | Causality window (default 800ms) |
| `limit` | `number` | No | Max candidates (default 8) |

---

### 177. `fx_dom_regression_diff`

**Description**: CAP 02 — Full regression diff between two page states across 8 dimensions (added/removed/moved/attributes/styles/text/layout/a11y) with machine-readable diffs AND a human-readable report. Input: sessionId + t1 + t2 (timestamps).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Recorded forensic session id (list_sessions) |
| `t1` | `number` | Yes | First timestamp (before) |
| `t2` | `number` | Yes | Second timestamp (after) |
| `maxPerDimension` | `number` | No | Changes kept per dimension (default 40) |

---

### 178. `fx_visual_regression_forensics`

**Description**: CAP 03 — Visual regression forensics: decodes two recorded screenshots (real PNG decoding), computes region-level pixel diffs and ATTRIBUTS changes to concurrent DOM/style mutations with ranked root-cause candidates. Input: sessionId + shot1/shot2 event ids (or timestamps).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Recorded forensic session id (list_sessions) |
| `shot1` | `string` | No | Screenshot event id before |
| `shot2` | `string` | No | Screenshot event id after |
| `t1` | `number` | No | Fallback: timestamp before |
| `t2` | `number` | No | Fallback: timestamp after |

---

### 179. `fx_layout_shift_forensics`

**Description**: CAP 04 — Layout shift forensics: evidence chains for CLS/layout instability — affected element, position transitions, trigger mutations, concurrent requests, style changes. Input: sessionId (+ eventId | timestamp | selector, windowMs).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `eventId` | `string` | No | - |
| `timestamp` | `number` | No | - |
| `selector` | `string` | No | - |
| `windowMs` | `number` | No | Default 600ms |

---

### 180. `fx_record_interactions`

**Description**: CAP 05 — Start/stop recording of interactions WITH DOM context (fingerprint, matched count, mutation baseline) for deterministic replay. Input: mode start|stop|record-step, recordingId, action, selector, params. Start returns a recordingId; record-step appends one step; stop finalizes.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `mode` | `string` | Yes | Recording operation |
| `recordingId` | `string` | No | Recording id (for stop/record-step) |
| `action` | `string` | No | Interaction action for record-step (click/type/hover/…) |
| `selector` | `string` | No | Target selector for record-step |
| `params` | `object` | No | Action parameters (text, key…) |
| `tabId` | `number` | No | - |

---

### 181. `fx_replay_interactions`

**Description**: CAP 05 — Deterministically replay a recorded interaction set with resilient target resolution (exact selector → fingerprint recovery), per-step results and success rate. Input: recordingId (+ stopOnFailure, verifySelectorsOnly, tabId).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `recordingId` | `string` | Yes | - |
| `stopOnFailure` | `boolean` | No | Default true |
| `verifySelectorsOnly` | `boolean` | No | Resolve targets without executing (dry-run) |
| `tabId` | `number` | No | - |

---

### 182. `fx_failure_replay`

**Description**: CAP 06 — Capture a structured failure state (URL, page state, selector candidates, DOM subtree, console, network, timing, action history) as a replayable scenario; replay re-executes with resilient resolution. Input: mode capture|replay|list|get, failureId, failedAction, failedSelector, params, tabId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `mode` | `string` | Yes | - |
| `failureId` | `string` | No | Scenario id (replay/get) |
| `failedAction` | `string` | No | Action that failed (capture) |
| `failedSelector` | `string` | No | Selector that failed (capture) |
| `params` | `object` | No | Original action params (capture) |
| `url` | `string` | No | Page URL context (capture) |
| `tabId` | `number` | No | - |
| `verifyOnly` | `boolean` | No | - |

---

### 183. `fx_selector_survivability`

**Description**: CAP 07 — Selector survivability scorer: ranks selectors by DOM stability, semantic stability, uniqueness, ancestry stability, framework-attribute risk, text volatility and position dependence — computed from recorded mutation history. Input: selector (+ sessionId, candidateSelectors).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | No | - |
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `candidateSelectors` | `array` | No | Alternative candidates [{selector, matches}] |

---

### 184. `fx_component_boundaries`

**Description**: CAP 08 — Component boundary detector: infers React/Vue/Angular/WebComponents/generic boundaries from DOM markers (data-v-, _ngcontent, custom elements, React hydration attrs) and whole-subtree replacement mutation patterns; returns confidence + evidence per boundary. Input: sessionId + timestamp (state to analyze).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | No | DOM state timestamp (default: latest) |

---

### 185. `fx_frame_forensics`

**Description**: CAP 09 — Frame/iframe forensics: complete frame hierarchy, cross-frame relationships, network/console/DOM event attribution per frame, cross-origin detection and frame-local selectors. Input: sessionId + timestamp.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | No | DOM state timestamp (default: latest) |

---

### 186. `fx_shadow_dom_forensics`

**Description**: CAP 10 — Shadow DOM forensics: open/nested shadow roots, host relationships, slot distribution, shadow-tree mutations, style-boundary notes. Analyzes recorded shadow flags + live probing of open roots. Input: sessionId + timestamp, or live selector.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | No | - |
| `selector` | `string` | No | Live host selector to probe (open roots) |
| `tabId` | `number` | No | - |

---

### 187. `fx_css_influence`

**Description**: CAP 11 — CSS influence analyzer: given an element, ranks the CSS rules that determine its visibility/dimensions/position/stacking/typography/overflow/clipping — with specificity, stylesheet source, declarations and inheritance flags. Input: selector (+ group, tabId).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | Yes | - |
| `group` | `string` | No | Property group focus (default all) |
| `tabId` | `number` | No | - |

---

### 188. `fx_zindex_occlusion`

**Description**: CAP 12 — Z-index/occlusion forensics: stacking context chain, effective z-order, occluding element via hit-test at center, clipping parent, pointer-events interception, zero-size detection — actionable, not a computed-style dump. Input: selector (+ tabId).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | Yes | - |
| `tabId` | `number` | No | - |

---

### 189. `fx_event_listeners`

**Description**: CAP 13 — Event listener forensics: inline on* attributes + addEventListener instrumentation (when the injected page script is active) with capture/passive flags, framework-ownership heuristics and coverage reporting. Input: selector (scope) or document-wide (+ tabId).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | No | Scope to a subtree (omit for whole document) |
| `tabId` | `number` | No | - |

---

### 190. `fx_error_root_cause`

**Description**: CAP 14 — Runtime error root-cause graph: console error → stack trace → source location → failed request → DOM mutations → visible symptoms, with RANKED likely root causes and evidence. Input: sessionId (+ eventId | timestamp).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `eventId` | `string` | No | Error event id |
| `timestamp` | `number` | No | Timestamp near the error |

---

### 191. `fx_network_dom_binding`

**Description**: CAP 15 — Network-to-DOM binding analyzer: which DOM regions depend on which responses (response → mutations window → region grouping) with confidence, plus unbound requests with reasons. Input: sessionId (+ windowMs, minConfidence, limit).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `windowMs` | `number` | No | Render window after response (default 1000ms) |
| `minConfidence` | `number` | No | Minimum binding confidence (default 0.3) |
| `limit` | `number` | No | - |

---

### 192. `fx_resource_waterfall`

**Description**: CAP 16 — Resource waterfall forensics: unified document/CSS/JS/font/image/fetch waterfall with request phases, timings, failures, DOM-ready and visual milestones, slowest-resource ranking. Input: sessionId (+ from, to).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `from` | `number` | No | - |
| `to` | `number` | No | - |

---

### 193. `fx_font_forensics`

**Description**: CAP 17 — Font rendering forensics: @font-face declarations vs computed usage vs document.fonts load status; undeclared families, font-display behavior, missing fallback stacks, not-loaded faces. Input: tabId (live/simulated page).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `tabId` | `number` | No | - |

---

### 194. `fx_a11y_divergence`

**Description**: CAP 18 — Accessibility + DOM divergence: builds the a11y view from the DOM state and reports inaccessible elements, semantic mismatches, missing names, hidden-but-relevant content and unexpected accessible nodes. Input: sessionId + timestamp.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | No | DOM state timestamp (default: latest) |

---

### 195. `fx_page_health`

**Description**: CAP 19 — Page health score: weighted composite of console errors, failed requests, a11y issues, performance signals, memory warnings, layout instability, broken interactions and DOM anomalies — every subscore independently inspectable. Input: sessionId (+ failedInteractions).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `failedInteractions` | `number` | No | Known failed interaction count |

---

### 196. `fx_exploration_planner`

**Description**: CAP 20 — Agent exploration planner: given current evidence and a symptom, recommends the next investigation actions (tool + rationale + expected outcome) and reports data gaps. A planning aid — never autonomous browsing. Input: sessionId + symptom.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `symptom` | `string` | No | Observed symptom, e.g. "checkout button disappeared after login" |

---

### 197. `fx_smart_snapshot`

**Description**: CAP 21 — Smart snapshot compression: MINIMAL/SEMANTIC/INTERACTION/FORENSIC/FULL modes with compression ratio + token estimates; recommends the smallest mode answering a question (pass question). Input: sessionId (+ timestamp, mode, question).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | No | - |
| `mode` | `string` | No | Snapshot mode (default: recommended from question) |
| `question` | `string` | No | What you need to answer — mode is auto-recommended |

---

### 198. `fx_cross_signal_search`

**Description**: CAP 22 — Cross-signal search: one query across DOM, mutations, console, network, navigation, interactions and screenshots — returns scored cross-domain hits plus temporally-adjacent related evidence. Input: sessionId + query (+ limit).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `query` | `string` | Yes | Search keywords (selectors, text, URLs, error messages…) |
| `limit` | `number` | No | Max hits (default 40) |

---

### 199. `fx_forensic_export`

**Description**: CAP 23 — Forensic session export: deterministic investigation bundle (metadata, timeline, evidence, findings, health, optional incident report) with SHA-256 content hash for tamper evidence. Input: sessionId (+ includeHealth, includeIncidentReport).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `includeHealth` | `boolean` | No | Include page health analysis (default true) |
| `includeIncidentReport` | `boolean` | No | Include a generated incident report (default false) |

---

### 200. `fx_forensic_import`

**Description**: CAP 24 — Forensic session import: validates a previously exported investigation bundle (format + contentHash) and installs it as HISTORICAL evidence — imported data is always marked historical, never live state. Input: bundleJson.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `bundleJson` | `string` | Yes | Exported bundle JSON (from fx_forensic_export) |
| `importAsSession` | `boolean` | No | Also register a queryable historical session (default true) |

---

### 201. `fx_impact_prediction`

**Description**: CAP 25 — Change impact predictor: pre-mutation estimation of subtree impact, selector breakage, listener orphaning, layout severity, a11y impact and form-state loss — integrates with the mutation preview workflow. Input: operation, selector (+ sessionId for stored selectors).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `operation` | `string` | Yes | Planned operation (set_attribute, set_style, remove, set_outer_html…) |
| `selector` | `string` | Yes | - |
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |

---

### 202. `fx_safe_mutation_guard`

**Description**: CAP 26 — Safe mutation guard: verdict SAFE/CAUTION/HIGH_RISK/BLOCKED with reasons and required precautions for a planned mutation. Never silently blocks normal operations — BLOCKED only for page-level destruction or irreversible state loss. Input: operation, selector (+ sessionId).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `operation` | `string` | Yes | - |
| `selector` | `string` | Yes | - |
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |

---

### 203. `fx_transaction_journal`

**Description**: CAP 27 — DOM transaction journal: structured per-transaction records (BEFORE/INTENT/ACTION/AFTER/DIFF/EVIDENCE/TIMESTAMP/ACTOR/ROLLBACK info). Journal entries are written by the transactional mutation engine flow; this tool queries them. Input: transactionId/operation/since filters.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `transactionId` | `string` | No | - |
| `operation` | `string` | No | - |
| `since` | `number` | No | - |
| `limit` | `number` | No | - |

---

### 204. `fx_session_graph`

**Description**: CAP 28 — Multi-page session graph: nodes/edges connecting pages, frames, navigations, requests, interactions, screenshots and DOM states of one investigation (recorded session + live pages). Input: sessionId.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |

---

### 205. `fx_evidence_scoring`

**Description**: CAP 29 — Forensic evidence scoring: score ANY finding from supporting/contradicting evidence items (source types with weights) — confidence, band, evidence count/types. The same model powers every fx_ conclusion. Input: conclusion + evidence arrays.

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `conclusion` | `string` | Yes | The conclusion to score |
| `supporting` | `array` | Yes | Supporting evidence [{source, description, ref?, weight?}] |
| `contradicting` | `array` | No | Contradicting evidence [{source, description, weight?}] |

---

### 206. `fx_incident_report`

**Description**: CAP 30 — Agent incident report generator: structured incident report (summary, timeline, root cause, evidence, affected DOM/requests/components, performance+a11y impact, remediation, validation steps, confidence) in JSON AND Markdown. Input: sessionId (+ detectedIssue, rootCauseHint).

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Recorded forensic session id (list_sessions) |
| `detectedIssue` | `string` | No | One-line issue description |
| `rootCauseHint` | `string` | No | Known root-cause hint (otherwise derived from evidence) |

---


## Temporal Intelligence (td_*) (10 Tools)

### 207. `td_temporal_query`

**Description**: Query any state/entity across a time range (State(T), State(T1..T2)). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session to query |
| `fromLogical` | `number` | No | Range start (logical ms) |
| `toLogical` | `number` | No | Range end (logical ms) |
| `entityIds` | `array` | No | Restrict to entities |
| `dimensions` | `array` | No | State dimensions to include |

---

### 208. `td_temporal_seek`

**Description**: Seek to the nearest valid state for an event/time. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `logicalTime` | `number` | Yes | Target logical time |

---

### 209. `td_temporal_window`

**Description**: Return a compact before/target/after state window around an event. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `aroundLogical` | `number` | Yes | Center logical time |
| `radiusMs` | `number` | No | Window radius in ms (default 250) |

---

### 210. `td_temporal_diff`

**Description**: Diff(T1,T2): compare two arbitrary points in time across all state dimensions. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `t1` | `number` | Yes | First logical time |
| `t2` | `number` | Yes | Second logical time |

---

### 211. `td_temporal_trace_entity`

**Description**: Trace one entity through its full lifetime (every touching event). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `entityId` | `string` | Yes | Entity to trace |

---

### 212. `td_temporal_first_change`

**Description**: Find the first event matching a predicate (e.g. first invalid state). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `source` | `string` | No | Event source filter |
| `typePattern` | `string` | No | Type regex filter |

---

### 213. `td_temporal_last_stable`

**Description**: Find the last state in which a dimension was stable before a time. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `dimension` | `string` | Yes | State dimension |
| `before` | `number` | Yes | Search horizon (logical ms) |
| `settleMs` | `number` | No | Quiet period that counts as stable (default 250) |

---

### 214. `td_temporal_join`

**Description**: Join DOM/runtime/network/visual/security events inside temporal constraints (Join(Signals)). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `sources` | `array` | Yes | Signal sources to join |
| `withinMs` | `number` | No | Cluster window (default 250) |
| `aroundEntityId` | `string` | No | Optional entity scope |

---

### 215. `td_temporal_branch`

**Description**: Branch(T): fork a historical state into a simulation branch (never overwrites reality). [security: reversible; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `forkAtLogical` | `number` | Yes | Fork point |
| `mutations` | `array` | Yes | Branch mutations (kind, targetSequence, patch, reason) |

---

### 216. `td_temporal_rewind`

**Description**: Reconstruct and activate a safe inspection state (read-only rewind). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `logicalTime` | `number` | Yes | Target time |

---


## Evidence & Provenance (td_*) (10 Tools)

### 217. `td_evidence_capture`

**Description**: Capture a typed evidence bundle for the current investigation. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `incidentId` | `string` | Yes | Incident to attach evidence to |
| `kind` | `string` | Yes | Evidence node type |
| `label` | `string` | Yes | Human label |
| `payload` | `object` | No | Evidence payload |

---

### 218. `td_evidence_search`

**Description**: Search evidence semantically and structurally. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |
| `text` | `string` | No | Text query |
| `types` | `array` | No | Node type filter |
| `limit` | `number` | No | Max results |

---

### 219. `td_evidence_chain`

**Description**: Build the provenance chain for a claim (claim → evidence → verification). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `claim` | `string` | Yes | The claim to ground |
| `evidenceRefs` | `array` | Yes | Candidate evidence refs |

---

### 220. `td_evidence_confidence`

**Description**: Recalculate confidence using source quality and corroboration. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `provenance` | `array` | Yes | Provenance records |
| `corroboration` | `number` | Yes | Independent corroborating sources |
| `verified` | `boolean` | No | Verified by contract? |
| `contradicted` | `boolean` | No | Counterevidence observed? |

---

### 221. `td_evidence_verify`

**Description**: Verify a claim against current or replayed state. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `claim` | `string` | Yes | Claim statement |
| `mustHold` | `array` | Yes | Postconditions that must hold |
| `mustNotHold` | `array` | No | Conditions that must not hold |
| `evidenceRequired` | `array` | No | Required evidence refs |

---

### 222. `td_evidence_hash`

**Description**: Hash a state/evidence artifact and attach integrity metadata. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `artifact` | `object` | Yes | Artifact to hash |

---

### 223. `td_evidence_compare`

**Description**: Compare two evidence packages (structural + provenance diff). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `packageA` | `object` | Yes | First package |
| `packageB` | `object` | Yes | Second package |

---

### 224. `td_evidence_export`

**Description**: Export a portable forensic evidence package (.tdom). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `incidentId` | `string` | Yes | Incident to export |
| `compress` | `boolean` | No | Gzip the artifact |
| `outputPath` | `string` | No | Optional file path |

---

### 225. `td_evidence_timeline`

**Description**: Produce a human-readable evidence timeline for an incident. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `incidentId` | `string` | Yes | Incident id |

---

### 226. `td_evidence_proof`

**Description**: Generate a machine-verifiable proof record for a finding. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `claims` | `array` | Yes | Claims with evidence refs |
| `steps` | `array` | No | Reasoning steps |
| `conclusion` | `string` | Yes | Conclusion statement |
| `verificationStatus` | `string` | Yes | PASS/FAIL/INCONCLUSIVE |

---


## Causal Intelligence (td_*) (10 Tools)

### 227. `td_cause_trace`

**Description**: Trace likely causes of a selected symptom (root-cause chain). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `symptomEventId` | `string` | Yes | Symptom event |
| `windowMs` | `number` | No | Correlation window (default 250) |

---

### 228. `td_cause_graph`

**Description**: Build a causal graph around an incident (typed nodes + provenance edges). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `windowMs` | `number` | No | Correlation window |

---

### 229. `td_cause_rank`

**Description**: Rank competing root-cause hypotheses by evidence strength. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `symptomEventId` | `string` | Yes | Symptom event |

---

### 230. `td_cause_explain`

**Description**: Explain a finding from evidence — claim + chain + confidence + alternatives. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `finding` | `string` | Yes | Finding to explain |
| `evidenceRefs` | `array` | Yes | Evidence to ground the explanation |

---

### 231. `td_cause_correlate`

**Description**: Correlate independent signals into candidate causal chains. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `sources` | `array` | Yes | Sources to correlate |
| `withinMs` | `number` | No | Window (default 250) |

---

### 232. `td_cause_breakpoint`

**Description**: Find the earliest causal divergence between two streams (reality vs branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `branchId` | `string` | Yes | Branch to compare |
| `sessionId` | `string` | Yes | Session id |

---

### 233. `td_cause_impact`

**Description**: Estimate downstream impact of a cause (affected entities/components). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `eventId` | `string` | Yes | Cause event |
| `sessionId` | `string` | Yes | Session id |

---

### 234. `td_cause_dependency`

**Description**: Trace dependencies that could produce a state (dependency chains). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `entityId` | `string` | Yes | Entity to analyze |
| `sessionId` | `string` | Yes | Session id |

---

### 235. `td_cause_counterfactual`

**Description**: Test whether removing a candidate cause changes the outcome (branch + replay + compare). [security: reversible; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `targetSequence` | `number` | Yes | Event sequence to suppress/modify |
| `kind` | `string` | Yes | suppress-event | modify-response | modify-state | modify-style | alter-timing |
| `patch` | `object` | No | Mutation payload |
| `reason` | `string` | Yes | Why this counterfactual |

---

### 236. `td_cause_verify`

**Description**: Verify a root-cause hypothesis through replay/observation (never guess). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `hypothesisId` | `string` | Yes | Hypothesis to verify |

---


## Semantic & Component Intelligence (td_*) (7 Tools)

### 237. `td_semantic_page`

**Description**: Build a compact semantic model of the page (roles, intents, stability). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session id |
| `includeHidden` | `boolean` | No | Include hidden elements |

---

### 238. `td_semantic_element`

**Description**: Explain an element's role, intent and state (semantic identity). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | Yes | Element selector |

---

### 239. `td_component_map`

**Description**: Infer component boundaries and ownership (React/Vue/Svelte/custom/microfrontend). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session id |

---

### 240. `td_component_lifecycle`

**Description**: Trace mount/update/unmount behavior of a component. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `componentId` | `string` | Yes | Component id or root selector |
| `sessionId` | `string` | Yes | Session id |

---

### 241. `td_component_dependencies`

**Description**: Map component dependencies and affected nodes. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `componentId` | `string` | Yes | Component id |

---

### 242. `td_component_state`

**Description**: Reconstruct component-facing state signals. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `componentId` | `string` | Yes | Component id |
| `sessionId` | `string` | No | Session id |

---

### 243. `td_accessibility_model`

**Description**: Build a normalized accessibility model (role/name/state/relationships/focus). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session id |

---


## Performance & Memory Intelligence (td_*) (7 Tools)

### 244. `td_visual_semantics`

**Description**: Associate visual regions with semantic entities. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session id |
| `regions` | `array` | No | Visual regions to associate |

---

### 290. `td_layout_causality`

**Description**: Connect layout shifts to runtime/DOM/network causes. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session scope |

---

### 291. `td_memory_profile`

**Description**: Build a memory profile for the browser/page/session. [security: read-only; cost: medium; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 292. `td_memory_leak_trace`

**Description**: Find retained-growth patterns over time. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session scope |
| `windowMs` | `number` | No | Observation window |

---

### 294. `td_visual_regression`

**Description**: Compare visual state with DOM/runtime evidence. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `baselineRef` | `string` | No | Baseline visual ref |
| `currentRef` | `string` | No | Current visual ref |

---

### 295. `td_visual_causality`

**Description**: Explain why a region changed visually (visual↔DOM↔runtime correlation). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `region` | `object` | Yes | Visual region |
| `sessionId` | `string` | No | Session scope |

---

### 296. `td_render_stability`

**Description**: Determine when the page reaches a stable render state. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |
| `settleMs` | `number` | No | Quiet period (default 250) |

---


## Targeting & Interaction Intelligence (td_*) (4 Tools)

### 249. `td_target_recover`

**Description**: Recover a target after selector/DOM changes (multi-signal recovery; refuses blind guesses). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `failedSelector` | `string` | Yes | The selector that failed |
| `lastKnown` | `object` | Yes | Last known target snapshot |

---

### 250. `td_target_verify`

**Description**: Verify that the selected target matches the requested intent. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `selector` | `string` | Yes | Selected selector |
| `intent` | `string` | Yes | Requested intent |

---

### 251. `td_target_history`

**Description**: Show how a target changed over time (identity versions). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `entityId` | `string` | Yes | Target entity |

---

### 252. `td_target_contract`

**Description**: Create a durable target contract for future actions. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `query` | `object` | Yes | Target query |
| `resolution` | `object` | Yes | Resolution result |

---


## Counterfactual Simulation (td_*) (8 Tools)

### 257. `td_simulate_change`

**Description**: Simulate a proposed change without committing it (dry-run on a branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `change` | `object` | Yes | Change spec |

---

### 258. `td_simulate_network`

**Description**: Simulate alternate network responses (modify-response branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `targetSequence` | `number` | Yes | Network event to alter |
| `responsePatch` | `object` | Yes | Response override |

---

### 259. `td_simulate_dom`

**Description**: Simulate DOM mutations against a branch. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `mutations` | `array` | Yes | DOM mutations |

---

### 260. `td_simulate_style`

**Description**: Simulate style/CSS changes (modify-style branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `targetSequence` | `number` | Yes | Style event to alter |
| `stylePatch` | `object` | Yes | Style override |

---

### 261. `td_simulate_runtime`

**Description**: Simulate selected runtime conditions (state/event patches). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `condition` | `object` | Yes | Runtime condition spec |

---

### 262. `td_simulate_failure`

**Description**: Reproduce a controlled failure condition in an authorized environment. [security: policy-gated; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session id |
| `failureKind` | `string` | Yes | Failure to inject |

---

### 264. `td_predict_impact`

**Description**: Predict affected components/entities before a mutation (impact analysis). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `change` | `object` | Yes | Proposed change |
| `scope` | `object` | No | Scope hints |

---

### 266. `td_branch_merge`

**Description**: Merge a successful simulation branch into a controlled mutation plan. [security: reversible; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `branchId` | `string` | Yes | Verified branch |
| `sessionId` | `string` | Yes | Session id |

---


## Reliability & Recovery (td_*) (2 Tools)

### 267. `td_health_snapshot`

**Description**: Return full TeleDOM runtime health + integrity state (self-diagnostics). [security: read-only; cost: low; modes: live/recorded/simulation]

*No parameters required.*

---

### 276. `td_session_repair`

**Description**: Repair a partially corrupted session from checkpoints + evidence (hash-verified). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session to repair |

---


## Security & Zero-Trust (td_*) (4 Tools)

### 277. `td_security_posture`

**Description**: Produce a browser-side security posture summary (passive, evidence-driven). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 278. `td_security_surface`

**Description**: Map client-visible attack surfaces and trust boundaries. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | No | Session scope |

---

### 279. `td_security_flow`

**Description**: Trace sensitive-data flows through the browser runtime. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `sessionId` | `string` | Yes | Session scope |

---

### 286. `td_security_regression`

**Description**: Compare security posture before/after a code or deployment change. [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `beforeRef` | `string` | Yes | Baseline posture ref |
| `afterRef` | `string` | Yes | Current posture ref |

---


## Autonomous Investigation & Orchestration (td_*) (3 Tools)

### 297. `td_investigate`

**Description**: Run a complete autonomous investigation from a natural-language objective (resumable plan: scope→…→proof). [security: read-only; cost: high; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `objective` | `string` | Yes | Natural-language objective, e.g. "Why does checkout freeze after payment?" |
| `symptomPattern` | `string` | Yes | Regex identifying symptom events |
| `sessionId` | `string` | Yes | Session to investigate |
| `resumePlanId` | `string` | No | Resume an existing plan |

---

### 305. `td_context_optimize`

**Description**: Select the smallest sufficient evidence/state set for the agent (L0–L4). [security: read-only; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `intent` | `string` | Yes | The decision the agent must make next |
| `requestedLevel` | `string` | No | L0|L1|L2|L3|L4 |

---

### 306. `td_incident_close`

**Description**: Close an incident ONLY after reproduction, remediation and verification criteria pass. [security: policy-gated; cost: low; modes: live/recorded/simulation]

**Parameters**:
| Parameter | Type | Required | Description |
|---|---|:---:|---|
| `incidentId` | `string` | Yes | Incident to close |

---

