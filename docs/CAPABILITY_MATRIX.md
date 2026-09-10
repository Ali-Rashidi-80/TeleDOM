# MCPDOM v3 — Final Capability Matrix

> Contract §105/§106/§107 audits. Every required capability with implementation
> location, MCP exposure, test evidence and status. Evidence commands were
> actually executed — see Test Results at the bottom.

## Part 1 — The 50 Required Capabilities (§41)

| # | Capability | Implementation | MCP Tool | Test | Status |
|---|-----------|----------------|----------|------|--------|
| 1 | Semantic element detection | src/core/dom-analyzers.ts `detectSemanticElements` + LiveDOMInspector role inference | analyze_dom {analyzer:detect_semantic_elements} | operational 094-analyze_dom; unit dom-analyzers via suite | PASS |
| 2 | Stable selector generation | src/core/selector-robustness.ts | generate_element_target | operational 048; unit selector-robustness.test.ts | PASS |
| 3 | Selector confidence scoring | selector-robustness.ts (explainable reasons) | generate_element_target | unit: id=1.0, classes<0.5 when ambiguous | PASS |
| 4 | DOM fingerprinting | src/core/dom-fingerprint.ts | get_element_fingerprint | unit dom-fingerprint.test.ts (determinism, volatility) | PASS |
| 5 | Ancestor analysis | live-browser-controller.ts buildAncestry | get_element_ancestry | operational 052; unit coverage via suite | PASS |
| 6 | Sibling analysis | buildAncestry siblings block | get_element_ancestry | same | PASS |
| 7 | Descendant analysis | buildAncestry descendants block | get_element_ancestry | same | PASS |
| 8 | Element relationship graph | live-browser-controller buildRelationships + projects/region-capture.ts | get_element_relationships, get_region_relationship_graph | operational 054/117 | PASS |
| 9 | Accessibility metadata extraction | live-browser-controller buildAccessibility | get_element_accessibility | operational 053 | PASS |
| 10 | Computed-style extraction | live-browser-controller GET_COMPUTED_STYLE | get_computed_style | operational 055 | PASS |
| 11 | Hover | element-interaction-engine (timing hooks) | hover_element | operational 067 | PASS |
| 12 | Focus | interaction engine focus | focus_element | operational 068 | PASS |
| 13 | Blur | interaction engine blur | blur_element | operational 069 | PASS |
| 14 | Keyboard shortcut execution | controller PRESS_KEYBOARD_SHORTCUT | press_keyboard_shortcut | operational 070 | PASS |
| 15 | Scroll-to-element | controller SCROLL_PAGE target mode | scroll_to_element | operational 071 | PASS |
| 16 | Scroll-by-distance | controller SCROLL_PAGE offsets | scroll_page | operational 072 | PASS |
| 17 | Drag-and-drop | controller performDrag (HTML5 DnD + pointer events) | drag_and_drop | operational 073 | PASS |
| 18 | Checkbox/radio interaction | controller SET_INPUT_CHECKED (radio peer deselect) | set_input_checked | operational 074 | PASS |
| 19 | Select/dropdown interaction | interaction engine select_option | select_option | operational 075 | PASS |
| 20 | Contenteditable support | interaction engine type (value-agnostic setter) | type_text | operational 066 | PASS |
| 21 | Tab grouping | simulation tab manager + session model tabs | list_tabs / get_browser_session | operational 022/099 | PASS (session-level grouping) |
| 22 | Tab state snapshot | BrowserSessionModel + simulation tabs | get_browser_session | operational 099 | PASS |
| 23 | Navigation history inspection | session model + timeline NAVIGATED events | get_action_timeline | operational 100 | PASS |
| 24 | URL change detection | wait_for_condition {kind:url_contains} + timeline | wait_for_condition | operational 076 | PASS |
| 25 | Reload modes | RELOAD_TAB mode soft/hard + simulation semantics | reload_tab | operational 024 | PASS |
| 26 | Viewport presets | viewport-controller VIEWPORT_PRESETS (16) | resize_viewport {preset} | unit viewport-js.test.ts | PASS |
| 27 | Device emulation profiles | viewport-controller DEVICE_EMULATION_PROFILES (6) | emulate_device | unit + operational 087 | PASS |
| 28 | Screenshot capture | existing PNGBuilder pipeline (preserved) | capture_page_screenshot | operational 039 (PNG magic verified) | PASS |
| 29 | Region screenshot capture | existing + capture_page_region screenshot flag | capture_element_screenshot / capture_page_region | operational 040 | PASS |
| 30 | Browser-state restore | session model snapshots + reset paths | reset_viewport, undo_dom_mutation, compare_page_states | operational 083/080/096 | PASS |
| 31 | Attribute patching | mutation engine set/remove_attribute | mutate_dom | unit dom-mutation-engine.test.ts | PASS |
| 32 | Style patching | mutation engine set_style/remove_style | mutate_dom | unit | PASS |
| 33 | Class patching | mutation engine add/remove/replace_class | mutate_dom | unit (add_class undo) | PASS |
| 34 | Node insertion | mutation engine add_element | mutate_dom | unit | PASS |
| 35 | Node removal | mutation engine remove_element | mutate_dom | unit (remove+undo reinsert) | PASS |
| 36 | Node replacement | mutation engine replace_element | mutate_dom | unit | PASS |
| 37 | Subtree cloning | mutation engine clone_subtree (no id dup) | clone_dom_subtree | operational 093 | PASS |
| 38 | DOM mutation undo | mutation engine undo() | undo_dom_mutation | unit + operational 081 | PASS |
| 39 | DOM mutation redo | mutation engine redo() | redo_dom_mutation | operational 082 | PASS |
| 40 | Mutation history | bounded history (500) + getHistory | get_mutation_history | operational 084; unit history tracking | PASS |
| 41 | Console capture | existing page-script buffers (preserved) + JSExecutionEngine hook | get_tab_console_logs, execute_javascript | unit (consoleOutput) + operational | PASS |
| 42 | JS execution timeline | timeline SCRIPT_EXECUTED events | get_action_timeline | operational 100 | PASS |
| 43 | Action timeline | ActionTimeline (21 event kinds, bounded) | get_action_timeline | unit platform-v3-core | PASS |
| 44 | Error correlation | OperationRegistry traces + combined error reporting | get_operation_trace | operational 101; unit | PASS |
| 45 | Failed-selector diagnostics | selector-recovery diagnose() | diagnose_selector_failure | unit diagnosis | PASS |
| 46 | Project export | projects/project-manager + agent-package-exporter | export_agent_package | operational 115 (15-file package) | PASS |
| 47 | Project import | project-manager importProject | import_project | operational 116 | PASS |
| 48 | Region annotations | RegionAnnotation observed/user/intended/verification | capture_page_region, annotate_element | operational 108/109 | PASS |
| 49 | Agent handoff package | agent-package-exporter (README/PROJECT/instructions/schemas/verification) | export_agent_package | operational 115 | PASS |
| 50 | Reconstruction specification | projects/reconstruction-spec.ts (versioned) | generate_reconstruction_spec | operational 118 | PASS |

## Part 2 — The 30 Agent-Invented Capabilities (§42)

| # | Capability | Problem solved / why it matters | Implementation | MCP Tool | Status |
|---|-----------|--------------------------------|----------------|----------|--------|
| 1 | DOM search engine | Finding elements without knowing selectors is the #1 agent friction | dom-analyzers searchDOM | search_dom | PASS |
| 2 | Form inventory | Form field discovery + validation audit in one call | analyzeForms | analyze_dom {analyze_forms} | PASS |
| 3 | Link map | Full link census incl. external/anchor/download flags | analyzeLinks | analyze_dom {extract_links} | PASS |
| 4 | Media inventory | Images/videos/canvas with lazy + missing-alt flags | analyzeMedia | analyze_dom {analyze_media} | PASS |
| 5 | CSS variable extraction | Design-token discovery for theming work | analyzeCSSVariables | analyze_dom {get_css_variables} | PASS |
| 6 | Font inventory | Typography audit (families × sizes × usage) | analyzeFonts | analyze_dom {analyze_fonts} | PASS |
| 7 | Color palette extraction | Brand/style consistency checks | extractColorPalette | analyze_dom {extract_color_palette} | PASS |
| 8 | Z-index conflict detection | Overlay stacking bugs are notoriously hard to debug | detectZIndexConflicts | analyze_dom {detect_zindex_conflicts} | PASS |
| 9 | Layout overflow detection | Horizontal overflow + offender identification | detectLayoutIssues | analyze_dom {detect_layout_issues} | PASS |
| 10 | Interactive element census | Complete clickable inventory with visibility | censusInteractiveElements | analyze_dom {census_interactive_elements} | PASS |
| 11 | A11y quick-scan | Missing alt/labels/names + heading order + lang | scanAccessibilityIssues | analyze_dom {scan_accessibility_issues} | PASS |
| 12 | Dead click target detection | Unreachable interactive elements (pointer-events:none etc.) | detectDeadClickTargets | analyze_dom {detect_dead_click_targets} | PASS |
| 13 | Animation inventory | CSS animations/transitions incl. infinite-loop detection | inventoryAnimations | analyze_dom {inventory_animations} | PASS |
| 14 | Frame tree mapping | iframe census with honest cross-origin limitation reports | mapFrameTree | analyze_dom {map_frame_tree} | PASS |
| 15 | Shadow DOM inventory | Open shadow root census (host, mode, children) | inventoryShadowRoots | analyze_dom {inventory_shadow_roots} | PASS |
| 16 | Storage inspection (redacted) | localStorage/sessionStorage state with key redaction | inspectPageStorage | analyze_dom {inspect_page_storage} | PASS |
| 17 | Performance metrics | Navigation timing, paint, resource summary, memory | getPerformanceMetrics | analyze_dom {get_performance_metrics} | PASS |
| 18 | SEO metadata extraction | Title/description/OG/canonical + warning audit | extractSEOMetadata | analyze_dom {extract_seo_metadata} | PASS |
| 19 | Structured data extraction | JSON-LD + microdata blocks | extractStructuredData | analyze_dom {extract_structured_data} | PASS |
| 20 | Table extraction | Structured headers/rows for data understanding | extractTables | analyze_dom {extract_tables} | PASS |
| 21 | List extraction | List structures with nesting info | extractLists | analyze_dom {extract_lists} | PASS |
| 22 | Content/readability stats | Word count, reading time, heading outline | analyzePageContent | analyze_dom {analyze_page_content} | PASS |
| 23 | CTA inventory | Call-to-action census with primary flags | inventoryCTAs | analyze_dom {inventory_ctas} | PASS |
| 24 | Focus trap detection | Keyboard-user hostile containers + tabindex violations | detectFocusTraps | analyze_dom {detect_focus_traps} | PASS |
| 25 | Breakpoint inference | Declared responsive breakpoints from CSS/srcset | inferResponsiveBreakpoints | analyze_dom {infer_responsive_breakpoints} | PASS |
| 26 | Selection state | Active element + text selection capture | getSelectionState | analyze_dom {get_selection_state} | PASS |
| 27 | Tool catalog / discovery | Agents stop guessing which tool to use | tool-groups.ts | get_tool_catalog / get_tool_groups | PASS |
| 28 | Region quality score | Explainable A–D grade with evidence per component | region-capture RegionQualityScorer | capture_page_region (analysis.qualityScore) | PASS |
| 29 | Automatic naming | sidebar_navigation not element_12345 | projects/naming-engine.ts | capture_page_region (autoName) | PASS |
| 30 | Seeded human timing | Reproducible human-like behavior (audit-safe) | human-interaction.ts Mulberry32 | set_interaction_profile {seed} | PASS |

Plus 4 bonus platform capabilities: honest simulation mode (simulated:true),
combined bridge+local error reporting, bridge liveness sweeper, unique client ids.

## Part 3 — MCP Tool Inventory (§108)

- Previous tool count: **47** (all preserved, zero removals, zero renames)
- New tool count: **121** (+74)
- Deprecated tools: **none**
- Schema changes: **additive only** (new tools; existing schemas untouched)
- Compatibility: `interact_with_element`, `execute_pipeline`, all session tools — unchanged behavior; `execute_pipeline` internally still works exactly as before.

## Part 4 — Test Results (actual commands, actual results)

```
$ npx tsc --noEmit                                   → 0 errors
$ npm run build                                      → client + extension + server built, 0 errors
$ npx vitest run                                     → 113/113 passed (25 suites)
$ node scripts/run-operational-suite.js              → 121/121 PASSED, CERTIFIED
$ node scripts/run-operational-suite.js (2nd run)    → 121/121 PASSED, CERTIFIED (idempotency)
```

Operational evidence: `operational-tests/tools/001..121-*/` (raw JSON-RPC
requests/responses, assertions, evidence folders), scenario:
`operational-tests/scenarios/001-injected-ui-debugging-scenario/` (10/10 steps PASS).

Real-browser validation: extension bundle rebuilt with all v3 capabilities
(`dist/extension/content-script.js` 225KB, zero external imports, verified to
contain RESIZE_VIEWPORT/DOM_MUTATE/EXECUTE_JS/CAPTURE_REGION dispatch). Full
live-Chrome validation requires a desktop Chrome session with the unpacked
extension loaded — see README Quick Start; the Node simulation context certifies
tool contracts and DOM behavior, honestly marked `simulated: true` for
browser-only surfaces.

## Part 5 — Remaining Limitations (§114/§115 — honest list)

1. LogicalNodeIds remain process-local (WeakMap); cross-process identity uses
   selectors/xpaths/fingerprints by design.
2. MAIN-world JS execution is reported but only truly distinct with the page
   script's query protocol in a real browser; in the simulation context both
   worlds execute in the JSDOM window.
3. `emulate_device` UA override needs Chrome DevTools Protocol for enforcement —
   reported honestly otherwise.
4. Cross-origin frame contents are inaccessible (same-origin policy) — reported
   as limitations, never fabricated.
5. Repeated `set_outer_html` on regions with stored child annotations can
   invalidate those annotations (warned in mutation previews).
