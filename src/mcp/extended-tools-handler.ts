import fs from 'fs';
import path from 'path';
import { LiveBrowserController } from '../core/live-browser-controller';
import { BrowserCommandType } from '../types/browser-control';
import { MCPToolCallResult } from '../types/mcp-types';
import { ProjectManager } from '../projects/project-manager';
import { AgentPackageExporter } from '../projects/agent-package-exporter';
import { CommandRecordingStorage } from '../storage/recording-storage';
import { CommandRecorder, CommandSequenceEngine } from '../core/command-recorder';
import { RedactionEngine } from '../core/redaction-engine';
import { buildToolCatalog, TOOL_GROUPS } from './tool-groups';
import { V3_TOOL_NAMES } from './v3-tool-names';
import { DOMFingerprintEngine } from '../core/dom-fingerprint';
import { RegionQualityScorer } from '../projects/region-capture';

export interface BrowserBridgeClient {
  sendCommand(command: BrowserCommandType, payload?: any): Promise<any>;
}

/**
 * MCPDOM v3 Extended Tools Handler
 *
 * Handles the 74 platform-evolution tools: targeting, interaction upgrades,
 * viewport control, JS execution, DOM mutation, command sequences/recording,
 * page states, projects/knowledge, redaction and discovery.
 *
 * Dispatch follows the SAME bridge-first / local-simulation-fallback pattern
 * as LiveToolsHandler (preserving the established architecture).
 * Node-side capabilities (projects, recordings) execute here directly.
 */
export class ExtendedToolsHandler {
  private localController: LiveBrowserController;
  private bridgeClient?: BrowserBridgeClient;
  private projectManager: ProjectManager;
  private exporter: AgentPackageExporter;
  private recordings: CommandRecordingStorage;
  public readonly commandRecorder = new CommandRecorder();
  private sequenceEngine = new CommandSequenceEngine();
  private redaction = new RedactionEngine();
  private fingerprintEngine = new DOMFingerprintEngine();
  private qualityScorer = new RegionQualityScorer();
  /** Set by the MCP server: routes sequence execution through the authoritative tool pipeline. */
  private toolsPipeline?: { handleToolCall(name: string, args: Record<string, any>): Promise<any> };

  constructor(localController?: LiveBrowserController, bridgeClient?: BrowserBridgeClient, projectsBaseDir?: string) {
    this.localController = localController || new LiveBrowserController();
    this.bridgeClient = bridgeClient;
    this.projectManager = new ProjectManager(projectsBaseDir || '.mcpdom_projects');
    this.exporter = new AgentPackageExporter(this.projectManager);
    this.recordings = new CommandRecordingStorage();
  }

  public setToolsPipeline(pipeline: { handleToolCall(name: string, args: Record<string, any>): Promise<any> }): void {
    this.toolsPipeline = pipeline;
  }

  public setBridgeClient(client: BrowserBridgeClient): void {
    this.bridgeClient = client;
  }

  public getLocalController(): LiveBrowserController {
    return this.localController;
  }

  public getProjectManager(): ProjectManager {
    return this.projectManager;
  }

  public knows(toolName: string): boolean {
    return V3_TOOL_NAMES.has(toolName);
  }

  public async handleToolCall(name: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    const start = Date.now();
    try {
      const result = await this.route(name, args || {});
      const durationMs = Date.now() - start;
      // Command recording hook (§23)
      if (this.commandRecorder.isRecording() && name !== 'record_commands_stop') {
        this.commandRecorder.recordCommand(name, args, 'SUCCESS', summarize(result));
      }
      this.localController.session.recordCommand(name, args, 'SUCCESS', durationMs);
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - start;
      if (this.commandRecorder.isRecording() && name !== 'record_commands_stop') {
        this.commandRecorder.recordCommand(name, args, 'FAILED', err.message);
      }
      this.localController.session.recordCommand(name, args, 'FAILED', durationMs, err.message);
      this.localController.session.timeline.record('ERROR_OCCURRED', `${name}: ${err.message}`);
      return {
        isError: true,
        content: [{ type: 'text', text: `Extended tool error in '${name}': ${err.message}` }],
      };
    }
  }

  private async route(name: string, args: Record<string, any>): Promise<MCPToolCallResult> {
    switch (name) {
      // --- Targeting & forensics ---
      case 'generate_element_target':
        return this.wrap(await this.dispatch('GENERATE_ELEMENT_TARGET', { target: args.target, selector: args.selector }));
      case 'recover_selector':
        return this.wrap(await this.dispatch('RECOVER_SELECTOR', args));
      case 'diagnose_selector_failure': {
        const doc = this.document();
        const { SelectorRecoveryEngine } = await import('../core/selector-recovery');
        const engine = new SelectorRecoveryEngine(doc);
        return this.wrap(engine.diagnose(args.selector || ''));
      }
      case 'get_element_ancestry':
        return this.wrap(await this.dispatch('GET_ELEMENT_ANCESTRY', this.target(args)));
      case 'get_element_fingerprint':
        return this.wrap(await this.dispatch('GET_ELEMENT_FINGERPRINT', this.target(args)));
      case 'get_element_relationships':
        return this.wrap(await this.dispatch('GET_ELEMENT_RELATIONSHIPS', this.target(args)));
      case 'get_element_accessibility':
        return this.wrap(await this.dispatch('GET_ELEMENT_ACCESSIBILITY', this.target(args)));
      case 'get_computed_style':
        return this.wrap(await this.dispatch('GET_COMPUTED_STYLE', { ...this.target(args), properties: args.properties }));
      case 'search_dom':
        return this.wrap(await this.dispatch('ANALYZE_DOM', { ...args, analyzer: 'search_dom' }));
      case 'analyze_dom':
        return this.wrap(await this.dispatch('ANALYZE_DOM', args));
      case 'get_page_blueprint': {
        const doc = this.document();
        if (args.projectName) {
          return this.wrap(this.projectManager.generateBlueprint(args.projectName, doc));
        }
        const { PageBlueprintGenerator } = await import('../projects/reconstruction-spec');
        return this.wrap(new PageBlueprintGenerator().generate(doc, 'live', []));
      }

      // --- Interaction ---
      case 'click_element': {
        const mode = args.mode || 'normal';
        const action = mode === 'double' ? 'double_click' : mode === 'right' ? 'right_click' : 'click';
        return this.wrap(
          await this.dispatch('LIVE_ELEMENT_INTERACT', {
            action,
            target: this.targetOf(args),
            options: { waitForStabilization: args.waitForStabilization !== false },
          })
        );
      }
      case 'type_text': {
        const mode = args.mode || 'append';
        if (mode === 'clear') {
          return this.wrap(await this.dispatch('LIVE_ELEMENT_INTERACT', { action: 'clear', target: this.targetOf(args) }));
        }
        if (mode === 'replace') {
          await this.dispatch('LIVE_ELEMENT_INTERACT', { action: 'clear', target: this.targetOf(args) });
        }
        return this.wrap(
          await this.dispatch('LIVE_ELEMENT_INTERACT', {
            action: 'type',
            target: this.targetOf(args),
            text: args.text || '',
            options: { waitForStabilization: args.waitForStabilization },
          })
        );
      }
      case 'hover_element':
        return this.wrap(await this.dispatch('LIVE_ELEMENT_INTERACT', { action: 'hover', target: this.targetOf(args) }));
      case 'focus_element':
        return this.wrap(await this.dispatch('LIVE_ELEMENT_INTERACT', { action: 'focus', target: this.targetOf(args) }));
      case 'blur_element':
        return this.wrap(await this.dispatch('LIVE_ELEMENT_INTERACT', { action: 'blur', target: this.targetOf(args) }));
      case 'select_option':
        return this.wrap(
          await this.dispatch('LIVE_ELEMENT_INTERACT', { action: 'select_option', target: this.targetOf(args), optionValue: args.value })
        );
      case 'press_keyboard_shortcut':
        return this.wrap(
          await this.dispatch('PRESS_KEYBOARD_SHORTCUT', { keys: args.keyList || args.keys, target: args.target })
        );
      case 'scroll_to_element':
        return this.wrap(await this.dispatch('SCROLL_PAGE', { ...this.target(args), behavior: args.behavior }));
      case 'scroll_page':
        return this.wrap(await this.dispatch('SCROLL_PAGE', { x: args.x, y: args.y }));
      case 'drag_and_drop':
        return this.wrap(await this.dispatch('DRAG_ELEMENT', { source: args.source, target: args.target, offsets: args.offsets }));
      case 'set_input_checked':
        return this.wrap(await this.dispatch('SET_INPUT_CHECKED', { ...this.target(args), checked: args.checked }));
      case 'wait_for_condition':
        return this.wrap(await this.dispatch('WAIT_FOR_CONDITION', args));
      case 'wait_for_dom_stable':
        return this.wrap(await this.dispatch('WAIT_FOR_CONDITION', { kind: 'dom_stable', timeoutMs: args.timeoutMs }));
      case 'set_interaction_profile': {
        const profile = this.localController.humanInteraction.setActiveProfile(args.profile, args.custom);
        if (typeof args.seed === 'number') this.localController.humanInteraction.setSeed(args.seed);
        return this.wrap({ activeProfile: profile.name, profile, note: 'Subsequent interactions use this timing profile. DETERMINISTIC = zero delay (legacy behavior).' });
      }
      case 'get_interaction_profile':
        return this.wrap(this.localController.humanInteraction.report());
      case 'preview_command':
      case 'preview_dom_mutation':
        return this.wrap(await this.dispatch('PREVIEW_DOM_MUTATION', this.mutationPayload(args)));

      // --- Viewport ---
      case 'resize_viewport':
        return this.wrap(await this.dispatch('RESIZE_VIEWPORT', args));
      case 'reset_viewport':
        return this.wrap(await this.dispatch('RESET_VIEWPORT', {}));
      case 'get_viewport_state':
        return this.wrap(await this.dispatch('GET_VIEWPORT_STATE', {}));
      case 'run_responsive_test':
        return this.wrap(await this.dispatch('RUN_RESPONSIVE_TEST', args));
      case 'emulate_device':
        return this.wrap(await this.dispatch('EMULATE_DEVICE', args));

      // --- JavaScript ---
      case 'execute_javascript':
        return this.wrap(await this.dispatch('EXECUTE_JS', args));
      case 'execute_js_and_capture_changes': {
        const before = await this.dispatch('CAPTURE_PAGE_STATE', {});
        const exec = await this.dispatch('EXECUTE_JS', args);
        const after = await this.dispatch('CAPTURE_PAGE_STATE', {});
        const comparison = this.localController.session.compareSnapshots(before, after);
        return this.wrap({ execution: exec, before, after, comparison });
      }

      // --- DOM mutation ---
      case 'mutate_dom':
        return this.wrap(await this.dispatch('DOM_MUTATE', this.mutationPayload(args)));
      case 'clone_dom_subtree':
        return this.wrap(
          await this.dispatch('DOM_MUTATE', {
            operation: 'clone_subtree',
            target: args.target,
            parent: args.parent,
            copyAttributes: args.copyAttributes,
          })
        );
      case 'mutate_dom_transaction':
        return this.wrap(await this.dispatch('DOM_MUTATE_TRANSACTION', args));
      case 'undo_dom_mutation':
        return this.wrap(await this.dispatch('UNDO_DOM_MUTATION', {}));
      case 'redo_dom_mutation':
        return this.wrap(await this.dispatch('REDO_DOM_MUTATION', {}));
      case 'get_mutation_history':
        return this.wrap(await this.dispatch('GET_MUTATION_HISTORY', args));

      // --- Command sequences & recording ---
      case 'execute_command_sequence': {
        const executor = this.executorForSequence();
        const result = await this.sequenceEngine.execute(args.steps || [], executor, { stopOnError: args.stopOnError });
        return this.wrap(result);
      }
      case 'record_commands_start': {
        const rec = this.commandRecorder.start(args.name, args.description, args.tags || []);
        return this.wrap({ recordingId: rec.recordingId, name: rec.name, active: true, note: 'All subsequent tool calls (in this server process) are recorded until record_commands_stop.' });
      }
      case 'record_commands_stop': {
        const finished = this.commandRecorder.stop();
        if (!finished) {
          return this.wrap({ stopped: false, message: 'No recording was active.' });
        }
        const file = this.recordings.save(finished);
        return this.wrap({ stopped: true, recording: finished, savedTo: file });
      }
      case 'list_command_recordings':
        return this.wrap(this.recordings.list());
      case 'get_command_recording': {
        const rec = this.recordings.load(args.recordingId);
        if (!rec) return this.err(`RECORDING_NOT_FOUND: no recording "${args.recordingId}"`);
        return this.wrap(rec);
      }
      case 'replay_command_recording': {
        const rec = this.recordings.load(args.recordingId);
        if (!rec) return this.err(`RECORDING_NOT_FOUND: no recording "${args.recordingId}"`);
        const executor = this.executorForSequence();
        const steps = rec.commands.map((c) => ({ commandId: c.commandId, tool: c.tool, args: c.args }));
        const result = await this.sequenceEngine.execute(steps, executor, { stopOnError: args.stopOnError !== false });
        return this.wrap({ replayed: rec.recordingId, ...result });
      }
      case 'export_command_recording': {
        const rec = this.recordings.load(args.recordingId);
        if (!rec) return this.err(`RECORDING_NOT_FOUND: no recording "${args.recordingId}"`);
        const json = JSON.stringify({ schemaVersion: '1.0.0', exportedAt: Date.now(), recording: rec }, null, 2);
        let saveInfo: any = undefined;
        if (args.outputPath) saveInfo = this.saveToFile(args.outputPath, json);
        return this.wrap({ recordingId: rec.recordingId, json: json.length > 50000 ? json.slice(0, 50000) + '…[truncated]' : json, savedTo: saveInfo?.outputPath });
      }
      case 'import_command_recording': {
        const rec = this.recordings.importFromJson(args.recordingJson);
        return this.wrap({ imported: true, recordingId: rec.recordingId, name: rec.name, commandCount: rec.commandCount });
      }
      case 'delete_command_recording': {
        const deleted = this.recordings.delete(args.recordingId);
        return this.wrap({ deleted, recordingId: args.recordingId });
      }

      // --- Session, timeline, page states ---
      case 'get_browser_session': {
        const doc = this.document();
        const controller = this.localController;
        // Get live viewport
        let viewportState: any = { width: 0, height: 0, isModified: false };
        try {
          const vs = await this.dispatch('GET_VIEWPORT_STATE', {});
          viewportState = { width: vs.width, height: vs.height, isModified: vs.isModified };
        } catch { /* keep defaults */ }
        const summary = controller.session.summary(doc, viewportState, true, []);
        return this.wrap({ ...summary, note: "Session model reflects this server process's live + simulation state." });
      }
      case 'get_action_timeline':
        return this.wrap(this.localController.session.timeline.query(args));
      case 'get_operation_trace': {
        if (args.operationId) {
          const trace = this.localController.session.operations.trace(args.operationId);
          if (!trace) return this.err(`OPERATION_NOT_FOUND: ${args.operationId}`);
          return this.wrap(trace);
        }
        return this.wrap(this.localController.session.operations.recent(args.limit || 20));
      }
      case 'capture_page_state':
        return this.wrap(await this.dispatch('CAPTURE_PAGE_STATE', {}));
      case 'list_page_states':
        return this.wrap(this.localController.session.listSnapshots());
      case 'compare_page_states': {
        let snaps = this.localController.session.listSnapshots();
        while (snaps.length < 2) {
          await this.localController.handleCommand({
            id: 'snap_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            command: 'CAPTURE_PAGE_STATE',
            timestamp: Date.now(),
            payload: {},
          }, this.document());
          snaps = this.localController.session.listSnapshots();
        }
        const idA = args.snapshotIdA || snaps[snaps.length - 2]?.snapshotId;
        const idB = args.snapshotIdB || snaps[snaps.length - 1]?.snapshotId;
        const a = this.localController.session.getSnapshot(idA);
        const b = this.localController.session.getSnapshot(idB);
        if (!a || !b) return this.err('SNAPSHOT_NOT_FOUND: one of the ids does not resolve.');
        return this.wrap({ snapshotIdA: idA, snapshotIdB: idB, ...this.localController.session.compareSnapshots(a, b) });
      }

      // --- Projects & knowledge ---
      case 'create_page_project': {
        const doc = this.document();
        const win = doc.defaultView;
        const manifest = this.projectManager.createProject({
          name: args.name,
          description: args.description,
          url: args.url || win?.location?.href || 'about:blank',
          title: args.title || doc.title || 'Untitled page',
          viewport: {
            width: win?.innerWidth || 1280,
            height: win?.innerHeight || 800,
            devicePixelRatio: (win as any)?.devicePixelRatio || 1,
          },
          domHtml: this.cleanDom(doc),
          extensionEnabled: true,
          readyState: doc.readyState,
        });
        this.localController.session.bindProject(manifest.projectId);
        this.localController.session.timeline.record('PROJECT_CREATED', `project ${manifest.name} (${manifest.projectId})`);
        return this.wrap(manifest);
      }
      case 'list_projects':
        return this.wrap(this.projectManager.listProjects().map((p) => ({
          name: p.name,
          projectId: p.projectId,
          description: p.description,
          regionCount: p.regionCount,
          pageCount: p.pageCount,
          commandRecordingCount: p.commandRecordingCount,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          tags: p.tags,
        })));
      case 'get_project': {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        return this.wrap(project);
      }
      case 'delete_project':
        return this.wrap({ deleted: this.projectManager.deleteProject(args.projectName), projectName: args.projectName });
      case 'capture_page_region':
      case 'annotate_element': {
        const capture = await this.dispatch('CAPTURE_REGION', { target: args.target, selector: args.selector });
        let screenshotDataUrl: string | undefined;
        if (args.screenshot) {
          try {
            const shot = await this.dispatch('LIVE_ELEMENT_SCREENSHOT', { target: args.target, selector: args.selector });
            screenshotDataUrl = shot?.dataUrl;
          } catch { /* screenshot optional */ }
        }
        const doc = this.document();
        const annotation = this.projectManager.captureRegion(
          args.projectName,
          capture,
          {
            name: args.name,
            description: args.description,
            comment: args.comment,
            tags: args.tags || [],
            behavioralNotes: args.behavioralNotes,
            visualNotes: args.visualNotes,
          },
          {
            tag: capture.bestSelector ? args.selector || capture.bestSelector : String(args.selector || ''),
            role: undefined,
            ownText: capture.nameHint?.name || '',
            fingerprintVolatility: capture.fingerprintVolatility || 'medium',
            volatilityReasons: capture.volatilityReasons || [],
            sourceUrl: doc.defaultView?.location?.href || '',
            pageTitle: doc.title || '',
            extensionEnabled: true,
            screenshotDataUrl,
            capturedBy: 'tool_call',
          },
          args.intendedChange,
          args.verification
        );
        // re-derive tag/role from the capture data for accuracy
        (annotation.observed as any).tag = capture.childTags?.length ? inferTagFromSelector(capture.bestSelector) : annotation.observed.tag;
        this.localController.session.timeline.record('REGION_CAPTURED', `region ${annotation.observed.name} (${annotation.observed.regionId})`);
        return this.wrap(annotation);
      }
      case 'list_region_annotations': {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        return this.wrap(
          project.regions.map((r) => ({
            regionId: r.observed.regionId,
            name: r.observed.name,
            autoName: r.observed.autoName,
            tag: r.observed.tag,
            role: r.observed.role,
            selector: r.observed.selector,
            quality: r.analysis.qualityScore ? { grade: r.analysis.qualityScore.grade, overall: r.analysis.qualityScore.overall } : null,
            intendedChange: r.intendedChange?.statement || null,
            capturedAt: r.observed.capturedAt,
          }))
        );
      }
      case 'get_region_annotation': {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        // 'latest' (or omission) resolves the most recently captured region.
        const regionId = (!args.regionId || args.regionId === 'latest')
          ? project.regions[project.regions.length - 1]?.observed.regionId
          : args.regionId;
        const region = project.regions.find((r) => r.observed.regionId === regionId);
        if (!region) return this.err(`REGION_NOT_FOUND: "${args.regionId}"`);
        return this.wrap(region);
      }
      case 'update_region_annotation': {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        const regionId = (!args.regionId || args.regionId === 'latest')
          ? project.regions[project.regions.length - 1]?.observed.regionId
          : args.regionId;
        const updated = this.projectManager.updateRegion(args.projectName, regionId, args);
        if (!updated) return this.err(`REGION_NOT_FOUND or PROJECT_NOT_FOUND`);
        return this.wrap(updated);
      }
      case 'delete_region_annotation': {
        const project = this.projectManager.getProject(args.projectName);
        if (!project) return this.err(`PROJECT_NOT_FOUND: "${args.projectName}"`);
        const regionId = (!args.regionId || args.regionId === 'latest')
          ? project.regions[project.regions.length - 1]?.observed.regionId
          : args.regionId;
        return this.wrap({ deleted: this.projectManager.deleteRegion(args.projectName, regionId) });
      }
      case 'get_region_relationship_graph': {
        const doc = this.document();
        return this.wrap(this.projectManager.buildRegionGraph(args.projectName, doc));
      }
      case 'generate_reconstruction_spec': {
        const domLength = this.document().documentElement?.outerHTML.length || 0;
        return this.wrap(this.projectManager.generateReconstructionSpec(args.projectName, domLength));
      }
      case 'export_agent_package': {
        const result = this.exporter.export(args.projectName, args.outputDir);
        this.localController.session.timeline.record('PACKAGE_EXPORTED', `${result.packageDir} (${result.files.length} files)`);
        return this.wrap({
          packageDir: result.packageDir,
          fileCount: result.files.length,
          files: result.files,
          summary: result.summary,
          note: 'Self-contained package: another agent can consume it without MCPDOM running.',
        });
      }
      case 'import_project': {
        const dir = path.resolve(args.projectDir);
        if (!fs.existsSync(path.join(dir, 'project.json'))) {
          return this.err(`INVALID_PROJECT_DIR: no project.json under ${dir}`);
        }
        const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'project.json'), 'utf-8'));
        const targetName = manifest.name || path.basename(dir);
        if (fs.existsSync(path.join('.mcpdom_projects', targetName))) {
          return this.err(`PROJECT_EXISTS: "${targetName}" already exists in working storage.`);
        }
        fs.cpSync(dir, path.join('.mcpdom_projects', targetName), { recursive: true });
        const imported = this.projectManager.getProject(targetName);
        return this.wrap({
          imported: true,
          name: targetName,
          regionCount: imported?.manifest.regionCount || 0,
          pageCount: imported?.manifest.pages?.length || 0,
        });
      }

      // --- Redaction ---
      case 'get_redaction_rules':
        return this.wrap(this.redaction.toJSON());
      case 'set_redaction_rules': {
        for (const ruleId of args.disable || []) this.redaction.setRuleEnabled(ruleId, false);
        for (const ruleId of args.enable || []) this.redaction.setRuleEnabled(ruleId, true);
        let addedRule: any = undefined;
        if (args.addRule?.pattern) {
          addedRule = this.redaction.addRule({
            kind: args.addRule.kind || 'value-pattern',
            pattern: args.addRule.pattern,
            description: args.addRule.description || 'user-defined rule',
            enabled: true,
          });
        }
        let addedExclusion: any = undefined;
        if (args.addExclusion?.selector) {
          addedExclusion = this.redaction.addExclusion(args.addExclusion.selector, args.addExclusion.reason || 'user-defined exclusion');
        }
        return this.wrap({ applied: true, addedRule, addedExclusion, currentRules: this.redaction.getRules().length, currentExclusions: this.redaction.getExclusions().length });
      }

      // --- Discovery ---
      case 'get_tool_catalog': {
        const catalog = buildToolCatalog();
        const filtered = args.group ? catalog.filter((c) => c.group === args.group) : catalog;
        return this.wrap({ total: filtered.length, catalog: filtered });
      }
      case 'get_tool_groups':
        return this.wrap(TOOL_GROUPS);

      default:
        return this.err(`Unknown extended tool: ${name}`);
    }
  }

  // ------------------------------------------------------------------
  // Internals
  // ------------------------------------------------------------------
  private executorForSequence() {
    return async (tool: string, args: Record<string, any> | undefined): Promise<{ success: boolean; result?: any; error?: string; summary: string }> => {
      // Sequence executor routes through the authoritative tool pipeline
      // (this server's MCPToolsHandler) — no duplicated logic.
      const pipeline = this.toolsPipeline || (globalThis as any).__MCPDOM_TOOLS_HANDLER__;
      if (pipeline?.handleToolCall) {
        const result = await pipeline.handleToolCall(tool, args || {});
        const isError = (result as any).isError === true;
        const text = (result as any).content?.[0]?.text || '';
        return {
          success: !isError,
          result: safeParse(text),
          error: isError ? text.slice(0, 300) : undefined,
          summary: isError ? `FAILED: ${text.slice(0, 120)}` : `OK: ${summarizeText(text)}`,
        };
      }
      return { success: false, error: 'NO_HANDLER', summary: 'Tool handler unavailable for sequence execution.' };
    };
  }

  private fallbackDoc?: Document;
  private document(): Document {
    if (typeof document !== 'undefined') return document;
    if (typeof window !== 'undefined' && window.document) return window.document;
    if (!this.fallbackDoc) {
      try {
        const { JSDOM } = require('jsdom');
        this.fallbackDoc = new JSDOM('<!DOCTYPE html><html><head><title>TeleDOM Simulation</title></head><body><div id="root"></div></body></html>').window.document;
      } catch {
        this.fallbackDoc = {
          title: 'TeleDOM Simulation',
          readyState: 'complete',
          documentElement: {
            outerHTML: '<html><head><title>TeleDOM Simulation</title></head><body><div id="root"></div></body></html>',
            cloneNode: () => ({ outerHTML: '<html><head><title>TeleDOM Simulation</title></head><body><div id="root"></div></body></html>' }),
          },
          defaultView: {
            location: { href: 'http://localhost:3847/simulation' },
            innerWidth: 1280,
            innerHeight: 800,
          },
          querySelector: () => null,
          querySelectorAll: () => [] as any,
          getElementById: () => null,
        } as unknown as Document;
      }
    }
    return this.fallbackDoc!;
  }

  private target(args: Record<string, any>): any {
    return args.target || (args.selector ? { selector: args.selector } : undefined);
  }

  private targetOf(args: Record<string, any>): any {
    return args.target || (args.selector ? { selector: args.selector } : undefined);
  }

  private mutationPayload(args: Record<string, any>): any {
    return {
      operation: args.operation,
      target: args.target || (args.selector ? { selector: args.selector } : undefined),
      attribute: args.attribute,
      value: args.value,
      text: args.text,
      replacement: args.replacement,
      classes: args.classes,
      style: args.style,
      html: args.html,
      newElementHtml: args.newElementHtml,
      parent: args.parent,
      position: args.position,
      copyAttributes: args.copyAttributes,
    };
  }

  private cleanDom(doc?: Document): string {
    if (!doc) return '<html><head></head><body></body></html>';
    // §68 clean capture — clone and strip MCPDOM + excluded nodes before persisting
    const clone = doc.documentElement.cloneNode(true) as Element;
    const redaction = new RedactionEngine();
    return redaction.redactValue(clone.outerHTML);
  }

  private async dispatch(command: BrowserCommandType, payload?: any): Promise<any> {
    if (this.bridgeClient) {
      try {
        return await this.bridgeClient.sendCommand(command, payload);
      } catch (bridgeErr: any) {
        const doc = this.document();
        const req = {
          id: `x_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          command,
          timestamp: Date.now(),
          payload,
        };
        const res = await this.localController.handleCommand(req, doc);
        if (res.success) {
          return res.data;
        }
        const localCode = res.error?.code || 'LOCAL_COMMAND_FAILED';
        const localMessage = res.error?.message || 'unknown local error';
        const combined = new Error(`${bridgeErr.message} | local fallback also failed: [${localCode}] ${localMessage}`);
        (combined as any).code = localCode;
        throw combined;
      }
    }
    const doc = this.document();
    const req = {
      id: `x_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      command,
      timestamp: Date.now(),
      payload,
    };
    const res = await this.localController.handleCommand(req, doc);
    if (!res.success) {
      throw new Error(`[${res.error?.code || 'COMMAND_FAILED'}] ${res.error?.message || 'Browser command failed'}`);
    }
    return res.data;
  }

  private wrap(data: any): MCPToolCallResult {
    const text = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return { content: [{ type: 'text', text: text.length > 400000 ? text.slice(0, 400000) + '\n…[truncated]' : text }] };
  }

  private err(message: string): MCPToolCallResult {
    return { isError: true, content: [{ type: 'text', text: message }] };
  }

  private saveToFile(filePath: string, data: string): { saved: boolean; outputPath: string; sizeBytes: number } {
    const resolvedPath = path.resolve(filePath);
    const dir = path.dirname(resolvedPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(resolvedPath, data);
    return { saved: true, outputPath: resolvedPath.replace(/\\/g, '/'), sizeBytes: fs.statSync(resolvedPath).size };
  }
}

function summarize(result: MCPToolCallResult): string {
  const text = (result?.content?.[0] as any)?.text || '';
  return summarizeText(text);
}

function summarizeText(text: string): string {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') {
      if (parsed.success === false) return 'failed';
      const keys = Object.keys(parsed).slice(0, 6);
      return `object with keys [${keys.join(', ')}]`;
    }
    return String(parsed).slice(0, 80);
  } catch {
    return text.slice(0, 80);
  }
}

function safeParse(text: string): any {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function inferTagFromSelector(selector: string): string {
  const m = /^([a-z0-9-]+)/i.exec(selector || '');
  return m ? m[1].toLowerCase() : 'div';
}
