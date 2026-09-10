# Operational Test: `dt_performance_start_trace`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 1ms

## Test Objective
Starts a (simulated) performance trace

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_141_dt_performance_start_trace",
  "method": "tools/call",
  "params": {
    "name": "dt_performance_start_trace",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_141_dt_performance_start_trace",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"traceId\": \"trace_1\",\n  \"pageId\": \"page_1\",\n  \"started\": true,\n  \"categories\": [\n    \"devtools.timeline\",\n    \"loading\",\n    \"netlog\"\n  ],\n  \"mode\": \"SIMULATED\",\n  \"simulated\": true,\n  \"note\": \"Deterministic simulated trace buffer — NOT real Chrome trace data. Analysis algorithms are identical to live traces; the DATA here is a deterministic fixture, not real Chrome measurements.\",\n  \"source\": \"simulation\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Starts a (simulated) performance trace**: traceId, pageId, started, categories, mode, simulated, note, source
