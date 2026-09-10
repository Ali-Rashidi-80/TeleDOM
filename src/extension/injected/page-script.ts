(function () {
  // Prevent double instrumentation
  if ((window as any).__FORENSIC_PAGE_INSTRUMENTED__) return;
  (window as any).__FORENSIC_PAGE_INSTRUMENTED__ = true;

  const MAX_BUFFER_SIZE = 500;
  const consoleBuffer: any[] = [];
  const networkBuffer: any[] = [];

  (window as any).__FORENSIC_CONSOLE_BUFFER__ = consoleBuffer;
  (window as any).__FORENSIC_NETWORK_BUFFER__ = networkBuffer;

  const startTime = performance.now();

  function postForensicEvent(type: string, payload: any) {
    try {
      window.postMessage(
        {
          _forensicOrigin: 'PAGE_MAIN',
          type,
          payload,
          timestamp: performance.now(),
          wallClockTime: Date.now(),
        },
        '*'
      );
    } catch {
      // Ignored
    }
  }

  function pushConsole(entry: any) {
    consoleBuffer.push(entry);
    if (consoleBuffer.length > MAX_BUFFER_SIZE) {
      consoleBuffer.shift();
    }
    postForensicEvent('CONSOLE_ENTRY', entry);
  }

  function pushNetwork(entry: any) {
    networkBuffer.push(entry);
    if (networkBuffer.length > MAX_BUFFER_SIZE) {
      networkBuffer.shift();
    }
    postForensicEvent('NETWORK_ENTRY', entry);
  }

  // CAP 13 — Event listener instrumentation registry: patches
  // EventTarget.prototype.addEventListener at document_start so later
  // registrations are recorded with capture/passive flags and a handler
  // preview. Exposed as window.__mcpdom_listeners__ (bounded, §24).
  const listenerRegistry: any[] = [];
  (window as any).__mcpdom_listeners__ = listenerRegistry;
  const MAX_LISTENERS = 800;
  try {
    const proto = (window as any).EventTarget && (window as any).EventTarget.prototype;
    if (proto && typeof proto.addEventListener === 'function' && !(proto as any).__mcpdom_patched__) {
      const originalAdd = proto.addEventListener;
      (proto as any).__mcpdom_patched__ = true;
      proto.addEventListener = function (type: string, handler: any, options?: any) {
        try {
          if (typeof type === 'string' && typeof handler !== 'undefined') {
            const capture = typeof options === 'boolean' ? options : !!(options && options.capture);
            const passive = !!(options && options.passive);
            let handlerPreview: string | null = null;
            try {
              handlerPreview = typeof handler === 'function'
                ? String(handler).replace(/\s+/g, ' ').slice(0, 120)
                : String(handler).slice(0, 60);
            } catch { handlerPreview = null; }
            let frameworkHint: string | null = null;
            if (handlerPreview) {
              if (/react|__react|React\.|dispatchDiscrete/i.test(handlerPreview)) frameworkHint = 'react';
              else if (/__vue|Vue\.|_withCtx/i.test(handlerPreview)) frameworkHint = 'vue';
              else if (/\bng[A-Z]|Angular|zone\.js/i.test(handlerPreview)) frameworkHint = 'angular';
              else if (/\$\(jQuery|jQuery/i.test(handlerPreview)) frameworkHint = 'jquery';
            }
            let elementRef: any = null;
            try {
              if (this && (this instanceof (window as any).Element || this === (window as any).document || this === window)) {
                elementRef = this;
              }
            } catch { elementRef = null; }
            listenerRegistry.push({
              type, capture, passive, handlerPreview, frameworkHint, elementRef,
              target: elementRef && elementRef.tagName ? elementRef.tagName.toLowerCase() + (elementRef.id ? '#' + elementRef.id : '') : String(elementRef === window ? 'window' : elementRef === (window as any).document ? 'document' : 'other'),
              registeredAt: Date.now(),
            });
            if (listenerRegistry.length > MAX_LISTENERS) listenerRegistry.shift();
          }
        } catch { /* instrumentation must never break page behavior */ }
        return originalAdd.apply(this, arguments as any);
      };
    }
  } catch { /* EventTarget patch unavailable */ }

  // 1. Console Interception
  const originalConsole: Record<string, Function> = {};
  const levels: Array<'log' | 'warn' | 'error' | 'info' | 'debug'> = ['log', 'warn', 'error', 'info', 'debug'];

  levels.forEach((level) => {
    const orig = (console as any)[level];
    if (typeof orig === 'function') {
      originalConsole[level] = orig;
      (console as any)[level] = function (...args: any[]) {
        try {
          const formattedArgs = args.map((arg) => {
            try {
              if (typeof arg === 'string') return arg;
              if (typeof arg === 'number' || typeof arg === 'boolean' || arg === null || arg === undefined) return String(arg);
              if (arg instanceof Error) return `${arg.name}: ${arg.message}\n${arg.stack || ''}`;
              return JSON.stringify(arg, Object.getOwnPropertyNames(arg));
            } catch {
              return String(arg);
            }
          });

          const text = formattedArgs.join(' ');
          const entry = {
            id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            timestamp: Date.now(),
            relativeMs: Math.round(performance.now() - startTime),
            level,
            text,
            args: formattedArgs,
            source: 'console',
          };
          pushConsole(entry);
        } catch {
          // Never break application execution
        }
        return orig.apply(console, args);
      };
    }
  });

  // 2. Uncaught Global Errors
  window.addEventListener('error', (e) => {
    try {
      const entry = {
        id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        relativeMs: Math.round(performance.now() - startTime),
        level: 'error',
        text: `Uncaught Error: ${e.message || 'Script error'}`,
        source: e.filename || 'unknown',
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
      };
      pushConsole(entry);
      postForensicEvent('RUNTIME_ERROR', {
        message: e.message || 'Script Error',
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack,
        name: e.error?.name || 'Error',
      });
    } catch {
      // Ignored
    }
  });

  // 3. Unhandled Promise Rejections
  window.addEventListener('unhandledrejection', (e) => {
    try {
      let message = 'Unhandled Promise Rejection';
      let stack: string | undefined;
      if (e.reason instanceof Error) {
        message = e.reason.message;
        stack = e.reason.stack;
      } else if (typeof e.reason === 'string') {
        message = e.reason;
      } else {
        try {
          message = JSON.stringify(e.reason);
        } catch {
          message = String(e.reason);
        }
      }

      const entry = {
        id: `rejection_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
        relativeMs: Math.round(performance.now() - startTime),
        level: 'error',
        text: `Unhandled Promise Rejection: ${message}`,
        stack,
        source: 'unhandledrejection',
      };
      pushConsole(entry);
      postForensicEvent('RUNTIME_UNHANDLED_REJECTION', {
        message,
        stack,
        isUnhandledRejection: true,
      });
    } catch {
      // Ignored
    }
  });

  // 4. Fetch Interception
  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = async function (...args: any[]) {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const reqStart = performance.now();
      const input = args[0];
      const init = args[1];

      let rawUrl = '';
      if (typeof input === 'string') rawUrl = input;
      else if (input instanceof URL) rawUrl = input.toString();
      else if (input && typeof input === 'object' && 'url' in input) rawUrl = input.url;

      const method = (init?.method || (typeof input === 'object' && 'method' in input ? input.method : 'GET') || 'GET').toUpperCase();

      const requestEntry: any = {
        requestId,
        timestamp: Date.now(),
        relativeMs: Math.round(reqStart - startTime),
        method,
        url: rawUrl,
        initiator: 'fetch',
        completed: false,
      };

      try {
        const response = await (originalFetch as any).apply(window, args);
        const durationMs = Math.round(performance.now() - reqStart);
        requestEntry.status = response.status;
        requestEntry.statusText = response.statusText;
        requestEntry.durationMs = durationMs;
        requestEntry.completed = true;

        pushNetwork({ ...requestEntry });
        return response;
      } catch (err: any) {
        const durationMs = Math.round(performance.now() - reqStart);
        requestEntry.error = err.message || 'Fetch failed';
        requestEntry.durationMs = durationMs;
        requestEntry.completed = true;

        pushNetwork({ ...requestEntry });
        throw err;
      }
    };
  }

  // 5. XMLHttpRequest Interception
  if (typeof XMLHttpRequest !== 'undefined' && XMLHttpRequest.prototype) {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (...args: any[]) {
      (this as any).__forensic_method = String(args[0] || 'GET').toUpperCase();
      (this as any).__forensic_url = String(args[1] || '');
      (this as any).__forensic_reqId = `xhr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      return origOpen.apply(this, args as any);
    };

    XMLHttpRequest.prototype.send = function (...args: any[]) {
      const reqId = (this as any).__forensic_reqId || `xhr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const method = (this as any).__forensic_method || 'GET';
      const url = (this as any).__forensic_url || '';
      const reqStart = performance.now();

      const requestEntry: any = {
        requestId: reqId,
        timestamp: Date.now(),
        relativeMs: Math.round(reqStart - startTime),
        method,
        url,
        initiator: 'xmlhttprequest',
        completed: false,
      };

      this.addEventListener('loadend', () => {
        const durationMs = Math.round(performance.now() - reqStart);
        requestEntry.status = this.status;
        requestEntry.statusText = this.statusText;
        requestEntry.durationMs = durationMs;
        requestEntry.completed = true;
        if (this.status >= 400 || this.status === 0) {
          requestEntry.error = this.status === 0 ? 'Network Error' : `HTTP ${this.status} ${this.statusText}`;
        }
        pushNetwork({ ...requestEntry });
      });

      return origSend.apply(this, args as any);
    };
  }

  // 6. Listen for Content Script queries
  window.addEventListener('message', (event) => {
    if (event.data?._forensicTarget === 'PAGE_QUERY') {
      const { queryType, queryId } = event.data;
      if (queryType === 'GET_CONSOLE') {
        window.postMessage(
          {
            _forensicOrigin: 'PAGE_RESPONSE',
            queryId,
            data: [...consoleBuffer],
          },
          '*'
        );
      } else if (queryType === 'GET_NETWORK') {
        window.postMessage(
          {
            _forensicOrigin: 'PAGE_RESPONSE',
            queryId,
            data: [...networkBuffer],
          },
          '*'
        );
      } else if (queryType === 'CLEAR_CONSOLE') {
        consoleBuffer.length = 0;
        window.postMessage({ _forensicOrigin: 'PAGE_RESPONSE', queryId, success: true }, '*');
      } else if (queryType === 'CLEAR_NETWORK') {
        networkBuffer.length = 0;
        window.postMessage({ _forensicOrigin: 'PAGE_RESPONSE', queryId, success: true }, '*');
      }
    }
  });
})();
