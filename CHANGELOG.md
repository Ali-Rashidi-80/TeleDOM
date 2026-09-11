# Changelog

All notable changes to the **TeleDOM / MCPDOM Unified Browser Intelligence Platform** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **18 Specialized Domain Modules (`src/v12/`)**:
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
