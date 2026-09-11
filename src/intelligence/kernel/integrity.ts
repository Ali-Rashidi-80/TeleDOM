/**
 * TeleDOM v4 Kernel — Integrity (hash chain + tamper evidence).
 *
 * Uses Node's crypto (SHA-256). Server-side kernel only; the browser
 * extension keeps its own lightweight path and never imports this module.
 */

import { createHash } from 'crypto';

/** Stable, canonical JSON so hashes are deterministic across processes. */
export function canonicalJson(value: unknown): string {
  if (value === undefined) return 'null';
  if (value === null || typeof value !== 'object') return JSON.stringify(value) ?? 'null';
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
}

export function computeHash(value: unknown): string {
  return createHash('sha256').update(canonicalJson(value)).digest('hex');
}

/** Chain hash: h(n) = SHA256(h(n-1) + h_content(n)). */
export function chainHash(prev: string, contentHash: string): string {
  return createHash('sha256').update(`${prev}:${contentHash}`).digest('hex');
}

/**
 * Append-only hash chain over event content hashes. Any mutation of a
 * historical event breaks every subsequent link → tamper detection.
 */
export class HashChain {
  private tipInternal = '';
  private links: { eventHash: string; chainHash: string }[] = [];

  extend(contentHash: string): string {
    this.tipInternal = chainHash(this.tipInternal, contentHash);
    this.links.push({ eventHash: contentHash, chainHash: this.tipInternal });
    return this.tipInternal;
  }

  get tip(): string {
    return this.tipInternal;
  }

  get size(): number {
    return this.links.length;
  }

  /** Verify a full sequence of content hashes against this chain. */
  verify(hashes: string[]): { valid: boolean; brokenAt?: string } {
    let tip = '';
    for (let i = 0; i < hashes.length; i++) {
      const next = chainHash(tip, hashes[i]);
      const recorded = this.links[i];
      if (!recorded || recorded.chainHash !== next) {
        return { valid: false, brokenAt: `link:${i}` };
      }
      tip = next;
    }
    return { valid: true };
  }

  serialize(): { tip: string; links: { eventHash: string; chainHash: string }[] } {
    return { tip: this.tipInternal, links: [...this.links] };
  }

  restore(data: { tip: string; links: { eventHash: string; chainHash: string }[] }): void {
    this.tipInternal = data.tip;
    this.links = [...data.links];
  }
}
