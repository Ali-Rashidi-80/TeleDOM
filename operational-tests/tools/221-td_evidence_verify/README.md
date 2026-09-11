# Operational Test: `td_evidence_verify`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_221_td_evidence_verify",
  "method": "tools/call",
  "params": {
    "name": "td_evidence_verify",
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
  "id": "op_req_221_td_evidence_verify",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"verification\":{\"contractAction\":\"verify claim: undefined\",\"result\":\"PASS\",\"mustHoldResults\":[],\"mustNotHoldResults\":[],\"evidenceCollected\":[],\"missingEvidence\":[],\"observedAt\":1789100363955,\"rationale\":\"all postconditions held and required evidence was collected within 2000ms\"},\"tool\":\"td_evidence_verify\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"evidence-provenance\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, verification, tool, capability
