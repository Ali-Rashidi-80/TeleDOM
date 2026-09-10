import { MCPDOM_V3_TOOLS } from './v3-tools-definition';

/**
 * Set of tool names handled by ExtendedToolsHandler.
 */
export const V3_TOOL_NAMES: Set<string> = new Set(MCPDOM_V3_TOOLS.map((t) => t.name));
