# Operational Test: `get_project`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Loads project manifest, page and regions

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_106_get_project",
  "method": "tools/call",
  "params": {
    "name": "get_project",
    "arguments": {
      "projectName": "op-project"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_106_get_project",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"manifest\": {\n    \"schemaVersion\": \"1.0.0\",\n    \"projectId\": \"proj_mtx86oeo\",\n    \"name\": \"op-project\",\n    \"description\": \"Operational project\",\n    \"createdAt\": 1789147430160,\n    \"updatedAt\": 1789147430160,\n    \"pages\": [\n      \"page_mtx86oeo\"\n    ],\n    \"regionCount\": 0,\n    \"commandRecordingCount\": 0,\n    \"tags\": [],\n    \"toolVersion\": \"3.0.0\"\n  },\n  \"page\": {\n    \"schemaVersion\": \"1.0.0\",\n    \"pageId\": \"page_mtx86oeo\",\n    \"projectId\": \"proj_mtx86oeo\",\n    \"url\": \"https://app.internal/dashboard\",\n    \"title\": \"MCP Operational Acceptance DOM Fixture\",\n    \"capturedAt\": 1789147430160,\n    \"viewport\": {\n      \"width\": 1024,\n      \"height\": 768,\n      \"devicePixelRatio\": 1\n    },\n    \"domSnapshotFile\": \"dom/page_page_mtx86oeo.html\",\n    \"regions\": [],\n    \"browserState\": {\n      \"extensionEnabled\": true,\n      \"readyState\": \"complete\",\n      \"visibilityState\": \"visible\"\n    }\n  },\n  \"regions\": [],\n  \"projectDir\": \".mcpdom_projects/op-project\"\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Loads project manifest, page and regions**: manifest, page, regions, projectDir
