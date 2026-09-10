# Operational Test: `export_command_recording`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Exports recording as portable JSON or reports NOT_FOUND

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_095_export_command_recording",
  "method": "tools/call",
  "params": {
    "name": "export_command_recording",
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
  "id": "op_req_095_export_command_recording",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"recordingId\": \"rec_mtulky6h_1\",\n  \"json\": \"{\\n  \\\"schemaVersion\\\": \\\"1.0.0\\\",\\n  \\\"exportedAt\\\": 1788988532495,\\n  \\\"recording\\\": {\\n    \\\"recordingId\\\": \\\"rec_mtulky6h_1\\\",\\n    \\\"name\\\": \\\"op-recording\\\",\\n    \\\"createdAt\\\": 1788988532489,\\n    \\\"updatedAt\\\": 1788988532489,\\n    \\\"commandCount\\\": 1,\\n    \\\"commands\\\": [\\n      {\\n        \\\"index\\\": 1,\\n        \\\"commandId\\\": \\\"rcmd_1_mtulky6h\\\",\\n        \\\"tool\\\": \\\"record_commands_start\\\",\\n        \\\"args\\\": {\\n          \\\"name\\\": \\\"op-recording\\\"\\n        },\\n        \\\"recordedAt\\\": 1788988532489,\\n        \\\"outcome\\\": \\\"SUCCESS\\\",\\n        \\\"resultSummary\\\": \\\"object with keys [recordingId, name, active, note]\\\"\\n      }\\n    ],\\n    \\\"tags\\\": []\\n  }\\n}\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Exports recording as portable JSON or reports NOT_FOUND**: recordingId, json
