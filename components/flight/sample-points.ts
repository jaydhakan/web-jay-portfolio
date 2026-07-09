/**
 * sample-points.ts — glyph → point-cloud sampling for the Flight beacons
 * (timelineplan.md §11.1). Client-only (2D canvas); runs ONCE per glyph inside an
 * effect, results cached — world-baking against beacon anchors happens later and is
 * repeatable without re-rasterizing.
 *
 * Deterministic: seeded mulberry32 throughout, so reloads produce identical clouds.
 */
import type { GlyphDef } from "./glyph-data";

/** Tiny seeded PRNG (same generator family the arena uses). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const RASTER = 192; // px; lucide viewBox is 24 → scale 8

function scanAlpha(
  ctx: CanvasRenderingContext2D,
  size: number,
  n: number,
  rng: () => number,
): Float32Array {
  const px = ctx.getImageData(0, 0, size, size).data;
  const STEP = 2;
  const cand: number[] = [];
  for (let y = 0; y < size; y += STEP)
    for (let x = 0; x < size; x += STEP)
      if (px[(y * size + x) * 4 + 3] > 96) cand.push(x, y);

  // Fisher–Yates with the seeded rng → deterministic subset
  for (let i = cand.length / 2 - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const a = i * 2;
    const b = j * 2;
    [cand[a], cand[b]] = [cand[b], cand[a]];
    [cand[a + 1], cand[b + 1]] = [cand[b + 1], cand[a + 1]];
  }

  // Fixed-count resample: wrap when the glyph is sparse (extra jitter thickens the
  // stroke instead of doubling points on top of each other).
  const out = new Float32Array(n * 3);
  const m = Math.max(1, cand.length / 2);
  for (let i = 0; i < n; i++) {
    const k = (i % m) * 2;
    const wrap = i >= m ? 1.6 : 1.0;
    const jx = (rng() - 0.5) * STEP * wrap;
    const jy = (rng() - 0.5) * STEP * wrap;
    // LOCAL unit-plane coords in [-0.5, 0.5]; y flipped canvas→world; thin z slab.
    out[i * 3] = (cand[k] + jx) / size - 0.5;
    out[i * 3 + 1] = -((cand[k + 1] + jy) / size - 0.5);
    out[i * 3 + 2] = (rng() - 0.5) * 0.1;
  }
  return out;
}

/** Sample a lucide stroke icon into exactly n local-plane points. */
export function sampleGlyph(def: GlyphDef, n: number, rng: () => number): Float32Array {
  const c = document.createElement("canvas");
  c.width = c.height = RASTER;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.setTransform(RASTER / 24, 0, 0, RASTER / 24, 0, 0);
  ctx.strokeStyle = ctx.fillStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const d of def.paths) ctx.stroke(new Path2D(d));
  for (const { cx, cy, r } of def.circles) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (r < 1) ctx.fill(); // BrainCircuit's 0.5-radius dots vanish if thin-stroked
    else ctx.stroke();
  }
  return scanAlpha(ctx, RASTER, n, rng);
}

/** Sample filled text (the /work "01"…"09" numerals) into n local-plane points.
 *  Caller must await document.fonts.ready first (with a timeout) so JetBrains Mono
 *  is actually the face being rasterized. */
export function sampleNumeral(text: string, n: number, rng: () => number): Float32Array {
  const SIZE = 256;
  const c = document.createElement("canvas");
  c.width = c.height = SIZE;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  ctx.font = '900 150px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, SIZE / 2, SIZE / 2);
  return scanAlpha(ctx, SIZE, n, rng);
}

/** Resolve when webfonts are usable (1.5s cap — a fallback-face numeral beats blank). */
export function fontsReady(timeoutMs = 1500): Promise<void> {
  const ready = document.fonts?.ready?.then(() => undefined) ?? Promise.resolve();
  return Promise.race([
    ready,
    new Promise<void>((res) => window.setTimeout(res, timeoutMs)),
  ]);
}
