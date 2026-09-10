# Operational Test: `get_timeline`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 9ms

## Test Objective
Returns event count breakdown across categories

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_006_get_timeline",
  "method": "tools/call",
  "params": {
    "name": "get_timeline",
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
  "id": "op_req_006_get_timeline",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"durationMs\": 400,\n  \"firstTimestamp\": 50,\n  \"lastTimestamp\": 450,\n  \"totalEvents\": 8,\n  \"categoryBreakdown\": {\n    \"DOM\": 2,\n    \"USER\": 1,\n    \"CONSOLE\": 1,\n    \"NETWORK\": 2,\n    \"ERROR\": 1,\n    \"VISUAL\": 1\n  },\n  \"sessionStatus\": \"stopped\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns event count breakdown across categories**: sessionId, durationMs, firstTimestamp, lastTimestamp, totalEvents, categoryBreakdown, sessionStatus
