# Operational Test: `dt_performance_stop_trace`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 2ms

## Test Objective
Stops the active trace and returns vitals analysis

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_142_dt_performance_stop_trace",
  "method": "tools/call",
  "params": {
    "name": "dt_performance_stop_trace",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_142_dt_performance_stop_trace",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"traceId\": \"trace_1\",\n  \"pageId\": \"page_1\",\n  \"stopped\": true,\n  \"mode\": \"SIMULATED\",\n  \"simulated\": true,\n  \"eventCount\": 16,\n  \"durationMs\": 97.4,\n  \"webVitals\": {\n    \"lcp\": {\n      \"value\": 320,\n      \"timestamp\": 1.474\n    },\n    \"fcp\": {\n      \"value\": 1.12,\n      \"timestamp\": 1.12\n    },\n    \"cls\": {\n      \"value\": 0.113,\n      \"sourceHints\": [\n        \"div#banner img.hero\"\n      ]\n    }\n  },\n  \"topLongTasks\": [\n    {\n      \"kind\": \"long-task\",\n      \"name\": \"EventTiming\",\n      \"startUs\": 2400,\n      \"durationMs\": 96,\n      \"details\": {\n        \"cat\": \"devtools.timeline.event\",\n        \"tid\": 2\n      }\n    },\n    {\n      \"kind\": \"long-task\",\n      \"name\": \"FunctionCall\",\n      \"startUs\": 1900,\n      \"durationMs\": 82,\n      \"details\": {\n        \"cat\": \"devtools.timeline\",\n        \"tid\": 2\n      }\n    }\n  ],\n  \"layoutShifts\": [\n    {\n      \"kind\": \"layout-shift\",\n      \"name\": \"LayoutShift\",\n      \"startUs\": 2100,\n      \"durationMs\": 0,\n      \"details\": {\n        \"score\": 0.113,\n        \"sources\": \"div#banner img.hero\"\n      }\n    }\n  ],\n  \"phaseBreakdown\": [\n    {\n      \"phase\": \"devtools.timeline\",\n      \"totalMs\": 151,\n      \"events\": 5\n    },\n    {\n      \"phase\": \"toplevel\",\n      \"totalMs\": 125,\n      \"events\": 6\n    },\n    {\n      \"phase\": \"devtools.timeline.event\",\n      \"totalMs\": 96,\n      \"events\": 1\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Stops the active trace and returns vitals analysis**: traceId, pageId, stopped, mode, simulated, eventCount, durationMs, webVitals, topLongTasks, layoutShifts, phaseBreakdown
