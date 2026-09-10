/**
 * §12 Temporal Correlation — builds the shared cross-domain timeline
 * from recorded session events (+ optional live bus events) and answers
 * queries like:
 *   • What DOM state existed immediately before this network response?
 *   • Which request happened immediately before this component disappeared?
 *   • Which console error occurred closest to the mutation?
 *
 * This EXTENDS the existing time-travel system (it does not replace
 * it): reconstruction stays in reconstruction/, correlation lives here.
 */

import { BaseEvent } from '../types/events';
import { UnifiedEvent } from '../devtools/types';

export type SignalDomain = 'DOM' | 'NETWORK' | 'CONSOLE' | 'ERROR' | 'NAVIGATION' | 'USER' | 'VIEWPORT' | 'STYLE' | 'EXTENSION' | 'SCREENSHOT' | 'CHECKPOINT' | 'PERFORMANCE' | 'MEMORY';

export interface TimelineSignal {
  eventId: string;
  domain: SignalDomain;
  type: string;
  timestamp: number;
  sequence: number;
  targetNodeId?: number;
  targetSelector?: string;
  summary: string;
  payload: Record<string, unknown>;
}

/** Map recorded event categories to correlation domains. */
function domainOf(event: BaseEvent): SignalDomain {
  switch (event.category) {
    case 'DOM': return 'DOM';
    case 'NETWORK': return 'NETWORK';
    case 'CONSOLE': return 'CONSOLE';
    case 'ERROR': return 'ERROR';
    case 'NAVIGATION': return 'NAVIGATION';
    case 'USER': return 'USER';
    case 'VIEWPORT': return 'VIEWPORT';
    case 'STYLE': return 'STYLE';
    case 'EXTENSION': return 'EXTENSION';
    case 'SCREENSHOT': return 'SCREENSHOT';
    case 'CHECKPOINT': return 'CHECKPOINT';
    default: return 'DOM';
  }
}

function summarize(event: BaseEvent): string {
  const p = event.payload || {};
  switch (event.type) {
    case 'DOM_MUTATION_ADD':
      return `+ <${(p.node as any)?.tagName || '?'}> into ${String(p.parentId ?? '?')}${(p.node as any)?.attributes?.id ? ` (#${(p.node as any).attributes.id})` : ''}`;
    case 'DOM_MUTATION_REMOVE':
      return `- <${p.tagName || '?'}> node=${String(p.nodeId ?? '?')}${p.selectorHint ? ` (${p.selectorHint})` : ''} subtree=${String(p.removedSubtreeNodeCount ?? 0)}`;
    case 'DOM_MUTATION_ATTR':
      return `attr ${String(p.attributeName ?? '?')} on node=${String(p.nodeId ?? '?')}: ${String(p.oldValue ?? null)} → ${String(p.newValue ?? null)}`;
    case 'DOM_MUTATION_TEXT':
      return `text: "${String(p.oldText ?? '').slice(0, 40)}" → "${String(p.newText ?? '').slice(0, 40)}"`;
    case 'DOM_MUTATION_MOVE':
      return `move node=${String(p.nodeId ?? '?')} ${String(p.oldParentId ?? '?')}→${String(p.newParentId ?? '?')}`;
    case 'NETWORK_REQUEST_START':
      return `→ ${String(p.method || 'GET')} ${String(p.url || '?')}`;
    case 'NETWORK_RESPONSE_COMPLETE':
      return `← ${String(p.status ?? '?')} ${String(p.url || '?')} (${String(p.size ?? p.responseSize ?? 0)}B)`;
    case 'NETWORK_REQUEST_FAILED':
      return `✗ ${String(p.url || '?')} ${String(p.error || 'failed')}`;
    case 'RUNTIME_CONSOLE_ERROR':
    case 'RUNTIME_ERROR':
    case 'RUNTIME_UNHANDLED_REJECTION':
      return String(p.message || p.text || event.type).slice(0, 140);
    case 'RUNTIME_CONSOLE_LOG':
    case 'RUNTIME_CONSOLE_WARN':
    case 'RUNTIME_CONSOLE_INFO':
    case 'RUNTIME_CONSOLE_DEBUG':
      return String(p.text ?? p.message ?? '').slice(0, 120);
    case 'USER_CLICK':
      return `click ${event.targetSelector || `node=${event.targetNodeId}`} @${p.x ?? '?'},${p.y ?? '?'}`;
    case 'NAV_PUSH_STATE':
    case 'NAV_REPLACE_STATE':
      return `${event.type} ${String(p.url || '')}`;
    default:
      return `${event.type}${event.targetSelector ? ` ${event.targetSelector}` : ''} ${Object.keys(p).length ? JSON.stringify(p).slice(0, 80) : ''}`.trim();
  }
}

export class TemporalCorrelationEngine {
  /** Ordered cross-domain signals (public for analyzer access). */
  readonly signals: TimelineSignal[] = [];

  constructor(events: BaseEvent[], liveEvents?: UnifiedEvent[]) {
    for (const e of events) {
      this.signals.push({
        eventId: e.id,
        domain: domainOf(e),
        type: e.type,
        timestamp: e.timestamp,
        sequence: e.sequence,
        targetNodeId: e.targetNodeId,
        targetSelector: e.targetSelector,
        summary: summarize(e),
        payload: (e.payload || {}) as Record<string, unknown>,
      });
    }
    if (liveEvents) {
      for (const le of liveEvents) {
        this.signals.push({
          eventId: le.eventId,
          domain: (['DOM', 'NETWORK', 'CONSOLE', 'NAVIGATION', 'PERFORMANCE', 'MEMORY'].includes(le.domain) ? le.domain : (le.domain === 'RUNTIME' ? 'ERROR' : le.domain === 'INTERACTION' ? 'USER' : 'DOM')) as SignalDomain,
          type: le.type,
          timestamp: le.timestamp,
          sequence: le.sequence + 1_000_000,
          summary: `${le.type} ${JSON.stringify(le.data).slice(0, 80)}`,
          payload: le.data,
        });
      }
    }
    this.signals.sort((a, b) => a.timestamp - b.timestamp || a.sequence - b.sequence);
  }

  /** Signals within a temporal window of a timestamp. */
  around(timestamp: number, windowMs = 300): TimelineSignal[] {
    return this.signals.filter(s => Math.abs(s.timestamp - timestamp) <= windowMs);
  }

  /** All signals in a range. */
  range(from: number, to: number): TimelineSignal[] {
    return this.signals.filter(s => s.timestamp >= from && s.timestamp <= to);
  }

  byDomain(domain: SignalDomain): TimelineSignal[] {
    return this.signals.filter(s => s.domain === domain);
  }

  signal(eventId: string): TimelineSignal | undefined {
    return this.signals.find(s => s.eventId === eventId);
  }

  /** The closest signal of a domain BEFORE (or after) a timestamp. */
  nearest(timestamp: number, domain: SignalDomain, direction: 'before' | 'after' | 'both' = 'both'): TimelineSignal | null {
    let best: TimelineSignal | null = null;
    let bestDelta = Infinity;
    for (const s of this.signals) {
      if (s.domain !== domain) continue;
      const delta = s.timestamp - timestamp;
      if (direction === 'before' && delta > 0) continue;
      if (direction === 'after' && delta < 0) continue;
      const abs = Math.abs(delta);
      if (abs < bestDelta) { bestDelta = abs; best = s; }
    }
    return best;
  }

  /**
   * Rank causal candidates for a focal event: signals whose timing and
   * domain relationships make them plausible causes (cause must occur
   * before the effect; network responses are strong causes of DOM adds;
   * user interactions are strong causes of network activity…).
   */
  rankCausalCandidates(focal: TimelineSignal, domains?: SignalDomain[], maxResults = 10): Array<{ signal: TimelineSignal; temporalGapMs: number; score: number; rationale: string }> {
    const candidates: Array<{ signal: TimelineSignal; temporalGapMs: number; score: number; rationale: string }> = [];
    const CAUSAL_PRIOR: Partial<Record<`${SignalDomain}->${SignalDomain}`, number>> = {
      'NETWORK->DOM': 0.9,
      'USER->NETWORK': 0.85,
      'USER->DOM': 0.8,
      'NETWORK->ERROR': 0.7,
      'ERROR->DOM': 0.5,
      'DOM->DOM': 0.6,
      'STYLE->DOM': 0.65,
      'NAVIGATION->DOM': 0.85,
      'CONSOLE->DOM': 0.35,
      'DOM->SCREENSHOT': 0.4,
      'NAVIGATION->NETWORK': 0.8,
    };
    for (const s of this.signals) {
      if (s.eventId === focal.eventId) continue;
      if (domains && !domains.includes(s.domain)) continue;
      const gap = focal.timestamp - s.timestamp; // positive → s before focal
      if (gap < 0 || gap > 2000) continue; // causes must precede effect (≤2s)
      const prior = CAUSAL_PRIOR[`${s.domain}->${focal.domain}` as `${SignalDomain}->${SignalDomain}`] ?? 0.3;
      // temporal decay: closer in time = stronger
      const decay = 1 / (1 + gap / 400);
      const score = Number((prior * decay).toFixed(3));
      candidates.push({ signal: s, temporalGapMs: gap, score, rationale: `${s.domain}→${focal.domain} prior ${prior}, gap ${gap}ms` });
    }
    return candidates.sort((a, b) => b.score - a.score).slice(0, maxResults);
  }

  /** Full timeline (bounded) for reports. */
  timeline(from?: number, to?: number, limit = 500): TimelineSignal[] {
    let list = from !== undefined || to !== undefined ? this.range(from ?? -Infinity, to ?? Infinity) : this.signals;
    return list.slice(0, limit);
  }

  stats(): { total: number; byDomain: Record<string, number>; firstTimestamp: number; lastTimestamp: number } {
    const byDomain: Record<string, number> = {};
    for (const s of this.signals) byDomain[s.domain] = (byDomain[s.domain] || 0) + 1;
    return {
      total: this.signals.length,
      byDomain,
      firstTimestamp: this.signals[0]?.timestamp ?? 0,
      lastTimestamp: this.signals[this.signals.length - 1]?.timestamp ?? 0,
    };
  }
}
