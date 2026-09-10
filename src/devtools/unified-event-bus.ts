/**
 * §11 Unified Event Bus — correlates events from every platform domain
 * (DOM, navigation, network, console, runtime, screenshots, performance,
 * memory, extensions, WebMCP, interactions, emulation) onto one
 * timestamped, sequenced stream with correlation IDs.
 */

import { UnifiedEvent, EventDomain, EventBusSubscription } from './types';

const RING_LIMIT = 5000;

export class UnifiedEventBus {
  private ring: UnifiedEvent[] = [];
  private head = 0;
  private subscriptions = new Map<string, { domain?: EventDomain; fn: EventBusSubscription }>();
  private subCounter = 0;
  private seq = 0;
  /** Correlation groups: correlationId → event ids. */
  private correlations = new Map<string, string[]>();

  publish(domain: EventDomain, type: string, data: Record<string, unknown>, ids?: {
    pageId?: string; frameId?: string; navigationId?: string; requestId?: string;
    mutationId?: string; traceId?: string; snapshotId?: string; transactionId?: string;
    correlationId?: string;
  }): UnifiedEvent {
    const sequence = ++this.seq;
    const event: UnifiedEvent = {
      eventId: `uev_${sequence}`,
      domain,
      type,
      timestamp: Date.now(),
      sequence,
      pageId: ids?.pageId,
      frameId: ids?.frameId,
      navigationId: ids?.navigationId,
      requestId: ids?.requestId,
      mutationId: ids?.mutationId,
      traceId: ids?.traceId,
      snapshotId: ids?.snapshotId,
      transactionId: ids?.transactionId,
      correlationId: ids?.correlationId,
      data,
    };
    // Ring buffer (bounded memory, §24 resource lifecycle).
    if (this.ring.length < RING_LIMIT) {
      this.ring.push(event);
    } else {
      this.ring[this.head] = event;
      this.head = (this.head + 1) % RING_LIMIT;
    }
    if (event.correlationId) {
      const group = this.correlations.get(event.correlationId) || [];
      group.push(event.eventId);
      if (group.length > 200) group.shift();
      this.correlations.set(event.correlationId, group);
    }
    for (const sub of this.subscriptions.values()) {
      if (sub.domain && sub.domain !== domain) continue;
      try { sub.fn(event); } catch { /* subscriber errors never break the bus */ }
    }
    return event;
  }

  subscribe(fn: EventBusSubscription, domain?: EventDomain): () => void {
    const id = `sub_${++this.subCounter}`;
    this.subscriptions.set(id, { domain, fn });
    return () => this.subscriptions.delete(id);
  }

  /** Snapshot of the ordered event stream (oldest → newest). */
  snapshot(filter?: { domains?: EventDomain[]; pageId?: string; since?: number; limit?: number }): UnifiedEvent[] {
    let events = this.ordered();
    if (filter?.domains) events = events.filter(e => filter.domains!.includes(e.domain));
    if (filter?.pageId) events = events.filter(e => e.pageId === filter.pageId);
    if (filter?.since !== undefined) events = events.filter(e => e.timestamp >= filter!.since!);
    if (filter?.limit) events = events.slice(-filter.limit);
    return events;
  }

  correlationGroup(correlationId: string): UnifiedEvent[] {
    const ids = this.correlations.get(correlationId) || [];
    const byId = new Map(this.ordered().map(e => [e.eventId, e]));
    return ids.map(id => byId.get(id)).filter((e): e is UnifiedEvent => !!e);
  }

  stats(): { total: number; byDomain: Record<string, number>; subscriptions: number } {
    const byDomain: Record<string, number> = {};
    for (const e of this.ordered()) byDomain[e.domain] = (byDomain[e.domain] || 0) + 1;
    return { total: this.ring.length, byDomain, subscriptions: this.subscriptions.size };
  }

  private ordered(): UnifiedEvent[] {
    if (this.ring.length < RING_LIMIT) return this.ring.slice();
    return this.ring.slice(this.head).concat(this.ring.slice(0, this.head));
  }
}
