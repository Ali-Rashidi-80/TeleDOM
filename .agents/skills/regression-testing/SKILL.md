---
name: regression-testing
description: Record, replay, sequence and export deterministic command workflows, then verify the platform itself with the vitest unit suite and the real-stdio operational acceptance suite and its capability matrix.
version: 1.0.0
---

# Skill: Regression Testing

## PURPOSE
Catch regressions at two levels: (1) against a page — record real workflows once, replay them deterministically, and detect drift; (2) against the platform — run the project's unit tests and the operational stdio suite that certifies every tool over real JSON-RPC.

## WHEN TO USE
- Reproducing an intermittent page bug by replaying the exact command sequence.
- Verifying a fix didn't break the flow that used to work (record before, replay after).
- Handing a reproduction to another agent/session (export → import → replay).
- After changing platform code or adding a tool, before calling the build done.

## PREREQUISITES
- MCP server running; target page reachable (extension) or Node simulation — replays in simulation are marked `simulated: true` and exercise dispatch, not the real page.
- For platform suites: `npm install` and `npm run build` done; `npm run test:unit` needs vitest, `npm run test:operational` runs `scripts/run-operational-suite.js`.

## WORKFLOW
1. `record_commands_start {name, description?, tags?}` — recording mode ON for every subsequent tool call (arguments and outcomes captured with the flow).
2. Drive the workflow exactly as a user would (browser-interaction + dom-inspection skills). Recording adds the capture, not extra steps.
3. `record_commands_stop {}` — persists the CommandRecording to storage (`.mcpdom_recordings`); also saved into a project's `commands/` when a project is bound.
4. Inspect before replaying — replays execute the recorded side effects: `list_command_recordings {}` → `get_command_recording {recordingId}` shows every command with args and recorded outcomes.
5. `replay_command_recording {recordingId, stopOnError?}` — re-executes each recorded tool call in order with deterministic arguments. Default `stopOnError: true` halts at the first failure.
6. For ad-hoc sequences use `execute_command_sequence {steps, stopOnError?}` — steps are `{commandId?, tool, args?, stopOnError?, continueOnError?, condition: {previousStepSucceeded}}`. Conditional steps that don't meet their condition are recorded as SKIPPED with the reason; steps after a stop-on-error are SKIPPED ("sequence stopped on error").
7. Portability: `export_command_recording {recordingId, outputPath?}` emits portable JSON with a schema version; `import_command_recording {recordingJson}` restores it on another machine; `delete_command_recording` cleans up (irreversible).
8. Platform verification:
   - `npm run test:unit` — vitest suite (core engines: mutation, picker, diff, targeting, session model, MCP server…).
   - `npm run test:operational` — the operational acceptance suite: real stdio JSON-RPC against `bin/mcp-server.js`, dynamic tool discovery, per-tool request/response fixtures under `operational-tests/tools/`, scenario runs, and reports written to `operational-tests/_reports/` (baseline-report.json, operational-test-report.{json,md}, capability-matrix.md, certification.md).
   - Read the **capability matrix** (`operational-tests/_inventory/tool-matrix.json`, `_reports/capability-matrix.md`): per tool — category, execution mode, requiresBrowser, requiresRecording, requiresSelection, requiresSession, visualEvidenceExpected — so you know which tools can be regression-tested in which context.
9. Judge replay results: same statuses/durations as recorded (modulo timing) = no regression; a first-failure at step N localizes the regression precisely.

## TOOLS
`record_commands_start`, `record_commands_stop`, `list_command_recordings`, `get_command_recording`, `replay_command_recording`, `execute_command_sequence`, `export_command_recording`, `import_command_recording`, `delete_command_recording`, `get_operation_trace`

## EXAMPLES
```
tools/call record_commands_start { "name": "checkout-flow", "tags": ["smoke", "checkout"] }
tools/call record_commands_stop {}
tools/call replay_command_recording { "recordingId": "rec_abc123", "stopOnError": true }
tools/call execute_command_sequence { "steps": [ { "tool": "wait_for_condition", "args": { "kind": "dom_stable" } }, { "tool": "click_element", "args": { "selector": "#buy" }, "condition": { "previousStepSucceeded": true } } ] }
tools/call export_command_recording { "recordingId": "rec_abc123", "outputPath": "./checkout-flow.json" }
```

## FAILURE MODES
- **Replay fails at an interaction step** — the page drifted since recording (selectors stale). Run the browser-state-recovery workflow, re-record, or make the recording more resilient (targets instead of bare selectors, waits between steps).
- **stopOnError halted mid-replay** — intended behavior: the CommandSequenceResult shows the failing step and SKIPPED remainder; fix or re-record from that point.
- **Recorded side effects re-applied dangerously** — replays are not dry-runs: destructive tools (mutate_dom, close_tab, delete_*) replay for real. Review `get_command_recording` first, and replay on disposable state.
- **Operational suite red after your changes** — check the per-tool fixtures (`operational-tests/tools/<tool>/`) for the exact request/response contract that broke; the report names the failing tool.
- **Unit tests pass but live tools misbehave** — unit suites run in JSDOM simulation; run the operational suite and/or a live extension session for end-to-end truth.

## VALIDATION
- A healthy recording has a command per intended action with SUCCESS outcomes; gaps mean calls bypassed the recorder.
- `replay_command_recording` returns a per-command record (status, durationMs, resultSummary, error) — compare against the recorded outcomes.
- `npm run test:unit` exits 0; `npm run test:operational` writes fresh `_reports/` with an updated capability matrix and certification status.

## RECOVERY
- Flaky replay: insert `wait_for_condition` steps (recordings capture them like any tool) and re-record.
- Corrupt/foreign recording JSON: import validation fails before execution — nothing runs; re-export from the source session.
- Capability mismatch (tool needs a browser you don't have): consult the capability matrix and test that tool via the operational fixtures or the Node simulation path instead of forcing a live replay.
