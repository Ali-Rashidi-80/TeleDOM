# Operational Test: `fx_a11y_divergence`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 7ms

## Test Objective
Reports DOM vs accessibility divergences

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_194_fx_a11y_divergence",
  "method": "tools/call",
  "params": {
    "name": "fx_a11y_divergence",
    "arguments": {
      "sessionId": "operational_acceptance_session_001"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_194_fx_a11y_divergence",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"a11yTree\": [\n    {\n      \"selector\": \"#search-input\",\n      \"role\": \"textbox\",\n      \"name\": \"\",\n      \"accessible\": true,\n      \"hiddenFromA11y\": false,\n      \"interactive\": true,\n      \"issues\": [\n        \"missing-name\"\n      ]\n    }\n  ],\n  \"divergence\": [\n    {\n      \"kind\": \"missing-name\",\n      \"selector\": \"#search-input\",\n      \"detail\": \"Interactive <input> role=textbox has NO accessible name (no aria-label, alt, label or text).\",\n      \"severity\": \"error\"\n    }\n  ],\n  \"summary\": {\n    \"domElements\": 5,\n    \"accessibleNodes\": 5,\n    \"interactiveWithoutName\": 1,\n    \"hiddenButRelevant\": 0,\n    \"divergenceCount\": 1\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Reports DOM vs accessibility divergences**: sessionId, a11yTree, divergence, summary
