# Operational Test: `td_dom_snapshot`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 21ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_314_td_dom_snapshot",
  "method": "tools/call",
  "params": {
    "name": "td_dom_snapshot",
    "arguments": {
      "format": "json"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_314_td_dom_snapshot",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"format\":\"json\",\"result\":{\"truncated\":true,\"preview\":\"{\\\"snapshotId\\\":\\\"snap_3_1789147435207\\\",\\\"sessionId\\\":\\\"live_session\\\",\\\"timestamp\\\":406312.3,\\\"sequence\\\":3,\\\"rootId\\\":2,\\\"nodes\\\":{\\\"1\\\":{\\\"id\\\":1,\\\"nodeType\\\":1,\\\"parentId\\\":114,\\\"tagName\\\":\\\"div\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{\\\"id\\\":\\\"removable-card\\\",\\\"class\\\":\\\"card\\\",\\\"style\\\":\\\"background: #334155;\\\"},\\\"isHidden\\\":false,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[119,120,122]},\\\"2\\\":{\\\"id\\\":2,\\\"nodeType\\\":9,\\\"tagName\\\":\\\"#document\\\",\\\"children\\\":[3,4],\\\"parentId\\\":null},\\\"3\\\":{\\\"id\\\":3,\\\"nodeType\\\":10,\\\"tagName\\\":\\\"html\\\",\\\"parentId\\\":2},\\\"4\\\":{\\\"id\\\":4,\\\"nodeType\\\":1,\\\"parentId\\\":2,\\\"tagName\\\":\\\"html\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{\\\"lang\\\":\\\"en\\\"},\\\"isHidden\\\":false,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[5,15,16]},\\\"5\\\":{\\\"id\\\":5,\\\"nodeType\\\":1,\\\"parentId\\\":4,\\\"tagName\\\":\\\"head\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{},\\\"isHidden\\\":true,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[6,7,8,9,11,12,14]},\\\"6\\\":{\\\"id\\\":6,\\\"nodeType\\\":3,\\\"parentId\\\":5,\\\"textContent\\\":\\\"\\\\n  \\\"},\\\"7\\\":{\\\"id\\\":7,\\\"nodeType\\\":1,\\\"parentId\\\":5,\\\"tagName\\\":\\\"meta\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{\\\"charset\\\":\\\"UTF-8\\\"},\\\"isHidden\\\":true,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[]},\\\"8\\\":{\\\"id\\\":8,\\\"nodeType\\\":3,\\\"parentId\\\":5,\\\"textContent\\\":\\\"\\\\n  \\\"},\\\"9\\\":{\\\"id\\\":9,\\\"nodeType\\\":1,\\\"parentId\\\":5,\\\"tagName\\\":\\\"title\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{},\\\"isHidden\\\":true,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[10]},\\\"10\\\":{\\\"id\\\":10,\\\"nodeType\\\":3,\\\"parentId\\\":9,\\\"textContent\\\":\\\"MCP Operational Acceptance DOM Fixture\\\"},\\\"11\\\":{\\\"id\\\":11,\\\"nodeType\\\":3,\\\"parentId\\\":5,\\\"textContent\\\":\\\"\\\\n  \\\"},\\\"12\\\":{\\\"id\\\":12,\\\"nodeType\\\":1,\\\"parentId\\\":5,\\\"tagName\\\":\\\"style\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{},\\\"isHidden\\\":true,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[13]},\\\"13\\\":{\\\"id\\\":13,\\\"nodeType\\\":3,\\\"parentId\\\":12,\\\"textContent\\\":\\\"\\\\n    body { font-family: sans-serif; padding: 20px; background: #0f172a; color: #f8fafc; }\\\\n    .card { background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid #334155; }\\\\n    .btn { background: #38bdf8; color: #0f172a; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold; }\\\\n    .btn:hover { background: #0ea5e9; }\\\\n    .input-field { background: #0f172a; border: 1px solid #475569; color: #f8fafc; padding: 8px; border-radius: 4px; width: 240px; }\\\\n    .badge { background: #6366f1; color: white; padding: 2px 8px; border-radius: 9999px; font-size: 12px; }\\\\n    .hidden-state { display: none; }\\\\n    #scroll-box { height: 120px; width: 300px; overflow-y: scroll; background: #0f172a; border: 1px solid #334155; padding: 8px; }\\\\n  \\\"},\\\"14\\\":{\\\"id\\\":14,\\\"nodeType\\\":3,\\\"parentId\\\":5,\\\"textContent\\\":\\\"\\\\n\\\"},\\\"15\\\":{\\\"id\\\":15,\\\"nodeType\\\":3,\\\"parentId\\\":4,\\\"textContent\\\":\\\"\\\\n\\\"},\\\"16\\\":{\\\"id\\\":16,\\\"nodeType\\\":1,\\\"parentId\\\":4,\\\"tagName\\\":\\\"body\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{\\\"style\\\":\\\"cursor: default;\\\"},\\\"isHidden\\\":false,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[17,18,29,30,170,171,176]},\\\"17\\\":{\\\"id\\\":17,\\\"nodeType\\\":3,\\\"parentId\\\":16,\\\"textContent\\\":\\\"\\\\n  \\\"},\\\"18\\\":{\\\"id\\\":18,\\\"nodeType\\\":1,\\\"parentId\\\":16,\\\"tagName\\\":\\\"header\\\",\\\"isCustomElement\\\":false,\\\"namespaceURI\\\":\\\"http://www.w3.org/1999/xhtml\\\",\\\"attributes\\\":{\\\"id\\\":\\\"fixture-header\\\",\\\"class\\\":\\\"card\\\"},\\\"isHidden\\\":false,\\\"boundingClientRect\\\":{\\\"x\\\":0,\\\"y\\\":0,\\\"width\\\":0,\\\"height\\\":0,\\\"top\\\":0,\\\"left\\\":0,\\\"bottom\\\":0,\\\"right\\\":0},\\\"children\\\":[19,20,22,23,25,26,28]},\\\"19\\\":{\\\"id\\\":19,\\\"nodeType\\\":3,\\\"parentId\\\":18,\\\"textContent\\\":\\\"\\\\n    \\\"},\\\"20\\\":{\\\"id\\\":20,\\\"nodeType\\\":1,\\\"parentId\\\":18,\\\"tagName\\\":\\\"h1\\\",\\\"isCustom\",\"bytes\":28944},\"tool\":\"td_dom_snapshot\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, format, result, tool, capability
