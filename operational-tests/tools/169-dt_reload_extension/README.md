# Operational Test: `dt_reload_extension`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 0ms

## Test Objective
Reloads the simulated extension

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_169_dt_reload_extension",
  "method": "tools/call",
  "params": {
    "name": "dt_reload_extension",
    "arguments": {
      "extensionId": "forensic-recorder@mcpdom"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_169_dt_reload_extension",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"reloaded\": true,\n  \"extensionId\": \"forensic-recorder@mcpdom\",\n  \"detail\": {\n    \"reloaded\": true,\n    \"extensionId\": \"forensic-recorder@mcpdom\",\n    \"simulated\": true,\n    \"note\": \"Simulated reload: extension state preserved.\"\n  },\n  \"mode\": \"LIVE\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Reloads the simulated extension**: reloaded, extensionId, detail, mode
