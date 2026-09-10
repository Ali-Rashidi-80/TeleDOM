# 🚀 Quickstart Tutorial — Zero to TeleDOM in 5 Minutes

Welcome to **TeleDOM**! This tutorial walks you through setting up TeleDOM, loading the Chrome Extension, starting the MCP Server & WebSocket Bridge, and connecting your first AI agent (Claude Desktop, Cursor, Antigravity, or Cline).

---

## 📋 Prerequisites

- **Node.js**: v18.0.0 or later (Node 20+ / 22+ recommended)
- **Google Chrome** (or any Chromium-based browser like Brave, Edge, Arc)
- **npm** or **yarn** or **pnpm**

---

## 🛠️ Step 1: Install and Build

Clone the repository and install dependencies:

```bash
git clone https://github.com/IrMaho/TeleDOM.git
cd TeleDOM

# Install dependencies
npm install

# Build client UI, Chrome Extension, and MCP Server
npm run build
```

This generates:
- `dist/extension/`: Unpacked Manifest V3 Chrome Extension scripts
- `dist/server/mcp-server.js`: Universal Stdio MCP Server
- `dist/server/bridge-server.js`: Realtime WebSocket Bridge Server (port 3847)
- `dist/src/ui/`: Interactive DevTools & Visual Inspector UI

---

## 🧩 Step 2: Load the Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the project directory (`TeleDOM/`).
5. You will see **TeleDOM — AI Agent Browser & DOM Forensic Platform (121 Tools)** loaded!

---

## 🤖 Step 3: Connect to Your AI Agent

### Option A: Claude Desktop

Open your `claude_desktop_config.json`:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Add the TeleDOM MCP Server:

```json
{
  "mcpServers": {
    "teledom": {
      "command": "node",
      "args": ["C:/path/to/TeleDOM/bin/mcp-server.js"]
    }
  }
}
```

### Option B: Cursor / Antigravity IDE

Add to your MCP Settings or `.gemini/antigravity-ide/mcp_config.json`:

```json
{
  "mcpServers": {
    "teledom": {
      "command": "node",
      "args": ["C:/path/to/TeleDOM/bin/mcp-server.js"]
    }
  }
}
```

---

## 🎯 Step 4: Your First TeleDOM Agent Command

Open any webpage in Chrome (for example, `https://github.com`), and ask your AI assistant:

> *"Use `inspect_live_page` to tell me the current URL and structure, then use `click_element` on the search bar."*

The AI agent will:
1. Connect to TeleDOM over Stdio JSON-RPC 2.0.
2. Auto-route through the WebSocket Bridge (`ws://127.0.0.1:3847`) to your active Chrome tab.
3. Inspect the page geometry, calculate resilient selector fingerprints, and perform the click with sub-millisecond precision.

---

## 🔍 Next Steps

- Explore [Complete 121 Tools Catalog](../reference/COMPLETE_TOOL_CATALOG.md)
- Learn [How to debug disappearing elements](../how-to/time-travel-debugging.md)
- Understand [Architecture & Dual-Environment Execution](../explanation/architecture-deep-dive.md)
