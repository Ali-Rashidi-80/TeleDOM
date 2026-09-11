# Operational Test: `analyze_dom`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 35ms

## Test Objective
Runs named DOM analyzer with structured results

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_057_analyze_dom",
  "method": "tools/call",
  "params": {
    "name": "analyze_dom",
    "arguments": {
      "analyzer": "census_interactive_elements"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_057_analyze_dom",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"analyzer\": \"census_interactive_elements\",\n  \"summary\": \"10 interactive elements: textbox×4, button×2, combobox×1, checkbox×1, radio×2\",\n  \"count\": 10,\n  \"items\": [\n    {\n      \"selector\": \"#search-input\",\n      \"tag\": \"input\",\n      \"role\": \"textbox\",\n      \"text\": \"\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"#primary-action-btn\",\n      \"tag\": \"button\",\n      \"role\": \"button\",\n      \"text\": \"⚡ Run Analysis\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"#category-select\",\n      \"tag\": \"select\",\n      \"role\": \"combobox\",\n      \"text\": \"\\n          Default Option\\n          Secu\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"#feature-toggle\",\n      \"tag\": \"input\",\n      \"role\": \"checkbox\",\n      \"text\": \"\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"#report-file-input\",\n      \"tag\": \"input\",\n      \"role\": \"textbox\",\n      \"text\": \"\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"#username-input\",\n      \"tag\": \"input\",\n      \"role\": \"textbox\",\n      \"text\": \"\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"#password-input\",\n      \"tag\": \"input\",\n      \"role\": \"textbox\",\n      \"text\": \"\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"input\",\n      \"tag\": \"input\",\n      \"role\": \"radio\",\n      \"text\": \"\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"input\",\n      \"tag\": \"input\",\n      \"role\": \"radio\",\n      \"text\": \"\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    },\n    {\n      \"selector\": \"#settings-submit-btn\",\n      \"tag\": \"button\",\n      \"role\": \"button\",\n      \"text\": \"Save Settings\",\n      \"visible\": true,\n      \"disabled\": false,\n      \"inViewport\": true\n    }\n  ],\n  \"warnings\": [],\n  \"truncated\": false\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Runs named DOM analyzer with structured results**: analyzer, summary, count, items, warnings, truncated
