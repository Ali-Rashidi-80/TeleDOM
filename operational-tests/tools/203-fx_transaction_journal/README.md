# Operational Test: `fx_transaction_journal`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Queries the transaction journal store

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_203_fx_transaction_journal",
  "method": "tools/call",
  "params": {
    "name": "fx_transaction_journal",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_203_fx_transaction_journal",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"entries\": [\n    {\n      \"transactionId\": \"tx_2\",\n      \"actor\": \"mcp-agent\",\n      \"intent\": \"clone_dom_subtree\",\n      \"operation\": \"clone_subtree\",\n      \"target\": \"#removable-card\",\n      \"before\": {\n        \"selector\": \"#removable-card\",\n        \"htmlPreview\": \"\",\n        \"attributes\": {\n          \"id\": \"removable-card\",\n          \"class\": \"card\",\n          \"style\": \"background: #334155;\"\n        }\n      },\n      \"after\": {\n        \"selector\": \"#removable-card\",\n        \"htmlPreview\": \"\",\n        \"attributes\": {\n          \"id\": \"removable-card\",\n          \"class\": \"card\",\n          \"style\": \"background: #334155;\"\n        }\n      },\n      \"diff\": \"no property-level diff detected\",\n      \"evidence\": [\n        \"no undo record (transaction-internal rollback only)\",\n        \"mutation id mut_mtwg5rnd_3\"\n      ],\n      \"timestamp\": 1789100358472,\n      \"rollbackInfo\": {\n        \"reversible\": false,\n        \"undoRecordAvailable\": false,\n        \"rollbackCommand\": \"mutate_dom_transaction {mode:\\\"rollback\\\"}\"\n      },\n      \"outcome\": \"COMMITTED\"\n    },\n    {\n      \"transactionId\": \"tx_mtwg5rn6_2\",\n      \"actor\": \"mcp-agent\",\n      \"intent\": \"transaction:begin\",\n      \"operation\": \"unknown\",\n      \"target\": \"unknown\",\n      \"before\": {\n        \"selector\": \"?\",\n        \"htmlPreview\": \"\",\n        \"attributes\": null\n      },\n      \"after\": null,\n      \"diff\": \"operation failed\",\n      \"evidence\": [\n        \"no undo record (transaction-internal rollback only)\",\n        \"mutation id unavailable\"\n      ],\n      \"timestamp\": 1789100358450,\n      \"rollbackInfo\": {\n        \"reversible\": false,\n        \"undoRecordAvailable\": false,\n        \"rollbackCommand\": \"mutate_dom_transaction {mode:\\\"rollback\\\"}\"\n      },\n      \"outcome\": \"ROLLED_BACK\"\n    },\n    {\n      \"transactionId\": \"tx_1\",\n      \"actor\": \"mcp-agent\",\n      \"intent\": \"mutate_dom\",\n      \"operation\": \"add_class\",\n      \"target\": \"#dynamic-text\",\n      \"before\": {\n        \"selector\": \"#dynamic-text\",\n        \"htmlPreview\": \"\",\n        \"attributes\": {\n          \"id\": \"dynamic-text\"\n        }\n      },\n      \"after\": {\n        \"selector\": \"#dynamic-text\",\n        \"htmlPreview\": \"\",\n        \"attributes\": {\n          \"id\": \"dynamic-text\",\n          \"class\": \"op-test\"\n        }\n      },\n      \"diff\": \"class: ∅ → op-test\",\n      \"evidence\": [\n        \"no undo record (transaction-internal rollback only)\",\n        \"mutation id mut_mtwg5rmq_1\"\n      ],\n      \"timestamp\": 1789100358447,\n      \"rollbackInfo\": {\n        \"reversible\": false,\n        \"undoRecordAvailable\": false,\n        \"rollbackCommand\": \"mutate_dom_transaction {mode:\\\"rollback\\\"}\"\n      },\n      \"outcome\": \"COMMITTED\"\n    }\n  ],\n  \"total\": 3,\n  \"stats\": {\n    \"total\": 3,\n    \"committed\": 2,\n    \"rolledBack\": 1,\n    \"open\": 0\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Queries the transaction journal store**: entries, total, stats
