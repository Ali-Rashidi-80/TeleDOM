/**
 * §44 Agent Tool Discovery — tool groups + per-tool metadata.
 *
 * Every tool communicates: purpose, required context, accepted input,
 * output, side effects, failure conditions, and recovery strategy.
 * Related tools are exposed as discoverable groups so agents never have
 * to guess which tool to use.
 */

export interface ToolDiscoveryInfo {
  tool: string;
  group: string;
  purpose: string;
  requiredContext: string;
  input: string;
  output: string;
  sideEffects: string;
  failureConditions: string[];
  recoveryStrategy: string;
}

export interface ToolGroupInfo {
  group: string;
  description: string;
  tools: string[];
}

export const TOOL_GROUPS: ToolGroupInfo[] = [
  {
    group: 'session-forensics',
    description: 'Historical forensic session management and analysis (recorded sessions, timelines, DOM states, diffs, lifecycle tracing).',
    tools: ['list_sessions', 'get_session', 'export_session', 'import_session', 'delete_session', 'get_timeline', 'get_events', 'get_events_around', 'get_dom_state', 'get_dom_node', 'get_dom_subtree', 'diff_dom', 'trace_element', 'find_disappearing_elements', 'why_did_element_disappear', 'get_diagnostics', 'get_network_events', 'get_screenshots', 'annotate_session', 'get_annotations', 'get_recording_health'],
  },
  {
    group: 'inspection',
    description: 'Live page and element inspection: page metadata, element deep-info, visual state, DOM snapshots and analyzers.',
    tools: ['inspect_live_page', 'inspect_live_element', 'get_element_visual_state', 'get_live_dom_snapshot', 'get_live_dom_subtree', 'get_tab_console_logs', 'get_tab_network_requests', 'get_element_ancestry', 'get_element_accessibility', 'get_computed_style', 'analyze_dom', 'search_dom', 'get_page_blueprint', 'get_element_fingerprint', 'detect_semantic_elements'],
  },
  {
    group: 'targeting',
    description: 'Element targeting resilience: TARGET generation, selector candidates with confidence, recovery, diagnostics.',
    tools: ['generate_element_target', 'recover_selector', 'diagnose_selector_failure'],
  },
  {
    group: 'interaction',
    description: 'Page interaction: clicks, typing, hover, focus, keyboard, drag-and-drop, checkboxes, selects, waits.',
    tools: ['interact_with_element', 'click_element', 'type_text', 'hover_element', 'focus_element', 'blur_element', 'press_keyboard_shortcut', 'scroll_to_element', 'scroll_page', 'drag_and_drop', 'set_input_checked', 'select_option', 'wait_for_condition', 'wait_for_dom_stable', 'set_interaction_profile', 'get_interaction_profile'],
  },
  {
    group: 'tabs-browser',
    description: 'Tab lifecycle and browser control: open/close/switch tabs, extension management, navigation, reload.',
    tools: ['list_tabs', 'focus_tab', 'reload_tab', 'close_tab', 'open_tab', 'list_extensions', 'set_extension_enabled', 'toggle_extension', 'reload_extension', 'compare_extension_states', 'get_browser_session'],
  },
  {
    group: 'selection-capture',
    description: 'Interactive element selection (Ctrl+Shift+Click / picker) and element observation.',
    tools: ['get_selected_element', 'start_element_picker', 'stop_element_picker', 'start_element_observation', 'stop_element_observation'],
  },
  {
    group: 'viewport-responsive',
    description: 'Viewport control and responsive testing: resize, presets, device emulation, multi-viewport workflows.',
    tools: ['resize_viewport', 'reset_viewport', 'get_viewport_state', 'run_responsive_test', 'emulate_device'],
  },
  {
    group: 'javascript',
    description: 'Observable JavaScript execution with explicit outcome states and change capture.',
    tools: ['execute_javascript', 'execute_js_and_capture_changes'],
  },
  {
    group: 'dom-mutation',
    description: 'First-class DOM mutation engine: operations with diff, transactions, undo/redo, history, preview.',
    tools: ['mutate_dom', 'mutate_dom_transaction', 'undo_dom_mutation', 'redo_dom_mutation', 'get_mutation_history', 'preview_dom_mutation', 'preview_command', 'clone_dom_subtree'],
  },
  {
    group: 'command-sequences',
    description: 'Command sequences, recording, replay, import/export of deterministic command data.',
    tools: ['execute_pipeline', 'execute_command_sequence', 'record_commands_start', 'record_commands_stop', 'list_command_recordings', 'get_command_recording', 'replay_command_recording', 'export_command_recording', 'import_command_recording', 'delete_command_recording'],
  },
  {
    group: 'page-state',
    description: 'Page state snapshots and time-travel comparison.',
    tools: ['capture_page_state', 'compare_page_states', 'list_page_states', 'get_action_timeline', 'get_operation_trace'],
  },
  {
    group: 'projects-knowledge',
    description: 'Project folders, region capture/annotation, relationship graphs, reconstruction specs, agent packages.',
    tools: ['create_page_project', 'list_projects', 'get_project', 'delete_project', 'capture_page_region', 'annotate_element', 'list_region_annotations', 'get_region_annotation', 'update_region_annotation', 'delete_region_annotation', 'get_region_relationship_graph', 'generate_reconstruction_spec', 'export_agent_package', 'import_project'],
  },
  {
    group: 'screenshots',
    description: 'Visual capture: page and element screenshots with geometry metadata.',
    tools: ['capture_page_screenshot', 'capture_element_screenshot'],
  },
  {
    group: 'security-privacy',
    description: 'Capture redaction configuration and exclusion rules.',
    tools: ['get_redaction_rules', 'set_redaction_rules'],
  },
  {
    group: 'discovery',
    description: 'Meta-tools: tool catalog and group discovery for agent self-orientation.',
    tools: ['get_tool_catalog', 'get_tool_groups'],
  },
];

const FAILURE: Record<string, string[]> = {
  live: ['EXTENSION_UNAVAILABLE (no browser connected)', 'TARGET_NOT_FOUND', 'TARGET_STALE (element removed)', 'SCRIPT_TIMEOUT', 'DOM_MUTATION_FAILED'],
  stored: ['SESSION_NOT_FOUND', 'invalid arguments'],
};

export function buildToolCatalog(): ToolDiscoveryInfo[] {
  const catalog: ToolDiscoveryInfo[] = [];
  for (const g of TOOL_GROUPS) {
    for (const tool of g.tools) {
      const isAnalysis = g.group === 'session-forensics' || g.group === 'page-state' || g.group === 'discovery' || g.group === 'security-privacy';
      catalog.push({
        tool,
        group: g.group,
        purpose: `See tool description (tools/list) — group: ${g.description}`,
        requiredContext: isAnalysis
          ? g.group === 'session-forensics' ? 'Recorded session id where applicable' : 'None (read-only meta information)'
          : 'Live browser connection or Node simulation context',
        input: 'See inputSchema in tools/list',
        output: 'See tool description in tools/list',
        sideEffects: ['dom-mutation', 'interaction', 'tabs-browser', 'javascript', 'command-sequences', 'projects-knowledge', 'viewport-responsive'].includes(g.group)
          ? 'May modify page state, browser state, or write project files (all DOM mutations are undoable)'
          : 'None (read-only)',
        failureConditions: isAnalysis ? FAILURE.stored : FAILURE.live,
        recoveryStrategy: g.group === 'tabs-browser'
          ? 'Ensure the extension is connected (bridge on 127.0.0.1:3847); in the Node simulation context these tools return deterministic simulated state.'
          : g.group === 'dom-mutation'
          ? 'Call undo_dom_mutation to revert; use preview_dom_mutation before destructive operations; wrap multi-step changes in mutate_dom_transaction.'
          : g.group === 'targeting'
          ? 'Call generate_element_target for a fresh TARGET, then recover_selector with the old snapshot if it drifts.'
          : 'Retry after wait_for_condition; inspect get_operation_trace for correlated errors.',
      });
    }
  }
  return catalog;
}

export function findGroupOfTool(toolName: string): ToolGroupInfo | undefined {
  return TOOL_GROUPS.find((g) => g.tools.includes(toolName));
}
