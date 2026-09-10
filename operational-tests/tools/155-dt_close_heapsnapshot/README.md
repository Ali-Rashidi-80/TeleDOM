# Operational Test: `dt_close_heapsnapshot`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 0ms

## Test Objective
Closes the loaded heap snapshot (lifecycle §24)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_155_dt_close_heapsnapshot",
  "method": "tools/call",
  "params": {
    "name": "dt_close_heapsnapshot",
    "arguments": {
      "snapshotId": "heap_2"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_155_dt_close_heapsnapshot",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"closed\": true,\n  \"snapshotId\": \"heap_2\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Closes the loaded heap snapshot (lifecycle §24)**: closed, snapshotId
