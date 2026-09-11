# Operational Test: `generate_reconstruction_spec`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Generates versioned reconstruction specification

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_114_generate_reconstruction_spec",
  "method": "tools/call",
  "params": {
    "name": "generate_reconstruction_spec",
    "arguments": {
      "projectName": "op-project"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_114_generate_reconstruction_spec",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"schemaVersion\": \"1.0.0\",\n  \"pageId\": \"page_mtx86oeo\",\n  \"projectId\": \"proj_mtx86oeo\",\n  \"generatedAt\": 1789147430238,\n  \"metadata\": {\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"capturedAt\": 1789147430160,\n    \"tool\": \"MCPDOM Browser\"\n  },\n  \"viewport\": {\n    \"width\": 1024,\n    \"height\": 768,\n    \"devicePixelRatio\": 1\n  },\n  \"structure\": {\n    \"domSnapshotFile\": \"dom/page_page_mtx86oeo.html\",\n    \"domHash\": \"a8fe71b2\",\n    \"nodeCount\": 4405\n  },\n  \"regions\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"name\": \"header_operational_dom_test_card\",\n      \"selector\": \"#fixture-header\",\n      \"selectorCandidates\": [\n        {\n          \"selector\": \"#fixture-header\",\n          \"strategy\": \"id\",\n          \"confidence\": 1,\n          \"unique\": true,\n          \"reasons\": [\n            \"unique stable id\",\n            \"matches exactly this element\"\n          ]\n        },\n        {\n          \"selector\": \"header.card\",\n          \"strategy\": \"class\",\n          \"confidence\": 0.72,\n          \"unique\": true,\n          \"reasons\": [\n            \"stable class names\",\n            \"matches exactly this element\"\n          ]\n        },\n        {\n          \"selector\": \"body > header\",\n          \"strategy\": \"structural-path\",\n          \"confidence\": 0.55,\n          \"unique\": true,\n          \"reasons\": [\n            \"position-based structural path\",\n            \"matches exactly this element\"\n          ]\n        }\n      ],\n      \"domFile\": \"dom/region_region_mtx86ofy_1.html\",\n      \"reconstructionRole\": \"#fixture-header\"\n    }\n  ],\n  \"hierarchy\": {\n    \"pageId\": \"page_mtx86oeo\",\n    \"nodes\": [\n      {\n        \"id\": \"page:page_mtx86oeo\",\n        \"name\": \"page\",\n        \"tag\": \"document\",\n        \"selector\": \"document\",\n        \"depth\": 0,\n        \"relationship\": \"page\"\n      },\n      {\n        \"id\": \"region_mtx86ofy_1\",\n        \"name\": \"header_operational_dom_test_card\",\n        \"tag\": \"#fixture-header\",\n        \"selector\": \"#fixture-header\",\n        \"depth\": 1,\n        \"relationship\": \"region\"\n      }\n    ],\n    \"edges\": [\n      {\n        \"from\": \"page:page_mtx86oeo\",\n        \"to\": \"region_mtx86ofy_1\",\n        \"relation\": \"contains\"\n      }\n    ]\n  },\n  \"semanticRoles\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"role\": \"#fixture-header\"\n    }\n  ],\n  \"visualConstraints\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"constraint\": \"display\",\n      \"value\": \"block\"\n    },\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"constraint\": \"position\",\n      \"value\": \"static\"\n    },\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"constraint\": \"flex-direction\",\n      \"value\": \"row\"\n    },\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"constraint\": \"background-color\",\n      \"value\": \"rgb(30, 41, 59)\"\n    },\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"constraint\": \"color\",\n      \"value\": \"rgb(248, 250, 252)\"\n    }\n  ],\n  \"interactions\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"interactive\": false,\n      \"action\": \"none\"\n    }\n  ],\n  \"selectors\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"primary\": \"#fixture-header\",\n      \"fallbacks\": [\n        \"header.card\",\n        \"body > header\"\n      ]\n    }\n  ],\n  \"content\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"text\": \"header_operational_dom_test_card\"\n    }\n  ],\n  \"styles\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"relevantStyles\": {\n        \"display\": \"block\",\n        \"position\": \"static\",\n        \"flex-direction\": \"row\",\n        \"background-color\": \"rgb(30, 41, 59)\",\n        \"color\": \"rgb(248, 250, 252)\",\n        \"font-size\": \"medium\",\n        \"border-radius\": \"8px\"\n      }\n    }\n  ],\n  \"annotations\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"userComment\": \"capture region\",\n      \"intendedChange\": \"test change\"\n    }\n  ],\n  \"expectedModifications\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"statement\": \"test change\"\n    }\n  ],\n  \"verificationRules\": [\n    {\n      \"regionId\": \"region_mtx86ofy_1\",\n      \"conditions\": [\n        \"v1\"\n      ]\n    }\n  ],\n  \"migration\": {\n    \"fromVersion\": \"1.0.0\",\n    \"notes\": \"Initial schema. Future breaking changes MUST bump schemaVersion and provide a migration entry here.\"\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Generates versioned reconstruction specification**: schemaVersion, pageId, projectId, generatedAt, metadata, viewport, structure, regions, hierarchy, semanticRoles, visualConstraints, interactions, selectors, content, styles, annotations, expectedModifications, verificationRules, migration
