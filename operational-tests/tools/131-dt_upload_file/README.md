# Operational Test: `dt_upload_file`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `live`
**Duration**: 3ms

## Test Objective
Sets the file input files and dispatches input/change

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_131_dt_upload_file",
  "method": "tools/call",
  "params": {
    "name": "dt_upload_file",
    "arguments": {
      "selector": "#report-file-input",
      "files": [
        "report.pdf"
      ]
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_131_dt_upload_file",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"uploaded\": true,\n  \"files\": [\n    \"report.pdf\"\n  ],\n  \"selector\": \"#report-file-input\",\n  \"pageId\": \"page_1\",\n  \"detail\": {\n    \"set\": true,\n    \"acceptedFiles\": [\n      \"report.pdf\"\n    ],\n    \"mechanism\": \"FileList-property (DataTransfer unavailable in this context)\"\n  }\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Sets the file input files and dispatches input/change**: uploaded, files, selector, pageId, detail
