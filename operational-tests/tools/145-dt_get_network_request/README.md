# Operational Test: `dt_get_network_request`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 0ms

## Test Objective
Inspects a captured network request in full

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_145_dt_get_network_request",
  "method": "tools/call",
  "params": {
    "name": "dt_get_network_request",
    "arguments": {
      "requestId": "req_1"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_145_dt_get_network_request",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"requestId\": \"req_1\",\n  \"url\": \"https://app.internal/api/seeded-request\",\n  \"method\": \"GET\",\n  \"status\": 200,\n  \"failed\": false,\n  \"startTime\": 1789100363104\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Inspects a captured network request in full**: requestId, url, method, status, failed, startTime
