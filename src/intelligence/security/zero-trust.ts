/**
 * TeleDOM v4 Security — Zero-Trust Page Model.
 *
 * Browser content is UNTRUSTED DATA. Explicit separation of:
 * Page Content / Browser State / Evidence / Tool Instructions / Agent
 * Intent / Agent Policy / System Policy / Security Policy.
 * Page text can never rewrite agent policy. Includes origin trust,
 * instruction-source tagging, prompt-injection detection, secret-exposure
 * defense, exfiltration detection, dangerous-action gates, scope
 * enforcement, sensitive-data redaction, audit trail.
 */

import { computeHash } from '../kernel/integrity';

export type TrustLevel = 'trusted-system' | 'same-origin' | 'cross-origin-https' | 'cross-origin-http' | 'untrusted-data';

export interface OriginTrustRecord {
  origin: string;
  trust: TrustLevel;
  basis: string;
}

export type InstructionSource = 'agent' | 'human' | 'system-policy' | 'page-content' | 'extension' | 'unknown';

export interface Instruction {
  source: InstructionSource;
  origin?: string;
  content: string;
  /** Assigned when parsed from page content — treated as DATA, never policy. */
  untrusted: boolean;
}

export interface InjectionDetection {
  detected: boolean;
  patterns: string[];
  confidence: number;
  evidenceRef: string;
}

export interface ExfiltrationSignal {
  detected: boolean;
  destinationOrigin: string | null;
  payloadKind: 'secret-pattern' | 'form-credential' | 'cookie' | 'token' | 'unknown';
  evidenceRef: string;
}

export interface AuditEntry {
  at: number;
  kind: 'instruction' | 'policy-change' | 'dangerous-action' | 'secret-exposure' | 'exfiltration' | 'injection';
  decision: 'ALLOWED' | 'BLOCKED' | 'QUARANTINED' | 'REDACTED';
  detail: string;
  evidenceRef?: string;
}

const INJECTION_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /ignore\s+(all\s+)?(previous|prior)\s+instructions/i, label: 'instruction-override' },
  { re: /disregard\s+(your|all)\s+(rules|instructions|policy)/i, label: 'instruction-override' },
  { re: /you\s+are\s+now\s+(a|an)\s+/i, label: 'role-hijack' },
  { re: /(reveal|print|show|output)\s+(your\s+)?(system\s+)?(prompt|instructions|policy)/i, label: 'policy-exfiltration' },
  { re: /tool\s+policy\s+(is\s+)?(now|must)\s+/i, label: 'policy-rewrite' },
  { re: /authorize\s+(me|this)\s+to\s+/i, label: 'privilege-escalation' },
  { re: /disable\s+(the\s+)?(security|safety|guard)/i, label: 'guard-disable' },
];

const SECRET_PATTERNS: { re: RegExp; label: string }[] = [
  { re: /(?:api[_-]?key|apikey)["\s:=]+[A-Za-z0-9\-_]{16,}/i, label: 'api-key' },
  { re: /(?:bearer)\s+[A-Za-z0-9\-._~+/]+=*/i, label: 'bearer-token' },
  { re: /(?:authorization)\s*:\s*[A-Za-z0-9\-._~+/]+=*/i, label: 'auth-header' },
  { re: /\b(?:sk|pk|rk)_(?:live|test)_[A-Za-z0-9]{16,}/i, label: 'stripe-key' },
  { re: /\bghp_[A-Za-z0-9]{30,}/i, label: 'github-token' },
  { re: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14})\b/, label: 'credit-card' },
  { re: /\b[0-9]{3}-[0-9]{2}-[0-9]{4}\b/, label: 'ssn' },
  { re: /(?:password|passwd|secret)["\s:=]+\S{6,}/i, label: 'password' },
];

export class ZeroTrustModel {
  private originTrust = new Map<string, OriginTrustRecord>();
  private auditLog: AuditEntry[] = [];
  private redactionCache = new Map<string, string>();

  /** Classify origin trust. */
  assessOrigin(origin: string): OriginTrustRecord {
    const cached = this.originTrust.get(origin);
    if (cached) return cached;
    let trust: TrustLevel = 'untrusted-data';
    let basis = 'unknown origin defaults to untrusted';
    try {
      const url = new URL(origin);
      if (url.protocol === 'https:') {
        trust = 'cross-origin-https';
        basis = 'https cross-origin: transport-safe but content still untrusted';
      } else if (url.protocol === 'http:') {
        trust = 'cross-origin-http';
        basis = 'plaintext transport: content + channel untrusted';
      }
    } catch {
      basis = 'not a parsable URL — untrusted data';
    }
    const record: OriginTrustRecord = { origin, trust, basis };
    this.originTrust.set(origin, record);
    return record;
  }

  /**
   * Parse an instruction from a source. Page-content instructions are
   * ALWAYS marked untrusted and can NEVER change policy.
   */
  parseInstruction(source: InstructionSource, content: string, origin?: string): Instruction {
    const untrusted = source === 'page-content' || source === 'unknown';
    const instruction: Instruction = { source, content, origin, untrusted };
    this.auditLog.push({
      at: Date.now(),
      kind: 'instruction',
      decision: untrusted ? 'QUARANTINED' : 'ALLOWED',
      detail: `instruction from ${source}${origin ? ` (${origin})` : ''} classified as ${untrusted ? 'UNTRUSTED DATA' : 'trusted intent'}`,
    });
    return instruction;
  }

  /** Detect prompt-injection attempts in untrusted content. */
  detectInjection(content: string): InjectionDetection {
    const patterns: string[] = [];
    for (const { re, label } of INJECTION_PATTERNS) {
      if (re.test(content)) patterns.push(label);
    }
    const evidenceRef = `evidence:injection:${computeHash(content).slice(0, 12)}`;
    const detection: InjectionDetection = {
      detected: patterns.length > 0,
      patterns,
      confidence: patterns.length >= 2 ? 0.9 : patterns.length === 1 ? 0.7 : 0,
      evidenceRef,
    };
    if (detection.detected) {
      this.auditLog.push({
        at: Date.now(),
        kind: 'injection',
        decision: 'QUARANTINED',
        detail: `prompt-injection patterns: ${patterns.join(', ')}`,
        evidenceRef,
      });
    }
    return detection;
  }

  /** Detect secrets in content (for exposure defense + redaction). */
  detectSecrets(content: string): { found: string[]; redacted: string } {
    const found: string[] = [];
    let redacted = content;
    for (const { re, label } of SECRET_PATTERNS) {
      const matches = content.match(new RegExp(re.source, 'gi'));
      if (matches) {
        found.push(label);
        for (const m of matches) {
          const mask = `<redacted:${label}:${computeHash(m).slice(0, 6)}>`;
          this.redactionCache.set(mask, m);
          redacted = redacted.split(m).join(mask);
        }
      }
    }
    if (found.length) {
      this.auditLog.push({
        at: Date.now(),
        kind: 'secret-exposure',
        decision: 'REDACTED',
        detail: `secret patterns redacted: ${found.join(', ')}`,
      });
    }
    return { found, redacted };
  }

  /**
   * Gate for dangerous actions. Untrusted instructions can NEVER obtain
   * authorization here — by construction, not by prompt.
   */
  gateDangerousAction(instruction: Instruction, action: string): { allowed: boolean; reason: string } {
    if (instruction.untrusted) {
      this.auditLog.push({
        at: Date.now(),
        kind: 'dangerous-action',
        decision: 'BLOCKED',
        detail: `dangerous action "${action}" requested from UNTRUSTED instruction source ${instruction.source}`,
      });
      return { allowed: false, reason: `blocked: instruction source ${instruction.source} is untrusted data and cannot authorize dangerous actions` };
    }
    if (this.detectInjection(instruction.content).detected) {
      return { allowed: false, reason: 'blocked: instruction content contains injection patterns' };
    }
    return { allowed: true, reason: `instruction source ${instruction.source} is trusted for this action class` };
  }

  /** Exfiltration detection: secrets leaving toward a destination. */
  detectExfiltration(outboundUrl: string, requestBody: string): ExfiltrationSignal {
    const secrets = this.detectSecrets(requestBody).found;
    const evidenceRef = `evidence:exfil:${computeHash({ outboundUrl, len: requestBody.length }).slice(0, 12)}`;
    let destinationOrigin: string | null = null;
    try {
      destinationOrigin = new URL(outboundUrl).origin;
    } catch {
      destinationOrigin = null;
    }
    const signal: ExfiltrationSignal = {
      detected: secrets.length > 0,
      destinationOrigin,
      payloadKind: secrets[0] ? (secrets[0].includes('cookie') ? 'cookie' : secrets[0].includes('token') || secrets[0].includes('bearer') || secrets[0].includes('auth') ? 'token' : secrets[0].includes('password') ? 'form-credential' : 'secret-pattern') : 'unknown',
      evidenceRef,
    };
    if (signal.detected) {
      this.auditLog.push({
        at: Date.now(),
        kind: 'exfiltration',
        decision: 'QUARANTINED',
        detail: `secret-bearing payload toward ${destinationOrigin ?? outboundUrl}`,
        evidenceRef,
      });
    }
    return signal;
  }

  /** Resolve redaction masks for HUMAN access only (audited). */
  revealRedaction(mask: string, requester: 'human' | 'agent'): string | null {
    if (requester !== 'human') {
      this.auditLog.push({
        at: Date.now(),
        kind: 'secret-exposure',
        decision: 'BLOCKED',
        detail: `agent attempted to reveal redaction ${mask} — denied (human-only)`,
      });
      return null;
    }
    this.auditLog.push({
      at: Date.now(),
      kind: 'secret-exposure',
      decision: 'ALLOWED',
      detail: `human revealed redaction ${mask}`,
    });
    return this.redactionCache.get(mask) ?? null;
  }

  get audit(): readonly AuditEntry[] {
    return this.auditLog;
  }
}
