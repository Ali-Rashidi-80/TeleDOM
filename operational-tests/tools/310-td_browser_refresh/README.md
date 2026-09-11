# Operational Test: `td_browser_refresh`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_310_td_browser_refresh",
  "method": "tools/call",
  "params": {
    "name": "td_browser_refresh",
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
  "id": "op_req_310_td_browser_refresh",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"action\":\"refresh\",\"result\":{\"reloaded\":true,\"mode\":\"soft\",\"simulated\":true,\"url\":\"https://app.internal/dashboard\",\"title\":\"MCP Operational Acceptance DOM Fixture\",\"note\":\"Node simulation context: DOM fixture retained; no real navigation occurs.\"},\"tool\":\"td_browser_refresh\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"side-effects\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, action, result, tool, capability
