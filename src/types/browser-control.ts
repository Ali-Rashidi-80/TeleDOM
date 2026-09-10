import { LogicalNodeId, DOMSnapshot } from './dom-node';
import { BaseEvent } from './events';
import { DisappearingElementReport } from './lifecycle';

/**
 * Supported Live Browser Command Types
 */
export type BrowserCommandType =
  | 'LIVE_PAGE_INSPECT'
  | 'LIVE_ELEMENT_INSPECT'
  | 'GET_SELECTED_ELEMENT'
  | 'ELEMENT_PICKER_START'
  | 'ELEMENT_PICKER_STOP'
  | 'ELEMENT_SELECTED'
  | 'LIVE_PAGE_SCREENSHOT'
  | 'LIVE_ELEMENT_SCREENSHOT'
  | 'LIVE_ELEMENT_INTERACT'
  | 'ELEMENT_OBSERVATION_START'
  | 'ELEMENT_OBSERVATION_STOP'
  | 'LIVE_DOM_SNAPSHOT'
  | 'LIVE_DOM_SUBTREE'
  | 'GET_ELEMENT_VISUAL_STATE'
  | 'LIST_TABS'
  | 'FOCUS_TAB'
  | 'RELOAD_TAB'
  | 'CLOSE_TAB'
  | 'OPEN_TAB'
  | 'LIST_EXTENSIONS'
  | 'RELOAD_EXTENSION'
  | 'GET_TAB_CONSOLE_LOGS'
  | 'GET_TAB_NETWORK_REQUESTS'
  | 'SET_EXTENSION_ENABLED'
  | 'TOGGLE_EXTENSION'
  | 'EXECUTE_PIPELINE'
  | 'COMPARE_EXTENSION_STATES'
  // === MCPDOM v3 platform evolution commands ===
  | 'RESIZE_VIEWPORT'
  | 'RESET_VIEWPORT'
  | 'GET_VIEWPORT_STATE'
  | 'RUN_RESPONSIVE_TEST'
  | 'EMULATE_DEVICE'
  | 'EXECUTE_JS'
  | 'EXECUTE_JS_AND_CAPTURE_CHANGES'
  | 'DOM_MUTATE'
  | 'DOM_MUTATE_TRANSACTION'
  | 'UNDO_DOM_MUTATION'
  | 'REDO_DOM_MUTATION'
  | 'GET_MUTATION_HISTORY'
  | 'PREVIEW_DOM_MUTATION'
  | 'GENERATE_ELEMENT_TARGET'
  | 'RECOVER_SELECTOR'
  | 'GET_ELEMENT_ANCESTRY'
  | 'GET_ELEMENT_FINGERPRINT'
  | 'GET_ELEMENT_RELATIONSHIPS'
  | 'GET_ELEMENT_ACCESSIBILITY'
  | 'GET_COMPUTED_STYLE'
  | 'ANALYZE_DOM'
  | 'DRAG_ELEMENT'
  | 'SET_INPUT_CHECKED'
  | 'PRESS_KEYBOARD_SHORTCUT'
  | 'SCROLL_PAGE'
  | 'WAIT_FOR_CONDITION'
  | 'GET_PAGE_STATE'
  | 'CAPTURE_PAGE_STATE'
  | 'CAPTURE_REGION'
  | 'GET_SIMULATION_TAB_STATE';

/**
 * Flexible Target Specifier for Live Elements
 */
export interface LiveElementTarget {
  selectedElementRef?: string;
  nodeId?: LogicalNodeId;
  selector?: string;
  xpath?: string;
  coordinates?: { x: number; y: number };
}

/**
 * Rich Structured Information for a Live DOM Element
 */
export interface LiveElementInfo {
  tag: string;
  id?: string;
  classes: string[];
  role?: string;
  ariaAttributes?: Record<string, string>;
  text: string;
  normalizedText: string;
  value?: string;
  type?: string;
  selector: string;
  bestSelector: string;
  selectorCandidates: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  visibility: {
    isVisible: boolean;
    display: string;
    visibility: string;
    opacity: number;
    pointerEvents: string;
    isClipped: boolean;
    isInViewport: boolean;
    zIndex: string | number;
  };
  computedStyle: Record<string, string>;
  attributes: Record<string, string>;
  state: {
    disabled: boolean;
    readOnly: boolean;
    checked?: boolean;
    selected?: boolean;
    focused: boolean;
    isShadowHost: boolean;
    hasShadowRoot: boolean;
  };
  context: {
    parentChain: string[];
    parentSelector?: string;
    childrenSummary: { count: number; tags: string[] };
    containingBlock?: string;
    iframe?: string | null;
    shadowRoot?: string | null;
  };
  forensics?: {
    logicalNodeId: LogicalNodeId | null;
    creationSequence: number | null;
    lastMutationSequence: number | null;
    eventCount: number;
    isRecorded: boolean;
  };
}

/**
 * High-Level Information for the Active Page
 */
export interface LivePageInfo {
  url: string;
  title: string;
  origin: string;
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    devicePixelRatio: number;
  };
  documentDimensions: {
    width: number;
    height: number;
  };
  activeElement?: {
    tag: string;
    selector: string;
    text?: string;
  };
  focusedElement?: {
    tag: string;
    selector: string;
  };
  visibilityState: DocumentVisibilityState;
  readyState: DocumentReadyState;
  framesCount: number;
}

/**
 * Supported User Actions on Live Elements
 */
export type ElementInteractionAction =
  | 'click'
  | 'double_click'
  | 'right_click'
  | 'hover'
  | 'focus'
  | 'blur'
  | 'type'
  | 'clear'
  | 'press_key'
  | 'select_option'
  | 'scroll_into_view'
  | 'scroll';

/**
 * Payload for Live Element Interaction
 */
export interface ElementInteractionPayload {
  action: ElementInteractionAction;
  target: LiveElementTarget;
  text?: string;
  key?: string;
  optionValue?: string;
  scrollDelta?: { x?: number; y?: number };
  options?: {
    waitForStabilization?: boolean;
    stabilizationTimeoutMs?: number;
    captureScreenshots?: boolean;
  };
}

/**
 * Structured Evidence Result for an Interaction
 */
export interface InteractionResult {
  success: boolean;
  action: ElementInteractionAction;
  target: LiveElementInfo;
  beforeState?: LiveElementInfo;
  afterState?: LiveElementInfo;
  beforeScreenshot?: string;
  afterScreenshot?: string;
  effects: {
    domMutations: number;
    consoleErrors: number;
    networkRequests: number;
    runtimeErrors: string[];
  };
  durationMs: number;
  stabilized: boolean;
  error?: string;
}

/**
 * Screenshot Capture Result with Temporal and DOM Metadata
 */
export interface LiveScreenshotResult {
  screenshotId: string;
  timestamp: number;
  url: string;
  viewport: {
    width: number;
    height: number;
    scrollX: number;
    scrollY: number;
    devicePixelRatio: number;
  };
  targetSelector?: string;
  targetNodeId?: LogicalNodeId;
  targetBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  dataUrl: string;
  imageFormat: 'png' | 'jpeg';
  dimensions: {
    width: number;
    height: number;
  };
  captureType: 'FULL_PAGE' | 'ELEMENT';
}

/**
 * Focused Element Observation Bundle
 */
export interface ElementObservationBundle {
  observationId: string;
  targetSelector: string;
  targetNodeId?: LogicalNodeId;
  startTime: number;
  endTime: number;
  durationMs: number;
  initialState: LiveElementInfo;
  finalState: LiveElementInfo | null;
  disappeared: boolean;
  disappearanceReason?: string;
  mutations: BaseEvent[];
  diagnostics: BaseEvent[];
  networkEvents: BaseEvent[];
  screenshots: LiveScreenshotResult[];
  correlationReport?: DisappearingElementReport;
}

/**
 * Detailed Visual and Layout State for an Element
 */
export interface ElementVisualState {
  selector: string;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  viewport: {
    scrollX: number;
    scrollY: number;
    width: number;
    height: number;
    devicePixelRatio: number;
  };
  layout: {
    display: string;
    position: string;
    zIndex: string | number;
    opacity: number;
    visibility: string;
    overflow: string;
    boxSizing: string;
    pointerEvents: string;
  };
  occlusion: {
    isInViewport: boolean;
    isClipped: boolean;
    isZeroDimension: boolean;
    isTransparent: boolean;
    isDisplayNone: boolean;
    isVisibilityHidden: boolean;
    isOffscreen: boolean;
    occludedBy?: string | null;
  };
  computedStyleSummary: Record<string, string>;
}

/**
 * Typed Generic Browser Command Request
 */
export interface BrowserCommandRequest<T = any> {
  id: string;
  command: BrowserCommandType;
  tabId?: number;
  frameId?: number;
  timestamp: number;
  payload?: T;
}

/**
 * Typed Generic Browser Command Response
 */
export interface BrowserCommandResponse<T = any> {
  id: string;
  command: BrowserCommandType;
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable?: boolean;
    details?: any;
  };
  timestamp: number;
  durationMs?: number;
}

/**
 * Information for an Open Browser Tab
 */
export interface BrowserTabInfo {
  id: number;
  index: number;
  windowId: number;
  title: string;
  url: string;
  active: boolean;
  status?: string;
  pinned: boolean;
  favIconUrl?: string;
  audited?: boolean;
  incognito?: boolean;
  width?: number;
  height?: number;
}

/**
 * Information for an Installed Chrome Extension
 */
export interface ExtensionItemInfo {
  id: string;
  name: string;
  version: string;
  description?: string;
  enabled: boolean;
  installType: 'development' | 'admin' | 'normal' | 'sideload' | 'other';
  isApp: boolean;
  homepageUrl?: string;
  permissions?: string[];
}

/**
 * Structured Live Console Log Entry
 */
export interface TabConsoleLogEntry {
  id: string;
  timestamp: number;
  relativeMs: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  text: string;
  args?: any[];
  stack?: string;
  source?: string;
  lineno?: number;
  colno?: number;
}

/**
 * Structured Live Network Request Entry
 */
export interface TabNetworkRequestEntry {
  requestId: string;
  timestamp: number;
  relativeMs: number;
  method: string;
  url: string;
  initiator?: string;
  status?: number;
  statusText?: string;
  durationMs?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
  completed: boolean;
}



/**
 * Pipeline Step Definition
 */
export interface PipelineStep {
  id?: string;
  action: string;
  params?: Record<string, any>;
  stopOnError?: boolean;
}

/**
 * Result for an Individual Pipeline Step
 */
export interface PipelineStepResult {
  stepIndex: number;
  id?: string;
  action: string;
  success: boolean;
  durationMs: number;
  result?: any;
  error?: string;
}

/**
 * Complete Pipeline Execution Summary
 */
export interface PipelineExecutionResult {
  pipelineSuccess: boolean;
  totalSteps: number;
  executedSteps: number;
  durationMs: number;
  steps: PipelineStepResult[];
}

/**
 * Extension Before/After Comparison Result
 */
export interface ExtensionComparisonResult {
  success: boolean;
  extensionId: string;
  cleanState: {
    domPath?: string;
    screenshotPath?: string;
    domLength: number;
  };
  injectedState: {
    domPath?: string;
    screenshotPath?: string;
    domLength: number;
  };
  analysis: {
    domSizeDifferenceBytes: number;
    injectedNodesDetected: string[];
    summary: string;
  };
}

// ============================================================================
// MCPDOM v3 PLATFORM EVOLUTION TYPES
// All types below extend the platform with targeting, mutation, viewport,
// JS-execution, human-interaction, command-sequence and page-state contracts.
// Existing types above are preserved unchanged (backward compatibility).
// ============================================================================

/**
 * §13 Element Target — multi-strategy resilient targeting representation.
 */
export interface ElementTarget {
  targetId: string;
  tag: string;
  role?: string;
  selector: string;
  selectorCandidates: SelectorCandidate[];
  xpath: string;
  domPath: string;
  textFingerprint: string;
  attributeFingerprint: string;
  structuralFingerprint: string;
  attributes: Record<string, string>;
  confidence: number;
  bounds: { x: number; y: number; width: number; height: number };
  resolvedFrom: string;
}

/**
 * §34 Ranked selector candidate with explainable confidence.
 */
export interface SelectorCandidate {
  selector: string;
  strategy: string;
  confidence: number;
  unique: boolean;
  reasons: string[];
}

/**
 * §35 Structural DOM fingerprint (hash + component evidence).
 */
export interface DOMFingerprint {
  fingerprintId: string;
  hash: string;
  tagHierarchy: string[];
  stableAttributes: Record<string, string>;
  meaningfulText: string;
  classes: string[];
  role?: string;
  dimensions: { width: number; height: number };
  ancestorPattern: string;
  descendantPattern: string;
  volatilityRisk: 'low' | 'medium' | 'high';
  volatilityReasons: string[];
}

/**
 * §12 Ancestry analysis with ancestor + sibling + descendant views.
 */
export interface ElementAncestry {
  selector: string;
  ancestors: Array<{
    tag: string;
    selector: string;
    role?: string;
    text: string;
    childIndex: number;
    siblingCount: number;
    distance: number;
  }>;
  siblings: Array<{
    tag: string;
    selector: string;
    role?: string;
    text: string;
    position: 'before' | 'after';
    distance: number;
  }>;
  descendants: {
    count: number;
    maxDepth: number;
    tags: string[];
    interactive: string[];
  };
}

/**
 * §63 / capability 8 — element relationship graph.
 */
export interface ElementRelationships {
  rootSelector: string;
  nodes: Array<{
    id: string;
    selector: string;
    tag: string;
    role?: string;
    label: string;
    relationship: 'self' | 'parent' | 'child' | 'sibling' | 'descendant';
    depth: number;
  }>;
  edges: Array<{ from: string; to: string; relation: string }>;
}

/**
 * Capability 9 — accessibility metadata extraction.
 */
export interface AccessibilityInfo {
  selector: string;
  role?: string;
  implicitRole?: string;
  name: string;
  nameSources: string[];
  description?: string;
  value?: string;
  states: string[];
  level?: number;
  focusable: boolean;
  tabIndex?: number;
  issues: string[];
}

/**
 * §17 Viewport state + resize contracts.
 */
export interface ViewportState {
  width: number;
  height: number;
  devicePixelRatio: number;
  scrollX: number;
  scrollY: number;
  original: { width: number; height: number } | null;
  isModified: boolean;
}

export interface ViewportResizeResult {
  success: boolean;
  applied: { width: number; height: number };
  previous: { width: number; height: number };
  original: { width: number; height: number };
  preset?: string;
  beforeState?: { url: string; domLength: number; interactiveCount: number };
  afterState?: { url: string; domLength: number; interactiveCount: number };
  reversible: boolean;
  mode: 'browser-window' | 'simulation';
}

export interface ResponsiveTestStep {
  label: string;
  width: number;
  height: number;
  domLength: number;
  interactiveCount: number;
  horizontalOverflow: boolean;
  screenshotId?: string;
}

export interface ResponsiveTestResult {
  success: boolean;
  originalViewport: { width: number; height: number };
  steps: ResponsiveTestStep[];
  restored: boolean;
  finalViewport: { width: number; height: number };
  comparisons: Array<{ from: string; to: string; domLengthDelta: number; interactiveDelta: number }>;
}

/**
 * §18 JavaScript execution with distinct outcome states.
 */
export type JSExecutionStatus =
  | 'EXECUTED_SUCCESSFULLY'
  | 'EXECUTED_WITH_ERROR'
  | 'TIMED_OUT'
  | 'SERIALIZATION_FAILED'
  | 'BLOCKED_BY_CONTEXT'
  | 'NOT_CONNECTED';

export interface JSExecutionResult {
  status: JSExecutionStatus;
  executionId: string;
  durationMs: number;
  result?: string;
  error?: { name: string; message: string; stack?: string };
  consoleOutput: Array<{ level: string; text: string }>;
  domChanged: boolean;
  domLengthBefore: number;
  domLengthAfter: number;
  world: 'ISOLATED' | 'MAIN';
  timeoutMs: number;
  codePreview: string;
}

/**
 * §19 First-class DOM mutation operations.
 */
export type DOMMutationOperation =
  | 'set_attribute'
  | 'remove_attribute'
  | 'set_text'
  | 'replace_text'
  | 'set_inner_html'
  | 'set_outer_html'
  | 'add_class'
  | 'remove_class'
  | 'replace_class'
  | 'set_style'
  | 'remove_style'
  | 'add_element'
  | 'remove_element'
  | 'replace_element'
  | 'move_element'
  | 'wrap_element'
  | 'unwrap_element'
  | 'clone_subtree';

export interface DOMMutationPayload {
  operation: DOMMutationOperation;
  target: LiveElementTarget;
  attribute?: string;
  value?: string;
  text?: string;
  replacement?: string;
  classes?: string[];
  style?: Record<string, string>;
  html?: string;
  newElementHtml?: string;
  parent?: LiveElementTarget;
  position?: 'before' | 'after' | 'prepend' | 'append';
  copyAttributes?: boolean;
}

export interface DOMMutationResult {
  mutationId: string;
  operation: DOMMutationOperation;
  success: boolean;
  before: { selector: string; outerHtml: string; attributes: Record<string, string> };
  after: { selector: string; outerHtml: string; attributes: Record<string, string> } | null;
  diff: { added: number; removed: number; changed: number; summary: string } | null;
  affectedSelector: string | null;
  durationMs: number;
  error?: string;
  undoable: boolean;
}

export interface MutationTransactionStep {
  stepId: string;
  mutation: DOMMutationResult;
  verify?: { passed: boolean; check: string };
}

export interface MutationTransactionResult {
  transactionId: string;
  committed: boolean;
  rolledBack: boolean;
  steps: MutationTransactionStep[];
  error?: string;
  durationMs: number;
  finalStateSummary: { domLength: number; diffSummary: string };
}

export interface MutationHistoryEntry {
  mutationId: string;
  transactionId?: string;
  timestamp: number;
  operation: DOMMutationOperation;
  targetSelector: string;
  success: boolean;
  summary: string;
  undoApplied: boolean;
  redoApplied: boolean;
}

export interface MutationPreview {
  valid: boolean;
  operation: DOMMutationOperation;
  target: { selector: string; tag: string };
  expectedChange: string;
  affectedNodes: number;
  warnings: string[];
  error?: string;
}

/**
 * §24 Human-like interaction profiles.
 */
export type InteractionProfileName = 'DETERMINISTIC' | 'BALANCED' | 'HUMAN_LIKE' | 'CUSTOM';

export interface InteractionProfile {
  name: InteractionProfileName;
  description: string;
  moveDelayMs: { min: number; max: number };
  clickDelayMs: { min: number; max: number };
  typeDelayMs: { min: number; max: number };
  keyDelayMs: { min: number; max: number };
  hesitationProbability: number;
  trajectorySteps: number;
  seed?: number;
}

export interface InteractionProfileReport {
  activeProfile: InteractionProfileName;
  profile: InteractionProfile;
  availableProfiles: InteractionProfileName[];
  lastActionTiming?: {
    action: string;
    requestedMode: string;
    actualMode: string;
    timings: number[];
    totalDurationMs: number;
  };
}

/**
 * §39 Page state snapshot (comparison anchor).
 */
export interface PageStateSnapshot {
  snapshotId: string;
  timestamp: number;
  url: string;
  title: string;
  viewport: { width: number; height: number; scrollX: number; scrollY: number; devicePixelRatio: number };
  domLength: number;
  domHash: string;
  interactiveCount: number;
  selectedRegions: string[];
  extensionEnabled: boolean;
  pendingMutations: number;
  annotationCount: number;
}

export interface PageStateComparison {
  identical: boolean;
  changes: Array<{
    field: string;
    before: any;
    after: any;
  }>;
  domDelta: { beforeLength: number; afterLength: number; delta: number };
  summary: string;
}

/**
 * Drag & drop, checkbox/radio, keyboard shortcut, scroll results.
 */
export interface DragResult {
  success: boolean;
  sourceSelector: string;
  targetSelector: string;
  eventsFired: string[];
  finalPosition: { x: number; y: number } | null;
  html5DndUsed: boolean;
  error?: string;
}

export interface InputCheckedResult {
  success: boolean;
  selector: string;
  inputType: string;
  checkedBefore: boolean;
  checkedAfter: boolean;
  eventsFired: string[];
}

export interface KeyboardShortcutResult {
  success: boolean;
  keys: string[];
  targetSelector: string;
  eventsFired: string[];
  error?: string;
}

export interface ScrollResult {
  success: boolean;
  scrollBefore: { x: number; y: number };
  scrollAfter: { x: number; y: number };
  requested: { x: number; y: number };
  targetSelector?: string;
}

export type WaitConditionKind =
  | 'dom_stable'
  | 'selector_present'
  | 'selector_visible'
  | 'selector_absent'
  | 'text_present'
  | 'url_contains'
  | 'element_count'
  | 'readiness_state';

export interface WaitResult {
  satisfied: boolean;
  condition: WaitConditionKind;
  waitedMs: number;
  timeoutMs: number;
  detail: string;
  error?: string;
}

/**
 * Generic DOM analysis result (powers the analyzer tool family).
 */
export interface DOMAnalysisResult {
  analyzer: string;
  summary: string;
  count: number;
  items: any[];
  warnings: string[];
  truncated: boolean;
}

/**
 * §22 Command sequence execution.
 */
export interface CommandSequenceStep {
  commandId?: string;
  tool: string;
  args?: Record<string, any>;
  stopOnError?: boolean;
  continueOnError?: boolean;
  condition?: { previousStepSucceeded?: boolean };
}

export interface CommandSequenceStepResult {
  stepIndex: number;
  commandId: string;
  tool: string;
  args: Record<string, any>;
  status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
  durationMs: number;
  resultSummary: string;
  result?: any;
  error?: string;
}

export interface CommandSequenceResult {
  sequenceId: string;
  success: boolean;
  totalSteps: number;
  executedSteps: number;
  skippedSteps: number;
  durationMs: number;
  stopOnError: boolean;
  steps: CommandSequenceStepResult[];
}

/**
 * §23 Command recording artifacts.
 */
export interface CommandRecording {
  recordingId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  commandCount: number;
  commands: Array<{
    index: number;
    commandId: string;
    tool: string;
    args?: Record<string, any>;
    recordedAt: number;
    outcome: 'SUCCESS' | 'FAILED';
    resultSummary?: string;
  }>;
  tags: string[];
}
