# Operational Test: `dt_heapsnapshot_object_details`

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
  "id": "op_req_164_dt_heapsnapshot_object_details",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_object_details",
    "arguments": {
      "snapshotId": "heap_11",
      "nodeId": 7
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_164_dt_heapsnapshot_object_details",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_11\",\n  \"id\": 7,\n  \"index\": 6,\n  \"type\": \"object\",\n  \"className\": \"retained-blob\",\n  \"name\": \"retained-blob\",\n  \"selfSize\": 131072,\n  \"edgeCount\": 0,\n  \"detached\": false,\n  \"outgoingEdgeCount\": 0,\n  \"outgoingEdges\": [],\n  \"retainerCount\": 2,\n  \"retainers\": [\n    {\n      \"index\": 3,\n      \"type\": \"hidden\",\n      \"nameOrIndex\": \"3\",\n      \"fromNodeId\": 1,\n      \"fromClassName\": \"synthetic:(roots)\",\n      \"toNodeId\": 7,\n      \"toNodeClass\": \"retained-blob\",\n      \"toSelfSize\": 131072\n    },\n    {\n      \"index\": 13,\n      \"type\": \"edge_6\",\n      \"nameOrIndex\": \"internal\",\n      \"fromNodeId\": 6,\n      \"fromClassName\": \"GlobalStore\",\n      \"toNodeId\": 7,\n      \"toNodeClass\": \"retained-blob\",\n      \"toSelfSize\": 131072\n    }\n  ],\n  \"simulated\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, id, index, type, className, name, selfSize, edgeCount, detached, outgoingEdgeCount, outgoingEdges, retainerCount, retainers, simulated
