# Operational Test: `fx_visual_regression_forensics`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 20ms

## Test Objective
Visual regression forensics with explicit evidence availability

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_178_fx_visual_regression_forensics",
  "method": "tools/call",
  "params": {
    "name": "fx_visual_regression_forensics",
    "arguments": {
      "sessionId": "operational_acceptance_session_001",
      "t1": 0,
      "t2": 400
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_178_fx_visual_regression_forensics",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"visualEvidenceAvailable\": false,\n  \"screenshots\": {\n    \"before\": {\n      \"label\": \"no screenshot recorded\"\n    },\n    \"after\": {\n      \"label\": \"no screenshot recorded\"\n    }\n  },\n  \"pixelDiff\": {\n    \"identical\": false,\n    \"changedRegionCount\": 0,\n    \"changedRegions\": [],\n    \"changeRatio\": 0\n  },\n  \"domCorrelation\": {\n    \"structuralChanges\": [\n      {\n        \"summary\": \"#host-sidebar: <div> removed\"\n      },\n      {\n        \"summary\": \"html > body: child count 2 → 1 (layout impact)\"\n      }\n    ],\n    \"styleChanges\": [],\n    \"likelyRootCauses\": [\n      {\n        \"cause\": \"Structural change: #host-sidebar: <div> removed\",\n        \"confidence\": 0.4,\n        \"band\": \"LOW\",\n        \"evidenceCount\": 2\n      },\n      {\n        \"cause\": \"Structural change: html > body: child count 2 → 1 (layout impact)\",\n        \"confidence\": 0.4,\n        \"band\": \"LOW\",\n        \"evidenceCount\": 2\n      }\n    ]\n  },\n  \"conclusion\": \"No screenshots recorded in this session — DOM-only analysis. Visual changes correlate with 2 structural and 0 style DOM changes; top candidates ranked in likelyRootCauses.\",\n  \"confidence\": 0.6,\n  \"band\": \"MEDIUM\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Visual regression forensics with explicit evidence availability**: sessionId, visualEvidenceAvailable, screenshots, pixelDiff, domCorrelation, conclusion, confidence, band
