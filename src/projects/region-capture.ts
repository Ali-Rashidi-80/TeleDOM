import { SelectorCandidate } from '../types/browser-control';
import { DOMFingerprintEngine } from '../core/dom-fingerprint';
import { SelectorRobustnessEngine, directText } from '../core/selector-robustness';
import { LiveDOMInspector } from '../core/live-dom-inspector';
import { RegionQualityScore, RegionRelationshipGraph, RegionRelationshipEdge, RegionRelationshipNode } from '../types/project';
import { NamingEngine, NamingEvidence } from './naming-engine';

/**
 * §33 Automatic DOM Extraction Per Region — LOCAL DOM + RELEVANT CONTEXT DOM
 * with a meaningful boundary determination (not indiscriminate full-page export).
 */
export interface RegionCaptureData {
  regionHtml: string;
  contextHtml: string;
  boundary: {
    strategy: string;
    ancestorLevels: number;
    note: string;
  };
  selectorCandidates: SelectorCandidate[];
  bestSelector: string;
  xpath: string;
  fingerprintHash: string;
  dimensions: { width: number; height: number };
  position: { x: number; y: number };
  relevantStyles: Record<string, string>;
  parentInfo?: { tag: string; selector: string; text: string };
  childrenCount: number;
  childTags: string[];
  nameHint: NamingEvidence;
  fingerprintVolatility: 'low' | 'medium' | 'high';
  volatilityReasons: string[];
}

const STYLE_PROPS = ['display', 'position', 'flex-direction', 'grid-template-columns', 'width', 'height', 'background-color', 'color', 'font-size', 'border-radius', 'overflow'];

export class RegionCaptureEngine {
  private naming = new NamingEngine();

  /**
   * Capture region DOM + context DOM with a meaningful boundary.
   *
   * Boundary strategy: ascend until we find a container that contributes
   * layout context (has an id/landmark role OR ≥2 relevant style properties
   * OR is a structural sectioning element), capped at 3 levels and at
   * <body>. Siblings of the region within that container are included as
   * context. This balances usefulness against export bloat.
   */
  public capture(element: Element): RegionCaptureData {
    const doc = element.ownerDocument;
    const selectorEngine = new SelectorRobustnessEngine(doc);
    const fingerprintEngine = new DOMFingerprintEngine();

    const candidates = selectorEngine.generateCandidates(element);
    const best = selectorEngine.bestSelector(element);
    const fingerprint = fingerprintEngine.fingerprint(element);

    // ---- boundary determination ----
    let contextRoot: Element = element;
    let levels = 0;
    let strategy = 'self';
    for (let i = 0; i < 3; i++) {
      const parent = contextRoot.parentElement;
      if (!parent || parent === doc.body || parent === doc.documentElement) break;
      if (this.isMeaningfulContainer(parent)) {
        contextRoot = parent;
        levels = i + 1;
        strategy = 'meaningful-ancestor';
        break;
      }
      contextRoot = parent;
      levels = i + 1;
    }
    if (contextRoot === element) {
      // fall back: include direct parent when region itself is tiny
      const parent = element.parentElement;
      if (parent && parent !== doc.body && element.querySelectorAll('*').length < 4) {
        contextRoot = parent;
        levels = 1;
        strategy = 'direct-parent-fallback';
      }
    }

    // Region HTML is the CLEANED subtree (no MCPDOM nodes) — done by
    // ProjectManager via RedactionEngine before persistence; here raw.
    const regionHtml = this.boundedHtml(element, 60000);
    const contextHtml = this.boundedHtml(contextRoot, 120000);

    const info = LiveDOMInspector.inspectElement(element);
    const rect = element.getBoundingClientRect();
    const win = doc.defaultView;
    const relevantStyles: Record<string, string> = {};
    if (win?.getComputedStyle) {
      const cs = win.getComputedStyle(element);
      for (const prop of STYLE_PROPS) {
        const v = cs.getPropertyValue(prop);
        if (v && v !== 'none' && v !== 'auto') relevantStyles[prop] = v;
      }
    }

    const parent = element.parentElement;

    return {
      regionHtml,
      contextHtml,
      boundary: {
        strategy,
        ancestorLevels: levels,
        note: levels === 0
          ? 'Region captured standalone (no meaningful ancestor within 3 levels).'
          : `Context includes ${levels} ancestor level(s) up to a meaningful container.`,
      },
      selectorCandidates: candidates,
      bestSelector: best.selector,
      xpath: selectorEngine.buildXPath(element),
      fingerprintHash: fingerprint.hash,
      dimensions: { width: Math.round(rect.width), height: Math.round(rect.height) },
      position: { x: Math.round(rect.x), y: Math.round(rect.y) },
      relevantStyles,
      parentInfo: parent
        ? {
            tag: parent.tagName.toLowerCase(),
            selector: bestSelectorOf(parent),
            text: directText(parent).slice(0, 60),
          }
        : undefined,
      childrenCount: element.children.length,
      childTags: Array.from(element.children).slice(0, 12).map((c) => c.tagName.toLowerCase()),
      nameHint: this.naming.generate(element),
      fingerprintVolatility: fingerprint.volatilityRisk,
      volatilityReasons: fingerprint.volatilityReasons,
    };
  }

  private isMeaningfulContainer(el: Element): boolean {
    const tag = el.tagName.toLowerCase();
    if (['section', 'article', 'aside', 'main', 'nav', 'header', 'footer', 'form'].includes(tag)) return true;
    if (el.hasAttribute('id') || el.hasAttribute('data-testid') || el.getAttribute('role')) return true;
    if (el.children.length > 1 && el.querySelector(':scope > *:nth-child(3)')) return true; // wraps multiple siblings
    const cs = el.getAttribute('style') || '';
    if (cs.includes('grid') || cs.includes('flex')) return true;
    return false;
  }

  private boundedHtml(el: Element, max: number): string {
    const html = el.outerHTML;
    if (html.length <= max) return html;
    return html.slice(0, max) + `\n<!-- [MCPDOM: truncated at ${max} bytes; full node count: ${el.querySelectorAll('*').length}] -->`;
  }
}

function bestSelectorOf(el: Element): string {
  try {
    return new SelectorRobustnessEngine(el.ownerDocument).bestSelector(el).selector;
  } catch {
    return el.tagName.toLowerCase();
  }
}

/**
 * §62 Page Understanding Score — explainable region quality.
 * Never fabricates precision: every component carries evidence text.
 */
export class RegionQualityScorer {
  public score(input: {
    selectorCandidates: SelectorCandidate[];
    fingerprintVolatility: 'low' | 'medium' | 'high';
    volatilityReasons: string[];
    hasScreenshot: boolean;
    hasHtmlSnapshot: boolean;
    hasContext: boolean;
    userAnnotationFilled: boolean;
    hasIntendedChange: boolean;
    hasVerification: boolean;
  }): RegionQualityScore {
    const components: Array<{ dimension: string; score: number; weight: number; evidence: string }> = [];

    // Selector stability (weight 0.3)
    const bestUnique = input.selectorCandidates.find((c) => c.unique);
    const bestConfidence = input.selectorCandidates[0]?.confidence || 0;
    const stability = Math.min(1, (bestUnique ? 0.6 : 0.2) + bestConfidence * 0.4);
    components.push({
      dimension: 'selector-stability',
      score: stability,
      weight: 0.3,
      evidence: bestUnique
        ? `unique selector via ${bestUnique.strategy} (confidence ${bestUnique.confidence})`
        : `best candidate confidence ${bestConfidence || 'n/a'} — no unique selector`,
    });

    // Fingerprint stability (weight 0.2)
    const fpScore = input.fingerprintVolatility === 'low' ? 1 : input.fingerprintVolatility === 'medium' ? 0.55 : 0.25;
    components.push({
      dimension: 'semantic-confidence',
      score: fpScore,
      weight: 0.2,
      evidence: `fingerprint volatility ${input.fingerprintVolatility}${input.volatilityReasons.length ? ` (${input.volatilityReasons.join('; ')})` : ''}`,
    });

    // Structural completeness (weight 0.15)
    const structural = (input.hasHtmlSnapshot ? 0.6 : 0) + (input.hasContext ? 0.4 : 0);
    components.push({ dimension: 'structural-completeness', score: structural, weight: 0.15, evidence: `html snapshot: ${input.hasHtmlSnapshot}; context DOM: ${input.hasContext}` });

    // Visual completeness (weight 0.15)
    const visual = input.hasScreenshot ? 1 : 0.2;
    components.push({ dimension: 'visual-completeness', score: visual, weight: 0.15, evidence: input.hasScreenshot ? 'region screenshot captured' : 'no screenshot — visual verification impossible' });

    // Annotation completeness (weight 0.2)
    const annotation = (input.userAnnotationFilled ? 0.5 : 0) + (input.hasIntendedChange ? 0.3 : 0) + (input.hasVerification ? 0.2 : 0);
    components.push({
      dimension: 'annotation-completeness',
      score: annotation,
      weight: 0.2,
      evidence: `user annotation: ${input.userAnnotationFilled}; intended change: ${input.hasIntendedChange}; verification: ${input.hasVerification}`,
    });

    const overall = Math.round(components.reduce((s, c) => s + c.score * c.weight, 0) * 100) / 100;
    const grade: RegionQualityScore['grade'] = overall >= 0.85 ? 'A' : overall >= 0.65 ? 'B' : overall >= 0.45 ? 'C' : 'D';

    const notes: string[] = [];
    for (const c of components) {
      if (c.score < 0.5) notes.push(`${c.dimension} is weak: ${c.evidence}`);
    }

    return { overall, components, grade, notes };
  }
}

/**
 * §63 Region Relationship Graph — regions reference each other through a
 * containment/overlap graph derived from the live DOM.
 */
export class RegionRelationshipGraphBuilder {
  public build(
    pageId: string,
    regions: Array<{ regionId: string; name: string; tag: string; role?: string; selector: string; element?: Element }>
  ): RegionRelationshipGraph {
    const nodes: RegionRelationshipNode[] = [
      { id: `page:${pageId}`, name: 'page', tag: 'document', selector: 'document', depth: 0, relationship: 'page' },
    ];
    const edges: RegionRelationshipEdge[] = [];

    for (const r of regions) {
      nodes.push({ id: r.regionId, name: r.name, tag: r.tag, role: r.role, selector: r.selector, depth: 1, relationship: 'region' });
      edges.push({ from: `page:${pageId}`, to: r.regionId, relation: 'contains' });
    }

    // Pairwise relationships via DOM containment when elements available
    for (let i = 0; i < regions.length; i++) {
      for (let j = 0; j < regions.length; j++) {
        if (i === j) continue;
        const a = regions[i].element;
        const b = regions[j].element;
        if (a && b && a.contains && b.contains) {
          if (a.contains(b)) {
            edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: 'contains' });
          } else if (b.contains(a)) {
            edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: 'ancestor-of' });
          } else if (a.parentElement && a.parentElement === b.parentElement) {
            edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: 'sibling-of' });
          } else {
            const ra = a.getBoundingClientRect();
            const rb = b.getBoundingClientRect();
            const overlaps = !(ra.right < rb.left || rb.right < ra.left || ra.bottom < rb.top || rb.bottom < ra.top);
            if (overlaps) {
              edges.push({ from: regions[i].regionId, to: regions[j].regionId, relation: 'overlaps' });
            }
          }
        }
      }
    }

    // Deduplicate edges (contains + ancestor-of from both directions)
    const seen = new Set<string>();
    const uniqueEdges = edges.filter((e) => {
      const key = `${e.from}|${e.to}|${e.relation}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return { pageId, nodes, edges: uniqueEdges };
  }
}
