# Operational Test: `fx_layout_shift_forensics`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 7ms

## Test Objective
Builds a layout-shift evidence chain

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_179_fx_layout_shift_forensics",
  "method": "tools/call",
  "params": {
    "name": "fx_layout_shift_forensics",
    "arguments": {
      "sessionId": "operational_acceptance_session_001",
      "timestamp": 200
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_179_fx_layout_shift_forensics",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"shiftEvent\": {\n    \"type\": \"DOM_MUTATION_ADD\",\n    \"eventId\": \"evt_op_001\",\n    \"timestamp\": 50\n  },\n  \"affectedElement\": {\n    \"selector\": \"#injected-action-btn\",\n    \"nodeId\": 10,\n    \"tagName\": \"element\"\n  },\n  \"previousPosition\": null,\n  \"newPosition\": null,\n  \"triggerMutations\": [\n    {\n      \"summary\": \"- <?> node=4 subtree=2\",\n      \"eventId\": \"evt_op_007\",\n      \"timestamp\": 380,\n      \"deltaMs\": 330\n    },\n    {\n      \"summary\": \"SCREENSHOT_CHECKPOINT {\\\"screenshotId\\\":\\\"scr_op_chk_1\\\",\\\"dataUrl\\\":\\\"data:image/png;base64,iVBORw0KGgoAAAAN\",\n      \"eventId\": \"evt_op_008\",\n      \"timestamp\": 450,\n      \"deltaMs\": 400\n    }\n  ],\n  \"networkActivity\": [\n    {\n      \"summary\": \"→ POST https://api.internal/v1/analyze\",\n      \"eventId\": \"evt_op_004\",\n      \"timestamp\": 200\n    },\n    {\n      \"summary\": \"← 200 https://api.internal/v1/analyze (0B)\",\n      \"eventId\": \"evt_op_005\",\n      \"timestamp\": 280\n    }\n  ],\n  \"styleChanges\": [],\n  \"confidence\": 0.98,\n  \"band\": \"VERY_HIGH\",\n  \"evidenceCount\": 6\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Builds a layout-shift evidence chain**: sessionId, shiftEvent, affectedElement, previousPosition, newPosition, triggerMutations, networkActivity, styleChanges, confidence, band, evidenceCount
