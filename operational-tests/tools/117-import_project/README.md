# Operational Test: `import_project`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Imports exported agent package back into working storage (name derived from manifest)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_117_import_project",
  "method": "tools/call",
  "params": {
    "name": "import_project",
    "arguments": {
      "projectDir": "./operational-test-scratch/agent-package-op"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_117_import_project",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"imported\": true,\n  \"name\": \"op-project\",\n  \"regionCount\": 1,\n  \"pageCount\": 1\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Imports exported agent package back into working storage (name derived from manifest)**: imported, name, regionCount, pageCount
