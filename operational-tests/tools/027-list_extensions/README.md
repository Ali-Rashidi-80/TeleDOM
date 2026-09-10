# Operational Test: `list_extensions`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 0ms

## Test Objective


## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_027_list_extensions",
  "method": "tools/call",
  "params": {
    "name": "list_extensions",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_027_list_extensions",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"simulated\": true,\n  \"extensions\": [\n    {\n      \"id\": \"forensic-recorder@mcpdom\",\n      \"name\": \"Browser Forensic Recorder (MCPDOM)\",\n      \"version\": \"3.0.0\",\n      \"description\": \"The MCPDOM platform extension itself\",\n      \"enabled\": true,\n      \"installType\": \"development\",\n      \"isApp\": false,\n      \"permissions\": [\n        \"activeTab\",\n        \"scripting\",\n        \"storage\",\n        \"tabs\",\n        \"management\"\n      ]\n    }\n  ],\n  \"note\": \"Deterministic simulated extension state.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] ****: simulated, extensions, note
