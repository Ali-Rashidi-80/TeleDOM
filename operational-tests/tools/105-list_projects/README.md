# Operational Test: `list_projects`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 4ms

## Test Objective
Lists page analysis projects

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_105_list_projects",
  "method": "tools/call",
  "params": {
    "name": "list_projects",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_105_list_projects",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"name\": \"op-project\",\n    \"projectId\": \"proj_mtuudxid\",\n    \"description\": \"Operational project\",\n    \"regionCount\": 0,\n    \"pageCount\": 1,\n    \"commandRecordingCount\": 0,\n    \"createdAt\": 1789003321574,\n    \"updatedAt\": 1789003321574,\n    \"tags\": []\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists page analysis projects**: 0
