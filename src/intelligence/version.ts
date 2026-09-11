/**
 * TeleDOM v4 — Authoritative Version Registry.
 *
 * Single source of truth for the platform version. Every other surface
 * (package.json, MCP serverInfo, CLI banner, capability registry,
 * compatibility matrix, .tdom artifacts, docs) must derive from HERE.
 *
 * Version progression (each major version justifies a real capability lift):
 *   v4  = Temporal Intelligence Foundation (EventEnvelope kernel, identity,
 *         indexed storage, evidence graph, causal engine, 100 td_* surface)
 *   v4.1 = Agent-Owned Workflow Runtime (agent-authored workflows, browser
 *         primitive facade, target memory, deterministic execution records,
 *         Python SDK — TeleDOM is the enabler, the agent is the brain)
 */

export interface VersionInfo {
  /** Authoritative semver of the TeleDOM platform. */
  version: string;
  /** Marketing-free product identity. */
  productName: string;
  /** Capability layers present in this build. */
  layers: string[];
  /** Git-style build metadata (commit is injected at build time when known). */
  build: {
    commit?: string;
    generatedAt: string;
  };
}

export const TELEDOM_VERSION: VersionInfo = {
  version: '4.1.0',
  productName: 'TeleDOM — Temporal Browser Intelligence Engine + Agent-Owned Workflow Runtime',
  layers: [
    'kernel', 'temporal', 'evidence', 'causality', 'semantics', 'targeting',
    'simulation', 'mutation', 'verification', 'incident', 'security',
    'resilience', 'agent', 'registry', 'golden', 'chaos', 'bench', 'mcp',
    'workflow',
  ],
  build: {
    generatedAt: new Date().toISOString(),
  },
};

/** Major-version capability progression, used by docs + compatibility matrix. */
export interface VersionMilestone {
  version: string;
  title: string;
  capabilities: string[];
}

export const VERSION_HISTORY: VersionMilestone[] = [
  {
    version: '4.1.0',
    title: 'Agent-Owned Workflow Runtime',
    capabilities: ['agent-authored workflow persistence (CRUD + versioning + diff + export/import)', 'dumb deterministic workflow execution with policy gates', 'browser primitive facade (td_browser_*/td_dom_*/td_target_*/td_action_*)', 'target memory (learned targets — no DOM re-analysis)', 'agent artifact store (custom tools/scripts/policies/memories)', 'deterministic execution records + verbatim replay', 'persistent agent memory', 'Python SDK (Level-2 semantic browser programming)'],
  },
  {
    version: '4.0.0',
    title: 'Temporal Intelligence Foundation',
    capabilities: ['EventEnvelope kernel', 'identity engine', 'indexed event storage', 'integrity hash chain', 'evidence graph', 'temporal query engine', 'causal engine', '100 td_* intelligence surface'],
  },
  {
    version: '5.0.0',
    title: 'Deep Causality & State Intelligence',
    capabilities: ['StateFrame model', 'temporal joins', 'hypothesis ranking', 'component intelligence', 'semantic DOM', 'target intelligence'],
  },
  {
    version: '6.0.0',
    title: 'Counterfactual & Simulation Platform',
    capabilities: ['branchable timeline', 'what-if executor', 'branch comparison', 'prediction engine', 'impact analysis'],
  },
  {
    version: '7.0.0',
    title: 'Autonomous Investigation Platform',
    capabilities: ['td_investigate orchestration', 'resumable plans', 'incident lifecycle', 'reproduce & verify loop'],
  },
  {
    version: '8.0.0',
    title: 'Self-Healing Browser Runtime',
    capabilities: ['recovery state machine', 'session repair', 'resource guardian', 'graceful degradation'],
  },
  {
    version: '9.0.0',
    title: 'Security + Performance + Memory Intelligence',
    capabilities: ['zero-trust page model', 'passive security analyzers', 'performance causality', 'memory retention analysis'],
  },
  {
    version: '10.0.0',
    title: 'Agent Operating System / Context Intelligence',
    capabilities: ['intent router', 'L0–L4 context levels', 'minimal sufficient context', 'agent memory', 'capability routing'],
  },
  {
    version: '11.0.0',
    title: 'Multi-Agent + Knowledge + Enterprise Reliability',
    capabilities: ['multi-agent leases', 'shared evidence', 'policy gates', 'golden incidents', 'chaos engineering'],
  },
  {
    version: '12.0.0',
    title: 'Unified Browser Intelligence Platform',
    capabilities: ['unified kernel integration', 'proof engine', '.tdom portable incidents', 'machine-verifiable claims'],
  },
];

export function currentVersion(): string {
  return TELEDOM_VERSION.version;
}
