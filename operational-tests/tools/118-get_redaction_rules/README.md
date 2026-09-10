# Operational Test: `get_redaction_rules`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Returns redaction rules and capture exclusions

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_118_get_redaction_rules",
  "method": "tools/call",
  "params": {
    "name": "get_redaction_rules",
    "arguments": {}
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_118_get_redaction_rules",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"rules\": [\n    {\n      \"ruleId\": \"red_key_password\",\n      \"kind\": \"key-pattern\",\n      \"pattern\": \"password|passwd|pwd\",\n      \"description\": \"Keys containing password/passwd/pwd\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_key_token\",\n      \"kind\": \"key-pattern\",\n      \"pattern\": \"token|jwt|bearer|auth|session.?id|secret|api.?key|client.?secret\",\n      \"description\": \"Keys containing token/jwt/auth/session-id/secret/api-key\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_key_credential\",\n      \"kind\": \"key-pattern\",\n      \"pattern\": \"credential|login|user.?pass|otp|2fa|mfa|verification\",\n      \"description\": \"Keys containing credential/login/otp/2fa/verification\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_key_payment\",\n      \"kind\": \"key-pattern\",\n      \"pattern\": \"card|payment|billing|iban|cvv|cvc|pan\",\n      \"description\": \"Keys containing card/payment/billing/iban/cvv\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_key_personal\",\n      \"kind\": \"key-pattern\",\n      \"pattern\": \"ssn|social.?security|national.?id|passport|tax.?id\",\n      \"description\": \"Keys containing personal identifier patterns\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_val_jwt\",\n      \"kind\": \"value-pattern\",\n      \"pattern\": \"eyJ[A-Za-z0-9_-]+\\\\.[A-Za-z0-9_-]+\\\\.[A-Za-z0-9_-]+\",\n      \"description\": \"JWT-shaped tokens\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_val_bearer\",\n      \"kind\": \"value-pattern\",\n      \"pattern\": \"bearer\\\\s+[A-Za-z0-9._-]+\",\n      \"description\": \"Bearer tokens\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_val_long_hex\",\n      \"kind\": \"value-pattern\",\n      \"pattern\": \"\\\\b[a-f0-9]{32,}\\\\b\",\n      \"description\": \"32+ char hex strings (session/API ids)\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_val_sk\",\n      \"kind\": \"value-pattern\",\n      \"pattern\": \"\\\\b(sk|pk|rk)_[A-Za-z0-9_]{20,}\\\\b\",\n      \"description\": \"Stripe-style secret keys (sk_live_…)\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_attr_input_password\",\n      \"kind\": \"attribute-name\",\n      \"pattern\": \"value\",\n      \"description\": \"value attributes on password inputs handled by PrivacyEngine maskValue\",\n      \"enabled\": true,\n      \"userAdded\": false\n    },\n    {\n      \"ruleId\": \"red_attr_secret\",\n      \"kind\": \"attribute-name\",\n      \"pattern\": \"data-secret|data-token|data-api-key|secret|access.?token\",\n      \"description\": \"Secret-carrying attributes\",\n      \"enabled\": true,\n      \"userAdded\": false\n    }\n  ],\n  \"exclusions\": [\n    {\n      \"exclusionId\": \"excl_mcpdom_overlay\",\n      \"selector\": \"[data-mcpdom-internal], [data-forensic-internal], #forensic-recorder-floating-host, #forensic-inspect-highlighter\",\n      \"reason\": \"MCPDOM-injected UI must never contaminate captured DOM (§68 clean capture)\",\n      \"userAdded\": false\n    },\n    {\n      \"exclusionId\": \"excl_mcpdom_ids\",\n      \"selector\": \"[id^=\\\"forensic-\\\"], [id^=\\\"mcpdom-\\\"]\",\n      \"reason\": \"MCPDOM-namespaced nodes\",\n      \"userAdded\": false\n    }\n  ],\n  \"stubMode\": true\n}"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns redaction rules and capture exclusions**: rules, exclusions, stubMode
