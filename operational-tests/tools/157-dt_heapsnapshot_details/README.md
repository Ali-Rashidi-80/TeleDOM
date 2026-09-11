# Operational Test: `dt_heapsnapshot_details`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 0ms

## Test Objective
Parses and analyzes the heap snapshot with the real V8-format parser

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_157_dt_heapsnapshot_details",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_details",
    "arguments": {
      "snapshotId": "heap_4"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_157_dt_heapsnapshot_details",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_4\",\n  \"simulated\": true,\n  \"origin\": \"simulation-fixture\",\n  \"loadedAt\": 1789147433327,\n  \"parseDurationMs\": 0,\n  \"nodeCount\": 29,\n  \"edgeCount\": 29,\n  \"meta\": {\n    \"node_fields\": [\n      \"type\",\n      \"name\",\n      \"id\",\n      \"self_size\",\n      \"edge_count\",\n      \"trace_node_id\",\n      \"detachedness\"\n    ],\n    \"node_types\": [\n      [\n        \"hidden\",\n        \"array\",\n        \"string\",\n        \"object\",\n        \"code\",\n        \"closure\",\n        \"number\",\n        \"native\",\n        \"synthetic\"\n      ],\n      \"string\",\n      \"number\",\n      \"number\",\n      \"number\",\n      \"number\",\n      \"number\"\n    ],\n    \"edge_fields\": [\n      \"type\",\n      \"name_or_index\",\n      \"to_node\"\n    ],\n    \"edge_types\": [\n      [\n        \"element\",\n        \"hidden\",\n        \"internal\",\n        \"shortcut\",\n        \"weak\"\n      ],\n      \"string_or_number\",\n      \"node\"\n    ]\n  },\n  \"declaredCounts\": {\n    \"nodes\": 29,\n    \"edges\": 29\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, simulated, origin, loadedAt, parseDurationMs, nodeCount, edgeCount, meta, declaredCounts
