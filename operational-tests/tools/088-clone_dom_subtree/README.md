# Operational Test: `clone_dom_subtree`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 17ms

## Test Objective
Clones subtree without duplicating ids

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_088_clone_dom_subtree",
  "method": "tools/call",
  "params": {
    "name": "clone_dom_subtree",
    "arguments": {
      "target": {
        "selector": "#removable-card"
      }
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_088_clone_dom_subtree",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"mutationId\": \"mut_mtuudxf9_3\",\n  \"operation\": \"clone_subtree\",\n  \"success\": true,\n  \"before\": {\n    \"selector\": \"#removable-card\",\n    \"outerHtml\": \"<div id=\\\"removable-card\\\" class=\\\"card\\\" style=\\\"background: #334155;\\\">\\n          <span id=\\\"removable-label\\\">This element can be unmounted or restyled</span>\\n        </div>\",\n    \"attributes\": {\n      \"id\": \"removable-card\",\n      \"class\": \"card\",\n      \"style\": \"background: #334155;\"\n    }\n  },\n  \"after\": {\n    \"selector\": \"#removable-card\",\n    \"outerHtml\": \"<div id=\\\"removable-card\\\" class=\\\"card\\\" style=\\\"background: #334155;\\\">\\n          <span id=\\\"removable-label\\\">This element can be unmounted or restyled</span>\\n        </div>\",\n    \"attributes\": {\n      \"id\": \"removable-card\",\n      \"class\": \"card\",\n      \"style\": \"background: #334155;\"\n    }\n  },\n  \"diff\": {\n    \"added\": 0,\n    \"removed\": 0,\n    \"changed\": 0,\n    \"summary\": \"attributes +0/-0/~0; subtree nodes: 1\"\n  },\n  \"affectedSelector\": \"#removable-card\",\n  \"durationMs\": 14,\n  \"undoable\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Clones subtree without duplicating ids**: mutationId, operation, success, before, after, diff, affectedSelector, durationMs, undoable
