# Operational Test: `get_interaction_profile`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 0ms

## Test Objective
Reports active interaction profile and available profiles

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_073_get_interaction_profile",
  "method": "tools/call",
  "params": {
    "name": "get_interaction_profile",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_073_get_interaction_profile",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"activeProfile\": \"HUMAN_LIKE\",\n  \"profile\": {\n    \"name\": \"HUMAN_LIKE\",\n    \"description\": \"Realistic cadence with key-by-key typing variance, movement trajectories, and occasional hesitation pauses.\",\n    \"moveDelayMs\": {\n      \"min\": 90,\n      \"max\": 260\n    },\n    \"clickDelayMs\": {\n      \"min\": 120,\n      \"max\": 420\n    },\n    \"typeDelayMs\": {\n      \"min\": 60,\n      \"max\": 180\n    },\n    \"keyDelayMs\": {\n      \"min\": 70,\n      \"max\": 220\n    },\n    \"hesitationProbability\": 0.22,\n    \"trajectorySteps\": 8,\n    \"seed\": 4242\n  },\n  \"availableProfiles\": [\n    \"DETERMINISTIC\",\n    \"BALANCED\",\n    \"HUMAN_LIKE\",\n    \"CUSTOM\"\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Reports active interaction profile and available profiles**: activeProfile, profile, availableProfiles
