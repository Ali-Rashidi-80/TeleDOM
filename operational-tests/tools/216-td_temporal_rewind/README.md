# Operational Test: `td_temporal_rewind`

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
  "id": "op_req_216_td_temporal_rewind",
  "method": "tools/call",
  "params": {
    "name": "td_temporal_rewind",
    "arguments": {
      "sessionId": "operational_acceptance_session_001"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_216_td_temporal_rewind",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"INCONCLUSIVE\",\"reconstructedState\":null,\"meta\":{\"reconstructionMs\":0.010847999999896274,\"eventsReplayed\":0,\"degraded\":false,\"memoized\":false},\"note\":\"inspection-only rewind; live page is never mutated\",\"tool\":\"td_temporal_rewind\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"temporal-intelligence\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, reconstructedState, meta, note, tool, capability
