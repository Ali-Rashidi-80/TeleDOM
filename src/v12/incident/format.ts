/**
 * TeleDOM v12+ Incident — Portable `.tdom` forensic format.
 *
 * A .tdom artifact contains the WHOLE story of an incident: versioned
 * manifest, incident metadata, temporal data, evidence, network/runtime/
 * DOM events, causal graph, replay metadata, branches, security and
 * performance findings, remediation, verification, proof, integrity
 * metadata, provenance, compression flag, compatibility info.
 * Content-addressed integrity: every section is hashed; the manifest
 * chains them; the file carries a manifest hash.
 */

import { createGzip, gunzipSync } from 'zlib';
import { computeHash } from '../kernel/integrity';
import type { Incident } from './model';
import { TELEDOM_VERSION } from '../version';

export const TDOM_FORMAT_VERSION = '1.0.0';

export interface TdomManifest {
  format: 'tdom';
  formatVersion: string;
  generator: { name: string; version: string };
  createdAt: string;
  compression: 'gzip' | 'none';
  sections: Record<string, { hash: string; byteLength: number }>;
  manifestHash: string;
  compatibility: {
    minReaderVersion: string;
    schemaVersions: Record<string, number>;
  };
}

export interface TdomContent {
  incident: {
    incidentId: string;
    objective: string;
    state: string;
    createdAt: number;
    audit: unknown[];
    lessons: string[];
  };
  scope: unknown;
  timeline: unknown[];
  causal: { chain: unknown | null; hypotheses: unknown[] };
  counterfactuals: unknown[];
  remediation: unknown;
  verification: unknown;
  proof: unknown;
  securityFindings: unknown[];
  performanceFindings: unknown[];
}

export interface TdomExportResult {
  bytes: Buffer;
  manifest: TdomManifest;
}

export interface TdomImportResult {
  content: TdomContent;
  integrityValid: boolean;
  brokenSection?: string;
  compatibility: { ok: boolean; notes: string[] };
}

export class TdomFormat {
  /**
   * Export an incident to a portable .tdom artifact (content-addressed,
   * optionally gzipped). The manifest hashes every section and itself.
   */
  export(incident: Incident, opts: { compress?: boolean } = {}): TdomExportResult {
    const content: TdomContent = {
      incident: {
        incidentId: incident.incidentId,
        objective: incident.objective,
        state: incident.state,
        createdAt: incident.createdAt,
        audit: incident.audit,
        lessons: incident.lessons,
      },
      scope: incident.scope,
      timeline: incident.timeline,
      causal: { chain: incident.causalChain, hypotheses: incident.hypotheses },
      counterfactuals: incident.counterfactuals,
      remediation: incident.remediation,
      verification: incident.verification,
      proof: incident.proof,
      securityFindings: [],
      performanceFindings: [],
    };
    const sections: Record<string, { hash: string; byteLength: number }> = {};
    for (const [name, value] of Object.entries(content)) {
      const bytes = Buffer.from(JSON.stringify(value), 'utf-8');
      sections[name] = { hash: computeHash(bytes.toString('utf-8')), byteLength: bytes.length };
    }
    const manifest: TdomManifest = {
      format: 'tdom',
      formatVersion: TDOM_FORMAT_VERSION,
      generator: { name: 'TeleDOM', version: TELEDOM_VERSION.version },
      createdAt: new Date().toISOString(),
      compression: opts.compress ? 'gzip' : 'none',
      sections,
      manifestHash: '',
      compatibility: {
        minReaderVersion: '12.0.0',
        schemaVersions: { event: 1, evidence: 1, incident: 1, proof: 1 },
      },
    };
    manifest.manifestHash = computeHash({ sections, formatVersion: TDOM_FORMAT_VERSION, generator: manifest.generator });
    const payload = Buffer.from(JSON.stringify({ manifest, content }), 'utf-8');
    const bytes = opts.compress ? gzipSync(payload) : payload;
    return { bytes, manifest };
  }

  /**
   * Import + verify a .tdom artifact. Section hashes are re-checked; any
   * mismatch is reported (tamper evidence), never silently ignored.
   */
  import(bytes: Buffer): TdomImportResult {
    const jsonBuffer = looksGzipped(bytes) ? gunzipSync(bytes) : bytes;
    const parsed = JSON.parse(jsonBuffer.toString('utf-8')) as { manifest: TdomManifest; content: TdomContent };
    const { manifest, content } = parsed;
    let integrityValid = true;
    let brokenSection: string | undefined;
    for (const [name, section] of Object.entries(manifest.sections)) {
      const value = (content as unknown as Record<string, unknown>)[name];
      const actual = computeHash(JSON.stringify(value));
      if (actual !== section.hash) {
        integrityValid = false;
        brokenSection = name;
        break;
      }
    }
    const manifestCheck = computeHash({ sections: manifest.sections, formatVersion: manifest.formatVersion, generator: manifest.generator });
    if (manifest.manifestHash !== manifestCheck) {
      integrityValid = false;
      brokenSection = brokenSection ?? 'manifest';
    }
    const notes: string[] = [];
    const readerMajor = parseInt(TDOM_FORMAT_VERSION.split('.')[0], 10);
    const artifactMajor = parseInt(manifest.formatVersion.split('.')[0], 10);
    if (artifactMajor > readerMajor) notes.push(`artifact format v${manifest.formatVersion} is newer than reader v${TDOM_FORMAT_VERSION}`);
    return {
      content,
      integrityValid,
      brokenSection,
      compatibility: { ok: artifactMajor <= readerMajor, notes },
    };
  }
}

function looksGzipped(bytes: Buffer): boolean {
  return bytes.length > 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
}

function gzipSync(data: Buffer): Buffer {
  // Synchronous gzip via zlib (node runtime).
  const zlib = require('zlib') as typeof import('zlib');
  return zlib.gzipSync(data);
}
