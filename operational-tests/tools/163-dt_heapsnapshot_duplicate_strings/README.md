# Operational Test: `dt_heapsnapshot_duplicate_strings`

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
  "id": "op_req_163_dt_heapsnapshot_duplicate_strings",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_duplicate_strings",
    "arguments": {
      "snapshotId": "heap_10"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_163_dt_heapsnapshot_duplicate_strings",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_10\",\n  \"duplicateGroups\": 2,\n  \"totalWastedBytes\": 288,\n  \"duplicates\": [\n    {\n      \"value\": \"dashboard-state\",\n      \"instances\": 3,\n      \"wastedBytes\": 192\n    },\n    {\n      \"value\": \"hello-world\",\n      \"instances\": 2,\n      \"wastedBytes\": 96\n    }\n  ],\n  \"simulated\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, duplicateGroups, totalWastedBytes, duplicates, simulated
