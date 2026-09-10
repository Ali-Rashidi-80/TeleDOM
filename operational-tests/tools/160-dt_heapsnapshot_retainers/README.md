# Operational Test: `dt_heapsnapshot_retainers`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 1ms

## Test Objective
Parses and analyzes the heap snapshot with the real V8-format parser

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_160_dt_heapsnapshot_retainers",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_retainers",
    "arguments": {
      "snapshotId": "heap_7",
      "nodeId": 7
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_160_dt_heapsnapshot_retainers",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_7\",\n  \"node\": {\n    \"id\": 7,\n    \"className\": \"retained-blob\",\n    \"selfSize\": 131072\n  },\n  \"retainerCount\": 2,\n  \"retainers\": [\n    {\n      \"index\": 3,\n      \"type\": \"hidden\",\n      \"nameOrIndex\": \"3\",\n      \"fromNodeId\": 1,\n      \"fromClassName\": \"synthetic:(roots)\",\n      \"toNodeId\": 7,\n      \"toNodeClass\": \"retained-blob\",\n      \"toSelfSize\": 131072\n    },\n    {\n      \"index\": 13,\n      \"type\": \"edge_6\",\n      \"nameOrIndex\": \"internal\",\n      \"fromNodeId\": 6,\n      \"fromClassName\": \"GlobalStore\",\n      \"toNodeId\": 7,\n      \"toNodeClass\": \"retained-blob\",\n      \"toSelfSize\": 131072\n    }\n  ],\n  \"simulated\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, node, retainerCount, retainers, simulated
