/**
 * NAVIGATION + EMULATION capability families (chrome-devtools-mcp
 * pages/emulation tools) over the unified browser runtime.
 */

import { unifiedRuntime } from '../runtime/unified-browser-runtime';
import { runInPage } from './interaction-core';

export async function dtListPages(): Promise<Record<string, unknown>> {
  const { pages, mode, rawTabs } = await unifiedRuntime.listPages();
  return {
    total: pages.length,
    pages: pages.map(p => ({
      pageId: p.pageId,
      url: p.url,
      title: p.title,
      tabId: p.extensionTabId,
      cdpTargetId: p.cdpTargetId,
      frames: p.frames.length,
      navigations: p.navigations.length,
      sessionId: p.sessionId,
    })),
    mode,
    rawTabs: rawTabs.length,
  };
}

export async function dtSelectPage(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.pageId && args.tabId === undefined && args.index === undefined) {
    throw new Error('INVALID_INPUT: provide pageId, tabId or index.');
  }
  const { page, result, mode } = await unifiedRuntime.selectPage(args);
  return { selected: true, pageId: page.pageId, url: page.url, title: page.title, tabId: page.extensionTabId, mode, detail: result };
}

export async function dtNewPage(args: Record<string, any>): Promise<Record<string, unknown>> {
  const url = String(args.url || '');
  if (!/^(https?|file|about|chrome):/i.test(url)) {
    throw new Error('INVALID_INPUT: url must be an http(s)/file/about/chrome URL.');
  }
  const { page, result, mode } = await unifiedRuntime.newPage(url);
  return { opened: true, pageId: page.pageId, tabId: page.extensionTabId, url, mode, detail: result };
}

export async function dtClosePage(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { closed, page, mode } = await unifiedRuntime.closePage(args);
  return { closed, pageId: page?.pageId, url: page?.url, mode };
}

export async function dtNavigatePage(args: Record<string, any>): Promise<Record<string, unknown>> {
  const url = String(args.url || '');
  if (!/^(https?|file|about|chrome)/i.test(url)) {
    throw new Error('INVALID_INPUT: url must start with http(s)://, file://, about: or chrome://.');
  }
  const { pageId, tabId } = await (await import('./interaction-core')).resolvePageId(args);
  if (unifiedRuntime.hasBridge() && tabId !== undefined) {
    // Route through MCPDOM tab machinery (URL update via script injection through content script).
    const result = await unifiedRuntime.bridgeCommand('EXECUTE_JS', {
      code: `location.href = ${JSON.stringify(url)}; return ({ navigating: true, url: location.href });`,
      tabId,
    });
    const page = unifiedRuntime.identity.resolve({ tabId });
    if (page) unifiedRuntime.identity.recordNavigation(page.pageId, url, 'load');
    unifiedRuntime.bus.publish('NAVIGATION', 'navigate', { url, tabId }, { pageId });
    return { navigated: true, pageId, url, detail: result };
  }
  // Simulation: local controller tracks deterministic tab state.
  const controller = (globalThis as any).__MCPDOM_LOCAL_CONTROLLER__;
  const simTabId = tabId ?? 1;
  if (controller) {
    const res = await controller.handleCommand({
      id: `nav_${Date.now()}`, command: 'OPEN_TAB', timestamp: Date.now(),
      payload: { url, active: true },
    });
    const page = unifiedRuntime.identity.register({ url, title: 'Simulated Navigation', extensionTabId: res?.data?.tabId ?? simTabId });
    unifiedRuntime.identity.recordNavigation(page.pageId, url, 'load');
    unifiedRuntime.bus.publish('NAVIGATION', 'navigate', { url, simulated: true }, { pageId: page.pageId });
    return { navigated: true, pageId: page.pageId, url, simulated: true, mode: 'SIMULATED', detail: res?.data };
  }
  const page = unifiedRuntime.identity.register({ url, title: 'New Navigation' });
  return { navigated: true, pageId: page.pageId, url, simulated: true, mode: 'SIMULATED', note: 'No bridge/controller available — recorded navigation on a synthetic identity only.' };
}

export async function dtHistoryNavigation(args: Record<string, any>): Promise<Record<string, unknown>> {
  const direction = String(args.direction || '');
  if (!['back', 'forward', 'reload'].includes(direction)) {
    throw new Error('INVALID_INPUT: direction must be back | forward | reload.');
  }
  const { pageId, tabId } = await (await import('./interaction-core')).resolvePageId(args);
  if (unifiedRuntime.hasBridge()) {
    if (direction === 'reload') {
      const result = await unifiedRuntime.bridgeCommand('RELOAD_TAB', { tabId });
      return { performed: direction, pageId, detail: result };
    }
    const code = direction === 'back' ? 'history.back(); return ({ performed: "back" });' : 'history.forward(); return ({ performed: "forward" });';
    const result = await unifiedRuntime.bridgeCommand('EXECUTE_JS', { code, tabId });
    const page = pageId ? unifiedRuntime.identity.resolve({ pageId }) : null;
    if (page) unifiedRuntime.identity.recordNavigation(page.pageId, page.url, 'popstate');
    return { performed: direction, pageId, detail: result };
  }
  return {
    performed: false,
    mode: 'UNAVAILABLE',
    note: 'History navigation requires a live page context (bridge). JSDOM fixtures have no meaningful session history.',
    pageId,
  };
}

export async function dtWaitFor(args: Record<string, any>): Promise<Record<string, unknown>> {
  const condition = String(args.condition || '');
  const valid = ['load', 'domcontentloaded', 'networkidle', 'selector-visible'];
  if (!valid.includes(condition)) throw new Error(`INVALID_INPUT: condition must be one of ${valid.join(', ')}.`);
  const timeoutMs = Number(args.timeoutMs) || 8000;
  const { pageId, tabId } = await (await import('./interaction-core')).resolvePageId(args);
  const started = Date.now();

  const checkOnce = async (): Promise<{ met: boolean; state: Record<string, unknown> }> => {
    if (condition === 'selector-visible') {
      if (!args.selector) throw new Error('INVALID_INPUT: selector is required for selector-visible.');
      const probe = `(function(){
        const el = document.querySelector(${JSON.stringify(args.selector)});
        if (!el) return { met: false };
        const style = getComputedStyle(el);
        const visible = style.display !== 'none' && style.visibility !== 'hidden';
        return { met: visible, display: style.display, visibility: style.visibility };
      })()`;
      const payload = await runInPage(probe, tabId);
      return { met: !!payload?.met, state: payload || {} };
    }
    const probe = `(function(){
      const readyState = document.readyState;
      const inflight = (window.__mcpdom_net_inflight !== undefined) ? window.__mcpdom_net_inflight : 0;
      return { readyState, inflight };
    })()`;
    const payload = await runInPage(probe, tabId);
    const readyState = String(payload?.readyState || 'complete');
    if (condition === 'load') return { met: readyState === 'complete', state: payload };
    if (condition === 'domcontentloaded') return { met: readyState !== 'loading', state: payload };
    // networkidle: no inflight requests; without the counter fall back to readyState
    return { met: readyState === 'complete' && Number(payload?.inflight || 0) === 0, state: payload };
  };

  let last: { met: boolean; state: Record<string, unknown> } = { met: false, state: {} };
  while (Date.now() - started < Math.min(timeoutMs, 30000)) {
    last = await checkOnce().catch(err => {
      if (String(err.message).includes('INVALID_INPUT')) throw err;
      return { met: false, state: { error: err.message } };
    });
    if (last.met) {
      return { condition, met: true, waitedMs: Date.now() - started, pageId, state: last.state };
    }
    await new Promise(r => setTimeout(r, 150));
  }
  return { condition, met: false, timedOut: true, waitedMs: Date.now() - started, pageId, state: last.state };
}

// ---------------------------------------------------------------------------
// EMULATION
// ---------------------------------------------------------------------------

interface EmulationState {
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  userAgent?: string;
  cpuThrottlingRate?: number;
  networkConditions?: { downloadKbps?: number; uploadKbps?: number; latencyMs?: number };
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  colorScheme?: 'light' | 'dark';
  extraHeaders?: Record<string, string>;
  locale?: string;
  timezoneId?: string;
}

/** Emulation state per page (reversible — dt_emulate reset restores). */
const emulationState = new Map<string, { current: EmulationState; baseline: EmulationState }>();

export function currentEmulation(pageId: string): EmulationState {
  return emulationState.get(pageId)?.current || {};
}

export async function dtEmulate(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await (await import('./interaction-core')).resolvePageId(args);

  if (args.reset) {
    const entry = emulationState.get(pageId);
    if (unifiedRuntime.hasBridge()) {
      // Viewport reset through the MCPDOM reversible viewport controller.
      try { await unifiedRuntime.bridgeCommand('RESET_VIEWPORT', { tabId }); } catch { /* not viewing via extension */ }
      const baseline = entry?.baseline || {};
      if (baseline.viewport) {
        await unifiedRuntime.bridgeCommand('RESIZE_VIEWPORT', { ...baseline.viewport, tabId });
      }
    }
    emulationState.delete(pageId);
    unifiedRuntime.bus.publish('EMULATION', 'reset', { pageId }, { pageId });
    return { emulated: false, reset: true, pageId };
  }

  const patch: EmulationState = {};
  if (args.viewport && Number.isFinite(Number(args.viewport.width)) && Number.isFinite(Number(args.viewport.height))) {
    patch.viewport = { width: Number(args.viewport.width), height: Number(args.viewport.height) };
  }
  if (args.deviceScaleFactor !== undefined) patch.deviceScaleFactor = Number(args.deviceScaleFactor);
  if (args.userAgent !== undefined) patch.userAgent = String(args.userAgent);
  if (args.cpuThrottlingRate !== undefined) {
    const rate = Number(args.cpuThrottlingRate);
    if (rate < 1 || rate > 20) throw new Error('INVALID_INPUT: cpuThrottlingRate must be within 1–20.');
    patch.cpuThrottlingRate = rate;
  }
  if (args.networkConditions) {
    patch.networkConditions = {
      downloadKbps: args.networkConditions.downloadKbps !== undefined ? Number(args.networkConditions.downloadKbps) : undefined,
      uploadKbps: args.networkConditions.uploadKbps !== undefined ? Number(args.networkConditions.uploadKbps) : undefined,
      latencyMs: args.networkConditions.latencyMs !== undefined ? Number(args.networkConditions.latencyMs) : undefined,
    };
  }
  if (args.geolocation) {
    patch.geolocation = {
      latitude: Number(args.geolocation.latitude),
      longitude: Number(args.geolocation.longitude),
      accuracy: args.geolocation.accuracy !== undefined ? Number(args.geolocation.accuracy) : undefined,
    };
  }
  if (args.colorScheme) patch.colorScheme = args.colorScheme === 'dark' ? 'dark' : 'light';
  if (args.extraHeaders && typeof args.extraHeaders === 'object') patch.extraHeaders = args.extraHeaders;
  if (args.locale) patch.locale = String(args.locale);
  if (args.timezoneId) patch.timezoneId = String(args.timezoneId);
  if (Object.keys(patch).length === 0) {
    throw new Error('INVALID_INPUT: provide at least one emulation property (or reset: true).');
  }

  if (unifiedRuntime.hasBridge() && patch.viewport) {
    // Live viewport goes through the MCPDOM reversible viewport controller.
    await unifiedRuntime.bridgeCommand('RESIZE_VIEWPORT', { ...patch.viewport, tabId });
  }

  const entry = emulationState.get(pageId) || { current: {}, baseline: {} };
  if (!emulationState.has(pageId) && patch.viewport) {
    entry.baseline.viewport = { ...patch.viewport }; // baseline recorded on first emulate
  }
  entry.current = { ...entry.current, ...patch };
  emulationState.set(pageId, entry);
  unifiedRuntime.bus.publish('EMULATION', 'emulate', { ...patch, pageId }, { pageId });

  const cdpNote = unifiedRuntime.cdpAvailable()
    ? 'CDP-connected: CPU/network/UA/geo emulation applies to live DevTools domains.'
    : 'CPU throttling, network conditions, UA, geolocation and headers require a live CDP session; recorded here as emulation state and applied when CDP attaches.';

  return {
    emulated: true,
    pageId,
    applied: Object.keys(patch),
    current: entry.current,
    reversible: true,
    note: cdpNote,
  };
}

export async function dtResizePage(args: Record<string, any>): Promise<Record<string, unknown>> {
  const width = Number(args.width);
  const height = Number(args.height);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 100 || height < 100) {
    throw new Error('INVALID_INPUT: width/height must be numbers ≥ 100.');
  }
  const { pageId, tabId } = await (await import('./interaction-core')).resolvePageId(args);
  if (unifiedRuntime.hasBridge()) {
    const result = await unifiedRuntime.bridgeCommand('RESIZE_VIEWPORT', { width, height, tabId });
    return { resized: true, width, height, pageId, detail: result };
  }
  const controller = (globalThis as any).__MCPDOM_LOCAL_CONTROLLER__;
  if (controller) {
    const res = await controller.handleCommand({ id: `rs_${Date.now()}`, command: 'RESIZE_VIEWPORT', timestamp: Date.now(), payload: { width, height } });
    return { resized: !!res?.success, width, height, pageId, simulated: true, detail: res?.data };
  }
  return { resized: false, width, height, pageId, mode: 'UNAVAILABLE', note: 'Viewport resize requires the bridge or the local controller (simulation).' };
}
