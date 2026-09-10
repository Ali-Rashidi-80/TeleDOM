# Operational Test: `preview_command`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 10ms

## Test Objective
Dry-runs mutation without side effects

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_074_preview_command",
  "method": "tools/call",
  "params": {
    "name": "preview_command",
    "arguments": {
      "operation": "add_class",
      "target": {
        "selector": "#search-input"
      },
      "classes": [
        "preview-test"
      ]
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_074_preview_command",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"valid\": true,\n  \"operation\": \"add_class\",\n  \"target\": {\n    \"selector\": \"#search-input\",\n    \"tag\": \"input\"\n  },\n  \"expectedChange\": \"classes preview-test will be added\",\n  \"affectedNodes\": 1,\n  \"warnings\": []\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Dry-runs mutation without side effects**: valid, operation, target, expectedChange, affectedNodes, warnings
