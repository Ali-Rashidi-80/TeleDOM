# Operational Test: `list_command_recordings`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

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
        "text": "[\n  {\n    \"recordingId\": \"rec_mtx86odp_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789147430125,\n    \"updatedAt\": 1789147430125,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtx86odp_1.json\"\n  },\n  {\n    \"recordingId\": \"rec_mtx7sunh_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789146785069,\n    \"updatedAt\": 1789146785070,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtx7sunh_1.json\"\n  },\n  {\n    \"recordingId\": \"rec_mtx7pacy_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789146618802,\n    \"updatedAt\": 1789146618802,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtx7pacy_1.json\"\n  },\n  {\n    \"recordingId\": \"rec_mtx6eqee_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789144446758,\n    \"updatedAt\": 1789144446758,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtx6eqee_1.json\"\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists saved command recordings**: 0, 1, 2, 3
