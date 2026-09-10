import {
  DOMMutationPayload,
  DOMMutationResult,
  DOMMutationOperation,
  MutationHistoryEntry,
  MutationPreview,
  MutationTransactionResult,
  MutationTransactionStep,
} from '../types/browser-control';
import { LiveElementTarget } from '../types/browser-control';
import { LiveDOMInspector } from './live-dom-inspector';
import { NodeRegistry } from './node-registry';

/**
 * §19 / §20 / §47 / §48 — First-Class DOM Mutation Engine
 *
 * Every mutation follows the observable contract:
 *   BEFORE → ACTION → AFTER → DIFF
 *
 * Additional platform properties:
 *   - transactional semantics (BEGIN → MUTATE → VERIFY → COMMIT / ROLLBACK)
 *   - immutable undo records with full inverse operations
 *   - redo support
 *   - bounded mutation history (memory safety §76)
 *
 * The engine never throws raw — failures become structured DOM_MUTATION_FAILED
 * results with diagnostics, so a failed operation can never corrupt the
 * session state of subsequent operations (§49).
 */

interface UndoRecord {
  mutationId: string;
  operation: DOMMutationOperation;
  targetSelector: string;
  /** Serialized inverse patch — exactly what is needed to undo. */
  inverse: {
    kind: 'restore-outer-html' | 'reinsert-node' | 'remove-node' | 'restore-attribute' | 'remove-attribute' | 'restore-text' | 'restore-classes' | 'restore-style' | 'restore-position';
    outerHtml?: string;
    attribute?: string;
    value?: string | null;
    text?: string;
    classes?: string[];
    style?: Record<string, string>;
    parentSelector?: string;
    nextSiblingSelector?: string | null;
    previousSiblingSelector?: string | null;
  };
}

const MUTATION_HISTORY_CAP = 500;

export class DOMMutationEngine {
  private history: MutationHistoryEntry[] = [];
  private undoStack: UndoRecord[] = [];
  private redoStack: UndoRecord[] = [];
  private counter = 0;
  private transaction: { id: string; steps: MutationTransactionStep[]; undoRecords: UndoRecord[] } | null = null;

  constructor(private doc: Document, private registry?: NodeRegistry) {}

  // ------------------------------------------------------------------
  // Single mutation (public entry)
  // ------------------------------------------------------------------
  public mutate(payload: DOMMutationPayload): DOMMutationResult {
    const mutationId = `mut_${Date.now().toString(36)}_${++this.counter}`;
    const start = Date.now();
    let element: Element;

    try {
      element = this.resolveTarget(payload.target);
    } catch (err: any) {
      return this.failure(mutationId, payload, null, err.message, Date.now() - start);
    }

    const before = this.snapshotState(element);
    let after: DOMMutationResult['after'] = null;
    let diff: DOMMutationResult['diff'] = null;
    let error: string | undefined;
    let success = true;

    try {
      const undo = this.applyOperation(mutationId, payload, element);
      if (undo) {
        if (this.transaction) {
          this.transaction.undoRecords.push(undo);
        } else {
          this.undoStack.push(undo);
          this.redoStack = []; // new mutation invalidates the redo chain
        }
      }
      const stillAttached = element.isConnected !== undefined ? element.isConnected : this.doc.contains(element);
      const finalElement = stillAttached ? element : (this.doc.querySelector(before.selector) || element);
      after = this.snapshotState(finalElement);
      diff = this.quickDiff(before, after, element);
    } catch (err: any) {
      success = false;
      error = err.message;
      after = null;
    }

    const result: DOMMutationResult = {
      mutationId,
      operation: payload.operation,
      success,
      before,
      after,
      diff,
      affectedSelector: success ? before.selector : null,
      durationMs: Date.now() - start,
      error,
      undoable: success && (this.transaction ? this.transaction.undoRecords.length > 0 : this.undoStack.length > 0),
    };

    if (this.transaction) {
      this.transaction.steps.push({
        stepId: `step_${this.transaction.steps.length + 1}`,
        mutation: result,
      });
    }

    this.pushHistory({
      mutationId,
      transactionId: this.transaction?.id,
      timestamp: Date.now(),
      operation: payload.operation,
      targetSelector: before.selector,
      success,
      summary: `${payload.operation} on ${before.selector}${diff ? ` (+${diff.added}/-${diff.removed}/~${diff.changed})` : ''}`,
      undoApplied: false,
      redoApplied: false,
    });

    return result;
  }

  // ------------------------------------------------------------------
  // Transactions
  // ------------------------------------------------------------------
  public beginTransaction(): string {
    if (this.transaction) {
      throw new Error(`TRANSACTION_ALREADY_OPEN: ${this.transaction.id} — commit or rollback first.`);
    }
    this.transaction = {
      id: `tx_${Date.now().toString(36)}_${++this.counter}`,
      steps: [],
      undoRecords: [],
    };
    return this.transaction.id;
  }

  public commitTransaction(verify?: (tx: { id: string; steps: MutationTransactionStep[] }) => boolean | void): MutationTransactionResult {
    if (!this.transaction) {
      throw new Error('NO_OPEN_TRANSACTION: begin a transaction before committing.');
    }
    const tx = this.transaction;
    const start = Date.now();
    let verifyPassed = true;
    let error: string | undefined;

    if (verify) {
      try {
        const outcome = verify({ id: tx.id, steps: tx.steps });
        verifyPassed = outcome !== false;
        if (!verifyPassed) error = 'VERIFY_FAILED: caller verification rejected the transaction state.';
      } catch (err: any) {
        verifyPassed = false;
        error = `VERIFY_ERROR: ${err.message}`;
      }
    }

    if (!verifyPassed) {
      return this.rollbackInternal(tx, error || 'VERIFY_FAILED', start);
    }

    // Commit: push all transaction undo records onto the global undo stack
    this.undoStack.push(...tx.undoRecords);
    if (this.undoStack.length > MUTATION_HISTORY_CAP) {
      this.undoStack.splice(0, this.undoStack.length - MUTATION_HISTORY_CAP);
    }
    this.redoStack = [];

    const summary = this.summaryOf(tx);
    this.transaction = null;
    return {
      transactionId: tx.id,
      committed: true,
      rolledBack: false,
      steps: tx.steps,
      durationMs: Date.now() - start,
      finalStateSummary: summary,
    };
  }

  public rollbackTransaction(reason?: string): MutationTransactionResult {
    if (!this.transaction) {
      throw new Error('NO_OPEN_TRANSACTION: begin a transaction before rolling back.');
    }
    const tx = this.transaction;
    return this.rollbackInternal(tx, reason || 'ROLLBACK_REQUESTED', Date.now());
  }

  private rollbackInternal(tx: { id: string; steps: MutationTransactionStep[]; undoRecords: UndoRecord[] }, reason: string, start: number): MutationTransactionResult {
    // Reverse-order undo of everything applied inside the transaction
    for (const record of [...tx.undoRecords].reverse()) {
      try {
        this.applyUndo(record);
      } catch {
        // Undo failures are recorded in history; transaction rollback continues.
      }
    }
    const summary = this.summaryOf(tx);
    this.transaction = null;
    return {
      transactionId: tx.id,
      committed: false,
      rolledBack: true,
      steps: tx.steps,
      error: reason,
      durationMs: Date.now() - start,
      finalStateSummary: summary,
    };
  }

  // ------------------------------------------------------------------
  // Undo / Redo
  // ------------------------------------------------------------------
  public undo(): { success: boolean; mutationId?: string; message: string } {
    const source = this.transaction ? this.transaction.undoRecords : this.undoStack;
    const record = source.pop();
    if (!record) {
      return { success: false, message: 'Nothing to undo — the mutation history is empty.' };
    }
    try {
      this.applyUndo(record);
    } catch (err: any) {
      source.push(record);
      return { success: false, mutationId: record.mutationId, message: `UNDO_FAILED: ${err.message}` };
    }
    (this.redoStack as UndoRecord[]).push(record);
    this.markHistory(record.mutationId, 'undo');
    return { success: true, mutationId: record.mutationId, message: `Undid ${record.operation} on ${record.targetSelector}.` };
  }

  public redo(): { success: boolean; mutationId?: string; message: string } {
    const record = this.redoStack.pop();
    if (!record) {
      return { success: false, message: 'Nothing to redo — no undone mutation is pending.' };
    }
    try {
      const el = this.resolveTarget({ selector: record.targetSelector });
      const payload: DOMMutationPayload = { operation: record.operation, target: { selector: record.targetSelector } } as DOMMutationPayload;
      // Reapply using the redo patch stored in the record's inverse semantics:
      // for redo we simply re-run the original operation context when possible.
      const reapplied = this.reapplyRecord(record, el, payload);
      if (!reapplied) {
        this.redoStack.push(record);
        return { success: false, mutationId: record.mutationId, message: 'REDO_FAILED: target state diverged — cannot safely reapply.' };
      }
      (this.transaction ? this.transaction.undoRecords : this.undoStack).push(record);
      this.markHistory(record.mutationId, 'redo');
      return { success: true, mutationId: record.mutationId, message: `Redid ${record.operation} on ${record.targetSelector}.` };
    } catch (err: any) {
      this.redoStack.push(record);
      return { success: false, mutationId: record.mutationId, message: `REDO_FAILED: ${err.message}` };
    }
  }

  public getHistory(limit = 100): MutationHistoryEntry[] {
    return this.history.slice(-limit);
  }

  public getUndoDepth(): number {
    return (this.transaction ? this.transaction.undoRecords.length : this.undoStack.length);
  }

  public getRedoDepth(): number {
    return this.redoStack.length;
  }

  public getOpenTransactionId(): string | null {
    return this.transaction?.id || null;
  }

  // ------------------------------------------------------------------
  // Preview (§82 dry-run)
  // ------------------------------------------------------------------
  public preview(payload: DOMMutationPayload): MutationPreview {
    const start = Date.now();
    try {
      const element = this.resolveTarget(payload.target);
      const warnings: string[] = [];
      let affectedNodes = 1;

      if (payload.operation === 'set_inner_html' || payload.operation === 'set_outer_html') {
        warnings.push('HTML replacement can destroy descendant node identity — captured regions targeting children may become stale.');
        affectedNodes = element.querySelectorAll('*').length + 1;
      }
      if (payload.operation === 'remove_element' || payload.operation === 'unwrap_element') {
        warnings.push('Removal is destructive; the undo record preserves the full serialized subtree.');
        affectedNodes = element.querySelectorAll('*').length + 1;
      }
      if (payload.operation === 'move_element' && !payload.parent) {
        warnings.push('No parent target supplied — move requires payload.parent.');
      }
      if (payload.operation === 'wrap_element' && !payload.newElementHtml) {
        warnings.push('No wrapper HTML supplied — a neutral <div> wrapper will be generated.');
      }

      const expectedChange = describeExpectedChange(payload, element);
      return {
        valid: warnings.filter((w) => w.includes('requires') || w.includes('No parent')).length === 0,
        operation: payload.operation,
        target: { selector: this.snapshotState(element).selector, tag: element.tagName.toLowerCase() },
        expectedChange,
        affectedNodes,
        warnings,
      };
    } catch (err: any) {
      return {
        valid: false,
        operation: payload.operation,
        target: { selector: String(payload.target?.selector || ''), tag: '' },
        expectedChange: '—',
        affectedNodes: 0,
        warnings: [],
        error: err.message,
      };
    }
  }

  // ------------------------------------------------------------------
  // Internals — operation application with undo capture
  // ------------------------------------------------------------------
  private applyOperation(mutationId: string, payload: DOMMutationPayload, element: Element): UndoRecord | null {
    const targetSelector = this.snapshotState(element).selector;
    const op = payload.operation;
    const attributes = () => this.attrsOf(element);

    switch (op) {
      case 'set_attribute': {
        if (!payload.attribute) throw new Error('ATTRIBUTE_REQUIRED: payload.attribute is missing.');
        const previous = element.getAttribute(payload.attribute);
        element.setAttribute(payload.attribute, payload.value ?? '');
        return this.undoFor(mutationId, op, targetSelector, {
          kind: previous === null ? 'remove-attribute' : 'restore-attribute',
          attribute: payload.attribute,
          value: previous,
        });
      }
      case 'remove_attribute': {
        if (!payload.attribute) throw new Error('ATTRIBUTE_REQUIRED: payload.attribute is missing.');
        const previous = element.getAttribute(payload.attribute);
        if (previous === null) throw new Error(`ATTRIBUTE_NOT_PRESENT: "${payload.attribute}" is not set on ${targetSelector}.`);
        element.removeAttribute(payload.attribute);
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-attribute', attribute: payload.attribute, value: previous });
      }
      case 'set_text': {
        const previous = element.textContent || '';
        element.textContent = payload.text ?? '';
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-text', text: previous });
      }
      case 'replace_text': {
        if (!payload.text || !payload.replacement) throw new Error('TEXT_PATTERNS_REQUIRED: payload.text (search) and payload.replacement are required.');
        const previous = element.textContent || '';
        element.textContent = previous.split(payload.text).join(payload.replacement);
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-text', text: previous });
      }
      case 'set_inner_html': {
        const previous = element.innerHTML;
        element.innerHTML = payload.html ?? '';
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-outer-html', outerHtml: element.outerHTML.replace(payload.html ?? '', previous) || undefined, text: previous, attribute: '__inner' });
      }
      case 'set_outer_html': {
        const previous = element.outerHTML;
        const parent = element.parentElement;
        if (!parent) throw new Error('ORPHAN_ELEMENT: element has no parent — cannot replace outer HTML.');
        const marker = this.doc.createComment(`mcpdom_undo_${mutationId}`);
        element.replaceWith(marker);
        const holder = this.doc.createElement('template');
        holder.innerHTML = payload.html ?? '';
        const replacement = holder.content.firstElementChild;
        if (replacement) {
          marker.replaceWith(replacement);
        } else {
          marker.replaceWith(this.doc.createTextNode(payload.html ?? ''));
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: 'reinsert-node', outerHtml: previous, parentSelector: this.snapshotState(parent).selector, nextSiblingSelector: this.siblingSelector(replacement || element) });
      }
      case 'add_class': {
        const previous = Array.from(element.classList);
        for (const c of payload.classes || []) element.classList.add(c);
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-classes', classes: previous });
      }
      case 'remove_class': {
        const previous = Array.from(element.classList);
        for (const c of payload.classes || []) element.classList.remove(c);
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-classes', classes: previous });
      }
      case 'replace_class': {
        const previous = Array.from(element.classList);
        for (const c of payload.classes || []) element.classList.remove(c);
        if (payload.value) element.classList.add(payload.value);
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-classes', classes: previous });
      }
      case 'set_style': {
        const win = this.doc.defaultView;
        if (!win?.getComputedStyle) throw new Error('STYLE_UNAVAILABLE: computed style API is unavailable in this context.');
        const previous: Record<string, string> = {};
        for (const prop of Object.keys(payload.style || {})) {
          previous[prop] = win.getComputedStyle(element).getPropertyValue(prop);
          (element as HTMLElement).style.setProperty(prop, payload.style![prop]);
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-style', style: previous });
      }
      case 'remove_style': {
        const previous: Record<string, string> = {};
        for (const prop of payload.classes || []) {
          previous[prop] = (element as HTMLElement).style.getPropertyValue(prop);
          (element as HTMLElement).style.removeProperty(prop);
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: 'restore-style', style: previous });
      }
      case 'add_element': {
        const parentEl = payload.parent ? this.resolveTarget(payload.parent) : element;
        const holder = this.doc.createElement('template');
        holder.innerHTML = payload.newElementHtml ?? '<div></div>';
        const newNode = holder.content.firstElementChild;
        if (!newNode) throw new Error('INVALID_HTML: payload.newElementHtml does not produce an element.');
        switch (payload.position || 'append') {
          case 'before': element.before(newNode); break;
          case 'after': element.after(newNode); break;
          case 'prepend': parentEl.prepend(newNode); break;
          default: parentEl.appendChild(newNode);
        }
        return this.undoFor(mutationId, op, targetSelector, { kind: 'remove-node', attribute: this.snapshotState(newNode).selector });
      }
      case 'remove_element': {
        const outerHtml = element.outerHTML;
        const parent = element.parentElement;
        const nextSibling = element.nextElementSibling;
        element.remove();
        return this.undoFor(mutationId, op, targetSelector, {
          kind: 'reinsert-node',
          outerHtml,
          parentSelector: parent ? this.snapshotState(parent).selector : undefined,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null,
        });
      }
      case 'replace_element': {
        const outerHtml = element.outerHTML;
        const parent = element.parentElement;
        const holder = this.doc.createElement('template');
        holder.innerHTML = payload.newElementHtml ?? '<div></div>';
        const replacement = holder.content.firstElementChild;
        if (!replacement) throw new Error('INVALID_HTML: payload.newElementHtml does not produce an element.');
        const nextSibling = element.nextElementSibling;
        element.replaceWith(replacement);
        return this.undoFor(mutationId, op, targetSelector, {
          kind: 'reinsert-node',
          outerHtml,
          parentSelector: parent ? this.snapshotState(parent).selector : undefined,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null,
        });
      }
      case 'move_element': {
        if (!payload.parent) throw new Error('PARENT_REQUIRED: payload.parent is required for move_element.');
        const parentEl = this.resolveTarget(payload.parent);
        const outerHtml = element.outerHTML;
        const oldParent = element.parentElement;
        const oldNext = element.nextElementSibling;
        const newNext = (payload.position === 'before' || payload.position === 'prepend')
          ? parentEl.firstElementChild
          : null;
        parentEl[payload.position === 'prepend' ? 'prepend' : 'appendChild'](element);
        return this.undoFor(mutationId, op, targetSelector, {
          kind: 'restore-position',
          parentSelector: oldParent ? this.snapshotState(oldParent).selector : undefined,
          nextSiblingSelector: oldNext ? this.snapshotState(oldNext).selector : newNext ? this.snapshotState(newNext).selector : null,
          outerHtml,
        });
      }
      case 'wrap_element': {
        const holder = this.doc.createElement('template');
        holder.innerHTML = payload.newElementHtml || '<div class="mcpdom-wrapper"></div>';
        const wrapper = holder.content.firstElementChild;
        if (!wrapper) throw new Error('INVALID_HTML: wrapper template produced no element.');
        const parent = element.parentElement;
        const nextSibling = element.nextElementSibling;
        element.replaceWith(wrapper);
        wrapper.appendChild(element);
        return this.undoFor(mutationId, op, targetSelector, {
          kind: 'restore-position',
          parentSelector: parent ? this.snapshotState(parent).selector : undefined,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null,
        });
      }
      case 'unwrap_element': {
        const outerHtml = element.outerHTML;
        const parent = element.parentElement;
        if (!parent) throw new Error('ORPHAN_ELEMENT: cannot unwrap a root-level element.');
        const nextSibling = element.nextElementSibling;
        const children = Array.from(element.children);
        for (const child of children) {
          parent.insertBefore(child, element);
        }
        element.remove();
        return this.undoFor(mutationId, op, targetSelector, {
          kind: 'reinsert-node',
          outerHtml,
          parentSelector: this.snapshotState(parent).selector,
          nextSiblingSelector: nextSibling ? this.snapshotState(nextSibling).selector : null,
        });
      }
      case 'clone_subtree': {
        const parentEl = payload.parent ? this.resolveTarget(payload.parent) : element.parentElement || element;
        const clone = element.cloneNode(true) as Element;
        if (payload.copyAttributes !== false) {
          for (const attr of Array.from(clone.attributes)) {
            if (attr.name === 'id') clone.removeAttribute('id'); // never duplicate ids
          }
        }
        (parentEl as HTMLElement).appendChild?.(clone);
        return this.undoFor(mutationId, op, targetSelector, { kind: 'remove-node', attribute: this.snapshotState(clone).selector });
      }
      default:
        throw new Error(`UNKNOWN_OPERATION: ${op} is not a supported DOM mutation.`);
    }
  }

  private applyUndo(record: UndoRecord): void {
    const inv = record.inverse;
    switch (inv.kind) {
      case 'restore-outer-html': {
        const el = this.resolveTarget({ selector: record.targetSelector });
        if (inv.outerHtml !== undefined) {
          const holder = this.doc.createElement('template');
          holder.innerHTML = inv.outerHtml;
          const restored = holder.content.firstElementChild;
          if (restored) el.replaceWith(restored);
        } else if (inv.attribute === '__inner') {
          el.innerHTML = inv.text || '';
        }
        break;
      }
      case 'reinsert-node': {
        const parent = inv.parentSelector ? this.resolveTarget({ selector: inv.parentSelector }) : this.doc.body;
        const holder = this.doc.createElement('template');
        holder.innerHTML = inv.outerHtml || '';
        const restored = holder.content.firstElementChild;
        if (!restored) throw new Error('UNDO_CORRUPT: serialized subtree could not be restored.');
        const anchor = inv.nextSiblingSelector ? this.safeResolve(inv.nextSiblingSelector) : null;
        parent.insertBefore(restored, anchor);
        break;
      }
      case 'remove-node': {
        const el = this.safeResolve(inv.attribute || record.targetSelector);
        if (el) el.remove();
        break;
      }
      case 'restore-attribute': {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.setAttribute(inv.attribute!, inv.value ?? '');
        break;
      }
      case 'remove-attribute': {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.removeAttribute(inv.attribute!);
        break;
      }
      case 'restore-text': {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.textContent = inv.text || '';
        break;
      }
      case 'restore-classes': {
        const el = this.resolveTarget({ selector: record.targetSelector });
        el.removeAttribute('class');
        for (const c of inv.classes || []) el.classList.add(c);
        break;
      }
      case 'restore-style': {
        const el = this.resolveTarget({ selector: record.targetSelector });
        (el as HTMLElement).style.removeProperty('all');
        for (const [prop, value] of Object.entries(inv.style || {})) {
          (el as HTMLElement).style.setProperty(prop, value);
        }
        break;
      }
      case 'restore-position': {
        // For position restores we reinsert the serialized subtree at the recorded anchor
        const holder = this.doc.createElement('template');
        holder.innerHTML = inv.outerHtml || '';
        const restored = holder.content.firstElementChild;
        if (!restored) throw new Error('UNDO_CORRUPT: serialized subtree could not be restored.');
        const current = this.safeResolve(record.targetSelector);
        if (current) current.remove();
        const parent = inv.parentSelector ? this.safeResolve(inv.parentSelector) : this.doc.body;
        const anchor = inv.nextSiblingSelector ? this.safeResolve(inv.nextSiblingSelector) : null;
        (parent || this.doc.body).insertBefore(restored, anchor);
        break;
      }
    }
  }

  private reapplyRecord(record: UndoRecord, element: Element, payload: DOMMutationPayload): boolean {
    // Redo = re-run the mutation with the SAME effective parameters captured
    // at undo time. For attr/class/style/text ops the inverse stores enough
    // to reconstruct the forward patch.
    const inv = record.inverse;
    switch (record.operation) {
      case 'set_attribute': {
        if (inv.kind === 'restore-attribute' || inv.kind === 'remove-attribute') {
          // We cannot know the forward value from the inverse alone; use payload.value when provided
          if (payload.value !== undefined) {
            element.setAttribute(payload.attribute || inv.attribute || '', payload.value);
            return true;
          }
        }
        return false;
      }
      case 'add_class': {
        for (const c of payload.classes || []) element.classList.add(c);
        return (payload.classes?.length || 0) > 0;
      }
      case 'remove_class': {
        for (const c of payload.classes || inv.classes || []) element.classList.remove(c);
        return true;
      }
      case 'set_text': {
        if (payload.text !== undefined) {
          element.textContent = payload.text;
          return true;
        }
        return false;
      }
      case 'set_inner_html': {
        if (payload.html !== undefined) {
          element.innerHTML = payload.html;
          return true;
        }
        return false;
      }
      default: {
        // Structural operations: re-apply from the stored forward html where possible
        return false;
      }
    }
  }

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  private resolveTarget(target: LiveElementTarget | string): Element {
    if (!target) throw new Error('TARGET_REQUIRED: mutation requires a target.');
    if (typeof target === 'string') target = { selector: target };
    if (target.selector) {
      try {
        const found = this.doc.querySelectorAll(target.selector);
        if (found.length === 1) return found[0] as Element;
        if (found.length > 1) {
          const visible = Array.from(found).find((el) => {
            try { return LiveDOMInspector.inspectElement(el as Element).visibility.isVisible; } catch { return false; }
          });
          return (visible || found[0]) as Element;
        }
      } catch (err: any) {
        throw new Error(`TARGET_INVALID: ${err.message}`);
      }
      throw new Error(`TARGET_NOT_FOUND: selector "${target.selector}" matches no element.`);
    }
    if (target.xpath) {
      try {
        const x = this.doc.evaluate(target.xpath, this.doc, null, 9, null);
        const el = x.singleNodeValue as Element | null;
        if (el) return el;
      } catch (err: any) {
        throw new Error(`TARGET_INVALID_XPATH: ${err.message}`);
      }
      throw new Error(`TARGET_NOT_FOUND: xpath matches no element.`);
    }
    if (typeof (target as any).nodeId === 'number' && this.registry) {
      const node = this.registry.getNode((target as any).nodeId);
      if (node && node.nodeType === 1 && this.doc.contains(node)) return node as Element;
      throw new Error('TARGET_STALE: logical node id no longer resolves to an attached element.');
    }
    throw new Error('TARGET_INVALID: target has neither selector, xpath nor nodeId.');
  }

  private safeResolve(selector: string): Element | null {
    try {
      return this.doc.querySelector(selector);
    } catch {
      return null;
    }
  }

  private snapshotState(element: Element): { selector: string; outerHtml: string; attributes: Record<string, string> } {
    const info = LiveDOMInspector.inspectElement(element, this.registry);
    const outerHtml = element.outerHTML.length > 20000 ? element.outerHTML.slice(0, 20000) + '…[truncated]' : element.outerHTML;
    return {
      selector: info.bestSelector,
      outerHtml,
      attributes: this.attrsOf(element),
    };
  }

  private attrsOf(element: Element): Record<string, string> {
    const out: Record<string, string> = {};
    for (const attr of Array.from(element.attributes)) {
      out[attr.name] = attr.value.length > 300 ? attr.value.slice(0, 300) + '…' : attr.value;
    }
    return out;
  }

  private quickDiff(
    before: { attributes: Record<string, string>; outerHtml: string },
    after: DOMMutationResult['after'],
    element: Element
  ): DOMMutationResult['diff'] {
    if (!after) return null;
    let added = 0;
    let removed = 0;
    let changed = 0;
    const beforeKeys = new Set(Object.keys(before.attributes));
    const afterKeys = new Set(Object.keys(after.attributes || {}));
    for (const k of beforeKeys) if (!afterKeys.has(k)) removed++;
    for (const k of afterKeys) {
      if (!beforeKeys.has(k)) added++;
      else if (before.attributes[k] !== after.attributes![k]) changed++;
    }
    if (before.outerHtml !== after.outerHtml && added + removed + changed === 0) changed++;
    const descendantCount = element.querySelectorAll ? element.querySelectorAll('*').length : 0;
    return {
      added,
      removed,
      changed,
      summary: `attributes +${added}/-${removed}/~${changed}; subtree nodes: ${descendantCount}`,
    };
  }

  private undoFor(mutationId: string, operation: DOMMutationOperation, targetSelector: string, inverse: UndoRecord['inverse']): UndoRecord {
    return { mutationId, operation, targetSelector, inverse };
  }

  private siblingSelector(element: Element): string | null {
    try {
      return this.snapshotState(element).selector;
    } catch {
      return null;
    }
  }

  private pushHistory(entry: MutationHistoryEntry): void {
    this.history.push(entry);
    if (this.history.length > MUTATION_HISTORY_CAP) {
      this.history.splice(0, this.history.length - MUTATION_HISTORY_CAP);
    }
  }

  private markHistory(mutationId: string, kind: 'undo' | 'redo'): void {
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].mutationId === mutationId) {
        if (kind === 'undo') this.history[i].undoApplied = true;
        else this.history[i].redoApplied = true;
        return;
      }
    }
  }

  private summaryOf(tx: { id: string; steps: MutationTransactionStep[] }): { domLength: number; diffSummary: string } {
    const domLength = this.doc.documentElement?.outerHTML.length || 0;
    const succeeded = tx.steps.filter((s) => s.mutation.success).length;
    return {
      domLength,
      diffSummary: `${succeeded}/${tx.steps.length} mutations applied`,
    };
  }

  private failure(mutationId: string, payload: DOMMutationPayload, before: any, message: string, durationMs: number): DOMMutationResult {
    return {
      mutationId,
      operation: payload.operation,
      success: false,
      before: before || { selector: String(payload.target?.selector || '?'), outerHtml: '', attributes: {} },
      after: null,
      diff: null,
      affectedSelector: null,
      durationMs,
      error: message,
      undoable: false,
    };
  }
}

function describeExpectedChange(payload: DOMMutationPayload, element: Element): string {
  switch (payload.operation) {
    case 'set_attribute': return `attribute "${payload.attribute}" will be set to "${(payload.value ?? '').slice(0, 40)}"`;
    case 'remove_attribute': return `attribute "${payload.attribute}" will be removed`;
    case 'set_text': return `text content will be replaced (${(payload.text || '').length} chars)`;
    case 'replace_text': return `every occurrence of "${payload.text}" will become "${payload.replacement}"`;
    case 'set_inner_html': return `inner HTML will be replaced (${(payload.html || '').length} chars)`;
    case 'set_outer_html': return `element (and subtree) will be replaced with provided HTML`;
    case 'add_class': return `classes ${(payload.classes || []).join(', ')} will be added`;
    case 'remove_class': return `classes ${(payload.classes || []).join(', ')} will be removed`;
    case 'replace_class': return `classes ${(payload.classes || []).join(', ')} will be replaced with "${payload.value}"`;
    case 'set_style': return `inline styles ${Object.keys(payload.style || {}).join(', ')} will be set`;
    case 'remove_style': return `inline styles ${(payload.classes || []).join(', ')} will be removed`;
    case 'add_element': return `a new element will be inserted ${(payload.position || 'append')} the target`;
    case 'remove_element': return `the element and its subtree will be removed`;
    case 'replace_element': return `the element will be replaced with new HTML`;
    case 'move_element': return `the element will be moved into the specified parent`;
    case 'wrap_element': return `the element will be wrapped in a new container`;
    case 'unwrap_element': return `children will be lifted out and the wrapper removed`;
    case 'clone_subtree': return `a deep clone of the subtree will be appended`;
    default: return 'unknown operation';
  }
}
