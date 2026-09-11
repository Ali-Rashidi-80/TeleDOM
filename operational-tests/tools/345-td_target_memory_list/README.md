# Operational Test: `td_target_memory_list`

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
  "id": "op_req_345_td_target_memory_list",
  "method": "tools/call",
  "params": {
    "name": "td_target_memory_list",
    "arguments": {
      "site": "example.test"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_345_td_target_memory_list",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"count\":1,\"targets\":[{\"id\":\"example_test__primary_action_button\",\"site\":\"example.test\",\"semanticId\":\"primary_action_button\",\"confidence\":0.95,\"css\":\"#primary-action-btn\",\"updatedAt\":\"2026-09-11T17:23:57.421Z\"}],\"tool\":\"td_target_memory_list\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"agent-owned-tooling\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, count, targets, tool, capability
