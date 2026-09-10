import fs from 'fs';
import path from 'path';
import { FORENSIC_MCP_TOOLS } from '../dist/server/mcp-server.js';

const allToolNames = FORENSIC_MCP_TOOLS.map(t => t.name);
console.log(`Syncing all MCP configurations with ${allToolNames.length} tools...`);

const targetServerScript = 'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM-Browser-source/McpDOM-Browser-source/bin/mcp-server.js';

const configTemplate = {
  mcpServers: {
    'browser-forensics': {
      command: 'node',
      args: [targetServerScript],
      disabled: false,
      alwaysAllow: allToolNames
    }
  }
};

const configPaths = [
  'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/.agents/mcp_config.json',
  'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM-Browser-source/McpDOM-Browser-source/.agents/mcp_config.json',
  'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM-Browser-source/McpDOM-Browser-source/.agents/plugins/browser-forensics/mcp_config.json',
  'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM+Browser-2.1.0-x64/McpDOM+Browser-2.1.0-x64/.agents/mcp_config.json',
  'c:/Users/ASUS/Downloads/mcpdom-browser-complete-2.1.0/McpDOM+Browser-2.1.0-x64/McpDOM+Browser-2.1.0-x64/.agents/plugins/browser-forensics/mcp_config.json',
  'C:/Users/ASUS/.gemini/config/plugins/browser-forensics/mcp_config.json',
];

for (const p of configPaths) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(p, JSON.stringify(configTemplate, null, 2), 'utf-8');
  console.log(`✔ Synced: ${p}`);
}

// Also update global C:/Users/ASUS/.gemini/config/mcp_config.json preserving other servers
const globalPath = 'C:/Users/ASUS/.gemini/config/mcp_config.json';
let globalConfig = { mcpServers: {} };
if (fs.existsSync(globalPath)) {
  try {
    globalConfig = JSON.parse(fs.readFileSync(globalPath, 'utf-8'));
  } catch {}
}
globalConfig.mcpServers = globalConfig.mcpServers || {};
globalConfig.mcpServers['browser-forensics'] = {
  command: 'node',
  args: [targetServerScript],
  disabled: false,
  alwaysAllow: allToolNames
};

fs.writeFileSync(globalPath, JSON.stringify(globalConfig, null, 2), 'utf-8');
console.log(`✔ Synced global config: ${globalPath}`);

console.log('All MCP configurations synchronized successfully!');
