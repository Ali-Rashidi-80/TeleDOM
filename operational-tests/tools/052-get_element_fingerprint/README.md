# Operational Test: `get_element_fingerprint`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Computes structural fingerprint with volatility assessment

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_052_get_element_fingerprint",
  "method": "tools/call",
  "params": {
    "name": "get_element_fingerprint",
    "arguments": {
      "selector": "#search-input"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_052_get_element_fingerprint",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"fingerprintId\": \"fp_a7b39227\",\n  \"hash\": \"a7b39227\",\n  \"tagHierarchy\": [\n    \"main\",\n    \"section\",\n    \"div\",\n    \"input\"\n  ],\n  \"stableAttributes\": {\n    \"id\": \"search-input\",\n    \"type\": \"text\",\n    \"placeholder\": \"Type here...\"\n  },\n  \"meaningfulText\": \"\",\n  \"classes\": [\n    \"input-field\"\n  ],\n  \"role\": \"textbox\",\n  \"dimensions\": {\n    \"width\": 0,\n    \"height\": 0\n  },\n  \"ancestorPattern\": \"main>section>div>input\",\n  \"descendantPattern\": \"\",\n  \"volatilityRisk\": \"low\",\n  \"volatilityReasons\": []\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Computes structural fingerprint with volatility assessment**: fingerprintId, hash, tagHierarchy, stableAttributes, meaningfulText, classes, role, dimensions, ancestorPattern, descendantPattern, volatilityRisk, volatilityReasons
