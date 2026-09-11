# Operational Test: `get_recording_health`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 10ms

## Test Objective
Audits recording integrity and returns HEALTHY status

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_021_get_recording_health",
  "method": "tools/call",
  "params": {
    "name": "get_recording_health",
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
  "id": "op_req_021_get_recording_health",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"health\": {\n    \"domRecording\": \"HEALTHY\",\n    \"userEvents\": \"HEALTHY\",\n    \"console\": \"HEALTHY\",\n    \"network\": \"HEALTHY\",\n    \"screenshots\": \"HEALTHY\",\n    \"shadowDom\": \"HEALTHY\",\n    \"iframes\": \"HEALTHY\"\n  },\n  \"stats\": {\n    \"eventCount\": 8,\n    \"mutationCount\": 4,\n    \"errorCount\": 1,\n    \"consoleCount\": 1,\n    \"networkCount\": 2,\n    \"checkpointCount\": 2,\n    \"screenshotCount\": 1,\n    \"nodeCount\": 12\n  },\n  \"integrity\": {\n    \"isValid\": true,\n    \"sessionId\": \"operational_acceptance_session_001\",\n    \"schemaVersion\": \"2.0.0\",\n    \"totalEvents\": 8,\n    \"totalCheckpoints\": 1,\n    \"isSequenceMonotonic\": true,\n    \"missingSequences\": [],\n    \"corruptNodeReferences\": [],\n    \"hasInitialSnapshot\": true,\n    \"errors\": [],\n    \"warnings\": []\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Audits recording integrity and returns HEALTHY status**: sessionId, health, stats, integrity
