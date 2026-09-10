/**
 * CAP 03 — Visual Regression Forensics.
 *
 * Compares two screenshots TOGETHER with the DOM states around them.
 * A real (compact) PNG decoder (8/16-bit RGB/RGBA/Gray, non-interlaced,
 * zlib via Node inflate) enables region-level pixel diffing; DOM
 * correlation then attributes visual changes to structural causes —
 * pixel difference alone is never treated as sufficient evidence.
 */

import * as zlib from 'zlib';

export interface DecodedImage {
  width: number;
  height: number;
  channels: number;
  /** RGBA byte layout, row-major. */
  data: Uint8Array;
}

/** Minimal, correct PNG decoder for non-interlaced images. */
export function decodePng(buffer: Buffer): DecodedImage {
  if (buffer.length < 8 || buffer.readUInt32BE(0) !== 0x89504e47) {
    throw new Error('INVALID_INPUT: not a PNG file (bad signature).');
  }
  let offset = 8;
  let width = 0, height = 0, bitDepth = 8, colorType = 6;
  const idat: Buffer[] = [];
  let palette: Buffer | null = null;
  let trns: Buffer | null = null;

  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
      const compression = data[10];
      const filterMethod = data[11];
      const interlace = data[12];
      if (compression !== 0 || filterMethod !== 0) throw new Error('INVALID_INPUT: unsupported PNG compression/filter method.');
      if (interlace !== 0) throw new Error('INVALID_INPUT: interlaced PNGs are not supported by this decoder.');
      if (bitDepth !== 8 && bitDepth !== 16) throw new Error(`INVALID_INPUT: unsupported PNG bit depth ${bitDepth}.`);
    } else if (type === 'PLTE') {
      palette = Buffer.from(data);
    } else if (type === 'tRNS') {
      trns = Buffer.from(data);
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(data));
    } else if (type === 'IEND') {
      break;
    }
    offset += 12 + length;
  }
  if (width === 0 || height === 0) throw new Error('INVALID_INPUT: PNG has no IHDR dimensions.');

  const channels = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : colorType === 3 ? 1 : 3;
  const bytesPerSample = bitDepth / 8;
  const bytesPerPixel = channels * bytesPerSample;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * bytesPerPixel;
  const out = new Uint8Array(width * height * 4);
  let prevRow = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const rowStart = y * (stride + 1) + 1;
    const row = new Uint8Array(raw.subarray(rowStart, rowStart + stride));
    // un-filter
    for (let x = 0; x < stride; x++) {
      const left = x >= bytesPerPixel ? row[x - bytesPerPixel] : 0;
      const up = prevRow[x];
      const upLeft = x >= bytesPerPixel ? prevRow[x - bytesPerPixel] : 0;
      switch (filter) {
        case 0: break;
        case 1: row[x] = (row[x] + left) & 0xff; break;
        case 2: row[x] = (row[x] + up) & 0xff; break;
        case 3: row[x] = (row[x] + ((left + up) >> 1)) & 0xff; break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          row[x] = (row[x] + pred) & 0xff;
          break;
        }
        default: throw new Error(`INVALID_INPUT: unknown PNG filter ${filter}.`);
      }
    }
    for (let x = 0; x < width; x++) {
      const di = (y * width + x) * 4;
      const si = x * bytesPerPixel;
      if (colorType === 3 && palette) {
        const idx = row[si] * 3;
        out[di] = palette[idx] || 0; out[di + 1] = palette[idx + 1] || 0; out[di + 2] = palette[idx + 2] || 0;
        out[di + 3] = trns && trns[row[si]] !== undefined ? trns[row[si]] : 255;
      } else {
        const sample = (i: number) => bytesPerSample === 2 ? row[si + i * 2] : row[si + i];
        if (channels === 1 || channels === 2) {
          const g = sample(0);
          out[di] = g; out[di + 1] = g; out[di + 2] = g;
          out[di + 3] = channels === 2 ? sample(1) : 255;
        } else {
          out[di] = sample(0); out[di + 1] = sample(1); out[di + 2] = sample(2);
          out[di + 3] = channels === 4 ? sample(3) : 255;
        }
      }
    }
    prevRow = row;
  }
  return { width, height, channels: 4, data: out };
}

export interface PixelRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  changedPixels: number;
  changeRatio: number;
}

/** Region-level diff: divide images into a grid and find changed blocks. */
export function diffRegions(a: DecodedImage, b: DecodedImage, grid = 16, threshold = 12): { identical: boolean; changedRegions: PixelRegion[]; changedRegionCount: number; totalChangedPixels: number; changeRatio: number; dimensionMismatch?: boolean } {
  if (a.width !== b.width || a.height !== b.height) {
    return { identical: false, changedRegions: [{ x: 0, y: 0, width: Math.max(a.width, b.width), height: Math.max(a.height, b.height), changedPixels: a.width * a.height, changeRatio: 1 }], changedRegionCount: 1, totalChangedPixels: a.width * a.height, changeRatio: 1, dimensionMismatch: true };
  }
  const cellW = Math.max(1, Math.floor(a.width / grid));
  const cellH = Math.max(1, Math.floor(a.height / grid));
  const changedRegions: PixelRegion[] = [];
  let totalChanged = 0;

  for (let gy = 0; gy * cellH < a.height; gy++) {
    for (let gx = 0; gx * cellW < a.width; gx++) {
      let changed = 0;
      let sampled = 0;
      const x0 = gx * cellW, y0 = gy * cellH;
      const x1 = Math.min(x0 + cellW, a.width), y1 = Math.min(y0 + cellH, a.height);
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * a.width + x) * 4;
          sampled++;
          const dr = Math.abs(a.data[i] - b.data[i]);
          const dg = Math.abs(a.data[i + 1] - b.data[i + 1]);
          const db = Math.abs(a.data[i + 2] - b.data[i + 2]);
          if (dr > threshold || dg > threshold || db > threshold) changed++;
        }
      }
      if (sampled > 0 && changed / sampled > 0.08) {
        changedRegions.push({ x: x0, y: y0, width: x1 - x0, height: y1 - y0, changedPixels: changed, changeRatio: Number((changed / sampled).toFixed(3)) });
        totalChanged += changed;
      }
    }
  }
  const totalPixels = Math.floor((a.width * a.height) / 4); // sampled every 2px both axes
  return {
    identical: changedRegions.length === 0,
    changedRegionCount: changedRegions.length,
    changedRegions: changedRegions.slice(0, 60),
    totalChangedPixels: totalChanged,
    changeRatio: totalPixels ? Number((totalChanged / totalPixels).toFixed(4)) : 0,
  };
}

export interface VisualRegressionReport {
  screenshots: { before: { eventId?: string; timestamp?: number; label: string }; after: { eventId?: string; timestamp?: number; label: string } };
  pixelDiff: { identical: boolean; changedRegionCount: number; changedRegions: PixelRegion[]; changeRatio: number; dimensionMismatch?: boolean };
  domCorrelation: {
    structuralChanges: Array<{ summary: string; eventId?: string }>;
    styleChanges: Array<{ summary: string; eventId?: string }>;
    likelyRootCauses: Array<{ cause: string; confidence: number; band: string; evidenceCount: number }>;
  };
  conclusion: string;
  confidence: number;
  band: string;
}

/**
 * Co-analyze screenshots + DOM diff evidence (the pixel diff alone is
 * never the conclusion — DOM/style attribution is mandatory, CAP 03).
 */
export function correlateVisualWithDom(input: {
  pixel: ReturnType<typeof diffRegions>;
  domDiff: { totals: Record<string, number>; topChanges: Array<{ summary: string; dimension: string }> };
  screenshots: { before: { eventId?: string; timestamp?: number; label: string }; after: { eventId?: string; timestamp?: number; label: string } };
}): VisualRegressionReport {
  const { pixel, domDiff, screenshots } = input;
  const structural = domDiff.topChanges.filter(c => ['added', 'removed', 'moved', 'layout'].includes(c.dimension));
  const style = domDiff.topChanges.filter(c => ['styles', 'attributes'].includes(c.dimension));

  const rootCauses: VisualRegressionReport['domCorrelation']['likelyRootCauses'] = [];
  for (const change of structural.slice(0, 5)) {
    rootCauses.push({
      cause: `Structural change: ${change.summary}`,
      confidence: pixel.changedRegionCount > 0 ? 0.78 : 0.4,
      band: pixel.changedRegionCount > 0 ? 'HIGH' : 'LOW',
      evidenceCount: 2,
    });
  }
  for (const change of style.slice(0, 3)) {
    rootCauses.push({
      cause: `Style change: ${change.summary}`,
      confidence: pixel.changedRegionCount > 0 ? 0.62 : 0.3,
      band: pixel.changedRegionCount > 0 ? 'MEDIUM' : 'LOW',
      evidenceCount: 2,
    });
  }
  rootCauses.sort((a, b) => b.confidence - a.confidence);

  let conclusion: string;
  if (pixel.identical && domDiff.totals && Object.keys(domDiff.totals).length === 0) {
    conclusion = 'No visual and no DOM differences detected between the two states.';
  } else if (pixel.identical && Object.keys(domDiff.totals).length > 0) {
    conclusion = 'DOM changed without a measurable visual change (non-visible changes: hidden elements, attributes without rendering impact).';
  } else if (!pixel.identical && Object.keys(domDiff.totals).length === 0) {
    conclusion = 'Visual change WITHOUT recorded DOM changes — probable causes: animations, canvas/WebGL rendering, or image content changes (untracked by DOM mutations).';
  } else {
    conclusion = `Visual changes correlate with ${structural.length} structural and ${style.length} style DOM changes; top candidates ranked in likelyRootCauses.`;
  }

  const confidence = pixel.changedRegionCount > 0 && (structural.length + style.length) > 0
    ? 0.82
    : pixel.changedRegionCount > 0 ? 0.45 : 0.6;

  return {
    screenshots,
    pixelDiff: { identical: pixel.identical, changedRegionCount: pixel.changedRegions.length, changedRegions: pixel.changedRegions, changeRatio: pixel.changeRatio },
    domCorrelation: {
      structuralChanges: structural.slice(0, 10).map(c => ({ summary: c.summary })),
      styleChanges: style.slice(0, 6).map(c => ({ summary: c.summary })),
      likelyRootCauses: rootCauses.slice(0, 5),
    },
    conclusion,
    confidence,
    band: confidence >= 0.65 ? 'HIGH' : confidence >= 0.4 ? 'MEDIUM' : 'LOW',
  };
}
