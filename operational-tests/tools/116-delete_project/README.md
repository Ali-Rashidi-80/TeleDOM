# Operational Test: `delete_project`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Deletes project folder

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_116_delete_project",
  "method": "tools/call",
  "params": {
    "name": "delete_project",
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
  "id": "op_req_116_delete_project",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"deleted\": true,\n  \"projectName\": \"op-project\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Deletes project folder**: deleted, projectName
