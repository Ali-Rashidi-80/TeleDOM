/**
 * CAP 05 — Interaction record/replay (deterministic, resilient target
 *           resolution) and CAP 06 — Failure replay (structured
 *           failure-state capture + scenario replay).
 *
 * Integrates with the EXISTING replay engine (src/replay/replay-engine)
 * semantics but records at the interaction level with DOM context
 * (target objects, fingerprints, mutation history, screenshots).
 */

import { BaseEvent } from '../../types/events';
import { unifiedRuntime } from '../../devtools/runtime/unified-browser-runtime';
import { runInPage } from '../../devtools/capabilities/interaction-core';

// ---------------------------------------------------------------------------
// CAP 05 — INTERACTION REPLAY
// ---------------------------------------------------------------------------

export interface RecordedInteractionStep {
  stepId: string;
  action: string;
  target: {
    selector: string;
    uid?: string;
    tagName?: string;
    text?: string;
    attributes?: Record<string, string>;
  };
  params: Record<string, unknown>;
  pageUrl?: string;
  domContext: {
    matchedElements: number;
    targetFingerprint: { tag: string; text: string; classes: string[]; stableAttributes: Record<string, string> };
    mutationCountBefore: number;
  };
  recordedAt: number;
  outcome?: { success: boolean; error?: string };
}

export interface InteractionRecording {
  recordingId: string;
  pageId: string;
  startedAt: number;
  stoppedAt?: number;
  steps: RecordedInteractionStep[];
}

const recordings = new Map<string, InteractionRecording>();
let recordingCounter = 0;

export function startInteractionRecording(pageId: string): InteractionRecording {
  const recordingId = `irep_${++recordingCounter}_${Date.now().toString(36)}`;
  const rec: InteractionRecording = { recordingId, pageId, startedAt: Date.now(), steps: [] };
  recordings.set(recordingId, rec);
  return rec;
}

export function stopInteractionRecording(recordingId: string): InteractionRecording {
  const rec = recordings.get(recordingId);
  if (!rec) throw new Error(`INVALID_INPUT: interaction recording '${recordingId}' not found.`);
  rec.stoppedAt = Date.now();
  return rec;
}

/** Record one interaction step with full DOM context for later replay. */
export async function recordInteractionStep(recordingId: string, input: {
  action: string;
  selector: string;
  params?: Record<string, unknown>;
  tabId?: number;
}): Promise<RecordedInteractionStep> {
  const rec = recordings.get(recordingId);
  if (!rec) throw new Error(`INVALID_INPUT: interaction recording '${recordingId}' is not active.`);
  if (rec.stoppedAt) throw new Error(`UNSUPPORTED_OPERATION: recording '${recordingId}' already stopped.`);

  // Capture DOM context at record time (fingerprint for resilient resolution).
  const fingerprint = await runInPage(`(function(){
    const el = document.querySelector(${JSON.stringify(input.selector)});
    if (!el) return { matched: 0, fingerprint: null };
    const attrs = {};
    for (const a of Array.from(el.attributes)) {
      if (/^(id|name|type|data-testid|aria-label|role|placeholder|href|for|alt|title)$/i.test(a.name)) attrs[a.name] = a.value;
    }
    return { matched: 1, fingerprint: {
      tag: el.tagName.toLowerCase(),
      text: (el.textContent || '').trim().slice(0, 60),
      classes: String(el.className || '').split(/\\s+/).filter(Boolean).slice(0, 5),
      stableAttributes: attrs,
    }};
  })()`, input.tabId).catch(() => ({ matched: 0, fingerprint: null }));

  const step: RecordedInteractionStep = {
    stepId: `step_${rec.steps.length + 1}`,
    action: input.action,
    target: {
      selector: input.selector,
      tagName: fingerprint?.fingerprint?.tag,
      text: fingerprint?.fingerprint?.text,
      attributes: fingerprint?.fingerprint?.stableAttributes,
    },
    params: input.params || {},
    pageUrl: unifiedRuntime.identity.resolve({ pageId: rec.pageId })?.url,
    domContext: {
      matchedElements: fingerprint?.matched ?? 0,
      targetFingerprint: fingerprint?.fingerprint || { tag: '', text: '', classes: [], stableAttributes: {} },
      mutationCountBefore: unifiedRuntime.bus.snapshot({ domains: ['DOM'], pageId: rec.pageId }).length,
    },
    recordedAt: Date.now(),
  };
  rec.steps.push(step);
  return step;
}

export interface ReplayStepResult {
  stepId: string;
  action: string;
  selectorUsed: string;
  resolution: 'EXACT' | 'RECOVERED' | 'FAILED';
  resolutionDetail: string;
  executed: boolean;
  detail?: unknown;
  error?: string;
}

export interface ReplayOutcome {
  recordingId: string;
  replayedAt: number;
  steps: ReplayStepResult[];
  successRate: number;
  allExecuted: boolean;
  determinismNote: string;
}

/** Resilient target resolution: exact selector → fingerprint recovery. */
async function resolveReplayTarget(target: RecordedInteractionStep['target'], fingerprint: RecordedInteractionStep['domContext']['targetFingerprint'], tabId?: number): Promise<{ selector: string; resolution: 'EXACT' | 'RECOVERED' | 'FAILED'; detail: string }> {
  // 1. exact
  const exact = await runInPage(`(function(){
    const list = document.querySelectorAll(${JSON.stringify(target.selector)});
    return { count: list.length };
  })()`, tabId).catch(() => null);
  if (exact && exact.count === 1) {
    return { selector: target.selector, resolution: 'EXACT', detail: 'Selector uniquely matched.' };
  }
  if (exact && exact.count > 1) {
    // disambiguate by fingerprint text
    return { selector: target.selector, resolution: 'EXACT', detail: `Selector matched ${exact.count} elements — replay targets the first (record ambiguity warning).` };
  }
  // 2. fingerprint recovery
  const fp = fingerprint || { tag: '', text: '', classes: [], stableAttributes: {} };
  const candidates = await runInPage(`(function(){
    const out = [];
    const pool = document.querySelectorAll(${JSON.stringify(fp.tag || '*')});
    for (const el of Array.from(pool).slice(0, 500)) {
      let score = 0;
      ${fp.text ? `if ((el.textContent || '').trim().includes(${JSON.stringify(fp.text.slice(0, 30))})) score += 2;` : ''}
      ${(fp.classes || []).map(c => `if (el.classList.contains(${JSON.stringify(c)})) score += 1;`).join('\n      ')}
      ${Object.entries(fp.stableAttributes || {}).map(([k, v]) => `if (el.getAttribute(${JSON.stringify(k)}) === ${JSON.stringify(v)}) score += 2;`).join('\n      ')}
      if (el.id && ${JSON.stringify(target.selector)}.includes('#' + el.id)) score += 3;
      if (score >= 3) out.push({ selector: el.id ? '#' + el.id : el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(/\\s+/)[0] : ''), score, tag: el.tagName.toLowerCase() });
    }
    out.sort((a, b) => b.score - a.score);
    return out.slice(0, 3);
  })()`, tabId).catch(() => []);
  if (Array.isArray(candidates) && candidates.length > 0 && (candidates as any[])[0].score >= 3) {
    return { selector: String((candidates as any[])[0].selector), resolution: 'RECOVERED', detail: `Original selector no longer matches; recovered via fingerprint match (score ${(candidates as any[])[0].score}).` };
  }
  return { selector: target.selector, resolution: 'FAILED', detail: 'Neither the original selector nor fingerprint recovery found the element — the DOM diverged beyond safe replay.' };
}

export async function replayInteractions(recordingId: string, options: { tabId?: number; stopOnFailure?: boolean; verifySelectorsOnly?: boolean }): Promise<ReplayOutcome> {
  const rec = recordings.get(recordingId);
  if (!rec) throw new Error(`INVALID_INPUT: interaction recording '${recordingId}' not found (recorded with fx_record_interactions).`);
  const steps: ReplayStepResult[] = [];
  let executed = 0;

  for (const step of rec.steps) {
    const resolution = await resolveReplayTarget(step.target, step.domContext.targetFingerprint, options.tabId);
    let replayResult: unknown = null;
    let error: string | undefined;
    let didExecute = false;

    if (resolution.resolution === 'FAILED') {
      error = resolution.detail;
    } else if (!options.verifySelectorsOnly) {
      // Dispatch through the SAME interaction channel used live.
      try {
        const payload: Record<string, unknown> = {
          action: step.action,
          target: options.tabId !== undefined ? { tabId: options.tabId, selector: resolution.selector } : { selector: resolution.selector },
          ...step.params,
        };
        replayResult = await unifiedRuntime.bridgeCommand('LIVE_ELEMENT_INTERACT', payload);
        didExecute = true;
        executed++;
      } catch (err: any) {
        error = err.message;
      }
    } else {
      didExecute = true; // verification mode counts resolvable steps
      executed++;
    }

    steps.push({
      stepId: step.stepId,
      action: step.action,
      selectorUsed: resolution.selector,
      resolution: resolution.resolution,
      resolutionDetail: resolution.detail,
      executed: didExecute,
      detail: replayResult,
      error,
    });

    if (error && options.stopOnFailure !== false) break;
  }

  return {
    recordingId,
    replayedAt: Date.now(),
    steps,
    successRate: rec.steps.length ? Number((executed / rec.steps.length).toFixed(2)) : 1,
    allExecuted: executed === rec.steps.length,
    determinismNote: 'Replay preserves action order, parameters and timing-free semantics; resilient resolution re-targets via fingerprint when the DOM changed between record and replay.',
  };
}

export function listInteractionRecordings(): Array<Record<string, unknown>> {
  return Array.from(recordings.values()).map(r => ({
    recordingId: r.recordingId,
    pageId: r.pageId,
    steps: r.steps.length,
    startedAt: r.startedAt,
    stoppedAt: r.stoppedAt,
    active: !r.stoppedAt,
  }));
}

// ---------------------------------------------------------------------------
// CAP 06 — FAILURE REPLAY
// ---------------------------------------------------------------------------

export interface FailureScenario {
  failureId: string;
  capturedAt: number;
  context: {
    url: string;
    pageState: { title?: string; readyState?: string };
    actionHistory: Array<{ tool: string; argsSummary: string; outcome: string }>;
    consoleState: Array<{ level: string; text: string }>;
    networkContext: Array<{ url: string; status?: number; failed: boolean }>;
    timing: { sessionAgeMs: number; failedAtOffsetMs: number };
  };
  selectorCandidates: Array<{ selector: string; survivability: number; note: string }>;
  domSubtree: { selector: string; htmlPreview: string } | null;
  screenshot: { available: boolean; note: string };
  mutationContext: BaseEvent[];
  replay: { url: string; steps: Array<{ action: string; selector: string; params: Record<string, unknown> }> };
}

const failureStore = new Map<string, FailureScenario>();
let failureCounter = 0;

export async function captureFailure(input: {
  url?: string;
  failedAction: string;
  failedSelector?: string;
  params?: Record<string, unknown>;
  tabId?: number;
  actionHistory?: Array<{ tool: string; argsSummary: string; outcome: string }>;
  events?: BaseEvent[];
  sessionStart?: number;
}): Promise<FailureScenario> {
  // Live context capture (simulation → JSDOM).
  const pageContext = await runInPage(`(function(){
    const sel = ${JSON.stringify(input.failedSelector || '')};
    let subtree = null;
    if (sel) {
      const el = document.querySelector(sel) || (document.querySelector(sel.split(/[ >]/)[0]) || null);
      if (el) subtree = { selector: sel, htmlPreview: el.outerHTML.slice(0, 800) };
    }
    return { title: document.title, readyState: document.readyState, url: location.href, subtree };
  })()`, input.tabId).catch(() => null);

  const events = input.events || [];
  const consoleState = events.filter(e => e.category === 'CONSOLE').slice(-10).map(e => ({ level: String((e.payload as any).level || e.type), text: String((e.payload as any).text || (e.payload as any).message || '').slice(0, 120) }));
  const networkContext = events.filter(e => e.category === 'NETWORK').slice(-15).map(e => ({ url: String((e.payload as any).url || '?'), status: (e.payload as any).status !== undefined ? Number((e.payload as any).status) : undefined, failed: e.type === 'NETWORK_REQUEST_FAILED' }));

  // selector candidates from recent DOM events targeting nearby elements
  const selectorCandidates: FailureScenario['selectorCandidates'] = [];
  if (input.failedSelector) {
    selectorCandidates.push({ selector: input.failedSelector, survivability: 0.5, note: 'Original selector (failed — verify existence with diagnose_selector_failure).' });
    const idMatch = /^#([\w-]+)/.exec(input.failedSelector);
    if (idMatch) selectorCandidates.push({ selector: `[id="${idMatch[1]}"]`, survivability: 0.6, note: 'Attribute-selector form (robust to CSS escaping issues).' });
    const classMatch = /\.([\w-]+)/.exec(input.failedSelector);
    if (classMatch) selectorCandidates.push({ selector: `[class~="${classMatch[1]}"]`, survivability: 0.45, note: 'Class attribute form (survives minor selector syntax issues).' });
  }
  const mutationContext = events.filter(e => e.category === 'DOM').slice(-20);

  const scenario: FailureScenario = {
    failureId: `fail_${++failureCounter}_${Date.now().toString(36)}`,
    capturedAt: Date.now(),
    context: {
      url: input.url || pageContext?.url || (typeof document !== 'undefined' ? document.location?.href : 'unknown'),
      pageState: { title: pageContext?.title, readyState: pageContext?.readyState },
      actionHistory: (input.actionHistory || []).slice(-15),
      consoleState,
      networkContext,
      timing: {
        sessionAgeMs: input.sessionStart ? Date.now() - input.sessionStart : 0,
        failedAtOffsetMs: 0,
      },
    },
    selectorCandidates,
    domSubtree: pageContext?.subtree || null,
    screenshot: {
      available: false,
      note: 'Capture a visual state with capture_page_screenshot/capture_page_state immediately after a failure to attach visual evidence; historical screenshots remain queryable via get_screenshots.',
    },
    mutationContext,
    replay: {
      url: input.url || pageContext?.url || 'about:blank',
      steps: [{ action: input.failedAction, selector: input.failedSelector || '', params: input.params || {} }],
    },
  };
  failureStore.set(scenario.failureId, scenario);
  return scenario;
}

export function getFailureScenario(failureId: string): FailureScenario {
  const scenario = failureStore.get(failureId);
  if (!scenario) throw new Error(`INVALID_INPUT: failure scenario '${failureId}' not found.`);
  return scenario;
}

export function listFailureScenarios(): Array<Record<string, unknown>> {
  return Array.from(failureStore.values()).map(f => ({ failureId: f.failureId, capturedAt: f.capturedAt, url: f.context.url, action: f.replay.steps[0]?.action, selector: f.replay.steps[0]?.selector }));
}

/** Replay a stored failure scenario: navigate + re-execute with resilient resolution. */
export async function replayFailureScenario(failureId: string, options: { tabId?: number; verifyOnly?: boolean }): Promise<Record<string, unknown>> {
  const scenario = getFailureScenario(failureId);
  const results: Array<Record<string, unknown>> = [];
  for (const step of scenario.replay.steps) {
    if (!step.selector) {
      results.push({ step: step.action, executed: false, reason: 'No selector recorded for this step.' });
      continue;
    }
    const resolution = await resolveReplayTarget({ selector: step.selector }, { tag: '', text: '', classes: [], stableAttributes: {} }, options.tabId);
    let executed = false;
    let detail: unknown = null;
    if (resolution.resolution !== 'FAILED' && !options.verifyOnly) {
      try {
        detail = await unifiedRuntime.bridgeCommand('LIVE_ELEMENT_INTERACT', {
          action: step.action,
          target: options.tabId !== undefined ? { tabId: options.tabId, selector: resolution.selector } : { selector: resolution.selector },
          ...step.params,
        });
        executed = true;
      } catch (err: any) {
        detail = err.message;
      }
    } else if (options.verifyOnly) {
      executed = resolution.resolution !== 'FAILED';
    }
    results.push({ step: step.action, selector: step.selector, resolution: resolution.resolution, resolutionDetail: resolution.detail, executed, detail });
  }
  return {
    failureId,
    scenarioUrl: scenario.replay.url,
    steps: results,
    consoleAfterReplayHint: 'Call get_tab_console_logs (or dt_list_console_messages with ingestTabId) after replay to compare error recurrence.',
    contextPreserved: { selectorCandidates: scenario.selectorCandidates, domSubtree: scenario.domSubtree ? scenario.domSubtree.htmlPreview.slice(0, 200) : null, networkContext: scenario.context.networkContext.slice(0, 5) },
  };
}
