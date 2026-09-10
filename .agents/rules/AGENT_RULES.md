# MCP-DOM & Browser Forensic Engineering Rules for AI Agents

## 1. Core Architecture (Dual-Environment Clean Architecture)
This project is divided into two distinct environments:
- **Chrome Extension Environment (`src/extension/`)**:
  - Runs in Chrome Browser sandbox (Manifest V3).
  - Background Service Worker (`src/extension/background/service-worker.ts`), Content Script (`src/extension/content/`), and Injected Page Scripts.
  - Zero external Node.js dependencies allowed inside browser extension scripts. All extension scripts MUST compile to self-contained bundles via `scripts/build-extension.js`.
- **Server / Bridge Environment (`src/mcp/` & `bin/`)**:
  - Runs in Node.js (v18+).
  - MCP Stdio Server (`bin/mcp-server.js` / `src/mcp/server.ts`): Implements JSON-RPC 2.0 stdio protocol with **121 MCP tools** (47 legacy + 74 platform-evolution tools).
  - WebSocket & HTTP Bridge Server (`bin/bridge-server.js` / `src/mcp/bridge-server.ts` on port 3847): Connects the Chrome Extension with MCP tool handlers in real-time. Includes liveness sweeper + unique client ids.
  - Node Simulation Context: when `bin/mcp-server.js` runs without Chrome, a JSDOM fixture DOM is installed (`__FORENSIC_SIMULATION__` marker) and background commands (tabs/extensions) return deterministic simulated state, clearly labeled `simulated: true`.

## 2. Coding & Tool Conventions
- **Adding New MCP Tools**:
  1. Define tool schema & description in `src/mcp/v3-tools-definition.ts` (new tools) or `src/mcp/tools-definition.ts` (legacy).
  2. Implement tool handler in `src/mcp/tools-handler.ts` (storage), `src/mcp/live-tools-handler.ts` (legacy live browser ops), or `src/mcp/extended-tools-handler.ts` (v3 platform tools).
  3. Register in the `ALL_TOOLS` array in `bin/cli.js` and update `.agents/mcp_config.json` (+ plugin config).
  4. Add the tool to the relevant group in `src/mcp/tool-groups.ts` (tool discovery contract).
  5. Run `npm run build` to compile TypeScript into `dist/`.
- **TypeScript & Build Commands**:
  - `npm run build` : Builds client UI, extension scripts, server bundles, and checks types.
  - `npm run test:unit` : Runs vitest suite for all modules.
  - `npm run test` / `npm run test:operational` : Full stdio operational acceptance suite (discovers tools dynamically).
  - `npm run dev` : Starts local Vite dev server.
- **Port Management**:
  - Default Bridge Server port is `3847`.
  - Health check endpoint: `http://localhost:3847/health`.

## 3. Safe Browser Control
- NEVER issue destructive commands (`close_tab`, `mutate_dom` with remove/replace ops, `execute_javascript`) without previewing first (`preview_dom_mutation`) or capturing state first (`capture_page_state`).
- `resize_viewport` is always reversible — call `reset_viewport` when a test completes. Never leave the browser in a modified viewport.
- Prefer `wait_for_condition` over arbitrary sleeps; never assume a page finished loading because navigation completed.

## 4. DOM Targeting
- Resolve elements through `generate_element_target` (multi-strategy TARGET with confidence) before storing references.
- Target resolution order is deterministic: `selectedElementRef → nodeId → selector → xpath → coordinates`.
- When a stored selector fails: use `recover_selector` with the stored snapshot; NEVER silently act on a low-confidence recovery (refusals are by design).

## 5. Mutation Safety
- Every DOM mutation produces an undo record — but transactions are preferred for multi-step changes: `mutate_dom_transaction {mode:'begin'}` → mutations → `commit`/`rollback`.
- `set_inner_html`/`set_outer_html` destroy descendant identity — captured regions targeting children may go stale; prefer surgical operations (set_attribute, add_class, set_style).
- After mutations, verify with `get_mutation_history` + `capture_page_state` + `compare_page_states`.

## 6. Project Capture
- Use `create_page_project` → `capture_page_region` (or `annotate_element`) for knowledge capture. Region annotations STRICTLY separate OBSERVED / USER / INTENDED CHANGE / VERIFICATION — never merge those categories.
- Captured DOM is cleaned automatically: MCPDOM UI excluded, secrets redacted. Never disable redaction for data you intend to persist.
- `export_agent_package` produces the cross-agent handoff format; the receiving agent needs nothing else.

## 7. Validation
- After any change to the platform: `npm run build` → `npm run test:unit` → `npm run test:operational`. All three must pass.
- The operational suite discovers tools from `FORENSIC_MCP_TOOLS` dynamically — a tool without an arg matrix entry in `scripts/run-operational-suite.js` will FAIL certification. Add one when adding a tool.
- Never report a capability as working without running its validation path (no fabricated success).

## 8. Rollback
- DOM: `undo_dom_mutation` / transaction rollback.
- Viewport: `reset_viewport`.
- Extension state: `set_extension_enabled` back to the original value; `compare_extension_states` to verify.
- Command side effects: replay inverse command sequences from a recording.

## 9. Use of Skills
- Consult `.agents/skills/<skill>/SKILL.md` BEFORE performing a workflow of that type. The skills encode preconditions, failure modes and recovery paths validated by the operational suite.
- When a workflow fails, the matching skill's FAILURE MODES section usually contains the diagnosis.

## 10. Tool Selection
- Call `get_tool_groups` / `get_tool_catalog` when unsure which tool applies. Tools are grouped: session-forensics, inspection, targeting, interaction, tabs-browser, selection-capture, viewport-responsive, javascript, dom-mutation, command-sequences, page-state, projects-knowledge, screenshots, security-privacy, discovery.
- Legacy `interact_with_element` remains fully supported; prefer the granular tools (`click_element`, `type_text`, …) for new work.

## 11. No-Fabrication Policy
- Never claim "implemented" when only types exist; never claim "tested" when the command was not run.
- Simulated results are always marked `simulated: true` — treat them as contract validation, NOT as proof of real browser behavior.
- If a capability is unavailable in a context (e.g. cross-origin frame), report the exact limitation instead of guessing.
