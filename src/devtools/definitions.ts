/**
 * DevTools capability tool definitions (dt_ namespace, §14 tool naming:
 * no collision with any of the 121 existing MCPDOM tools; DevTools
 * families stay clearly namespaced while MCPDOM names are untouched).
 *
 * Schema conventions follow the existing MCPDOM MCPToolDefinition
 * (JSON Schema, rich descriptions satisfying §38 tool discovery).
 */

import { MCPToolDefinition } from '../types/mcp-types';
import { DEVTOOLS_REGISTRY } from './tool-registry';

const D = (name: string, description: string, inputSchema: MCPToolDefinition['inputSchema']): MCPToolDefinition => ({ name, description, inputSchema });

const targetSchema = {
  type: 'object',
  properties: {
    uid: { type: 'string', description: 'Element uid from dt_take_snapshot' },
    selector: { type: 'string', description: 'CSS selector of the element (fallback when no uid)' },
    pageId: { type: 'string', description: 'Unified page id (defaults to active page)' },
    tabId: { type: 'number', description: 'Extension tab id (alias for the page)' },
  },
};

export const DEVTOOLS_TOOLS: MCPToolDefinition[] = [
  // ===================== INPUT AUTOMATION (10) =====================
  D('dt_click', 'Clicks an element (chrome-devtools-mcp click). Input: uid/selector (+pageId/tabId). Options: dblClick, includeSnapshot. Dispatches a real synthetic click through the unified runtime; verifies the element becomes interactive, else fails with actionable error.', {
    type: 'object',
    properties: { ...targetSchema.properties, dblClick: { type: 'boolean', description: 'Double click (default false)' }, includeSnapshot: { type: 'boolean', description: 'Include an updated page snapshot in the response' } },
    required: [],
  }),
  D('dt_click_at', 'Click at viewport coordinates with vision-assisted element resolution: reports which element the point hits before clicking. Input: x, y (+page). Use when only a screenshot position is known.', {
    type: 'object',
    properties: { x: { type: 'number', description: 'X coordinate in CSS pixels' }, y: { type: 'number', description: 'Y coordinate in CSS pixels' }, pageId: { type: 'string' }, tabId: { type: 'number' }, includeSnapshot: { type: 'boolean' } },
    required: ['x', 'y'],
  }),
  D('dt_drag', 'Drag an element onto another element (or coordinates). Input: from(uid/selector), to(uid/selector or x/y). Uses real pointer event sequences when live.', {
    type: 'object',
    properties: {
      fromUid: { type: 'string', description: 'Uid of the element to drag' }, fromSelector: { type: 'string', description: 'CSS selector of the element to drag' },
      toUid: { type: 'string', description: 'Uid of the drop target' }, toSelector: { type: 'string', description: 'CSS selector of the drop target' },
      toX: { type: 'number' }, toY: { type: 'number' }, pageId: { type: 'string' }, tabId: { type: 'number' },
    },
    required: [],
  }),
  D('dt_fill', 'Set the value of a form field (clear + type) with optional submit key. Input: uid/selector, value, submitKey.', {
    type: 'object',
    properties: { ...targetSchema.properties, value: { type: 'string', description: 'Value to set' }, submitKey: { type: 'string', description: 'Key pressed after typing, e.g. "Enter"' }, includeSnapshot: { type: 'boolean' } },
    required: ['value'],
  }),
  D('dt_fill_form', 'Fill MULTIPLE form fields in one batched call (§39: prefer this over repeated dt_fill). Input: fields[] each {uid/selector, value, submitKey}.', {
    type: 'object',
    properties: {
      fields: { type: 'array', description: 'Fields to fill', items: { type: 'object', properties: { uid: { type: 'string' }, selector: { type: 'string' }, value: { type: 'string', description: 'Value to set' }, submitKey: { type: 'string' } }, required: ['value'] } },
      pageId: { type: 'string' }, tabId: { type: 'number' },
    },
    required: ['fields'],
  }),
  D('dt_handle_dialog', 'Accept or dismiss an open JavaScript dialog (alert/confirm/prompt). Input: accept (boolean), promptText.', {
    type: 'object',
    properties: { accept: { type: 'boolean', description: 'true to accept, false to dismiss' }, promptText: { type: 'string', description: 'Text to enter in a prompt dialog' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
    required: ['accept'],
  }),
  D('dt_hover', 'Hover over an element. Input: uid/selector.', { type: 'object', properties: { ...targetSchema.properties } }),
  D('dt_press_key', 'Press a key or key combination, e.g. "a", "Enter", "Control+Or,Control+a". Input: key.', {
    type: 'object',
    properties: { key: { type: 'string', description: 'Key or combo string' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
    required: ['key'],
  }),
  D('dt_type_text', 'Type text into a field (keystroke by keystroke), optional submit key. Input: uid/selector, text, submitKey.', {
    type: 'object',
    properties: { ...targetSchema.properties, text: { type: 'string', description: 'Text to type' }, submitKey: { type: 'string' } },
    required: ['text'],
  }),
  D('dt_upload_file', 'Set the files of a file input programmatically. Input: uid/selector, files[] (paths or names).', {
    type: 'object',
    properties: { ...targetSchema.properties, files: { type: 'array', items: { type: 'string' }, description: 'File paths/names to attach' } },
    required: ['files'],
  }),

  // ===================== NAVIGATION (7) =====================
  D('dt_list_pages', 'List all pages/tabs known to the unified runtime with the canonical page identity mapping (pageId ↔ tabId ↔ url ↔ frames). Read-only.', { type: 'object', properties: {} }),
  D('dt_select_page', 'Bring a page to focus. Input: pageId / tabId / index (0-based).', {
    type: 'object',
    properties: { pageId: { type: 'string' }, tabId: { type: 'number' }, index: { type: 'number', description: '0-based index into the page list' } },
  }),
  D('dt_new_page', 'Open a new page/tab. Input: url. Returns the new canonical page identity.', {
    type: 'object',
    properties: { url: { type: 'string', description: 'Initial URL (http/https/file)' } },
    required: ['url'],
  }),
  D('dt_close_page', 'Close a page. Input: pageId/tabId. Fails with PAGE_NOT_FOUND when the page is unknown.', {
    type: 'object',
    properties: { pageId: { type: 'string' }, tabId: { type: 'number' } },
  }),
  D('dt_navigate_page', 'Navigate a page to a URL. Records a NavigationRecord on the page identity (identity survives navigation). Input: url (+page).', {
    type: 'object',
    properties: { url: { type: 'string' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
    required: ['url'],
  }),
  D('dt_history_navigation', 'Navigate browser history: back / forward / reload. Input: direction (+page).', {
    type: 'object',
    properties: { direction: { type: 'string', enum: ['back', 'forward', 'reload'], description: 'History direction' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
    required: ['direction'],
  }),
  D('dt_wait_for', 'Wait until a condition: "load", "domcontentloaded", "networkidle" (0 inflight ≥500ms) or a selector becoming visible. Input: condition, selector?, timeoutMs (default 8000).', {
    type: 'object',
    properties: {
      condition: { type: 'string', enum: ['load', 'domcontentloaded', 'networkidle', 'selector-visible'], description: 'What to wait for' },
      selector: { type: 'string', description: 'CSS selector to wait for (selector-visible)' },
      timeoutMs: { type: 'number', description: 'Timeout in ms (default 8000)' },
      pageId: { type: 'string' }, tabId: { type: 'number' },
    },
    required: ['condition'],
  }),

  // ===================== EMULATION (2) =====================
  D('dt_emulate', 'Emulate device/page characteristics in one call: viewport, deviceScaleFactor, userAgent, cpuThrottlingRate (×), network conditions (downloadKbps/uploadKbps/latencyMs), geolocation, colorScheme, extra headers, locale, timezone. All reversible via dt_emulate reset:true. Integrates with MCPDOM viewport controller for live extension tabs.', {
    type: 'object',
    properties: {
      reset: { type: 'boolean', description: 'Reset all emulation to defaults' },
      viewport: { type: 'object', properties: { width: { type: 'number' }, height: { type: 'number' } } },
      deviceScaleFactor: { type: 'number' },
      userAgent: { type: 'string' },
      cpuThrottlingRate: { type: 'number', description: 'CPU throttle multiplier (1–20), e.g. 4 = 4× slower' },
      networkConditions: { type: 'object', properties: { downloadKbps: { type: 'number' }, uploadKbps: { type: 'number' }, latencyMs: { type: 'number' } } },
      geolocation: { type: 'object', properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, accuracy: { type: 'number' } } },
      colorScheme: { type: 'string', enum: ['light', 'dark'] },
      extraHeaders: { type: 'object', description: 'Extra HTTP headers (name → value)' },
      locale: { type: 'string' }, timezoneId: { type: 'string' },
      pageId: { type: 'string' }, tabId: { type: 'number' },
    },
  }),
  D('dt_resize_page', 'Resize the page viewport. Input: width, height (+page). Reversible (call again with the original size or dt_emulate reset).', {
    type: 'object',
    properties: { width: { type: 'number' }, height: { type: 'number' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
    required: ['width', 'height'],
  }),

  // ===================== PERFORMANCE (3) =====================
  D('dt_performance_start_trace', 'Start a performance trace on a page (CDP Tracing/Performance domains through the extension gateway). One trace per page at a time (NAVIGATION_CONFLICT-style guard). Without a CDP session, runs a deterministic SIMULATED trace buffer clearly labeled simulated:true — never presented as real Chrome data.', {
    type: 'object',
    properties: { categories: { type: 'array', items: { type: 'string' }, description: 'Trace categories (default devtools.timeline)' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
  }),
  D('dt_performance_stop_trace', 'Stop the active trace and return normalized trace events, Web Vitals (LCP/INP/CLS/FCP), long tasks, layout shifts and phase breakdown. Input: traceId (optional — active trace of the page is used).', {
    type: 'object',
    properties: { traceId: { type: 'string' }, pageId: { type: 'string' } },
  }),
  D('dt_performance_analyze_insight', 'Analyze a stopped trace or a provided Chrome trace-events array: extracts insights (long tasks, layout shifts, LCP candidates, parse/layout/paint/network phases) with durations. Input: traceId or events[].', {
    type: 'object',
    properties: {
      traceId: { type: 'string' },
      events: { type: 'array', description: 'Raw Chrome trace events to analyze (ts/dur/name/cat/ph)', items: { type: 'object' } },
      insight: { type: 'string', enum: ['all', 'long-tasks', 'layout-shifts', 'web-vitals', 'phases'], description: 'Focus of the analysis (default all)' },
    },
  }),

  // ===================== NETWORK (2) =====================
  D('dt_list_network_requests', 'List captured network requests from the unified runtime network log (shared with MCPDOM capture). Filters: urlPattern, method, status (number|"error"|"success"), resourceType; pagination offset/limit; includeBody.', {
    type: 'object',
    properties: {
      urlPattern: { type: 'string' }, method: { type: 'string' },
      status: { description: 'Exact status code, "error", or "success"' },
      resourceType: { type: 'string' },
      offset: { type: 'number' }, limit: { type: 'number' },
      pageId: { type: 'string' }, tabId: { type: 'number' },
      ingestTabId: { type: 'number', description: 'First ingest MCPDOM-captured requests for this tab (bridge) before listing' },
    },
  }),
  D('dt_get_network_request', 'Inspect one network request in full: headers, body (when captured), timings, cache state. Input: requestId.', {
    type: 'object',
    properties: { requestId: { type: 'string', description: 'Request id from dt_list_network_requests' }, includeBody: { type: 'boolean', description: 'Include captured bodies (default true)' } },
    required: ['requestId'],
  }),

  // ===================== DEBUGGING (8) =====================
  D('dt_evaluate_script', 'Evaluate JavaScript in page context and return the serialized result. EXPLICIT tool — other capabilities must not wrap everything through this. Input: script (expression or statements), awaitPromise.', {
    type: 'object',
    properties: { script: { type: 'string', description: 'JavaScript to evaluate' }, awaitPromise: { type: 'boolean', description: 'Await returned promises (default true)' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
    required: ['script'],
  }),
  D('dt_list_console_messages', 'List console messages captured by the unified runtime (shares capture with MCPDOM console interception). Filters: level (log,info,warn,error or csv), searchQuery; pagination. In simulation, first ingests MCPDOM-captured console logs for the tab.', {
    type: 'object',
    properties: { level: { type: 'string' }, searchQuery: { type: 'string' }, offset: { type: 'number' }, limit: { type: 'number' }, pageId: { type: 'string' }, tabId: { type: 'number' }, ingestTabId: { type: 'number' } },
  }),
  D('dt_get_console_message', 'Inspect one console message with full text, source and stack. Input: messageId.', {
    type: 'object',
    properties: { messageId: { type: 'string' } },
    required: ['messageId'],
  }),
  D('dt_take_screenshot', 'Capture a page screenshot (png/jpeg), viewport or element-bounded. Routes through MCPDOM capture (DPR-preserving). Input: format, uid/selector for element capture, outputPath to persist.', {
    type: 'object',
    properties: {
      format: { type: 'string', enum: ['png', 'jpeg'], description: 'Image format (default png)' },
      uid: { type: 'string', description: 'Element uid for element-bounded capture' },
      selector: { type: 'string', description: 'CSS selector for element-bounded capture' },
      outputPath: { type: 'string', description: 'Optional file path to persist the capture' },
      pageId: { type: 'string' }, tabId: { type: 'number' },
    },
  }),
  D('dt_take_snapshot', 'Take a semantic text snapshot of the page (a11y-structured, uid-addressable) used by uid-based input tools. Returns node tree with roles/names and uids. §39: prefer this compact snapshot over full DOM dumps for page understanding.', {
    type: 'object',
    properties: { pageId: { type: 'string' }, tabId: { type: 'number' }, selector: { type: 'string', description: 'Limit the snapshot to a subtree' } },
  }),
  D('dt_screencast_start', 'EXPERIMENTAL: start screencast frame streaming (CDP Page.screencast). Requires live CDP session; UNSUPPORTED in simulation (reports mode UNAVAILABLE, never fake frames).', {
    type: 'object', properties: { pageId: { type: 'string' }, tabId: { type: 'number' }, maxDurationMs: { type: 'number' } },
  }),
  D('dt_screencast_stop', 'EXPERIMENTAL: stop screencast streaming and return captured frame metadata. Requires live CDP session.', { type: 'object', properties: { pageId: { type: 'string' }, tabId: { type: 'number' } } }),
  D('dt_lighthouse_audit', 'EXPERIMENTAL: run a Lighthouse audit via the DevTools connection. Requires live CDP session — in simulation reports mode UNAVAILABLE (Lighthouse results are never synthesized).', {
    type: 'object',
    properties: { categories: { type: 'array', items: { type: 'string' }, description: 'Audit categories (default performance,accessibility,best-practices)' }, pageId: { type: 'string' }, tabId: { type: 'number' } },
  }),

  // ===================== MEMORY (13) =====================
  D('dt_take_heapsnapshot', 'Capture a V8 heap snapshot of a page via CDP HeapProfiler (live). In simulation, registers a deterministic fixture snapshot in the REAL .heapsnapshot format, marked simulated:true — analysis code paths are identical; the DATA is explicitly not a real V8 capture. Input: pageId/tabId, raw (optional: pre-captured snapshot JSON string).', {
    type: 'object',
    properties: {
      pageId: { type: 'string' }, tabId: { type: 'number' },
      raw: { type: 'string', description: 'Optional pre-captured .heapsnapshot JSON string to register instead of live capture' },
      saveToPath: { type: 'string', description: 'Optional path to persist the raw snapshot JSON' },
    },
  }),
  D('dt_close_heapsnapshot', 'Release a loaded heap snapshot (§24 lifecycle). Input: snapshotId.', {
    type: 'object', properties: { snapshotId: { type: 'string' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_summary', 'Class aggregates of a heap snapshot: per-class object counts and self sizes, totals, top retainers of size. Input: snapshotId.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, limit: { type: 'number', description: 'Max classes returned (default 50)' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_details', 'Snapshot details: node/edge counts, meta field layout, parse duration. Input: snapshotId.', {
    type: 'object', properties: { snapshotId: { type: 'string' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_class_nodes', 'List the node ids of a class with pagination. Input: snapshotId, className, offset, limit.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, className: { type: 'string' }, offset: { type: 'number' }, limit: { type: 'number' } }, required: ['snapshotId', 'className'],
  }),
  D('dt_heapsnapshot_edges', 'Outgoing edges (references) of a node. Input: snapshotId, nodeId (V8 object id) or nodeIndex.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, nodeId: { type: 'number' }, nodeIndex: { type: 'number' }, limit: { type: 'number' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_retainers', 'Retainers (incoming references) of a node — who keeps it alive. Input: snapshotId, nodeId/nodeIndex.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, nodeId: { type: 'number' }, nodeIndex: { type: 'number' }, limit: { type: 'number' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_retaining_paths', 'Retaining paths from GC roots to a node (shortest path reconstruction). Input: snapshotId, nodeId/nodeIndex, maxPaths.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, nodeId: { type: 'number' }, nodeIndex: { type: 'number' }, maxPaths: { type: 'number' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_dominators', 'Dominator analysis: nodes ranked by retained tree size with their immediate dominator class. Input: snapshotId, limit.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, limit: { type: 'number' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_duplicate_strings', 'Duplicate string instances in the heap — wasted memory detection with instance counts and bytes. Input: snapshotId, limit.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, limit: { type: 'number' } }, required: ['snapshotId'],
  }),
  D('dt_heapsnapshot_object_details', 'Full details of one object: type, class, self size, outgoing edges, retainers, detachedness. Input: snapshotId, nodeId (V8 id) or nodeIndex.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, nodeId: { type: 'number' }, nodeIndex: { type: 'number' } }, required: ['snapshotId'],
  }),
  D('dt_query_heapsnapshot_objects', 'Query heap objects by type, className (substring match) and minimum self size. Input: snapshotId + filters.', {
    type: 'object', properties: { snapshotId: { type: 'string' }, type: { type: 'string' }, className: { type: 'string' }, minSize: { type: 'number' }, limit: { type: 'number' } }, required: ['snapshotId'],
  }),
  D('dt_compare_heapsnapshots', 'Compare two heap snapshots: per-class added/removed objects and size deltas, plus totals. Input: snapshotA, snapshotB.', {
    type: 'object', properties: { snapshotA: { type: 'string', description: 'Baseline snapshot id' }, snapshotB: { type: 'string', description: 'Comparison snapshot id' } }, required: ['snapshotA', 'snapshotB'],
  }),

  // ===================== EXTENSIONS (5) =====================
  D('dt_install_extension', 'Install (load) a browser extension by path/id (live extension management via chrome.management). DANGEROUS: changes browser state. Input: extensionPath or extensionId.', {
    type: 'object', properties: { extensionPath: { type: 'string' }, extensionId: { type: 'string' } },
  }),
  D('dt_list_extensions', 'List installed browser extensions with enable state. Shares capture with MCPDOM list_extensions but returns the DevTools-normalized extension model.', { type: 'object', properties: {} }),
  D('dt_reload_extension', 'Reload an extension by id (dev workflow). Input: extensionId.', {
    type: 'object', properties: { extensionId: { type: 'string' } }, required: ['extensionId'],
  }),
  D('dt_trigger_extension_action', 'Trigger (activate) an extension action by id. Input: extensionId.', {
    type: 'object', properties: { extensionId: { type: 'string' } }, required: ['extensionId'],
  }),
  D('dt_uninstall_extension', 'Uninstall an extension by id. DANGEROUS: destructive. Input: extensionId.', {
    type: 'object', properties: { extensionId: { type: 'string' } }, required: ['extensionId'],
  }),

  // ===================== THIRD-PARTY DEVTOOLS (2) =====================
  D('dt_list_3p_developer_tools', 'Discover third-party developer tools exposed by the page (window-registered devtools integrations). Returns registry with invocation contracts.', { type: 'object', properties: { pageId: { type: 'string' }, tabId: { type: 'number' } } }),
  D('dt_execute_3p_developer_tool', 'Execute a discovered third-party developer tool. EXPERIMENTAL. Input: toolId + args (validated against the discovered contract).', {
    type: 'object', properties: { toolId: { type: 'string' }, args: { type: 'object' }, pageId: { type: 'string' }, tabId: { type: 'number' } }, required: ['toolId'],
  }),

  // ===================== WEBMCP (2) =====================
  D('dt_list_webmcp_tools', 'Discover WebMCP tools exposed by the page (navigator.webMCP registrations per the WebMCP draft). Returns tool schemas for remote execution.', { type: 'object', properties: { pageId: { type: 'string' }, tabId: { type: 'number' } } }),
  D('dt_execute_webmcp_tool', 'Execute a WebMCP tool exposed by the page. Input: toolName + args (validated against the discovered schema).', {
    type: 'object', properties: { toolName: { type: 'string' }, args: { type: 'object' }, pageId: { type: 'string' }, tabId: { type: 'number' } }, required: ['toolName'],
  }),
];

/** Names set for O(1) dispatch lookups. */
export const DEVTOOLS_TOOL_NAMES = new Set(DEVTOOLS_TOOLS.map(t => t.name));
