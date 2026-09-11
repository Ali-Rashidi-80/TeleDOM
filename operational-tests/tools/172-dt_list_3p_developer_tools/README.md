# Operational Test: `dt_list_3p_developer_tools`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 4ms

## Test Objective
Probes third-party developer tool registrations

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_172_dt_list_3p_developer_tools",
  "method": "tools/call",
  "params": {
    "name": "dt_list_3p_developer_tools",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_172_dt_list_3p_developer_tools",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"total\": 0,\n  \"tools\": [],\n  \"pageId\": \"page_1\",\n  \"contract\": \"Tools expose { id, run(args) } on window.__devtools_3p_tools. Execution via dt_execute_3p_developer_tool with validated args.\",\n  \"note\": \"No third-party developer tools registered by this page (window.__devtools_3p_tools).\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Probes third-party developer tool registrations**: total, tools, pageId, contract, note
