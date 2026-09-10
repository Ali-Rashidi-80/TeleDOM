# Operational Test: `get_element_ancestry`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 6ms

## Test Objective
Returns ancestor chain, siblings and descendant summary

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_051_get_element_ancestry",
  "method": "tools/call",
  "params": {
    "name": "get_element_ancestry",
    "arguments": {
      "selector": "#search-input"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_051_get_element_ancestry",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"selector\": \"#search-input\",\n  \"ancestors\": [\n    {\n      \"tag\": \"div\",\n      \"selector\": \"div\",\n      \"text\": \" \",\n      \"childIndex\": 1,\n      \"siblingCount\": 6,\n      \"distance\": 1\n    },\n    {\n      \"tag\": \"section\",\n      \"selector\": \"#interactive-section\",\n      \"text\": \" \",\n      \"childIndex\": 1,\n      \"siblingCount\": 3,\n      \"distance\": 2\n    },\n    {\n      \"tag\": \"main\",\n      \"selector\": \"#main-content\",\n      \"text\": \" \",\n      \"childIndex\": 1,\n      \"siblingCount\": 3,\n      \"distance\": 3\n    },\n    {\n      \"tag\": \"body\",\n      \"selector\": \"body\",\n      \"text\": \" \",\n      \"childIndex\": 1,\n      \"siblingCount\": 2,\n      \"distance\": 4\n    },\n    {\n      \"tag\": \"html\",\n      \"selector\": \"html\",\n      \"text\": \"\",\n      \"childIndex\": 1,\n      \"siblingCount\": 0,\n      \"distance\": 5\n    }\n  ],\n  \"siblings\": [\n    {\n      \"tag\": \"label\",\n      \"selector\": \"label\",\n      \"text\": \"Search Input:\",\n      \"position\": \"before\",\n      \"distance\": 1\n    }\n  ],\n  \"descendants\": {\n    \"count\": 0,\n    \"maxDepth\": 1,\n    \"tags\": [],\n    \"interactive\": []\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns ancestor chain, siblings and descendant summary**: selector, ancestors, siblings, descendants
