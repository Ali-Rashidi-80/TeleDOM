import { DOMAnalysisResult } from '../types/browser-control';
import { LiveDOMInspector } from './live-dom-inspector';
import { RedactionEngine } from './redaction-engine';
import { directText } from './selector-robustness';
import { isVolatileClass } from './dom-fingerprint';

/**
 * DOM Analysis Engine — powers the analyzer tool family.
 *
 * Every analyzer is a bounded, privacy-aware, DOM-only function usable in
 * both the browser content script and the Node/JSDOM simulation context.
 * Results are structured (never raw HTML dumps), truncated for memory
 * safety, and include honest warnings when an API is unavailable.
 */

export type AnalyzerFunction = (doc: Document, options: any) => DOMAnalysisResult;

const INTERACTIVE_SELECTOR = 'a[href], button, input, select, textarea, [role="button"], [role="link"], [role="tab"], [onclick], [tabindex]';

function truncate<T>(items: T[], limit: number): { items: T[]; truncated: boolean } {
  return { items: items.slice(0, limit), truncated: items.length > limit };
}

function base(analyzer: string, summary: string, count: number, items: any[], warnings: string[], truncated: boolean): DOMAnalysisResult {
  return { analyzer, summary, count, items, warnings, truncated };
}

function selectorOf(el: Element): string {
  try {
    return LiveDOMInspector.inspectElement(el).bestSelector;
  } catch {
    return el.tagName.toLowerCase();
  }
}

// ---------------------------------------------------------------------------
// Form analysis
// ---------------------------------------------------------------------------
export const analyzeForms: AnalyzerFunction = (doc) => {
  const forms = Array.from(doc.querySelectorAll('form'));
  const items = forms.map((form) => {
    const fields = Array.from(form.querySelectorAll('input, select, textarea')).map((f) => ({
      tag: f.tagName.toLowerCase(),
      type: f.getAttribute('type') || (f.tagName.toLowerCase() === 'textarea' ? 'textarea' : f.tagName.toLowerCase() === 'select' ? 'select' : 'text'),
      name: f.getAttribute('name') || undefined,
      id: f.getAttribute('id') || undefined,
      required: f.hasAttribute('required'),
      pattern: f.getAttribute('pattern') || undefined,
      maxLength: f.getAttribute('maxlength') || undefined,
      placeholder: f.getAttribute('placeholder') || undefined,
      ariaLabel: f.getAttribute('aria-label') || undefined,
      autocomplete: f.getAttribute('autocomplete') || undefined,
      hasLabel: Boolean(f.getAttribute('id') && doc.querySelector(`label[for="${f.getAttribute('id')}"]`)) || Boolean(f.closest('label')),
      defaultValue: (f as HTMLInputElement).value !== undefined && (f.getAttribute('type') || 'text') !== 'password' ? String((f as HTMLInputElement).value).slice(0, 40) : undefined,
    }));
    return {
      selector: selectorOf(form),
      action: form.getAttribute('action') || undefined,
      method: (form.getAttribute('method') || 'GET').toUpperCase(),
      id: form.getAttribute('id') || undefined,
      fieldCount: fields.length,
      submitButton: form.querySelector('button[type="submit"], input[type="submit"]') ? selectorOf(form.querySelector('button[type="submit"], input[type="submit"]')!) : undefined,
      validationAttributes: fields.filter((f) => f.required || f.pattern).length,
      fields,
    };
  });
  const t = truncate(items, 50);
  return base('analyze_forms', `${forms.length} form(s) with ${items.reduce((s, f) => s + f.fieldCount, 0)} total fields`, forms.length, t.items, [], t.truncated);
};

// ---------------------------------------------------------------------------
// Link map
// ---------------------------------------------------------------------------
export const analyzeLinks: AnalyzerFunction = (doc) => {
  const links = Array.from(doc.querySelectorAll('a[href]'));
  const items = links.map((a) => ({
    href: a.getAttribute('href') || '',
    text: directText(a).slice(0, 60),
    selector: selectorOf(a),
    rel: a.getAttribute('rel') || undefined,
    target: a.getAttribute('target') || undefined,
    download: a.hasAttribute('download'),
    external: /^https?:\/\//i.test(a.getAttribute('href') || '') && !sameOrigin((a.getAttribute('href') || ''), doc),
    anchorOnly: (a.getAttribute('href') || '').startsWith('#'),
  }));
  const t = truncate(items, 200);
  return base(
    'extract_links',
    `${links.length} link(s): ${items.filter((l) => l.external).length} external, ${items.filter((l) => l.anchorOnly).length} anchors`,
    links.length,
    t.items,
    [],
    t.truncated
  );
};

function sameOrigin(href: string, doc: Document): boolean {
  try {
    return new URL(href, doc.defaultView?.location?.href || 'http://localhost').origin === (doc.defaultView?.location?.origin || '');
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Media inventory
// ---------------------------------------------------------------------------
export const analyzeMedia: AnalyzerFunction = (doc) => {
  const images = Array.from(doc.querySelectorAll('img'));
  const videos = Array.from(doc.querySelectorAll('video'));
  const audios = Array.from(doc.querySelectorAll('audio'));
  const canvases = Array.from(doc.querySelectorAll('canvas'));
  const warnings: string[] = [];
  const items = [
    ...images.map((img) => ({
      kind: 'img' as const,
      selector: selectorOf(img),
      src: (img.getAttribute('src') || '').slice(0, 150),
      alt: img.getAttribute('alt'),
      width: img.getAttribute('width') || undefined,
      height: img.getAttribute('height') || undefined,
      naturalWidth: (img as HTMLImageElement).naturalWidth || undefined,
      naturalHeight: (img as HTMLImageElement).naturalHeight || undefined,
      lazy: img.getAttribute('loading') === 'lazy',
      missingAlt: !img.hasAttribute('alt'),
    })),
    ...videos.map((v) => ({
      kind: 'video' as const,
      selector: selectorOf(v),
      src: (v.getAttribute('src') || v.querySelector('source')?.getAttribute('src') || '').slice(0, 150),
      controls: v.hasAttribute('controls'),
      autoplay: v.hasAttribute('autoplay'),
      muted: v.hasAttribute('muted'),
      poster: v.getAttribute('poster') || undefined,
    })),
    ...audios.map((a) => ({
      kind: 'audio' as const,
      selector: selectorOf(a),
      src: (a.getAttribute('src') || a.querySelector('source')?.getAttribute('src') || '').slice(0, 150),
      controls: a.hasAttribute('controls'),
    })),
    ...canvases.map((c) => ({
      kind: 'canvas' as const,
      selector: selectorOf(c),
      width: (c as HTMLCanvasElement).width,
      height: (c as HTMLCanvasElement).height,
    })),
  ];
  const missingAlt = items.filter((i) => (i as any).missingAlt).length;
  if (missingAlt) warnings.push(`${missingAlt} image(s) missing alt text (accessibility risk).`);
  const t = truncate(items, 200);
  return base('analyze_media', `${images.length} images, ${videos.length} videos, ${audios.length} audios, ${canvases.length} canvases`, items.length, t.items, warnings, t.truncated);
};

// ---------------------------------------------------------------------------
// CSS variables / fonts / palette
// ---------------------------------------------------------------------------
export const analyzeCSSVariables: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const warnings: string[] = [];
  const variables: Record<string, string> = {};
  if (win?.getComputedStyle) {
    const styles = win.getComputedStyle(doc.documentElement);
    // Enumerable CSS custom properties live on :root
    for (let i = 0; i < styles.length; i++) {
      const prop = styles[i];
      if (prop.startsWith('--')) {
        variables[prop] = styles.getPropertyValue(prop).trim().slice(0, 100);
      }
    }
  } else {
    warnings.push('getComputedStyle unavailable — CSS variables not resolvable in this context.');
    // Fallback: scan inline style blocks for --var declarations
    for (const styleEl of Array.from(doc.querySelectorAll('style'))) {
      const text = styleEl.textContent || '';
      const re = /(--[a-zA-Z0-9-]+)\s*:\s*([^;}]+)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text))) {
        variables[m[1]] = m[2].trim().slice(0, 100);
      }
    }
  }
  const entries = Object.entries(variables).map(([name, value]) => ({ name, value }));
  return base('get_css_variables', `${entries.length} CSS custom properties found`, entries.length, entries, warnings, false);
};

export const analyzeFonts: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const warnings: string[] = [];
  const fonts = new Map<string, number>();
  if (win?.getComputedStyle) {
    for (const el of Array.from(doc.querySelectorAll('body, body *')).slice(0, 800)) {
      const cs = win.getComputedStyle(el as Element);
      const family = cs.fontFamily || '';
      const size = cs.fontSize || '';
      const key = `${family.split(',')[0].replace(/["']/g, '').trim()} @ ${size}`;
      fonts.set(key, (fonts.get(key) || 0) + 1);
    }
  } else {
    warnings.push('getComputedStyle unavailable — font usage analysis requires rendered styles.');
  }
  const items = Array.from(fonts.entries())
    .map(([font, usage]) => ({ font, usage }))
    .sort((a, b) => b.usage - a.usage);
  return base('analyze_fonts', `${items.length} distinct font/size combinations`, items.length, items, warnings, false);
};

export const extractColorPalette: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const warnings: string[] = [];
  const colors = new Map<string, number>();
  if (win?.getComputedStyle) {
    for (const el of Array.from(doc.querySelectorAll('body, body *')).slice(0, 800)) {
      const cs = win.getComputedStyle(el as Element);
      for (const prop of ['color', 'background-color', 'border-top-color']) {
        const val = cs.getPropertyValue(prop);
        if (val && val !== 'rgba(0, 0, 0, 0)') {
          colors.set(val, (colors.get(val) || 0) + 1);
        }
      }
    }
  } else {
    // Fallback: parse style attributes + stylesheets text
    for (const el of Array.from(doc.querySelectorAll('[style]')).slice(0, 300)) {
      const s = el.getAttribute('style') || '';
      const re = /(color)\s*:\s*([^;]+)/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(s))) colors.set(m[2].trim(), (colors.get(m[2].trim()) || 0) + 1);
    }
    warnings.push('getComputedStyle unavailable — palette from inline styles only.');
  }
  const items = Array.from(colors.entries())
    .map(([color, usage]) => ({ color, usage }))
    .sort((a, b) => b.usage - a.usage)
    .slice(0, 40);
  return base('extract_color_palette', `${colors.size} distinct colors in use`, colors.size, items, warnings, false);
};

// ---------------------------------------------------------------------------
// Layout diagnostics
// ---------------------------------------------------------------------------
export const detectZIndexConflicts: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const warnings: string[] = [];
  const items: any[] = [];
  if (!win?.getComputedStyle) {
    warnings.push('getComputedStyle unavailable — z-index analysis requires rendered styles.');
    return base('detect_zindex_conflicts', 'unavailable', 0, [], warnings, false);
  }
  const zElements: Array<{ selector: string; z: number; position: string; stacking: string }> = [];
  for (const el of Array.from(doc.querySelectorAll('body *')).slice(0, 1000)) {
    const cs = win.getComputedStyle(el);
    const z = cs.zIndex;
    if (z && z !== 'auto' && parseInt(z, 10) > 0) {
      zElements.push({
        selector: selectorOf(el),
        z: parseInt(z, 10),
        position: cs.position,
        stacking: cs.position === 'fixed' || cs.position === 'sticky' || cs.opacity !== '1' || cs.transform !== 'none' ? 'creates-stacking-context' : 'plain',
      });
    }
  }
  // Conflict = two elements sharing the same z-index where one overlaps another's bounds
  for (let i = 0; i < zElements.length; i++) {
    for (let j = i + 1; j < zElements.length; j++) {
      if (zElements[i].z === zElements[j].z) {
        items.push({
          zIndex: zElements[i].z,
          elements: [zElements[i].selector, zElements[j].selector],
          note: 'same z-index — DOM order decides paint order; verify overlay intent.',
        });
      }
    }
    if (zElements[i].z > 100000) {
      items.push({ zIndex: zElements[i].z, elements: [zElements[i].selector], note: 'extremely high z-index — competes with platform overlays (MCPDOM uses 2147483640+).' });
    }
  }
  return base('detect_zindex_conflicts', `${zElements.length} z-indexed elements, ${items.length} potential conflict(s)`, items.length, truncate(items, 40).items, warnings, items.length > 40);
};

export const detectLayoutIssues: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const items: any[] = [];
  const docEl = doc.documentElement;
  const body = doc.body;
  const scrollW = Math.max(docEl?.scrollWidth || 0, body?.scrollWidth || 0);
  const clientW = win?.innerWidth || docEl?.clientWidth || 0;
  const horizontalOverflow = scrollW > clientW + 1;
  if (horizontalOverflow) {
    items.push({ issue: 'horizontal-overflow', detail: `document scrollWidth ${scrollW} exceeds viewport ${clientW}` });
    // Identify widest offenders
    if (win?.getComputedStyle) {
      for (const el of Array.from(doc.querySelectorAll('body *')).slice(0, 600)) {
        const rect = (el as Element).getBoundingClientRect();
        if (rect.right > clientW + 2 && rect.width > 100) {
          items.push({ issue: 'element-exceeds-viewport', selector: selectorOf(el as Element), right: Math.round(rect.right), width: Math.round(rect.width) });
          if (items.length > 15) break;
        }
      }
    }
  }
  // zero-size interactive elements
  let deadInteractive = 0;
  for (const el of Array.from(doc.querySelectorAll(INTERACTIVE_SELECTOR)).slice(0, 500)) {
    const rect = (el as Element).getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) deadInteractive++;
  }
  if (deadInteractive) items.push({ issue: 'zero-size-interactive-elements', count: deadInteractive });
  return base('detect_layout_issues', horizontalOverflow ? `HORIZONTAL OVERFLOW: page is ${scrollW - clientW}px wider than viewport` : 'No horizontal overflow detected', items.length, items, [], false);
};

// ---------------------------------------------------------------------------
// Interactive census
// ---------------------------------------------------------------------------
export const censusInteractiveElements: AnalyzerFunction = (doc) => {
  const els = Array.from(doc.querySelectorAll(INTERACTIVE_SELECTOR));
  const byRole = new Map<string, number>();
  const items = els.slice(0, 300).map((el) => {
    const info = safeInspect(el);
    const roleKey = info.role || el.tagName.toLowerCase();
    byRole.set(roleKey, (byRole.get(roleKey) || 0) + 1);
    return {
      selector: info.bestSelector,
      tag: info.tag,
      role: info.role,
      text: info.text.slice(0, 40),
      visible: info.visibility.isVisible,
      disabled: (el as HTMLButtonElement).disabled || el.hasAttribute('disabled'),
      inViewport: info.visibility.isInViewport,
    };
  });
  return base(
    'census_interactive_elements',
    `${els.length} interactive elements: ${Array.from(byRole.entries()).map(([k, v]) => `${k}×${v}`).join(', ') || 'none'}`,
    els.length,
    items,
    [],
    els.length > 300
  );
};

function safeInspect(el: Element) {
  try {
    return LiveDOMInspector.inspectElement(el);
  } catch {
    return {
      tag: el.tagName.toLowerCase(),
      role: undefined as string | undefined,
      text: '',
      bestSelector: el.tagName.toLowerCase(),
      bounds: { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0 },
      visibility: { isVisible: false, isInViewport: false },
    };
  }
}

// ---------------------------------------------------------------------------
// Semantic detection
// ---------------------------------------------------------------------------
export const detectSemanticElements: AnalyzerFunction = (doc) => {
  const semanticTags = ['header', 'nav', 'main', 'aside', 'footer', 'article', 'section', 'figure', 'figcaption', 'mark', 'time', 'address', 'details', 'summary', 'dialog'];
  const items: any[] = [];
  for (const tag of semanticTags) {
    const found = Array.from(doc.querySelectorAll(tag));
    if (found.length) {
      for (const el of found.slice(0, 20)) {
        items.push({
          tag,
          selector: selectorOf(el),
          role: el.getAttribute('role') || implicitLandmark(tag),
          text: directText(el).slice(0, 50),
          childCount: el.children.length,
        });
      }
    }
  }
  const landmarks = items.filter((i) => ['banner', 'navigation', 'main', 'complementary', 'contentinfo'].includes(i.role));
  const warnings: string[] = [];
  if (!items.find((i) => i.tag === 'main')) warnings.push('No <main> element — page lacks a primary landmark.');
  if (doc.querySelectorAll('header').length > 1) warnings.push('Multiple <header> elements outside sections — ambiguous banner landmark.');
  return base('detect_semantic_elements', `${items.length} semantic elements, ${landmarks.length} landmarks`, items.length, truncate(items, 100).items, warnings, items.length > 100);
};

function implicitLandmark(tag: string): string | undefined {
  const map: Record<string, string> = {
    header: 'banner', nav: 'navigation', main: 'main', aside: 'complementary',
    footer: 'contentinfo', article: 'article', section: 'region', form: 'form',
  };
  return map[tag];
}

// ---------------------------------------------------------------------------
// Accessibility quick-scan
// ---------------------------------------------------------------------------
export const scanAccessibilityIssues: AnalyzerFunction = (doc) => {
  const issues: any[] = [];
  // 1. Images without alt
  for (const img of Array.from(doc.querySelectorAll('img')).slice(0, 200)) {
    if (!img.hasAttribute('alt')) {
      issues.push({ rule: 'img-alt', severity: 'error', selector: selectorOf(img), message: 'Image is missing the alt attribute.' });
    }
  }
  // 2. Inputs without labels
  for (const input of Array.from(doc.querySelectorAll("input:not([type=hidden]):not([type=submit]):not([type=button])")).slice(0, 200)) {
    const id = input.getAttribute('id');
    const hasLabel = (id && doc.querySelector(`label[for="${id}"]`)) || input.closest('label') || input.getAttribute('aria-label') || input.getAttribute('aria-labelledby');
    if (!hasLabel) {
      issues.push({ rule: 'input-label', severity: 'error', selector: selectorOf(input), message: 'Form input has no associated label, aria-label or aria-labelledby.' });
    }
  }
  // 3. Buttons/links without accessible text
  for (const el of Array.from(doc.querySelectorAll('button, a[href], [role="button"]')).slice(0, 300)) {
    const text = directText(el).trim();
    const aria = el.getAttribute('aria-label');
    if (!text && !aria) {
      issues.push({ rule: 'accessible-name', severity: 'error', selector: selectorOf(el), message: 'Interactive element has no accessible name (no text, no aria-label).', hint: el.querySelector('img[alt]') ? 'Contains an image — consider alt text or aria-label.' : undefined });
    }
  }
  // 4. Heading hierarchy
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6')).slice(0, 100);
  let lastLevel = 0;
  for (const h of headings) {
    const level = parseInt(h.tagName[1], 10);
    if (lastLevel && level > lastLevel + 1) {
      issues.push({ rule: 'heading-order', severity: 'warning', selector: selectorOf(h), message: `Heading level jumps from h${lastLevel} to h${level}.` });
    }
    lastLevel = level;
  }
  // 5. lang attribute
  if (!doc.documentElement?.getAttribute('lang')) {
    issues.push({ rule: 'html-lang', severity: 'warning', selector: 'html', message: 'The <html> element has no lang attribute.' });
  }
  const errors = issues.filter((i) => i.severity === 'error').length;
  return base('scan_accessibility_issues', `${issues.length} issue(s): ${errors} errors, ${issues.length - errors} warnings`, issues.length, truncate(issues, 100).items, [], issues.length > 100);
};

// ---------------------------------------------------------------------------
// Dead click targets
// ---------------------------------------------------------------------------
export const detectDeadClickTargets: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const items: any[] = [];
  for (const el of Array.from(doc.querySelectorAll(INTERACTIVE_SELECTOR)).slice(0, 500)) {
    const rect = (el as Element).getBoundingClientRect();
    const cs = win?.getComputedStyle ? win.getComputedStyle(el as Element) : null;
    const zeroSize = rect.width === 0 || rect.height === 0;
    const pointerBlocked = cs ? cs.pointerEvents === 'none' : false;
    const hidden = cs ? cs.display === 'none' || cs.visibility === 'hidden' : false;
    const ariaHidden = el.getAttribute('aria-hidden') === 'true';
    if (zeroSize || pointerBlocked || hidden || ariaHidden) {
      items.push({
        selector: selectorOf(el as Element),
        tag: (el as Element).tagName.toLowerCase(),
        text: directText(el as Element).slice(0, 30),
        reasons: [zeroSize && 'zero-size', pointerBlocked && 'pointer-events:none', hidden && `hidden (${cs ? cs.display : '?'}/${cs ? cs.visibility : '?'})`, ariaHidden && 'aria-hidden'].filter(Boolean),
      });
    }
  }
  return base('detect_dead_click_targets', `${items.length} unreachable interactive element(s)`, items.length, truncate(items, 80).items, [], items.length > 80);
};

// ---------------------------------------------------------------------------
// Animations / transitions inventory
// ---------------------------------------------------------------------------
export const inventoryAnimations: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const warnings: string[] = [];
  const items: any[] = [];
  if (!win?.getComputedStyle) {
    warnings.push('getComputedStyle unavailable — animation inventory requires rendered styles.');
    return base('inventory_animations', 'unavailable', 0, [], warnings, false);
  }
  for (const el of Array.from(doc.querySelectorAll('body *')).slice(0, 800)) {
    const cs = win.getComputedStyle(el as Element);
    const animation = cs.animationName !== 'none' ? `${cs.animationName} ${cs.animationDuration}` : null;
    const transition = cs.transitionProperty !== 'none' && cs.transitionProperty !== 'all' ? `${cs.transitionProperty} ${cs.transitionDuration}` : cs.transitionProperty === 'all' ? `all ${cs.transitionDuration}` : null;
    if (animation || transition) {
      items.push({
        selector: selectorOf(el as Element),
        animation,
        transition,
        transitionTiming: cs.transitionTimingFunction || undefined,
      });
    }
  }
  const infinite = items.filter((i) => i.animation && i.animation.includes('infinite'));
  if (infinite.length > 5) warnings.push(`${infinite.length} infinitely looping animations — may indicate decorative spinners or a stuck loading state.`);
  return base('inventory_animations', `${items.length} animated/transitioning elements`, items.length, truncate(items, 80).items, warnings, items.length > 80);
};

// ---------------------------------------------------------------------------
// Frames + shadow DOM
// ---------------------------------------------------------------------------
export const mapFrameTree: AnalyzerFunction = (doc) => {
  const items: any[] = [];
  const walk = (d: Document, path: string, depth: number) => {
    const frames = Array.from(d.querySelectorAll('iframe, frame'));
    for (const frame of frames) {
      const src = frame.getAttribute('src') || '(no src)';
      let accessible = false;
      let childCount: number | null = null;
      try {
        const contentDoc = (frame as HTMLIFrameElement).contentDocument;
        if (contentDoc) {
          accessible = true;
          childCount = contentDoc.querySelectorAll('*').length;
          if (depth < 3) walk(contentDoc, `${path} > ${frame.tagName.toLowerCase()}[${src.slice(0, 50)}]`, depth + 1);
        }
      } catch {
        accessible = false;
      }
      items.push({
        path: `${path} > ${frame.tagName.toLowerCase()}`,
        selector: selectorOf(frame),
        src: src.slice(0, 120),
        title: frame.getAttribute('title') || undefined,
        name: frame.getAttribute('name') || undefined,
        sandbox: frame.getAttribute('sandbox') || undefined,
        accessible,
        childCount,
        limitation: accessible ? undefined : 'Same-origin policy blocks contentDocument access (cross-origin frame).',
      });
    }
  };
  walk(doc, 'document', 0);
  const inaccessible = items.filter((i) => !i.accessible).length;
  return base('map_frame_tree', `${items.length} frame(s), ${inaccessible} inaccessible (cross-origin)`, items.length, items, [], false);
};

export const inventoryShadowRoots: AnalyzerFunction = (doc) => {
  const items: any[] = [];
  const walk = (root: Element | ShadowRoot, path: string, depth: number) => {
    const children = root instanceof ShadowRoot ? Array.from(root.querySelectorAll('*')) : Array.from(root.querySelectorAll('*'));
    for (const el of children) {
      if ((el as any).shadowRoot) {
        const sr = (el as any).shadowRoot as ShadowRoot;
        const srPath = `${path} > ${el.tagName.toLowerCase()}::shadowRoot(${sr.mode})`;
        items.push({
          path: srPath.slice(0, 200),
          hostSelector: selectorOf(el),
          hostTag: el.tagName.toLowerCase(),
          mode: sr.mode,
          childCount: sr.querySelectorAll('*').length,
          styles: sr.querySelectorAll('style').length,
        });
        if (depth < 4) walk(sr, srPath, depth + 1);
      }
      // Recurse into template content? Not live DOM — skip.
    }
  };
  walk(doc.documentElement, 'document', 0);
  return base('inventory_shadow_roots', `${items.length} open shadow root(s) found`, items.length, items, [], false);
};

// ---------------------------------------------------------------------------
// Storage (privacy-aware)
// ---------------------------------------------------------------------------
export const inspectPageStorage: AnalyzerFunction = (doc) => {
  const win = doc.defaultView as any;
  const privacy = new RedactionEngine();
  const warnings: string[] = [];
  const items: any[] = [];
  if (!win?.localStorage || !win?.sessionStorage) {
    return base('inspect_page_storage', 'Web Storage API unavailable in this context', 0, [], ['localStorage/sessionStorage are not accessible here (JSDOM limitation or sandboxed iframe).'], false);
  }
  try {
    for (let i = 0; i < win.localStorage.length; i++) {
      const key = win.localStorage.key(i);
      const rawValue = String(win.localStorage.getItem(key) || '');
      items.push({
        store: 'localStorage',
        key: String(key).slice(0, 80),
        value: privacy.redactByKeyValue(String(key), rawValue).slice(0, 120),
        size: rawValue.length,
      });
    }
  } catch (err: any) {
    warnings.push(`localStorage read failed: ${err.message}`);
  }
  try {
    for (let i = 0; i < win.sessionStorage.length; i++) {
      const key = win.sessionStorage.key(i);
      const rawValue = String(win.sessionStorage.getItem(key) || '');
      items.push({
        store: 'sessionStorage',
        key: String(key).slice(0, 80),
        value: privacy.redactByKeyValue(String(key), rawValue).slice(0, 120),
        size: rawValue.length,
      });
    }
  } catch (err: any) {
    warnings.push(`sessionStorage read failed: ${err.message}`);
  }
  const totalBytes = items.reduce((s, i) => s + (i.size || 0), 0);
  return base('inspect_page_storage', `${items.length} storage entries (~${totalBytes} bytes), sensitive keys redacted`, items.length, truncate(items, 100).items, warnings, items.length > 100);
};

// ---------------------------------------------------------------------------
// Performance metrics
// ---------------------------------------------------------------------------
export const getPerformanceMetrics: AnalyzerFunction = (doc) => {
  const win = doc.defaultView as any;
  const warnings: string[] = [];
  const perf = win?.performance;
  if (!perf?.timing && !perf?.getEntriesByType) {
    return base('get_performance_metrics', 'Performance API unavailable', 0, [], ['window.performance is not exposed in this context.'], false);
  }
  const items: any[] = [];
  try {
    const nav = perf.getEntriesByType?.('navigation')?.[0];
    if (nav) {
      items.push({ metric: 'navigation-timing', domContentLoaded: Math.round(nav.domContentLoadedEventEnd), loadComplete: Math.round(nav.loadEventEnd), domInteractive: Math.round(nav.domInteractive), type: nav.type, redirectCount: nav.redirectCount, sizeTransfer: nav.transferSize });
    } else if (perf.timing) {
      const t = perf.timing;
      items.push({ metric: 'navigation-timing-legacy', domContentLoaded: t.domContentLoadedEventEnd - t.navigationStart, loadComplete: t.loadEventEnd - t.navigationStart, domInteractive: t.domInteractive - t.navigationStart });
    }
    const paints = perf.getEntriesByType?.('paint') || [];
    for (const p of paints) {
      items.push({ metric: p.name, startTime: Math.round(p.startTime) });
    }
    const resources = perf.getEntriesByType?.('resource') || [];
    if (resources.length) {
      const totalDuration = resources.reduce((s: number, r: any) => s + r.duration, 0);
      const slowest = [...resources].sort((a: any, b: any) => b.duration - a.duration).slice(0, 5).map((r: any) => ({ url: String(r.name).slice(0, 100), duration: Math.round(r.duration) }));
      items.push({ metric: 'resource-summary', count: resources.length, totalDuration: Math.round(totalDuration), slowest });
    }
    if (perf.memory) {
      items.push({ metric: 'memory', usedJSHeapMB: Math.round((perf.memory.usedJSHeapSize / 1048576) * 10) / 10, totalJSHeapMB: Math.round((perf.memory.totalJSHeapSize / 1048576) * 10) / 10 });
    }
  } catch (err: any) {
    warnings.push(`performance read failed: ${err.message}`);
  }
  return base('get_performance_metrics', `${items.length} metric group(s)`, items.length, items, warnings, false);
};

// ---------------------------------------------------------------------------
// SEO / structured data
// ---------------------------------------------------------------------------
export const extractSEOMetadata: AnalyzerFunction = (doc) => {
  const meta = (name: string) => doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || undefined;
  const metaProperty = (prop: string) => doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') || undefined;
  const items: any[] = [
    { field: 'title', value: doc.title || undefined },
    { field: 'description', value: meta('description') },
    { field: 'canonical', value: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') },
    { field: 'robots', value: meta('robots') },
    { field: 'viewport', value: meta('viewport') },
    { field: 'charset', value: doc.querySelector('meta[charset]')?.getAttribute('charset') },
    { field: 'og:title', value: metaProperty('og:title') },
    { field: 'og:description', value: metaProperty('og:description') },
    { field: 'og:image', value: metaProperty('og:image') },
    { field: 'og:url', value: metaProperty('og:url') },
    { field: 'twitter:card', value: meta('twitter:card') },
    { field: 'language', value: doc.documentElement?.getAttribute('lang') },
  ];
  const headingCount = doc.querySelectorAll('h1').length;
  const warnings: string[] = [];
  if (headingCount === 0) warnings.push('No h1 — page lacks a primary heading.');
  if (headingCount > 1) warnings.push(`Multiple h1 elements (${headingCount}).`);
  if (!meta('description')) warnings.push('No meta description.');
  items.push({ field: 'h1Count', value: headingCount });
  return base('extract_seo_metadata', `SEO metadata extracted; ${warnings.length} warning(s)`, items.length, items, warnings, false);
};

export const extractStructuredData: AnalyzerFunction = (doc) => {
  const items: any[] = [];
  for (const script of Array.from(doc.querySelectorAll('script[type="application/ld+json"]'))) {
    try {
      const parsed = JSON.parse(script.textContent || '{}');
      items.push({ format: 'JSON-LD', type: parsed['@type'] || (Array.isArray(parsed) ? 'array' : 'unknown'), data: parsed });
    } catch (err: any) {
      items.push({ format: 'JSON-LD', type: 'invalid-json', error: err.message });
    }
  }
  for (const el of Array.from(doc.querySelectorAll('[itemscope]')).slice(0, 30)) {
    const itemType = el.getAttribute('itemtype') || 'unknown';
    const props: Record<string, string> = {};
    for (const prop of Array.from(el.querySelectorAll('[itemprop]'))) {
      const name = prop.getAttribute('itemprop') || '';
      const content = prop.getAttribute('content') || prop.getAttribute('href') || prop.textContent?.trim() || '';
      props[name] = content.slice(0, 100);
    }
    items.push({ format: 'microdata', type: itemType.split('/').pop() || itemType, data: props });
  }
  return base('extract_structured_data', `${items.length} structured data block(s)`, items.length, items, [], false);
};

// ---------------------------------------------------------------------------
// Tables / lists
// ---------------------------------------------------------------------------
export const extractTables: AnalyzerFunction = (doc) => {
  const tables = Array.from(doc.querySelectorAll('table'));
  const items = tables.slice(0, 30).map((table) => {
    const headers = Array.from(table.querySelectorAll('thead th, tr:first-child th')).map((th) => th.textContent?.trim() || '');
    const bodyRows = Array.from(table.querySelectorAll('tbody tr, tr')).filter((tr) => !tr.querySelector('th')).slice(0, 50);
    const rows = bodyRows.map((tr) => Array.from(tr.querySelectorAll('td')).map((td) => (td.textContent || '').trim().slice(0, 60)));
    const caption = table.querySelector('caption')?.textContent?.trim();
    return {
      selector: selectorOf(table),
      caption,
      columnCount: headers.length || (rows[0]?.length || 0),
      rowCount: bodyRows.length,
      headers,
      rows,
    };
  });
  return base('extract_tables', `${tables.length} table(s)`, tables.length, items, [], tables.length > 30);
};

export const extractLists: AnalyzerFunction = (doc) => {
  const lists = Array.from(doc.querySelectorAll('ul, ol'));
  const items = lists.slice(0, 60).map((list) => {
    const children = Array.from(list.querySelectorAll(':scope > li')).slice(0, 40);
    return {
      selector: selectorOf(list),
      kind: list.tagName.toLowerCase(),
      ordered: list.tagName.toLowerCase() === 'ol',
      itemCount: children.length,
      items: children.map((li) => directText(li).slice(0, 60)),
      nested: list.querySelectorAll('ul, ol').length,
    };
  });
  return base('extract_lists', `${lists.length} list(s)`, lists.length, items, [], lists.length > 60);
};

// ---------------------------------------------------------------------------
// Content / readability stats
// ---------------------------------------------------------------------------
export const analyzePageContent: AnalyzerFunction = (doc) => {
  const body = doc.body;
  const text = body?.innerText || body?.textContent || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const headings = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h) => ({
    level: parseInt(h.tagName[1], 10),
    text: directText(h).slice(0, 80),
  }));
  const paragraphs = doc.querySelectorAll('p').length;
  const avgParagraphLength = paragraphs ? Math.round(words / paragraphs) : 0;
  const readingTimeMinutes = Math.round((words / 220) * 10) / 10;
  const items = [
    { metric: 'wordCount', value: words },
    { metric: 'paragraphCount', value: paragraphs },
    { metric: 'avgParagraphWords', value: avgParagraphLength },
    { metric: 'estimatedReadingMinutes', value: readingTimeMinutes },
    { metric: 'headingCount', value: headings.length },
    { metric: 'imageCount', value: doc.querySelectorAll('img').length },
    { metric: 'linkDensity', value: Math.round(((doc.querySelectorAll('a[href]').length / Math.max(1, words)) * 1000)) / 1000 },
    { metric: 'headings', value: headings.slice(0, 50) },
  ];
  return base('analyze_page_content', `${words} words, ${paragraphs} paragraphs, ~${readingTimeMinutes} min read`, items.length, items, [], false);
};

// ---------------------------------------------------------------------------
// DOM search (agent-invented: powerful element search)
// ---------------------------------------------------------------------------
export const searchDOM: AnalyzerFunction = (doc, options) => {
  const query = String(options?.query || '').trim();
  if (!query) {
    return base('search_dom', 'No query supplied', 0, [], ['Provide a text query; optionally tag/attr filters.'], false);
  }
  const q = query.toLowerCase();
  const matches: any[] = [];
  const maxResults = Math.min(options?.limit || 50, 200);
  const elements = Array.from(doc.querySelectorAll('*'));
  for (const el of elements) {
    if (matches.length >= maxResults) break;
    if (options?.tag && el.tagName.toLowerCase() !== String(options.tag).toLowerCase()) continue;
    const text = directText(el);
    const attrs = Array.from(el.attributes);
    let score = 0;
    let reason = '';
    if (el.tagName.toLowerCase().includes(q)) { score += 0.2; reason = 'tag match'; }
    if (text.toLowerCase().includes(q) && text.length < 200) { score += 0.6; reason = 'text match'; }
    for (const a of attrs) {
      if (a.name.toLowerCase().includes(q) || (a.value.length < 100 && a.value.toLowerCase().includes(q))) {
        score += 0.4;
        reason = `attribute ${a.name} match`;
        break;
      }
    }
    if (options?.attr) {
      const attrName = String(options.attr).toLowerCase();
      const attrVal = options.attrValue ? String(options.attrValue).toLowerCase() : null;
      const found = attrs.find((a) => a.name.toLowerCase() === attrName && (!attrVal || a.value.toLowerCase().includes(attrVal)));
      if (found) score += 0.5;
      else continue;
    }
    if (score > 0) {
      const info = safeInspect(el);
      matches.push({
        selector: info.bestSelector,
        tag: info.tag,
        role: info.role,
        text: info.text.slice(0, 60),
        score: Math.round(score * 100) / 100,
        reason,
        visible: info.visibility.isVisible,
        bounds: { x: Math.round(info.bounds.x), y: Math.round(info.bounds.y), w: Math.round(info.bounds.width), h: Math.round(info.bounds.height) },
      });
    }
  }
  matches.sort((a, b) => b.score - a.score);
  return base('search_dom', `${matches.length} element(s) match "${query}"`, matches.length, matches, [], matches.length >= maxResults);
};

// ---------------------------------------------------------------------------
// CTA / focus trap / breakpoints / selection
// ---------------------------------------------------------------------------
export const inventoryCTAs: AnalyzerFunction = (doc) => {
  const items: any[] = [];
  for (const el of Array.from(doc.querySelectorAll('button, a[class*="btn"], a[class*="button"], input[type="submit"], [role="button"]')).slice(0, 100)) {
    const info = safeInspect(el);
    items.push({
      selector: info.bestSelector,
      tag: info.tag,
      text: info.text.slice(0, 50),
      styleHint: el.getAttribute('class')?.slice(0, 60),
      primary: /primary|cta|submit|main/i.test(el.getAttribute('class') || '') || (el as HTMLInputElement).type === 'submit',
      visible: info.visibility.isVisible,
    });
  }
  return base('inventory_ctas', `${items.length} call-to-action element(s)`, items.length, items, [], false);
};

export const detectFocusTraps: AnalyzerFunction = (doc) => {
  const items: any[] = [];
  // modal-like containers with focus management
  for (const el of Array.from(doc.querySelectorAll('[role="dialog"], [aria-modal="true"], dialog[open], .modal, [class*="modal"]')).slice(0, 30)) {
    const focusables = el.querySelectorAll('a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])');
    items.push({
      selector: selectorOf(el),
      kind: el.getAttribute('role') || el.tagName.toLowerCase(),
      ariaModal: el.getAttribute('aria-modal'),
      focusableCount: focusables.length,
      firstFocusable: focusables[0] ? selectorOf(focusables[0] as Element) : undefined,
      note: focusables.length === 0 ? 'Modal container has NO focusable elements — keyboard users are trapped.' : undefined,
    });
  }
  const tabbables = doc.querySelectorAll('[tabindex]>0');
  for (const el of Array.from(tabbables).slice(0, 20)) {
    items.push({ selector: selectorOf(el), kind: 'positive-tabindex', note: `tabindex=${(el as HTMLElement).tabIndex} breaks natural tab order.` });
  }
  return base('detect_focus_traps', `${items.length} focus-management issue(s)/container(s)`, items.length, items, [], false);
};

export const inferResponsiveBreakpoints: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const warnings: string[] = [];
  const breakpoints = new Set<number>();
  // 1. From stylesheet text
  for (const style of Array.from(doc.querySelectorAll('style'))) {
    const text = style.textContent || '';
    const re = /@media[^{]*?\(\s*(?:min|max)-width\s*:\s*(\d+)(?:\.\d+)?px/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) breakpoints.add(parseInt(m[1], 10));
  }
  // 2. From linked stylesheets (same-origin only)
  for (const link of Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).slice(0, 10)) {
    const href = link.getAttribute('href') || '';
    if (/^\d+px$/.test(href) || href.includes('width=')) {
      const match = href.match(/width=(\d+)/);
      if (match) breakpoints.add(parseInt(match[1], 10));
    }
  }
  // 3. From srcset descriptors
  for (const img of Array.from(doc.querySelectorAll('img[srcset], source[srcset]')).slice(0, 50)) {
    const srcset = img.getAttribute('srcset') || '';
    for (const m of srcset.matchAll(/(\d+)w/g)) {
      breakpoints.add(parseInt(m[1], 10));
    }
  }
  if (!win?.matchMedia) warnings.push('matchMedia unavailable — live breakpoint probing skipped.');
  const sorted = Array.from(breakpoints).sort((a, b) => a - b);
  const items: Array<{ breakpoint: number | string; note: string }> = sorted.map((px) => ({ breakpoint: px, note: px <= 768 ? 'mobile-class' : px <= 1024 ? 'tablet-class' : 'desktop-class' }));
  const current = win?.innerWidth;
  if (current) {
    const active = sorted.filter((px) => px <= current);
    items.unshift({ breakpoint: `current viewport: ${current}px`, note: active.length ? `below breakpoints: ${active.join(', ')}` : 'no declared breakpoint below current width' });
  }
  return base('infer_responsive_breakpoints', `${sorted.length} breakpoint(s) inferred from CSS/srcset`, items.length, items, warnings, false);
};

export const getSelectionState: AnalyzerFunction = (doc) => {
  const win = doc.defaultView;
  const selection = win?.getSelection?.();
  const active = doc.activeElement;
  const items = [
    {
      hasSelection: Boolean(selection?.toString()),
      selectedText: selection?.toString().slice(0, 200) || '',
      selectionRanges: selection?.rangeCount || 0,
      activeElement: active ? { tag: active.tagName.toLowerCase(), selector: selectorOf(active as Element), editable: (active as HTMLElement).isContentEditable || ['INPUT', 'TEXTAREA'].includes(active.tagName) } : null,
    },
  ];
  return base('get_selection_state', selection?.toString() ? `Selection: "${selection.toString().slice(0, 40)}…"` : 'No text selection', 1, items, [], false);
};

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------
export const DOM_ANALYZERS: Record<string, AnalyzerFunction> = {
  analyze_forms: analyzeForms,
  extract_links: analyzeLinks,
  analyze_media: analyzeMedia,
  get_css_variables: analyzeCSSVariables,
  analyze_fonts: analyzeFonts,
  extract_color_palette: extractColorPalette,
  detect_zindex_conflicts: detectZIndexConflicts,
  detect_layout_issues: detectLayoutIssues,
  census_interactive_elements: censusInteractiveElements,
  detect_semantic_elements: detectSemanticElements,
  scan_accessibility_issues: scanAccessibilityIssues,
  detect_dead_click_targets: detectDeadClickTargets,
  inventory_animations: inventoryAnimations,
  map_frame_tree: mapFrameTree,
  inventory_shadow_roots: inventoryShadowRoots,
  inspect_page_storage: inspectPageStorage,
  get_performance_metrics: getPerformanceMetrics,
  extract_seo_metadata: extractSEOMetadata,
  extract_structured_data: extractStructuredData,
  extract_tables: extractTables,
  extract_lists: extractLists,
  analyze_page_content: analyzePageContent,
  search_dom: searchDOM,
  inventory_ctas: inventoryCTAs,
  detect_focus_traps: detectFocusTraps,
  infer_responsive_breakpoints: inferResponsiveBreakpoints,
  get_selection_state: getSelectionState,
};

export function runAnalyzer(name: string, doc: Document, options: any): DOMAnalysisResult {
  const fn = DOM_ANALYZERS[name];
  if (!fn) {
    return {
      analyzer: name,
      summary: `Unknown analyzer "${name}". Available: ${Object.keys(DOM_ANALYZERS).join(', ')}`,
      count: 0,
      items: [],
      warnings: [],
      truncated: false,
    };
  }
  return fn(doc, options);
}
