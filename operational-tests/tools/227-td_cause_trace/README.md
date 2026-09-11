# Operational Test: `td_cause_trace`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 0ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_227_td_cause_trace",
  "method": "tools/call",
  "params": {
    "name": "td_cause_trace",
    "arguments": {
      "sessionId": "operational_acceptance_session_001",
      "symptom": "node-removed"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_227_td_cause_trace",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"INCONCLUSIVE\",\"note\":\"no symptom event found in session\",\"tool\":\"td_cause_trace\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"causal-intelligence\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, note, tool, capability
