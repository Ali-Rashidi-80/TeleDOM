# Operational Test: `dt_list_webmcp_tools`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 3ms

## Test Objective
Probes WebMCP registrations

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_174_dt_list_webmcp_tools",
  "method": "tools/call",
  "params": {
    "name": "dt_list_webmcp_tools",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_174_dt_list_webmcp_tools",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 0,\n  \"tools\": [],\n  \"pageId\": \"page_1\",\n  \"contract\": \"WebMCP tools are exposed by the page (navigator.webMCP). Execution via dt_execute_webmcp_tool.\",\n  \"note\": \"No WebMCP tools exposed by this page (navigator.webMCP). WebMCP is a draft API — pages must opt in.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Probes WebMCP registrations**: total, tools, pageId, contract, note
