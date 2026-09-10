import {
  BrowserCommandRequest,
  BrowserCommandResponse,
  DOMMutationPayload,
  ElementInteractionPayload,
  LiveElementTarget,
  LiveScreenshotResult,
} from '../types/browser-control';
import { ElementInteractionEngine } from './element-interaction-engine';
import { ElementObserver } from './element-observer';
import { ElementPicker } from './element-picker';
import { LiveDOMInspector } from './live-dom-inspector';
import { NodeRegistry } from './node-registry';
import { PrivacyEngine } from './privacy-engine';
import { SequenceCounter } from './sequence-counter';
import { SnapshotEngine } from './snapshot-engine';
import { PNGBuilder } from './png-builder';
import { DOMMutationEngine } from './dom-mutation-engine';
import { JSExecutionEngine } from './js-execution-engine';
import { ViewportController } from './viewport-controller';
import { ElementTargetingEngine } from './element-targeting';
import { SelectorRecoveryEngine } from './selector-recovery';
import { DOMFingerprintEngine } from './dom-fingerprint';
import { HumanInteractionController } from './human-interaction';
import { runAnalyzer } from './dom-analyzers';
import { BrowserSessionModel } from './browser-session-model';
import { RegionCaptureEngine } from '../projects/region-capture';

/**
 * Deterministic virtual tab state for the Node-side simulation context.
 * Clearly reported as simulated — never presented as a real browser.
 */
interface SimulationTab {
  sessionTabId: string;
  browserTabId: number;
  url: string;
  title: string;
  active: boolean;
  createdAt: number;
}

export class LiveBrowserController {
  private nodeRegistry: NodeRegistry;
  private snapshotEngine: SnapshotEngine;
  private picker: ElementPicker;
  private interactionEngine: ElementInteractionEngine;
  private observer: ElementObserver;

  // === MCPDOM v3 platform engines (lazily keyed per document) ===
  private mutationEngines = new WeakMap<Document, DOMMutationEngine>();
  private viewportControllers = new WeakMap<Document, ViewportController>();
  private targetingEngines = new WeakMap<Document, ElementTargetingEngine>();
  private jsEngine = new JSExecutionEngine();
  private fingerprintEngine = new DOMFingerprintEngine();
  public readonly humanInteraction = new HumanInteractionController();
  public readonly session = new BrowserSessionModel();
  private simulationTabs: SimulationTab[] = [];
  private simulationTabCounter = 0;
  private simulationExtensions = [
    { id: 'forensic-recorder@mcpdom', name: 'Browser Forensic Recorder (MCPDOM)', version: '3.0.0', description: 'The MCPDOM platform extension itself', enabled: true, installType: 'development' as const, isApp: false },
  ];
  private regionCapture = new RegionCaptureEngine();

  constructor(nodeRegistry?: NodeRegistry) {
    this.nodeRegistry = nodeRegistry || new NodeRegistry();
    const privacy = new PrivacyEngine();
    const sequenceCounter = new SequenceCounter();
    this.snapshotEngine = new SnapshotEngine(this.nodeRegistry, privacy, sequenceCounter);
    this.picker = new ElementPicker({ nodeRegistry: this.nodeRegistry });
    this.interactionEngine = new ElementInteractionEngine(this.nodeRegistry);
    this.observer = new ElementObserver(this.nodeRegistry);

    this.picker.initGlobalShortcutListener();

    // Wire the human-interaction timing hook into the interaction engine.
    // Default profile is DETERMINISTIC (zero delay) — legacy behavior preserved.
    this.interactionEngine.setTimingHook(async (phase) => {
      const ms = this.humanInteraction.delay(phase);
      if (ms > 0) {
        await new Promise((resolve) => setTimeout(resolve, ms));
      }
    });
  }

  private getMutationEngine(doc: Document): DOMMutationEngine {
    let engine = this.mutationEngines.get(doc);
    if (!engine) {
      engine = new DOMMutationEngine(doc, this.nodeRegistry);
      this.mutationEngines.set(doc, engine);
    }
    return engine;
  }

  private getViewportController(doc: Document): ViewportController {
    let controller = this.viewportControllers.get(doc);
    if (!controller) {
      controller = new ViewportController(doc);
      this.viewportControllers.set(doc, controller);
    }
    return controller;
  }

  private getTargetingEngine(doc: Document): ElementTargetingEngine {
    let engine = this.targetingEngines.get(doc);
    if (!engine) {
      engine = new ElementTargetingEngine(doc, this.nodeRegistry);
      this.targetingEngines.set(doc, engine);
    }
    return engine;
  }

  private isSimulation(): boolean {
    return (
      typeof (globalThis as any).__FORENSIC_SIMULATION__ !== 'undefined' ||
      typeof (globalThis as any).chrome === 'undefined'
    );
  }

  public getPicker(): ElementPicker {
    return this.picker;
  }

  public getInteractionEngine(): ElementInteractionEngine {
    return this.interactionEngine;
  }

  public getObserver(): ElementObserver {
    return this.observer;
  }

  public getNodeRegistry(): NodeRegistry {
    return this.nodeRegistry;
  }

  /**
   * Universal Dispatcher for all Live Browser Commands
   */
  public async handleCommand(
    request: BrowserCommandRequest,
    doc: Document = typeof document !== 'undefined' ? document : ({} as any)
  ): Promise<BrowserCommandResponse> {
    const startTime = Date.now();
    const { id, command, payload } = request;

    try {
      switch (command) {
        // 1. Page-Level Inspection
        case 'LIVE_PAGE_INSPECT': {
          const pageInfo = LiveDOMInspector.inspectPage(doc);
          return this.success(id, command, pageInfo, startTime);
        }

        // 2. Element-Level Inspection
        case 'LIVE_ELEMENT_INSPECT': {
          const target = this.resolveTarget(payload, doc);
          const elementInfo = LiveDOMInspector.inspectElement(target, this.nodeRegistry);
          return this.success(id, command, elementInfo, startTime);
        }

        // 3. Get Selected Element (Ctrl+Shift+Click)
        case 'GET_SELECTED_ELEMENT': {
          const selected = this.picker.getLastSelectedElement();
          return this.success(id, command, selected, startTime);
        }

        // 4. Element Picker Controls
        case 'ELEMENT_PICKER_START': {
          this.picker.startPicker();
          return this.success(id, command, { pickerActive: true }, startTime);
        }

        case 'ELEMENT_PICKER_STOP': {
          this.picker.stopPicker();
          return this.success(id, command, { pickerActive: false }, startTime);
        }

        // 5. Element Interaction
        case 'LIVE_ELEMENT_INTERACT': {
          const interactionPayload = payload as ElementInteractionPayload;
          const result = await this.interactionEngine.interact(interactionPayload, doc);
          return this.success(id, command, result, startTime);
        }

        // 6. Element Observation
        case 'ELEMENT_OBSERVATION_START': {
          const target = this.resolveTarget(payload, doc);
          const obsInfo = this.observer.startObservation(target, doc);
          return this.success(id, command, obsInfo, startTime);
        }

        case 'ELEMENT_OBSERVATION_STOP': {
          const bundle = this.observer.stopObservation(doc);
          return this.success(id, command, bundle, startTime);
        }

        // 7. Live DOM Snapshot
        case 'LIVE_DOM_SNAPSHOT': {
          const format = payload?.format || 'html';
          if (format === 'html') {
            const html = doc.documentElement?.outerHTML || '';
            return this.success(id, command, { html }, startTime);
          }
          const snapshot = this.snapshotEngine.captureSnapshot(doc, 'live_session');
          return this.success(id, command, snapshot, startTime);
        }

        // 8. Live DOM Subtree
        case 'LIVE_DOM_SUBTREE': {
          const target = this.resolveTarget(payload, doc);
          const html = target.outerHTML || '';
          const info = LiveDOMInspector.inspectElement(target, this.nodeRegistry);
          return this.success(id, command, { html, element: info }, startTime);
        }

        // 9. Element Visual & Occlusion State
        case 'GET_ELEMENT_VISUAL_STATE': {
          const target = this.resolveTarget(payload, doc);
          const visualState = LiveDOMInspector.inspectVisualState(target);
          return this.success(id, command, visualState, startTime);
        }

        // 10. Live Screenshots
        case 'LIVE_PAGE_SCREENSHOT':
        case 'LIVE_ELEMENT_SCREENSHOT': {
          const screenshot = await this.handleScreenshotCapture(command, payload, doc);
          return this.success(id, command, screenshot, startTime);
        }

        // 11. Tab Console Logs
        case 'GET_TAB_CONSOLE_LOGS': {
          const { level, searchQuery, limit = 100, clearAfterRead } = payload || {};
          let logs: any[] = (typeof window !== 'undefined' && (window as any).__FORENSIC_CONSOLE_BUFFER__) || [];
          if (level && level !== 'all') {
            logs = logs.filter((l: any) => l.level === level);
          }
          if (searchQuery) {
            const q = String(searchQuery).toLowerCase();
            logs = logs.filter((l: any) => l.text?.toLowerCase().includes(q) || l.source?.toLowerCase().includes(q));
          }
          if (limit > 0) {
            logs = logs.slice(-limit);
          }
          if (clearAfterRead && typeof window !== 'undefined' && (window as any).__FORENSIC_CONSOLE_BUFFER__) {
            (window as any).__FORENSIC_CONSOLE_BUFFER__.length = 0;
          }
          return this.success(
            id,
            command,
            {
              url: typeof window !== 'undefined' ? window.location.href : '',
              title: doc.title || '',
              totalCaptured: (typeof window !== 'undefined' && (window as any).__FORENSIC_CONSOLE_BUFFER__?.length) || logs.length,
              returnedCount: logs.length,
              logs,
            },
            startTime
          );
        }

        // 12. Tab Network Requests
        case 'GET_TAB_NETWORK_REQUESTS': {
          const { method, searchQuery, status, onlyErrors, limit = 100, clearAfterRead } = payload || {};
          let reqs: any[] = (typeof window !== 'undefined' && (window as any).__FORENSIC_NETWORK_BUFFER__) || [];
          if (method) {
            reqs = reqs.filter((r: any) => r.method?.toUpperCase() === String(method).toUpperCase());
          }
          if (status) {
            reqs = reqs.filter((r: any) => r.status === Number(status));
          }
          if (onlyErrors) {
            reqs = reqs.filter((r: any) => r.error || (r.status && r.status >= 400));
          }
          if (searchQuery) {
            const q = String(searchQuery).toLowerCase();
            reqs = reqs.filter((r: any) => r.url?.toLowerCase().includes(q));
          }
          if (limit > 0) {
            reqs = reqs.slice(-limit);
          }
          if (clearAfterRead && typeof window !== 'undefined' && (window as any).__FORENSIC_NETWORK_BUFFER__) {
            (window as any).__FORENSIC_NETWORK_BUFFER__.length = 0;
          }
          return this.success(
            id,
            command,
            {
              url: typeof window !== 'undefined' ? window.location.href : '',
              title: doc.title || '',
              totalCaptured: (typeof window !== 'undefined' && (window as any).__FORENSIC_NETWORK_BUFFER__?.length) || reqs.length,
              returnedCount: reqs.length,
              requests: reqs,
            },
            startTime
          );
        }

        case 'CLOSE_TAB': {
          if (typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome.runtime?.sendMessage) {
            const res = await new Promise((resolve) => {
              (globalThis as any).chrome.runtime.sendMessage({ type: 'BROWSER_COMMAND_REQUEST', id, command, payload }, (r: any) => resolve(r));
            });
            if (res) return res as any;
          }
          // Simulation mode: manage virtual tab state WITHOUT destroying the
          // JSDOM fixture window (window.close() would corrupt all later ops).
          if (this.isSimulation()) {
            return this.simulationCloseTab(payload, doc, id, command, startTime);
          }
          if (typeof window !== 'undefined') {
            setTimeout(() => window.close(), 100);
            return this.success(id, command, { closed: true, url: window.location.href, title: doc.title }, startTime);
          }
          return this.success(id, command, { closed: true }, startTime);
        }

        case 'RELOAD_TAB': {
          if (typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome.runtime?.sendMessage) {
            const res = await new Promise((resolve) => {
              (globalThis as any).chrome.runtime.sendMessage({ type: 'BROWSER_COMMAND_REQUEST', id, command, payload }, (r: any) => resolve(r));
            });
            if (res) return res as any;
          }
          // Simulation mode: re-inject fixture semantics without calling
          // location.reload() (which throws "Not implemented" in JSDOM and
          // aborts navigation state).
          if (this.isSimulation()) {
            const mode = payload?.mode || 'soft';
            this.session.timeline.record('NAVIGATED', `tab reloaded (${mode} mode)`);
            return this.success(
              id,
              command,
              {
                reloaded: true,
                mode,
                simulated: true,
                url: doc.defaultView?.location?.href || '',
                title: doc.title,
                note: 'Node simulation context: DOM fixture retained; no real navigation occurs.',
              },
              startTime
            );
          }
          if (typeof window !== 'undefined') {
            setTimeout(() => window.location.reload(), 100);
            return this.success(id, command, { reloaded: true, url: window.location.href, title: doc.title }, startTime);
          }
          return this.success(id, command, { reloaded: true }, startTime);
        }

        case 'OPEN_TAB':
        case 'LIST_TABS':
        case 'FOCUS_TAB':
        case 'LIST_EXTENSIONS':
        case 'RELOAD_EXTENSION':
        case 'SET_EXTENSION_ENABLED':
        case 'TOGGLE_EXTENSION': {
          // In the Node simulation context, these background commands operate
          // on deterministic virtual state so tool contracts stay verifiable.
          if (this.isSimulation()) {
            return this.handleSimulationBackgroundCommand(id, command, payload, doc, startTime);
          }
          if (typeof (globalThis as any).chrome !== 'undefined' && (globalThis as any).chrome.runtime?.sendMessage) {
            const res = await new Promise((resolve) => {
              (globalThis as any).chrome.runtime.sendMessage({ type: 'BROWSER_COMMAND_REQUEST', id, command, payload }, (r: any) => resolve(r));
            });
            if (res) return res as any;
          }
          return this.error(id, command, 'BACKGROUND_EXECUTION_FAILED', `Command ${command} requires Chrome extension runtime`, startTime);
        }

        // ==================================================================
        // MCPDOM v3 PLATFORM EVOLUTION COMMANDS
        // ==================================================================

        // --- Viewport control (§17/§38) ---
        case 'RESIZE_VIEWPORT': {
          const vc = this.getViewportController(doc);
          let result;
          if (payload?.preset) {
            result = vc.applyPreset(payload.preset);
          } else {
            const width = Number(payload?.width) || 1280;
            const height = Number(payload?.height) || 800;
            result = vc.resize(width, height);
          }
          this.session.timeline.record('RESIZED', `viewport → ${result.applied.width}x${result.applied.height}`);
          return this.success(id, command, result, startTime);
        }

        case 'RESET_VIEWPORT': {
          const vc = this.getViewportController(doc);
          const result = vc.reset();
          this.session.timeline.record('RESIZED', `viewport restored to ${result.applied.width}x${result.applied.height}`);
          return this.success(id, command, result, startTime);
        }

        case 'GET_VIEWPORT_STATE': {
          const vc = this.getViewportController(doc);
          return this.success(id, command, vc.state(), startTime);
        }

        case 'RUN_RESPONSIVE_TEST': {
          const vc = this.getViewportController(doc);
          const sizes = payload?.sizes || defaultSizesInternal();
          const result = vc.runResponsiveTest(sizes, { restore: payload?.restore !== false });
          return this.success(id, command, result, startTime);
        }

        case 'EMULATE_DEVICE': {
          const vc = this.getViewportController(doc);
          const result = vc.emulateDevice(payload?.device || 'pixel-7');
          return this.success(id, command, result, startTime);
        }

        // --- JavaScript execution (§18) ---
        case 'EXECUTE_JS':
        case 'EXECUTE_JS_AND_CAPTURE_CHANGES': {
          const code = String(payload?.code || '');
          if (!code.trim()) {
            return this.error(id, command, 'SCRIPT_EMPTY', 'payload.code is required.', startTime);
          }
          const result = await this.jsEngine.execute(doc, code, {
            timeoutMs: payload?.timeoutMs,
            world: payload?.world === 'MAIN' ? 'MAIN' : 'ISOLATED',
          });
          this.session.timeline.record('SCRIPT_EXECUTED', `${result.status} (${result.durationMs}ms)`);
          return this.success(id, command, result, startTime);
        }

        // --- DOM mutation engine (§19/§20/§47/§48) ---
        case 'DOM_MUTATE': {
          const engine = this.getMutationEngine(doc);
          const result = engine.mutate(payload as DOMMutationPayload);
          this.session.timeline.record('DOM_MUTATED', `${result.operation} on ${result.before.selector} → ${result.success ? 'OK' : result.error}`);
          return this.success(id, command, result, startTime);
        }

        case 'DOM_MUTATE_TRANSACTION': {
          const engine = this.getMutationEngine(doc);
          const mode = payload?.mode || 'begin';
          try {
            if (mode === 'begin') {
              const transactionId = engine.beginTransaction();
              return this.success(id, command, { transactionId, mode, open: true }, startTime);
            }
            if (mode === 'commit') {
              const result = engine.commitTransaction();
              this.session.timeline.record('DOM_MUTATED', `transaction ${result.transactionId} committed (${result.steps.length} steps)`);
              return this.success(id, command, { ...result, mode }, startTime);
            }
            if (mode === 'rollback') {
              const result = engine.rollbackTransaction(payload?.reason);
              this.session.timeline.record('MUTATION_UNDONE', `transaction ${result.transactionId} rolled back`);
              return this.success(id, command, { ...result, mode }, startTime);
            }
            return this.error(id, command, 'INVALID_MODE', `mode must be begin|commit|rollback, got "${mode}"`, startTime);
          } catch (err: any) {
            return this.error(id, command, 'DOM_MUTATION_FAILED', err.message, startTime);
          }
        }

        case 'UNDO_DOM_MUTATION': {
          const engine = this.getMutationEngine(doc);
          const result = engine.undo();
          if (result.success) this.session.timeline.record('MUTATION_UNDONE', result.message);
          return this.success(id, command, result, startTime);
        }

        case 'REDO_DOM_MUTATION': {
          const engine = this.getMutationEngine(doc);
          const result = engine.redo();
          if (result.success) this.session.timeline.record('MUTATION_REDONE', result.message);
          return this.success(id, command, result, startTime);
        }

        case 'GET_MUTATION_HISTORY': {
          const engine = this.getMutationEngine(doc);
          return this.success(
            id,
            command,
            {
              entries: engine.getHistory(payload?.limit || 100),
              undoDepth: engine.getUndoDepth(),
              redoDepth: engine.getRedoDepth(),
              openTransactionId: engine.getOpenTransactionId(),
            },
            startTime
          );
        }

        case 'PREVIEW_DOM_MUTATION': {
          const engine = this.getMutationEngine(doc);
          const preview = engine.preview(payload as DOMMutationPayload);
          return this.success(id, command, preview, startTime);
        }

        // --- Element targeting & forensics (§12/§13/§34/§35) ---
        case 'GENERATE_ELEMENT_TARGET': {
          const targeting = this.getTargetingEngine(doc);
          const outcome = targeting.resolveAndBuild(payload?.target || payload?.selector || '');
          if ('error' in outcome) {
            return this.error(id, command, 'TARGET_NOT_FOUND', outcome.error, startTime);
          }
          return this.success(id, command, outcome.target, startTime);
        }

        case 'RECOVER_SELECTOR': {
          const recovery = new SelectorRecoveryEngine(doc);
          const snapshot = payload?.snapshot || {};
          const outcome = recovery.recover(payload?.selector || '', snapshot);
          return this.success(id, command, outcome, startTime);
        }

        case 'GET_ELEMENT_ANCESTRY': {
          const target = this.resolveTarget(payload, doc);
          return this.success(id, command, buildAncestry(target, doc), startTime);
        }

        case 'GET_ELEMENT_FINGERPRINT': {
          const target = this.resolveTarget(payload, doc);
          const fp = this.fingerprintEngine.fingerprint(target);
          return this.success(id, command, fp, startTime);
        }

        case 'GET_ELEMENT_RELATIONSHIPS': {
          const target = this.resolveTarget(payload, doc);
          return this.success(id, command, buildRelationships(target, doc), startTime);
        }

        case 'GET_ELEMENT_ACCESSIBILITY': {
          const target = this.resolveTarget(payload, doc);
          return this.success(id, command, buildAccessibility(target), startTime);
        }

        case 'GET_COMPUTED_STYLE': {
          const target = this.resolveTarget(payload, doc);
          const win = doc.defaultView;
          if (!win?.getComputedStyle) {
            return this.error(id, command, 'STYLE_UNAVAILABLE', 'getComputedStyle is unavailable in this context.', startTime);
          }
          const cs = win.getComputedStyle(target);
          const props = Array.isArray(payload?.properties) && payload.properties.length
            ? payload.properties
            : ['display', 'position', 'color', 'background-color', 'font-size', 'font-family', 'width', 'height', 'margin', 'padding', 'border', 'z-index', 'opacity', 'visibility', 'overflow', 'flex-direction', 'grid-template-columns'];
          const styles: Record<string, string> = {};
          for (const p of props) {
            styles[p] = cs.getPropertyValue(p);
          }
          return this.success(id, command, { selector: LiveDOMInspector.inspectElement(target, this.nodeRegistry).bestSelector, styles }, startTime);
        }

        case 'ANALYZE_DOM': {
          const analyzer = String(payload?.analyzer || '');
          if (!analyzer) {
            return this.error(id, command, 'ANALYZER_REQUIRED', 'payload.analyzer is required (e.g. "analyze_forms").', startTime);
          }
          const result = runAnalyzer(analyzer, doc, payload);
          if (result.count === 0 && result.warnings.length === 0 && result.items.length === 0 && result.summary.startsWith('Unknown analyzer')) {
            return this.error(id, command, 'UNKNOWN_ANALYZER', result.summary, startTime);
          }
          return this.success(id, command, result, startTime);
        }

        // --- Extended interactions (capabilities 11-20) ---
        case 'DRAG_ELEMENT': {
          const source = this.resolveTarget(payload?.source, doc);
          const targetEl = payload?.target ? this.resolveTarget(payload?.target, doc) : null;
          const result = await this.performDrag(source, targetEl, payload?.offsets, doc);
          return this.success(id, command, result, startTime);
        }

        case 'SET_INPUT_CHECKED': {
          const target = this.resolveTarget(payload, doc);
          const input = target as HTMLInputElement;
          if (input.type !== 'checkbox' && input.type !== 'radio') {
            return this.error(id, command, 'INPUT_TYPE_UNSUPPORTED', `Target input type "${input.type}" is not checkbox/radio.`, startTime);
          }
          const checkedBefore = input.checked;
          input.checked = payload?.checked !== false;
          const events: string[] = [];
          for (const evt of ['input', 'change']) {
            try {
              input.dispatchEvent(new (doc.defaultView as any).Event(evt, { bubbles: true }));
              events.push(evt);
            } catch { /* skip */ }
          }
          if (input.type === 'radio' && input.name) {
            for (const peer of Array.from(doc.querySelectorAll(`input[type=radio][name="${input.name}"]`))) {
              if (peer !== input) (peer as HTMLInputElement).checked = false;
            }
          }
          return this.success(id, command, { success: true, selector: LiveDOMInspector.inspectElement(input, this.nodeRegistry).bestSelector, inputType: input.type, checkedBefore, checkedAfter: input.checked, eventsFired: events }, startTime);
        }

        case 'PRESS_KEYBOARD_SHORTCUT': {
          const keys: string[] = Array.isArray(payload?.keys) ? payload.keys : String(payload?.keys || 'Enter').split('+');
          const focusTarget = payload?.target ? this.resolveTarget(payload?.target, doc) : (doc.activeElement as Element) || doc.body;
          if (typeof (focusTarget as HTMLElement).focus === 'function') (focusTarget as HTMLElement).focus();
          const events: string[] = [];
          const win = doc.defaultView as any;
          for (const key of keys) {
            for (const evtType of ['keydown', 'keyup']) {
              try {
                focusTarget.dispatchEvent(
                  new (win?.KeyboardEvent || KeyboardEvent)(evtType, {
                    key: key.trim(),
                    bubbles: true,
                    cancelable: true,
                    ctrlKey: keys.some((k) => /^(ctrl|control|cmd|meta)$/i.test(k)) && key !== keys.find((k) => /^(ctrl|control|cmd|meta)$/i.test(k)),
                    shiftKey: keys.some((k) => /^shift$/i.test(k)) && key !== 'Shift',
                    altKey: keys.some((k) => /^alt$/i.test(k)) && key !== 'Alt',
                  })
                );
                events.push(`${evtType}:${key}`);
              } catch { /* skip */ }
            }
          }
          return this.success(id, command, { success: true, keys, targetSelector: LiveDOMInspector.inspectElement(focusTarget, this.nodeRegistry).bestSelector, eventsFired: events }, startTime);
        }

        case 'SCROLL_PAGE': {
          const win = doc.defaultView;
          if (!win) {
            return this.error(id, command, 'NO_WINDOW', 'No window available for scrolling.', startTime);
          }
          const before = { x: win.scrollX || 0, y: win.scrollY || 0 };
          let targetSelector: string | undefined;
          if (payload?.target || payload?.selector) {
            const target = this.resolveTarget(payload?.target || payload?.selector, doc);
            (target as HTMLElement).scrollIntoView?.({ behavior: payload?.behavior || 'auto', block: 'center' });
            targetSelector = LiveDOMInspector.inspectElement(target, this.nodeRegistry).bestSelector;
          } else {
            win.scrollBy(Number(payload?.x) || 0, Number(payload?.y) || 0);
          }
          const after = { x: win.scrollX || 0, y: win.scrollY || 0 };
          return this.success(id, command, { success: true, scrollBefore: before, scrollAfter: after, requested: { x: Number(payload?.x) || 0, y: Number(payload?.y) || 0 }, targetSelector }, startTime);
        }

        case 'WAIT_FOR_CONDITION': {
          const result = await this.waitForCondition(doc, payload || {}, startTime, id, command);
          return result;
        }

        // --- Page state snapshots (§39/§40) ---
        case 'GET_PAGE_STATE':
        case 'CAPTURE_PAGE_STATE': {
          const snapshot = this.session.captureSnapshot(doc, true, this.getMutationEngine(doc).getUndoDepth());
          return this.success(id, command, snapshot, startTime);
        }

        // --- Region capture (browser side of §33) ---
        case 'CAPTURE_REGION': {
          const target = this.resolveTarget(payload?.target || payload?.selector, doc);
          const data = this.regionCapture.capture(target);
          return this.success(id, command, data, startTime);
        }

        // --- Simulation tab state (for the session model) ---
        case 'GET_SIMULATION_TAB_STATE': {
          if (!this.isSimulation()) {
            return this.error(id, command, 'NOT_SIMULATION', 'Simulation tab state is only available in the Node simulation context.', startTime);
          }
          return this.success(id, command, { simulated: true, tabs: this.simulationTabs, sessionSummary: this.session.getTabs() }, startTime);
        }

        default:
          return this.error(id, command, 'UNKNOWN_COMMAND', `Unsupported command '${command}'`, startTime);
      }
    } catch (err: any) {
      return this.error(id, command, 'COMMAND_EXECUTION_FAILED', err.message, startTime, err.details);
    }
  }

  private resolveTarget(targetSpec: LiveElementTarget | string | number | undefined, doc: Document): Element {
    if (!targetSpec) {
      throw new Error('Target specifier must be provided');
    }
    if (typeof targetSpec === 'string') {
      return this.interactionEngine.resolveTarget({ selector: targetSpec }, doc);
    }
    if (typeof targetSpec === 'number') {
      return this.interactionEngine.resolveTarget({ nodeId: targetSpec }, doc);
    }
    return this.interactionEngine.resolveTarget(targetSpec, doc);
  }

  // ==================================================================
  // MCPDOM v3 helper implementations
  // ==================================================================

  private async performDrag(
    source: Element,
    target: Element | null,
    offsets: { x?: number; y?: number } | undefined,
    doc: Document
  ): Promise<any> {
    const win = doc.defaultView as any;
    const eventsFired: string[] = [];
    const fire = (el: Element, type: string, opts: any = {}) => {
      try {
        const MouseCtor = win?.MouseEvent || (typeof MouseEvent !== 'undefined' ? MouseEvent : null);
        if (MouseCtor) {
          el.dispatchEvent(new MouseCtor(type, { bubbles: true, cancelable: true, ...opts }));
          eventsFired.push(type);
        }
      } catch { /* skip */ }
    };

    const sourceRect = source.getBoundingClientRect();
    const startX = sourceRect.x + sourceRect.width / 2;
    const startY = sourceRect.y + sourceRect.height / 2;
    let endX = startX + (offsets?.x || 0);
    let endY = startY + (offsets?.y || 0);
    if (target) {
      const tr = target.getBoundingClientRect();
      endX = tr.x + tr.width / 2;
      endY = tr.y + tr.height / 2;
    }

    // HTML5 drag & drop semantics + pointer events
    fire(source, 'pointerdown', { button: 1, clientX: startX, clientY: startY });
    fire(source, 'mousedown', { button: 1, clientX: startX, clientY: startY });
    fire(source, 'dragstart', { clientX: startX, clientY: startY });
    if (target) {
      fire(target, 'dragenter', { clientX: endX, clientY: endY });
      fire(target, 'dragover', { clientX: endX, clientY: endY });
      fire(target, 'drop', { clientX: endX, clientY: endY });
    }
    fire(source, 'dragend', { clientX: endX, clientY: endY });
    fire(source, 'pointerup', { button: 1, clientX: endX, clientY: endY });
    fire(source, 'mouseup', { button: 1, clientX: endX, clientY: endY });

    return {
      success: eventsFired.length > 0,
      sourceSelector: LiveDOMInspector.inspectElement(source, this.nodeRegistry).bestSelector,
      targetSelector: target ? LiveDOMInspector.inspectElement(target, this.nodeRegistry).bestSelector : '(offset drop)',
      eventsFired,
      finalPosition: { x: Math.round(endX), y: Math.round(endY) },
      html5DndUsed: eventsFired.includes('dragstart'),
    };
  }

  private async waitForCondition(
    doc: Document,
    payload: any,
    startTime: number,
    id: string,
    command: any
  ): Promise<BrowserCommandResponse> {
    const kind = payload.kind || 'dom_stable';
    const timeoutMs = Math.min(Math.max(Number(payload.timeoutMs) || 5000, 100), 30000);
    const pollIntervalMs = Math.min(Math.max(Number(payload.pollIntervalMs) || 100, 20), 1000);
    const start = Date.now();

    const check = (): { satisfied: boolean; detail: string } => {
      switch (kind) {
        case 'dom_stable': {
          const length = doc.documentElement?.outerHTML.length || 0;
          return {
            satisfied: true, // first observation is the baseline; stability = no change across polls handled below
            detail: `dom length ${length}`,
          };
        }
        case 'selector_present': {
          const found = payload.selector ? doc.querySelectorAll(payload.selector).length : 0;
          return { satisfied: found > 0, detail: `"${payload.selector}" matches ${found} element(s)` };
        }
        case 'selector_visible': {
          if (!payload.selector) return { satisfied: false, detail: 'no selector supplied' };
          const el = doc.querySelector(payload.selector);
          if (!el) return { satisfied: false, detail: `"${payload.selector}" not present` };
          try {
            const vis = LiveDOMInspector.inspectElement(el).visibility.isVisible;
            return { satisfied: vis, detail: `visibility=${vis}` };
          } catch {
            return { satisfied: false, detail: 'inspection failed' };
          }
        }
        case 'selector_absent': {
          const found = payload.selector ? doc.querySelectorAll(payload.selector).length : 0;
          return { satisfied: found === 0, detail: `"${payload.selector}" matches ${found} element(s)` };
        }
        case 'text_present': {
          const text = doc.body?.innerText || doc.body?.textContent || '';
          const has = payload.text ? text.includes(String(payload.text)) : false;
          return { satisfied: has, detail: `text "${String(payload.text).slice(0, 30)}" ${has ? 'found' : 'not found'}` };
        }
        case 'url_contains': {
          const url = doc.defaultView?.location?.href || '';
          return { satisfied: payload.text ? url.includes(String(payload.text)) : false, detail: url };
        }
        case 'element_count': {
          const found = payload.selector ? doc.querySelectorAll(payload.selector).length : 0;
          const expected = Number(payload.count) || 0;
          return { satisfied: found === expected, detail: `${found}/${expected} elements` };
        }
        case 'readiness_state': {
          return { satisfied: doc.readyState === (payload.state || 'complete'), detail: `readyState=${doc.readyState}` };
        }
        default:
          return { satisfied: false, detail: `unknown condition kind "${kind}"` };
      }
    };

    if (kind === 'dom_stable') {
      // Poll until two consecutive observations are identical (or timeout)
      let lastLength = doc.documentElement?.outerHTML.length || 0;
      let stable = false;
      let polls = 0;
      while (Date.now() - start < timeoutMs) {
        await new Promise((r) => setTimeout(r, pollIntervalMs));
        const length = doc.documentElement?.outerHTML.length || 0;
        polls++;
        if (length === lastLength) {
          stable = true;
          break;
        }
        lastLength = length;
      }
      const waitedMs = Date.now() - start;
      if (stable) this.session.timeline.record('WAIT_SATISFIED', `dom_stable after ${waitedMs}ms (${polls} polls)`);
      return this.success(id, command, { satisfied: stable, condition: kind, waitedMs, timeoutMs, detail: `dom length ${lastLength}, ${polls} polls` }, startTime);
    }

    let outcome = check();
    while (!outcome.satisfied && Date.now() - start < timeoutMs) {
      await new Promise((r) => setTimeout(r, pollIntervalMs));
      outcome = check();
    }
    const waitedMs = Date.now() - start;
    if (outcome.satisfied) this.session.timeline.record('WAIT_SATISFIED', `${kind} after ${waitedMs}ms`);
    return this.success(id, command, { satisfied: outcome.satisfied, condition: kind as any, waitedMs, timeoutMs, detail: outcome.detail }, startTime);
  }

  private simulationCloseTab(payload: any, doc: Document, id: string, command: any, startTime: number): BrowserCommandResponse {
    const tabId = Number(payload?.tabId);
    const idx = Number.isFinite(tabId)
      ? this.simulationTabs.findIndex((t) => t.browserTabId === tabId)
      : this.simulationTabs.findIndex((t) => t.active);
    if (idx < 0) {
      return this.error(id, command, 'TAB_NOT_FOUND', `No simulated tab matches tabId=${tabId}`, startTime);
    }
    const closed = this.simulationTabs.splice(idx, 1)[0];
    this.session.closeTab(closed.sessionTabId);
    if (closed.active && this.simulationTabs.length) {
      this.simulationTabs[0].active = true;
      this.session.switchTab(this.simulationTabs[0].sessionTabId);
    }
    return this.success(
      id,
      command,
      { closed: true, closedTab: { id: closed.browserTabId, url: closed.url, title: closed.title }, simulated: true, remaining: this.simulationTabs.length },
      startTime
    );
  }

  private handleSimulationBackgroundCommand(
    id: string,
    command: any,
    payload: any,
    doc: Document,
    startTime: number
  ): BrowserCommandResponse {
    const ensureInitialTab = () => {
      if (!this.simulationTabs.length) {
        this.simulationTabCounter++;
        const tab: SimulationTab = {
          sessionTabId: `stab_${this.simulationTabCounter}`,
          browserTabId: this.simulationTabCounter,
          url: doc.defaultView?.location?.href || 'about:blank',
          title: doc.title || 'Simulated Tab',
          active: true,
          createdAt: Date.now(),
        };
        this.simulationTabs.push(tab);
        this.session.registerTab(tab.browserTabId, tab.url, tab.title);
        this.session.switchTab(tab.sessionTabId);
      }
    };

    switch (command) {
      case 'LIST_TABS': {
        ensureInitialTab();
        return this.success(
          id,
          command,
          {
            simulated: true,
            environment: 'node-simulation',
            tabs: this.simulationTabs.map((t, i) => ({
              id: t.browserTabId,
              index: i,
              windowId: 1,
              title: t.title,
              url: t.url,
              active: t.active,
              status: 'complete',
              pinned: false,
              audited: false,
            })),
            note: 'Deterministic simulated tab state — a real browser tab list requires the Chrome extension connection.',
          },
          startTime
        );
      }
      case 'OPEN_TAB': {
        const url = String(payload?.url || 'about:blank');
        this.simulationTabCounter++;
        const tab: SimulationTab = {
          sessionTabId: `stab_${this.simulationTabCounter}`,
          browserTabId: this.simulationTabCounter,
          url,
          title: payload?.title || `Simulated Tab ${this.simulationTabCounter}`,
          active: true,
          createdAt: Date.now(),
        };
        this.simulationTabs.forEach((t) => (t.active = false));
        this.simulationTabs.push(tab);
        const registered = this.session.registerTab(tab.browserTabId, url, tab.title);
        this.session.switchTab(registered.sessionTabId);
        this.session.timeline.record('TAB_OPENED', `simulation tab ${tab.browserTabId} → ${url}`);
        return this.success(id, command, { opened: true, tabId: tab.browserTabId, url, simulated: true, totalTabs: this.simulationTabs.length }, startTime);
      }
      case 'FOCUS_TAB': {
        ensureInitialTab();
        const tabId = Number(payload?.tabId);
        const tab = this.simulationTabs.find((t) => t.browserTabId === tabId) || this.simulationTabs[0];
        if (!tab) {
          return this.error(id, command, 'TAB_NOT_FOUND', `No simulated tab with tabId=${tabId}`, startTime);
        }
        this.simulationTabs.forEach((t) => (t.active = false));
        tab.active = true;
        this.session.switchTab(tab.sessionTabId);
        this.session.timeline.record('TAB_SWITCHED', `simulation tab ${tab.browserTabId} focused`);
        return this.success(id, command, { focused: true, tabId: tab.browserTabId, url: tab.url, simulated: true }, startTime);
      }
      case 'LIST_EXTENSIONS': {
        return this.success(
          id,
          command,
          {
            simulated: true,
            extensions: this.simulationExtensions.map((e) => ({ ...e, permissions: ['activeTab', 'scripting', 'storage', 'tabs', 'management'] })),
            note: 'Deterministic simulated extension state.',
          },
          startTime
        );
      }
      case 'SET_EXTENSION_ENABLED': {
        const extensionId = String(payload?.extensionId || '');
        const ext = this.simulationExtensions.find((e) => e.id === extensionId || e.name.toLowerCase().includes(extensionId.toLowerCase()));
        if (!ext) {
          return this.error(id, command, 'EXTENSION_NOT_FOUND', `No simulated extension matches "${extensionId}". Known: ${this.simulationExtensions.map((e) => e.id).join(', ')}`, startTime);
        }
        ext.enabled = Boolean(payload?.enabled);
        this.session.timeline.record('EXTENSION_STATE_CHANGED', `${ext.id} → ${ext.enabled ? 'enabled' : 'disabled'}`);
        return this.success(id, command, { extensionId: ext.id, enabled: ext.enabled, simulated: true }, startTime);
      }
      case 'TOGGLE_EXTENSION': {
        const extensionId = String(payload?.extensionId || '');
        const ext = this.simulationExtensions.find((e) => e.id === extensionId || e.name.toLowerCase().includes(extensionId.toLowerCase()));
        if (!ext) {
          return this.error(id, command, 'EXTENSION_NOT_FOUND', `No simulated extension matches "${extensionId}".`, startTime);
        }
        ext.enabled = !ext.enabled;
        this.session.timeline.record('EXTENSION_STATE_CHANGED', `${ext.id} → ${ext.enabled ? 'enabled' : 'disabled'}`);
        return this.success(id, command, { extensionId: ext.id, enabled: ext.enabled, simulated: true }, startTime);
      }
      case 'RELOAD_EXTENSION': {
        const extensionId = String(payload?.extensionId || this.simulationExtensions[0].id);
        const ext = this.simulationExtensions.find((e) => e.id === extensionId || e.name.toLowerCase().includes(extensionId.toLowerCase()));
        if (!ext) {
          return this.error(id, command, 'EXTENSION_NOT_FOUND', `No simulated extension matches "${extensionId}".`, startTime);
        }
        return this.success(id, command, { reloaded: true, extensionId: ext.id, simulated: true, note: 'Simulated reload: extension state preserved.' }, startTime);
      }
      default:
        return this.error(id, command, 'UNKNOWN_COMMAND', `Unhandled simulation command '${command}'`, startTime);
    }
  }

  private async handleScreenshotCapture(
    command: 'LIVE_PAGE_SCREENSHOT' | 'LIVE_ELEMENT_SCREENSHOT',
    payload: any,
    doc: Document
  ): Promise<LiveScreenshotResult> {
    const win = doc.defaultView || (typeof window !== 'undefined' ? window : ({} as any));
    const timestamp = Date.now();
    const screenshotId = `scr_${timestamp}_${Math.random().toString(36).slice(2, 6)}`;
    const dpr = win.devicePixelRatio || 1;

    const viewport = {
      width: win.innerWidth || doc.documentElement?.clientWidth || 1920,
      height: win.innerHeight || doc.documentElement?.clientHeight || 1080,
      scrollX: win.scrollX || win.pageXOffset || 0,
      scrollY: win.scrollY || win.pageYOffset || 0,
      devicePixelRatio: dpr,
    };

    let targetSelector: string | undefined = undefined;
    let targetNodeId: number | undefined = undefined;
    let targetBounds: { x: number; y: number; width: number; height: number } | undefined = undefined;
    let captureDimensions = { width: viewport.width, height: viewport.height };

    if (command === 'LIVE_ELEMENT_SCREENSHOT') {
      const target = this.resolveTarget(payload, doc);
      const info = LiveDOMInspector.inspectElement(target, this.nodeRegistry);
      targetSelector = info.bestSelector;
      targetNodeId = info.forensics?.logicalNodeId || undefined;
      targetBounds = {
        x: info.bounds.x,
        y: info.bounds.y,
        width: info.bounds.width,
        height: info.bounds.height,
      };
      captureDimensions = {
        width: Math.max(1, Math.round(info.bounds.width * dpr)),
        height: Math.max(1, Math.round(info.bounds.height * dpr)),
      };
    }

    // Capture screenshot dataUrl:
    // When running inside extension with chrome.tabs API or when payload contains pre-captured image
    let dataUrl = payload?.dataUrl || '';

    // If running in live browser with element bounds, crop the full page capture to element dimensions
    if (command === 'LIVE_ELEMENT_SCREENSHOT' && dataUrl && targetBounds && typeof Image !== 'undefined') {
      try {
        const cropped = await new Promise<string>((resolve) => {
          const img = new Image();
          img.onload = () => {
            try {
              const cropCanvas = doc.createElement('canvas');
              const sx = Math.max(0, Math.floor(targetBounds!.x * dpr));
              const sy = Math.max(0, Math.floor(targetBounds!.y * dpr));
              const sw = Math.max(1, Math.floor(targetBounds!.width * dpr));
              const sh = Math.max(1, Math.floor(targetBounds!.height * dpr));

              cropCanvas.width = sw;
              cropCanvas.height = sh;
              const ctx = cropCanvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
                resolve(cropCanvas.toDataURL('image/png'));
                return;
              }
            } catch {
              // Fallback to uncropped if canvas context fails
            }
            resolve(dataUrl);
          };
          img.onerror = () => resolve(dataUrl);
          img.src = dataUrl;
        });
        if (cropped) {
          dataUrl = cropped;
        }
      } catch {
        // Fallback
      }
    }

    // If no dataUrl provided, generate valid viewable PNG dataURL via PNGBuilder
    if (!dataUrl) {
      const width = command === 'LIVE_ELEMENT_SCREENSHOT' ? Math.max(120, captureDimensions.width || 320) : Math.max(800, viewport.width || 1280);
      const height = command === 'LIVE_ELEMENT_SCREENSHOT' ? Math.max(60, captureDimensions.height || 180) : Math.max(600, viewport.height || 800);
      dataUrl = PNGBuilder.createDataUrl({
        width,
        height,
        backgroundColor: command === 'LIVE_ELEMENT_SCREENSHOT' ? [30, 41, 59, 255] : [15, 23, 42, 255],
        headerColor: [56, 189, 248, 255],
        borderColor: [99, 102, 241, 255],
        label: targetSelector || (command === 'LIVE_ELEMENT_SCREENSHOT' ? 'Element Screenshot' : 'Page Screenshot'),
      });
    }

    return {
      screenshotId,
      timestamp,
      url: win.location?.href || doc.location?.href || '',
      viewport,
      targetSelector,
      targetNodeId,
      targetBounds,
      dataUrl,
      imageFormat: 'png',
      dimensions: captureDimensions,
      captureType: command === 'LIVE_ELEMENT_SCREENSHOT' ? 'ELEMENT' : 'FULL_PAGE',
    };
  }

  private success<T>(id: string, command: any, data: T, startTime: number): BrowserCommandResponse<T> {
    return {
      id,
      command,
      success: true,
      data,
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    };
  }

  private error(
    id: string,
    command: any,
    code: string,
    message: string,
    startTime: number,
    details?: any
  ): BrowserCommandResponse {
    return {
      id,
      command,
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
      durationMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// Module-level inspection helpers (ancestry / relationships / accessibility)
// ============================================================================

function buildAncestry(element: Element, doc: Document): any {
  const ancestors: any[] = [];
  let cur: Element | null = element.parentElement;
  let distance = 1;
  while (cur && distance <= 10) {
    const parent: Element | null = cur.parentElement;
    const sameTag = parent ? Array.from(parent.children).filter((c) => c.tagName === cur!.tagName) : [];
    ancestors.push({
      tag: cur.tagName.toLowerCase(),
      selector: quickSelector(cur),
      role: cur.getAttribute('role') || undefined,
      text: directTextOf(cur).slice(0, 40),
      childIndex: sameTag.length ? sameTag.indexOf(cur) + 1 : 1,
      siblingCount: parent ? Array.from(parent.children).length : 0,
      distance,
    });
    cur = cur.parentElement;
    distance++;
  }

  const parentForSiblings = element.parentElement;
  const siblings: any[] = [];
  if (parentForSiblings) {
    const all = Array.from(parentForSiblings.children);
    const myIndex = all.indexOf(element);
    for (let i = myIndex - 1; i >= 0 && i >= myIndex - 5; i--) {
      siblings.push({ tag: all[i].tagName.toLowerCase(), selector: quickSelector(all[i]), role: all[i].getAttribute('role') || undefined, text: directTextOf(all[i]).slice(0, 30), position: 'before', distance: myIndex - i });
    }
    for (let i = myIndex + 1; i < all.length && i <= myIndex + 5; i++) {
      siblings.push({ tag: all[i].tagName.toLowerCase(), selector: quickSelector(all[i]), role: all[i].getAttribute('role') || undefined, text: directTextOf(all[i]).slice(0, 30), position: 'after', distance: i - myIndex });
    }
  }

  let maxDepth = 0;
  const tags: string[] = [];
  const interactive: string[] = [];
  const walk = (el: Element, depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    for (const child of Array.from(el.children)) {
      tags.push(child.tagName.toLowerCase());
      if (child.matches('a[href], button, input, select, textarea, [role="button"], [onclick]')) {
        interactive.push(quickSelector(child));
      }
      if (depth < 6) walk(child, depth + 1);
    }
  };
  walk(element, 1);

  return {
    selector: quickSelector(element),
    ancestors,
    siblings,
    descendants: {
      count: element.querySelectorAll('*').length,
      maxDepth,
      tags: Array.from(new Set(tags)).slice(0, 30),
      interactive: interactive.slice(0, 30),
    },
  };
}

function buildRelationships(element: Element, doc: Document): any {
  const nodes: any[] = [
    { id: 'self', selector: quickSelector(element), tag: element.tagName.toLowerCase(), role: element.getAttribute('role') || undefined, label: directTextOf(element).slice(0, 30) || element.tagName.toLowerCase(), relationship: 'self', depth: 0 },
  ];
  const edges: any[] = [];

  let cur: Element | null = element.parentElement;
  let depth = 1;
  while (cur && depth <= 4) {
    const id = `ancestor_${depth}`;
    nodes.push({ id, selector: quickSelector(cur), tag: cur.tagName.toLowerCase(), role: cur.getAttribute('role') || undefined, label: directTextOf(cur).slice(0, 30) || cur.tagName.toLowerCase(), relationship: 'parent', depth });
    edges.push({ from: id, to: depth === 1 ? 'self' : `ancestor_${depth - 1}`, relation: 'parent-of' });
    cur = cur.parentElement;
    depth++;
  }

  for (const child of Array.from(element.children).slice(0, 12)) {
    const id = `child_${nodes.length}`;
    nodes.push({ id, selector: quickSelector(child), tag: child.tagName.toLowerCase(), role: child.getAttribute('role') || undefined, label: directTextOf(child).slice(0, 30) || child.tagName.toLowerCase(), relationship: 'child', depth: 1 });
    edges.push({ from: 'self', to: id, relation: 'contains' });
  }

  const parent = element.parentElement;
  if (parent) {
    for (const sib of Array.from(parent.children).slice(0, 12)) {
      if (sib === element) continue;
      const id = `sibling_${nodes.length}`;
      nodes.push({ id, selector: quickSelector(sib), tag: sib.tagName.toLowerCase(), role: sib.getAttribute('role') || undefined, label: directTextOf(sib).slice(0, 30) || sib.tagName.toLowerCase(), relationship: 'sibling', depth: 1 });
      edges.push({ from: 'self', to: id, relation: 'sibling-of' });
    }
  }

  return { rootSelector: quickSelector(element), nodes, edges };
}

function buildAccessibility(element: Element): any {
  const ariaAttrs: Record<string, string> = {};
  for (const attr of Array.from(element.attributes)) {
    if (attr.name.startsWith('aria-')) ariaAttrs[attr.name] = attr.value;
  }
  const ownText = directTextOf(element).trim();
  const ariaLabel = element.getAttribute('aria-label');
  const ariaLabelledBy = element.getAttribute('aria-labelledby');
  let labelledByText: string | undefined;
  if (ariaLabelledBy) {
    const refs = ariaLabelledBy.split(/\s+/).map((id) => element.ownerDocument?.getElementById(id)?.textContent?.trim()).filter(Boolean);
    labelledByText = refs.join(' ').slice(0, 60) || undefined;
  }
  const title = element.getAttribute('title');
  const tag = element.tagName.toLowerCase();

  const nameSources: string[] = [];
  let name = '';
  if (ariaLabel) { name = ariaLabel; nameSources.push('aria-label'); }
  else if (labelledByText) { name = labelledByText; nameSources.push('aria-labelledby'); }
  else if (ownText) { name = ownText.slice(0, 60); nameSources.push('text content'); }
  else if (title) { name = title; nameSources.push('title'); }

  const states: string[] = [];
  if ((element as HTMLButtonElement).disabled || element.hasAttribute('disabled')) states.push('disabled');
  if ((element as HTMLInputElement).checked) states.push('checked');
  const sel = element as HTMLSelectElement;
  if (sel.tagName === 'SELECT' && typeof sel.selectedOptions !== 'undefined' && sel.selectedOptions.length > 0) states.push('selected');
  if (element.getAttribute('aria-expanded')) states.push(`expanded=${element.getAttribute('aria-expanded')}`);
  if (element.getAttribute('aria-pressed')) states.push(`pressed=${element.getAttribute('aria-pressed')}`);
  if (element.getAttribute('aria-hidden') === 'true') states.push('hidden');
  if (element.hasAttribute('required')) states.push('required');
  if ((element as HTMLInputElement).readOnly) states.push('readonly');

  const focusable = ['a[href]', 'button', 'input', 'select', 'textarea', '[tabindex]'].some((s) => {
    try { return element.matches(s); } catch { return false; }
  });

  const issues: string[] = [];
  if (!name && focusable) issues.push('Focusable element has no accessible name.');
  if (tag === 'img' && !element.hasAttribute('alt')) issues.push('Image has no alt attribute.');
  const headingMatch = /^h([1-6])$/.exec(tag);
  if (headingMatch && !ownText) issues.push(`Heading h${headingMatch[1]} is empty.`);

  return {
    selector: quickSelector(element),
    role: element.getAttribute('role') || undefined,
    implicitRole: implicitA11yRole(element),
    name,
    nameSources,
    description: element.getAttribute('aria-describedby') || undefined,
    value: (element as HTMLInputElement).value !== undefined && (element.getAttribute('type') || 'text') !== 'password' ? String((element as HTMLInputElement).value).slice(0, 40) : undefined,
    states,
    level: headingMatch ? parseInt(headingMatch[1], 10) : undefined,
    focusable,
    tabIndex: (element as HTMLElement).tabIndex,
    ariaAttributes: ariaAttrs,
    issues,
  };
}

function implicitA11yRole(element: Element): string | undefined {
  const tag = element.tagName.toLowerCase();
  switch (tag) {
    case 'a': return element.getAttribute('href') ? 'link' : undefined;
    case 'button': return 'button';
    case 'nav': return 'navigation';
    case 'header': return 'banner';
    case 'footer': return 'contentinfo';
    case 'main': return 'main';
    case 'aside': return 'complementary';
    case 'article': return 'article';
    case 'form': return 'form';
    case 'input': {
      const type = element.getAttribute('type') || 'text';
      const map: Record<string, string> = { checkbox: 'checkbox', radio: 'radio', button: 'button', submit: 'button', reset: 'button', range: 'slider', search: 'searchbox', email: 'textbox', text: 'textbox', password: 'textbox', tel: 'textbox', url: 'textbox', number: 'spinbutton' };
      return map[type] || 'textbox';
    }
    case 'select': return element.hasAttribute('multiple') ? 'listbox' : 'combobox';
    case 'textarea': return 'textbox';
    case 'img': return 'img';
    case 'table': return 'table';
    case 'ul': case 'ol': return 'list';
    case 'li': return 'listitem';
    case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': return 'heading';
    case 'dialog': return 'dialog';
    default: return undefined;
  }
}

function quickSelector(el: Element): string {
  const id = el.getAttribute('id');
  if (id && /^[a-zA-Z][\w-]*$/.test(id)) return `#${id}`;
  const testid = el.getAttribute('data-testid');
  if (testid) return `${el.tagName.toLowerCase()}[data-testid="${testid}"]`;
  const tag = el.tagName.toLowerCase();
  const classes = Array.from(el.classList || []).slice(0, 2);
  if (classes.length) return `${tag}.${classes.join('.')}`;
  return tag;
}

function directTextOf(el: Element): string {
  return Array.from(el.childNodes)
    .filter((n) => n.nodeType === 3)
    .map((n) => (n.textContent || '').trim())
    .join(' ')
    .replace(/\s+/g, ' ');
}

function defaultSizesInternal(): Array<{ label: string; width: number; height: number }> {
  return [
    { label: 'desktop-1440x900', width: 1440, height: 900 },
    { label: 'laptop-1024x768', width: 1024, height: 768 },
    { label: 'tablet-768x1024', width: 768, height: 1024 },
    { label: 'mobile-375x667', width: 375, height: 667 },
  ];
}
