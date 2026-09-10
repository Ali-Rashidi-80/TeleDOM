# Operational Test: `list_command_recordings`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Lists saved command recordings

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_092_list_command_recordings",
  "method": "tools/call",
  "params": {
    "name": "list_command_recordings",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_092_list_command_recordings",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"recordingId\": \"rec_mtuudxg5_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789003321493,\n    \"updatedAt\": 1789003321494,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings\\\\rec_mtuudxg5_1.json\"\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists saved command recordings**: 0
