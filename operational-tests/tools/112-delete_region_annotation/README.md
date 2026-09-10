# Operational Test: `delete_region_annotation`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 0ms

## Test Objective
Deletes the most recently captured region annotation

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_112_delete_region_annotation",
  "method": "tools/call",
  "params": {
    "name": "delete_region_annotation",
    "arguments": {
      "projectName": "op-project"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_112_delete_region_annotation",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"deleted\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Deletes the most recently captured region annotation**: deleted
