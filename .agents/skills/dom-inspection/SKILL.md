---
name: dom-inspection
description: Inspect live page structure, element metadata, computed styles, accessibility and semantic layout using the MCPDOM inspection and analyzer tool family.
version: 1.0.0
---

# Skill: DOM Inspection

## PURPOSE
Understand a live page's structure, elements, styles, semantics and health without modifying anything. This is the entry skill for almost every workflow: inspect before you interact, mutate, or capture.

## WHEN TO USE
- Starting any page investigation ("what is on this page?").
- Locating an element before interacting with it.
- Diagnosing layout, accessibility, or content problems.
- Building the context needed for region capture or reconstruction.

## PREREQUISITES
- MCP server running (`node bin/mcp-server.js` or via a client config).
- Either a Chrome extension connected to the bridge OR the Node simulation context (JSDOM fixture) — simulated results are marked `simulated: true`.
- Optional: a recording session id for historical analysis.

## WORKFLOW
1. `inspect_live_page` — page-level metadata (url, title, viewport, frames, active element).
2. `inspect_live_element {selector}` — deep element info (bounds, visibility, state, context, forensics).
3. `search_dom {query}` — find elements by text/tag/attr when you don't know selectors.
4. `analyze_dom {analyzer}` — run a named analyzer:
   - `census_interactive_elements`, `detect_semantic_elements`, `scan_accessibility_issues`
   - `analyze_forms`, `extract_links`, `analyze_media`, `extract_tables`, `extract_lists`
   - `get_css_variables`, `analyze_fonts`, `extract_color_palette`
   - `detect_zindex_conflicts`, `detect_layout_issues`, `detect_dead_click_targets`
   - `inventory_animations`, `map_frame_tree`, `inventory_shadow_roots`
   - `inspect_page_storage`, `get_performance_metrics`, `extract_seo_metadata`, `extract_structured_data`
   - `analyze_page_content`, `inventory_ctas`, `detect_focus_traps`, `infer_responsive_breakpoints`, `get_selection_state`
5. `get_element_ancestry` / `get_element_relationships` — structural context.
6. `get_element_accessibility` / `get_computed_style` — deep dives.

## TOOLS
`inspect_live_page`, `inspect_live_element`, `search_dom`, `analyze_dom`, `get_element_ancestry`, `get_element_relationships`, `get_element_accessibility`, `get_element_fingerprint`, `get_computed_style`, `get_live_dom_snapshot`, `get_live_dom_subtree`, `get_element_visual_state`, `get_page_blueprint`, `get_tab_console_logs`, `get_tab_network_requests`

## EXAMPLES
```
tools/call inspect_live_page {}
tools/call search_dom { "query": "login" }
tools/call analyze_dom { "analyzer": "scan_accessibility_issues" }
tools/call get_element_ancestry { "selector": "#main-nav" }
```

## FAILURE MODES
- **"No active browser extension connected"** — no Chrome attached; in Node simulation most inspection still works via the JSDOM fixture. If the error persists with no local DOM, the bridge has no sockets.
- **TARGET_NOT_FOUND** — selector matches nothing: element removed, inside shadow root, or in a cross-origin frame (`map_frame_tree` reveals frame limits honestly).
- **STYLE_UNAVAILABLE** — computed style API missing in exotic contexts.
- Analyzers report `warnings` for APIs unavailable in the current context — read them; they are honesty markers, not noise.

## VALIDATION
- `inspect_live_page` returns a `viewport` and `url` — non-empty means live data.
- Analyzers return `count`, `items`, `warnings` — inspect `warnings` to understand coverage limits.
- Cross-check: `search_dom` results should overlap `census_interactive_elements` for interactive tags.

## RECOVERY
- If the bridge is down: check `http://localhost:3847/health`; restart with `npm run bridge` and reload the extension.
- If a selector fails: switch to `search_dom`, then `generate_element_target` on a found element.
- If a frame is inaccessible: capture the parent page and report the limitation — never fabricate frame contents.
