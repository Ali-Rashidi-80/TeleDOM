import { DOMFingerprint, LiveElementTarget, SelectorCandidate } from '../types/browser-control';
import { DOMFingerprintEngine, isVolatileClass } from './dom-fingerprint';
import { SelectorRobustnessEngine, directText } from './selector-robustness';

/**
 * §81 Selector Recovery Engine
 *
 * When an existing selector fails, this engine performs the mandated workflow:
 *   1. inspect the previous target fingerprint
 *   2. search candidate matches
 *   3. score candidates
 *   4. attempt safe recovery (only above a confidence threshold)
 *   5. report the recovered target with confidence
 *
 * It NEVER silently clicks an arbitrary similar element: low-confidence
 * recoveries are reported as failures with diagnostics.
 */

export interface RecoveryOutcome {
  recovered: boolean;
  confidence: number;
  strategy: string;
  resolvedSelector?: string;
  matchedElementInfo?: { tag: string; id?: string; text: string; classes: string[] };
  alternatives: Array<{ selector: string; confidence: number; strategy: string }>;
  diagnostics: string[];
  recommendation: string;
}

export interface StoredTargetSnapshot {
  selector: string;
  tag: string;
  text?: string;
  classes?: string[];
  stableAttributes?: Record<string, string>;
  fingerprintHash?: string;
  parentSelector?: string;
  childCount?: number;
}

export class SelectorRecoveryEngine {
  private fingerprintEngine = new DOMFingerprintEngine();

  constructor(private doc: Document) {}

  /**
   * Attempt recovery of a failed selector against the live document.
   */
  public recover(failedSelector: string, snapshot: StoredTargetSnapshot): RecoveryOutcome {
    const diagnostics: string[] = [];
    const alternatives: Array<{ selector: string; confidence: number; strategy: string }> = [];

    // Step 1 — verify the selector really fails
    let live: NodeList | null = null;
    try {
      live = this.doc.querySelectorAll(failedSelector);
    } catch (err: any) {
      diagnostics.push(`selector syntax error: ${err.message}`);
    }
    if (live && live.length > 0) {
      diagnostics.push('selector still matches — no recovery needed');
      const el = live[0] as Element;
      return {
        recovered: true,
        confidence: 1.0,
        strategy: 'original-selector',
        resolvedSelector: failedSelector,
        matchedElementInfo: describe(el),
        alternatives: [],
        diagnostics,
        recommendation: 'Original selector works; the earlier failure was transient (likely a navigation or render race).',
      };
    }
    diagnostics.push('selector no longer matches any element');

    const candidates: Element[] = this.collectCandidates(snapshot, diagnostics);
    const scored = candidates
      .map((el) => ({ element: el, score: this.scoreMatch(el, snapshot) }))
      .filter((c) => c.score.score > 0.35)
      .sort((a, b) => b.score.score - a.score.score);

    for (const c of scored.slice(0, 5)) {
      const sel = new SelectorRobustnessEngine(this.doc).bestSelector(c.element);
      alternatives.push({ selector: sel.selector, confidence: Math.round(c.score.score * 100) / 100, strategy: 'recovery-match' });
    }

    if (!scored.length) {
      return {
        recovered: false,
        confidence: 0,
        strategy: 'none',
        alternatives,
        diagnostics,
        recommendation:
          'No sufficiently similar element exists. The region may have been removed, or the page structure changed fundamentally. Re-inspect the page and capture a new target.',
      };
    }

    const best = scored[0];
    const margin = scored.length > 1 ? best.score.score - scored[1].score.score : 1;
    diagnostics.push(`best candidate score: ${best.score.score.toFixed(3)} (margin ${margin.toFixed(3)})`);
    for (const comp of best.score.components) {
      if (comp.score > 0) diagnostics.push(`  - ${comp.name}: ${(comp.score * 100).toFixed(0)}%`);
    }

    // Step 4 — safety gate: unique, confident, and clearly ahead of runner-up
    const SAFE_THRESHOLD = 0.62;
    const SAFE_MARGIN = 0.15;
    if (best.score.score < SAFE_THRESHOLD || (scored.length > 1 && margin < SAFE_MARGIN)) {
      return {
        recovered: false,
        confidence: Math.round(best.score.score * 100) / 100,
        strategy: 'recovery-refused',
        resolvedSelector: alternatives[0]?.selector,
        alternatives,
        diagnostics,
        recommendation:
          'Recovery refused: best match is not confident enough or too close to a competing element. Inspect alternatives manually before acting — refusing to avoid acting on a wrong element.',
      };
    }

    const recoveredSelector = new SelectorRobustnessEngine(this.doc).bestSelector(best.element).selector;
    return {
      recovered: true,
      confidence: Math.round(best.score.score * 100) / 100,
      strategy: 'fingerprint-recovery',
      resolvedSelector: recoveredSelector,
      matchedElementInfo: describe(best.element),
      alternatives,
      diagnostics,
      recommendation: `Recovered target with ${(best.score.score * 100).toFixed(0)}% confidence. Verify the resolved selector before destructive actions.`,
    };
  }

  private collectCandidates(snapshot: StoredTargetSnapshot, diagnostics: string[]): Element[] {
    const pool = new Set<Element>();

    // tag-based sweep (bounded — first 400 matches for large DOMs)
    const byTag = this.doc.querySelectorAll(snapshot.tag);
    let seen = 0;
    for (const el of Array.from(byTag)) {
      pool.add(el as Element);
      if (++seen >= 400) break;
    }

    if (snapshot.classes?.length) {
      const stable = snapshot.classes.filter((c) => !isVolatileClass(c));
      for (const cls of stable.slice(0, 2)) {
        try {
          for (const el of Array.from(this.doc.querySelectorAll(`.${cls}`)).slice(0, 100)) {
            pool.add(el as Element);
          }
        } catch {
          /* invalid class chars — skip */
        }
      }
    }

    if (snapshot.stableAttributes?.name) {
      try {
        for (const el of Array.from(this.doc.querySelectorAll(`[name="${snapshot.stableAttributes.name}"]`))) {
          pool.add(el as Element);
        }
      } catch { /* skip */ }
    }

    if (snapshot.parentSelector) {
      try {
        for (const el of Array.from(this.doc.querySelectorAll(`${snapshot.parentSelector} > ${snapshot.tag}`)).slice(0, 100)) {
          pool.add(el as Element);
        }
      } catch { /* skip */ }
    }

    diagnostics.push(`collected ${pool.size} candidate elements for scoring`);
    return Array.from(pool);
  }

  private scoreMatch(element: Element, snapshot: StoredTargetSnapshot): { score: number; components: Array<{ name: string; score: number; weight: number }> } {
    const components: Array<{ name: string; score: number; weight: number }> = [];

    const tagMatch = element.tagName.toLowerCase() === snapshot.tag.toLowerCase() ? 1 : 0;
    components.push({ name: 'tag', score: tagMatch, weight: 0.15 });

    const snapText = (snapshot.text || '').trim().slice(0, 40);
    // Compare against BOTH direct text and full subtree text — captured
    // region text is often inner-text style, not direct-text only.
    const elDirect = directText(element).slice(0, 40);
    const elSubtree = (element.textContent || '').trim().slice(0, 40);
    let textScore = 0;
    if (snapText) {
      const directScore = elDirect ? (elDirect === snapText ? 1 : partialTextScore(snapText, elDirect)) : 0;
      const subtreeScore = elSubtree ? (elSubtree === snapText ? 1 : partialTextScore(snapText, elSubtree)) : 0;
      textScore = Math.max(directScore, subtreeScore);
    }
    components.push({ name: 'text', score: textScore, weight: 0.3 });

    const snapClasses = new Set((snapshot.classes || []).filter((c) => !isVolatileClass(c)));
    const elClasses = Array.from(element.classList || []);
    const classScore = snapClasses.size
      ? elClasses.filter((c) => snapClasses.has(c)).length / snapClasses.size
      : 0.5;
    components.push({ name: 'classes', score: classScore, weight: 0.2 });

    const snapAttrs = snapshot.stableAttributes || {};
    const attrKeys = Object.keys(snapAttrs);
    let attrScore = 0.5;
    if (attrKeys.length) {
      let matched = 0;
      for (const k of attrKeys) {
        if (element.getAttribute(k) === snapAttrs[k]) matched++;
      }
      attrScore = matched / attrKeys.length;
    }
    components.push({ name: 'attributes', score: attrScore, weight: 0.2 });

    const childScore = snapshot.childCount !== undefined ? (element.children.length === snapshot.childCount ? 1 : partialTextScore(String(snapshot.childCount), String(element.children.length))) : 0.5;
    components.push({ name: 'childCount', score: childScore, weight: 0.05 });

    if (snapshot.fingerprintHash) {
      const fp: DOMFingerprint = {
        fingerprintId: 'snapshot',
        hash: snapshot.fingerprintHash,
        tagHierarchy: [snapshot.tag],
        stableAttributes: snapAttrs,
        meaningfulText: snapText,
        classes: (snapshot.classes || []),
        dimensions: { width: 0, height: 0 },
        ancestorPattern: '',
        descendantPattern: '',
        volatilityRisk: 'medium',
        volatilityReasons: [],
      };
      const live = this.fingerprintEngine.fingerprint(element);
      const cmp = this.fingerprintEngine.compare(fp, live);
      components.push({ name: 'fingerprint', score: cmp.score, weight: 0.1 });
    }

    const total = components.reduce((sum, c) => sum + c.score * c.weight, 0);
    return { score: Math.max(0, Math.min(1, total)), components };
  }

  /**
   * Diagnose why a selector fails (capability 45 — failed-selector diagnostics).
   */
  public diagnose(selector: string): {
    selector: string;
    valid: boolean;
    matches: number;
    parseError?: string;
    closestWorkingSelectors: string[];
    diagnosis: string[];
  } {
    const diagnosis: string[] = [];
    let valid = true;
    let matches = 0;
    let parseError: string | undefined;
    let relaxed: string[] = [];

    try {
      matches = this.doc.querySelectorAll(selector).length;
    } catch (err: any) {
      valid = false;
      parseError = err.message;
      diagnosis.push('Selector is syntactically invalid CSS.');
    }

    if (valid && matches === 0) {
      diagnosis.push('Selector parses but matches nothing — element may be removed, re-rendered, or inside a shadow root.');
      // Relaxation attempts
      relaxed = this.relaxSelector(selector);
      for (const r of relaxed) {
        try {
          if (this.doc.querySelectorAll(r).length > 0) {
            diagnosis.push(`Relaxed form "${r}" matches — the over-specific part of the selector is stale.`);
            break;
          }
        } catch { /* skip */ }
      }
    }

    if (valid && matches > 1) {
      diagnosis.push(`Selector matches ${matches} elements — it is ambiguous; use a more specific form or index.`);
    }

    return {
      selector,
      valid,
      matches,
      parseError,
      closestWorkingSelectors: relaxed.filter((r) => {
        try { return this.doc.querySelectorAll(r).length > 0; } catch { return false; }
      }),
      diagnosis,
    };
  }

  private relaxSelector(selector: string): string[] {
    const relaxed: string[] = [];
    const parts = selector.split(/[ >]+/).filter(Boolean);
    if (parts.length > 1) {
      relaxed.push(parts.slice(0, -1).join(' '));
      relaxed.push(parts[parts.length - 1]);
    }
    // strip pseudo/classes suffixes
    const stripped = selector.replace(/:nth-of-type\(\d+\)/g, '').replace(/\.[^. >#:[]+/g, (m, off, str) => (str[off - 1] === '\\' ? m : ''));
    if (stripped !== selector && stripped.trim()) relaxed.push(stripped.trim());
    return relaxed;
  }
}

function partialTextScore(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.7;
  const wa = new Set(na.split(/\s+/));
  const wb = new Set(nb.split(/\s+/));
  const shared = Array.from(wa).filter((w) => wb.has(w)).length;
  return shared / Math.max(wa.size, wb.size);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function describe(el: Element) {
  return {
    tag: el.tagName.toLowerCase(),
    id: el.getAttribute('id') || undefined,
    text: directText(el).slice(0, 60),
    classes: Array.from(el.classList || []),
  };
}

export function targetFromSelector(selector: string): LiveElementTarget {
  return { selector };
}
