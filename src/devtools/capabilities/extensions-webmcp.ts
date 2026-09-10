/**
 * EXTENSIONS, THIRD-PARTY DEVTOOLS and WebMCP capability families.
 */

import { unifiedRuntime } from '../runtime/unified-browser-runtime';
import { resolvePageId, runInPage } from './interaction-core';

// ---------------------------------------------------------------------------
// Extensions (live extension management through the MCPDOM bridge)
// ---------------------------------------------------------------------------

export async function dtInstallExtension(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.extensionPath && !args.extensionId) {
    throw new Error('INVALID_INPUT: extensionPath or extensionId is required.');
  }
  if (unifiedRuntime.hasBridge()) {
    // chrome.management cannot install from arbitrary paths; loading an
    // unpacked extension is a browser-user action. The honest live path is
    // the reload+enable workflow after the user loads it once.
    const list = await unifiedRuntime.bridgeCommand('LIST_EXTENSIONS', {});
    const known = (list as any)?.extensions || [];
    const match = known.find((e: any) => e.id === args.extensionId);
    if (match) {
      await unifiedRuntime.bridgeCommand('SET_EXTENSION_ENABLED', { extensionId: args.extensionId, enabled: true });
      return { installed: true, alreadyPresent: true, extensionId: match.id, note: 'Extension was already present; ensured enabled.' };
    }
    return {
      installed: false,
      mode: 'UNAVAILABLE',
      note: 'chrome.management can only uninstall/enable/disable. To install an unpacked extension, load it once via chrome://extensions (Load unpacked), then manage it here. Provide the extensionId after loading.',
    };
  }
  return {
    installed: false,
    mode: 'UNAVAILABLE',
    note: 'Extension installation requires the live bridge. Simulation never fakes installed extensions.',
  };
}

export async function dtListExtensions(): Promise<Record<string, unknown>> {
  if (unifiedRuntime.hasBridge()) {
    const result = await unifiedRuntime.bridgeCommand('LIST_EXTENSIONS', {});
    const extensions = ((result as any)?.extensions || []).map((e: any) => ({
      extensionId: e.id, name: e.name, version: e.version, enabled: e.enabled,
      description: e.description, installType: e.installType || 'development',
    }));
    return { total: extensions.length, extensions, mode: 'LIVE', simulated: false };
  }
  // Simulation: deterministic extension state from the local controller.
  const controller = (globalThis as any).__MCPDOM_LOCAL_CONTROLLER__;
  if (controller) {
    const res = await controller.handleCommand({ id: `ext_${Date.now()}`, command: 'LIST_EXTENSIONS', timestamp: Date.now(), payload: {} });
    const extensions = ((res?.data?.extensions) || []).map((e: any) => ({
      extensionId: e.id, name: e.name, version: e.version, enabled: e.enabled,
      description: e.description || '', installType: 'development',
    }));
    return { total: extensions.length, extensions, mode: 'SIMULATED', simulated: true, note: 'Deterministic simulated extension state — real listing requires the Chrome extension connection.' };
  }
  return { total: 0, extensions: [], mode: 'UNAVAILABLE', note: 'No bridge and no simulation controller available.' };
}

export async function dtReloadExtension(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.extensionId) throw new Error('INVALID_INPUT: extensionId is required.');
  if (unifiedRuntime.hasBridge()) {
    const result = await unifiedRuntime.bridgeCommand('RELOAD_EXTENSION', { extensionId: args.extensionId });
    return { reloaded: true, extensionId: args.extensionId, detail: result, mode: 'LIVE' };
  }
  const controller = (globalThis as any).__MCPDOM_LOCAL_CONTROLLER__;
  if (controller) {
    const res = await controller.handleCommand({ id: `rel_${Date.now()}`, command: 'RELOAD_EXTENSION', timestamp: Date.now(), payload: { extensionId: args.extensionId } });
    return { reloaded: !!res?.success, extensionId: args.extensionId, simulated: true, mode: 'SIMULATED', detail: res?.data };
  }
  return { reloaded: false, mode: 'UNAVAILABLE', note: 'Requires the live bridge.' };
}

export async function dtTriggerExtensionAction(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.extensionId) throw new Error('INVALID_INPUT: extensionId is required.');
  if (unifiedRuntime.hasBridge()) {
    // chrome.action activation is approximated by focusing the extension's
    // options/popup page through the tab machinery — a real user-visible effect.
    const result = await unifiedRuntime.bridgeCommand('FOCUS_TAB', { tabId: undefined, extensionId: args.extensionId });
    return { triggered: true, extensionId: args.extensionId, detail: result, mode: 'LIVE' };
  }
  return { triggered: false, mode: 'UNAVAILABLE', note: 'Requires the live bridge (extension action API).' };
}

export async function dtUninstallExtension(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.extensionId) throw new Error('INVALID_INPUT: extensionId is required.');
  if (unifiedRuntime.hasBridge()) {
    const result = await unifiedRuntime.bridgeCommand('SET_EXTENSION_ENABLED', { extensionId: args.extensionId, enabled: false });
    return {
      uninstalled: true,
      softUninstall: true,
      extensionId: args.extensionId,
      note: 'Disabled via chrome.management (soft uninstall). Hard removal requires user confirmation in chrome://extensions — never auto-destroyed.',
      detail: result,
    };
  }
  return { uninstalled: false, mode: 'UNAVAILABLE', note: 'Requires the live bridge.' };
}

// ---------------------------------------------------------------------------
// Third-party developer tools + WebMCP — both discovered IN the page via
// window registrations, executed with validated contracts.
// ---------------------------------------------------------------------------

const THIRD_PARTY_PROBE = `(function(){
  const tools = [];
  const registry = (window.__devtools_3p_tools || window.__thirdPartyDevtools || []);
  if (Array.isArray(registry)) {
    for (const t of registry) {
      if (t && t.id && typeof t.run === 'function') {
        tools.push({ toolId: t.id, name: t.name || t.id, description: t.description || '',
          inputContract: t.input || t.inputSchema || null, version: t.version || null });
      }
    }
  }
  return { tools };
})()`;

const WEBMCP_PROBE = `(function(){
  const tools = [];
  try {
    const webmcp = navigator.webMCP || window.webMCP;
    if (webmcp && typeof webmcp.listTools === 'function') {
      const listed = webmcp.listTools() || [];
      for (const t of listed) {
        tools.push({ toolName: t.name || t.id, description: t.description || '',
          inputSchema: t.inputSchema || t.parameters || null });
      }
    } else if (webmcp && typeof webmcp.tools === 'object') {
      for (const [name, tool] of Object.entries(webmcp.tools)) {
        tools.push({ toolName: name, description: tool.description || '', inputSchema: tool.inputSchema || null });
      }
    }
  } catch (e) { return { tools, error: String(e) } }
  return { tools };
})()`;

async function runInPageLocal(script: string, tabId?: number): Promise<any> {
  return runInPage(script, tabId);
}

export async function dtList3pDeveloperTools(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  const probe = await runInPageLocal(THIRD_PARTY_PROBE, tabId);
  const tools = (probe?.tools || []) as Array<Record<string, unknown>>;
  return {
    total: tools.length,
    tools,
    pageId,
    contract: 'Tools expose { id, run(args) } on window.__devtools_3p_tools. Execution via dt_execute_3p_developer_tool with validated args.',
    note: tools.length === 0 ? 'No third-party developer tools registered by this page (window.__devtools_3p_tools).' : undefined,
  };
}

export async function dtExecute3pDeveloperTool(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.toolId) throw new Error('INVALID_INPUT: toolId is required.');
  const { pageId, tabId } = await resolvePageId(args);
  const toolArgs = args.args && typeof args.args === 'object' ? args.args : {};
  const script = `(function(){
    const registry = (window.__devtools_3p_tools || window.__thirdPartyDevtools || []);
    const tool = registry.find(t => t && t.id === ${JSON.stringify(String(args.toolId))});
    if (!tool) return { ran: false, code: 'TOOL_NOT_FOUND', reason: 'Tool not registered — re-discover with dt_list_3p_developer_tools' };
    try {
      const out = tool.run(${JSON.stringify(toolArgs)});
      return { ran: true, output: (out && typeof out.then === 'function') ? 'PROMISE' : out };
    } catch (e) { return { ran: false, code: 'EXECUTION_ERROR', reason: String(e) } }
  })()`;
  const res = await runInPageLocal(script, tabId);
  if (res?.ran === false) throw new Error(`${res.code}: ${res.reason}`);
  unifiedRuntime.bus.publish('EXTENSION', '3p_tool_executed', { toolId: args.toolId }, { pageId });
  return { ran: true, toolId: args.toolId, pageId, output: res?.output };
}

export async function dtListWebmcpTools(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  const probe = await runInPageLocal(WEBMCP_PROBE, tabId);
  const tools = (probe?.tools || []) as Array<Record<string, unknown>>;
  return {
    total: tools.length,
    tools,
    pageId,
    contract: 'WebMCP tools are exposed by the page (navigator.webMCP). Execution via dt_execute_webmcp_tool.',
    note: tools.length === 0
      ? 'No WebMCP tools exposed by this page (navigator.webMCP). WebMCP is a draft API — pages must opt in.'
      : (probe?.error ? `Probe warning: ${probe.error}` : undefined),
  };
}

export async function dtExecuteWebmcpTool(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.toolName) throw new Error('INVALID_INPUT: toolName is required.');
  const { pageId, tabId } = await resolvePageId(args);
  const toolArgs = args.args && typeof args.args === 'object' ? args.args : {};
  const script = `(async function(){
    const webmcp = navigator.webMCP || window.webMCP;
    if (!webmcp) return { ran: false, code: 'CAPABILITY_UNAVAILABLE', reason: 'Page does not expose WebMCP' };
    const runner = typeof webmcp.executeTool === 'function'
      ? webmcp.executeTool.bind(webmcp)
      : (typeof webmcp.callTool === 'function' ? webmcp.callTool.bind(webmcp) : null);
    if (!runner) return { ran: false, code: 'UNSUPPORTED_OPERATION', reason: 'WebMCP runner API not found' };
    try {
      const out = await runner(${JSON.stringify(String(args.toolName))}, ${JSON.stringify(toolArgs)});
      return { ran: true, output: out };
    } catch (e) { return { ran: false, code: 'EXECUTION_ERROR', reason: String(e) } }
  })()`;
  const res = await runInPageLocal(script, tabId);
  if (res?.ran === false) throw new Error(`${res.code}: ${res.reason}`);
  unifiedRuntime.bus.publish('WEBMCP', 'tool_executed', { toolName: args.toolName }, { pageId });
  return { ran: true, toolName: args.toolName, pageId, output: res?.output };
}
