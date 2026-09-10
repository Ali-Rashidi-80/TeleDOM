import fs from 'fs';
import path from 'path';
import { AGENT_PACKAGE_VERSION } from '../types/project';
import { ProjectManager } from './project-manager';

/**
 * §59 / §32 Agent Package Exporter
 *
 * Produces a self-contained package another AI Agent can consume WITHOUT
 * the original MCPDOM application running:
 *
 *   <outputDir>/
 *   ├── README.md
 *   ├── PROJECT.md
 *   ├── agent-instructions.md
 *   ├── project.json
 *   ├── pages/
 *   ├── regions/
 *   ├── snapshots/
 *   ├── diffs/
 *   ├── commands/
 *   ├── assets/
 *   ├── schemas/
 *   └── verification/
 *
 * Machine-readable data + human-readable instructions + page/region
 * specifications + interaction history + expected outcomes. The package
 * strictly separates OBSERVED FACTS / USER REQUESTS / EXPECTED CHANGES /
 * VERIFICATION CONDITIONS.
 */
export class AgentPackageExporter {
  constructor(private projects: ProjectManager) {}

  public export(projectName: string, outputDir?: string): { packageDir: string; files: string[]; summary: { regions: number; commands: number; diffs: number; bytes: number } } {
    const project = this.projects.getProject(projectName);
    if (!project) {
      throw new Error(`PROJECT_NOT_FOUND: "${projectName}"`);
    }
    const { manifest, page, regions, projectDir } = project;
    const target = outputDir || path.join('mcpdom_agent_packages', manifest.name);
    fs.mkdirSync(target, { recursive: true });
    for (const sub of ['pages', 'regions', 'snapshots', 'diffs', 'commands', 'assets', 'schemas', 'verification']) {
      fs.mkdirSync(path.join(target, sub), { recursive: true });
    }

    const files: string[] = [];

    // --- project.json (manifest) ---
    fs.writeFileSync(path.join(target, 'project.json'), JSON.stringify({ ...manifest, packageVersion: AGENT_PACKAGE_VERSION }, null, 2));
    files.push('project.json');

    // --- pages/ (page manifest + DOM snapshot) ---
    fs.writeFileSync(path.join(target, 'pages', 'page.json'), JSON.stringify(page, null, 2));
    files.push('pages/page.json');
    if (page.domSnapshotFile && fs.existsSync(path.join(projectDir, page.domSnapshotFile))) {
      fs.copyFileSync(path.join(projectDir, page.domSnapshotFile), path.join(target, 'pages', 'page-snapshot.html'));
      files.push('pages/page-snapshot.html');
    }

    // --- regions/ (annotations + DOM + screenshots) ---
    for (const region of regions) {
      const regionFile = path.join(target, 'regions', `${region.observed.regionId}.json`);
      fs.writeFileSync(regionFile, JSON.stringify(region, null, 2));
      files.push(path.join('regions', `${region.observed.regionId}.json`));
      for (const domFile of [region.observed.domFile, region.observed.contextDomFile]) {
        if (domFile && fs.existsSync(path.join(projectDir, domFile))) {
          const dest = path.join(target, 'regions', path.basename(domFile));
          fs.copyFileSync(path.join(projectDir, domFile), dest);
          files.push(path.join('regions', path.basename(domFile)));
        }
      }
      if (region.observed.screenshotFile && fs.existsSync(path.join(projectDir, region.observed.screenshotFile))) {
        fs.copyFileSync(path.join(projectDir, region.observed.screenshotFile), path.join(target, 'assets', path.basename(region.observed.screenshotFile)));
        files.push(path.join('assets', path.basename(region.observed.screenshotFile)));
      }
    }

    // --- diffs/ + commands/ ---
    let diffCount = 0;
    const diffsDir = path.join(projectDir, 'diffs');
    if (fs.existsSync(diffsDir)) {
      for (const f of fs.readdirSync(diffsDir)) {
        fs.copyFileSync(path.join(diffsDir, f), path.join(target, 'diffs', f));
        files.push(path.join('diffs', f));
        diffCount++;
      }
    }
    let commandCount = 0;
    const commandsDir = path.join(projectDir, 'commands');
    if (fs.existsSync(commandsDir)) {
      for (const f of fs.readdirSync(commandsDir)) {
        fs.copyFileSync(path.join(commandsDir, f), path.join(target, 'commands', f));
        files.push(path.join('commands', f));
        commandCount++;
      }
    }

    // --- schemas/ (portable schema documentation) ---
    fs.writeFileSync(
      path.join(target, 'schemas', 'region-annotation.schema.json'),
      JSON.stringify(
        {
          $schema: 'http://json-schema.org/draft-07/schema#',
          title: 'MCPDOM RegionAnnotation',
          type: 'object',
          required: ['observed', 'user', 'analysis'],
          properties: {
            observed: {
              type: 'object',
              description: 'OBSERVED FACTS — captured by the platform, never hand-edited',
              required: ['regionId', 'name', 'selector', 'domFile'],
              properties: {
                regionId: { type: 'string' },
                name: { type: 'string' },
                autoName: { type: 'string' },
                tag: { type: 'string' },
                role: { type: 'string' },
                selector: { type: 'string' },
                selectorCandidates: { type: 'array', items: { type: 'object' } },
                xpath: { type: 'string' },
                structuralFingerprint: { type: 'string' },
                domFile: { type: 'string' },
                contextDomFile: { type: 'string' },
                dimensions: { type: 'object' },
                position: { type: 'object' },
                relevantStyles: { type: 'object' },
                capturedAt: { type: 'number' },
                sourceUrl: { type: 'string' },
              },
            },
            user: {
              type: 'object',
              description: 'USER REQUESTS — human comments, names, tags',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                comment: { type: 'string' },
                tags: { type: 'array', items: { type: 'string' } },
                behavioralNotes: { type: 'string' },
                visualNotes: { type: 'string' },
              },
            },
            intendedChange: { type: 'object', description: 'EXPECTED CHANGES — what the user wants done' },
            verification: { type: 'object', description: 'VERIFICATION CONDITIONS — how success is checked' },
            analysis: { type: 'object', description: 'AUTOMATIC ANALYSIS — quality, naming evidence' },
          },
        },
        null,
        2
      )
    );
    files.push('schemas/region-annotation.schema.json');

    // --- verification/ (condition matrix derived from annotations) ---
    const verificationRows = regions
      .filter((r) => r.verification?.conditions?.length || r.intendedChange)
      .map((r) => ({
        regionId: r.observed.regionId,
        region: r.observed.name,
        selector: r.observed.selector,
        intendedChange: r.intendedChange?.statement || null,
        verificationConditions: r.verification?.conditions || [],
      }));
    fs.writeFileSync(
      path.join(target, 'verification', 'verification-matrix.json'),
      JSON.stringify({ generatedAt: Date.now(), rows: verificationRows }, null, 2)
    );
    files.push('verification/verification-matrix.json');

    // --- snapshots/ (metadata from project page) ---
    fs.writeFileSync(
      path.join(target, 'snapshots', 'capture-context.json'),
      JSON.stringify(
        {
          url: page.url,
          title: page.title,
          capturedAt: page.capturedAt,
          viewport: page.viewport,
          browserState: page.browserState,
        },
        null,
        2
      )
    );
    files.push('snapshots/capture-context.json');

    // --- README.md ---
    fs.writeFileSync(path.join(target, 'README.md'), this.readmeMarkdown(manifest.name, page.url, regions.length, diffCount, commandCount));
    files.push('README.md');

    // --- PROJECT.md ---
    fs.writeFileSync(path.join(target, 'PROJECT.md'), this.projectMarkdown(projectName, regions));
    files.push('PROJECT.md');

    // --- agent-instructions.md ---
    fs.writeFileSync(path.join(target, 'agent-instructions.md'), this.agentInstructionsMarkdown(projectName, regions));
    files.push('agent-instructions.md');

    let bytes = 0;
    for (const f of files) {
      try {
        bytes += fs.statSync(path.join(target, f)).size;
      } catch { /* directories in list? no */ }
    }

    return {
      packageDir: path.resolve(target),
      files,
      summary: { regions: regions.length, commands: commandCount, diffs: diffCount, bytes },
    };
  }

  private readmeMarkdown(name: string, url: string, regionCount: number, diffCount: number, commandCount: number): string {
    return `# MCPDOM Agent Package — ${name}

> Self-contained page analysis + reconstruction specification exported by MCPDOM Browser v3.

## What this is

This package captures the structure, semantics and user intent of a live web page
so that ANOTHER AI agent can understand it and act on it — WITHOUT the original
MCPDOM application or browser session.

- **Analyzed page**: ${url}
- **Annotated regions**: ${regionCount}
- **DOM diff artifacts**: ${diffCount}
- **Command recordings**: ${commandCount}

## Package layout

\`\`\`
├── README.md                  ← you are here
├── PROJECT.md                 ← human-oriented project summary
├── agent-instructions.md      ← workflow-oriented agent instructions
├── project.json               ← machine-readable project manifest
├── pages/                     ← page manifest + clean DOM snapshot
├── regions/                   ← region annotations + region DOM + context DOM
├── snapshots/                 ← capture context (URL, viewport, browser state)
├── diffs/                     ← DOM diff artifacts
├── commands/                  ← replayable command recordings
├── assets/                    ← region screenshots
├── schemas/                   ← portable JSON schemas
└── verification/              ← verification matrix (conditions per region)
\`\`\`

## Core semantics

Every region annotation strictly separates:

| Category | Meaning | Source |
|----------|---------|--------|
| **OBSERVED** | Facts about the DOM | Platform capture — never hand-edited |
| **USER** | Names, comments, tags | The human analyst |
| **INTENDED CHANGE** | What should change | The human analyst |
| **VERIFICATION** | How success is measured | The human analyst |

Never conflate these categories when consuming or extending this package.

## Quick start for an agent

1. Read \`project.json\` for scope.
2. Read \`PROJECT.md\` for the human summary.
3. Read \`agent-instructions.md\` for the workflow.
4. Load region annotations from \`regions/*.json\` (each references DOM files).
5. Use \`verification/verification-matrix.json\` to know what "done" means.
`;
  }

  private projectMarkdown(projectName: string, regions: any[]): string {
    const lines: string[] = [];
    lines.push(`# Project: ${projectName}`);
    lines.push('');
    lines.push('## Captured regions');
    lines.push('');
    lines.push('| Region | Selector | Role | Quality | Intended change |');
    lines.push('|--------|----------|------|---------|-----------------|');
    for (const r of regions) {
      lines.push(
        `| ${r.observed.name} | \`${r.observed.selector}\` | ${r.observed.role || r.observed.tag} | ${r.analysis?.qualityScore?.grade || 'n/a'} (${r.analysis?.qualityScore?.overall ?? 'n/a'}) | ${r.intendedChange?.statement || '—'} |`
      );
    }
    lines.push('');
    lines.push('## Region notes');
    for (const r of regions) {
      if (r.user.comment || r.user.behavioralNotes || r.user.visualNotes) {
        lines.push(`### ${r.observed.name}`);
        if (r.user.comment) lines.push(`- **Comment**: ${r.user.comment}`);
        if (r.user.description) lines.push(`- **Description**: ${r.user.description}`);
        if (r.user.behavioralNotes) lines.push(`- **Behavioral notes**: ${r.user.behavioralNotes}`);
        if (r.user.visualNotes) lines.push(`- **Visual notes**: ${r.user.visualNotes}`);
        if (r.verification?.conditions?.length) lines.push(`- **Verification**: ${r.verification.conditions.join('; ')}`);
        lines.push('');
      }
    }
    return lines.join('\n');
  }

  private agentInstructionsMarkdown(projectName: string, regions: any[]): string {
    const lines: string[] = [];
    lines.push('# Agent Instructions');
    lines.push('');
    lines.push(`This package was exported from MCPDOM Browser for project **${projectName}**.`);
    lines.push('');
    lines.push('## Recommended workflow');
    lines.push('');
    lines.push('1. **Orient**: read `pages/page.json` (URL, viewport, browser state) and the page DOM snapshot in `pages/page-snapshot.html`.');
    lines.push('2. **Map the regions**: every file in `regions/*.json` is one captured region with:');
    lines.push('   - `observed`: facts — selector candidates (ranked with confidence), xpath, fingerprint, DOM files, dimensions, styles');
    lines.push('   - `user`: the analyst\'s names, comments, tags');
    lines.push('   - `intendedChange`: what the analyst wants done (if recorded)');
    lines.push('   - `verification`: conditions that define success (if recorded)');
    lines.push('3. **Target elements**: use `observed.selectorCandidates` in ranked order — they are ranked by confidence with fallback chains. Prefer unique, high-confidence candidates.');
    lines.push('4. **Modify**: when changing DOM, preserve the verification conditions. The DOM files under `regions/` show the exact captured state (MCPDOM artifacts removed, secrets redacted).');
    lines.push('5. **Verify**: check `verification/verification-matrix.json` — every row lists the success conditions per region.');
    lines.push('6. **Replay if needed**: `commands/*.json` are deterministic command recordings (tool name + arguments per step).');
    lines.push('');
    lines.push('## Fingerprint & selector semantics');
    lines.push('');
    lines.push('- `structuralFingerprint`: stable hash over tag hierarchy, stable attributes, classes, role, dimensions. Two elements with identical fingerprints are almost certainly the same logical element.');
    lines.push('- `selectorCandidates[].confidence` ∈ [0,1]: 1.0 = unique stable id; 0.92 = semantic attribute; 0.72 = classes; 0.55 = structural path; 0.6 = text xpath.');
    lines.push('- `xpath` uses ids where available, otherwise positional segments.');
    lines.push('');
    lines.push('## Honesty guarantees');
    lines.push('');
    lines.push('- OBSERVED data was captured automatically — it reflects the page at capture time.');
    lines.push('- Secrets and sensitive values are REDACTED in stored DOM (`[REDACTED]`).');
    lines.push('- MCPDOM\'s own injected UI is EXCLUDED from all captured DOM.');
    lines.push('- If a capability was unavailable at capture time (e.g. cross-origin frame access), the region notes say so explicitly rather than omitting silently.');
    if (regions.length) {
      lines.push('');
      lines.push('## Region index');
      for (const r of regions) {
        lines.push(`- \`${r.observed.regionId}\` — ${r.observed.name} (${r.observed.tag}${r.observed.role ? `, role=${r.observed.role}` : ''})`);
      }
    }
    return lines.join('\n');
  }
}
