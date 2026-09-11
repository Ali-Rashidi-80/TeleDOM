# Operational Test: `td_interaction_repair`

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
  "id": "op_req_256_td_interaction_repair",
  "method": "tools/call",
  "params": {
    "name": "td_interaction_repair",
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
  "id": "op_req_256_td_interaction_repair",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"DEGRADED\",\"reason\":\"interaction execution is DEGRADED: running against a simulation document, not a live browser bridge\",\"suggestion\":\"connect the forensic bridge (FORENSIC_AUTO_BRIDGE=true) and re-run\",\"tool\":\"td_interaction_repair\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"targeting-interaction\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, reason, suggestion, tool, capability
