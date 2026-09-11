# Operational Test: `td_visual_semantics`

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
  "id": "op_req_244_td_visual_semantics",
  "method": "tools/call",
  "params": {
    "name": "td_visual_semantics",
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
  "id": "op_req_244_td_visual_semantics",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"associations\":[{\"region\":{\"x\":0,\"y\":0,\"label\":\"viewport\"},\"associatedEntities\":[\"sem:c3e87a801165\",\"sem:ea6332da48e8\",\"sem:dc933d832497\",\"sem:03c7efe93932\",\"sem:c57b8a020ef6\"]}],\"note\":\"visual↔semantic association is heuristic in recorded mode; correlate with td_visual_causality for evidence\",\"tool\":\"td_visual_semantics\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"semantic-component\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, associations, note, tool, capability
