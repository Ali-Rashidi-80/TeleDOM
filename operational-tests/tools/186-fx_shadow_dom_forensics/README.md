# Operational Test: `fx_shadow_dom_forensics`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 17ms

## Test Objective
Analyzes shadow DOM hosts and boundaries

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_186_fx_shadow_dom_forensics",
  "method": "tools/call",
  "params": {
    "name": "fx_shadow_dom_forensics",
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
  "id": "op_req_186_fx_shadow_dom_forensics",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"roots\": [],\n  \"totalHosts\": 0,\n  \"nestedDepth\": 0,\n  \"notes\": [\n    \"No shadow DOM hosts detected in the recorded state. Live shadow roots (open mode) can be probed via fx_shadow_dom_forensics on a live page.\"\n  ],\n  \"liveOpenRoots\": {\n    \"hosts\": []\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Analyzes shadow DOM hosts and boundaries**: sessionId, roots, totalHosts, nestedDepth, notes, liveOpenRoots
