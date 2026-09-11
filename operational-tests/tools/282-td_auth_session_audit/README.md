# Operational Test: `td_auth_session_audit`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 0ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_282_td_auth_session_audit",
  "method": "tools/call",
  "params": {
    "name": "td_auth_session_audit",
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
  "id": "op_req_282_td_auth_session_audit",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"mode\":\"passive\",\"findingCount\":1,\"findings\":[{\"id\":\"sec:59\",\"category\":\"auth-session\",\"severity\":\"info\",\"confidence\":0.6,\"observed\":\"auth transition observed: session-expiry — 401 observed on /api/orders\",\"verification\":\"POTENTIAL\",\"remediation\":\"verify session handling on expiry (redirect, token refresh, state cleanup)\"}],\"note\":\"passive analysis only; suspicion is never reported as CONFIRMED without reproduction\",\"tool\":\"td_auth_session_audit\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"security-intelligence\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, mode, findingCount, findings, note, tool, capability
