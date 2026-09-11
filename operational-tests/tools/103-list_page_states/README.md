# Operational Test: `list_page_states`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

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
        "text": "[\n  {\n    \"snapshotId\": \"snap_mtwhcqtz_1\",\n    \"timestamp\": 1789102363607,\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"domLength\": 4430,\n    \"domHash\": \"b5a14eea\"\n  },\n  {\n    \"snapshotId\": \"snap_mtwhcqu0_2\",\n    \"timestamp\": 1789102363608,\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"domLength\": 4430,\n    \"domHash\": \"b5a14eea\"\n  },\n  {\n    \"snapshotId\": \"snap_mtwhcqvl_3\",\n    \"timestamp\": 1789102363665,\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"domLength\": 4594,\n    \"domHash\": \"dd86b0d4\"\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists captured page state snapshots**: 0, 1, 2
