# Operational Test: `td_performance_budget`

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
  "id": "op_req_288_td_performance_budget",
  "method": "tools/call",
  "params": {
    "name": "td_performance_budget",
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
  "id": "op_req_288_td_performance_budget",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"budgets\":{},\"measured\":{\"longTasks\":0,\"layoutShifts\":0,\"domEvents\":0},\"violations\":{\"longTasks\":false,\"layoutShifts\":false,\"domEvents\":false},\"tool\":\"td_performance_budget\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"performance-memory-visual\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, budgets, measured, violations, tool, capability
