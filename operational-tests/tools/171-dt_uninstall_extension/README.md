# Operational Test: `dt_uninstall_extension`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 1ms

## Test Objective
Soft-uninstalls (disables) the extension

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_171_dt_uninstall_extension",
  "method": "tools/call",
  "params": {
    "name": "dt_uninstall_extension",
    "arguments": {
      "extensionId": "forensic-recorder@mcpdom"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_171_dt_uninstall_extension",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"uninstalled\": true,\n  \"softUninstall\": true,\n  \"extensionId\": \"forensic-recorder@mcpdom\",\n  \"note\": \"Disabled via chrome.management (soft uninstall). Hard removal requires user confirmation in chrome://extensions — never auto-destroyed.\",\n  \"detail\": {\n    \"extensionId\": \"forensic-recorder@mcpdom\",\n    \"enabled\": false,\n    \"simulated\": true\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Soft-uninstalls (disables) the extension**: uninstalled, softUninstall, extensionId, note, detail
