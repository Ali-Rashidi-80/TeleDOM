# Operational Test: `td_temporal_diff`

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
  "id": "op_req_210_td_temporal_diff",
  "method": "tools/call",
  "params": {
    "name": "td_temporal_diff",
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
  "id": "op_req_210_td_temporal_diff",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"sessionId\":\"operational_acceptance_session_001\",\"t1\":0,\"t2\":400,\"entries\":[],\"meta\":{\"reconstructionMs\":0.21129500000097323,\"eventsReplayed\":0,\"degraded\":false,\"memoized\":false},\"tool\":\"td_temporal_diff\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"temporal-intelligence\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, sessionId, t1, t2, entries, meta, tool, capability
