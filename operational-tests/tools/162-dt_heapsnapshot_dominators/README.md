# Operational Test: `dt_heapsnapshot_dominators`

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
  "id": "op_req_162_dt_heapsnapshot_dominators",
  "method": "tools/call",
  "params": {
    "name": "dt_heapsnapshot_dominators",
    "arguments": {
      "snapshotId": "heap_9"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_162_dt_heapsnapshot_dominators",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"snapshotId\": \"heap_9\",\n  \"dominators\": [\n    {\n      \"nodeId\": 1,\n      \"className\": \"synthetic:(roots)\",\n      \"retainedTreeSize\": 149322,\n      \"dominatorClass\": \"synthetic:(roots)\"\n    },\n    {\n      \"nodeId\": 6,\n      \"className\": \"GlobalStore\",\n      \"retainedTreeSize\": 133184,\n      \"dominatorClass\": \"synthetic:(roots)\"\n    },\n    {\n      \"nodeId\": 7,\n      \"className\": \"retained-blob\",\n      \"retainedTreeSize\": 131072,\n      \"dominatorClass\": \"GlobalStore\"\n    },\n    {\n      \"nodeId\": 8,\n      \"className\": \"system / Context\",\n      \"retainedTreeSize\": 8320,\n      \"dominatorClass\": \"synthetic:(roots)\"\n    },\n    {\n      \"nodeId\": 2,\n      \"className\": \"Window\",\n      \"retainedTreeSize\": 7818,\n      \"dominatorClass\": \"synthetic:(roots)\"\n    },\n    {\n      \"nodeId\": 4,\n      \"className\": \"Object\",\n      \"retainedTreeSize\": 5722,\n      \"dominatorClass\": \"Window\"\n    },\n    {\n      \"nodeId\": 201,\n      \"className\": \"closure:anonymous\",\n      \"retainedTreeSize\": 5418,\n      \"dominatorClass\": \"Object\"\n    },\n    {\n      \"nodeId\": 300,\n      \"className\": \"Object\",\n      \"retainedTreeSize\": 5290,\n      \"dominatorClass\": \"closure:anonymous\"\n    },\n    {\n      \"nodeId\": 301,\n      \"className\": \"Object\",\n      \"retainedTreeSize\": 3212,\n      \"dominatorClass\": \"Object\"\n    },\n    {\n      \"nodeId\": 3,\n      \"className\": \"HTMLDivElement\",\n      \"retainedTreeSize\": 624,\n      \"dominatorClass\": \"Window\"\n    },\n    {\n      \"nodeId\": 5,\n      \"className\": \"Array\",\n      \"retainedTreeSize\": 448,\n      \"dominatorClass\": \"Window\"\n    },\n    {\n      \"nodeId\": 202,\n      \"className\": \"closure:anonymous\",\n      \"retainedTreeSize\": 128,\n      \"dominatorClass\": \"system / Context\"\n    },\n    {\n      \"nodeId\": 105,\n      \"className\": \"string\",\n      \"retainedTreeSize\": 64,\n      \"dominatorClass\": \"GlobalStore\"\n    },\n    {\n      \"nodeId\": 103,\n      \"className\": \"string\",\n      \"retainedTreeSize\": 64,\n      \"dominatorClass\": \"HTMLDivElement\"\n    },\n    {\n      \"nodeId\": 104,\n      \"className\": \"string\",\n      \"retainedTreeSize\": 64,\n      \"dominatorClass\": \"Array\"\n    },\n    {\n      \"nodeId\": 101,\n      \"className\": \"string\",\n      \"retainedTreeSize\": 48,\n      \"dominatorClass\": \"HTMLDivElement\"\n    },\n    {\n      \"nodeId\": 102,\n      \"className\": \"string\",\n      \"retainedTreeSize\": 48,\n      \"dominatorClass\": \"Object\"\n    }\n  ],\n  \"simulated\": true,\n  \"algorithm\": \"Iterative dominator computation (Cooper–Harvey–Kennedy) over the retained edge graph, retained sizes summed per dominated subtree.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Parses and analyzes the heap snapshot with the real V8-format parser**: snapshotId, dominators, simulated, algorithm
