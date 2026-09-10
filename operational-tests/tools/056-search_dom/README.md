# Operational Test: `search_dom`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Searches DOM by text/tag/attr with scored matches

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_056_search_dom",
  "method": "tools/call",
  "params": {
    "name": "search_dom",
    "arguments": {
      "query": "search"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_056_search_dom",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"analyzer\": \"search_dom\",\n  \"summary\": \"2 element(s) match \\\"search\\\"\",\n  \"count\": 2,\n  \"items\": [\n    {\n      \"selector\": \"label\",\n      \"tag\": \"label\",\n      \"text\": \"Search Input: \",\n      \"score\": 1,\n      \"reason\": \"attribute for match\",\n      \"visible\": true,\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"w\": 0,\n        \"h\": 0\n      }\n    },\n    {\n      \"selector\": \"#search-input\",\n      \"tag\": \"input\",\n      \"role\": \"textbox\",\n      \"text\": \"\",\n      \"score\": 0.4,\n      \"reason\": \"attribute id match\",\n      \"visible\": true,\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"w\": 0,\n        \"h\": 0\n      }\n    }\n  ],\n  \"warnings\": [],\n  \"truncated\": false\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Searches DOM by text/tag/attr with scored matches**: analyzer, summary, count, items, warnings, truncated
