/**
 * MCPDOM v3 Unified Platform — DevTools capability layer types.
 *
 * §7/§8/§9 of the fusion specification: types shared by the Chrome
 * DevTools capability integration (dt_* tools), the unified browser
 * runtime, page identity model and unified event bus.
 */

/** Execution mode of a capability, §16 — never fake real browser data. */
export type ExecutionMode = 'LIVE' | 'SIMULATED' | 'UNAVAILABLE';

export interface ModeInfo {
  mode: ExecutionMode;
  /** True only for deterministic simulation results (contract validation). */
  simulated: boolean;
  /** Explanation of why LIVE is not available / what the mode means. */
  note: string;
  /** Data source description (bridge, cdp, jsdom-fixture, session-replay…). */
  source?: string;
}

/** The capability families integrated from chrome-devtools-mcp. */
export type DevToolsCategory =
  | 'input'
  | 'navigation'
  | 'emulation'
  | 'performance'
  | 'network'
  | 'debugging'
  | 'memory'
  | 'extensions'
  | 'third-party'
  | 'webmcp';

export type SafetyLevel = 'read-only' | 'reversible' | 'side-effects' | 'dangerous';

export interface ToolRegistryEntry {
  name: string;
  category: string;
  group: string;
  description: string;
  origin: 'MCPDOM_LEGACY' | 'MCPDOM_V3' | 'CHROME_DEVTOOLS_MCP' | 'MCPDOM_FORENSICS';
  safety: SafetyLevel;
  executionMode: ExecutionMode;
  /** Simulation contract support (§16). */
  simulationSupport: 'native' | 'partial' | 'none';
  requires: {
    bridge?: boolean;
    cdp?: boolean;
    extension?: boolean;
    session?: boolean;
  };
  experimental: boolean;
  performanceImpact: 'negligible' | 'low' | 'medium' | 'high';
}

// ---------------------------------------------------------------------------
// §10 Page identity — canonical cross-runtime page model
// ---------------------------------------------------------------------------

/** Identity of a single frame inside a page. */
export interface FrameIdentity {
  frameId: string;
  /** Parent frame id (null for main frame). */
  parentId: string | null;
  url: string;
  /** Logical node id of the <iframe> host element in the MCPDOM virtual DOM. */
  hostNodeId?: number;
}

export interface NavigationRecord {
  navigationId: string;
  fromUrl: string | null;
  toUrl: string;
  timestamp: number;
  navigationType: 'load' | 'reload' | 'push_state' | 'replace_state' | 'popstate' | 'hash_change';
}

/** Canonical page identity spanning all runtimes (§10). */
export interface PageIdentity {
  /** MCPDOM canonical page id (page_<n>, monotonic). */
  pageId: string;
  url: string;
  title: string;
  /** Chrome extension tab id when the MCPDOM extension is attached. */
  extensionTabId?: number;
  /** CDP target id once a CDP session attaches to this page. */
  cdpTargetId?: string;
  /** Puppeteer page id when a Puppeteer driver attaches. */
  puppeteerPageId?: string;
  /** MCPDOM forensic session bound to this page (if recording). */
  sessionId?: string;
  frames: FrameIdentity[];
  navigations: NavigationRecord[];
  createdAt: number;
  lastSeenAt: number;
  closed: boolean;
}

// ---------------------------------------------------------------------------
// §11 Unified event bus
// ---------------------------------------------------------------------------

export type EventDomain =
  | 'DOM'
  | 'NAVIGATION'
  | 'NETWORK'
  | 'CONSOLE'
  | 'RUNTIME'
  | 'SCREENSHOT'
  | 'PERFORMANCE'
  | 'MEMORY'
  | 'EXTENSION'
  | 'WEBMCP'
  | 'INTERACTION'
  | 'EMULATION';

export interface UnifiedEvent {
  eventId: string;
  domain: EventDomain;
  type: string;
  /** Wall clock ms. */
  timestamp: number;
  /** Monotonic counter — strictly increasing per process. */
  sequence: number;
  pageId?: string;
  frameId?: string;
  navigationId?: string;
  requestId?: string;
  mutationId?: string;
  traceId?: string;
  snapshotId?: string;
  transactionId?: string;
  /** Cross-domain correlation handle (§11 correlation IDs). */
  correlationId?: string;
  data: Record<string, unknown>;
}

export type EventBusSubscription = (event: UnifiedEvent) => void;

// ---------------------------------------------------------------------------
// DevTools result models (§21 result normalization)
// ---------------------------------------------------------------------------

export interface NetworkRequestRecord {
  requestId: string;
  url: string;
  method: string;
  resourceType?: string;
  status?: number;
  statusText?: string;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBody?: string;
  responseSize?: number;
  fromCache?: boolean;
  failed: boolean;
  errorText?: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  pageId?: string;
  persisted?: boolean;
}

export interface ConsoleMessageRecord {
  messageId: string;
  level: 'log' | 'info' | 'warn' | 'error' | 'debug';
  text: string;
  timestamp: number;
  pageId?: string;
  source?: string;
  stackTrace?: string;
}

export interface TraceEventRecord {
  name: string;
  cat: string;
  ts: number;
  dur: number;
  pid: number;
  tid: number;
  ph: string;
  args?: Record<string, unknown>;
}

export interface TraceSessionInfo {
  traceId: string;
  pageId: string;
  mode: ExecutionMode;
  startedAt: number;
  stoppedAt?: number;
  categories: string[];
  eventCount: number;
  simulated: boolean;
}

export interface WebVitalsMetrics {
  lcp?: { value: number; timestamp: number; elementHint?: string };
  inp?: { value: number };
  cls?: { value: number; sourceHints: string[] };
  fcp?: { value: number; timestamp: number };
  note?: string;
}

// ---------------------------------------------------------------------------
// Emulation profiles
// ---------------------------------------------------------------------------

export interface EmulationProfile {
  viewport?: { width: number; height: number };
  deviceScaleFactor?: number;
  userAgent?: string;
  cpuThrottlingRate?: number;
  networkConditions?: {
    downloadKbps?: number;
    uploadKbps?: number;
    latencyMs?: number;
  };
  geolocation?: { latitude: number; longitude: number; accuracy?: number };
  colorScheme?: 'light' | 'dark';
  extraHeaders?: Record<string, string>;
  locale?: string;
  timezoneId?: string;
}

// ---------------------------------------------------------------------------
// Memory (V8 heap snapshot model, self-contained)
// ---------------------------------------------------------------------------

export interface HeapSnapshotMeta {
  node_fields: string[];
  node_types: (string | string[])[];
  edge_fields: string[];
  edge_types: (string | string[])[];
  trace_function_info_fields?: string[];
  trace_node_fields?: string[];
  sample_fields?: string[];
  type_fields?: string[];
}

export interface RawHeapSnapshot {
  snapshot: { meta: HeapSnapshotMeta; node_count: number; edge_count: number; trace_function_count?: number; trace_node_count?: number; sample_count?: number };
  nodes: number[];
  edges: number[];
  strings: string[];
  trace_function_infos?: number[];
  trace_tree?: number[];
  samples?: number[];
  locations?: number[];
}

export interface HeapNodeInfo {
  id: number;
  index: number;
  type: string;
  className: string;
  name?: string;
  selfSize: number;
  edgeCount: number;
  detached?: boolean;
}

export interface HeapEdgeInfo {
  index: number;
  type: string;
  nameOrIndex: string;
  fromNodeId: number;
  toNodeId: number;
  toNodeClass?: string;
  toSelfSize?: number;
  fromClassName?: string;
}

export interface HeapClassAggregate {
  className: string;
  count: number;
  selfSize: number;
}

export interface HeapSnapshotAnalysis {
  snapshotId: string;
  source: ExecutionMode;
  nodeCount: number;
  edgeCount: number;
  totalSelfSize: number;
  classes: HeapClassAggregate[];
  strings: number;
}

export interface WebMCPToolInfo {
  name: string;
  description?: string;
  inputSchema?: unknown;
  pageUrl?: string;
}
