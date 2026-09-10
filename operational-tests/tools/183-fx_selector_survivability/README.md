# Operational Test: `fx_selector_survivability`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Scores selector survivability with breakdown

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_183_fx_selector_survivability",
  "method": "tools/call",
  "params": {
    "name": "fx_selector_survivability",
    "arguments": {
      "selector": "#injected-action-btn",
      "sessionId": "operational_acceptance_session_001"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_183_fx_selector_survivability",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"ranked\": [\n    {\n      \"selector\": \"#injected-action-btn\",\n      \"survivability\": 0.822,\n      \"band\": \"ROBUST\",\n      \"breakdown\": {\n        \"domStability\": 0.76,\n        \"semanticStability\": 0.55,\n        \"uniqueness\": 0.92,\n        \"ancestryStability\": 0.85,\n        \"frameworkAttributeRisk\": 1,\n        \"textVolatility\": 0.9,\n        \"positionDependence\": 0.9\n      },\n      \"evidenceCount\": 4,\n      \"notes\": [\n        \"ID-based selector: high uniqueness.\",\n        \"2 recorded mutation(s) touched this element.\"\n      ]\n    }\n  ],\n  \"method\": \"Weighted: DOM stability 25%, uniqueness 20%, semantics 15%, ancestry 15%, framework risk 10%, text 7.5%, position 7.5%.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Scores selector survivability with breakdown**: ranked, method
