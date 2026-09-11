# Operational Test: `td_recover_bridge`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 353ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_270_td_recover_bridge",
  "method": "tools/call",
  "params": {
    "name": "td_recover_bridge",
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
  "id": "op_req_270_td_recover_bridge",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PARTIAL\",\"recovery\":{\"at\":1789102370225,\"failure\":\"bridge-disconnect\",\"attempt\":3,\"outcome\":\"FAILED\",\"preserved\":[\"incidents(0)\",\"entities(0)\",\"evidence(1)\",\"checkpoints(10)\",\"temporal-head(0)\",\"tab-mapping(0)\"],\"lost\":[\"live-connection\"],\"reason\":\"no live browser adapter wired in this process; recovery machinery exercised, live reattach unavailable\"},\"preserved\":[\"incidents(0)\",\"entities(0)\",\"evidence(1)\",\"checkpoints(10)\",\"temporal-head(0)\",\"tab-mapping(0)\"],\"tool\":\"td_recover_bridge\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"reliability-recovery\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, recovery, preserved, tool, capability
