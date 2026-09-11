# Operational Test: `compare_page_states`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 0ms

## Test Objective
Compares two most recent snapshots

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_102_compare_page_states",
  "method": "tools/call",
  "params": {
    "name": "compare_page_states",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_102_compare_page_states",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotIdA\": \"snap_mtwg5rmo_2\",\n  \"snapshotIdB\": \"snap_mtwg5roi_3\",\n  \"identical\": false,\n  \"changes\": [\n    {\n      \"field\": \"domLength\",\n      \"before\": 4430,\n      \"after\": 4594\n    },\n    {\n      \"field\": \"domHash\",\n      \"before\": \"b5a14eea\",\n      \"after\": \"dd86b0d4\"\n    }\n  ],\n  \"domDelta\": {\n    \"beforeLength\": 4430,\n    \"afterLength\": 4594,\n    \"delta\": 164\n  },\n  \"summary\": \"2 field(s) changed; DOM size +164 bytes.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Compares two most recent snapshots**: snapshotIdA, snapshotIdB, identical, changes, domDelta, summary
