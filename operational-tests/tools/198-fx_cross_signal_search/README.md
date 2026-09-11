# Operational Test: `fx_cross_signal_search`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 10ms

## Test Objective
Cross-domain search returns scored hits

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_198_fx_cross_signal_search",
  "method": "tools/call",
  "params": {
    "name": "fx_cross_signal_search",
    "arguments": {
      "sessionId": "operational_acceptance_session_001",
      "query": "injected-action-btn"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_198_fx_cross_signal_search",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"sessionId\": \"operational_acceptance_session_001\",\n  \"query\": \"injected-action-btn\",\n  \"hits\": [\n    {\n      \"domain\": \"DOM\",\n      \"eventId\": \"evt_op_001\",\n      \"timestamp\": 50,\n      \"selector\": \"#injected-action-btn\",\n      \"excerpt\": \"DOM_MUTATION_ADD #injected-action-btn {\\\"node\\\":{\\\"id\\\":10,\\\"nodeType\\\":1,\\\"tagName\\\":\\\"button\\\",\\\"attributes\\\":{\\\"class\\\":\\\"btn btn-primary\\\",\\\"id\\\":\\\"injected-action-btn\\\"},\\\"textContent\\\":\\\"⚡ Run An\",\n      \"score\": 5\n    },\n    {\n      \"domain\": \"USER\",\n      \"eventId\": \"evt_op_002\",\n      \"timestamp\": 100,\n      \"selector\": \"#injected-action-btn\",\n      \"excerpt\": \"USER_CLICK #injected-action-btn {\\\"x\\\":120,\\\"y\\\":45,\\\"button\\\":0}\",\n      \"score\": 5\n    }\n  ],\n  \"byDomain\": {\n    \"DOM\": 1,\n    \"USER\": 1\n  },\n  \"relatedEvidence\": [\n    {\n      \"domain\": \"CONSOLE\",\n      \"eventId\": \"evt_op_003\",\n      \"relation\": \"100ms after top hit\",\n      \"excerpt\": \"CONSOLE_LOG  {\\\"level\\\":\\\"log\\\",\\\"message\\\":\\\"Analysis requested for active dashboard context\\\"}\"\n    },\n    {\n      \"domain\": \"NETWORK\",\n      \"eventId\": \"evt_op_004\",\n      \"relation\": \"150ms after top hit\",\n      \"excerpt\": \"NETWORK_REQUEST_START  {\\\"requestId\\\":\\\"req_op_99\\\",\\\"url\\\":\\\"https://api.internal/v1/analyze\\\",\\\"method\\\":\\\"POST\\\"}\"\n    },\n    {\n      \"domain\": \"NETWORK\",\n      \"eventId\": \"evt_op_005\",\n      \"relation\": \"230ms after top hit\",\n      \"excerpt\": \"NETWORK_RESPONSE_COMPLETE  {\\\"requestId\\\":\\\"req_op_99\\\",\\\"url\\\":\\\"https://api.internal/v1/analyze\\\",\\\"status\\\":200,\\\"durationMs\\\":80}\"\n    },\n    {\n      \"domain\": \"ERROR\",\n      \"eventId\": \"evt_op_006\",\n      \"relation\": \"220ms after top hit\",\n      \"excerpt\": \"RUNTIME_ERROR  {\\\"message\\\":\\\"Uncaught TypeError: Cannot read properties of undefined\\\",\\\"stack\\\":\\\"TypeError at dashboard\"\n    }\n  ],\n  \"suggestions\": []\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Cross-domain search returns scored hits**: sessionId, query, hits, byDomain, relatedEvidence, suggestions
