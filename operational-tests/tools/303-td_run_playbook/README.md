# Operational Test: `td_run_playbook`

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
  "id": "op_req_303_td_run_playbook",
  "method": "tools/call",
  "params": {
    "name": "td_run_playbook",
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
  "id": "op_req_303_td_run_playbook",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"INCONCLUSIVE\",\"note\":\"playbook undefined not found. available: disappearing-ui, security-passive, performance-scan, recovery-drill\",\"tool\":\"td_run_playbook\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"investigation-orchestration\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, note, tool, capability
