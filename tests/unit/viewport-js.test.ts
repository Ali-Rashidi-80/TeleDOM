import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { ViewportController, VIEWPORT_PRESETS, DEVICE_EMULATION_PROFILES } from '../../src/core/viewport-controller';
import { JSExecutionEngine } from '../../src/core/js-execution-engine';

describe('ViewportController', () => {
  let dom: JSDOM;
  let controller: ViewportController;

  beforeEach(() => {
    dom = new JSDOM('<!DOCTYPE html><html><body><div style="width:100px">x</div></body></html>', {
      pretendToBeVisual: true,
      url: 'https://example.com/page',
    });
    controller = new ViewportController(dom.window.document);
  });

  it('records the original viewport exactly once and reports modification', () => {
    const before = { width: dom.window.innerWidth, height: dom.window.innerHeight };
    controller.resize(800, 600);
    controller.resize(1024, 768);
    const state = controller.state();
    expect(state.original).toEqual(before);
    expect(state.isModified).toBe(true);
    expect(state.width).toBe(1024);
  });

  it('reset restores the original dimensions (guaranteed RESET_VIEWPORT)', () => {
    const before = { width: dom.window.innerWidth, height: dom.window.innerHeight };
    controller.resize(320, 568);
    const result = controller.reset();
    expect(result.applied).toEqual(before);
    expect(controller.state().isModified).toBe(false);
  });

  it('applies named presets with bounds', () => {
    const result = controller.applyPreset('mobile-iphone-12');
    expect(result.applied).toEqual({ width: 390, height: 844 });
    expect(result.preset).toBe('mobile-iphone-12');
  });

  it('rejects unknown presets with the available list', () => {
    expect(() => controller.applyPreset('nonexistent-preset')).toThrowError(/UNKNOWN_PRESET/);
    expect(Object.keys(VIEWPORT_PRESETS).length).toBeGreaterThanOrEqual(15);
    expect(Object.keys(DEVICE_EMULATION_PROFILES).length).toBeGreaterThanOrEqual(6);
  });

  it('runs a responsive test and restores unless asked not to', () => {
    const before = { width: dom.window.innerWidth, height: dom.window.innerHeight };
    const result = controller.runResponsiveTest([
      { label: 'a', width: 500, height: 600 },
      { label: 'b', width: 900, height: 700 },
    ]);
    expect(result.steps.length).toBe(2);
    expect(result.restored).toBe(true);
    expect(result.finalViewport).toEqual(before);
    const noRestore = controller.runResponsiveTest([{ label: 'c', width: 400, height: 500 }], { restore: false });
    expect(noRestore.restored).toBe(false);
    controller.reset();
  });

  it('emulates device profiles with honest UA notes', () => {
    const result = controller.emulateDevice('pixel-7');
    expect(result.profile.width).toBe(412);
    expect(result.userAgentNote).toContain('User-Agent');
  });
});

describe('JSExecutionEngine', () => {
  let dom: JSDOM;
  let engine: JSExecutionEngine;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body><div id="out"></div></body></html>`, {
      runScripts: 'dangerously',
      url: 'https://example.com/js',
    });
    engine = new JSExecutionEngine();
  });

  it('executes successfully with return-value serialization', async () => {
    const result = await engine.execute(dom.window.document, 'return 21 * 2;');
    expect(result.status).toBe('EXECUTED_SUCCESSFULLY');
    expect(result.result).toBe('42');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('distinguishes EXECUTED_WITH_ERROR with error details', async () => {
    const result = await engine.execute(dom.window.document, 'throw new Error("boom");');
    expect(result.status).toBe('EXECUTED_WITH_ERROR');
    expect(result.error?.message).toBe('boom');
  });

  it('captures console output during execution', async () => {
    const result = await engine.execute(dom.window.document, 'console.log("hello engine"); return 1;');
    expect(result.status).toBe('EXECUTED_SUCCESSFULLY');
    expect(result.consoleOutput.length).toBeGreaterThanOrEqual(1);
    expect(result.consoleOutput[0].text).toContain('hello engine');
  });

  it('detects DOM changes via length delta', async () => {
    const result = await engine.execute(
      dom.window.document,
      'document.getElementById("out").innerHTML = "<p>added</p>"; return null;'
    );
    expect(result.status).toBe('EXECUTED_SUCCESSFULLY');
    expect(result.domChanged).toBe(true);
    expect(result.domLengthAfter).toBeGreaterThan(result.domLengthBefore);
  });

  it('handles serialization failures as a distinct state', async () => {
    const result = await engine.execute(dom.window.document, 'const a = {}; a.self = a; return a;');
    expect(result.status).toBe('SERIALIZATION_FAILED');
  });

  it('times out long-running scripts with TIMED_OUT', async () => {
    const result = await engine.execute(
      dom.window.document,
      'await new Promise(r => setTimeout(r, 2000)); return "late";',
      { timeoutMs: 200 }
    );
    expect(result.status).toBe('TIMED_OUT');
    expect(result.timeoutMs).toBe(200);
  }, 10000);

  it('reports async/await execution', async () => {
    const result = await engine.execute(
      dom.window.document,
      'const v = await Promise.resolve("async-ok"); return v;'
    );
    expect(result.status).toBe('EXECUTED_SUCCESSFULLY');
    expect(result.result).toBe('async-ok');
  });
});
