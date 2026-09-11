/**
 * TeleDOM v12+ Kernel — Self-Diagnostics.
 *
 * TeleDOM must be able to investigate itself: event integrity, storage
 * integrity, bridge/browser/capture/queue health, memory/CPU, capability
 * health, schema compatibility, recovery state, security policy, context
 * planner. When the system may be producing invalid evidence it DOWNGRADES
 * confidence instead of fabricating certainty.
 */

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export interface HealthCheck {
  id: string;
  status: HealthStatus;
  /** Machine-readable detail (never a vague "ok"). */
  detail: string;
  measuredAt: number;
  /** Optional evidence reference. */
  evidenceRef?: string;
}

export interface HealthSnapshot {
  overall: HealthStatus;
  checks: HealthCheck[];
  /** Multiplier applied to downstream confidence when kernel is unsure. */
  confidenceMultiplier: number;
  warnings: string[];
}

export class KernelDiagnostics {
  private checks = new Map<string, () => HealthCheck>();

  register(id: string, probe: () => HealthCheck): void {
    this.checks.set(id, probe);
  }

  snapshot(): HealthSnapshot {
    const checks: HealthCheck[] = [];
    for (const [id, probe] of this.checks) {
      try {
        checks.push(probe());
      } catch (err: any) {
        checks.push({ id, status: 'UNHEALTHY', detail: `probe failed: ${err?.message ?? 'unknown'}`, measuredAt: Date.now() });
      }
    }
    const order: Record<HealthStatus, number> = { UNKNOWN: 0, HEALTHY: 1, DEGRADED: 2, UNHEALTHY: 3 };
    let overall: HealthStatus = 'HEALTHY';
    for (const c of checks) {
      if (order[c.status] > order[overall]) overall = c.status;
    }
    const confidenceMultiplier =
      overall === 'HEALTHY' ? 1 : overall === 'DEGRADED' ? 0.7 : overall === 'UNHEALTHY' ? 0.4 : 0.5;
    const warnings = checks.filter((c) => c.status === 'DEGRADED' || c.status === 'UNHEALTHY').map((c) => `${c.id}: ${c.detail}`);
    return { overall, checks, confidenceMultiplier, warnings };
  }
}
