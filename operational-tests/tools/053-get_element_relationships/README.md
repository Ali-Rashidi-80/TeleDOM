# Operational Test: `get_element_relationships`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Builds element relationship graph (parents, children, siblings)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_053_get_element_relationships",
  "method": "tools/call",
  "params": {
    "name": "get_element_relationships",
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
  "id": "op_req_053_get_element_relationships",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"rootSelector\": \"#search-input\",\n  \"nodes\": [\n    {\n      \"id\": \"self\",\n      \"selector\": \"#search-input\",\n      \"tag\": \"input\",\n      \"label\": \"input\",\n      \"relationship\": \"self\",\n      \"depth\": 0\n    },\n    {\n      \"id\": \"ancestor_1\",\n      \"selector\": \"div\",\n      \"tag\": \"div\",\n      \"label\": \" \",\n      \"relationship\": \"parent\",\n      \"depth\": 1\n    },\n    {\n      \"id\": \"ancestor_2\",\n      \"selector\": \"#interactive-section\",\n      \"tag\": \"section\",\n      \"label\": \" \",\n      \"relationship\": \"parent\",\n      \"depth\": 2\n    },\n    {\n      \"id\": \"ancestor_3\",\n      \"selector\": \"#main-content\",\n      \"tag\": \"main\",\n      \"label\": \" \",\n      \"relationship\": \"parent\",\n      \"depth\": 3\n    },\n    {\n      \"id\": \"ancestor_4\",\n      \"selector\": \"body\",\n      \"tag\": \"body\",\n      \"label\": \" \",\n      \"relationship\": \"parent\",\n      \"depth\": 4\n    },\n    {\n      \"id\": \"sibling_5\",\n      \"selector\": \"label\",\n      \"tag\": \"label\",\n      \"label\": \"Search Input:\",\n      \"relationship\": \"sibling\",\n      \"depth\": 1\n    }\n  ],\n  \"edges\": [\n    {\n      \"from\": \"ancestor_1\",\n      \"to\": \"self\",\n      \"relation\": \"parent-of\"\n    },\n    {\n      \"from\": \"ancestor_2\",\n      \"to\": \"ancestor_1\",\n      \"relation\": \"parent-of\"\n    },\n    {\n      \"from\": \"ancestor_3\",\n      \"to\": \"ancestor_2\",\n      \"relation\": \"parent-of\"\n    },\n    {\n      \"from\": \"ancestor_4\",\n      \"to\": \"ancestor_3\",\n      \"relation\": \"parent-of\"\n    },\n    {\n      \"from\": \"self\",\n      \"to\": \"sibling_5\",\n      \"relation\": \"sibling-of\"\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Builds element relationship graph (parents, children, siblings)**: rootSelector, nodes, edges
