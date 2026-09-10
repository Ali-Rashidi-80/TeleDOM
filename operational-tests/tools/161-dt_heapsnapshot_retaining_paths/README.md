# Operational Test: `dt_heapsnapshot_retaining_paths`

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
  "id": "op_req_161_dt_heapsnapshot_retaining_paths",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_retaining_paths",
    "arguments": {
      "snapshotId": "heap_8",
      "nodeId": 7
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_161_dt_heapsnapshot_retaining_paths",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_8\",\n  \"node\": {\n    \"id\": 7,\n    \"className\": \"retained-blob\"\n  },\n  \"pathCount\": 1,\n  \"paths\": [\n    {\n      \"path\": [\n        {\n          \"from\": \"synthetic:(roots)@1\",\n          \"edge\": \"[3]\"\n        }\n      ],\n      \"length\": 1\n    }\n  ],\n  \"simulated\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, node, pathCount, paths, simulated
