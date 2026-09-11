# v4.1 Agent-Owned Workflow Scenario — Explore → Learn → Reuse

**Status**: **PASS**

The golden demo: first run explores (5 tool calls, 2 DOM scans), the agent then saves its knowledge (learned target, custom tool, workflow), and the reused run executes the whole smoke test as ONE td_workflow_run call with deterministic execution records and verbatim replay.

## KPIs

```json
{
  "firstRun": {
    "toolCalls": 5,
    "domScans": 2,
    "mcpRoundTrips": 5
  },
  "reusedRun": {
    "toolCalls": 5,
    "domScans": 1,
    "mcpRoundTrips": 1,
    "durationMs": 338
  },
  "toolCallReductionPct": 0,
  "domScanReductionPct": 50,
  "mcpRoundTripReductionPct": 80,
  "tokensSavedEstimate": 1520,
  "replaySuccess": true,
  "unsafeActionBypass": 0,
  "workflowCorruption": 0
}
```
