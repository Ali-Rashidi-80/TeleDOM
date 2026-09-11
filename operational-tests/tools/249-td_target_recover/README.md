# Operational Test: `td_target_recover`

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
  "id": "op_req_249_td_target_recover",
  "method": "tools/call",
  "params": {
    "name": "td_target_recover",
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
  "id": "op_req_249_td_target_recover",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"INCONCLUSIVE\",\"resolution\":{\"confidence\":0,\"best\":null,\"warnings\":[\"selector undefined failed; attempting multi-signal recovery\",\"recovery refused: best candidate below 0.5 confidence (would be a blind guess)\"]},\"tool\":\"td_target_recover\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"targeting-interaction\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, resolution, tool, capability
