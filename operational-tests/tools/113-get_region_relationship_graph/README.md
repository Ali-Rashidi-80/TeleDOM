# Operational Test: `get_region_relationship_graph`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 4ms

## Test Objective
Builds region relationship graph

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_113_get_region_relationship_graph",
  "method": "tools/call",
  "params": {
    "name": "get_region_relationship_graph",
    "arguments": {
      "projectName": "op-project"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_113_get_region_relationship_graph",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"pageId\": \"page_mtuudxid\",\n  \"nodes\": [\n    {\n      \"id\": \"page:page_mtuudxid\",\n      \"name\": \"page\",\n      \"tag\": \"document\",\n      \"selector\": \"document\",\n      \"depth\": 0,\n      \"relationship\": \"page\"\n    },\n    {\n      \"id\": \"region_mtuudxj1_1\",\n      \"name\": \"header_operational_dom_test_card\",\n      \"tag\": \"#fixture-header\",\n      \"selector\": \"#fixture-header\",\n      \"depth\": 1,\n      \"relationship\": \"region\"\n    }\n  ],\n  \"edges\": [\n    {\n      \"from\": \"page:page_mtuudxid\",\n      \"to\": \"region_mtuudxj1_1\",\n      \"relation\": \"contains\"\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Builds region relationship graph**: pageId, nodes, edges
