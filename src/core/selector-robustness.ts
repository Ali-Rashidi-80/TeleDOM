import { SelectorCandidate } from '../types/browser-control';
import { isVolatileClass, isVolatileText, stableHash } from './dom-fingerprint';

/**
 * §34 Selector Robustness Engine
 *
 * Generates multiple selector candidates for an element and ranks them with
 * explainable confidence scores. This is the authoritative selector generator
 * for the MCPDOM platform — it reuses the strategy families already present
 * in LiveDOMInspector (id / semantic attrs / classes / nth-of-type) and adds
 * XPath, text-derived, structural, and attribute-fingerprint strategies with
 * fallback chains, as required by the extension-generation handoff contract.
 */

const SEMANTIC_ATTRS = [
  'data-testid',
  'data-test',
  'data-id',
  'data-qa',
  'data-cy',
  'data-component',
  'data-role',
  'aria-label',
  'name',
  'id',
];

const VALID_ID = /^[a-zA-Z][a-zA-Z0-9_-]*$/;
const VALID_ATTR_VALUE = /^[a-zA-Z0-9_ .:-]+$/;

export class SelectorRobustnessEngine {
  private doc: Document;

  constructor(doc: Document) {
    this.doc = doc;
  }

  /**
   * Generate the full ranked candidate list for an element.
   */
  public generateCandidates(element: Element): SelectorCandidate[] {
    const candidates: SelectorCandidate[] = [];
    const tag = element.tagName.toLowerCase();
    const id = element.getAttribute('id');

    // Strategy 1: stable unique id
    if (id && VALID_ID.test(id)) {
      const selector = `#${cssEscape(id)}`;
      candidates.push(this.evaluate(element, selector, 'id', 1.0, ['unique stable id']));
    }

    // Strategy 2: semantic attributes
    for (const attr of SEMANTIC_ATTRS) {
      if (attr === 'id') continue;
      const value = element.getAttribute(attr);
      if (value && VALID_ATTR_VALUE.test(value) && value.length < 100) {
        const selector = `${tag}[${attr}="${escapeAttr(value)}"]`;
        candidates.push(
          this.evaluate(element, selector, 'semantic-attribute', 0.92, [`semantic attribute ${attr}`])
        );
      }
    }

    // Strategy 3: stable classes
    const stableClasses = Array.from(element.classList || []).filter((c) => !isVolatileClass(c));
    if (stableClasses.length) {
      const classSelector = `${tag}.${stableClasses.slice(0, 3).map(cssEscape).join('.')}`;
      candidates.push(
        this.evaluate(element, classSelector, 'class', 0.72, stableClasses.length ? ['stable class names'] : [])
      );
    }

    // Strategy 4: structural nth-of-type path
    const structural = this.buildStructuralPath(element);
    if (structural) {
      candidates.push(
        this.evaluate(element, structural, 'structural-path', 0.55, ['position-based structural path'])
      );
    }

    // Strategy 5: text-derived (exact text match for short static labels)
    const ownText = directText(element);
    if (ownText && ownText.length >= 2 && ownText.length <= 60 && !isVolatileText(ownText)) {
      const selector = `${tag}:nth-of-type(1)`; // anchor — real text match done via XPath
      const xpath = this.buildTextXPath(element, ownText);
      if (xpath) {
        candidates.push({
          selector,
          strategy: 'text-derived-xpath',
          confidence: 0.6,
          unique: this.isXPathUnique(xpath),
          reasons: [`matches text "${ownText.slice(0, 30)}"`],
        });
        // attach the xpath as a comment-style variant
        (candidates[candidates.length - 1] as any).xpath = xpath;
      }
    }

    // Strategy 6: attribute fingerprint (combination of 2+ stable attrs)
    const fingerprintSelector = this.buildAttributeFingerprintSelector(element);
    if (fingerprintSelector) {
      candidates.push(
        this.evaluate(element, fingerprintSelector, 'attribute-fingerprint', 0.68, ['combination of stable attributes'])
      );
    }

    // Deduplicate by selector + keep best
    const seen = new Map<string, SelectorCandidate>();
    for (const c of candidates) {
      const key = c.strategy === 'text-derived-xpath' ? `xpath:${(c as any).xpath}` : c.selector;
      const existing = seen.get(key);
      if (!existing || c.confidence > existing.confidence) {
        seen.set(key, c);
      }
    }

    return Array.from(seen.values()).sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Best selector = highest-confidence unique candidate, else first candidate.
   */
  public bestSelector(element: Element): { selector: string; strategy: string; confidence: number } {
    const candidates = this.generateCandidates(element);
    const best = candidates.find((c) => c.unique && c.confidence >= 0.7) || candidates[0];
    return {
      selector: best?.selector || element.tagName.toLowerCase(),
      strategy: best?.strategy || 'tag',
      confidence: best?.confidence || 0.3,
    };
  }

  /**
   * XPath for an element (absolute-ish, using ids where available).
   */
  public buildXPath(element: Element): string {
    const segments: string[] = [];
    let cur: Element | null = element;
    while (cur && cur !== this.doc.documentElement) {
      const id = cur.getAttribute('id');
      if (id && VALID_ID.test(id)) {
        segments.unshift(`*[@id="${escapeAttr(id)}"]`);
        break;
      }
      const parent: Element | null = cur.parentElement;
      if (!parent) {
        segments.unshift(cur.tagName.toLowerCase());
        break;
      }
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === cur!.tagName);
      const idx = sameTag.indexOf(cur) + 1;
      segments.unshift(`${cur.tagName.toLowerCase()}[${idx}]`);
      cur = parent;
    }
    if (cur === this.doc.documentElement && (!segments.length || !segments[0].includes('@id'))) {
      segments.unshift('html');
    }
    return '//' + segments.join('/');
  }

  private buildTextXPath(element: Element, text: string): string | null {
    try {
      const tag = element.tagName.toLowerCase();
      const escaped = escapeXPathText(text);
      return `//${tag}[normalize-space(text())=${escaped}]`;
    } catch {
      return null;
    }
  }

  private buildStructuralPath(element: Element, maxDepth = 4): string | null {
    const parts: string[] = [];
    let cur: Element | null = element;
    while (cur && parts.length < maxDepth) {
      const parent: Element | null = cur.parentElement;
      const tag = cur.tagName.toLowerCase();
      if (!parent) {
        parts.unshift(tag);
        break;
      }
      const sameTag = Array.from(parent.children).filter((c) => c.tagName === cur!.tagName);
      if (sameTag.length > 1) {
        const idx = sameTag.indexOf(cur) + 1;
        parts.unshift(`${tag}:nth-of-type(${idx})`);
      } else {
        parts.unshift(tag);
      }
      cur = parent;
      if (cur === this.doc.body) {
        parts.unshift('body');
        break;
      }
      if (cur === this.doc.documentElement) break;
    }
    const selector = parts.join(' > ');
    if (!selector.includes('body')) return 'body > ' + selector;
    return selector;
  }

  private buildAttributeFingerprintSelector(element: Element): string | null {
    const tag = element.tagName.toLowerCase();
    const parts: string[] = [];
    const type = element.getAttribute('type');
    if (type) parts.push(`type="${escapeAttr(type)}"`);
    const href = element.getAttribute('href');
    if (href && href.length < 80 && !href.startsWith('javascript:')) parts.push(`href^="${escapeAttr(href.slice(0, 40))}"`);
    const placeholder = element.getAttribute('placeholder');
    if (placeholder && placeholder.length < 60) parts.push(`placeholder="${escapeAttr(placeholder)}"`);
    if (parts.length >= 2) {
      return `${tag}[${parts.join('][')}]`;
    }
    return null;
  }

  private evaluate(
    element: Element,
    selector: string,
    strategy: string,
    baseConfidence: number,
    reasons: string[]
  ): SelectorCandidate {
    let unique = false;
    let matches = 0;
    try {
      const found = this.doc.querySelectorAll(selector);
      matches = found.length;
      unique = found.length === 1 && found[0] === element;
    } catch {
      // Invalid selector — reject
      return { selector, strategy, confidence: 0, unique: false, reasons: ['invalid selector syntax'] };
    }

    let confidence = baseConfidence;
    if (matches === 0) {
      confidence = 0;
      reasons.push('selector matched nothing (invalid candidate)');
    } else if (matches === 1 && unique) {
      reasons.push('matches exactly this element');
    } else {
      confidence = confidence * 0.4;
      reasons.push(`matches ${matches} elements — ambiguous`);
    }

    return {
      selector,
      strategy,
      confidence: Math.round(confidence * 100) / 100,
      unique,
      reasons,
    };
  }

  private isXPathUnique(xpath: string): boolean {
    try {
      const result = this.doc.evaluate(
        `count(${xpath})`,
        this.doc,
        null,
        4 /* XPathResult.NUMBER_TYPE */,
        null
      );
      return result.numberValue === 1;
    } catch {
      return false;
    }
  }
}

export function directText(element: Element): string {
  return Array.from(element.childNodes)
    .filter((n) => n.nodeType === 3)
    .map((n) => (n.textContent || '').trim())
    .join(' ')
    .replace(/\s+/g, ' ');
}

export function cssEscape(value: string): string {
  return value.replace(/([^a-zA-Z0-9_\u00A0-\uFFFF-])/g, '\\$1');
}

export function escapeAttr(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

export function escapeXPathText(text: string): string {
  if (text.includes("'")) {
    if (text.includes('"')) {
      return `concat(${text
        .split("'")
        .map((part) => `'${part}'`)
        .join(", \"'\", ")})`;
    }
    return `"${text}"`;
  }
  return `'${text}'`;
}

/**
 * Deterministic fallback identity when no strategy succeeds — a stable hash
 * of structural properties. Used as a last-resort recovery anchor.
 */
export function structuralIdentity(element: Element): string {
  const tag = element.tagName.toLowerCase();
  const text = directText(element).slice(0, 40);
  const parentTag = element.parentElement?.tagName.toLowerCase() || 'root';
  const childCount = element.children.length;
  return `mcpdom_${stableHash(`${tag}|${parentTag}|${text}|${childCount}`)}`;
}
