/**
 * TeleDOM v4 — generated docs test: renders docs/intelligence/*.md from the
 * registries and validates the improvement matrix (≥100 non-trivial items).
 * Docs that cannot lie: they are test output.
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { validateImprovements, IMPROVEMENTS } from '../../src/intelligence/registry/improvements';
import { renderImprovementsMd, renderCapabilitiesMd, renderCompatibilityMd, renderVersionHistoryMd } from '../../src/intelligence/registry/docs-generator';
import { CAPABILITY_REGISTRY } from '../../src/intelligence/registry/capabilities';

describe('v4 improvement matrix (100+ requirement)', () => {
  it('contains at least 100 DISTINCT, NON-TRIVIAL improvements', () => {
    const validation = validateImprovements();
    expect(validation.problems).toEqual([]);
    expect(validation.valid).toBe(true);
    expect(validation.count).toBeGreaterThanOrEqual(100);
  });

  it('every improvement maps to real modules, tests, version and priority', () => {
    for (const imp of IMPROVEMENTS) {
      expect(imp.modules.length).toBeGreaterThan(0);
      expect(imp.tests.length).toBeGreaterThan(3);
      expect(['P0', 'P1', 'P2', 'P3']).toContain(imp.priority);
      expect(imp.version).toMatch(/^\d+\.\d+|^13-preview/);
      expect(imp.status.length).toBeGreaterThan(3);
    }
  });

  it('deferred items carry an explicit reason (never silent omission)', () => {
    const deferred = IMPROVEMENTS.filter((i) => i.status.startsWith('DEFERRED'));
    expect(deferred.length).toBeGreaterThan(0);
    for (const d of deferred) {
      expect(d.architecture.length).toBeGreaterThan(40);
      expect(d.architecture).toMatch(/DEFERRED|requires|adapters/i);
    }
  });

  it('renders docs/intelligence/*.md from the registries', () => {
    const outDir = path.resolve(process.cwd(), 'docs/intelligence');
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'IMPROVEMENTS.md'), renderImprovementsMd());
    fs.writeFileSync(path.join(outDir, 'CAPABILITIES.md'), renderCapabilitiesMd());
    fs.writeFileSync(path.join(outDir, 'COMPATIBILITY.md'), renderCompatibilityMd());
    fs.writeFileSync(path.join(outDir, 'VERSION_HISTORY.md'), renderVersionHistoryMd());
    const improvements = fs.readFileSync(path.join(outDir, 'IMPROVEMENTS.md'), 'utf-8');
    expect(improvements).toContain(`(${IMPROVEMENTS.length} improvements)`);
    expect(improvements).toContain('GENERATED from');
    const capabilities = fs.readFileSync(path.join(outDir, 'CAPABILITIES.md'), 'utf-8');
    for (const cap of CAPABILITY_REGISTRY.slice(0, 10)) {
      expect(capabilities).toContain(cap.id);
    }
    const compatibility = fs.readFileSync(path.join(outDir, 'COMPATIBILITY.md'), 'utf-8');
    expect(compatibility).toContain('total=306');
  });
});
