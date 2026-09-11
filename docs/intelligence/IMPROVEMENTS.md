# TeleDOM v4 — Improvement Matrix (106 improvements)

> GENERATED from `src/intelligence/registry/improvements.ts` — the count, fields and statuses
> are validated by `tests/intelligence/registry-integration.test.ts`. Hand-editing this
 document is pointless: it is regenerated on every suite run.

**Validation**: PASS — 106 distinct, non-trivial improvements (threshold: ≥ 100).

**Status summary**: IMPLEMENTED: 104 · DEFERRED-external-infrastructure: 1 · DEFERRED-platform-limit: 1

## temporal (12)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| T01 | **Atomic event identity allocation** | event.sequence and the sequence embedded in event.id could diverge (double-advance bug) → Single-step allocation: allocateSequence() + eventIdFor(seq) in EventMesh; legacy SequenceCounter now accepts explicit seq | P0 | 4.0 | IMPLEMENTED |
| T02 | **Hash-chained tamper evidence** | No cryptographic integrity over recorded sessions → SHA-256 hash chain per event (h(n)=H(h(n-1)+c(n))) + chain tip verification + restore-time re-verify | P0 | 4.0 | IMPLEMENTED |
| T03 | **Append-only EventMesh with admission control** | Global event assumptions: duplicates, reorder, gaps and corrupt input unhandled → append() = integrity verify → dedup (id + idempotency) → gap detection → late admission → chain extend | P0 | 4.0 | IMPLEMENTED |
| T04 | **Hybrid logical/wall clock separation** | performance.now() resolution was conflated with replay latency in marketing claims → HybridClock: monotonic logical ticks + wall track + regression diagnostic; resolution reported separately | P0 | 4.0 | IMPLEMENTED |
| T05 | **State(T) reconstruction with memoization + budgets** | Reconstruction unbounded; no budget, no memoization → Nearest-checkpoint + delta replay + memo cache + maxReconstructionMs budget with DEGRADED flag | P0 | 4.0 | IMPLEMENTED |
| T06 | **Diff(T1,T2) across all state dimensions** | No whole-state diff between arbitrary times → Dimension-level diff computed from two reconstructions with added/removed/changed entries | P1 | 4.0 | IMPLEMENTED |
| T07 | **Trace(Entity) lifetime queries** | Element history required manual event filtering → TemporalEngine.traceEntity + IdentityEngine.trail with version history | P1 | 4.0 | IMPLEMENTED |
| T08 | **Join(Signals) temporal clusters** | get_events_around returned flat dumps → Cluster events from multiple sources within withinMs, optionally around an entity | P1 | 4.0 | IMPLEMENTED |
| T09 | **FirstChange / LastStable predicates** | No first-meaningful-change or stability-point queries → Predicate-driven firstChange; settleMs-quiet lastStable per dimension | P1 | 4.0 | IMPLEMENTED |
| T10 | **Branchable timeline (append-only reality)** | No what-if branching; any mutation risked evidence → BranchManager.fork(): parent + mutation set + deterministic replay; original stream untouched (tested) | P1 | 6.0 | IMPLEMENTED |
| T11 | **Causal-descendant suppression propagation** | Suppressing one event did not remove its causal dependents in replay → Fixpoint expansion of suppressed set over causalParentIds in branch replay | P0 | 6.0 | IMPLEMENTED |
| T12 | **Indexed tiered event store (hot/warm/cold)** | Sessions stored as one giant unindexed blob → IndexedEventStore: bounded hot ring + warm chunks + cold spool; time/entity/source/type/causal indexes | P0 | 4.0 | IMPLEMENTED |

## evidence (3)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| C01 | **Typed evidence graph with provenance edges** | Events were a timeline, not a graph; no typed relations → EvidenceGraph: 29 node types × 15 edge types, content-addressed dedup, edges carry provenance + confidence | P0 | 4.0 | IMPLEMENTED |
| C02 | **Corroboration-strengthening edge confidence** | Repeated observations created duplicate edges → Edge dedup key (from,to,type); repeated addEdge raises confidence +0.05 bounded at 1.0 | P2 | 4.0 | IMPLEMENTED |
| C03 | **Provenance-derived confidence assessment** | Confidence numbers were marketing → assessConfidence(): weighted source quality × corroboration × verification bonus − counterevidence × kernel multiplier | P0 | 4.0 | IMPLEMENTED |

## causality (9)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| C04 | **Correlation ≠ causation classification** | Precedence was implicitly treated as causation → Every causal link carries OBSERVED/CORRELATED/SUPPORTED/... classification + alternatives + verification method | P0 | 5.0 | IMPLEMENTED |
| C05 | **Rule-pair causal inference map (O(1) lookup)** | Causal rules scanned per pair (O(rules) per pair) → Precomputed source-pair rule map + bounded link cap (20K) with deterministic truncation | P1 | 5.0 | IMPLEMENTED |
| C06 | **Root-cause chain reconstruction** | Root cause was a guess from error text → Backward walk from symptom through strongest links, depth-bounded, with evidence refs per link | P0 | 5.0 | IMPLEMENTED |
| C07 | **Hypothesis generation + depth-rewarded ranking** | Single-answer root cause without alternatives → Chains seeded per candidate; confidence × depth reward (deeper root = more complete explanation); explicit rank + status | P1 | 5.0 | IMPLEMENTED |
| C08 | **Counterfactual suppression engine** | No what-if verification of causes → CounterfactualEngine.run(): fork + suppress + compare + verdict CAUSE_SUPPPORTED/NOT_SUPPORTED/INCONCLUSIVE with confidence | P0 | 6.0 | IMPLEMENTED |
| C09 | **Replay-fidelity gating of verdicts** | Visual/performance diffs were treated as causal proof → symptomFidelity(): dom/runtime/network/performance = deterministic; visual + accumulation patterns (memory/leak/growth) = partial → INCONCLUSIVE | P0 | 6.0 | IMPLEMENTED |
| C10 | **Earliest-divergence breakpoint analysis** | No way to locate where two timelines split → CausalEngine.earliestDivergence(reality, branch) → first sequence missing from branch | P2 | 5.0 | IMPLEMENTED |
| C11 | **Blast-radius impact estimation** | Impact of a cause was unmeasured → causeImpact(): direct + second-order causal children + affected-entity count | P2 | 5.0 | IMPLEMENTED |
| C12 | **Bounded causal graph budgets** | Graph growth unbounded on hostile pages → EvidenceGraph(maxNodes): overflow observations get identity nodes without storage; degraded flag exposed to health | P0 | 8.0 | IMPLEMENTED |

## identity (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| S01 | **Persistent entity identity with version history** | LogicalNodeId died with DOM representation changes → IdentityEngine: durable ids + fingerprint rematching + version trail + owner/parent links | P0 | 4.0 | IMPLEMENTED |

## semantic (2)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| S02 | **Semantic DOM layer (roles, purpose, state, stability)** | Raw DOM is noise for agents → SemanticEngine.semanticDom(): role by tag/aria/testid, purpose strings, states, stability scoring from anchor signals, selector candidates | P1 | 5.0 | IMPLEMENTED |
| S10 | **Page-intent workflow inference** | Page purpose required full DOM dumps → Workflow/zone inference from semantic roles + interactive elements | P3 | 5.0 | IMPLEMENTED |

## component (2)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| S03 | **Component boundary inference (React/Vue/Svelte/custom/iframe)** | Component boundaries were invisible → Fingerprint-based framework detection with evidence + confidence; component ids + ownership | P1 | 5.0 | IMPLEMENTED |
| S04 | **Component lifecycle derivation (mount/update/remount/unmount)** | No mount/unmount tracking for components → lifecycleFromEvents(): mount/update/remount/unmount with event evidence | P1 | 5.0 | IMPLEMENTED |

## targeting (4)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| S05 | **Multi-signal target resolution engine** | Selectors were the only targeting signal → TargetIntelligence.resolve(): structural/semantic/historical/behavioral/visual signals with weights, evidence and honest statuses | P1 | 5.0 | IMPLEMENTED |
| S06 | **Ambiguity refusal (no blind clicking)** | Nearest-match could be silently wrong → Resolution returns AMBIGUOUS with warnings when top-2 within 0.08 | P0 | 5.0 | IMPLEMENTED |
| S07 | **Multi-signal target recovery after rerender** | Selector recovery used fingerprint matching only → recover(): semantic id + text + role + component + ancestry scoring; refuses below 0.5 as blind guess | P1 | 5.0 | IMPLEMENTED |
| S08 | **Durable target contracts** | Targets were re-resolved from scratch each time → Contract registry keyed by query+semantic id with selector fallbacks + reuse counts | P2 | 5.0 | IMPLEMENTED |

## a11y (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| S09 | **Accessibility-first semantic signals** | A11y was a side tool, not a targeting signal → A11y fields integrated into semantic model + accessibility model tool | P2 | 5.0 | IMPLEMENTED |

## verification (3)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| V01 | **Verification contracts (mustHold/mustNotHold/evidence)** | Action success was reported without postcondition checks → VerificationContract with mustHold/mustNotHold/timeWindow/evidenceRequired → PASS/FAIL/INCONCLUSIVE | P0 | 4.0 | IMPLEMENTED |
| V06 | **INCONCLUSIVE-never-PASS discipline** | Ambiguous outcomes were silently successful → Status taxonomy PASS/FAIL/INCONCLUSIVE/UNSUPPORTED/DEGRADED/PARTIAL enforced across all 100 td_* tools (smoke-tested) | P0 | 4.0 | IMPLEMENTED |
| V07 | **Throwing-check containment in verification** | A throwing postcondition crashed verification → safeCheck() wraps all postcondition checks | P2 | 4.0 | IMPLEMENTED |

## proof (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| V02 | **Machine-verifiable proof records** | No proof artifacts for conclusions → ProofRecord: claims + steps + evidence refs + content hash + previous-proof chaining; verifyProof() re-computes hash | P0 | 12.0 | IMPLEMENTED |

## mutation (2)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| V03 | **Safe mutation transactions (10-phase pipeline)** | DOM mutations were direct with best-effort undo → SafeMutationEngine with adapter choke point, audit trail, rollback unless unsafe | P0 | 6.0 | IMPLEMENTED |
| V04 | **Destructive-action classification + default-off** | remove-node/eval were undifferentiated from set-attribute → Risk levels LOW/MEDIUM/HIGH/DESTRUCTIVE; DESTRUCTIVE + HIGH blocked unless explicitly allowed | P0 | 6.0 | IMPLEMENTED |

## prediction (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| V05 | **Prediction engine with mandatory epistemics** | No prediction capability → Pattern-triggered predictions (failure-risk, resource-risk, state-transition) with full epistemic payload | P2 | 6.0 | IMPLEMENTED |

## incident (5)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| V08 | **Incident lifecycle state machine** | Sessions had no incident concept → 13-state machine (CREATED→…→RESOLVED/ABANDONED) with VALID_TRANSITIONS + audit trail | P1 | 7.0 | IMPLEMENTED |
| V09 | **Portable .tdom forensic artifacts** | Session export was JSON blob → TdomFormat: versioned manifest, content-addressed sections, gzip, compatibility info; tamper detection on import | P1 | 7.0 | IMPLEMENTED |
| V10 | **Tamper detection on artifact import** | Imported sessions were trusted → Per-section hash + manifest hash re-verification; brokenSection reported | P0 | 7.0 | IMPLEMENTED |
| V11 | **Resumable investigation plans** | Investigations were manual tool-call sequences with no state → InvestigationPlan with per-step status + completedThrough + resumePlanId support | P1 | 7.0 | IMPLEMENTED |
| V12 | **Autonomous investigator (td_investigate)** | Agent manually orchestrated 30+ tool calls → 13-step orchestrated plan: scope→incident→baseline→observe→timeline→reconstruct→correlate→graph→hypotheses→counterfactual→verify→proof→lesson | P0 | 7.0 | IMPLEMENTED |

## security (10)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| X01 | **Zero-trust page model** | Page content could implicitly flow into agent context → ZeroTrustModel: origin trust, instruction-source tagging, page-content quarantine | P0 | 9.0 | IMPLEMENTED |
| X02 | **Prompt-injection pattern detection** | No injection detection → 7 pattern families with multi-pattern confidence + evidence refs | P0 | 9.0 | IMPLEMENTED |
| X03 | **Secret detection + redaction with human-only reveal** | Privacy engine masked known patterns; reveal rules unclear → 8 secret families; agent reveal attempts BLOCKED and audited; human reveal ALLOWED and audited | P0 | 9.0 | IMPLEMENTED |
| X04 | **Exfiltration detection** | Secret-bearing outbound payloads undetected → detectExfiltration(): destination origin + payload-kind classification + quarantine audit | P1 | 9.0 | IMPLEMENTED |
| X05 | **Passive security posture suite** | No browser-side security analyzers → 10 analyzers: dom-xss source/sink, CSP, cookies, storage, iframes, postMessage, third-party, mixed-content, auth, secret-exposure | P1 | 9.0 | IMPLEMENTED |
| X06 | **Findings verification status discipline** | Scanners report suspicion as vulnerability → Finding statuses CONFIRMED/PROBABLE/POTENTIAL/BENIGN/NOT_REPRODUCIBLE enforced by test | P0 | 9.0 | IMPLEMENTED |
| X07 | **Active-testing policy gates** | Active testing could silently escalate from passive → ActiveTestGate: mode, origin allowlist, category allowlist, rate limit, request budget, destructive default-off, kill switch | P0 | 9.0 | IMPLEMENTED |
| X08 | **Kill switch for all active security testing** | Active security testing had no emergency stop mechanism once authorized → engageKillSwitch() flips a policy flag that every authorization check consults first; all subsequent active-test requests are refused with an explicit kill-switch reason | P0 | 9.0 | IMPLEMENTED |
| X09 | **DOM XSS longest-source matching** | Source attribution matched bare "location" over "location.hash" → Longest-match source selection in domXssAudit | P2 | 9.0 | IMPLEMENTED |
| X10 | **Cross-origin secret-exposure findings** | Credential destinations were not compared to page origin → secretExposureAudit with page-origin comparison | P1 | 9.0 | IMPLEMENTED |

## resilience (12)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| R01 | **Self-healing runtime state machine** | Bridge failures required manual restart → SelfHealingRuntime with snapshot-before-recovery, bounded attempts (3), exponential backoff | P0 | 8.0 | IMPLEMENTED |
| R02 | **Bounded recovery (no infinite retries)** | Reconnect loops could spin forever → maxAttemptsPerFailure=3 with reason-aware outcomes; FAILED result after exhaustion | P0 | 8.0 | IMPLEMENTED |
| R03 | **Evidence-preserving recovery snapshots** | Crashes lost session state → RecoverySnapshot captured BEFORE recovery attempts; preserved list reported per attempt | P0 | 8.0 | IMPLEMENTED |
| R04 | **Resource guardian with budgets** | No resource budget enforcement → Guardian: events/bytes/memory/graph/network/queue budgets → pressure ratio | P0 | 8.0 | IMPLEMENTED |
| R05 | **Adaptive degradation modes** | No graceful degradation — either full capture or crash → HEALTHY/FULL_FIDELITY → PRESSURED/COMPACT → CRITICAL/SAMPLING → EMERGENCY/PRESERVE_EVIDENCE+CHECKPOINT+RECOVER | P0 | 8.0 | IMPLEMENTED |
| R06 | **Session repair from serialized stream** | Partially corrupted sessions were unusable → serialize() → fresh mesh restore() with chain re-verification; td_session_repair tool | P1 | 8.0 | IMPLEMENTED |
| R07 | **Chaos engineering suite (16 injections)** | No failure-injection testing → injectChaos(): crash/disconnect/reload/duplication/reorder/delay/loss/corruption/storm/pressure + containment verification | P0 | 11.0 | IMPLEMENTED |
| R08 | **Corruption rejection (never merge bad evidence)** | Corrupted input silently merged → Integrity-hash verification on append; REJECTED_CORRUPT status; counted in stats | P0 | 8.0 | IMPLEMENTED |
| R09 | **Mutation-storm containment** | Storms could exhaust memory → Chaos mutation-storm injection verifies chain validity after storm | P1 | 8.0 | IMPLEMENTED |
| R10 | **Kernel self-diagnostics** | TeleDOM could not assess its own health → KernelDiagnostics: 6 probes (event/storage integrity, guardian, runtime, graph, security) → confidenceMultiplier | P0 | 8.0 | IMPLEMENTED |
| R11 | **Degraded-confidence propagation** | Unhealthy kernel still produced full-confidence claims → health().confidenceMultiplier wired into assessConfidence | P1 | 8.0 | IMPLEMENTED |
| R12 | **Runtime crash family exercises** | page/renderer/browser/bridge crashes were untested paths → td_recover_browser/page/bridge + chaos page/renderer/browser injections | P2 | 8.0 | IMPLEMENTED |

## agent-os (11)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| A01 | **Capability registry as single source of truth** | Tool counts/versions drifted across files (121/43/206 mismatch) → CAPABILITY_REGISTRY: 100 td_* capabilities with full metadata; MCP defs/docs/compat generated from it | P0 | 10.0 | IMPLEMENTED |
| A02 | **Intent-level tool architecture (100 td_* facades)** | 206 flat tools forced manual agent orchestration → td_* families compose kernel/temporal/evidence/causal primitives via one dispatcher — not 100 isolated handlers | P0 | 10.0 | IMPLEMENTED |
| A03 | **L0-L4 context levels** | Full snapshots flooded context windows → ContextPlanner: L0 identity → L1 semantic → L2 subtree → L3 evidence → L4 full; artifacts externalized | P0 | 10.0 | IMPLEMENTED |
| A04 | **Duplicate suppression + novelty in context** | Repeated semantic entries wasted tokens → Deterministic dedup on role+text with suppression notes | P2 | 10.0 | IMPLEMENTED |
| A05 | **Context economics metrics** | Token cost of decisions was unmeasured → ContextMetrics accumulated per plan() call | P1 | 10.0 | IMPLEMENTED |
| A06 | **Durable agent memory with provenance** | No cross-session knowledge → AgentMemory: 12 memory kinds, provenance per item, validation feedback loops | P1 | 10.0 | IMPLEMENTED |
| A07 | **Uncertainty-gated memory (no fact inflation)** | Memory would treat hunches as facts → validated flag (confidence ≥ 0.75); query onlyValidated filters | P0 | 10.0 | IMPLEMENTED |
| A08 | **Learning limited to heuristic boosts** | Learning could silently alter policy/code → heuristicBoost() only influences ranking scores (bounded ≤ 0.2); never security policy | P0 | 10.0 | IMPLEMENTED |
| A09 | **Declarative workflow execution with recovery** | Multi-step agent flows had no recovery semantics → td_run_workflow: executes step tools, collects per-step statuses, PARTIAL when any step degrades | P2 | 10.0 | IMPLEMENTED |
| A10 | **Playbook library** | No reusable investigation procedures → td_run_playbook: disappearing-ui, security-passive, performance-scan, recovery-drill | P3 | 10.0 | IMPLEMENTED |
| M08 | **Lookup-miss honesty in tool dispatch** | Missing references crashed or errored tools → INCONCLUSIVE with actionable notes instead of FAIL crashes | P2 | 12.0 | IMPLEMENTED |

## testing (7)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| G01 | **Golden incident suite (1000+ deterministic scenarios)** | No ground-truth investigation benchmark → generateGoldenSuite: 24 categories × seeds = 1032 scenarios with expected root cause/verification; deterministic PRNG | P0 | 11.0 | IMPLEMENTED |
| G02 | **Investigation Completion Rate metric** | No completion metric existed → ICR = resolved / resolvable (INCONCLUSIVE-expected scenarios excluded from denominator — honest) | P0 | 11.0 | IMPLEMENTED |
| G03 | **Evidence Confidence metric** | No verification-quality metric → EC computed per suite run | P1 | 11.0 | IMPLEMENTED |
| G04 | **Replay Fidelity metric** | No replay-quality metric → RF computed per suite run | P1 | 11.0 | IMPLEMENTED |
| G05 | **False Success Rate metric** | False successes were invisible → FSR per suite run; 0.00% achieved | P0 | 11.0 | IMPLEMENTED |
| G06 | **Honest scenario denominators** | Metrics could punish honest non-resolution → resolvable denominator + resolvableScenarios/resolvedScenarios exposed | P2 | 11.0 | IMPLEMENTED |
| G10 | **Operational certification extended to 306 tools** | Operational suite covered 206 tools → td_* case added to runner; 306/306 tools PASS + CERTIFIED with captured JSON-RPC evidence | P0 | 12.0 | IMPLEMENTED |

## benchmarking (2)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| G07 | **Real benchmark matrix (10K/100K/1M)** | "Sub-millisecond" was unmeasured marketing → runBenchmarks with p50/p95/p99 per scale + docs generated from measurements | P0 | 11.0 | IMPLEMENTED |
| G08 | **Resolution/latency separation** | Timestamp resolution was conflated with latency → Separate columns in benchmark matrix + note | P0 | 11.0 | IMPLEMENTED |

## docs (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| G09 | **Test-generated documentation** | Docs drifted from implementation → BENCHMARKS.md written by suite-reports test; improvement matrix is a registry validated by test | P1 | 11.0 | IMPLEMENTED |

## architecture (5)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| M01 | **Intelligence-domain-oriented module structure** | Feature-oriented src/ mixed concerns → src/intelligence/ with 18 domain modules, each with public barrel + typed exports | P1 | 4.0 | IMPLEMENTED |
| M02 | **Backward-compatible facade integration** | Rewrites break consumers → td_* dispatched first in MCPToolsHandler; 121 legacy names + 206 legacy tools preserved (tested) | P0 | 4.0 | IMPLEMENTED |
| M03 | **Event-envelope schema versioning** | Event schema had no version negotiation → EVENT_SCHEMA_VERSION + envelope schemaVersion + .tdom compatibility block | P2 | 4.0 | IMPLEMENTED |
| M04 | **Authoritative version registry** | Version strings drifted (v2.1.0 banner vs 3.1.0 package) → src/intelligence/version.ts: TELEDOM_VERSION + VERSION_HISTORY (v4→v12); sea-entry banner derives from it | P0 | 12.0 | IMPLEMENTED |
| M09 | **Directory-import-free kernel modules** | Barrel imports broke direct Node execution → Explicit file-relative imports within v4 where scripts consume them | P2 | 12.0 | IMPLEMENTED |

## compatibility (4)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| M05 | **Generated compatibility matrix** | Compatibility was hand-claimed → generateCompatibilityMatrix(): 100 rows with schema/behavior parity, browser support, simulation, test status | P1 | 12.0 | IMPLEMENTED |
| M06 | **Registry-validated tool set (no inflation)** | Tool count was a vanity metric → validateRegistry(): 100 count, no dupes, td_ prefix, 10-per-category enforced | P0 | 12.0 | IMPLEMENTED |
| M10 | **Versioned .tdom round-trip compatibility** | Session format had no forward-compat story → formatVersion + minReaderVersion + compatibility notes on import | P2 | 12.0 | IMPLEMENTED |
| P08 | **Cross-browser (Firefox/WebKit) kernel parity** | Kernel is exercised on Chrome/Chromium surface → DEFERRED: browser-specific adapters required; td surfaces report per-mode support; no universal-compat claim | P3 | 13-preview | DEFERRED-platform-limit |

## correctness (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| M07 | **P0 sequence bug fix in legacy recorder** | Baseline P0: id/sequence divergence in every event creation → generateEventId(prefix, seq?) accepts explicit sequence; all 16 call sites pass their sequence | P0 | 4.0 | IMPLEMENTED |

## performance (3)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| P01 | **Performance causality tools (long-task/layout trace)** | Profiler outputs were isolated from causal model → td_long_task_trace + td_layout_causality correlate performance events through the causal engine | P1 | 9.0 | IMPLEMENTED |
| P02 | **Memory-leak pattern detection** | Memory analysis was manual heap reading → td_memory_leak_trace: unmount-ratio analysis over DOM churn (growth signal < 0.3) | P2 | 9.0 | IMPLEMENTED |
| P03 | **Render-stability query** | No "when is the page settled" primitive → td_render_stability via lastStable(settleMs) | P2 | 9.0 | IMPLEMENTED |

## dx (2)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| P04 | **Honest UNSUPPORTED for live-only capabilities** | Tools faked or crashed without live browser → td_interaction_execute/safe_apply/retention_graph return UNSUPPORTED with reason + suggestion | P0 | 12.0 | IMPLEMENTED |
| P05 | **Retention-graph live dependency declared** | Heap retention graphs promised without runtime support → td_retention_graph returns UNSUPPORTED (EXPERIMENTAL) until live heap snapshots are wired | P0 | 12.0 | IMPLEMENTED |

## visual (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| P06 | **Visual causality never claims proof from pixels** | Screenshot diffs were treated as causal evidence → td_visual_causality correlates visual/dom/runtime with classification; fidelity gate keeps verdicts INCONCLUSIVE | P1 | 9.0 | IMPLEMENTED |

## replay (1)

| ID | Title | Problem → Solution | Priority | Version | Status |
|---|---|---|---|---|---|
| P07 | **Deterministic runtime replay (full fidelity)** | Counterfactual replay is event-level, not runtime-level → DEFERRED: requires a forked browser runtime (Replay.io-class infrastructure) — documented as explicit gap, not claimed | P3 | 13-preview | DEFERRED-external-infrastructure |

## Detail ledger

### T01 — Atomic event identity allocation

- **Category**: temporal · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: event.sequence and the sequence embedded in event.id could diverge (double-advance bug)
- **Baseline limitation**: generateEventId() advanced the counter a second time
- **External evidence**: Roadmap §13 P0; rrweb order-sensitivity; direct code inspection of DOMMutationObserver
- **Why it matters**: A temporal/forensic system whose event identity is inconsistent cannot guarantee ordering or replay
- **Architecture**: Single-step allocation: allocateSequence() + eventIdFor(seq) in EventMesh; legacy SequenceCounter now accepts explicit seq
- **Modules**: kernel/events, core/sequence-counter, core/* call sites
- **Complexity**: medium · **Risk**: high
- **Benefit**: Invariant event.sequence === seq-in-id holds for every event; legacy behavior preserved
- **Tests**: tests/intelligence/kernel.test.ts (invariant test)
- **Benchmark**: admission benchmark
- **Security**: none

### T02 — Hash-chained tamper evidence

- **Category**: temporal · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: No cryptographic integrity over recorded sessions
- **Baseline limitation**: Sessions were plain JSON files; silent tampering undetectable
- **External evidence**: Forensic standards; rrweb/openreplay lack chain-of-custody; roadmap §21
- **Why it matters**: A forensic platform must PROVE evidence was not modified
- **Architecture**: SHA-256 hash chain per event (h(n)=H(h(n-1)+c(n))) + chain tip verification + restore-time re-verify
- **Modules**: kernel/integrity, kernel/events
- **Complexity**: medium · **Risk**: low
- **Benefit**: Any historical event mutation breaks every subsequent link and is detected
- **Tests**: tests/intelligence/kernel.test.ts (tamper test)
- **Benchmark**: n/a
- **Security**: integrity-by-construction

### T03 — Append-only EventMesh with admission control

- **Category**: temporal · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Global event assumptions: duplicates, reorder, gaps and corrupt input unhandled
- **Baseline limitation**: Recorder pushed events into arrays; no dedup, no gap detection, no corruption rejection
- **External evidence**: Playwright MCP crash-recovery issues; Chrome DevTools MCP page-state desync reports
- **Why it matters**: The browser is an unreliable producer; the kernel must guarantee a coherent stream
- **Architecture**: append() = integrity verify → dedup (id + idempotency) → gap detection → late admission → chain extend
- **Modules**: kernel/events
- **Complexity**: high · **Risk**: medium
- **Benefit**: Duplicate collapse, gap accounting, late-event flags, corrupt rejection — all observable via stats()
- **Tests**: tests/intelligence/kernel.test.ts (6 admission tests)
- **Benchmark**: n/a
- **Security**: corrupt envelopes never merged

### T04 — Hybrid logical/wall clock separation

- **Category**: temporal · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: performance.now() resolution was conflated with replay latency in marketing claims
- **Baseline limitation**: Sub-millisecond claim without benchmark separation
- **External evidence**: Roadmap §37 "never conflate timestamp resolution with latency"
- **Why it matters**: Ordering must never depend on wall clock (NTP jumps); latency claims must be measured
- **Architecture**: HybridClock: monotonic logical ticks + wall track + regression diagnostic; resolution reported separately
- **Modules**: kernel/clock
- **Complexity**: low · **Risk**: low
- **Benefit**: Deterministic ordering; honest resolution-vs-latency reporting
- **Tests**: tests/intelligence/kernel.test.ts (monotonic + regression)
- **Benchmark**: benchmarks column separation
- **Security**: none

### T05 — State(T) reconstruction with memoization + budgets

- **Category**: temporal · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Reconstruction unbounded; no budget, no memoization
- **Baseline limitation**: StateReconstructor replayed all events from checkpoint with LRU only
- **External evidence**: Large-session memory growth reports in MCP trackers
- **Why it matters**: Reconstruction must degrade gracefully under huge streams
- **Architecture**: Nearest-checkpoint + delta replay + memo cache + maxReconstructionMs budget with DEGRADED flag
- **Modules**: temporal/queries
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Bounded reconstruction with honest degraded results
- **Tests**: tests/intelligence/temporal.test.ts (stateAt meta)
- **Benchmark**: n/a
- **Security**: reconstruction benchmark p50/p95/p99

### T06 — Diff(T1,T2) across all state dimensions

- **Category**: temporal · **Priority**: P1 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: No whole-state diff between arbitrary times
- **Baseline limitation**: diff_dom compared DOM only at recorded timestamps
- **External evidence**: rrweb DOM-only diffing; roadmap §14 Diff(T1,T2)
- **Why it matters**: Agents ask "what changed between two moments" across ALL signals
- **Architecture**: Dimension-level diff computed from two reconstructions with added/removed/changed entries
- **Modules**: temporal/queries
- **Complexity**: low · **Risk**: low
- **Benefit**: Cross-dimension temporal diff as a first-class query
- **Tests**: tests/intelligence/temporal.test.ts
- **Benchmark**: n/a
- **Security**: none

### T07 — Trace(Entity) lifetime queries

- **Category**: temporal · **Priority**: P1 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Element history required manual event filtering
- **Baseline limitation**: trace_element existed but no entity-identity join
- **External evidence**: Roadmap §14 Trace(Entity)
- **Why it matters**: Every entity must be queryable through its full lifetime
- **Architecture**: TemporalEngine.traceEntity + IdentityEngine.trail with version history
- **Modules**: temporal/queries, kernel/identity
- **Complexity**: low · **Risk**: low
- **Benefit**: One-call entity lifetime retrieval
- **Tests**: tests/intelligence/temporal.test.ts
- **Benchmark**: n/a
- **Security**: none

### T08 — Join(Signals) temporal clusters

- **Category**: temporal · **Priority**: P1 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: get_events_around returned flat dumps
- **Baseline limitation**: No multi-signal clustering with entity scoping
- **External evidence**: Roadmap temporal join; Chrome DevTools MCP correlation requests
- **Why it matters**: Causal analysis needs joined multi-signal windows, not flat lists
- **Architecture**: Cluster events from multiple sources within withinMs, optionally around an entity
- **Modules**: temporal/queries
- **Complexity**: medium · **Risk**: low
- **Benefit**: Causal clusters as unit of analysis; span+size metrics
- **Tests**: tests/intelligence/temporal.test.ts (join + entity scoping)
- **Benchmark**: n/a
- **Security**: none

### T09 — FirstChange / LastStable predicates

- **Category**: temporal · **Priority**: P1 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: No first-meaningful-change or stability-point queries
- **Baseline limitation**: Only manual timestamp arithmetic
- **External evidence**: Roadmap §14 FirstChange/LastStable
- **Why it matters**: "When did it first go wrong / when was it last healthy" are core debugging questions
- **Architecture**: Predicate-driven firstChange; settleMs-quiet lastStable per dimension
- **Modules**: temporal/queries
- **Complexity**: low · **Risk**: low
- **Benefit**: Direct answers to first-fault / last-healthy questions
- **Tests**: tests/intelligence/temporal.test.ts
- **Benchmark**: n/a
- **Security**: none

### T10 — Branchable timeline (append-only reality)

- **Category**: temporal · **Priority**: P1 · **Version target**: 6.0 · **Status**: IMPLEMENTED
- **Problem**: No what-if branching; any mutation risked evidence
- **Baseline limitation**: No branch concept existed
- **External evidence**: Roadmap §17; Replay.io runtime branching is closed-source
- **Why it matters**: Counterfactual reasoning requires forking WITHOUT destroying originals
- **Architecture**: BranchManager.fork(): parent + mutation set + deterministic replay; original stream untouched (tested)
- **Modules**: temporal/branching
- **Complexity**: high · **Risk**: high
- **Benefit**: Safe counterfactual experimentation over recorded history
- **Tests**: tests/intelligence/temporal.test.ts (branch + original-untouched)
- **Benchmark**: branch benchmark
- **Security**: branch simulation latency benchmark

### T11 — Causal-descendant suppression propagation

- **Category**: temporal · **Priority**: P0 · **Version target**: 6.0 · **Status**: IMPLEMENTED
- **Problem**: Suppressing one event did not remove its causal dependents in replay
- **Baseline limitation**: No causal parent links existed between events
- **External evidence**: Deterministic replay semantics (Replay.io model)
- **Why it matters**: Removing a cause must remove effects that would never have happened
- **Architecture**: Fixpoint expansion of suppressed set over causalParentIds in branch replay
- **Modules**: temporal/branching
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Counterfactuals model true causal dependency, enabling verification
- **Tests**: tests/intelligence/evidence-causality.test.ts
- **Benchmark**: n/a
- **Security**: none

### T12 — Indexed tiered event store (hot/warm/cold)

- **Category**: temporal · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Sessions stored as one giant unindexed blob
- **Baseline limitation**: FileStorageProvider JSON blob per session
- **External evidence**: Playwright MCP long-session memory growth; roadmap §41
- **Why it matters**: 10K→10M event sessions need bounded memory + fast indexed access
- **Architecture**: IndexedEventStore: bounded hot ring + warm chunks + cold spool; time/entity/source/type/causal indexes
- **Modules**: temporal/event-store
- **Complexity**: high · **Risk**: medium
- **Benefit**: 100K+ events with bounded hot memory; O(log n) time index; entity trace queries
- **Tests**: tests/intelligence/temporal.test.ts (100K scale)
- **Benchmark**: 100K store test
- **Security**: tiering + query latency benchmarks

### C01 — Typed evidence graph with provenance edges

- **Category**: evidence · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Events were a timeline, not a graph; no typed relations
- **Baseline limitation**: No node/edge model; correlation was ad-hoc
- **External evidence**: Roadmap §15; DevTools MCP lacks any evidence model
- **Why it matters**: Causal browser reasoning requires a typed graph substrate
- **Architecture**: EvidenceGraph: 29 node types × 15 edge types, content-addressed dedup, edges carry provenance + confidence
- **Modules**: evidence/graph
- **Complexity**: high · **Risk**: medium
- **Benefit**: The causal world model: queryable neighbors/paths with provenance
- **Tests**: tests/intelligence/evidence-causality.test.ts
- **Benchmark**: n/a
- **Security**: graph query latency benchmark

### C02 — Corroboration-strengthening edge confidence

- **Category**: evidence · **Priority**: P2 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Repeated observations created duplicate edges
- **Baseline limitation**: No corroboration concept
- **External evidence**: Evidence theory: independent corroboration raises confidence
- **Why it matters**: Multiple independent provenances must strengthen the same claim
- **Architecture**: Edge dedup key (from,to,type); repeated addEdge raises confidence +0.05 bounded at 1.0
- **Modules**: evidence/graph
- **Complexity**: low · **Risk**: low
- **Benefit**: No duplicate edges; corroboration is measurable
- **Tests**: tests/intelligence/evidence-causality.test.ts
- **Benchmark**: n/a
- **Security**: none

### C03 — Provenance-derived confidence assessment

- **Category**: evidence · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Confidence numbers were marketing
- **Baseline limitation**: Confidence labels appeared without derivation
- **External evidence**: Roadmap §16 (evidence strength); P1 evidence-before-claims
- **Why it matters**: Claims must expose HOW confidence was computed
- **Architecture**: assessConfidence(): weighted source quality × corroboration × verification bonus − counterevidence × kernel multiplier
- **Modules**: evidence/confidence
- **Complexity**: medium · **Risk**: low
- **Benefit**: Auditable confidence with rationale for every assessment
- **Tests**: tests/intelligence/evidence-causality.test.ts (5 confidence tests)
- **Benchmark**: n/a
- **Security**: none

### C04 — Correlation ≠ causation classification

- **Category**: causality · **Priority**: P0 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Precedence was implicitly treated as causation
- **Baseline limitation**: Correlators labeled chains without explicit classification
- **External evidence**: Roadmap §16; scientific method; false-success reports in agent tools
- **Why it matters**: A→B timing must never silently become "A caused B"
- **Architecture**: Every causal link carries OBSERVED/CORRELATED/SUPPORTED/... classification + alternatives + verification method
- **Modules**: causality/engine
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Structural honesty in every causal claim
- **Tests**: tests/intelligence/evidence-causality.test.ts (classification test)
- **Benchmark**: n/a
- **Security**: none

### C05 — Rule-pair causal inference map (O(1) lookup)

- **Category**: causality · **Priority**: P1 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Causal rules scanned per pair (O(rules) per pair)
- **Baseline limitation**: No causal rule engine at all
- **External evidence**: Chrome DevTools MCP correlation; rrweb has no causality
- **Why it matters**: Correlation over 2000-event windows must be fast (39s → 150ms measured)
- **Architecture**: Precomputed source-pair rule map + bounded link cap (20K) with deterministic truncation
- **Modules**: causality/engine
- **Complexity**: medium · **Risk**: low
- **Benefit**: 260x faster investigation latency (measured 39790ms → 148ms at 10K scale)
- **Tests**: tests/intelligence/registry-integration.test.ts
- **Benchmark**: investigation latency
- **Security**: investigation latency benchmark

### C06 — Root-cause chain reconstruction

- **Category**: causality · **Priority**: P0 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Root cause was a guess from error text
- **Baseline limitation**: fx_error_root_cause heuristics without chain evidence
- **External evidence**: Roadmap §8 causal chain
- **Why it matters**: The full user→network→state→render→removal chain must be reconstructable
- **Architecture**: Backward walk from symptom through strongest links, depth-bounded, with evidence refs per link
- **Modules**: causality/engine
- **Complexity**: high · **Risk**: medium
- **Benefit**: Explainable root-cause chains with per-link evidence
- **Tests**: tests/intelligence/evidence-causality.test.ts (chain test)
- **Benchmark**: n/a
- **Security**: none

### C07 — Hypothesis generation + depth-rewarded ranking

- **Category**: causality · **Priority**: P1 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Single-answer root cause without alternatives
- **Baseline limitation**: No competing hypotheses
- **External evidence**: Differential diagnosis model; roadmap hypothesis ranking
- **Why it matters**: Debugging needs ranked alternatives, not one guess
- **Architecture**: Chains seeded per candidate; confidence × depth reward (deeper root = more complete explanation); explicit rank + status
- **Modules**: causality/engine
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Ranked competing root-cause hypotheses with verification methods
- **Tests**: tests/intelligence/evidence-causality.test.ts + golden suite
- **Benchmark**: rootCauseAccuracy
- **Security**: root-cause accuracy 100% on golden suite

### C08 — Counterfactual suppression engine

- **Category**: causality · **Priority**: P0 · **Version target**: 6.0 · **Status**: IMPLEMENTED
- **Problem**: No what-if verification of causes
- **Baseline limitation**: None
- **External evidence**: Roadmap counterfactual engine; category-creating capability
- **Why it matters**: "Remove the cause — does the symptom vanish?" must be answerable
- **Architecture**: CounterfactualEngine.run(): fork + suppress + compare + verdict CAUSE_SUPPPORTED/NOT_SUPPORTED/INCONCLUSIVE with confidence
- **Modules**: simulation/counterfactual, temporal/branching
- **Complexity**: high · **Risk**: high
- **Benefit**: What-if debugging; the differentiating v6 capability
- **Tests**: tests/intelligence/evidence-causality.test.ts (3 counterfactual tests)
- **Benchmark**: n/a
- **Security**: none

### C09 — Replay-fidelity gating of verdicts

- **Category**: causality · **Priority**: P0 · **Version target**: 6.0 · **Status**: IMPLEMENTED
- **Problem**: Visual/performance diffs were treated as causal proof
- **Baseline limitation**: Visual regression tooling claimed causation
- **External evidence**: Roadmap §42 (fidelity levels); "screenshot diff alone is not causal proof"
- **Why it matters**: Suppression can only prove causation for deterministic-replay dimensions
- **Architecture**: symptomFidelity(): dom/runtime/network/performance = deterministic; visual + accumulation patterns (memory/leak/growth) = partial → INCONCLUSIVE
- **Modules**: simulation/counterfactual
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Zero false-success verdicts on partial-fidelity symptoms (golden suite 0.00%)
- **Tests**: tests/intelligence golden suite (false success 0.00%)
- **Benchmark**: falseSuccessRate=0
- **Security**: falseSuccessRate metric

### C10 — Earliest-divergence breakpoint analysis

- **Category**: causality · **Priority**: P2 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: No way to locate where two timelines split
- **Baseline limitation**: None
- **External evidence**: Roadmap breakpoint concept; bisect-style debugging
- **Why it matters**: Branch comparison must point at the FIRST differing event
- **Architecture**: CausalEngine.earliestDivergence(reality, branch) → first sequence missing from branch
- **Modules**: causality/engine
- **Complexity**: low · **Risk**: low
- **Benefit**: Bisect-style temporal debugging
- **Tests**: tests/intelligence/evidence-causality.test.ts
- **Benchmark**: n/a
- **Security**: none

### C11 — Blast-radius impact estimation

- **Category**: causality · **Priority**: P2 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Impact of a cause was unmeasured
- **Baseline limitation**: None
- **External evidence**: Roadmap §68 blast radius question
- **Why it matters**: Agents must know direct vs second-order effects before acting
- **Architecture**: causeImpact(): direct + second-order causal children + affected-entity count
- **Modules**: v12/mcp handler
- **Complexity**: low · **Risk**: low
- **Benefit**: Blast radius answers for every candidate cause
- **Tests**: tests/intelligence registry smoke
- **Benchmark**: n/a
- **Security**: none

### C12 — Bounded causal graph budgets

- **Category**: causality · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Graph growth unbounded on hostile pages
- **Baseline limitation**: No MAX_GRAPH_NODES enforcement
- **External evidence**: Roadmap §26 budgets; mutation-storm resilience
- **Why it matters**: A mutation storm must not OOM the graph
- **Architecture**: EvidenceGraph(maxNodes): overflow observations get identity nodes without storage; degraded flag exposed to health
- **Modules**: evidence/graph
- **Complexity**: low · **Risk**: medium
- **Benefit**: Graph memory strictly bounded; degradation observable
- **Tests**: tests/intelligence/evidence-causality.test.ts (bounded graph test)
- **Benchmark**: n/a
- **Security**: none

### S01 — Persistent entity identity with version history

- **Category**: identity · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: LogicalNodeId died with DOM representation changes
- **Baseline limitation**: Node identity broke on rerender/reparent
- **External evidence**: Roadmap §6 identity engine; P4 identity-survival principle
- **Why it matters**: The same logical entity must survive rerenders, reparenting and navigation
- **Architecture**: IdentityEngine: durable ids + fingerprint rematching + version trail + owner/parent links
- **Modules**: kernel/identity
- **Complexity**: high · **Risk**: medium
- **Benefit**: Entities trackable across representation churn; honest no-match refusals
- **Tests**: tests/intelligence/kernel.test.ts (identity tests)
- **Benchmark**: n/a
- **Security**: none

### S02 — Semantic DOM layer (roles, purpose, state, stability)

- **Category**: semantic · **Priority**: P1 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Raw DOM is noise for agents
- **Baseline limitation**: Class soup like "x7 a91" was all an agent saw
- **External evidence**: Playwright a11y-tree snapshots; roadmap semantic DOM
- **Why it matters**: Agents need meaning, not markup
- **Architecture**: SemanticEngine.semanticDom(): role by tag/aria/testid, purpose strings, states, stability scoring from anchor signals, selector candidates
- **Modules**: semantics/semantic-engine
- **Complexity**: medium · **Risk**: low
- **Benefit**: Token-efficient, meaning-bearing page model
- **Tests**: tests/intelligence/security-resilience.test.ts (semantic tests)
- **Benchmark**: n/a
- **Security**: context tokens metric

### S03 — Component boundary inference (React/Vue/Svelte/custom/iframe)

- **Category**: component · **Priority**: P1 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Component boundaries were invisible
- **Baseline limitation**: fx_component_boundaries had partial coverage without lifecycle
- **External evidence**: Roadmap component intelligence
- **Why it matters**: Component-level causality requires boundary detection
- **Architecture**: Fingerprint-based framework detection with evidence + confidence; component ids + ownership
- **Modules**: semantics/semantic-engine
- **Complexity**: medium · **Risk**: low
- **Benefit**: Component-scoped analysis and ownership
- **Tests**: tests/intelligence/security-resilience.test.ts
- **Benchmark**: n/a
- **Security**: none

### S04 — Component lifecycle derivation (mount/update/remount/unmount)

- **Category**: component · **Priority**: P1 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: No mount/unmount tracking for components
- **Baseline limitation**: None
- **External evidence**: React/Vue remount debugging folklore
- **Why it matters**: "Which component remounted and when" is a top SPA debugging question
- **Architecture**: lifecycleFromEvents(): mount/update/remount/unmount with event evidence
- **Modules**: semantics/semantic-engine
- **Complexity**: medium · **Risk**: low
- **Benefit**: Component time machine
- **Tests**: tests/intelligence/security-resilience.test.ts (lifecycle test)
- **Benchmark**: n/a
- **Security**: none

### S05 — Multi-signal target resolution engine

- **Category**: targeting · **Priority**: P1 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Selectors were the only targeting signal
- **Baseline limitation**: generate_element_target ranked selectors only
- **External evidence**: Playwright ref/uid model; roadmap target intelligence
- **Why it matters**: Natural-language + semantic targeting must beat selector guessing
- **Architecture**: TargetIntelligence.resolve(): structural/semantic/historical/behavioral/visual signals with weights, evidence and honest statuses
- **Modules**: targeting/target-intelligence
- **Complexity**: high · **Risk**: medium
- **Benefit**: Intent-level targeting with confidence + verification
- **Tests**: tests/intelligence/security-resilience.test.ts (targeting tests)
- **Benchmark**: n/a
- **Security**: none

### S06 — Ambiguity refusal (no blind clicking)

- **Category**: targeting · **Priority**: P0 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Nearest-match could be silently wrong
- **Baseline limitation**: Recovery below 0.62 refused but resolution did not
- **External evidence**: Browser Use false-success reports; roadmap "never blindly click"
- **Why it matters**: Two similar candidates must surface AMBIGUOUS, not a guess
- **Architecture**: Resolution returns AMBIGUOUS with warnings when top-2 within 0.08
- **Modules**: targeting/target-intelligence
- **Complexity**: low · **Risk**: medium
- **Benefit**: No silent wrong-target actions
- **Tests**: tests ambiguous twins test
- **Benchmark**: n/a
- **Security**: none

### S07 — Multi-signal target recovery after rerender

- **Category**: targeting · **Priority**: P1 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Selector recovery used fingerprint matching only
- **Baseline limitation**: recover_selector single strategy
- **External evidence**: Self-healing selectors ecosystem (e.g. Healenium); roadmap recovery
- **Why it matters**: Targets must survive rerender/remount/SPA navigation without agent retries
- **Architecture**: recover(): semantic id + text + role + component + ancestry scoring; refuses below 0.5 as blind guess
- **Modules**: targeting/target-intelligence
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Self-healing targeting with honest refusals
- **Tests**: tests recovery test
- **Benchmark**: n/a
- **Security**: none

### S08 — Durable target contracts

- **Category**: targeting · **Priority**: P2 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Targets were re-resolved from scratch each time
- **Baseline limitation**: None
- **External evidence**: Roadmap target contracts
- **Why it matters**: Repeated interactions should reuse verified resolutions
- **Architecture**: Contract registry keyed by query+semantic id with selector fallbacks + reuse counts
- **Modules**: targeting/target-intelligence
- **Complexity**: low · **Risk**: low
- **Benefit**: Stable cross-call target identity
- **Tests**: tests contract test
- **Benchmark**: n/a
- **Security**: none

### S09 — Accessibility-first semantic signals

- **Category**: a11y · **Priority**: P2 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: A11y was a side tool, not a targeting signal
- **Baseline limitation**: get_element_accessibility existed as inspection
- **External evidence**: Playwright a11y snapshot philosophy; roadmap §45
- **Why it matters**: Roles/names/labels are the most stable targeting anchors
- **Architecture**: A11y fields integrated into semantic model + accessibility model tool
- **Modules**: semantics/semantic-engine
- **Complexity**: low · **Risk**: low
- **Benefit**: Stable targeting + a11y visibility in one model
- **Tests**: tests a11y model test
- **Benchmark**: n/a
- **Security**: none

### S10 — Page-intent workflow inference

- **Category**: semantic · **Priority**: P3 · **Version target**: 5.0 · **Status**: IMPLEMENTED
- **Problem**: Page purpose required full DOM dumps
- **Baseline limitation**: None
- **External evidence**: Roadmap page intent
- **Why it matters**: Agents need interaction zones without full state
- **Architecture**: Workflow/zone inference from semantic roles + interactive elements
- **Modules**: v12/mcp handler
- **Complexity**: low · **Risk**: low
- **Benefit**: L1-level page understanding
- **Tests**: tests page intent smoke
- **Benchmark**: n/a
- **Security**: context tokens metric

### V01 — Verification contracts (mustHold/mustNotHold/evidence)

- **Category**: verification · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Action success was reported without postcondition checks
- **Baseline limitation**: Tools returned success on action completion
- **External evidence**: Browser Use false-success issue class; roadmap §19/P10
- **Why it matters**: Action ≠ success; postconditions must be checked with required evidence
- **Architecture**: VerificationContract with mustHold/mustNotHold/timeWindow/evidenceRequired → PASS/FAIL/INCONCLUSIVE
- **Modules**: verification/proof
- **Complexity**: medium · **Risk**: medium
- **Benefit**: No synthetic success: missing evidence → INCONCLUSIVE (tested)
- **Tests**: tests/intelligence/evidence-causality.test.ts (4 verification tests)
- **Benchmark**: falseSuccess metric
- **Security**: falseSuccessRate 0.00%

### V02 — Machine-verifiable proof records

- **Category**: proof · **Priority**: P0 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: No proof artifacts for conclusions
- **Baseline limitation**: None
- **External evidence**: Roadmap proof engine; forensic evidence standards
- **Why it matters**: Resolved incidents must be independently checkable
- **Architecture**: ProofRecord: claims + steps + evidence refs + content hash + previous-proof chaining; verifyProof() re-computes hash
- **Modules**: verification/proof
- **Complexity**: medium · **Risk**: low
- **Benefit**: Tamper-evident, independently re-checkable conclusions
- **Tests**: tests proof tamper test
- **Benchmark**: n/a
- **Security**: none

### V03 — Safe mutation transactions (10-phase pipeline)

- **Category**: mutation · **Priority**: P0 · **Version target**: 6.0 · **Status**: IMPLEMENTED
- **Problem**: DOM mutations were direct with best-effort undo
- **Baseline limitation**: mutate_dom_transaction existed without risk/simulation phases
- **External evidence**: Roadmap §18; database transaction discipline
- **Why it matters**: Mutations need PLAN→SCOPE→RISK→PRE→SIM→APPLY→OBSERVE→POST→VERIFY→COMMIT/ROLLBACK
- **Architecture**: SafeMutationEngine with adapter choke point, audit trail, rollback unless unsafe
- **Modules**: mutation/transaction
- **Complexity**: high · **Risk**: high
- **Benefit**: Transactional mutations with scope rejection, destructive gating, rollback
- **Tests**: tests/intelligence/incident-investigation.test.ts (4 mutation tests)
- **Benchmark**: n/a
- **Security**: none

### V04 — Destructive-action classification + default-off

- **Category**: mutation · **Priority**: P0 · **Version target**: 6.0 · **Status**: IMPLEMENTED
- **Problem**: remove-node/eval were undifferentiated from set-attribute
- **Baseline limitation**: No risk classes
- **External evidence**: OWASP-safe tooling; roadmap destructive classification
- **Why it matters**: High-risk operations must be gated by policy, not hope
- **Architecture**: Risk levels LOW/MEDIUM/HIGH/DESTRUCTIVE; DESTRUCTIVE + HIGH blocked unless explicitly allowed
- **Modules**: mutation/transaction
- **Complexity**: low · **Risk**: high
- **Benefit**: Dangerous mutations impossible by accident
- **Tests**: tests destructive-blocked test
- **Benchmark**: n/a
- **Security**: policy gate

### V05 — Prediction engine with mandatory epistemics

- **Category**: prediction · **Priority**: P2 · **Version target**: 6.0 · **Status**: IMPLEMENTED
- **Problem**: No prediction capability
- **Baseline limitation**: None
- **External evidence**: Roadmap prediction; forecasting discipline
- **Why it matters**: Predictions must expose confidence/assumptions/counterevidence/horizon/verification path
- **Architecture**: Pattern-triggered predictions (failure-risk, resource-risk, state-transition) with full epistemic payload
- **Modules**: simulation/predictor
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Forward-looking intelligence that never poses guesses as facts
- **Tests**: tests prediction tests
- **Benchmark**: n/a
- **Security**: none

### V06 — INCONCLUSIVE-never-PASS discipline

- **Category**: verification · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Ambiguous outcomes were silently successful
- **Baseline limitation**: Error swallowing paths in tool handlers
- **External evidence**: Priority 3 no-fake-success
- **Why it matters**: The single most dangerous failure mode in agent tooling
- **Architecture**: Status taxonomy PASS/FAIL/INCONCLUSIVE/UNSUPPORTED/DEGRADED/PARTIAL enforced across all 100 td_* tools (smoke-tested)
- **Modules**: v12/mcp handler
- **Complexity**: low · **Risk**: medium
- **Benefit**: Honest statuses everywhere; 0.00% false success measured
- **Tests**: tests/intelligence registry smoke (status taxonomy)
- **Benchmark**: smoke matrix
- **Security**: falseSuccessRate

### V07 — Throwing-check containment in verification

- **Category**: verification · **Priority**: P2 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: A throwing postcondition crashed verification
- **Baseline limitation**: None
- **External evidence**: Defensive verification
- **Why it matters**: Broken checks must FAIL, not crash
- **Architecture**: safeCheck() wraps all postcondition checks
- **Modules**: verification/proof
- **Complexity**: low · **Risk**: low
- **Benefit**: Robust verification under broken predicates
- **Tests**: tests throwing-check test
- **Benchmark**: n/a
- **Security**: none

### V08 — Incident lifecycle state machine

- **Category**: incident · **Priority**: P1 · **Version target**: 7.0 · **Status**: IMPLEMENTED
- **Problem**: Sessions had no incident concept
- **Baseline limitation**: Session-centric model
- **External evidence**: Roadmap §21 incident lifecycle; ITSM practice
- **Why it matters**: Bugs need explicit lifecycles with valid transitions
- **Architecture**: 13-state machine (CREATED→…→RESOLVED/ABANDONED) with VALID_TRANSITIONS + audit trail
- **Modules**: incident/model
- **Complexity**: medium · **Risk**: low
- **Benefit**: Enforced, auditable incident progression
- **Tests**: tests lifecycle tests (valid+invalid)
- **Benchmark**: n/a
- **Security**: none

### V09 — Portable .tdom forensic artifacts

- **Category**: incident · **Priority**: P1 · **Version target**: 7.0 · **Status**: IMPLEMENTED
- **Problem**: Session export was JSON blob
- **Baseline limitation**: export_session JSON
- **External evidence**: Roadmap §22; evidence portability
- **Why it matters**: Incidents must be transportable, reviewable, machine-ingestible
- **Architecture**: TdomFormat: versioned manifest, content-addressed sections, gzip, compatibility info; tamper detection on import
- **Modules**: incident/format
- **Complexity**: high · **Risk**: medium
- **Benefit**: Round-trip verified, tamper-evident incident packages
- **Tests**: tests/intelligence .tdom tests (round-trip, gzip, tamper)
- **Benchmark**: n/a
- **Security**: export throughput

### V10 — Tamper detection on artifact import

- **Category**: incident · **Priority**: P0 · **Version target**: 7.0 · **Status**: IMPLEMENTED
- **Problem**: Imported sessions were trusted
- **Baseline limitation**: No verification on import
- **External evidence**: Forensic chain of custody
- **Why it matters**: Modified artifacts must be detected, never silently accepted
- **Architecture**: Per-section hash + manifest hash re-verification; brokenSection reported
- **Modules**: incident/format
- **Complexity**: medium · **Risk**: low
- **Benefit**: Imported evidence integrity is provable
- **Tests**: tests tamper test
- **Benchmark**: n/a
- **Security**: none

### V11 — Resumable investigation plans

- **Category**: incident · **Priority**: P1 · **Version target**: 7.0 · **Status**: IMPLEMENTED
- **Problem**: Investigations were manual tool-call sequences with no state
- **Baseline limitation**: None
- **External evidence**: Roadmap §20 resumable plans; agent goal-retention complaints
- **Why it matters**: Interrupted investigations must continue, not restart
- **Architecture**: InvestigationPlan with per-step status + completedThrough + resumePlanId support
- **Modules**: incident/investigation
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Durable, resumable autonomous investigations
- **Tests**: tests resumable-plan test
- **Benchmark**: n/a
- **Security**: none

### V12 — Autonomous investigator (td_investigate)

- **Category**: incident · **Priority**: P0 · **Version target**: 7.0 · **Status**: IMPLEMENTED
- **Problem**: Agent manually orchestrated 30+ tool calls
- **Baseline limitation**: prompts hinted at workflows
- **External evidence**: Roadmap §20; unified diagnostic bundle requests
- **Why it matters**: A natural-language objective must become a full investigation
- **Architecture**: 13-step orchestrated plan: scope→incident→baseline→observe→timeline→reconstruct→correlate→graph→hypotheses→counterfactual→verify→proof→lesson
- **Modules**: incident/investigation
- **Complexity**: high · **Risk**: high
- **Benefit**: The flagship: objective in, verified root cause + proof out
- **Tests**: tests/intelligence §78 end-to-end test
- **Benchmark**: ICR=100%
- **Security**: investigation latency benchmark

### X01 — Zero-trust page model

- **Category**: security · **Priority**: P0 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Page content could implicitly flow into agent context
- **Baseline limitation**: No trust separation
- **External evidence**: Prompt-injection literature; roadmap §23
- **Why it matters**: Page text is untrusted data and must never become policy
- **Architecture**: ZeroTrustModel: origin trust, instruction-source tagging, page-content quarantine
- **Modules**: security/zero-trust
- **Complexity**: high · **Risk**: high
- **Benefit**: Structural injection defense
- **Tests**: tests zero-trust tests
- **Benchmark**: n/a
- **Security**: architecture-level

### X02 — Prompt-injection pattern detection

- **Category**: security · **Priority**: P0 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: No injection detection
- **Baseline limitation**: None
- **External evidence**: OWASP LLM Top-10; injection attack patterns
- **Why it matters**: Instruction-override/role-hijack/policy-exfiltration attempts must be flagged
- **Architecture**: 7 pattern families with multi-pattern confidence + evidence refs
- **Modules**: security/zero-trust
- **Complexity**: low · **Risk**: medium
- **Benefit**: Detected + quarantined injection attempts with evidence
- **Tests**: tests injection tests
- **Benchmark**: n/a
- **Security**: none

### X03 — Secret detection + redaction with human-only reveal

- **Category**: security · **Priority**: P0 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Privacy engine masked known patterns; reveal rules unclear
- **Baseline limitation**: RedactionEngine existed for storage
- **External evidence**: Roadmap §22 privacy; secret-exposure defense
- **Why it matters**: Secrets must be redacted before agent eyes; unmasking is human-only + audited
- **Architecture**: 8 secret families; agent reveal attempts BLOCKED and audited; human reveal ALLOWED and audited
- **Modules**: security/zero-trust
- **Complexity**: medium · **Risk**: high
- **Benefit**: Verifiable redaction + dual-audit trail
- **Tests**: tests redaction/reveal test
- **Benchmark**: n/a
- **Security**: redaction audit

### X04 — Exfiltration detection

- **Category**: security · **Priority**: P1 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Secret-bearing outbound payloads undetected
- **Baseline limitation**: None
- **External evidence**: Client-side security monitoring; OWASP
- **Why it matters**: Credentials flowing to unexpected origins must be caught
- **Architecture**: detectExfiltration(): destination origin + payload-kind classification + quarantine audit
- **Modules**: security/zero-trust
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Outbound secret leakage observability
- **Tests**: tests exfiltration test
- **Benchmark**: n/a
- **Security**: none

### X05 — Passive security posture suite

- **Category**: security · **Priority**: P1 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: No browser-side security analyzers
- **Baseline limitation**: None
- **External evidence**: OWASP ZAP browser-resident trend; roadmap §24
- **Why it matters**: Client-visible security signals complement proxy-side scanning
- **Architecture**: 10 analyzers: dom-xss source/sink, CSP, cookies, storage, iframes, postMessage, third-party, mixed-content, auth, secret-exposure
- **Modules**: security/analyzers
- **Complexity**: high · **Risk**: medium
- **Benefit**: Evidence-driven browser security posture with findings model
- **Tests**: tests security analyzer tests
- **Benchmark**: n/a
- **Security**: none

### X06 — Findings verification status discipline

- **Category**: security · **Priority**: P0 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Scanners report suspicion as vulnerability
- **Baseline limitation**: Common DAST noise problem
- **External evidence**: Roadmap findings model; false-positive fatigue
- **Why it matters**: Suspicion must never be CONFIRMED without reproduction
- **Architecture**: Finding statuses CONFIRMED/PROBABLE/POTENTIAL/BENIGN/NOT_REPRODUCIBLE enforced by test
- **Modules**: security/analyzers
- **Complexity**: low · **Risk**: medium
- **Benefit**: Signal-to-noise preserved; agents cannot treat hypotheses as facts
- **Tests**: tests never-CONFIRMED-without-repro test
- **Benchmark**: n/a
- **Security**: none

### X07 — Active-testing policy gates

- **Category**: security · **Priority**: P0 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Active testing could silently escalate from passive
- **Baseline limitation**: No scope/rate/budget controls
- **External evidence**: Roadmap §25; authorized-testing standards
- **Why it matters**: Passive analysis must never become active exploitation silently
- **Architecture**: ActiveTestGate: mode, origin allowlist, category allowlist, rate limit, request budget, destructive default-off, kill switch
- **Modules**: security/analyzers
- **Complexity**: medium · **Risk**: high
- **Benefit**: All five gate dimensions tested and enforced
- **Tests**: tests gate tests (5 tests)
- **Benchmark**: n/a
- **Security**: none

### X08 — Kill switch for all active security testing

- **Category**: security · **Priority**: P0 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Active security testing had no emergency stop mechanism once authorized
- **Baseline limitation**: No way to instantly halt authorized active testing
- **External evidence**: Range-safety engineering practice (hardware/software test ranges require a big red button)
- **Why it matters**: An authorized active test that misbehaves must be stoppable instantly, before budget/rate limits catch it
- **Architecture**: engageKillSwitch() flips a policy flag that every authorization check consults first; all subsequent active-test requests are refused with an explicit kill-switch reason
- **Modules**: security/analyzers, v12/mcp handler
- **Complexity**: low · **Risk**: low
- **Benefit**: One-call emergency containment of all active testing
- **Tests**: tests kill-switch test (gate refuses after engage)
- **Benchmark**: n/a
- **Security**: none

### X09 — DOM XSS longest-source matching

- **Category**: security · **Priority**: P2 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Source attribution matched bare "location" over "location.hash"
- **Baseline limitation**: Initial implementation ambiguity
- **External evidence**: Source/sink analysis precision
- **Why it matters**: XSS findings must cite the precise source
- **Architecture**: Longest-match source selection in domXssAudit
- **Modules**: security/analyzers
- **Complexity**: low · **Risk**: low
- **Benefit**: Precise source attribution in findings
- **Tests**: tests XSS source test
- **Benchmark**: n/a
- **Security**: none

### X10 — Cross-origin secret-exposure findings

- **Category**: security · **Priority**: P1 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Credential destinations were not compared to page origin
- **Baseline limitation**: None
- **External evidence**: CORS trust expectations; roadmap
- **Why it matters**: Authorization headers to cross-origin endpoints are high-signal findings
- **Architecture**: secretExposureAudit with page-origin comparison
- **Modules**: security/analyzers
- **Complexity**: low · **Risk**: medium
- **Benefit**: High-severity exposure findings with data flow
- **Tests**: tests exposure test
- **Benchmark**: n/a
- **Security**: none

### R01 — Self-healing runtime state machine

- **Category**: resilience · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Bridge failures required manual restart
- **Baseline limitation**: Bridge health existed but no state machine
- **External evidence**: Chrome DevTools MCP crash-recovery issues; roadmap §27
- **Why it matters**: CONNECTED→DEGRADED→DISCONNECTED→RECOVERING→REATTACHED→RECONCILED with evidence preservation
- **Architecture**: SelfHealingRuntime with snapshot-before-recovery, bounded attempts (3), exponential backoff
- **Modules**: resilience/guardian
- **Complexity**: high · **Risk**: medium
- **Benefit**: Recovery is a modeled, observable transition
- **Tests**: tests recovery tests
- **Benchmark**: recovery benchmark
- **Security**: recovery time benchmark

### R02 — Bounded recovery (no infinite retries)

- **Category**: resilience · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Reconnect loops could spin forever
- **Baseline limitation**: Unbounded retry risk
- **External evidence**: Roadmap "no infinite retry loop"
- **Why it matters**: Retry storms are self-inflicted DoS
- **Architecture**: maxAttemptsPerFailure=3 with reason-aware outcomes; FAILED result after exhaustion
- **Modules**: resilience/guardian
- **Complexity**: low · **Risk**: medium
- **Benefit**: Guaranteed retry termination
- **Tests**: tests never-loops test
- **Benchmark**: n/a
- **Security**: none

### R03 — Evidence-preserving recovery snapshots

- **Category**: resilience · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Crashes lost session state
- **Baseline limitation**: None
- **External evidence**: Crash-recovery requirements
- **Why it matters**: Incidents/identity/evidence/checkpoints/head-sequence must survive failures
- **Architecture**: RecoverySnapshot captured BEFORE recovery attempts; preserved list reported per attempt
- **Modules**: resilience/guardian
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Post-crash state continuity with proof
- **Tests**: tests preservation test
- **Benchmark**: n/a
- **Security**: none

### R04 — Resource guardian with budgets

- **Category**: resilience · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: No resource budget enforcement
- **Baseline limitation**: None
- **External evidence**: Playwright MCP memory growth; roadmap §28 budgets
- **Why it matters**: TeleDOM must never become the performance problem
- **Architecture**: Guardian: events/bytes/memory/graph/network/queue budgets → pressure ratio
- **Modules**: resilience/guardian
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Utilization-aware capture policy
- **Tests**: tests guardian test
- **Benchmark**: n/a
- **Security**: none

### R05 — Adaptive degradation modes

- **Category**: resilience · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: No graceful degradation — either full capture or crash
- **Baseline limitation**: None
- **External evidence**: Roadmap healthy→emergency ladder
- **Why it matters**: Pressure must degrade fidelity, not kill the session
- **Architecture**: HEALTHY/FULL_FIDELITY → PRESSURED/COMPACT → CRITICAL/SAMPLING → EMERGENCY/PRESERVE_EVIDENCE+CHECKPOINT+RECOVER
- **Modules**: resilience/guardian
- **Complexity**: low · **Risk**: medium
- **Benefit**: Bounded, ladder-style degradation (tested at all 4 levels)
- **Tests**: tests degradation test
- **Benchmark**: n/a
- **Security**: none

### R06 — Session repair from serialized stream

- **Category**: resilience · **Priority**: P1 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Partially corrupted sessions were unusable
- **Baseline limitation**: None
- **External evidence**: Roadmap session repair
- **Why it matters**: Interrupted storage must be repairable from checkpoints + evidence
- **Architecture**: serialize() → fresh mesh restore() with chain re-verification; td_session_repair tool
- **Modules**: kernel/events, v12/mcp handler
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Hash-verified session resurrection
- **Tests**: tests session-repair dispatch + chaos storage-interruption
- **Benchmark**: recovery benchmark
- **Security**: recovery time benchmark

### R07 — Chaos engineering suite (16 injections)

- **Category**: resilience · **Priority**: P0 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: No failure-injection testing
- **Baseline limitation**: None
- **External evidence**: Chaos engineering practice; roadmap §39
- **Why it matters**: Failure must be contained/observed/explained/recoverable — not "never happens"
- **Architecture**: injectChaos(): crash/disconnect/reload/duplication/reorder/delay/loss/corruption/storm/pressure + containment verification
- **Modules**: chaos/chaos.ts
- **Complexity**: high · **Risk**: medium
- **Benefit**: 16/16 injections contained+observed+explained+recoverable
- **Tests**: tests chaos test
- **Benchmark**: 16/16 contained
- **Security**: chaos metrics in BENCHMARKS.md

### R08 — Corruption rejection (never merge bad evidence)

- **Category**: resilience · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Corrupted input silently merged
- **Baseline limitation**: None
- **External evidence**: Byzantine-input defense
- **Why it matters**: Tampered envelopes must be rejected before they poison the chain
- **Architecture**: Integrity-hash verification on append; REJECTED_CORRUPT status; counted in stats
- **Modules**: kernel/events
- **Complexity**: low · **Risk**: high
- **Benefit**: Corrupt events can never enter the evidence chain
- **Tests**: tests corruption test + chaos artifact-corruption
- **Benchmark**: n/a
- **Security**: none

### R09 — Mutation-storm containment

- **Category**: resilience · **Priority**: P1 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Storms could exhaust memory
- **Baseline limitation**: None
- **External evidence**: Hostile-page resilience; roadmap §26
- **Why it matters**: 3000-event storms must be admitted with valid chain
- **Architecture**: Chaos mutation-storm injection verifies chain validity after storm
- **Modules**: chaos/chaos.ts
- **Complexity**: low · **Risk**: medium
- **Benefit**: Storm-proof kernel
- **Tests**: tests chaos storm
- **Benchmark**: n/a
- **Security**: none

### R10 — Kernel self-diagnostics

- **Category**: resilience · **Priority**: P0 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: TeleDOM could not assess its own health
- **Baseline limitation**: recording_health was partial
- **External evidence**: Roadmap §35 self-diagnosis
- **Why it matters**: "I may be producing invalid evidence" must be detectable and confidence-damping
- **Architecture**: KernelDiagnostics: 6 probes (event/storage integrity, guardian, runtime, graph, security) → confidenceMultiplier
- **Modules**: kernel/lifecycle, platform
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Health-gated confidence — degradation lowers downstream confidence
- **Tests**: tests health snapshot test
- **Benchmark**: n/a
- **Security**: none

### R11 — Degraded-confidence propagation

- **Category**: resilience · **Priority**: P1 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: Unhealthy kernel still produced full-confidence claims
- **Baseline limitation**: None
- **External evidence**: Epistemic honesty under failure
- **Why it matters**: System uncertainty must reduce claim confidence
- **Architecture**: health().confidenceMultiplier wired into assessConfidence
- **Modules**: evidence/confidence, platform
- **Complexity**: low · **Risk**: medium
- **Benefit**: Uncertainty propagates honestly
- **Tests**: tests confidence multiplier test
- **Benchmark**: n/a
- **Security**: none

### R12 — Runtime crash family exercises

- **Category**: resilience · **Priority**: P2 · **Version target**: 8.0 · **Status**: IMPLEMENTED
- **Problem**: page/renderer/browser/bridge crashes were untested paths
- **Baseline limitation**: None
- **External evidence**: Crash matrices in MCP issue trackers
- **Why it matters**: Every crash kind must be a modeled transition
- **Architecture**: td_recover_browser/page/bridge + chaos page/renderer/browser injections
- **Modules**: resilience/guardian, chaos
- **Complexity**: low · **Risk**: low
- **Benefit**: Crash recovery exercised per kind
- **Tests**: tests recovery dispatch + chaos
- **Benchmark**: n/a
- **Security**: none

### A01 — Capability registry as single source of truth

- **Category**: agent-os · **Priority**: P0 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: Tool counts/versions drifted across files (121/43/206 mismatch)
- **Baseline limitation**: Manual duplication in README/entrypoints/definitions
- **External evidence**: Doc-drift was a baseline defect; roadmap §31
- **Why it matters**: Version, tool count, schema, docs, tests must generate from ONE registry
- **Architecture**: CAPABILITY_REGISTRY: 100 td_* capabilities with full metadata; MCP defs/docs/compat generated from it
- **Modules**: registry/capabilities, registry/td-tools
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Structurally impossible drift for the td_* surface
- **Tests**: tests registry generation test
- **Benchmark**: n/a
- **Security**: none

### A02 — Intent-level tool architecture (100 td_* facades)

- **Category**: agent-os · **Priority**: P0 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: 206 flat tools forced manual agent orchestration
- **Baseline limitation**: Tool-per-command model
- **External evidence**: Roadmap §30; token-cost complaints
- **Why it matters**: Agents should express intent; the platform orchestrates
- **Architecture**: td_* families compose kernel/temporal/evidence/causal primitives via one dispatcher — not 100 isolated handlers
- **Modules**: v12/mcp handler
- **Complexity**: high · **Risk**: medium
- **Benefit**: Investigation-level calls replace 30-call sequences
- **Tests**: tests smoke matrix
- **Benchmark**: n/a
- **Security**: tool_calls_to_decision metric

### A03 — L0-L4 context levels

- **Category**: agent-os · **Priority**: P0 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: Full snapshots flooded context windows
- **Baseline limitation**: 500KB state dumps
- **External evidence**: Playwright MCP context overload; roadmap §29
- **Why it matters**: The agent should receive minimal sufficient context
- **Architecture**: ContextPlanner: L0 identity → L1 semantic → L2 subtree → L3 evidence → L4 full; artifacts externalized
- **Modules**: agent/context
- **Complexity**: high · **Risk**: medium
- **Benefit**: Measured: L1 ≈ 1.5K tokens vs 125K full-state tokens
- **Tests**: tests context planner tests
- **Benchmark**: token reduction
- **Security**: agent-context tokens metric

### A04 — Duplicate suppression + novelty in context

- **Category**: agent-os · **Priority**: P2 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: Repeated semantic entries wasted tokens
- **Baseline limitation**: None
- **External evidence**: Context economics
- **Why it matters**: Same-role elements are redundant
- **Architecture**: Deterministic dedup on role+text with suppression notes
- **Modules**: agent/context
- **Complexity**: low · **Risk**: low
- **Benefit**: Fewer tokens per decision
- **Tests**: tests dedup test
- **Benchmark**: n/a
- **Security**: bytes_to_decision

### A05 — Context economics metrics

- **Category**: agent-os · **Priority**: P1 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: Token cost of decisions was unmeasured
- **Baseline limitation**: None
- **External evidence**: Roadmap context tracking
- **Why it matters**: bytes/tokens/tool-calls/failed-actions per decision are first-class metrics
- **Architecture**: ContextMetrics accumulated per plan() call
- **Modules**: agent/context
- **Complexity**: low · **Risk**: low
- **Benefit**: Quantified context efficiency
- **Tests**: tests metrics assertions
- **Benchmark**: n/a
- **Security**: token metric

### A06 — Durable agent memory with provenance

- **Category**: agent-os · **Priority**: P1 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: No cross-session knowledge
- **Baseline limitation**: None
- **External evidence**: Roadmap §33 agent memory
- **Why it matters**: Learned facts (components, failures, fixes, invariants) must persist with confidence
- **Architecture**: AgentMemory: 12 memory kinds, provenance per item, validation feedback loops
- **Modules**: agent/memory
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Knowledge compounding across investigations
- **Tests**: tests memory tests
- **Benchmark**: n/a
- **Security**: none

### A07 — Uncertainty-gated memory (no fact inflation)

- **Category**: agent-os · **Priority**: P0 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: Memory would treat hunches as facts
- **Baseline limitation**: None
- **External evidence**: Roadmap "do not treat uncertain memory as fact"
- **Why it matters**: Low-confidence memories must be flagged unvalidated
- **Architecture**: validated flag (confidence ≥ 0.75); query onlyValidated filters
- **Modules**: agent/memory
- **Complexity**: low · **Risk**: medium
- **Benefit**: Facts vs hypotheses structurally separated
- **Tests**: tests memory validation tests
- **Benchmark**: n/a
- **Security**: none

### A08 — Learning limited to heuristic boosts

- **Category**: agent-os · **Priority**: P0 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: Learning could silently alter policy/code
- **Baseline limitation**: None
- **External evidence**: Roadmap §34 no unsafe self-modification
- **Why it matters**: Observation must never become unauthorized change
- **Architecture**: heuristicBoost() only influences ranking scores (bounded ≤ 0.2); never security policy
- **Modules**: agent/memory
- **Complexity**: low · **Risk**: high
- **Benefit**: Safe learning boundary
- **Tests**: tests boost test
- **Benchmark**: n/a
- **Security**: none

### A09 — Declarative workflow execution with recovery

- **Category**: agent-os · **Priority**: P2 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: Multi-step agent flows had no recovery semantics
- **Baseline limitation**: None
- **External evidence**: Roadmap run_workflow
- **Why it matters**: Multi-step operations need per-step status + honest PARTIAL results
- **Architecture**: td_run_workflow: executes step tools, collects per-step statuses, PARTIAL when any step degrades
- **Modules**: v12/mcp handler
- **Complexity**: medium · **Risk**: low
- **Benefit**: Composable agent workflows
- **Tests**: tests workflow smoke + operational
- **Benchmark**: n/a
- **Security**: none

### A10 — Playbook library

- **Category**: agent-os · **Priority**: P3 · **Version target**: 10.0 · **Status**: IMPLEMENTED
- **Problem**: No reusable investigation procedures
- **Baseline limitation**: None
- **External evidence**: SRE playbook practice
- **Why it matters**: Common scenarios should be one call
- **Architecture**: td_run_playbook: disappearing-ui, security-passive, performance-scan, recovery-drill
- **Modules**: v12/mcp handler
- **Complexity**: low · **Risk**: low
- **Benefit**: Reusable expert procedures
- **Tests**: tests playbook smoke
- **Benchmark**: n/a
- **Security**: none

### G01 — Golden incident suite (1000+ deterministic scenarios)

- **Category**: testing · **Priority**: P0 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: No ground-truth investigation benchmark
- **Baseline limitation**: None
- **External evidence**: Roadmap §38 golden incidents; benchmark-driven disciplines
- **Why it matters**: The engine must be graded against known root causes
- **Architecture**: generateGoldenSuite: 24 categories × seeds = 1032 scenarios with expected root cause/verification; deterministic PRNG
- **Modules**: golden/generator
- **Complexity**: high · **Risk**: medium
- **Benefit**: ICR/EC/RF/FalseSuccess measured against ground truth
- **Tests**: tests golden suite test
- **Benchmark**: ICR 100%
- **Security**: golden metrics

### G02 — Investigation Completion Rate metric

- **Category**: testing · **Priority**: P0 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: No completion metric existed
- **Baseline limitation**: None
- **External evidence**: Roadmap-defined ICR
- **Why it matters**: Resolved/resolvable is the product quality metric
- **Architecture**: ICR = resolved / resolvable (INCONCLUSIVE-expected scenarios excluded from denominator — honest)
- **Modules**: golden/generator
- **Complexity**: low · **Risk**: low
- **Benefit**: Product-quality north-star metric
- **Tests**: tests metric assertions
- **Benchmark**: ICR=100%
- **Security**: ICR in BENCHMARKS.md

### G03 — Evidence Confidence metric

- **Category**: testing · **Priority**: P1 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: No verification-quality metric
- **Baseline limitation**: None
- **External evidence**: Roadmap EC
- **Why it matters**: Verified findings / reported findings measures claim quality
- **Architecture**: EC computed per suite run
- **Modules**: golden/generator
- **Complexity**: low · **Risk**: low
- **Benefit**: Claim-quality tracking
- **Tests**: tests metric
- **Benchmark**: EC=83.3%
- **Security**: EC in BENCHMARKS.md

### G04 — Replay Fidelity metric

- **Category**: testing · **Priority**: P1 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: No replay-quality metric
- **Baseline limitation**: None
- **External evidence**: Roadmap RF
- **Why it matters**: Reproduced/recorded causal outcomes measures counterfactual fidelity
- **Architecture**: RF computed per suite run
- **Modules**: golden/generator
- **Complexity**: low · **Risk**: low
- **Benefit**: Replay-quality tracking
- **Tests**: tests metric
- **Benchmark**: RF=100%
- **Security**: RF in BENCHMARKS.md

### G05 — False Success Rate metric

- **Category**: testing · **Priority**: P0 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: False successes were invisible
- **Baseline limitation**: Reported-issue class
- **External evidence**: No-fake-success priority
- **Why it matters**: Claimed PASS where INCONCLUSIVE expected must be measured
- **Architecture**: FSR per suite run; 0.00% achieved
- **Modules**: golden/generator
- **Complexity**: low · **Risk**: high
- **Benefit**: The anti-marketing metric
- **Tests**: tests metric
- **Benchmark**: FSR=0.00%
- **Security**: FSR in BENCHMARKS.md

### G06 — Honest scenario denominators

- **Category**: testing · **Priority**: P2 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: Metrics could punish honest non-resolution
- **Baseline limitation**: None
- **External evidence**: Metric design discipline
- **Why it matters**: INCONCLUSIVE-expected scenarios are not failures
- **Architecture**: resolvable denominator + resolvableScenarios/resolvedScenarios exposed
- **Modules**: golden/generator
- **Complexity**: low · **Risk**: low
- **Benefit**: Metrics that reward honesty
- **Tests**: tests metric
- **Benchmark**: n/a
- **Security**: none

### G07 — Real benchmark matrix (10K/100K/1M)

- **Category**: benchmarking · **Priority**: P0 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: "Sub-millisecond" was unmeasured marketing
- **Baseline limitation**: No benchmarks
- **External evidence**: Roadmap §37; baseline 5.5/10 benchmark-evidence score
- **Why it matters**: Capture/query/reconstruction/recovery latencies must be published
- **Architecture**: runBenchmarks with p50/p95/p99 per scale + docs generated from measurements
- **Modules**: bench/benchmarks
- **Complexity**: high · **Risk**: low
- **Benefit**: Published, reproducible performance evidence
- **Tests**: tests suite-reports test
- **Benchmark**: full matrix
- **Security**: BENCHMARKS.md

### G08 — Resolution/latency separation

- **Category**: benchmarking · **Priority**: P0 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: Timestamp resolution was conflated with latency
- **Baseline limitation**: Marketing conflation
- **External evidence**: Roadmap explicit requirement
- **Why it matters**: 0.01ms resolution is a clock property; p99 latency is a compute property
- **Architecture**: Separate columns in benchmark matrix + note
- **Modules**: bench/benchmarks
- **Complexity**: low · **Risk**: low
- **Benefit**: No misleading performance claims
- **Tests**: tests resolution assertion
- **Benchmark**: n/a
- **Security**: benchmark doc

### G09 — Test-generated documentation

- **Category**: docs · **Priority**: P1 · **Version target**: 11.0 · **Status**: IMPLEMENTED
- **Problem**: Docs drifted from implementation
- **Baseline limitation**: 121/43/206 count drift at baseline
- **External evidence**: Doc-drift defect class
- **Why it matters**: Docs must be output of passing tests
- **Architecture**: BENCHMARKS.md written by suite-reports test; improvement matrix is a registry validated by test
- **Modules**: tests/intelligence/suite-reports, registry/improvements
- **Complexity**: low · **Risk**: low
- **Benefit**: Docs that cannot lie
- **Tests**: tests doc-existence assertions
- **Benchmark**: n/a
- **Security**: none

### G10 — Operational certification extended to 306 tools

- **Category**: testing · **Priority**: P0 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Operational suite covered 206 tools
- **Baseline limitation**: 206-tool certification
- **External evidence**: Repo operational suite (real stdio JSON-RPC)
- **Why it matters**: Every new tool must earn operational evidence
- **Architecture**: td_* case added to runner; 306/306 tools PASS + CERTIFIED with captured JSON-RPC evidence
- **Modules**: scripts/run-operational-suite.js, operational-tests/tools/*
- **Complexity**: medium · **Risk**: low
- **Benefit**: Full-surface operational certification
- **Tests**: operational-acceptance test (derives count from registry)
- **Benchmark**: 306/306
- **Security**: operational reports

### M01 — Intelligence-domain-oriented module structure

- **Category**: architecture · **Priority**: P1 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Feature-oriented src/ mixed concerns
- **Baseline limitation**: core/forensics/devtools tangle
- **External evidence**: Roadmap §38 folder structure
- **Why it matters**: Domains must own boundaries: kernel/temporal/evidence/...
- **Architecture**: src/intelligence/ with 18 domain modules, each with public barrel + typed exports
- **Modules**: src/intelligence/*
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Explicit architectural boundaries (SOLID where justified)
- **Tests**: typecheck + module graph
- **Benchmark**: n/a
- **Security**: none

### M02 — Backward-compatible facade integration

- **Category**: architecture · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Rewrites break consumers
- **Baseline limitation**: None
- **External evidence**: Roadmap §54 compatibility facades
- **Why it matters**: v4 kernel must sit UNDER existing dt_/fx_/base surfaces without breaking them
- **Architecture**: td_* dispatched first in MCPToolsHandler; 121 legacy names + 206 legacy tools preserved (tested)
- **Modules**: mcp/tools-handler, mcp/tools-definition
- **Complexity**: medium · **Risk**: high
- **Benefit**: Zero legacy breakage: 295/295 tests green including all legacy suites
- **Tests**: tests legacy suites
- **Benchmark**: 295/295
- **Security**: none

### M03 — Event-envelope schema versioning

- **Category**: architecture · **Priority**: P2 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Event schema had no version negotiation
- **Baseline limitation**: schemaVersion existed unused
- **External evidence**: MCP evolution practice; roadmap schema versioning
- **Why it matters**: Format evolution needs explicit versions
- **Architecture**: EVENT_SCHEMA_VERSION + envelope schemaVersion + .tdom compatibility block
- **Modules**: kernel/events, incident/format
- **Complexity**: low · **Risk**: low
- **Benefit**: Versioned, negotiable event format
- **Tests**: tests import compatibility
- **Benchmark**: n/a
- **Security**: none

### M04 — Authoritative version registry

- **Category**: architecture · **Priority**: P0 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Version strings drifted (v2.1.0 banner vs 3.1.0 package)
- **Baseline limitation**: sea-entry printed v2.1.0/43 tools
- **External evidence**: Baseline doc-drift defect
- **Why it matters**: One source of truth for version across package/CLI/MCP/artifacts
- **Architecture**: src/intelligence/version.ts: TELEDOM_VERSION + VERSION_HISTORY (v4→v12); sea-entry banner derives from it
- **Modules**: v12/version, sea-entry, package.json
- **Complexity**: low · **Risk**: low
- **Benefit**: Version drift structurally eliminated
- **Tests**: tests version sync assertions
- **Benchmark**: n/a
- **Security**: none

### M05 — Generated compatibility matrix

- **Category**: compatibility · **Priority**: P1 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Compatibility was hand-claimed
- **Baseline limitation**: README claims
- **External evidence**: Roadmap §59 generated matrices
- **Why it matters**: Compatibility must be computed, not asserted
- **Architecture**: generateCompatibilityMatrix(): 100 rows with schema/behavior parity, browser support, simulation, test status
- **Modules**: registry/compatibility
- **Complexity**: medium · **Risk**: low
- **Benefit**: Machine-generated compatibility truth
- **Tests**: tests matrix test
- **Benchmark**: n/a
- **Security**: none

### M06 — Registry-validated tool set (no inflation)

- **Category**: compatibility · **Priority**: P0 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Tool count was a vanity metric
- **Baseline limitation**: 206→306 growth without validation
- **External evidence**: Roadmap anti-inflation rules
- **Why it matters**: Exactly 100 td_* tools in 10 balanced families, validated structurally
- **Architecture**: validateRegistry(): 100 count, no dupes, td_ prefix, 10-per-category enforced
- **Modules**: registry/capabilities
- **Complexity**: low · **Risk**: medium
- **Benefit**: Structural guard against feature inflation
- **Tests**: tests registry validation
- **Benchmark**: n/a
- **Security**: none

### M07 — P0 sequence bug fix in legacy recorder

- **Category**: correctness · **Priority**: P0 · **Version target**: 4.0 · **Status**: IMPLEMENTED
- **Problem**: Baseline P0: id/sequence divergence in every event creation
- **Baseline limitation**: generateEventId() double-advance
- **External evidence**: Roadmap red-flag analysis (direct code inspection)
- **Why it matters**: Legacy event integrity must be fixed without breaking behavior
- **Architecture**: generateEventId(prefix, seq?) accepts explicit sequence; all 16 call sites pass their sequence
- **Modules**: core/*
- **Complexity**: medium · **Risk**: high
- **Benefit**: Legacy events now satisfy the identity invariant; tests stay green
- **Tests**: typecheck + legacy suites 295/295
- **Benchmark**: n/a
- **Security**: none

### M08 — Lookup-miss honesty in tool dispatch

- **Category**: agent-os · **Priority**: P2 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Missing references crashed or errored tools
- **Baseline limitation**: None
- **External evidence**: API robustness
- **Why it matters**: Unknown incident/branch/hypothesis ids are lookup misses, not failures
- **Architecture**: INCONCLUSIVE with actionable notes instead of FAIL crashes
- **Modules**: v12/mcp handler
- **Complexity**: low · **Risk**: low
- **Benefit**: Robust, honest tool responses (found by operational suite)
- **Tests**: operational suite 306/306
- **Benchmark**: n/a
- **Security**: none

### M09 — Directory-import-free kernel modules

- **Category**: architecture · **Priority**: P2 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Barrel imports broke direct Node execution
- **Baseline limitation**: None
- **External evidence**: Node ESM resolution
- **Why it matters**: Kernel must be loadable outside bundlers for scripts/tools
- **Architecture**: Explicit file-relative imports within v4 where scripts consume them
- **Modules**: src/intelligence/*
- **Complexity**: low · **Risk**: low
- **Benefit**: Runnable in Node, vitest and vite alike
- **Tests**: operational + vitest runs
- **Benchmark**: n/a
- **Security**: none

### M10 — Versioned .tdom round-trip compatibility

- **Category**: compatibility · **Priority**: P2 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Session format had no forward-compat story
- **Baseline limitation**: None
- **External evidence**: Artifact longevity
- **Why it matters**: Older readers must understand newer artifacts gracefully
- **Architecture**: formatVersion + minReaderVersion + compatibility notes on import
- **Modules**: incident/format
- **Complexity**: low · **Risk**: low
- **Benefit**: Artifact evolution path defined
- **Tests**: tests compatibility field
- **Benchmark**: n/a
- **Security**: none

### P01 — Performance causality tools (long-task/layout trace)

- **Category**: performance · **Priority**: P1 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Profiler outputs were isolated from causal model
- **Baseline limitation**: dt performance traces existed without causal linkage
- **External evidence**: Chrome DevTools performance panel; roadmap performance causality
- **Why it matters**: "Which network event caused this layout shift" must be answerable
- **Architecture**: td_long_task_trace + td_layout_causality correlate performance events through the causal engine
- **Modules**: v12/mcp handler
- **Complexity**: medium · **Risk**: low
- **Benefit**: Performance plugged into the same evidence + temporal model
- **Tests**: tests dispatch tests
- **Benchmark**: perf profile
- **Security**: performance profile

### P02 — Memory-leak pattern detection

- **Category**: performance · **Priority**: P2 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Memory analysis was manual heap reading
- **Baseline limitation**: heap dominators tooling without pattern detection
- **External evidence**: Heap-snapshot tooling; roadmap memory intelligence
- **Why it matters**: Retained-growth patterns need temporal churn analysis
- **Architecture**: td_memory_leak_trace: unmount-ratio analysis over DOM churn (growth signal < 0.3)
- **Modules**: v12/mcp handler
- **Complexity**: medium · **Risk**: low
- **Benefit**: Leak-pattern signals from recorded sessions
- **Tests**: tests dispatch test
- **Benchmark**: n/a
- **Security**: none

### P03 — Render-stability query

- **Category**: performance · **Priority**: P2 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: No "when is the page settled" primitive
- **Baseline limitation**: wait_for_dom_stable was heuristic timing
- **External evidence**: Roadmap render stability
- **Why it matters**: Agents need to know when state is observationally stable
- **Architecture**: td_render_stability via lastStable(settleMs)
- **Modules**: temporal/queries, v12/mcp handler
- **Complexity**: low · **Risk**: low
- **Benefit**: Deterministic stability point
- **Tests**: tests dispatch + temporal
- **Benchmark**: n/a
- **Security**: none

### P04 — Honest UNSUPPORTED for live-only capabilities

- **Category**: dx · **Priority**: P0 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Tools faked or crashed without live browser
- **Baseline limitation**: Some live tools returned misleading results
- **External evidence**: Browser Use false-success class
- **Why it matters**: No live adapter means honest UNSUPPORTED with wiring instructions
- **Architecture**: td_interaction_execute/safe_apply/retention_graph return UNSUPPORTED with reason + suggestion
- **Modules**: v12/mcp handler
- **Complexity**: low · **Risk**: high
- **Benefit**: Capability state honesty (never fake success)
- **Tests**: tests smoke UNSUPPORTED count
- **Benchmark**: n/a
- **Security**: none

### P05 — Retention-graph live dependency declared

- **Category**: dx · **Priority**: P0 · **Version target**: 12.0 · **Status**: IMPLEMENTED
- **Problem**: Heap retention graphs promised without runtime support
- **Baseline limitation**: None
- **External evidence**: DevTools heap snapshot API requirements
- **Why it matters**: Claiming runtime heap edges from recorded sessions would be dishonest
- **Architecture**: td_retention_graph returns UNSUPPORTED (EXPERIMENTAL) until live heap snapshots are wired
- **Modules**: v12/mcp handler
- **Complexity**: low · **Risk**: low
- **Benefit**: No over-claiming: experimental capability explicitly marked
- **Tests**: tests smoke
- **Benchmark**: n/a
- **Security**: none

### P06 — Visual causality never claims proof from pixels

- **Category**: visual · **Priority**: P1 · **Version target**: 9.0 · **Status**: IMPLEMENTED
- **Problem**: Screenshot diffs were treated as causal evidence
- **Baseline limitation**: Visual regression tooling implies causation
- **External evidence**: Roadmap visual intelligence limits
- **Why it matters**: Visual changes must correlate, never prove
- **Architecture**: td_visual_causality correlates visual/dom/runtime with classification; fidelity gate keeps verdicts INCONCLUSIVE
- **Modules**: v12/mcp handler, simulation/counterfactual
- **Complexity**: medium · **Risk**: medium
- **Benefit**: Visual evidence integrated without epistemic overreach
- **Tests**: tests fidelity gating
- **Benchmark**: n/a
- **Security**: none

### P07 — Deterministic runtime replay (full fidelity)

- **Category**: replay · **Priority**: P3 · **Version target**: 13-preview · **Status**: DEFERRED-external-infrastructure
- **Problem**: Counterfactual replay is event-level, not runtime-level
- **Baseline limitation**: Branch replay deterministically reorders recorded events
- **External evidence**: Replay.io deterministic runtime replay (competitor strength)
- **Why it matters**: True deterministic JS-runtime replay requires record/replay browser instrumentation
- **Architecture**: DEFERRED: requires a forked browser runtime (Replay.io-class infrastructure) — documented as explicit gap, not claimed
- **Modules**: docs/intelligence limitations
- **Complexity**: high · **Risk**: high
- **Benefit**: Honest boundary declaration instead of over-claim
- **Tests**: docs limitation section
- **Benchmark**: n/a
- **Security**: none

### P08 — Cross-browser (Firefox/WebKit) kernel parity

- **Category**: compatibility · **Priority**: P3 · **Version target**: 13-preview · **Status**: DEFERRED-platform-limit
- **Problem**: Kernel is exercised on Chrome/Chromium surface
- **Baseline limitation**: Extension + CDP are Chrome-first
- **External evidence**: Playwright cross-browser matrix; roadmap cross-browser strategy
- **Why it matters**: Firefox/WebKit need explicit capability status, not assumed parity
- **Architecture**: DEFERRED: browser-specific adapters required; td surfaces report per-mode support; no universal-compat claim
- **Modules**: docs/intelligence limitations
- **Complexity**: high · **Risk**: medium
- **Benefit**: No false universality claims
- **Tests**: compatibility matrix modes
- **Benchmark**: n/a
- **Security**: none

