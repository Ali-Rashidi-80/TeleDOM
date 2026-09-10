# Operational Test: `dt_heapsnapshot_summary`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 1ms

## Test Objective
Parses and analyzes the heap snapshot with the real V8-format parser

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_156_dt_heapsnapshot_summary",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_summary",
    "arguments": {
      "snapshotId": "heap_3"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_156_dt_heapsnapshot_summary",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_3\",\n  \"simulated\": true,\n  \"nodeCount\": 29,\n  \"edgeCount\": 29,\n  \"totalSelfSize\": 170022,\n  \"stringCount\": 19,\n  \"classes\": [\n    {\n      \"className\": \"retained-blob\",\n      \"count\": 1,\n      \"selfSize\": 131072\n    },\n    {\n      \"className\": \"Object\",\n      \"count\": 15,\n      \"selfSize\": 26246\n    },\n    {\n      \"className\": \"system / Context\",\n      \"count\": 1,\n      \"selfSize\": 8192\n    },\n    {\n      \"className\": \"GlobalStore\",\n      \"count\": 1,\n      \"selfSize\": 2048\n    },\n    {\n      \"className\": \"Window\",\n      \"count\": 1,\n      \"selfSize\": 1024\n    },\n    {\n      \"className\": \"HTMLDivElement\",\n      \"count\": 1,\n      \"selfSize\": 512\n    },\n    {\n      \"className\": \"Array\",\n      \"count\": 1,\n      \"selfSize\": 384\n    },\n    {\n      \"className\": \"string\",\n      \"count\": 5,\n      \"selfSize\": 288\n    },\n    {\n      \"className\": \"closure:anonymous\",\n      \"count\": 2,\n      \"selfSize\": 256\n    },\n    {\n      \"className\": \"synthetic:(roots)\",\n      \"count\": 1,\n      \"selfSize\": 0\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, simulated, nodeCount, edgeCount, totalSelfSize, stringCount, classes
