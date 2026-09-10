# Operational Test: `dt_lighthouse_audit`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 0ms

## Test Objective
Reports Lighthouse CDP requirement

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_153_dt_lighthouse_audit",
  "method": "tools/call",
  "params": {
    "name": "dt_lighthouse_audit",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_153_dt_lighthouse_audit",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"ran\": false,\n  \"mode\": \"UNAVAILABLE\",\n  \"note\": \"Lighthouse audits require a live DevTools connection. Audit results are never synthesized in simulation.\",\n  \"pageId\": \"page_1\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Reports Lighthouse CDP requirement**: ran, mode, note, pageId
