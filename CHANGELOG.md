# Changelog

All notable changes to the **TeleDOM / MCPDOM Unified Browser Intelligence Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [4.1.0] - 2026-09-12

### Major Release — TeleDOM v4.1: Agent-Owned Workflow Runtime

> TeleDOM is not the decision-maker; TeleDOM is the enabler. The Agent is
> the brain. TeleDOM is the hands, eyes, memory and browser toolbox.
> Teach once. Reuse forever. Adapt when the web changes. Prove what happened.

**350 certified MCP tools** (121 base + 54 dt_ + 31 fx_ + **144 td_**), a
durable agent store, deterministic execution records and a Level-2 Python
SDK — with every v4 defect found and fixed (23 bugs, see
[docs/workflow/RELEASE_NOTES.md](./docs/workflow/RELEASE_NOTES.md)).

### Added
- **Agent-Owned Workflow Runtime (`src/intelligence/workflow/`)** — 44 new `td_*` tools:
  - **browser-primitives (22)**: `td_browser_navigate/back/forward/refresh`, `td_dom_inspect/query/extract/snapshot`, `td_target_find/check/describe`, `td_action_click/type/select/hover/press/scroll`, `td_wait`, `td_screenshot`, `td_execute_script`, `td_network_inspect`, `td_console_read` — a stable, semantic, API-free facade over the live browser pipeline.
  - **workflow-runtime (14)**: `td_workflow_save/get/list/update/delete/clone/diff/export/import/validate/run/runs/run_get/replay` — agent-authored workflows stored VERBATIM with version history, DUMB execution through the full MCP pipeline ({{template}} variables, bounded retries, per-step timeouts), execution policy gates (allowedTools/deniedTools, domain allowlists, maxSteps/maxRuntimeMs, human-in-the-loop approvals that BLOCK and never auto-approve), deterministic run records and verbatim replay.
  - **agent-owned-tooling (8)**: `td_target_memory_*` (learned targets with accumulating selector history — reused runs skip DOM re-analysis) and `td_agent_artifact_*` (custom tools, scripts, policies, memories, notes — stored verbatim, never interpreted).
- **Durable agent store (`.teledom_agent/`)**: atomic writes, traversal-safe names, bounded run history, `TELEDOM_AGENT_STORE_DIR` env override.
- **Root pipeline injection**: `td_*` tools can now route to ANY of the 350 tools (previously the intelligence layer was a closed switch).
- **Persistent agent memory**: `td_memory` items survive process restarts.
- **Python SDK (Level 2)** at `sdk/python/` — pure-stdlib semantic browser programming (`Browser`, `Workflow`, `TargetMemory`) + the golden-demo example `extension_smoke_test.py`.
- **Workflows UI tab** in the dashboard (saved workflows + recent runs + KPIs from the bridge) and the Observatory finally mounted.
- **Operational suite v2**: Phase-0 dist staleness auto-rebuild, real per-tool args for all 44 new tools, and the golden scenario `002-agent-owned-workflow-scenario` (explore → learn → reuse → replay → recovery) with measured KPIs.
- `scripts/sync-cli-tool-lists.js` — CLI allowlists generated from the registry (no drift).

### Fixed (every v4 defect — full table in docs/workflow/RELEASE_NOTES.md)
- **E-1** serverInfo version 12.0.0 (was stale while package was 4.0.0; tests codified the bug) → derived from the version registry.
- **E-2** CLI allowlist omitted all td_* tools → full 144-tool list.
- **E-3** `td_evidence_export` never wrote the artifact + ESM `require('zlib')` crash → artifact written; static import.
- **E-4** `td_run_playbook` executed nothing (vacuous PASS) → real chain execution.
- **E-5** `td_run_workflow` was td_-only and vacuously PASSed on empty input → root routing + honest INCONCLUSIVE.
- **E-6/E-17/E-18/E-19** stale v3 identities everywhere (extension manifests, bridge /health, simulated extension, banners).
- **E-7** hardcoded private Windows debug-log path + silent catch → env-driven + logged.
- **E-8** operational suite certified stale dist → freshness gate with auto-rebuild.
- **E-9** compatibility/.tdom versions reported 12.0.0 → registry-derived.
- **E-10/E-11** 200 dangling docs/test references → real targets.
- **E-12** remote-fallback toolMap named non-existent tools → mapped to real tools.
- **E-13** `prompts/list` without `prompts/get` (MCP violation) → implemented.
- **E-14** phantom catalog tool → removed.
- **E-15** Observatory dead code → mounted + wired.
- **E-16** sea-entry ESM require + "43 Tools" banner + Windows-only port freeing → static import, derived count, cross-platform.
- **E-20** error-swallowing empty catches (7 sites) → surfaced.
- **E-22/E-23** stale dist tree + junk nested icons → clean rebuild / removed.

### Changed
- Capability registry: 13 categories (10×10 v4 families + browser-primitives 22 + workflow-runtime 14 + agent-owned-tooling 8); data-driven `validateRegistry` guards.
- `td_run_workflow`/`td_run_playbook` semantics: real execution, honest statuses (no vacuous PASS anywhere).
- Tool discovery groups: new `browser-primitives`, `workflow-runtime`, `agent-owned-tooling` groups; phantom tool removed.

### Verification
- 319/319 unit tests (36 files) · strict typecheck PASS · 3 builds PASS.
- **350/350 operational CERTIFIED** over real stdio JSON-RPC.
- Golden workflow scenario KPIs: **80% MCP round-trip reduction, 50% DOM-scan reduction, replay PASS, 0 unsafe-action bypass, 0 workflow corruption**.
- Python SDK self-test 17/17; golden demo end-to-end PASS.

---

## [4.0.0] - 2026-09-11

### Major Release — TeleDOM v4 Temporal Browser Intelligence Engine

This release elevates TeleDOM into a production-grade **Temporal Browser Intelligence Engine** with **306 agent-facing MCP tools**, 18 specialized domain modules, a multi-tier indexed event store, causal & counterfactual simulation engines, zero-trust security model, and self-healing resilience.

### Added
- **306 Certified MCP Tools Interface**:
  - **100 `td_*` TeleDOM Intelligence Tools** across 10 families: Temporal Queries, Evidence & Provenance, Causal Reasoning, Semantic & Component Intelligence, Target Intelligence, Counterfactual Simulation, Reliability & Recovery, Zero-Trust Security, Performance & Memory, Autonomous Investigation.
  - **54 `dt_*` DevTools Compatibility Tools** (Click, Fill, Drag, Screenshots, Network, Console, Lighthouse, Heapsnapshot, WebMCP).
  - **31 `fx_*` Advanced Forensic Primitives** (DOM-Network Causality, 8-dimensional Regression Diffs, Layout Shifts, Interaction Replay, Root-Cause Analysis).
  - **121 Base & v3 Session & DOM Tools** (Live inspection, DOM mutations, undo/redo transactions, project reconstruction, tab management).
- **18 Specialized Domain Modules (`src/intelligence/`)**:
  - `kernel/`: EventMesh with Hybrid Logical Clock (0.01ms resolution), SHA-256 integrity hash chains, and lifecycle diagnostics.
  - `temporal/`: 3-tier indexed event store (`Hot`/`Warm`/`Cold`), temporal query engine (`StateAt`, `Diff`, `Trace`, `Join`), and timeline branching.
  - `causality/`: Causal Engine with direct/indirect/correlated/coincidental classification and hypothesis ranking.
  - `simulation/`: Counterfactual Engine with symptom fidelity scoring, descendant suppression, and outcome prediction.
  - `semantics/`: Semantic DOM modeling and Component Lifecycle tracing for React, Vue, Svelte, and Micro-Frontends.
  - `targeting/`: Target Intelligence with multi-signal candidate resolution, resilient fallback recovery, and contract gating.
  - `mutation/`: 10-phase ACID safe mutation transaction engine with precondition verification and guaranteed rollback.
  - `verification/`: Formal Verification & Proof Engine generating machine-verifiable cryptographic proof records.
  - `incident/`: Autonomous Investigator (`td_investigate` 13-step resumable workflow) and portable `.tdom` forensic bundles.
  - `security/`: Zero-Trust model, prompt injection quarantine, data exfiltration guards, and active test gates.
  - `resilience/`: Self-Healing Runtime with bounded recovery loops and Resource Guardian with 4-tier honest degradation.
  - `agent/`: Context Intelligence (L0–L4 density levels) with up to 95% LLM token reduction and episodic agent memory.
  - `registry/`: Single Source of Truth (SSOT) capability registry and automated documentation generators.
- **Measured Benchmarks & Resilience Evidence**:
  - Event scale benchmarks verified at 10K, 100K, and 1M events.
  - 1,032 Golden Scenario incidents benchmarked with 100% Investigation Completion Rate (ICR) and 0.00% False Success Rate.
  - 16/16 Chaos engineering failure injections contained and recovered.
  - 100% test pass rate across 35 test suites (300 passed unit & integration tests).
- **Comprehensive Multilingual Documentation**:
  - `docs/TOOLS_CATALOG_306_EN.md`: Exhaustive English manual for all 306 tools.
  - `docs/TOOLS_CATALOG_306_FA.md`: Complete Persian reference guide for all 306 tools.
  - Added `smithery.yaml` for 1-click installation in the MCP ecosystem.

---

## [3.1.0] - 2026-09-11

### Added
- **206 Certified MCP Tools Engine**: Complete Model Context Protocol (MCP) JSON-RPC 2.0 interface for AI coding agents.
- **Chrome DevTools Native Fusion**: 54 native `dt_` tools (heap snapshot parsing, network capture, console logs, performance profiling, dialog handling).
- **30 Advanced Forensic Capabilities**: 31 native `fx_` tools (DOM time-travel regression diffs, layout shift forensics, CSS influence calculation, z-index occlusion inspection, selector survivability).
- **Zero-Config On-Demand Auto-Bridge**: Automatic WebSocket bridge spawning on port `3847` with graceful fallbacks.
- **Visual Element Picker**: In-browser `Ctrl + Shift + Click` interaction forwarding live DOM metadata and computed styles to AI agents.
- **Pure TypeScript Zero-Dependency PNG Builder**: Standalone PNG image generator with Deflate and Adler32/CRC32 checksum algorithms.
- **Automated Cross-Platform CI**: GitHub Actions test pipeline for Ubuntu and Windows across Node.js 18, 20, and 22.
- **Open Source Licensing**: Official Apache-2.0 open-source license.
- **Comprehensive Community Standards**: Added `CONTRIBUTING.md`, `SECURITY.md`, PR templates, and issue templates.

### Removed
- Removed legacy unbundled documentation dumps and submodule references for a streamlined repository.

---

## [3.0.0] - 2026-09-08

### Added
- Multi-Tab & Multi-Extension orchestration.
- Live DOM snapshotting, diff trees, and lifecycle history.
- Element relationship graphing and reconstruction specifications.
- Dual-environment (Extension MV3 + Node.js Server) execution architecture.
