# Operational Test: `td_dom_extract`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 5ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_313_td_dom_extract",
  "method": "tools/call",
  "params": {
    "name": "td_dom_extract",
    "arguments": {
      "selector": "p",
      "limit": 10
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_313_td_dom_extract",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"selector\":\"p\",\"result\":{\"status\":\"EXECUTED_SUCCESSFULLY\",\"executionId\":\"js_mtx86sab_33\",\"durationMs\":2,\"result\":\"[{\\\"text\\\":\\\"Deterministic test harness for live & historical MCP capabilities\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"Scrollable item 1\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"Scrollable item 2\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"Scrollable item 3\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"Scrollable item 4\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"🎯 Deep Target Element\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"Scrollable item 6\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"Original Static Text Content\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"},{\\\"text\\\":\\\"Forensic MCP Operational Test Suite — Browser Environment\\\",\\\"tag\\\":\\\"p\\\",\\\"attrs\\\":\\\"{}\\\"}]\",\"consoleOutput\":[],\"domChanged\":false,\"domLengthBefore\":4594,\"domLengthAfter\":4594,\"world\":\"ISOLATED\",\"timeoutMs\":5000,\"codePreview\":\"const els = Array.from(document.querySelectorAll(\\\"p\\\")).slice(0, 10);\\nreturn JSON.stringify(els.map(el => ({ \\\"text\\\": (()=>{ try { return el.textContent.trim(); } catch(e) { return null; } })(),\\\"tag\\\": (()=>{ try { return el.tagName.toLowerCase(); } catch(e) { return null; } })(),\\\"attrs\\\": (()=>{ try { …\"},\"tool\":\"td_dom_extract\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"browser-primitives\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, selector, result, tool, capability
