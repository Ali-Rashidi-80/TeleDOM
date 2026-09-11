# Operational Test: `td_simulate_failure`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_262_td_simulate_failure",
  "method": "tools/call",
  "params": {
    "name": "td_simulate_failure",
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
  "id": "op_req_262_td_simulate_failure",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"UNSUPPORTED\",\"reason\":\"policy mode is passive — active testing requires explicit authorization (set mode=authorized-active)\",\"policy\":{\"mode\":\"passive\",\"allowedOrigins\":[],\"blockedOrigins\":[],\"rateLimitPerMinute\":30,\"concurrencyLimit\":2,\"requestBudget\":200,\"testCategories\":[\"passive-observation\"],\"destructiveActionsDisabled\":true,\"killSwitch\":false},\"tool\":\"td_simulate_failure\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"counterfactual-simulation\",\"securityClass\":\"policy-gated\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, reason, policy, tool, capability
