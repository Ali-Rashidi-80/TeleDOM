# Operational Test: `fx_evidence_scoring`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 0ms

## Test Objective
Scores the finding with confidence, band and evidence

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_205_fx_evidence_scoring",
  "method": "tools/call",
  "params": {
    "name": "fx_evidence_scoring",
    "arguments": {
      "conclusion": "The injected button was removed by a parent subtree replacement",
      "supporting": [
        {
          "source": "MUTATION_RECORD",
          "description": "Parent subtree replaced at t=400ms",
          "ref": "evt_op_007"
        },
        {
          "source": "DOM_OBSERVATION",
          "description": "Button absent from the reconstructed state at t=400ms"
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
  "id": "op_req_205_fx_evidence_scoring",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"finding\": {\n    \"id\": \"find_manual_mtx86ra0\",\n    \"conclusion\": \"The injected button was removed by a parent subtree replacement\",\n    \"confidence\": 0.964,\n    \"band\": \"VERY_HIGH\",\n    \"evidenceCount\": 2,\n    \"evidenceTypes\": [\n      \"MUTATION_RECORD\",\n      \"DOM_OBSERVATION\"\n    ],\n    \"evidence\": [\n      {\n        \"source\": \"MUTATION_RECORD\",\n        \"description\": \"Parent subtree replaced at t=400ms\",\n        \"ref\": \"evt_op_007\",\n        \"weight\": 0.8\n      },\n      {\n        \"source\": \"DOM_OBSERVATION\",\n        \"description\": \"Button absent from the reconstructed state at t=400ms\",\n        \"weight\": 0.72\n      }\n    ],\n    \"method\": \"Direct evidence scoring (fx_evidence_scoring)\"\n  },\n  \"methodology\": \"Noisy-OR over evidence weights + source diversity bonus − contradiction penalty. Capped [0.05, 0.98]; single-evidence findings cap at 0.75.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Scores the finding with confidence, band and evidence**: finding, methodology
