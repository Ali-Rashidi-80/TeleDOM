/**
 * TeleDOM v4 — Observatory UI (investigation-centric panel).
 *
 * Browser-safe, data-driven view: renders an investigation result (the
 * JSON payload of a td_investigate result or an imported .tdom incident)
 * as Incident/Objective · Temporal Timeline · Causal Graph · Evidence &
 * Confidence · Live/Replay/Branch · Verification/Proof. It never imports
 * the server-side v4 kernel (node:crypto) — the browser bundle receives
 * portable JSON only, preserving the zero-trust boundary.
 */

export interface ObservatoryIncident {
  incidentId?: string;
  objective: string;
  status: string;
  rootCause?: string | null;
  verification?: string;
  proofId?: string | null;
  hypotheses?: { id: string; rank?: number; statement: string; confidence: number; status?: string }[];
  counterfactual?: { verdict: string; confidence: number; symptomResolved: boolean } | null;
  timeline?: { eventId?: string; seq?: number; source: string; type: string; logicalTime?: number }[];
  causalChain?: { events?: { source: string; type: string; sequence?: number }[] };
  lessons?: string[];
  warnings?: string[];
}

export class ObservatoryPanel {
  private host: HTMLElement;

  constructor(host: HTMLElement | string) {
    this.host = typeof host === 'string' ? document.querySelector(host) as HTMLElement : host;
    if (!this.host) throw new Error('ObservatoryPanel: host element not found');
  }

  /** Render the full observatory from an investigation payload. */
  render(incident: ObservatoryIncident): void {
    this.host.innerHTML = '';
    this.host.className = 'tdom-observatory';
    this.host.appendChild(this.header(incident));
    const grid = document.createElement('div');
    grid.className = 'tdom-obs-grid';
    grid.appendChild(this.timelinePanel(incident));
    grid.appendChild(this.causalPanel(incident));
    grid.appendChild(this.evidencePanel(incident));
    grid.appendChild(this.verificationPanel(incident));
    this.host.appendChild(grid);
    if (incident.lessons?.length) {
      this.host.appendChild(this.section('Learning', incident.lessons.map((l) => `• ${escapeHtml(l)}`).join('<br>')));
    }
    if (incident.warnings?.length) {
      this.host.appendChild(this.section('Warnings', incident.warnings.map((w) => `⚠ ${escapeHtml(w)}`).join('<br>')));
    }
  }

  private header(incident: ObservatoryIncident): HTMLElement {
    const header = document.createElement('div');
    header.className = 'tdom-obs-header';
    const statusColor = incident.status === 'RESOLVED' ? 'var(--tdom-ok, #2e7d32)' : 'var(--tdom-warn, #b26a00)';
    header.innerHTML = `
      <div class="tdom-obs-title">TeleDOM Observatory</div>
      <div class="tdom-obs-objective">${escapeHtml(incident.objective)}</div>
      <div class="tdom-obs-meta">
        <span class="tdom-badge" style="background:${statusColor}">${escapeHtml(incident.status)}</span>
        ${incident.verification ? `<span class="tdom-badge tdom-verification">verification: ${escapeHtml(incident.verification)}</span>` : ''}
        ${incident.proofId ? `<span class="tdom-badge tdom-proof">proof: ${escapeHtml(incident.proofId)}</span>` : ''}
      </div>`;
    return header;
  }

  private timelinePanel(incident: ObservatoryIncident): HTMLElement {
    const events = incident.timeline ?? [];
    const body = events.length
      ? `<ol class="tdom-timeline">${events.map((e) => `
          <li class="tdom-event tdom-src-${escapeHtml(e.source)}">
            <span class="tdom-event-source">${escapeHtml(e.source)}</span>
            <span class="tdom-event-type">${escapeHtml(e.type)}</span>
            ${e.logicalTime !== undefined ? `<span class="tdom-event-time">t=${e.logicalTime}ms</span>` : ''}
          </li>`).join('')}</ol>`
      : '<div class="tdom-empty">no timeline events</div>';
    return this.panel('Temporal Timeline', body, `${events.length} events`);
  }

  private causalPanel(incident: ObservatoryIncident): HTMLElement {
    const chain = incident.causalChain?.events ?? [];
    const root = incident.rootCause ?? 'unidentified';
    const body = chain.length
      ? `<div class="tdom-chain">${chain.map((e, i) => `
          ${i > 0 ? '<div class="tdom-chain-arrow">↓ causes</div>' : ''}
          <div class="tdom-chain-node"><span class="tdom-event-source">${escapeHtml(e.source)}</span> ${escapeHtml(e.type)}</div>`).join('')}</div>
          <div class="tdom-root-cause">ROOT CAUSE: ${escapeHtml(root)}</div>`
      : `<div class="tdom-empty">no causal chain reconstructed</div>
         <div class="tdom-root-cause">ROOT CAUSE: ${escapeHtml(root)}</div>`;
    return this.panel('Causal Graph', body, `${chain.length} chain events`);
  }

  private evidencePanel(incident: ObservatoryIncident): HTMLElement {
    const hypotheses = incident.hypotheses ?? [];
    const cf = incident.counterfactual;
    let body = '';
    if (hypotheses.length) {
      body += `<table class="tdom-hypotheses"><thead><tr><th>#</th><th>Hypothesis</th><th>Confidence</th><th>Status</th></tr></thead><tbody>`;
      for (const h of hypotheses) {
        const pct = Math.round(h.confidence * 100);
        body += `<tr><td>${h.rank ?? '-'}</td><td>${escapeHtml(h.statement)}</td>
          <td><div class="tdom-conf-bar"><div class="tdom-conf-fill" style="width:${pct}%"></div><span>${pct}%</span></div></td>
          <td>${escapeHtml(h.status ?? 'UNTESTED')}</td></tr>`;
      }
      body += '</tbody></table>';
    } else {
      body += '<div class="tdom-empty">no hypotheses generated</div>';
    }
    if (cf) {
      body += `<div class="tdom-counterfactual">
        <strong>Counterfactual</strong>: ${escapeHtml(cf.verdict)} · confidence ${Math.round(cf.confidence * 100)}% ·
        symptom ${cf.symptomResolved ? 'RESOLVED in branch' : 'persisted in branch'}
      </div>`;
    }
    return this.panel('Evidence / Confidence', body, `${hypotheses.length} hypotheses`);
  }

  private verificationPanel(incident: ObservatoryIncident): HTMLElement {
    const verification = incident.verification ?? 'UNSUPPORTED';
    const cls = verification === 'PASS' ? 'tdom-pass' : verification === 'FAIL' ? 'tdom-fail' : 'tdom-inconclusive';
    const body = `
      <div class="tdom-verification ${cls}">
        <div class="tdom-verification-status">${escapeHtml(verification)}</div>
        <div class="tdom-verification-note">${
          verification === 'PASS'
            ? 'Postconditions held and required evidence was collected. INCONCLUSIVE is never silently mapped to PASS.'
            : verification === 'FAIL'
              ? 'A postcondition failed or counterevidence was observed.'
              : 'Evidence was insufficient to verify — reported honestly, not as success.'
        }</div>
        ${incident.proofId ? `<div class="tdom-proof-ref">machine-verifiable proof: ${escapeHtml(incident.proofId)}</div>` : ''}
      </div>`;
    return this.panel('Verification / Proof', body);
  }

  private panel(title: string, bodyHtml: string, badge?: string): HTMLElement {
    const panel = document.createElement('section');
    panel.className = 'tdom-obs-panel';
    panel.innerHTML = `
      <div class="tdom-obs-panel-title">${escapeHtml(title)}${badge ? ` <span class="tdom-obs-badge">${escapeHtml(badge)}</span>` : ''}</div>
      <div class="tdom-obs-panel-body">${bodyHtml}</div>`;
    return panel;
  }

  private section(title: string, bodyHtml: string): HTMLElement {
    const section = document.createElement('section');
    section.className = 'tdom-obs-section';
    section.innerHTML = `<div class="tdom-obs-panel-title">${escapeHtml(title)}</div><div class="tdom-obs-panel-body">${bodyHtml}</div>`;
    return section;
  }
}

function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// Auto-mount when a host element exists (extension popup / dashboard page).
export function mountObservatory(hostSelector = '#tdom-observatory'): ObservatoryPanel | null {
  const host = document.querySelector(hostSelector);
  if (!host) return null;
  return new ObservatoryPanel(host as HTMLElement);
}
