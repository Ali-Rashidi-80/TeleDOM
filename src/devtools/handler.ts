/**
 * DevTools capability dispatcher — routes dt_* tool calls to the
 * capability modules, wraps results in the unified error contract (§41)
 * and records invocation observability (§40) on the unified event bus.
 */

import { MCPToolCallResult } from '../types/mcp-types';
import { DEVTOOLS_TOOL_NAMES } from './definitions';
import { toErrorEnvelope } from './error-contract';
import { unifiedRuntime } from './runtime/unified-browser-runtime';

import * as input from './capabilities/input';
import * as nav from './capabilities/navigation';
import * as debug from './capabilities/network-console-debugging';
import * as perfmem from './capabilities/performance-memory';
import * as extweb from './capabilities/extensions-webmcp';

type Handler = (args: Record<string, any>) => Promise<Record<string, unknown>>;

const ROUTES: Record<string, Handler> = {
  // input
  dt_click: input.dtClick,
  dt_click_at: input.dtClickAt,
  dt_drag: input.dtDrag,
  dt_fill: input.dtFill,
  dt_fill_form: input.dtFillForm,
  dt_handle_dialog: input.dtHandleDialog,
  dt_hover: input.dtHover,
  dt_press_key: input.dtPressKey,
  dt_type_text: input.dtTypeText,
  dt_upload_file: input.dtUploadFile,
  // navigation
  dt_list_pages: nav.dtListPages,
  dt_select_page: nav.dtSelectPage,
  dt_new_page: nav.dtNewPage,
  dt_close_page: nav.dtClosePage,
  dt_navigate_page: nav.dtNavigatePage,
  dt_history_navigation: nav.dtHistoryNavigation,
  dt_wait_for: nav.dtWaitFor,
  // emulation
  dt_emulate: nav.dtEmulate,
  dt_resize_page: nav.dtResizePage,
  // network / console / debugging
  dt_list_network_requests: debug.dtListNetworkRequests,
  dt_get_network_request: debug.dtGetNetworkRequest,
  dt_list_console_messages: debug.dtListConsoleMessages,
  dt_get_console_message: debug.dtGetConsoleMessage,
  dt_evaluate_script: debug.dtEvaluateScript,
  dt_take_screenshot: debug.dtTakeScreenshot,
  dt_take_snapshot: debug.dtTakeSnapshot,
  dt_screencast_start: debug.dtScreencastStart,
  dt_screencast_stop: debug.dtScreencastStop,
  dt_lighthouse_audit: debug.dtLighthouseAudit,
  // performance
  dt_performance_start_trace: perfmem.dtPerformanceStartTrace,
  dt_performance_stop_trace: perfmem.dtPerformanceStopTrace,
  dt_performance_analyze_insight: perfmem.dtPerformanceAnalyzeInsight,
  // memory
  dt_take_heapsnapshot: perfmem.dtTakeHeapsnapshot,
  dt_close_heapsnapshot: perfmem.dtCloseHeapsnapshot,
  dt_heapsnapshot_summary: perfmem.dtHeapsnapshotSummary,
  dt_heapsnapshot_details: perfmem.dtHeapsnapshotDetails,
  dt_heapsnapshot_class_nodes: perfmem.dtHeapsnapshotClassNodes,
  dt_heapsnapshot_edges: perfmem.dtHeapsnapshotEdges,
  dt_heapsnapshot_retainers: perfmem.dtHeapsnapshotRetainers,
  dt_heapsnapshot_retaining_paths: perfmem.dtHeapsnapshotRetainingPaths,
  dt_heapsnapshot_dominators: perfmem.dtHeapsnapshotDominators,
  dt_heapsnapshot_duplicate_strings: perfmem.dtHeapsnapshotDuplicateStrings,
  dt_heapsnapshot_object_details: perfmem.dtHeapsnapshotObjectDetails,
  dt_query_heapsnapshot_objects: perfmem.dtQueryHeapsnapshotObjects,
  dt_compare_heapsnapshots: perfmem.dtCompareHeapsnapshots,
  // extensions / 3p / webmcp
  dt_install_extension: extweb.dtInstallExtension,
  dt_list_extensions: extweb.dtListExtensions,
  dt_reload_extension: extweb.dtReloadExtension,
  dt_trigger_extension_action: extweb.dtTriggerExtensionAction,
  dt_uninstall_extension: extweb.dtUninstallExtension,
  dt_list_3p_developer_tools: extweb.dtList3pDeveloperTools,
  dt_execute_3p_developer_tool: extweb.dtExecute3pDeveloperTool,
  dt_list_webmcp_tools: extweb.dtListWebmcpTools,
  dt_execute_webmcp_tool: extweb.dtExecuteWebmcpTool,
};

export class DevToolsToolsHandler {
  knows(toolName: string): boolean {
    return DEVTOOLS_TOOL_NAMES.has(toolName);
  }

  async handleToolCall(name: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    const started = Date.now();
    const handler = ROUTES[name];
    if (!handler) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Unknown DevTools tool: ${name}` }],
      };
    }
    try {
      const result = await handler(args || {});
      const durationMs = Date.now() - started;
      unifiedRuntime.bus.publish('RUNTIME', 'tool_invocation', { tool: name, ok: true, durationMs });
      return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      const durationMs = Date.now() - started;
      unifiedRuntime.bus.publish('RUNTIME', 'tool_invocation', { tool: name, ok: false, durationMs });
      const envelope = toErrorEnvelope(err);
      return {
        isError: true,
        content: [{ type: 'text', text: JSON.stringify(envelope, null, 2) }],
      };
    }
  }
}
