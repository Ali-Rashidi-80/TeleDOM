# Operational Test: `scroll_to_element`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Scrolls element into view

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_065_scroll_to_element",
  "method": "tools/call",
  "params": {
    "name": "scroll_to_element",
    "arguments": {
      "selector": "#scroll-target"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_065_scroll_to_element",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"scrollBefore\": {\n    \"x\": 0,\n    \"y\": 0\n  },\n  \"scrollAfter\": {\n    \"x\": 0,\n    \"y\": 0\n  },\n  \"requested\": {\n    \"x\": 0,\n    \"y\": 0\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Scrolls element into view**: success, scrollBefore, scrollAfter, requested
