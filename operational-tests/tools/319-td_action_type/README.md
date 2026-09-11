# Operational Test: `td_action_type`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 311ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_319_td_action_type",
  "method": "tools/call",
  "params": {
    "name": "td_action_type",
    "arguments": {
      "selector": "#search-input",
      "text": "typed by workflow"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_319_td_action_type",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"action\":\"type\",\"selector\":\"#search-input\",\"result\":{\"truncated\":true,\"preview\":\"{\\\"success\\\":true,\\\"action\\\":\\\"type\\\",\\\"target\\\":{\\\"tag\\\":\\\"input\\\",\\\"id\\\":\\\"search-input\\\",\\\"classes\\\":[\\\"input-field\\\"],\\\"role\\\":\\\"textbox\\\",\\\"text\\\":\\\"\\\",\\\"normalizedText\\\":\\\"\\\",\\\"value\\\":\\\"form valuetyped texttyped by workflow\\\",\\\"type\\\":\\\"text\\\",\\\"selector\\\":\\\"#search-input\\\",\\\"bestSelector\\\":\\\"#search-input\\\",\\\"selectorCandidates\\\":[\\\"#search-input\\\",\\\"input.input-field\\\"],\\\"bounds\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"right\\\":0,\\\"bottom\\\":0,\\\"left\\\":0},\\\"visibility\\\":{\\\"isVisible\\\":true,\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":1,\\\"pointerEvents\\\":\\\"auto\\\",\\\"isClipped\\\":false,\\\"isInViewport\\\":true,\\\"zIndex\\\":\\\"auto\\\"},\\\"computedStyle\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":\\\"1\\\",\\\"position\\\":\\\"static\\\",\\\"zIndex\\\":\\\"auto\\\",\\\"pointerEvents\\\":\\\"auto\\\",\\\"overflow\\\":\\\"clip\\\",\\\"boxSizing\\\":\\\"content-box\\\",\\\"color\\\":\\\"rgb(248, 250, 252)\\\",\\\"backgroundColor\\\":\\\"rgb(15, 23, 42)\\\",\\\"fontSize\\\":\\\"medium\\\"},\\\"attributes\\\":{\\\"id\\\":\\\"search-input\\\",\\\"class\\\":\\\"input-field\\\",\\\"type\\\":\\\"text\\\",\\\"placeholder\\\":\\\"Type here...\\\",\\\"value\\\":\\\"initial query\\\"},\\\"state\\\":{\\\"disabled\\\":false,\\\"readOnly\\\":false,\\\"checked\\\":false,\\\"focused\\\":true,\\\"isShadowHost\\\":false,\\\"hasShadowRoot\\\":false},\\\"context\\\":{\\\"parentChain\\\":[\\\"#interactive-section > div:nth-of-type(1)\\\",\\\"#interactive-section\\\",\\\"#main-content\\\",\\\"body\\\"],\\\"parentSelector\\\":\\\"#interactive-section > div:nth-of-type(1)\\\",\\\"childrenSummary\\\":{\\\"count\\\":0,\\\"tags\\\":[]},\\\"containingBlock\\\":\\\"#interactive-section > div:nth-of-type(1)\\\",\\\"iframe\\\":null,\\\"shadowRoot\\\":null},\\\"forensics\\\":{\\\"logicalNodeId\\\":42,\\\"creationSequence\\\":null,\\\"lastMutationSequence\\\":null,\\\"eventCount\\\":0,\\\"isRecorded\\\":true}},\\\"beforeState\\\":{\\\"tag\\\":\\\"input\\\",\\\"id\\\":\\\"search-input\\\",\\\"classes\\\":[\\\"input-field\\\"],\\\"role\\\":\\\"textbox\\\",\\\"text\\\":\\\"\\\",\\\"normalizedText\\\":\\\"\\\",\\\"value\\\":\\\"form valuetyped text\\\",\\\"type\\\":\\\"text\\\",\\\"selector\\\":\\\"#search-input\\\",\\\"bestSelector\\\":\\\"#search-input\\\",\\\"selectorCandidates\\\":[\\\"#search-input\\\",\\\"input.input-field\\\"],\\\"bounds\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"right\\\":0,\\\"bottom\\\":0,\\\"left\\\":0},\\\"visibility\\\":{\\\"isVisible\\\":true,\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":1,\\\"pointerEvents\\\":\\\"auto\\\",\\\"isClipped\\\":false,\\\"isInViewport\\\":true,\\\"zIndex\\\":\\\"auto\\\"},\\\"computedStyle\\\":{\\\"display\\\":\\\"inline-block\\\",\\\"visibility\\\":\\\"visible\\\",\\\"opacity\\\":\\\"1\\\",\\\"position\\\":\\\"static\\\",\\\"zIndex\\\":\\\"auto\\\",\\\"pointerEvents\\\":\\\"auto\\\",\\\"overflow\\\":\\\"clip\\\",\\\"boxSizing\\\":\\\"content-box\\\",\\\"color\\\":\\\"rgb(248, 250, 252)\\\",\\\"backgroundColor\\\":\\\"rgb(15, 23, 42)\\\",\\\"fontSize\\\":\\\"medium\\\"},\\\"attributes\\\":{\\\"id\\\":\\\"search-input\\\",\\\"class\\\":\\\"input-field\\\",\\\"type\\\":\\\"text\\\",\\\"placeholder\\\":\\\"Type here...\\\",\\\"value\\\":\\\"initial query\\\"},\\\"state\\\":{\\\"disabled\\\":false,\\\"readOnly\\\":false,\\\"checked\\\":false,\\\"focused\\\":false,\\\"isShadowHost\\\":false,\\\"hasShadowRoot\\\":false},\\\"context\\\":{\\\"parentChain\\\":[\\\"#interactive-section > div:nth-of-type(1)\\\",\\\"#interactive-section\\\",\\\"#main-content\\\",\\\"body\\\"],\\\"parentSelector\\\":\\\"#interactive-section > div:nth-of-type(1)\\\",\\\"childrenSummary\\\":{\\\"count\\\":0,\\\"tags\\\":[]},\\\"containingBlock\\\":\\\"#interactive-section > div:nth-of-type(1)\\\",\\\"iframe\\\":null,\\\"shadowRoot\\\":null},\\\"forensics\\\":{\\\"logicalNodeId\\\":42,\\\"creationSequence\\\":null,\\\"lastMutationSequence\\\":null,\\\"eventCount\\\":0,\\\"isRecorded\\\":true}},\\\"afterState\\\":{\\\"tag\\\":\\\"input\\\",\\\"id\\\":\\\"search-input\\\",\\\"classes\\\":[\\\"input-field\\\"]\",\"bytes\":4613},\"tool\":\"td_action_type\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"side-effects\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, action, selector, result, tool, capability
