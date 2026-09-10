/**
 * §10 Page Identity Unification — canonical page identity registry.
 *
 * Maps MCPDOM page ids ↔ Chrome extension tab ids ↔ CDP target ids ↔
 * Puppeteer page ids ↔ frames ↔ navigations. Identity survives
 * navigation: a navigation updates url/title on the SAME PageIdentity
 * and appends a NavigationRecord, so historical references stay valid.
 */

import { PageIdentity, FrameIdentity, NavigationRecord } from './types';

let pageCounter = 0;
let navigationCounter = 0;

export class PageIdentityRegistry {
  private pages = new Map<string, PageIdentity>();
  /** extensionTabId → pageId */
  private byTab = new Map<number, string>();
  /** cdpTargetId → pageId */
  private byTarget = new Map<string, string>();
  /** url → pageIds (latest last) */
  private byUrl = new Map<string, string[]>();

  /** Register (or refresh) a page discovered via tab listing or CDP attach. */
  register(input: {
    url: string;
    title?: string;
    extensionTabId?: number;
    cdpTargetId?: string;
    sessionId?: string;
  }): PageIdentity {
    // 1. Same extension tab → same page identity (survives navigation).
    if (input.extensionTabId !== undefined && this.byTab.has(input.extensionTabId)) {
      const pageId = this.byTab.get(input.extensionTabId)!;
      const existing = this.pages.get(pageId)!;
      if (existing.url !== input.url) {
        this.appendNavigation(existing, input.url, 'load');
      }
      existing.url = input.url;
      if (input.title !== undefined) existing.title = input.title;
      existing.lastSeenAt = Date.now();
      if (input.cdpTargetId) {
        existing.cdpTargetId = input.cdpTargetId;
        this.byTarget.set(input.cdpTargetId, pageId);
      }
      if (input.sessionId) existing.sessionId = input.sessionId;
      return existing;
    }

    // 2. Same CDP target → same identity.
    if (input.cdpTargetId && this.byTarget.has(input.cdpTargetId)) {
      const pageId = this.byTarget.get(input.cdpTargetId)!;
      const existing = this.pages.get(pageId)!;
      existing.lastSeenAt = Date.now();
      return existing;
    }

    // 3. New identity.
    const pageId = `page_${++pageCounter}`;
    const identity: PageIdentity = {
      pageId,
      url: input.url,
      title: input.title || '',
      extensionTabId: input.extensionTabId,
      cdpTargetId: input.cdpTargetId,
      sessionId: input.sessionId,
      frames: [{ frameId: `${pageId}_main`, parentId: null, url: input.url }],
      navigations: [],
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      closed: false,
    };
    this.pages.set(pageId, identity);
    if (input.extensionTabId !== undefined) this.byTab.set(input.extensionTabId, pageId);
    if (input.cdpTargetId) this.byTarget.set(input.cdpTargetId, pageId);
    this.addUrlIndex(input.url, pageId);
    return identity;
  }

  /** Record a SPA-style navigation on a page (pushState/hashchange…). */
  recordNavigation(pageId: string, toUrl: string, navigationType: NavigationRecord['navigationType']): NavigationRecord | null {
    const page = this.pages.get(pageId);
    if (!page) return null;
    const rec = this.appendNavigation(page, toUrl, navigationType);
    page.url = toUrl;
    page.lastSeenAt = Date.now();
    return rec;
  }

  private appendNavigation(page: PageIdentity, toUrl: string, navigationType: NavigationRecord['navigationType']): NavigationRecord {
    const rec: NavigationRecord = {
      navigationId: `nav_${++navigationCounter}`,
      fromUrl: page.url,
      toUrl,
      timestamp: Date.now(),
      navigationType,
    };
    page.navigations.push(rec);
    this.addUrlIndex(toUrl, page.pageId);
    return rec;
  }

  /** Register a (sub)frame discovered under a page. */
  registerFrame(pageId: string, frame: Omit<FrameIdentity, 'frameId'> & { frameId?: string }): FrameIdentity | null {
    const page = this.pages.get(pageId);
    if (!page) return null;
    const existing = frame.parentId ? page.frames.find(f => f.url === frame.url && f.parentId === frame.parentId) : undefined;
    if (existing) {
      return existing;
    }
    const created: FrameIdentity = {
      frameId: frame.frameId || `${pageId}_frame_${page.frames.length + 1}`,
      parentId: frame.parentId,
      url: frame.url,
      hostNodeId: frame.hostNodeId,
    };
    page.frames.push(created);
    return created;
  }

  private addUrlIndex(url: string, pageId: string): void {
    if (!url) return;
    const list = this.byUrl.get(url) || [];
    list.push(pageId);
    if (list.length > 20) list.shift();
    this.byUrl.set(url, list);
  }

  /** Resolve by any of the supported identity keys. */
  resolve(selector: { pageId?: string; tabId?: number; cdpTargetId?: string; url?: string }): PageIdentity | null {
    if (selector.pageId) return this.pages.get(selector.pageId) || null;
    if (selector.tabId !== undefined) {
      const pageId = this.byTab.get(selector.tabId);
      if (pageId) return this.pages.get(pageId) || null;
      // Unknown tab → lazily create a bridged identity.
      return null;
    }
    if (selector.cdpTargetId) {
      const pageId = this.byTarget.get(selector.cdpTargetId);
      return pageId ? this.pages.get(pageId) || null : null;
    }
    if (selector.url) {
      const list = this.byUrl.get(selector.url);
      if (list && list.length > 0) {
        const pageId = list[list.length - 1];
        return this.pages.get(pageId) || null;
      }
    }
    return null;
  }

  markClosed(pageId: string): void {
    const page = this.pages.get(pageId);
    if (page) {
      page.closed = true;
      page.lastSeenAt = Date.now();
      if (page.extensionTabId !== undefined) this.byTab.delete(page.extensionTabId);
    }
  }

  list(): PageIdentity[] {
    return Array.from(this.pages.values()).filter(p => !p.closed);
  }

  /** Link a CDP target id to an existing page (late CDP attach). */
  attachCdpTarget(pageId: string, cdpTargetId: string): boolean {
    const page = this.pages.get(pageId);
    if (!page) return false;
    page.cdpTargetId = cdpTargetId;
    this.byTarget.set(cdpTargetId, pageId);
    page.lastSeenAt = Date.now();
    return true;
  }

  /** Map an MCPDOM forensic session onto a page identity. */
  bindSession(pageId: string, sessionId: string): boolean {
    const page = this.pages.get(pageId);
    if (!page) return false;
    page.sessionId = sessionId;
    return true;
  }
}
