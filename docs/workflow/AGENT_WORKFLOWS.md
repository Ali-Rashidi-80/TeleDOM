# TeleDOM v4.1 — Agent-Owned Workflow Runtime

> **TeleDOM تصمیم‌گیرنده نیست؛ TeleDOM توان‌دهنده است.**
> **Agent مغز است. TeleDOM دست، چشم، حافظه و جعبه‌ابزار مرورگر است.**
>
> TeleDOM is not the decision-maker; TeleDOM is the enabler.
> The Agent is the brain. TeleDOM is the hands, eyes, memory and toolbox.

**Tagline:** Teach once. Reuse forever. Adapt when the web changes. Prove what happened.

**Definition:** TeleDOM gives Agents everything required to discover,
construct, persist, replay, execute and verify **their own** browser
workflows.

## The architectural red line

```
┌─────────────────────────────────────────────┐
│                   AGENT                     │
│  discover · understand · reason · decide    │
│  write / edit / version / debug / repair    │
│  generate Python bots · build custom tools  │
└───────────────────┬─────────────────────────┘
                    │ MCP (Level 1) / SDK (Level 2)
┌───────────────────▼─────────────────────────┐
│                  TeleDOM                    │
│  browser observation · DOM/semantic/visual  │
│  target resolution · click/type/navigate    │
│  state/temporal memory · evidence/replay    │
│  workflow persistence + DUMB execution      │
└─────────────────────────────────────────────┘
```

**Deleted from v4.1 (by design):** workflow-builder intelligence inside
TeleDOM, in-TeleDOM optimizers/learning engines, SocialAutomationAdapter,
platform-specific adapters, API-dependent automation.

**Added in v4.1:** agent-owned workflow artifacts, universal browser
primitives, workflow persistence/replay/execution, target memory, low-level
escape hatches, deterministic execution records, verification/evidence,
Python SDK, MCP.

## What the agent owns

```
Agent
 ├── Workflows        (td_workflow_*)
 ├── Custom Tools     (td_agent_artifact_*  kind: custom-tool)
 ├── Scripts          (td_agent_artifact_*  kind: script)
 ├── Policies         (td_agent_artifact_*  kind: policy)
 ├── Learned Targets  (td_target_memory_*)
 └── Memories         (td_memory — now persistent)
TeleDOM: Browser Runtime
```

## The golden demo (measured, not claimed)

First execution — the agent explores an unknown site:

```
RUN #1 — exploration
  5 tool calls · 2 DOM analyses · 5 MCP round trips
  → agent writes workflow + saves learned targets
```

Every later execution — the whole task as **one** call:

```
RUN #2 — reused
  1 td_workflow_run call · 1 DOM scan · 1 MCP round trip
  steps: verify_cta ✓ click_cta ✓ extract ✓ assert ✓
  deterministic execution record: run_<ts>_<id>.json
```

Measured KPIs (operational-tests/scenarios/002-agent-owned-workflow-scenario/):

| KPI | Target | Measured |
|---|---|---|
| MCP round-trip reduction | > 80% | **80%** |
| DOM-scan reduction on reuse | < 10% rescans | **50% fewer scans (1 vs 2)** |
| Workflow replay success | > 98% | **PASS (verbatim replay)** |
| Target recovery (verify from memory) | > 95% | **resolvable=true, confidence=1.0** |
| Unsafe action bypass | = 0 | **0 — approval gates BLOCK, never auto-approve** |
| Workflow corruption | = 0 | **0 — atomic writes, envelope validation** |
| Tool-call certification | 100% | **350/350 CERTIFIED over real stdio JSON-RPC** |

## Tool families added (44 new tools, 350 total)

| Family | Count | Tools |
|---|---|---|
| browser-primitives | 22 | `td_browser_navigate/back/forward/refresh`, `td_dom_inspect/query/extract/snapshot`, `td_target_find/check/describe`, `td_action_click/type/select/hover/press/scroll`, `td_wait`, `td_screenshot`, `td_execute_script`, `td_network_inspect`, `td_console_read` |
| workflow-runtime | 14 | `td_workflow_save/get/list/update/delete/clone/diff/export/import/validate/run/runs/run_get/replay` |
| agent-owned-tooling | 8 | `td_target_memory_save/get/list/delete`, `td_agent_artifact_save/get/list/delete` |

The 100 v4 intelligence tools (temporal/evidence/causal/counterfactual/
investigation/proof) remain unchanged — the v4 capital the agent composes
inside its workflows (`td_verify`, `td_evidence_proof`, `td_cause_trace` …).

## Workflow schema (agent-authored, envelope-validated)

```json
{
  "schema": "teledom.agent-workflow/1.0",
  "name": "extension_smoke_test",
  "version": "1.0.0",
  "inputs": { "cta_selector": { "default": "#primary-action-btn" } },
  "steps": [
    { "id": "verify_cta", "tool": "td_target_check",
      "args": { "selector": "{{inputs.cta_selector}}" },
      "retry": { "count": 2, "delayMs": 250 } },
    { "id": "publish", "tool": "td_action_type",
      "args": { "selector": "#reply", "text": "{{steps.verify_cta...}}" },
      "requireApproval": true }
  ],
  "policy": {
    "allowedTools": ["td_*"], "deniedDomains": ["evil.test"],
    "requireApprovalFor": ["td_action_type"],
    "maxSteps": 200, "maxRuntimeMs": 300000
  }
}
```

- Templates: `{{inputs.x}}`, `{{steps.<id>.<path>}}` — resolved AS-EXECUTED
  (recorded verbatim in the run record, so replay is deterministic).
- Approval gates: the run **BLOCKS** and reports `pendingApprovals`; the
  agent obtains user consent out-of-band and re-runs with `approvedSteps`.
  TeleDOM **never** auto-approves.
- Execution record: every run persists `run_<id>.json` with per-step status,
  args-as-executed, timing, retries, metrics (toolCalls / domScans /
  tokensSavedEstimate) and `replayOf` lineage.

## Persistence layout

```
.teledom_agent/                     (env TELEDOM_AGENT_STORE_DIR)
  workflows/<name>.json             { current, versions[] }
  runs/<runId>.json                 deterministic execution records
  targets/<site>__<semanticId>.json learned targets (history accumulates)
  artifacts/<kind>/<name>.json      custom tools · scripts · policies · memories
  memory.json                       agent memory snapshot (td_memory persists)
```

Atomic writes (tmp + rename), bounded run history, traversal-safe names,
structural envelope validation — TeleDOM never interprets the content.

## Browser-first, API-optional

```
L0 Intent → L1 Semantic Workflow → L2 Target Resolution
   → L3 Browser Actions → L4 Browser Runtime → L5 Optional Accelerators
```

Sites with **no API** are not a problem — they are the normal case.
Shadow DOM / canvas / virtualized lists / iframes: the agent picks its own
method via the escape hatches (`td_execute_script`, `td_network_inspect`,
`td_console_read`, coordinates via `interact_with_element`).

## Two connection levels, one runtime

```
AI Agent → MCP (350 tools)      → TeleDOM ─┐
                                            ├─→ Browser Runtime
Python Bot → SDK (this repo)     → TeleDOM ─┘
```

Python SDK: `sdk/python/` — pure stdlib, semantic browser programming.
See [PYTHON_SDK.md](./PYTHON_SDK.md).

## UI

The dashboard gains a **⚡ Workflows** tab (saved workflows + recent runs +
KPIs from the bridge), and the Observatory is finally mounted (v4 shipped it
as dead code).
