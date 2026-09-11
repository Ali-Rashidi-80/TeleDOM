# TeleDOM v4 — Competitor & Ecosystem Analysis

> Positioning evidence for the v4→v4 transformation. Primary sources: official
> documentation/repositories of each system, their public issue trackers (2026
> signals), and the v4 roadmap's own ecosystem research. TeleDOM's response is
> the implemented v4 capability — never a marketing counter-claim.

## Category: TeleDOM v4 = Temporal Browser Intelligence (new category)

| Technology | Strengths | Weaknesses (evidence) | TeleDOM gap (baseline) | TeleDOM v4 response |
|---|---|---|---|---|
| **Chrome DevTools MCP** (Google) | Mature automation + DevTools surface; ~51K stars; official Google support; performance traces | Issue-tracker signals: memory growth in long sessions, crashes with large tab sets, page-state desync, input-state bugs, missing early console capture, no historical model, no evidence/proof layer | No temporal model, no causality, tool-per-command surface | EventMesh kernel + temporal queries + causal engine + resource guardian + recovery state machine address the exact reported failure classes; td_* intent surface reduces context cost |
| **Playwright MCP** (Microsoft) | Excellent automation reliability, a11y-tree snapshots, ref-based targeting, ~37K stars | Issue-tracker signals: long-running memory growth, orphan Chromium processes, crash recovery gaps, shared-context contamination, snapshot/context overload (token cost) | Same: execution-focused, no forensic/evidence layer, no what-if | Bounded resource guardian, tiered store, hash-chained sessions, L0–L4 context planner (measured token reduction), self-healing runtime |
| **Browser Use** | Huge ecosystem (~100K stars), autonomous task completion, strong community | False-success states, tab synchronization issues, long-running resource growth, context/token economics, goal retention in long workflows | — | Honest status taxonomy (0.00% false success measured), resumable investigation plans, context economics metrics |
| **rrweb** | Best-in-class DOM record/replay, mature serialization (~19.6K stars) | Replay edges: canvas, cross-origin iframes, pseudo-classes, subtree capture; record+replay only — no inspection/control/causality/AI surface | DOM recording existed; no causal/intelligence layer on top | TeleDOM keeps rrweb-class recording via extension + adds evidence graph, causal chains, counterfactuals, verification, proof |
| **Replay.io** | Deterministic RUNTIME replay (DOM + network + JS execution frames), time-travel debugging with agents | Closed-source infrastructure; requires forked browser runtime; heavyweight sessions | Baseline TeleDOM has DOM-level reconstruction only — runtime-level determinism is a genuine gap | v4 counterfactual engine gives event-level deterministic replay with causal propagation + explicit fidelity levels; full runtime replay honestly DEFERRED (documented limitation, not claimed) |
| **OpenReplay / FullStory / LogRocket (session-replay products)** | Polished session replay + product analytics | Proprietary, session-centric, no agent-native surface, no causal verification, privacy concerns | — | .tdom portable incident artifacts with hash-chained tamper evidence + zero-trust redaction; MCP-native access for agents |
| **OWASP ZAP / browser-resident DAST** | Authorized scanning maturity, scope/rate discipline | Server/proxy-centric; browser-side behavior invisible; noise/false positives | Security was scattered primitives at baseline | Passive security intelligence suite (10 analyzers, findings with verification statuses), active-test policy gates (scope/rate/budget/kill-switch), zero-trust page model |
| **SAST/DAST static scanners** | Deep static analysis | No runtime/DOM visibility; no temporal evidence | — | Runtime-aware source/sink tracing (domXssAudit) with data flows, severity, confidence, remediation, reproduction |
| **Stagehand / browser-agent frameworks** | Scriptable agent actions, good DX | No evidence/provenance model; action-success reporting | — | Verification contracts (mustHold/mustNotHold/evidence), safe mutation transactions, proof records |

## Ecosystem failure-class matrix (what 2026 issue trackers actually report)

| Failure class (primary evidence) | Which competitors hit it | v4 structural answer |
|---|---|---|
| Context overflow from full snapshots | Playwright MCP, Browser Use | L0–L4 levels, artifacts externalization, `td_context_optimize`, context metrics |
| Long-session memory growth / leaks | Chrome DevTools MCP, Playwright MCP | Resource guardian budgets, tiered store, hot-ring cap, leak-watch |
| Crash / disconnect desync | Chrome DevTools MCP, Playwright MCP | Self-healing state machine, session repair, evidence-preserving snapshots |
| False success reporting | Browser Use | Verification contracts, honest taxonomy, 0.00% false-success measured |
| Flaky-target failures | all automation tools | Target intelligence + recovery + contracts + ambiguity refusal |
| Replay fidelity edges | rrweb | Explicit fidelity levels (deterministic vs partial) + fidelity-gated verdicts |
| Security scope discipline | scanner ecosystems | ActiveTestGate (scope/rate/budget/kill-switch/destructive-off) |
| Tool count inflation / token cost | every large MCP | 100 intent-level td_* facades over internal capability graph; registry-validated set |
| Documentation/claim drift | (universal) | Generated docs (BENCHMARKS.md, IMPROVEMENTS.md, CAPABILITIES.md from registries, test-validated) |

## Positioning conclusion

The 2026 evidence shows the binding constraint is **not tool count** — it is
context economics, reliability under failure, honest verification, and causal
explanation. TeleDOM v4 is built exactly against those constraints, defining
a category (Temporal Browser Intelligence) rather than competing inside the
"bigger browser MCP" race. Known strategic gaps are documented honestly in
`docs/intelligence/ENGINEERING_REPORT.md#limitations` (deterministic runtime replay,
cross-browser parity, live-heap retention graphs) instead of being claimed.
