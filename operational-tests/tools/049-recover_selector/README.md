# Operational Test: `recover_selector`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 7ms

## Test Objective
Attempts safe recovery with fingerprint scoring and diagnostics

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_049_recover_selector",
  "method": "tools/call",
  "params": {
    "name": "recover_selector",
    "arguments": {
      "selector": "#nonexistent-stale-selector",
      "snapshot": {
        "tag": "input",
        "text": "",
        "classes": [
          "input-field"
        ],
        "stableAttributes": {
          "type": "text"
        }
      }
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_049_recover_selector",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"recovered\": false,\n  \"confidence\": 0.58,\n  \"strategy\": \"recovery-refused\",\n  \"resolvedSelector\": \"#search-input\",\n  \"alternatives\": [\n    {\n      \"selector\": \"#search-input\",\n      \"confidence\": 0.58,\n      \"strategy\": \"recovery-match\"\n    },\n    {\n      \"selector\": \"#report-file-input\",\n      \"confidence\": 0.38,\n      \"strategy\": \"recovery-match\"\n    },\n    {\n      \"selector\": \"#username-input\",\n      \"confidence\": 0.38,\n      \"strategy\": \"recovery-match\"\n    }\n  ],\n  \"diagnostics\": [\n    \"selector no longer matches any element\",\n    \"collected 8 candidate elements for scoring\",\n    \"best candidate score: 0.575 (margin 0.200)\",\n    \"  - tag: 100%\",\n    \"  - classes: 100%\",\n    \"  - attributes: 100%\",\n    \"  - childCount: 50%\"\n  ],\n  \"recommendation\": \"Recovery refused: best match is not confident enough or too close to a competing element. Inspect alternatives manually before acting — refusing to avoid acting on a wrong element.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Attempts safe recovery with fingerprint scoring and diagnostics**: recovered, confidence, strategy, resolvedSelector, alternatives, diagnostics, recommendation
