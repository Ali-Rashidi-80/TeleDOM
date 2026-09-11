# Operational Test: `fx_smart_snapshot`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 6ms

## Test Objective
Returns the compressed snapshot with mode recommendation

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_197_fx_smart_snapshot",
  "method": "tools/call",
  "params": {
    "name": "fx_smart_snapshot",
    "arguments": {
      "sessionId": "operational_acceptance_session_001",
      "question": "what buttons exist"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_197_fx_smart_snapshot",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"recommendedMode\": \"INTERACTION\",\n  \"mode\": \"INTERACTION\",\n  \"description\": \"Interactive elements only: links, buttons, inputs, selects, textareas with names and values (~10-15%).\",\n  \"nodeCount\": 1,\n  \"fullNodeCount\": 5,\n  \"compressionRatio\": 0.151,\n  \"estimatedTokens\": 23,\n  \"nodes\": [\n    {\n      \"tag\": \"input\",\n      \"id\": \"search-input\",\n      \"type\": \"text\",\n      \"value\": \"initial query\",\n      \"path\": \"3:leaf\"\n    }\n  ],\n  \"usage\": \"This mode returns ~15% of the FULL snapshot size. Prefer the smallest mode that answers your question (§39).\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns the compressed snapshot with mode recommendation**: sessionId, recommendedMode, mode, description, nodeCount, fullNodeCount, compressionRatio, estimatedTokens, nodes, usage
