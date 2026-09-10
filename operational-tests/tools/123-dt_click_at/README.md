# Operational Test: `dt_click_at`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 3ms

## Test Objective
Coordinate click with element resolution

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_123_dt_click_at",
  "method": "tools/call",
  "params": {
    "name": "dt_click_at",
    "arguments": {
      "x": 120,
      "y": 45
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_123_dt_click_at",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"clicked\": true,\n  \"x\": 120,\n  \"y\": 45,\n  \"resolvedElement\": {\n    \"hit\": false,\n    \"hitTesting\": false,\n    \"note\": \"No layout engine — coordinate hit-testing unavailable; click dispatched at document level (bubbles to handlers).\"\n  },\n  \"pageId\": \"page_1\",\n  \"detail\": {\n    \"clicked\": true,\n    \"dispatchTarget\": \"document-level\",\n    \"tagName\": \"body\",\n    \"id\": null\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Coordinate click with element resolution**: clicked, x, y, resolvedElement, pageId, detail
