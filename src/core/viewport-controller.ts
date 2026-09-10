import { LivePageInfo, ResponsiveTestResult, ViewportResizeResult, ViewportState } from '../types/browser-control';

/**
 * §17 / §38 Viewport Controller
 *
 * Reversible responsive-testing engine:
 *   original dimensions → temporary test dimensions → restoration state
 *
 * The RESET_VIEWPORT contract is guaranteed: every resize records the
 * original viewport on first use, and reset restores it. In simulation mode
 * (JSDOM / Node) the viewport is updated in-memory; in a real browser the
 * resize is applied through the background service worker via the
 * chrome.windows API (handled by the command dispatcher, not here).
 */

export const VIEWPORT_PRESETS: Record<string, { width: number; height: number; category: string }> = {
  // Desktop
  'desktop-full-hd': { width: 1920, height: 1080, category: 'desktop' },
  'desktop-hd': { width: 1366, height: 768, category: 'desktop' },
  'desktop-laptop': { width: 1440, height: 900, category: 'desktop' },
  'desktop-xga': { width: 1280, height: 1024, category: 'desktop' },
  'desktop-1024': { width: 1024, height: 768, category: 'desktop' },
  // Tablet
  'tablet-ipad': { width: 768, height: 1024, category: 'tablet' },
  'tablet-ipad-pro': { width: 1024, height: 1366, category: 'tablet' },
  'tablet-portrait': { width: 768, height: 1024, category: 'tablet' },
  'tablet-landscape': { width: 1024, height: 768, category: 'tablet' },
  // Mobile
  'mobile-iphone-se': { width: 375, height: 667, category: 'mobile' },
  'mobile-iphone-12': { width: 390, height: 844, category: 'mobile' },
  'mobile-iphone-14-pro-max': { width: 430, height: 932, category: 'mobile' },
  'mobile-pixel-7': { width: 412, height: 915, category: 'mobile' },
  'mobile-galaxy-s8': { width: 360, height: 740, category: 'mobile' },
  'mobile-small': { width: 320, height: 568, category: 'mobile' },
  // Common test sizes
  'test-a4': { width: 800, height: 600, category: 'test' },
  'test-square': { width: 512, height: 512, category: 'test' },
};

export const DEVICE_EMULATION_PROFILES: Record<string, { width: number; height: number; devicePixelRatio: number; userAgent: string; touch: boolean; category: string }> = {
  'iphone-13': { width: 390, height: 844, devicePixelRatio: 3, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', touch: true, category: 'mobile' },
  'ipad-air': { width: 820, height: 1180, devicePixelRatio: 2, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', touch: true, category: 'tablet' },
  'pixel-7': { width: 412, height: 915, devicePixelRatio: 2.625, userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', touch: true, category: 'mobile' },
  'galaxy-s23': { width: 384, height: 800, devicePixelRatio: 3, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36', touch: true, category: 'mobile' },
  'macbook-pro-16': { width: 1728, height: 1080, devicePixelRatio: 2, userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', touch: false, category: 'desktop' },
  'windows-desktop': { width: 1920, height: 1080, devicePixelRatio: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', touch: false, category: 'desktop' },
};

export class ViewportController {
  private original: { width: number; height: number } | null = null;
  private modified = false;
  private activePreset: string | null = null;
  private activeDevice: string | null = null;

  constructor(private doc: Document) {}

  /**
   * Current viewport state (with original-tracking info).
   */
  public state(): ViewportState {
    const win = this.doc.defaultView;
    return {
      width: win?.innerWidth || 0,
      height: win?.innerHeight || 0,
      devicePixelRatio: (win as any)?.devicePixelRatio || 1,
      scrollX: win?.scrollX || 0,
      scrollY: win?.scrollY || 0,
      original: this.original,
      isModified: this.modified,
    };
  }

  /**
   * Resize the viewport. Records the original dimensions exactly once so the
   * operation is always reversible. Returns before/after page-state deltas.
   */
  public resize(
    width: number,
    height: number,
    preset?: string
  ): ViewportResizeResult {
    const win = this.doc.defaultView as any;
    const previous = {
      width: win?.innerWidth || 0,
      height: win?.innerHeight || 0,
    };
    const beforeState = this.pageDigest();

    if (!this.original) {
      this.original = { ...previous };
    }

    const applied = this.applySize(width, height);

    this.modified = true;
    this.activePreset = preset || this.activePreset;

    const afterState = this.pageDigest();

    return {
      success: true,
      applied: { width: applied.width, height: applied.height },
      previous,
      original: { ...this.original },
      preset: preset || undefined,
      beforeState,
      afterState,
      reversible: true,
      mode: this.isSimulation() ? 'simulation' : 'browser-window',
    };
  }

  /**
   * Apply a named preset.
   */
  public applyPreset(preset: string): ViewportResizeResult {
    const p = VIEWPORT_PRESETS[preset];
    if (!p) {
      throw new Error(`UNKNOWN_PRESET: "${preset}". Available: ${Object.keys(VIEWPORT_PRESETS).join(', ')}`);
    }
    return this.resize(p.width, p.height, preset);
  }

  /**
   * Emulate a device profile (viewport + dpr + UA metadata report).
   * In simulation mode the UA string cannot really change — the report
   * documents this honestly instead of faking it.
   */
  public emulateDevice(device: string): { device: string; resize: ViewportResizeResult; profile: { width: number; height: number; devicePixelRatio: number; touch: boolean; category: string }; userAgentNote: string; userAgentApplied: boolean } {
    const profile = DEVICE_EMULATION_PROFILES[device];
    if (!profile) {
      throw new Error(`UNKNOWN_DEVICE: "${device}". Available: ${Object.keys(DEVICE_EMULATION_PROFILES).join(', ')}`);
    }
    const resize = this.resize(profile.width, profile.height, `device:${device}`);
    this.activeDevice = device;
    const win = this.doc.defaultView as any;
    if (win && this.isSimulation() && win.devicePixelRatio !== undefined) {
      win.devicePixelRatio = profile.devicePixelRatio;
    }
    return {
      device,
      resize,
      profile: {
        width: profile.width,
        height: profile.height,
        devicePixelRatio: profile.devicePixelRatio,
        touch: profile.touch,
        category: profile.category,
      },
      userAgentNote:
        this.isSimulation()
          ? 'User-Agent override requires the Chrome DevTools Protocol (real browser session); in this context the viewport, dpr and touch metadata are applied and the UA is reported but not enforced.'
          : 'User-Agent and touch behaviors are applied by the browser emulation layer.',
      userAgentApplied: !this.isSimulation(),
    };
  }

  /**
   * §17 — guaranteed restore of the original viewport.
   */
  public reset(): ViewportResizeResult {
    const current = {
      width: this.doc.defaultView?.innerWidth || 0,
      height: this.doc.defaultView?.innerHeight || 0,
    };
    const original = this.original ? { ...this.original } : { ...current };

    if (this.original) {
      this.applySize(this.original.width, this.original.height);
    }
    this.modified = false;
    this.activePreset = null;
    this.activeDevice = null;

    return {
      success: true,
      applied: { width: original.width, height: original.height },
      previous: current,
      original: { ...original },
      reversible: true,
      mode: this.isSimulation() ? 'simulation' : 'browser-window',
    };
  }

  /**
   * §38 — run a multi-viewport responsive workflow and ALWAYS restore.
   */
  public runResponsiveTest(
    sizes: Array<{ label: string; width: number; height: number }>,
    options: { restore?: boolean } = { restore: true }
  ): ResponsiveTestResult {
    const restore = options.restore !== false;
    const originalViewport = this.original
      ? { ...this.original }
      : { width: this.doc.defaultView?.innerWidth || 0, height: this.doc.defaultView?.innerHeight || 0 };
    if (!this.original) this.original = { ...originalViewport };

    const steps = sizes.map((size) => {
      this.applySize(size.width, size.height);
      this.modified = true;
      const digest = this.pageDigest();
      return {
        label: size.label,
        width: size.width,
        height: size.height,
        domLength: digest.domLength,
        interactiveCount: digest.interactiveCount,
        horizontalOverflow: this.hasHorizontalOverflow(),
        screenshotId: undefined,
      };
    });

    const comparisons = steps.slice(1).map((step, i) => ({
      from: steps[i].label,
      to: step.label,
      domLengthDelta: step.domLength - steps[i].domLength,
      interactiveDelta: step.interactiveCount - steps[i].interactiveCount,
    }));

    let finalViewport = { width: steps[steps.length - 1]?.width || 0, height: steps[steps.length - 1]?.height || 0 };
    let restored = false;
    if (restore) {
      this.applySize(originalViewport.width, originalViewport.height);
      this.modified = false;
      finalViewport = { ...originalViewport };
      restored = true;
    }

    return {
      success: true,
      originalViewport,
      steps,
      restored,
      finalViewport,
      comparisons,
    };
  }

  public getActivePreset(): string | null {
    return this.activePreset;
  }

  public getActiveDevice(): string | null {
    return this.activeDevice;
  }

  // ------------------------------------------------------------------
  private applySize(width: number, height: number): { width: number; height: number } {
    const w = Math.max(200, Math.min(7680, Math.round(width)));
    const h = Math.max(200, Math.min(4320, Math.round(height)));
    const win = this.doc.defaultView as any;
    if (win) {
      if (typeof win.innerWidth === 'number') win.innerWidth = w;
      if (typeof win.innerHeight === 'number') win.innerHeight = h;
      if (typeof win.outerWidth === 'number') win.outerWidth = w;
      if (typeof win.outerHeight === 'number') win.outerHeight = h;
    }
    return { width: w, height: h };
  }

  private pageDigest(): { url: string; domLength: number; interactiveCount: number } {
    const interactive = this.doc.querySelectorAll('a[href], button, input, select, textarea, [role="button"], [onclick]').length;
    return {
      url: this.doc.defaultView?.location?.href || this.doc.location?.href || '',
      domLength: this.doc.documentElement?.outerHTML.length || 0,
      interactiveCount: interactive,
    };
  }

  private hasHorizontalOverflow(): boolean {
    const docEl = this.doc.documentElement;
    const body = this.doc.body;
    const win = this.doc.defaultView;
    if (!win || !docEl) return false;
    const scrollWidth = Math.max(docEl.scrollWidth || 0, body?.scrollWidth || 0);
    return scrollWidth > (win.innerWidth || docEl.clientWidth || 0) + 1;
  }

  private isSimulation(): boolean {
    return typeof (globalThis as any).__FORENSIC_SIMULATION__ !== 'undefined';
  }
}

export function defaultResponsiveSizes(): Array<{ label: string; width: number; height: number }> {
  return [
    { label: 'desktop-1440x900', width: 1440, height: 900 },
    { label: 'laptop-1024x768', width: 1024, height: 768 },
    { label: 'tablet-768x1024', width: 768, height: 1024 },
    { label: 'mobile-375x667', width: 375, height: 667 },
  ];
}
