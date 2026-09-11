# Operational Test: `td_agent_artifact_get`

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
  "id": "op_req_348_td_agent_artifact_get",
  "method": "tools/call",
  "params": {
    "name": "td_agent_artifact_get",
    "arguments": {
      "kind": "custom-tool",
      "name": "get_unread_messages"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_348_td_agent_artifact_get",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"artifact\":{\"id\":\"9e4576de-2e28-4614-bda5-7e03528c8f13\",\"kind\":\"custom-tool\",\"name\":\"get_unread_messages\",\"content\":{\"steps\":[\"open inbox\",\"detect unread\",\"open thread\",\"extract messages\"]},\"description\":\"agent-built abstraction over the fixture\",\"tags\":[\"operational\"],\"createdAt\":\"2026-09-11T17:23:57.425Z\",\"updatedAt\":\"2026-09-11T17:23:57.425Z\"},\"tool\":\"td_agent_artifact_get\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"agent-owned-tooling\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, artifact, tool, capability
