# Operational Test: `dt_execute_webmcp_tool`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 1ms

## Test Objective
Executes the registered WebMCP tool

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_175_dt_execute_webmcp_tool",
  "method": "tools/call",
  "params": {
    "name": "dt_execute_webmcp_tool",
    "arguments": {
      "toolName": "fixture-webmcp-tool",
      "args": {
        "query": "test"
      }
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_175_dt_execute_webmcp_tool",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"ran\": true,\n  \"toolName\": \"fixture-webmcp-tool\",\n  \"pageId\": \"page_1\",\n  \"output\": {\n    \"tool\": \"fixture-webmcp-tool\",\n    \"received\": {\n      \"query\": \"test\"\n    }\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Executes the registered WebMCP tool**: ran, toolName, pageId, output
