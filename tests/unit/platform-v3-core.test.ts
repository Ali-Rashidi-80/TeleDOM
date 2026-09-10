import { describe, it, expect } from 'vitest';
import { SeededRandom, HumanInteractionController, DEFAULT_PROFILES } from '../../src/core/human-interaction';
import { CommandSequenceEngine, CommandRecorder } from '../../src/core/command-recorder';
import { ActionTimeline, OperationRegistry } from '../../src/core/action-timeline';
import { RedactionEngine } from '../../src/core/redaction-engine';
import { NamingEngine, toSnakeCase, dedupeNames } from '../../src/projects/naming-engine';
import { RegionQualityScorer } from '../../src/projects/region-capture';
import { JSDOM } from 'jsdom';

describe('SeededRandom (human-interaction determinism)', () => {
  it('produces identical sequences for identical seeds', () => {
    const a = new SeededRandom(42);
    const b = new SeededRandom(42);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new SeededRandom(1);
    const b = new SeededRandom(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('stays within [0,1) and respects ranges', () => {
    const rng = new SeededRandom(7);
    for (let i = 0; i < 100; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
    const r = rng.range(100, 200);
    expect(r).toBeGreaterThanOrEqual(100);
    expect(r).toBeLessThanOrEqual(200);
  });
});

describe('HumanInteractionController', () => {
  it('DETERMINISTIC default draws zero delays (legacy behavior)', () => {
    const c = new HumanInteractionController();
    expect(c.getActiveProfileName()).toBe('DETERMINISTIC');
    expect(c.delay('click')).toBe(0);
    expect(c.delay('type')).toBe(0);
  });

  it('HUMAN_LIKE draws bounded nonzero-ish delays deterministically', () => {
    const c1 = new HumanInteractionController();
    c1.setActiveProfile('HUMAN_LIKE');
    const c2 = new HumanInteractionController();
    c2.setActiveProfile('HUMAN_LIKE');
    const d1 = [c1.delay('click'), c1.delay('type'), c1.delay('move')];
    const d2 = [c2.delay('click'), c2.delay('type'), c2.delay('move')];
    expect(d1).toEqual(d2);
    for (const v of d1) {
      expect(v).toBeGreaterThanOrEqual(90);
      expect(v).toBeLessThanOrEqual(420);
    }
  });

  it('rejects unknown profiles and exposes all four', () => {
    const c = new HumanInteractionController();
    expect(() => c.setActiveProfile('NOPE' as any)).toThrowError(/Unknown interaction profile/);
    expect(Object.keys(DEFAULT_PROFILES).sort()).toEqual(['BALANCED', 'CUSTOM', 'DETERMINISTIC', 'HUMAN_LIKE']);
  });

  it('generates smoothstep trajectories with the configured step count', () => {
    const c = new HumanInteractionController();
    c.setActiveProfile('HUMAN_LIKE');
    const path = c.trajectory({ x: 0, y: 0 }, { x: 100, y: 100 });
    expect(path.length).toBe(8);
    expect(path[0].x).toBeLessThan(100);
  });

  it('records inspectable action timing (Human Mode Safety)', () => {
    const c = new HumanInteractionController();
    c.setActiveProfile('BALANCED');
    c.recordTiming('click', 'human-like', [40, 62, 40], 142);
    const report = c.report();
    expect(report.lastActionTiming?.action).toBe('click');
    expect(report.lastActionTiming?.requestedMode).toBe('human-like');
    expect(report.lastActionTiming?.actualMode).toBe('BALANCED');
    expect(report.lastActionTiming?.timings).toHaveLength(3);
  });
});

describe('CommandSequenceEngine', () => {
  it('executes steps sequentially and stops on error by default', async () => {
    const engine = new CommandSequenceEngine();
    const calls: string[] = [];
    const result = await engine.execute(
      [
        { tool: 'a', args: {} },
        { tool: 'fail', args: {} },
        { tool: 'c', args: {} },
      ],
      async (tool) => {
        calls.push(tool);
        if (tool === 'fail') return { success: false, summary: 'boom', error: 'boom' };
        return { success: true, summary: 'ok' };
      }
    );
    expect(result.success).toBe(false);
    expect(result.executedSteps).toBe(2);
    expect(result.steps[2].status).toBe('SKIPPED');
    expect(result.steps[2].resultSummary).toContain('stopOnError');
    expect(calls).toEqual(['a', 'fail']);
  });

  it('supports continueOnError opt-in per step', async () => {
    const engine = new CommandSequenceEngine();
    const result = await engine.execute(
      [
        { tool: 'fail', continueOnError: true },
        { tool: 'b' },
      ],
      async (tool) => (tool === 'fail' ? { success: false, summary: 'x' } : { success: true, summary: 'ok' })
    );
    expect(result.steps[0].status).toBe('FAILED');
    expect(result.steps[1].status).toBe('SUCCESS');
  });

  it('supports conditional continuation on previous step outcome', async () => {
    const engine = new CommandSequenceEngine();
    const result = await engine.execute(
      [
        { tool: 'ok' },
        { tool: 'conditional', condition: { previousStepSucceeded: false } },
      ],
      async () => ({ success: true, summary: 'ok' })
    );
    expect(result.steps[1].status).toBe('SKIPPED');
    expect(result.steps[1].resultSummary).toContain('condition');
  });
});

describe('CommandRecorder', () => {
  it('records commands between start and stop', () => {
    const rec = new CommandRecorder();
    rec.start('test-rec', 'desc');
    expect(rec.isRecording()).toBe(true);
    rec.recordCommand('inspect_live_page', {}, 'SUCCESS', 'object with keys');
    rec.recordCommand('mutate_dom', { operation: 'set_text' }, 'FAILED', 'error');
    const finished = rec.stop();
    expect(finished?.name).toBe('test-rec');
    expect(finished?.commandCount).toBe(2);
    expect(finished?.commands[1].outcome).toBe('FAILED');
    expect(rec.isRecording()).toBe(false);
  });

  it('duplicate produces an independent copy', () => {
    const rec = new CommandRecorder();
    rec.start('orig');
    rec.recordCommand('a', {}, 'SUCCESS');
    const finished = rec.stop()!;
    const copy = CommandRecorder.duplicate(finished);
    expect(copy.name).toBe('orig_copy');
    expect(copy.recordingId).not.toBe(finished.recordingId);
    expect(copy.commandCount).toBe(1);
  });
});

describe('ActionTimeline + OperationRegistry', () => {
  it('records bounded chronological events and filters by kind', () => {
    const timeline = new ActionTimeline(10);
    for (let i = 0; i < 15; i++) timeline.record('DOM_MUTATED', `mutation ${i}`);
    timeline.record('CLICKED', 'the click');
    expect(timeline.size()).toBe(10); // bounded (cap enforced)
    const mutations = timeline.query({ kind: 'DOM_MUTATED' });
    expect(mutations.length).toBe(9); // 10 mutations - 1 evicted by the click
    const clicks = timeline.query({ kind: 'CLICKED' });
    expect(clicks.length).toBe(1);
    expect(clicks[0].eventId).toContain('evt_');
  });

  it('correlates operations with durations and statuses', () => {
    const ops = new OperationRegistry();
    const id = ops.begin('mutate_dom');
    ops.end(id, 'SUCCESS');
    const trace = ops.trace(id)!;
    expect(trace.tool).toBe('mutate_dom');
    expect(trace.status).toBe('SUCCESS');
    expect(trace.durationMs).toBeGreaterThanOrEqual(0);
    expect(ops.trace('unknown')).toBeNull();
  });
});

describe('RedactionEngine', () => {
  it('redacts sensitive keys and token-like values', () => {
    const engine = new RedactionEngine();
    expect(engine.isSensitiveKey('auth_token')).toBe(true);
    expect(engine.isSensitiveKey('session_id')).toBe(true);
    expect(engine.isSensitiveKey('preferences')).toBe(false);
    const redacted = engine.redactByKeyValue('theme', 'eyJhbGciOiJIUzI1NiJ9.payload.sig');
    expect(redacted).toContain('[REDACTED]');
    expect(engine.redactValue('token abc sk_live_abcdefghijklmnopqrst123')).toContain('[REDACTED]');
  });

  it('cleanSubtree strips MCPDOM-injected nodes (§68 clean capture)', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div id="content"><p>real</p><div id="forensic-inspect-highlighter">overlay</div></div>
      <span data-forensic-internal="true">internal</span>
    </body></html>`);
    const engine = new RedactionEngine();
    const content = dom.window.document.querySelector('#content')!;
    const cleaned = engine.cleanSubtree(content);
    expect(cleaned.querySelector('#forensic-inspect-highlighter')).toBeNull();
    expect(cleaned.textContent).toContain('real');
  });

  it('user rules can be added but built-ins cannot be removed', () => {
    const engine = new RedactionEngine();
    const added = engine.addRule({ kind: 'key-pattern', pattern: 'myapp.*secret', description: 'app secrets', enabled: true });
    expect(engine.isSensitiveKey('myapp_api_secret')).toBe(true);
    expect(engine.removeRule('red_key_password')).toBe(false); // built-in protected
    expect(engine.removeRule(added.ruleId)).toBe(true);
  });
});

describe('NamingEngine', () => {
  it('generates meaningful names from evidence (never element_12345)', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <nav class="sidebar-navigation"><a>Link</a></nav>
    </body></html>`);
    const naming = new NamingEngine();
    const nav = dom.window.document.querySelector('nav')!;
    const result = naming.generate(nav);
    expect(result.name).toContain('navigation');
    expect(result.evidence.length).toBeGreaterThan(0);
  });

  it('uses aria-labels and nearby headings as evidence', () => {
    const dom = new JSDOM(`<!DOCTYPE html><html><body>
      <h2>Pricing Cards</h2>
      <div role="region" aria-label="pricing area"><span>content</span></div>
    </body></html>`);
    const naming = new NamingEngine();
    const region = dom.window.document.querySelector('[role=region]')!;
    const result = naming.generate(region);
    expect(result.name).toContain('pricing');
  });

  it('toSnakeCase sanitizes and dedupesNames suffixes', () => {
    expect(toSnakeCase('Sidebar Navigation!')).toBe('sidebar_navigation');
    expect(dedupeNames(['nav', 'nav', 'nav'])).toEqual(['nav', 'nav_2', 'nav_3']);
  });
});

describe('RegionQualityScorer', () => {
  it('scores with explainable components and grades', () => {
    const scorer = new RegionQualityScorer();
    const high = scorer.score({
      selectorCandidates: [{ selector: '#id', strategy: 'id', confidence: 1, unique: true, reasons: ['unique stable id'] }],
      fingerprintVolatility: 'low',
      volatilityReasons: [],
      hasScreenshot: true,
      hasHtmlSnapshot: true,
      hasContext: true,
      userAnnotationFilled: true,
      hasIntendedChange: true,
      hasVerification: true,
    });
    expect(high.overall).toBeGreaterThan(0.85);
    expect(high.grade).toBe('A');
    expect(high.components.every((c) => c.evidence.length > 0)).toBe(true);

    const low = scorer.score({
      selectorCandidates: [],
      fingerprintVolatility: 'high',
      volatilityReasons: ['no stable identity attribute'],
      hasScreenshot: false,
      hasHtmlSnapshot: false,
      hasContext: false,
      userAnnotationFilled: false,
      hasIntendedChange: false,
      hasVerification: false,
    });
    expect(low.overall).toBeLessThan(0.5);
    expect(low.grade).toBe('D');
    expect(low.notes.length).toBeGreaterThan(0);
  });
});
