# Operational Test: `td_workflow_runs`

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
  "id": "op_req_339_td_workflow_runs",
  "method": "tools/call",
  "params": {
    "name": "td_workflow_runs",
    "arguments": {
      "name": "extension_smoke_test",
      "limit": 10
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_339_td_workflow_runs",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"count\":1,\"runs\":[{\"id\":\"run_1789147437086_6be05530\",\"workflowName\":\"extension_smoke_test\",\"workflowVersion\":\"1.1.0\",\"status\":\"SUCCESS\",\"startedAt\":1789147437086,\"durationMs\":328,\"steps\":5}],\"tool\":\"td_workflow_runs\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"workflow-runtime\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, count, runs, tool, capability
