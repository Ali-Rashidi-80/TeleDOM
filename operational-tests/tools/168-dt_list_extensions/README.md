# Operational Test: `dt_list_extensions`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 3ms

## Test Objective
Lists extensions (simulated state clearly labeled)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_168_dt_list_extensions",
  "method": "tools/call",
  "params": {
    "name": "dt_list_extensions",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_168_dt_list_extensions",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 1,\n  \"extensions\": [\n    {\n      \"extensionId\": \"teledom@teledom\",\n      \"name\": \"TeleDOM Browser Intelligence Platform\",\n      \"version\": \"4.1.0\",\n      \"enabled\": true,\n      \"description\": \"The TeleDOM platform extension itself\",\n      \"installType\": \"development\"\n    }\n  ],\n  \"mode\": \"LIVE\",\n  \"simulated\": false\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists extensions (simulated state clearly labeled)**: total, extensions, mode, simulated
