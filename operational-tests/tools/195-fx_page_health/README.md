# Operational Test: `fx_page_health`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 16ms

## Test Objective
Computes the composite page health with subscores

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_195_fx_page_health",
  "method": "tools/call",
  "params": {
    "name": "fx_page_health",
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
  "id": "op_req_195_fx_page_health",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"overall\": 98,\n  \"grade\": \"A\",\n  \"subscores\": [\n    {\n      \"key\": \"console\",\n      \"score\": 100,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"0 error(s), 0 warning(s) recorded.\",\n      \"metrics\": {\n        \"errors\": 0,\n        \"warnings\": 0\n      }\n    },\n    {\n      \"key\": \"network\",\n      \"score\": 100,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"0 failed of 2 requests (0.0%).\",\n      \"metrics\": {\n        \"total\": 2,\n        \"failed\": 0\n      }\n    },\n    {\n      \"key\": \"accessibility\",\n      \"score\": 85,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"1 critical + 0 moderate a11y divergences (missing names, alt, semantics).\",\n      \"metrics\": {\n        \"errors\": 1,\n        \"warnings\": 0,\n        \"interactiveWithoutName\": 1\n      }\n    },\n    {\n      \"key\": \"performance\",\n      \"score\": 100,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"LCP=n/ams INP=n/ams CLS=n/a mutations=2.\",\n      \"metrics\": {\n        \"domMutations\": 2\n      }\n    },\n    {\n      \"key\": \"memory\",\n      \"score\": 100,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"0 memory warning(s) recorded.\",\n      \"metrics\": {\n        \"warnings\": 0\n      }\n    },\n    {\n      \"key\": \"layout-stability\",\n      \"score\": 100,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"0 layout-affecting mutations + 0 style changes.\",\n      \"metrics\": {\n        \"styleChanges\": 0,\n        \"layoutMutations\": 0\n      }\n    },\n    {\n      \"key\": \"interactions\",\n      \"score\": 100,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"0 failed interaction(s) of 1 user events.\",\n      \"metrics\": {\n        \"failed\": 0,\n        \"userEvents\": 1\n      }\n    },\n    {\n      \"key\": \"dom-anomalies\",\n      \"score\": 100,\n      \"status\": \"HEALTHY\",\n      \"detail\": \"0 large subtree removal(s) (possible re-render churn).\",\n      \"metrics\": {\n        \"subtreeRemovals\": 0,\n        \"totalRemovals\": 1\n      }\n    }\n  ],\n  \"topIssues\": [\n    {\n      \"area\": \"a11y\",\n      \"issue\": \"missing-name: #search-input\",\n      \"severity\": \"error\"\n    }\n  ],\n  \"methodology\": \"Weighted composite: console 20%, network 20%, performance 20%, a11y 15%, layout stability 10%, memory/interactions/DOM anomalies 5% each. Every subscore is independently inspectable above.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Computes the composite page health with subscores**: sessionId, overall, grade, subscores, topIssues, methodology
