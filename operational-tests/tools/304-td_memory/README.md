# Operational Test: `td_memory`

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
  "id": "op_req_304_td_memory",
  "method": "tools/call",
  "params": {
    "name": "td_memory",
    "arguments": {
      "action": "store",
      "kind": "known-environment",
      "statement": "operational acceptance session exercises the v12 kernel",
      "confidence": 0.8,
      "evidenceRefs": [
        "evt_op_001"
      ]
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_304_td_memory",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"stored\":{\"memoryId\":\"mem:1\",\"validated\":true,\"confidence\":0.8},\"tool\":\"td_memory\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"investigation-orchestration\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, stored, tool, capability
