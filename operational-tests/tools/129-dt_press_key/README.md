# Operational Test: `dt_press_key`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 3ms

## Test Objective
Presses the key on the focused context

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_129_dt_press_key",
  "method": "tools/call",
  "params": {
    "name": "dt_press_key",
    "arguments": {
      "key": "Enter"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_129_dt_press_key",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"performed\": \"press_key\",\n  \"selector\": \"body\",\n  \"pageId\": \"page_1\",\n  \"interaction\": {\n    \"success\": true,\n    \"action\": \"press_key\",\n    \"target\": {\n      \"tag\": \"body\",\n      \"classes\": [],\n      \"text\": \"\\n  \\n    Operational DOM Test Fixture\\n    Deterministic test harness for live & historical MCP capabilities\\n    ACTIVE_VERSION_2.0\\n  \\n\\n  \\n    \\n      Interactive Form Controls\\n      \\n        Search Inpu\",\n      \"normalizedText\": \"Operational DOM Test Fixture Deterministic test harness for live & historical MCP capabilities ACTIVE_VERSION_2.0 Interactive Form Controls Search Input: ⚡ Run Analysis Clicks: 0 Category: Default Opt\",\n      \"selector\": \"body\",\n      \"bestSelector\": \"body\",\n      \"selectorCandidates\": [\n        \"body\"\n      ],\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0,\n        \"top\": 0,\n        \"right\": 0,\n        \"bottom\": 0,\n        \"left\": 0\n      },\n      \"visibility\": {\n        \"isVisible\": true,\n        \"display\": \"block\",\n        \"visibility\": \"visible\",\n        \"opacity\": 1,\n        \"pointerEvents\": \"auto\",\n        \"isClipped\": false,\n        \"isInViewport\": true,\n        \"zIndex\": \"auto\"\n      },\n      \"computedStyle\": {\n        \"display\": \"block\",\n        \"visibility\": \"visible\",\n        \"opacity\": \"1\",\n        \"position\": \"static\",\n        \"zIndex\": \"auto\",\n        \"pointerEvents\": \"auto\",\n        \"overflow\": \"\",\n        \"boxSizing\": \"content-box\",\n        \"color\": \"rgb(248, 250, 252)\",\n        \"backgroundColor\": \"rgb(15, 23, 42)\",\n        \"fontSize\": \"medium\"\n      },\n      \"attributes\": {\n        \"style\": \"cursor: default;\"\n      },\n      \"state\": {\n        \"disabled\": false,\n        \"readOnly\": false,\n        \"focused\": false,\n        \"isShadowHost\": false,\n        \"hasShadowRoot\": false\n      },\n      \"context\": {\n        \"parentChain\": [],\n        \"childrenSummary\": {\n          \"count\": 3,\n          \"tags\": [\n            \"header\",\n            \"main\",\n            \"footer\"\n          ]\n        },\n        \"iframe\": null,\n        \"shadowRoot\": null\n      },\n      \"forensics\": {\n        \"logicalNodeId\": null,\n        \"creationSequence\": null,\n        \"lastMutationSequence\": null,\n        \"eventCount\": 0,\n        \"isRecorded\": false\n      }\n    },\n    \"beforeState\": {\n      \"tag\": \"body\",\n      \"classes\": [],\n      \"text\": \"\\n  \\n    Operational DOM Test Fixture\\n    Deterministic test harness for live & historical MCP capabilities\\n    ACTIVE_VERSION_2.0\\n  \\n\\n  \\n    \\n      Interactive Form Controls\\n      \\n        Search Inpu\",\n      \"normalizedText\": \"Operational DOM Test Fixture Deterministic test harness for live & historical MCP capabilities ACTIVE_VERSION_2.0 Interactive Form Controls Search Input: ⚡ Run Analysis Clicks: 0 Category: Default Opt\",\n      \"selector\": \"body\",\n      \"bestSelector\": \"body\",\n      \"selectorCandidates\": [\n        \"body\"\n      ],\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0,\n        \"top\": 0,\n        \"right\": 0,\n        \"bottom\": 0,\n        \"left\": 0\n      },\n      \"visibility\": {\n        \"isVisible\": true,\n        \"display\": \"block\",\n        \"visibility\": \"visible\",\n        \"opacity\": 1,\n        \"pointerEvents\": \"auto\",\n        \"isClipped\": false,\n        \"isInViewport\": true,\n        \"zIndex\": \"auto\"\n      },\n      \"computedStyle\": {\n        \"display\": \"block\",\n        \"visibility\": \"visible\",\n        \"opacity\": \"1\",\n        \"position\": \"static\",\n        \"zIndex\": \"auto\",\n        \"pointerEvents\": \"auto\",\n        \"overflow\": \"\",\n        \"boxSizing\": \"content-box\",\n        \"color\": \"rgb(248, 250, 252)\",\n        \"backgroundColor\": \"rgb(15, 23, 42)\",\n        \"fontSize\": \"medium\"\n      },\n      \"attributes\": {\n        \"style\": \"cursor: default;\"\n      },\n      \"state\": {\n        \"disabled\": false,\n        \"readOnly\": false,\n        \"focused\": false,\n        \"isShadowHost\": false,\n        \"hasShadowRoot\": false\n      },\n      \"context\": {\n        \"parentChain\": [],\n        \"childrenSummary\": {\n          \"count\": 3,\n          \"tags\": [\n            \"header\",\n            \"main\",\n            \"footer\"\n          ]\n        },\n        \"iframe\": null,\n        \"shadowRoot\": null\n      },\n      \"forensics\": {\n        \"logicalNodeId\": null,\n        \"creationSequence\": null,\n        \"lastMutationSequence\": null,\n        \"eventCount\": 0,\n        \"isRecorded\": false\n      }\n    },\n    \"afterState\": {\n      \"tag\": \"body\",\n      \"classes\": [],\n      \"text\": \"\\n  \\n    Operational DOM Test Fixture\\n    Deterministic test harness for live & historical MCP capabilities\\n    ACTIVE_VERSION_2.0\\n  \\n\\n  \\n    \\n      Interactive Form Controls\\n      \\n        Search Inpu\",\n      \"normalizedText\": \"Operational DOM Test Fixture Deterministic test harness for live & historical MCP capabilities ACTIVE_VERSION_2.0 Interactive Form Controls Search Input: ⚡ Run Analysis Clicks: 0 Category: Default Opt\",\n      \"selector\": \"body\",\n      \"bestSelector\": \"body\",\n      \"selectorCandidates\": [\n        \"body\"\n      ],\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0,\n        \"top\": 0,\n        \"right\": 0,\n        \"bottom\": 0,\n        \"left\": 0\n      },\n      \"visibility\": {\n        \"isVisible\": true,\n        \"display\": \"block\",\n        \"visibility\": \"visible\",\n        \"opacity\": 1,\n        \"pointerEvents\": \"auto\",\n        \"isClipped\": false,\n        \"isInViewport\": true,\n        \"zIndex\": \"auto\"\n      },\n      \"computedStyle\": {\n        \"display\": \"block\",\n        \"visibility\": \"visible\",\n        \"opacity\": \"1\",\n        \"position\": \"static\",\n        \"zIndex\": \"auto\",\n        \"pointerEvents\": \"auto\",\n        \"overflow\": \"\",\n        \"boxSizing\": \"content-box\",\n        \"color\": \"rgb(248, 250, 252)\",\n        \"backgroundColor\": \"rgb(15, 23, 42)\",\n        \"fontSize\": \"medium\"\n      },\n      \"attributes\": {\n        \"style\": \"cursor: default;\"\n      },\n      \"state\": {\n        \"disabled\": false,\n        \"readOnly\": false,\n        \"focused\": false,\n        \"isShadowHost\": false,\n        \"hasShadowRoot\": false\n      },\n      \"context\": {\n        \"parentChain\": [],\n        \"childrenSummary\": {\n          \"count\": 3,\n          \"tags\": [\n            \"header\",\n            \"main\",\n            \"footer\"\n          ]\n        },\n        \"iframe\": null,\n        \"shadowRoot\": null\n      },\n      \"forensics\": {\n        \"logicalNodeId\": null,\n        \"creationSequence\": null,\n        \"lastMutationSequence\": null,\n        \"eventCount\": 0,\n        \"isRecorded\": false\n      }\n    },\n    \"effects\": {\n      \"domMutations\": 0,\n      \"consoleErrors\": 0,\n      \"networkRequests\": 0,\n      \"runtimeErrors\": []\n    },\n    \"durationMs\": 2,\n    \"stabilized\": true\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Presses the key on the focused context**: performed, selector, pageId, interaction
