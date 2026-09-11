# Operational Test: `td_browser_navigate`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 110ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_307_td_browser_navigate",
  "method": "tools/call",
  "params": {
    "name": "td_browser_navigate",
    "arguments": {
      "url": "https://example.test/fixture"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_307_td_browser_navigate",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"action\":\"navigate\",\"url\":\"https://example.test/fixture\",\"routedTo\":\"execute_javascript\",\"result\":{\"status\":\"EXECUTED_SUCCESSFULLY\",\"executionId\":\"js_mtx86s6m_30\",\"durationMs\":1,\"result\":\"https://app.internal/dashboard\",\"consoleOutput\":[],\"domChanged\":false,\"domLengthBefore\":4594,\"domLengthAfter\":4594,\"world\":\"ISOLATED\",\"timeoutMs\":5000,\"codePreview\":\"window.location.href = \\\"https://example.test/fixture\\\"; return window.location.href;\"},\"tool\":\"td_browser_navigate\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"side-effects\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, action, url, routedTo, result, tool, capability
