/**
 * Engine suite (3/3):
 *   CAP 28 — Multi-page session graph
 *   CAP 30 — Agent incident report generator
 *   CAP 23/24 — Forensic session export/import (deterministic format)
 */

import { BaseEvent } from '../../types/events';
import { SessionMetadata } from '../../types/session';
import { EvidenceBuilder, confidenceBand, EvidenceFinding } from '../evidence-model';
import { PageHealthResult } from './health-planner-search';

// ---------------------------------------------------------------------------
// CAP 28 — MULTI-PAGE SESSION GRAPH
// ---------------------------------------------------------------------------

export interface SessionGraphNode {
  id: string;
  kind: 'page' | 'frame' | 'navigation' | 'request' | 'interaction' | 'screenshot' | 'dom-state' | 'popup';
  label: string;
  timestamp?: number;
  meta?: Record<string, unknown>;
}

export interface SessionGraphEdge {
  from: string;
  to: string;
  relation: string;
}

export function buildSessionGraph(input: {
  session: SessionMetadata;
  events: BaseEvent[];
  livePages?: Array<{ pageId: string; url: string; tabId?: number; title?: string; frames?: number; navigations?: number }>;
}): { nodes: SessionGraphNode[]; edges: SessionGraphEdge[]; summary: { pages: number; navigations: number; requests: number; interactions: number; screenshots: number; domStates: number }; } {
  const nodes: SessionGraphNode[] = [];
  const edges: SessionGraphEdge[] = [];

  // session root
  const rootId = `session:${input.session.id}`;
  nodes.push({ id: rootId, kind: 'page', label: `Session ${input.session.id} (${input.session.url})`, meta: { url: input.session.url, title: input.session.title } });

  // recorded page (the session's own page)
  const recordedPageId = 'page:recorded';
  nodes.push({ id: recordedPageId, kind: 'page', label: input.session.url, meta: { url: input.session.url, title: input.session.title, recorded: true } });
  edges.push({ from: rootId, to: recordedPageId, relation: 'recorded' });

  // live pages from the unified runtime (multi-tab workflows)
  for (const p of input.livePages || []) {
    const pid = `page:${p.pageId}`;
    nodes.push({ id: pid, kind: 'page', label: p.url, meta: { tabId: p.tabId, title: p.title, frames: p.frames, navigations: p.navigations } });
    edges.push({ from: rootId, to: pid, relation: 'open-tab' });
    for (let f = 0; f < (p.frames || 1) - 1; f++) {
      const fid = `frame:${p.pageId}:${f}`;
      nodes.push({ id: fid, kind: 'frame', label: `frame ${f + 1} of ${p.url}` });
      edges.push({ from: pid, to: fid, relation: 'contains-frame' });
    }
  }

  // navigations
  for (const e of input.events.filter(e => e.category === 'NAVIGATION').slice(0, 30)) {
    const nid = `nav:${e.id}`;
    nodes.push({ id: nid, kind: 'navigation', label: `${e.type} ${String((e.payload as any).url || '')}`, timestamp: e.timestamp });
    edges.push({ from: recordedPageId, to: nid, relation: 'navigation' });
  }

  // requests, interactions, screenshots, dom states
  let requests = 0, interactions = 0, screenshots = 0, domStates = 0;
  for (const e of input.events) {
    if (e.category === 'NETWORK') {
      requests++;
      if (nodes.length < 400) {
        const nid = `req:${e.id}`;
        nodes.push({ id: nid, kind: 'request', label: String((e.payload as any).url || e.type), timestamp: e.timestamp, meta: { type: e.type, status: (e.payload as any).status } });
        edges.push({ from: recordedPageId, to: nid, relation: 'request' });
      }
    } else if (e.category === 'USER') {
      interactions++;
      if (nodes.length < 400) {
        const nid = `act:${e.id}`;
        nodes.push({ id: nid, kind: 'interaction', label: `${e.type} ${e.targetSelector || ''}`.trim(), timestamp: e.timestamp });
        edges.push({ from: recordedPageId, to: nid, relation: 'interaction' });
      }
    } else if (e.category === 'SCREENSHOT') {
      screenshots++;
      const nid = `shot:${e.id}`;
      nodes.push({ id: nid, kind: 'screenshot', label: `screenshot t=${e.timestamp}ms`, timestamp: e.timestamp });
      edges.push({ from: recordedPageId, to: nid, relation: 'visual-evidence' });
    } else if (e.type === 'DOM_SNAPSHOT') {
      domStates++;
      const nid = `dom:${e.id}`;
      nodes.push({ id: nid, kind: 'dom-state', label: `DOM state t=${e.timestamp}ms`, timestamp: e.timestamp });
      edges.push({ from: recordedPageId, to: nid, relation: 'dom-state' });
    }
  }

  // causal edges: interaction → request within 1s; request → mutation within 1s (popup/workflow reasoning)
  const interactionsList = input.events.filter(e => e.category === 'USER');
  const requestsList = input.events.filter(e => e.category === 'NETWORK');
  for (const act of interactionsList) {
    for (const req of requestsList) {
      if (req.timestamp >= act.timestamp && req.timestamp - act.timestamp <= 1000) {
        edges.push({ from: `act:${act.id}`, to: `req:${req.id}`, relation: 'triggered-request' });
        break;
      }
    }
  }

  return {
    nodes: nodes.slice(0, 500),
    edges: edges.slice(0, 800),
    summary: { pages: 1 + (input.livePages?.length || 0), navigations: input.events.filter(e => e.category === 'NAVIGATION').length, requests, interactions, screenshots, domStates },
  };
}

// ---------------------------------------------------------------------------
// CAP 30 — AGENT INCIDENT REPORT GENERATOR
// ---------------------------------------------------------------------------

export interface IncidentReport {
  formatVersion: '1.0.0';
  generatedAt: number;
  sessionId: string;
  incidentSummary: string;
  detectedIssue: { issue: string; severity: string; firstObservedAt: number | null };
  timeline: Array<{ timestamp: number; domain: string; summary: string }>;
  rootCause: { conclusion: string; confidence: number; band: string } | null;
  supportingEvidence: Array<{ source: string; description: string; ref?: string }>;
  affectedDom: Array<{ selector: string; nodeId?: number; detail: string }>;
  affectedRequests: Array<{ url: string; status?: number; detail: string }>;
  affectedComponents: string[];
  performanceImpact: string;
  accessibilityImpact: string;
  recommendedRemediation: string[];
  validationSteps: string[];
  confidence: { overall: number; band: string; evidenceCount: number; evidenceTypes: string[] };
  markdown: string;
}

export function generateIncidentReport(input: {
  session: SessionMetadata;
  events: BaseEvent[];
  health?: PageHealthResult;
  rootCause?: { conclusion: string; confidence: number; band: string };
  findings?: EvidenceFinding[];
  detectedIssue?: string;
}): IncidentReport {
  const events = input.events;
  const health = input.health;
  const detectedIssue = input.detectedIssue || input.rootCause?.conclusion || 'Unspecified incident (derived from session evidence)';

  // timeline: significant events only (errors, failed requests, removals, navigations)
  const significant = events.filter(e =>
    e.category === 'ERROR' ||
    e.type === 'NETWORK_REQUEST_FAILED' ||
    Number((e.payload as any).status ?? 0) >= 400 ||
    e.type === 'DOM_MUTATION_REMOVE' && Number((e.payload as any).removedSubtreeNodeCount ?? 0) > 0 ||
    e.category === 'NAVIGATION');
  const timeline = significant.slice(0, 40).map(e => ({ timestamp: e.timestamp, domain: e.category, summary: `${e.type} ${e.targetSelector || ''} ${JSON.stringify(e.payload).slice(0, 90)}`.trim() }));

  const failedRequests = events.filter(e => e.type === 'NETWORK_REQUEST_FAILED' || Number((e.payload as any).status ?? 0) >= 400);
  const removals = events.filter(e => e.type === 'DOM_MUTATION_REMOVE');

  const affectedDom = removals.slice(0, 12).map(e => ({
    selector: String(e.targetSelector || (e.payload as any).selectorHint || `node=${(e.payload as any).nodeId}`),
    nodeId: (e.payload as any).nodeId,
    detail: `Removed at t=${e.timestamp}ms with ${Number((e.payload as any).removedSubtreeNodeCount ?? 0)} descendant nodes.`,
  }));

  const affectedRequests = failedRequests.slice(0, 12).map(e => ({
    url: String((e.payload as any).url || '?'),
    status: (e.payload as any).status !== undefined ? Number((e.payload as any).status) : undefined,
    detail: e.type === 'NETWORK_REQUEST_FAILED' ? `Request failed at t=${e.timestamp}ms: ${String((e.payload as any).error || 'network error')}` : `HTTP ${String((e.payload as any).status)} at t=${e.timestamp}ms`,
  }));

  const affectedComponents = Array.from(new Set(removals.map(e => String(e.targetSelector || (e.payload as any).selectorHint || '')).filter(Boolean))).slice(0, 10);

  // aggregate evidence from findings or build from raw events
  const evidence: IncidentReport['supportingEvidence'] = [];
  let rootFinding: EvidenceFinding | null = null;
  if (input.findings && input.findings.length > 0) {
    rootFinding = input.findings.reduce((best, f) => (f.confidence > best.confidence ? f : best));
    for (const f of input.findings) {
      for (const item of f.evidence.slice(0, 4)) evidence.push({ source: item.source, description: item.description, ref: item.ref });
    }
  } else {
    for (const e of significant.slice(0, 10)) {
      evidence.push({ source: e.category === 'DOM' ? 'MUTATION_RECORD' : e.category === 'NETWORK' ? 'NETWORK_CORRELATION' : e.category === 'ERROR' || e.category === 'CONSOLE' ? 'CONSOLE_EVIDENCE' : 'DOM_OBSERVATION', description: `${e.type}: ${JSON.stringify(e.payload).slice(0, 90)}`, ref: e.id });
    }
    const builder = new EvidenceBuilder(input.rootCause?.conclusion || detectedIssue, 'Incident report aggregation (CAP 30)');
    for (const ev of evidence.slice(0, 6)) {
      builder.add(ev.source as any, ev.description, ev.ref);
    }
    rootFinding = builder.build();
  }

  const remediation: string[] = [];
  if (affectedRequests.length > 0) remediation.push(`Fix the failing endpoint(s): ${affectedRequests.slice(0, 3).map(r => r.url).join(', ')} — check status codes, payloads and error handling in the calling code.`);
  if (affectedDom.length > 0) remediation.push(`Stabilize the unmounting component(s): ${affectedComponents.slice(0, 3).join(', ') || affectedDom[0].selector} — guard the render path against the triggering condition.`);
  if (health) {
    for (const s of health.subscores) {
      if (s.status === 'CRITICAL') remediation.push(`Address the ${s.key} deficit (score ${s.score}/100): ${s.detail}`);
    }
  }
  if (remediation.length === 0) remediation.push('No actionable deficit found — add more evidence via fx_cross_signal_search or record a longer session.');

  const validationSteps = [
    'Re-run the scenario with recording active (verify the trigger reproduces).',
    'Apply the remediation; then use fx_dom_regression_diff to confirm the UI state is stable across the same interaction.',
    'Confirm no regressions: fx_page_health subscores should return to HEALTHY.',
  ];

  const confidence = rootFinding ? rootFinding.confidence : 0.2;
  const overall: EvidenceFinding = rootFinding ?? new EvidenceBuilder('Insufficient evidence', 'fallback').build();

  const report: IncidentReport = {
    formatVersion: '1.0.0',
    generatedAt: Date.now(),
    sessionId: input.session.id,
    incidentSummary: `${detectedIssue} — investigated over ${events.length} recorded events on ${input.session.url}.`,
    detectedIssue: {
      issue: detectedIssue,
      severity: affectedRequests.length > 0 || affectedDom.length > 0 ? 'HIGH' : 'MEDIUM',
      firstObservedAt: significant[0]?.timestamp ?? null,
    },
    timeline,
    rootCause: input.rootCause || (rootFinding ? { conclusion: rootFinding.conclusion, confidence: rootFinding.confidence, band: rootFinding.band } : null),
    supportingEvidence: evidence.slice(0, 20),
    affectedDom,
    affectedRequests,
    affectedComponents,
    performanceImpact: health
      ? `Performance subscore ${health.subscores.find(s => s.key === 'performance')?.score ?? 'n/a'}/100; layout stability ${health.subscores.find(s => s.key === 'layout-stability')?.score ?? 'n/a'}/100.`
      : 'Performance analysis not run (pass health data for quantified impact).',
    accessibilityImpact: health
      ? `Accessibility subscore ${health.subscores.find(s => s.key === 'accessibility')?.score ?? 'n/a'}/100 (${health.subscores.find(s => s.key === 'accessibility')?.detail ?? 'n/a'}).`
      : 'Accessibility analysis not run.',
    recommendedRemediation: remediation.slice(0, 6),
    validationSteps,
    confidence: {
      overall: Number(confidence.toFixed(3)),
      band: confidenceBand(confidence),
      evidenceCount: overall.evidenceCount,
      evidenceTypes: overall.evidenceTypes as unknown as string[],
    },
    markdown: '',
  };

  report.markdown = renderMarkdown(report);
  return report;
}

function renderMarkdown(report: IncidentReport): string {
  const lines: string[] = [];
  lines.push(`# Incident Report — ${report.sessionId}`);
  lines.push('');
  lines.push(`**Generated**: ${new Date(report.generatedAt).toISOString()}`);
  lines.push(`**Issue**: ${report.detectedIssue.issue} (severity: ${report.detectedIssue.severity})`);
  lines.push('');
  lines.push('## Summary');
  lines.push(report.incidentSummary);
  lines.push('');
  if (report.rootCause) {
    lines.push('## Root Cause');
    lines.push(`${report.rootCause.conclusion} (confidence: ${report.rootCause.confidence} — ${report.rootCause.band})`);
    lines.push('');
  }
  lines.push('## Timeline');
  for (const t of report.timeline.slice(0, 15)) lines.push(`- t=${t.timestamp}ms [${t.domain}] ${t.summary}`);
  lines.push('');
  lines.push('## Affected DOM');
  for (const d of report.affectedDom.slice(0, 8)) lines.push(`- \`${d.selector}\` — ${d.detail}`);
  if (report.affectedDom.length === 0) lines.push('- None recorded');
  lines.push('');
  lines.push('## Affected Requests');
  for (const r of report.affectedRequests.slice(0, 8)) lines.push(`- \`${r.url}\` — ${r.detail}`);
  if (report.affectedRequests.length === 0) lines.push('- None recorded');
  lines.push('');
  lines.push('## Recommended Remediation');
  for (const r of report.recommendedRemediation) lines.push(`1. ${r}`);
  lines.push('');
  lines.push('## Validation Steps');
  for (const v of report.validationSteps) lines.push(`1. ${v}`);
  lines.push('');
  lines.push(`**Overall confidence**: ${report.confidence.overall} (${report.confidence.band}) from ${report.confidence.evidenceCount} evidence items across ${report.confidence.evidenceTypes.length} source types.`);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// CAP 23 / 24 — FORENSIC SESSION EXPORT / IMPORT (deterministic format)
// ---------------------------------------------------------------------------

import { createHash } from 'crypto';

export interface ForensicExportBundle {
  format: 'mcpdom-forensic-investigation';
  formatVersion: '1.0.0';
  exportedAt: number;
  session: SessionMetadata;
  timeline: Array<{ timestamp: number; domain: string; type: string; summary: string }>;
  evidence: Array<{ source: string; description: string; ref?: string }>;
  findings: EvidenceFinding[];
  health?: PageHealthResult;
  incidentReport?: IncidentReport;
  contentHash: string;
}

/** Deterministic export: stable ordering + content hash for tamper evidence. */
export function buildForensicExport(input: {
  session: SessionMetadata;
  events: BaseEvent[];
  findings: EvidenceFinding[];
  health?: PageHealthResult;
  incidentReport?: IncidentReport;
}): ForensicExportBundle {
  const timeline = input.events
    .map(e => ({ timestamp: e.timestamp, domain: e.category, type: e.type, summary: `${e.type} ${e.targetSelector || ''} ${JSON.stringify(e.payload).slice(0, 80)}`.trim() }))
    .sort((a, b) => a.timestamp - b.timestamp || a.type.localeCompare(b.type));
  const evidence = input.findings.flatMap(f => f.evidence.map(item => ({ source: item.source, description: item.description, ref: item.ref })))
    .sort((a, b) => (a.ref || '').localeCompare(b.ref || ''));
  const findings = input.findings.map(f => ({ ...f, evidence: f.evidence.slice().sort((a, b) => (a.ref || '').localeCompare(b.ref || '')) }));

  const bundle: ForensicExportBundle = {
    format: 'mcpdom-forensic-investigation',
    formatVersion: '1.0.0',
    exportedAt: Date.now(),
    session: input.session,
    timeline: timeline.slice(0, 2000),
    evidence,
    findings,
    health: input.health,
    incidentReport: input.incidentReport,
    contentHash: '',
  };
  bundle.contentHash = createHash('sha256').update(JSON.stringify({ timeline: bundle.timeline, evidence: bundle.evidence, findings: bundle.findings, sessionId: input.session.id })).digest('hex');
  return bundle;
}

/** Validate + verify import integrity. Historical evidence only (§24: never live state). */
export function verifyForensicImport(bundle: unknown): { valid: boolean; errors: string[]; bundle: ForensicExportBundle | null } {
  const errors: string[] = [];
  const b = bundle as Partial<ForensicExportBundle>;
  if (!b || typeof b !== 'object') errors.push('Bundle is not an object.');
  else {
    if (b.format !== 'mcpdom-forensic-investigation') errors.push(`format must be 'mcpdom-forensic-investigation' (got '${b.format}').`);
    if (b.formatVersion !== '1.0.0') errors.push(`formatVersion 1.0.0 expected (got '${b.formatVersion}').`);
    if (!b.session?.id) errors.push('session.id is missing.');
    if (!Array.isArray(b.timeline)) errors.push('timeline array is missing.');
    if (!Array.isArray(b.findings)) errors.push('findings array is missing.');
    if (b.contentHash) {
      const recomputed = createHash('sha256').update(JSON.stringify({ timeline: b.timeline, evidence: b.evidence, findings: b.findings, sessionId: b.session?.id })).digest('hex');
      if (recomputed !== b.contentHash) errors.push('contentHash mismatch — bundle was modified after export.');
    } else {
      errors.push('contentHash is missing.');
    }
  }
  return { valid: errors.length === 0, errors, bundle: errors.length === 0 ? (b as ForensicExportBundle) : null };
}
