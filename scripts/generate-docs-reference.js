#!/usr/bin/env node
/**
 * Generates docs/MCP_TOOLS.md from the authoritative tool definitions.
 * Run after adding tools: node scripts/generate-docs-reference.js
 */
import fs from 'fs';
import path from 'path';
import { FORENSIC_MCP_TOOLS } from '../src/mcp/tools-definition';
import { TOOL_GROUPS, buildToolCatalog } from '../src/mcp/tool-groups';

let md = `# MCP Tools Reference — MCPDOM Browser v3\n\n> Generated from the authoritative definitions (${FORENSIC_MCP_TOOLS.length} tools). Do not edit by hand — regenerate with \`node scripts/generate-docs-reference.js\`.\n\n`;

md += `## Tool Groups\n\n`;
for (const g of TOOL_GROUPS) {
  md += `### ${g.group} (${g.tools.length})\n${g.description}\n\n${g.tools.map((t) => `\`${t}\``).join(' · ')}\n\n`;
}

md += `## Complete Tool Reference\n\n`;
for (const tool of FORENSIC_MCP_TOOLS) {
  md += `### \`${tool.name}\`\n\n`;
  const desc = tool.description.split('. ').join('.\n');
  md += `${desc}\n\n`;
  const props = (tool.inputSchema as any).properties || {};
  const required = ((tool.inputSchema as any).required || []) as string[];
  if (Object.keys(props).length) {
    md += `**Input:**\n\n`;
    md += `| Parameter | Type | Required | Description |\n|---|---|---|---|\n`;
    for (const [name, schema] of Object.entries(props) as any) {
      const type = Array.isArray(schema.type) ? schema.type.join('\\|') : schema.enum ? schema.enum.join('\\|') : (schema.type || '-');
      md += `| \`${name}\` | ${type} | ${required.includes(name) ? '✓' : ''} | ${schema.description || ''} |\n`;
    }
    md += `\n`;
  }
}
fs.writeFileSync(path.join(process.cwd(), 'docs', 'MCP_TOOLS.md'), md);
console.log(`docs/MCP_TOOLS.md written (${FORENSIC_MCP_TOOLS.length} tools, ${md.length} bytes)`);
