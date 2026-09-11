# Operational Test: `td_evidence_hash`

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
  "id": "op_req_222_td_evidence_hash",
  "method": "tools/call",
  "params": {
    "name": "td_evidence_hash",
    "arguments": {
      "artifact": {
        "operational": true
      }
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_222_td_evidence_hash",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"integrityHash\":\"5c45d1a27448767fae71317e0cd6ec4198f067df5c38e4bda933d8aaa0937faf\",\"algorithm\":\"sha-256\",\"canonicalization\":\"sorted-key JSON\",\"tool\":\"td_evidence_hash\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"evidence-provenance\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, integrityHash, algorithm, canonicalization, tool, capability
