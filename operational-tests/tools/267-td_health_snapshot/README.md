# Operational Test: `td_health_snapshot`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_267_td_health_snapshot",
  "method": "tools/call",
  "params": {
    "name": "td_health_snapshot",
    "arguments": {
      "sessionId": "operational_acceptance_session_001"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_267_td_health_snapshot",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"health\":{\"overall\":\"HEALTHY\",\"checks\":[{\"id\":\"event-integrity\",\"status\":\"HEALTHY\",\"detail\":\"hash chain valid across 1 session(s)\",\"measuredAt\":1789102369167},{\"id\":\"storage-integrity\",\"status\":\"HEALTHY\",\"detail\":\"0 events indexed\",\"measuredAt\":1789102369167},{\"id\":\"resource-guardian\",\"status\":\"HEALTHY\",\"detail\":\"mode=HEALTHY policy=FULL_FIDELITY\",\"measuredAt\":1789102369167},{\"id\":\"runtime-state\",\"status\":\"HEALTHY\",\"detail\":\"runtime=CONNECTED\",\"measuredAt\":1789102369167},{\"id\":\"graph-budget\",\"status\":\"HEALTHY\",\"detail\":\"graph nodes=1 edges=0\",\"measuredAt\":1789102369167},{\"id\":\"security-policy\",\"status\":\"HEALTHY\",\"detail\":\"mode=passive destructive=disabled\",\"measuredAt\":1789102369167}],\"confidenceMultiplier\":1,\"warnings\":[]},\"platform\":{\"version\":\"12.0.0\",\"sessions\":1,\"entities\":0,\"evidence\":{\"nodes\":1,\"edges\":0},\"incidents\":0,\"proofs\":1,\"branches\":0,\"memoryItems\":0},\"guardian\":{\"mode\":\"HEALTHY\",\"capturePolicy\":\"FULL_FIDELITY\",\"actions\":[],\"degraded\":false},\"runtime\":\"CONNECTED\",\"tool\":\"td_health_snapshot\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"reliability-recovery\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, health, platform, guardian, runtime, tool, capability
