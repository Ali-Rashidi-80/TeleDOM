/**
 * TeleDOM v12+ Kernel — Identity Engine.
 *
 * Persistent entity identity that survives selector churn, reparenting,
 * framework rerenders, navigation and compatible reconnection. Every
 * important object in the platform is a TemporalEntity.
 */

import { computeHash } from './integrity';

export type EntityType =
  | 'page' | 'document' | 'frame' | 'iframe' | 'component' | 'element'
  | 'dom-node' | 'network-request' | 'network-response' | 'runtime-event'
  | 'console-error' | 'exception' | 'dom-mutation' | 'state-frame'
  | 'visual-frame' | 'performance-event' | 'security-signal' | 'storage-event'
  | 'cookie-signal' | 'worker' | 'service-worker' | 'script' | 'resource'
  | 'user-action' | 'interaction' | 'hypothesis' | 'finding' | 'fix'
  | 'verification' | 'proof' | 'incident' | 'selector' | 'branch';

export interface TemporalEntity {
  /** Stable identity, e.g. `entity:element:12` — never reused. */
  id: string;
  type: EntityType;
  /** Human-meaningful label (selector, url, component name...). */
  label: string;
  firstSeen: number;
  lastSeen: number;
  /** Version bumps on identity-relevant change (rerender, reparent...). */
  versions: EntityVersion[];
  parent: string | null;
  owner: string | null;
  /** Where this identity came from. */
  source: string;
  confidence: number;
  provenance: string[];
  /** Persistent fingerprint used to re-match after representation changes. */
  fingerprint: string;
}

export interface EntityVersion {
  version: number;
  at: number;
  change: string;
}

export interface IdentityMatchResult {
  entityId: string;
  score: number;
  basis: ('fingerprint' | 'selector' | 'semantic-role' | 'ancestry' | 'text' | 'component-ownership' | 'historical')[];
}

interface EntityRecord extends TemporalEntity {
  sequence: number;
}

/**
 * The identity engine manages durable identities and can re-match an entity
 * after its representation changed (rerender, remount, DOM movement, SPA
 * navigation, tab changes) using multi-signal similarity.
 */
export class IdentityEngine {
  private entities = new Map<string, EntityRecord>();
  private byType = new Map<EntityType, string[]>();
  private nextEntitySeq = 0;

  create(
    type: EntityType,
    label: string,
    opts: {
      parent?: string | null;
      owner?: string | null;
      source?: string;
      fingerprint?: string;
      confidence?: number;
      provenance?: string[];
    } = {},
  ): TemporalEntity {
    this.nextEntitySeq += 1;
    const id = `entity:${type}:${this.nextEntitySeq}`;
    const now = Date.now();
    const record: EntityRecord = {
      id,
      type,
      label,
      firstSeen: now,
      lastSeen: now,
      versions: [{ version: 1, at: now, change: 'created' }],
      parent: opts.parent ?? null,
      owner: opts.owner ?? null,
      source: opts.source ?? 'identity-engine',
      confidence: opts.confidence ?? 1,
      provenance: opts.provenance ?? ['identity-engine:create'],
      fingerprint: opts.fingerprint ?? computeHash({ type, label }),
      sequence: this.nextEntitySeq,
    };
    this.entities.set(id, record);
    const bucket = this.byType.get(type) ?? [];
    bucket.push(id);
    this.byType.set(type, bucket);
    return { ...record };
  }

  get(id: string): TemporalEntity | undefined {
    const rec = this.entities.get(id);
    return rec ? { ...rec } : undefined;
  }

  /** Record an observation of the entity (bumps lastSeen). */
  touch(id: string, at: number = Date.now()): void {
    const rec = this.entities.get(id);
    if (rec) rec.lastSeen = at;
  }

  /** Record an identity-relevant change (new version of same identity). */
  recordChange(id: string, change: string, at: number = Date.now()): EntityVersion | null {
    const rec = this.entities.get(id);
    if (!rec) return null;
    const version: EntityVersion = { version: rec.versions.length + 1, at, change };
    rec.versions.push(version);
    rec.lastSeen = at;
    return version;
  }

  byTypeAll(type: EntityType): TemporalEntity[] {
    return (this.byType.get(type) ?? []).map((id) => this.entities.get(id)!).map((r) => ({ ...r }));
  }

  /**
   * Re-match an entity whose representation changed. Scores candidate
   * identities by fingerprint + label + ancestry overlap; refuses to
   * return a match below the minimum score (honest uncertainty).
   */
  resolve(
    query: {
      type: EntityType;
      label?: string;
      fingerprint?: string;
      parent?: string | null;
      owner?: string | null;
      semanticRole?: string;
    },
    opts: { minScore?: number } = {},
  ): IdentityMatchResult | null {
    const minScore = opts.minScore ?? 0.55;
    let best: IdentityMatchResult | null = null;
    for (const rec of this.entities.values()) {
      if (rec.type !== query.type) continue;
      const basis: IdentityMatchResult['basis'] = [];
      let score = 0;
      if (query.fingerprint && rec.fingerprint === query.fingerprint) {
        score += 0.7;
        basis.push('fingerprint');
      }
      if (query.label && rec.label === query.label) {
        score += 0.2;
        basis.push('selector');
      }
      if (query.parent && rec.parent === query.parent) {
        score += 0.15;
        basis.push('ancestry');
      }
      if (query.owner && rec.owner === query.owner) {
        score += 0.1;
        basis.push('component-ownership');
      }
      if (query.semanticRole) {
        score += 0.05;
        basis.push('semantic-role');
      }
      score += Math.min(0.05, rec.versions.length * 0.005);
      if (score > 0) basis.push('historical');
      if (score >= minScore && (!best || score > best.score)) {
        best = { entityId: rec.id, score: Math.min(1, score), basis };
      }
    }
    return best;
  }

  /** Historical identity trail for an entity (its full version history). */
  trail(id: string): { entity: TemporalEntity; timeline: EntityVersion[] } | null {
    const rec = this.entities.get(id);
    if (!rec) return null;
    return { entity: { ...rec }, timeline: [...rec.versions] };
  }

  stats(): { total: number; byType: Record<string, number> } {
    const byType: Record<string, number> = {};
    for (const [t, ids] of this.byType) byType[t] = ids.length;
    return { total: this.entities.size, byType };
  }

  serialize(): { entities: EntityRecord[]; nextEntitySeq: number } {
    return { entities: [...this.entities.values()], nextEntitySeq: this.nextEntitySeq };
  }

  restore(data: { entities: EntityRecord[]; nextEntitySeq?: number }): void {
    this.entities.clear();
    this.byType.clear();
    for (const rec of data.entities) this.entities.set(rec.id, rec);
    for (const rec of data.entities) {
      const bucket = this.byType.get(rec.type) ?? [];
      bucket.push(rec.id);
      this.byType.set(rec.type, bucket);
    }
    this.nextEntitySeq = Math.max(data.nextEntitySeq ?? 0, data.entities.length);
  }
}
