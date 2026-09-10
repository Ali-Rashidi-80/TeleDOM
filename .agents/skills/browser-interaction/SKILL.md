---
name: browser-interaction
description: Drive live page interactions with production-grade clicks (normal/double/right/human-like), typing modes, hover/focus, keyboard shortcuts, drag-and-drop, form controls and condition-based waits.
version: 1.0.0
---

# Skill: Browser Interaction

## PURPOSE
Interact with elements the way real automation should: explicit modes that never silently fall back, before/after state on every result, and waits tied to observable conditions instead of arbitrary sleeps.

## WHEN TO USE
- Executing any user-visible action: click, type, hover, focus, key press, drag, check, select.
- Filling forms where framework event handling matters (React/Vue need full key sequences).
- Waiting for a page to settle before the next action in a multi-step flow.

## PREREQUISITES
- Live page connected (extension) or Node simulation context (`simulated: true` results — event dispatch is real in JSDOM, layout/occlusion checks are limited).
- A resolved target: selector or TARGET object. Generate one first (`generate_element_target`) for anything you will reuse.
- Optional: an interaction profile set via the human-like-interaction skill.

## WORKFLOW
1. `click_element {target|selector, mode, waitForStabilization}` — modes: `normal` (synthetic pointer sequence), `double` (dblclick), `right` (contextmenu), `human-like` (trajectory + profile-driven delays), `programmatic`. The mode actually used is always reported.
2. `type_text {target|selector, text, mode}` — `append` (default), `replace` (clear then type), `clear`. Framework-sensitive: keydown/keypress/input/change dispatched per character; the resulting value shows in `afterState`.
3. `hover_element`, `focus_element`, `blur_element` — pointerenter/mouseenter/mouseover/mousemove sequence, native focus()/blur() plus events.
4. `press_keyboard_shortcut {keys, target?}` — `"Control+Shift+P"` or `keyList: ["Control","Shift","P"]`; keydown+keyup per key with modifier flags; defaults to the active element.
5. `drag_and_drop {source, target?, offsets?}` — HTML5 drag events (dragstart/dragenter/dragover/drop/dragend) plus pointer events; use `offsets {x,y}` when there is no drop target; result reports whether HTML5 DnD was used.
6. `set_input_checked {target|selector, checked}` — checkbox/radio; peer radios sharing the same `name` are deselected; dispatches input + change; returns checkedBefore/checkedAfter.
7. `select_option {target|selector, value}` — sets the value and dispatches change.
8. `wait_for_condition {kind, ..., timeoutMs, pollIntervalMs}` — kinds: `dom_stable`, `selector_present`, `selector_visible`, `selector_absent`, `text_present`, `url_contains`, `element_count` (needs `count`), `readiness_state` (default `complete`). timeoutMs default 5000, max 30000; poll 100ms. `wait_for_dom_stable {timeoutMs}` is the shorthand.
9. Read every `InteractionResult`: `beforeState` / `afterState`, events fired, and for clicks which mode ran.

## TOOLS
`click_element`, `type_text`, `hover_element`, `focus_element`, `blur_element`, `press_keyboard_shortcut`, `scroll_to_element`, `scroll_page`, `drag_and_drop`, `set_input_checked`, `select_option`, `wait_for_condition`, `wait_for_dom_stable`, `interact_with_element`

## EXAMPLES
```
tools/call click_element { "selector": "button[data-testid='submit']", "mode": "double", "waitForStabilization": true }
tools/call type_text { "selector": "#email", "text": "a@b.co", "mode": "replace" }
tools/call press_keyboard_shortcut { "keys": "Control+Shift+P" }
tools/call drag_and_drop { "source": { "selector": ".card:nth-child(1)" }, "target": { "selector": ".drop-zone" } }
tools/call set_input_checked { "selector": "input[name='agree']", "checked": true }
tools/call wait_for_condition { "kind": "selector_visible", "selector": ".toast-success", "timeoutMs": 8000 }
```

## FAILURE MODES
- **TARGET_NOT_FOUND / TARGET_STALE** — element gone or removed between resolution and dispatch; run `wait_for_condition {kind:"dom_stable"}` then retry, else use selector-recovery.
- **Click has no effect** — element covered/occluded or a dead target: verify with `analyze_dom {analyzer: "detect_dead_click_targets"}` and `get_element_visual_state`.
- **Typing produces nothing in a controlled component** — the app listens on events the page synthesizes differently; try `mode: "replace"` and confirm via `afterState`.
- **Wait timeouts (satisfied: false, waitedMs = timeoutMs)** — condition never became true; do not blindly raise the timeout past 30000 (the cap) — diagnose instead.
- **Wrong element clicked after multi-match** — an ambiguous selector got visible-first disambiguation; tighten the selector or pass a full TARGET.

## VALIDATION
- Every result carries before/after state — compare them; a click with identical before/after usually means the handler did nothing.
- `set_input_checked` reports checkedBefore/checkedAfter and fired events; radio peers must show the switch.
- `wait_for_condition` returns `satisfied`, `waitedMs`, `detail` — `detail` says what was actually observed.

## RECOVERY
- Stale target mid-flow: `recover_selector` with the stored snapshot, re-run `generate_element_target`, retry the action.
- Flaky overlays/toasts: `wait_for_condition {kind:"selector_absent", selector:".overlay"}` before clicking.
- For legacy flows, `interact_with_element {action, selector, text, key, optionValue, scrollDelta, waitForStabilization}` still covers click/type/hover/focus/scroll/press_key/select in one dispatch.
