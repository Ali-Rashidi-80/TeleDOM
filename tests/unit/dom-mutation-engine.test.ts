import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { DOMMutationEngine } from '../../src/core/dom-mutation-engine';

describe('DOMMutationEngine', () => {
  let dom: JSDOM;
  let engine: DOMMutationEngine;

  beforeEach(() => {
    dom = new JSDOM(`<!DOCTYPE html><html><body>
      <div id="box" class="container" data-state="initial">
        <p id="text">Hello world</p>
        <span id="target">Old text</span>
      </div>
    </body></html>`);
    engine = new DOMMutationEngine(dom.window.document);
  });

  it('applies set_attribute with BEFORE/AFTER/DIFF observability', () => {
    const result = engine.mutate({
      operation: 'set_attribute',
      target: { selector: '#box' },
      attribute: 'data-state',
      value: 'updated',
    });
    expect(result.success).toBe(true);
    expect(result.before.attributes['data-state']).toBe('initial');
    expect(result.after?.attributes['data-state']).toBe('updated');
    expect(result.diff?.changed).toBeGreaterThanOrEqual(1);
    expect(result.undoable).toBe(true);
  });

  it('fails structurally on missing attribute (no throw, structured error)', () => {
    const result = engine.mutate({
      operation: 'remove_attribute',
      target: { selector: '#box' },
      attribute: 'does-not-exist',
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain('ATTRIBUTE_NOT_PRESENT');
    expect(result.after).toBeNull();
  });

  it('undoes add_class and restores classes exactly', () => {
    engine.mutate({ operation: 'add_class', target: { selector: '#box' }, classes: ['highlight', 'extra'] });
    expect(dom.window.document.querySelector('#box')!.className).toContain('highlight');
    const undo = engine.undo();
    expect(undo.success).toBe(true);
    expect(dom.window.document.querySelector('#box')!.className).toBe('container');
  });

  it('undoes remove_element by reinserting the serialized subtree', () => {
    const result = engine.mutate({ operation: 'remove_element', target: { selector: '#target' } });
    expect(result.success).toBe(true);
    expect(dom.window.document.querySelector('#target')).toBeNull();
    const undo = engine.undo();
    expect(undo.success).toBe(true);
    const restored = dom.window.document.querySelector('#target');
    expect(restored).not.toBeNull();
    expect(restored!.textContent).toBe('Old text');
  });

  it('rolls back a full transaction in reverse order', () => {
    const txId = engine.beginTransaction();
    engine.mutate({ operation: 'set_attribute', target: { selector: '#box' }, attribute: 'data-tx', value: '1' });
    engine.mutate({ operation: 'set_text', target: { selector: '#text' }, text: 'Transaction text' });
    const rollback = engine.rollbackTransaction('test rollback');
    expect(rollback.rolledBack).toBe(true);
    expect(rollback.transactionId).toBe(txId);
    expect(dom.window.document.querySelector('#box')!.getAttribute('data-tx')).toBeNull();
    expect(dom.window.document.querySelector('#text')!.textContent).toBe('Hello world');
  });

  it('commits a transaction and pushes undo records globally', () => {
    engine.beginTransaction();
    engine.mutate({ operation: 'add_class', target: { selector: '#box' }, classes: ['committed'] });
    const commit = engine.commitTransaction();
    expect(commit.committed).toBe(true);
    expect(dom.window.document.querySelector('#box')!.classList.contains('committed')).toBe(true);
    expect(engine.getUndoDepth()).toBe(1);
  });

  it('refuses commit of a failing verification (rollback path)', () => {
    engine.beginTransaction();
    engine.mutate({ operation: 'set_attribute', target: { selector: '#box' }, attribute: 'data-v', value: 'x' });
    const result = engine.commitTransaction(() => false);
    expect(result.committed).toBe(false);
    expect(result.rolledBack).toBe(true);
    expect(result.error).toContain('VERIFY_FAILED');
    expect(dom.window.document.querySelector('#box')!.getAttribute('data-v')).toBeNull();
  });

  it('previews without side effects', () => {
    const preview = engine.preview({ operation: 'remove_element', target: { selector: '#target' } });
    expect(preview.valid).toBe(true);
    expect(preview.expectedChange).toContain('removed');
    expect(dom.window.document.querySelector('#target')).not.toBeNull();
  });

  it('tracks mutation history with bounded entries', () => {
    engine.mutate({ operation: 'add_class', target: { selector: '#box' }, classes: ['a'] });
    engine.mutate({ operation: 'add_class', target: { selector: '#box' }, classes: ['b'] });
    const history = engine.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].operation).toBe('add_class');
    expect(history[0].summary).toContain('#box');
  });

  it('wrap_element and unwrap_element are mutually inverse', () => {
    engine.mutate({ operation: 'wrap_element', target: { selector: '#text' }, newElementHtml: '<div class="wrapper"></div>' });
    expect(dom.window.document.querySelector('#text')!.parentElement!.className).toBe('wrapper');
    engine.mutate({ operation: 'unwrap_element', target: { selector: '.wrapper' } });
    expect(dom.window.document.querySelector('.wrapper')).toBeNull();
    expect(dom.window.document.querySelector('#text')!.textContent).toBe('Hello world');
  });
});
