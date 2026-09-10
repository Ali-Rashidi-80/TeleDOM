# Operational Test: `list_region_annotations`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Lists region annotations with quality grades

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_109_list_region_annotations",
  "method": "tools/call",
  "params": {
    "name": "list_region_annotations",
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
  "id": "op_req_109_list_region_annotations",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"regionId\": \"region_mtuudxj1_1\",\n    \"name\": \"header_operational_dom_test_card\",\n    \"autoName\": \"header_operational_dom_test_card\",\n    \"tag\": \"#fixture-header\",\n    \"selector\": \"#fixture-header\",\n    \"quality\": {\n      \"grade\": \"A\",\n      \"overall\": 0.88\n    },\n    \"intendedChange\": \"test change\",\n    \"capturedAt\": 1789003321598\n  },\n  {\n    \"regionId\": \"region_mtuudxje_2\",\n    \"name\": \"section_interactive_form_controls\",\n    \"autoName\": \"section_interactive_form_controls\",\n    \"tag\": \"#interactive-section\",\n    \"selector\": \"#interactive-section\",\n    \"quality\": {\n      \"grade\": \"B\",\n      \"overall\": 0.78\n    },\n    \"intendedChange\": null,\n    \"capturedAt\": 1789003321610\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Lists region annotations with quality grades**: 0, 1
