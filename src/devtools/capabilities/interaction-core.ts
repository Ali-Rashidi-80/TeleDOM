/**
 * Shared capability plumbing: uid resolution (dt_take_snapshot uids),
 * page selection, and dispatch through the unified runtime onto the
 * existing MCPDOM command channels (bridge → extension, or local
 * controller → JSDOM). Keeps every dt_ tool native to MCPDOM (§8).
 */

import { unifiedRuntime } from '../runtime/unified-browser-runtime';

export interface ResolvedTarget {
  selector?: string;
  uid?: string;
  pageId?: string;
  tabId?: number;
}

export interface PageSnapshotNode {
  uid: string;
  role: string;
  name: string;
  selector: string;
  tagName: string;
  interactive: boolean;
  value?: string;
  children: PageSnapshotNode[];
}

/** Per-page snapshot store: uid → selector for input tool resolution. */
class SnapshotStore {
  private latest = new Map<string, { tree: PageSnapshotNode[]; uidMap: Map<string, PageSnapshotNode>; takenAt: number }>();
  private uidCounter = 0;

  store(pageId: string, tree: PageSnapshotNode[]): { snapshotSize: number } {
    const uidMap = new Map<string, PageSnapshotNode>();
    const walk = (nodes: PageSnapshotNode[]) => {
      for (const n of nodes) { uidMap.set(n.uid, n); walk(n.children); }
    };
    walk(tree);
    this.latest.set(pageId, { tree, uidMap, takenAt: Date.now() });
    return { snapshotSize: uidMap.size };
  }

  resolve(pageId: string, uid: string): PageSnapshotNode | undefined {
    return this.latest.get(pageId)?.uidMap.get(uid);
  }

  get(pageId: string): { tree: PageSnapshotNode[]; takenAt: number } | undefined {
    const entry = this.latest.get(pageId);
    return entry ? { tree: entry.tree, takenAt: entry.takenAt } : undefined;
  }

  nextUid(): string {
    return `e${++this.uidCounter}`;
  }
}

export const snapshotStore = new SnapshotStore();

const INTERACTIVE_TAGS = new Set(['a', 'button', 'input', 'select', 'textarea', 'summary', 'details', 'option', 'label', 'menuitem', 'tab']);
const CLICKABLE_ROLES = new Set(['button', 'link', 'checkbox', 'radio', 'menuitem', 'option', 'tab', 'textbox', 'combobox', 'listbox', 'slider', 'switch']);

function roleOf(el: Element): string {
  const explicit = el.getAttribute('role');
  if (explicit) return explicit;
  const tag = el.tagName.toLowerCase();
  switch (tag) {
    case 'a': return el.getAttribute('href') ? 'link' : 'generic';
    case 'button': return 'button';
    case 'input': {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'submit' || type === 'button' || type === 'reset') return 'button';
      return 'textbox';
    }
    case 'select': return 'combobox';
    case 'textarea': return 'textbox';
    case 'img': return 'img';
    case 'ul': return 'list';
    case 'li': return 'listitem';
    case 'table': return 'table';
    case 'nav': return 'navigation';
    case 'main': return 'main';
    case 'header': return 'banner';
    case 'footer': return 'contentinfo';
    case 'form': return 'form';
    default: return 'generic';
  }
}

function nameOf(el: Element): string {
  const aria = el.getAttribute('aria-label') || el.getAttribute('title');
  if (aria) return aria;
  const labelledBy = el.getAttribute('aria-labelledby');
  if (labelledBy && typeof document !== 'undefined') {
    const label = document.getElementById(labelledBy);
    if (label) return (label.textContent || '').trim().slice(0, 80);
  }
  if (el.tagName.toLowerCase() === 'input') {
    const id = el.getAttribute('id');
    if (id && typeof document !== 'undefined') {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return (label.textContent || '').trim().slice(0, 80);
    }
    const type = el.getAttribute('type');
    if (type === 'submit' || type === 'button') return el.getAttribute('value') || '';
  }
  return (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80);
}

function selectorOf(el: Element): string {
  const id = el.getAttribute('id');
  if (id && typeof document !== 'undefined') {
    try {
      if (document.querySelectorAll(`#${CSS.escape ? CSS.escape(id) : id}`).length === 1) return `#${id}`;
    } catch { /* fall through */ }
  }
  const path: string[] = [];
  let cursor: Element | null = el;
  while (cursor && cursor.tagName && path.length < 8) {
    const seg = cursor.tagName.toLowerCase();
    const cursorId = cursor.getAttribute?.('id');
    if (cursorId) { path.unshift(`#${cursorId}`); break; }
    const parent: Element | null = cursor.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(c => c.tagName === cursor!.tagName);
      const idx = siblings.indexOf(cursor);
      path.unshift(seg + (siblings.length > 1 ? `:nth-of-type(${idx + 1})` : ''));
    } else {
      path.unshift(seg);
    }
    cursor = parent;
  }
  return path.join(' > ');
}

/** Build the semantic page snapshot from the live/simulated document. */
export function buildPageSnapshot(root?: Element): { tree: PageSnapshotNode[] } {
  const buildNode = (el: Element): PageSnapshotNode => {
    const tag = el.tagName.toLowerCase();
    const interactive = INTERACTIVE_TAGS.has(tag) || CLICKABLE_ROLES.has(roleOf(el)) || el.hasAttribute('onclick') || el.getAttribute('tabindex') !== null;
    const node: PageSnapshotNode = {
      uid: snapshotStore.nextUid(),
      role: roleOf(el),
      name: nameOf(el),
      selector: selectorOf(el),
      tagName: tag,
      interactive,
      children: [],
    };
    if (tag === 'input' || tag === 'select' || tag === 'textarea') {
      const value = (el as HTMLInputElement).value;
      if (value !== undefined && value !== '') node.value = String(value).slice(0, 40);
    }
    for (const child of Array.from(el.children)) {
      node.children.push(buildNode(child));
    }
    return node;
  };
  const tree: PageSnapshotNode[] = [];
  const scope = root || (typeof document !== 'undefined' ? document.body : null);
  if (scope) {
    for (const el of Array.from(scope.children)) tree.push(buildNode(el));
  }
  return { tree };
}

/** Resolve a uid/selector/page target to a dispatchable selector. */
export function resolveTarget(args: Record<string, any>, pageId: string): { selector?: string; uid?: string } {
  if (args.uid) {
    const node = snapshotStore.resolve(pageId, args.uid);
    if (!node) {
      throw new Error(`INVALID_INPUT: uid '${args.uid}' is not known. Take a fresh snapshot with dt_take_snapshot — uids reset after navigation.`);
    }
    return { selector: node.selector, uid: args.uid };
  }
  if (args.selector) return { selector: args.selector };
  return {};
}

/** Resolve the active page for a tool call (creating identity when needed). */
export async function resolvePageId(args: Record<string, any>): Promise<{ pageId: string; tabId?: number }> {
  if (args.pageId) return { pageId: args.pageId };
  if (args.tabId !== undefined) {
    const page = unifiedRuntime.identity.resolve({ tabId: args.tabId });
    if (page) return { pageId: page.pageId, tabId: args.tabId };
    const registered = unifiedRuntime.identity.register({ url: 'about:blank', extensionTabId: args.tabId });
    return { pageId: registered.pageId, tabId: args.tabId };
  }
  const pages = unifiedRuntime.identity.list();
  if (pages.length > 0) return { pageId: pages[pages.length - 1].pageId, tabId: pages[pages.length - 1].extensionTabId };
  const list = await unifiedRuntime.listPages();
  if (list.pages.length > 0) {
    const last = list.pages[list.pages.length - 1];
    return { pageId: last.pageId, tabId: last.extensionTabId };
  }
  // Simulation fallback: create a synthetic page identity for the fixture.
  const page = unifiedRuntime.identity.register({ url: (typeof document !== 'undefined' && document.location?.href) || 'https://app.internal/dashboard', title: 'Simulation Fixture' });
  return { pageId: page.pageId };
}

/** Serialize a snapshot node tree compactly (token efficiency §39). */
export function flattenSnapshot(tree: PageSnapshotNode[], maxNodes = 400): Array<{ uid: string; role: string; name: string; selector: string; interactive: boolean; value?: string; depth: number }> {
  const out: Array<{ uid: string; role: string; name: string; selector: string; interactive: boolean; value?: string; depth: number }> = [];
  const walk = (nodes: PageSnapshotNode[], depth: number) => {
    for (const n of nodes) {
      if (out.length >= maxNodes) return;
      out.push({ uid: n.uid, role: n.role, name: n.name, selector: n.selector, interactive: n.interactive, value: n.value, depth });
      walk(n.children, depth + 1);
    }
  };
  walk(tree, 0);
  return out;
}

/**
 * Execute a script in the page through the unified runtime's EXECUTE_JS
 * channel (bridge → extension in live mode; local controller → JSDOM in
 * simulation). Unwraps the JSExecutionResult envelope and parses the
 * serialized value. FAILS on execution errors (structured contract §41).
 *
 * IMPORTANT: the execution engine wraps code as an async function BODY,
 * so expression scripts (IIFEs) MUST be prefixed with `return` — this
 * helper normalizes that automatically.
 */
export async function runInPage(code: string, tabId?: number, timeoutMs?: number): Promise<any> {
  const normalized = normalizeForExecution(code);
  const raw = await unifiedRuntime.bridgeCommand('EXECUTE_JS', { code: normalized, tabId, timeoutMs });
  const envelope = raw as Record<string, any>;
  const status = String(envelope?.status || '');
  if (status && (status.includes('ERROR') || status.includes('TIMED_OUT') || status.includes('BLOCKED'))) {
    throw new Error(`TARGET_STALE/EXECUTION: ${status}: ${envelope?.error?.message || 'script execution failed'}`);
  }
  const result = envelope?.result;
  if (typeof result === 'string') {
    const trimmed = result.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try { return JSON.parse(trimmed); } catch { return result; }
    }
    if (trimmed === 'undefined' || trimmed === '') return undefined;
    return result;
  }
  return result ?? envelope;
}

/**
 * The js-execution engine evaluates code as `(async function () { code })()`
 * — a function BODY. Expression scripts need a leading `return` to yield
 * their value. Detection rules:
 *   • starts with `(`/`[`/`{`  → EXPRESSION (IIFE/object/array literal) →
 *     always prefix `return (…)` — inner line-start returns belong to the
 *     expression itself, not to the wrapper body;
 *   • already starts with `return` → body with explicit return → as-is;
 *   • contains a line-start `return` → body → as-is;
 *   • otherwise → single expression → prefix `return (…)`.
 */
export function normalizeForExecution(code: string): string {
  const trimmed = code.trim();
  const startsWithExpression = /^[[({]/.test(trimmed);
  const startsWithReturn = /^return\b/.test(trimmed);
  const hasLineStartReturn = /(^|\n)\s*return\b/.test(trimmed);
  if (startsWithExpression && !startsWithReturn) {
    return `return (${trimmed});`;
  }
  if (startsWithReturn || hasLineStartReturn) {
    return code;
  }
  // plain trailing expression (no returns anywhere): prefix
  return `return (${trimmed});`;
}
