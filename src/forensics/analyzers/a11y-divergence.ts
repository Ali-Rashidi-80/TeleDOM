/**
 * CAP 18 — Accessibility + DOM divergence analyzer.
 * Builds an accessibility view from the DOM (roles / names / states)
 * and compares it against the structural DOM to find: inaccessible
 * elements, semantic mismatches, missing names, hidden-but-relevant
 * content and unexpected accessible nodes.
 */

import { DOMSnapshot } from '../../types/dom-node';
import { flattenSnapshot, FlatElement, selectorOfFlat } from '../session-access';

export interface A11yNode {
  selector: string;
  role: string;
  name: string;
  accessible: boolean;
  hiddenFromA11y: boolean;
  interactive: boolean;
  issues: string[];
}

const INTERACTIVE_TAGS = /^(a|button|input|select|textarea|summary|details|menuitem|option|tab)$/i;
const LANDMARK_ROLES: Record<string, string> = { header: 'banner', main: 'main', nav: 'navigation', footer: 'contentinfo', aside: 'complementary', form: 'form', section: 'region' };

function computeRole(el: FlatElement): string {
  const explicit = el.attributes['role'];
  if (explicit) return explicit;
  const tag = el.tagName;
  if (LANDMARK_ROLES[tag]) return LANDMARK_ROLES[tag];
  if (tag === 'a') return el.attributes.href ? 'link' : 'generic';
  if (tag === 'button') return 'button';
  if (tag === 'input') {
    const type = (el.attributes.type || 'text').toLowerCase();
    if (type === 'checkbox') return 'checkbox';
    if (type === 'radio') return 'radio';
    if (type === 'submit' || type === 'button' || type === 'reset') return 'button';
    if (type === 'hidden') return 'presentation';
    return 'textbox';
  }
  if (tag === 'select') return 'combobox';
  if (tag === 'textarea') return 'textbox';
  if (tag === 'img') return 'img';
  if (tag === 'ul' || tag === 'ol') return 'list';
  if (tag === 'li') return 'listitem';
  if (tag === 'h1') return 'heading';
  if (tag === 'h2') return 'heading';
  if (tag === 'h3') return 'heading';
  if (tag === 'table') return 'table';
  return 'generic';
}

function computeName(el: FlatElement): string {
  const aria = el.attributes['aria-label'] || '';
  if (aria) return aria;
  const labelledBy = el.attributes['aria-labelledby'];
  if (labelledBy) return `(labelledby: ${labelledBy})`;
  const alt = el.attributes.alt;
  if (alt !== undefined) return alt;
  if (el.tagName === 'input' && ['submit', 'button', 'reset'].includes((el.attributes.type || '').toLowerCase())) {
    return el.attributes.value || '';
  }
  return el.textContent.trim().slice(0, 60);
}

export function analyzeA11yDivergence(input: { snapshot?: DOMSnapshot }): {
  a11yTree: A11yNode[];
  divergence: Array<{ kind: string; selector: string; detail: string; severity: 'error' | 'warn' | 'info' }>;
  summary: { domElements: number; accessibleNodes: number; interactiveWithoutName: number; hiddenButRelevant: number; divergenceCount: number };
} {
  const flat = input.snapshot ? flattenSnapshot(input.snapshot) : null;
  const elements = flat ? flat.elements : [];
  const byId = flat ? flat.byId : new Map<number, FlatElement>();
  const a11yTree: A11yNode[] = [];
  const divergence: Array<{ kind: string; selector: string; detail: string; severity: 'error' | 'warn' | 'info' }> = [];

  for (const el of elements) {
    const selector = selectorOfFlat(el, byId);
    const role = computeRole(el);
    const name = computeName(el);
    const hiddenAttr = el.attributes.hidden !== undefined || el.attributes['aria-hidden'] === 'true';
    const visuallyHidden = /display:\s*none|visibility:\s*hidden/i.test(el.attributes.style || '');
    const interactive = INTERACTIVE_TAGS.test(el.tagName) || ['button', 'link', 'checkbox', 'radio', 'textbox', 'combobox', 'menuitem', 'option', 'tab'].includes(role);
    const issues: string[] = [];

    if (hiddenAttr) {
      // hidden element WITH text content or interactive children → hidden-but-relevant
      const hasText = !!el.textContent.trim();
      if (hasText || interactive) {
        divergence.push({ kind: 'hidden-but-relevant', selector, detail: `Element is hidden (hidden/aria-hidden) but contains ${hasText ? 'text content' : 'an interactive role'} — verify the hiding is intentional.`, severity: 'warn' });
        issues.push('hidden-but-relevant');
      }
    }
    if (interactive && !name) {
      divergence.push({ kind: 'missing-name', selector, detail: `Interactive <${el.tagName}> role=${role} has NO accessible name (no aria-label, alt, label or text).`, severity: 'error' });
      issues.push('missing-name');
    }
    // semantic mismatch: interactive semantics lost (button → div)
    if (/^div|span$/i.test(el.tagName) && el.attributes.onclick && !el.attributes.role) {
      divergence.push({ kind: 'semantic-mismatch', selector, detail: `Clickable <${el.tagName}> without role="button" — not exposed as interactive to assistive tech.`, severity: 'warn' });
      issues.push('semantic-mismatch');
    }
    // img without alt
    if (el.tagName === 'img' && el.attributes.alt === undefined) {
      divergence.push({ kind: 'img-missing-alt', selector, detail: '<img> without alt attribute — name is undefined for screen readers.', severity: 'error' });
      issues.push('img-missing-alt');
    }
    // unexpected accessible node: element with role but no content
    if (el.attributes.role && !el.textContent.trim() && !interactive) {
      divergence.push({ kind: 'unexpected-accessible-node', selector, detail: `role="${role}" on an empty element — an accessible node with no name/content.`, severity: 'info' });
      issues.push('unexpected-accessible-node');
    }
    // link without href
    if (el.tagName === 'a' && !el.attributes.href && !el.attributes.role) {
      divergence.push({ kind: 'dead-anchor', selector, detail: '<a> without href — exposes generic role, not focusable link.', severity: 'info' });
      issues.push('dead-anchor');
    }

    a11yTree.push({
      selector,
      role,
      name,
      accessible: !hiddenAttr && !visuallyHidden && role !== 'presentation',
      hiddenFromA11y: hiddenAttr || visuallyHidden || role === 'presentation',
      interactive,
      issues,
    });
  }

  const interactiveWithoutName = a11yTree.filter(n => n.interactive && !n.name).length;
  const hiddenButRelevant = divergence.filter(d => d.kind === 'hidden-but-relevant').length;

  return {
    a11yTree: a11yTree.filter(n => n.interactive || n.issues.length > 0).slice(0, 120),
    divergence: divergence.slice(0, 60),
    summary: {
      domElements: elements.length,
      accessibleNodes: a11yTree.filter(n => n.accessible).length,
      interactiveWithoutName,
      hiddenButRelevant,
      divergenceCount: divergence.length,
    },
  };
}
