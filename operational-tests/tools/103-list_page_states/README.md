# Operational Test: `list_page_states`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Lists captured page state snapshots

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_103_list_page_states",
  "method": "tools/call",
  "params": {
    "name": "list_page_states",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_103_list_page_states",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"snapshotId\": \"snap_mtuudxdo_1\",\n    \"timestamp\": 1789003321404,\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"domLength\": 4222,\n    \"domHash\": \"c8b73284\"\n  },\n  {\n    \"snapshotId\": \"snap_mtuudxds_2\",\n    \"timestamp\": 1789003321408,\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"domLength\": 4222,\n    \"domHash\": \"c8b73284\"\n  },\n  {\n    \"snapshotId\": \"snap_mtuudxht_3\",\n    \"timestamp\": 1789003321553,\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"domLength\": 4386,\n    \"domHash\": \"feb1e736\"\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists captured page state snapshots**: 0, 1, 2
