import { PrivacyEngine } from './privacy-engine';

/**
 * §90 / §91 Redaction System + Capture Exclusion Rules
 *
 * Configurable capture redaction that layers ON TOP of the existing
 * PrivacyEngine (preserving all its default behavior). Adds:
 *   - sensitive-key detection for storage/attribute capture
 *   - token-like string pattern redaction
 *   - per-project exclusion rules (never capture)
 *
 * Default posture: redact first, ask questions later. Explicit override
 * only via user-supplied allowlist entries.
 */

export interface RedactionRule {
  ruleId: string;
  kind: 'key-pattern' | 'value-pattern' | 'attribute-name' | 'selector-exclusion';
  pattern: string;
  description: string;
  enabled: boolean;
  userAdded: boolean;
}

export const DEFAULT_REDACTION_RULES: RedactionRule[] = [
  { ruleId: 'red_key_password', kind: 'key-pattern', pattern: 'password|passwd|pwd', description: 'Keys containing password/passwd/pwd', enabled: true, userAdded: false },
  { ruleId: 'red_key_token', kind: 'key-pattern', pattern: 'token|jwt|bearer|auth|session.?id|secret|api.?key|client.?secret', description: 'Keys containing token/jwt/auth/session-id/secret/api-key', enabled: true, userAdded: false },
  { ruleId: 'red_key_credential', kind: 'key-pattern', pattern: 'credential|login|user.?pass|otp|2fa|mfa|verification', description: 'Keys containing credential/login/otp/2fa/verification', enabled: true, userAdded: false },
  { ruleId: 'red_key_payment', kind: 'key-pattern', pattern: 'card|payment|billing|iban|cvv|cvc|pan', description: 'Keys containing card/payment/billing/iban/cvv', enabled: true, userAdded: false },
  { ruleId: 'red_key_personal', kind: 'key-pattern', pattern: 'ssn|social.?security|national.?id|passport|tax.?id', description: 'Keys containing personal identifier patterns', enabled: true, userAdded: false },
  { ruleId: 'red_val_jwt', kind: 'value-pattern', pattern: 'eyJ[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+\\.[A-Za-z0-9_-]+', description: 'JWT-shaped tokens', enabled: true, userAdded: false },
  { ruleId: 'red_val_bearer', kind: 'value-pattern', pattern: 'bearer\\s+[A-Za-z0-9._-]+', description: 'Bearer tokens', enabled: true, userAdded: false },
  { ruleId: 'red_val_long_hex', kind: 'value-pattern', pattern: '\\b[a-f0-9]{32,}\\b', description: '32+ char hex strings (session/API ids)', enabled: true, userAdded: false },
  { ruleId: 'red_val_sk', kind: 'value-pattern', pattern: '\\b(sk|pk|rk)_[A-Za-z0-9_]{20,}\\b', description: 'Stripe-style secret keys (sk_live_…)', enabled: true, userAdded: false },
  { ruleId: 'red_attr_input_password', kind: 'attribute-name', pattern: 'value', description: 'value attributes on password inputs handled by PrivacyEngine maskValue', enabled: true, userAdded: false },
  { ruleId: 'red_attr_secret', kind: 'attribute-name', pattern: 'data-secret|data-token|data-api-key|secret|access.?token', description: 'Secret-carrying attributes', enabled: true, userAdded: false },
];

export interface CaptureExclusion {
  exclusionId: string;
  selector: string;
  reason: string;
  userAdded: boolean;
}

export const DEFAULT_CAPTURE_EXCLUSIONS: CaptureExclusion[] = [
  { exclusionId: 'excl_mcpdom_overlay', selector: '[data-mcpdom-internal], [data-forensic-internal], #forensic-recorder-floating-host, #forensic-inspect-highlighter', reason: 'MCPDOM-injected UI must never contaminate captured DOM (§68 clean capture)', userAdded: false },
  { exclusionId: 'excl_mcpdom_ids', selector: '[id^="forensic-"], [id^="mcpdom-"]', reason: 'MCPDOM-namespaced nodes', userAdded: false },
];

export interface RedactionConfig {
  rules: RedactionRule[];
  exclusions: CaptureExclusion[];
  /** When true, sensitive values are replaced by a stable hash stub instead of full text. */
  stubMode: boolean;
}

const REDACTED = '[REDACTED]';

export class RedactionEngine {
  private config: RedactionConfig;
  private base = new PrivacyEngine();
  private compiledKeyPatterns: RegExp[] = [];
  private compiledValuePatterns: RegExp[] = [];
  private compiledAttrPatterns: RegExp[] = [];

  constructor(config?: Partial<RedactionConfig>) {
    this.config = {
      rules: [...DEFAULT_REDACTION_RULES],
      exclusions: [...DEFAULT_CAPTURE_EXCLUSIONS],
      stubMode: true,
      ...config,
    };
    this.recompile();
  }

  private recompile(): void {
    this.compiledKeyPatterns = [];
    this.compiledValuePatterns = [];
    this.compiledAttrPatterns = [];
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;
      const flags = 'i';
      try {
        switch (rule.kind) {
          case 'key-pattern':
            this.compiledKeyPatterns.push(new RegExp(rule.pattern, flags));
            break;
          case 'value-pattern':
            this.compiledValuePatterns.push(new RegExp(rule.pattern, 'i'));
            break;
          case 'attribute-name':
            this.compiledAttrPatterns.push(new RegExp(`^(${rule.pattern})$`, 'i'));
            break;
        }
      } catch {
        // Invalid user pattern — skip it (never crash capture for a bad regex)
      }
    }
  }

  // --- Rule management ---------------------------------------------------
  public getRules(): RedactionRule[] {
    return [...this.config.rules];
  }

  public setRuleEnabled(ruleId: string, enabled: boolean): boolean {
    const rule = this.config.rules.find((r) => r.ruleId === ruleId);
    if (!rule) return false;
    rule.enabled = enabled;
    this.recompile();
    return true;
  }

  public addRule(rule: Omit<RedactionRule, 'ruleId' | 'userAdded'>): RedactionRule {
    const ruleId = `red_custom_${this.config.rules.length + 1}_${Date.now().toString(36)}`;
    const full: RedactionRule = { ...rule, ruleId, userAdded: true };
    this.config.rules.push(full);
    this.recompile();
    return full;
  }

  public removeRule(ruleId: string): boolean {
    const idx = this.config.rules.findIndex((r) => r.ruleId === ruleId);
    if (idx < 0 || !this.config.rules[idx].userAdded) return false; // built-in rules cannot be removed, only disabled
    this.config.rules.splice(idx, 1);
    this.recompile();
    return true;
  }

  public getExclusions(): CaptureExclusion[] {
    return [...this.config.exclusions];
  }

  public addExclusion(selector: string, reason: string): CaptureExclusion {
    const exclusionId = `excl_custom_${this.config.exclusions.length + 1}_${Date.now().toString(36)}`;
    const exclusion: CaptureExclusion = { exclusionId, selector, reason, userAdded: true };
    this.config.exclusions.push(exclusion);
    return exclusion;
  }

  public removeExclusion(exclusionId: string): boolean {
    const idx = this.config.exclusions.findIndex((e) => e.exclusionId === exclusionId);
    if (idx < 0 || !this.config.exclusions[idx].userAdded) return false;
    this.config.exclusions.splice(idx, 1);
    return true;
  }

  // --- Redaction ---------------------------------------------------------
  /** Should a storage key / field name be treated as sensitive? */
  public isSensitiveKey(key: string): boolean {
    return this.compiledKeyPatterns.some((re) => re.test(key));
  }

  /** Redact a value if it matches token-like patterns. */
  public redactValue(value: string): string {
    let out = value;
    for (const re of this.compiledValuePatterns) {
      if (re.test(out)) {
        out = out.replace(new RegExp(re.source, 'gi'), REDACTED);
      }
    }
    return out;
  }

  /** Redact a value bound to a key (key-based + value-based rules). */
  public redactByKeyValue(key: string, value: string): string {
    if (this.isSensitiveKey(key)) {
      return this.config.stubMode ? REDACTED : value;
    }
    return this.redactValue(value);
  }

  /** Should an attribute be excluded/redacted from capture? */
  public isSensitiveAttribute(attrName: string): boolean {
    return this.compiledAttrPatterns.some((re) => re.test(attrName));
  }

  /**
   * Filter a serialized attribute record with redaction applied.
   */
  public redactAttributes(attrs: Record<string, string>): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(attrs)) {
      if (this.isSensitiveAttribute(k)) {
        out[k] = REDACTED;
      } else {
        out[k] = this.redactValue(v);
      }
    }
    return out;
  }

  /**
   * §68 clean capture — strip MCPDOM-injected + excluded elements from a
   * cloned DOM subtree before it is persisted anywhere.
   */
  public cleanSubtree(root: Element): Element {
    const clone = root.cloneNode(true) as Element;
    for (const exclusion of this.config.exclusions) {
      let doomed: NodeListOf<Element> | null = null;
      try {
        doomed = clone.querySelectorAll(exclusion.selector);
      } catch {
        continue; // invalid selector — skip
      }
      for (const el of Array.from(doomed)) {
        el.remove();
      }
      // also check the root itself
      try {
        if (clone.matches(exclusion.selector)) {
          return this.doclessEmptyStub(clone);
        }
      } catch { /* ignore */ }
    }
    return clone;
  }

  public isExcluded(element: Element): boolean {
    for (const exclusion of this.config.exclusions) {
      try {
        if (element.matches(exclusion.selector) || element.closest(exclusion.selector)) {
          return true;
        }
      } catch { /* skip */ }
    }
    return false;
  }

  private doclessEmptyStub(clone: Element): Element {
    // Whole subtree excluded — return an empty stub carrying a marker
    clone.innerHTML = '';
    clone.setAttribute('data-mcpdom-excluded', 'true');
    return clone;
  }

  public toJSON(): RedactionConfig {
    return {
      rules: this.getRules(),
      exclusions: this.getExclusions(),
      stubMode: this.config.stubMode,
    };
  }

  public static fromJSON(json: any): RedactionEngine {
    return new RedactionEngine({
      rules: Array.isArray(json?.rules) ? json.rules : undefined,
      exclusions: Array.isArray(json?.exclusions) ? json.exclusions : undefined,
      stubMode: typeof json?.stubMode === 'boolean' ? json.stubMode : undefined,
    });
  }
}
