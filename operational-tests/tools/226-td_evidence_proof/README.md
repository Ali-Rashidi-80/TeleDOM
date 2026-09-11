# Operational Test: `td_evidence_proof`

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
  "id": "op_req_226_td_evidence_proof",
  "method": "tools/call",
  "params": {
    "name": "td_evidence_proof",
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
  "id": "op_req_226_td_evidence_proof",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"proof\":{\"proofId\":\"proof:a184dd2ae2069a31\",\"proofHash\":\"a184dd2ae2069a319988796810e6a908fb8aac36bbf6a58743a19883eb36bbb7\"},\"selfVerification\":true,\"tool\":\"td_evidence_proof\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"evidence-provenance\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, proof, selfVerification, tool, capability
