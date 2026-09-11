# Operational Test: `dt_list_network_requests`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 1ms

## Test Objective
Lists the unified network log

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_144_dt_list_network_requests",
  "method": "tools/call",
  "params": {
    "name": "dt_list_network_requests",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_144_dt_list_network_requests",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 0,\n  \"ingested\": 0,\n  \"requests\": [],\n  \"mode\": {\n    \"mode\": \"SIMULATED\",\n    \"simulated\": true,\n    \"note\": \"JSDOM fixture DOM — deterministic simulation contract, not a real browser page.\",\n    \"source\": \"jsdom-fixture\"\n  },\n  \"note\": \"Unified network log is empty in this context. With the extension connected, pass ingestTabId to pull the tab capture first; session analysis uses fx_resource_waterfall with a recorded session.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists the unified network log**: total, ingested, requests, mode, note
