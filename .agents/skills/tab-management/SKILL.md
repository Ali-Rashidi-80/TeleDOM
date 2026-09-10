---
name: tab-management
description: Manage browser tabs (list/open/focus/close/reload) and inspect the coherent browser session model with stable session identities that survive bridge reconnects.
version: 1.0.0
---

# Skill: Tab Management

## PURPOSE
Control which page you are operating on and keep a stable mental model of the browser. Tabs are addressed by browser tabId, while the session model maintains its own stable session identities (OPEN/CLOSED/STALE) so that stale references after reconnects are detectable instead of silent.

## WHEN TO USE
- Starting work on a specific page when several tabs are open (always `list_tabs` first).
- Multi-page workflows: open a second tab, drive it, focus back.
- Post-reconnect triage: figure out which tabs the session still trusts.
- Any time a tool call targets the wrong page — you probably have the wrong active tab.
- After a page reload or SPA route change, before trusting any element reference captured on the previous state.

## PREREQUISITES
- MCP server running with the bridge up (`http://localhost:3847/health`).
- Real tab control requires the Chrome extension connected (`connectedBrowsers > 0` in the health payload).
- Without a browser, tab tools run against deterministic in-memory simulated tab state in the Node context — every response is marked `simulated: true` and says a real tab list requires the extension.

## WORKFLOW
1. `list_tabs {}` — tabs with browser tabId, title, URL, active state. In Node simulation this returns the deterministic simulated tab set plus a note; treat it as scaffolding for command sequencing, not as ground truth.
2. `open_tab {url, active}` — open (and optionally focus) a new tab; the session model records TAB_OPENED on its timeline.
3. `focus_tab {tabId}` — bring a tab to the foreground; subsequent page-scoped tools act on it.
4. `reload_tab {tabId, bypassCache}` — hard reload when you need a pristine render (default cache allowed).
5. `close_tab {tabId}` — closed tabs flip to status CLOSED in the session model (they stay queryable as history, not as targets).
6. `get_browser_session {}` — the coherent model: `sessionId`, tabs with `sessionTabId` (stable identity, e.g. `stab_3_...`), `browserTabId`, status OPEN/CLOSED/STALE, activeTabId, viewport state, `extensionEnabled`, plus snapshot/command/mutation/annotation/timeline counts and the bound `projectId`.
7. After any bridge outage, re-run `get_browser_session` — tabs suspected dead are marked STALE (markAllStale); a re-registered tab flips back to OPEN and refreshes `lastSeenAt`.

## TOOLS
`list_tabs`, `open_tab`, `focus_tab`, `reload_tab`, `close_tab`, `get_browser_session`, `get_action_timeline`, `list_extensions`

## EXAMPLES
```
tools/call list_tabs {}
tools/call open_tab { "url": "https://example.com/pricing", "active": true }
tools/call focus_tab { "tabId": 42 }
tools/call reload_tab { "tabId": 42, "bypassCache": true }
tools/call get_browser_session {}
```

## FAILURE MODES
- **TAB_NOT_FOUND** — no tab matches the given tabId (in simulation: "No simulated tab with tabId=…"); the tab was closed or the id came from a stale session. Re-list tabs.
- **"No active browser extension connected"** — bridge has no sockets; responses fall back to `simulated: true` tab state. Connect the extension, then `list_tabs` again.
- **STALE tab identity** — after a bridge reconnect the session model marks open tabs STALE; acting through a stale reference is unreliable until the tab re-registers.
- **Wrong-page actions** — tools defaulted to the active tab; if the user navigated manually, the active tab changed under you. Verify with `inspect_live_page`.

## VALIDATION
- `list_tabs` output lists each tab with id/title/url/active — the active flag must match where you intend to act.
- `get_browser_session` shows tab statuses; all targets you plan to use should be OPEN.
- `get_action_timeline {kind: "TAB_OPENED"}` (also TAB_SWITCHED / TAB_CLOSED) confirms your tab operations actually happened.
- `reload_tab` output reflects the requested `bypassCache`; a no-op reload on a simulated tab does not clear real browser cache.

## RECOVERY
- Bridge down: check `http://localhost:3847/health`, restart with `npm run bridge`, reload the extension (extension-troubleshooting skill).
- Stale tab references: re-list tabs, re-focus the intended one, and re-resolve any element targets captured on the old tab state (browser-state-recovery skill).
- Simulated tab state when you expected real: connect the Chrome extension and confirm `connectedBrowsers` ≥ 1 before trusting tab output.
