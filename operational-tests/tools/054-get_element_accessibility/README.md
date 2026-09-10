# Operational Test: `get_element_accessibility`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 4ms

## Test Objective
Extracts role, accessible name, states and a11y issues

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_054_get_element_accessibility",
  "method": "tools/call",
  "params": {
    "name": "get_element_accessibility",
    "arguments": {
      "selector": "#primary-action-btn"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_054_get_element_accessibility",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"selector\": \"#primary-action-btn\",\n  \"implicitRole\": \"button\",\n  \"name\": \"⚡ Run Analysis\",\n  \"nameSources\": [\n    \"text content\"\n  ],\n  \"value\": \"\",\n  \"states\": [],\n  \"focusable\": true,\n  \"tabIndex\": 0,\n  \"ariaAttributes\": {},\n  \"issues\": []\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Extracts role, accessible name, states and a11y issues**: selector, implicitRole, name, nameSources, value, states, focusable, tabIndex, ariaAttributes, issues
