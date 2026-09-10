# Operational Test: `get_page_blueprint`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 6ms

## Test Objective
Generates page blueprint with sections and interactive inventory

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_058_get_page_blueprint",
  "method": "tools/call",
  "params": {
    "name": "get_page_blueprint",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_058_get_page_blueprint",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"schemaVersion\": \"1.0.0\",\n  \"pageId\": \"live\",\n  \"generatedAt\": 1788988531873,\n  \"majorSections\": [\n    {\n      \"name\": \"banner_1\",\n      \"tag\": \"header\",\n      \"selector\": \"#fixture-header\",\n      \"role\": \"banner\",\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0\n      },\n      \"childrenSummary\": \"3 children (h1, p, span)\",\n      \"visible\": false\n    },\n    {\n      \"name\": \"main_2\",\n      \"tag\": \"main\",\n      \"selector\": \"#main-content\",\n      \"role\": \"main\",\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0\n      },\n      \"childrenSummary\": \"3 children (section, section, section)\",\n      \"visible\": false\n    },\n    {\n      \"name\": \"region_3\",\n      \"tag\": \"section\",\n      \"selector\": \"#interactive-section\",\n      \"role\": \"region\",\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0\n      },\n      \"childrenSummary\": \"7 children (h2, div, div, div, div)\",\n      \"visible\": false\n    },\n    {\n      \"name\": \"region_4\",\n      \"tag\": \"section\",\n      \"selector\": \"#mutation-target-container\",\n      \"role\": \"region\",\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0\n      },\n      \"childrenSummary\": \"2 children (h2, div)\",\n      \"visible\": false\n    },\n    {\n      \"name\": \"region_5\",\n      \"tag\": \"section\",\n      \"selector\": \"#form-section\",\n      \"role\": \"region\",\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0\n      },\n      \"childrenSummary\": \"2 children (h2, form)\",\n      \"visible\": false\n    },\n    {\n      \"name\": \"contentinfo_6\",\n      \"tag\": \"footer\",\n      \"selector\": \"#fixture-footer\",\n      \"role\": \"contentinfo\",\n      \"bounds\": {\n        \"x\": 0,\n        \"y\": 0,\n        \"width\": 0,\n        \"height\": 0\n      },\n      \"childrenSummary\": \"1 children (p)\",\n      \"visible\": false\n    }\n  ],\n  \"hierarchy\": {\n    \"node\": \"page\",\n    \"label\": \"MCP Operational Acceptance DOM Fixture\",\n    \"children\": [\n      {\n        \"node\": \"#fixture-header\",\n        \"label\": \"banner_1\",\n        \"children\": []\n      },\n      {\n        \"node\": \"#main-content\",\n        \"label\": \"main_2\",\n        \"children\": []\n      },\n      {\n        \"node\": \"#interactive-section\",\n        \"label\": \"region_3\",\n        \"children\": []\n      },\n      {\n        \"node\": \"#mutation-target-container\",\n        \"label\": \"region_4\",\n        \"children\": []\n      },\n      {\n        \"node\": \"#form-section\",\n        \"label\": \"region_5\",\n        \"children\": []\n      },\n      {\n        \"node\": \"#fixture-footer\",\n        \"label\": \"contentinfo_6\",\n        \"children\": []\n      }\n    ]\n  },\n  \"keyInteractiveElements\": [\n    {\n      \"selector\": \"#search-input\",\n      \"role\": \"input\",\n      \"text\": \"Type here...\",\n      \"section\": \"main_2\"\n    },\n    {\n      \"selector\": \"#primary-action-btn\",\n      \"role\": \"button\",\n      \"text\": \"⚡ Run Analysis\",\n      \"section\": \"main_2\"\n    },\n    {\n      \"selector\": \"#category-select\",\n      \"role\": \"select\",\n      \"text\": \" \",\n      \"section\": \"main_2\"\n    },\n    {\n      \"selector\": \"#username-input\",\n      \"role\": \"input\",\n      \"text\": \"user name\",\n      \"section\": \"main_2\"\n    },\n    {\n      \"selector\": \"#settings-submit-btn\",\n      \"role\": \"button\",\n      \"text\": \"Save Settings\",\n      \"section\": \"main_2\"\n    }\n  ],\n  \"repeatedComponents\": [],\n  \"layoutRelationships\": [\n    \"6 major sections stacked in document order\"\n  ],\n  \"semanticRegions\": [\n    \"banner\",\n    \"main\",\n    \"region\",\n    \"contentinfo\"\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Generates page blueprint with sections and interactive inventory**: schemaVersion, pageId, generatedAt, majorSections, hierarchy, keyInteractiveElements, repeatedComponents, layoutRelationships, semanticRegions
