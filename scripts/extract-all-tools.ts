import fs from 'fs';
import path from 'path';

const projectRoot = 'c:\\Users\\ASUS\\Downloads\\TeleDOM-v12\\teledom';

// Let's inspect tools-definition.ts, v3-tools-definition.ts, devtools/definitions.ts, forensics/definitions.ts, and v4/registry/capabilities.ts
import { CAPABILITY_REGISTRY } from './src/intelligence/registry/capabilities.js';
import { DEVTOOLS_TOOL_DEFINITIONS } from './src/devtools/definitions.js';
import { FORENSICS_TOOL_DEFINITIONS } from './src/forensics/definitions.js';
import { TOOL_DEFINITIONS as BASE_TOOLS } from './src/mcp/tools-definition.js';
import { V3_TOOL_DEFINITIONS as V3_TOOLS } from './src/mcp/v3-tools-definition.js';

console.log('td_* count:', CAPABILITY_REGISTRY.length);
console.log('dt_* count:', DEVTOOLS_TOOL_DEFINITIONS.length);
console.log('fx_* count:', FORENSICS_TOOL_DEFINITIONS.length);
console.log('base count:', BASE_TOOLS.length);
console.log('v3 count:', V3_TOOLS.length);

const allTools = [];
const seen = new Set();

function addTools(tools, origin) {
  for (const t of tools) {
    if (!seen.has(t.name || t.id)) {
      const id = t.name || t.id;
      seen.add(id);
      allTools.push({
        id,
        name: id,
        origin,
        category: t.category || t.cat || origin,
        description: t.description || t.desc || '',
        inputSchema: t.inputSchema || t.props || {},
        outputSchema: t.outputSchema || {},
        securityClass: t.securityClass || t.security || 'read-only'
      });
    }
  }
}

addTools(CAPABILITY_REGISTRY, 'td_v4_intelligence');
addTools(DEVTOOLS_TOOL_DEFINITIONS, 'dt_devtools');
addTools(FORENSICS_TOOL_DEFINITIONS, 'fx_forensics');
addTools(BASE_TOOLS, 'base_recorder');
addTools(V3_TOOLS, 'v3_extended');

console.log('Total unique tools extracted:', allTools.length);

fs.writeFileSync('C:\\Users\\ASUS\\.gemini\\antigravity-ide\\brain\\62b3c35c-08e3-4623-b5d8-947911cd2d4d\\scratch\\all_306_tools.json', JSON.stringify(allTools, null, 2));
console.log('Dumped all_306_tools.json');
