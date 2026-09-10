/**
 * Engine suite (2/3):
 *   CAP 21 — Smart snapshot compression
 *   CAP 25 — Change impact predictor
 *   CAP 26 — Safe mutation guard
 *   CAP 27 — DOM transaction journal (store + query)
 */

import { DOMSnapshot, VirtualDOMNode } from '../../types/dom-node';
import { flattenSnapshot, FlatElement } from '../session-access';
import { BaseEvent } from '../../types/events';

// ---------------------------------------------------------------------------
// CAP 21 — SMART SNAPSHOT COMPRESSION
// ---------------------------------------------------------------------------

export type SnapshotMode = 'MINIMAL' | 'SEMANTIC' | 'INTERACTION' | 'FORENSIC' | 'FULL';

const MODE_CONFIG: Record<SnapshotMode, { description: string; tags: string[] | null; attrs: string[] | null; textLimit: number; includeLayout: boolean; includeA11y: boolean }> = {
  MINIMAL: { description: 'Landmarks + headings only: the skeleton of the page (~5-10% of FULL size).', tags: ['main', 'header', 'footer', 'nav', 'section', 'article', 'aside', 'h1', 'h2', 'h3'], attrs: ['id'], textLimit: 60, includeLayout: false, includeA11y: false },
  SEMANTIC: { description: 'Semantic structure: landmarks, headings, lists, forms, images with names (~20% of FULL).', tags: null, attrs: ['id', 'class', 'role', 'aria-label', 'alt', 'title', 'type', 'name', 'value', 'for'], textLimit: 80, includeLayout: false, includeA11y: true },
  INTERACTION: { description: 'Interactive elements only: links, buttons, inputs, selects, textareas with names and values (~10-15%).', tags: ['a', 'button', 'input', 'select', 'textarea', 'label', 'form', 'option', 'summary', 'details'], attrs: ['id', 'name', 'type', 'value', 'placeholder', 'aria-label', 'role', 'disabled', 'checked', 'href'], textLimit: 40, includeLayout: false, includeA11y: true },
  FORENSIC: { description: 'Full structure with mutation-relevant details: attributes, text, style hints, a11y flags (~60-70%).', tags: null, attrs: null, textLimit: 120, includeLayout: true, includeA11y: true },
  FULL: { description: 'Everything the recorder captured — no filtering (100%).', tags: null, attrs: null, textLimit: Infinity, includeLayout: true, includeA11y: true },
};

export function smartSnapshot(input: { snapshot: DOMSnapshot; mode: SnapshotMode }): {
  mode: SnapshotMode;
  description: string;
  nodeCount: number;
  fullNodeCount: number;
  compressionRatio: number;
  estimatedTokens: number;
  nodes: Array<Record<string, unknown>>;
  usage: string;
} {
  const config = MODE_CONFIG[input.mode];
  const flat = flattenSnapshot(input.snapshot);
  const full = flat.elements;
  let nodes: FlatElement[];

  if (config.tags === null) {
    nodes = full;
  } else {
    const allowed = new Set(config.tags.map(t => t.toUpperCase()));
    nodes = full.filter(el => allowed.has(el.tagName.toUpperCase()));
  }

  const out = nodes.map(el => {
    const record: Record<string, unknown> = {
      tag: el.tagName,
    };
    // attributes whitelist
    if (el.attributes.id) record.id = el.attributes.id;
    if (config.attrs !== null) {
      for (const attr of config.attrs) {
        if (el.attributes[attr] !== undefined) record[attr] = el.attributes[attr];
      }
    } else {
      record.attributes = el.attributes;
    }
    // text
    const text = el.textContent.trim();
    if (text) record.text = text.length > config.textLimit ? text.slice(0, config.textLimit) + '…' : text;
    // structural position
    record.path = `${el.depth}:${el.childCount > 0 ? `${el.childCount} children` : 'leaf'}`;
    if (config.includeLayout) {
      record.style = el.attributes.style ? String(el.attributes.style).slice(0, 100) : undefined;
    }
    if (config.includeA11y) {
      const role = el.attributes.role || (el.tagName === 'a' ? 'link' : el.tagName === 'button' ? 'button' : el.tagName.startsWith('h') ? 'heading' : el.tagName === 'img' ? 'img' : undefined);
      if (role) record.role = role;
      if (el.attributes['aria-hidden']) record.hidden = true;
    }
    return record;
  });

  const serialize = (obj: unknown) => JSON.stringify(obj);
  const fullSize = full.length ? serialize(full.map(el => ({ ...el, attributes: el.attributes, textContent: el.textContent.slice(0, 200) }))).length : 1;
  const compressedSize = serialize(out).length;
  const compressionRatio = Number((compressedSize / fullSize).toFixed(3));
  const estimatedTokens = Math.ceil(compressedSize / 4); // ~4 chars/token heuristic

  return {
    mode: input.mode,
    description: config.description,
    nodeCount: out.length,
    fullNodeCount: full.length,
    compressionRatio,
    estimatedTokens,
    nodes: out.slice(0, 300),
    usage: input.mode === 'FULL'
      ? 'Full fidelity — use only when every attribute matters.'
      : `This mode returns ~${Math.round(compressionRatio * 100)}% of the FULL snapshot size. Prefer the smallest mode that answers your question (§39).`,
  };
}

/** Recommend the smallest mode for a question (§39 smart selection). */
export function recommendSnapshotMode(question: string): SnapshotMode {
  const q = question.toLowerCase();
  if (/structure|landmark|outline|overview|skeleton/.test(q)) return 'MINIMAL';
  if (/button|link|click|type|input|form|fill|interact|tab order/.test(q)) return 'INTERACTION';
  if (/role|a11y|accessib|semantic|name|label|heading/.test(q)) return 'SEMANTIC';
  if (/mutation|diff|change|style|layout|why|disappear|forensic|evidence/.test(q)) return 'FORENSIC';
  return 'SEMANTIC';
}

// ---------------------------------------------------------------------------
// CAP 25 — CHANGE IMPACT PREDICTOR
// ---------------------------------------------------------------------------

export interface ImpactPrediction {
  target: string;
  operation: string;
  affectedSubtreeSize: number;
  affectedElements: Array<{ selector: string; reason: string }>;
  selectorBreakage: Array<{ selector: string; risk: 'HIGH' | 'MEDIUM' | 'LOW'; reason: string }>;
  listenerImpact: { estimatedListenersOnSubtree: number; note: string };
  layoutImpact: { severity: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'; reasoning: string };
  a11yImpact: { severity: 'NONE' | 'LOW' | 'HIGH'; reasoning: string };
  formStateImpact: { affected: boolean; detail: string };
  overallRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
}

const DESTRUCTIVE_OPS = new Set(['set_outer_html', 'remove', 'set_inner_html', 'replace', 'remove_attribute']);

export function predictChangeImpact(input: {
  operation: string;
  selector: string;
  snapshot?: DOMSnapshot;
  storedSelectors?: string[]; // selectors that depend on this subtree (annotations, targets, recordings)
  listenersOnSubtree?: number;
}): ImpactPrediction {
  const flat = input.snapshot ? flattenSnapshot(input.snapshot) : null;
  const byId = flat ? flat.byId : new Map<number, FlatElement>();
  const elements = flat ? flat.elements : [];

  // locate target + subtree
  let target: FlatElement | undefined;
  if (flat && input.selector) {
    const clean = input.selector.replace(/^#/, '');
    target = elements.find(el => el.attributes.id === clean) || elements.find(el => `#${el.attributes.id}` === input.selector || el.tagName === input.selector.toLowerCase());
  }
  const subtreeIds = new Set<number>();
  if (target && flat) {
    const collect = (id: number) => {
      subtreeIds.add(id);
      const node: any = (input.snapshot!.nodes as any)[id];
      for (const c of node?.children || []) collect(c);
    };
    collect(target.id);
  }
  const subtree = elements.filter(el => subtreeIds.has(el.id));
  const affectedElements = subtree.slice(0, 25).map(el => ({ selector: el.attributes.id ? `#${el.attributes.id}` : el.tagName, reason: DESTRUCTIVE_OPS.has(input.operation) ? 'destroyed by the operation' : 'attribute/layout state changes' }));

  // selector breakage risk
  const stored = input.storedSelectors || [];
  const selectorBreakage = stored.map(sel => {
    const depends = subtree.some(el => sel.includes(el.attributes.id ? `#${el.attributes.id}` : el.tagName)) || (target && sel.includes(input.selector));
    return {
      selector: sel,
      risk: (DESTRUCTIVE_OPS.has(input.operation) && depends ? 'HIGH' : depends ? 'MEDIUM' : 'LOW') as 'HIGH' | 'MEDIUM' | 'LOW',
      reason: depends
        ? `References an element inside the affected subtree (${input.operation}).`
        : 'No dependency on the affected subtree detected.',
    };
  });

  // layout impact
  let layoutSeverity: ImpactPrediction['layoutImpact']['severity'] = 'NONE';
  let layoutReason = 'Read-only or attribute-scoped operation with no layout effect detected.';
  if (['set_style', 'add_class', 'remove_class', 'set_attribute'].includes(input.operation)) {
    layoutSeverity = 'MEDIUM';
    layoutReason = 'Style/class changes trigger reflow of the subtree and possibly siblings.';
  } else if (DESTRUCTIVE_OPS.has(input.operation)) {
    layoutSeverity = 'HIGH';
    layoutReason = `Subtree removal/replacement reflows ancestors and siblings (${subtree.length} descendant elements affected).`;
  } else if (input.operation === 'set_text' || input.operation === 'replace_text') {
    layoutSeverity = 'LOW';
    layoutReason = 'Text changes cause local reflow (line wrapping).';
  }

  // a11y impact
  const interactiveInSubtree = subtree.filter(el => /^(a|button|input|select|textarea|img)$/i.test(el.tagName));
  const a11ySeverity: ImpactPrediction['a11yImpact']['severity'] = DESTRUCTIVE_OPS.has(input.operation) && interactiveInSubtree.length > 0 ? 'HIGH' : interactiveInSubtree.length > 0 ? 'LOW' : 'NONE';
  const a11yReason = interactiveInSubtree.length > 0
    ? `${interactiveInSubtree.length} interactive element(s) in the subtree${DESTRUCTIVE_OPS.has(input.operation) ? ' will be REMOVED from the a11y tree' : ' may change semantics'}.`
    : 'No interactive elements in the affected subtree.';

  // form state
  const formFields = subtree.filter(el => /^(input|select|textarea)$/i.test(el.tagName));
  const formStateImpact = {
    affected: formFields.length > 0,
    detail: formFields.length > 0
      ? `${formFields.length} form field(s) in the subtree${DESTRUCTIVE_OPS.has(input.operation) ? ' — user input state WILL BE LOST (undo does not restore user-typed values).' : ' — values may be reset.'}`
      : 'No form fields in the affected subtree.',
  };

  const listeners: number = input.listenersOnSubtree ?? Math.round(subtree.length * 0.12); // recorded heuristic when instrumentation unavailable
  const overallRisk: ImpactPrediction['overallRisk'] =
    (DESTRUCTIVE_OPS.has(input.operation) && (subtree.length > 10 || formStateImpact.affected || interactiveInSubtree.length > 2))
      ? 'HIGH'
      : layoutSeverity === 'HIGH' || a11ySeverity === 'HIGH' ? 'HIGH'
      : layoutSeverity === 'MEDIUM' || subtree.length > 3 ? 'MEDIUM' : 'LOW';

  void byId;
  return {
    target: input.selector,
    operation: input.operation,
    affectedSubtreeSize: subtree.length,
    affectedElements,
    selectorBreakage,
    listenerImpact: {
      estimatedListenersOnSubtree: listeners,
      note: listeners > 0 ? 'Listeners attached inside the subtree will be orphaned by destructive operations (listener leak risk).' : 'No listeners expected on the subtree.',
    },
    layoutImpact: { severity: layoutSeverity, reasoning: layoutReason },
    a11yImpact: { severity: a11ySeverity, reasoning: a11yReason },
    formStateImpact,
    overallRisk,
    confidence: flat && target ? 0.85 : 0.5,
  };
}

// ---------------------------------------------------------------------------
// CAP 26 — SAFE MUTATION GUARD
// ---------------------------------------------------------------------------

export type GuardVerdict = 'SAFE' | 'CAUTION' | 'HIGH_RISK' | 'BLOCKED';

export function evaluateMutationGuard(input: {
  operation: string;
  selector: string;
  prediction: ImpactPrediction;
  requiresConfirmation?: boolean;
}): { verdict: GuardVerdict; reasons: string[]; conditions: string[]; reversible: boolean } {
  const reasons: string[] = [];
  const conditions: string[] = [];
  const p = input.prediction;

  // BLOCKED: hard guards — never silently pass
  if (/(document|html|body|head)\b/i.test(input.selector) && DESTRUCTIVE_OPS.has(input.operation)) {
    reasons.push(`Refusing to ${input.operation} the ${input.selector.match(/(document|html|body|head)/i)![0]} element — page-level structural destruction.`);
    return { verdict: 'BLOCKED', reasons, conditions: [], reversible: false };
  }
  if (p.formStateImpact.affected && input.operation === 'set_outer_html') {
    reasons.push(`set_outer_html destroys ${p.affectedSubtreeSize} nodes including form state — irreversible user-input loss.`);
    return { verdict: 'BLOCKED', reasons, conditions: ['Use surgical operations (set_attribute/set_text) instead, or export form values first.'], reversible: false };
  }

  let verdict: GuardVerdict = 'SAFE';
  if (DESTRUCTIVE_OPS.has(input.operation)) {
    verdict = p.affectedSubtreeSize > 20 ? 'HIGH_RISK' : 'CAUTION';
    reasons.push(`Destructive operation (${input.operation}) on a subtree of ${p.affectedSubtreeSize} element(s).`);
  }
  if (p.layoutImpact.severity === 'HIGH') { verdict = verdict === 'SAFE' ? 'CAUTION' : 'HIGH_RISK'; reasons.push(`Layout impact: ${p.layoutImpact.reasoning}`); }
  if (p.a11yImpact.severity === 'HIGH') { verdict = 'HIGH_RISK'; reasons.push(`Accessibility impact: ${p.a11yImpact.reasoning}`); }
  if (p.formStateImpact.affected && verdict === 'SAFE') { verdict = 'CAUTION'; reasons.push(p.formStateImpact.detail); }
  const highBreakage = p.selectorBreakage.filter(b => b.risk === 'HIGH');
  if (highBreakage.length > 0) {
    verdict = verdict === 'SAFE' ? 'CAUTION' : 'HIGH_RISK';
    reasons.push(`${highBreakage.length} stored selector(s) will break: ${highBreakage.map(b => b.selector).slice(0, 5).join(', ')}`);
  }
  if (p.listenerImpact.estimatedListenersOnSubtree > 3) {
    reasons.push(`${p.listenerImpact.estimatedListenersOnSubtree} listeners estimated on the subtree — orphan/leak risk.`);
    if (verdict === 'SAFE') verdict = 'CAUTION';
  }
  if (verdict === 'SAFE') reasons.push('Surgical, reversible operation with bounded subtree impact.');

  if (verdict === 'CAUTION' || verdict === 'HIGH_RISK') {
    conditions.push(
      'Wrap in a transaction: mutate_dom_transaction {mode:"begin"} → mutation → commit (rollback path guaranteed).',
      'Capture state first: capture_page_state — enables before/after verification via compare_page_states.',
      'Verify with get_mutation_history after the change.',
    );
  }

  return { verdict, reasons, conditions, reversible: !DESTRUCTIVE_OPS.has(input.operation) || input.operation !== 'set_outer_html' };
}

// ---------------------------------------------------------------------------
// CAP 27 — DOM TRANSACTION JOURNAL
// ---------------------------------------------------------------------------

export interface JournalEntry {
  transactionId: string;
  actor: string;
  intent: string;
  operation: string;
  target: string;
  before: { selector: string; htmlPreview: string; attributes: Record<string, string> | null };
  after: { selector: string; htmlPreview: string; attributes: Record<string, string> | null } | null;
  diff: string;
  evidence: string[];
  timestamp: number;
  rollbackInfo: { reversible: boolean; undoRecordAvailable: boolean; rollbackCommand?: string };
  outcome: 'COMMITTED' | 'ROLLED_BACK' | 'OPEN';
}

/**
 * In-process transaction journal. The mutation engine's transaction
 * flow (extended-tools-handler → DOM_MUTATE_TRANSACTION) appends
 * entries here; fx_transaction_journal queries them.
 */
export class TransactionJournalStore {
  private entries: JournalEntry[] = [];
  private counter = 0;

  append(entry: Omit<JournalEntry, 'transactionId' | 'timestamp'> & { transactionId?: string; timestamp?: number }): JournalEntry {
    const full: JournalEntry = {
      transactionId: entry.transactionId || `tx_${++this.counter}`,
      actor: entry.actor,
      intent: entry.intent,
      operation: entry.operation,
      target: entry.target,
      before: entry.before,
      after: entry.after ?? null,
      diff: entry.diff,
      evidence: entry.evidence,
      timestamp: entry.timestamp ?? Date.now(),
      rollbackInfo: entry.rollbackInfo,
      outcome: entry.outcome,
    };
    this.entries.push(full);
    if (this.entries.length > 500) this.entries.shift(); // bounded §24
    return full;
  }

  markOutcome(transactionId: string, outcome: 'COMMITTED' | 'ROLLED_BACK'): number {
    let count = 0;
    for (const e of this.entries) {
      if (e.transactionId === transactionId && e.outcome === 'OPEN') { e.outcome = outcome; count++; }
    }
    return count;
  }

  query(filter?: { transactionId?: string; operation?: string; since?: number; limit?: number }): { entries: JournalEntry[]; total: number } {
    let list = this.entries.slice();
    if (filter?.transactionId) list = list.filter(e => e.transactionId === filter.transactionId);
    if (filter?.operation) list = list.filter(e => e.operation === filter.operation);
    if (filter?.since !== undefined) list = list.filter(e => e.timestamp >= filter.since!);
    return { entries: list.slice(-(filter?.limit || 50)).reverse(), total: this.entries.length };
  }

  stats(): { total: number; committed: number; rolledBack: number; open: number } {
    const committed = this.entries.filter(e => e.outcome === 'COMMITTED').length;
    const rolledBack = this.entries.filter(e => e.outcome === 'ROLLED_BACK').length;
    return { total: this.entries.length, committed, rolledBack, open: this.entries.length - committed - rolledBack };
  }
}

export const transactionJournal = new TransactionJournalStore();

/** Build a journal entry from a mutation engine result (adapter). */
export function journalFromMutation(result: any, actor = 'mcp-agent'): Omit<JournalEntry, 'transactionId' | 'timestamp'> {
  const before = result?.before || {};
  const after = result?.after || null;
  const changed: string[] = [];
  if (before.attributes && after?.attributes) {
    for (const key of new Set([...Object.keys(before.attributes), ...Object.keys(after.attributes)])) {
      if (before.attributes[key] !== after.attributes[key]) changed.push(`${key}: ${before.attributes[key] ?? '∅'} → ${after.attributes[key] ?? '∅'}`);
    }
  }
  if (before.textContent !== undefined && after?.textContent !== undefined && before.textContent !== after.textContent) {
    changed.push(`text: "${String(before.textContent).slice(0, 40)}" → "${String(after.textContent).slice(0, 40)}"`);
  }
  return {
    actor,
    intent: String(result?.intent || result?.operation || 'unspecified'),
    operation: String(result?.operation || 'unknown'),
    target: String(before.selector || result?.selector || 'unknown'),
    before: { selector: String(before.selector || '?'), htmlPreview: String(before.html || before.outerHTML || '').slice(0, 200), attributes: before.attributes || null },
    after: after ? { selector: String(after.selector || before.selector || '?'), htmlPreview: String(after.html || after.outerHTML || '').slice(0, 200), attributes: after.attributes || null } : null,
    diff: changed.length ? changed.join('; ') : (result?.success ? 'no property-level diff detected' : String(result?.error || 'operation failed')),
    evidence: [
      result?.undoRecord ? `undo record available (${result.undoRecord.operation || 'undo'})` : 'no undo record (transaction-internal rollback only)',
      result?.mutationId ? `mutation id ${result.mutationId}` : 'mutation id unavailable',
    ],
    rollbackInfo: {
      reversible: !!result?.undoRecord,
      undoRecordAvailable: !!result?.undoRecord,
      rollbackCommand: result?.undoRecord ? 'undo_dom_mutation (or mutate_dom_transaction {mode:"rollback"})' : 'mutate_dom_transaction {mode:"rollback"}',
    },
    outcome: result?.transactionId ? 'OPEN' : 'COMMITTED',
  };
}

/** Append a mutation-engine result to the journal (best-effort, CAP 27). */
export function journalMutationResult(result: any, actor = 'mcp-agent'): JournalEntry | null {
  try {
    const entry = journalFromMutation(result, actor);
    const stored = transactionJournal.append({ ...entry, transactionId: result?.transactionId });
    if (result?.transactionId) {
      transactionJournal.markOutcome(String(result.transactionId), result?.committed === true ? 'COMMITTED' : 'ROLLED_BACK');
    } else {
      transactionJournal.markOutcome(stored.transactionId, 'COMMITTED');
    }
    return stored;
  } catch {
    return null; // journal isolation (§24)
  }
}

void (undefined as unknown as VirtualDOMNode);
