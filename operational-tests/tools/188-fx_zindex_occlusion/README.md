# Operational Test: `fx_zindex_occlusion`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 4ms

## Test Objective
Builds the stacking-context occlusion assessment

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_188_fx_zindex_occlusion",
  "method": "tools/call",
  "params": {
    "name": "fx_zindex_occlusion",
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
  "id": "op_req_188_fx_zindex_occlusion",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"selector\": \"#search-input\",\n  \"rect\": {\n    \"x\": 0,\n    \"y\": 0,\n    \"width\": 0,\n    \"height\": 0\n  },\n  \"hitTestingAvailable\": false,\n  \"stackingContexts\": [\n    {\n      \"tag\": \"input\",\n      \"id\": \"search-input\",\n      \"className\": \"input-field\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"opacity\": \"1\",\n      \"display\": \"inline-block\",\n      \"overflow\": \"clip\",\n      \"transform\": null,\n      \"filter\": null,\n      \"isolation\": \"auto\",\n      \"clipPath\": null,\n      \"pointerEvents\": \"auto\",\n      \"isStackingContext\": false,\n      \"depth\": 0\n    },\n    {\n      \"tag\": \"div\",\n      \"id\": null,\n      \"className\": \"\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"opacity\": \"1\",\n      \"display\": \"block\",\n      \"overflow\": \"\",\n      \"transform\": null,\n      \"filter\": null,\n      \"isolation\": \"auto\",\n      \"clipPath\": null,\n      \"pointerEvents\": \"auto\",\n      \"isStackingContext\": false,\n      \"depth\": 1\n    },\n    {\n      \"tag\": \"section\",\n      \"id\": \"interactive-section\",\n      \"className\": \"\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"opacity\": \"1\",\n      \"display\": \"block\",\n      \"overflow\": \"\",\n      \"transform\": null,\n      \"filter\": null,\n      \"isolation\": \"auto\",\n      \"clipPath\": null,\n      \"pointerEvents\": \"auto\",\n      \"isStackingContext\": false,\n      \"depth\": 2\n    },\n    {\n      \"tag\": \"main\",\n      \"id\": \"main-content\",\n      \"className\": \"card\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"opacity\": \"1\",\n      \"display\": \"block\",\n      \"overflow\": \"\",\n      \"transform\": null,\n      \"filter\": null,\n      \"isolation\": \"auto\",\n      \"clipPath\": null,\n      \"pointerEvents\": \"auto\",\n      \"isStackingContext\": false,\n      \"depth\": 3\n    },\n    {\n      \"tag\": \"body\",\n      \"id\": null,\n      \"className\": \"\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"opacity\": \"1\",\n      \"display\": \"block\",\n      \"overflow\": \"\",\n      \"transform\": null,\n      \"filter\": null,\n      \"isolation\": \"auto\",\n      \"clipPath\": null,\n      \"pointerEvents\": \"auto\",\n      \"isStackingContext\": false,\n      \"depth\": 4\n    },\n    {\n      \"tag\": \"html\",\n      \"id\": null,\n      \"className\": \"\",\n      \"position\": \"static\",\n      \"zIndex\": \"auto\",\n      \"opacity\": \"1\",\n      \"display\": \"block\",\n      \"overflow\": \"\",\n      \"transform\": null,\n      \"filter\": null,\n      \"isolation\": \"auto\",\n      \"clipPath\": null,\n      \"pointerEvents\": \"auto\",\n      \"isStackingContext\": false,\n      \"depth\": 5\n    }\n  ],\n  \"nearestStackingContext\": null,\n  \"effectiveZOrder\": \"auto (DOM order)\",\n  \"hitTestAtCenter\": \"UNAVAILABLE\",\n  \"occlusionAssessment\": {\n    \"occluder\": \"Geometric hit-test UNAVAILABLE in this context (no layout engine): structural stacking analysis above remains valid; occlusion requires a live browser page.\",\n    \"pointerEventsIntercepted\": false,\n    \"clippingParent\": {\n      \"tag\": \"div\",\n      \"id\": null,\n      \"overflow\": \"\",\n      \"clipPath\": \"none\"\n    },\n    \"zeroSized\": true,\n    \"zeroSizeNote\": \"Element has zero width/height — invisible regardless of z-index (layout collapse, not occlusion).\"\n  },\n  \"hitTestConflicts\": [],\n  \"notes\": [\n    \"Stacking contexts detected from position/z-index/transform/filter/opacity/isolation per CSS spec.\",\n    \"Geometry hit-test uses elementFromPoint at the element center — in JSDOM (no layout engine) rect is 0×0 and the geometric result is explicitly marked as not available.\",\n    \"JSDOM mode: geometry unavailable; structural stacking analysis above remains valid.\"\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Builds the stacking-context occlusion assessment**: selector, rect, hitTestingAvailable, stackingContexts, nearestStackingContext, effectiveZOrder, hitTestAtCenter, occlusionAssessment, hitTestConflicts, notes
