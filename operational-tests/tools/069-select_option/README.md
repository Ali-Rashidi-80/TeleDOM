# Operational Test: `select_option`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 315ms

## Test Objective
Selects dropdown option with change event

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_069_select_option",
  "method": "tools/call",
  "params": {
    "name": "select_option",
    "arguments": {
      "selector": "#category-select",
      "value": "opt-security"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_069_select_option",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"action\": \"select_option\",\n  \"target\": {\n    \"tag\": \"select\",\n    \"id\": \"category-select\",\n    \"classes\": [\n      \"input-field\"\n    ],\n    \"role\": \"combobox\",\n    \"text\": \"\\n          Default Option\\n          Security Analysis\\n          Performance Trace\\n        \",\n    \"normalizedText\": \"Default Option Security Analysis Performance Trace\",\n    \"value\": \"opt-security\",\n    \"type\": \"select-one\",\n    \"selector\": \"#category-select\",\n    \"bestSelector\": \"#category-select\",\n    \"selectorCandidates\": [\n      \"#category-select\",\n      \"select.input-field\",\n      \"select.input-field\"\n    ],\n    \"bounds\": {\n      \"x\": 0,\n      \"y\": 0,\n      \"width\": 0,\n      \"height\": 0,\n      \"top\": 0,\n      \"right\": 0,\n      \"bottom\": 0,\n      \"left\": 0\n    },\n    \"visibility\": {\n      \"isVisible\": true,\n      \"display\": \"inline\",\n      \"visibility\": \"visible\",\n      \"opacity\": 1,\n      \"pointerEvents\": \"auto\",\n      \"isClipped\": false,\n      \"isInViewport\": true,\n      \"zIndex\": \"auto\"\n    },\n    \"computedStyle\": {\n      \"display\": \"inline\",\n      \"visibility\": \"visible\",\n      \"opacity\": \"1\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"pointerEvents\": \"auto\",\n      \"overflow\": \"\",\n      \"boxSizing\": \"border-box\",\n      \"color\": \"rgb(248, 250, 252)\",\n      \"backgroundColor\": \"rgb(15, 23, 42)\",\n      \"fontSize\": \"medium\"\n    },\n    \"attributes\": {\n      \"id\": \"category-select\",\n      \"class\": \"input-field\"\n    },\n    \"state\": {\n      \"disabled\": false,\n      \"readOnly\": false,\n      \"focused\": false,\n      \"isShadowHost\": false,\n      \"hasShadowRoot\": false\n    },\n    \"context\": {\n      \"parentChain\": [\n        \"#interactive-section > div:nth-of-type(3)\",\n        \"#interactive-section\",\n        \"#main-content\",\n        \"body\"\n      ],\n      \"parentSelector\": \"#interactive-section > div:nth-of-type(3)\",\n      \"childrenSummary\": {\n        \"count\": 3,\n        \"tags\": [\n          \"option\",\n          \"option\",\n          \"option\"\n        ]\n      },\n      \"containingBlock\": \"#interactive-section > div:nth-of-type(3)\",\n      \"iframe\": null,\n      \"shadowRoot\": null\n    },\n    \"forensics\": {\n      \"logicalNodeId\": null,\n      \"creationSequence\": null,\n      \"lastMutationSequence\": null,\n      \"eventCount\": 0,\n      \"isRecorded\": false\n    }\n  },\n  \"beforeState\": {\n    \"tag\": \"select\",\n    \"id\": \"category-select\",\n    \"classes\": [\n      \"input-field\"\n    ],\n    \"role\": \"combobox\",\n    \"text\": \"\\n          Default Option\\n          Security Analysis\\n          Performance Trace\\n        \",\n    \"normalizedText\": \"Default Option Security Analysis Performance Trace\",\n    \"value\": \"opt-default\",\n    \"type\": \"select-one\",\n    \"selector\": \"#category-select\",\n    \"bestSelector\": \"#category-select\",\n    \"selectorCandidates\": [\n      \"#category-select\",\n      \"select.input-field\",\n      \"select.input-field\"\n    ],\n    \"bounds\": {\n      \"x\": 0,\n      \"y\": 0,\n      \"width\": 0,\n      \"height\": 0,\n      \"top\": 0,\n      \"right\": 0,\n      \"bottom\": 0,\n      \"left\": 0\n    },\n    \"visibility\": {\n      \"isVisible\": true,\n      \"display\": \"inline\",\n      \"visibility\": \"visible\",\n      \"opacity\": 1,\n      \"pointerEvents\": \"auto\",\n      \"isClipped\": false,\n      \"isInViewport\": true,\n      \"zIndex\": \"auto\"\n    },\n    \"computedStyle\": {\n      \"display\": \"inline\",\n      \"visibility\": \"visible\",\n      \"opacity\": \"1\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"pointerEvents\": \"auto\",\n      \"overflow\": \"\",\n      \"boxSizing\": \"border-box\",\n      \"color\": \"rgb(248, 250, 252)\",\n      \"backgroundColor\": \"rgb(15, 23, 42)\",\n      \"fontSize\": \"medium\"\n    },\n    \"attributes\": {\n      \"id\": \"category-select\",\n      \"class\": \"input-field\"\n    },\n    \"state\": {\n      \"disabled\": false,\n      \"readOnly\": false,\n      \"focused\": false,\n      \"isShadowHost\": false,\n      \"hasShadowRoot\": false\n    },\n    \"context\": {\n      \"parentChain\": [\n        \"#interactive-section > div:nth-of-type(3)\",\n        \"#interactive-section\",\n        \"#main-content\",\n        \"body\"\n      ],\n      \"parentSelector\": \"#interactive-section > div:nth-of-type(3)\",\n      \"childrenSummary\": {\n        \"count\": 3,\n        \"tags\": [\n          \"option\",\n          \"option\",\n          \"option\"\n        ]\n      },\n      \"containingBlock\": \"#interactive-section > div:nth-of-type(3)\",\n      \"iframe\": null,\n      \"shadowRoot\": null\n    },\n    \"forensics\": {\n      \"logicalNodeId\": null,\n      \"creationSequence\": null,\n      \"lastMutationSequence\": null,\n      \"eventCount\": 0,\n      \"isRecorded\": false\n    }\n  },\n  \"afterState\": {\n    \"tag\": \"select\",\n    \"id\": \"category-select\",\n    \"classes\": [\n      \"input-field\"\n    ],\n    \"role\": \"combobox\",\n    \"text\": \"\\n          Default Option\\n          Security Analysis\\n          Performance Trace\\n        \",\n    \"normalizedText\": \"Default Option Security Analysis Performance Trace\",\n    \"value\": \"opt-security\",\n    \"type\": \"select-one\",\n    \"selector\": \"#category-select\",\n    \"bestSelector\": \"#category-select\",\n    \"selectorCandidates\": [\n      \"#category-select\",\n      \"select.input-field\",\n      \"select.input-field\"\n    ],\n    \"bounds\": {\n      \"x\": 0,\n      \"y\": 0,\n      \"width\": 0,\n      \"height\": 0,\n      \"top\": 0,\n      \"right\": 0,\n      \"bottom\": 0,\n      \"left\": 0\n    },\n    \"visibility\": {\n      \"isVisible\": true,\n      \"display\": \"inline\",\n      \"visibility\": \"visible\",\n      \"opacity\": 1,\n      \"pointerEvents\": \"auto\",\n      \"isClipped\": false,\n      \"isInViewport\": true,\n      \"zIndex\": \"auto\"\n    },\n    \"computedStyle\": {\n      \"display\": \"inline\",\n      \"visibility\": \"visible\",\n      \"opacity\": \"1\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"pointerEvents\": \"auto\",\n      \"overflow\": \"\",\n      \"boxSizing\": \"border-box\",\n      \"color\": \"rgb(248, 250, 252)\",\n      \"backgroundColor\": \"rgb(15, 23, 42)\",\n      \"fontSize\": \"medium\"\n    },\n    \"attributes\": {\n      \"id\": \"category-select\",\n      \"class\": \"input-field\"\n    },\n    \"state\": {\n      \"disabled\": false,\n      \"readOnly\": false,\n      \"focused\": false,\n      \"isShadowHost\": false,\n      \"hasShadowRoot\": false\n    },\n    \"context\": {\n      \"parentChain\": [\n        \"#interactive-section > div:nth-of-type(3)\",\n        \"#interactive-section\",\n        \"#main-content\",\n        \"body\"\n      ],\n      \"parentSelector\": \"#interactive-section > div:nth-of-type(3)\",\n      \"childrenSummary\": {\n        \"count\": 3,\n        \"tags\": [\n          \"option\",\n          \"option\",\n          \"option\"\n        ]\n      },\n      \"containingBlock\": \"#interactive-section > div:nth-of-type(3)\",\n      \"iframe\": null,\n      \"shadowRoot\": null\n    },\n    \"forensics\": {\n      \"logicalNodeId\": null,\n      \"creationSequence\": null,\n      \"lastMutationSequence\": null,\n      \"eventCount\": 0,\n      \"isRecorded\": false\n    }\n  },\n  \"effects\": {\n    \"domMutations\": 0,\n    \"consoleErrors\": 0,\n    \"networkRequests\": 0,\n    \"runtimeErrors\": []\n  },\n  \"durationMs\": 310,\n  \"stabilized\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Selects dropdown option with change event**: success, action, target, beforeState, afterState, effects, durationMs, stabilized
