# Operational Test: `td_workflow_replay`

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
  "id": "op_req_341_td_workflow_replay",
  "method": "tools/call",
  "params": {
    "name": "td_workflow_replay",
    "arguments": {
      "runId": "run_none"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_341_td_workflow_replay",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"INCONCLUSIVE\",\"error\":\"run \\\"run_none\\\" not found\",\"tool\":\"td_workflow_replay\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"workflow-runtime\",\"securityClass\":\"policy-gated\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, error, tool, capability
