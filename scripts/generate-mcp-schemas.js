import fs from 'fs';
import path from 'path';
import { FORENSIC_MCP_TOOLS } from '../dist/server/mcp-server.js';

const targetDir = 'C:\\Users\\ASUS\\.gemini\\antigravity-ide\\mcp\\browser-forensics';

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

console.log(`Generating MCP schema JSON files for ${FORENSIC_MCP_TOOLS.length} tools into: ${targetDir}`);

// Clear existing old json files
const existingFiles = fs.readdirSync(targetDir);
for (const file of existingFiles) {
  if (file.endsWith('.json')) {
    fs.unlinkSync(path.join(targetDir, file));
  }
}

for (const tool of FORENSIC_MCP_TOOLS) {
  const schemaObj = {
    name: tool.name,
    description: tool.description,
    parameters: tool.inputSchema,
  };
  const filePath = path.join(targetDir, `${tool.name}.json`);
  fs.writeFileSync(filePath, JSON.stringify(schemaObj, null, 2), 'utf-8');
  console.log(`  + Wrote ${tool.name}.json`);
}

console.log(`Successfully updated all ${FORENSIC_MCP_TOOLS.length} MCP schemas!`);
