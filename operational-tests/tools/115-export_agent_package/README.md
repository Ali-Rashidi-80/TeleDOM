# Operational Test: `export_agent_package`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 2ms

## Test Objective
Exports self-contained agent package

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_115_export_agent_package",
  "method": "tools/call",
  "params": {
    "name": "export_agent_package",
    "arguments": {
      "projectName": "op-project",
      "outputDir": "./operational-test-scratch/agent-package-op"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_115_export_agent_package",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"packageDir\": \"/home/z/my-project/mcpdom-work/mcpdom-unified/operational-test-scratch/agent-package-op\",\n  \"fileCount\": 12,\n  \"files\": [\n    \"project.json\",\n    \"pages/page.json\",\n    \"pages/page-snapshot.html\",\n    \"regions/region_mtulky7b_1.json\",\n    \"regions/region_region_mtulky7b_1.html\",\n    \"regions/region_region_mtulky7b_1_context.html\",\n    \"schemas/region-annotation.schema.json\",\n    \"verification/verification-matrix.json\",\n    \"snapshots/capture-context.json\",\n    \"README.md\",\n    \"PROJECT.md\",\n    \"agent-instructions.md\"\n  ],\n  \"summary\": {\n    \"regions\": 1,\n    \"commands\": 0,\n    \"diffs\": 0,\n    \"bytes\": 17535\n  },\n  \"note\": \"Self-contained package: another agent can consume it without MCPDOM running.\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Exports self-contained agent package**: packageDir, fileCount, files, summary, note
