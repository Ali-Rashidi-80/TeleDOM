/**
 * §51 Event / Timeline System + §52 Operation Correlation
 *
 * A chronological, bounded event stream that becomes the platform's
 * observability layer. Every major operation receives an operationId; all
 * related logs, mutations, browser events and errors are correlatable.
 */

export type TimelineEventKind =
  | 'TAB_OPENED'
  | 'TAB_CLOSED'
  | 'TAB_SWITCHED'
  | 'NAVIGATED'
  | 'ELEMENT_SELECTED'
  | 'CLICKED'
  | 'TYPED'
  | 'RESIZED'
  | 'SCRIPT_EXECUTED'
  | 'DOM_MUTATED'
  | 'DOM_DIFF_GENERATED'
  | 'SNAPSHOT_CREATED'
  | 'ANNOTATION_CREATED'
  | 'EXTENSION_STATE_CHANGED'
  | 'COMMAND_EXECUTED'
  | 'MUTATION_UNDONE'
  | 'MUTATION_REDONE'
  | 'PROJECT_CREATED'
  | 'REGION_CAPTURED'
  | 'PACKAGE_EXPORTED'
  | 'ERROR_OCCURRED'
  | 'WAIT_SATISFIED';

export interface TimelineEvent {
  eventId: string;
  timestamp: number;
  kind: TimelineEventKind;
  operationId?: string;
  sessionId?: string;
  detail: string;
  data?: Record<string, any>;
}

const DEFAULT_CAP = 2000;

export class ActionTimeline {
  private events: TimelineEvent[] = [];
  private cap: number;
  private counter = 0;

  constructor(cap: number = DEFAULT_CAP) {
    this.cap = Math.max(10, cap);
  }

  public record(kind: TimelineEventKind, detail: string, options: { operationId?: string; sessionId?: string; data?: Record<string, any> } = {}): TimelineEvent {
    this.counter++;
    const event: TimelineEvent = {
      eventId: `evt_${Date.now().toString(36)}_${this.counter}`,
      timestamp: Date.now(),
      kind,
      operationId: options.operationId,
      sessionId: options.sessionId,
      detail,
      data: options.data,
    };
    this.events.push(event);
    if (this.events.length > this.cap) {
      this.events.splice(0, this.events.length - this.cap);
    }
    return event;
  }

  public query(filter: { kind?: TimelineEventKind; operationId?: string; sinceTimestamp?: number; limit?: number }): TimelineEvent[] {
    let out = this.events;
    if (filter.kind) out = out.filter((e) => e.kind === filter.kind);
    if (filter.operationId) out = out.filter((e) => e.operationId === filter.operationId);
    if (filter.sinceTimestamp) out = out.filter((e) => e.timestamp >= filter.sinceTimestamp!);
    const limit = filter.limit && filter.limit > 0 ? filter.limit : 200;
    return out.slice(-limit);
  }

  public size(): number {
    return this.events.length;
  }

  public toJSON(): TimelineEvent[] {
    return [...this.events];
  }
}

/**
 * §52 — Operation identity and correlation registry.
 */
export class OperationRegistry {
  private counter = 0;
  private operations = new Map<string, {
    operationId: string;
    tool: string;
    startedAt: number;
    endedAt?: number;
    status: 'RUNNING' | 'SUCCESS' | 'FAILED';
    timelineEventIds: string[];
    relatedError?: string;
  }>();

  public begin(tool: string): string {
    this.counter++;
    const operationId = `op_${Date.now().toString(36)}_${this.counter}`;
    this.operations.set(operationId, {
      operationId,
      tool,
      startedAt: Date.now(),
      status: 'RUNNING',
      timelineEventIds: [],
    });
    return operationId;
  }

  public end(operationId: string, status: 'SUCCESS' | 'FAILED', error?: string): void {
    const op = this.operations.get(operationId);
    if (!op) return;
    op.endedAt = Date.now();
    op.status = status;
    op.relatedError = error;
  }

  public attachEvent(operationId: string, eventId: string): void {
    const op = this.operations.get(operationId);
    if (op) op.timelineEventIds.push(eventId);
  }

  public trace(operationId: string): { operationId: string; tool: string; startedAt: number; endedAt?: number; durationMs?: number; status: string; timelineEventIds: string[]; relatedError?: string } | null {
    const op = this.operations.get(operationId);
    if (!op) return null;
    return {
      ...op,
      durationMs: op.endedAt ? op.endedAt - op.startedAt : undefined,
    };
  }

  public recent(limit = 100) {
    return Array.from(this.operations.values()).slice(-limit).map((op) => ({
      ...op,
      durationMs: op.endedAt ? op.endedAt - op.startedAt : undefined,
    }));
  }
}
