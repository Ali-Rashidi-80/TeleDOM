# Operational Test: `td_browser_back`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_308_td_browser_back",
  "method": "tools/call",
  "params": {
    "name": "td_browser_back",
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
  "id": "op_req_308_td_browser_back",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"action\":\"back\",\"result\":{\"status\":\"EXECUTED_SUCCESSFULLY\",\"executionId\":\"js_mtx86s9o_31\",\"durationMs\":0,\"result\":\"https://app.internal/dashboard\",\"consoleOutput\":[],\"domChanged\":false,\"domLengthBefore\":4594,\"domLengthAfter\":4594,\"world\":\"ISOLATED\",\"timeoutMs\":5000,\"codePreview\":\"window.history.back(); return window.location.href;\"},\"tool\":\"td_browser_back\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"side-effects\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, action, result, tool, capability
