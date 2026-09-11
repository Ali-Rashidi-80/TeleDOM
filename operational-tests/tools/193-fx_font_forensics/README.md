# Operational Test: `fx_font_forensics`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 29ms

## Test Objective
Analyzes @font-face usage and font issues

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_193_fx_font_forensics",
  "method": "tools/call",
  "params": {
    "name": "fx_font_forensics",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_193_fx_font_forensics",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"declaredFontFaces\": [],\n  \"declaredFamilyCount\": 0,\n  \"usedFamilies\": [\n    {\n      \"family\": \"sans-serif\",\n      \"usageCount\": 58\n    }\n  ],\n  \"documentFontsStatus\": [],\n  \"fontsApiAvailable\": false,\n  \"issues\": [\n    {\n      \"issue\": \"no-fallback-stack\",\n      \"detail\": \"58 element(s) declare a single font-family with no fallback — layout shift risk if the font fails/metrics differ.\",\n      \"severity\": \"warn\"\n    }\n  ],\n  \"issueCount\": 1,\n  \"notes\": [\n    \"Font metrics analysis: @font-face declarations cross-referenced with computed font-family usage and document.fonts load status.\",\n    \"In JSDOM, document.fonts and layout metrics are limited — @font-face CSSOM analysis remains real; load-status is reported only when the API exists.\"\n  ]\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Analyzes @font-face usage and font issues**: declaredFontFaces, declaredFamilyCount, usedFamilies, documentFontsStatus, fontsApiAvailable, issues, issueCount, notes
