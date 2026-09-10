import { JSExecutionResult, JSExecutionStatus } from '../types/browser-control';

/**
 * §18 / §49 JavaScript Execution Engine
 *
 * Secure, observable JavaScript execution with explicit outcome states:
 *   EXECUTED_SUCCESSFULLY / EXECUTED_WITH_ERROR / TIMED_OUT /
 *   SERIALIZATION_FAILED / BLOCKED_BY_CONTEXT / NOT_CONNECTED
 *
 * Features: requested-code recording, duration measurement, console capture,
 * DOM-length before/after comparison, safe result serialization, and strict
 * timeouts that never hang the bridge.
 */

export interface ConsoleCapture {
  entries: Array<{ level: string; text: string }>;
  install(): (win: Window) => void;
  restore(): void;
}

export class JSExecutionEngine {
  private executionCounter = 0;

  /**
   * Execute code in the context of the given document.
   * The code string is wrapped in an async IIFE with `return` support:
   *   agents may write `return document.title;`
   */
  public async execute(
    doc: Document,
    code: string,
    options: { timeoutMs?: number; world?: 'ISOLATED' | 'MAIN' } = {}
  ): Promise<JSExecutionResult> {
    const timeoutMs = Math.min(Math.max(options.timeoutMs ?? 5000, 100), 30000);
    const executionId = `js_${Date.now().toString(36)}_${++this.executionCounter}`;
    const win = doc.defaultView;

    if (!win) {
      return this.result(executionId, 'BLOCKED_BY_CONTEXT', 0, code, [], {
        name: 'NoWindow',
        message: 'The document has no associated window — execution context unavailable.',
      });
    }

    const domLengthBefore = doc.documentElement ? doc.documentElement.outerHTML.length : 0;
    const consoleEntries: Array<{ level: string; text: string }> = [];
    const restoreConsole = this.hookConsole(win, consoleEntries);

    let status: JSExecutionStatus = 'EXECUTED_SUCCESSFULLY';
    let resultValue: any;
    let error: JSExecutionResult['error'];
    let domLengthAfter = domLengthBefore;
    let timedOut = false;

    const startTime = Date.now();

    try {
      const runner = this.buildRunner(win, code);
      const timeoutPromise = new Promise<never>((_, reject) => {
        const t = setTimeout(() => {
          timedOut = true;
          reject(new Error(`Script timed out after ${timeoutMs}ms`));
        }, timeoutMs);
        // unref when available so Node can exit cleanly
        (t as any)?.unref?.();
      });
      resultValue = await Promise.race([runner, timeoutPromise]);
    } catch (err: any) {
      if (timedOut) {
        status = 'TIMED_OUT';
      } else {
        status = 'EXECUTED_WITH_ERROR';
      }
      error = {
        name: err?.name || 'Error',
        message: err?.message || String(err),
        stack: err?.stack ? String(err.stack).slice(0, 2000) : undefined,
      };
    }

    const durationMs = Date.now() - startTime;
    domLengthAfter = doc.documentElement ? doc.documentElement.outerHTML.length : 0;
    restoreConsole();

    const serialized = this.serialize(resultValue);
    if (status === 'EXECUTED_SUCCESSFULLY' && serialized.serializationFailed) {
      status = 'SERIALIZATION_FAILED';
      error = { name: 'SerializationError', message: serialized.message || 'Result could not be serialized.' };
    }

    return {
      status,
      executionId,
      durationMs,
      result: status === 'EXECUTED_SUCCESSFULLY' ? serialized.text : undefined,
      error,
      consoleOutput: consoleEntries.slice(0, 100),
      domChanged: domLengthBefore !== domLengthAfter,
      domLengthBefore,
      domLengthAfter,
      world: options.world || 'ISOLATED',
      timeoutMs,
      codePreview: code.length > 300 ? code.slice(0, 300) + '…' : code,
    };
  }

  private buildRunner(win: Window, code: string): Promise<any> {
    // Wrap user code so `return` works; async for await support.
    const wrapped = `(async function() {\n${code}\n})()`;
    const w = win as any;
    if (typeof w.eval !== 'function') {
      return Promise.reject(new Error('BLOCKED_BY_CONTEXT: window.eval is unavailable in this context.'));
    }
    try {
      const fn = w.eval(wrapped);
      if (fn && typeof fn.then === 'function') return fn;
      return Promise.resolve(fn);
    } catch (err: any) {
      return Promise.reject(err);
    }
  }

  private hookConsole(win: Window, entries: Array<{ level: string; text: string }>): () => void {
    const levels = ['log', 'warn', 'error', 'info', 'debug'] as const;
    const originals: Record<string, any> = {};
    const w = win as any;
    const MAX = 100;
    for (const level of levels) {
      const original = w.console?.[level];
      if (typeof original !== 'function') continue;
      originals[level] = original;
      try {
        w.console[level] = (...args: any[]) => {
          if (entries.length < MAX) {
            entries.push({ level, text: args.map(safeStringify).join(' ').slice(0, 300) });
          }
          try { original.apply(w.console, args); } catch { /* ignore */ }
        };
      } catch { /* console may be read-only */ }
    }
    return () => {
      for (const level of levels) {
        if (originals[level]) {
          try { w.console[level] = originals[level]; } catch { /* ignore */ }
        }
      }
    };
  }

  private serialize(value: any): { text?: string; serializationFailed?: boolean; message?: string } {
    if (value === undefined) return { text: 'undefined' };
    if (value === null) return { text: 'null' };
    try {
      if (typeof value === 'string') return { text: value.slice(0, 5000) };
      const json = JSON.stringify(value, replacer, 1);
      if (json === undefined) return { serializationFailed: true, message: 'JSON.stringify returned undefined (circular or non-serializable structure).' };
      return { text: json.length > 50000 ? json.slice(0, 50000) + '…[truncated]' : json };
    } catch (err: any) {
      return { serializationFailed: true, message: err?.message || 'Serialization failed.' };
    }
  }

  private result(
    executionId: string,
    status: JSExecutionStatus,
    durationMs: number,
    code: string,
    consoleOutput: Array<{ level: string; text: string }>,
    error?: JSExecutionResult['error']
  ): JSExecutionResult {
    return {
      status,
      executionId,
      durationMs,
      error,
      consoleOutput,
      domChanged: false,
      domLengthBefore: 0,
      domLengthAfter: 0,
      world: 'ISOLATED',
      timeoutMs: 5000,
      codePreview: code.length > 300 ? code.slice(0, 300) + '…' : code,
    };
  }
}

/**
 * JSON replacer that degrades DOM nodes into useful descriptors instead of
 * blowing up on circular structures.
 */
export function replacer(this: any, key: string, value: any): any {
  if (value && typeof value === 'object' && value.nodeType === 1) {
    const el = value as Element;
    return {
      __element: true,
      tag: el.tagName.toLowerCase(),
      id: el.getAttribute('id') || undefined,
      selector: el.tagName.toLowerCase() + (el.getAttribute('id') ? `#${el.getAttribute('id')}` : ''),
      text: (el.textContent || '').trim().slice(0, 60),
    };
  }
  if (typeof value === 'function') {
    return { __function: true, name: value.name || 'anonymous' };
  }
  if (value && value.nodeType === 9) return { __document: true, url: value.location?.href };
  return value;
}

export function safeStringify(v: any): string {
  try {
    if (typeof v === 'string') return v;
    if (v instanceof Error) return `${v.name}: ${v.message}`;
    const s = JSON.stringify(v, replacer);
    return s === undefined ? String(v) : s;
  } catch {
    return String(v);
  }
}
