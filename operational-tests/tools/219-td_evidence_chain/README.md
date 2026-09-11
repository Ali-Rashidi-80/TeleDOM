# Operational Test: `td_evidence_chain`

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
  "id": "op_req_219_td_evidence_chain",
  "method": "tools/call",
  "params": {
    "name": "td_evidence_chain",
    "arguments": {
      "claim": "injected button was removed by subtree replacement",
      "evidenceRefs": [
        "evt_op_007",
        "evt_op_008"
      ]
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_219_td_evidence_chain",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"claim\":\"injected button was removed by subtree replacement\",\"evidenceRefs\":[\"evt_op_007\",\"evt_op_008\"],\"confidence\":0.8699999999999999,\"classification\":\"CORRELATED\",\"rationale\":[\"source agent-supplied: quality=derived (0.75)\",\"corroboration x2 → factor 1.16\"],\"tool\":\"td_evidence_chain\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"evidence-provenance\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, claim, evidenceRefs, confidence, classification, rationale, tool, capability
