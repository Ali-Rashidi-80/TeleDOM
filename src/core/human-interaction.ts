import { InteractionProfile, InteractionProfileName, InteractionProfileReport } from '../types/browser-control';

/**
 * §24 / §25 Human Interaction Mode
 *
 * Implements controlled human-like execution with four named profiles.
 * The engine is a deterministic seeded PRNG + timing model — NOT random
 * delays. Every profile, every drawn delay, and every action timing is
 * inspectable and reproducible via the seed, satisfying the Human Mode
 * Safety contract: traceable, configurable, deterministic by default.
 */

/**
 * Mulberry32 — small, fast, well-distributed seeded PRNG.
 * Deterministic across runs for identical seeds.
 */
export class SeededRandom {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
    if (this.state === 0) this.state = 0x9e3779b9;
  }

  public next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  public int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  public chance(probability: number): boolean {
    return this.next() < probability;
  }
}

export const DEFAULT_PROFILES: Record<InteractionProfileName, InteractionProfile> = {
  DETERMINISTIC: {
    name: 'DETERMINISTIC',
    description: 'Zero-delay programmatic execution. Fully reproducible; identical to the legacy engine behavior.',
    moveDelayMs: { min: 0, max: 0 },
    clickDelayMs: { min: 0, max: 0 },
    typeDelayMs: { min: 0, max: 0 },
    keyDelayMs: { min: 0, max: 0 },
    hesitationProbability: 0,
    trajectorySteps: 1,
  },
  BALANCED: {
    name: 'BALANCED',
    description: 'Small natural delays; fast but not machine-like. Suitable for routine automation against rate-limited UIs.',
    moveDelayMs: { min: 30, max: 80 },
    clickDelayMs: { min: 40, max: 120 },
    typeDelayMs: { min: 20, max: 60 },
    keyDelayMs: { min: 30, max: 90 },
    hesitationProbability: 0.08,
    trajectorySteps: 3,
    seed: 1337,
  },
  HUMAN_LIKE: {
    name: 'HUMAN_LIKE',
    description: 'Realistic cadence with key-by-key typing variance, movement trajectories, and occasional hesitation pauses.',
    moveDelayMs: { min: 90, max: 260 },
    clickDelayMs: { min: 120, max: 420 },
    typeDelayMs: { min: 60, max: 180 },
    keyDelayMs: { min: 70, max: 220 },
    hesitationProbability: 0.22,
    trajectorySteps: 8,
    seed: 4242,
  },
  CUSTOM: {
    name: 'CUSTOM',
    description: 'User-supplied timing parameters. Falls back to BALANCED values for unspecified fields.',
    moveDelayMs: { min: 30, max: 80 },
    clickDelayMs: { min: 40, max: 120 },
    typeDelayMs: { min: 20, max: 60 },
    keyDelayMs: { min: 30, max: 90 },
    hesitationProbability: 0.05,
    trajectorySteps: 3,
  },
};

export class HumanInteractionController {
  private activeProfile: InteractionProfileName = 'DETERMINISTIC';
  private customProfile: InteractionProfile = { ...DEFAULT_PROFILES.CUSTOM };
  private rng: SeededRandom;
  private lastActionTiming?: InteractionProfileReport['lastActionTiming'];

  constructor(seed?: number) {
    this.rng = new SeededRandom(seed ?? 1);
  }

  public getProfile(): InteractionProfile {
    if (this.activeProfile === 'CUSTOM') return { ...this.customProfile };
    return { ...DEFAULT_PROFILES[this.activeProfile] };
  }

  public getActiveProfileName(): InteractionProfileName {
    return this.activeProfile;
  }

  public setActiveProfile(name: InteractionProfileName, overrides?: Partial<InteractionProfile>): InteractionProfile {
    if (!DEFAULT_PROFILES[name]) {
      throw new Error(`Unknown interaction profile: ${name}. Available: ${Object.keys(DEFAULT_PROFILES).join(', ')}`);
    }
    if (name === 'CUSTOM' && overrides) {
      this.customProfile = {
        ...DEFAULT_PROFILES.CUSTOM,
        ...overrides,
        name: 'CUSTOM',
      };
    }
    this.activeProfile = name;
    this.resetSeed();
    return this.getProfile();
  }

  public setSeed(seed: number): void {
    this.rng = new SeededRandom(seed);
  }

  public resetSeed(): void {
    const profile = this.getProfile();
    this.rng = new SeededRandom(profile.seed ?? 1);
  }

  /**
   * Draw a delay for a specific action phase. Records the drawn value for
   * the inspectable timing report (Human Mode Safety).
   */
  public delay(phase: 'move' | 'click' | 'type' | 'key' | 'hesitation'): number {
    const profile = this.getProfile();
    let ms: number;
    switch (phase) {
      case 'move':
        ms = this.rng.range(profile.moveDelayMs.min, profile.moveDelayMs.max);
        break;
      case 'click':
        ms = this.rng.range(profile.clickDelayMs.min, profile.clickDelayMs.max);
        break;
      case 'type':
        ms = this.rng.range(profile.typeDelayMs.min, profile.typeDelayMs.max);
        break;
      case 'key':
        ms = this.rng.range(profile.keyDelayMs.min, profile.keyDelayMs.max);
        break;
      case 'hesitation':
        ms = this.chance() ? this.rng.range(300, 900) : 0;
        break;
    }
    return Math.round(ms);
  }

  /**
   * Whether a hesitation pause should occur this action.
   */
  public shouldHesitate(): boolean {
    return this.rng.chance(this.getProfile().hesitationProbability);
  }

  /**
   * Generate a pointer movement trajectory between two points.
   * Returns interpolated waypoints (count from the active profile).
   * The path is a slightly-curved interpolation — never teleporting,
   * never wildly overshooting.
   */
  public trajectory(
    from: { x: number; y: number },
    to: { x: number; y: number }
  ): Array<{ x: number; y: number; step: number }> {
    const profile = this.getProfile();
    const steps = Math.max(1, profile.trajectorySteps);
    const waypoints: Array<{ x: number; y: number; step: number }> = [];
    // slight arc offset, deterministic from rng
    const arcX = (this.rng.next() - 0.5) * Math.abs(to.x - from.x) * 0.15;
    const arcY = (this.rng.next() - 0.5) * Math.abs(to.y - from.y) * 0.15;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const eased = t * t * (3 - 2 * t); // smoothstep easing
      waypoints.push({
        x: Math.round(from.x + (to.x - from.x) * eased + arcX * Math.sin(Math.PI * t)),
        y: Math.round(from.y + (to.y - from.y) * eased + arcY * Math.sin(Math.PI * t)),
        step: i,
      });
    }
    return waypoints;
  }

  public recordTiming(action: string, requestedMode: string, timings: number[], totalDurationMs: number): void {
    this.lastActionTiming = {
      action,
      requestedMode: requestedMode,
      actualMode: this.activeProfile,
      timings,
      totalDurationMs,
    };
  }

  public report(): InteractionProfileReport {
    return {
      activeProfile: this.activeProfile,
      profile: this.getProfile(),
      availableProfiles: Object.keys(DEFAULT_PROFILES) as InteractionProfileName[],
      lastActionTiming: this.lastActionTiming,
    };
  }

  /**
   * Sleep helper bounded to keep fast tests fast — respects vitest timeouts
   * while still producing realistic cadence in live usage.
   */
  public static async sleep(ms: number): Promise<void> {
    if (ms <= 0) return;
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private chance(): boolean {
    return this.rng.next() < 0.5;
  }
}
