# Operational Test: `generate_element_target`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 10ms

## Test Objective
Builds multi-strategy TARGET with ranked candidates and confidence

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_048_generate_element_target",
  "method": "tools/call",
  "params": {
    "name": "generate_element_target",
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
  "id": "op_req_048_generate_element_target",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"targetId\": \"tgt_mtulkxnr_1\",\n  \"tag\": \"input\",\n  \"role\": \"textbox\",\n  \"selector\": \"#search-input\",\n  \"selectorCandidates\": [\n    {\n      \"selector\": \"#search-input\",\n      \"strategy\": \"id\",\n      \"confidence\": 1,\n      \"unique\": true,\n      \"reasons\": [\n        \"unique stable id\",\n        \"matches exactly this element\"\n      ]\n    },\n    {\n      \"selector\": \"input[type=\\\"text\\\"][placeholder=\\\"Type here...\\\"]\",\n      \"strategy\": \"attribute-fingerprint\",\n      \"confidence\": 0.68,\n      \"unique\": true,\n      \"reasons\": [\n        \"combination of stable attributes\",\n        \"matches exactly this element\"\n      ]\n    },\n    {\n      \"selector\": \"body > main > section:nth-of-type(1) > div:nth-of-type(1) > input\",\n      \"strategy\": \"structural-path\",\n      \"confidence\": 0.55,\n      \"unique\": true,\n      \"reasons\": [\n        \"position-based structural path\",\n        \"matches exactly this element\"\n      ]\n    },\n    {\n      \"selector\": \"input.input-field\",\n      \"strategy\": \"class\",\n      \"confidence\": 0.29,\n      \"unique\": false,\n      \"reasons\": [\n        \"stable class names\",\n        \"matches 2 elements — ambiguous\"\n      ]\n    }\n  ],\n  \"xpath\": \"//*[@id=\\\"search-input\\\"]\",\n  \"domPath\": \"#interactive-section > div:nth-of-type(1) > #interactive-section > #main-content > body > #search-input\",\n  \"textFingerprint\": \"\",\n  \"attributeFingerprint\": \"{\\\"id\\\":\\\"search-input\\\",\\\"type\\\":\\\"text\\\",\\\"placeholder\\\":\\\"Type here...\\\"}\",\n  \"structuralFingerprint\": \"a7b39227\",\n  \"attributes\": {\n    \"id\": \"search-input\",\n    \"class\": \"input-field\",\n    \"type\": \"text\",\n    \"placeholder\": \"Type here...\",\n    \"value\": \"initial query\"\n  },\n  \"confidence\": 1,\n  \"bounds\": {\n    \"x\": 0,\n    \"y\": 0,\n    \"width\": 0,\n    \"height\": 0\n  },\n  \"resolvedFrom\": \"selector\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Builds multi-strategy TARGET with ranked candidates and confidence**: targetId, tag, role, selector, selectorCandidates, xpath, domPath, textFingerprint, attributeFingerprint, structuralFingerprint, attributes, confidence, bounds, resolvedFrom
