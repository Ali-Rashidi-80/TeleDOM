# Operational Test: `td_target_memory_save`

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
  "id": "op_req_343_td_target_memory_save",
  "method": "tools/call",
  "params": {
    "name": "td_target_memory_save",
    "arguments": {
      "site": "example.test",
      "semanticId": "primary_action_button",
      "identity": {
        "role": "button",
        "accessibleName": "Run Analysis"
      },
      "locators": {
        "css": "#primary-action-btn",
        "aria": "Run Analysis"
      },
      "confidence": 0.95,
      "notes": "operational fixture primary CTA"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_343_td_target_memory_save",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"saved\":{\"id\":\"example_test__primary_action_button\",\"site\":\"example.test\",\"semanticId\":\"primary_action_button\",\"confidence\":0.95},\"note\":\"target memory stored — resolve against it before re-analyzing the DOM\",\"tool\":\"td_target_memory_save\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"agent-owned-tooling\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, saved, note, tool, capability
