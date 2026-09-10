import { DOMFingerprint } from '../types/browser-control';

/**
 * §35 DOM Fingerprinting Engine
 *
 * Creates robust structural fingerprints that remain useful after common DOM
 * changes. Deliberately avoids over-reliance on:
 *   - random generated ids
 *   - volatile framework-generated class names (css-*, jsx-*, sc-*, emotion junk)
 *   - exact text when it is likely dynamic (numbers, timestamps)
 *
 * The fingerprint combines a stable hash with explainable component evidence
 * so downstream consumers (selector recovery, region quality scoring) can
 * reason about WHY a fingerprint matched or drifted.
 */

/** Class names produced by CSS-in-JS frameworks — treated as volatile. */
const VOLATILE_CLASS_PATTERNS: RegExp[] = [
  /^css-/,
  /^jsx-/,
  /^sc-[A-Za-z]/,
  /^emotion/,
  /^chakra-/,
  /^mantine-/i,
  /^_ng[a-z]/,
  /^ng-/i,
  /^v-/,
  // hashed utility garbage: letters+digits mix (must contain a digit so real
  // words like "navigation" or "container" are never flagged)
  /^(?=.*\d)[a-z0-9]{6,12}$/i,
  /^data-v-/,
];

/** Attributes that survive refactors and carry semantic meaning. */
const STABLE_ATTRIBUTE_NAMES = [
  'id',
  'name',
  'data-testid',
  'data-test',
  'data-id',
  'data-qa',
  'data-cy',
  'data-component',
  'data-role',
  'aria-label',
  'aria-labelledby',
  'aria-describedby',
  'role',
  'type',
  'href',
  'for',
  'title',
  'alt',
  'rel',
  'placeholder',
];

/**
 * Lightweight FNV-1a 32-bit hash — deterministic across sessions, no deps.
 */
export function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function isVolatileClass(className: string): boolean {
  return VOLATILE_CLASS_PATTERNS.some((p) => p.test(className));
}

export function isStableAttribute(name: string): boolean {
  return STABLE_ATTRIBUTE_NAMES.includes(name);
}

/** Text considered dynamic when it is mostly digits or looks like a timestamp. */
export function isVolatileText(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  const digitRatio = (trimmed.match(/\d/g) || []).length / trimmed.length;
  if (digitRatio > 0.5) return true;
  if (/^\d+[.,:\-/ ]+\d+/.test(trimmed)) return true;
  if (/\b\d{10,}\b/.test(trimmed)) return true;
  return false;
}

function meaningfulText(element: Element, limit = 80): string {
  const own = Array.from(element.childNodes)
    .filter((n) => n.nodeType === 3)
    .map((n) => (n.textContent || '').trim())
    .join(' ')
    .replace(/\s+/g, ' ');
  return own.slice(0, limit);
}

function tagChain(element: Element, depth: number): string[] {
  const chain: string[] = [];
  let cur: Element | null = element;
  while (cur && chain.length < depth) {
    chain.unshift(cur.tagName.toLowerCase());
    cur = cur.parentElement;
  }
  return chain;
}

/**
 * Compute the structural fingerprint of an element.
 */
export class DOMFingerprintEngine {
  /**
   * Build a fingerprint for an element.
   */
  public fingerprint(element: Element): DOMFingerprint {
    const win = element.ownerDocument?.defaultView;

    const stableAttributes: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      if (isStableAttribute(attr.name) && attr.value && attr.value.length < 200) {
        stableAttributes[attr.name] = attr.value;
      }
    }

    const allClasses = Array.from(element.classList || []);
    const stableClasses = allClasses.filter((c) => !isVolatileClass(c));

    const text = meaningfulText(element);
    const rect = element.getBoundingClientRect();
    const dimensions = {
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    const ancestors: string[] = tagChain(element, 4);
    const ancestorPattern = ancestors.join('>');
    const childTags = Array.from(element.children || [])
      .slice(0, 8)
      .map((c) => c.tagName.toLowerCase());
    const descendantPattern = childTags.join('|');

    const role =
      element.getAttribute('role') ||
      (win?.getComputedStyle ? undefined : undefined) ||
      implicitRole(element);

    const hash = stableHash(
      JSON.stringify({
        t: element.tagName.toLowerCase(),
        a: stableAttributes,
        c: stableClasses.slice(0, 4),
        r: role || null,
        anc: ancestorPattern,
        desc: descendantPattern,
        txt: isVolatileText(text) ? null : text.slice(0, 40),
        d: dimensions,
      })
    );

    const volatilityReasons: string[] = [];
    let volatility: 'low' | 'medium' | 'high' = 'low';
    if (!stableAttributes['id'] && !stableAttributes['data-testid'] && !stableAttributes['name']) {
      volatility = 'medium';
      volatilityReasons.push('no stable identity attribute');
    }
    if (allClasses.length > 0 && stableClasses.length === 0) {
      volatility = volatilityReasons.length ? 'high' : 'medium';
      volatilityReasons.push('all classes are framework-generated');
    }
    if (isVolatileText(text)) {
      volatilityReasons.push('text appears dynamic');
      if (volatility === 'low') volatility = 'medium';
    }
    if (element.tagName.toLowerCase().includes('-')) {
      volatilityReasons.push('custom element (web component)');
      if (volatility === 'low') volatility = 'medium';
    }

    return {
      fingerprintId: `fp_${hash}`,
      hash,
      tagHierarchy: ancestors,
      stableAttributes,
      meaningfulText: text,
      classes: stableClasses,
      role: role || undefined,
      dimensions,
      ancestorPattern,
      descendantPattern,
      volatilityRisk: volatility,
      volatilityReasons,
    };
  }

  /**
   * Compare two fingerprints and produce a similarity score in [0, 1].
   * Explainable component weighting — never fabricates precision.
   */
  public compare(a: DOMFingerprint, b: DOMFingerprint): { score: number; components: Array<{ name: string; score: number; weight: number }> } {
    const components: Array<{ name: string; score: number; weight: number }> = [];

    const tagScore = a.tagHierarchy[0] === b.tagHierarchy[0] ? 1 : 0;
    components.push({ name: 'tag', score: tagScore, weight: 0.15 });

    const ancOverlap = overlap(a.ancestorPattern.split('>'), b.ancestorPattern.split('>'));
    components.push({ name: 'ancestorPattern', score: ancOverlap, weight: 0.2 });

    const attrScore = attrOverlap(a.stableAttributes, b.stableAttributes);
    components.push({ name: 'stableAttributes', score: attrScore, weight: 0.25 });

    const classScore = overlap(a.classes, b.classes);
    components.push({ name: 'classes', score: classScore, weight: 0.1 });

    const roleScore = (a.role || '') === (b.role || '') && !!a.role ? 1 : 0;
    components.push({ name: 'role', score: roleScore, weight: 0.1 });

    const textScore = a.meaningfulText === b.meaningfulText && a.meaningfulText ? 1 : 0;
    components.push({ name: 'text', score: textScore, weight: 0.1 });

    const dimScore = dimensionSimilarity(a.dimensions, b.dimensions);
    components.push({ name: 'dimensions', score: dimScore, weight: 0.1 });

    const total = components.reduce((sum, c) => sum + c.score * c.weight, 0);
    return { score: Math.round(total * 1000) / 1000, components };
  }
}

function implicitRole(element: Element): string | undefined {
  const tag = element.tagName.toLowerCase();
  switch (tag) {
    case 'a': return element.getAttribute('href') ? 'link' : undefined;
    case 'button': return 'button';
    case 'nav': return 'navigation';
    case 'header': return 'banner';
    case 'footer': return 'contentinfo';
    case 'main': return 'main';
    case 'aside': return 'complementary';
    case 'article': return 'article';
    case 'form': return 'form';
    case 'input': {
      const type = element.getAttribute('type') || 'text';
      if (type === 'checkbox') return 'checkbox';
      if (type === 'radio') return 'radio';
      if (type === 'button' || type === 'submit') return 'button';
      return 'textbox';
    }
    case 'select': return 'combobox';
    case 'textarea': return 'textbox';
    case 'img': return 'img';
    case 'table': return 'table';
    case 'ul': case 'ol': return 'list';
    case 'li': return 'listitem';
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 'heading';
    default: return undefined;
  }
}

function overlap(a: string[], b: string[]): number {
  if (!a.length && !b.length) return 1;
  if (!a.length || !b.length) return 0;
  const setB = new Set(b);
  const shared = a.filter((x) => setB.has(x)).length;
  return shared / Math.max(a.length, b.length);
}

function attrOverlap(a: Record<string, string>, b: Record<string, string>): number {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (!keysA.length && !keysB.length) return 0.5; // neutral — no evidence either way
  if (!keysA.length || !keysB.length) return 0;
  let shared = 0;
  let compared = 0;
  for (const k of keysA) {
    if (k in b) {
      compared++;
      if (a[k] === b[k]) shared++;
    }
  }
  if (compared === 0) return 0;
  return shared / Math.max(keysA.length, keysB.length);
}

function dimensionSimilarity(a: { width: number; height: number }, b: { width: number; height: number }): number {
  if (a.width === 0 && a.height === 0 && b.width === 0 && b.height === 0) return 0.5;
  const wSim = similarNumber(a.width, b.width);
  const hSim = similarNumber(a.height, b.height);
  return (wSim + hSim) / 2;
}

function similarNumber(a: number, b: number): number {
  if (a === b) return 1;
  if (a === 0 || b === 0) return 0;
  const ratio = Math.min(a, b) / Math.max(a, b);
  return ratio > 0.9 ? 1 : ratio > 0.7 ? 0.5 : 0;
}
