# Operational Test: `td_evidence_confidence`

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
  "id": "op_req_220_td_evidence_confidence",
  "method": "tools/call",
  "params": {
    "name": "td_evidence_confidence",
    "arguments": {
      "provenance": [
        {
          "origin": "operational-suite",
          "quality": "direct-observation",
          "evidenceRefs": [
            "evt_op_007"
          ]
        }
      ],
      "corroboration": 1
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_220_td_evidence_confidence",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"confidence\":1,\"classification\":\"SUPPORTED\",\"rationale\":[\"source operational-suite: quality=direct-observation (1)\",\"corroboration x1 → factor 1.08\"],\"tool\":\"td_evidence_confidence\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"evidence-provenance\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, confidence, classification, rationale, tool, capability
