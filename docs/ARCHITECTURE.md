# MCPDOM Browser v3 — Agent-Readable Architecture

> Purpose: enable an AI agent (or engineer) to understand the platform deeply
> enough to extend it safely. Companion docs: [MCP_TOOLS.md](MCP_TOOLS.md),
> [CAPABILITY_MATRIX.md](CAPABILITY_MATRIX.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## 1. Dual-Environment Model (unchanged core principle)

| Environment | Code | Runtime | Constraints |
|---|---|---|---|
| Chrome Extension | `src/extension/` | MV3 browser | ZERO Node deps; bundles via `scripts/build-extension.js` (esbuild) into self-contained scripts |
| Server / Bridge | `src/mcp/`, `src/projects/`, `bin/` | Node 18+ | JSON-RPC 2.0 over stdio; WebSocket+HTTP bridge on 3847 |

The **LiveBrowserController** (`src/core/live-browser-controller.ts`) is the universal
command dispatcher used in BOTH environments: content scripts call it with the live
`document`; the Node MCP server calls it with the JSDOM simulation document. This
duality is the platform's compatibility backbone — new browser commands
automatically work in both contexts.

## 2. Command Flow (v3)

```
MCP client (Claude/Cursor/agent)
   │ JSON-RPC 2.0 (stdio)
   ▼
ForensicMCPServer (src/mcp/server.ts)
   │ tools/call
   ▼
MCPToolsHandler (src/mcp/tools-handler.ts)
   ├─ live tools (47 legacy)  → LiveToolsHandler
   ├─ v3 tools (74)           → ExtendedToolsHandler
   │     ├─ browser commands  → dispatch() ──► bridge (WS) ──► extension
   │     │                        │ (no sockets / error)
   │     │                        ▼
   │     │                    local LiveBrowserController (JSDOM simulation)
   │     ├─ projects/knowledge → ProjectManager + AgentPackageExporter (fs)
   │     ├─ recordings         → CommandRecordingStorage (fs)
   │     └─ discovery          → tool-groups.ts catalog
   └─ stored-session tools (21) → storage + reconstruction stack
```

**Dispatch contract**: bridge-first, local-simulation fallback. When both fail,
the error contains BOTH causes (`bridge message | local fallback also failed: [CODE] message`)
— never a masked single cause.

## 3. v3 Core Engines (all in `src/core/`)

| Engine | File | Responsibility |
|---|---|---|
| DOMMutationEngine | dom-mutation-engine.ts | 18 mutation ops, BEFORE/ACTION/AFTER/DIFF, transactions, undo/redo, bounded history (500) |
| JSExecutionEngine | js-execution-engine.ts | 6 outcome states, console capture, DOM-change detection, timeouts |
| ViewportController | viewport-controller.ts | Reversible resize, presets, device emulation, responsive test workflow |
| ElementTargetingEngine | element-targeting.ts | Multi-strategy TARGET with confidence |
| SelectorRobustnessEngine | selector-robustness.ts | Ranked selector candidates + explainable confidence |
| SelectorRecoveryEngine | selector-recovery.ts | Fingerprint recovery with safety gates (0.62 confidence / 0.15 margin) |
| DOMFingerprintEngine | dom-fingerprint.ts | Structural hashes + volatility assessment |
| HumanInteractionController | human-interaction.ts | 4 profiles, seeded Mulberry32 PRNG, trajectories, timing reports |
| DOM analyzers | dom-analyzers.ts | 27 read-only page analyzers |
| BrowserSessionModel | browser-session-model.ts | Tabs (stable identities), snapshots, command history, timeline |
| ActionTimeline / OperationRegistry | action-timeline.ts | Bounded event stream + operation correlation |
| CommandSequenceEngine / CommandRecorder | command-recorder.ts | Sequences with stop-on-error; recording/replay |
| RedactionEngine | redaction-engine.ts | Configurable key/value/attr redaction + capture exclusions |

## 4. Projects / Knowledge Layer (`src/projects/`)

```
.mcpdom_projects/<name>/
├── project.json        ← manifest (schema 1.0.0)
├── page.json           ← page manifest (URL, viewport, browser state, region list)
├── regions/*.json      ← RegionAnnotation: observed / user / intendedChange / verification
├── dom/*.html          ← cleaned region + context DOM (redacted, MCPDOM-free)
├── screenshots/        ← region captures (PNG/JPEG)
├── commands/           ← command recordings
├── diffs/              ← DOM diff artifacts
├── metadata/           ← blueprint.json + reconstruction-spec.json
└── instructions/       ← agent-facing README
```

`export_agent_package` wraps this into a self-contained handoff package
(`mcpdom_agent_packages/<name>/`) with README.md, PROJECT.md,
agent-instructions.md, schemas/ and verification/.

## 5. Simulation Context (honesty model)

When `bin/mcp-server.js` runs without Chrome, it installs a JSDOM fixture DOM and
sets `globalThis.__FORENSIC_SIMULATION__`. In this mode:

- DOM tools operate on the fixture (real mutations, real events — genuinely executed).
- Background commands (tabs/extensions) return **deterministic simulated state,
  always marked `simulated: true`** — contract validation, never presented as
  real-browser proof.
- `close_tab`/`reload_tab` manage virtual tab state instead of destroying the
  fixture window (the old behavior corrupted subsequent operations).

## 6. Bridge Protocol (extended, backward compatible)

- Inbound WS: HEARTBEAT/PING → PONG (+ liveness tracking); REGISTER_CLIENT
  (unique monotonic ids — the old `size+1` ids collided); BROWSER_COMMAND_RESPONSE;
  ELEMENT_SELECTED; session streaming messages (unchanged).
- Liveness sweeper: 30s interval, pings clients, prunes sockets silent >75s.
- Outbound: `BROWSER_COMMAND_REQUEST {id, command, payload}` — 58 command types
  (27 legacy + 31 v3).
- HTTP: `/health`, `/api/clients`, `/api/sessions/upload`, `/api/tabs/close`, `/api/mcp/tool`.

## 7. Extension wiring for v3

- Service worker: RESIZE_VIEWPORT / RESET_VIEWPORT via `chrome.windows.update`.
- Content script: routes viewport commands to the background; all other new
  commands execute in `LiveBrowserController` (generic dispatch — no per-command
  content-script changes needed).
- Page script: unchanged (console/network hooks + query protocol).

## 8. Adding a tool (checklist)

1. Definition in `src/mcp/v3-tools-definition.ts`.
2. Handler route in `src/mcp/extended-tools-handler.ts` (browser commands: add
   a case to `LiveBrowserController.handleCommand` + `BrowserCommandType`).
3. Group entry in `src/mcp/tool-groups.ts`.
4. `ALL_TOOLS` in `bin/cli.js` + `.agents/mcp_config.json` (both plugin copies).
5. Arg matrix entry in `scripts/run-operational-suite.js` (otherwise certification fails).
6. `npm run build && npm run test:unit && npm run test:operational`.
