# Operational Test: `td_workflow_validate`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_337_td_workflow_validate",
  "method": "tools/call",
  "params": {
    "name": "td_workflow_validate",
    "arguments": {
      "workflow": {
        "schema": "teledom.agent-workflow/1.0",
        "id": "wf-op-extension-smoke-v1",
        "name": "extension_smoke_test",
        "version": "1.0.0",
        "description": "Reusable extension smoke test: observe page, verify CTA target, click, extract counter, assert state",
        "tags": [
          "operational",
          "smoke-test",
          "v4.1"
        ],
        "inputs": {
          "cta_selector": {
            "description": "Primary CTA selector",
            "required": false,
            "default": "#primary-action-btn"
          },
          "counter_selector": {
            "description": "Counter output selector",
            "required": false,
            "default": "#click-counter"
          }
        },
        "steps": [
          {
            "id": "inspect",
            "tool": "td_dom_inspect",
            "description": "observe the page (agent eyes)"
          },
          {
            "id": "verify_cta",
            "tool": "td_target_check",
            "args": {
              "selector": "{{inputs.cta_selector}}"
            },
            "description": "cheap target check — no DOM re-analysis"
          },
          {
            "id": "click_cta",
            "tool": "td_action_click",
            "args": {
              "selector": "{{inputs.cta_selector}}"
            },
            "description": "interact"
          },
          {
            "id": "extract_counter",
            "tool": "td_dom_extract",
            "args": {
              "selector": "{{inputs.counter_selector}}",
              "fields": {
                "text": "el.textContent.trim()"
              }
            },
            "description": "structured extraction"
          },
          {
            "id": "assert_state",
            "tool": "td_execute_script",
            "args": {
              "code": "return document.querySelector(\"{{inputs.counter_selector}}\").textContent.trim();"
            },
            "description": "verify post-click state"
          }
        ],
        "policy": {
          "maxSteps": 20,
          "maxRuntimeMs": 60000
        },
        "metadata": {
          "author": "operational-acceptance-suite",
          "site": "fixture",
          "purpose": "extension regression testing"
        }
      }
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_337_td_workflow_validate",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"valid\":true,\"issues\":[],\"stepCount\":5,\"note\":\"structural envelope validation only — semantics are the agent’s responsibility\",\"tool\":\"td_workflow_validate\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"workflow-runtime\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, valid, issues, stepCount, note, tool, capability
