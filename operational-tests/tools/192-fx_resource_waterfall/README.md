# Operational Test: `fx_resource_waterfall`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 12ms

## Test Objective
Builds the resource waterfall with milestones

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_192_fx_resource_waterfall",
  "method": "tools/call",
  "params": {
    "name": "fx_resource_waterfall",
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
  "id": "op_req_192_fx_resource_waterfall",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"waterfall\": [\n    {\n      \"url\": \"https://api.internal/v1/analyze\",\n      \"resourceType\": \"other\",\n      \"startMs\": 0,\n      \"durationMs\": 80,\n      \"status\": 200,\n      \"phase\": \"complete\"\n    }\n  ],\n  \"milestones\": [],\n  \"summary\": {\n    \"totalRequests\": 1,\n    \"failed\": 0,\n    \"totalBytes\": 0,\n    \"slowest\": {\n      \"url\": \"https://api.internal/v1/analyze\",\n      \"resourceType\": \"other\",\n      \"startMs\": 0,\n      \"durationMs\": 80,\n      \"status\": 200,\n      \"phase\": \"complete\"\n    },\n    \"byType\": {\n      \"other\": 1\n    }\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Builds the resource waterfall with milestones**: sessionId, waterfall, milestones, summary
