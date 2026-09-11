# Operational Test: `td_resolve_target`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_247_td_resolve_target",
  "method": "tools/call",
  "params": {
    "name": "td_resolve_target",
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
  "id": "op_req_247_td_resolve_target",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"resolution\":{\"status\":\"DEGRADED\",\"confidence\":0.32725,\"best\":{\"candidateId\":\"cand:fce2d50c0e\",\"selector\":\"#login-btn\",\"semanticId\":\"sem:fixture-login\",\"structuralScore\":0.35,\"semanticScore\":0.3,\"historicalScore\":0.3,\"behavioralScore\":0.8,\"visualScore\":0.85,\"stabilityScore\":0.9,\"overall\":0.46749999999999997,\"evidence\":[]},\"warnings\":[],\"candidateCount\":3},\"tool\":\"td_resolve_target\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"targeting-interaction\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, resolution, tool, capability
