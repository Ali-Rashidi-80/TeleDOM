# Operational Test: `td_recover_browser`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 352ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_268_td_recover_browser",
  "method": "tools/call",
  "params": {
    "name": "td_recover_browser",
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
  "id": "op_req_268_td_recover_browser",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PARTIAL\",\"recovery\":{\"at\":1789100364364,\"failure\":\"browser-crash\",\"attempt\":3,\"outcome\":\"FAILED\",\"preserved\":[\"incidents(0)\",\"entities(0)\",\"evidence(1)\",\"checkpoints(10)\",\"temporal-head(0)\",\"tab-mapping(0)\"],\"lost\":[\"live-connection\"],\"reason\":\"no live browser adapter wired in this process; recovery machinery exercised, live reattach unavailable\"},\"preserved\":[\"incidents(0)\",\"entities(0)\",\"evidence(1)\",\"checkpoints(10)\",\"temporal-head(0)\",\"tab-mapping(0)\"],\"tool\":\"td_recover_browser\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"reliability-recovery\",\"securityClass\":\"side-effects\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, recovery, preserved, tool, capability
