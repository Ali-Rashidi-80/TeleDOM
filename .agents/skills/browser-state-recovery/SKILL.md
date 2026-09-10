---
name: browser-state-recovery
description: Recover from stale element references, navigation races and bridge reconnects — condition-based waiting, undo-based state restore, markAllStale session triage and snapshot comparisons to detect drift.
version: 1.0.0
---

# Skill: Browser State Recovery

## PURPOSE
Re-establish a trustworthy working state after the page moved under you: elements went stale, a navigation raced your command, or the bridge dropped and reconnected. The platform model makes staleness explicit (tabs OPEN/CLOSED/STALE) and gives you the tools to wait, restore and detect drift — never to guess.

## WHEN TO USE
- TARGET_STALE / TARGET_NOT_FOUND errors mid-workflow that used to work.
- A tool succeeded but the page looks wrong (navigation or re-render happened between resolution and action).
- After any bridge outage/reconnect (extension reload, service-worker suspension, bridge restart).
- Long sessions where you suspect background app behavior changed the DOM.
- Resuming an interrupted session: detect what changed while you were gone before acting on cached assumptions.

## PREREQUISITES
- MCP server running; the page (or its successor) still reachable via extension or Node simulation.
- Ideally: stored TARGET snapshots (from generate_element_target / region annotations) and captured page states from before the trouble.

## WORKFLOW
1. **Classify the failure first.** `get_browser_session {}` — tab statuses tell the story: OPEN (fine), CLOSED (gone for good), STALE (reference suspect after a reconnect; the session model marks all open tabs STALE on bridge loss — markAllStale — and a re-registered tab flips back to OPEN with refreshed lastSeenAt).
2. **Navigation races:** re-establish readiness with `wait_for_condition` — `kind: "readiness_state"` (default `complete`), `kind: "url_contains"` (did navigation land where expected?), `kind: "dom_stable"` (two consecutive matching DOM observations), or `kind: "selector_present"/"selector_visible"` for the element you actually need. Then retry the original command once. If a selector suddenly works again, `recover_selector` will report `strategy: "original-selector", confidence: 1.0` — the earlier failure was a transient navigation/render race.
3. **Stale element references:** run `recover_selector {selector, snapshot}` with the stored snapshot (tag/text/classes/stableAttributes/fingerprintHash/parentSelector). Safe recovery (≥0.62 confidence, ≥0.15 margin) yields a `resolvedSelector`; refusals come back with alternatives and diagnostics — pick manually or re-target via `search_dom` + `generate_element_target`.
4. **State restore via mutations:** if YOUR changes are the drift, `undo_dom_mutation {}` walks the immutable inverse records (repeat per step, or `mutate_dom_transaction {mode: "rollback", reason}` for a scoped set). Check `get_mutation_history {limit}` for undo/redo depth first.
5. **Drift detection:** `capture_page_state {}` now vs. your last pre-failure snapshot, then `compare_page_states {snapshotIdA, snapshotIdB}` — field-level diffs (url, title, domHash, domLength, interactiveCount, viewport, pendingMutations) plus `domDelta`. A changed `domHash` with identical length means re-rendered equivalent; a changed `url` means navigation.
6. **Tabs:** `list_tabs {}` to see the real current set; re-`focus_tab` your page if the active tab moved; treat STALE identities as untrusted until re-registered.
7. Resume the workflow from the last verified state — re-resolve targets, re-capture state, then continue.

## TOOLS
`wait_for_condition`, `wait_for_dom_stable`, `recover_selector`, `diagnose_selector_failure`, `generate_element_target`, `undo_dom_mutation`, `mutate_dom_transaction`, `get_mutation_history`, `capture_page_state`, `compare_page_states`, `get_browser_session`, `list_tabs`, `focus_tab`, `get_action_timeline`

## EXAMPLES
```
tools/call get_browser_session {}
tools/call wait_for_condition { "kind": "readiness_state", "state": "complete", "timeoutMs": 10000 }
tools/call recover_selector { "selector": "#old-submit", "snapshot": { "tag": "button", "text": "Sign in", "stableAttributes": { "data-testid": "login-submit" } } }
tools/call undo_dom_mutation {}
tools/call compare_page_states { "snapshotIdA": "snap_a1", "snapshotIdB": "snap_b2" }
```

## FAILURE MODES
- **TARGET_STALE** — element removed since resolution; classic after SPA re-renders. Recover via snapshot, don't blind-retry the click.
- **markAllStale aftermath** — after a bridge reconnect all tabs show STALE; acting through them is unreliable until the tab re-registers (any page activity) or you re-list and re-focus.
- **Wait condition never satisfied (`satisfied: false`)** — the expected state genuinely isn't coming (navigation failed, selector is wrong); diagnose instead of re-waiting (max timeout 30000).
- **Undo "nothing to undo"** — the mutations were made in a different document context (engines are per-document) or predate the current session; fall back to `reload_tab {bypassCache: true}`.
- **Snapshot drift with no explanation** — compare only covers the digest fields; drill into `get_live_dom_subtree` or `diff_dom` (on a recorded session) for structural detail.

## VALIDATION
- Post-recovery: `get_browser_session` shows your target tab OPEN and active; `inspect_live_page` returns the expected url/title.
- Recaptured `capture_page_state` matches the pre-failure snapshot (or the diff is exactly the change you intended).
- `get_mutation_history` undo depth decreased by exactly the number of undos you ran — anything else means an app re-render interleaved.
- Re-resolved targets carry fresh `resolvedFrom` (selector/xpath, not coordinates) and healthy confidence.

## RECOVERY
- Total loss of orientation: `reload_tab {bypassCache: true}` for a pristine page, re-run your targeting from `search_dom`, and treat prior element references as dead.
- Bridge-level suspicion: run the mcp-troubleshooting health check before blaming page state — simulated fallback responses (`simulated: true`) mean you are not looking at the real page at all.
- Keep evidence: pull `get_action_timeline` and `get_operation_trace` for the failing operations before any restart — the in-memory timeline does not survive a server restart.
