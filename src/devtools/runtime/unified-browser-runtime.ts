/**
 * §9 Unified Browser Runtime — one facade over:
 *   • MCPDOM extension bridge (ws://127.0.0.1:3847) — live Chrome via the MV3 extension
 *   • CDP gateway (chrome.debugger via bridge) — DevTools protocol domains
 *   • JSDOM simulation fixture — deterministic offline mode (§16)
 *
 * Page identity, the event bus and resource lifecycle (§24) are owned
 * here so both MCPDOM-native and DevTools capabilities share one
 * browser/session/page model.
 */

import { ExecutionMode, ModeInfo, PageIdentity, NetworkRequestRecord, ConsoleMessageRecord } from '../types';
import { PageIdentityRegistry } from '../page-identity';
import { UnifiedEventBus } from '../unified-event-bus';

export interface RuntimeBridgeClient {
  sendCommand(command: string, payload?: any): Promise<any>;
}

export interface RuntimeMode {
  bridgeConnected: boolean;
  hasBrowserDom: boolean;
  simulation: boolean;
}

export class UnifiedBrowserRuntime {
  readonly identity = new PageIdentityRegistry();
  readonly bus = new UnifiedEventBus();

  private bridge?: RuntimeBridgeClient;
  /** Network/console capture buffers (event-driven, no polling §22). */
  private networkLog: NetworkRequestRecord[] = [];
  private consoleLog: ConsoleMessageRecord[] = [];
  private netCounter = 0;
  private consoleCounter = 0;
  private cdpAttached = false;

  setBridge(bridge: RuntimeBridgeClient | undefined): void {
    this.bridge = bridge;
  }

  hasBridge(): boolean {
    return !!this.bridge;
  }

  markCdpAttached(attached: boolean): void {
    this.cdpAttached = attached;
  }

  cdpAvailable(): boolean {
    return this.cdpAttached && !!this.bridge;
  }

  /** Current execution mode for a capability requiring live browser (§16). */
  modeFor(capability: { requiresCdp?: boolean; liveDom?: boolean }): ModeInfo {
    const sim = typeof (globalThis as any).__FORENSIC_SIMULATION__ !== 'undefined';
    if (capability.requiresCdp) {
      if (this.cdpAvailable()) {
        return { mode: 'LIVE', simulated: false, note: 'CDP session attached through the extension gateway.', source: 'cdp' };
      }
      if (sim) {
        return { mode: 'SIMULATED', simulated: true, note: 'No CDP session available. Deterministic simulation contract only — results are NOT real Chrome measurements.', source: 'simulation' };
      }
      return { mode: 'UNAVAILABLE', simulated: false, note: 'CDP gateway not connected. Attach the Chrome extension and start a CDP session first.', source: 'none' };
    }
    if (this.bridge && !sim) {
      return { mode: 'LIVE', simulated: false, note: 'Live browser via MCPDOM extension bridge.', source: 'bridge' };
    }
    if (typeof document !== 'undefined') {
      return { mode: 'SIMULATED', simulated: true, note: 'JSDOM fixture DOM — deterministic simulation contract, not a real browser page.', source: 'jsdom-fixture' };
    }
    return { mode: 'UNAVAILABLE', simulated: false, note: 'No bridge connection and no simulation fixture installed.', source: 'none' };
  }

  /** Live JSDOM document (simulation) — null in pure server context. */
  simulationDocument(): Document | null {
    return typeof document !== 'undefined' ? document : null;
  }

  // -------------------------------------------------------------------------
  // Page management — routes through the SAME tab commands MCPDOM uses,
  // so extension tab ids and page identities stay unified (§9/§10).
  // -------------------------------------------------------------------------

  async listPages(): Promise<{ pages: PageIdentity[]; mode: ModeInfo; rawTabs: any[] }> {
    const mode = this.modeFor({});
    let rawTabs: any[] = [];
    if (this.bridge) {
      try {
        const res = await this.bridge.sendCommand('LIST_TABS', {});
        rawTabs = res?.tabs || [];
        for (const tab of rawTabs) {
          this.identity.register({ url: tab.url || 'about:blank', title: tab.title, extensionTabId: tab.id });
        }
      } catch { /* mode flags handle reporting */ }
    }
    // Simulation tabs from the local controller state.
    if (rawTabs.length === 0) {
      const sim = (globalThis as any).__MCPDOM_SIM_TABS__ as any[] | undefined;
      if (Array.isArray(sim)) {
        rawTabs = sim.map((t, i) => ({ id: t.id ?? i + 1, title: t.title ?? 'Simulated Tab', url: t.url ?? 'https://app.internal/dashboard', active: true, status: 'complete' }));
        for (const tab of rawTabs) {
          this.identity.register({ url: tab.url, title: tab.title, extensionTabId: tab.id });
        }
      }
    }
    return { pages: this.identity.list(), mode, rawTabs };
  }

  async newPage(url: string): Promise<{ page: PageIdentity; result: any; mode: ModeInfo }> {
    const mode = this.modeFor({});
    if (this.bridge) {
      const result = await this.bridge.sendCommand('OPEN_TAB', { url, active: true });
      const page = this.identity.register({ url, title: 'New Tab', extensionTabId: result?.tabId });
      this.bus.publish('NAVIGATION', 'page_opened', { url, tabId: result?.tabId }, { pageId: page.pageId });
      return { page, result, mode };
    }
    // Simulation: local controller owns deterministic tab state.
    const controller = (globalThis as any).__MCPDOM_LOCAL_CONTROLLER__;
    if (controller) {
      const res = await controller.handleCommand({ id: `rt_${Date.now()}`, command: 'OPEN_TAB', timestamp: Date.now(), payload: { url } });
      if (res?.success) {
        const page = this.identity.register({ url, title: 'Simulated Tab', extensionTabId: res.data?.tabId });
        this.bus.publish('NAVIGATION', 'page_opened', { url, simulated: true }, { pageId: page.pageId });
        return { page, result: res.data, mode };
      }
    }
    throw new Error('PAGE_NOT_FOUND: no runtime available to open a page (bridge disconnected, no simulation fixture).');
  }

  async selectPage(selector: { pageId?: string; tabId?: number; index?: number }): Promise<{ page: PageIdentity; result?: any; mode: ModeInfo }> {
    const mode = this.modeFor({});
    let resolved: PageIdentity | null = this.identity.resolve({ pageId: selector.pageId, tabId: selector.tabId });
    if (!resolved && selector.index !== undefined) {
      const pages = this.identity.list();
      resolved = pages[selector.index] || null;
    }
    if (selector.pageId) resolved = this.identity.resolve({ pageId: selector.pageId }) || resolved;
    if (!resolved) {
      // Lazy resolution through live listing.
      const list = await this.listPages();
      if (selector.tabId !== undefined) resolved = list.pages.find(p => p.extensionTabId === selector.tabId) || null;
      else if (selector.index !== undefined) resolved = list.pages[selector.index] || null;
      else resolved = list.pages[0] || null;
    }
    if (!resolved) throw new Error(`PAGE_NOT_FOUND: cannot resolve page (${JSON.stringify(selector)}).`);
    if (this.bridge && resolved.extensionTabId !== undefined) {
      const result = await this.bridge.sendCommand('FOCUS_TAB', { tabId: resolved.extensionTabId });
      return { page: resolved, result, mode };
    }
    const controller = (globalThis as any).__MCPDOM_LOCAL_CONTROLLER__;
    if (controller && resolved.extensionTabId !== undefined) {
      const res = await controller.handleCommand({ id: `rt_${Date.now()}`, command: 'FOCUS_TAB', timestamp: Date.now(), payload: { tabId: resolved.extensionTabId } });
      return { page: resolved, result: res?.data, mode };
    }
    return { page: resolved, mode };
  }

  async closePage(selector: { pageId?: string; tabId?: number }): Promise<{ closed: boolean; page?: PageIdentity; mode: ModeInfo }> {
    const mode = this.modeFor({});
    // No explicit selector → close the most recently opened page (least
    // destructive default: never closes the first/main recorded page).
    const pages = (await this.listPages()).pages;
    const candidates = selector.tabId !== undefined ? pages.filter(p => p.extensionTabId === selector.tabId) : pages;
    const page = this.identity.resolve(selector) || (candidates.length > 0 ? candidates[candidates.length - 1] : undefined);
    if (!page) throw new Error(`PAGE_NOT_FOUND: cannot resolve page to close (${JSON.stringify(selector)}).`);
    if (this.bridge && page.extensionTabId !== undefined) {
      await this.bridge.sendCommand('CLOSE_TAB', { tabId: page.extensionTabId });
      this.identity.markClosed(page.pageId);
      this.bus.publish('NAVIGATION', 'page_closed', { pageId: page.pageId }, { pageId: page.pageId });
      return { closed: true, page, mode };
    }
    const controller = (globalThis as any).__MCPDOM_LOCAL_CONTROLLER__;
    if (controller && page.extensionTabId !== undefined) {
      const res = await controller.handleCommand({ id: `rt_${Date.now()}`, command: 'CLOSE_TAB', timestamp: Date.now(), payload: { tabId: page.extensionTabId } });
      if (res?.success) {
        this.identity.markClosed(page.pageId);
        this.bus.publish('NAVIGATION', 'page_closed', { pageId: page.pageId, simulated: true }, { pageId: page.pageId });
        return { closed: true, page, mode };
      }
    }
    return { closed: false, page, mode };
  }

  // -------------------------------------------------------------------------
  // Network / console capture — event-driven collection shared by
  // dt_list_network_requests / dt_get_network_request / dt_list_console_messages
  // and by forensics correlation. Reuses MCPDOM bridge capture where present.
  // -------------------------------------------------------------------------

  recordNetworkRequest(record: Omit<NetworkRequestRecord, 'requestId' | 'startTime' | 'failed'> & Partial<NetworkRequestRecord>): NetworkRequestRecord {
    const full: NetworkRequestRecord = {
      requestId: record.requestId || `req_${++this.netCounter}`,
      url: record.url,
      method: record.method || 'GET',
      resourceType: record.resourceType,
      status: record.status,
      statusText: record.statusText,
      requestHeaders: record.requestHeaders,
      responseHeaders: record.responseHeaders,
      requestBody: record.requestBody,
      responseBody: record.responseBody,
      responseSize: record.responseSize,
      fromCache: record.fromCache,
      failed: record.failed ?? false,
      errorText: record.errorText,
      startTime: record.startTime ?? Date.now(),
      endTime: record.endTime,
      durationMs: record.durationMs,
      pageId: record.pageId,
      persisted: record.persisted,
    };
    this.networkLog.push(full);
    if (this.networkLog.length > 2000) this.networkLog.shift(); // bounded §24
    this.bus.publish('NETWORK', full.failed ? 'request_failed' : (full.endTime !== undefined ? 'response_complete' : 'request_start'), {
      url: full.url, method: full.method, status: full.status, failed: full.failed,
    }, { requestId: full.requestId, pageId: full.pageId });
    return full;
  }

  /** Ingest captured requests (from MCPDOM network monitor payloads). */
  ingestNetworkRequests(requests: Array<Record<string, any>>): number {
    let count = 0;
    for (const r of requests) {
      this.recordNetworkRequest({
        url: r.url || r.request?.url || 'unknown',
        method: r.method || r.request?.method || 'GET',
        status: r.status ?? r.response?.status,
        statusText: r.statusText,
        requestHeaders: r.requestHeaders || r.request?.headers,
        responseHeaders: r.responseHeaders || r.response?.headers,
        requestBody: r.requestBody || r.request?.body,
        responseBody: r.responseBody || r.response?.body,
        responseSize: r.responseSize ?? r.response?.size,
        fromCache: r.fromCache,
        failed: !!(r.failed || r.error || (r.status && r.status >= 400)),
        errorText: r.errorText || r.error,
        startTime: r.timestamp ?? r.startTime ?? Date.now(),
        endTime: r.endTime,
        durationMs: r.durationMs,
        pageId: r.pageId,
      });
      count++;
    }
    return count;
  }

  listNetworkRequests(filter?: { pageId?: string; urlPattern?: string; method?: string; status?: 'error' | 'success' | number; resourceType?: string; offset?: number; limit?: number; includeBrowserCached?: boolean }): { requests: NetworkRequestRecord[]; total: number; mode: ModeInfo } {
    const mode = this.modeFor({});
    let list = this.networkLog.slice();
    if (filter?.pageId) list = list.filter(r => r.pageId === filter.pageId);
    if (filter?.urlPattern) {
      const pattern = filter.urlPattern.toLowerCase();
      list = list.filter(r => r.url.toLowerCase().includes(pattern));
    }
    if (filter?.method) list = list.filter(r => r.method.toUpperCase() === filter.method!.toUpperCase());
    if (filter?.status === 'error') list = list.filter(r => r.failed || (r.status !== undefined && r.status >= 400));
    else if (filter?.status === 'success') list = list.filter(r => !r.failed && r.status !== undefined && r.status < 400);
    else if (typeof filter?.status === 'number') list = list.filter(r => r.status === filter.status);
    if (filter?.resourceType) list = list.filter(r => (r.resourceType || '').toLowerCase() === filter.resourceType!.toLowerCase());
    const total = list.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;
    return { requests: list.slice(offset, offset + limit), total, mode };
  }

  getNetworkRequest(requestId: string): NetworkRequestRecord | undefined {
    return this.networkLog.find(r => r.requestId === requestId);
  }

  recordConsoleMessage(record: Omit<ConsoleMessageRecord, 'messageId' | 'timestamp'> & Partial<ConsoleMessageRecord>): ConsoleMessageRecord {
    const full: ConsoleMessageRecord = {
      messageId: record.messageId || `con_${++this.consoleCounter}`,
      level: record.level || 'log',
      text: record.text,
      timestamp: record.timestamp ?? Date.now(),
      pageId: record.pageId,
      source: record.source,
      stackTrace: record.stackTrace,
    };
    this.consoleLog.push(full);
    if (this.consoleLog.length > 1000) this.consoleLog.shift();
    this.bus.publish('CONSOLE', `console_${full.level}`, { text: full.text, level: full.level }, { pageId: full.pageId });
    return full;
  }

  ingestConsoleMessages(messages: Array<Record<string, any>>): number {
    let count = 0;
    for (const m of messages) {
      this.recordConsoleMessage({
        level: (m.level || m.type || 'log').toLowerCase(),
        text: m.text ?? m.message ?? String(m.args ?? ''),
        pageId: m.pageId,
        source: m.source,
        stackTrace: m.stackTrace || (m.stack?.length ? m.stack.join('\n') : undefined),
      });
      count++;
    }
    return count;
  }

  listConsoleMessages(filter?: { level?: string; searchQuery?: string; pageId?: string; offset?: number; limit?: number }): { messages: ConsoleMessageRecord[]; total: number; mode: ModeInfo } {
    const mode = this.modeFor({});
    let list = this.consoleLog.slice();
    if (filter?.level) {
      const levels = filter.level.toLowerCase().split(',').map(s => s.trim());
      list = list.filter(m => levels.includes(m.level));
    }
    if (filter?.pageId) list = list.filter(m => m.pageId === filter.pageId);
    if (filter?.searchQuery) {
      const q = filter.searchQuery.toLowerCase();
      list = list.filter(m => m.text.toLowerCase().includes(q));
    }
    const total = list.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || 50;
    return { messages: list.slice(offset, offset + limit), total, mode };
  }

  // Shared bridge access for capability modules.
  async bridgeCommand(command: string, payload?: any): Promise<any> {
    if (!this.bridge) throw new Error('BROWSER_UNAVAILABLE: bridge client not connected.');
    return this.bridge.sendCommand(command, payload);
  }
}

/** Process-wide singleton runtime shared by dt_/fx_ handlers. */
export const unifiedRuntime = new UnifiedBrowserRuntime();
