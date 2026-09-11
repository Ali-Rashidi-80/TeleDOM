# Operational Test: `td_workflow_clone`

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
  "id": "op_req_333_td_workflow_clone",
  "method": "tools/call",
  "params": {
    "name": "td_workflow_clone",
    "arguments": {
      "name": "extension_smoke_test",
      "as": "extension_smoke_test_copy",
      "newVersion": "1.0.0"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_333_td_workflow_clone",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"cloned\":{\"from\":\"extension_smoke_test@1.1.0\",\"to\":\"extension_smoke_test_copy@1.0.0\"},\"tool\":\"td_workflow_clone\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"workflow-runtime\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, cloned, tool, capability
