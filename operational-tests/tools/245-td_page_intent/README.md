# Operational Test: `td_page_intent`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_245_td_page_intent",
  "method": "tools/call",
  "params": {
    "name": "td_page_intent",
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
  "id": "op_req_245_td_page_intent",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"workflows\":[\"html-region\",\"head-region\",\"meta-region\",\"title-region\",\"style-region\",\"body-region\",\"page-header\",\"h1-region\",\"p-region\",\"span-region\",\"main-region\",\"section-region\",\"h2-region\",\"div-region\",\"field-label\",\"data-entry\",\"test-target(action-button)\",\"choice\",\"option-region\",\"input-group\",\"submit-action\",\"page-footer\"],\"interactionZones\":[{\"role\":\"data-entry\",\"purpose\":\"input:text\",\"text\":\"\",\"selector\":\"#search-input\"},{\"role\":\"test-target(action-button)\",\"purpose\":\"button:test-target(action-button)\",\"text\":\"⚡ Run Analysis\",\"selector\":\"#primary-action-btn\"},{\"role\":\"choice\",\"purpose\":\"select:choice\",\"text\":\"Default Option\\n          Security Analysis\\n          Performance Trace\",\"selector\":\"#category-select\"},{\"role\":\"data-entry\",\"purpose\":\"input:text\",\"text\":\"\",\"selector\":\"#feature-toggle\"},{\"role\":\"data-entry\",\"purpose\":\"input:text\",\"text\":\"\",\"selector\":\"#report-file-input\"},{\"role\":\"data-entry\",\"purpose\":\"input:text\",\"text\":\"\",\"selector\":\"#username-input\"},{\"role\":\"data-entry\",\"purpose\":\"input:text\",\"text\":\"\",\"selector\":\"#password-input\"},{\"role\":\"data-entry\",\"purpose\":\"input:text\",\"text\":\"\",\"selector\":\"input\"},{\"role\":\"data-entry\",\"purpose\":\"input:text\",\"text\":\"\",\"selector\":\"input\"},{\"role\":\"submit-action\",\"purpose\":\"action:save settings\",\"text\":\"Save Settings\",\"selector\":\"#settings-submit-btn\"}],\"interactiveCount\":10,\"tool\":\"td_page_intent\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"semantic-component\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, workflows, interactionZones, interactiveCount, tool, capability
