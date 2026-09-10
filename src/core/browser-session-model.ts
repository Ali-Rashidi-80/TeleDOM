import { MutationHistoryEntry, PageStateSnapshot, ViewportState } from '../types/browser-control';
import { ActionTimeline, OperationRegistry } from './action-timeline';
import { stableHash } from './dom-fingerprint';

/**
 * §50 Browser Session Model
 *
 * Coherent abstraction over the full browser state: tabs, active tab,
 * viewport, extension state, page snapshots, command history, annotations,
 * project identity and the action timeline. Prevents scattered
 * uncontrolled state — every subsystem reports into this model.
 */

export interface TabSessionIdentity {
  sessionTabId: string;
  browserTabId?: number;
  url: string;
  title: string;
  createdAt: number;
  lastSeenAt: number;
  status: 'OPEN' | 'CLOSED' | 'STALE';
}

export interface SessionSummary {
  sessionId: string;
  startedAt: number;
  url: string;
  title: string;
  tabs: TabSessionIdentity[];
  activeTabId: string | null;
  viewport: { width: number; height: number; isModified: boolean };
  extensionEnabled: boolean;
  snapshotCount: number;
  commandCount: number;
  annotationCount: number;
  mutationHistoryCount: number;
  timelineEventCount: number;
  projectId?: string;
}

const SNAPSHOT_CAP = 100;

export class BrowserSessionModel {
  public readonly sessionId: string;
  public readonly timeline = new ActionTimeline();
  public readonly operations = new OperationRegistry();

  private tabs = new Map<string, TabSessionIdentity>();
  private activeTabId: string | null = null;
  private startedAt = Date.now();
  private snapshots: PageStateSnapshot[] = [];
  private commandHistory: Array<{ commandId: string; tool: string; args?: Record<string, any>; outcome: string; timestamp: number; durationMs: number; error?: string }> = [];
  private annotationCount = 0;
  private projectId?: string;
  private tabCounter = 0;
  private commandCounter = 0;

  constructor(sessionId?: string) {
    this.sessionId = sessionId || `sess_${Date.now().toString(36)}`;
  }

  // --- Tabs -------------------------------------------------------------
  public registerTab(browserTabId: number | undefined, url: string, title: string): TabSessionIdentity {
    const existing = browserTabId !== undefined
      ? Array.from(this.tabs.values()).find((t) => t.browserTabId === browserTabId)
      : undefined;
    if (existing) {
      existing.lastSeenAt = Date.now();
      existing.status = 'OPEN';
      existing.url = url || existing.url;
      existing.title = title || existing.title;
      return existing;
    }
    this.tabCounter++;
    const sessionTabId = `stab_${this.tabCounter}_${Date.now().toString(36)}`;
    const identity: TabSessionIdentity = {
      sessionTabId,
      browserTabId,
      url,
      title,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      status: 'OPEN',
    };
    this.tabs.set(sessionTabId, identity);
    this.timeline.record('TAB_OPENED', `tab ${sessionTabId} registered (${url || 'no url'})`, { sessionId: this.sessionId });
    return identity;
  }

  public closeTab(sessionTabId: string): boolean {
    const tab = this.tabs.get(sessionTabId);
    if (!tab) return false;
    tab.status = 'CLOSED';
    tab.lastSeenAt = Date.now();
    this.timeline.record('TAB_CLOSED', `tab ${sessionTabId} closed`, { sessionId: this.sessionId });
    return true;
  }

  public switchTab(sessionTabId: string): boolean {
    const tab = this.tabs.get(sessionTabId);
    if (!tab || tab.status === 'CLOSED') return false;
    this.activeTabId = sessionTabId;
    this.timeline.record('TAB_SWITCHED', `active tab → ${sessionTabId}`, { sessionId: this.sessionId });
    return true;
  }

  public getTabs(): TabSessionIdentity[] {
    return Array.from(this.tabs.values());
  }

  public getActiveTab(): TabSessionIdentity | null {
    if (this.activeTabId) {
      const t = this.tabs.get(this.activeTabId);
      if (t && t.status === 'OPEN') return t;
    }
    return Array.from(this.tabs.values()).find((t) => t.status === 'OPEN') || null;
  }

  /**
   * Stale-reference protection (§16/§53): mark tabs as STALE when the
   * underlying browser reference is suspected dead (e.g. bridge reconnect).
   */
  public markAllStale(): number {
    let count = 0;
    for (const tab of this.tabs.values()) {
      if (tab.status === 'OPEN') {
        tab.status = 'STALE';
        count++;
      }
    }
    return count;
  }

  // --- Snapshots (§39) --------------------------------------------------
  public captureSnapshot(doc: Document, extensionEnabled: boolean, pendingMutations: number): PageStateSnapshot {
    const win = doc.defaultView;
    const html = doc.documentElement?.outerHTML || '';
    const interactive = doc.querySelectorAll('a[href], button, input, select, textarea, [role="button"]').length;
    const snapshot: PageStateSnapshot = {
      snapshotId: `snap_${Date.now().toString(36)}_${this.snapshots.length + 1}`,
      timestamp: Date.now(),
      url: win?.location?.href || doc.location?.href || '',
      title: doc.title || '',
      viewport: {
        width: win?.innerWidth || 0,
        height: win?.innerHeight || 0,
        scrollX: win?.scrollX || 0,
        scrollY: win?.scrollY || 0,
        devicePixelRatio: (win as any)?.devicePixelRatio || 1,
      },
      domLength: html.length,
      domHash: stableHash(html),
      interactiveCount: interactive,
      selectedRegions: [],
      extensionEnabled,
      pendingMutations,
      annotationCount: this.annotationCount,
    };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > SNAPSHOT_CAP) this.snapshots.splice(0, this.snapshots.length - SNAPSHOT_CAP);
    this.timeline.record('SNAPSHOT_CREATED', `snapshot ${snapshot.snapshotId} (dom ${snapshot.domLength}b)`, { sessionId: this.sessionId });
    return snapshot;
  }

  public getSnapshot(snapshotId?: string): PageStateSnapshot | null {
    if (!snapshotId) return this.snapshots[this.snapshots.length - 1] || null;
    return this.snapshots.find((s) => s.snapshotId === snapshotId) || null;
  }

  public listSnapshots(): Array<{ snapshotId: string; timestamp: number; url: string; title: string; domLength: number; domHash: string }> {
    return this.snapshots.map((s) => ({
      snapshotId: s.snapshotId,
      timestamp: s.timestamp,
      url: s.url,
      title: s.title,
      domLength: s.domLength,
      domHash: s.domHash,
    }));
  }

  public compareSnapshots(a: PageStateSnapshot, b: PageStateSnapshot): {
    identical: boolean;
    changes: Array<{ field: string; before: any; after: any }>;
    domDelta: { beforeLength: number; afterLength: number; delta: number };
    summary: string;
  } {
    const fields: Array<keyof PageStateSnapshot> = ['url', 'title', 'domLength', 'domHash', 'interactiveCount', 'extensionEnabled', 'annotationCount'];
    const changes: Array<{ field: string; before: any; after: any }> = [];
    for (const f of fields) {
      if ((a as any)[f] !== (b as any)[f]) {
        changes.push({ field: f as string, before: (a as any)[f], after: (b as any)[f] });
      }
    }
    if (a.viewport.width !== b.viewport.width || a.viewport.height !== b.viewport.height) {
      changes.push({ field: 'viewport', before: `${a.viewport.width}x${a.viewport.height}`, after: `${b.viewport.width}x${b.viewport.height}` });
    }
    const delta = b.domLength - a.domLength;
    return {
      identical: changes.length === 0,
      changes,
      domDelta: { beforeLength: a.domLength, afterLength: b.domLength, delta },
      summary: changes.length === 0
        ? 'States are identical.'
        : `${changes.length} field(s) changed; DOM size ${delta >= 0 ? '+' : ''}${delta} bytes.`,
    };
  }

  // --- Commands ---------------------------------------------------------
  public recordCommand(tool: string, args: Record<string, any> | undefined, outcome: 'SUCCESS' | 'FAILED', durationMs: number, error?: string): string {
    this.commandCounter++;
    const commandId = `cmd_${this.commandCounter}_${Date.now().toString(36)}`;
    this.commandHistory.push({
      commandId,
      tool,
      args,
      outcome,
      timestamp: Date.now(),
      durationMs,
      error,
    });
    this.timeline.record('COMMAND_EXECUTED', `${tool} → ${outcome}${error ? ` (${error})` : ''}`, { sessionId: this.sessionId, data: { commandId } });
    return commandId;
  }

  public getCommandHistory(limit = 100) {
    return this.commandHistory.slice(-limit);
  }

  // --- Misc -------------------------------------------------------------
  public noteAnnotations(count: number): void {
    this.annotationCount = count;
  }

  public bindProject(projectId: string): void {
    this.projectId = projectId;
  }

  public getProjectId(): string | undefined {
    return this.projectId;
  }

  public summary(doc: Document, viewport: ViewportState, extensionEnabled: boolean, mutationHistory: MutationHistoryEntry[]): SessionSummary {
    return {
      sessionId: this.sessionId,
      startedAt: this.startedAt,
      url: doc.defaultView?.location?.href || doc.location?.href || '',
      title: doc.title || '',
      tabs: this.getTabs(),
      activeTabId: this.activeTabId,
      viewport: { width: viewport.width, height: viewport.height, isModified: viewport.isModified },
      extensionEnabled,
      snapshotCount: this.snapshots.length,
      commandCount: this.commandHistory.length,
      annotationCount: this.annotationCount,
      mutationHistoryCount: mutationHistory.length,
      timelineEventCount: this.timeline.size(),
      projectId: this.projectId,
    };
  }
}
