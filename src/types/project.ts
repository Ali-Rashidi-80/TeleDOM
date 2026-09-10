/**
 * §29 / §31 / §61 Project Knowledge System — type contracts.
 *
 * The portable project format consumed by other AI agents. Versioned
 * schemas with explicit migration fields; OBSERVED FACTS, USER REQUESTS,
 * EXPECTED CHANGES and VERIFICATION CONDITIONS are always distinct fields —
 * never silently mixed.
 */

export const PROJECT_SCHEMA_VERSION = '1.0.0';
export const PAGE_SCHEMA_VERSION = '1.0.0';
export const REGION_SCHEMA_VERSION = '1.0.0';
export const RECONSTRUCTION_SPEC_VERSION = '1.0.0';
export const AGENT_PACKAGE_VERSION = '1.0.0';

export interface ProjectManifest {
  schemaVersion: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  pages: string[];
  regionCount: number;
  commandRecordingCount: number;
  tags: string[];
  toolVersion: string;
}

export interface PageManifest {
  schemaVersion: string;
  pageId: string;
  projectId: string;
  url: string;
  title: string;
  capturedAt: number;
  viewport: { width: number; height: number; devicePixelRatio: number };
  domSnapshotFile?: string;
  regions: string[];
  browserState: {
    extensionEnabled: boolean;
    readyState: string;
    visibilityState: string;
  };
}

export interface SelectorEvidence {
  selector: string;
  strategy: string;
  confidence: number;
  unique: boolean;
  reasons: string[];
}

export interface RegionAnnotation {
  /** OBSERVED FACTS — captured by the platform, never edited by hand. */
  observed: {
    schemaVersion: string;
    regionId: string;
    pageId: string;
    name: string;
    autoName: string;
    tag: string;
    role?: string;
    selector: string;
    selectorCandidates: SelectorEvidence[];
    xpath: string;
    structuralFingerprint: string;
    domFile: string;
    contextDomFile: string;
    dimensions: { width: number; height: number };
    position: { x: number; y: number };
    relevantStyles: Record<string, string>;
    parentSelector?: string;
    parentInfo?: { tag: string; selector: string; text: string };
    childrenCount: number;
    childTags: string[];
    screenshotFile?: string;
    htmlSnapshotFile?: string;
    capturedAt: number;
    sourceUrl: string;
    pageTitle: string;
    viewport: { width: number; height: number };
    extensionState: boolean;
  };
  /** USER REQUESTS — comments, names, tags supplied by the human. */
  user: {
    name?: string;
    description?: string;
    comment?: string;
    tags: string[];
    behavioralNotes?: string;
    visualNotes?: string;
  };
  /** INTENDED CHANGE — what the user wants done (optional at capture time). */
  intendedChange?: {
    statement: string;
    recordedAt: number;
  };
  /** VERIFICATION CONDITIONS — how success will be checked. */
  verification?: {
    conditions: string[];
    recordedAt: number;
  };
  /** AUTOMATIC ANALYSIS — platform-computed quality and naming evidence. */
  analysis: {
    qualityScore?: RegionQualityScore;
    namingEvidence?: string[];
    relatedRegions?: string[];
    capturedBy: 'ctrl_shift_selection' | 'picker' | 'tool_call';
  };
}

export interface RegionQualityScore {
  overall: number;
  components: Array<{ dimension: string; score: number; weight: number; evidence: string }>;
  grade: 'A' | 'B' | 'C' | 'D';
  notes: string[];
}

export interface RegionRelationshipNode {
  id: string;
  name: string;
  tag: string;
  role?: string;
  selector: string;
  depth: number;
  relationship: 'page' | 'region';
}

export interface RegionRelationshipEdge {
  from: string;
  to: string;
  relation: 'contains' | 'sibling-of' | 'ancestor-of' | 'overlaps';
}

export interface RegionRelationshipGraph {
  pageId: string;
  nodes: RegionRelationshipNode[];
  edges: RegionRelationshipEdge[];
}

export interface PageBlueprint {
  schemaVersion: string;
  pageId: string;
  generatedAt: number;
  majorSections: Array<{
    name: string;
    tag: string;
    selector: string;
    role: string;
    regionId?: string;
    bounds: { x: number; y: number; width: number; height: number };
    childrenSummary: string;
    visible?: boolean;
  }>;
  hierarchy: {
    node: string;
    label: string;
    children: any[];
  };
  keyInteractiveElements: Array<{
    selector: string;
    role: string;
    text: string;
    section: string;
  }>;
  repeatedComponents: Array<{
    pattern: string;
    occurrences: number;
    sampleSelector: string;
    containerSelector: string;
  }>;
  layoutRelationships: string[];
  semanticRegions: string[];
}

export interface ReconstructionSpec {
  schemaVersion: string;
  pageId: string;
  projectId: string;
  generatedAt: number;
  metadata: {
    url: string;
    title: string;
    capturedAt: number;
    tool: string;
  };
  viewport: { width: number; height: number; devicePixelRatio: number };
  structure: {
    domSnapshotFile: string;
    domHash: string;
    nodeCount: number;
  };
  regions: Array<{
    regionId: string;
    name: string;
    selector: string;
    selectorCandidates: SelectorEvidence[];
    domFile: string;
    reconstructionRole: string;
  }>;
  hierarchy: RegionRelationshipGraph;
  semanticRoles: Array<{ regionId: string; role: string }>;
  visualConstraints: Array<{
    regionId: string;
    constraint: string;
    value: string;
  }>;
  interactions: Array<{
    regionId: string;
    interactive: boolean;
    action: string;
    notes?: string;
  }>;
  selectors: Array<{ regionId: string; primary: string; fallbacks: string[] }>;
  content: Array<{ regionId: string; text: string }>;
  styles: Array<{ regionId: string; relevantStyles: Record<string, string> }>;
  annotations: Array<{ regionId: string; userComment?: string; intendedChange?: string }>;
  expectedModifications: Array<{
    regionId: string;
    statement: string;
  }>;
  verificationRules: Array<{
    regionId: string;
    conditions: string[];
  }>;
  migration: {
    fromVersion: string;
    notes: string;
  };
}
