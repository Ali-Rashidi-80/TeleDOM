# Operational Test: `td_target_memory_get`

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
  "id": "op_req_344_td_target_memory_get",
  "method": "tools/call",
  "params": {
    "name": "td_target_memory_get",
    "arguments": {
      "site": "example.test",
      "semanticId": "primary_action_button"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_344_td_target_memory_get",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"target\":{\"site\":\"example.test\",\"semanticId\":\"primary_action_button\",\"identity\":{\"role\":\"button\",\"accessibleName\":\"Run Analysis\"},\"locators\":{\"aria\":\"Run Analysis\",\"css\":\"#primary-action-btn\"},\"history\":{\"successfulSelectors\":[\"#primary-action-btn\"],\"failedSelectors\":[],\"resolvedCount\":0},\"confidence\":{\"current\":0.95,\"historical\":0.95},\"notes\":\"operational fixture primary CTA\",\"id\":\"example_test__primary_action_button\",\"createdAt\":\"2026-09-11T17:23:57.421Z\",\"updatedAt\":\"2026-09-11T17:23:57.421Z\"},\"tool\":\"td_target_memory_get\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"agent-owned-tooling\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, target, tool, capability
