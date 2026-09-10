---
name: visual-dom-comparison
description: Compare page states before/after any command — live snapshot pairs, historical session diffs, JS-execution change capture, and extension ON/OFF DOM comparison to isolate injected artifacts.
version: 1.0.0
---

# Skill: Visual-DOM Comparison

## PURPOSE
Answer "what changed?" with evidence instead of impressions. Four comparison surfaces: page-state snapshot pairs (live), structural DOM diffs (historical sessions), JS execution with automatic change capture, and extension ON/OFF comparison that isolates what the extension itself injects into a page.

## WHEN TO USE
- Verifying that a click, mutation or script actually changed the DOM (and by how much).
- Detecting drift after navigation, reconnects or background app behavior.
- Proving an extension is (or is not) polluting the page — e.g. debugging "the injected UI breaks my page" reports.
- Building before/after evidence for bug reports or project diffs.
- Gathering evidence for bug reports: a snapshot pair plus a diff summary beats a screenshot alone.

## PREREQUISITES
- MCP server running; live page in the extension or Node simulation.
- Historical `diff_dom` requires a recorded forensic session (sessionId from a recording run).
- `compare_extension_states` requires a real browser + extension (it disables/re-enables the extension and reloads the tab).

## WORKFLOW
1. `capture_page_state {}` — anchor snapshot: `snapshotId`, timestamp, url, title, viewport, `domLength`, `domHash` (stable hash of the DOM), `interactiveCount`, `extensionEnabled`, `pendingMutations`, `annotationCount`. Snapshots are capped at 100 per session (oldest pruned).
2. Perform the action under test (click, mutate, script, wait…).
3. `capture_page_state {}` again, then `compare_page_states {}` — with no arguments it compares the two most recent snapshots; pass `snapshotIdA`/`snapshotIdB` for explicit pairs. Output: `identical`, field-level `changes` (url, title, domLength, domHash, interactiveCount, viewport, extensionEnabled, annotationCount), `domDelta` and a summary line.
4. For scripted changes use `execute_js_and_capture_changes {code, timeoutMs, world}` — one call returns the `JSExecutionResult` (outcome state, console output, duration) plus before/after `PageStateSnapshot`s and the comparison. Prefer this over execute-then-compare when the script is the experiment.
5. For time-travel questions over a recorded session: `diff_dom {sessionId, t1, t2}` — structural tree diff between two timestamps; find the timestamps via `get_timeline`/`get_events_around`, and root-cause disappearances with `find_disappearing_elements` / `why_did_element_disappear`.
6. For extension-impact questions: `compare_extension_states {extensionId, tabId, waitDurationMs, cleanDomPath, injectedDomPath, cleanScreenshotPath, injectedScreenshotPath, diffOutputPath}` — it disables the extension, hard-reloads the tab, captures clean DOM (+optional screenshot), re-enables, reloads again, captures the injected state, then reports `domSizeDifferenceChars` and `injectedMarkersDetected` (known markers: annota, workspace, shadow-root, history-tree, knowledge-hub, codex).
7. `list_page_states {}` to audit captured snapshot ids, timestamps, urls and sizes.

## TOOLS
`capture_page_state`, `compare_page_states`, `list_page_states`, `execute_js_and_capture_changes`, `execute_javascript`, `diff_dom`, `compare_extension_states`, `get_action_timeline`, `get_operation_trace`

## EXAMPLES
```
tools/call capture_page_state {}
tools/call compare_page_states {}
tools/call execute_js_and_capture_changes { "code": "document.querySelector('.banner').remove(); return 'removed';" }
tools/call diff_dom { "sessionId": "sess_abc123", "t1": 1717000000000, "t2": 1717000099000 }
tools/call compare_extension_states { "extensionId": "forensic-recorder@mcpdom", "tabId": 42, "cleanDomPath": "./clean.html", "injectedDomPath": "./injected.html", "diffOutputPath": "./ext-diff.json" }
```

## FAILURE MODES
- **Snapshot not found** — explicit snapshotId typo or the pair was pruned by the 100-cap; use `list_page_states` and re-capture.
- **SESSION_NOT_FOUND** for `diff_dom` — no recorded session with that id; start a recording first.
- **compare_extension_states without a real browser** — needs actual extension enable/disable and tab reloads; in Node-only contexts it cannot produce meaningful clean/injected pairs.
- **identical: true after an expected change** — the change was in an iframe/shadow root not covered by the digest, or the DOM re-rendered back to an equivalent state; fall back to `diff_dom` or targeted `inspect_live_element`.
- **domHash equal but domLength differs** — impossible for the same hash function; if you see inconsistency, suspect you compared snapshots from different tabs.

## VALIDATION
- `compare_page_states` lists every changed field with before/after values — read the field list, not just `identical`.
- `execute_js_and_capture_changes` must show the JS outcome state AND the comparison; EXECUTED_WITH_ERROR means your script failed — the "change" evidence is then meaningless.
- Extension comparison: `domSizeDifferenceChars` should be ≥ 0 with markers listed; zero delta + no markers = extension injects nothing into that page.

## RECOVERY
- Missing before-state: re-capture, re-run the action, re-compare (actions with side effects may not be safely repeatable — prefer recordings for those).
- Noisy diffs from background churn: run `wait_for_dom_stable` before each capture to reduce race noise.
- Extension comparison interrupted: re-enable the extension (`set_extension_enabled {extensionId, enabled: true}`) and reload the tab — never leave the extension disabled after a failed run.
