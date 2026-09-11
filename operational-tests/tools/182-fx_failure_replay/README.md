# Operational Test: `fx_failure_replay`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Captures a structured failure scenario

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_182_fx_failure_replay",
  "method": "tools/call",
  "params": {
    "name": "fx_failure_replay",
    "arguments": {
      "mode": "capture",
      "failedAction": "click",
      "failedSelector": "#injected-action-btn"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_182_fx_failure_replay",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"failureId\": \"fail_1_mtwhcuup\",\n  \"captured\": true,\n  \"url\": \"https://app.internal/dashboard\",\n  \"selectorCandidates\": 2,\n  \"domSubtree\": false,\n  \"replaySteps\": 1\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Captures a structured failure scenario**: failureId, captured, url, selectorCandidates, domSubtree, replaySteps
