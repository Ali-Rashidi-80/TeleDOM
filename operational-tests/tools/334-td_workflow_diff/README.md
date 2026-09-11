# Operational Test: `td_workflow_diff`

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
  "id": "op_req_334_td_workflow_diff",
  "method": "tools/call",
  "params": {
    "name": "td_workflow_diff",
    "arguments": {
      "name": "extension_smoke_test",
      "aVersion": "1.0.0",
      "bVersion": "1.1.0"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_334_td_workflow_diff",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"a\":\"extension_smoke_test@1.0.0\",\"b\":\"extension_smoke_test@1.1.0\",\"changed\":false,\"summary\":{\"addedSteps\":[],\"removedSteps\":[],\"changedSteps\":[],\"policyChanged\":false,\"descriptionChanged\":true},\"patches\":[],\"tool\":\"td_workflow_diff\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"workflow-runtime\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, a, b, changed, summary, patches, tool, capability
