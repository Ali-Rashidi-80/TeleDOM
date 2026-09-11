# Operational Test: `dt_wait_for`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 2ms

## Test Objective
Waits for load state

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_138_dt_wait_for",
  "method": "tools/call",
  "params": {
    "name": "dt_wait_for",
    "arguments": {
      "condition": "load",
      "timeoutMs": 1000
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_138_dt_wait_for",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"condition\": \"load\",\n  \"met\": true,\n  \"waitedMs\": 0,\n  \"pageId\": \"page_1\",\n  \"state\": {\n    \"readyState\": \"complete\",\n    \"inflight\": 0\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Waits for load state**: condition, met, waitedMs, pageId, state
