# Operational Test: `td_workflow_run`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 330ms

## Test Objective
Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_338_td_workflow_run",
  "method": "tools/call",
  "params": {
    "name": "td_workflow_run",
    "arguments": {
      "name": "extension_smoke_test"
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_338_td_workflow_run",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"runId\":\"run_1789147437086_6be05530\",\"workflow\":\"extension_smoke_test@1.1.0\",\"run\":{\"id\":\"run_1789147437086_6be05530\",\"workflowId\":\"wf-op-extension-smoke-v1\",\"workflowName\":\"extension_smoke_test\",\"workflowVersion\":\"1.1.0\",\"status\":\"SUCCESS\",\"startedAt\":1789147437086,\"finishedAt\":1789147437414,\"inputs\":{},\"steps\":[{\"stepId\":\"inspect\",\"tool\":\"td_dom_inspect\",\"status\":\"PASS\",\"attempts\":1,\"durationMs\":3},{\"stepId\":\"verify_cta\",\"tool\":\"td_target_check\",\"status\":\"PASS\",\"attempts\":1,\"durationMs\":8},{\"stepId\":\"click_cta\",\"tool\":\"td_action_click\",\"status\":\"PASS\",\"attempts\":1,\"durationMs\":308},{\"stepId\":\"extract_counter\",\"tool\":\"td_dom_extract\",\"status\":\"PASS\",\"attempts\":1,\"durationMs\":4},{\"stepId\":\"assert_state\",\"tool\":\"td_execute_script\",\"status\":\"PASS\",\"attempts\":1,\"durationMs\":4}],\"metrics\":{\"stepsPlanned\":5,\"stepsExecuted\":5,\"toolCalls\":5,\"domScans\":1,\"retries\":0,\"durationMs\":328,\"tokensSavedEstimate\":1520}},\"tool\":\"td_workflow_run\",\"capability\":{\"version\":\"4.1.0\",\"category\":\"workflow-runtime\",\"securityClass\":\"policy-gated\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v4 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, runId, workflow, run, tool, capability
