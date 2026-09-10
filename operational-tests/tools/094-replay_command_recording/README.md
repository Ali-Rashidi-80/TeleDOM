# Operational Test: `replay_command_recording`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 4ms

## Test Objective
Replays recording or reports NOT_FOUND honestly

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_094_replay_command_recording",
  "method": "tools/call",
  "params": {
    "name": "replay_command_recording",
    "arguments": {
      "recordingId": "op-recording"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_094_replay_command_recording",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"replayed\": \"rec_mtuudxg5_1\",\n  \"sequenceId\": \"seq_mtuudxgs_2\",\n  \"success\": true,\n  \"totalSteps\": 1,\n  \"executedSteps\": 1,\n  \"skippedSteps\": 0,\n  \"durationMs\": 0,\n  \"stopOnError\": true,\n  \"steps\": [\n    {\n      \"stepIndex\": 0,\n      \"commandId\": \"rcmd_1_mtuudxg6\",\n      \"tool\": \"record_commands_start\",\n      \"args\": {\n        \"name\": \"op-recording\"\n      },\n      \"status\": \"SUCCESS\",\n      \"durationMs\": 0,\n      \"resultSummary\": \"OK: object with keys [recordingId, name, active, note]\",\n      \"result\": {\n        \"recordingId\": \"rec_mtuudxgs_2\",\n        \"name\": \"op-recording\",\n        \"active\": true,\n        \"note\": \"All subsequent tool calls (in this server process) are recorded until record_commands_stop.\"\n      }\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Replays recording or reports NOT_FOUND honestly**: replayed, sequenceId, success, totalSteps, executedSteps, skippedSteps, durationMs, stopOnError, steps
