/**
 * TeleDOM v4.1 — Browser Primitive Facade.
 *
 * A clean, stable, semantic td_* surface over the existing live tool
 * pipeline (browser-first; API is never required). Each facade tool is a
 * THIN routing wrapper — no intelligence, no interpretation:
 *
 *   td_browser_*  → navigation control
 *   td_dom_*      → observation / query / extraction
 *   td_target_*   → target identity, verification, description
 *   td_action_*   → interaction verbs
 *   td_wait       → condition-based waiting
 *   td_screenshot → visual evidence
 *   td_execute_script / td_network_inspect / td_console_read → escape hatches
 *
 * Everything routes through the FULL MCP pipeline (validation, recording,
 * live bridge + JSDOM fallback) — one code path, zero duplication.
 */

import { ToolPipeline } from './executor';

export interface FacadeResult {
  routedTo: string;
  payload: unknown;
}

function jsResult(value: unknown): { code: string } {
  return { code: `return JSON.stringify(${value});` };
}

export class BrowserFacade {
  constructor(private readonly pipeline: ToolPipeline) {}

  private async route(tool: string, args: Record<string, unknown>): Promise<FacadeResult> {
    const res = await this.pipeline.handleToolCall(tool, args as Record<string, any>);
    const text = res?.content?.[0]?.text ?? '';
    let payload: unknown = text;
    try { payload = JSON.parse(text); } catch { /* plain text */ }
    return { routedTo: tool, payload };
  }

  // ── navigation ─────────────────────────────────────────────────────────

  async navigate(url: string, opts?: { newTab?: boolean; waitForStable?: boolean }): Promise<FacadeResult> {
    if (opts?.newTab) {
      return this.route('open_tab', { url });
    }
    const res = await this.route('execute_javascript', { code: `window.location.href = ${JSON.stringify(url)}; return window.location.href;` });
    if (opts?.waitForStable !== false) {
      await this.route('wait_for_condition', { kind: 'dom_stable', timeoutMs: 8000 });
    }
    return res;
  }

  async back(): Promise<FacadeResult> {
    return this.route('execute_javascript', { code: 'window.history.back(); return window.location.href;' });
  }

  async forward(): Promise<FacadeResult> {
    return this.route('execute_javascript', { code: 'window.history.forward(); return window.location.href;' });
  }

  async refresh(): Promise<FacadeResult> {
    return this.route('reload_tab', {});
  }

  // ── observation ────────────────────────────────────────────────────────

  async inspect(scope?: { tabId?: number }): Promise<FacadeResult> {
    return this.route('inspect_live_page', { ...(scope?.tabId !== undefined ? { tabId: scope.tabId } : {}) });
  }

  async query(q: { query: string; tag?: string; attr?: string; attrValue?: string; limit?: number }): Promise<FacadeResult> {
    return this.route('search_dom', q);
  }

  async extract(spec: { selector: string; fields?: Record<string, string>; limit?: number }): Promise<FacadeResult> {
    // Dumb, universal extraction: works on ANY site (regular DOM, nested
    // lists) — the escape-hatch philosophy. Fields map output names to
    // JS expressions evaluated per element with `el` bound.
    const fields = spec.fields ?? { text: 'el.textContent.trim()', tag: 'el.tagName.toLowerCase()', attrs: 'JSON.stringify(el.dataset)' };
    const exprs = Object.entries(fields)
      .map(([name, expr]) => `${JSON.stringify(name)}: (()=>{ try { return ${expr}; } catch(e) { return null; } })()`)
      .join(',');
    const code = [
      `const els = Array.from(document.querySelectorAll(${JSON.stringify(spec.selector)})).slice(0, ${spec.limit ?? 100});`,
      `return JSON.stringify(els.map(el => ({ ${exprs} })));`,
    ].join('\n');
    return this.route('execute_javascript', { code });
  }

  async snapshot(format: 'html' | 'json' = 'html'): Promise<FacadeResult> {
    return this.route('get_live_dom_snapshot', { format });
  }

  // ── targeting ──────────────────────────────────────────────────────────

  async findTarget(target: { selector?: string; xpath?: string; text?: string }): Promise<FacadeResult> {
    if (target.selector) {
      return this.route('generate_element_target', { selector: target.selector });
    }
    if (target.xpath) {
      return this.route('generate_element_target', { target: { xpath: target.xpath } });
    }
    if (target.text) {
      // Text-first discovery (works when the agent knows intent, not CSS)
      const search = await this.route('search_dom', { query: target.text, limit: 10 });
      return { routedTo: 'search_dom→generate_element_target', payload: search.payload };
    }
    throw new Error('td_target_find requires one of: selector, xpath, text');
  }

  async verifyTarget(selector: string, opts?: { minConfidence?: number }): Promise<FacadeResult> {
    const target = await this.route('generate_element_target', { selector });
    const payload = target.payload as any;
    const confidence = typeof payload?.confidence === 'number' ? payload.confidence : 1;
    const resolved = !target.payload || (payload && payload.status !== 'TARGET_NOT_FOUND' && payload.error === undefined);
    return {
      routedTo: 'generate_element_target',
      payload: {
        selector,
        resolvable: resolved && confidence >= (opts?.minConfidence ?? 0),
        confidence,
        checkedAt: new Date().toISOString(),
      },
    };
  }

  async describeTarget(selector: string): Promise<FacadeResult> {
    const [accessibility, fingerprint] = await Promise.all([
      this.route('get_element_accessibility', { selector }).catch(() => null),
      this.route('get_element_fingerprint', { selector }).catch(() => null),
    ]);
    return {
      routedTo: 'get_element_accessibility+get_element_fingerprint',
      payload: { accessibility: accessibility?.payload, fingerprint: fingerprint?.payload },
    };
  }

  // ── interaction ────────────────────────────────────────────────────────

  private async interact(action: string, args: Record<string, unknown>): Promise<FacadeResult> {
    return this.route('interact_with_element', { action, ...args });
  }

  async click(selector: string): Promise<FacadeResult> { return this.interact('click', { selector }); }
  async type(selector: string, text: string): Promise<FacadeResult> { return this.interact('type', { selector, text }); }
  async select(selector: string, value: string): Promise<FacadeResult> { return this.interact('select_option', { selector, optionValue: value }); }
  async hover(selector: string): Promise<FacadeResult> { return this.interact('hover', { selector }); }

  async press(key: string): Promise<FacadeResult> {
    return this.route('press_keyboard_shortcut', { combo: key });
  }

  async scroll(delta: { x?: number; y?: number } | { selector: string }): Promise<FacadeResult> {
    if ('selector' in delta) {
      return this.interact('scroll_into_view', { selector: delta.selector });
    }
    return this.route('scroll_page', { x: delta.x ?? 0, y: delta.y ?? 0 });
  }

  // ── wait / evidence / escape hatches ───────────────────────────────────

  async wait(condition: {
    kind: 'dom_stable' | 'selector_present' | 'selector_visible' | 'selector_absent' | 'text_present' | 'url_contains' | 'element_count' | 'readiness_state';
    selector?: string; text?: string; count?: number; timeoutMs?: number;
  }): Promise<FacadeResult> {
    return this.route('wait_for_condition', condition as Record<string, unknown>);
  }

  async screenshot(): Promise<FacadeResult> {
    return this.route('capture_page_screenshot', {});
  }

  async executeScript(code: string, timeoutMs?: number): Promise<FacadeResult> {
    return this.route('execute_javascript', { code, ...(timeoutMs ? { timeoutMs } : {}) });
  }

  async networkInspect(filter?: { urlContains?: string; limit?: number }): Promise<FacadeResult> {
    const res = await this.route('get_tab_network_requests', {});
    if (!filter?.urlContains) return res;
    const payload = res.payload as any;
    const requests = Array.isArray(payload?.requests) ? payload.requests.filter((r: any) => String(r?.url ?? '').includes(filter.urlContains ?? '')) : [];
    return { routedTo: 'get_tab_network_requests', payload: { ...payload, requests: requests.slice(0, filter.limit ?? 50), filteredBy: filter.urlContains } };
  }

  async consoleRead(level?: string): Promise<FacadeResult> {
    const res = await this.route('get_tab_console_logs', {});
    if (!level || level === 'all') return res;
    const payload = res.payload as any;
    const logs = Array.isArray(payload?.logs) ? payload.logs.filter((l: any) => String(l?.level ?? l?.type ?? '').toLowerCase() === level.toLowerCase()) : [];
    return { routedTo: 'get_tab_console_logs', payload: { ...payload, logs, filteredBy: level } };
  }
}
