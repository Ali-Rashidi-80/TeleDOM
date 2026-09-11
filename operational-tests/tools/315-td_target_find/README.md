# Operational Test: `td_target_find`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 9ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_315_td_target_find",
  "method": "tools/call",
  "params": {
    "name": "td_target_find",
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
  "id": "op_req_315_td_target_find",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"intent\":\"find_target\",\"result\":{\"targetId\":\"tgt_mtx86sb6_7\",\"tag\":\"button\",\"role\":\"button\",\"selector\":\"#primary-action-btn\",\"selectorCandidates\":[{\"selector\":\"#primary-action-btn\",\"strategy\":\"id\",\"confidence\":1,\"unique\":true,\"reasons\":[\"unique stable id\",\"matches exactly this element\"]},{\"selector\":\"button[data-testid=\\\"action-button\\\"]\",\"strategy\":\"semantic-attribute\",\"confidence\":0.92,\"unique\":true,\"reasons\":[\"semantic attribute data-testid\",\"matches exactly this element\"]},{\"selector\":\"button:nth-of-type(1)\",\"strategy\":\"text-derived-xpath\",\"confidence\":0.6,\"unique\":false,\"reasons\":[\"matches text \\\"⚡ Run Analysis\\\"\"],\"xpath\":\"//button[normalize-space(text())='⚡ Run Analysis']\"},{\"selector\":\"body > main > section:nth-of-type(1) > div:nth-of-type(2) > button\",\"strategy\":\"structural-path\",\"confidence\":0.55,\"unique\":true,\"reasons\":[\"position-based structural path\",\"matches exactly this element\"]},{\"selector\":\"button.btn\",\"strategy\":\"class\",\"confidence\":0.29,\"unique\":false,\"reasons\":[\"stable class names\",\"matches 2 elements — ambiguous\"]}],\"xpath\":\"//*[@id=\\\"primary-action-btn\\\"]\",\"domPath\":\"#interactive-section > div:nth-of-type(2) > #interactive-section > #main-content > body > #primary-action-btn\",\"textFingerprint\":\"⚡ Run Analysis\",\"attributeFingerprint\":\"{\\\"id\\\":\\\"primary-action-btn\\\",\\\"data-testid\\\":\\\"action-button\\\"}\",\"structuralFingerprint\":\"b778bbe0\",\"attributes\":{\"id\":\"primary-action-btn\",\"class\":\"btn\",\"data-testid\":\"action-button\"},\"confidence\":1,\"bounds\":{\"x\":0,\"y\":0,\"width\":0,\"height\":0},\"resolvedFrom\":\"selector\"},\"tool\":\"td_target_find\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, intent, result, tool, capability
