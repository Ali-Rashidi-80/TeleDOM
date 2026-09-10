# Unified Architecture — MCPDOM v3.1 Fusion (§9–§13, §30)

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          MCP CLIENT (AI AGENT)                          │
│              JSON-RPC 2.0 over stdio (Model Context Protocol)           │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
┌────────────────────────────────▼────────────────────────────────────────┐
│                      ForensicMCPServer (src/mcp/server.ts)              │
│  tools/list → FORENSIC_MCP_TOOLS (206)  │  tools/call → MCPToolsHandler │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │  prefix routing (dt_ / fx_ first, then
                                 │  legacy live / v3 extended / storage)
        ┌────────────────────────┼───────────────────────────┐
        ▼                        ▼                           ▼
┌───────────────────┐  ┌─────────────────────┐  ┌────────────────────────┐
│ DevToolsTools     │  │ ForensicsTools      │  │ Legacy handlers        │
│ Handler (dt_, 54) │  │ Handler (fx_, 31)   │  │ live(27) + v3(74) +    │
└─────────┬─────────┘  └──────────┬──────────┘  │ storage(20) [PRESERVED]│
          │                       │             └────────────────────────┘
          └───────────┬───────────┘
                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│              UNIFIED BROWSER RUNTIME (src/devtools/runtime)             │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ PageIdentityRegistry │  │ UnifiedEventBus  │  │  UnifiedBrowser   │  │
│  │ pageId↔tab↔CDP↔frame │  │ 11 domains,      │  │  Runtime (bridge  │  │
│  │ navigations survive  │  │ correlation ids, │  │  + local fallback)│  │
│  └──────────────────────┘  │ ring buffer      │  └───────────────────┘  │
│                            └──────────────────┘                         │
│  ┌──────────────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ CdpGateway           │  │ TraceSessionStore│  │ HeapSnapshotStore │  │
│  │ chrome.debugger via  │  │ + trace analyzer │  │ + V8 parser       │  │
│  │ bridge (attach/cmd/  │  │ (LCP/INP/CLS)    │  │ (.heapsnapshot)   │  │
│  │ detach, serialized)  │  └──────────────────┘  └───────────────────┘  │
│  └──────────────────────┘                                                │
└───────────────┬──────────────────────────────────┬───────────────────────┘
                │ ws://127.0.0.1:3847 (bridge)    │ JSDOM fixture (§16)
                ▼                                  ▼
┌───────────────────────────────┐   ┌─────────────────────────────────────┐
│  CHROME EXTENSION (MV3)       │   │  SIMULATION (deterministic)         │
│  service-worker: tabs,        │   │  __FORENSIC_SIMULATION__ marker;    │
│   management, CDP gateway,    │   │  simulated: true on every result;   │
│   screenshots, CDP events     │   │  LIVE / SIMULATED / UNAVAILABLE     │
│  content-script: DOM capture  │   │  modes never fake real measurements │
│  page-script: console+net     │   └─────────────────────────────────────┘
│   interception, listener      │
│   registry (CAP 13)           │
└───────────────────────────────┘
```

## Directory map (new modules)

```text
src/
  devtools/                      # §8 Chrome DevTools capability layer
    types.ts                     #   shared models (ExecutionMode, traces, heap…)
    error-contract.ts            #   §41 structured errors + recovery hints
    page-identity.ts             #   §10 canonical identity (survives navigation)
    unified-event-bus.ts         #   §11 correlated, timestamped, bounded
    tool-registry.ts             #   §13 single source of truth + §39 hints
    definitions.ts               #   54 dt_ tool schemas
    handler.ts                   #   dispatcher + §40 observability
    runtime/
      unified-browser-runtime.ts #   §9 facade: bridge → local fallback
      cdp-gateway.ts             #   chrome.debugger transport, serialized
      trace-store.ts             #   trace lifecycle + web vitals extraction
      heap-snapshot-parser.ts    #   self-contained V8 snapshot analysis
      heap-snapshot-store.ts     #   §24 bounded snapshot lifecycle
    capabilities/
      interaction-core.ts        #   uid store, probes, runInPage
      input.ts navigation.ts network-console-debugging.ts
      performance-memory.ts extensions-webmcp.ts
  forensics/                     # §17 the 30 native capabilities
    definitions.ts handler.ts    #   31 fx_ schemas + dispatcher
    evidence-model.ts            #   CAP 29 scoring (noisy-OR + diversity)
    temporal-correlation.ts      #   §12 shared timeline + causal priors
    session-access.ts            #   storage + StateReconstructor bridge
    correlators/causality.ts     #   CAP 01/04/14/15/16
    analyzers/
      regression-diff.ts         #   CAP 02
      visual-regression.ts       #   CAP 03 (real PNG decoder)
      structure.ts               #   CAP 07/08/09/10
      live-dom.ts                #   CAP 11/12/13/17 (page probes)
      a11y-divergence.ts         #   CAP 18
    engine/
      health-planner-search.ts   #   CAP 19/20/22
      snapshot-impact-journal.ts #   CAP 21/25/26/27
      graph-report-portability.ts#   CAP 23/24/28/30
    session/interaction-replay.ts#   CAP 05/06
```

## Key behaviors

- **Conservative integration**: the 121 original tools, their names, parameters,
  return conventions, the bridge protocol (port 3847), the extension pipeline,
  time-travel and mutation/rollback engines are untouched; the new layers are
  additive and routed by tool-name prefix.
- **One browser runtime**: dt_ and fx_ tools share the same bridge client and
  local-controller fallback as the legacy handlers; page identity, event bus,
  network/console logs and the CDP gateway are process-wide singletons.
- **Error contract**: every dt_/fx_ failure returns a structured envelope
  (`INVALID_INPUT`, `BROWSER_UNAVAILABLE`, `PAGE_NOT_FOUND`, `TARGET_STALE`,
  `CAPABILITY_UNAVAILABLE`, `TIMEOUT`, `NAVIGATION_CONFLICT`,
  `MUTATION_CONFLICT`, `RESOURCE_EXHAUSTED`, `UNSUPPORTED_OPERATION`,
  `INTERNAL_ERROR`) with a recovery hint.
- **Resource lifecycle (§24)**: CDP sessions detach on stop; trace sessions and
  heap snapshots are closed/released via tools; the event bus uses a bounded
  ring buffer; journals cap at 500 entries.
- **Security (§25)**: no new filesystem surface beyond the existing storage;
  CDP access is explicit (permission-gated in the extension manifest); secrets
  redaction and the privacy engine continue to apply to all captured data.

## Configuration flags

| Flag | Default | Effect |
|---|---|---|
| `FORENSIC_AUTO_BRIDGE` | true | Start/connect the in-process bridge (unchanged) |
| `FORENSIC_BRIDGE_PORT` | 3847 | Bridge port (unchanged §28) |
| `FORENSIC_STORAGE_DIR` | ./.forensic_sessions | Session storage (unchanged) |
| `FORENSIC_DISABLE_DEVTOOLS` | (not set) | Set to `true` to hide all dt_ tools from tools/list |
| `FORENSIC_DISABLE_FORENSICS` | (not set) | Set to `true` to hide all fx_ tools from tools/list |

Feature flags are honored in `tools/list` — experimental capabilities
(`dt_screencast_*`, `dt_lighthouse_audit`, `dt_execute_3p_developer_tool`)
remain marked experimental in their descriptions (§37).
