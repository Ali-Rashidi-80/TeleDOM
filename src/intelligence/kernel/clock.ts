/**
 * TeleDOM v4 Kernel — Hybrid Clock.
 *
 * Provides monotonic logical time + wall time as SEPARATE tracks (never
 * conflated), with drift detection between them. Timestamp resolution and
 * reconstruction/query latency are strictly different concepts; this module
 * owns only the former.
 */

export interface ClockSample {
  /** Monotonic, strictly increasing logical ticks (never resets). */
  logical: number;
  /** Wall-clock epoch millis (may jump — never used for ordering). */
  wall: number;
  /** High-resolution offset in ms from session start, 2-decimal precision. */
  relative: number;
}

export class HybridClock {
  private logical = 0;
  private sessionStartWall: number;
  private sessionStartHr: bigint;
  private maxDriftMs = 0;
  private lastWall = 0;

  constructor() {
    this.sessionStartWall = Date.now();
    this.lastWall = this.sessionStartWall;
    this.sessionStartHr = process.hrtime.bigint();
  }

  /** Take a new clock sample. Logical ticks never go backwards. */
  tick(): ClockSample {
    this.logical += 1;
    const hrMs = Number(process.hrtime.bigint() - this.sessionStartHr) / 1_000_000;
    const relative = Math.round(hrMs * 100) / 100;
    const wall = Date.now();
    if (wall < this.lastWall) {
      // Wall clock went backwards (NTP adjust) — recorded, never used for order.
      this.maxDriftMs = Math.max(this.maxDriftMs, this.lastWall - wall);
    }
    this.lastWall = wall;
    return { logical: this.logical, wall, relative };
  }

  get current(): ClockSample {
    return { logical: this.logical, wall: Date.now(), relative: this.sampleRelative() };
  }

  private sampleRelative(): number {
    return Math.round((Number(process.hrtime.bigint() - this.sessionStartHr) / 1_000_000) * 100) / 100;
  }

  /** Largest observed wall-clock regression (ms). Diagnostic signal only. */
  get wallClockRegression(): number {
    return this.maxDriftMs;
  }

  /** Serialize for persistence / recovery. */
  serialize(): { logical: number; sessionStartWall: number; sessionStartHr: string; maxDriftMs: number } {
    return {
      logical: this.logical,
      sessionStartWall: this.sessionStartWall,
      sessionStartHr: this.sessionStartHr.toString(),
      maxDriftMs: this.maxDriftMs,
    };
  }

  /** Restore after recovery. Logical monotonicity is preserved by clamping. */
  restore(state: { logical: number }): void {
    this.logical = Math.max(this.logical, state.logical);
  }
}
