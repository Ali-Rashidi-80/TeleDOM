# Operational Test: `td_cause_explain`

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
  "id": "op_req_230_td_cause_explain",
  "method": "tools/call",
  "params": {
    "name": "td_cause_explain",
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
  "id": "op_req_230_td_cause_explain",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"explanation\":{\"classification\":\"STRONG_HYPOTHESIS\",\"confidence\":0.75,\"rationale\":[\"source causal-engine: quality=derived (0.75)\",\"corroboration x0 → factor 1.00\"],\"alternatives\":[\"common-cause\",\"coincidence-within-window\"]},\"tool\":\"td_cause_explain\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"causal-intelligence\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, explanation, tool, capability
