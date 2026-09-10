/**
 * §41 Error Contract — structured, predictable failure modes for every
 * unified-platform tool. Preserves existing MCPDOM error semantics and
 * adds the machine-readable envelope required by the fusion spec.
 */

export type ToolErrorCode =
  | 'INVALID_INPUT'
  | 'BROWSER_UNAVAILABLE'
  | 'PAGE_NOT_FOUND'
  | 'TARGET_STALE'
  | 'CAPABILITY_UNAVAILABLE'
  | 'TIMEOUT'
  | 'NAVIGATION_CONFLICT'
  | 'MUTATION_CONFLICT'
  | 'RESOURCE_EXHAUSTED'
  | 'UNSUPPORTED_OPERATION'
  | 'INTERNAL_ERROR';

export class ToolError extends Error {
  readonly code: ToolErrorCode;
  readonly details?: Record<string, unknown>;
  readonly retriable: boolean;

  constructor(code: ToolErrorCode, message: string, details?: Record<string, unknown>, retriable = false) {
    super(message);
    this.name = 'ToolError';
    this.code = code;
    this.details = details;
    this.retriable = retriable;
  }
}

/** Error code → human guidance used in error envelopes. */
const RECOVERY_HINTS: Record<ToolErrorCode, string> = {
  INVALID_INPUT: 'Check the tool schema; validate argument types and required fields.',
  BROWSER_UNAVAILABLE: 'Connect the Chrome extension and verify the bridge on ws://127.0.0.1:3847 (GET /health).',
  PAGE_NOT_FOUND: 'Re-list pages/tabs and retry with a valid pageId/tabId.',
  TARGET_STALE: 'The page changed (navigation/mutation). Re-resolve the target or use recover_selector.',
  CAPABILITY_UNAVAILABLE: 'The capability requires a subsystem that is disabled or not connected (CDP/bridge/extension).',
  TIMEOUT: 'Retry, or raise the timeout parameter; check page responsiveness.',
  NAVIGATION_CONFLICT: 'A navigation is in flight. Wait for it to settle (wait_for) before retrying.',
  MUTATION_CONFLICT: 'A mutation transaction is open. Commit or roll back before starting another.',
  RESOURCE_EXHAUSTED: 'Too many resources of this kind are open (traces, heap snapshots). Close unused ones.',
  UNSUPPORTED_OPERATION: 'The operation is not supported in this execution mode or on this target.',
  INTERNAL_ERROR: 'Unexpected internal failure; see server logs and report with correlation id.',
};

export interface ErrorEnvelope {
  isError: true;
  code: ToolErrorCode;
  message: string;
  details?: Record<string, unknown>;
  recoveryHint: string;
  retriable: boolean;
  correlationId?: string;
}

let errorCounter = 0;

/** Normalize ANY thrown value into the structured error envelope. */
export function toErrorEnvelope(err: unknown): ErrorEnvelope {
  let code: ToolErrorCode = 'INTERNAL_ERROR';
  let message = 'Unknown internal error';
  let details: Record<string, unknown> | undefined;
  let retriable = false;

  if (err instanceof ToolError) {
    code = err.code;
    message = err.message;
    details = err.details;
    retriable = err.retriable;
  } else if (err instanceof Error) {
    message = err.message;
    const lower = message.toLowerCase();
    if (lower.includes('timeout') || lower.includes('timed out')) {
      code = 'TIMEOUT';
      retriable = true;
    } else if (lower.includes('no active browser extension') || lower.includes('bridge')) {
      code = 'BROWSER_UNAVAILABLE';
      retriable = true;
    } else if (lower.includes('tab_not_found') || lower.includes('no simulated tab') || lower.includes('page not found')) {
      code = 'PAGE_NOT_FOUND';
    } else if (lower.includes('transaction') && (lower.includes('open') || lower.includes('already'))) {
      code = 'MUTATION_CONFLICT';
    } else if (lower.includes('invalid') || lower.includes('required') || lower.includes('must be')) {
      code = 'INVALID_INPUT';
    }
  } else if (typeof err === 'string') {
    message = err;
  }

  return {
    isError: true,
    code,
    message,
    details,
    recoveryHint: RECOVERY_HINTS[code],
    retriable,
    correlationId: `err_${Date.now()}_${++errorCounter}`,
  };
}
