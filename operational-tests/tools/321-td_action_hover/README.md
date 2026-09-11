# Operational Test: `td_action_hover`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 313ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_321_td_action_hover",
  "method": "tools/call",
  "params": {
    "name": "td_action_hover",
    "arguments": {
      "selector": "#primary-action-btn"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_321_td_action_hover",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"action\":\"hover\",\"selector\":\"#primary-action-btn\",\"result\":{\"truncated\":true,\"preview\":\"{\\\"success\\\":true,\\\"action\\\":\\\"hover\\\",\\\"target\\\":{\\\"tag\\\":\\\"button\\\",\\\"id\\\":\\\"primary-action-btn\\\",\\\"classes\\\":[\\\"btn\\\"],\\\"role\\\":\\\"button\\\",\\\"text\\\":\\\"⚡ Run Analysis\\\",\\\"normalizedText\\\":\\\"⚡ Run Analysis\\\",\\\"value\\\":\\\"\\\",\\\"type\\\":\\\"submit\\\",\\\"selector\\\":\\\"#primary-action-btn\\\",\\\"bestSelector\\\":\\\"#primary-action-btn\\\",\\\"selectorCandidates\\\":[\\\"#primary-action-btn\\\",\\\"button[data-testid=\\\\\\\"action-button\\\\\\\"]\\\",\\\"button.btn\\\"],\\\"bounds\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"right\\\":0,\\\"bottom\\\":0,\\\"left\\\":0},\\\"visibility\\\":{\\\"isVisible\\\":true,\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":1,\\\"pointerEvents\\\":\\\"auto\\\",\\\"isClipped\\\":false,\\\"isInViewport\\\":true,\\\"zIndex\\\":\\\"auto\\\"},\\\"computedStyle\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":\\\"1\\\",\\\"position\\\":\\\"static\\\",\\\"zIndex\\\":\\\"auto\\\",\\\"pointerEvents\\\":\\\"auto\\\",\\\"overflow\\\":\\\"\\\",\\\"boxSizing\\\":\\\"border-box\\\",\\\"color\\\":\\\"rgb(15, 23, 42)\\\",\\\"backgroundColor\\\":\\\"rgb(56, 189, 248)\\\",\\\"fontSize\\\":\\\"medium\\\"},\\\"attributes\\\":{\\\"id\\\":\\\"primary-action-btn\\\",\\\"class\\\":\\\"btn\\\",\\\"data-testid\\\":\\\"action-button\\\"},\\\"state\\\":{\\\"disabled\\\":false,\\\"readOnly\\\":false,\\\"focused\\\":false,\\\"isShadowHost\\\":false,\\\"hasShadowRoot\\\":false},\\\"context\\\":{\\\"parentChain\\\":[\\\"#interactive-section > div:nth-of-type(2)\\\",\\\"#interactive-section\\\",\\\"#main-content\\\",\\\"body\\\"],\\\"parentSelector\\\":\\\"#interactive-section > div:nth-of-type(2)\\\",\\\"childrenSummary\\\":{\\\"count\\\":0,\\\"tags\\\":[]},\\\"containingBlock\\\":\\\"#interactive-section > div:nth-of-type(2)\\\",\\\"iframe\\\":null,\\\"shadowRoot\\\":null},\\\"forensics\\\":{\\\"logicalNodeId\\\":47,\\\"creationSequence\\\":null,\\\"lastMutationSequence\\\":null,\\\"eventCount\\\":0,\\\"isRecorded\\\":true}},\\\"beforeState\\\":{\\\"tag\\\":\\\"button\\\",\\\"id\\\":\\\"primary-action-btn\\\",\\\"classes\\\":[\\\"btn\\\"],\\\"role\\\":\\\"button\\\",\\\"text\\\":\\\"⚡ Run Analysis\\\",\\\"normalizedText\\\":\\\"⚡ Run Analysis\\\",\\\"value\\\":\\\"\\\",\\\"type\\\":\\\"submit\\\",\\\"selector\\\":\\\"#primary-action-btn\\\",\\\"bestSelector\\\":\\\"#primary-action-btn\\\",\\\"selectorCandidates\\\":[\\\"#primary-action-btn\\\",\\\"button[data-testid=\\\\\\\"action-button\\\\\\\"]\\\",\\\"button.btn\\\"],\\\"bounds\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"right\\\":0,\\\"bottom\\\":0,\\\"left\\\":0},\\\"visibility\\\":{\\\"isVisible\\\":true,\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":1,\\\"pointerEvents\\\":\\\"auto\\\",\\\"isClipped\\\":false,\\\"isInViewport\\\":true,\\\"zIndex\\\":\\\"auto\\\"},\\\"computedStyle\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":\\\"1\\\",\\\"position\\\":\\\"static\\\",\\\"zIndex\\\":\\\"auto\\\",\\\"pointerEvents\\\":\\\"auto\\\",\\\"overflow\\\":\\\"\\\",\\\"boxSizing\\\":\\\"border-box\\\",\\\"color\\\":\\\"rgb(15, 23, 42)\\\",\\\"backgroundColor\\\":\\\"rgb(56, 189, 248)\\\",\\\"fontSize\\\":\\\"medium\\\"},\\\"attributes\\\":{\\\"id\\\":\\\"primary-action-btn\\\",\\\"class\\\":\\\"btn\\\",\\\"data-testid\\\":\\\"action-button\\\"},\\\"state\\\":{\\\"disabled\\\":false,\\\"readOnly\\\":false,\\\"focused\\\":false,\\\"isShadowHost\\\":false,\\\"hasShadowRoot\\\":false},\\\"context\\\":{\\\"parentChain\\\":[\\\"#interactive-section > div:nth-of-type(2)\\\",\\\"#interactive-section\\\",\\\"#main-content\\\",\\\"body\\\"],\\\"parentSelector\\\":\\\"#interactive-section > div:nth-of-type(2)\\\",\\\"childrenSummary\\\":{\\\"count\\\":0,\\\"tags\\\":[]},\\\"containingBlock\\\":\\\"#interactive-section > div:nth-of-type(2)\\\",\\\"iframe\\\":null,\\\"shadowRoot\\\":null},\\\"forensics\\\":{\\\"logicalNodeId\\\":47,\\\"creationSequence\\\":null,\\\"lastMutationSequence\\\":null,\\\"eventCount\\\":0,\\\"isRecorded\\\":true}},\\\"afterState\\\":{\\\"tag\\\":\\\"button\\\",\\\"id\\\":\\\"primary-action-btn\\\",\\\"classes\\\":[\\\"btn\\\"],\\\"role\\\":\\\"button\\\",\\\"te\",\"bytes\":4576},\"tool\":\"td_action_hover\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"side-effects\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, action, selector, result, tool, capability
