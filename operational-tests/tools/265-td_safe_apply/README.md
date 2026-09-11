# Operational Test: `td_safe_apply`

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
  "id": "op_req_265_td_safe_apply",
  "method": "tools/call",
  "params": {
    "name": "td_safe_apply",
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
  "id": "op_req_265_td_safe_apply",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"UNSUPPORTED\",\"reason\":\"td_safe_apply requires a live mutation adapter; in this process only simulation branches are available (use td_simulate_change + td_branch_merge)\",\"tool\":\"td_safe_apply\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"counterfactual-simulation\",\"securityClass\":\"side-effects\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, reason, tool, capability
