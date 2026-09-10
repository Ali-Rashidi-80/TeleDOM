/**
 * CAP 03 session-level orchestration (extracted from the dispatcher for
 * §31 modularity): resolves screenshot events, decodes PNG payloads and
 * correlates pixel diffs with DOM-state diffs in the same window.
 */

import { SessionAccess } from '../session-access';
import { regressionDiff } from './regression-diff';
import { decodePng, diffRegions, correlateVisualWithDom } from './visual-regression';

export async function analyzeVisualRegressionSession(
  access: SessionAccess,
  sessionId: string,
  args: Record<string, any>,
): Promise<Record<string, unknown>> {
  const events = await access.events(sessionId);
  const shots = events.filter(e => e.category === 'SCREENSHOT');
  if (shots.length === 0) {
    // No recorded screenshots — analyze DOM-only with an explicit note.
    const t1 = args.t1 ?? 0;
    const t2 = args.t2 ?? Math.max(...events.map(e => e.timestamp), 1);
    const before = await access.domStateAt(sessionId, t1);
    const after = await access.domStateAt(sessionId, t2);
    if (before && after) {
      const diff = regressionDiff(before, after);
      const totals = diff.machine.totals;
      const topChanges = diff.machine.dimensions.flatMap(d => d.changes.slice(0, 3).map(c => ({ dimension: d.dimension, summary: `${c.selector}: ${c.detail}` })));
      const report = correlateVisualWithDom({
        pixel: { identical: false, changedRegions: [], changedRegionCount: 0, totalChangedPixels: 0, changeRatio: 0 },
        domDiff: { totals, topChanges },
        screenshots: { before: { label: 'no screenshot recorded' }, after: { label: 'no screenshot recorded' } },
      });
      report.conclusion = `No screenshots recorded in this session — DOM-only analysis. ${report.conclusion}`;
      return { sessionId, visualEvidenceAvailable: false, ...report } as Record<string, unknown>;
    }
    throw new Error('RESOURCE_EXHAUSTED: neither screenshots nor reconstructable DOM states available for this session.');
  }
  const pick = (id?: string, ts?: number, after?: boolean) => {
    if (id) return shots.find(s => s.id === id);
    if (ts !== undefined) {
      return shots.reduce((best: any, s) => {
        if (!best) return s;
        return Math.abs(s.timestamp - ts) < Math.abs(best.timestamp - ts) ? s : best;
      }, null);
    }
    return after ? shots[shots.length - 1] : shots[0];
  };
  const before = pick(args.shot1, args.t1, false);
  const after = pick(args.shot2, args.t2, true);
  if (!before || !after || before.id === after.id) throw new Error('INVALID_INPUT: two DIFFERENT screenshots are required (shot1/shot2 or t1/t2).');

  // decode + pixel diff (real PNG decoding)
  const extractDataUrl = (payload: any): string | null => {
    const candidates = [payload?.dataUrl, payload?.screenshot, payload?.data, payload?.imageData, payload?.base64];
    for (const c of candidates) {
      if (typeof c === 'string' && c.startsWith('data:image/png;base64,')) return c;
      if (typeof c === 'string' && /^[A-Za-z0-9+/=]{40,}$/.test(c.slice(0, 60)) && !c.startsWith('{')) return `data:image/png;base64,${c}`;
    }
    return null;
  };
  const dataA = extractDataUrl(before.payload);
  const dataB = extractDataUrl(after.payload);
  let pixelResult: ReturnType<typeof diffRegions>;
  if (!dataA || !dataB) {
    pixelResult = { identical: false, changedRegions: [], changedRegionCount: 0, totalChangedPixels: 0, changeRatio: 0, note: 'Screenshot payloads are not raw PNG data (recorder may store references/metadata) — pixel diff unavailable; DOM correlation below.' } as any;
  } else {
    const imgA = decodePng(Buffer.from(dataA.split(',')[1], 'base64'));
    const imgB = decodePng(Buffer.from(dataB.split(',')[1], 'base64'));
    pixelResult = diffRegions(imgA, imgB);
  }

  // DOM diff in the same window
  const domEvents = events.filter(e => e.timestamp >= before.timestamp && e.timestamp <= after.timestamp);
  const t1 = await access.domStateAt(sessionId, before.timestamp);
  const t2 = await access.domStateAt(sessionId, after.timestamp);
  let totals: Record<string, number> = {};
  let topChanges: Array<{ dimension: string; summary: string }> = [];
  if (t1 && t2) {
    const diff = regressionDiff(t1, t2);
    totals = diff.machine.totals;
    topChanges = diff.machine.dimensions.flatMap(d => d.changes.slice(0, 3).map(c => ({ dimension: d.dimension, summary: `${c.selector}: ${c.detail}` })));
  } else {
    topChanges = domEvents.filter(e => e.category === 'DOM').slice(0, 10).map(e => ({ dimension: 'DOM', summary: `${e.type} ${e.targetSelector || ''}`.trim() }));
    totals = { recordedDomEvents: domEvents.filter(e => e.category === 'DOM').length };
  }

  const report = correlateVisualWithDom({
    pixel: pixelResult,
    domDiff: { totals, topChanges },
    screenshots: {
      before: { eventId: before.id, timestamp: before.timestamp, label: `screenshot t=${before.timestamp}ms` },
      after: { eventId: after.id, timestamp: after.timestamp, label: `screenshot t=${after.timestamp}ms` },
    },
  });
  return { sessionId, ...report } as Record<string, unknown>;
}
