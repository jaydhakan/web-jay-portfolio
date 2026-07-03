/**
 * Shared, pure timeline geometry primitives — used by the ARGMAX engine
 * (SerpentineTimeline + ArgmaxCanvas; the bolt itself lives in argmax.ts). No React,
 * no DOM, no Date.now/Math.random: everything is deterministic, so SSR and client agree
 * and the WebGL scene lines up pixel-for-pixel with the accessible <ol> (CLS=0). All
 * coordinates are in viewBox units: x ∈ [0,VBW], y increases downward from PAD.
 */

// ── Constants ────────────────────────────────────────────────────────────────
export const VBW = 100;
export const CX = 50; // chart centre lane
export const PAD = 28; // top/bottom clearance

// Card lane edges (container %). Card sits on the OPPOSITE side of its node.
export const LANE = {
  left: { className: "md:left-[6%] md:right-[48%]", edge: 52 },
  right: { className: "md:left-[48%] md:right-[6%]", edge: 48 },
} as const;

export type Pt = { x: number; y: number };

// ── Centerline (arc-length resampled path for the WebGL ribbon + particles) ───
export type Centerline = {
  /** points spaced evenly by arc length along the path. */
  pts: Pt[];
  /** unit normal (perpendicular) at each sample, in viewBox space. */
  normals: Pt[];
  /** arc-length fraction (0..1) at each milestone node — the ONE clock for ignition. */
  nodeFrac: number[];
  /** total arc length (viewBox units). */
  total: number;
};

// ── Constellation (knowledge graph) ───────────────────────────────────────────
export type Connection = { id: string; label: string };

export type StarPlot = {
  key: string;
  id: string;
  label: string;
  milestone: number;
  k: number;
  x: number;
  y: number;
};
export type SpurPlot = { milestone: number; d: string; a: Pt; b: Pt };
export type BridgePlot = { key: string; d: string; at: number; a: Pt; b: Pt };

const FAN_H = 15;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Deterministic 0..1 hash (FNV-1a) — keeps satellite jitter SSR-stable. */
export function hash01(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}
const jitter = (seed: string, min: number, max: number) => min + hash01(seed) * (max - min);

/** Place capability stars in each milestone's outer gutter; bridge successive
 *  occurrences of the same tag (the graph). Pure + deterministic. */
export function buildConstellation(pts: Pt[], conns: Connection[][] | undefined) {
  const stars: StarPlot[] = [];
  const spurs: SpurPlot[] = [];
  const bridges: BridgePlot[] = [];
  if (!conns) return { stars, spurs, bridges };

  conns.forEach((list, i) => {
    const node = pts[i];
    if (!node || !list?.length) return;
    const right = node.x > CX;
    // Stars hug their node's OUTER gutter (a tight satellite cluster, not a far-flung
    // web): base offset ~10-14 units from the node, never past the stage edge.
    const baseX = clamp(node.x + (right ? 1 : -1) * 12, 8, 92);
    const m = list.length;
    list.forEach((c, k) => {
      const t = m === 1 ? 0 : k / (m - 1) - 0.5;
      const x = clamp(
        baseX + jitter(`${c.id}.${i}.x`, -3, 3) + (right ? 1 : -1) * Math.abs(t) * 4,
        6,
        94,
      );
      const y = node.y + t * FAN_H + jitter(`${c.id}.${i}.y`, -2.5, 2.5);
      stars.push({ key: `${i}:${c.id}`, id: c.id, label: c.label, milestone: i, k, x, y });
    });
  });

  stars.forEach((s) => {
    const node = pts[s.milestone];
    const mx = (node.x + s.x) / 2;
    const my = (node.y + s.y) / 2 + jitter(`${s.key}.bow`, -1.4, 1.4);
    spurs.push({
      milestone: s.milestone,
      a: { x: node.x, y: node.y },
      b: { x: s.x, y: s.y },
      d: `M ${node.x.toFixed(2)} ${node.y.toFixed(2)} Q ${mx.toFixed(2)} ${my.toFixed(2)} ${s.x.toFixed(2)} ${s.y.toFixed(2)}`,
    });
  });

  const byId = new Map<string, number[]>();
  stars.forEach((s, idx) => {
    const arr = byId.get(s.id);
    if (arr) arr.push(idx);
    else byId.set(s.id, [idx]);
  });
  byId.forEach((idxs) => {
    for (let j = 0; j < idxs.length - 1; j++) {
      const a = stars[idxs[j]];
      const b = stars[idxs[j + 1]];
      // Bridge bow: gently outward past the wider of the two stars (stays near the
      // cluster lane instead of ballooning to the stage edge).
      const cx =
        a.x > CX && b.x > CX
          ? clamp(Math.max(a.x, b.x) + 7, 2, 98)
          : a.x < CX && b.x < CX
            ? clamp(Math.min(a.x, b.x) - 7, 2, 98)
            : (a.x + b.x) / 2;
      const cy = (a.y + b.y) / 2;
      bridges.push({
        key: `${a.key}->${b.key}`,
        a: { x: a.x, y: a.y },
        b: { x: b.x, y: b.y },
        d: `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} Q ${cx.toFixed(2)} ${cy.toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`,
        at: b.milestone,
      });
    }
  });

  return { stars, spurs, bridges };
}
