# Operational Test: `fx_replay_interactions`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Replays the recorded interaction set with resilient resolution

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_181_fx_replay_interactions",
  "method": "tools/call",
  "params": {
    "name": "fx_replay_interactions",
    "arguments": {
      "recordingId": "irep_1_mtull24x",
      "verifySelectorsOnly": true
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_181_fx_replay_interactions",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"recordingId\": \"irep_1_mtull24x\",\n  \"replayedAt\": 1788988537620,\n  \"steps\": [\n    {\n      \"stepId\": \"step_1\",\n      \"action\": \"type\",\n      \"selectorUsed\": \"#search-input\",\n      \"resolution\": \"EXACT\",\n      \"resolutionDetail\": \"Selector uniquely matched.\",\n      \"executed\": true,\n      \"detail\": null\n    }\n  ],\n  \"successRate\": 1,\n  \"allExecuted\": true,\n  \"determinismNote\": \"Replay preserves action order, parameters and timing-free semantics; resilient resolution re-targets via fingerprint when the DOM changed between record and replay.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Replays the recorded interaction set with resilient resolution**: recordingId, replayedAt, steps, successRate, allExecuted, determinismNote
