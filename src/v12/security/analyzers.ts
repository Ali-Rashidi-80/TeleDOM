/**
 * TeleDOM v12+ Security — Passive analyzers + findings + active-test policy.
 *
 * Security is evidence-driven: every finding carries category, severity,
 * confidence, affected entity, source, sink, data flow, observed behavior,
 * evidence, reproduction, remediation, verification, status. Suspicion is
 * NEVER reported as a confirmed vulnerability. Active testing requires
 * explicit scope + authorization + rate limits + kill switch; destructive
 * behavior is disabled by default.
 */

export type FindingStatus = 'CONFIRMED' | 'PROBABLE' | 'POTENTIAL' | 'BENIGN' | 'NOT_REPRODUCIBLE';
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  category:
  | 'dom-xss' | 'csp' | 'cors' | 'cookie' | 'storage' | 'postMessage'
  | 'iframe' | 'auth-session' | 'third-party' | 'secret-exposure'
  | 'mixed-content' | 'service-worker' | 'dangerous-api' | 'regression';
  severity: Severity;
  confidence: number;
  affectedEntity: string;
  source?: string;
  sink?: string;
  dataFlow?: string[];
  observedBehavior: string;
  evidenceRefs: string[];
  reproduction?: string;
  remediation: string;
  verification: FindingStatus;
}

export interface SecurityPolicy {
  mode: 'passive' | 'authorized-active';
  allowedOrigins: string[];
  blockedOrigins: string[];
  rateLimitPerMinute: number;
  concurrencyLimit: number;
  requestBudget: number;
  testCategories: string[];
  destructiveActionsDisabled: boolean;
  killSwitch: boolean;
}

export const DEFAULT_SECURITY_POLICY: SecurityPolicy = {
  mode: 'passive',
  allowedOrigins: [],
  blockedOrigins: [],
  rateLimitPerMinute: 30,
  concurrencyLimit: 2,
  requestBudget: 200,
  testCategories: ['passive-observation'],
  destructiveActionsDisabled: true,
  killSwitch: false,
};

export interface SecurityPostureInput {
  url: string;
  csp?: string | null;
  cookies?: { name: string; secure: boolean; httpOnly: boolean; sameSite?: string }[];
  storageEntries?: { kind: 'localStorage' | 'sessionStorage' | 'indexedDB'; key: string; valuePreview: string }[];
  iframes?: { src: string; sandbox?: string | null }[];
  postMessages?: { origin: string; targetOrigin: string; dataPreview: string }[];
  scripts?: { src?: string; inline: boolean; content?: string }[];
  networkRequests?: { url: string; method?: string; requestHeaders?: Record<string, string>; requestBody?: string }[];
  authSignals?: { kind: string; detail: string }[];
}

/** DOM XSS source/sink matrix (passive: data-flow reasoning only). */
const XSS_SOURCES = ['location', 'location.href', 'location.search', 'location.hash', 'document.referrer', 'document.URL', 'window.name', 'postMessage-data', 'localStorage-value', 'sessionStorage-value'];
const XSS_SINKS: { api: RegExp; label: string }[] = [
  { api: /\.innerHTML\s*=/, label: 'innerHTML assignment' },
  { api: /\.outerHTML\s*=/, label: 'outerHTML assignment' },
  { api: /document\.write(ln)?\s*\(/, label: 'document.write' },
  { api: /eval\s*\(/, label: 'eval' },
  { api: /new\s+Function\s*\(/, label: 'Function constructor' },
  { api: /setTimeout\s*\(\s*['"`]/, label: 'setTimeout string' },
  { api: /insertAdjacentHTML\s*\(/, label: 'insertAdjacentHTML' },
  { api: /\.src\s*=\s*[^;]*(javascript:)/, label: 'javascript: URL in src' },
];

export class SecurityAnalyzers {
  private findings: SecurityFinding[] = [];
  private seq = 0;

  private finding(partial: Omit<SecurityFinding, 'id'>): SecurityFinding {
    this.seq += 1;
    const finding: SecurityFinding = { id: `sec:${this.seq}`, ...partial };
    this.findings.push(finding);
    return finding;
  }

  /** Full passive posture scan (returns ONLY this scan's findings). */
  posture(input: SecurityPostureInput): SecurityFinding[] {
    const start = this.findings.length;
    this.domXssAudit(input.scripts ?? []);
    this.cspAudit(input.url, input.csp);
    this.cookieAudit(input.cookies ?? []);
    this.storageAudit(input.storageEntries ?? []);
    this.iframeAudit(input.url, input.iframes ?? []);
    this.postMessageAudit(input.postMessages ?? []);
    this.thirdPartyAudit(input.url, input.scripts ?? []);
    this.mixedContentAudit(input.url, input.networkRequests ?? []);
    this.authSessionAudit(input.authSignals ?? []);
    this.secretExposureAudit(input.url, input.networkRequests ?? []);
    return this.findings.slice(start);
  }

  /** DOM XSS source→sink tracing (passive, no payload execution). */
  domXssAudit(scripts: { src?: string; inline: boolean; content?: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    for (const script of scripts) {
      if (!script.content) continue;
      for (const sink of XSS_SINKS) {
        if (sink.api.test(script.content)) {
          // Which sources feed the sink? Prefer the LONGEST matching source
          // (e.g. 'location.hash' over bare 'location').
          const feeding = XSS_SOURCES
            .filter((src) => script.content!.includes(src))
            .sort((a, b) => b.length - a.length)
            .filter((src, i, arr) => i === 0 || !arr[0].includes(src));
          const confidence = feeding.length > 0 ? 0.75 : 0.5;
          produced.push(this.finding({
            category: 'dom-xss',
            severity: feeding.length > 0 ? 'high' : 'medium',
            confidence,
            affectedEntity: script.src ?? 'inline-script',
            source: feeding[0] ?? 'unknown-source',
            sink: sink.label,
            dataFlow: feeding.length ? [feeding[0], sink.label] : ['unknown', sink.label],
            observedBehavior: `script contains ${sink.label}${feeding.length ? ` fed by ${feeding.join(', ')}` : ''}`,
            evidenceRefs: [`script:${script.src ?? 'inline'}`],
            remediation: 'sanitize/encode data before DOM sink; prefer textContent; add Trusted-Types CSP',
            verification: feeding.length > 0 ? 'PROBABLE' : 'POTENTIAL',
          }));
        }
      }
    }
    return produced;
  }

  cspAudit(url: string, csp: string | null | undefined): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    if (!csp) {
      produced.push(this.finding({
        category: 'csp',
        severity: 'medium',
        confidence: 0.85,
        affectedEntity: url,
        observedBehavior: 'no Content-Security-Policy observed',
        evidenceRefs: [`response-headers:${url}`],
        remediation: 'deploy a strict CSP (default-src, script-src with nonces, object-src none, base-uri self)',
        verification: 'CONFIRMED',
      }));
      return produced;
    }
    const unsafeInline = /script-src[^;]*'unsafe-inline'/.test(csp);
    const unsafeEval = /script-src[^;]*'unsafe-eval'/.test(csp);
    if (unsafeInline) {
      produced.push(this.finding({
        category: 'csp', severity: 'high', confidence: 0.8, affectedEntity: url,
        observedBehavior: "CSP allows 'unsafe-inline' scripts",
        evidenceRefs: [`csp:${url}`],
        remediation: 'replace inline scripts with nonced/hashed script-src entries',
        verification: 'CONFIRMED',
      }));
    }
    if (unsafeEval) {
      produced.push(this.finding({
        category: 'csp', severity: 'medium', confidence: 0.8, affectedEntity: url,
        observedBehavior: "CSP allows 'unsafe-eval'",
        evidenceRefs: [`csp:${url}`],
        remediation: 'remove eval usage; tighten script-src',
        verification: 'CONFIRMED',
      }));
    }
    return produced;
  }

  cookieAudit(cookies: { name: string; secure: boolean; httpOnly: boolean; sameSite?: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    for (const c of cookies) {
      const sensitiveName = /session|auth|token|sid|jwt/i.test(c.name);
      if (!c.secure && sensitiveName) {
        produced.push(this.finding({
          category: 'cookie', severity: 'high', confidence: 0.9, affectedEntity: `cookie:${c.name}`,
          observedBehavior: `sensitive cookie "${c.name}" sent without Secure flag`,
          evidenceRefs: [`cookie:${c.name}`],
          remediation: 'set Secure attribute (and HttpOnly/SameSite where applicable)',
          verification: 'CONFIRMED',
        }));
      }
      if (!c.httpOnly && sensitiveName && c.sameSite !== 'Strict') {
        produced.push(this.finding({
          category: 'cookie', severity: 'medium', confidence: 0.7, affectedEntity: `cookie:${c.name}`,
          observedBehavior: `session cookie "${c.name}" readable by scripts (no HttpOnly)`,
          evidenceRefs: [`cookie:${c.name}`],
          remediation: 'prefer HttpOnly for server-managed session cookies',
          verification: 'PROBABLE',
        }));
      }
    }
    return produced;
  }

  storageAudit(entries: { kind: string; key: string; valuePreview: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    for (const e of entries) {
      if (/token|secret|password|apikey|auth/i.test(e.key)) {
        produced.push(this.finding({
          category: 'storage', severity: 'medium', confidence: 0.75, affectedEntity: `${e.kind}:${e.key}`,
          observedBehavior: `credential-shaped key "${e.key}" stored client-side`,
          evidenceRefs: [`${e.kind}:${e.key}`],
          remediation: 'avoid storing raw secrets in web storage; use short-lived scoped tokens',
          verification: 'PROBABLE',
        }));
      }
    }
    return produced;
  }

  iframeAudit(pageUrl: string, iframes: { src: string; sandbox?: string | null }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    for (const f of iframes) {
      const isCross = this.isCrossOrigin(f.src, pageUrl);
      if (isCross && !f.sandbox) {
        produced.push(this.finding({
          category: 'iframe', severity: 'low', confidence: 0.6, affectedEntity: `iframe:${f.src}`,
          observedBehavior: 'cross-origin iframe without sandbox attribute',
          evidenceRefs: [`iframe:${f.src}`],
          remediation: 'apply sandbox with least-privilege allow-* flags',
          verification: 'POTENTIAL',
        }));
      }
    }
    return produced;
  }

  postMessageAudit(messages: { origin: string; targetOrigin: string; dataPreview: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    for (const m of messages) {
      if (m.targetOrigin === '*') {
        produced.push(this.finding({
          category: 'postMessage', severity: 'medium', confidence: 0.7, affectedEntity: `postMessage:${m.origin}`,
          source: m.origin, sink: 'window.postMessage(targetOrigin=*)',
          dataFlow: [m.origin, 'broadcast postMessage'],
          observedBehavior: 'postMessage with wildcard targetOrigin broadcasts data to any listener',
          evidenceRefs: [`postMessage:${m.origin}`],
          remediation: 'send to an explicit target origin',
          verification: 'PROBABLE',
        }));
      }
    }
    return produced;
  }

  thirdPartyAudit(pageUrl: string, scripts: { src?: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    const thirdParty = scripts.filter((s) => s.src && this.isCrossOrigin(s.src, pageUrl));
    if (thirdParty.length >= 5) {
      produced.push(this.finding({
        category: 'third-party', severity: 'low', confidence: 0.65, affectedEntity: pageUrl,
        observedBehavior: `${thirdParty.length} third-party scripts loaded`,
        evidenceRefs: thirdParty.slice(0, 5).map((s) => `script:${s.src}`),
        remediation: 'audit third-party supply chain; add SRI + CSP allowlists',
        verification: 'POTENTIAL',
      }));
    }
    return produced;
  }

  mixedContentAudit(pageUrl: string, requests: { url: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    if (pageUrl.startsWith('https://')) {
      for (const r of requests) {
        if (r.url.startsWith('http://')) {
          produced.push(this.finding({
            category: 'mixed-content', severity: 'medium', confidence: 0.9, affectedEntity: r.url,
            observedBehavior: 'plaintext subresource on an https page (mixed content)',
            evidenceRefs: [`request:${r.url}`],
            remediation: 'serve all subresources over https',
            verification: 'CONFIRMED',
          }));
        }
      }
    }
    return produced;
  }

  authSessionAudit(signals: { kind: string; detail: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    const expiry = signals.find((s) => /expire|logout|401|403/i.test(`${s.kind} ${s.detail}`));
    if (expiry) {
      produced.push(this.finding({
        category: 'auth-session', severity: 'info', confidence: 0.6, affectedEntity: 'auth-flow',
        observedBehavior: `auth transition observed: ${expiry.kind} — ${expiry.detail}`,
        evidenceRefs: [`auth:${expiry.kind}`],
        remediation: 'verify session handling on expiry (redirect, token refresh, state cleanup)',
        verification: 'POTENTIAL',
      }));
    }
    return produced;
  }

  secretExposureAudit(pageUrl: string, requests: { url: string; requestHeaders?: Record<string, string>; requestBody?: string }[]): SecurityFinding[] {
    const produced: SecurityFinding[] = [];
    for (const r of requests) {
      const auth = r.requestHeaders?.['authorization'] ?? r.requestHeaders?.['Authorization'];
      const cross = this.isCrossOrigin(r.url, pageUrl);
      if (auth && cross) {
        produced.push(this.finding({
          category: 'secret-exposure', severity: 'high', confidence: 0.8, affectedEntity: r.url,
          source: 'authorization header', sink: r.url,
          dataFlow: ['client-credential', `cross-origin request to ${r.url}`],
          observedBehavior: 'credential sent in Authorization header to a cross-origin endpoint',
          evidenceRefs: [`request:${r.url}`],
          remediation: 'verify the destination origin is the intended audience for this credential',
          verification: 'PROBABLE',
        }));
      }
    }
    return produced;
  }

  private isCrossOrigin(url: string, pageUrl: string): boolean {
    try {
      return new URL(url).origin !== new URL(pageUrl).origin;
    } catch {
      return false;
    }
  }

  all(): readonly SecurityFinding[] {
    return this.findings;
  }
}

/**
 * Active-testing policy gate. Passive analysis NEVER silently converts
 * into active exploitation; requests exceeding budget/rate are refused.
 */
export class ActiveTestGate {
  private windowStart = Date.now();
  private requestsInWindow = 0;
  private totalRequests = 0;

  constructor(private policy: SecurityPolicy = { ...DEFAULT_SECURITY_POLICY }) {}

  get currentPolicy(): SecurityPolicy {
    return { ...this.policy };
  }

  /** Request authorization for an active test against a target. */
  authorizeActiveTest(targetUrl: string, category: string, opts: { destructive?: boolean } = {}): { allowed: boolean; reason: string } {
    if (this.policy.killSwitch) {
      return { allowed: false, reason: 'kill switch is engaged — all active testing disabled' };
    }
    if (this.policy.mode !== 'authorized-active') {
      return { allowed: false, reason: 'policy mode is passive — active testing requires explicit authorization (set mode=authorized-active)' };
    }
    let origin: string;
    try {
      origin = new URL(targetUrl).origin;
    } catch {
      return { allowed: false, reason: 'target URL is not parsable — refusing' };
    }
    if (this.policy.blockedOrigins.some((o) => origin.includes(o))) {
      return { allowed: false, reason: `target origin ${origin} is blocked by policy` };
    }
    if (this.policy.allowedOrigins.length && !this.policy.allowedOrigins.some((o) => origin === o || origin.endsWith(o))) {
      return { allowed: false, reason: `target origin ${origin} is not in the authorized origin list` };
    }
    if (!this.policy.testCategories.includes(category)) {
      return { allowed: false, reason: `category "${category}" not in allowed test categories [${this.policy.testCategories.join(', ')}]` };
    }
    if (opts.destructive && this.policy.destructiveActionsDisabled) {
      return { allowed: false, reason: 'destructive testing is disabled by default (destructiveActionsDisabled=true)' };
    }
    if (this.totalRequests >= this.policy.requestBudget) {
      return { allowed: false, reason: `request budget exhausted (${this.policy.requestBudget})` };
    }
    if (Date.now() - this.windowStart > 60_000) {
      this.windowStart = Date.now();
      this.requestsInWindow = 0;
    }
    if (this.requestsInWindow >= this.policy.rateLimitPerMinute) {
      return { allowed: false, reason: `rate limit exceeded (${this.policy.rateLimitPerMinute}/min)` };
    }
    this.requestsInWindow += 1;
    this.totalRequests += 1;
    return { allowed: true, reason: `authorized: origin=${origin} category=${category} budget=${this.totalRequests}/${this.policy.requestBudget}` };
  }

  engageKillSwitch(): void {
    this.policy.killSwitch = true;
  }
}
