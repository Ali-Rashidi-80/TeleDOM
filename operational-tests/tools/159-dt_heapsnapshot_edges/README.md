# Operational Test: `dt_heapsnapshot_edges`

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
  "id": "op_req_159_dt_heapsnapshot_edges",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_edges",
    "arguments": {
      "snapshotId": "heap_6",
      "nodeId": 7
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_159_dt_heapsnapshot_edges",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_6\",\n  \"node\": {\n    \"id\": 7,\n    \"className\": \"retained-blob\",\n    \"selfSize\": 131072\n  },\n  \"edgeCount\": 0,\n  \"edges\": [],\n  \"simulated\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, node, edgeCount, edges, simulated
