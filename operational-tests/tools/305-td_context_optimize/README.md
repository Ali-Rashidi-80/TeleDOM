# Operational Test: `td_context_optimize`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_305_td_context_optimize",
  "method": "tools/call",
  "params": {
    "name": "td_context_optimize",
    "arguments": {
      "intent": "why did the injected button disappear"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_305_td_context_optimize",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"context\":{\"level\":\"L3\",\"summary\":{\"stateRef\":\"state_00vvkk\",\"incident\":{\"incidentId\":\"none\",\"hypotheses\":[],\"causalChain\":[],\"verification\":\"UNSUPPORTED\"},\"scope\":[],\"eventCount\":0},\"stateRef\":\"state_00vvkk\",\"approximateTokens\":101,\"available\":[{\"artifactId\":\"art:dom:00vvkk\",\"kind\":\"dom-full\",\"byteLength\":4096,\"searchable\":true,\"storedRef\":\"artifact://dom/00vvkk\"},{\"artifactId\":\"art:network:00vvkk\",\"kind\":\"network-log\",\"byteLength\":4096,\"searchable\":true,\"storedRef\":\"artifact://network/00vvkk\"},{\"artifactId\":\"art:console:00vvkk\",\"kind\":\"console-log\",\"byteLength\":4096,\"searchable\":true,\"storedRef\":\"artifact://console/00vvkk\"}],\"metrics\":{\"bytesToDecision\":602,\"tokensToDecision\":151,\"toolCallsToDecision\":2,\"failedActionsBeforeDecision\":0},\"notes\":[]},\"levels\":\"L0 identity / L1 semantic / L2 subtree / L3 evidence / L4 full\",\"tool\":\"td_context_optimize\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"investigation-orchestration\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, context, levels, tool, capability
