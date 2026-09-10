---
name: viewport-testing
description: Resize and restore the viewport reversibly, run multi-viewport responsive workflows with per-step DOM digests, and emulate device profiles with honest UA reporting.
version: 1.0.0
---

# Skill: Viewport Testing

## PURPOSE
Test responsive behavior without losing the original state. Every resize records the original dimensions exactly once, `reset_viewport` is a guaranteed restore, and the multi-viewport workflow measures DOM length, interactive count and horizontal overflow at each step before restoring.

## WHEN TO USE
- Verifying layout/behavior at desktop, tablet and mobile sizes.
- Hunting horizontal overflow or content that only renders at certain widths.
- Reproducing a mobile-only bug from a desktop-driven session.
- Before capturing regions/screenshots that must reflect a specific viewport.
- Checking a fix at the exact viewport a user reported (e.g. "broken on iPhone 12").

## PREREQUISITES
- MCP server running; page loaded in the extension (real window resize via the background service worker / chrome.windows) or in the Node simulation context, where the viewport is updated in-memory and results report `mode: "simulation"`.
- Nothing else concurrently resizing the window — it would fight the original-viewport tracking.

## WORKFLOW
1. `get_viewport_state {}` — current width/height/devicePixelRatio/scroll plus the recorded `original` and `isModified`. Baseline before testing.
2. `resize_viewport {width, height}` or `{preset}` — presets include `desktop-full-hd` (1920×1080), `desktop-hd` (1366×768), `desktop-laptop` (1440×900), `tablet-ipad` (768×1024), `tablet-ipad-pro` (1024×1366), `mobile-iphone-12` (390×844), `mobile-iphone-se` (375×667), `mobile-pixel-7` (412×915), `mobile-galaxy-s8`, `mobile-small` (320×568), `test-square`… Dimensions clamp to 200–7680 × 200–4320. The result carries `previous`, `original`, before/after page digests and `reversible: true`.
3. `emulate_device {device}` — viewport + devicePixelRatio + touch metadata + reported UA. Devices: `iphone-13`, `ipad-air`, `pixel-7`, `galaxy-s23`, `macbook-pro-16`, `windows-desktop`.
4. Inspect at the new size: `analyze_dom` (e.g. `infer_responsive_breakpoints`), `inspect_live_element`, `get_element_visual_state` — then capture regions/screenshots if needed.
5. `run_responsive_test {sizes?, restore?}` — one-shot multi-viewport workflow. Defaults: 1440×900, 1024x768, 768×1024, 375×667. Per step it records `domLength`, `interactiveCount`, `horizontalOverflow`; output includes step results, `comparisons` (domLengthDelta / interactiveDelta between consecutive steps), `originalViewport`, `finalViewport` and `restored`.
6. `reset_viewport {}` — guaranteed restore of the original dimensions; also clears the active preset/device. Run this at the end of every test unless the workflow already restored (`restore: true` is the default).
7. Confirm with `get_viewport_state` — `isModified` must be false again.
8. Naming your own sizes: pass `{label, width, height}` entries to `run_responsive_test` so comparisons and reports carry meaningful step names.

## TOOLS
`resize_viewport`, `reset_viewport`, `get_viewport_state`, `run_responsive_test`, `emulate_device`, `analyze_dom`, `get_element_visual_state`, `capture_page_screenshot`

## EXAMPLES
```
tools/call get_viewport_state {}
tools/call resize_viewport { "preset": "mobile-iphone-12" }
tools/call emulate_device { "device": "iphone-13" }
tools/call run_responsive_test { "sizes": [ { "label": "desktop", "width": 1440, "height": 900 }, { "label": "mobile", "width": 375, "height": 667 } ] }
tools/call reset_viewport {}
```

## FAILURE MODES
- **UNKNOWN_PRESET / UNKNOWN_DEVICE** — the name is not in the registry; the error lists all valid names. Use raw width/height instead.
- **UA override not enforced** — `emulate_device` reports honestly: the UA string is applied only in a real browser session; in simulation the viewport/dpr/touch metadata are applied and the UA is reported but not enforced (see `userAgentNote` / `userAgentApplied: false`). Never claim UA-level testing from simulation.
- **Resize has no visible effect** — you are in a context where the window API is not reachable; check the `mode` field (`simulation` vs `browser-window`).
- **Original lost** — cannot happen through the tools (recorded on first resize), but a manual user resize during the test shifts the baseline; re-read `get_viewport_state.original`.

## VALIDATION
- Every resize result echoes `original` and `reversible: true`; if `original` differs from your session start, someone resized in between.
- `run_responsive_test` steps must each carry domLength/interactiveCount/horizontalOverflow; `restored: true` plus `finalViewport == originalViewport` closes the loop.
- Overflow detection: `horizontalOverflow: true` at mobile widths is the classic responsive defect signal.
- Device emulation results carry `userAgentApplied` — only claim UA-level testing when it is true.

## RECOVERY
- Always end with `reset_viewport` — even after errors mid-workflow, it restores the recorded original.
- If a responsive test left the page in a weird scroll state, `scroll_page {x: 0, y: 0}` or `reload_tab` after reset.
- Simulation-mode doubt: verify real-browser behavior through the extension before signing off on responsive fixes.
