# Operational Test: `wait_for_condition`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 107ms

## Test Objective
Waits for DOM stability across consecutive polls

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_070_wait_for_condition",
  "method": "tools/call",
  "params": {
    "name": "wait_for_condition",
    "arguments": {
      "kind": "dom_stable",
      "timeoutMs": 800
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_070_wait_for_condition",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"satisfied\": true,\n  \"condition\": \"dom_stable\",\n  \"waitedMs\": 101,\n  \"timeoutMs\": 800,\n  \"detail\": \"dom length 4430, 1 polls\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Waits for DOM stability across consecutive polls**: satisfied, condition, waitedMs, timeoutMs, detail
