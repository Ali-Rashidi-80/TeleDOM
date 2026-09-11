/**
 * TeleDOM v12+ Simulation — Prediction Engine.
 *
 * Pattern-based prediction with mandatory exposure of: prediction,
 * confidence, supporting evidence, assumptions, counterevidence,
 * time horizon, verification path. Heuristic guesses are never converted
 * into deterministic facts.
 */

import type { EventEnvelope } from '../kernel/events';

export interface PredictionInput {
  recentEvents: EventEnvelope[];
  horizonMs: number;
}

export interface Prediction {
  prediction: string;
  kind: 'failure-risk' | 'state-transition' | 'resource-risk' | 'behavior-continuation';
  confidence: number;
  supportingEvidence: string[];
  assumptions: string[];
  counterevidence: string[];
  timeHorizonMs: number;
  verificationPath: string;
}

/** Deterministic signal patterns: when A+B repeat, C tends to follow. */
interface Pattern {
  id: string;
  trigger: (events: EventEnvelope[]) => EventEnvelope[] | null;
  predict: (triggerEvents: EventEnvelope[]) => Prediction;
}

const PATTERNS: Pattern[] = [
  {
    id: 'network-error-then-element-removal',
    trigger: (events) => {
      const netErr = events.filter((e) => e.source === 'network' && /error|fail|timeout|500|abort/i.test(e.type));
      if (netErr.length === 0) return null;
      return netErr;
    },
    predict: (triggerEvents) => ({
      prediction: 'UI element depending on the failed request is likely to disappear or enter error state',
      kind: 'failure-risk',
      confidence: 0.7,
      supportingEvidence: triggerEvents.slice(-3).map((e) => `event:${e.eventId} (${e.type})`),
      assumptions: ['the page renders state derived from network responses'],
      counterevidence: ['error boundaries may catch the failure and render fallback UI'],
      timeHorizonMs: 1000,
      verificationPath: 'td_temporal_window around the failure and check DOM removal events',
    }),
  },
  {
    id: 'mutation-storm',
    trigger: (events) => {
      const domEvents = events.filter((e) => e.source === 'dom');
      if (domEvents.length < 50) return null;
      return domEvents;
    },
    predict: (domEvents) => ({
      prediction: 'Sustained DOM churn detected; layout shift and render instability likely within the horizon',
      kind: 'resource-risk',
      confidence: 0.65,
      supportingEvidence: [`${domEvents.length} DOM events in window`, `latest: event:${domEvents[domEvents.length - 1].eventId}`],
      assumptions: ['mutation rate continues at the observed pace'],
      counterevidence: ['virtualized lists may be intentionally churning without visual impact'],
      timeHorizonMs: 2000,
      verificationPath: 'td_render_stability + td_layout_causality on the window',
    }),
  },
  {
    id: 'loading-state-stuck',
    trigger: (events) => {
      const loading = events.filter((e) => e.source === 'runtime' && /loading|pending|busy/i.test(e.type));
      const netDone = events.filter((e) => e.source === 'network' && /complete|success|response/i.test(e.type));
      if (loading.length > 0 && netDone.length === 0) return loading;
      return null;
    },
    predict: (triggerEvents) => ({
      prediction: 'Loading state may remain uncleared if the pending request never completes or its handler fails',
      kind: 'failure-risk',
      confidence: 0.6,
      supportingEvidence: triggerEvents.map((e) => `event:${e.eventId}`),
      assumptions: ['no timeout/cleanup path is scheduled'],
      counterevidence: ['the app may clear the loading state on error callback'],
      timeHorizonMs: 5000,
      verificationPath: 'td_cause_trace on the loading-state element + network correlation',
    }),
  },
  {
    id: 'auth-session-expiry',
    trigger: (events) => {
      const auth = events.filter((e) => (e.source === 'security' || e.source === 'storage') && /auth|token|session|expire/i.test(e.type));
      return auth.length ? auth : null;
    },
    predict: (triggerEvents) => ({
      prediction: 'Authentication state transition imminent; protected actions may start failing',
      kind: 'state-transition',
      confidence: 0.55,
      supportingEvidence: triggerEvents.map((e) => `event:${e.eventId} (${e.type})`),
      assumptions: ['token/session lifetime is close to expiry'],
      counterevidence: ['a refresh flow may renew the session silently'],
      timeHorizonMs: 60_000,
      verificationPath: 'td_auth_session_audit',
    }),
  },
];

export class PredictionEngine {
  predict(input: PredictionInput): Prediction[] {
    const out: Prediction[] = [];
    for (const pattern of PATTERNS) {
      const triggerEvents = pattern.trigger(input.recentEvents);
      if (triggerEvents) {
        const base = pattern.predict(triggerEvents);
        out.push({ ...base, timeHorizonMs: Math.min(base.timeHorizonMs, input.horizonMs) || base.timeHorizonMs });
      }
    }
    return out;
  }
}
