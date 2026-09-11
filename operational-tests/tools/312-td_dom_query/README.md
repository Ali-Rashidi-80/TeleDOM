# Operational Test: `td_dom_query`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 7ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_312_td_dom_query",
  "method": "tools/call",
  "params": {
    "name": "td_dom_query",
    "arguments": {
      "query": "Run Analysis",
      "limit": 10
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_312_td_dom_query",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"result\":{\"analyzer\":\"search_dom\",\"summary\":\"1 element(s) match \\\"Run Analysis\\\"\",\"count\":1,\"items\":[{\"selector\":\"#primary-action-btn\",\"tag\":\"button\",\"role\":\"button\",\"text\":\"⚡ Run Analysis\",\"score\":0.6,\"reason\":\"text match\",\"visible\":true,\"bounds\":{\"x\":0,\"y\":0,\"w\":0,\"h\":0}}],\"warnings\":[],\"truncated\":false},\"tool\":\"td_dom_query\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, result, tool, capability
