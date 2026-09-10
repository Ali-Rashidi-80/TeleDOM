/**
 * INPUT AUTOMATION capability family (chrome-devtools-mcp input tools,
 * integrated natively over MCPDOM interaction channels).
 */

import { unifiedRuntime } from '../runtime/unified-browser-runtime';
import { resolveTarget, resolvePageId, snapshotStore, runInPage } from './interaction-core';
import { cdpGateway } from '../runtime/cdp-gateway';

async function interact(args: Record<string, any>, action: string, extra: Record<string, any> = {}): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  let target = resolveTarget(args, pageId);
  if (!target.selector) {
    // press_key is page-level in chrome-devtools-mcp — default the target
    // to the active element/body when no uid/selector is provided.
    if (action === 'press_key') {
      target = { selector: 'body' };
    } else {
      throw new Error('INVALID_INPUT: provide uid (from dt_take_snapshot) or selector.');
    }
  }

  const payload = {
    action,
    target: tabId !== undefined ? { tabId, selector: target.selector } : { selector: target.selector },
    ...extra,
  };

  const result = await unifiedRuntime.bridgeCommand('LIVE_ELEMENT_INTERACT', payload);
  unifiedRuntime.bus.publish('INTERACTION', `dt_${action}`, {
    action, selector: target.selector, uid: target.uid, success: true,
  }, { pageId, correlationId: `act_${Date.now()}` });

  let snapshotSection: Record<string, unknown> | undefined;
  if (args.includeSnapshot) {
    snapshotSection = { note: 'Pass includeSnapshot to dt_take_snapshot separately for a fresh semantic snapshot.' };
  }
  return {
    performed: action,
    selector: target.selector,
    uid: target.uid,
    pageId,
    interaction: result,
    ...(snapshotSection || {}),
  };
}

export async function dtClick(args: Record<string, any>): Promise<Record<string, unknown>> {
  return interact(args, args.dblClick ? 'double_click' : 'click');
}

export async function dtHover(args: Record<string, any>): Promise<Record<string, unknown>> {
  return interact(args, 'hover');
}

export async function dtTypeText(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (typeof args.text !== 'string') throw new Error('INVALID_INPUT: text is required for dt_type_text.');
  const result = await interact(args, 'type', { text: args.text });
  if (args.submitKey) {
    await interact(args, 'press_key', { key: args.submitKey });
    (result as any).submitKey = args.submitKey;
  }
  return result;
}

export async function dtFill(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (typeof args.value !== 'string') throw new Error('INVALID_INPUT: value is required for dt_fill.');
  // fill = clear + type (chrome-devtools-mcp semantics)
  await interact(args, 'clear');
  const result = await interact(args, 'type', { text: args.value });
  if (args.submitKey) {
    await interact(args, 'press_key', { key: args.submitKey });
    (result as any).submitKey = args.submitKey;
  }
  return result;
}

export async function dtFillForm(args: Record<string, any>): Promise<Record<string, unknown>> {
  const fields = args.fields;
  if (!Array.isArray(fields) || fields.length === 0) throw new Error('INVALID_INPUT: fields must be a non-empty array of {uid|selector, value, submitKey?}.');
  if (fields.length > 30) throw new Error('INVALID_INPUT: fields limited to 30 entries per call.');
  const { pageId, tabId } = await resolvePageId(args);
  const results: Array<Record<string, unknown>> = [];
  for (const field of fields) {
    const target = resolveTarget({ uid: field.uid, selector: field.selector }, pageId);
    if (!target.selector) throw new Error('INVALID_INPUT: every field needs uid or selector.');
    await unifiedRuntime.bridgeCommand('LIVE_ELEMENT_INTERACT', {
      action: 'clear',
      target: tabId !== undefined ? { tabId, selector: target.selector } : { selector: target.selector },
    });
    const r = await unifiedRuntime.bridgeCommand('LIVE_ELEMENT_INTERACT', {
      action: 'type',
      target: tabId !== undefined ? { tabId, selector: target.selector } : { selector: target.selector },
      text: String(field.value ?? ''),
    });
    if (field.submitKey) {
      await unifiedRuntime.bridgeCommand('LIVE_ELEMENT_INTERACT', {
        action: 'press_key',
        target: tabId !== undefined ? { tabId, selector: target.selector } : { selector: target.selector },
        key: field.submitKey,
      });
    }
    results.push({ selector: target.selector, uid: field.uid, value: field.value, success: !!(r as any)?.success });
  }
  unifiedRuntime.bus.publish('INTERACTION', 'fill_form', { fields: results.length, pageId }, { pageId });
  return { filled: results.filter(r => r.success).length, total: fields.length, pageId, fields: results };
}

export async function dtPressKey(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (!args.key || typeof args.key !== 'string') throw new Error('INVALID_INPUT: key is required (e.g. "Enter", "Control+a").');
  return interact(args, 'press_key', { key: args.key });
}

export async function dtUploadFile(args: Record<string, any>): Promise<Record<string, unknown>> {
  const files = args.files;
  if (!Array.isArray(files) || files.length === 0) throw new Error('INVALID_INPUT: files must be a non-empty array of paths/names.');
  const { pageId, tabId } = await resolvePageId(args);
  const target = resolveTarget(args, pageId);
  if (!target.selector) throw new Error('INVALID_INPUT: provide uid or selector of the file input.');

  // File inputs cannot be set via attributes; the real mechanism is a
  // DataTransfer assignment (purpose-built script, not a generic eval).
  // Environments without DataTransfer (JSDOM) fall back to a property-level
  // FileList stand-in — events still dispatch for real; the mechanism is
  // reported honestly.
  const fileNames = files.map(f => String(f).split(/[\\/]/).pop() || 'file.bin');
  const code = `(function(){
    const el = document.querySelector(${JSON.stringify(target.selector)});
    if (!el) return { set: false, reason: 'TARGET_STALE: element not found' };
    if (!(el instanceof HTMLInputElement) || el.type !== 'file') return { set: false, reason: 'INVALID_INPUT: target is not a file input' };
    const names = ${JSON.stringify(fileNames)};
    var mechanism;
    if (typeof DataTransfer === 'function') {
      const dt = new DataTransfer();
      for (const n of names) dt.items.add(new File([new Blob([''])], n));
      el.files = dt.files;
      mechanism = 'DataTransfer';
    } else {
      const fileList = { length: names.length, item: (i) => ({ name: names[i], size: 0, type: '' }) };
      names.forEach((n, i) => { fileList[i] = { name: n, size: 0, type: '' }; });
      Object.defineProperty(el, 'files', { value: fileList, configurable: true });
      mechanism = 'FileList-property (DataTransfer unavailable in this context)';
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return { set: true, acceptedFiles: names, mechanism: mechanism };
  })()`;

  const payload = await runInPage(code, tabId);
  if (payload && (payload as any).set === false) {
    throw new Error(String((payload as any).reason || 'upload failed'));
  }
  unifiedRuntime.bus.publish('INTERACTION', 'upload_file', { files: fileNames }, { pageId });
  return { uploaded: true, files: fileNames, selector: target.selector, pageId, detail: payload };
}

export async function dtDrag(args: Record<string, any>): Promise<Record<string, unknown>> {
  const { pageId, tabId } = await resolvePageId(args);
  const from = resolveTarget({ uid: args.fromUid, selector: args.fromSelector }, pageId);
  const to = args.toUid || args.toSelector
    ? resolveTarget({ uid: args.toUid, selector: args.toSelector }, pageId)
    : null;
  if (!from.selector) throw new Error('INVALID_INPUT: fromUid or fromSelector is required.');
  if (!to?.selector && (args.toX === undefined || args.toY === undefined)) {
    throw new Error('INVALID_INPUT: provide toUid/toSelector or toX/toY.');
  }

  // Route through the MCPDOM drag channel (HTML5 + pointer sequence).
  // The controller expects { source, target, offsets } targeting shapes.
  const result = await unifiedRuntime.bridgeCommand('DRAG_ELEMENT', {
    source: from.selector,
    target: to?.selector || undefined,
    offsets: args.toX !== undefined || args.toY !== undefined ? { x: args.toX, y: args.toY } : undefined,
    tabId,
  });
  unifiedRuntime.bus.publish('INTERACTION', 'drag', { from: from.selector, to: to?.selector || `${args.toX},${args.toY}` }, { pageId });
  return { dragged: true, from: from.selector, to: to?.selector ?? { x: args.toX, y: args.toY }, pageId, detail: result };
}

export async function dtClickAt(args: Record<string, any>): Promise<Record<string, unknown>> {
  const x = Number(args.x);
  const y = Number(args.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('INVALID_INPUT: x and y must be numbers.');
  const { pageId, tabId } = await resolvePageId(args);

  // Vision-assisted resolution: identify the element under the point first.
  // Layout-less contexts (JSDOM) have no elementFromPoint — the probe reports
  // hitTesting: false and the click dispatches at document level (bubbling).
  const probe = `(function(){
    if (typeof document.elementFromPoint !== 'function') {
      return { hit: false, hitTesting: false, note: 'No layout engine — coordinate hit-testing unavailable; click dispatched at document level (bubbles to handlers).' };
    }
    const el = document.elementFromPoint(${x}, ${y});
    if (!el) return { hit: false, hitTesting: true };
    return { hit: true, hitTesting: true, tagName: el.tagName.toLowerCase(), id: el.id || null,
      selector: (el.id ? '#' + el.id : el.tagName.toLowerCase()), text: (el.textContent||'').trim().slice(0,40) };
  })()`;
  const hit = await runInPage(probe, tabId);

  const code = `(function(){
    const el = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(${x}, ${y}) : null;
    const target = el || document.body || document.documentElement;
    if (!target) return { clicked: false, reason: 'TARGET_STALE: no element available to receive the click' };
    const opts = { bubbles: true, cancelable: true, clientX: ${x}, clientY: ${y}, view: window };
    target.dispatchEvent(new MouseEvent('pointerdown', opts));
    target.dispatchEvent(new MouseEvent('mousedown', opts));
    target.dispatchEvent(new MouseEvent('pointerup', opts));
    target.dispatchEvent(new MouseEvent('mouseup', opts));
    target.dispatchEvent(new MouseEvent('click', opts));
    return { clicked: true, dispatchTarget: el ? el.tagName.toLowerCase() : 'document-level', tagName: target.tagName.toLowerCase(), id: target.id || null };
  })()`;
  const payload = await runInPage(code, tabId);
  if (payload && (payload as any).clicked === false) throw new Error(String((payload as any).reason));
  unifiedRuntime.bus.publish('INTERACTION', 'click_at', { x, y, hit: hit?.tagName, hitTesting: hit?.hitTesting !== false }, { pageId });
  return { clicked: true, x, y, resolvedElement: hit, pageId, detail: payload };
}

export async function dtHandleDialog(args: Record<string, any>): Promise<Record<string, unknown>> {
  if (typeof args.accept !== 'boolean') throw new Error('INVALID_INPUT: accept (boolean) is required.');
  const { pageId, tabId } = await resolvePageId(args);

  // Live: CDP Page.handleJavaScriptDialog. Simulation: report the contract.
  if (cdpGateway.isAvailable() && unifiedRuntime.cdpAvailable()) {
    const session = await cdpGateway.attach({ tabId });
    const result = await cdpGateway.send(session.sessionId, 'Page.handleJavaScriptDialog', {
      accept: args.accept,
      promptText: args.promptText || '',
    });
    unifiedRuntime.bus.publish('RUNTIME', 'dialog_handled', { accept: args.accept }, { pageId });
    return { handled: true, accept: args.accept, promptText: args.promptText, pageId, cdp: true, detail: result };
  }
  return {
    handled: false,
    mode: 'UNAVAILABLE',
    note: 'Dialog handling requires a live CDP session (Page.handleJavaScriptDialog). Attach the extension and start a CDP session (dt_performance_start_trace attaches implicitly). JSDOM has no modal dialogs to handle.',
    pageId,
  };
}
