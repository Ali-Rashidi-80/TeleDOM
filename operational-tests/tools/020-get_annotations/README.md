# Operational Test: `get_annotations`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Retrieves all annotations associated with session

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_020_get_annotations",
  "method": "tools/call",
  "params": {
    "name": "get_annotations",
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
  "id": "op_req_020_get_annotations",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"annotations\": [\n    {\n      \"id\": \"ann_op_001\",\n      \"sessionId\": \"operational_acceptance_session_001\",\n      \"timestamp\": 200,\n      \"sequence\": 5,\n      \"label\": \"API Request Fired\",\n      \"comment\": \"User click triggered POST /v1/analyze\",\n      \"category\": \"NOTE\",\n      \"author\": \"TEST_HARNESS\",\n      \"createdAt\": 1789003313250\n    },\n    {\n      \"id\": \"ann_1789003314629_4fc2\",\n      \"sessionId\": \"operational_acceptance_session_001\",\n      \"timestamp\": 0,\n      \"author\": \"AGENT\",\n      \"label\": \"Root Cause Confirmed\",\n      \"comment\": \"Host framework unmounted #host-sidebar after network update\",\n      \"category\": \"ROOT_CAUSE\",\n      \"createdAt\": 1789003314629\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Retrieves all annotations associated with session**: sessionId, annotations
