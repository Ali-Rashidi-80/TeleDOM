# Operational Test: `compare_extension_states`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5009ms

## Test Objective
Captures and compares clean vs injected DOM state

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_031_compare_extension_states",
  "method": "tools/call",
  "params": {
    "name": "compare_extension_states",
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
  "id": "op_req_031_compare_extension_states",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"comparisonSuccess\": true,\n  \"extensionId\": \"forensic-recorder@mcpdom\",\n  \"tabId\": \"active\",\n  \"cleanState\": {\n    \"domLengthChars\": 4405\n  },\n  \"injectedState\": {\n    \"domLengthChars\": 4405\n  },\n  \"analysis\": {\n    \"domSizeDifferenceChars\": 0,\n    \"injectedMarkersDetected\": [],\n    \"summary\": \"Comparison complete. Clean DOM: 4405 chars, Injected DOM: 4405 chars (Delta: 0 chars). Detected injected markers: none.\"\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Captures and compares clean vs injected DOM state**: comparisonSuccess, extensionId, tabId, cleanState, injectedState, analysis
