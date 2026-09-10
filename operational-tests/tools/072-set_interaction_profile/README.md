# Operational Test: `set_interaction_profile`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Activates seeded human-like interaction profile

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_072_set_interaction_profile",
  "method": "tools/call",
  "params": {
    "name": "set_interaction_profile",
    "arguments": {
      "profile": "HUMAN_LIKE",
      "seed": 42
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_072_set_interaction_profile",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"activeProfile\": \"HUMAN_LIKE\",\n  \"profile\": {\n    \"name\": \"HUMAN_LIKE\",\n    \"description\": \"Realistic cadence with key-by-key typing variance, movement trajectories, and occasional hesitation pauses.\",\n    \"moveDelayMs\": {\n      \"min\": 90,\n      \"max\": 260\n    },\n    \"clickDelayMs\": {\n      \"min\": 120,\n      \"max\": 420\n    },\n    \"typeDelayMs\": {\n      \"min\": 60,\n      \"max\": 180\n    },\n    \"keyDelayMs\": {\n      \"min\": 70,\n      \"max\": 220\n    },\n    \"hesitationProbability\": 0.22,\n    \"trajectorySteps\": 8,\n    \"seed\": 4242\n  },\n  \"note\": \"Subsequent interactions use this timing profile. DETERMINISTIC = zero delay (legacy behavior).\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Activates seeded human-like interaction profile**: activeProfile, profile, note
