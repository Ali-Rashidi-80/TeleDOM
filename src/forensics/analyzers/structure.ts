/**
 * Structural analyzers:
 *   CAP 07 — Selector survivability scorer
 *   CAP 08 — Component boundary detector
 *   CAP 09 — Frame / iframe forensics
 *   CAP 10 — Shadow DOM forensics
 */

import { BaseEvent } from '../../types/events';
import { DOMSnapshot } from '../../types/dom-node';
import { flattenSnapshot, FlatElement, selectorOfFlat } from '../session-access';
import { EvidenceBuilder, confidenceBand } from '../evidence-model';

// ---------------------------------------------------------------------------
// CAP 07 — SELECTOR SURVIVABILITY SCORER
// ---------------------------------------------------------------------------

export interface SelectorScore {
  selector: string;
  survivability: number;
  band: string;
  breakdown: {
    domStability: number;
    semanticStability: number;
    uniqueness: number;
    ancestryStability: number;
    frameworkAttributeRisk: number;
    textVolatility: number;
    positionDependence: number;
  };
  evidenceCount: number;
  notes: string[];
}

const FRAMEWORK_ATTR_PATTERNS = [
  /data-v-[0-9a-f]/, /__react|\$react/i, /_ngcontent|_nghost/, /css-[a-z0-9]{5}/, /sc-[A-Za-z]/, /jsx-\d+/, /ember\d+/, /data-styled/, /data-v\b/,
];

export function scoreSelectorSurvivability(input: {
  selector?: string;
  mutationHistory?: BaseEvent[];
  snapshot?: DOMSnapshot;
  candidateSelectors?: Array<{ selector: string; matches: number }>;
}): SelectorScore[] {
  const results: SelectorScore[] = [];
  const mutations = input.mutationHistory || [];

  const analyze = (selector: string, matches?: number): SelectorScore => {
    const notes: string[] = [];
    // 1. Uniqueness — from candidate matching data or selector structure.
    let uniqueness = 0.5;
    if (matches !== undefined) {
      uniqueness = matches === 1 ? 0.95 : matches === 0 ? 0.1 : Math.max(0.15, 1 - (matches - 1) * 0.2);
      if (matches === 0) notes.push('Selector currently matches 0 elements — INVALID target.');
      if (matches > 1) notes.push(`Selector matches ${matches} elements — ambiguous.`);
    } else if (/^#[A-Za-z][\w-]*$/.test(selector)) {
      uniqueness = 0.92; notes.push('ID-based selector: high uniqueness.');
    } else if (selector.includes('nth-child') || selector.includes('nth-of-type')) {
      uniqueness = 0.5; notes.push('Positional pseudo-class reduces structural resilience.');
    }

    // 2. DOM stability — mutations affecting this selector's target.
    const targetMutations = mutations.filter(m =>
      m.targetSelector === selector || (m.payload as any)?.selectorHint === selector);
    const churn = targetMutations.length;
    const domStability = Math.max(0.1, 1 - churn * 0.12);
    if (churn > 0) notes.push(`${churn} recorded mutation(s) touched this element.`);

    // 3. Framework-generated attributes in the selector.
    const frameworkHits = FRAMEWORK_ATTR_PATTERNS.filter(p => p.test(selector)).length;
    // Hashed/scoped attributes regenerate between builds — heavily penalized.
    const frameworkRisk = Math.max(0.05, 1 - frameworkHits * 0.5);
    if (frameworkHits > 0) notes.push('Selector relies on framework-generated attributes (hashed/regenerated at build time).');

    // 4. Text dependence.
    const textDependent = /:contains\(|=\s*"/.test(selector);
    const textVolatility = textDependent ? 0.35 : 0.9;
    if (textDependent) notes.push('Selector depends on text content — volatile under copy changes.');

    // 5. Position dependence.
    const positionDependent = /nth-|first-child|last-child|only-child|\+\s|~\s/.test(selector);
    const positionScore = positionDependent ? 0.4 : 0.9;
    if (positionDependent) notes.push('Selector depends on sibling ordering.');

    // 6. Depth / ancestry stability.
    const depth = (selector.match(/>/g) || []).length;
    const ancestryStability = depth === 0 ? 0.85 : Math.max(0.3, 0.9 - depth * 0.18);
    if (depth >= 3) notes.push(`Deep chain (${depth + 1} levels) — fragile under refactors.`);

    // 7. Semantic stability — role/aria/data-testid hints.
    const semantic = /data-testid|aria-label|role=|\[name=|\[type=/.test(selector);
    const semanticStability = semantic ? 0.9 : 0.55;
    if (semantic) notes.push('Semantic attributes present — resilient to layout changes.');

    const breakdown = {
      domStability: Number(domStability.toFixed(2)),
      semanticStability,
      uniqueness: Number(uniqueness.toFixed(2)),
      ancestryStability: Number(ancestryStability.toFixed(2)),
      frameworkAttributeRisk: Number(frameworkRisk.toFixed(2)),
      textVolatility,
      positionDependence: positionScore,
    };
    const survivability = Number((
      breakdown.domStability * 0.25 +
      breakdown.semanticStability * 0.15 +
      breakdown.uniqueness * 0.2 +
      breakdown.ancestryStability * 0.14 +
      breakdown.frameworkAttributeRisk * 0.12 +
      breakdown.textVolatility * 0.07 +
      breakdown.positionDependence * 0.07
    ).toFixed(3));

    return {
      selector,
      survivability,
      band: survivability >= 0.75 ? 'ROBUST' : survivability >= 0.5 ? 'MODERATE' : survivability >= 0.3 ? 'FRAGILE' : 'CRITICAL',
      breakdown,
      evidenceCount: churn + notes.length,
      notes,
    };
  };

  if (input.selector) results.push(analyze(input.selector));
  for (const cand of input.candidateSelectors || []) {
    results.push(analyze(cand.selector, cand.matches));
  }
  results.sort((a, b) => b.survivability - a.survivability);
  return results;
}

// ---------------------------------------------------------------------------
// CAP 08 — COMPONENT BOUNDARY DETECTOR
// ---------------------------------------------------------------------------

export interface ComponentRegion {
  selector: string;
  nodeId?: number;
  tagName: string;
  framework: 'react' | 'vue' | 'angular' | 'web-components' | 'generic';
  evidence: string[];
  childComponentCount: number;
  depth: number;
  confidence: number;
  band: string;
}

export function detectComponentBoundaries(input: {
  snapshot?: DOMSnapshot;
  events?: BaseEvent[];
}): { components: ComponentRegion[]; framework: { detected: string; evidence: string[] }; summary: { totalComponents: number; byFramework: Record<string, number> } } {
  const components: ComponentRegion[] = [];
  const frameworkEvidence: string[] = [];
  let detectedFramework = 'generic';
  const events = input.events || [];

  // Framework detection from attributes + mutation patterns.
  const flat = input.snapshot ? flattenSnapshot(input.snapshot) : null;
  const elements: FlatElement[] = flat ? flat.elements : [];
  const attrPresence = (pred: (name: string) => boolean): number =>
    elements.reduce((count, el) => count + Object.keys(el.attributes).filter(pred).length, 0);

  const reactAttrs = attrPresence(n => /^__react|\$react|^data-reactroot|^aria-/i.test(n) && /react/i.test(n));
  const reactKeys = elements.filter(el => Object.keys(el.attributes).some(n => /^data-reactid|^\$/.test(n))).length;
  const vueAttrs = attrPresence(n => /^data-v-/.test(n));
  const angularAttrs = attrPresence(n => /^_ngcontent|^_nghost|^ng-/.test(n));
  const customElements = elements.filter(el => el.tagName.includes('-')).length;

  if (reactAttrs + reactKeys > 0) { detectedFramework = 'react'; frameworkEvidence.push(`React markers on ${reactAttrs + reactKeys} elements (data-reactid / $ fiber attributes).`); }
  else if (vueAttrs > 0) { detectedFramework = 'vue'; frameworkEvidence.push(`Vue scoped attributes (data-v-*) on ${vueAttrs} attributes.`); }
  else if (angularAttrs > 0) { detectedFramework = 'angular'; frameworkEvidence.push(`Angular emulation attributes (_ngcontent/_nghost) on ${angularAttrs} attributes.`); }
  else if (customElements > 0) { detectedFramework = 'web-components'; frameworkEvidence.push(`${customElements} custom elements (tag names with hyphens).`); }

  // Whole-subtree replacement patterns in mutations → component re-render.
  const subtreeReplacements = events.filter(e =>
    e.type === 'DOM_MUTATION_REMOVE' && Number((e.payload as any)?.removedSubtreeNodeCount ?? 0) > 5);
  if (subtreeReplacements.length > 0) {
    frameworkEvidence.push(`${subtreeReplacements.length} whole-subtree replacements recorded — consistent with virtual-DOM component re-renders.`);
  }

  // Identify boundaries: subtrees whose (grand)children have framework markers
  // or custom elements; plus elements targeted by subtree replacements.
  const byId = flat ? flat.byId : new Map<number, FlatElement>();
  for (const el of elements) {
    const evidence: string[] = [];
    let framework: ComponentRegion['framework'] = 'generic';
    const attrs = Object.keys(el.attributes);
    if (attrs.some(a => /^data-v-/.test(a))) { framework = 'vue'; evidence.push('data-v-* scoped attribute on this element.'); }
    else if (attrs.some(a => /^_ngcontent|^_nghost/.test(a))) { framework = 'angular'; evidence.push('Angular content projection attributes.'); }
    else if (attrs.some(a => /^data-reactid|^\$|__react/.test(a))) { framework = 'react'; evidence.push('React hydration markers.'); }
    else if (el.tagName.includes('-')) { framework = 'web-components'; evidence.push('Custom element tag.'); }

    // children with DIFFERENT framework marker → boundary
    const children = (el.attributes.id ? [] : []);
    void children;
    let childMarkerCount = 0;
    for (const childId of Object.values(el)) void childId;
    // count children from flat structure
    const childElements = elements.filter(c => c.parentId === el.id);
    for (const child of childElements) {
      const childAttrs = Object.keys(child.attributes);
      if (childAttrs.some(a => /^data-v-/.test(a)) || child.tagName.includes('-') || childAttrs.some(a => /^_ngcontent/.test(a)) || childAttrs.some(a => /^data-reactid/.test(a))) {
        childMarkerCount++;
      }
    }
    if (childMarkerCount >= 2) evidence.push(`${childMarkerCount} children carry framework markers → likely component root boundary.`);

    // subtree replacement hit
    const replacedHere = subtreeReplacements.some(e => {
      const sel = e.targetSelector || (e.payload as any)?.selectorHint || '';
      return sel && sel.includes(el.attributes.id ? `#${el.attributes.id}` : el.tagName);
    });
    if (replacedHere) evidence.push('Element subtree was replaced wholesale in recorded mutations (component re-render signature).');

    if (evidence.length > 0) {
      const ev = new EvidenceBuilder(`Element ${selectorOfFlat(el, byId)} is a component boundary (${framework})`, 'Component boundary inference (CAP 08)');
      for (const e of evidence.slice(0, 4)) ev.add('DOM_OBSERVATION', e);
      if (replacedHere) ev.add('MUTATION_RECORD', 'Subtree replacement pattern observed');
      const finding = ev.build();
      components.push({
        selector: selectorOfFlat(el, byId),
        nodeId: el.id,
        tagName: el.tagName,
        framework,
        evidence,
        childComponentCount: childMarkerCount,
        depth: el.depth,
        confidence: finding.confidence,
        band: finding.band,
      });
    }
  }

  // Cap: too many boundaries = weak signal; keep strongest 30.
  components.sort((a, b) => b.confidence - a.confidence);
  const byFramework: Record<string, number> = {};
  for (const c of components.slice(0, 30)) byFramework[c.framework] = (byFramework[c.framework] || 0) + 1;

  return {
    components: components.slice(0, 30),
    framework: { detected: detectedFramework, evidence: frameworkEvidence },
    summary: { totalComponents: components.length, byFramework },
  };
}

// ---------------------------------------------------------------------------
// CAP 09 — FRAME / IFRAME FORENSICS
// ---------------------------------------------------------------------------

export interface FrameInfo {
  frameSelector: string;
  nodeId?: number;
  src: string;
  title?: string;
  crossOrigin: boolean | null;
  childFrames: FrameInfo[];
  networkEvents: Array<{ summary: string; eventId: string; timestamp: number }>;
  consoleEvents: Array<{ summary: string; eventId: string; timestamp: number }>;
  domMutations: Array<{ summary: string; eventId: string; timestamp: number }>;
}

export function analyzeFrames(input: { snapshot?: DOMSnapshot; events?: BaseEvent[] }): {
  frames: FrameInfo[];
  totalFrames: number;
  crossOriginCount: number;
  networkUnattributed: number;
  notes: string[];
} {
  const events = input.events || [];
  const notes: string[] = [];
  const flat = input.snapshot ? flattenSnapshot(input.snapshot) : null;
  const elements = flat ? flat.elements : [];
  const byId = flat ? flat.byId : new Map<number, FlatElement>();

  const iframes = elements.filter(el => el.tagName === 'iframe' || el.tagName === 'frame');
  const frameInfos: FrameInfo[] = [];

  const networkEvents = events.filter(e => e.category === 'NETWORK');
  const consoleEvents = events.filter(e => e.category === 'CONSOLE' || e.category === 'ERROR');
  const domMutations = events.filter(e => e.category === 'DOM');

  for (const iframe of iframes) {
    const src = iframe.attributes.src || '';
    let crossOrigin: boolean | null = null;
    if (src && /^https?:/i.test(src)) {
      try {
        crossOrigin = new URL(src).origin !== (input.snapshot?.origin || 'null');
      } catch { crossOrigin = null; }
    }
    // attribute events to a frame when the event payload or selector references it
    const frameSelector = selectorOfFlat(iframe, byId);
    const matchFrame = (selector?: string): boolean =>
      !!selector && (selector === frameSelector || selector.startsWith(frameSelector) || !!iframe.attributes.id && selector.includes(`#${iframe.attributes.id}`));
    const srcKey = src ? src.replace(/[?#].*$/, '') : '';

    const frameNet = networkEvents.filter(e => {
      const url = String((e.payload as any).url || '');
      return matchFrame(e.targetSelector) || (srcKey && url.startsWith(srcKey)) || url.includes(new URL(src || 'http://invalid', 'https://x.invalid').pathname.slice(1));
    }).map(e => ({ summary: String((e.payload as any).url || e.type), eventId: e.id, timestamp: e.timestamp }));
    const frameConsole = consoleEvents.filter(e => matchFrame(e.targetSelector)).map(e => ({ summary: String((e.payload as any).message || (e.payload as any).text || e.type).slice(0, 120), eventId: e.id, timestamp: e.timestamp }));
    const frameDom = domMutations.filter(e => matchFrame(e.targetSelector)).map(e => ({ summary: `${e.type} ${e.targetSelector || ''}`.trim(), eventId: e.id, timestamp: e.timestamp }));

    frameInfos.push({
      frameSelector,
      nodeId: iframe.id,
      src,
      title: iframe.attributes.title,
      crossOrigin,
      childFrames: [],
      networkEvents: frameNet.slice(0, 20),
      consoleEvents: frameConsole.slice(0, 15),
      domMutations: frameDom.slice(0, 20),
    });
  }

  // hierarchy: frame inside frame (parent chain contains another frame)
  for (const frame of frameInfos) {
    const el = elements.find(e => selectorOfFlat(e, byId) === frame.frameSelector);
    if (!el) continue;
    let cursor = el.parentId != null ? byId.get(el.parentId) : undefined;
    while (cursor) {
      if (cursor.tagName === 'iframe' || cursor.tagName === 'frame') {
        const parentFrame = frameInfos.find(f => f.nodeId === cursor!.id);
        if (parentFrame) { parentFrame.childFrames.push(frame); }
      }
      cursor = cursor.parentId != null ? byId.get(cursor.parentId) : undefined;
    }
  }

  const attributed = new Set(frameInfos.flatMap(f => [...f.networkEvents.map(n => n.eventId), ...f.consoleEvents.map(c => c.eventId)]));
  const networkUnattributed = networkEvents.filter(e => !attributed.has(e.id)).length;
  if (iframes.length === 0) notes.push('No frames detected in this state.');
  if (networkUnattributed > 0) notes.push(`${networkUnattributed} network events could not be attributed to a specific frame (main frame or cross-origin restrictions).`);
  if (frameInfos.some(f => f.crossOrigin)) notes.push('Cross-origin frames present: deep inspection requires live instrumentation; recorded data is limited to the frame element and its src.');

  return { frames: frameInfos, totalFrames: frameInfos.length, crossOriginCount: frameInfos.filter(f => f.crossOrigin).length, networkUnattributed, notes };
}

// ---------------------------------------------------------------------------
// CAP 10 — SHADOW DOM FORENSICS
// ---------------------------------------------------------------------------

export interface ShadowRootInfo {
  hostSelector: string;
  hostNodeId?: number;
  mode: 'open' | 'closed' | 'unknown';
  slotDistribution: Array<{ slotName: string; assignedCount: number }>;
  childCount: number;
  depth: number;
  mutationsObserved: Array<{ summary: string; eventId: string; timestamp: number }>;
  styleBoundary: { scopedStylesheets: number; inheritedProperties: string[] };
}

export function analyzeShadowDom(input: { snapshot?: DOMSnapshot; events?: BaseEvent[] }): { roots: ShadowRootInfo[]; totalHosts: number; nestedDepth: number; notes: string[] } {
  const events = input.events || [];
  const notes: string[] = [];
  const flat = input.snapshot ? flattenSnapshot(input.snapshot) : null;
  const elements = flat ? flat.elements : [];
  const byId = flat ? flat.byId : new Map<number, FlatElement>();

  // Snapshot-based: nodes flagged as shadow hosts / roots by the recorder.
  const rawNodes: Array<Record<string, any>> = input.snapshot ? Object.values(input.snapshot.nodes || {}) : [];
  const hosts = rawNodes.filter(n => n.isShadowHost);
  const shadowRoots = rawNodes.filter(n => n.isShadowRoot);
  const hostElements = elements.filter(el =>
    hosts.some(h => h.id === el.id) || Object.keys(el.attributes).some(a => /^shadow-|^data-shadow/.test(a)));

  const roots: ShadowRootInfo[] = [];
  for (const host of hostElements) {
    const hostNode = rawNodes.find(n => n.id === host.id) || {};
    const mode = (hostNode.shadowMode as 'open' | 'closed') || (host.attributes['shadow-mode'] as 'open' | 'closed') || 'unknown';
    // slots: children with slot attributes in host subtree
    const subtreeIds = new Set<number>();
    const collect = (id: number) => {
      const node: any = (input.snapshot!.nodes as any)[id];
      if (!node) return;
      subtreeIds.add(id);
      for (const c of node.children || []) collect(c);
    };
    collect(host.id);
    const slotElements = elements.filter(el => subtreeIds.has(el.id) && el.attributes.slot !== undefined);
    const slotMap = new Map<string, number>();
    for (const slot of slotElements) {
      const name = slot.attributes.slot || 'default';
      slotMap.set(name, (slotMap.get(name) || 0) + 1);
    }
    // mutations recorded inside this shadow tree
    const hostSelector = selectorOfFlat(host, byId);
    const mutations = events.filter(e => e.category === 'DOM' && (e.targetSelector || '').startsWith(hostSelector)).map(e => ({ summary: `${e.type} ${e.targetSelector}`, eventId: e.id, timestamp: e.timestamp }));

    roots.push({
      hostSelector,
      hostNodeId: host.id,
      mode,
      slotDistribution: Array.from(slotMap.entries()).map(([slotName, assignedCount]) => ({ slotName, assignedCount })),
      childCount: host.childCount,
      depth: 1,
      mutationsObserved: mutations.slice(0, 15),
      styleBoundary: { scopedStylesheets: 0, inheritedProperties: [] },
    });
  }

  // nested depth from raw shadow root chains
  let nestedDepth = 0;
  for (const root of shadowRoots) {
    let depth = 0;
    let cursor: any = root;
    const seen = new Set<number>();
    while (cursor?.parentId && !seen.has(cursor.parentId)) {
      seen.add(cursor.parentId);
      const parent: any = (input.snapshot?.nodes as any)?.[cursor.parentId];
      if (parent?.isShadowHost || parent?.isShadowRoot) depth++;
      cursor = parent;
    }
    nestedDepth = Math.max(nestedDepth, depth);
  }

  if (roots.length === 0) notes.push('No shadow DOM hosts detected in the recorded state. Live shadow roots (open mode) can be probed via fx_shadow_dom_forensics on a live page.');
  if (shadowRoots.length > 0) notes.push(`${shadowRoots.length} shadow roots recorded with mode flags by the DOM instrumentation.`);

  return { roots, totalHosts: roots.length, nestedDepth, notes };
}
