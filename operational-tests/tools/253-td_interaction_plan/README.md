# Operational Test: `td_interaction_plan`

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
  "id": "op_req_253_td_interaction_plan",
  "method": "tools/call",
  "params": {
    "name": "td_interaction_plan",
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
  "id": "op_req_253_td_interaction_plan",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"plan\":{\"planId\":\"iplan:a2afbe4d59\",\"steps\":[{\"action\":\"resolve-target\",\"query\":{}},{\"action\":\"verify-target\",\"postcondition\":\"resolved target matches intent with confidence ≥ 0.55\"},{\"action\":\"execute-interaction\",\"postconditions\":[\"target state changed as intended\",\"no unexpected runtime errors\"]}],\"verification\":{\"mustHold\":[\"interaction effect observed\"],\"mustNotHold\":[\"runtime exception\",\"unexpected navigation\"]}},\"note\":\"execute via td_interaction_execute (requires live adapter)\",\"tool\":\"td_interaction_plan\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"targeting-interaction\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, plan, note, tool, capability
