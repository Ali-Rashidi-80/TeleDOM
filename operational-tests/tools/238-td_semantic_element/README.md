# Operational Test: `td_semantic_element`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_238_td_semantic_element",
  "method": "tools/call",
  "params": {
    "name": "td_semantic_element",
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
  "id": "op_req_238_td_semantic_element",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"semantic\":{\"semanticId\":\"sem:c3e87a801165\",\"role\":\"html-region\",\"purpose\":\"html:html-region\",\"text\":\"MCP Operational Acceptance DOM Fixture\\n  \\n    body { font-family: sans-serif; padding: 20px; background: #0f172a;\",\"state\":\"enabled\",\"ownership\":null,\"stability\":0.56,\"visibility\":\"visible\",\"interactive\":false,\"selectorCandidates\":[\"html\"],\"accessibility\":{\"focusable\":false}},\"tool\":\"td_semantic_element\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"semantic-component\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, semantic, tool, capability
