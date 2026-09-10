/**
 * The 30 MCPDOM-native advanced capability tool definitions (§17).
 * fx_ namespace — zero collisions with the 121 existing tools.
 */

import { MCPToolDefinition } from '../types/mcp-types';

const D = (name: string, description: string, inputSchema: MCPToolDefinition['inputSchema']): MCPToolDefinition => ({ name, description, inputSchema });

const sessionArg = { sessionId: { type: 'string', description: 'Recorded forensic session id (list_sessions)' } };

export const FORENSICS_TOOLS: MCPToolDefinition[] = [
  // CAP 01
  D('fx_correlate_dom_network', 'CAP 01 — DOM↔network causal correlator: anchors on a mutation (or request) and reconstructs request → response → render chains with RANKED causal candidates, temporal gaps and evidence-based confidence. Input: sessionId (+ eventId | timestamp | anchor, windowMs, limit).', {
    type: 'object',
    properties: { ...sessionArg, eventId: { type: 'string', description: 'Focal event id (mutation or request)' }, timestamp: { type: 'number', description: 'Focal timestamp (ms) — closest mutation/request is used' }, anchor: { type: 'string', enum: ['mutation', 'request'] }, windowMs: { type: 'number', description: 'Causality window (default 800ms)' }, limit: { type: 'number', description: 'Max candidates (default 8)' } },
  }),
  // CAP 02
  D('fx_dom_regression_diff', 'CAP 02 — Full regression diff between two page states across 8 dimensions (added/removed/moved/attributes/styles/text/layout/a11y) with machine-readable diffs AND a human-readable report. Input: sessionId + t1 + t2 (timestamps).', {
    type: 'object',
    properties: { ...sessionArg, t1: { type: 'number', description: 'First timestamp (before)' }, t2: { type: 'number', description: 'Second timestamp (after)' }, maxPerDimension: { type: 'number', description: 'Changes kept per dimension (default 40)' } },
    required: ['sessionId', 't1', 't2'],
  }),
  // CAP 03
  D('fx_visual_regression_forensics', 'CAP 03 — Visual regression forensics: decodes two recorded screenshots (real PNG decoding), computes region-level pixel diffs and ATTRIBUTS changes to concurrent DOM/style mutations with ranked root-cause candidates. Input: sessionId + shot1/shot2 event ids (or timestamps).', {
    type: 'object',
    properties: { ...sessionArg, shot1: { type: 'string', description: 'Screenshot event id before' }, shot2: { type: 'string', description: 'Screenshot event id after' }, t1: { type: 'number', description: 'Fallback: timestamp before' }, t2: { type: 'number', description: 'Fallback: timestamp after' } },
    required: ['sessionId'],
  }),
  // CAP 04
  D('fx_layout_shift_forensics', 'CAP 04 — Layout shift forensics: evidence chains for CLS/layout instability — affected element, position transitions, trigger mutations, concurrent requests, style changes. Input: sessionId (+ eventId | timestamp | selector, windowMs).', {
    type: 'object',
    properties: { ...sessionArg, eventId: { type: 'string' }, timestamp: { type: 'number' }, selector: { type: 'string' }, windowMs: { type: 'number', description: 'Default 600ms' } },
  }),
  // CAP 05 (record)
  D('fx_record_interactions', 'CAP 05 — Start/stop recording of interactions WITH DOM context (fingerprint, matched count, mutation baseline) for deterministic replay. Input: mode start|stop|record-step, recordingId, action, selector, params. Start returns a recordingId; record-step appends one step; stop finalizes.', {
    type: 'object',
    properties: {
      mode: { type: 'string', enum: ['start', 'stop', 'record-step', 'list'], description: 'Recording operation' },
      recordingId: { type: 'string', description: 'Recording id (for stop/record-step)' },
      action: { type: 'string', description: 'Interaction action for record-step (click/type/hover/…)' },
      selector: { type: 'string', description: 'Target selector for record-step' },
      params: { type: 'object', description: 'Action parameters (text, key…)' },
      tabId: { type: 'number' },
    },
    required: ['mode'],
  }),
  // CAP 05 (replay)
  D('fx_replay_interactions', 'CAP 05 — Deterministically replay a recorded interaction set with resilient target resolution (exact selector → fingerprint recovery), per-step results and success rate. Input: recordingId (+ stopOnFailure, verifySelectorsOnly, tabId).', {
    type: 'object',
    properties: { recordingId: { type: 'string' }, stopOnFailure: { type: 'boolean', description: 'Default true' }, verifySelectorsOnly: { type: 'boolean', description: 'Resolve targets without executing (dry-run)' }, tabId: { type: 'number' } },
    required: ['recordingId'],
  }),
  // CAP 06
  D('fx_failure_replay', 'CAP 06 — Capture a structured failure state (URL, page state, selector candidates, DOM subtree, console, network, timing, action history) as a replayable scenario; replay re-executes with resilient resolution. Input: mode capture|replay|list|get, failureId, failedAction, failedSelector, params, tabId.', {
    type: 'object',
    properties: {
      mode: { type: 'string', enum: ['capture', 'replay', 'list', 'get'] },
      failureId: { type: 'string', description: 'Scenario id (replay/get)' },
      failedAction: { type: 'string', description: 'Action that failed (capture)' },
      failedSelector: { type: 'string', description: 'Selector that failed (capture)' },
      params: { type: 'object', description: 'Original action params (capture)' },
      url: { type: 'string', description: 'Page URL context (capture)' },
      tabId: { type: 'number' },
      verifyOnly: { type: 'boolean' },
    },
    required: ['mode'],
  }),
  // CAP 07
  D('fx_selector_survivability', 'CAP 07 — Selector survivability scorer: ranks selectors by DOM stability, semantic stability, uniqueness, ancestry stability, framework-attribute risk, text volatility and position dependence — computed from recorded mutation history. Input: selector (+ sessionId, candidateSelectors).', {
    type: 'object',
    properties: { selector: { type: 'string' }, ...sessionArg, candidateSelectors: { type: 'array', description: 'Alternative candidates [{selector, matches}]', items: { type: 'object', properties: { selector: { type: 'string' }, matches: { type: 'number' } } } } },
  }),
  // CAP 08
  D('fx_component_boundaries', 'CAP 08 — Component boundary detector: infers React/Vue/Angular/WebComponents/generic boundaries from DOM markers (data-v-, _ngcontent, custom elements, React hydration attrs) and whole-subtree replacement mutation patterns; returns confidence + evidence per boundary. Input: sessionId + timestamp (state to analyze).', {
    type: 'object',
    properties: { ...sessionArg, timestamp: { type: 'number', description: 'DOM state timestamp (default: latest)' } },
  }),
  // CAP 09
  D('fx_frame_forensics', 'CAP 09 — Frame/iframe forensics: complete frame hierarchy, cross-frame relationships, network/console/DOM event attribution per frame, cross-origin detection and frame-local selectors. Input: sessionId + timestamp.', {
    type: 'object',
    properties: { ...sessionArg, timestamp: { type: 'number', description: 'DOM state timestamp (default: latest)' } },
  }),
  // CAP 10
  D('fx_shadow_dom_forensics', 'CAP 10 — Shadow DOM forensics: open/nested shadow roots, host relationships, slot distribution, shadow-tree mutations, style-boundary notes. Analyzes recorded shadow flags + live probing of open roots. Input: sessionId + timestamp, or live selector.', {
    type: 'object',
    properties: { ...sessionArg, timestamp: { type: 'number' }, selector: { type: 'string', description: 'Live host selector to probe (open roots)' }, tabId: { type: 'number' } },
  }),
  // CAP 11
  D('fx_css_influence', 'CAP 11 — CSS influence analyzer: given an element, ranks the CSS rules that determine its visibility/dimensions/position/stacking/typography/overflow/clipping — with specificity, stylesheet source, declarations and inheritance flags. Input: selector (+ group, tabId).', {
    type: 'object',
    properties: { selector: { type: 'string' }, group: { type: 'string', enum: ['visibility', 'dimensions', 'position', 'stacking', 'typography', 'overflow', 'clipping', 'all'], description: 'Property group focus (default all)' }, tabId: { type: 'number' } },
    required: ['selector'],
  }),
  // CAP 12
  D('fx_zindex_occlusion', 'CAP 12 — Z-index/occlusion forensics: stacking context chain, effective z-order, occluding element via hit-test at center, clipping parent, pointer-events interception, zero-size detection — actionable, not a computed-style dump. Input: selector (+ tabId).', {
    type: 'object',
    properties: { selector: { type: 'string' }, tabId: { type: 'number' } },
    required: ['selector'],
  }),
  // CAP 13
  D('fx_event_listeners', 'CAP 13 — Event listener forensics: inline on* attributes + addEventListener instrumentation (when the injected page script is active) with capture/passive flags, framework-ownership heuristics and coverage reporting. Input: selector (scope) or document-wide (+ tabId).', {
    type: 'object',
    properties: { selector: { type: 'string', description: 'Scope to a subtree (omit for whole document)' }, tabId: { type: 'number' } },
  }),
  // CAP 14
  D('fx_error_root_cause', 'CAP 14 — Runtime error root-cause graph: console error → stack trace → source location → failed request → DOM mutations → visible symptoms, with RANKED likely root causes and evidence. Input: sessionId (+ eventId | timestamp).', {
    type: 'object',
    properties: { ...sessionArg, eventId: { type: 'string', description: 'Error event id' }, timestamp: { type: 'number', description: 'Timestamp near the error' } },
  }),
  // CAP 15
  D('fx_network_dom_binding', 'CAP 15 — Network-to-DOM binding analyzer: which DOM regions depend on which responses (response → mutations window → region grouping) with confidence, plus unbound requests with reasons. Input: sessionId (+ windowMs, minConfidence, limit).', {
    type: 'object',
    properties: { ...sessionArg, windowMs: { type: 'number', description: 'Render window after response (default 1000ms)' }, minConfidence: { type: 'number', description: 'Minimum binding confidence (default 0.3)' }, limit: { type: 'number' } },
  }),
  // CAP 16
  D('fx_resource_waterfall', 'CAP 16 — Resource waterfall forensics: unified document/CSS/JS/font/image/fetch waterfall with request phases, timings, failures, DOM-ready and visual milestones, slowest-resource ranking. Input: sessionId (+ from, to).', {
    type: 'object',
    properties: { ...sessionArg, from: { type: 'number' }, to: { type: 'number' } },
  }),
  // CAP 17
  D('fx_font_forensics', 'CAP 17 — Font rendering forensics: @font-face declarations vs computed usage vs document.fonts load status; undeclared families, font-display behavior, missing fallback stacks, not-loaded faces. Input: tabId (live/simulated page).', {
    type: 'object',
    properties: { tabId: { type: 'number' } },
  }),
  // CAP 18
  D('fx_a11y_divergence', 'CAP 18 — Accessibility + DOM divergence: builds the a11y view from the DOM state and reports inaccessible elements, semantic mismatches, missing names, hidden-but-relevant content and unexpected accessible nodes. Input: sessionId + timestamp.', {
    type: 'object',
    properties: { ...sessionArg, timestamp: { type: 'number', description: 'DOM state timestamp (default: latest)' } },
  }),
  // CAP 19
  D('fx_page_health', 'CAP 19 — Page health score: weighted composite of console errors, failed requests, a11y issues, performance signals, memory warnings, layout instability, broken interactions and DOM anomalies — every subscore independently inspectable. Input: sessionId (+ failedInteractions).', {
    type: 'object',
    properties: { ...sessionArg, failedInteractions: { type: 'number', description: 'Known failed interaction count' } },
  }),
  // CAP 20
  D('fx_exploration_planner', 'CAP 20 — Agent exploration planner: given current evidence and a symptom, recommends the next investigation actions (tool + rationale + expected outcome) and reports data gaps. A planning aid — never autonomous browsing. Input: sessionId + symptom.', {
    type: 'object',
    properties: { ...sessionArg, symptom: { type: 'string', description: 'Observed symptom, e.g. "checkout button disappeared after login"' } },
  }),
  // CAP 21
  D('fx_smart_snapshot', 'CAP 21 — Smart snapshot compression: MINIMAL/SEMANTIC/INTERACTION/FORENSIC/FULL modes with compression ratio + token estimates; recommends the smallest mode answering a question (pass question). Input: sessionId (+ timestamp, mode, question).', {
    type: 'object',
    properties: { ...sessionArg, timestamp: { type: 'number' }, mode: { type: 'string', enum: ['MINIMAL', 'SEMANTIC', 'INTERACTION', 'FORENSIC', 'FULL'], description: 'Snapshot mode (default: recommended from question)' }, question: { type: 'string', description: 'What you need to answer — mode is auto-recommended' } },
  }),
  // CAP 22
  D('fx_cross_signal_search', 'CAP 22 — Cross-signal search: one query across DOM, mutations, console, network, navigation, interactions and screenshots — returns scored cross-domain hits plus temporally-adjacent related evidence. Input: sessionId + query (+ limit).', {
    type: 'object',
    properties: { ...sessionArg, query: { type: 'string', description: 'Search keywords (selectors, text, URLs, error messages…)' }, limit: { type: 'number', description: 'Max hits (default 40)' } },
    required: ['query'],
  }),
  // CAP 23
  D('fx_forensic_export', 'CAP 23 — Forensic session export: deterministic investigation bundle (metadata, timeline, evidence, findings, health, optional incident report) with SHA-256 content hash for tamper evidence. Input: sessionId (+ includeHealth, includeIncidentReport).', {
    type: 'object',
    properties: { ...sessionArg, includeHealth: { type: 'boolean', description: 'Include page health analysis (default true)' }, includeIncidentReport: { type: 'boolean', description: 'Include a generated incident report (default false)' } },
  }),
  // CAP 24
  D('fx_forensic_import', 'CAP 24 — Forensic session import: validates a previously exported investigation bundle (format + contentHash) and installs it as HISTORICAL evidence — imported data is always marked historical, never live state. Input: bundleJson.', {
    type: 'object',
    properties: { bundleJson: { type: 'string', description: 'Exported bundle JSON (from fx_forensic_export)' }, importAsSession: { type: 'boolean', description: 'Also register a queryable historical session (default true)' } },
    required: ['bundleJson'],
  }),
  // CAP 25
  D('fx_impact_prediction', 'CAP 25 — Change impact predictor: pre-mutation estimation of subtree impact, selector breakage, listener orphaning, layout severity, a11y impact and form-state loss — integrates with the mutation preview workflow. Input: operation, selector (+ sessionId for stored selectors).', {
    type: 'object',
    properties: { operation: { type: 'string', description: 'Planned operation (set_attribute, set_style, remove, set_outer_html…)' }, selector: { type: 'string' }, ...sessionArg },
    required: ['operation', 'selector'],
  }),
  // CAP 26
  D('fx_safe_mutation_guard', 'CAP 26 — Safe mutation guard: verdict SAFE/CAUTION/HIGH_RISK/BLOCKED with reasons and required precautions for a planned mutation. Never silently blocks normal operations — BLOCKED only for page-level destruction or irreversible state loss. Input: operation, selector (+ sessionId).', {
    type: 'object',
    properties: { operation: { type: 'string' }, selector: { type: 'string' }, ...sessionArg },
    required: ['operation', 'selector'],
  }),
  // CAP 27
  D('fx_transaction_journal', 'CAP 27 — DOM transaction journal: structured per-transaction records (BEFORE/INTENT/ACTION/AFTER/DIFF/EVIDENCE/TIMESTAMP/ACTOR/ROLLBACK info). Journal entries are written by the transactional mutation engine flow; this tool queries them. Input: transactionId/operation/since filters.', {
    type: 'object',
    properties: { transactionId: { type: 'string' }, operation: { type: 'string' }, since: { type: 'number' }, limit: { type: 'number' } },
  }),
  // CAP 28
  D('fx_session_graph', 'CAP 28 — Multi-page session graph: nodes/edges connecting pages, frames, navigations, requests, interactions, screenshots and DOM states of one investigation (recorded session + live pages). Input: sessionId.', {
    type: 'object',
    properties: { ...sessionArg },
  }),
  // CAP 29
  D('fx_evidence_scoring', 'CAP 29 — Forensic evidence scoring: score ANY finding from supporting/contradicting evidence items (source types with weights) — confidence, band, evidence count/types. The same model powers every fx_ conclusion. Input: conclusion + evidence arrays.', {
    type: 'object',
    properties: {
      conclusion: { type: 'string', description: 'The conclusion to score' },
      supporting: { type: 'array', description: 'Supporting evidence [{source, description, ref?, weight?}]', items: { type: 'object', properties: { source: { type: 'string', description: 'One of DOM_OBSERVATION, MUTATION_RECORD, NETWORK_CORRELATION, CONSOLE_EVIDENCE, SCREENSHOT_EVIDENCE, PERFORMANCE_TRACE, MEMORY_EVIDENCE, NAVIGATION_RECORD, USER_INTERACTION, STYLE_EVIDENCE, INFERRED' }, description: { type: 'string' }, ref: { type: 'string' }, weight: { type: 'number' } } } },
      contradicting: { type: 'array', description: 'Contradicting evidence [{source, description, weight?}]', items: { type: 'object' } },
    },
    required: ['conclusion', 'supporting'],
  }),
  // CAP 30
  D('fx_incident_report', 'CAP 30 — Agent incident report generator: structured incident report (summary, timeline, root cause, evidence, affected DOM/requests/components, performance+a11y impact, remediation, validation steps, confidence) in JSON AND Markdown. Input: sessionId (+ detectedIssue, rootCauseHint).', {
    type: 'object',
    properties: { ...sessionArg, detectedIssue: { type: 'string', description: 'One-line issue description' }, rootCauseHint: { type: 'string', description: 'Known root-cause hint (otherwise derived from evidence)' } },
  }),
];

export const FORENSICS_TOOL_NAMES = new Set(FORENSICS_TOOLS.map(t => t.name));
