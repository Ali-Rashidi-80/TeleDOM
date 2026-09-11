# Operational Test: `td_reconcile_events`

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
  "id": "op_req_272_td_reconcile_events",
  "method": "tools/call",
  "params": {
    "name": "td_reconcile_events",
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
  "id": "op_req_272_td_reconcile_events",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"stats\":{\"events\":0,\"gaps\":0,\"duplicatesDropped\":0,\"late\":0,\"headSequence\":0},\"integrity\":{\"valid\":true},\"verdict\":\"event stream coherent\",\"tool\":\"td_reconcile_events\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"reliability-recovery\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, stats, integrity, verdict, tool, capability
