import { MCPToolDefinition } from '../types/mcp-types';
import { MCPDOM_V3_TOOLS } from './v3-tools-definition';
import { DEVTOOLS_TOOLS } from '../devtools/definitions';
import { FORENSICS_TOOLS } from '../forensics/definitions';
import { TELEDOM_V12_TOOLS } from '../v12/registry/td-tools';

export const FORENSIC_MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: 'list_sessions',
    description: 'List all recorded browser forensic debugging sessions with metadata, timestamps, and stats.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of sessions to return' },
      },
    },
  },
  {
    name: 'get_session',
    description: 'Retrieve full metadata, capabilities, health status, and statistics for a specific debugging session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Unique identifier of the recording session' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'export_session',
    description: 'Export a complete recording session as a portable, self-contained JSON bundle.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Unique identifier of the recording session' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'import_session',
    description: 'Import a recording session bundle from raw JSON string.',
    inputSchema: {
      type: 'object',
      properties: {
        bundleJson: { type: 'string', description: 'Raw JSON string of the session bundle' },
      },
      required: ['bundleJson'],
    },
  },
  {
    name: 'delete_session',
    description: 'Delete a recording session from storage.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Unique identifier of the recording session' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_timeline',
    description: 'Retrieve summary breakdown of events across the session timeline, including event categories and significant milestones.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_events',
    description: 'Query recorded events with filtering by category (DOM, USER, ERROR, CONSOLE, NETWORK, etc.), type, timestamp range, target node, or search query.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        category: { type: 'string', description: 'Filter by category (DOM, USER, ERROR, CONSOLE, NETWORK, NAVIGATION, etc.)' },
        type: { type: 'string', description: 'Filter by exact event type (e.g. DOM_MUTATION_ADD, RUNTIME_ERROR, USER_CLICK)' },
        fromTimestamp: { type: 'number', description: 'Start timestamp in milliseconds' },
        toTimestamp: { type: 'number', description: 'End timestamp in milliseconds' },
        targetNodeId: { type: 'number', description: 'Filter by affected LogicalNodeId' },
        targetSelector: { type: 'string', description: 'Filter by CSS selector substring' },
        searchQuery: { type: 'string', description: 'Search term inside event payload' },
        limit: { type: 'number', description: 'Max events to return (default: 50)' },
        offset: { type: 'number', description: 'Offset for pagination' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_events_around',
    description: 'Retrieve a focused contextual window of events occurring immediately before and after a specific timestamp or event ID.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        timestamp: { type: 'number', description: 'Target timestamp in milliseconds' },
        eventId: { type: 'string', description: 'Target event ID' },
        windowMs: { type: 'number', description: 'Window radius in milliseconds (default: 300ms)' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_dom_state',
    description: 'Reconstruct the complete DOM snapshot at an arbitrary timestamp or event ID using checkpoint delta replay.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        timestamp: { type: 'number', description: 'Target timestamp in milliseconds' },
        eventId: { type: 'string', description: 'Target event ID' },
        format: { type: 'string', enum: ['html', 'json_summary', 'full_nodes'], description: 'Output format (default: html)' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_dom_node',
    description: 'Inspect detailed properties of a specific DOM node at a given timestamp (tag, attributes, text, parent, children, visibility state).',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        timestamp: { type: 'number', description: 'Timestamp in milliseconds' },
        nodeId: { type: 'number', description: 'LogicalNodeId to inspect' },
        selector: { type: 'string', description: 'CSS selector query if nodeId is unknown' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_dom_subtree',
    description: 'Reconstruct and extract the HTML of a specific subtree (e.g. #app or .gpt-panel) at a given timestamp.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        timestamp: { type: 'number', description: 'Timestamp in milliseconds' },
        selector: { type: 'string', description: 'CSS selector for the root of the subtree' },
        nodeId: { type: 'number', description: 'LogicalNodeId for the root of the subtree' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'diff_dom',
    description: 'Compare two DOM states between timestamp T1 and T2 (or event E1 and E2) and return structured additions, removals, moves, attribute, style, and text changes.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        t1: { type: 'number', description: 'Start timestamp in milliseconds' },
        t2: { type: 'number', description: 'End timestamp in milliseconds' },
        e1: { type: 'string', description: 'Start event ID (alternative to t1)' },
        e2: { type: 'string', description: 'End event ID (alternative to t2)' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'trace_element',
    description: 'Trace the entire chronological lifecycle of a DOM element from creation, mounting, mutations, style changes to unmounting/removal.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        nodeId: { type: 'number', description: 'LogicalNodeId of the element' },
        selector: { type: 'string', description: 'CSS selector hint for the element' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'find_disappearing_elements',
    description: 'Automatically scan the session and identify all elements that existed temporarily and were subsequently removed or hidden.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        maxLifespanMs: { type: 'number', description: 'Maximum lifespan in ms to consider (default: 5000ms)' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'why_did_element_disappear',
    description: 'Forensic root-cause diagnosis for why an injected or existing UI element disappeared. Pinpoints removal mechanism, ancestor container destruction, style changes, and correlated errors/network triggers.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        target: { type: 'string', description: 'CSS selector or LogicalNodeId of the target element' },
      },
      required: ['sessionId', 'target'],
    },
  },
  {
    name: 'get_diagnostics',
    description: 'Query recorded console messages, runtime errors, and unhandled promise rejections with stack traces.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        level: { type: 'string', enum: ['all', 'error', 'warn', 'info', 'log'], description: 'Log level filter' },
        fromTimestamp: { type: 'number', description: 'Start timestamp' },
        toTimestamp: { type: 'number', description: 'End timestamp' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_network_events',
    description: 'Query recorded network requests and responses correlated with timing and duration.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        statusFilter: { type: 'string', enum: ['all', 'errors_only', 'success_only'], description: 'HTTP status filter' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_screenshots',
    description: 'List visual checkpoints and screenshot checkpoints captured during the recording session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'annotate_session',
    description: 'Add an investigative annotation or hypothesis to the session timeline.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
        label: { type: 'string', description: 'Short title for annotation' },
        comment: { type: 'string', description: 'Detailed investigative note or root-cause finding' },
        nodeId: { type: 'number', description: 'Optional associated LogicalNodeId' },
        category: { type: 'string', enum: ['NOTE', 'ROOT_CAUSE', 'HYPOTHESIS', 'WARNING', 'VERIFIED'] },
      },
      required: ['sessionId', 'label', 'comment'],
    },
  },
  {
    name: 'get_annotations',
    description: 'Retrieve all human and AI annotations created for a session.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
  },
  {
    name: 'get_recording_health',
    description: 'Run an automated integrity audit on a recording session to check sequence monotonicity, missing nodes, and capability health.',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
  },
  // ==========================================
  // LIVE BROWSER CONTROL, TABS & EXTENSIONS
  // ==========================================
  {
    name: 'list_tabs',
    description: 'List all open Chrome browser tabs across windows with tab ID, title, URL, active state, window ID, status, and recording status.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'focus_tab',
    description: 'Switch active focus to a specific browser tab by tabId and bring its window to the foreground.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'The unique Chrome tab ID to activate and focus' },
      },
      required: ['tabId'],
    },
  },
  {
    name: 'reload_tab',
    description: 'Reload a specific browser tab or the active tab with optional hard refresh (bypassCache).',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Target Chrome tab ID (defaults to currently active tab if omitted)' },
        bypassCache: { type: 'boolean', description: 'Whether to ignore cached assets and perform a hard reload (default: false)' },
      },
    },
  },
  {
    name: 'close_tab',
    description: 'Close a specific browser tab by tabId, URL substring, or pattern (e.g., "meet", "calendar").',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Target Chrome tab ID to close' },
        url: { type: 'string', description: 'URL substring or pattern of tabs to close (e.g. "meet.google.com")' },
      },
    },
  },
  {
    name: 'open_tab',
    description: 'Open a new browser tab with the specified URL, meeting link, web page, or local file path in Chrome.',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The URL, web link, meeting link, or file:// path to open' },
        active: { type: 'boolean', description: 'Whether the new tab should become the active and focused tab (default: true)' },
        pinned: { type: 'boolean', description: 'Whether the tab should be pinned (default: false)' },
      },
      required: ['url'],
    },
  },
  {
    name: 'list_extensions',
    description: 'List all installed Chrome extensions with ID, name, version, enabled status, installation type, and permissions.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'set_extension_enabled',
    description: 'Enable or disable a specific Chrome extension by ID (e.g. turn off extension to observe native clean UI, then turn back on).',
    inputSchema: {
      type: 'object',
      properties: {
        extensionId: { type: 'string', description: 'The Chrome extension ID to enable or disable' },
        enabled: { type: 'boolean', description: 'True to enable the extension, false to disable it' },
      },
      required: ['extensionId', 'enabled'],
    },
  },
  {
    name: 'toggle_extension',
    description: 'Toggle the enabled status of a specific Chrome extension by ID.',
    inputSchema: {
      type: 'object',
      properties: {
        extensionId: { type: 'string', description: 'The Chrome extension ID to toggle' },
      },
      required: ['extensionId'],
    },
  },
  {
    name: 'execute_pipeline',
    description: 'Execute a batch sequence of browser and extension actions in one call (e.g. reload extension, wait, reload tab, take screenshot directly to file, dump DOM to file) and aggregate all results.',
    inputSchema: {
      type: 'object',
      properties: {
        steps: {
          type: 'array',
          description: 'Ordered array of actions to execute sequentially',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', description: 'Optional step identifier' },
              action: { type: 'string', description: 'Tool action name (e.g. reload_extension, set_extension_enabled, reload_tab, wait, capture_page_screenshot, get_live_dom_snapshot, interact_with_element)' },
              params: { type: 'object', description: 'Parameters for this action' },
              stopOnError: { type: 'boolean', description: 'Whether to abort subsequent steps if this step fails (default: true)' },
            },
            required: ['action'],
          },
        },
        outputPath: { type: 'string', description: 'Optional file path to save consolidated JSON report of all pipeline steps' },
      },
      required: ['steps'],
    },
  },
  {
    name: 'compare_extension_states',
    description: 'Automatically perform a complete before/after comparative forensic audit: disables extension, reloads and captures clean native state/screenshot, enables extension, reloads and captures injected state/screenshot, and returns a detailed differential analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        extensionId: { type: 'string', description: 'Target Chrome extension ID' },
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to active tab)' },
        waitDurationMs: { type: 'number', description: 'Wait time in ms after each reload for DOM to settle (default: 2500)' },
        cleanDomPath: { type: 'string', description: 'File path to save clean native DOM snapshot HTML' },
        injectedDomPath: { type: 'string', description: 'File path to save injected DOM snapshot HTML' },
        cleanScreenshotPath: { type: 'string', description: 'File path to save clean native screenshot PNG' },
        injectedScreenshotPath: { type: 'string', description: 'File path to save injected screenshot PNG' },
        diffOutputPath: { type: 'string', description: 'File path to save JSON differential report' },
      },
      required: ['extensionId'],
    },
  },
  {
    name: 'reload_extension',
    description: 'Reload an extension under development. If extensionId is provided, toggles and reloads that extension. If omitted, reloads the Forensic Recorder extension itself.',
    inputSchema: {
      type: 'object',
      properties: {
        extensionId: { type: 'string', description: 'Extension ID to reload (defaults to current extension if omitted)' },
      },
    },
  },
  {
    name: 'get_tab_console_logs',
    description: 'Retrieve live intercepted console logs, uncaught JavaScript errors, and unhandled promise rejections for a specific tab or the active tab.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Target Chrome tab ID (defaults to currently active tab if omitted)' },
        level: { type: 'string', enum: ['all', 'error', 'warn', 'info', 'log', 'debug'], description: 'Filter by log severity level (default: all)' },
        searchQuery: { type: 'string', description: 'Filter logs containing this text or source' },
        limit: { type: 'number', description: 'Maximum number of recent log entries to return (default: 100)' },
        clearAfterRead: { type: 'boolean', description: 'Clear the internal log buffer after reading (default: false)' },
      },
    },
  },
  {
    name: 'get_tab_network_requests',
    description: 'Retrieve live intercepted network requests and responses (Fetch, XHR) for a specific tab or the active tab, including method, URL, status, duration, and errors.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Target Chrome tab ID (defaults to currently active tab if omitted)' },
        method: { type: 'string', description: 'Filter by HTTP method (GET, POST, PUT, DELETE, etc.)' },
        status: { type: 'number', description: 'Filter by HTTP status code (e.g. 200, 404, 500)' },
        onlyErrors: { type: 'boolean', description: 'Return only failed requests or HTTP status >= 400 (default: false)' },
        searchQuery: { type: 'string', description: 'Filter requests by URL substring' },
        limit: { type: 'number', description: 'Maximum number of recent network requests to return (default: 100)' },
        clearAfterRead: { type: 'boolean', description: 'Clear the internal network buffer after reading (default: false)' },
      },
    },
  },
  {
    name: 'inspect_live_page',
    description: 'Inspect the current live browser page state, including URL, title, viewport dimensions, scroll positions, readyState, active and focused elements.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
      },
    },
  },
  {
    name: 'inspect_live_element',
    description: 'Deeply inspect a live DOM element on the active browser page by CSS selector, LogicalNodeId, or selectedElementRef, returning bounds, computed styles, visibility, attributes, state, role, aria, and parent context.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        selector: { type: 'string', description: 'CSS selector of the target element' },
        nodeId: { type: 'number', description: 'LogicalNodeId of the element if recorded' },
        selectedElementRef: { type: 'string', description: 'Reference token of the last selected element' },
        xpath: { type: 'string', description: 'XPath expression for the element' },
      },
    },
  },
  {
    name: 'get_selected_element',
    description: 'Retrieve the DOM element visually selected by the user via Ctrl + Shift + Mouse Click in the live browser.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
      },
    },
  },
  {
    name: 'start_element_picker',
    description: 'Activate the interactive visual element picker mode in the live browser with hover highlighting and click selection.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        highlightColor: { type: 'string', description: 'Hex color for hover highlighter (default: #0ea5e9)' },
      },
    },
  },
  {
    name: 'stop_element_picker',
    description: 'Deactivate the visual element picker mode in the browser and restore normal cursor and interaction state.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
      },
    },
  },
  {
    name: 'capture_page_screenshot',
    description: 'Capture a screenshot of the visible browser page viewport with temporal, scroll, and viewport metadata. When outputPath is provided, saves decoded image directly to disk.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        format: { type: 'string', enum: ['png', 'jpeg'], description: 'Image format (default: png)' },
        outputPath: { type: 'string', description: 'Optional file path to save decoded PNG/JPEG image directly to disk' },
      },
    },
  },
  {
    name: 'capture_element_screenshot',
    description: 'Capture an element-specific screenshot bounded to the target element exact geometry and device pixel ratio. When outputPath is provided, saves decoded image directly to disk.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        outputPath: { type: 'string', description: 'Optional file path to save decoded element PNG/JPEG image directly to disk' },
        selector: { type: 'string', description: 'CSS selector of the target element' },
        nodeId: { type: 'number', description: 'LogicalNodeId of the target element' },
        selectedElementRef: { type: 'string', description: 'Selected element reference token' },
      },
    },
  },
  {
    name: 'interact_with_element',
    description: 'Perform an interaction (click, double_click, right_click, hover, focus, blur, type, clear, press_key, select_option, scroll_into_view, scroll) on a live element and return before/after state and effect measurements.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        action: {
          type: 'string',
          enum: [
            'click',
            'double_click',
            'right_click',
            'hover',
            'focus',
            'blur',
            'type',
            'clear',
            'press_key',
            'select_option',
            'scroll_into_view',
            'scroll',
          ],
          description: 'The user action to perform',
        },
        selector: { type: 'string', description: 'CSS selector of the target element' },
        nodeId: { type: 'number', description: 'LogicalNodeId of the target element' },
        selectedElementRef: { type: 'string', description: 'Selected element reference token' },
        text: { type: 'string', description: 'Text string for type action' },
        key: { type: 'string', description: 'Key name for press_key action (e.g. Enter, Escape, Tab, ArrowDown)' },
        optionValue: { type: 'string', description: 'Value or label for select_option action' },
        scrollDelta: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: 'Scroll deltas for scroll action',
        },
        waitForStabilization: { type: 'boolean', description: 'Wait for DOM and network stabilization after interaction (default: true)' },
        stabilizationTimeoutMs: { type: 'number', description: 'Max wait time in milliseconds (default: 300ms)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'start_element_observation',
    description: 'Start focused continuous recording and observation around a target element and its subtree/ancestors.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        selector: { type: 'string', description: 'CSS selector of the target element' },
        nodeId: { type: 'number', description: 'LogicalNodeId of the target element' },
      },
    },
  },
  {
    name: 'stop_element_observation',
    description: 'Stop focused element observation and assemble a complete correlation bundle with mutations, diagnostics, network activity, and root-cause analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
      },
    },
  },
  {
    name: 'get_live_dom_snapshot',
    description: 'Capture the current live virtual DOM state snapshot of the active or specified browser tab in HTML or structured JSON format.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        format: { type: 'string', enum: ['html', 'json'], description: 'Output format (default: html)' },
      },
    },
  },
  {
    name: 'get_live_dom_subtree',
    description: 'Reconstruct and extract the live HTML or node structure of a specific subtree on the active or specified browser tab.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        selector: { type: 'string', description: 'CSS selector of the subtree root' },
        nodeId: { type: 'number', description: 'LogicalNodeId of the subtree root' },
      },
    },
  },
  {
    name: 'get_element_visual_state',
    description: 'Inspect detailed visual layout, occlusion, clipping, opacity, z-index, and viewport visibility for a live element.',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Optional target Chrome tab ID (defaults to currently active tab)' },
        selector: { type: 'string', description: 'CSS selector of the target element' },
        nodeId: { type: 'number', description: 'LogicalNodeId of the target element' },
      },
    },
  },
  ...MCPDOM_V3_TOOLS,
  // §8 Chrome DevTools MCP capability families (dt_ namespace, no collisions)
  ...DEVTOOLS_TOOLS,
  // §17 the 30 MCPDOM-native advanced forensic capabilities (fx_ namespace)
  ...FORENSICS_TOOLS,
  // TeleDOM v12+ — the 100 td_* intelligence surface (temporal, evidence,
  // causal, semantic, targeting, simulation, reliability, security,
  // performance, investigation) generated from the capability registry.
  ...TELEDOM_V12_TOOLS,
];
