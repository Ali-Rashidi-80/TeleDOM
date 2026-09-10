---
name: extension-troubleshooting
description: Diagnose Chrome-extension-side problems — MV3 service worker suspension and 5s bridge reconnection, unreachable content scripts, reload_extension, ON/OFF DOM comparison, and unpacked loading via chrome-extension://.
version: 1.0.0
---

# Skill: Extension Troubleshooting

## PURPOSE
Fix the browser side of the bridge: the Manifest V3 extension whose service worker can be suspended at any time, the content scripts that must be injected per-page, and the question of whether the extension itself is polluting a page.

## WHEN TO USE
- Bridge health says `connectedBrowsers: 0` but Chrome is open.
- Tools intermittently fail with "No active browser extension connected" then recover (classic service-worker suspension).
- Content-script-dependent tools fail on specific pages only.
- You must prove the extension does/doesn't inject artifacts into a page (ON/OFF comparison).

## PREREQUISITES
- The unpacked extension loaded: `chrome://extensions` → Developer mode → **Load unpacked** → select the project's `chrome-extension/` directory. Extension pages are then reachable at `chrome-extension://<id>/…`.
- Project built (`npm run build` / `npm run build:extension`) so `chrome-extension/dist` matches the sources you are editing.
- Bridge running (`npm run bridge`), health check available.

## WORKFLOW
1. Confirm the socket: `curl http://localhost:3847/health` → `connectedBrowsers`. Zero while Chrome runs = the service worker is suspended or never connected.
2. Understand MV3 lifecycle: the background service worker connects to `ws://localhost:3847/extension`, heartbeats every 15s; the bridge prunes sockets silent > 75s. When Chrome suspends the worker, a reconnect timer retries every **5 seconds** — so transient unavailability self-heals; wait ~10s before acting.
3. Wake it deterministically: open any page (or the extension's popup / a `chrome-extension://<id>/…` page) — activity revives the service worker and the reconnect lands within the 5s window.
4. After rebuilding the extension: `reload_extension {extensionId}` — dispatches RELOAD_EXTENSION. In Node simulation it reports `reloaded: true` with the note "Simulated reload: extension state preserved"; for real reloads use `chrome://extensions` → reload icon, then re-check health. `list_extensions {}` shows installed extensions and status (in simulation a deterministic set marked `simulated: true`).
5. Content script unreachable on a page — check in order:
   - the page matches the manifest's injectable hosts (chrome:// pages, the Web Store and other protected pages are never content-scriptable — report this honestly, don't retry);
   - the extension was reloaded after the last build (stale content scripts still run the old code);
   - the tab was reloaded after the extension reload (content scripts only inject on navigation).
   Then `reload_tab {tabId, bypassCache: true}` and retest with `inspect_live_page`.
6. Prove injection impact: `compare_extension_states {extensionId, tabId, waitDurationMs?, ...paths}` — disable → hard reload → capture clean DOM/screenshot → enable → reload → capture injected → report `domSizeDifferenceChars` and `injectedMarkersDetected`. See the visual-dom-comparison skill for the full contract.
7. When the extension must stay off after a failed comparison: `set_extension_enabled {extensionId, enabled: true}` to restore it — never leave it disabled.

## TOOLS
`list_extensions`, `reload_extension`, `set_extension_enabled`, `toggle_extension`, `compare_extension_states`, `reload_tab`, `list_tabs`, `inspect_live_page`, `get_tab_console_logs`

## EXAMPLES
```
curl http://localhost:3847/health
tools/call list_extensions {}
tools/call reload_extension { "extensionId": "forensic-recorder@mcpdom" }
tools/call reload_tab { "tabId": 42, "bypassCache": true }
tools/call compare_extension_states { "extensionId": "forensic-recorder@mcpdom", "tabId": 42 }
```

## FAILURE MODES
- **"No active browser extension connected" (intermittent)** — MV3 worker suspension; the 5s reconnect timer heals it. If it persists > 30s, the bridge was restarted while Chrome was closed — reload the extension or open a page to trigger reconnect.
- **Content script never injects** — protected page (chrome://, store), host not matched by manifest, or stale build. Verify the three checks in the workflow; do not claim page access you don't have.
- **EXTENSION_NOT_FOUND** — extensionId typo or the extension was removed; `list_extensions` shows the real ids (simulation lists a fixed set with `simulated: true`).
- **Old behavior after code changes** — you rebuilt but did not reload the extension, or reloaded the extension but not the tab; both reloads are required.
- **Socket pruning loop** — heartbeats (15s) not arriving; usually the worker is repeatedly suspended on an idle machine; keep a page open or accept the 5s reconnect cadence.
- **`simulated: true` from extension tools** — no browser attached; these tools fall back to deterministic Node-side state; connect the extension for real data.

## VALIDATION
- `/health` shows `connectedBrowsers ≥ 1` AND stays ≥ 1 across two checks ~10s apart (socket stable, not flapping).
- `inspect_live_page` returns the real url/title of the intended tab (content script alive on that page).
- `get_tab_console_logs {tabId, level: "error"}` is clean of extension-origin errors after a reload.

## RECOVERY
- Full reset sequence: rebuild (`npm run build:extension`) → reload the extension in `chrome://extensions` → `reload_tab {bypassCache: true}` → health check → retry the tool.
- Bridge side suspect: restart `npm run bridge` FIRST (extension reconnects on its own timer) — restarting the extension is the slower lever.
- Still zero sockets: remove and re-load the unpacked extension from `chrome-extension/`, confirm the id in `chrome://extensions`, then verify via `/health`.
