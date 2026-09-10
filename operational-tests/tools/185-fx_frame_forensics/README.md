# Operational Test: `fx_frame_forensics`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Analyzes frame hierarchy and event attribution

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_185_fx_frame_forensics",
  "method": "tools/call",
  "params": {
    "name": "fx_frame_forensics",
    "arguments": {
      "sessionId": "operational_acceptance_session_001"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_185_fx_frame_forensics",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"frames\": [],\n  \"totalFrames\": 0,\n  \"crossOriginCount\": 0,\n  \"networkUnattributed\": 2,\n  \"notes\": [\n    \"No frames detected in this state.\",\n    \"2 network events could not be attributed to a specific frame (main frame or cross-origin restrictions).\"\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Analyzes frame hierarchy and event attribution**: sessionId, frames, totalFrames, crossOriginCount, networkUnattributed, notes
