/**
 * TeleDOM v12+ — docs generator: renders docs/v12/IMPROVEMENTS.md,
 * CAPABILITIES.md and COMPATIBILITY.md from the registries. Docs are
 * generated artifacts — never hand-maintained (no drift possible).
 */

import { IMPROVEMENTS, validateImprovements, improvementsByStatus } from './improvements';
import { CAPABILITY_REGISTRY, registryStats } from './capabilities';
import { generateCompatibilityMatrix } from './compatibility';
import { VERSION_HISTORY, TELEDOM_VERSION } from '../version';

function renderImprovementsMd(): string {
  const validation = validateImprovements();
  const byStatus = improvementsByStatus();
  let md = `# TeleDOM v12 — Improvement Matrix (${validation.count} improvements)\n\n`;
  md += `> GENERATED from \`src/v12/registry/improvements.ts\` — the count, fields and statuses\n>`;
  md += ` are validated by \`tests/v12/registry-integration.test.ts\`. Hand-editing this\n`;
  md += ` document is pointless: it is regenerated on every suite run.\n\n`;
  md += `**Validation**: ${validation.valid ? 'PASS' : 'FAIL'} — ${validation.count} distinct, non-trivial improvements (threshold: ≥ 100).\n\n`;
  md += `**Status summary**: ${Object.entries(byStatus).map(([k, v]) => `${k}: ${v}`).join(' · ')}\n\n`;
  const byCategory = new Map<string, typeof IMPROVEMENTS>();
  for (const imp of IMPROVEMENTS) {
    const list = byCategory.get(imp.category) ?? [];
    list.push(imp);
    byCategory.set(imp.category, list);
  }
  for (const [category, items] of byCategory) {
    md += `## ${category} (${items.length})\n\n`;
    md += `| ID | Title | Problem → Solution | Priority | Version | Status |\n|---|---|---|---|---|---|\n`;
    for (const i of items) {
      md += `| ${i.id} | **${i.title}** | ${i.problem} → ${i.architecture} | ${i.priority} | ${i.version} | ${i.status} |\n`;
    }
    md += `\n`;
  }
  md += `## Detail ledger\n\n`;
  for (const i of IMPROVEMENTS) {
    md += `### ${i.id} — ${i.title}\n\n`;
    md += `- **Category**: ${i.category} · **Priority**: ${i.priority} · **Version target**: ${i.version} · **Status**: ${i.status}\n`;
    md += `- **Problem**: ${i.problem}\n- **Baseline limitation**: ${i.baselineLimitation}\n- **External evidence**: ${i.externalEvidence}\n- **Why it matters**: ${i.why}\n- **Architecture**: ${i.architecture}\n- **Modules**: ${i.modules.join(', ')}\n- **Complexity**: ${i.complexity} · **Risk**: ${i.risk}\n- **Benefit**: ${i.benefit}\n- **Tests**: ${i.tests}\n- **Benchmark**: ${i.benchmark ?? 'n/a'}\n- **Security**: ${i.security}\n\n`;
  }
  return md;
}

function renderCapabilitiesMd(): string {
  const stats = registryStats();
  let md = `# TeleDOM v12 — Capability Surface (generated)\n\n`;
  md += `Version: ${TELEDOM_VERSION.version} · td_* capabilities: ${stats.total} · categories: 10 × 10 · experimental: ${stats.experimental}\n\n`;
  for (const category of Object.keys(stats.byCategory)) {
    md += `## ${category}\n\n| Tool | Security | Cost | Modes | Experimental | Description |\n|---|---|---|---|---|---|\n`;
    for (const cap of CAPABILITY_REGISTRY.filter((c) => c.category === category)) {
      md += `| \`${cap.id}\` | ${cap.securityClass} | ${cap.resourceCost} | ${cap.supportedModes.join('/')} | ${cap.experimental ? 'YES' : 'no'} | ${cap.description} |\n`;
    }
    md += `\n`;
  }
  return md;
}

function renderCompatibilityMd(): string {
  const matrix = generateCompatibilityMatrix();
  let md = `# TeleDOM v12 — Compatibility Matrix (generated)\n\n`;
  md += `Generated: ${matrix.generatedAt} · TeleDOM version: ${matrix.teledomVersion}\n\n`;
  md += `**Surfaces**: td_=${matrix.totals.surfaces.td} · dt_=${matrix.totals.surfaces.dt} · fx_=${matrix.totals.surfaces.fx} · base=${matrix.totals.surfaces.base} · v3=${matrix.totals.surfaces.v3} · **total=${matrix.totals.surfaces.total}**\n\n`;
  md += `| Capability | Version | Implementation | Schema parity | Behavior parity | Browser support | Simulation | Test status | Experimental |\n|---|---|---|---|---|---|---|---|---|\n`;
  for (const row of matrix.rows) {
    md += `| \`${row.capability}\` | ${row.version} | ${row.implementation} | ${row.schemaParity} | ${row.behaviorParity} | ${row.browserSupport} | ${row.simulationSupport ? 'yes' : 'no'} | ${row.testStatus} | ${row.experimental ? 'YES' : 'no'} |\n`;
  }
  return md;
}

function renderVersionHistoryMd(): string {
  let md = `# TeleDOM v4 → v12+ Version Progression\n\n`;
  md += `| Version | Title | Capabilities |\n|---|---|---|\n`;
  for (const v of VERSION_HISTORY) {
    md += `| ${v.version} | ${v.title} | ${v.capabilities.join('; ')} |\n`;
  }
  return md;
}

export function generateAllDocs(getWriter: (name: string) => (content: string) => void): void {
  getWriter('IMPROVEMENTS.md')(renderImprovementsMd());
  getWriter('CAPABILITIES.md')(renderCapabilitiesMd());
  getWriter('COMPATIBILITY.md')(renderCompatibilityMd());
  getWriter('VERSION_HISTORY.md')(renderVersionHistoryMd());
}

export { renderImprovementsMd, renderCapabilitiesMd, renderCompatibilityMd, renderVersionHistoryMd };
