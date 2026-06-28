/**
 * Shared, pure timeline geometry — the single source of truth for BOTH the DOM/SVG
 * engine (SerpentineTimeline) and the WebGL set-piece (LivingFiberCanvas). No React,
 * no DOM, no Date.now/Math.random: everything is deterministic from `count` + the
 * connection tags, so SSR and client agree and the WebGL scene lines up pixel-for-pixel
 * with the accessible <ol> (CLS=0). All coordinates are in viewBox units: x ∈ [0,VBW],
 * y increases downward from PAD, exactly like the SVG.
 */

// ── Constants ────────────────────────────────────────────────────────────────
export const VBW = 100;
export const CX = 50; // chart centre lane
export const AMP = 32; // swing amplitude -> nodes at x = 18 (full left) / 82 (full right)
export const PAD = 28; // top/bottom clearance
export const SEG = 34; // vertical pitch per synapse
export const K = 0.5; // bezier vertical-handle factor -> smooth bold sine wave, monotonic y

export const vbhFor = (n: number) => PAD * 2 + Math.max(0, n - 1) * SEG;

// Card lane edges (container %). Card sits on the OPPOSITE side of its wall-node.
export const LANE = {
  left: { className: "md:left-[6%] md:right-[48%]", edge: 52 },
  right: { className: "md:left-[48%] md:right-[6%]", edge: 48 },
} as const;

export type Pt = { x: number; y: number };

/** Pure, SSR-stable waypoints: x = CX + AMP*cos(i*PI) -> 82,18,82,18,... y monotonic. */
export function waypoints(n: number): Pt[] {
  return Array.from({ length: n }, (_, i) => ({
    x: CX + AMP * Math.cos(i * Math.PI),
    y: PAD + i * SEG,
  }));
}

/** Cubic spline through the waypoints with vertical-dominant handles (the serpentine
 *  ROAD). y(t) strictly monotonic so arc-length->node mapping is provably safe. */
export function serpentinePath(p: Pt[]): string {
  if (p.length === 0) return "";
  if (p.length === 1) return `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  let d = `M ${p[0].x.toFixed(2)} ${p[0].y.toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[i];
    const b = p[i + 1];
    const dy = b.y - a.y;
    d += ` C ${a.x.toFixed(2)} ${(a.y + dy * K).toFixed(2)} ${b.x.toFixed(2)} ${(b.y - dy * K).toFixed(2)} ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }
  return d;
}

/** even i -> node full RIGHT -> card LEFT; odd i -> node LEFT -> card RIGHT. */
export function sideFor(i: number): "left" | "right" {
  return i % 2 === 0 ? "left" : "right";
}

// ── Centerline sampling (for the WebGL ribbon + particles) ─────────────────────
export type Centerline = {
  /** `samples` points spaced evenly by arc length along the serpentine. */
  pts: Pt[];
  /** unit normal (perpendicular) at each sample, in viewBox space. */
  normals: Pt[];
  /** arc-length fraction (0..1) at each milestone node — the ONE clock for ignition. */
  nodeFrac: number[];
  /** total arc length (viewBox units). */
  total: number;
};

function cubicAt(a: Pt, c1: Pt, c2: Pt, b: Pt, t: number): Pt {
  const mt = 1 - t;
  const w0 = mt * mt * mt;
  const w1 = 3 * mt * mt * t;
  const w2 = 3 * mt * t * t;
  const w3 = t * t * t;
  return {
    x: w0 * a.x + w1 * c1.x + w2 * c2.x + w3 * b.x,
    y: w0 * a.y + w1 * c1.y + w2 * c2.y + w3 * b.y,
  };
}

/** Densely sample the spline, build an arc-length table, resample to `samples` points
 *  spaced evenly by arc length, and compute the node arc-fractions. Deterministic. */
export function sampleCenterline(pts: Pt[], samples = 240): Centerline {
  if (pts.length < 2) {
    const p = pts[0] ?? { x: CX, y: PAD };
    return {
      pts: Array.from({ length: samples }, () => ({ ...p })),
      normals: Array.from({ length: samples }, () => ({ x: 1, y: 0 })),
      nodeFrac: pts.map(() => 0),
      total: 0,
    };
  }

  const PER = 48;
  const dense: { p: Pt; len: number }[] = [];
  const nodeArc: number[] = [0];
  let acc = 0;
  let prev: Pt | null = null;

  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const dy = b.y - a.y;
    const c1 = { x: a.x, y: a.y + dy * K };
    const c2 = { x: b.x, y: b.y - dy * K };
    for (let j = i === 0 ? 0 : 1; j <= PER; j++) {
      const p = cubicAt(a, c1, c2, b, j / PER);
      if (prev) acc += Math.hypot(p.x - prev.x, p.y - prev.y);
      dense.push({ p, len: acc });
      prev = p;
    }
    nodeArc[i + 1] = acc; // node i+1 sits at the end of segment i
  }

  const total = acc || 1;
  const outPts: Pt[] = [];
  let di = 0;
  for (let s = 0; s < samples; s++) {
    const target = (s / (samples - 1)) * total;
    while (di < dense.length - 2 && dense[di + 1].len < target) di++;
    const d0 = dense[di];
    const d1 = dense[di + 1] ?? d0;
    const seg = Math.max(1e-6, d1.len - d0.len);
    const f = (target - d0.len) / seg;
    outPts.push({ x: d0.p.x + (d1.p.x - d0.p.x) * f, y: d0.p.y + (d1.p.y - d0.p.y) * f });
  }

  const normals: Pt[] = [];
  for (let s = 0; s < samples; s++) {
    const a = outPts[Math.max(0, s - 1)];
    const b = outPts[Math.min(samples - 1, s + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const m = Math.hypot(tx, ty) || 1;
    tx /= m;
    ty /= m;
    normals.push({ x: -ty, y: tx }); // perpendicular (left normal)
  }

  return { pts: outPts, normals, nodeFrac: nodeArc.map((a) => a / total), total };
}

/** Sample the resampled centerline at arc-fraction t∈[0,1] (linear between samples). */
export function pointAtFrac(c: Centerline, t: number): { pos: Pt; normal: Pt } {
  const n = c.pts.length;
  if (n === 0) return { pos: { x: CX, y: PAD }, normal: { x: 1, y: 0 } };
  const x = Math.min(Math.max(t, 0), 1) * (n - 1);
  const i = Math.min(n - 2, Math.floor(x));
  const f = x - i;
  const a = c.pts[i];
  const b = c.pts[i + 1] ?? a;
  const na = c.normals[i];
  const nb = c.normals[i + 1] ?? na;
  return {
    pos: { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f },
    normal: { x: na.x + (nb.x - na.x) * f, y: na.y + (nb.y - na.y) * f },
  };
}

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
    const baseX = right ? 87 : 13;
    const m = list.length;
    list.forEach((c, k) => {
      const t = m === 1 ? 0 : k / (m - 1) - 0.5;
      const x = clamp(
        baseX + jitter(`${c.id}.${i}.x`, -5, 5) + (right ? 1 : -1) * Math.abs(t) * 5,
        4,
        96,
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
      const cx = a.x > CX && b.x > CX ? 99 : a.x < CX && b.x < CX ? 1 : (a.x + b.x) / 2;
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
