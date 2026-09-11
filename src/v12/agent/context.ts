/**
 * TeleDOM v12+ Agent — Context Intelligence (L0–L4).
 *
 * The agent receives the MINIMAL SUFFICIENT information for its next
 * correct decision. Five output levels; large artifacts go to storage and
 * become searchable references. Tracks bytes_to_decision,
 * tool_calls_to_decision, failed_actions_before_decision.
 */

export type ContextLevel = 'L0' | 'L1' | 'L2' | 'L3' | 'L4';

export const LEVEL_DESCRIPTIONS: Record<ContextLevel, string> = {
  L0: 'identity only — state references + counts',
  L1: 'compact semantic state — roles, intents, stability, no raw DOM',
  L2: 'relevant target subtree — semantic elements of the working scope',
  L3: 'evidence slice — events/hypotheses/causal chains of the incident',
  L4: 'full forensic state — everything (only on explicit request)',
};

export interface ContextArtifact {
  artifactId: string;
  kind: 'dom-full' | 'network-log' | 'console-log' | 'screenshot' | 'evidence-package';
  byteLength: number;
  searchable: boolean;
  storedRef: string;
}

export interface PlannedContext {
  level: ContextLevel;
  summary: Record<string, unknown>;
  stateRef: string;
  approximateTokens: number;
  available: ContextArtifact[];
  metrics: ContextMetrics;
  notes: string[];
}

export interface ContextMetrics {
  bytesToDecision: number;
  tokensToDecision: number;
  toolCallsToDecision: number;
  failedActionsBeforeDecision: number;
}

export interface ContextInput {
  intent: string;
  workingScope: string[];
  semanticElements: { semanticId: string; role: string; text: string; state: string; ownership: string | null; stability: number; selector: string }[];
  incidentContext?: { incidentId: string; hypotheses: string[]; causalChain: string[]; verification: string };
  eventCount: number;
  fullStateBytes: number;
}

export class ContextPlanner {
  private metrics: ContextMetrics = { bytesToDecision: 0, tokensToDecision: 0, toolCallsToDecision: 0, failedActionsBeforeDecision: 0 };

  /** Choose the output level for an intent (never floods by default). */
  levelForIntent(intent: string): ContextLevel {
    const i = intent.toLowerCase();
    if (/full|dump|everything|raw|debug-all/.test(i)) return 'L4';
    if (/evidence|proof|verify|why|caus/.test(i)) return 'L3';
    if (/element|subtree|component|section|form/.test(i)) return 'L2';
    if (/state|page|summar|overview|what.*(page|app)/.test(i)) return 'L1';
    return 'L0';
  }

  /**
   * Produce the minimal sufficient context for the next decision.
   * Raw state is externalized to searchable artifacts, not inlined.
   */
  plan(input: ContextInput, opts: { requestedLevel?: ContextLevel } = {}): PlannedContext {
    const level = opts.requestedLevel ?? this.levelForIntent(input.intent);
    const notes: string[] = [];
    let summary: Record<string, unknown> = {};
    let approxBytes = 0;

    switch (level) {
      case 'L0': {
        summary = {
          stateRef: `state_${hashRef(input)}`,
          eventCount: input.eventCount,
          semanticElementCount: input.semanticElements.length,
          scope: input.workingScope,
        };
        approxBytes = 200;
        break;
      }
      case 'L1': {
        summary = {
          stateRef: `state_${hashRef(input)}`,
          eventCount: input.eventCount,
          semantic: input.semanticElements.slice(0, 40).map((el) => ({
            id: el.semanticId, role: el.role, text: el.text.slice(0, 40), state: el.state,
            owner: el.ownership, stability: el.stability, selector: el.selector,
          })),
        };
        approxBytes = 200 + input.semanticElements.slice(0, 40).length * 90;
        notes.push('semantic state compacted to 40 elements');
        break;
      }
      case 'L2': {
        const scoped = input.semanticElements.filter((el) =>
          input.workingScope.some((s) => el.selector.includes(s) || el.ownership?.includes(s) || el.semanticId.includes(s)),
        );
        summary = {
          stateRef: `state_${hashRef(input)}`,
          subtree: (scoped.length ? scoped : input.semanticElements.slice(0, 60)).map((el) => ({
            id: el.semanticId, role: el.role, text: el.text.slice(0, 60), state: el.state,
            owner: el.ownership, stability: el.stability, selector: el.selector, interactive: true,
          })),
        };
        approxBytes = 250 + (scoped.length || Math.min(60, input.semanticElements.length)) * 110;
        break;
      }
      case 'L3': {
        summary = {
          stateRef: `state_${hashRef(input)}`,
          incident: input.incidentContext ?? { incidentId: 'none', hypotheses: [], causalChain: [], verification: 'UNSUPPORTED' },
          scope: input.workingScope,
          eventCount: input.eventCount,
        };
        approxBytes = 400 + JSON.stringify(input.incidentContext ?? {}).length;
        break;
      }
      case 'L4': {
        summary = { stateRef: `state_${hashRef(input)}`, fullStateAvailable: true, eventCount: input.eventCount, fullStateBytes: input.fullStateBytes };
        approxBytes = input.fullStateBytes;
        notes.push('L4 returns the full forensic state — expensive; use only when required');
        break;
      }
    }

    // Duplicate suppression + novelty detection (cheap, deterministic).
    const seenRoles = new Set<string>();
    let duplicatesSuppressed = 0;
    if (Array.isArray((summary as any).semantic) || Array.isArray((summary as any).subtree)) {
      const key = (summary as any).semantic ? 'semantic' : 'subtree';
      const kept = ((summary as any)[key] as Record<string, unknown>[]).filter((el) => {
        const dedupeKey = `${el.role}:${el.text}`;
        if (seenRoles.has(dedupeKey)) {
          duplicatesSuppressed += 1;
          return false;
        }
        seenRoles.add(dedupeKey);
        return true;
      });
      (summary as any)[key] = kept;
      if (duplicatesSuppressed > 0) notes.push(`${duplicatesSuppressed} duplicate semantic entries suppressed`);
    }

    const available: ContextArtifact[] = [
      { artifactId: `art:dom:${hashRef(input)}`, kind: 'dom-full', byteLength: input.fullStateBytes, searchable: true, storedRef: `artifact://dom/${hashRef(input)}` },
      { artifactId: `art:network:${hashRef(input)}`, kind: 'network-log', byteLength: Math.min(input.fullStateBytes, 100_000), searchable: true, storedRef: `artifact://network/${hashRef(input)}` },
      { artifactId: `art:console:${hashRef(input)}`, kind: 'console-log', byteLength: 4_096, searchable: true, storedRef: `artifact://console/${hashRef(input)}` },
    ];

    this.metrics.bytesToDecision += approxBytes;
    this.metrics.tokensToDecision += Math.ceil(approxBytes / 4);
    this.metrics.toolCallsToDecision += 1;

    return {
      level,
      summary,
      stateRef: `state_${hashRef(input)}`,
      approximateTokens: Math.ceil(approxBytes / 4),
      available,
      metrics: { ...this.metrics },
      notes,
    };
  }

  recordFailedAction(): void {
    this.metrics.failedActionsBeforeDecision += 1;
  }

  get cumulativeMetrics(): ContextMetrics {
    return { ...this.metrics };
  }
}

function hashRef(input: ContextInput): string {
  const s = `${input.eventCount}:${input.semanticElements.length}:${input.workingScope.join(',')}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h).toString(36).padStart(6, '0').slice(0, 6);
}
