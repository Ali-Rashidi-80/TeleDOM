import { ElementTarget, LiveElementTarget, SelectorCandidate } from '../types/browser-control';
import { DOMFingerprintEngine } from './dom-fingerprint';
import { SelectorRobustnessEngine } from './selector-robustness';
import { LiveDOMInspector } from './live-dom-inspector';
import { NodeRegistry } from './node-registry';

/**
 * §13 Element Targeting — authoritative multi-strategy TARGET builder.
 *
 * The TARGET object (id, tag, role, selector, xpath, textFingerprint,
 * attributes, structuralFingerprint, confidence, bounds) is the canonical
 * element representation exchanged with agents and stored in project regions.
 */
export class ElementTargetingEngine {
  private fingerprintEngine = new DOMFingerprintEngine();
  private counter = 0;

  constructor(private doc: Document, private registry?: NodeRegistry) {}

  public buildTarget(element: Element, resolvedFrom = 'selector'): ElementTarget {
    const selectorEngine = new SelectorRobustnessEngine(this.doc);
    const candidates: SelectorCandidate[] = selectorEngine.generateCandidates(element);
    const best = selectorEngine.bestSelector(element);
    const fingerprint = this.fingerprintEngine.fingerprint(element);
    const info = LiveDOMInspector.inspectElement(element, this.registry);
    const rect = element.getBoundingClientRect();

    // Overall confidence: weighted blend of selector confidence and fingerprint stability
    let confidence = best.confidence * 0.6;
    if (fingerprint.volatilityRisk === 'low') confidence += 0.3;
    else if (fingerprint.volatilityRisk === 'medium') confidence += 0.15;
    const uniqueCandidate = candidates.find((c) => c.unique && c.confidence >= 0.9);
    if (uniqueCandidate) confidence += 0.1;
    confidence = Math.max(0.05, Math.min(1, confidence));

    this.counter++;
    return {
      targetId: `tgt_${Date.now().toString(36)}_${this.counter}`,
      tag: element.tagName.toLowerCase(),
      role: info.role || fingerprint.role,
      selector: best.selector,
      selectorCandidates: candidates,
      xpath: selectorEngine.buildXPath(element),
      domPath: (info.context?.parentChain || []).concat(best.selector).join(' > '),
      textFingerprint: fingerprint.meaningfulText,
      attributeFingerprint: JSON.stringify(fingerprint.stableAttributes),
      structuralFingerprint: fingerprint.hash,
      attributes: info.attributes || {},
      confidence: Math.round(confidence * 100) / 100,
      bounds: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
      resolvedFrom,
    };
  }

  /**
   * Resolve a target spec to a live element using the platform's
   * deterministic resolution order, then build the TARGET representation.
   */
  public resolveAndBuild(spec: LiveElementTarget | string): { element: Element; target: ElementTarget } | { error: string } {
    let element: Element | null = null;
    let resolvedFrom = 'unknown';

    if (typeof spec === 'string') {
      spec = { selector: spec };
    }

    const s = spec as LiveElementTarget;
    if (s.selectedElementRef) {
      resolvedFrom = 'selectedElementRef';
      // handled upstream by interaction engine; here fall through to selector
    }
    if (!element && s.selector) {
      try {
        const found = this.doc.querySelectorAll(s.selector);
        if (found.length === 0) return { error: `TARGET_NOT_FOUND: selector "${s.selector}" matches no element` };
        if (found.length > 1) {
          element = firstVisible(found, this.doc) || (found[0] as Element);
          resolvedFrom += '+disambiguated';
        } else {
          element = found[0] as Element;
          resolvedFrom = 'selector';
        }
      } catch (err: any) {
        return { error: `TARGET_INVALID: ${err.message}` };
      }
    }
    if (!element && s.xpath) {
      try {
        const x = this.doc.evaluate(s.xpath, this.doc, null, 9 /* FIRST_ORDERED_NODE_TYPE */, null);
        element = x.singleNodeValue as Element | null;
        resolvedFrom = 'xpath';
      } catch (err: any) {
        return { error: `TARGET_INVALID_XPATH: ${err.message}` };
      }
    }
    if (!element && typeof (s as any).nodeId === 'number' && this.registry) {
      const n = this.registry.getNode((s as any).nodeId);
      if (n && n.nodeType === 1 && this.doc.contains(n)) {
        element = n as Element;
        resolvedFrom = 'nodeId';
      }
    }
    if (!element && s.coordinates) {
      element = this.doc.elementFromPoint(s.coordinates.x, s.coordinates.y);
      resolvedFrom = 'coordinates';
    }

    if (!element) return { error: 'TARGET_NOT_FOUND: no usable resolution strategy succeeded' };
    return { element, target: this.buildTarget(element, resolvedFrom) };
  }
}

function firstVisible(nodes: NodeList, doc: Document): Element | null {
  for (const n of Array.from(nodes)) {
    const el = n as Element;
    try {
      const vis = LiveDOMInspector.inspectElement(el).visibility;
      if (vis.isVisible) return el;
    } catch { /* skip */ }
  }
  return null;
}
