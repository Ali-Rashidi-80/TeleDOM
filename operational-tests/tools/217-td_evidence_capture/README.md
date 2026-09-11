# Operational Test: `td_evidence_capture`

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
  "id": "op_req_217_td_evidence_capture",
  "method": "tools/call",
  "params": {
    "name": "td_evidence_capture",
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
  "id": "op_req_217_td_evidence_capture",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"evidenceNode\":{\"id\":\"en:f41c00b7fbccb500a1bd\",\"hash\":\"f41c00b7fbccb500a1bd30754ee4150563441ae6c2900f5d917c80962428b48a\"},\"tool\":\"td_evidence_capture\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"evidence-provenance\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, evidenceNode, tool, capability
