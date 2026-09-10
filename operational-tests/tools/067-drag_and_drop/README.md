# Operational Test: `drag_and_drop`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Drags element with HTML5 + pointer events

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_067_drag_and_drop",
  "method": "tools/call",
  "params": {
    "name": "drag_and_drop",
    "arguments": {
      "source": {
        "selector": "#removable-card"
      },
      "offsets": {
        "x": 40,
        "y": 10
      }
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_067_drag_and_drop",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"sourceSelector\": \"#removable-card\",\n  \"targetSelector\": \"(offset drop)\",\n  \"eventsFired\": [\n    \"pointerdown\",\n    \"mousedown\",\n    \"dragstart\",\n    \"dragend\",\n    \"pointerup\",\n    \"mouseup\"\n  ],\n  \"finalPosition\": {\n    \"x\": 40,\n    \"y\": 10\n  },\n  \"html5DndUsed\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Drags element with HTML5 + pointer events**: success, sourceSelector, targetSelector, eventsFired, finalPosition, html5DndUsed
