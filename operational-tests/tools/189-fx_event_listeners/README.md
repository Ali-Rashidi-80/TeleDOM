# Operational Test: `fx_event_listeners`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Inventories event listeners with coverage reporting

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_189_fx_event_listeners",
  "method": "tools/call",
  "params": {
    "name": "fx_event_listeners",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_189_fx_event_listeners",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"scope\": \"document\",\n  \"scannedElements\": 63,\n  \"listenerCount\": 0,\n  \"byType\": {},\n  \"topElements\": [],\n  \"frameworkOwnedCount\": 0,\n  \"instrumentationActive\": false,\n  \"listeners\": [],\n  \"coverage\": {\n    \"inlineAttributes\": 0,\n    \"addEventListener\": 0\n  },\n  \"notes\": [\n    \"Instrumentation is NOT active in this context: only inline on* attributes are directly observable. To capture addEventListener registrations, load the page with the MCPDOM injected page script (instrumentation patches addEventListener at document_start).\",\n    \"Framework ownership is inferred from handler source markers — heuristics, never claimed as authoritative.\"\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Inventories event listeners with coverage reporting**: scope, scannedElements, listenerCount, byType, topElements, frameworkOwnedCount, instrumentationActive, listeners, coverage, notes
