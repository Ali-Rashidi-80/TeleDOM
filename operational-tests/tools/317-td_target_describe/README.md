# Operational Test: `td_target_describe`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 4ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_317_td_target_describe",
  "method": "tools/call",
  "params": {
    "name": "td_target_describe",
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
  "id": "op_req_317_td_target_describe",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"selector\":\"#primary-action-btn\",\"result\":{\"accessibility\":{\"selector\":\"#primary-action-btn\",\"implicitRole\":\"button\",\"name\":\"⚡ Run Analysis\",\"nameSources\":[\"text content\"],\"value\":\"\",\"states\":[],\"focusable\":true,\"tabIndex\":0,\"ariaAttributes\":{},\"issues\":[]},\"fingerprint\":{\"fingerprintId\":\"fp_b778bbe0\",\"hash\":\"b778bbe0\",\"tagHierarchy\":[\"main\",\"section\",\"div\",\"button\"],\"stableAttributes\":{\"id\":\"primary-action-btn\",\"data-testid\":\"action-button\"},\"meaningfulText\":\"⚡ Run Analysis\",\"classes\":[\"btn\"],\"role\":\"button\",\"dimensions\":{\"width\":0,\"height\":0},\"ancestorPattern\":\"main>section>div>button\",\"descendantPattern\":\"\",\"volatilityRisk\":\"low\",\"volatilityReasons\":[]}},\"tool\":\"td_target_describe\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, selector, result, tool, capability
