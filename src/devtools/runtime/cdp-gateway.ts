/**
 * CDP Gateway — Chrome DevTools Protocol session management through the
 * MCPDOM extension bridge. The extension service worker exposes a
 * CDP_COMMAND bridge message backed by chrome.debugger.attach /
 * chrome.debugger.sendCommand (see extension service worker, and the
 * added "debugger" permission in the manifest — a minimal, justified
 * change required for DevTools capability parity).
 *
 * Resource lifecycle (§24): attach/detach tracked per target; all
 * sessions are detached on stop(). Concurrency safety (§23): one
 * session per target; sendCommand is serialized per session.
 */

import { RuntimeBridgeClient } from './unified-browser-runtime';

export interface CdpSessionInfo {
  sessionId: string;
  targetId: string;
  tabId?: number;
  attachedAt: number;
  commandsSent: number;
  domains: Set<string>;
}

interface PendingCall {
  resolve: (value: any) => void;
  reject: (err: Error) => void;
}

export class CdpGateway {
  private bridge?: RuntimeBridgeClient;
  private sessions = new Map<string, CdpSessionInfo>();
  private sessionCounter = 0;
  /** command serialization per session (§23). */
  private queues = new Map<string, Promise<unknown>>();
  private remoteListeners = new Map<string, Array<(params: any) => void>>();

  setBridge(bridge: RuntimeBridgeClient | undefined): void {
    this.bridge = bridge;
  }

  isAvailable(): boolean {
    return !!this.bridge;
  }

  /** Attach a CDP session to a target (tab). */
  async attach(target: { tabId?: number; targetId?: string }): Promise<CdpSessionInfo> {
    if (!this.bridge) {
      throw new Error('CAPABILITY_UNAVAILABLE: CDP gateway requires the MCPDOM extension bridge (chrome.debugger transport).');
    }
    // Reuse existing session for the same tab.
    for (const session of this.sessions.values()) {
      if (target.tabId !== undefined && session.tabId === target.tabId) return session;
      if (target.targetId && session.targetId === target.targetId) return session;
    }
    const sessionId = `cdp_${++this.sessionCounter}`;
    const targetId = target.targetId || `tab_${target.tabId ?? 'active'}`;
    // The extension validates the attach and returns the real CDP target id.
    const attachResult = await this.bridge.sendCommand('CDP_ATTACH', { sessionId, tabId: target.tabId, targetId });
    const info: CdpSessionInfo = {
      sessionId,
      targetId: attachResult?.targetId || targetId,
      tabId: target.tabId ?? attachResult?.tabId,
      attachedAt: Date.now(),
      commandsSent: 0,
      domains: new Set<string>(),
    };
    this.sessions.set(sessionId, info);
    return info;
  }

  /**
   * Send a CDP command. Serialized per session to avoid interleaved
   * protocol corruption during concurrent tool calls.
   */
  async send(sessionId: string, method: string, params?: Record<string, unknown>): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`PAGE_NOT_FOUND: no CDP session '${sessionId}'. Attach first.`);
    const bridge = this.bridge;
    if (!bridge) throw new Error('CAPABILITY_UNAVAILABLE: CDP gateway bridge disconnected.');
    const domain = method.split('.')[0];
    session.domains.add(domain);
    session.commandsSent++;

    const run = async (): Promise<any> => {
      const result = await bridge.sendCommand('CDP_COMMAND', { sessionId, method, params: params || {} });
      if (result && result.__cdpError) {
        throw new Error(`CDP error ${result.code || 'UNKNOWN'}: ${result.message || 'protocol error'} (method: ${method})`);
      }
      return result?.result !== undefined ? result.result : result;
    };

    const prev = this.queues.get(sessionId) || Promise.resolve();
    const next = prev.then(run, run);
    this.queues.set(sessionId, next.catch(() => { /* queue must not die on command failure */ }));
    return next;
  }

  /** Subscribe to CDP domain events routed from the extension. */
  onRemoteEvent(sessionId: string, listener: (params: any) => void): () => void {
    const list = this.remoteListeners.get(sessionId) || [];
    list.push(listener);
    this.remoteListeners.set(sessionId, list);
    return () => {
      const arr = this.remoteListeners.get(sessionId);
      if (arr) {
        const idx = arr.indexOf(listener);
        if (idx >= 0) arr.splice(idx, 1);
      }
    };
  }

  /** Feed events arriving from the extension into listeners (called by gateway transport). */
  dispatchRemoteEvent(sessionId: string, method: string, params: any): void {
    for (const listener of this.remoteListeners.get(sessionId) || []) {
      try { listener({ method, params }); } catch { /* listener isolation */ }
    }
  }

  async detach(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    if (this.bridge) {
      try { await this.bridge.sendCommand('CDP_DETACH', { sessionId }); } catch { /* already gone */ }
    }
    this.sessions.delete(sessionId);
    this.queues.delete(sessionId);
    this.remoteListeners.delete(sessionId);
    return true;
  }

  /** Detach everything (server shutdown, §24). */
  async detachAll(): Promise<number> {
    let count = 0;
    for (const sessionId of Array.from(this.sessions.keys())) {
      await this.detach(sessionId);
      count++;
    }
    return count;
  }

  listSessions(): CdpSessionInfo[] {
    return Array.from(this.sessions.values()).map(s => ({ ...s, domains: Array.from(s.domains) })) as unknown as CdpSessionInfo[];
  }

  getSession(sessionId: string): CdpSessionInfo | undefined {
    return this.sessions.get(sessionId);
  }
}

export const cdpGateway = new CdpGateway();
