# Operational Test: `mutate_dom`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 12ms

## Test Objective
Applies mutation with BEFORE/AFTER/DIFF and undo record

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_082_mutate_dom",
  "method": "tools/call",
  "params": {
    "name": "mutate_dom",
    "arguments": {
      "operation": "add_class",
      "target": {
        "selector": "#dynamic-text"
      },
      "classes": [
        "op-test"
      ]
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_082_mutate_dom",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"mutationId\": \"mut_mtwhcqu2_1\",\n  \"operation\": \"add_class\",\n  \"success\": true,\n  \"before\": {\n    \"selector\": \"#dynamic-text\",\n    \"outerHtml\": \"<p id=\\\"dynamic-text\\\">Original Static Text Content</p>\",\n    \"attributes\": {\n      \"id\": \"dynamic-text\"\n    }\n  },\n  \"after\": {\n    \"selector\": \"#dynamic-text\",\n    \"outerHtml\": \"<p id=\\\"dynamic-text\\\" class=\\\"op-test\\\">Original Static Text Content</p>\",\n    \"attributes\": {\n      \"id\": \"dynamic-text\",\n      \"class\": \"op-test\"\n    }\n  },\n  \"diff\": {\n    \"added\": 1,\n    \"removed\": 0,\n    \"changed\": 0,\n    \"summary\": \"attributes +1/-0/~0; subtree nodes: 0\"\n  },\n  \"affectedSelector\": \"#dynamic-text\",\n  \"durationMs\": 11,\n  \"undoable\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Applies mutation with BEFORE/AFTER/DIFF and undo record**: mutationId, operation, success, before, after, diff, affectedSelector, durationMs, undoable
