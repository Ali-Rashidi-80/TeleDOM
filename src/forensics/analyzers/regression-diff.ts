/**
 * CAP 02 — DOM Regression Diff.
 * Compares two page states (DOMSnapshots) across EIGHT dimensions:
 * added / removed / moved elements, changed attributes, styles, text,
 * layout-affecting properties and accessibility properties.
 * Produces machine-readable diff + human-readable report.
 */

import { DOMSnapshot, VirtualDOMNode } from '../../types/dom-node';
import { flattenSnapshot, FlatElement, selectorOfFlat } from '../session-access';

export type DiffDimension = 'added' | 'removed' | 'moved' | 'attributes' | 'styles' | 'text' | 'layout' | 'accessibility';

export interface DimensionDiff {
  dimension: DiffDimension;
  count: number;
  changes: Array<{
    selector: string;
    nodeId: number;
    detail: string;
    before?: string;
    after?: string;
  }>;
}

export interface RegressionDiffResult {
  machine: { dimensions: DimensionDiff[]; totals: Record<string, number> };
  human: string;
}

const LAYOUT_ATTRS = new Set(['width', 'height', 'style', 'class', 'hidden', 'align', 'valign', 'size', 'src', 'width', 'cols', 'rows']);
const A11Y_ATTRS = /^(aria-|role$|alt$|title$|tabindex$|lang$|dir$)/i;

/** Stable element key: tagName + id if present, else text signature + tag. */
function keyOf(el: FlatElement): string {
  if (el.attributes.id) return `#${el.attributes.id}`;
  const cls = el.attributes.class ? '.' + el.attributes.class.split(/\s+/).filter(Boolean).slice(0, 2).join('.') : '';
  const text = el.textContent.trim().slice(0, 30);
  return `${el.tagName}${cls}|${text}`;
}

export function regressionDiff(before: DOMSnapshot, after: DOMSnapshot, opts: { maxPerDimension?: number } = {}): RegressionDiffResult {
  const maxPer = opts.maxPerDimension ?? 40;
  const A = flattenSnapshot(before);
  const B = flattenSnapshot(after);

  const beforeKeys = new Map<string, FlatElement[]>();
  for (const el of A.elements) {
    const k = keyOf(el);
    const arr = beforeKeys.get(k) || [];
    arr.push(el);
    beforeKeys.set(k, arr);
  }
  const afterKeys = new Map<string, FlatElement[]>();
  for (const el of B.elements) {
    const k = keyOf(el);
    const arr = afterKeys.get(k) || [];
    arr.push(el);
    afterKeys.set(k, arr);
  }

  const dims: DimensionDiff[] = [];
  const totals: Record<string, number> = {};

  const push = (dimension: DiffDimension, change: DimensionDiff['changes'][number]) => {
    let dim = dims.find(d => d.dimension === dimension);
    if (!dim) { dim = { dimension, count: 0, changes: [] }; dims.push(dim); }
    if (dim.changes.length < maxPer) dim.changes.push(change);
    dim.count++;
    totals[dimension] = (totals[dimension] || 0) + 1;
  };

  // ---- added / removed ----
  for (const el of B.elements) {
    if (!beforeKeys.has(keyOf(el))) {
      push('added', { selector: selectorOfFlat(el, B.byId), nodeId: el.id, detail: `<${el.tagName}> appeared${el.textContent.trim() ? ` with text "${el.textContent.trim().slice(0, 40)}"` : ''}` });
    }
  }
  for (const el of A.elements) {
    if (!afterKeys.has(keyOf(el))) {
      push('removed', { selector: selectorOfFlat(el, A.byId), nodeId: el.id, detail: `<${el.tagName}> removed${el.textContent.trim() ? ` (had text "${el.textContent.trim().slice(0, 40)}")` : ''}` });
    }
  }

  // ---- matched pairs: moved / attributes / styles / text / layout / a11y ----
  for (const elB of B.elements) {
    const k = keyOf(elB);
    const pool = beforeKeys.get(k);
    if (!pool || pool.length === 0) continue;
    const elA = pool.shift()!;

    // moved: parent changed
    if ((elA.parentId ?? null) !== (elB.parentId ?? null)) {
      const parentA = elA.parentId != null ? (A.byId.get(elA.parentId)?.tagName ?? `#${elA.parentId}`) : 'root';
      const parentB = elB.parentId != null ? (B.byId.get(elB.parentId)?.tagName ?? `#${elB.parentId}`) : 'root';
      push('moved', { selector: selectorOfFlat(elB, B.byId), nodeId: elB.id, detail: `parent <${parentA}> → <${parentB}>` });
    }

    // attributes diff
    const attrNames = new Set([...Object.keys(elA.attributes), ...Object.keys(elB.attributes)]);
    for (const name of attrNames) {
      const a = elA.attributes[name];
      const b = elB.attributes[name];
      if (a === b) continue;
      const change = { selector: selectorOfFlat(elB, B.byId), nodeId: elB.id, detail: `attribute ${name}`, before: a === undefined ? '(absent)' : String(a).slice(0, 60), after: b === undefined ? '(absent)' : String(b).slice(0, 60) };
      if (name === 'style' || /--|^s(tyle)?$/i.test(name)) {
        push('styles', change);
      } else if (name === 'class') {
        push('styles', { ...change, detail: `class list: "${a ?? ''}" → "${b ?? ''}"` });
      } else if (LAYOUT_ATTRS.has(name)) {
        push('layout', change);
      } else if (A11Y_ATTRS.test(name)) {
        push('accessibility', change);
      } else {
        push('attributes', change);
      }
    }

    // text diff
    if (elA.textContent !== elB.textContent) {
      push('text', {
        selector: selectorOfFlat(elB, B.byId),
        nodeId: elB.id,
        detail: 'text content changed',
        before: elA.textContent.trim().slice(0, 50) || '(empty)',
        after: elB.textContent.trim().slice(0, 50) || '(empty)',
      });
    }

    // layout dimension: child count changes affect layout
    if (elA.childCount !== elB.childCount) {
      push('layout', {
        selector: selectorOfFlat(elB, B.byId),
        nodeId: elB.id,
        detail: `child count ${elA.childCount} → ${elB.childCount} (layout impact)`,
      });
    }

    // a11y dimension: interactive semantics changed
    const interactiveA = /^(a|button|input|select|textarea|img)$/i.test(elA.tagName);
    const interactiveB = /^(a|button|input|select|textarea|img)$/i.test(elB.tagName);
    if (interactiveA !== interactiveB) {
      push('accessibility', {
        selector: selectorOfFlat(elB, B.byId),
        nodeId: elB.id,
        detail: `semantic role change: <${elA.tagName}> → <${elB.tagName}>`,
      });
    }
    const nameA = elA.attributes['aria-label'] || elA.attributes.alt || '';
    const nameB = elB.attributes['aria-label'] || elB.attributes.alt || '';
    if (interactiveB && !nameA && !nameB && !elB.textContent.trim()) {
      push('accessibility', { selector: selectorOfFlat(elB, B.byId), nodeId: elB.id, detail: 'interactive element without accessible name' });
    }
  }

  // human readable report
  const lines: string[] = [];
  lines.push('# DOM Regression Diff');
  lines.push('');
  lines.push(`Elements: ${A.elements.length} → ${B.elements.length}`);
  lines.push('');
  for (const dim of dims) {
    lines.push(`## ${dim.dimension} (${dim.count})`);
    for (const c of dim.changes.slice(0, 10)) {
      lines.push(`- \`${c.selector}\` — ${c.detail}${c.before !== undefined ? ` [${c.before} → ${c.after}]` : ''}`);
    }
    if (dim.count > dim.changes.length) lines.push(`- … ${dim.count - dim.changes.length} more`);
    lines.push('');
  }
  if (dims.length === 0) lines.push('No differences detected across any dimension.');

  return { machine: { dimensions: dims, totals }, human: lines.join('\n') };
}

/** Compare two virtual nodes (helper for subtree-level diffs). */
export function nodeSignature(node: VirtualDOMNode): string {
  return `${node.tagName || '#text'}#${node.id}:${JSON.stringify(node.attributes || {})}:${(node.textContent || '').slice(0, 40)}`;
}
