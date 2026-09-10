---
name: dom-mutation
description: Apply first-class DOM mutations under the BEFORE → ACTION → AFTER → DIFF observability contract with transactions, immutable undo/redo records, and guaranteed side-effect-free previews.
version: 1.0.0
---

# Skill: DOM Mutation

## PURPOSE
Modify the live DOM like an engineer: every mutation is observable (BEFORE → ACTION → AFTER → DIFF), undoable (immutable inverse records), and previewable before touching anything. Failures become structured `DOM_MUTATION_FAILED` results — a failed operation can never corrupt the session state of subsequent operations.

## WHEN TO USE
- Prototyping a UI change before implementing it in real code.
- Fixing a blocking overlay/bug long enough to complete a workflow on the live page.
- Testing how the page reacts to structural changes (removal, reorder, wrapping).
- Sandbox experiments — the mutation engine plus undo history is your safety net.

## PREREQUISITES
- Live page (extension or Node simulation; JSDOM applies mutations faithfully).
- A resolved target and a clear intent. For anything destructive: preview first.
- Discipline: never mutate a page state you have not snapshotted (`capture_page_state`) when the change matters.

## WORKFLOW
1. `preview_dom_mutation {operation, target, ...params}` — dry-run: validates the target, describes the expected change, counts affected nodes and warns about destructive operations. Guaranteed no side effects. (`preview_command` is the older alias with the same contract.)
2. `mutate_dom {operation, target, ...params}` — apply one of the 18 operations:
   - attributes: `set_attribute` (attribute, value), `remove_attribute` (attribute)
   - content: `set_text` (text), `replace_text` (text + replacement), `set_inner_html` (html), `set_outer_html` (newElementHtml)
   - classes: `add_class` / `remove_class` / `replace_class` (classes, value)
   - styles: `set_style` (style map), `remove_style` (classes as prop names)
   - structure: `add_element` (newElementHtml, parent, position: before|after|prepend|append), `remove_element`, `replace_element` (newElementHtml), `move_element` (parent, position), `wrap_element` (newElementHtml), `unwrap_element`, `clone_subtree` (copyAttributes)
3. Read the `DOMMutationResult`: BEFORE state, the action taken, AFTER state and the structural DIFF.
4. Multi-step changes: `mutate_dom_transaction {mode: "begin"}` → your `mutate_dom` calls join the transaction → `mutate_dom_transaction {mode: "commit"}` (verify + all-or-nothing commit) or `{mode: "rollback", reason}` (reverts every step in reverse order; the reason is recorded).
5. `undo_dom_mutation {}` — undo the last mutation (or the last step of the open transaction) via its immutable inverse record. Empty stack reports "nothing to undo" — safe to call speculatively.
6. `redo_dom_mutation {}` — re-apply the last undone mutation only when safe (forward patch guarded).
7. `get_mutation_history {limit}` — entries with operation, target, summary, undo/redo flags, plus undo depth, redo depth and the open transaction id.
8. `clone_dom_subtree {target, parent?, copyAttributes}` — deep clone appended to a parent (or the original parent); ids are never duplicated.

## TOOLS
`mutate_dom`, `mutate_dom_transaction`, `undo_dom_mutation`, `redo_dom_mutation`, `get_mutation_history`, `preview_dom_mutation`, `preview_command`, `clone_dom_subtree`, `capture_page_state`, `compare_page_states`

## EXAMPLES
```
tools/call preview_dom_mutation { "operation": "remove_element", "target": { "selector": ".promo-overlay" } }
tools/call mutate_dom { "operation": "set_attribute", "target": { "selector": "button#checkout" }, "attribute": "disabled", "value": "true" }
tools/call mutate_dom { "operation": "add_class", "target": { "selector": "nav.main" }, "classes": ["collapsible"] }
tools/call mutate_dom_transaction { "mode": "begin" }
tools/call mutate_dom_transaction { "mode": "rollback", "reason": "layout broke at step 2" }
tools/call undo_dom_mutation {}
tools/call get_mutation_history { "limit": 20 }
```

## FAILURE MODES
- **DOM_MUTATION_FAILED** — structured failure with diagnostics (bad target, invalid HTML, forbidden operation); the engine never throws raw. Fix the inputs and retry; the undo stack stays intact.
- **Target unresolved mid-transaction** — a step re-rendered the DOM; rollback the transaction rather than half-applying.
- **Undo "nothing to undo"** — the stack is empty (fresh session, or history was for a different document — engines are keyed per document).
- **Redo refused** — the forward patch is unsafe (page changed since the undo); re-apply via `mutate_dom` instead of forcing redo.
- **Mutations vanish** — the app re-rendered and clobbered your change; that is app/framework behavior, use `wait_for_dom_stable` and re-apply, or accept it as evidence of dynamic re-rendering.

## VALIDATION
- Every result must show all four contract phases (BEFORE/ACTION/AFTER/DIFF); a missing DIFF means you got a preview-style response, not a mutation.
- `get_mutation_history` undo depth increments on success; transaction entries reference the open transaction id.
- After a rollback, `compare_page_states` on snapshots taken before `begin` should report identical states.

## RECOVERY
- Bad change: `undo_dom_mutation` (repeat per step) or transaction rollback; verify with `capture_page_state` + `compare_page_states`.
- Deep mess: `undo_dom_mutation` until "nothing to undo", then `reload_tab {bypassCache: true}` for a ground-truth reset.
- Never ship mutations as fixes — they are experiments; port validated changes into the app's source.
