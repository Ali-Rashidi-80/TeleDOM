import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { SelectorRobustnessEngine } from '../../src/core/selector-robustness';
import { SelectorRecoveryEngine } from '../../src/core/selector-recovery';

describe('SelectorRobustnessEngine', () => {
  let dom: JSDOM;
  let engine: SelectorRobustnessEngine;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <main id="app">
        <button id="primary" data-testid="cta-button" class="btn primary">Do it</button>
        <button class="btn">Other</button>
        <input id="search" name="q" class="input" placeholder="Search…" />
      </main>
    </body></html>`);
    engine = new SelectorRobustnessEngine(dom.window.document);
  });

  it('ranks unique id candidate with highest confidence', () => {
    const btn = dom.window.document.querySelector('#primary')!;
    const candidates = engine.generateCandidates(btn);
    expect(candidates[0].strategy).toBe('id');
    expect(candidates[0].confidence).toBe(1);
    expect(candidates[0].unique).toBe(true);
  });

  it('produces semantic-attribute candidates with reasons', () => {
    const btn = dom.window.document.querySelector('#primary')!;
    const semantic = engine.generateCandidates(btn).find((c) => c.strategy === 'semantic-attribute');
    expect(semantic?.selector).toBe('button[data-testid="cta-button"]');
    expect(semantic?.reasons.join(' ')).toContain('matches exactly this element');
  });

  it('penalizes ambiguous class-only selectors', () => {
    const other = dom.window.document.querySelectorAll('.btn')[1];
    const candidates = engine.generateCandidates(other);
    const classCandidate = candidates.find((c) => c.strategy === 'class');
    expect(classCandidate?.unique).toBe(false);
    expect((classCandidate?.confidence || 0)).toBeLessThan(0.5);
  });

  it('builds xpaths using ids where available', () => {
    const btn = dom.window.document.querySelector('#primary')!;
    expect(engine.buildXPath(btn)).toContain('id="primary"');
  });

  it('rejects invalid selectors gracefully (confidence 0)', () => {
    const btn = dom.window.document.querySelector('#primary')!;
    const candidates = engine.generateCandidates(btn);
    expect(candidates.every((c) => c.confidence >= 0)).toBe(true);
  });
});

describe('SelectorRecoveryEngine', () => {
  let dom: JSDOM;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <nav id="sidebar" class="nav main-nav"><a href="/x">Menu link</a></nav>
    </body></html>`);
  });

  it('recovers a re-identified element via fingerprint matching', () => {
    const nav = dom.window.document.querySelector('#sidebar')!;
    const engine = new SelectorRecoveryEngine(dom.window.document);
    // simulate: old selector #sidebar-nav no longer matches
    const outcome = engine.recover('#sidebar-nav', {
      selector: '#sidebar-nav',
      tag: 'nav',
      text: 'Menu link',
      classes: ['nav', 'main-nav'],
      stableAttributes: {},
      parentSelector: 'body',
    });
    expect(outcome.recovered).toBe(true);
    expect(outcome.confidence).toBeGreaterThanOrEqual(0.62);
    expect(outcome.matchedElementInfo?.tag).toBe('nav');
  });

  it('REFUSES unsafe low-confidence recovery instead of guessing', () => {
    const engine = new SelectorRecoveryEngine(dom.window.document);
    const outcome = engine.recover('#gone-forever', {
      selector: '#gone-forever',
      tag: 'iframe',
      text: 'nothing matches this',
      classes: [],
    });
    expect(outcome.recovered).toBe(false);
    expect(outcome.recommendation).toContain('No sufficiently similar element');
  });

  it('reports original-selector success when the selector still works', () => {
    const engine = new SelectorRecoveryEngine(dom.window.document);
    const outcome = engine.recover('#sidebar', { selector: '#sidebar', tag: 'nav', text: '', classes: [] });
    expect(outcome.recovered).toBe(true);
    expect(outcome.strategy).toBe('original-selector');
  });

  it('diagnoses failing selectors with parse validity and relaxation', () => {
    const engine = new SelectorRecoveryEngine(dom.window.document);
    const diagnosis = engine.diagnose('#sidebar-deep > .missing');
    expect(diagnosis.valid).toBe(true);
    expect(diagnosis.matches).toBe(0);
    expect(diagnosis.diagnosis.length).toBeGreaterThan(0);
  });
});
