/**
 * Live-DOM analyzers:
 *   CAP 11 — CSS influence analyzer
 *   CAP 12 — Z-index / occlusion forensics
 *   CAP 13 — Event listener forensics
 *   CAP 17 — Font rendering forensics
 *
 * Each analyzer ships a purpose-built probe that runs in the page
 * (bridge → extension in live mode; local controller → JSDOM in
 * simulation) and a REAL analysis algorithm applied to the probe
 * results. Probes are semantic (per-capability), never a generic
 * "call evaluate_script for everything" wrapper (§18).
 */

import { runInPage } from '../../devtools/capabilities/interaction-core';

// ---------------------------------------------------------------------------
// CAP 11 — CSS INFLUENCE ANALYZER
// ---------------------------------------------------------------------------

export interface CssInfluencingRule {
  rank: number;
  selector: string;
  stylesheet: string;
  specificity: [number, number, number];
  specificityValue: number;
  declarations: string[];
  inherited: boolean;
  matchedProperties: string[];
}

const PROPERTY_GROUPS: Record<string, string[]> = {
  visibility: ['display', 'visibility', 'opacity'],
  dimensions: ['width', 'height', 'min-width', 'max-width', 'min-height', 'max-height', 'aspect-ratio'],
  position: ['position', 'top', 'left', 'right', 'bottom', 'inset', 'float', 'margin', 'transform'],
  stacking: ['z-index', 'position', 'transform', 'filter', 'isolation', 'mix-blend-mode'],
  typography: ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'text-transform', 'color'],
  overflow: ['overflow', 'overflow-x', 'overflow-y', 'text-overflow', 'white-space'],
  clipping: ['clip', 'clip-path', 'overflow', 'mask', 'contain'],
};

export async function analyzeCssInfluence(input: { selector: string; group?: string; tabId?: number }): Promise<Record<string, unknown>> {
  const group = input.group && PROPERTY_GROUPS[input.group] ? input.group : 'all';
  const properties = group === 'all' ? Object.values(PROPERTY_GROUPS).flat() : PROPERTY_GROUPS[group];

  // Probe: enumerate reachable stylesheets, match rules against the element
  // AND its ancestors (inheritance), and return raw matches for analysis.
  const probe = `(function(){
    const el = document.querySelector(${JSON.stringify(input.selector)});
    if (!el) return { found: false };
    const matches = [];
    const ancestors = [];
    let cursor = el;
    while (cursor && cursor instanceof Element) { ancestors.push(cursor); cursor = cursor.parentElement; }
    const sheets = Array.from(document.styleSheets || []);
    for (const sheet of sheets) {
      let rules = [];
      try { rules = Array.from(sheet.cssRules || []); } catch (e) { continue; }
      const walkRules = (ruleList) => {
        for (const rule of ruleList) {
          if (rule.type === 1 /* CSSStyleRule */) {
            for (const target of ancestors) {
              let matched = false;
              try { matched = target.matches(rule.selectorText); } catch (e) { matched = false; }
              if (matched) {
                matches.push({
                  selector: rule.selectorText,
                  href: (sheet.href || 'inline<style>'),
                  declarations: rule.style.cssText.split(';').map(s => s.trim()).filter(Boolean),
                  targetTag: target.tagName.toLowerCase(),
                  targetId: target.id || null,
                  inherited: target !== el,
                });
                break; // one match per rule (first ancestor it matches)
              }
            }
          } else if (rule.cssRules && rule.type === 4 /* CSSMediaRule */) {
            walkRules(Array.from(rule.cssRules));
          }
        }
      };
      walkRules(rules);
    }
    const computed = {};
    for (const prop of ${JSON.stringify(properties)}) {
      try { computed[prop] = getComputedStyle(el).getPropertyValue(prop); } catch (e) { computed[prop] = null; }
    }
    return { found: true, matches: matches.slice(0, 200), computed, inlineStyle: el.getAttribute('style') || null };
  })()`;

  const raw = await runInPage(probe, input.tabId);
  if (!raw?.found) {
    throw new Error(`TARGET_STALE: element '${input.selector}' not found in the live page.`);
  }

  // Analysis: specificity computation + relevance ranking.
  const specificityOf = (selectorText: string): [number, number, number] => {
    const ids = (selectorText.match(/#[A-Za-z][\w-]+/g) || []).length;
    const classes = (selectorText.match(/\.[A-Za-z][\w-]+/g) || []).length + (selectorText.match(/\[[^\]]+\]/g) || []).length;
    const pseudoClasses = (selectorText.match(/(?<!:):(?!:)[a-z-]+/g) || []).length;
    const elements = (selectorText.match(/(^|[\\s>+~])[a-z][a-z0-9-]*/gi) || []).length;
    const types = (selectorText.match(/::[a-z-]+/g) || []).length;
    return [ids, classes + pseudoClasses, elements + types];
  };

  const ranked: CssInfluencingRule[] = [];
  for (const m of (raw.matches || []) as Array<{ selector: string; href: string; declarations: string[]; inherited: boolean }>) {
    const matchedProps: string[] = [];
    for (const decl of m.declarations) {
      const prop = decl.split(':')[0].trim().toLowerCase();
      if (properties.includes(prop)) matchedProps.push(prop);
    }
    if (group !== 'all' && matchedProps.length === 0 && !m.inherited) continue;
    const spec = specificityOf(m.selector);
    const specValue = spec[0] * 1000 + spec[1] * 100 + spec[2];
    // Relevance: property match dominates; specificity breaks ties; inherited rules rank lower.
    const relevance = matchedProps.length * 1000 + specValue - (m.inherited ? 400 : 0);
    ranked.push({
      rank: 0,
      selector: m.selector,
      stylesheet: m.href,
      specificity: spec,
      specificityValue: specValue,
      declarations: m.declarations.slice(0, 12),
      inherited: m.inherited,
      matchedProperties: matchedProps,
      ...({ relevance } as any),
    });
  }
  ranked.sort((a: any, b: any) => b.relevance - a.relevance);
  ranked.forEach((r, i) => { r.rank = i + 1; delete (r as any).relevance; });

  return {
    selector: input.selector,
    group,
    computedStyles: raw.computed,
    inlineStyle: raw.inlineStyle,
    influencingRules: ranked.slice(0, 25),
    ruleCount: ranked.length,
    notes: [
      'Specificity computed as (ids, classes+attributes+pseudo-classes, elements).',
      'Inherited rules are ranked below direct matches for the queried property group.',
      raw.matches?.length > 200 ? `Truncated at 200 matched rules of ${raw.matches.length}.` : undefined,
    ].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// CAP 12 — Z-INDEX / OCCLUSION FORENSICS
// ---------------------------------------------------------------------------

export async function analyzeZIndexOcclusion(input: { selector: string; tabId?: number }): Promise<Record<string, unknown>> {
  const probe = `(function(){
    const el = document.querySelector(${JSON.stringify(input.selector)});
    if (!el) return { found: false };
    const chain = [];
    let cursor = el;
    while (cursor && cursor instanceof Element) {
      const style = getComputedStyle(cursor);
      chain.push({
        tag: cursor.tagName.toLowerCase(),
        id: cursor.id || null,
        className: String(cursor.className || '').slice(0, 60),
        position: style.position,
        zIndex: style.zIndex,
        opacity: style.opacity,
        display: style.display,
        overflow: style.overflow,
        transform: style.transform !== 'none' ? style.transform : null,
        filter: style.filter !== 'none' ? style.filter : null,
        isolation: style.isolation,
        clipPath: style.clipPath !== 'none' ? style.clipPath : null,
        pointerEvents: style.pointerEvents,
      });
      cursor = cursor.parentElement;
    }
    const rect = el.getBoundingClientRect();
    const canHitTest = typeof document.elementFromPoint === 'function';
    const cx = rect.x + rect.width / 2, cy = rect.y + rect.height / 2;
    const centerHit = canHitTest ? (() => {
      const h = document.elementFromPoint(cx, cy);
      if (!h) return null;
      return { tag: h.tagName.toLowerCase(), id: h.id || null, isTarget: h === el, containsTarget: h !== el && el.contains(h), targetContains: h !== el && h.contains(el) };
    })() : 'UNAVAILABLE';
    let clipped = null;
    let clipper = el.parentElement;
    while (clipper) {
      const s = getComputedStyle(clipper);
      if (s.overflow !== 'visible' || s.clipPath !== 'none') { clipped = { tag: clipper.tagName.toLowerCase(), id: clipper.id || null, overflow: s.overflow, clipPath: s.clipPath }; break; }
      clipper = clipper.parentElement;
    }
    return { found: true, rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }, chain, centerHit: centerHit, hitTesting: canHitTest, clippedBy: clipped,
      zCount: document.querySelectorAll('*').length };
  })()`;

  const raw = await runInPage(probe, input.tabId);
  if (!raw?.found) throw new Error(`TARGET_STALE: element '${input.selector}' not found.`);

  // Analysis: stacking-context chain + effective z-order reasoning.
  const createsStacking = (node: Record<string, any>): boolean =>
    (node.position !== 'static' && node.zIndex !== 'auto') ||
    node.position === 'fixed' || node.position === 'sticky' ||
    (node.transform !== null && node.transform !== undefined) ||
    (node.filter !== null && node.filter !== undefined) ||
    node.isolation === 'isolate' ||
    Number(node.opacity) < 1;

  const chain = (raw.chain || []) as Array<Record<string, any>>;
  const stackingContexts: Array<Record<string, any>> = chain.map((node, i) => ({ ...node, isStackingContext: createsStacking(node), depth: i }));
  const nearestContext = [...stackingContexts].reverse().find(n => n.isStackingContext);
  const siblingsWithContext = chain.length > 0;

  const effectiveZ = nearestContext ? (nearestContext.zIndex === 'auto' ? 'auto (DOM order)' : nearestContext.zIndex) : 'auto (DOM order)';

  const hitUnavailable = raw.centerHit === 'UNAVAILABLE' || raw.hitTesting === false;
  const occluder: string | null = hitUnavailable
    ? 'Geometric hit-test UNAVAILABLE in this context (no layout engine): structural stacking analysis above remains valid; occlusion requires a live browser page.'
    : raw.centerHit
    ? raw.centerHit.isTarget ? null
      : raw.centerHit.containsTarget ? `Child element on top (part of the target subtree — not an occluder).`
        : raw.centerHit.targetContains ? `An ancestor of the target receives the hit — target may be hidden behind/below it.`
          : `Element at center point: <${raw.centerHit.tag}>${raw.centerHit.id ? '#' + raw.centerHit.id : ''} intercepts pointer events.`
    : 'No element at center point — target may be outside the viewport or fully transparent.';

  const pointerEventsBlocked = chain.some(n => n.pointerEvents === 'none' && n.depth > 0);
  const isDimZero = Number(raw.rect?.width) === 0 || Number(raw.rect?.height) === 0;

  return {
    selector: input.selector,
    rect: raw.rect,
    hitTestingAvailable: !hitUnavailable,
    stackingContexts,
    nearestStackingContext: nearestContext ? { element: nearestContext.tag + (nearestContext.id ? '#' + nearestContext.id : ''), zIndex: nearestContext.zIndex, position: nearestContext.position } : null,
    effectiveZOrder: effectiveZ,
    hitTestAtCenter: raw.centerHit,
    occlusionAssessment: {
      occluder,
      pointerEventsIntercepted: pointerEventsBlocked,
      clippingParent: raw.clippedBy,
      zeroSized: isDimZero,
      zeroSizeNote: isDimZero ? 'Element has zero width/height — invisible regardless of z-index (layout collapse, not occlusion).' : undefined,
    },
    hitTestConflicts: !hitUnavailable && raw.centerHit && !raw.centerHit.isTarget && !raw.centerHit.containsTarget && !raw.centerHit.targetContains
      ? [{ conflict: 'Clicks will land on a different element than the visual target', resolution: 'Raise z-index, adjust geometry, or act on the hit-test receiver directly.' }]
      : [],
    notes: [
      'Stacking contexts detected from position/z-index/transform/filter/opacity/isolation per CSS spec.',
      'Geometry hit-test uses elementFromPoint at the element center — in JSDOM (no layout engine) rect is 0×0 and the geometric result is explicitly marked as not available.',
      isDimZero ? 'JSDOM mode: geometry unavailable; structural stacking analysis above remains valid.' : undefined,
    ].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// CAP 13 — EVENT LISTENER FORENSICS
// ---------------------------------------------------------------------------

export async function analyzeEventListeners(input: { selector?: string; tabId?: number; deep?: boolean }): Promise<Record<string, unknown>> {
  const scopeSelector = input.selector;
  const probe = `(function(){
    const results = [];
    const collect = (el) => {
      if (!(el instanceof Element)) return;
      const attrs = Array.from(el.attributes || []);
      for (const attr of attrs) {
        if (/^on[a-z]+$/i.test(attr.name)) {
          results.push({
            element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
            type: attr.name.slice(2).toLowerCase(),
            source: 'inline-attribute',
            capture: false,
            passive: null,
            handlerPreview: String(attr.value).slice(0, 100),
            frameworkHint: /\\bReact\\b|__react/i.test(String(attr.value)) ? 'react' : /\\bVue\\b|__v/i.test(String(attr.value)) ? 'vue' : null,
          });
        }
      }
      // instrumentation channel (injected page script records registrations)
      const registrations = (window.__mcpdom_listeners__ || []);
      for (const reg of registrations) {
        if (reg && reg.elementRef === el) {
          results.push({
            element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''),
            type: reg.type,
            source: 'addEventListener-instrumentation',
            capture: !!reg.capture,
            passive: !!reg.passive,
            handlerPreview: reg.handlerPreview || null,
            frameworkHint: reg.frameworkHint || null,
            registeredAt: reg.registeredAt || null,
          });
        }
      }
    };
    let root = document;
    if (${scopeSelector ? JSON.stringify(scopeSelector) : 'null'}) {
      root = document.querySelector(${scopeSelector ? JSON.stringify(scopeSelector) : 'null'});
      if (!root) return { found: false };
      collect(root);
      for (const el of root.querySelectorAll('*')) collect(el);
    } else {
      for (const el of document.querySelectorAll('*')) collect(el);
    }
    return { found: true, listeners: results.slice(0, 300), instrumentationActive: !!(window.__mcpdom_listeners__), scannedElements: document.querySelectorAll('*').length };
  })()`;

  const raw = await runInPage(probe, input.tabId);
  if (raw && raw.found === false) throw new Error(`TARGET_STALE: element '${input.selector}' not found.`);
  const listeners = (raw?.listeners || []) as Array<Record<string, any>>;

  // Analysis: group by type, detect framework ownership heuristics.
  const byType: Record<string, number> = {};
  const byElement: Record<string, number> = {};
  let frameworkOwned = 0;
  for (const l of listeners) {
    byType[l.type] = (byType[l.type] || 0) + 1;
    byElement[l.element] = (byElement[l.element] || 0) + 1;
    if (l.frameworkHint) frameworkOwned++;
  }
  const topElements = Object.entries(byElement).sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([element, count]) => ({ element, listenerCount: count }));

  return {
    scope: scopeSelector || 'document',
    scannedElements: raw?.scannedElements ?? 0,
    listenerCount: listeners.length,
    byType,
    topElements,
    frameworkOwnedCount: frameworkOwned,
    instrumentationActive: !!raw?.instrumentationActive,
    listeners: listeners.slice(0, 80),
    coverage: {
      inlineAttributes: listeners.filter(l => l.source === 'inline-attribute').length,
      addEventListener: listeners.filter(l => l.source === 'addEventListener-instrumentation').length,
    },
    notes: [
      raw?.instrumentationActive
        ? 'Live instrumentation (window.__mcpdom_listeners__) is active — addEventListener registrations are captured with capture/passive flags and stack previews.'
        : 'Instrumentation is NOT active in this context: only inline on* attributes are directly observable. To capture addEventListener registrations, load the page with the MCPDOM injected page script (instrumentation patches addEventListener at document_start).',
      'Framework ownership is inferred from handler source markers — heuristics, never claimed as authoritative.',
    ],
  };
}

// ---------------------------------------------------------------------------
// CAP 17 — FONT RENDERING FORENSICS
// ---------------------------------------------------------------------------

export async function analyzeFontRendering(input: { tabId?: number }): Promise<Record<string, unknown>> {
  const probe = `(function(){
    const faces = [];
    for (const sheet of Array.from(document.styleSheets || [])) {
      let rules = [];
      try { rules = Array.from(sheet.cssRules || []); } catch (e) { continue; }
      for (const rule of rules) {
        if (rule.type === 5 /* CSSFontFaceRule */) {
          const style = rule.style;
          faces.push({
            family: style.getPropertyValue('font-family') || null,
            src: (style.getPropertyValue('src') || '').slice(0, 120),
            weight: style.getPropertyValue('font-weight') || null,
            style: style.getPropertyValue('font-style') || null,
            display: style.getPropertyValue('font-display') || null,
          });
        }
      }
    }
    const fontUsages = [];
    for (const el of Array.from(document.querySelectorAll('body *, body')).slice(0, 400)) {
      if (!(el instanceof Element)) continue;
      const cs = getComputedStyle(el);
      const family = cs.getPropertyValue('font-family');
      if (family) {
        fontUsages.push({ element: el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''), family, size: cs.getPropertyValue('font-size'), weight: cs.getPropertyValue('font-weight') });
      }
    }
    const loaded = [];
    try {
      if (document.fonts) {
        for (const face of Array.from(document.fonts.values ? document.fonts.values() : [])) {
          loaded.push({ family: face.family, status: face.status, weight: face.weight || null });
        }
      }
    } catch (e) {}
    return { fontFaces: faces, fontUsages: fontUsages.slice(0, 60), documentFonts: loaded, fontsApi: !!document.fonts };
  })()`;

  const raw = await runInPage(probe, input.tabId);
  const faces = (raw?.fontFaces || []) as Array<Record<string, any>>;
  const usages = (raw?.fontUsages || []) as Array<Record<string, any>>;
  const documentFonts = (raw?.documentFonts || []) as Array<Record<string, any>>;

  // Analysis: cross-reference declared faces vs computed usage vs loaded status.
  const declaredFamilies = new Set(faces.map(f => String(f.family || '').replace(/['"]/g, '').trim()).filter(Boolean));
  const usedFamilies = new Map<string, number>();
  for (const u of usages) {
    const primary = String(u.family || '').split(',')[0].replace(/['"]/g, '').trim();
    if (primary) usedFamilies.set(primary, (usedFamilies.get(primary) || 0) + 1);
  }
  const issues: Array<{ issue: string; detail: string; severity: 'info' | 'warn' | 'error' }> = [];
  for (const [family, count] of usedFamilies) {
    const isGeneric = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui)$/i.test(family);
    if (isGeneric) continue;
    if (!declaredFamilies.has(family)) {
      issues.push({ issue: 'undeclared-family-in-use', detail: `"${family}" is used by ${count} element(s) but no @font-face declares it — the browser falls back if it is not a system font.`, severity: 'warn' });
    }
  }
  for (const f of faces) {
    if (f.display === null || f.display === 'auto') {
      issues.push({ issue: 'font-display-unset', detail: `@font-face ${f.family} has no explicit font-display — swap behavior defaults to "auto" (potential invisible text / FOUT).`, severity: 'info' });
    }
  }
  const notLoaded = documentFonts.filter(d => d.status && String(d.status) !== 'loaded');
  for (const d of notLoaded.slice(0, 10)) {
    issues.push({ issue: 'font-not-loaded', detail: `Font "${d.family}" (weight ${d.weight || 'normal'}) status is ${d.status} — not loaded at analysis time.`, severity: 'warn' });
  }
  const fallbackChains = usages.filter(u => String(u.family || '').split(',').length <= 1);
  if (fallbackChains.length > 0) {
    issues.push({ issue: 'no-fallback-stack', detail: `${fallbackChains.length} element(s) declare a single font-family with no fallback — layout shift risk if the font fails/metrics differ.`, severity: 'warn' });
  }

  return {
    declaredFontFaces: faces,
    declaredFamilyCount: declaredFamilies.size,
    usedFamilies: Array.from(usedFamilies.entries()).map(([family, count]) => ({ family, usageCount: count })),
    documentFontsStatus: documentFonts.slice(0, 30),
    fontsApiAvailable: !!raw?.fontsApi,
    issues,
    issueCount: issues.length,
    notes: [
      'Font metrics analysis: @font-face declarations cross-referenced with computed font-family usage and document.fonts load status.',
      'In JSDOM, document.fonts and layout metrics are limited — @font-face CSSOM analysis remains real; load-status is reported only when the API exists.',
    ],
  };
}
