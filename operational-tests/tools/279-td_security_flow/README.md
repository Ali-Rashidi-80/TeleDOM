# Operational Test: `td_security_flow`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 1ms

## Test Objective
Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_279_td_security_flow",
  "method": "tools/call",
  "params": {
    "name": "td_security_flow",
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
  "id": "op_req_279_td_security_flow",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"status\":\"PASS\",\"mode\":\"passive\",\"findingCount\":10,\"findings\":[{\"id\":\"sec:21\",\"category\":\"dom-xss\",\"severity\":\"high\",\"confidence\":0.75,\"observed\":\"script contains innerHTML assignment fed by location.hash\",\"verification\":\"PROBABLE\",\"remediation\":\"sanitize/encode data before DOM sink; prefer textContent; add Trusted-Types CSP\"},{\"id\":\"sec:22\",\"category\":\"dom-xss\",\"severity\":\"medium\",\"confidence\":0.5,\"observed\":\"script contains eval\",\"verification\":\"POTENTIAL\",\"remediation\":\"sanitize/encode data before DOM sink; prefer textContent; add Trusted-Types CSP\"},{\"id\":\"sec:23\",\"category\":\"csp\",\"severity\":\"high\",\"confidence\":0.8,\"observed\":\"CSP allows 'unsafe-inline' scripts\",\"verification\":\"CONFIRMED\",\"remediation\":\"replace inline scripts with nonced/hashed script-src entries\"},{\"id\":\"sec:24\",\"category\":\"cookie\",\"severity\":\"high\",\"confidence\":0.9,\"observed\":\"sensitive cookie \\\"session_id\\\" sent without Secure flag\",\"verification\":\"CONFIRMED\",\"remediation\":\"set Secure attribute (and HttpOnly/SameSite where applicable)\"},{\"id\":\"sec:25\",\"category\":\"storage\",\"severity\":\"medium\",\"confidence\":0.75,\"observed\":\"credential-shaped key \\\"auth_token\\\" stored client-side\",\"verification\":\"PROBABLE\",\"remediation\":\"avoid storing raw secrets in web storage; use short-lived scoped tokens\"},{\"id\":\"sec:26\",\"category\":\"iframe\",\"severity\":\"low\",\"confidence\":0.6,\"observed\":\"cross-origin iframe without sandbox attribute\",\"verification\":\"POTENTIAL\",\"remediation\":\"apply sandbox with least-privilege allow-* flags\"},{\"id\":\"sec:27\",\"category\":\"postMessage\",\"severity\":\"medium\",\"confidence\":0.7,\"observed\":\"postMessage with wildcard targetOrigin broadcasts data to any listener\",\"verification\":\"PROBABLE\",\"remediation\":\"send to an explicit target origin\"},{\"id\":\"sec:28\",\"category\":\"mixed-content\",\"severity\":\"medium\",\"confidence\":0.9,\"observed\":\"plaintext subresource on an https page (mixed content)\",\"verification\":\"CONFIRMED\",\"remediation\":\"serve all subresources over https\"},{\"id\":\"sec:29\",\"category\":\"auth-session\",\"severity\":\"info\",\"confidence\":0.6,\"observed\":\"auth transition observed: session-expiry — 401 observed on /api/orders\",\"verification\":\"POTENTIAL\",\"remediation\":\"verify session handling on expiry (redirect, token refresh, state cleanup)\"},{\"id\":\"sec:30\",\"category\":\"secret-exposure\",\"severity\":\"high\",\"confidence\":0.8,\"observed\":\"credential sent in Authorization header to a cross-origin endpoint\",\"verification\":\"PROBABLE\",\"remediation\":\"verify the destination origin is the intended audience for this credential\"}],\"note\":\"passive analysis only; suspicion is never reported as CONFIRMED without reproduction\",\"tool\":\"td_security_flow\",\"capability\":{\"version\":\"12.0.0\",\"category\":\"security-intelligence\",\"securityClass\":\"read-only\"}}"
      }
    ],
    "isError": false
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns a structured v12 intelligence result with honest status taxonomy (PASS/INCONCLUSIVE/DEGRADED/UNSUPPORTED)**: status, mode, findingCount, findings, note, tool, capability
