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
        "text": "[\n  {\n    \"recordingId\": \"rec_mtwhcqv9_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789102363653,\n    \"updatedAt\": 1789102363653,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtwhcqv9_1.json\"\n  },\n  {\n    \"recordingId\": \"rec_mtwg5ro3_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789100358483,\n    \"updatedAt\": 1789100358483,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtwg5ro3_1.json\"\n  },\n  {\n    \"recordingId\": \"rec_mtwg4hjm_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789100298706,\n    \"updatedAt\": 1789100298706,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtwg4hjm_1.json\"\n  },\n  {\n    \"recordingId\": \"rec_mtwg3z4v_1\",\n    \"name\": \"op-recording\",\n    \"commandCount\": 1,\n    \"createdAt\": 1789100274847,\n    \"updatedAt\": 1789100274848,\n    \"tags\": [],\n    \"file\": \".mcpdom_recordings/rec_mtwg3z4v_1.json\"\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists saved command recordings**: 0, 1, 2, 3
