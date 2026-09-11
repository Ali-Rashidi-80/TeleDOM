# Operational Test: `diagnose_selector_failure`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Diagnoses selector failure with parse validity and relaxation attempts

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_050_diagnose_selector_failure",
  "method": "tools/call",
  "params": {
    "name": "diagnose_selector_failure",
    "arguments": {
      "selector": "#nonexistent-stale-selector"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_050_diagnose_selector_failure",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"selector\": \"#nonexistent-stale-selector\",\n  \"valid\": true,\n  \"matches\": 0,\n  \"closestWorkingSelectors\": [],\n  \"diagnosis\": [\n    \"Selector parses but matches nothing — element may be removed, re-rendered, or inside a shadow root.\"\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Diagnoses selector failure with parse validity and relaxation attempts**: selector, valid, matches, closestWorkingSelectors, diagnosis
