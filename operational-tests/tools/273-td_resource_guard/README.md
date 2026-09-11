# Operational Test: `td_resource_guard`

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
  "id": "op_req_273_td_resource_guard",
  "method": "tools/call",
  "params": {
    "name": "td_resource_guard",
    "arguments": {
      "usage": {
        "events": 100
      }
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_273_td_resource_guard",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"decision\":{\"mode\":\"HEALTHY\",\"capturePolicy\":\"FULL_FIDELITY\",\"actions\":[],\"degraded\":false},\"usage\":{\"events\":100,\"bytes\":0,\"memoryMB\":0,\"graphNodes\":0,\"networkCaptured\":0,\"queueDepth\":0,\"concurrentAnalyzers\":0},\"budgets\":{\"maxEvents\":10000000,\"maxBytes\":2147483648,\"maxMemoryMB\":1024,\"maxFrameDepth\":8,\"maxReconstructionMs\":250,\"maxGraphNodes\":250000,\"maxNetworkCapture\":200000,\"maxScreenshotArea\":16777216,\"maxConcurrentAnalyzers\":8},\"tool\":\"td_resource_guard\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"reliability-recovery\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, decision, usage, budgets, tool, capability
