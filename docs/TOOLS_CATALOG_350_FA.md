# راهنمای مرجع و کاتالوگ جامع ۳۰۶ ابزار پلتفرم TeleDOM v4

**نسخه پلتفرم**: 4.0.0  
**تعداد کل ابزارهای در دسترس ایجنت**: ۳۰۶ ابزار رسمی  
**فضاهای نامی ابزارها (Namespaces)**:
- خانواده `td_*`: ۱۴۴ ابزار هوش زمانی، استدلال علّی و بازرسی خودکار
- خانواده `dt_*`: ۵۴ ابزار تعاملی و مانیتورینگ پروتکل DevTools کروم
- خانواده `fx_*`: ۳۱ ابزار پیشرفته جرم‌شناسی وب، دیف چندبعدی و ردیابی
- ابزارهای پایه و v3: ۱۲۱ ابزار ضبط رویدادها، بازرسی زنده و تراکنش‌های DOM

---

## فهرست دسته‌بندی‌ها
۱. [مقدمه و معماری ابزارها](#مقدمه-و-معماری-ابزارها)  
۲. [ابزارهای هوش زمانی و شناختی TeleDOM v4 (۱۴۴ ابزار td_*)](#۱-ابزارهای-هوش-زمانی-و-شناختی-teledom-v4)  
۳. [ابزارهای سازگاری پروتکل Chrome DevTools (۵۴ ابزار dt_*)](#۲-ابزارهای-سازگاری-پروتکل-chrome-devtools)  
۴. [ابزارهای پیشرفته جرم‌شناسی وب (۳۱ ابزار fx_*)](#۳-ابزارهای-پیشرفته-جرمشناسی-وب)  
۵. [ابزارهای پایه مدیریت سشن، بازرسی زنده و جهش DOM (۱۲۱ ابزار)](#۴-ابزارهای-پایه-مدیریت-سشن-بازرسی-زنده-و-جهش-dom)  

---


## ضبط رویدادهای مرورگر و مدیریت سشن‌ها (Session Management) (28 ابزار)

### 1. ابزار `list_sessions`

**توضیحات و عملکرد**: List all recorded browser forensic debugging sessions with metadata, timestamps, and stats.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `limit` | `number` | خیر | Maximum number of sessions to return |

---

### 2. ابزار `get_session`

**توضیحات و عملکرد**: Retrieve full metadata, capabilities, health status, and statistics for a specific debugging session.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Unique identifier of the recording session |

---

### 3. ابزار `export_session`

**توضیحات و عملکرد**: Export a complete recording session as a portable, self-contained JSON bundle.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Unique identifier of the recording session |

---

### 4. ابزار `import_session`

**توضیحات و عملکرد**: Import a recording session bundle from raw JSON string.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `bundleJson` | `string` | بله | Raw JSON string of the session bundle |

---

### 5. ابزار `delete_session`

**توضیحات و عملکرد**: Delete a recording session from storage.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Unique identifier of the recording session |

---

### 6. ابزار `get_timeline`

**توضیحات و عملکرد**: Retrieve summary breakdown of events across the session timeline, including event categories and significant milestones.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |

---

### 19. ابزار `annotate_session`

**توضیحات و عملکرد**: Add an investigative annotation or hypothesis to the session timeline.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `label` | `string` | بله | Short title for annotation |
| `comment` | `string` | بله | Detailed investigative note or root-cause finding |
| `nodeId` | `number` | خیر | Optional associated LogicalNodeId |
| `category` | `string` | خیر | - |

---

### 21. ابزار `get_recording_health`

**توضیحات و عملکرد**: Run an automated integrity audit on a recording session to check sequence monotonicity, missing nodes, and capability health.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |

---

### 22. ابزار `list_tabs`

**توضیحات و عملکرد**: List all open Chrome browser tabs across windows with tab ID, title, URL, active state, window ID, status, and recording status.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 23. ابزار `focus_tab`

**توضیحات و عملکرد**: Switch active focus to a specific browser tab by tabId and bring its window to the foreground.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | بله | The unique Chrome tab ID to activate and focus |

---

### 24. ابزار `reload_tab`

**توضیحات و عملکرد**: Reload a specific browser tab or the active tab with optional hard refresh (bypassCache).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Target Chrome tab ID (defaults to currently active tab if omitted) |
| `bypassCache` | `boolean` | خیر | Whether to ignore cached assets and perform a hard reload (default: false) |

---

### 25. ابزار `close_tab`

**توضیحات و عملکرد**: Close a specific browser tab by tabId, URL substring, or pattern (e.g., "meet", "calendar").

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Target Chrome tab ID to close |
| `url` | `string` | خیر | URL substring or pattern of tabs to close (e.g. "meet.google.com") |

---

### 26. ابزار `open_tab`

**توضیحات و عملکرد**: Open a new browser tab with the specified URL, meeting link, web page, or local file path in Chrome.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `url` | `string` | بله | The URL, web link, meeting link, or file:// path to open |
| `active` | `boolean` | خیر | Whether the new tab should become the active and focused tab (default: true) |
| `pinned` | `boolean` | خیر | Whether the tab should be pinned (default: false) |

---

### 33. ابزار `get_tab_console_logs`

**توضیحات و عملکرد**: Retrieve live intercepted console logs, uncaught JavaScript errors, and unhandled promise rejections for a specific tab or the active tab.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Target Chrome tab ID (defaults to currently active tab if omitted) |
| `level` | `string` | خیر | Filter by log severity level (default: all) |
| `searchQuery` | `string` | خیر | Filter logs containing this text or source |
| `limit` | `number` | خیر | Maximum number of recent log entries to return (default: 100) |
| `clearAfterRead` | `boolean` | خیر | Clear the internal log buffer after reading (default: false) |

---

### 34. ابزار `get_tab_network_requests`

**توضیحات و عملکرد**: Retrieve live intercepted network requests and responses (Fetch, XHR) for a specific tab or the active tab, including method, URL, status, duration, and errors.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Target Chrome tab ID (defaults to currently active tab if omitted) |
| `method` | `string` | خیر | Filter by HTTP method (GET, POST, PUT, DELETE, etc.) |
| `status` | `number` | خیر | Filter by HTTP status code (e.g. 200, 404, 500) |
| `onlyErrors` | `boolean` | خیر | Return only failed requests or HTTP status >= 400 (default: false) |
| `searchQuery` | `string` | خیر | Filter requests by URL substring |
| `limit` | `number` | خیر | Maximum number of recent network requests to return (default: 100) |
| `clearAfterRead` | `boolean` | خیر | Clear the internal network buffer after reading (default: false) |

---

### 71. ابزار `wait_for_dom_stable`

**توضیحات و عملکرد**: Convenience wrapper for wait_for_condition {kind: dom_stable}: polls until two consecutive DOM length observations match. Input: timeoutMs. Output: satisfied + waitedMs.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `timeoutMs` | `number` | خیر | Timeout (default 5000ms) |

---

### 92. ابزار `list_command_recordings`

**توضیحات و عملکرد**: List saved command recordings with metadata (id, name, command count, timestamps, tags). Input: none. Side effect: none.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 93. ابزار `get_command_recording`

**توضیحات و عملکرد**: Load one command recording in full (all commands with args and outcomes). Input: recordingId. Output: CommandRecording. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `recordingId` | `string` | بله | Recording identifier |

---

### 94. ابزار `replay_command_recording`

**توضیحات و عملکرد**: Replay a saved command recording: executes each recorded tool call in order with deterministic arguments. Input: recordingId, stopOnError (default true). Output: CommandSequenceResult. Side effects: those of the recorded commands — review get_command_recording first.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `recordingId` | `string` | بله | - |
| `stopOnError` | `boolean` | خیر | Stop on first failure (default true) |

---

### 95. ابزار `export_command_recording`

**توضیحات و عملکرد**: Export a command recording as portable JSON (with schema version) for another agent or session. Input: recordingId, outputPath (optional). Output: the exported JSON + save info.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `recordingId` | `string` | بله | - |
| `outputPath` | `string` | خیر | Optional file path to write the JSON |

---

### 96. ابزار `import_command_recording`

**توضیحات و عملکرد**: Import a command recording from JSON (previously exported). Input: recordingJson. Output: imported recording metadata. Side effect: writes to recordings storage.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `recordingJson` | `string` | بله | Serialized CommandRecording JSON |

---

### 97. ابزار `delete_command_recording`

**توضیحات و عملکرد**: Delete a saved command recording. Input: recordingId. Side effect: removes stored data (irreversible).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `recordingId` | `string` | بله | - |

---

### 98. ابزار `get_browser_session`

**توضیحات و عملکرد**: Inspect the coherent browser session model: tabs with stable session identities, active tab, viewport state, extension state, snapshot count, command count, mutation history count, timeline event count, bound project id. Input: none. Side effect: none.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 99. ابزار `get_action_timeline`

**توضیحات و عملکرد**: Query the chronological action timeline (TAB_OPENED, CLICKED, DOM_MUTATED, SNAPSHOT_CREATED, ERROR_OCCURRED, …) with optional filters (kind, sinceTimestamp, limit). The platform observability layer. Input: optional filters. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `kind` | `string` | خیر | Filter by event kind |
| `sinceTimestamp` | `number` | خیر | Only events at/after this epoch ms |
| `limit` | `number` | خیر | Max events (default 200) |

---

### 115. ابزار `export_agent_package`

**توضیحات و عملکرد**: Export a self-contained Agent handoff package for another AI agent: README.md, PROJECT.md, agent-instructions.md, project.json, pages/, regions/, snapshots/, diffs/, commands/, assets/, schemas/, verification/. The package fully separates OBSERVED FACTS / USER REQUESTS / EXPECTED CHANGES / VERIFICATION CONDITIONS. Input: projectName, outputDir (default ./mcpdom_agent_packages/<name>). Side effect: writes the package directory.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |
| `outputDir` | `string` | خیر | Output directory (default ./mcpdom_agent_packages/<name>) |

---

### 117. ابزار `import_project`

**توضیحات و عملکرد**: Import a project previously exported via export_agent_package or a project folder copy: restores manifest, page, regions, diffs and command recordings into working storage. Input: projectDir. Side effect: copies files into .mcpdom_projects.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectDir` | `string` | بله | Path to the exported project folder |

---

### 271. ابزار `td_reconcile_tabs`

**توضیحات و عملکرد**: Reconcile page identity after tabs/windows change. [security: read-only; cost: low; modes: live/recorded/simulation]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 282. ابزار `td_auth_session_audit`

**توضیحات و عملکرد**: Audit authentication/session behavior, expiry and state transitions. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---


## ابزارهای عمومی پلتفرم و کنترل مرورگر (111 ابزار)

### 7. ابزار `get_events`

**توضیحات و عملکرد**: Query recorded events with filtering by category (DOM, USER, ERROR, CONSOLE, NETWORK, etc.), type, timestamp range, target node, or search query.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `category` | `string` | خیر | Filter by category (DOM, USER, ERROR, CONSOLE, NETWORK, NAVIGATION, etc.) |
| `type` | `string` | خیر | Filter by exact event type (e.g. DOM_MUTATION_ADD, RUNTIME_ERROR, USER_CLICK) |
| `fromTimestamp` | `number` | خیر | Start timestamp in milliseconds |
| `toTimestamp` | `number` | خیر | End timestamp in milliseconds |
| `targetNodeId` | `number` | خیر | Filter by affected LogicalNodeId |
| `targetSelector` | `string` | خیر | Filter by CSS selector substring |
| `searchQuery` | `string` | خیر | Search term inside event payload |
| `limit` | `number` | خیر | Max events to return (default: 50) |
| `offset` | `number` | خیر | Offset for pagination |

---

### 8. ابزار `get_events_around`

**توضیحات و عملکرد**: Retrieve a focused contextual window of events occurring immediately before and after a specific timestamp or event ID.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `timestamp` | `number` | خیر | Target timestamp in milliseconds |
| `eventId` | `string` | خیر | Target event ID |
| `windowMs` | `number` | خیر | Window radius in milliseconds (default: 300ms) |

---

### 9. ابزار `get_dom_state`

**توضیحات و عملکرد**: Reconstruct the complete DOM snapshot at an arbitrary timestamp or event ID using checkpoint delta replay.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `timestamp` | `number` | خیر | Target timestamp in milliseconds |
| `eventId` | `string` | خیر | Target event ID |
| `format` | `string` | خیر | Output format (default: html) |

---

### 10. ابزار `get_dom_node`

**توضیحات و عملکرد**: Inspect detailed properties of a specific DOM node at a given timestamp (tag, attributes, text, parent, children, visibility state).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `timestamp` | `number` | خیر | Timestamp in milliseconds |
| `nodeId` | `number` | خیر | LogicalNodeId to inspect |
| `selector` | `string` | خیر | CSS selector query if nodeId is unknown |

---

### 12. ابزار `diff_dom`

**توضیحات و عملکرد**: Compare two DOM states between timestamp T1 and T2 (or event E1 and E2) and return structured additions, removals, moves, attribute, style, and text changes.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `t1` | `number` | خیر | Start timestamp in milliseconds |
| `t2` | `number` | خیر | End timestamp in milliseconds |
| `e1` | `string` | خیر | Start event ID (alternative to t1) |
| `e2` | `string` | خیر | End event ID (alternative to t2) |

---

### 13. ابزار `trace_element`

**توضیحات و عملکرد**: Trace the entire chronological lifecycle of a DOM element from creation, mounting, mutations, style changes to unmounting/removal.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `nodeId` | `number` | خیر | LogicalNodeId of the element |
| `selector` | `string` | خیر | CSS selector hint for the element |

---

### 14. ابزار `find_disappearing_elements`

**توضیحات و عملکرد**: Automatically scan the session and identify all elements that existed temporarily and were subsequently removed or hidden.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `maxLifespanMs` | `number` | خیر | Maximum lifespan in ms to consider (default: 5000ms) |

---

### 15. ابزار `why_did_element_disappear`

**توضیحات و عملکرد**: Forensic root-cause diagnosis for why an injected or existing UI element disappeared. Pinpoints removal mechanism, ancestor container destruction, style changes, and correlated errors/network triggers.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `target` | `string` | بله | CSS selector or LogicalNodeId of the target element |

---

### 16. ابزار `get_diagnostics`

**توضیحات و عملکرد**: Query recorded console messages, runtime errors, and unhandled promise rejections with stack traces.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `level` | `string` | خیر | Log level filter |
| `fromTimestamp` | `number` | خیر | Start timestamp |
| `toTimestamp` | `number` | خیر | End timestamp |

---

### 17. ابزار `get_network_events`

**توضیحات و عملکرد**: Query recorded network requests and responses correlated with timing and duration.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `statusFilter` | `string` | خیر | HTTP status filter |

---

### 18. ابزار `get_screenshots`

**توضیحات و عملکرد**: List visual checkpoints and screenshot checkpoints captured during the recording session.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |

---

### 27. ابزار `list_extensions`

**توضیحات و عملکرد**: List all installed Chrome extensions with ID, name, version, enabled status, installation type, and permissions.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 28. ابزار `set_extension_enabled`

**توضیحات و عملکرد**: Enable or disable a specific Chrome extension by ID (e.g. turn off extension to observe native clean UI, then turn back on).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionId` | `string` | بله | The Chrome extension ID to enable or disable |
| `enabled` | `boolean` | بله | True to enable the extension, false to disable it |

---

### 29. ابزار `toggle_extension`

**توضیحات و عملکرد**: Toggle the enabled status of a specific Chrome extension by ID.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionId` | `string` | بله | The Chrome extension ID to toggle |

---

### 30. ابزار `execute_pipeline`

**توضیحات و عملکرد**: Execute a batch sequence of browser and extension actions in one call (e.g. reload extension, wait, reload tab, take screenshot directly to file, dump DOM to file) and aggregate all results.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `steps` | `array` | بله | Ordered array of actions to execute sequentially |
| `outputPath` | `string` | خیر | Optional file path to save consolidated JSON report of all pipeline steps |

---

### 31. ابزار `compare_extension_states`

**توضیحات و عملکرد**: Automatically perform a complete before/after comparative forensic audit: disables extension, reloads and captures clean native state/screenshot, enables extension, reloads and captures injected state/screenshot, and returns a detailed differential analysis.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionId` | `string` | بله | Target Chrome extension ID |
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to active tab) |
| `waitDurationMs` | `number` | خیر | Wait time in ms after each reload for DOM to settle (default: 2500) |
| `cleanDomPath` | `string` | خیر | File path to save clean native DOM snapshot HTML |
| `injectedDomPath` | `string` | خیر | File path to save injected DOM snapshot HTML |
| `cleanScreenshotPath` | `string` | خیر | File path to save clean native screenshot PNG |
| `injectedScreenshotPath` | `string` | خیر | File path to save injected screenshot PNG |
| `diffOutputPath` | `string` | خیر | File path to save JSON differential report |

---

### 32. ابزار `reload_extension`

**توضیحات و عملکرد**: Reload an extension under development. If extensionId is provided, toggles and reloads that extension. If omitted, reloads the Forensic Recorder extension itself.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionId` | `string` | خیر | Extension ID to reload (defaults to current extension if omitted) |

---

### 37. ابزار `get_selected_element`

**توضیحات و عملکرد**: Retrieve the DOM element visually selected by the user via Ctrl + Shift + Mouse Click in the live browser.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 40. ابزار `capture_page_screenshot`

**توضیحات و عملکرد**: Capture a screenshot of the visible browser page viewport with temporal, scroll, and viewport metadata. When outputPath is provided, saves decoded image directly to disk.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `format` | `string` | خیر | Image format (default: png) |
| `outputPath` | `string` | خیر | Optional file path to save decoded PNG/JPEG image directly to disk |

---

### 41. ابزار `capture_element_screenshot`

**توضیحات و عملکرد**: Capture an element-specific screenshot bounded to the target element exact geometry and device pixel ratio. When outputPath is provided, saves decoded image directly to disk.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `outputPath` | `string` | خیر | Optional file path to save decoded element PNG/JPEG image directly to disk |
| `selector` | `string` | خیر | CSS selector of the target element |
| `nodeId` | `number` | خیر | LogicalNodeId of the target element |
| `selectedElementRef` | `string` | خیر | Selected element reference token |

---

### 42. ابزار `interact_with_element`

**توضیحات و عملکرد**: Perform an interaction (click, double_click, right_click, hover, focus, blur, type, clear, press_key, select_option, scroll_into_view, scroll) on a live element and return before/after state and effect measurements.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `action` | `string` | بله | The user action to perform |
| `selector` | `string` | خیر | CSS selector of the target element |
| `nodeId` | `number` | خیر | LogicalNodeId of the target element |
| `selectedElementRef` | `string` | خیر | Selected element reference token |
| `text` | `string` | خیر | Text string for type action |
| `key` | `string` | خیر | Key name for press_key action (e.g. Enter, Escape, Tab, ArrowDown) |
| `optionValue` | `string` | خیر | Value or label for select_option action |
| `scrollDelta` | `object` | خیر | Scroll deltas for scroll action |
| `waitForStabilization` | `boolean` | خیر | Wait for DOM and network stabilization after interaction (default: true) |
| `stabilizationTimeoutMs` | `number` | خیر | Max wait time in milliseconds (default: 300ms) |

---

### 47. ابزار `get_element_visual_state`

**توضیحات و عملکرد**: Inspect detailed visual layout, occlusion, clipping, opacity, z-index, and viewport visibility for a live element.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | خیر | CSS selector of the target element |
| `nodeId` | `number` | خیر | LogicalNodeId of the target element |

---

### 48. ابزار `generate_element_target`

**توضیحات و عملکرد**: Build the canonical multi-strategy TARGET object for an element: ranked selector candidates with confidence, xpath, DOM path, text/attribute/structural fingerprints and bounds. Use before storing or acting on elements to maximize targeting resilience. Input: target (selector/xpath/selectedElementRef). Output: TARGET with confidence in [0,1]. Fails with TARGET_NOT_FOUND when no strategy resolves.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier (selector, xpath, nodeId, or selectedElementRef) |
| `selector` | `string` | خیر | Shorthand: CSS selector for the target element |

---

### 51. ابزار `get_element_ancestry`

**توضیحات و عملکرد**: Analyze element ancestry: ancestors chain (tag, selector, role, text, child index, sibling count, distance), nearby siblings (before/after with distance), and descendant summary (count, max depth, tags, interactive descendants). Input: target/selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |

---

### 52. ابزار `get_element_fingerprint`

**توضیحات و عملکرد**: Compute the structural DOM fingerprint of an element: stable hash, tag hierarchy, stable attributes, meaningful text, class list, role, dimensions, ancestor/descendant patterns, plus a volatility risk assessment with reasons. Use for cross-navigation element identity. Input: target/selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |

---

### 53. ابزار `get_element_relationships`

**توضیحات و عملکرد**: Build the element relationship graph: self, parents (up to 4 levels), children and siblings as nodes with edges (parent-of, contains, sibling-of). Use to understand page region architecture around a target. Input: target/selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |

---

### 54. ابزار `get_element_accessibility`

**توضیحات و عملکرد**: Extract accessibility metadata: explicit/implicit role, accessible name with sources, description, value, states, heading level, focusability, tabIndex, all aria-* attributes, and detected a11y issues. Input: target/selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |

---

### 56. ابزار `search_dom`

**توضیحات و عملکرد**: Search the DOM by text, tag and attribute patterns with scored results (selector, role, text, visibility, bounds). The fastest way to find elements without knowing selectors. Input: query (required), optional tag, attr, attrValue, limit. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `query` | `string` | بله | Search text (matched against text, tags and attributes) |
| `tag` | `string` | خیر | Restrict to tag name |
| `attr` | `string` | خیر | Require this attribute name |
| `attrValue` | `string` | خیر | Attribute value substring filter |
| `limit` | `number` | خیر | Max results (default 50, max 200) |

---

### 57. ابزار `analyze_dom`

**توضیحات و عملکرد**: Run a named DOM analyzer: analyze_forms, extract_links, analyze_media, get_css_variables, analyze_fonts, extract_color_palette, detect_zindex_conflicts, detect_layout_issues, census_interactive_elements, detect_semantic_elements, scan_accessibility_issues, detect_dead_click_targets, inventory_animations, map_frame_tree, inventory_shadow_roots, inspect_page_storage, get_performance_metrics, extract_seo_metadata, extract_structured_data, extract_tables, extract_lists, analyze_page_content, inventory_ctas, detect_focus_traps, infer_responsive_breakpoints, get_selection_state. Input: analyzer (required) + analyzer-specific options. Output: structured analysis with count, items, warnings.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `analyzer` | `string` | بله | Analyzer name (see tool description for the full list) |
| `query` | `string` | خیر | Optional search query (search_dom) |
| `limit` | `number` | خیر | Optional result cap |

---

### 58. ابزار `get_page_blueprint`

**توضیحات و عملکرد**: Generate a page blueprint: major sections with bounds and roles, hierarchy tree, key interactive elements, repeated components (patterns with occurrence counts), layout relationships and semantic regions. The architectural map for page understanding. Input: projectName (optional — generated in the live DOM otherwise). Output: PageBlueprint.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | خیر | Optional project name to persist the blueprint |

---

### 59. ابزار `click_element`

**توضیحات و عملکرد**: Production-grade click with explicit mode: normal (synthetic pointer event sequence), double, right, or human-like (movement trajectory + click delay from the active interaction profile). Records which mode was actually used. Input: target/selector, mode, waitForStabilization. Output: InteractionResult with before/after state and measured effects.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |
| `mode` | `string` | خیر | Click mode (default normal). Never silently falls back — the used mode is reported. |
| `waitForStabilization` | `boolean` | خیر | Wait for DOM stabilization after the click |

---

### 60. ابزار `type_text`

**توضیحات و عملکرد**: Robust typing into inputs, textareas and contenteditable with mode: append, replace (clear then type) or clear. Framework-sensitive: dispatches keydown/keypress/input/change per character. Input: target/selector, text, mode. Output: InteractionResult; resulting value visible in afterState.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |
| `text` | `string` | خیر | Text to type |
| `mode` | `string` | خیر | Typing mode (default append) |
| `waitForStabilization` | `boolean` | خیر | - |

---

### 61. ابزار `hover_element`

**توضیحات و عملکرد**: Hover an element: pointerenter/mouseenter/mouseover/mousemove event sequence. Input: target/selector. Output: InteractionResult.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | - |
| `selector` | `string` | خیر | - |

---

### 62. ابزار `focus_element`

**توضیحات و عملکرد**: Focus an element (native focus() + focus event). Input: target/selector. Output: InteractionResult.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | - |
| `selector` | `string` | خیر | - |

---

### 63. ابزار `blur_element`

**توضیحات و عملکرد**: Blur (defocus) an element (native blur() + blur event). Input: target/selector. Output: InteractionResult.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | - |
| `selector` | `string` | خیر | - |

---

### 64. ابزار `press_keyboard_shortcut`

**توضیحات و عملکرد**: Press a key or keyboard shortcut on an element (or the active element): keydown+keyup per key with modifier flags. Input: keys (e.g. ["Control","Shift","P"] or "Control+Shift+P"), optional target. Output: events fired and target selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `keys` | `string` | بله | Shortcut, e.g. "Control+Shift+P" or "Enter" |
| `keyList` | `array` | خیر | Alternative: keys as array |
| `target` | `object` | خیر | Optional target specifier; defaults to activeElement |

---

### 65. ابزار `scroll_to_element`

**توضیحات و عملکرد**: Scroll an element into view (block: center). Input: target/selector. Output: before/after scroll positions and target selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | - |
| `selector` | `string` | خیر | - |
| `behavior` | `string` | خیر | Scroll behavior (default auto) |

---

### 66. ابزار `scroll_page`

**توضیحات و عملکرد**: Scroll the page by a distance: x/y pixel offsets. Input: x, y. Output: before/after scroll positions.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `x` | `number` | خیر | Horizontal pixel delta |
| `y` | `number` | خیر | Vertical pixel delta |

---

### 67. ابزار `drag_and_drop`

**توضیحات و عملکرد**: Drag and drop: HTML5 drag events (dragstart/dragenter/dragover/drop/dragend) plus pointer events between source and target (or by pixel offsets). Input: source (target specifier), optional target specifier or offsets. Output: events fired, final position, whether HTML5 DnD was used.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `source` | `object` | بله | Source element target specifier |
| `target` | `object` | خیر | Drop target specifier (or use offsets) |
| `offsets` | `object` | خیر | Pixel offsets when no drop target |

---

### 68. ابزار `set_input_checked`

**توضیحات و عملکرد**: Check/uncheck a checkbox or select a radio (peer radios with the same name are deselected). Dispatches input + change events. Input: target/selector, checked (default true). Output: checkedBefore/checkedAfter and events fired.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | - |
| `selector` | `string` | خیر | - |
| `checked` | `boolean` | خیر | Desired state (default true) |

---

### 69. ابزار `select_option`

**توضیحات و عملکرد**: Select an option in a dropdown: sets value and dispatches change. Input: target/selector, value. Output: InteractionResult.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | - |
| `selector` | `string` | خیر | - |
| `value` | `string` | بله | Option value to select |

---

### 70. ابزار `wait_for_condition`

**توضیحات و عملکرد**: Wait for a meaningful condition instead of arbitrary sleeps: dom_stable, selector_present, selector_visible, selector_absent, text_present, url_contains, element_count, readiness_state. Input: kind + condition params, timeoutMs (default 5000, max 30000), pollIntervalMs. Output: satisfied, waitedMs, detail. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `kind` | `string` | بله | Condition kind |
| `selector` | `string` | خیر | Selector for selector_* and element_count conditions |
| `text` | `string` | خیر | Text for text_present / url_contains |
| `count` | `number` | خیر | Expected count for element_count |
| `state` | `string` | خیر | Expected readyState (default complete) |
| `timeoutMs` | `number` | خیر | Timeout (default 5000ms) |
| `pollIntervalMs` | `number` | خیر | Poll interval (default 100ms) |

---

### 72. ابزار `set_interaction_profile`

**توضیحات و عملکرد**: Set the human-interaction profile for subsequent interactions: DETERMINISTIC (zero delay), BALANCED (small natural delays), HUMAN_LIKE (realistic cadence, trajectories, hesitation) or CUSTOM (user timing parameters, seed). The seed makes HUMAN_LIKE reproducible. Input: profile, optional custom timings + seed. Output: active profile report.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `profile` | `string` | بله | Profile name |
| `seed` | `number` | خیر | PRNG seed for reproducible human-like timing |
| `custom` | `object` | خیر | CUSTOM profile overrides: moveDelayMs, clickDelayMs, typeDelayMs, keyDelayMs {min,max}, hesitationProbability, trajectorySteps |

---

### 73. ابزار `get_interaction_profile`

**توضیحات و عملکرد**: Inspect the active interaction profile and the timing of the last action (requested mode, actual mode, per-phase timings, total duration). Output: InteractionProfileReport.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 74. ابزار `preview_command`

**توضیحات و عملکرد**: Dry-run preview of a DOM mutation: valid flag, expected change description, affected node count and warnings — WITHOUT applying anything. Input: operation + target + params (same as mutate_dom). Output: MutationPreview. Side effect: none (guaranteed).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `operation` | `string` | بله | Mutation operation (see mutate_dom) |
| `target` | `object` | بله | Element target specifier |
| `attribute` | `string` | خیر | - |
| `value` | `string` | خیر | - |
| `classes` | `array` | خیر | - |
| `text` | `string` | خیر | - |
| `replacement` | `string` | خیر | - |
| `html` | `string` | خیر | - |
| `newElementHtml` | `string` | خیر | - |
| `parent` | `object` | خیر | - |
| `position` | `string` | خیر | - |

---

### 78. ابزار `run_responsive_test`

**توضیحات و عملکرد**: Run a multi-viewport responsive workflow: applies each size, records DOM length/interactive count/horizontal overflow per step, compares steps, then RESTORES the original viewport (unless restore:false). Input: sizes array (or defaults 1440x900, 1024x768, 768x1024, 375x667), restore. Output: ResponsiveTestResult with comparisons.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sizes` | `array` | خیر | Custom viewport sequence |
| `restore` | `boolean` | خیر | Restore original viewport afterwards (default true) |

---

### 79. ابزار `emulate_device`

**توضیحات و عملکرد**: Emulate a device profile: viewport + devicePixelRatio + touch metadata + reported UA (UA override applied only in a real browser session; honestly reported otherwise). Input: device (iphone-13, ipad-air, pixel-7, galaxy-s23, macbook-pro-16, windows-desktop). Output: resize result + profile + userAgentNote.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `device` | `string` | بله | Device profile name |

---

### 80. ابزار `execute_javascript`

**توضیحات و عملکرد**: Execute JavaScript with explicit outcome states: EXECUTED_SUCCESSFULLY, EXECUTED_WITH_ERROR, TIMED_OUT, SERIALIZATION_FAILED, BLOCKED_BY_CONTEXT, NOT_CONNECTED. Captures console output, duration, and DOM-change indication (length before/after). The code may use `return value;`. Input: code, timeoutMs (default 5000, max 30000), world (ISOLATED default). Output: JSExecutionResult. Side effect: arbitrary code execution in the page context.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `code` | `string` | بله | JavaScript source (async/await supported; use `return`) |
| `timeoutMs` | `number` | خیر | Timeout (default 5000ms) |
| `world` | `string` | خیر | Execution world (ISOLATED default) |

---

### 81. ابزار `execute_js_and_capture_changes`

**توضیحات و عملکرد**: Composite: execute JavaScript AND capture the DOM state before/after with a structural diff summary + page-state snapshots. Same input as execute_javascript. Output: JSExecutionResult + before/after PageStateSnapshot + comparison.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `code` | `string` | بله | JavaScript source |
| `timeoutMs` | `number` | خیر | - |
| `world` | `string` | خیر | - |

---

### 86. ابزار `get_mutation_history`

**توضیحات و عملکرد**: Inspect the DOM mutation history: entries (operation, target, summary, undo/redo flags), undo depth, redo depth, open transaction id. Input: limit (default 100). Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `limit` | `number` | خیر | Max entries (default 100) |

---

### 87. ابزار `preview_dom_mutation`

**توضیحات و عملکرد**: Dry-run a mutation: validates the target, describes the expected change, counts affected nodes and warns about destructive operations — WITHOUT modifying anything. Input: identical to mutate_dom. Output: MutationPreview. Side effect: none (guaranteed).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `operation` | `string` | بله | Mutation operation |
| `target` | `object` | بله | Element target specifier |
| `attribute` | `string` | خیر | - |
| `value` | `string` | خیر | - |
| `classes` | `array` | خیر | - |
| `text` | `string` | خیر | - |
| `replacement` | `string` | خیر | - |
| `html` | `string` | خیر | - |
| `newElementHtml` | `string` | خیر | - |
| `parent` | `object` | خیر | - |
| `position` | `string` | خیر | - |

---

### 90. ابزار `record_commands_start`

**توضیحات و عملکرد**: Start recording subsequent tool invocations into a named command recording. Input: name, description, tags. Output: active recording metadata. Side effect: recording mode ON (adds latency-free capture to every tool call).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | بله | Recording name |
| `description` | `string` | خیر | - |
| `tags` | `array` | خیر | - |

---

### 91. ابزار `record_commands_stop`

**توضیحات و عملکرد**: Stop the active command recording and persist it to storage (.mcpdom_recordings). Input: none (uses active recording). Output: the finished CommandRecording.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 100. ابزار `get_operation_trace`

**توضیحات و عملکرد**: Trace a single operation by its operationId: tool, start/end, duration, status, correlated timeline events, related error. Input: operationId (or latest). Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `operationId` | `string` | خیر | Operation id to trace (omit for recent list) |
| `limit` | `number` | خیر | Recent operations limit when no id (default 20) |

---

### 101. ابزار `capture_page_state`

**توضیحات و عملکرد**: Capture a page state snapshot (comparison anchor): url, title, viewport, dom length + hash, interactive count, extension state, pending mutations, annotation count. Input: none. Output: PageStateSnapshot (also recorded in the session).

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 102. ابزار `compare_page_states`

**توضیحات و عملکرد**: Compare two page state snapshots ("what changed after this command?"): field-level diffs, DOM size delta, summary. Input: snapshotIdA + snapshotIdB (omit both to compare the two most recent snapshots). Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotIdA` | `string` | خیر | First snapshot id (default: second-most-recent) |
| `snapshotIdB` | `string` | خیر | Second snapshot id (default: most-recent) |

---

### 103. ابزار `list_page_states`

**توضیحات و عملکرد**: List captured page state snapshots (ids, timestamps, urls, dom sizes). Input: none. Side effect: none.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 108. ابزار `annotate_element`

**توضیحات و عملکرد**: Annotate a live element and capture it into a project (alias of capture_page_region with annotation semantics front and center): OBSERVED element data, USER comment/name/tags, INTENDED CHANGE and VERIFICATION CONDITIONS are stored as strictly separate fields. Input: identical to capture_page_region.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |
| `target` | `object` | خیر | - |
| `selector` | `string` | خیر | - |
| `name` | `string` | خیر | - |
| `description` | `string` | خیر | - |
| `comment` | `string` | خیر | - |
| `tags` | `array` | خیر | - |
| `behavioralNotes` | `string` | خیر | - |
| `visualNotes` | `string` | خیر | - |
| `intendedChange` | `string` | خیر | - |
| `verification` | `array` | خیر | - |
| `screenshot` | `boolean` | خیر | - |

---

### 118. ابزار `get_redaction_rules`

**توضیحات و عملکرد**: Inspect the capture redaction configuration: all rules (key patterns, value patterns, attribute patterns) with enabled flags, and capture exclusions. Input: none. Side effect: none.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 119. ابزار `set_redaction_rules`

**توضیحات و عملکرد**: Configure capture redaction: enable/disable existing rules, add custom key/value/attribute patterns, or add capture exclusions (selectors never captured). Built-in rules can be disabled but never removed. Input: enable/disable ruleIds, addRule {kind, pattern, description}, addExclusion {selector, reason}. Side effect: changes capture behavior for all subsequent captures.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `enable` | `array` | خیر | Rule ids to enable |
| `disable` | `array` | خیر | Rule ids to disable |
| `addRule` | `object` | خیر | Add a custom redaction rule |
| `addExclusion` | `object` | خیر | Add a capture exclusion selector |

---

### 120. ابزار `get_tool_catalog`

**توضیحات و عملکرد**: Return the full MCP tool catalog with per-tool metadata: purpose, required context, accepted input, output, side effects, failure conditions, recovery strategy, and tool group. The meta-tool an agent calls FIRST to decide which tools to use. Input: optional group filter. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `group` | `string` | خیر | Optional group filter (see get_tool_groups) |

---

### 121. ابزار `get_tool_groups`

**توضیحات و عملکرد**: List discoverable tool groups (inspection, targeting, interaction, viewport, javascript, mutation, sequences, session, projects, security, discovery) with descriptions and member tool names. Input: none. Side effect: none.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 245. ابزار `td_page_intent`

**توضیحات و عملکرد**: Infer major page workflows and interaction zones. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session id |

---

### 246. ابزار `td_state_summary`

**توضیحات و عملکرد**: Return a token-minimal state digest suitable for agents (L0/L1). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `intent` | `string` | بله | The next decision the agent must make |
| `level` | `string` | خیر | L0|L1|L2|L3|L4 |

---

### 247. ابزار `td_resolve_target`

**توضیحات و عملکرد**: Resolve a natural-language or semantic target to a VERIFIED entity with confidence. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `description` | `string` | خیر | Natural-language target description |
| `role` | `string` | خیر | Semantic role |
| `text` | `string` | خیر | Text content |
| `selector` | `string` | خیر | Seed selector |

---

### 248. ابزار `td_rank_targets`

**توضیحات و عملکرد**: Rank target candidates by historical, semantic and visual stability. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `candidates` | `array` | بله | Candidate descriptors |
| `query` | `object` | بله | Target query |

---

### 253. ابزار `td_interaction_plan`

**توضیحات و عملکرد**: Generate a verified interaction plan from intent (target + steps + postconditions). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `intent` | `string` | بله | What the interaction should achieve |

---

### 254. ابزار `td_interaction_execute`

**توضیحات و عملکرد**: Execute an interaction plan with postconditions (transactional). [security: side-effects; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `planId` | `string` | بله | Plan to execute |

---

### 255. ابزار `td_interaction_observe`

**توضیحات و عملکرد**: Observe effects of one interaction across state dimensions. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `interactionRef` | `string` | بله | Executed interaction reference |

---

### 256. ابزار `td_interaction_repair`

**توضیحات و عملکرد**: Repair a failed interaction without restarting the whole task. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `failedPlanId` | `string` | بله | Failed plan |
| `reason` | `string` | بله | Failure reason |

---

### 263. ابزار `td_compare_branches`

**توضیحات و عملکرد**: Compare reality against one or more counterfactual branches. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `branchIds` | `array` | بله | Branches to compare |
| `sessionId` | `string` | بله | Session id |

---

### 265. ابزار `td_safe_apply`

**توضیحات و عملکرد**: Apply a verified low-risk mutation transaction (PLAN→…→VERIFY→COMMIT/ROLLBACK). [security: side-effects; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `plan` | `object` | بله | Mutation plan |
| `scope` | `object` | بله | Allowed selectors/origins |

---

### 268. ابزار `td_recover_browser`

**توضیحات و عملکرد**: Recover from browser/renderer disconnect where possible (bounded retries). [security: side-effects; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `failureKind` | `string` | بله | Failure kind |

---

### 269. ابزار `td_recover_page`

**توضیحات و عملکرد**: Re-resolve a dead or replaced page identity. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | بله | Page identity |

---

### 270. ابزار `td_recover_bridge`

**توضیحات و عملکرد**: Recover or reconnect the bridge without losing state. [security: read-only; cost: low; modes: live/recorded/simulation]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 272. ابزار `td_reconcile_events`

**توضیحات و عملکرد**: Detect and repair event-order inconsistencies (mesh admission report). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session to reconcile |

---

### 273. ابزار `td_resource_guard`

**توضیحات و عملکرد**: Enforce memory/CPU/concurrency budgets (guardian decision + mode). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `usage` | `object` | خیر | Reported usage |

---

### 274. ابزار `td_leak_watch`

**توضیحات و عملکرد**: Continuously detect memory/resource growth patterns. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `windowMs` | `number` | خیر | Observation window |

---

### 275. ابزار `td_failure_containment`

**توضیحات و عملکرد**: Isolate a broken capability without killing the whole session. [security: side-effects; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `capabilityId` | `string` | بله | Capability to isolate |

---

### 280. ابزار `td_dom_xss_audit`

**توضیحات و عملکرد**: Trace browser-side sources, transformations and dangerous sinks (passive). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 281. ابزار `td_injection_surface_audit`

**توضیحات و عملکرد**: Identify injection-sensitive DOM/runtime surfaces WITHOUT executing payloads. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 283. ابزار `td_cookie_storage_audit`

**توضیحات و عملکرد**: Audit cookie, storage and client-secret handling. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 284. ابزار `td_csp_security_audit`

**توضیحات و عملکرد**: Analyze CSP posture and runtime violations. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 285. ابزار `td_cors_security_audit`

**توضیحات و عملکرد**: Analyze observed CORS behavior against scoped trust expectations. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 287. ابزار `td_performance_profile`

**توضیحات و عملکرد**: Build an end-to-end performance profile (events → spans → vitals). [security: read-only; cost: medium; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 288. ابزار `td_performance_budget`

**توضیحات و عملکرد**: Evaluate the page against declared performance budgets. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `budgets` | `object` | خیر | Budget thresholds |
| `sessionId` | `string` | خیر | Session scope |

---

### 289. ابزار `td_long_task_trace`

**توضیحات و عملکرد**: Trace long tasks to affected DOM/components. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session scope |
| `thresholdMs` | `number` | خیر | Long-task threshold (default 50) |

---

### 293. ابزار `td_retention_graph`

**توضیحات و عملکرد**: Build a retaining/reference graph for selected runtime objects where supported. [security: read-only; cost: low; modes: live/recorded/simulation; EXPERIMENTAL]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |
| `objectId` | `string` | خیر | Object to trace |

---

### 298. ابزار `td_reproduce_incident`

**توضیحات و عملکرد**: Reproduce a captured incident with controlled state. [security: side-effects; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `incidentId` | `string` | بله | Incident to reproduce |

---

### 299. ابزار `td_diagnose`

**توضیحات و عملکرد**: Generate ranked diagnostic hypotheses with evidence (no guesswork). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `symptom` | `string` | بله | Symptom description |
| `sessionId` | `string` | بله | Session scope |

---

### 300. ابزار `td_plan_fix`

**توضیحات و عملکرد**: Build a fix plan linked to observed causes and affected entities. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `incidentId` | `string` | بله | Incident to fix |

---

### 301. ابزار `td_validate_fix`

**توضیحات و عملکرد**: Verify a proposed fix against the original failure (original FAIL → patched PASS). [security: side-effects; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `incidentId` | `string` | بله | Incident being fixed |
| `fixRef` | `string` | بله | Fix reference |

---

### 302. ابزار `td_run_workflow`

**توضیحات و عملکرد**: Execute a declarative multi-step workflow with recovery. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `workflow` | `array` | بله | Workflow steps |

---

### 303. ابزار `td_run_playbook`

**توضیحات و عملکرد**: Run a reusable investigation/security/performance playbook. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `playbookId` | `string` | بله | Playbook to run |

---

### 304. ابزار `td_memory`

**توضیحات و عملکرد**: Store and retrieve durable project/session investigation knowledge (provenance + confidence). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `action` | `string` | بله | store | query | validate |
| `kind` | `string` | خیر | Memory kind |
| `statement` | `string` | خیر | Memory statement |
| `query` | `object` | خیر | Query filter |

---

### 307. ابزار `td_browser_navigate`

**توضیحات و عملکرد**: Navigate the browser to a URL (optionally in a new tab, then wait for DOM stability). [security: side-effects; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `url` | `string` | بله | Target URL |
| `newTab` | `boolean` | خیر | Open in a new tab instead of the current one |
| `waitForStable` | `boolean` | خیر | Wait for DOM stability after navigation (default true) |

---

### 308. ابزار `td_browser_back`

**توضیحات و عملکرد**: Go back one step in browser history. [security: side-effects; cost: low; modes: live/simulation]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 309. ابزار `td_browser_forward`

**توضیحات و عملکرد**: Go forward one step in browser history. [security: side-effects; cost: low; modes: live/simulation]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 310. ابزار `td_browser_refresh`

**توضیحات و عملکرد**: Reload the current tab. [security: side-effects; cost: low; modes: live/simulation]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 312. ابزار `td_dom_query`

**توضیحات و عملکرد**: Search the DOM by text/tag/attribute patterns with scored results — find elements without knowing selectors. [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `query` | `string` | بله | Search text (matched against text, tags, attributes) |
| `tag` | `string` | خیر | Restrict to tag name |
| `attr` | `string` | خیر | Require attribute name |
| `attrValue` | `string` | خیر | Attribute value filter |
| `limit` | `number` | خیر | Max results (default 50) |

---

### 313. ابزار `td_dom_extract`

**توضیحات و عملکرد**: Extract structured data from any selector with per-field expressions (works on ANY site — no API needed). [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | CSS selector for the collection |
| `fields` | `object` | خیر | Output name → JS expression per element (default: text/tag/attrs) |
| `limit` | `number` | خیر | Max elements (default 100) |

---

### 318. ابزار `td_action_click`

**توضیحات و عملکرد**: Click an element with before/after state and effect measurement. [security: side-effects; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | CSS selector of the element |

---

### 319. ابزار `td_action_type`

**توضیحات و عملکرد**: Type text into an input element. [security: side-effects; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | CSS selector of the input |
| `text` | `string` | بله | Text to type |

---

### 320. ابزار `td_action_select`

**توضیحات و عملکرد**: Select an option in a select element. [security: side-effects; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | CSS selector of the select |
| `value` | `string` | بله | Value or label to select |

---

### 321. ابزار `td_action_hover`

**توضیحات و عملکرد**: Hover over an element (menus, tooltips). [security: side-effects; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | CSS selector of the element |

---

### 322. ابزار `td_action_press`

**توضیحات و عملکرد**: Press a keyboard key / combo page-wide (Enter, Escape, ctrl+s…). [security: side-effects; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `key` | `string` | بله | Key or combo |

---

### 323. ابزار `td_action_scroll`

**توضیحات و عملکرد**: Scroll the page by deltas or scroll an element into view. [security: side-effects; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `x` | `number` | خیر | Horizontal pixel delta |
| `y` | `number` | خیر | Vertical pixel delta |
| `selector` | `string` | خیر | Scroll this element into view instead |

---

### 324. ابزار `td_wait`

**توضیحات و عملکرد**: Wait for a meaningful condition (dom_stable, selector_present/visible/absent, text_present, url_contains, element_count, readiness_state). [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `kind` | `string` | بله | Condition kind |
| `selector` | `string` | خیر | Selector for selector_* / element_count |
| `text` | `string` | خیر | Text for text_present / url_contains |
| `count` | `number` | خیر | Expected count |
| `timeoutMs` | `number` | خیر | Timeout (default 5000ms) |

---

### 325. ابزار `td_screenshot`

**توضیحات و عملکرد**: Capture a screenshot of the current page as visual evidence. [security: read-only; cost: low; modes: live]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 326. ابزار `td_execute_script`

**توضیحات و عملکرد**: Escape hatch: execute JavaScript in the page (Shadow DOM, canvas UI, virtualized lists — the agent decides the method). [security: dangerous; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `code` | `string` | بله | JavaScript source (async/await supported; use return) |
| `timeoutMs` | `number` | خیر | Timeout (default 5000ms) |

---

### 328. ابزار `td_console_read`

**توضیحات و عملکرد**: Escape hatch: read captured console logs (optionally filtered by level). [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `level` | `string` | خیر | Level filter: all | error | warning | log | info |

---


## بازرسی زنده DOM و ناظر تغییرات (Live Inspection & Observer) (18 ابزار)

### 11. ابزار `get_dom_subtree`

**توضیحات و عملکرد**: Reconstruct and extract the HTML of a specific subtree (e.g. #app or .gpt-panel) at a given timestamp.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |
| `timestamp` | `number` | خیر | Timestamp in milliseconds |
| `selector` | `string` | خیر | CSS selector for the root of the subtree |
| `nodeId` | `number` | خیر | LogicalNodeId for the root of the subtree |

---

### 35. ابزار `inspect_live_page`

**توضیحات و عملکرد**: Inspect the current live browser page state, including URL, title, viewport dimensions, scroll positions, readyState, active and focused elements.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 36. ابزار `inspect_live_element`

**توضیحات و عملکرد**: Deeply inspect a live DOM element on the active browser page by CSS selector, LogicalNodeId, or selectedElementRef, returning bounds, computed styles, visibility, attributes, state, role, aria, and parent context.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | خیر | CSS selector of the target element |
| `nodeId` | `number` | خیر | LogicalNodeId of the element if recorded |
| `selectedElementRef` | `string` | خیر | Reference token of the last selected element |
| `xpath` | `string` | خیر | XPath expression for the element |

---

### 38. ابزار `start_element_picker`

**توضیحات و عملکرد**: Activate the interactive visual element picker mode in the live browser with hover highlighting and click selection.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `highlightColor` | `string` | خیر | Hex color for hover highlighter (default: #0ea5e9) |

---

### 39. ابزار `stop_element_picker`

**توضیحات و عملکرد**: Deactivate the visual element picker mode in the browser and restore normal cursor and interaction state.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 43. ابزار `start_element_observation`

**توضیحات و عملکرد**: Start focused continuous recording and observation around a target element and its subtree/ancestors.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | خیر | CSS selector of the target element |
| `nodeId` | `number` | خیر | LogicalNodeId of the target element |

---

### 44. ابزار `stop_element_observation`

**توضیحات و عملکرد**: Stop focused element observation and assemble a complete correlation bundle with mutations, diagnostics, network activity, and root-cause analysis.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |

---

### 45. ابزار `get_live_dom_snapshot`

**توضیحات و عملکرد**: Capture the current live virtual DOM state snapshot of the active or specified browser tab in HTML or structured JSON format.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `format` | `string` | خیر | Output format (default: html) |

---

### 46. ابزار `get_live_dom_subtree`

**توضیحات و عملکرد**: Reconstruct and extract the live HTML or node structure of a specific subtree on the active or specified browser tab.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional target Chrome tab ID (defaults to currently active tab) |
| `selector` | `string` | خیر | CSS selector of the subtree root |
| `nodeId` | `number` | خیر | LogicalNodeId of the subtree root |

---

### 49. ابزار `recover_selector`

**توضیحات و عملکرد**: Recover a failed element selector via fingerprint matching: inspects the previous target snapshot, searches candidate matches, scores them, and attempts SAFE recovery (refuses below 0.62 confidence or ambiguous matches). Input: selector + snapshot (tag, text, classes, stableAttributes, fingerprintHash, parentSelector). Output: RecoveryOutcome with alternatives and diagnostics. Side effect: none (read-only diagnosis).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | The failing CSS selector |
| `snapshot` | `object` | خیر | Previous target snapshot evidence (from generate_element_target or a region annotation) |

---

### 50. ابزار `diagnose_selector_failure`

**توضیحات و عملکرد**: Diagnose WHY a selector fails: syntax validity, match count, relaxation attempts that work, and human-readable diagnosis. Complements recover_selector (which attempts to fix). Input: selector. Output: validity, matches, closest working selectors, diagnosis steps.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | The selector to diagnose |

---

### 55. ابزار `get_computed_style`

**توضیحات و عملکرد**: Extract computed CSS style properties for an element. Input: target/selector + optional properties list (defaults to a layout-relevant set). Output: property→value map. Fails with STYLE_UNAVAILABLE when getComputedStyle is not exposed (rare).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |
| `properties` | `array` | خیر | CSS property names to extract |

---

### 75. ابزار `resize_viewport`

**توضیحات و عملکرد**: Resize the viewport (width/height in pixels or a named preset). ALWAYS reversible: the original size is recorded on first use. Captures before/after page digests. Input: width+height, or preset (desktop-hd, tablet-ipad, mobile-iphone-12, …). Output: ViewportResizeResult with previous/original dimensions.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `width` | `number` | خیر | Target width (200–7680) |
| `height` | `number` | خیر | Target height (200–4320) |
| `preset` | `string` | خیر | Named preset (overrides width/height) |

---

### 76. ابزار `reset_viewport`

**توضیحات و عملکرد**: Restore the original viewport size recorded before the first resize (guaranteed RESET_VIEWPORT semantics). Also clears the active preset/device. Input: none. Output: ViewportResizeResult with restored dimensions.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 77. ابزار `get_viewport_state`

**توضیحات و عملکرد**: Inspect the viewport: current width/height/dpr/scroll plus the recorded original and whether it is currently modified. Input: none.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 311. ابزار `td_dom_inspect`

**توضیحات و عملکرد**: Observe the current page (structure, ready state, url, interactive inventory) — the agent’s eyes. [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | Optional tab id |

---

### 314. ابزار `td_dom_snapshot`

**توضیحات و عملکرد**: Capture the current DOM snapshot (html or structured json). [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `format` | `string` | خیر | html | json |

---

### 327. ابزار `td_network_inspect`

**توضیحات و عملکرد**: Escape hatch: read captured network requests (optionally filtered by URL substring). [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `urlContains` | `string` | خیر | URL substring filter |
| `limit` | `number` | خیر | Max entries (default 50) |

---


## پروژه‌های بازسازی و ضبط جریان تعامل (Project Capture & Replay) (12 ابزار)

### 20. ابزار `get_annotations`

**توضیحات و عملکرد**: Retrieve all human and AI annotations created for a session.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session ID |

---

### 104. ابزار `create_page_project`

**توضیحات و عملکرد**: Create a portable page-analysis project folder (project.json, page.json, regions/, screenshots/, dom/, commands/, diffs/, metadata/, instructions/). The DOM snapshot is captured CLEANED: MCPDOM-injected artifacts excluded, secrets redacted. Input: name, description, url/title/viewport metadata (defaults from the live page). Output: ProjectManifest. Side effect: creates files under .mcpdom_projects/<name>/.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | بله | Project name (folder name) |
| `description` | `string` | خیر | - |
| `url` | `string` | خیر | Page URL (default: live page URL) |
| `title` | `string` | خیر | Page title (default: live page title) |

---

### 105. ابزار `list_projects`

**توضیحات و عملکرد**: List page-analysis projects with manifests (names, page counts, region counts, timestamps). Input: none. Side effect: none.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 106. ابزار `get_project`

**توضیحات و عملکرد**: Load a project in full: manifest, page manifest, and all region annotations. Input: projectName. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |

---

### 107. ابزار `capture_page_region`

**توضیحات و عملکرد**: Capture a page region into a project: resolves the element, captures LOCAL DOM + RELEVANT CONTEXT DOM (meaningful boundary), ranked selector candidates, fingerprint, styles, dimensions, auto-generated name and (optionally) a screenshot. Input: projectName, target/selector, user annotation fields (name, description, comment, tags), intendedChange, verification, screenshot. Output: RegionAnnotation (OBSERVED/USER/INTENDED/VERIFICATION separated). Side effect: writes region files.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | Target project name |
| `target` | `object` | خیر | Element target specifier |
| `selector` | `string` | خیر | Shorthand: CSS selector |
| `name` | `string` | خیر | User override name (auto name preserved) |
| `description` | `string` | خیر | User description |
| `comment` | `string` | خیر | User comment, e.g. "make this collapsible" |
| `tags` | `array` | خیر | - |
| `behavioralNotes` | `string` | خیر | - |
| `visualNotes` | `string` | خیر | - |
| `intendedChange` | `string` | خیر | What the user wants changed |
| `verification` | `array` | خیر | Success conditions |
| `screenshot` | `boolean` | خیر | Capture a region screenshot (default false) |

---

### 109. ابزار `list_region_annotations`

**توضیحات و عملکرد**: List region annotations in a project (names, selectors, quality grades, intended changes). Input: projectName. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |

---

### 110. ابزار `get_region_annotation`

**توضیحات و عملکرد**: Load one region annotation in full (observed facts, user fields, intended change, verification, quality score). Input: projectName, regionId. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |
| `regionId` | `string` | بله | - |

---

### 111. ابزار `update_region_annotation`

**توضیحات و عملکرد**: Update the USER fields of a region annotation (name, description, comment, tags, notes, intendedChange, verification). Observed facts are never editable. Quality is recomputed. Input: projectName, regionId, updates. Side effect: rewrites the region file.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |
| `regionId` | `string` | بله | - |
| `name` | `string` | خیر | - |
| `description` | `string` | خیر | - |
| `comment` | `string` | خیر | - |
| `tags` | `array` | خیر | - |
| `behavioralNotes` | `string` | خیر | - |
| `visualNotes` | `string` | خیر | - |
| `intendedChange` | `string` | خیر | - |
| `verification` | `array` | خیر | - |

---

### 112. ابزار `delete_region_annotation`

**توضیحات و عملکرد**: Delete a region annotation from a project. Input: projectName, regionId. Side effect: removes the region file and updates manifests.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |
| `regionId` | `string` | بله | - |

---

### 113. ابزار `get_region_relationship_graph`

**توضیحات و عملکرد**: Build the region relationship graph for a project: nodes (page + regions) and edges (contains, sibling-of, ancestor-of, overlaps) derived from live DOM containment. Input: projectName. Side effect: none.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |

---

### 114. ابزار `generate_reconstruction_spec`

**توضیحات و عملکرد**: Generate (and persist) the canonical page reconstruction specification for a project: metadata, viewport, structure, regions with selector candidates, hierarchy, semantic roles, visual constraints, interactions, selectors with fallbacks, content, styles, annotations, expected modifications and verification rules — with a versioned schema. Input: projectName. Side effect: writes metadata/reconstruction-spec.json.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |

---

### 116. ابزار `delete_project`

**توضیحات و عملکرد**: Delete a project folder permanently. Input: projectName. Side effect: irreversible file removal.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `projectName` | `string` | بله | - |

---


## جهش‌های ایمن، تراکنش‌ها و Undo/Redo (DOM Mutation Engine) (6 ابزار)

### 82. ابزار `mutate_dom`

**توضیحات و عملکرد**: Apply a first-class DOM mutation with full observability (BEFORE → ACTION → AFTER → DIFF) and a guaranteed undo record. Operations: set_attribute, remove_attribute, set_text, replace_text, set_inner_html, set_outer_html, add_class, remove_class, replace_class, set_style, remove_style, add_element, remove_element, replace_element, move_element, wrap_element, unwrap_element, clone_subtree. Input: operation, target, plus operation-specific params. Output: DOMMutationResult. Side effect: modifies live DOM (undoable).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `operation` | `string` | بله | Mutation operation |
| `target` | `object` | بله | Element target specifier |
| `attribute` | `string` | خیر | Attribute name (set/remove_attribute) |
| `value` | `string` | خیر | Attribute value or replacement class (replace_class) |
| `text` | `string` | خیر | Text content (set_text) or search pattern (replace_text) |
| `replacement` | `string` | خیر | Replacement text (replace_text) |
| `classes` | `array` | خیر | Class names (add/remove/replace_class) or style props (remove_style) |
| `style` | `object` | خیر | Style property map (set_style) |
| `html` | `string` | خیر | HTML content (set_inner_html) |
| `newElementHtml` | `string` | خیر | HTML for new/replacement/wrapper element |
| `parent` | `object` | خیر | Parent target (move_element, add_element) |
| `position` | `string` | خیر | Insertion position (add_element/move_element) |
| `copyAttributes` | `boolean` | خیر | clone_subtree: copy attributes (ids never duplicated) |

---

### 83. ابزار `mutate_dom_transaction`

**توضیحات و عملکرد**: Transactional DOM mutation: mode=begin opens a transaction, subsequent mutate_dom calls join it, mode=commit verifies and commits (all-or-nothing), mode=rollback reverts every step in reverse order. Input: mode, optional reason (rollback). Output: transaction status with per-step results. Side effect: none for begin; commits/rolls back DOM changes.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `mode` | `string` | بله | Transaction phase |
| `reason` | `string` | خیر | Rollback reason (recorded) |

---

### 84. ابزار `undo_dom_mutation`

**توضیحات و عملکرد**: Undo the last DOM mutation (or the last mutation of the open transaction) using its immutable inverse record. Input: none. Output: success + undone mutation id. Idempotent-safe: reports "nothing to undo" when the stack is empty.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 85. ابزار `redo_dom_mutation`

**توضیحات و عملکرد**: Redo the last undone DOM mutation (forward patch re-applied only when safe). Input: none. Output: success + redone mutation id.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 88. ابزار `clone_dom_subtree`

**توضیحات و عملکرد**: Clone a DOM subtree (deep clone appended to a parent or the original parent; ids are never duplicated). Input: target, optional parent, copyAttributes. Output: DOMMutationResult (undoable). Side effect: adds cloned nodes.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `target` | `object` | بله | Element to clone |
| `parent` | `object` | خیر | Optional append target (defaults to original parent) |
| `copyAttributes` | `boolean` | خیر | Copy attributes except id (default true) |

---

### 89. ابزار `execute_command_sequence`

**توضیحات و عملکرد**: Execute a command sequence with per-command records (id, timestamp, target, args, status, result, duration, error): sequential execution, conditional continuation (condition.previousStepSucceeded), explicit stop-on-error (default) or per-step continueOnError. Input: steps array + stopOnError. Output: CommandSequenceResult. Side effects: those of the executed tools.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `steps` | `array` | بله | Ordered command steps |
| `stopOnError` | `boolean` | خیر | Default stop-on-error policy (default true) |

---


## ابزارهای ورودی و تعامل DevTools (Input Automation) (10 ابزار)

### 122. ابزار `dt_click`

**توضیحات و عملکرد**: Clicks an element (chrome-devtools-mcp click). Input: uid/selector (+pageId/tabId). Options: dblClick, includeSnapshot. Dispatches a real synthetic click through the unified runtime; verifies the element becomes interactive, else fails with actionable error.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `uid` | `string` | خیر | Element uid from dt_take_snapshot |
| `selector` | `string` | خیر | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | خیر | Unified page id (defaults to active page) |
| `tabId` | `number` | خیر | Extension tab id (alias for the page) |
| `dblClick` | `boolean` | خیر | Double click (default false) |
| `includeSnapshot` | `boolean` | خیر | Include an updated page snapshot in the response |

---

### 123. ابزار `dt_click_at`

**توضیحات و عملکرد**: Click at viewport coordinates with vision-assisted element resolution: reports which element the point hits before clicking. Input: x, y (+page). Use when only a screenshot position is known.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `x` | `number` | بله | X coordinate in CSS pixels |
| `y` | `number` | بله | Y coordinate in CSS pixels |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |
| `includeSnapshot` | `boolean` | خیر | - |

---

### 124. ابزار `dt_drag`

**توضیحات و عملکرد**: Drag an element onto another element (or coordinates). Input: from(uid/selector), to(uid/selector or x/y). Uses real pointer event sequences when live.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `fromUid` | `string` | خیر | Uid of the element to drag |
| `fromSelector` | `string` | خیر | CSS selector of the element to drag |
| `toUid` | `string` | خیر | Uid of the drop target |
| `toSelector` | `string` | خیر | CSS selector of the drop target |
| `toX` | `number` | خیر | - |
| `toY` | `number` | خیر | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 125. ابزار `dt_fill`

**توضیحات و عملکرد**: Set the value of a form field (clear + type) with optional submit key. Input: uid/selector, value, submitKey.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `uid` | `string` | خیر | Element uid from dt_take_snapshot |
| `selector` | `string` | خیر | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | خیر | Unified page id (defaults to active page) |
| `tabId` | `number` | خیر | Extension tab id (alias for the page) |
| `value` | `string` | بله | Value to set |
| `submitKey` | `string` | خیر | Key pressed after typing, e.g. "Enter" |
| `includeSnapshot` | `boolean` | خیر | - |

---

### 126. ابزار `dt_fill_form`

**توضیحات و عملکرد**: Fill MULTIPLE form fields in one batched call (§39: prefer this over repeated dt_fill). Input: fields[] each {uid/selector, value, submitKey}.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `fields` | `array` | بله | Fields to fill |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 127. ابزار `dt_handle_dialog`

**توضیحات و عملکرد**: Accept or dismiss an open JavaScript dialog (alert/confirm/prompt). Input: accept (boolean), promptText.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `accept` | `boolean` | بله | true to accept, false to dismiss |
| `promptText` | `string` | خیر | Text to enter in a prompt dialog |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 128. ابزار `dt_hover`

**توضیحات و عملکرد**: Hover over an element. Input: uid/selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `uid` | `string` | خیر | Element uid from dt_take_snapshot |
| `selector` | `string` | خیر | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | خیر | Unified page id (defaults to active page) |
| `tabId` | `number` | خیر | Extension tab id (alias for the page) |

---

### 129. ابزار `dt_press_key`

**توضیحات و عملکرد**: Press a key or key combination, e.g. "a", "Enter", "Control+Or,Control+a". Input: key.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `key` | `string` | بله | Key or combo string |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 130. ابزار `dt_type_text`

**توضیحات و عملکرد**: Type text into a field (keystroke by keystroke), optional submit key. Input: uid/selector, text, submitKey.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `uid` | `string` | خیر | Element uid from dt_take_snapshot |
| `selector` | `string` | خیر | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | خیر | Unified page id (defaults to active page) |
| `tabId` | `number` | خیر | Extension tab id (alias for the page) |
| `text` | `string` | بله | Text to type |
| `submitKey` | `string` | خیر | - |

---

### 131. ابزار `dt_upload_file`

**توضیحات و عملکرد**: Set the files of a file input programmatically. Input: uid/selector, files[] (paths or names).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `uid` | `string` | خیر | Element uid from dt_take_snapshot |
| `selector` | `string` | خیر | CSS selector of the element (fallback when no uid) |
| `pageId` | `string` | خیر | Unified page id (defaults to active page) |
| `tabId` | `number` | خیر | Extension tab id (alias for the page) |
| `files` | `array` | بله | File paths/names to attach |

---


## مدیریت صفحات، تب‌ها و ناوبری DevTools (Page & Navigation) (9 ابزار)

### 132. ابزار `dt_list_pages`

**توضیحات و عملکرد**: List all pages/tabs known to the unified runtime with the canonical page identity mapping (pageId ↔ tabId ↔ url ↔ frames). Read-only.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 133. ابزار `dt_select_page`

**توضیحات و عملکرد**: Bring a page to focus. Input: pageId / tabId / index (0-based).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |
| `index` | `number` | خیر | 0-based index into the page list |

---

### 134. ابزار `dt_new_page`

**توضیحات و عملکرد**: Open a new page/tab. Input: url. Returns the new canonical page identity.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `url` | `string` | بله | Initial URL (http/https/file) |

---

### 135. ابزار `dt_close_page`

**توضیحات و عملکرد**: Close a page. Input: pageId/tabId. Fails with PAGE_NOT_FOUND when the page is unknown.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 136. ابزار `dt_navigate_page`

**توضیحات و عملکرد**: Navigate a page to a URL. Records a NavigationRecord on the page identity (identity survives navigation). Input: url (+page).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `url` | `string` | بله | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 137. ابزار `dt_history_navigation`

**توضیحات و عملکرد**: Navigate browser history: back / forward / reload. Input: direction (+page).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `direction` | `string` | بله | History direction |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 138. ابزار `dt_wait_for`

**توضیحات و عملکرد**: Wait until a condition: "load", "domcontentloaded", "networkidle" (0 inflight ≥500ms) or a selector becoming visible. Input: condition, selector?, timeoutMs (default 8000).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `condition` | `string` | بله | What to wait for |
| `selector` | `string` | خیر | CSS selector to wait for (selector-visible) |
| `timeoutMs` | `number` | خیر | Timeout in ms (default 8000) |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 139. ابزار `dt_emulate`

**توضیحات و عملکرد**: Emulate device/page characteristics in one call: viewport, deviceScaleFactor, userAgent, cpuThrottlingRate (×), network conditions (downloadKbps/uploadKbps/latencyMs), geolocation, colorScheme, extra headers, locale, timezone. All reversible via dt_emulate reset:true. Integrates with MCPDOM viewport controller for live extension tabs.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `reset` | `boolean` | خیر | Reset all emulation to defaults |
| `viewport` | `object` | خیر | - |
| `deviceScaleFactor` | `number` | خیر | - |
| `userAgent` | `string` | خیر | - |
| `cpuThrottlingRate` | `number` | خیر | CPU throttle multiplier (1–20), e.g. 4 = 4× slower |
| `networkConditions` | `object` | خیر | - |
| `geolocation` | `object` | خیر | - |
| `colorScheme` | `string` | خیر | - |
| `extraHeaders` | `object` | خیر | Extra HTTP headers (name → value) |
| `locale` | `string` | خیر | - |
| `timezoneId` | `string` | خیر | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 140. ابزار `dt_resize_page`

**توضیحات و عملکرد**: Resize the page viewport. Input: width, height (+page). Reversible (call again with the original size or dt_emulate reset).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `width` | `number` | بله | - |
| `height` | `number` | بله | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---


## ردیابی عملکرد، لایت‌هاوس و هیپ مموری (Performance & Heapsnapshot) (17 ابزار)

### 141. ابزار `dt_performance_start_trace`

**توضیحات و عملکرد**: Start a performance trace on a page (CDP Tracing/Performance domains through the extension gateway). One trace per page at a time (NAVIGATION_CONFLICT-style guard). Without a CDP session, runs a deterministic SIMULATED trace buffer clearly labeled simulated:true — never presented as real Chrome data.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `categories` | `array` | خیر | Trace categories (default devtools.timeline) |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 142. ابزار `dt_performance_stop_trace`

**توضیحات و عملکرد**: Stop the active trace and return normalized trace events, Web Vitals (LCP/INP/CLS/FCP), long tasks, layout shifts and phase breakdown. Input: traceId (optional — active trace of the page is used).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `traceId` | `string` | خیر | - |
| `pageId` | `string` | خیر | - |

---

### 143. ابزار `dt_performance_analyze_insight`

**توضیحات و عملکرد**: Analyze a stopped trace or a provided Chrome trace-events array: extracts insights (long tasks, layout shifts, LCP candidates, parse/layout/paint/network phases) with durations. Input: traceId or events[].

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `traceId` | `string` | خیر | - |
| `events` | `array` | خیر | Raw Chrome trace events to analyze (ts/dur/name/cat/ph) |
| `insight` | `string` | خیر | Focus of the analysis (default all) |

---

### 153. ابزار `dt_lighthouse_audit`

**توضیحات و عملکرد**: EXPERIMENTAL: run a Lighthouse audit via the DevTools connection. Requires live CDP session — in simulation reports mode UNAVAILABLE (Lighthouse results are never synthesized).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `categories` | `array` | خیر | Audit categories (default performance,accessibility,best-practices) |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 154. ابزار `dt_take_heapsnapshot`

**توضیحات و عملکرد**: Capture a V8 heap snapshot of a page via CDP HeapProfiler (live). In simulation, registers a deterministic fixture snapshot in the REAL .heapsnapshot format, marked simulated:true — analysis code paths are identical; the DATA is explicitly not a real V8 capture. Input: pageId/tabId, raw (optional: pre-captured snapshot JSON string).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |
| `raw` | `string` | خیر | Optional pre-captured .heapsnapshot JSON string to register instead of live capture |
| `saveToPath` | `string` | خیر | Optional path to persist the raw snapshot JSON |

---

### 155. ابزار `dt_close_heapsnapshot`

**توضیحات و عملکرد**: Release a loaded heap snapshot (§24 lifecycle). Input: snapshotId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |

---

### 156. ابزار `dt_heapsnapshot_summary`

**توضیحات و عملکرد**: Class aggregates of a heap snapshot: per-class object counts and self sizes, totals, top retainers of size. Input: snapshotId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `limit` | `number` | خیر | Max classes returned (default 50) |

---

### 157. ابزار `dt_heapsnapshot_details`

**توضیحات و عملکرد**: Snapshot details: node/edge counts, meta field layout, parse duration. Input: snapshotId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |

---

### 158. ابزار `dt_heapsnapshot_class_nodes`

**توضیحات و عملکرد**: List the node ids of a class with pagination. Input: snapshotId, className, offset, limit.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `className` | `string` | بله | - |
| `offset` | `number` | خیر | - |
| `limit` | `number` | خیر | - |

---

### 159. ابزار `dt_heapsnapshot_edges`

**توضیحات و عملکرد**: Outgoing edges (references) of a node. Input: snapshotId, nodeId (V8 object id) or nodeIndex.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `nodeId` | `number` | خیر | - |
| `nodeIndex` | `number` | خیر | - |
| `limit` | `number` | خیر | - |

---

### 160. ابزار `dt_heapsnapshot_retainers`

**توضیحات و عملکرد**: Retainers (incoming references) of a node — who keeps it alive. Input: snapshotId, nodeId/nodeIndex.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `nodeId` | `number` | خیر | - |
| `nodeIndex` | `number` | خیر | - |
| `limit` | `number` | خیر | - |

---

### 161. ابزار `dt_heapsnapshot_retaining_paths`

**توضیحات و عملکرد**: Retaining paths from GC roots to a node (shortest path reconstruction). Input: snapshotId, nodeId/nodeIndex, maxPaths.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `nodeId` | `number` | خیر | - |
| `nodeIndex` | `number` | خیر | - |
| `maxPaths` | `number` | خیر | - |

---

### 162. ابزار `dt_heapsnapshot_dominators`

**توضیحات و عملکرد**: Dominator analysis: nodes ranked by retained tree size with their immediate dominator class. Input: snapshotId, limit.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `limit` | `number` | خیر | - |

---

### 163. ابزار `dt_heapsnapshot_duplicate_strings`

**توضیحات و عملکرد**: Duplicate string instances in the heap — wasted memory detection with instance counts and bytes. Input: snapshotId, limit.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `limit` | `number` | خیر | - |

---

### 164. ابزار `dt_heapsnapshot_object_details`

**توضیحات و عملکرد**: Full details of one object: type, class, self size, outgoing edges, retainers, detachedness. Input: snapshotId, nodeId (V8 id) or nodeIndex.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `nodeId` | `number` | خیر | - |
| `nodeIndex` | `number` | خیر | - |

---

### 165. ابزار `dt_query_heapsnapshot_objects`

**توضیحات و عملکرد**: Query heap objects by type, className (substring match) and minimum self size. Input: snapshotId + filters.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotId` | `string` | بله | - |
| `type` | `string` | خیر | - |
| `className` | `string` | خیر | - |
| `minSize` | `number` | خیر | - |
| `limit` | `number` | خیر | - |

---

### 166. ابزار `dt_compare_heapsnapshots`

**توضیحات و عملکرد**: Compare two heap snapshots: per-class added/removed objects and size deltas, plus totals. Input: snapshotA, snapshotB.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `snapshotA` | `string` | بله | Baseline snapshot id |
| `snapshotB` | `string` | بله | Comparison snapshot id |

---


## پایش شبکه و لاگ‌های کنسول DevTools (Network & Console) (9 ابزار)

### 144. ابزار `dt_list_network_requests`

**توضیحات و عملکرد**: List captured network requests from the unified runtime network log (shared with MCPDOM capture). Filters: urlPattern, method, status (number|"error"|"success"), resourceType; pagination offset/limit; includeBody.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `urlPattern` | `string` | خیر | - |
| `method` | `string` | خیر | - |
| `status` | `نامشخص` | خیر | Exact status code, "error", or "success" |
| `resourceType` | `string` | خیر | - |
| `offset` | `number` | خیر | - |
| `limit` | `number` | خیر | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |
| `ingestTabId` | `number` | خیر | First ingest MCPDOM-captured requests for this tab (bridge) before listing |

---

### 145. ابزار `dt_get_network_request`

**توضیحات و عملکرد**: Inspect one network request in full: headers, body (when captured), timings, cache state. Input: requestId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `requestId` | `string` | بله | Request id from dt_list_network_requests |
| `includeBody` | `boolean` | خیر | Include captured bodies (default true) |

---

### 146. ابزار `dt_evaluate_script`

**توضیحات و عملکرد**: Evaluate JavaScript in page context and return the serialized result. EXPLICIT tool — other capabilities must not wrap everything through this. Input: script (expression or statements), awaitPromise.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `script` | `string` | بله | JavaScript to evaluate |
| `awaitPromise` | `boolean` | خیر | Await returned promises (default true) |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 147. ابزار `dt_list_console_messages`

**توضیحات و عملکرد**: List console messages captured by the unified runtime (shares capture with MCPDOM console interception). Filters: level (log,info,warn,error or csv), searchQuery; pagination. In simulation, first ingests MCPDOM-captured console logs for the tab.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `level` | `string` | خیر | - |
| `searchQuery` | `string` | خیر | - |
| `offset` | `number` | خیر | - |
| `limit` | `number` | خیر | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |
| `ingestTabId` | `number` | خیر | - |

---

### 148. ابزار `dt_get_console_message`

**توضیحات و عملکرد**: Inspect one console message with full text, source and stack. Input: messageId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `messageId` | `string` | بله | - |

---

### 149. ابزار `dt_take_screenshot`

**توضیحات و عملکرد**: Capture a page screenshot (png/jpeg), viewport or element-bounded. Routes through MCPDOM capture (DPR-preserving). Input: format, uid/selector for element capture, outputPath to persist.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `format` | `string` | خیر | Image format (default png) |
| `uid` | `string` | خیر | Element uid for element-bounded capture |
| `selector` | `string` | خیر | CSS selector for element-bounded capture |
| `outputPath` | `string` | خیر | Optional file path to persist the capture |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 150. ابزار `dt_take_snapshot`

**توضیحات و عملکرد**: Take a semantic text snapshot of the page (a11y-structured, uid-addressable) used by uid-based input tools. Returns node tree with roles/names and uids. §39: prefer this compact snapshot over full DOM dumps for page understanding.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |
| `selector` | `string` | خیر | Limit the snapshot to a subtree |

---

### 151. ابزار `dt_screencast_start`

**توضیحات و عملکرد**: EXPERIMENTAL: start screencast frame streaming (CDP Page.screencast). Requires live CDP session; UNSUPPORTED in simulation (reports mode UNAVAILABLE, never fake frames).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |
| `maxDurationMs` | `number` | خیر | - |

---

### 152. ابزار `dt_screencast_stop`

**توضیحات و عملکرد**: EXPERIMENTAL: stop screencast streaming and return captured frame metadata. Requires live CDP session.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---


## مدیریت افزونه‌ها و ابزارهای شخص ثالث (Extensions & WebMCP) (9 ابزار)

### 167. ابزار `dt_install_extension`

**توضیحات و عملکرد**: Install (load) a browser extension by path/id (live extension management via chrome.management). DANGEROUS: changes browser state. Input: extensionPath or extensionId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionPath` | `string` | خیر | - |
| `extensionId` | `string` | خیر | - |

---

### 168. ابزار `dt_list_extensions`

**توضیحات و عملکرد**: List installed browser extensions with enable state. Shares capture with MCPDOM list_extensions but returns the DevTools-normalized extension model.

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 169. ابزار `dt_reload_extension`

**توضیحات و عملکرد**: Reload an extension by id (dev workflow). Input: extensionId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionId` | `string` | بله | - |

---

### 170. ابزار `dt_trigger_extension_action`

**توضیحات و عملکرد**: Trigger (activate) an extension action by id. Input: extensionId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionId` | `string` | بله | - |

---

### 171. ابزار `dt_uninstall_extension`

**توضیحات و عملکرد**: Uninstall an extension by id. DANGEROUS: destructive. Input: extensionId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `extensionId` | `string` | بله | - |

---

### 172. ابزار `dt_list_3p_developer_tools`

**توضیحات و عملکرد**: Discover third-party developer tools exposed by the page (window-registered devtools integrations). Returns registry with invocation contracts.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 173. ابزار `dt_execute_3p_developer_tool`

**توضیحات و عملکرد**: Execute a discovered third-party developer tool. EXPERIMENTAL. Input: toolId + args (validated against the discovered contract).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `toolId` | `string` | بله | - |
| `args` | `object` | خیر | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 174. ابزار `dt_list_webmcp_tools`

**توضیحات و عملکرد**: Discover WebMCP tools exposed by the page (navigator.webMCP registrations per the WebMCP draft). Returns tool schemas for remote execution.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---

### 175. ابزار `dt_execute_webmcp_tool`

**توضیحات و عملکرد**: Execute a WebMCP tool exposed by the page. Input: toolName + args (validated against the discovered schema).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `toolName` | `string` | بله | - |
| `args` | `object` | خیر | - |
| `pageId` | `string` | خیر | - |
| `tabId` | `number` | خیر | - |

---


## همبستگی جرم‌شناسی و تحلیل ریشه‌ای (Forensic Diagnostics) (31 ابزار)

### 176. ابزار `fx_correlate_dom_network`

**توضیحات و عملکرد**: CAP 01 — DOM↔network causal correlator: anchors on a mutation (or request) and reconstructs request → response → render chains with RANKED causal candidates, temporal gaps and evidence-based confidence. Input: sessionId (+ eventId | timestamp | anchor, windowMs, limit).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `eventId` | `string` | خیر | Focal event id (mutation or request) |
| `timestamp` | `number` | خیر | Focal timestamp (ms) — closest mutation/request is used |
| `anchor` | `string` | خیر | - |
| `windowMs` | `number` | خیر | Causality window (default 800ms) |
| `limit` | `number` | خیر | Max candidates (default 8) |

---

### 177. ابزار `fx_dom_regression_diff`

**توضیحات و عملکرد**: CAP 02 — Full regression diff between two page states across 8 dimensions (added/removed/moved/attributes/styles/text/layout/a11y) with machine-readable diffs AND a human-readable report. Input: sessionId + t1 + t2 (timestamps).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Recorded forensic session id (list_sessions) |
| `t1` | `number` | بله | First timestamp (before) |
| `t2` | `number` | بله | Second timestamp (after) |
| `maxPerDimension` | `number` | خیر | Changes kept per dimension (default 40) |

---

### 178. ابزار `fx_visual_regression_forensics`

**توضیحات و عملکرد**: CAP 03 — Visual regression forensics: decodes two recorded screenshots (real PNG decoding), computes region-level pixel diffs and ATTRIBUTS changes to concurrent DOM/style mutations with ranked root-cause candidates. Input: sessionId + shot1/shot2 event ids (or timestamps).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Recorded forensic session id (list_sessions) |
| `shot1` | `string` | خیر | Screenshot event id before |
| `shot2` | `string` | خیر | Screenshot event id after |
| `t1` | `number` | خیر | Fallback: timestamp before |
| `t2` | `number` | خیر | Fallback: timestamp after |

---

### 179. ابزار `fx_layout_shift_forensics`

**توضیحات و عملکرد**: CAP 04 — Layout shift forensics: evidence chains for CLS/layout instability — affected element, position transitions, trigger mutations, concurrent requests, style changes. Input: sessionId (+ eventId | timestamp | selector, windowMs).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `eventId` | `string` | خیر | - |
| `timestamp` | `number` | خیر | - |
| `selector` | `string` | خیر | - |
| `windowMs` | `number` | خیر | Default 600ms |

---

### 180. ابزار `fx_record_interactions`

**توضیحات و عملکرد**: CAP 05 — Start/stop recording of interactions WITH DOM context (fingerprint, matched count, mutation baseline) for deterministic replay. Input: mode start|stop|record-step, recordingId, action, selector, params. Start returns a recordingId; record-step appends one step; stop finalizes.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `mode` | `string` | بله | Recording operation |
| `recordingId` | `string` | خیر | Recording id (for stop/record-step) |
| `action` | `string` | خیر | Interaction action for record-step (click/type/hover/…) |
| `selector` | `string` | خیر | Target selector for record-step |
| `params` | `object` | خیر | Action parameters (text, key…) |
| `tabId` | `number` | خیر | - |

---

### 181. ابزار `fx_replay_interactions`

**توضیحات و عملکرد**: CAP 05 — Deterministically replay a recorded interaction set with resilient target resolution (exact selector → fingerprint recovery), per-step results and success rate. Input: recordingId (+ stopOnFailure, verifySelectorsOnly, tabId).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `recordingId` | `string` | بله | - |
| `stopOnFailure` | `boolean` | خیر | Default true |
| `verifySelectorsOnly` | `boolean` | خیر | Resolve targets without executing (dry-run) |
| `tabId` | `number` | خیر | - |

---

### 182. ابزار `fx_failure_replay`

**توضیحات و عملکرد**: CAP 06 — Capture a structured failure state (URL, page state, selector candidates, DOM subtree, console, network, timing, action history) as a replayable scenario; replay re-executes with resilient resolution. Input: mode capture|replay|list|get, failureId, failedAction, failedSelector, params, tabId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `mode` | `string` | بله | - |
| `failureId` | `string` | خیر | Scenario id (replay/get) |
| `failedAction` | `string` | خیر | Action that failed (capture) |
| `failedSelector` | `string` | خیر | Selector that failed (capture) |
| `params` | `object` | خیر | Original action params (capture) |
| `url` | `string` | خیر | Page URL context (capture) |
| `tabId` | `number` | خیر | - |
| `verifyOnly` | `boolean` | خیر | - |

---

### 183. ابزار `fx_selector_survivability`

**توضیحات و عملکرد**: CAP 07 — Selector survivability scorer: ranks selectors by DOM stability, semantic stability, uniqueness, ancestry stability, framework-attribute risk, text volatility and position dependence — computed from recorded mutation history. Input: selector (+ sessionId, candidateSelectors).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | خیر | - |
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `candidateSelectors` | `array` | خیر | Alternative candidates [{selector, matches}] |

---

### 184. ابزار `fx_component_boundaries`

**توضیحات و عملکرد**: CAP 08 — Component boundary detector: infers React/Vue/Angular/WebComponents/generic boundaries from DOM markers (data-v-, _ngcontent, custom elements, React hydration attrs) and whole-subtree replacement mutation patterns; returns confidence + evidence per boundary. Input: sessionId + timestamp (state to analyze).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | خیر | DOM state timestamp (default: latest) |

---

### 185. ابزار `fx_frame_forensics`

**توضیحات و عملکرد**: CAP 09 — Frame/iframe forensics: complete frame hierarchy, cross-frame relationships, network/console/DOM event attribution per frame, cross-origin detection and frame-local selectors. Input: sessionId + timestamp.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | خیر | DOM state timestamp (default: latest) |

---

### 186. ابزار `fx_shadow_dom_forensics`

**توضیحات و عملکرد**: CAP 10 — Shadow DOM forensics: open/nested shadow roots, host relationships, slot distribution, shadow-tree mutations, style-boundary notes. Analyzes recorded shadow flags + live probing of open roots. Input: sessionId + timestamp, or live selector.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | خیر | - |
| `selector` | `string` | خیر | Live host selector to probe (open roots) |
| `tabId` | `number` | خیر | - |

---

### 187. ابزار `fx_css_influence`

**توضیحات و عملکرد**: CAP 11 — CSS influence analyzer: given an element, ranks the CSS rules that determine its visibility/dimensions/position/stacking/typography/overflow/clipping — with specificity, stylesheet source, declarations and inheritance flags. Input: selector (+ group, tabId).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | - |
| `group` | `string` | خیر | Property group focus (default all) |
| `tabId` | `number` | خیر | - |

---

### 188. ابزار `fx_zindex_occlusion`

**توضیحات و عملکرد**: CAP 12 — Z-index/occlusion forensics: stacking context chain, effective z-order, occluding element via hit-test at center, clipping parent, pointer-events interception, zero-size detection — actionable, not a computed-style dump. Input: selector (+ tabId).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | - |
| `tabId` | `number` | خیر | - |

---

### 189. ابزار `fx_event_listeners`

**توضیحات و عملکرد**: CAP 13 — Event listener forensics: inline on* attributes + addEventListener instrumentation (when the injected page script is active) with capture/passive flags, framework-ownership heuristics and coverage reporting. Input: selector (scope) or document-wide (+ tabId).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | خیر | Scope to a subtree (omit for whole document) |
| `tabId` | `number` | خیر | - |

---

### 190. ابزار `fx_error_root_cause`

**توضیحات و عملکرد**: CAP 14 — Runtime error root-cause graph: console error → stack trace → source location → failed request → DOM mutations → visible symptoms, with RANKED likely root causes and evidence. Input: sessionId (+ eventId | timestamp).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `eventId` | `string` | خیر | Error event id |
| `timestamp` | `number` | خیر | Timestamp near the error |

---

### 191. ابزار `fx_network_dom_binding`

**توضیحات و عملکرد**: CAP 15 — Network-to-DOM binding analyzer: which DOM regions depend on which responses (response → mutations window → region grouping) with confidence, plus unbound requests with reasons. Input: sessionId (+ windowMs, minConfidence, limit).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `windowMs` | `number` | خیر | Render window after response (default 1000ms) |
| `minConfidence` | `number` | خیر | Minimum binding confidence (default 0.3) |
| `limit` | `number` | خیر | - |

---

### 192. ابزار `fx_resource_waterfall`

**توضیحات و عملکرد**: CAP 16 — Resource waterfall forensics: unified document/CSS/JS/font/image/fetch waterfall with request phases, timings, failures, DOM-ready and visual milestones, slowest-resource ranking. Input: sessionId (+ from, to).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `from` | `number` | خیر | - |
| `to` | `number` | خیر | - |

---

### 193. ابزار `fx_font_forensics`

**توضیحات و عملکرد**: CAP 17 — Font rendering forensics: @font-face declarations vs computed usage vs document.fonts load status; undeclared families, font-display behavior, missing fallback stacks, not-loaded faces. Input: tabId (live/simulated page).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `tabId` | `number` | خیر | - |

---

### 194. ابزار `fx_a11y_divergence`

**توضیحات و عملکرد**: CAP 18 — Accessibility + DOM divergence: builds the a11y view from the DOM state and reports inaccessible elements, semantic mismatches, missing names, hidden-but-relevant content and unexpected accessible nodes. Input: sessionId + timestamp.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | خیر | DOM state timestamp (default: latest) |

---

### 195. ابزار `fx_page_health`

**توضیحات و عملکرد**: CAP 19 — Page health score: weighted composite of console errors, failed requests, a11y issues, performance signals, memory warnings, layout instability, broken interactions and DOM anomalies — every subscore independently inspectable. Input: sessionId (+ failedInteractions).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `failedInteractions` | `number` | خیر | Known failed interaction count |

---

### 196. ابزار `fx_exploration_planner`

**توضیحات و عملکرد**: CAP 20 — Agent exploration planner: given current evidence and a symptom, recommends the next investigation actions (tool + rationale + expected outcome) and reports data gaps. A planning aid — never autonomous browsing. Input: sessionId + symptom.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `symptom` | `string` | خیر | Observed symptom, e.g. "checkout button disappeared after login" |

---

### 197. ابزار `fx_smart_snapshot`

**توضیحات و عملکرد**: CAP 21 — Smart snapshot compression: MINIMAL/SEMANTIC/INTERACTION/FORENSIC/FULL modes with compression ratio + token estimates; recommends the smallest mode answering a question (pass question). Input: sessionId (+ timestamp, mode, question).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `timestamp` | `number` | خیر | - |
| `mode` | `string` | خیر | Snapshot mode (default: recommended from question) |
| `question` | `string` | خیر | What you need to answer — mode is auto-recommended |

---

### 198. ابزار `fx_cross_signal_search`

**توضیحات و عملکرد**: CAP 22 — Cross-signal search: one query across DOM, mutations, console, network, navigation, interactions and screenshots — returns scored cross-domain hits plus temporally-adjacent related evidence. Input: sessionId + query (+ limit).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `query` | `string` | بله | Search keywords (selectors, text, URLs, error messages…) |
| `limit` | `number` | خیر | Max hits (default 40) |

---

### 199. ابزار `fx_forensic_export`

**توضیحات و عملکرد**: CAP 23 — Forensic session export: deterministic investigation bundle (metadata, timeline, evidence, findings, health, optional incident report) with SHA-256 content hash for tamper evidence. Input: sessionId (+ includeHealth, includeIncidentReport).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `includeHealth` | `boolean` | خیر | Include page health analysis (default true) |
| `includeIncidentReport` | `boolean` | خیر | Include a generated incident report (default false) |

---

### 200. ابزار `fx_forensic_import`

**توضیحات و عملکرد**: CAP 24 — Forensic session import: validates a previously exported investigation bundle (format + contentHash) and installs it as HISTORICAL evidence — imported data is always marked historical, never live state. Input: bundleJson.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `bundleJson` | `string` | بله | Exported bundle JSON (from fx_forensic_export) |
| `importAsSession` | `boolean` | خیر | Also register a queryable historical session (default true) |

---

### 201. ابزار `fx_impact_prediction`

**توضیحات و عملکرد**: CAP 25 — Change impact predictor: pre-mutation estimation of subtree impact, selector breakage, listener orphaning, layout severity, a11y impact and form-state loss — integrates with the mutation preview workflow. Input: operation, selector (+ sessionId for stored selectors).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `operation` | `string` | بله | Planned operation (set_attribute, set_style, remove, set_outer_html…) |
| `selector` | `string` | بله | - |
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |

---

### 202. ابزار `fx_safe_mutation_guard`

**توضیحات و عملکرد**: CAP 26 — Safe mutation guard: verdict SAFE/CAUTION/HIGH_RISK/BLOCKED with reasons and required precautions for a planned mutation. Never silently blocks normal operations — BLOCKED only for page-level destruction or irreversible state loss. Input: operation, selector (+ sessionId).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `operation` | `string` | بله | - |
| `selector` | `string` | بله | - |
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |

---

### 203. ابزار `fx_transaction_journal`

**توضیحات و عملکرد**: CAP 27 — DOM transaction journal: structured per-transaction records (BEFORE/INTENT/ACTION/AFTER/DIFF/EVIDENCE/TIMESTAMP/ACTOR/ROLLBACK info). Journal entries are written by the transactional mutation engine flow; this tool queries them. Input: transactionId/operation/since filters.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `transactionId` | `string` | خیر | - |
| `operation` | `string` | خیر | - |
| `since` | `number` | خیر | - |
| `limit` | `number` | خیر | - |

---

### 204. ابزار `fx_session_graph`

**توضیحات و عملکرد**: CAP 28 — Multi-page session graph: nodes/edges connecting pages, frames, navigations, requests, interactions, screenshots and DOM states of one investigation (recorded session + live pages). Input: sessionId.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |

---

### 205. ابزار `fx_evidence_scoring`

**توضیحات و عملکرد**: CAP 29 — Forensic evidence scoring: score ANY finding from supporting/contradicting evidence items (source types with weights) — confidence, band, evidence count/types. The same model powers every fx_ conclusion. Input: conclusion + evidence arrays.

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `conclusion` | `string` | بله | The conclusion to score |
| `supporting` | `array` | بله | Supporting evidence [{source, description, ref?, weight?}] |
| `contradicting` | `array` | خیر | Contradicting evidence [{source, description, weight?}] |

---

### 206. ابزار `fx_incident_report`

**توضیحات و عملکرد**: CAP 30 — Agent incident report generator: structured incident report (summary, timeline, root cause, evidence, affected DOM/requests/components, performance+a11y impact, remediation, validation steps, confidence) in JSON AND Markdown. Input: sessionId (+ detectedIssue, rootCauseHint).

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Recorded forensic session id (list_sessions) |
| `detectedIssue` | `string` | خیر | One-line issue description |
| `rootCauseHint` | `string` | خیر | Known root-cause hint (otherwise derived from evidence) |

---


## هوش زمانی و تاریخچه DOM (Temporal Intelligence) (10 ابزار)

### 207. ابزار `td_temporal_query`

**توضیحات و عملکرد**: Query any state/entity across a time range (State(T), State(T1..T2)). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session to query |
| `fromLogical` | `number` | خیر | Range start (logical ms) |
| `toLogical` | `number` | خیر | Range end (logical ms) |
| `entityIds` | `array` | خیر | Restrict to entities |
| `dimensions` | `array` | خیر | State dimensions to include |

---

### 208. ابزار `td_temporal_seek`

**توضیحات و عملکرد**: Seek to the nearest valid state for an event/time. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `logicalTime` | `number` | بله | Target logical time |

---

### 209. ابزار `td_temporal_window`

**توضیحات و عملکرد**: Return a compact before/target/after state window around an event. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `aroundLogical` | `number` | بله | Center logical time |
| `radiusMs` | `number` | خیر | Window radius in ms (default 250) |

---

### 210. ابزار `td_temporal_diff`

**توضیحات و عملکرد**: Diff(T1,T2): compare two arbitrary points in time across all state dimensions. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `t1` | `number` | بله | First logical time |
| `t2` | `number` | بله | Second logical time |

---

### 211. ابزار `td_temporal_trace_entity`

**توضیحات و عملکرد**: Trace one entity through its full lifetime (every touching event). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `entityId` | `string` | بله | Entity to trace |

---

### 212. ابزار `td_temporal_first_change`

**توضیحات و عملکرد**: Find the first event matching a predicate (e.g. first invalid state). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `source` | `string` | خیر | Event source filter |
| `typePattern` | `string` | خیر | Type regex filter |

---

### 213. ابزار `td_temporal_last_stable`

**توضیحات و عملکرد**: Find the last state in which a dimension was stable before a time. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `dimension` | `string` | بله | State dimension |
| `before` | `number` | بله | Search horizon (logical ms) |
| `settleMs` | `number` | خیر | Quiet period that counts as stable (default 250) |

---

### 214. ابزار `td_temporal_join`

**توضیحات و عملکرد**: Join DOM/runtime/network/visual/security events inside temporal constraints (Join(Signals)). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `sources` | `array` | بله | Signal sources to join |
| `withinMs` | `number` | خیر | Cluster window (default 250) |
| `aroundEntityId` | `string` | خیر | Optional entity scope |

---

### 215. ابزار `td_temporal_branch`

**توضیحات و عملکرد**: Branch(T): fork a historical state into a simulation branch (never overwrites reality). [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `forkAtLogical` | `number` | بله | Fork point |
| `mutations` | `array` | بله | Branch mutations (kind, targetSequence, patch, reason) |

---

### 216. ابزار `td_temporal_rewind`

**توضیحات و عملکرد**: Reconstruct and activate a safe inspection state (read-only rewind). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `logicalTime` | `number` | بله | Target time |

---


## مدیریت شواهد، اصالت و اثبات (Evidence & Provenance) (10 ابزار)

### 217. ابزار `td_evidence_capture`

**توضیحات و عملکرد**: Capture a typed evidence bundle for the current investigation. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `incidentId` | `string` | بله | Incident to attach evidence to |
| `kind` | `string` | بله | Evidence node type |
| `label` | `string` | بله | Human label |
| `payload` | `object` | خیر | Evidence payload |

---

### 218. ابزار `td_evidence_search`

**توضیحات و عملکرد**: Search evidence semantically and structurally. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |
| `text` | `string` | خیر | Text query |
| `types` | `array` | خیر | Node type filter |
| `limit` | `number` | خیر | Max results |

---

### 219. ابزار `td_evidence_chain`

**توضیحات و عملکرد**: Build the provenance chain for a claim (claim → evidence → verification). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `claim` | `string` | بله | The claim to ground |
| `evidenceRefs` | `array` | بله | Candidate evidence refs |

---

### 220. ابزار `td_evidence_confidence`

**توضیحات و عملکرد**: Recalculate confidence using source quality and corroboration. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `provenance` | `array` | بله | Provenance records |
| `corroboration` | `number` | بله | Independent corroborating sources |
| `verified` | `boolean` | خیر | Verified by contract? |
| `contradicted` | `boolean` | خیر | Counterevidence observed? |

---

### 221. ابزار `td_evidence_verify`

**توضیحات و عملکرد**: Verify a claim against current or replayed state. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `claim` | `string` | بله | Claim statement |
| `mustHold` | `array` | بله | Postconditions that must hold |
| `mustNotHold` | `array` | خیر | Conditions that must not hold |
| `evidenceRequired` | `array` | خیر | Required evidence refs |

---

### 222. ابزار `td_evidence_hash`

**توضیحات و عملکرد**: Hash a state/evidence artifact and attach integrity metadata. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `artifact` | `object` | بله | Artifact to hash |

---

### 223. ابزار `td_evidence_compare`

**توضیحات و عملکرد**: Compare two evidence packages (structural + provenance diff). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `packageA` | `object` | بله | First package |
| `packageB` | `object` | بله | Second package |

---

### 224. ابزار `td_evidence_export`

**توضیحات و عملکرد**: Export a portable forensic evidence package (.tdom). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `incidentId` | `string` | بله | Incident to export |
| `compress` | `boolean` | خیر | Gzip the artifact |
| `outputPath` | `string` | خیر | Optional file path |

---

### 225. ابزار `td_evidence_timeline`

**توضیحات و عملکرد**: Produce a human-readable evidence timeline for an incident. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `incidentId` | `string` | بله | Incident id |

---

### 226. ابزار `td_evidence_proof`

**توضیحات و عملکرد**: Generate a machine-verifiable proof record for a finding. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `claims` | `array` | بله | Claims with evidence refs |
| `steps` | `array` | خیر | Reasoning steps |
| `conclusion` | `string` | بله | Conclusion statement |
| `verificationStatus` | `string` | بله | PASS/FAIL/INCONCLUSIVE |

---


## تحلیل و استدلال علّی ریشه‌ای (Causal Intelligence) (10 ابزار)

### 227. ابزار `td_cause_trace`

**توضیحات و عملکرد**: Trace likely causes of a selected symptom (root-cause chain). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `symptomEventId` | `string` | بله | Symptom event |
| `windowMs` | `number` | خیر | Correlation window (default 250) |

---

### 228. ابزار `td_cause_graph`

**توضیحات و عملکرد**: Build a causal graph around an incident (typed nodes + provenance edges). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `windowMs` | `number` | خیر | Correlation window |

---

### 229. ابزار `td_cause_rank`

**توضیحات و عملکرد**: Rank competing root-cause hypotheses by evidence strength. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `symptomEventId` | `string` | بله | Symptom event |

---

### 230. ابزار `td_cause_explain`

**توضیحات و عملکرد**: Explain a finding from evidence — claim + chain + confidence + alternatives. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `finding` | `string` | بله | Finding to explain |
| `evidenceRefs` | `array` | بله | Evidence to ground the explanation |

---

### 231. ابزار `td_cause_correlate`

**توضیحات و عملکرد**: Correlate independent signals into candidate causal chains. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `sources` | `array` | بله | Sources to correlate |
| `withinMs` | `number` | خیر | Window (default 250) |

---

### 232. ابزار `td_cause_breakpoint`

**توضیحات و عملکرد**: Find the earliest causal divergence between two streams (reality vs branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `branchId` | `string` | بله | Branch to compare |
| `sessionId` | `string` | بله | Session id |

---

### 233. ابزار `td_cause_impact`

**توضیحات و عملکرد**: Estimate downstream impact of a cause (affected entities/components). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `eventId` | `string` | بله | Cause event |
| `sessionId` | `string` | بله | Session id |

---

### 234. ابزار `td_cause_dependency`

**توضیحات و عملکرد**: Trace dependencies that could produce a state (dependency chains). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `entityId` | `string` | بله | Entity to analyze |
| `sessionId` | `string` | بله | Session id |

---

### 235. ابزار `td_cause_counterfactual`

**توضیحات و عملکرد**: Test whether removing a candidate cause changes the outcome (branch + replay + compare). [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `targetSequence` | `number` | بله | Event sequence to suppress/modify |
| `kind` | `string` | بله | suppress-event | modify-response | modify-state | modify-style | alter-timing |
| `patch` | `object` | خیر | Mutation payload |
| `reason` | `string` | بله | Why this counterfactual |

---

### 236. ابزار `td_cause_verify`

**توضیحات و عملکرد**: Verify a root-cause hypothesis through replay/observation (never guess). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `hypothesisId` | `string` | بله | Hypothesis to verify |

---


## تحلیل سمانتیک و کامپوننت‌های وب (Semantic & Component) (7 ابزار)

### 237. ابزار `td_semantic_page`

**توضیحات و عملکرد**: Build a compact semantic model of the page (roles, intents, stability). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session id |
| `includeHidden` | `boolean` | خیر | Include hidden elements |

---

### 238. ابزار `td_semantic_element`

**توضیحات و عملکرد**: Explain an element's role, intent and state (semantic identity). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | Element selector |

---

### 239. ابزار `td_component_map`

**توضیحات و عملکرد**: Infer component boundaries and ownership (React/Vue/Svelte/custom/microfrontend). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session id |

---

### 240. ابزار `td_component_lifecycle`

**توضیحات و عملکرد**: Trace mount/update/unmount behavior of a component. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `componentId` | `string` | بله | Component id or root selector |
| `sessionId` | `string` | بله | Session id |

---

### 241. ابزار `td_component_dependencies`

**توضیحات و عملکرد**: Map component dependencies and affected nodes. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `componentId` | `string` | بله | Component id |

---

### 242. ابزار `td_component_state`

**توضیحات و عملکرد**: Reconstruct component-facing state signals. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `componentId` | `string` | بله | Component id |
| `sessionId` | `string` | خیر | Session id |

---

### 243. ابزار `td_accessibility_model`

**توضیحات و عملکرد**: Build a normalized accessibility model (role/name/state/relationships/focus). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session id |

---


## عملکرد، تحلیل حافظه و رگرسیون بصری (Performance & Memory) (7 ابزار)

### 244. ابزار `td_visual_semantics`

**توضیحات و عملکرد**: Associate visual regions with semantic entities. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session id |
| `regions` | `array` | خیر | Visual regions to associate |

---

### 290. ابزار `td_layout_causality`

**توضیحات و عملکرد**: Connect layout shifts to runtime/DOM/network causes. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session scope |

---

### 291. ابزار `td_memory_profile`

**توضیحات و عملکرد**: Build a memory profile for the browser/page/session. [security: read-only; cost: medium; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 292. ابزار `td_memory_leak_trace`

**توضیحات و عملکرد**: Find retained-growth patterns over time. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session scope |
| `windowMs` | `number` | خیر | Observation window |

---

### 294. ابزار `td_visual_regression`

**توضیحات و عملکرد**: Compare visual state with DOM/runtime evidence. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `baselineRef` | `string` | خیر | Baseline visual ref |
| `currentRef` | `string` | خیر | Current visual ref |

---

### 295. ابزار `td_visual_causality`

**توضیحات و عملکرد**: Explain why a region changed visually (visual↔DOM↔runtime correlation). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `region` | `object` | بله | Visual region |
| `sessionId` | `string` | خیر | Session scope |

---

### 296. ابزار `td_render_stability`

**توضیحات و عملکرد**: Determine when the page reaches a stable render state. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |
| `settleMs` | `number` | خیر | Quiet period (default 250) |

---


## هدف‌گیری هوشمند و تعامل مقاوم (Targeting & Interaction) (11 ابزار)

### 249. ابزار `td_target_recover`

**توضیحات و عملکرد**: Recover a target after selector/DOM changes (multi-signal recovery; refuses blind guesses). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `failedSelector` | `string` | بله | The selector that failed |
| `lastKnown` | `object` | بله | Last known target snapshot |

---

### 250. ابزار `td_target_verify`

**توضیحات و عملکرد**: Verify that the selected target matches the requested intent. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | Selected selector |
| `intent` | `string` | بله | Requested intent |

---

### 251. ابزار `td_target_history`

**توضیحات و عملکرد**: Show how a target changed over time (identity versions). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `entityId` | `string` | بله | Target entity |

---

### 252. ابزار `td_target_contract`

**توضیحات و عملکرد**: Create a durable target contract for future actions. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `query` | `object` | بله | Target query |
| `resolution` | `object` | بله | Resolution result |

---

### 315. ابزار `td_target_find`

**توضیحات و عملکرد**: Find an element by selector, xpath or text and build the canonical multi-strategy TARGET object with confidence. [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | خیر | CSS selector |
| `xpath` | `string` | خیر | XPath expression |
| `text` | `string` | خیر | Text to discover by intent |

---

### 316. ابزار `td_target_check`

**توضیحات و عملکرد**: Verify a target is still resolvable at the required confidence — the cheap check that replaces full DOM re-analysis. [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | CSS selector to verify |
| `minConfidence` | `number` | خیر | Minimum confidence threshold (default 0) |

---

### 317. ابزار `td_target_describe`

**توضیحات و عملکرد**: Describe a target’s identity: accessibility properties + structural fingerprint (what to store in target memory). [security: read-only; cost: low; modes: live/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `selector` | `string` | بله | CSS selector to describe |

---

### 343. ابزار `td_target_memory_save`

**توضیحات و عملکرد**: Save a learned target (semantic identity + locators + confidence + history) so future runs skip DOM re-analysis. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `site` | `string` | بله | Site scope (origin or *) |
| `semanticId` | `string` | بله | Agent-chosen semantic id, e.g. comments_tab |
| `identity` | `object` | خیر | { role, accessibleName, component, route, text } |
| `locators` | `object` | خیر | { aria, role, text, css, xpath, geometry } |
| `confidence` | `number` | خیر | Current confidence 0..1 (default 0.8) |
| `failedSelector` | `string` | خیر | Selector that failed (history) |
| `notes` | `string` | خیر | Agent notes (how to re-verify, when to repair) |

---

### 344. ابزار `td_target_memory_get`

**توضیحات و عملکرد**: Get a learned target by site + semanticId. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `site` | `string` | بله | Site scope |
| `semanticId` | `string` | بله | Semantic id |

---

### 345. ابزار `td_target_memory_list`

**توضیحات و عملکرد**: List learned targets (optionally filtered by site/semanticId). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `site` | `string` | خیر | Filter by site |
| `semanticId` | `string` | خیر | Filter by semanticId |

---

### 346. ابزار `td_target_memory_delete`

**توضیحات و عملکرد**: Delete a learned target. [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `site` | `string` | بله | Site scope |
| `semanticId` | `string` | بله | Semantic id |

---


## شبیه‌سازی خلاف‌واقع و پیش‌بینی (Counterfactual Simulation) (8 ابزار)

### 257. ابزار `td_simulate_change`

**توضیحات و عملکرد**: Simulate a proposed change without committing it (dry-run on a branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `change` | `object` | بله | Change spec |

---

### 258. ابزار `td_simulate_network`

**توضیحات و عملکرد**: Simulate alternate network responses (modify-response branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `targetSequence` | `number` | بله | Network event to alter |
| `responsePatch` | `object` | بله | Response override |

---

### 259. ابزار `td_simulate_dom`

**توضیحات و عملکرد**: Simulate DOM mutations against a branch. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `mutations` | `array` | بله | DOM mutations |

---

### 260. ابزار `td_simulate_style`

**توضیحات و عملکرد**: Simulate style/CSS changes (modify-style branch). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `targetSequence` | `number` | بله | Style event to alter |
| `stylePatch` | `object` | بله | Style override |

---

### 261. ابزار `td_simulate_runtime`

**توضیحات و عملکرد**: Simulate selected runtime conditions (state/event patches). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `condition` | `object` | بله | Runtime condition spec |

---

### 262. ابزار `td_simulate_failure`

**توضیحات و عملکرد**: Reproduce a controlled failure condition in an authorized environment. [security: policy-gated; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session id |
| `failureKind` | `string` | بله | Failure to inject |

---

### 264. ابزار `td_predict_impact`

**توضیحات و عملکرد**: Predict affected components/entities before a mutation (impact analysis). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `change` | `object` | بله | Proposed change |
| `scope` | `object` | خیر | Scope hints |

---

### 266. ابزار `td_branch_merge`

**توضیحات و عملکرد**: Merge a successful simulation branch into a controlled mutation plan. [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `branchId` | `string` | بله | Verified branch |
| `sessionId` | `string` | بله | Session id |

---


## تاب‌آوری، خودترمیمی و گاردین منابع (Reliability & Recovery) (2 ابزار)

### 267. ابزار `td_health_snapshot`

**توضیحات و عملکرد**: Return full TeleDOM runtime health + integrity state (self-diagnostics). [security: read-only; cost: low; modes: live/recorded/simulation]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 276. ابزار `td_session_repair`

**توضیحات و عملکرد**: Repair a partially corrupted session from checkpoints + evidence (hash-verified). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session to repair |

---


## امنیت مرورگر و مدل Zero-Trust (Security Intelligence) (4 ابزار)

### 277. ابزار `td_security_posture`

**توضیحات و عملکرد**: Produce a browser-side security posture summary (passive, evidence-driven). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 278. ابزار `td_security_surface`

**توضیحات و عملکرد**: Map client-visible attack surfaces and trust boundaries. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | خیر | Session scope |

---

### 279. ابزار `td_security_flow`

**توضیحات و عملکرد**: Trace sensitive-data flows through the browser runtime. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `sessionId` | `string` | بله | Session scope |

---

### 286. ابزار `td_security_regression`

**توضیحات و عملکرد**: Compare security posture before/after a code or deployment change. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `beforeRef` | `string` | بله | Baseline posture ref |
| `afterRef` | `string` | بله | Current posture ref |

---


## بازرسی خودکار و مدیریت حوادث (Autonomous Investigation) (21 ابزار)

### 297. ابزار `td_investigate`

**توضیحات و عملکرد**: Run a complete autonomous investigation from a natural-language objective (resumable plan: scope→…→proof). [security: read-only; cost: high; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `objective` | `string` | بله | Natural-language objective, e.g. "Why does checkout freeze after payment?" |
| `symptomPattern` | `string` | بله | Regex identifying symptom events |
| `sessionId` | `string` | بله | Session to investigate |
| `resumePlanId` | `string` | خیر | Resume an existing plan |

---

### 305. ابزار `td_context_optimize`

**توضیحات و عملکرد**: Select the smallest sufficient evidence/state set for the agent (L0–L4). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `intent` | `string` | بله | The decision the agent must make next |
| `requestedLevel` | `string` | خیر | L0|L1|L2|L3|L4 |

---

### 306. ابزار `td_incident_close`

**توضیحات و عملکرد**: Close an incident ONLY after reproduction, remediation and verification criteria pass. [security: policy-gated; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `incidentId` | `string` | بله | Incident to close |

---

### 329. ابزار `td_workflow_save`

**توضیحات و عملکرد**: Save an agent-authored workflow (envelope-validated, stored verbatim with full version history). [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `workflow` | `object` | بله | teledom.agent-workflow/1.0 object: { schema, name, version, steps[{id,tool,args,onError,retry,requireApproval,timeoutMs}], inputs, policy, metadata } |

---

### 330. ابزار `td_workflow_get`

**توضیحات و عملکرد**: Get a saved workflow (current or a specific version). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | بله | Workflow name |
| `version` | `string` | خیر | Specific version (default: current) |

---

### 331. ابزار `td_workflow_list`

**توضیحات و عملکرد**: List saved workflows with versions, step counts and tags. [security: read-only; cost: low; modes: live/recorded/simulation]

*این ابزار نیاز به پارامتر ورودی ندارد.*

---

### 332. ابزار `td_workflow_update`

**توضیحات و عملکرد**: Update an existing workflow (agent edits the definition; version history preserved). [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `workflow` | `object` | بله | Updated workflow object |

---

### 333. ابزار `td_workflow_clone`

**توضیحات و عملکرد**: Clone a workflow (optionally to a new name/version) — the agent’s edit starting point. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | بله | Source workflow |
| `version` | `string` | خیر | Source version |
| `as` | `string` | خیر | Clone name (default <name>_copy) |
| `newVersion` | `string` | خیر | Clone version |
| `description` | `string` | خیر | Clone description |

---

### 334. ابزار `td_workflow_diff`

**توضیحات و عملکرد**: Structural diff between two workflows or two versions of one workflow. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | خیر | Workflow name |
| `a` | `string` | خیر | Workflow A |
| `aVersion` | `string` | خیر | Version A |
| `b` | `string` | خیر | Workflow B |
| `bVersion` | `string` | خیر | Version B |

---

### 335. ابزار `td_workflow_export`

**توضیحات و عملکرد**: Export a workflow (+ version history) as a portable JSON package. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | بله | Workflow name |

---

### 336. ابزار `td_workflow_import`

**توضیحات و عملکرد**: Import a workflow package from td_workflow_export (cross-project portability). [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `export` | `object` | بله | Export package object |
| `includeVersions` | `boolean` | خیر | Also import version history |

---

### 337. ابزار `td_workflow_validate`

**توضیحات و عملکرد**: Validate a workflow envelope (structure only — semantics are the agent’s responsibility). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `workflow` | `object` | بله | Workflow object to validate |

---

### 338. ابزار `td_workflow_run`

**توضیحات و عملکرد**: DUMB execution: run a saved or inline workflow step-by-step through the full MCP pipeline with policy enforcement (approval gates, tool/domain allowlists, caps), template variables and a deterministic execution record. [security: policy-gated; cost: high; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | خیر | Saved workflow name |
| `version` | `string` | خیر | Version to run |
| `workflow` | `object` | خیر | Inline workflow object |
| `inputs` | `object` | خیر | Input values for {{inputs.*}} templates |
| `approvedSteps` | `array` | خیر | Step ids approved after a BLOCKED run |
| `dryRun` | `boolean` | خیر | Validate + plan only, do not execute |

---

### 339. ابزار `td_workflow_runs`

**توضیحات و عملکرد**: List deterministic execution records (optionally filtered by workflow). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | خیر | Filter by workflow name |
| `limit` | `number` | خیر | Max entries (default 50) |

---

### 340. ابزار `td_workflow_run_get`

**توضیحات و عملکرد**: Get a full execution record: per-step status, args-as-executed, timing, metrics, errors. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `runId` | `string` | بله | Run id |

---

### 341. ابزار `td_workflow_replay`

**توضیحات و عملکرد**: Deterministically re-execute a recorded run’s steps verbatim (replay run #183 — why did it succeed last week?). [security: policy-gated; cost: high; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `runId` | `string` | بله | Run to replay |

---

### 342. ابزار `td_workflow_delete`

**توضیحات و عملکرد**: Delete a workflow and its version history (execution runs are kept as evidence). [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `name` | `string` | بله | Workflow name |

---

### 347. ابزار `td_agent_artifact_save`

**توضیحات و عملکرد**: Save an agent artifact (custom tool, script, policy, memory, note) — stored verbatim, never interpreted. [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `kind` | `string` | بله | custom-tool | script | policy | memory | note |
| `name` | `string` | بله | Artifact name |
| `content` | `object` | بله | Agent payload (any JSON) |
| `description` | `string` | خیر | Optional description |
| `tags` | `array` | خیر | Optional tags |

---

### 348. ابزار `td_agent_artifact_get`

**توضیحات و عملکرد**: Get an agent artifact by kind + name. [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `kind` | `string` | بله | Artifact kind |
| `name` | `string` | بله | Artifact name |

---

### 349. ابزار `td_agent_artifact_list`

**توضیحات و عملکرد**: List agent artifacts (optionally by kind/tag). [security: read-only; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `kind` | `string` | خیر | Filter by kind |
| `tag` | `string` | خیر | Filter by tag |

---

### 350. ابزار `td_agent_artifact_delete`

**توضیحات و عملکرد**: Delete an agent artifact. [security: reversible; cost: low; modes: live/recorded/simulation]

**پارامترهای ورودی**:
| پارامتر | نوع داده (Type) | الزامی (Required) | شرح عملکرد پارامتر |
|---|---|:---:|---|
| `kind` | `string` | بله | Artifact kind |
| `name` | `string` | بله | Artifact name |

---

