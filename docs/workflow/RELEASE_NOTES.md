# TeleDOM v4.1 — Release Report

**Version:** 4.1.0 · **Surface:** 350 MCP tools (121 base + 54 dt_ + 31 fx_ + 144 td_)
**Certification:** 350/350 tools CERTIFIED over real stdio JSON-RPC
**Unit tests:** 319/319 passed (36 files) · **Typecheck:** PASS (strict)
**Python SDK self-test:** 17/17 · **Golden demo:** PASS

## 1. Every v4 bug found and fixed

Deep analysis of the deployed v4.0.0 found 23 real defects. All fixed:

| # | Severity | Bug | Fix |
|---|---|---|---|
| E-1 | CRITICAL | `serverInfo.version '12.0.0'` while package was 4.0.0 (tests codified the bug) | derived from the authoritative version registry; test derives too |
| E-2 | CRITICAL | CLI install allowlist omitted **all 100 td_ tools** — every td_ call needed manual approval | full 144-tool list generated from the registry (`scripts/sync-cli-tool-lists.js`) |
| E-3 | CRITICAL | `td_evidence_export` never wrote the .tdom artifact (bytes discarded) + `require('zlib')` crashed pure-ESM builds | artifact actually written (default `.teledom_agent/artifacts/tdom/`), `gzipSync` imported statically |
| E-4 | CRITICAL | `td_run_playbook` listed tool names but executed nothing (vacuous PASS) | executes the chain through the root pipeline, returns per-step statuses |
| E-5 | CRITICAL | `td_run_workflow` could only call td_* tools; empty workflow vacuously PASSed | routes through the root MCP pipeline (any of the 350 tools); empty workflow → INCONCLUSIVE |
| E-6 | HIGH | Extension manifests stale v3 identity ("206 AI Tools", 3.1.0) | TeleDOM v4 (350 AI Tools), 4.1.0 |
| E-7 | HIGH | Hardcoded private Windows path for stdio debug log + silent catch (logging dead) | env-driven `TELEDOM_MCP_DEBUG_LOG`, failures reported to stderr |
| E-8 | HIGH | `npm test` certified whatever stale `dist/` contained | Phase-0 staleness check (src mtime vs dist mtime) auto-rebuilds before certifying |
| E-9 | HIGH | compatibility matrix + .tdom minReaderVersion reported '12.0.0' | both derive from `TELEDOM_VERSION` |
| E-10 | MEDIUM | 100 dangling doc paths (`docs/intelligence/capabilities/`) | point to the real generated CAPABILITIES.md anchors |
| E-11 | MEDIUM | 100 dangling test refs (nonexistent registry.test.ts) | point to registry-integration.test.ts |
| E-12 | HIGH | remote-fallback toolMap named two non-existent tools → every fallback call died "Unknown tool" | mapped to real tools (`get_browser_session`, `get_viewport_state`) |
| E-13 | HIGH | `prompts/list` advertised without `prompts/get` (MCP protocol violation, -32601) | full prompts/get implemented with argument rendering |
| E-14 | MEDIUM | phantom `detect_semantic_elements` in the tool catalog (uncallable) | removed; new workflow/browser groups added |
| E-15 | MEDIUM | Observatory UI was dead code (`mountObservatory` never called) | mounted + wired to `tdom-observatory-payload` events; new ⚡ Workflows tab |
| E-16 | HIGH | `sea-entry.ts` used ESM-illegal `require()`; banner "43 Tools"; Windows-only port freeing | static import; 350 derived; cross-platform `freePort()` |
| E-17 | MEDIUM | bridge `/health` reported "browser-forensic-bridge 3.0.0" | `teledom-bridge` + registry version |
| E-18 | MEDIUM | simulated extension identity stale v3 | `teledom@teledom` 4.1.0 |
| E-19 | LOW | stale version strings in .bat / runner / doc scripts | v4.1 |
| E-20 | MEDIUM | error-swallowing empty catches (7 sites) | logged (or explicitly justified) |
| E-21 | MEDIUM | td_* operational certification was largely vacuous for workflow tools | real args + real execution + golden scenario with measured KPIs |
| E-22 | MEDIUM | `dist/src/**` stale partial tsc tree | full clean rebuild; directory removed |
| E-23 | LOW | junk nested `chrome-extension/icons/icons/` | removed |

Bonus defects caught by the new Phase-0 fresh-build gate **during this
release**: the E-20 sweep initially injected TypeScript syntax into a
page-side JS probe (`fx_font_forensics` failed 350/344) — real stdio
execution caught it and it was fixed before shipping.

## 2. v4.1 feature: Agent-Owned Workflow Runtime

44 new tools in 3 families (see [AGENT_WORKFLOWS.md](./AGENT_WORKFLOWS.md)):

- **browser-primitives (22)** — stable agent-facing browser verbs + escape
  hatches, routed through the full MCP pipeline (browser-first, API-optional)
- **workflow-runtime (14)** — CRUD + versioning + diff + export/import +
  **dumb execution** with policy gates + deterministic execution records +
  verbatim replay
- **agent-owned-tooling (8)** — target memory (learned targets: no DOM
  re-analysis on reused runs) + verbatim artifact store (custom tools,
  scripts, policies, memories)

Plus: `td_memory` is now persistent (survives restarts), and the Python SDK
(Level 2) ships at `sdk/python/`.

## 3. Measured KPIs (release criteria)

From `operational-tests/scenarios/002-agent-owned-workflow-scenario/`:

| KPI | Plan target | Measured |
|---|---|---|
| First run | — | 5 tool calls · 2 DOM scans · 5 MCP round trips |
| Reused run | — | **1 MCP call** · 1 DOM scan · 866 ms |
| MCP round-trip reduction | > 80% | **80%** |
| DOM-scan reduction | rescans < 10% | **50%** (2 → 1) |
| tokensSavedEstimate | > 70% token reduction | **1520 tokens** estimated per reused run |
| Workflow replay success | > 98% | **PASS** (verbatim, lineage tracked) |
| Target recovery from memory | > 95% | **resolvable = true, confidence 1.0** |
| Unsafe action bypass | = 0 | **0** (approval gates BLOCK, never auto-approve) |
| Workflow corruption | = 0 | **0** (atomic writes, envelope validation, traversal-safe names) |
| Tool certification | 100% | **350/350 CERTIFIED** |
| False success | < 1% | **0** (INCONCLUSIVE taxonomy preserved; vacuous PASSes removed) |

## 4. What is intentionally NOT in v4.1

Per the corrected architecture (the plan's final decision):

- ❌ Workflow-builder intelligence inside TeleDOM (the agent designs)
- ❌ In-TeleDOM workflow optimizer / learning engine
- ❌ SocialAutomationAdapter / platform-specific adapters
- ❌ API-dependent automation paths
- ✅ API remains an *optional accelerator*, never a dependency

Trigger engine, workflow marketplace and cross-run reuse detection are
explicitly deferred — they require agent-owned abstractions first, not more
server-side magic.
