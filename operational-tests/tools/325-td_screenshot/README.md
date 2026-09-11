# Operational Test: `td_screenshot`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 455ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_325_td_screenshot",
  "method": "tools/call",
  "params": {
    "name": "td_screenshot",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_325_td_screenshot",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"artifact\":\"screenshot\",\"result\":{\"truncated\":true,\"preview\":\"{\\\"screenshotId\\\":\\\"scr_1789147436600_q8s1\\\",\\\"timestamp\\\":1789147436600,\\\"url\\\":\\\"https://app.internal/dashboard\\\",\\\"viewport\\\":{\\\"width\\\":1280,\\\"height\\\":720,\\\"scrollX\\\":0,\\\"scrollY\\\":0,\\\"devicePixelRatio\\\":2.625},\\\"dataUrl\\\":\\\"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABQAAAALQCAYAAADPfd1WADhD80lEQVR4AQD//wAAAGNm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y2bx/2Nm8f9jZvH/Y\",\"bytes\":4916940},\"tool\":\"td_screenshot\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, artifact, result, tool, capability
