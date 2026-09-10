# MCPDOM Browser v3 — Troubleshooting Guide

## Quick health checks

```bash
curl http://localhost:3847/health     # bridge status + connected browser count
npm run test:unit                     # 113 tests
npm run test:operational              # 121-tool stdio certification suite
```

## Error catalog (structured codes)

| Code | Meaning | Recovery |
|---|---|---|
| TARGET_NOT_FOUND | selector/xpath/nodeId matches nothing | `search_dom` to relocate, then `generate_element_target` |
| TARGET_STALE | logical node id no longer attached | Re-target; `recover_selector` with the stored snapshot |
| TAB_NOT_FOUND | tab id unknown/closed | `list_tabs` to re-enumerate |
| BRIDGE_DISCONNECTED / "No active browser extension connected" | no sockets on 3847 | Reload the extension; check `/health`; the local JSDOM fallback note is appended when applicable |
| EXTENSION_UNAVAILABLE | chrome.* APIs missing | Real browser + extension required |
| SCRIPT_TIMEOUT | JS execution exceeded timeoutMs | Raise `timeoutMs` (max 30000) or simplify the script |
| SERIALIZATION_FAILED | return value not JSON-serializable | Return primitives or explicit objects |
| DOM_MUTATION_FAILED | mutation invalid (missing attribute, orphan element, bad HTML) | Read the structured error; `preview_dom_mutation` before retrying |
| NO_OPEN_TRANSACTION | commit/rollback without begin | `mutate_dom_transaction {mode:'begin'}` first |
| PROJECT_EXISTS | project name already used | `list_projects`, pick a new name or `delete_project` |
| PROJECT_NOT_FOUND | project missing | `create_page_project` first |
| RECORDING_NOT_FOUND | recording id/name unknown | `list_command_recordings` (lookup accepts id OR name) |

## Common scenarios

### "No active browser extension connected to MCP bridge | local fallback also failed: [CODE] …"
Two failures combined (bridge + local). The `[CODE]` segment is the REAL local
cause — the bridge error is just the transport context. In the Node simulation
context, most tools succeed via the JSDOM fixture; when they fail, the local code
explains why.

### Bridge port already in use
The server auto-detects EADDRINUSE and connects to the existing bridge via the
HTTP proxy (`/api/mcp/tool`). If a STALE bridge is the problem:
`ss -tlnp | grep 3847` then kill the stale process, or set `FORENSIC_BRIDGE_PORT`.

### Extension not receiving commands
1. Service worker asleep (MV3)? Any WS message wakes it; heartbeats every 15s keep it alive.
2. The bridge liveness sweeper prunes sockets silent >75s — dead clients are
   removed automatically now.
3. `reload_extension` performs a self-reload (disable→enable for third-party).

### Selector worked yesterday, fails today
`diagnose_selector_failure` → `recover_selector` (with the snapshot stored in the
region annotation). Recovery REFUSES matches below 0.62 confidence — that refusal
is by design (never act on a wrong element).

### Import session seems slow / annotations exploding
Fixed in v3: `import_session` now remaps annotation sessionId to the imported
session (the old behavior doubled the source session's annotations on every
import). If you have an old affected store, the duplicated annotations share ids —
prune them.

### Simulated vs real results
Results from the Node simulation context carry `simulated: true`. They validate
tool contracts and DOM logic; they are NOT proof of real-browser behavior.
Real-browser validation requires the extension + Chrome.

## Debug channels

- Bridge logs → stderr of the bridge process (safe for stdio MCP).
- Operation correlation → `get_operation_trace` (per-operation timeline events).
- Timeline → `get_action_timeline {kind: 'ERROR_OCCURRED'}`.
- MCP stdio wire log → see `server.ts` debug-log path (disabled silently when unwritable).
