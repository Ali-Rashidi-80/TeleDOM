# Operational Test: `dt_get_console_message`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 1ms

## Test Objective
Inspects a captured console message in full

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_148_dt_get_console_message",
  "method": "tools/call",
  "params": {
    "name": "dt_get_console_message",
    "arguments": {
      "messageId": "con_1"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_148_dt_get_console_message",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"messageId\": \"con_1\",\n  \"level\": \"warn\",\n  \"text\": \"Seeded console warning for unified log verification\",\n  \"timestamp\": 1789100363111\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Inspects a captured console message in full**: messageId, level, text, timestamp
