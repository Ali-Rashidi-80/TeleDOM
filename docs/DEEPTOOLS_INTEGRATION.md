# Chrome DevTools MCP Capability Integration (§7/§8)

> Inventory and integration classification for the official
> [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)
> v1.9.0 (Apache-2.0, © Google LLC) capabilities fused into MCPDOM v3.1.
> License and attribution preserved: the integration is architectural
> (behavior parity through MCPDOM's own transport), with self-contained
> reimplementation of the heap snapshot analysis (no third_party code copied).

## Integration architecture

```text
MCP Client (agent)
      ↓ JSON-RPC 2.0 stdio
ForensicMCPServer (tools-handler)
      ↓ prefix routing (dt_ / fx_)
DevToolsToolsHandler  ──────────────►  unified browser runtime
  ├─ input / navigation / emulation        ├─ Extension bridge (ws://127.0.0.1:3847)
  ├─ network / console / debugging         ├─ CDP gateway (chrome.debugger via extension)
  ├─ performance (traces)                  └─ JSDOM simulation fixture (§16)
  ├─ memory (V8 .heapsnapshot parser)
  ├─ extensions / 3p-devtools / WebMCP
  └─ ForensicsToolsHandler (30 fx_ capabilities)
```

Every dt_ tool routes through the SAME command channels the original 121
MCPDOM tools use (`LIVE_ELEMENT_INTERACT`, `EXECUTE_JS`, `LIST_TABS`, …), so
extension tab ids, page identities and recorded sessions stay unified. DevTools
protocol access (tracing, heap snapshots, dialogs) goes through the CDP gateway
backed by `chrome.debugger` in the extension service worker.

## Capability inventory and classification

| # | DevTools Tool | Family | MCPDOM Tool | Integration Class | Notes |
|---|---|---|---|---|---|
| 1 | click | input | `dt_click` | ADAPTER-INTEGRATION | Routes to LIVE_ELEMENT_INTERACT; uid or selector addressing |
| 2 | click_at / coordinate clicking | input | `dt_click_at` | ADAPTER-INTEGRATION | Vision-assisted resolution; document-level dispatch in layout-less contexts |
| 3 | drag | input | `dt_drag` | ADAPTER-INTEGRATION | DRAG_ELEMENT channel (HTML5 + pointer sequence) |
| 4 | fill | input | `dt_fill` | ADAPTER-INTEGRATION | clear + type semantics |
| 5 | fill_form | input | `dt_fill_form` | ADAPTER-INTEGRATION | §39 batched fills (≤30 fields/call) |
| 6 | handle_dialog | input | `dt_handle_dialog` | ADAPTER-INTEGRATION | CDP Page.handleJavaScriptDialog when attached |
| 7 | hover | input | `dt_hover` | ADAPTER-INTEGRATION | |
| 8 | press_key | input | `dt_press_key` | ADAPTER-INTEGRATION | Page-level default target (body/activeElement) |
| 9 | type_text | input | `dt_type_text` | ADAPTER-INTEGRATION | |
| 10 | upload_file | input | `dt_upload_file` | ADAPTER-INTEGRATION | DataTransfer; honest FileList-property fallback in JSDOM |
| 11 | list_pages | navigation | `dt_list_pages` | SHARED-INFRASTRUCTURE | Unified page identity registry (§10) |
| 12 | select_page | navigation | `dt_select_page` | SHARED-INFRASTRUCTURE | FOCUS_TAB channel |
| 13 | new_page | navigation | `dt_new_page` | SHARED-INFRASTRUCTURE | OPEN_TAB channel |
| 14 | close_page | navigation | `dt_close_page` | SHARED-INFRASTRUCTURE | CLOSE_TAB; default = most recent page |
| 15 | navigate_page | navigation | `dt_navigate_page` | ADAPTER-INTEGRATION | Records NavigationRecord (identity survives) |
| 16 | — (history) | navigation | `dt_history_navigation` | ADAPTER-INTEGRATION | back/forward/reload |
| 17 | wait_for | navigation | `dt_wait_for` | ADAPTER-INTEGRATION | load / domcontentloaded / networkidle / selector-visible |
| 18 | emulate | emulation | `dt_emulate` | ADAPTER-INTEGRATION | viewport, DPR, UA, CPU throttle (1–20×), network conditions, geolocation, color scheme, headers, locale, timezone — reversible |
| 19 | resize_page | emulation | `dt_resize_page` | SHARED-INFRASTRUCTURE | RESIZE_VIEWPORT (reversible viewport controller) |
| 20 | performance_start_trace | performance | `dt_performance_start_trace` | ADAPTER-INTEGRATION | CDP Tracing via gateway; deterministic simulated buffer otherwise (§16) |
| 21 | performance_stop_trace | performance | `dt_performance_stop_trace` | ADAPTER-INTEGRATION | LCP/INP/CLS/FCP + long tasks + phase breakdown |
| 22 | performance_analyze_insight | performance | `dt_performance_analyze_insight` | REIMPLEMENTATION | Real Chrome-trace-format analyzer (same code for live + fixture) |
| 23 | list_network_requests | network | `dt_list_network_requests` | SHARED-INFRASTRUCTURE | Unified network log + MCPDOM capture ingestion |
| 24 | get_network_request | network | `dt_get_network_request` | SHARED-INFRASTRUCTURE | |
| 25 | evaluate_script | debugging | `dt_evaluate_script` | ADAPTER-INTEGRATION | Explicit tool (§18); expression/body normalization |
| 26 | list_console_messages | debugging | `dt_list_console_messages` | SHARED-INFRASTRUCTURE | Unified console log + capture ingestion |
| 27 | get_console_message | debugging | `dt_get_console_message` | SHARED-INFRASTRUCTURE | |
| 28 | take_screenshot | debugging | `dt_take_screenshot` | SHARED-INFRASTRUCTURE | MCPDOM DPR-preserving capture |
| 29 | take_snapshot | debugging | `dt_take_snapshot` | REIMPLEMENTATION | Semantic a11y-structured snapshot with uid addressing |
| 30 | screencast_start | debugging | `dt_screencast_start` | ADAPTER-INTEGRATION | CDP Page.startScreencast; UNAVAILABLE in simulation (never faked) |
| 31 | screencast_stop | debugging | `dt_screencast_stop` | ADAPTER-INTEGRATION | |
| 32 | lighthouse_audit | debugging | `dt_lighthouse_audit` | ADAPTER-INTEGRATION | Experimental; live CDP only |
| 33 | take_heapsnapshot | memory | `dt_take_heapsnapshot` | ADAPTER-INTEGRATION | CDP HeapProfiler; deterministic .heapsnapshot-format fixture (labeled simulated) |
| 34 | close_heapsnapshot | memory | `dt_close_heapsnapshot` | REIMPLEMENTATION | Snapshot store lifecycle (§24) |
| 35 | get_heapsnapshot_summary | memory | `dt_heapsnapshot_summary` | REIMPLEMENTATION | Self-contained parser: class aggregates |
| 36 | get_heapsnapshot_details | memory | `dt_heapsnapshot_details` | REIMPLEMENTATION | meta/fields/counts |
| 37 | get_heapsnapshot_class_nodes | memory | `dt_heapsnapshot_class_nodes` | REIMPLEMENTATION | |
| 38 | get_heapsnapshot_edges | memory | `dt_heapsnapshot_edges` | REIMPLEMENTATION | Outgoing references |
| 39 | get_heapsnapshot_retainers | memory | `dt_heapsnapshot_retainers` | REIMPLEMENTATION | Reverse-edge retainers |
| 40 | get_heapsnapshot_retaining_paths | memory | `dt_heapsnapshot_retaining_paths` | REIMPLEMENTATION | BFS shortest retaining paths from roots |
| 41 | get_heapsnapshot_dominators | memory | `dt_heapsnapshot_dominators` | REIMPLEMENTATION | Cooper–Harvey–Kennedy iterative dominators + retained sizes |
| 42 | get_heapsnapshot_duplicate_strings | memory | `dt_heapsnapshot_duplicate_strings` | REIMPLEMENTATION | Duplicate string waste detection |
| 43 | get_heapsnapshot_object_details | memory | `dt_heapsnapshot_object_details` | REIMPLEMENTATION | |
| 44 | query_heapsnapshot_objects | memory | `dt_query_heapsnapshot_objects` | REIMPLEMENTATION | Type/class/size queries |
| 45 | compare_heapsnapshots | memory | `dt_compare_heapsnapshots` | REIMPLEMENTATION | Class-level diff |
| 46 | install_extension | extensions | `dt_install_extension` | ADAPTER-INTEGRATION | Honest chrome.management semantics |
| 47 | list_extensions | extensions | `dt_list_extensions` | SHARED-INFRASTRUCTURE | Shares MCPDOM capture; DevTools-normalized model |
| 48 | reload_extension | extensions | `dt_reload_extension` | SHARED-INFRASTRUCTURE | RELOAD_EXTENSION channel |
| 49 | trigger_extension_action | extensions | `dt_trigger_extension_action` | ADAPTER-INTEGRATION | |
| 50 | uninstall_extension | extensions | `dt_uninstall_extension` | ADAPTER-INTEGRATION | Soft uninstall (disable) — never auto-destroys |
| 51 | list_3p_developer_tools | third-party | `dt_list_3p_developer_tools` | ADAPTER-INTEGRATION | window.__devtools_3p_tools discovery |
| 52 | execute_3p_developer_tool | third-party | `dt_execute_3p_developer_tool` | ADAPTER-INTEGRATION | Validated contract execution (experimental) |
| 53 | list_webmcp_tools | webmcp | `dt_list_webmcp_tools` | ADAPTER-INTEGRATION | navigator.webMCP / window.webMCP discovery |
| 54 | execute_webmcp_tool | webmcp | `dt_execute_webmcp_tool` | ADAPTER-INTEGRATION | |

### Not integrated (with reasons)

| DevTools capability | Reason |
|---|---|
| `install_pwa` / `launch_pwa` / `uninstall_pwa` / `get_os_app_state` / `get_tab_id` / `open_devtools` / `reveal_in_devtools` / `resolve_devtools_comment` / `get_devtools_comments` | PWA/DevTools-comments/OS integrations operate on DevTools-front-end surface state, not browser page state; they require the DevTools window lifecycle that the MCPDOM extension architecture does not host. Available through the CDP gateway for future enablement (SUPERSEDED pending live CDP). |

## Naming and compatibility (§14)

- All 121 original MCPDOM tool names are preserved verbatim (zero renames).
- DevTools capabilities are namespaced `dt_` — no collisions with any existing tool (verified by the 206-unique-name unit test).
- The 30 native capabilities are namespaced `fx_`.
- Where a DevTools tool overlaps an MCPDOM tool (`click` ↔ `click_element`, `type_text` ↔ `type_text`, `list_extensions` ↔ `list_extensions`), BOTH remain available: the MCPDOM name keeps its exact legacy behavior; the `dt_` variant provides the DevTools-shaped contract (uid addressing, includeSnapshot options, DevTools result model).

## Simulation contract (§16)

| Mode | Meaning |
|---|---|
| LIVE | Real Chrome via the extension bridge / CDP gateway. |
| SIMULATED | Deterministic JSDOM fixture or format-faithful fixtures — ALWAYS `simulated: true`; never presented as real browser measurements. |
| UNAVAILABLE | Requires a live subsystem (CDP/extension) that is not connected — reported honestly, never faked (screencast frames, Lighthouse scores, dialog handling). |
