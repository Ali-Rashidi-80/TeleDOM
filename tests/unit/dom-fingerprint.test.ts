import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { DOMFingerprintEngine, stableHash, isVolatileClass, isVolatileText } from '../../src/core/dom-fingerprint';

describe('DOMFingerprintEngine', () => {
  let dom: JSDOM;
  let engine: DOMFingerprintEngine;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <nav id="sidebar" class="navigation panel"><a href="/a">Link A</a></nav>
      <div class="css-1a2b3c jsx-xyz"><span>volatile</span></div>
      <button id="btn" data-testid="submit-btn" class="btn primary">Submit form</button>
    </body></html>`);
    engine = new DOMFingerprintEngine();
  });

  it('computes deterministic fingerprints (same element → same hash)', () => {
    const btn = dom.window.document.querySelector('#btn')!;
    const fp1 = engine.fingerprint(btn);
    const fp2 = engine.fingerprint(btn);
    expect(fp1.hash).toBe(fp2.hash);
    expect(fp1.fingerprintId).toBe(`fp_${fp1.hash}`);
  });

  it('captures stable attributes and excludes volatile ones', () => {
    const btn = dom.window.document.querySelector('#btn')!;
    const fp = engine.fingerprint(btn);
    expect(fp.stableAttributes['data-testid']).toBe('submit-btn');
    expect(fp.tagHierarchy[fp.tagHierarchy.length - 1]).toBe('button');
    expect(fp.meaningfulText).toBe('Submit form');
  });

  it('classifies volatility of framework-generated class stacks', () => {
    const volatile = dom.window.document.querySelector('.css-1a2b3c')!;
    const fp = engine.fingerprint(volatile);
    expect(fp.volatilityRisk).toBe('high');
    expect(fp.volatilityReasons.join(' ')).toContain('framework-generated');
  });

  it('compares fingerprints with explainable component scores', () => {
    const btn = dom.window.document.querySelector('#btn')!;
    const a = engine.fingerprint(btn);
    const b = engine.fingerprint(btn);
    const cmp = engine.compare(a, b);
    // identical fingerprints: all evidence components match; zero-size JSDOM
    // dimensions score neutral (0.5), so the total is 0.95, not 1.0.
    expect(cmp.score).toBeGreaterThanOrEqual(0.95);
    expect(cmp.components.find((c) => c.name === 'stableAttributes')?.score).toBe(1);
  });

  it('detects volatile text (numeric/timestamp-like)', () => {
    expect(isVolatileText('12 items')).toBe(false);
    expect(isVolatileText('1725000000320')).toBe(true);
    expect(isVolatileText('1234567890')).toBe(true);
  });

  it('detects volatile framework classes', () => {
    expect(isVolatileClass('css-1a2b3c')).toBe(true);
    expect(isVolatileClass('navigation')).toBe(false);
    expect(stableHash('same')).toBe(stableHash('same'));
    expect(stableHash('a')).not.toBe(stableHash('b'));
  });
});
