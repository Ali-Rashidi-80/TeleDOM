# Operational Test: `dt_list_console_messages`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 0ms

## Test Objective
Lists the unified console log

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_147_dt_list_console_messages",
  "method": "tools/call",
  "params": {
    "name": "dt_list_console_messages",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_147_dt_list_console_messages",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 0,\n  \"ingested\": 0,\n  \"messages\": [],\n  \"mode\": {\n    \"mode\": \"SIMULATED\",\n    \"simulated\": true,\n    \"note\": \"JSDOM fixture DOM — deterministic simulation contract, not a real browser page.\",\n    \"source\": \"jsdom-fixture\"\n  },\n  \"note\": \"Unified console log is empty in this context. With the extension connected, pass ingestTabId to pull the tab capture first.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists the unified console log**: total, ingested, messages, mode, note
