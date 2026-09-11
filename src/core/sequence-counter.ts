export class SequenceCounter {
  private currentSequence: number = 0;
  private sessionStartTime: number;
  private sessionStartWallClock: number;

  constructor() {
    this.sessionStartTime = typeof performance !== 'undefined' ? performance.now() : 0;
    this.sessionStartWallClock = Date.now();
  }

  public nextSequence(): number {
    this.currentSequence += 1;
    return this.currentSequence;
  }

  public getSequence(): number {
    return this.currentSequence;
  }

  public getRelativeTimestamp(): number {
    if (typeof performance !== 'undefined') {
      return Math.round((performance.now() - this.sessionStartTime) * 100) / 100;
    }
    return Date.now() - this.sessionStartWallClock;
  }

  public getWallClock(): number {
    return Date.now();
  }

  /**
   * Generate an event id embedding an EXPLICIT sequence.
   *
   * v12 P0 event-integrity fix: when `seq` is provided (the normal path),
   * it is embedded WITHOUT advancing the counter, so the invariant
   * `event.sequence === sequence embedded in event.id` always holds.
   * The legacy zero-arg form (self-allocating) is kept only for backward
   * compatibility with old call sites; new code must pass the sequence.
   */
  public generateEventId(prefix: string = 'evt', seq?: number): string {
    const sequence = seq !== undefined ? seq : this.nextSequence();
    const rand = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${sequence}_${rand}`;
  }

  public reset(): void {
    this.currentSequence = 0;
    this.sessionStartTime = typeof performance !== 'undefined' ? performance.now() : 0;
    this.sessionStartWallClock = Date.now();
  }
}
