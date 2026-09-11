# Operational Test: `td_temporal_window`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_209_td_temporal_window",
  "method": "tools/call",
  "params": {
    "name": "td_temporal_window",
    "arguments": {
      "sessionId": "operational_acceptance_session_001",
      "aroundLogical": 400
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_209_td_temporal_window",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"sessionId\":\"operational_acceptance_session_001\",\"before\":[],\"at\":[],\"after\":[],\"counts\":{\"before\":0,\"at\":0,\"after\":0},\"tool\":\"td_temporal_window\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"temporal-intelligence\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, sessionId, before, at, after, counts, tool, capability
