# Operational Test: `get_mutation_history`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns mutation history with undo/redo depths

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_086_get_mutation_history",
  "method": "tools/call",
  "params": {
    "name": "get_mutation_history",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_086_get_mutation_history",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"entries\": [\n    {\n      \"mutationId\": \"mut_mtulky5g_1\",\n      \"timestamp\": 1788988532461,\n      \"operation\": \"add_class\",\n      \"targetSelector\": \"#dynamic-text\",\n      \"success\": true,\n      \"summary\": \"add_class on #dynamic-text (+1/-0/~0)\",\n      \"undoApplied\": false,\n      \"redoApplied\": false\n    }\n  ],\n  \"undoDepth\": 0,\n  \"redoDepth\": 0,\n  \"openTransactionId\": \"tx_mtulky5r_2\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns mutation history with undo/redo depths**: entries, undoDepth, redoDepth, openTransactionId
