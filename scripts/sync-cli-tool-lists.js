#!/usr/bin/env node
/**
 * v4.1 — Regenerate the TELEDOM_TOOLS block in bin/unified-tools-list.mjs
 * from the authoritative capability registry (src/intelligence/registry/
 * capabilities.ts), keeping the CLI allowlist (bin/cli.js) and the registry
 * in lockstep. Run after any registry change:
 *
 *   node scripts/sync-cli-tool-lists.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY = path.join(ROOT, 'src/intelligence/registry/capabilities.ts');
const OUT = path.join(ROOT, 'bin/unified-tools-list.mjs');

const src = fs.readFileSync(REGISTRY, 'utf8');
const entries = [...src.matchAll(/\{ id: '(td_[a-z0-9_]+)', cat: '([a-z-]+)'/g)];
if (entries.length === 0) throw new Error('no td_ tools found in registry');

const groups = new Map();
for (const [, id, cat] of entries) {
  if (!groups.has(cat)) groups.set(cat, []);
  groups.get(cat).push(id);
}

let block = 'export const TELEDOM_TOOLS = [\n'
  + '// §v4.1 — TeleDOM intelligence surface (td_ namespace, ' + entries.length + ' tools).\n'
  + '// GENERATED from src/intelligence/registry/capabilities.ts — regenerate with:\n'
  + '//   node scripts/sync-cli-tool-lists.js\n';
for (const [cat, tools] of groups) {
  block += '// ' + cat + ' (' + tools.length + ')\n  ' + tools.map((t) => `'${t}',`).join(' ') + '\n';
}
block += '];\n';

const mjs = fs.readFileSync(OUT, 'utf8');
const start = mjs.indexOf('export const TELEDOM_TOOLS = [');
if (start === -1) throw new Error('TELEDOM_TOOLS block not found — insert it manually once');
const endMarker = 'export const DEVTOOLS_TOOLS';
const end = mjs.indexOf(endMarker);
const updated = mjs.slice(0, start) + block + '\n' + mjs.slice(end);
fs.writeFileSync(OUT, updated);
console.log(`synced: ${entries.length} td_ tools across ${groups.size} categories -> ${path.relative(ROOT, OUT)}`);
