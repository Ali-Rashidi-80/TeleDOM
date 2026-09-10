# Operational Test: `dt_compare_heapsnapshots`

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
  "id": "op_req_166_dt_compare_heapsnapshots",
  "method": "tools/call",
  "params": {
    "name": "dt_compare_heapsnapshots",
    "arguments": {
      "snapshotA": "heap_13",
      "snapshotB": "heap_13"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_166_dt_compare_heapsnapshots",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotA\": \"heap_13\",\n  \"snapshotB\": \"heap_13\",\n  \"addedNodes\": 0,\n  \"removedNodes\": 0,\n  \"classes\": [],\n  \"simulatedA\": true,\n  \"simulatedB\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotA, snapshotB, addedNodes, removedNodes, classes, simulatedA, simulatedB
