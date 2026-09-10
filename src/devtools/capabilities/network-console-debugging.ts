/**
 * NETWORK, CONSOLE, DEBUGGING (evaluate / screenshot / snapshot /
 * screencast / lighthouse) capability families.
 */

import { unifiedRuntime } from '../runtime/unified-browser-runtime';
import { resolvePageId, resolveTarget, buildPageSnapshot, snapshotStore, flattenSnapshot, runInPage } from './interaction-core';

/** Ingest MCPDOM-captured network requests for a tab before listing. */
async function ingestTabNetwork(tabId: number | undefined): Promise<number> {
  if (tabId === undefined) return 0;
  try {
    const res = await unifiedRuntime.bridgeCommand('GET_TAB_NETWORK_REQUESTS', { tabId });
    const requests = (res as any)?.requests || (res as any)?.networkRequests || [];
    if (Array.isArray(requests) && requests.length > 0) {
      return unifiedRuntime.ingestNetworkRequests(requests);
    }
  } catch { /* capture unavailable in this mode */ }
  return 0;
}

async function ingestTabConsole(tabId: number | undefined): Promise<number> {
  if (tabId === undefined) return 0;
  try {
    const res = await unifiedRuntime.bridgeCommand('GET_TAB_CONSOLE_LOGS', { tabId });
    const logs = (res as any)?.logs || (res as any)?.entries || [];
    if (Array.isArray(logs) && logs.length > 0) {
      return unifiedRuntime.ingestConsoleMessages(logs);
    }
  } catch { /* capture unavailable in this mode */ }
  return 0;
}

export async function dtListNetworkRequests(args: Record<string, any>): Promise<Record<string, unknown>> {
  let ingested = 0;
  if (args.ingestTabId !== undefined) ingested = await ingestTabNetwork(args.ingestTabId);
  else if (args.tabId !== undefined) ingested = await ingestTabNetwork(args.tabId);
  const { pageId } = await resolvePageId(args);
  const filter: Record<string, any> = { pageId: args.pageId ? pageId : undefined, urlPattern: args.urlPattern, method: args.method, status: args.status, resourceType: args.resourceType, offset: args.offset, limit: args.limit };
  const { requests, total, mode } = unifiedRuntime.listNetworkRequests(filter);
  return {
    total,
    ingested,
    requests: requests.map(r => ({
      requestId: r.requestId,
      url: r.url,
      method: r.method,
      status: r.status,
      resourceType: r.resourceType,
      failed: r.failed,
      responseSize: r.responseSize,
      durationMs: r.durationMs,
      fromCache: r.fromCache,
    })),
    mode,
    note: total === 0 && ingested === 0
      ? 'Unified network log is empty in this context. With the extension connected, pass ingestTabId to pull the tab capture first; session analysis uses fx_resource_waterfall with a recorded session.'
      : undefined,
  };
}

export async function dtGetNetworkRequest(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.requestId) throw new Error('INVALID_INPUT: requestId is required.');
  const record = unifiedRuntime.getNetworkRequest(String(args.requestId));
  if (!record) throw new Error(`RESOURCE_EXHAUSTED: request '${args.requestId}' not found in the unified network log.`);
  const includeBody = args.includeBody !== false;
  return {
    ...record,
    responseBody: includeBody ? record.responseBody : undefined,
    requestBody: includeBody ? record.requestBody : undefined,
  };
}

export async function dtListConsoleMessages(args: Record<string, any>): Promise<Record<string, unknown>> {
  let ingested = 0;
  if (args.ingestTabId !== undefined) ingested = await ingestTabConsole(args.ingestTabId);
  else if (args.tabId !== undefined) ingested = await ingestTabConsole(args.tabId);
  const { pageId } = await resolvePageId(args);
  const { messages, total, mode } = unifiedRuntime.listConsoleMessages({
    level: args.level, searchQuery: args.searchQuery, pageId: args.pageId ? pageId : undefined, offset: args.offset, limit: args.limit,
  });
  return {
    total,
    ingested,
    messages,
    mode,
    note: total === 0 && ingested === 0
      ? 'Unified console log is empty in this context. With the extension connected, pass ingestTabId to pull the tab capture first.'
      : undefined,
  };
}

export async function dtGetConsoleMessage(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.messageId) throw new Error('INVALID_INPUT: messageId is required.');
  const { messages } = unifiedRuntime.listConsoleMessages({ limit: 10000 });
  const message = messages.find(m => m.messageId === String(args.messageId));
  if (!message) throw new Error(`RESOURCE_EXHAUSTED: console message '${args.messageId}' not found.`);
  return { ...message } as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Debugging
// ---------------------------------------------------------------------------

export async function dtEvaluateScript(args: Record<string, any>): Promise<Record<string, unknown>> {
  const script = String(args.script || '');
  if (!script.trim()) throw new Error('INVALID_INPUT: script must be a non-empty string.');
  if (script.length > 200000) throw new Error('INVALID_INPUT: script too large (200KB limit).');
  const { pageId, tabId } = await resolvePageId(args);

  // The execution engine evaluates code as an async function BODY.
  // Expressions get a leading `return`; bodies with their own return pass
  // through unchanged. awaitPromise wraps for promise support — the wrap
  // itself MUST start with `return` so the engine's body returns the value.
  const { normalizeForExecution } = await import('./interaction-core');
  const normalized = normalizeForExecution(script);
  const wrapped = args.awaitPromise === false
    ? normalized
    : `return Promise.resolve((async () => { ${normalized} })())`;
  const result = await unifiedRuntime.bridgeCommand('EXECUTE_JS', { code: wrapped, tabId });
  unifiedRuntime.bus.publish('RUNTIME', 'evaluate_script', { scriptLength: script.length }, { pageId });
  const envelope = result as any;
  return {
    evaluated: true,
    pageId,
    result: envelope?.result !== undefined ? envelope.result : envelope,
    execution: envelope?.status ? { status: envelope.status, durationMs: envelope.durationMs, executionId: envelope.executionId, consoleOutput: envelope.consoleOutput, domChanged: envelope.domChanged } : undefined,
  };
}

export async function dtTakeScreenshot(args: Record<string, any>): Promise<Record<string, unknown>> {
  const format = args.format === 'jpeg' ? 'jpeg' : 'png';
  const { pageId, tabId } = await resolvePageId(args);
  if (args.uid || args.selector) {
    const target = resolveTarget(args, pageId);
    if (!target.selector) throw new Error('INVALID_INPUT: uid or selector required for element capture.');
    const result = await unifiedRuntime.bridgeCommand('LIVE_ELEMENT_SCREENSHOT', { selector: target.selector, tabId, format });
    unifiedRuntime.bus.publish('SCREENSHOT', 'element_screenshot', { selector: target.selector }, { pageId, snapshotId: `shot_${Date.now()}` });
    return { captureType: 'ELEMENT', format, selector: target.selector, pageId, detail: result };
  }
  const result = await unifiedRuntime.bridgeCommand('LIVE_PAGE_SCREENSHOT', { tabId, format });
  unifiedRuntime.bus.publish('SCREENSHOT', 'page_screenshot', { full: true }, { pageId, snapshotId: `shot_${Date.now()}` });
  return { captureType: 'FULL_PAGE', format, pageId, detail: result };
}

export async function dtTakeSnapshot(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  let rootEl: Element | undefined;
  if (args.selector && typeof document !== 'undefined') {
    rootEl = document.querySelector(args.selector) || undefined;
    if (!rootEl) throw new Error(`TARGET_STALE: no element matches selector '${args.selector}'.`);
  } else if (args.selector) {
    const res = await unifiedRuntime.bridgeCommand('LIVE_DOM_SUBTREE', { selector: args.selector, tabId });
    return { snapshot: { rootSelector: args.selector, html: (res as any)?.html?.slice(0, 8000) }, pageId, note: 'Subtree snapshot via live DOM channel.' };
  }

  const { tree } = buildPageSnapshot(rootEl);
  const size = snapshotStore.store(pageId, tree);
  unifiedRuntime.bus.publish('DOM', 'semantic_snapshot', { nodes: size.snapshotSize }, { pageId, snapshotId: `snap_${Date.now()}` });
  return {
    pageId,
    totalNodes: size.snapshotSize,
    snapshot: flattenSnapshot(tree),
    usage: 'Use the uid values with dt_click / dt_fill / dt_hover input tools.',
  };
}

export async function dtScreencastStart(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  if (!unifiedRuntime.cdpAvailable()) {
    return {
      started: false,
      mode: 'UNAVAILABLE',
      note: 'Screencast requires a live CDP session (Page.startScreencast). Simulation never fakes frame streams.',
      pageId,
    };
  }
  const { cdpGateway } = await import('../runtime/cdp-gateway');
  const session = await cdpGateway.attach({ tabId });
  const result = await cdpGateway.send(session.sessionId, 'Page.startScreencast', {
    format: 'png',
    maxWidth: 1280,
    maxHeight: 720,
    everyNthFrame: 1,
  });
  return { started: true, pageId, cdpSession: session.sessionId, experimental: true, detail: result };
}

export async function dtScreencastStop(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  if (!unifiedRuntime.cdpAvailable()) {
    return { stopped: false, mode: 'UNAVAILABLE', note: 'No active CDP screencast to stop.', pageId };
  }
  const { cdpGateway } = await import('../runtime/cdp-gateway');
  const session = await cdpGateway.attach({ tabId });
  const result = await cdpGateway.send(session.sessionId, 'Page.stopScreencast', {});
  return { stopped: true, pageId, experimental: true, detail: result };
}

export async function dtLighthouseAudit(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  if (!unifiedRuntime.cdpAvailable()) {
    return {
      ran: false,
      mode: 'UNAVAILABLE',
      note: 'Lighthouse audits require a live DevTools connection. Audit results are never synthesized in simulation.',
      pageId,
    };
  }
  const { cdpGateway } = await import('../runtime/cdp-gateway');
  const session = await cdpGateway.attach({ tabId });
  // Trigger the DevTools frontend Lighthouse run through the extension's
  // devtools page connection (chrome.debugger gives protocol access; the
  // Lighthouse run itself is orchestrated by the DevTools panel).
  const result = await cdpGateway.send(session.sessionId, 'Lighthouse.run', {
    categories: args.categories || ['performance', 'accessibility', 'best-practices'],
  }).catch((err: Error) => {
    throw new Error(`UNSUPPORTED_OPERATION: Lighthouse orchestration unavailable on this target: ${err.message}`);
  });
  return { ran: true, pageId, experimental: true, detail: result };
}
