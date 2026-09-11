/**
 * TeleDOM v4 Registry — MCP tool definitions GENERATED from the
 * capability registry (single source of truth; zero manual duplication).
 */

import { MCPToolDefinition } from '../../types/mcp-types';
import { CAPABILITY_REGISTRY } from './capabilities';

export const TELEDOM_INTELLIGENCE_TOOLS: MCPToolDefinition[] = CAPABILITY_REGISTRY.map((cap) => ({
  name: cap.id,
  description: cap.description +
    ` [security: ${cap.securityClass}; cost: ${cap.resourceCost}; modes: ${cap.supportedModes.join('/')}${cap.experimental ? '; EXPERIMENTAL' : ''}]`,
  inputSchema: {
    type: 'object' as const,
    properties: Object.fromEntries(
      Object.entries(cap.inputSchema.properties).map(([name, p]) => [
        name,
        { type: p.type, description: p.description },
      ]),
    ),
    ...(cap.inputSchema.required ? { required: cap.inputSchema.required } : {}),
  },
}));

export const TD_TOOL_NAMES: Set<string> = new Set(TELEDOM_INTELLIGENCE_TOOLS.map((t) => t.name));
