# Operational Test: `td_state_summary`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_246_td_state_summary",
  "method": "tools/call",
  "params": {
    "name": "td_state_summary",
    "arguments": {
      "intent": "page state summary",
      "sessionId": "operational_acceptance_session_001"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_246_td_state_summary",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"context\":{\"level\":\"L1\",\"summary\":{\"stateRef\":\"state_00vvkk\",\"eventCount\":0,\"semantic\":[]},\"stateRef\":\"state_00vvkk\",\"approximateTokens\":50,\"available\":[{\"artifactId\":\"art:dom:00vvkk\",\"kind\":\"dom-full\",\"byteLength\":4096,\"searchable\":true,\"storedRef\":\"artifact://dom/00vvkk\"},{\"artifactId\":\"art:network:00vvkk\",\"kind\":\"network-log\",\"byteLength\":4096,\"searchable\":true,\"storedRef\":\"artifact://network/00vvkk\"},{\"artifactId\":\"art:console:00vvkk\",\"kind\":\"console-log\",\"byteLength\":4096,\"searchable\":true,\"storedRef\":\"artifact://console/00vvkk\"}],\"metrics\":{\"bytesToDecision\":200,\"tokensToDecision\":50,\"toolCallsToDecision\":1,\"failedActionsBeforeDecision\":0},\"notes\":[\"semantic state compacted to 40 elements\"]},\"tool\":\"td_state_summary\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"semantic-component\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, context, tool, capability
