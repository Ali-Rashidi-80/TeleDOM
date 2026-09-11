# Operational Test: `td_workflow_list`

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
  "id": "op_req_331_td_workflow_list",
  "method": "tools/call",
  "params": {
    "name": "td_workflow_list",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_331_td_workflow_list",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"count\":1,\"workflows\":[{\"name\":\"extension_smoke_test\",\"version\":\"1.0.0\",\"description\":\"Reusable extension smoke test: observe page, verify CTA target, click, extract counter, assert state\",\"tags\":[\"operational\",\"smoke-test\",\"v4.1\"],\"steps\":5,\"versions\":1,\"updatedAt\":\"2026-09-11T17:23:57.076Z\"}],\"tool\":\"td_workflow_list\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"workflow-runtime\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, count, workflows, tool, capability
