/**
 * TeleDOM v12+ — Authoritative Version Registry.
 *
 * Single source of truth for the platform version. Every other surface
 * (package.json, MCP serverInfo, CLI banner, capability registry,
 * compatibility matrix, .tdom artifacts, docs) must derive from HERE.
 *
 * Version progression (each major version justifies a real capability lift):
 *   v4  = Temporal Intelligence Foundation (EventEnvelope kernel, identity,
 *         indexed storage, evidence graph, causal engine, 100 td_* surface)
 *   v5  = Deep Causality & State Intelligence (state frames, joins, hypothesis
 *         ranking with evidence strength, component intelligence)
 *   v6  = Counterfactual & Simulation Platform (branches, what-if executor,
 *         branch comparison, prediction engine)
 *   v7  = Autonomous Investigation Platform (resumable investigation plans,
 *         incident lifecycle, reproduce/verify loop)
 *   v8  = Self-Healing Browser Runtime (recovery state machine, session
 *         repair, resource guardian, graceful degradation)
 *   v9  = Security + Performance + Memory Intelligence (zero-trust page model,
 *         passive security analyzers, perf/memory causality)
 *   v10 = Agent Operating System / Context Intelligence (intent router,
 *         L0–L4 context levels, minimal sufficient context, capability
 *         routing, agent memory)
 *   v11 = Multi-Agent + Knowledge + Enterprise Reliability (leases, shared
 *         evidence with mergeable conclusions, audit trail, policy gates,
 *         golden incidents, chaos engineering)
 *   v12 = Unified Browser Intelligence Platform (unified kernel + all layers
 *         integrated, proof engine, .tdom portable incidents)
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
  version: '4.0.0',
  productName: 'TeleDOM — Temporal Browser Intelligence Engine',
  layers: [
    'kernel', 'temporal', 'evidence', 'causality', 'semantics', 'targeting',
    'simulation', 'mutation', 'verification', 'incident', 'security',
    'resilience', 'agent', 'registry', 'golden', 'chaos', 'bench', 'mcp',
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
