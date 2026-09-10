# Operational Test: `get_action_timeline`

**Status**: **PASS** (2/2 Assertions Passed)
**Transport**: `JSON-RPC 2.0 over Stdio Subprocess`
**Execution Mode**: `historical`
**Duration**: 3ms

## Test Objective
Returns chronological timeline events

## Raw Transmitted JSON-RPC Request
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_099_get_action_timeline",
  "method": "tools/call",
  "params": {
    "name": "get_action_timeline",
    "arguments": {
      "limit": 20
    }
  }
}
```

## Raw Received JSON-RPC Response
```json
{
  "jsonrpc": "2.0",
  "id": "op_req_099_get_action_timeline",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[\n  {\n    \"eventId\": \"evt_mtuudxed_56\",\n    \"timestamp\": 1789003321429,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"mutate_dom → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_35_mtuudxed\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxei_57\",\n    \"timestamp\": 1789003321434,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"mutate_dom_transaction → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_36_mtuudxei\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxen_58\",\n    \"timestamp\": 1789003321439,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"undo_dom_mutation → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_37_mtuudxen\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxes_59\",\n    \"timestamp\": 1789003321444,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"redo_dom_mutation → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_38_mtuudxes\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxey_60\",\n    \"timestamp\": 1789003321450,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"get_mutation_history → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_39_mtuudxey\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxf3_61\",\n    \"timestamp\": 1789003321455,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"preview_dom_mutation → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_40_mtuudxf3\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxfn_62\",\n    \"timestamp\": 1789003321475,\n    \"kind\": \"DOM_MUTATED\",\n    \"detail\": \"clone_subtree on #removable-card → OK\"\n  },\n  {\n    \"eventId\": \"evt_mtuudxfn_63\",\n    \"timestamp\": 1789003321475,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"clone_dom_subtree → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_41_mtuudxfn\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxg1_64\",\n    \"timestamp\": 1789003321489,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"generate_element_target → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_42_mtuudxg1\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxg1_65\",\n    \"timestamp\": 1789003321489,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"execute_command_sequence → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_43_mtuudxg1\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxg6_66\",\n    \"timestamp\": 1789003321494,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"record_commands_start → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_44_mtuudxg6\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxga_67\",\n    \"timestamp\": 1789003321498,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"record_commands_stop → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_45_mtuudxga\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxgg_68\",\n    \"timestamp\": 1789003321504,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"list_command_recordings → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_46_mtuudxgg\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxgm_69\",\n    \"timestamp\": 1789003321510,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"get_command_recording → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_47_mtuudxgm\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxgs_70\",\n    \"timestamp\": 1789003321516,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"record_commands_start → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_48_mtuudxgs\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxgs_71\",\n    \"timestamp\": 1789003321516,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"replay_command_recording → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_49_mtuudxgs\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxgx_72\",\n    \"timestamp\": 1789003321521,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"export_command_recording → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_50_mtuudxgx\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxh2_73\",\n    \"timestamp\": 1789003321526,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"import_command_recording → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_51_mtuudxh2\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxh8_74\",\n    \"timestamp\": 1789003321532,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"delete_command_recording → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_52_mtuudxh8\"\n    }\n  },\n  {\n    \"eventId\": \"evt_mtuudxhe_75\",\n    \"timestamp\": 1789003321538,\n    \"kind\": \"COMMAND_EXECUTED\",\n    \"sessionId\": \"sess_mtuudrux\",\n    \"detail\": \"get_browser_session → SUCCESS\",\n    \"data\": {\n      \"commandId\": \"cmd_53_mtuudxhe\"\n    }\n  }\n]"
      }
    ]
  }
}
```

## Assertions
- [x] **JSON-RPC 2.0 Stdio Status Code & Envelope**: Successful JSON-RPC 2.0 resolution across stdio pipe
- [x] **Returns chronological timeline events**: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19
