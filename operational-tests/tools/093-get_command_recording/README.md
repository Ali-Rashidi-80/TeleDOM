# Operational Test: `get_command_recording`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Loads recording or reports NOT_FOUND honestly

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_093_get_command_recording",
  "method": "tools/call",
  "params": {
    "name": "get_command_recording",
    "arguments": {
      "recordingId": "op-recording"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_093_get_command_recording",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"recordingId\": \"rec_mtwg5ro3_1\",\n  \"name\": \"op-recording\",\n  \"createdAt\": 1789100358483,\n  \"updatedAt\": 1789100358483,\n  \"commandCount\": 1,\n  \"commands\": [\n    {\n      \"index\": 1,\n      \"commandId\": \"rcmd_1_mtwg5ro3\",\n      \"tool\": \"record_commands_start\",\n      \"args\": {\n        \"name\": \"op-recording\"\n      },\n      \"recordedAt\": 1789100358483,\n      \"outcome\": \"SUCCESS\",\n      \"resultSummary\": \"object with keys [recordingId, name, active, note]\"\n    }\n  ],\n  \"tags\": []\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Loads recording or reports NOT_FOUND honestly**: recordingId, name, createdAt, updatedAt, commandCount, commands, tags
