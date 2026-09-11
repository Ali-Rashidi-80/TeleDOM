# Operational Test: `fx_network_dom_binding`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 12ms

## Test Objective
Binds responses to DOM regions with confidence

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_191_fx_network_dom_binding",
  "method": "tools/call",
  "params": {
    "name": "fx_network_dom_binding",
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
  "id": "op_req_191_fx_network_dom_binding",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"bindings\": [\n    {\n      \"requestUrl\": \"https://api.internal/v1/analyze\",\n      \"requestEventId\": \"evt_op_005\",\n      \"responseEventId\": \"evt_op_005\",\n      \"responseStatus\": 200,\n      \"boundRegions\": [\n        {\n          \"selector\": \"#host-sidebar\",\n          \"nodeId\": 4,\n          \"mutationType\": \"DOM_MUTATION_REMOVE\",\n          \"summary\": \"- <?> node=4 subtree=2\",\n          \"delayMs\": 100\n        }\n      ],\n      \"confidence\": 0.93,\n      \"band\": \"VERY_HIGH\"\n    }\n  ],\n  \"unboundRequests\": []\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Binds responses to DOM regions with confidence**: sessionId, bindings, unboundRequests
