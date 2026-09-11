# Operational Test: `fx_dom_regression_diff`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 44ms

## Test Objective
Diffs states across 8 dimensions with machine+human output

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_177_fx_dom_regression_diff",
  "method": "tools/call",
  "params": {
    "name": "fx_dom_regression_diff",
    "arguments": {
      "sessionId": "operational_acceptance_session_001",
      "t1": 0,
      "t2": 400
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_177_fx_dom_regression_diff",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"t1\": 0,\n  \"t2\": 400,\n  \"machine\": {\n    \"dimensions\": [\n      {\n        \"dimension\": \"removed\",\n        \"count\": 1,\n        \"changes\": [\n          {\n            \"selector\": \"#host-sidebar\",\n            \"nodeId\": 4,\n            \"detail\": \"<div> removed\"\n          }\n        ]\n      },\n      {\n        \"dimension\": \"layout\",\n        \"count\": 1,\n        \"changes\": [\n          {\n            \"selector\": \"html > body\",\n            \"nodeId\": 3,\n            \"detail\": \"child count 2 → 1 (layout impact)\"\n          }\n        ]\n      },\n      {\n        \"dimension\": \"accessibility\",\n        \"count\": 1,\n        \"changes\": [\n          {\n            \"selector\": \"#search-input\",\n            \"nodeId\": 6,\n            \"detail\": \"interactive element without accessible name\"\n          }\n        ]\n      }\n    ],\n    \"totals\": {\n      \"removed\": 1,\n      \"layout\": 1,\n      \"accessibility\": 1\n    }\n  },\n  \"humanReadableReport\": \"# DOM Regression Diff\\n\\nElements: 5 → 4\\n\\n## removed (1)\\n- `#host-sidebar` — <div> removed\\n\\n## layout (1)\\n- `html > body` — child count 2 → 1 (layout impact)\\n\\n## accessibility (1)\\n- `#search-input` — interactive element without accessible name\\n\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Diffs states across 8 dimensions with machine+human output**: sessionId, t1, t2, machine, humanReadableReport
