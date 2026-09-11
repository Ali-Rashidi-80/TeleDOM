# Operational Test: `fx_error_root_cause`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 7ms

## Test Objective
Builds the error root-cause graph with ranked causes

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_190_fx_error_root_cause",
  "method": "tools/call",
  "params": {
    "name": "fx_error_root_cause",
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
  "id": "op_req_190_fx_error_root_cause",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"error\": {\n    \"eventId\": \"evt_op_006\",\n    \"type\": \"RUNTIME_ERROR\",\n    \"message\": \"Uncaught TypeError: Cannot read properties of undefined\",\n    \"timestamp\": 320,\n    \"stack\": \"TypeError at dashboard.js:42:12\"\n  },\n  \"nodes\": [\n    {\n      \"id\": \"error\",\n      \"kind\": \"runtime-error\",\n      \"label\": \"Uncaught TypeError: Cannot read properties of undefined\",\n      \"timestamp\": 320\n    },\n    {\n      \"id\": \"stack\",\n      \"kind\": \"stack-trace\",\n      \"label\": \"TypeError at dashboard.js:42:12\"\n    },\n    {\n      \"id\": \"mut_evt_op_001\",\n      \"kind\": \"dom-mutation\",\n      \"label\": \"+ <button> into 4 (#injected-action-btn)\",\n      \"timestamp\": 50\n    },\n    {\n      \"id\": \"mut_evt_op_007\",\n      \"kind\": \"dom-mutation\",\n      \"label\": \"- <?> node=4 subtree=2\",\n      \"timestamp\": 380\n    },\n    {\n      \"id\": \"mut_evt_op_008\",\n      \"kind\": \"dom-mutation\",\n      \"label\": \"SCREENSHOT_CHECKPOINT {\\\"screenshotId\\\":\\\"scr_op_chk_1\\\",\\\"dataUrl\\\":\\\"data:image/png;base64,iVBORw0KGgoAAAAN\",\n      \"timestamp\": 450\n    },\n    {\n      \"id\": \"sym_evt_op_007\",\n      \"kind\": \"visible-symptom\",\n      \"label\": \"Element disappeared: - <?> node=4 subtree=2\",\n      \"timestamp\": 380\n    }\n  ],\n  \"edges\": [\n    {\n      \"from\": \"error\",\n      \"to\": \"stack\",\n      \"relation\": \"stackTrace\"\n    },\n    {\n      \"from\": \"mut_evt_op_001\",\n      \"to\": \"error\",\n      \"relation\": \"preceded\"\n    },\n    {\n      \"from\": \"mut_evt_op_007\",\n      \"to\": \"error\",\n      \"relation\": \"followed\"\n    },\n    {\n      \"from\": \"mut_evt_op_008\",\n      \"to\": \"error\",\n      \"relation\": \"followed\"\n    },\n    {\n      \"from\": \"error\",\n      \"to\": \"sym_evt_op_007\",\n      \"relation\": \"likelyCaused\"\n    }\n  ],\n  \"rankedRootCauses\": [\n    {\n      \"label\": \"+ <button> into 4 (#injected-action-btn)\",\n      \"confidence\": 0.956,\n      \"band\": \"VERY_HIGH\",\n      \"evidenceCount\": 2,\n      \"evidenceTypes\": [\n        \"MUTATION_RECORD\",\n        \"CONSOLE_EVIDENCE\"\n      ]\n    }\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Builds the error root-cause graph with ranked causes**: sessionId, error, nodes, edges, rankedRootCauses
