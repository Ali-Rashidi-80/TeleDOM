# Operational Test: `dt_drag`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 3ms

## Test Objective
Drags the element to coordinates

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_124_dt_drag",
  "method": "tools/call",
  "params": {
    "name": "dt_drag",
    "arguments": {
      "fromSelector": "#removable-card",
      "toX": 200,
      "toY": 200
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_124_dt_drag",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"dragged\": true,\n  \"from\": \"#removable-card\",\n  \"to\": {\n    \"x\": 200,\n    \"y\": 200\n  },\n  \"pageId\": \"page_1\",\n  \"detail\": {\n    \"success\": true,\n    \"sourceSelector\": \"#removable-card\",\n    \"targetSelector\": \"(offset drop)\",\n    \"eventsFired\": [\n      \"pointerdown\",\n      \"mousedown\",\n      \"dragstart\",\n      \"dragend\",\n      \"pointerup\",\n      \"mouseup\"\n    ],\n    \"finalPosition\": {\n      \"x\": 200,\n      \"y\": 200\n    },\n    \"html5DndUsed\": true\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Drags the element to coordinates**: dragged, from, to, pageId, detail
