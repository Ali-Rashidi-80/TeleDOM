# Operational Test: `td_accessibility_model`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_243_td_accessibility_model",
  "method": "tools/call",
  "params": {
    "name": "td_accessibility_model",
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
  "id": "op_req_243_td_accessibility_model",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"a11y\":[{\"id\":\"sem:c3e87a801165\",\"role\":\"html-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:ea6332da48e8\",\"role\":\"head-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:dc933d832497\",\"role\":\"meta-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:03c7efe93932\",\"role\":\"title-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:c57b8a020ef6\",\"role\":\"style-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:8bb9befe1164\",\"role\":\"body-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:ffbd3a712494\",\"role\":\"page-header\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:fdbbd0de8702\",\"role\":\"h1-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:f6f19e6f0487\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:70da1ed102fe\",\"role\":\"span-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:d6e9a55efca8\",\"role\":\"main-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:1e554f67b8c6\",\"role\":\"section-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:1821e87fb649\",\"role\":\"h2-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:f4f680de8ec3\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:129fd8fae6b8\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:4a0f01d14ec1\",\"role\":\"data-entry\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:6f8b9e39e9ba\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:585dba3e72c5\",\"role\":\"test-target(action-button)\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:117e13108f67\",\"role\":\"span-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:7e3f96fcf86d\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:60b709d1a6c0\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:149d53302484\",\"role\":\"choice\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:87148809636e\",\"role\":\"option-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:202d1a956b7c\",\"role\":\"option-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:07b49a9eecf6\",\"role\":\"option-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:9536d58af0c3\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:166d735e51ac\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:a753bb0da57f\",\"role\":\"data-entry\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:9c1a84212513\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:f4644153da96\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:82b2a7464992\",\"role\":\"data-entry\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:f936c00e825b\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:c3cbc8e3e5d9\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:b2bac8583cda\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:c924280ac00a\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:72785cc6e293\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:a32a455e74ec\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:014c2c016ef1\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:5c2c8b60e964\",\"role\":\"section-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:92a0096161b1\",\"role\":\"h2-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:41ebef0976af\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:90175e138fb9\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:2d2f2edb73ee\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:f45424942c09\",\"role\":\"span-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:bec5d5105a66\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:f45424942c09\",\"role\":\"span-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:2abaf4662dd3\",\"role\":\"section-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:74e5c0d3fca6\",\"role\":\"h2-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:63d56a96f3c0\",\"role\":\"input-group\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:36adbc18cbcf\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:4baaca8eeb92\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:eb431b0a3a81\",\"role\":\"data-entry\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:55bdac0a882b\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:f4ae55306316\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:3d133d342392\",\"role\":\"data-entry\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:521ea0db6699\",\"role\":\"div-region\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:ff7f144c8ff3\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:15e2c2d298e2\",\"role\":\"data-entry\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:2a84a8a9e3f3\",\"role\":\"field-label\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:15e2c2d298e2\",\"role\":\"data-entry\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:ef9d6cbbc909\",\"role\":\"submit-action\",\"focusable\":true,\"state\":\"enabled\"},{\"id\":\"sem:c954a836117d\",\"role\":\"page-footer\",\"focusable\":false,\"state\":\"enabled\"},{\"id\":\"sem:3e696cdc9c39\",\"role\":\"p-region\",\"focusable\":false,\"state\":\"enabled\"}],\"tool\":\"td_accessibility_model\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"semantic-component\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, a11y, tool, capability
