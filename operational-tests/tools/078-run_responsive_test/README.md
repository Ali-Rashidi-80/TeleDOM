# Operational Test: `run_responsive_test`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Runs multi-viewport responsive test with restore

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_078_run_responsive_test",
  "method": "tools/call",
  "params": {
    "name": "run_responsive_test",
    "arguments": {
      "sizes": [
        {
          "label": "sm",
          "width": 400,
          "height": 700
        },
        {
          "label": "lg",
          "width": 1200,
          "height": 800
        }
      ]
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_078_run_responsive_test",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"success\": true,\n  \"originalViewport\": {\n    \"width\": 1024,\n    \"height\": 768\n  },\n  \"steps\": [\n    {\n      \"label\": \"sm\",\n      \"width\": 400,\n      \"height\": 700,\n      \"domLength\": 4430,\n      \"interactiveCount\": 10,\n      \"horizontalOverflow\": false\n    },\n    {\n      \"label\": \"lg\",\n      \"width\": 1200,\n      \"height\": 800,\n      \"domLength\": 4430,\n      \"interactiveCount\": 10,\n      \"horizontalOverflow\": false\n    }\n  ],\n  \"restored\": true,\n  \"finalViewport\": {\n    \"width\": 1024,\n    \"height\": 768\n  },\n  \"comparisons\": [\n    {\n      \"from\": \"sm\",\n      \"to\": \"lg\",\n      \"domLengthDelta\": 0,\n      \"interactiveDelta\": 0\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Runs multi-viewport responsive test with restore**: success, originalViewport, steps, restored, finalViewport, comparisons
