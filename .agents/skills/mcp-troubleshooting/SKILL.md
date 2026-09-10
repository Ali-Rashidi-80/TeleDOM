---
name: mcp-troubleshooting
description: Diagnose the MCP/bridge stack — health checks, port conflicts (EADDRINUSE → connect to existing bridge), stdio debugging, operation-trace correlation and the platform error-code catalog.
version: 1.0.0
---

# Skill: MCP Troubleshooting

## PURPOSE
Fix the plumbing before blaming the tools: is the MCP server up, is the bridge on 3847, is a browser socket connected, did my tool call even reach the page. Includes the correlation tools that tie a failed call to its timeline evidence.

## WHEN TO USE
- Any tool error mentioning "No active browser extension connected", bridge, socket, or connection.
- The MCP server starts but every live tool silently degrades to `simulated: true` responses.
- Port conflicts, crashes on startup, or multiple servers fighting over one bridge.
- A tool call failed and you need the operation's full trace, not just the error string.

## PREREQUISITES
- Node ≥ project requirements; project built (`npm run build`) so `dist/server` exists.
- Access to run processes and curl (or the `Check-Bridge-Status.bat` helper on Windows).

## WORKFLOW
1. Bridge health: `curl http://localhost:3847/health` → `{status: "ok", server: "browser-forensic-bridge", version, connectedBrowsers}`. `connectedBrowsers: 0` means the bridge is up but no extension socket — that is the extension-troubleshooting skill's territory. `curl http://localhost:3847/api/clients` lists socket metadata.
2. Start cleanly if needed: `npm run bridge` (or `node bin/bridge-server.js`), then the MCP server `node bin/mcp-server.js` (or via a client config).
3. Understand port behavior: the MCP server auto-starts a bridge on `FORENSIC_BRIDGE_PORT` (default 3847) unless `FORENSIC_AUTO_BRIDGE=false`. On **EADDRINUSE** it does not fail — it calls `connectToExistingBridge("http://127.0.0.1:3847")` and reuses the running bridge. Two servers on one machine therefore share one bridge; if that is not what you want, give each a distinct `FORENSIC_BRIDGE_PORT`.
4. Stdio debugging: run `node scripts/test-mcp-stdio.js` — it spawns `bin/mcp-server.js` and speaks JSON-RPC 2.0 (initialize → tools/list → tool calls) over stdio; parse failures and stderr output (e.g. `[MCP] Started background WebSocket Bridge on ws://127.0.0.1:3847`) appear inline. For direct probing, `POST http://localhost:3847/api/mcp/tool` with `{name, arguments}` bypasses stdio entirely.
5. Correlate a failure: `get_operation_trace {operationId}` (omit the id for the recent-operations list, default limit 20) — tool, start/end, duration, status, correlated timeline events and the related error. Feed it the operationId from the failed response when present.
6. Zoom out: `get_action_timeline {kind?, sinceTimestamp?, limit?}` (default 200) — TAB_OPENED / COMMAND_EXECUTED / DOM_MUTATED / SNAPSHOT_CREATED / ERROR_OCCURRED events tell you what the platform actually did around the failure.
7. Classify the error with the catalog below; apply the paired recovery.

## TOOLS
`get_operation_trace`, `get_action_timeline`, `get_browser_session`, `get_tool_catalog`, `list_tabs`, `inspect_live_page`

## EXAMPLES
```
curl http://localhost:3847/health
FORENSIC_BRIDGE_PORT=3947 node bin/mcp-server.js
node scripts/test-mcp-stdio.js
tools/call get_operation_trace { "operationId": "op_1731" }
tools/call get_action_timeline { "kind": "ERROR_OCCURRED", "limit": 50 }
```

## FAILURE MODES
Error-code catalog (machine-readable codes in parens where the platform emits them):
- **EXTENSION_UNAVAILABLE / "No active browser extension connected"** — bridge up, zero sockets; connect/reload the extension.
- **EADDRINUSE** — another process owns the port; benign (auto connect-to-existing) unless you need isolation — then set `FORENSIC_BRIDGE_PORT`.
- **Combined bridge+local errors** — format `"<bridge message> | local fallback also failed: [CODE] <local message>"`: both causes are surfaced so you can diagnose the real one; the machine-readable code is the local failure's.
- **TARGET_NOT_FOUND / TARGET_STALE / TARGET_INVALID(_XPATH)** — targeting problems, not plumbing; see dom-targeting/selector-recovery skills.
- **SCRIPT_TIMEOUT** — JS execution exceeded timeoutMs (cap 30000); split the script.
- **DOM_MUTATION_FAILED** — structured mutation failure with diagnostics; see dom-mutation skill.
- **SESSION_NOT_FOUND** — historical tools with a bad sessionId; `list_sessions` first.
- **PROJECT_EXISTS / PROJECT_NOT_FOUND / TAB_NOT_FOUND / EXTENSION_NOT_FOUND / NOT_SIMULATION** — name or context mismatches; verify with the corresponding list tools.
- **413 Payload too large** — HTTP upload > 50MB.
- **Unknown tool / "Live tool execution error in '<name>'"** — typo'd tool name or an exception escaping the handler; check `get_tool_catalog`.

## VALIDATION
- `/health` returns `status: "ok"` AND `connectedBrowsers ≥ 1` before you trust any live (non-simulated) result.
- `get_browser_session` shows a coherent model (tabs, counts, timelineEventCount > 0 after activity) — a healthy session accumulates events.
- A traced operation shows status + duration and its timeline correlation; operations that "vanished" (no trace) never reached the dispatch layer.
- `tools/list` from the stdio probe returns the full tool catalog; a short list means a stale/old server binary — rebuild and restart.

## RECOVERY
- Bridge dead: `npm run bridge`; if the port is held by a zombie, kill it or move ports via env; the MCP server reconnects to an existing bridge automatically.
- Everything simulated unexpectedly: connect the extension, then re-run `list_tabs` to confirm real tabs replace `simulated: true` output.
- stdio hang: restart the MCP server; verify with `scripts/test-mcp-stdio.js` before reconnecting the real client; check stderr for bridge startup notes.
- Persistent weirdness: capture `get_action_timeline` + `get_operation_trace` output as evidence before restarting — restarts destroy in-memory timelines.
