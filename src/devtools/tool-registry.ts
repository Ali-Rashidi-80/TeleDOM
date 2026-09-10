/**
 * §13 Unified MCP Tool Registry — single source of truth for tool
 * metadata: category, schema, capability requirements, safety level,
 * simulation support, CDP/extension requirements, performance impact.
 * §38 Tool Discovery + §39 Smart Tool Selection: exposes "prefer"
 * guidance so agents choose efficient tools and reduce turns/tokens.
 */

import { ToolRegistryEntry, SafetyLevel, ExecutionMode } from './types';

export interface SmartSelectionHint {
  scenario: string;
  prefer: string[];
  over: string;
  reason: string;
}

const dt = (
  name: string,
  category: string,
  group: string,
  description: string,
  safety: SafetyLevel,
  extra: Partial<ToolRegistryEntry> = {}
): ToolRegistryEntry => ({
  name,
  category,
  group,
  description,
  origin: 'CHROME_DEVTOOLS_MCP',
  safety,
  executionMode: extra.executionMode || 'LIVE',
  simulationSupport: extra.simulationSupport || 'partial',
  requires: extra.requires || { bridge: true },
  experimental: extra.experimental || false,
  performanceImpact: extra.performanceImpact || 'low',
});

const fx = (
  name: string,
  description: string,
  safety: SafetyLevel = 'read-only',
  extra: Partial<ToolRegistryEntry> = {}
): ToolRegistryEntry => ({
  name,
  category: 'forensics',
  group: 'advanced-forensics',
  description,
  origin: 'MCPDOM_FORENSICS',
  safety,
  executionMode: extra.executionMode || 'SIMULATED',
  simulationSupport: extra.simulationSupport || 'native',
  requires: extra.requires || { session: true },
  experimental: extra.experimental || false,
  performanceImpact: extra.performanceImpact || 'medium',
});

/** DevTools (dt_) capability registry entries. */
export const DEVTOOLS_REGISTRY: ToolRegistryEntry[] = [
  // Input automation
  dt('dt_click', 'input', 'devtools-input', 'Click an element by snapshot uid or selector (chrome-devtools-mcp click).', 'side-effects', { simulationSupport: 'native' }),
  dt('dt_click_at', 'input', 'devtools-input', 'Vision-assisted coordinate click with element resolution at the point.', 'side-effects', { simulationSupport: 'partial' }),
  dt('dt_drag', 'input', 'devtools-input', 'Drag an element onto a target element or coordinate.', 'side-effects', { simulationSupport: 'partial' }),
  dt('dt_fill', 'input', 'devtools-input', 'Set input value (clear + type) with optional submit key.', 'side-effects', { simulationSupport: 'native' }),
  dt('dt_fill_form', 'input', 'devtools-input', 'Fill multiple form fields in one call (prefers batching over many fills).', 'side-effects', { simulationSupport: 'native', performanceImpact: 'low' }),
  dt('dt_handle_dialog', 'input', 'devtools-input', 'Accept or dismiss an open JS dialog (alert/confirm/prompt).', 'side-effects', { simulationSupport: 'partial' }),
  dt('dt_hover', 'input', 'devtools-input', 'Hover over an element.', 'side-effects', { simulationSupport: 'native' }),
  dt('dt_press_key', 'input', 'devtools-input', 'Press a (possibly combined) key, e.g. "Control+Or,Control+a".', 'side-effects', { simulationSupport: 'native' }),
  dt('dt_type_text', 'input', 'devtools-input', 'Type text into a focused element, optional submit key.', 'side-effects', { simulationSupport: 'native' }),
  dt('dt_upload_file', 'input', 'devtools-input', 'Set file input files programmatically.', 'side-effects', { simulationSupport: 'partial' }),
  // Navigation
  dt('dt_list_pages', 'navigation', 'devtools-navigation', 'List pages/tabs known to the unified runtime with identity mapping.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_select_page', 'navigation', 'devtools-navigation', 'Bring a page to focus by pageId/tabId/index.', 'reversible', { simulationSupport: 'native' }),
  dt('dt_new_page', 'navigation', 'devtools-navigation', 'Open a new page/tab with a URL.', 'reversible', { simulationSupport: 'native' }),
  dt('dt_close_page', 'navigation', 'devtools-navigation', 'Close a page.', 'side-effects', { simulationSupport: 'native' }),
  dt('dt_navigate_page', 'navigation', 'devtools-navigation', 'Navigate the page to a URL.', 'side-effects', { simulationSupport: 'native' }),
  dt('dt_history_navigation', 'navigation', 'devtools-navigation', 'Navigate back/forward/refresh in history.', 'side-effects', { simulationSupport: 'partial' }),
  dt('dt_wait_for', 'navigation', 'devtools-navigation', 'Wait until a condition (load / network idle / selector visible).', 'read-only', { simulationSupport: 'partial' }),
  // Emulation
  dt('dt_emulate', 'emulation', 'devtools-emulation', 'Emulate device characteristics: viewport, UA, CPU throttling, network, geolocation, color scheme, headers.', 'reversible', { simulationSupport: 'native' }),
  dt('dt_resize_page', 'emulation', 'devtools-emulation', 'Resize the page viewport.', 'reversible', { simulationSupport: 'native' }),
  // Performance
  dt('dt_performance_start_trace', 'performance', 'devtools-performance', 'Start a performance trace (CDP Tracing/Performance domains).', 'side-effects', { simulationSupport: 'partial', requires: { cdp: true, bridge: true }, performanceImpact: 'high' }),
  dt('dt_performance_stop_trace', 'performance', 'devtools-performance', 'Stop the trace and return normalized trace events + web vitals.', 'read-only', { simulationSupport: 'partial', requires: { cdp: true, bridge: true }, performanceImpact: 'high' }),
  dt('dt_performance_analyze_insight', 'performance', 'devtools-performance', 'Analyze a recorded insight/trace: long tasks, layout shifts, LCP/INP/CLS.', 'read-only', { simulationSupport: 'partial', requires: { cdp: true, bridge: true } }),
  // Network
  dt('dt_list_network_requests', 'network', 'devtools-network', 'List captured network requests with filtering + pagination.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_get_network_request', 'network', 'devtools-network', 'Inspect a single request/response in full.', 'read-only', { simulationSupport: 'native' }),
  // Debugging
  dt('dt_evaluate_script', 'debugging', 'devtools-debugging', 'Evaluate a script in page context (explicit; not a general-purpose wrapper).', 'dangerous', { simulationSupport: 'native' }),
  dt('dt_list_console_messages', 'debugging', 'devtools-debugging', 'List console messages with level filtering + history.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_get_console_message', 'debugging', 'devtools-debugging', 'Inspect one console message with stack/source.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_take_screenshot', 'debugging', 'devtools-debugging', 'Capture a page screenshot (png/jpeg, element or viewport).', 'read-only', { simulationSupport: 'partial' }),
  dt('dt_take_snapshot', 'debugging', 'devtools-debugging', 'Take a text a11y-structured page snapshot (uid-addressable).', 'read-only', { simulationSupport: 'native', performanceImpact: 'medium' }),
  dt('dt_screencast_start', 'debugging', 'devtools-debugging', 'Start screencast frame streaming.', 'side-effects', { simulationSupport: 'none', experimental: true, performanceImpact: 'medium' }),
  dt('dt_screencast_stop', 'debugging', 'devtools-debugging', 'Stop screencast streaming.', 'read-only', { simulationSupport: 'none', experimental: true }),
  dt('dt_lighthouse_audit', 'debugging', 'devtools-debugging', 'Run a Lighthouse audit (via extension DevTools connection).', 'side-effects', { simulationSupport: 'none', experimental: true, requires: { cdp: true, bridge: true }, performanceImpact: 'high' }),
  // Memory
  dt('dt_take_heapsnapshot', 'memory', 'devtools-memory', 'Capture a V8 heap snapshot via CDP HeapProfiler.', 'side-effects', { simulationSupport: 'partial', requires: { cdp: true, bridge: true }, performanceImpact: 'high' }),
  dt('dt_close_heapsnapshot', 'memory', 'devtools-memory', 'Release a loaded heap snapshot.', 'reversible', { simulationSupport: 'native' }),
  dt('dt_heapsnapshot_summary', 'memory', 'devtools-memory', 'Class aggregates: counts, self sizes, totals.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_heapsnapshot_details', 'memory', 'devtools-memory', 'Snapshot meta details: counts, fields, format version.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_heapsnapshot_class_nodes', 'memory', 'devtools-memory', 'List node ids of a class with pagination.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_heapsnapshot_edges', 'memory', 'devtools-memory', 'Edges of a node (outgoing references).', 'read-only', { simulationSupport: 'native' }),
  dt('dt_heapsnapshot_retainers', 'memory', 'devtools-memory', 'Retainers of a node (incoming references).', 'read-only', { simulationSupport: 'native' }),
  dt('dt_heapsnapshot_retaining_paths', 'memory', 'devtools-memory', 'Retaining paths from GC roots to a node.', 'read-only', { simulationSupport: 'native', performanceImpact: 'medium' }),
  dt('dt_heapsnapshot_dominators', 'memory', 'devtools-memory', 'Dominator analysis: dominator tree size summary.', 'read-only', { simulationSupport: 'native', performanceImpact: 'medium' }),
  dt('dt_heapsnapshot_duplicate_strings', 'memory', 'devtools-memory', 'Find duplicate string instances wasting memory.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_heapsnapshot_object_details', 'memory', 'devtools-memory', 'Full details of one object node.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_query_heapsnapshot_objects', 'memory', 'devtools-memory', 'Query objects by type/class name/size.', 'read-only', { simulationSupport: 'native' }),
  dt('dt_compare_heapsnapshots', 'memory', 'devtools-memory', 'Diff two snapshots: added/removed objects per class.', 'read-only', { simulationSupport: 'native', performanceImpact: 'medium' }),
  // Extensions
  dt('dt_install_extension', 'extensions', 'devtools-extensions', 'Install (load) a browser extension.', 'dangerous', { simulationSupport: 'partial', requires: { bridge: true, extension: true } }),
  dt('dt_list_extensions', 'extensions', 'devtools-extensions', 'List installed browser extensions.', 'read-only', { simulationSupport: 'native', requires: { bridge: true } }),
  dt('dt_reload_extension', 'extensions', 'devtools-extensions', 'Reload an extension by id.', 'reversible', { simulationSupport: 'partial', requires: { bridge: true, extension: true } }),
  dt('dt_trigger_extension_action', 'extensions', 'devtools-extensions', 'Trigger an extension action (activate).', 'side-effects', { simulationSupport: 'partial', requires: { bridge: true, extension: true } }),
  dt('dt_uninstall_extension', 'extensions', 'devtools-extensions', 'Uninstall an extension.', 'dangerous', { simulationSupport: 'partial', requires: { bridge: true, extension: true } }),
  // Third-party devtools
  dt('dt_list_3p_developer_tools', 'third-party', 'devtools-third-party', 'Discover third-party developer tools exposed by the page.', 'read-only', { simulationSupport: 'partial' }),
  dt('dt_execute_3p_developer_tool', 'third-party', 'devtools-third-party', 'Execute a discovered third-party developer tool.', 'side-effects', { simulationSupport: 'partial', experimental: true }),
  // WebMCP
  dt('dt_list_webmcp_tools', 'webmcp', 'devtools-webmcp', 'Discover WebMCP tools exposed by the page.', 'read-only', { simulationSupport: 'partial' }),
  dt('dt_execute_webmcp_tool', 'webmcp', 'devtools-webmcp', 'Execute a WebMCP tool exposed by the page.', 'side-effects', { simulationSupport: 'partial' }),
];

/** The 30 MCPDOM-native advanced forensic capabilities (§17). */
export const FORENSICS_REGISTRY: ToolRegistryEntry[] = [
  fx('fx_correlate_dom_network', 'CAP 01 — DOM↔network causal correlation with ranked candidates and confidence.'),
  fx('fx_dom_regression_diff', 'CAP 02 — regression diff between two states: added/removed/moved/attr/style/text/layout/a11y changes.'),
  fx('fx_visual_regression_forensics', 'CAP 03 — screenshot + DOM co-analysis to locate visual changes and root causes.'),
  fx('fx_layout_shift_forensics', 'CAP 04 — CLS/layout-shift evidence chains: element, positions, trigger mutation, requests.'),
  fx('fx_record_interactions', 'CAP 05 — record interactions with resilient target objects for deterministic replay.', 'side-effects'),
  fx('fx_replay_interactions', 'CAP 05 — deterministic replay with selector re-resolution and verification.', 'side-effects'),
  fx('fx_failure_replay', 'CAP 06 — structured failure-state capture and scenario replay.'),
  fx('fx_selector_survivability', 'CAP 07 — selector survivability scoring from mutation history.'),
  fx('fx_component_boundaries', 'CAP 08 — framework component boundary inference (React/Vue/Angular/WebComponents).'),
  fx('fx_frame_forensics', 'CAP 09 — frame/iframe hierarchy, cross-frame DOM/network/console mapping.'),
  fx('fx_shadow_dom_forensics', 'CAP 10 — shadow root analysis: hosts, slots, boundaries, mutations.'),
  fx('fx_css_influence', 'CAP 11 — ranked CSS rules influencing visibility/size/position/stacking/typography.'),
  fx('fx_zindex_occlusion', 'CAP 12 — stacking contexts, effective z-order, occluders, hit-test conflicts.'),
  fx('fx_event_listeners', 'CAP 13 — event listener inventory: inline + framework heuristics + instrumentation.'),
  fx('fx_error_root_cause', 'CAP 14 — runtime error root-cause graph across console/stack/network/mutations.'),
  fx('fx_network_dom_binding', 'CAP 15 — which DOM regions depend on which responses, with confidence.'),
  fx('fx_resource_waterfall', 'CAP 16 — unified resource waterfall with DOM-ready and visual milestones.'),
  fx('fx_font_forensics', 'CAP 17 — font loading/fallback/metrics problems and FOUT-related shifts.'),
  fx('fx_a11y_divergence', 'CAP 18 — DOM vs accessibility tree divergence analysis.'),
  fx('fx_page_health', 'CAP 19 — composite page health score with inspectable subscores.'),
  fx('fx_exploration_planner', 'CAP 20 — next-action recommendations for an agent investigation.'),
  fx('fx_smart_snapshot', 'CAP 21 — token-efficient snapshots: MINIMAL/SEMANTIC/INTERACTION/FORENSIC/FULL.'),
  fx('fx_cross_signal_search', 'CAP 22 — search across DOM/mutations/console/network/performance/interactions.'),
  fx('fx_forensic_export', 'CAP 23 — deterministic complete investigation export.', 'read-only', { performanceImpact: 'medium' }),
  fx('fx_forensic_import', 'CAP 24 — import investigation into offline historical mode.', 'reversible'),
  fx('fx_impact_prediction', 'CAP 25 — pre-mutation impact estimation: layout/a11y/selectors/listeners.'),
  fx('fx_safe_mutation_guard', 'CAP 26 — SAFE/CAUTION/HIGH_RISK/BLOCKED mutation verdict with reasons.'),
  fx('fx_transaction_journal', 'CAP 27 — structured transaction journal query (BEFORE/INTENT/ACTION/AFTER/DIFF…).', 'read-only'),
  fx('fx_session_graph', 'CAP 28 — multi-page session graph: tabs/frames/navigations/requests/interactions.'),
  fx('fx_evidence_scoring', 'CAP 29 — generalized evidence scoring for any finding.'),
  fx('fx_incident_report', 'CAP 30 — structured incident report (JSON + Markdown) with remediation.', 'read-only', { performanceImpact: 'medium' }),
];

/** §39 Smart selection hints surfaced via the registry. */
export const SMART_SELECTION_HINTS: SmartSelectionHint[] = [
  { scenario: 'Fill multiple form fields', prefer: ['dt_fill_form', 'mutate_dom_transaction'], over: 'repeated dt_fill / fill calls', reason: 'One batched call reduces round trips and keeps mutations transactional.' },
  { scenario: 'Understand page structure', prefer: ['dt_take_snapshot', 'fx_smart_snapshot', 'get_page_blueprint'], over: 'full DOM dump (get_live_dom_snapshot format=json)', reason: 'Compact semantic representations cut token cost dramatically.' },
  { scenario: 'Forensic investigation', prefer: ['fx_cross_signal_search', 'fx_correlate_dom_network', 'fx_error_root_cause'], over: 'independent inspection of each subsystem', reason: 'Cross-signal correlation answers causality in one turn.' },
  { scenario: 'Element disappears', prefer: ['why_did_element_disappear', 'fx_layout_shift_forensics'], over: 'manual timeline walking', reason: 'Automated root-cause with evidence chains.' },
  { scenario: 'Compare states', prefer: ['fx_dom_regression_diff'], over: 'diff_dom (structural only)', reason: 'Attribute/style/text/layout/a11y dimension diffs plus machine+human output.' },
  { scenario: 'Memory investigation', prefer: ['dt_take_heapsnapshot → dt_heapsnapshot_summary → dt_compare_heapsnapshots'], over: 'repeated full snapshot reads', reason: 'Summaries first; drill into classes/objects only when needed.' },
];

export class ToolRegistry {
  private entries = new Map<string, ToolRegistryEntry>();

  constructor(extra: ToolRegistryEntry[] = []) {
    for (const e of [...DEVTOOLS_REGISTRY, ...FORENSICS_REGISTRY, ...extra]) {
      this.entries.set(e.name, e);
    }
  }

  register(entry: ToolRegistryEntry): void {
    this.entries.set(entry.name, entry);
  }

  get(name: string): ToolRegistryEntry | undefined {
    return this.entries.get(name);
  }

  /** All entries for a given origin (for final tool-count reporting). */
  byOrigin(origin: ToolRegistryEntry['origin']): ToolRegistryEntry[] {
    return Array.from(this.entries.values()).filter(e => e.origin === origin);
  }

  list(): ToolRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /** §38 self-describing ecosystem: registry digest for discovery tools. */
  digest(): { total: number; byCategory: Record<string, number>; smartSelection: SmartSelectionHint[] } {
    const byCategory: Record<string, number> = {};
    for (const e of this.entries.values()) byCategory[e.category] = (byCategory[e.category] || 0) + 1;
    return { total: this.entries.size, byCategory, smartSelection: SMART_SELECTION_HINTS };
  }
}

export const toolRegistry = new ToolRegistry();
