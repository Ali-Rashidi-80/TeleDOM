# The 30 MCPDOM-Native Advanced Forensic Capabilities (§17)

Every capability is implemented as real algorithmic work over recorded session
data (mutations, network, console, screenshots, checkpoints), live DOM probes,
or both. Results are structured, evidence-based, and carry confidence from the
CAP 29 evidence model. None are placeholder wrappers (§18 quality gate).

| CAP | Capability | Tool(s) | Implementation | Primary dependencies | What it really computes |
|-----|-----------|---------|-----------------|---------------------|------------------------|
| 01 | DOM + network causal correlator | `fx_correlate_dom_network` | `src/forensics/correlators/causality.ts` | temporal-correlation | Anchors a mutation/request, reconstructs request→response→render chains, ranks candidates by domain-prior × temporal-decay, scores confidence with the evidence model |
| 02 | DOM regression diff | `fx_dom_regression_diff` | `src/forensics/analyzers/regression-diff.ts` | StateReconstructor (time-travel) | 8-dimension diff (added/removed/moved/attributes/styles/text/layout/a11y) between reconstructed states; machine + human output |
| 03 | Visual regression forensics | `fx_visual_regression_forensics` | `src/forensics/analyzers/visual-regression.ts` | PNG decoder, regression-diff | Real PNG decode (zlib inflate + un-filter) → grid region diff → attribution of visual change to concurrent DOM/style mutations; pixel diff alone is never the conclusion |
| 04 | Layout shift forensics | `fx_layout_shift_forensics` | `src/forensics/correlators/causality.ts` | temporal-correlation | Evidence chain: affected element, position transitions (screenshot checkpoints), trigger mutations, concurrent requests, style changes |
| 05 | Interaction replay | `fx_record_interactions`, `fx_replay_interactions` | `src/forensics/session/interaction-replay.ts` | LIVE_ELEMENT_INTERACT, node registry | Records steps with DOM fingerprints (matched count, classes, stable attrs, mutation baseline); replays deterministically with EXACT → fingerprint RECOVERED → FAILED target resolution |
| 06 | Failure replay | `fx_failure_replay` | `src/forensics/session/interaction-replay.ts` | session events | Captures URL/page state/selector candidates/DOM subtree/console/network/timing/action history as a replayable scenario; replay re-executes with resilient resolution |
| 07 | Selector survivability scorer | `fx_selector_survivability` | `src/forensics/analyzers/structure.ts` | mutation history | Weighted scoring: DOM stability (mutation churn), semantics, uniqueness, ancestry depth, framework-hash risk, text volatility, position dependence |
| 08 | Component boundary detector | `fx_component_boundaries` | `src/forensics/analyzers/structure.ts` | snapshot + mutations | Framework inference (React/Vue/Angular/WebComponents markers) + whole-subtree-replacement re-render signatures; per-boundary confidence + evidence |
| 09 | Frame/iframe forensics | `fx_frame_forensics` | `src/forensics/analyzers/structure.ts` | snapshot + events | Frame hierarchy (nested frames), cross-origin detection, per-frame network/console/DOM event attribution, frame-local selectors |
| 10 | Shadow DOM forensics | `fx_shadow_dom_forensics` | `src/forensics/analyzers/structure.ts` + live probe | recorder shadow flags | Open/nested roots, host relationships, slot distribution, shadow-tree mutations, live probe of open roots (closed roots reported as inaccessible by design) |
| 11 | CSS influence analyzer | `fx_css_influence` | `src/forensics/analyzers/live-dom.ts` | page CSSOM | Enumerates stylesheets, matches rules against element + ancestors (inheritance), computes (ids, classes, elements) specificity, ranks by property-group relevance |
| 12 | Z-index/occlusion forensics | `fx_zindex_occlusion` | `src/forensics/analyzers/live-dom.ts` | page computed styles | Stacking-context chain per CSS spec (position/z-index/transform/filter/opacity/isolation), effective z-order, hit-test at center, clipping parent, pointer-events interception, zero-size detection |
| 13 | Event listener forensics | `fx_event_listeners` | `src/forensics/analyzers/live-dom.ts` + page-script instrumentation | `window.__mcpdom_listeners__` | Inline on* attributes + instrumented addEventListener registrations (capture/passive flags, handler previews, framework ownership heuristics); coverage honestly reported |
| 14 | Runtime error root-cause graph | `fx_error_root_cause` | `src/forensics/correlators/causality.ts` | temporal-correlation | Graph: error → stack trace → source location → failed request → mutations → visible symptoms; ranked root causes |
| 15 | Network-to-DOM binding | `fx_network_dom_binding` | `src/forensics/correlators/causality.ts` | temporal-correlation | Response → mutations window → region grouping; JSON/JS content-type prior; confidence + unbound requests with reasons |
| 16 | Resource waterfall forensics | `fx_resource_waterfall` | `src/forensics/correlators/causality.ts` | temporal-correlation | Unified waterfall (document/CSS/JS/font/image/fetch) with request/complete/failed phases, timings, DOM-ready + visual milestones, slowest ranking |
| 17 | Font rendering forensics | `fx_font_forensics` | `src/forensics/analyzers/live-dom.ts` | page CSSOM + document.fonts | @font-face vs computed usage vs load status: undeclared families, font-display, no-fallback stacks, not-loaded faces |
| 18 | A11y + DOM divergence | `fx_a11y_divergence` | `src/forensics/analyzers/a11y-divergence.ts` | snapshot | Builds the a11y view (roles/names) from DOM; finds missing names, missing alt, semantic mismatches, hidden-but-relevant content, unexpected accessible nodes |
| 19 | Page health score | `fx_page_health` | `src/forensics/engine/health-planner-search.ts` | all signals | Weighted composite (console 20%, network 20%, performance 20%, a11y 15%, layout 10%, memory/interactions/anomalies 5% each) with 8 inspectable subscores |
| 20 | Agent exploration planner | `fx_exploration_planner` | `src/forensics/engine/health-planner-search.ts` | events | Symptom-routed action plans (tool + rationale + expected outcome) + data-gap reporting; never autonomous browsing |
| 21 | Smart snapshot compression | `fx_smart_snapshot` | `src/forensics/engine/snapshot-impact-journal.ts` | snapshots | MINIMAL/SEMANTIC/INTERACTION/FORENSIC/FULL transforms with compression ratio + token estimates; mode auto-recommendation from a question |
| 22 | Cross-signal search | `fx_cross_signal_search` | `src/forensics/engine/health-planner-search.ts` | events | One query across DOM/mutations/console/network/navigation/interactions/screenshots; selector tokens weight stronger; temporally-adjacent related evidence |
| 23 | Forensic session export | `fx_forensic_export` | `src/forensics/engine/graph-report-portability.ts` | findings + health | Deterministic bundle (stable ordering, SHA-256 content hash) with timeline/evidence/findings/health/incident report |
| 24 | Forensic session import | `fx_forensic_import` | same | bundle | Format + hash verification (tamper detection); installs as HISTORICAL evidence (`importedInvestigation: true`) — never live state |
| 25 | Change impact predictor | `fx_impact_prediction` | `src/forensics/engine/snapshot-impact-journal.ts` | snapshots + annotations | Subtree impact, stored-selector breakage, listener orphan estimates, layout/a11y severity, form-state loss; integrates with the mutation preview workflow |
| 26 | Safe mutation guard | `fx_safe_mutation_guard` | same | CAP 25 prediction | Verdict SAFE/CAUTION/HIGH_RISK/BLOCKED with reasons + required precautions; BLOCKED only for page-level destruction or irreversible input loss |
| 27 | DOM transaction journal | `fx_transaction_journal` | `src/forensics/engine/snapshot-impact-journal.ts` | mutation engine | Per-transaction BEFORE/INTENT/ACTION/AFTER/DIFF/EVIDENCE/TIMESTAMP/ACTOR/ROLLBACK records wired into mutate_dom flows; integrates with undo/redo |
| 28 | Multi-page session graph | `fx_session_graph` | `src/forensics/engine/graph-report-portability.ts` | events + page identities | Nodes/edges over pages/frames/navigations/requests/interactions/screenshots/DOM states; interaction→request causality edges |
| 29 | Forensic evidence scoring | `fx_evidence_scoring` | `src/forensics/evidence-model.ts` | any findings | Noisy-OR over evidence weights + source-diversity bonus − contradiction penalty; capped [0.05, 0.98]; single-evidence cap 0.75 — the model behind every fx_ conclusion |
| 30 | Incident report generator | `fx_incident_report` | `src/forensics/engine/graph-report-portability.ts` | CAP 14 + health | Structured report (summary/timeline/root cause/evidence/affected DOM+requests+components/performance+a11y impact/remediation/validation/confidence) in JSON AND Markdown |

## The evidence model (CAP 29) — shared scoring

```text
confidence = noisyOR(w_evidence) + diversityBonus(types)   [cap 0.98]
             × (1 − w_contradiction)                       [floor 0.05]
single-evidence findings cap at 0.75
```

| Evidence source | Weight |
|---|---|
| MUTATION_RECORD | 0.80 |
| USER_INTERACTION | 0.70 |
| DOM_OBSERVATION | 0.72 |
| CONSOLE_EVIDENCE | 0.68 |
| STYLE_EVIDENCE | 0.66 |
| NAVIGATION_RECORD | 0.60 |
| NETWORK_CORRELATION / PERFORMANCE_TRACE | 0.55 |
| SCREENSHOT_EVIDENCE | 0.50 |
| MEMORY_EVIDENCE | 0.45 |
| INFERRED | 0.30 |

## Testing coverage (§19)

- **Unit** (`tests/unit/forensics-capabilities.test.ts`): 40+ tests — schemas, algorithms, edge cases (empty sessions, tampered bundles, no-signal planners, identical images).
- **Operational** (`operational-tests/tools/187–211-*`): every fx_ tool exercised over real stdio JSON-RPC against the seeded session, including record→replay and export→import round-trips.
- **Simulation**: every result in the JSDOM context is deterministic and labeled; the operational suite verifies the contracts.
