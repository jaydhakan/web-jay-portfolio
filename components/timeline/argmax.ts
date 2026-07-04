/**
 * ARGMAX geometry — "The Paths Not Taken" (design history: TIMELINE_REDESIGN.md /
 * TIMELINE_IMPLEMENTATION.md in git history). Pure, deterministic, SSR-stable: everything derives from
 * the authored Beat score, so server and client agree pixel-for-pixel (CLS=0).
 *
 * The timeline is an inference trajectory rendered as a slow lightning bolt: a
 * mostly-vertical channel with deliberate KINKS at decision points. At every milestone a
 * fan of ghost futures exists; arrival is the argmax — one branch survives (the channel),
 * the rest evaporate and leave permanent faint scars. The channel gains caliber (width)
 * across the story and ends in an OPEN DELTA — the one fork never collapsed.
 *
 * Anti-dendrite discipline (the failure mode this redesign kills): fans exist ONLY at
 * nodes, are rooted at full channel width (min half-width 0.6 viewBox units), carry
 * narrative state (weight -> spread/length), and are never jittered noise — every curve
 * is a large-scale authored gesture with deterministic small variation.
 */

import { CX, PAD, hash01, type Centerline, type Pt } from "./geometry";

// ── Beat: the narrative schema (drama finally has a representation) ───────────
export type BloomKind = "ignition" | "collapse" | "surge" | "starburst" | "open";

export type Beat = {
  /** 0..1 narrative weight — drives fan spread/length, bloom size, bead size. */
  weight: number;
  /** Number of ghost futures fanning at this decision (0 = bloom only). */
  ghosts: number;
  /** Relative length of the segment LEAVING this beat (1 = base pitch). */
  run: number;
  /** Side the channel kinks toward at this node. */
  turn: -1 | 0 | 1;
  /** 0 = gentle bend … 1 = hairpin (drives excursion size + corner radius). */
  kink: number;
  /** 0..1 channel caliber AFTER this beat — steps up at the collapse. */
  caliber: number;
  /** Collapse bloom flavour (weight class of the arrival moment). */
  bloom: BloomKind;
};

// ── Constants ─────────────────────────────────────────────────────────────────
export const SEG_BASE = 34; // vertical pitch at run=1 (matches the old engine's rhythm)
const XMIN = 26; // node-x clamp: keeps cards + stems inside the LANE system
const XMAX = 74;
const SAMPLES = 512; // arc-length resample density (kinks need more than the old 240)

/** Channel core half-width from caliber (viewBox units). Aura layers scale this. */
export const coreHalfWidth = (caliber: number) => 0.55 + 2.05 * caliber;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / Math.max(1e-6, b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const norm = (p: Pt): Pt => {
  const m = Math.hypot(p.x, p.y) || 1;
  return { x: p.x / m, y: p.y / m };
};
const rot = (d: Pt, a: number): Pt => ({
  x: d.x * Math.cos(a) - d.y * Math.sin(a),
  y: d.x * Math.sin(a) + d.y * Math.cos(a),
});

// ── The authored /about score (7 beats — short·LONG·tight·wide·quick·sweep·open) ──
export const ABOUT_SCORE: Beat[] = [
  { weight: 0.55, ghosts: 2, run: 1.0, turn: 1, kink: 0.45, caliber: 0.18, bloom: "ignition" },
  { weight: 0.35, ghosts: 2, run: 1.7, turn: -1, kink: 0.25, caliber: 0.28, bloom: "collapse" },
  { weight: 0.8, ghosts: 3, run: 0.85, turn: 1, kink: 1.0, caliber: 0.42, bloom: "surge" },
  { weight: 1.0, ghosts: 5, run: 1.0, turn: -1, kink: 0.7, caliber: 0.8, bloom: "surge" },
  { weight: 0.5, ghosts: 1, run: 0.55, turn: -1, kink: 0.35, caliber: 0.8, bloom: "starburst" },
  { weight: 0.7, ghosts: 3, run: 1.2, turn: 1, kink: 0.5, caliber: 0.9, bloom: "collapse" },
  { weight: 1.0, ghosts: 5, run: 0.9, turn: 0, kink: 0.0, caliber: 1.0, bloom: "open" },
];

/** Procedural score for /work (N shipped systems). Deterministic rhythm: varied runs,
 *  occasional same-direction stair-steps, caliber ramping to full. `weights[i]` lets the
 *  adapter mark featured systems as heavy beats. */
export function scoreForCount(n: number, weights?: (number | undefined)[]): Beat[] {
  const RUNS = [1.0, 1.45, 0.8, 1.15, 0.9, 1.3];
  const beats: Beat[] = [];
  let turn: -1 | 1 = hash01("wk.first") > 0.5 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const h = (k: string) => hash01(`wk.${i}.${k}`);
    if (i > 0 && h("keep") < 0.78) turn = turn === 1 ? -1 : 1; // mostly alternate
    const w = weights?.[i] ?? 0.45 + h("w") * 0.4;
    const last = i === n - 1;
    beats.push({
      weight: last ? Math.max(w, 0.85) : w,
      ghosts: last ? 4 : 2 + Math.round(h("g") + w),
      run: RUNS[i % RUNS.length] * (0.95 + h("r") * 0.1),
      turn: last ? 0 : turn,
      kink: last ? 0 : 0.3 + h("k") * 0.55 + w * 0.15,
      caliber: n === 1 ? 1 : 0.3 + (0.7 * i) / (n - 1),
      bloom: last ? "open" : w > 0.72 ? "surge" : "collapse",
    });
  }
  return beats;
}

// ── Build output types ────────────────────────────────────────────────────────
export type Ghost = {
  /** Polyline from the node outward (root first). */
  pts: Pt[];
  /** Half-width at the root (tapers to ~0 at the tip). */
  rootW: number;
  /** Arc fraction of the owning node (the collapse clock). */
  frac: number;
  node: number;
};

export type Fan = { node: number; frac: number; ghosts: Ghost[] };

export type ArgmaxBuild = {
  /** Arc-length resampled centerline (pts / normals / nodeFrac / total). */
  line: Centerline;
  /** Per-sample channel core half-width, parallel to line.pts. */
  width: number[];
  nodes: Pt[];
  /** Card side per node (opposite the node's excursion). */
  sides: ("left" | "right")[];
  /** Decision fans at interior nodes (live before arrival, evaporate at it). */
  fans: Fan[];
  /** Post-collapse remains: truncated ghost stubs (permanent, faint). */
  scars: Ghost[];
  /** The final open fan — never collapses — plus dotted "still sampling" tails. */
  delta: { ghosts: Ghost[]; ticks: { p: Pt; k: number }[] };
  vbh: number;
};

// ── Node placement: the walk ──────────────────────────────────────────────────
function placeNodes(beats: Beat[]): Pt[] {
  const nodes: Pt[] = [];
  let y = PAD;
  for (let i = 0; i < beats.length; i++) {
    const b = beats[i];
    let x: number;
    if (i === 0) {
      x = CX + b.turn * lerp(6, 18, b.weight);
    } else {
      const amp = lerp(12, 38, beats[i].kink);
      const dir = b.turn === 0 ? (nodes[i - 1].x >= CX ? -0.35 : 0.35) : b.turn;
      x = clamp(nodes[i - 1].x + dir * amp, XMIN, XMAX);
    }
    nodes.push({ x, y });
    y += SEG_BASE * b.run;
  }
  return nodes;
}

// ── Centerline: bowed straights + rounded-corner kinks, arc-length resampled ──
type Dense = { p: Pt; len: number };

function quadratic(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
    y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
  };
}

function buildCenterline(nodes: Pt[], beats: Beat[]) {
  const dense: Dense[] = [];
  const nodeArc: number[] = new Array(nodes.length).fill(0);
  let acc = 0;
  const push = (p: Pt) => {
    if (dense.length) {
      const q = dense[dense.length - 1].p;
      acc += Math.hypot(p.x - q.x, p.y - q.y);
    }
    dense.push({ p, len: acc });
  };

  // Corner cut distances per interior node (kink -> radius), capped by segment lengths.
  const segLen = (i: number) =>
    Math.hypot(nodes[i + 1].x - nodes[i].x, nodes[i + 1].y - nodes[i].y);
  const cut: number[] = nodes.map((_, i) => {
    if (i === 0 || i === nodes.length - 1) return 0;
    const r = lerp(4.5, 0.7, beats[i].kink);
    return Math.min(r, segLen(i - 1) * 0.35, segLen(i) * 0.35);
  });

  for (let i = 0; i < nodes.length - 1; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    const d = norm({ x: b.x - a.x, y: b.y - a.y });
    const from = { x: a.x + d.x * cut[i], y: a.y + d.y * cut[i] };
    const to = { x: b.x - d.x * cut[i + 1], y: b.y - d.y * cut[i + 1] };

    // Lightning, not river: segments are near-straight strokes. A SUBTLE bow leaning
    // away from the next kink (the wind-up), and on LONG calm runs one stepped-leader
    // micro-kink — a single authored heading change, never jitter.
    const L = Math.hypot(to.x - from.x, to.y - from.y);
    const lean = i + 1 < beats.length ? -(beats[i + 1].turn || (hash01(`bow.${i}`) > 0.5 ? 1 : -1)) : 0;
    const mag = clamp(L * 0.025, 0.5, 1.3) * lean * (0.7 + 0.6 * hash01(`bow.m.${i}`));
    const perp = { x: -d.y, y: d.x };
    const emit = (p0: Pt, p1: Pt, bow: number, first: boolean) => {
      const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      const dd = norm({ x: p1.x - p0.x, y: p1.y - p0.y });
      const pp = { x: -dd.y, y: dd.x };
      const ctrl = {
        x: (p0.x + p1.x) / 2 + pp.x * bow * 2,
        y: (p0.y + p1.y) / 2 + pp.y * bow * 2,
      };
      const steps = Math.max(14, Math.round(len * 0.9));
      for (let s = first ? 0 : 1; s <= steps; s++) push(quadratic(p0, ctrl, p1, s / steps));
    };
    if (beats[i].run >= 1.35) {
      // stepped leader: one mid vertex, laterally offset, splitting the run in two strokes
      const at = lerp(0.42, 0.6, hash01(`step.${i}.t`));
      const off = lerp(2.2, 3.8, hash01(`step.${i}.o`)) * lean || 2.6;
      const mid = {
        x: from.x + (to.x - from.x) * at + perp.x * off,
        y: from.y + (to.y - from.y) * at + perp.y * off,
      };
      emit(from, mid, mag * 0.4, i === 0);
      emit(mid, to, -mag * 0.4, false);
    } else {
      emit(from, to, mag, i === 0);
    }
    if (i === 0) nodeArc[0] = 0;

    // Rounded kink through node i+1 (quadratic with the node as control -> the curve
    // grazes the node at t=0.5; that graze point is the node's arc anchor).
    if (i + 1 < nodes.length - 1) {
      const c = nodes[i + 1];
      const dn = norm({ x: nodes[i + 2].x - c.x, y: nodes[i + 2].y - c.y });
      const out = { x: c.x + dn.x * cut[i + 1], y: c.y + dn.y * cut[i + 1] };
      const csteps = 14;
      for (let s = 1; s <= csteps; s++) {
        push(quadratic(to, c, out, s / csteps));
        if (s === csteps / 2) nodeArc[i + 1] = acc;
      }
    } else {
      nodeArc[i + 1] = acc;
    }
  }

  // Arc-length resample.
  const total = acc || 1;
  const pts: Pt[] = [];
  let di = 0;
  for (let s = 0; s < SAMPLES; s++) {
    const target = (s / (SAMPLES - 1)) * total;
    while (di < dense.length - 2 && dense[di + 1].len < target) di++;
    const d0 = dense[di];
    const d1 = dense[di + 1] ?? d0;
    const seg = Math.max(1e-6, d1.len - d0.len);
    const f = (target - d0.len) / seg;
    pts.push({ x: d0.p.x + (d1.p.x - d0.p.x) * f, y: d0.p.y + (d1.p.y - d0.p.y) * f });
  }
  const normals: Pt[] = [];
  for (let s = 0; s < SAMPLES; s++) {
    const a = pts[Math.max(0, s - 1)];
    const b = pts[Math.min(SAMPLES - 1, s + 1)];
    const t = norm({ x: b.x - a.x, y: b.y - a.y });
    normals.push({ x: -t.y, y: t.x });
  }
  const line: Centerline = { pts, normals, nodeFrac: nodeArc.map((v) => v / total), total };
  return line;
}

/** Per-sample core half-width: caliber steps up right AFTER each node (at the collapse),
 *  with tip tapers at both ends of the bolt. */
function widthProfile(line: Centerline, beats: Beat[]): number[] {
  const { nodeFrac } = line;
  return line.pts.map((_, k) => {
    const u = k / (SAMPLES - 1);
    let i = 0;
    for (let j = 0; j < nodeFrac.length; j++) if (u >= nodeFrac[j]) i = j;
    const prev = coreHalfWidth(beats[Math.max(0, i - 1)].caliber);
    const next = coreHalfWidth(beats[i].caliber);
    let w = lerp(prev, next, smooth(nodeFrac[i], nodeFrac[i] + 0.035, u));
    // spark-point tips
    w *= smooth(0, 0.025, u) * 0.85 + 0.15;
    w *= 1 - 0.35 * smooth(0.985, 1, u);
    return w;
  });
}

/** Channel half-width at arc fraction u (for fan roots / poster beads). */
export function widthAtFrac(width: number[], u: number): number {
  const x = clamp(u, 0, 1) * (width.length - 1);
  const i = Math.min(width.length - 2, Math.floor(x));
  return lerp(width[i], width[i + 1], x - i);
}

// ── Ghost fans: the futures that existed ──────────────────────────────────────
function buildGhost(
  seedKey: string,
  node: Pt,
  baseDir: Pt,
  angle: number,
  len: number,
  curlSign: number,
  rootW: number,
  frac: number,
  nodeIdx: number,
): Ghost {
  const steps = 3;
  const pts: Pt[] = [{ ...node }];
  let dir = rot(baseDir, angle);
  let cx = node.x;
  let cy = node.y;
  const curl = lerp(0.08, 0.24, hash01(`${seedKey}.curl`)) * curlSign;
  for (let s = 1; s <= steps; s++) {
    if (s > 1) dir = rot(dir, curl);
    cx += (dir.x * len) / steps;
    cy += (dir.y * len) / steps;
    pts.push({ x: cx, y: cy });
  }
  return { pts, rootW, frac, node: nodeIdx };
}

function buildFans(nodes: Pt[], beats: Beat[], line: Centerline, width: number[]) {
  const fans: Fan[] = [];
  const scars: Ghost[] = [];
  const n = nodes.length;

  for (let i = 0; i < n - 1; i++) {
    const b = beats[i];
    if (b.ghosts <= 0) continue;
    const node = nodes[i];
    const dirOut = norm({ x: nodes[i + 1].x - node.x, y: nodes[i + 1].y - node.y });
    const dirIn = i === 0 ? { x: 0, y: 1 } : norm({ x: node.x - nodes[i - 1].x, y: node.y - nodes[i - 1].y });
    // Fan center: between "keep going" (dirIn) and "what was chosen" (dirOut).
    const center = norm({ x: dirIn.x + dirOut.x, y: dirIn.y + dirOut.y });
    const spread = lerp(0.35, 1.1, b.weight);
    const chosenAng = Math.atan2(
      dirOut.x * center.y - dirOut.y * center.x,
      dirOut.x * center.x + dirOut.y * center.y,
    );

    const rootW = Math.max(0.6, widthAtFrac(width, Math.max(0, line.nodeFrac[i] - 0.002)) * 0.9);
    const ghosts: Ghost[] = [];
    const slots = b.ghosts + 1; // one slot is the survivor (the real channel)
    let placed = 0;
    for (let s = 0; s < slots && placed < b.ghosts; s++) {
      const a0 = slots === 1 ? 0 : -spread + (2 * spread * s) / (slots - 1);
      if (Math.abs(a0 - chosenAng) < 0.16) continue; // keep-out: the survivor's cone
      const a = a0 + lerp(-0.05, 0.05, hash01(`fan.${i}.${s}.a`));
      const len = lerp(9, 20, b.weight) * (0.85 + 0.3 * hash01(`fan.${i}.${s}.l`));
      const g = buildGhost(
        `fan.${i}.${s}`,
        node,
        center,
        a,
        len,
        Math.sign(a - chosenAng) || 1,
        rootW,
        line.nodeFrac[i],
        i,
      );
      ghosts.push(g);
      placed++;
    }
    fans.push({ node: i, frac: line.nodeFrac[i], ghosts });

    // Scars: the first ~45% of each ghost, permanent + faint after the collapse.
    for (const g of ghosts) {
      const cutIdx = Math.max(2, Math.ceil(g.pts.length * 0.45));
      scars.push({ ...g, pts: g.pts.slice(0, cutIdx + 1), rootW: g.rootW * 0.8 });
    }
  }
  return { fans, scars };
}

function buildDelta(nodes: Pt[], beats: Beat[], line: Centerline, width: number[]) {
  const i = nodes.length - 1;
  const b = beats[i];
  const node = nodes[i];
  const dirIn =
    i === 0 ? { x: 0, y: 1 } : norm({ x: node.x - nodes[i - 1].x, y: node.y - nodes[i - 1].y });
  const spread = 1.15;
  const count = Math.max(2, b.ghosts);
  const rootW = Math.max(0.7, widthAtFrac(width, 0.995) * 0.95);
  const ghosts: Ghost[] = [];
  const ticks: { p: Pt; k: number }[] = [];

  for (let s = 0; s < count; s++) {
    const a = count === 1 ? 0 : -spread + (2 * spread * s) / (count - 1);
    const len = lerp(16, 26, b.weight) * (0.85 + 0.3 * hash01(`delta.${s}.l`));
    const g = buildGhost(`delta.${s}`, node, dirIn, a, len * 0.6, Math.sign(a) || 1, rootW, 1, i);
    ghosts.push(g);
    // Dotted "still sampling" tail: quantized ticks continuing past the solid stub.
    const tipA = g.pts[g.pts.length - 2];
    const tipB = g.pts[g.pts.length - 1];
    const d = norm({ x: tipB.x - tipA.x, y: tipB.y - tipA.y });
    const nTicks = 4 + Math.round(hash01(`delta.${s}.n`) * 2);
    for (let k = 1; k <= nTicks; k++) {
      const dd = rot(d, 0.06 * k * (Math.sign(a) || 1));
      ticks.push({
        p: { x: tipB.x + dd.x * (len * 0.4 * k) / nTicks, y: tipB.y + dd.y * (len * 0.4 * k) / nTicks },
        k,
      });
    }
  }
  return { ghosts, ticks };
}

// ── The build ─────────────────────────────────────────────────────────────────
export function buildArgmax(beats: Beat[]): ArgmaxBuild {
  const n = beats.length;
  if (n === 0) {
    const empty: Centerline = { pts: [], normals: [], nodeFrac: [], total: 0 };
    return { line: empty, width: [], nodes: [], sides: [], fans: [], scars: [], delta: { ghosts: [], ticks: [] }, vbh: PAD * 2 };
  }
  const nodes = placeNodes(beats);
  if (n === 1) {
    const p = nodes[0];
    const line: Centerline = {
      pts: Array.from({ length: SAMPLES }, () => ({ ...p })),
      normals: Array.from({ length: SAMPLES }, () => ({ x: 1, y: 0 })),
      nodeFrac: [0],
      total: 0,
    };
    const width = line.pts.map(() => coreHalfWidth(beats[0].caliber));
    return {
      line,
      width,
      nodes,
      sides: [p.x >= CX ? "left" : "right"],
      fans: [],
      scars: [],
      delta: buildDelta(nodes, beats, line, width),
      vbh: PAD * 2,
    };
  }

  const line = buildCenterline(nodes, beats);
  const width = widthProfile(line, beats);
  const { fans, scars } = buildFans(nodes, beats, line, width);
  const delta = buildDelta(nodes, beats, line, width);
  const sides = nodes.map((p): "left" | "right" => (p.x >= CX ? "left" : "right"));
  const vbh = PAD * 2 + beats.slice(0, -1).reduce((s, b) => s + b.run * SEG_BASE, 0);

  return { line, width, nodes, sides, fans, scars, delta, vbh };
}

// ── SVG path builders (pure string helpers for the poster) ────────────────────
/** Closed tapered polygon around a polyline: per-point half-widths. */
export function taperedPolygon(pts: Pt[], w: (t: number) => number): string {
  if (pts.length < 2) return "";
  const L: Pt[] = [];
  const R: Pt[] = [];
  for (let s = 0; s < pts.length; s++) {
    const a = pts[Math.max(0, s - 1)];
    const b = pts[Math.min(pts.length - 1, s + 1)];
    const t = norm({ x: b.x - a.x, y: b.y - a.y });
    const hw = w(s / (pts.length - 1));
    L.push({ x: pts[s].x - t.y * hw, y: pts[s].y + t.x * hw });
    R.push({ x: pts[s].x + t.y * hw, y: pts[s].y - t.x * hw });
  }
  const fwd = L.map((p, k) => `${k === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
  const back = R.reverse()
    .map((p) => `L ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  return `${fwd} ${back} Z`;
}

/** The channel body as a closed polygon (scale multiplies the width profile). */
export function channelPolygon(line: Centerline, width: number[], scale: number): string {
  const pts = line.pts;
  if (pts.length < 2) return "";
  const L: string[] = [];
  const R: string[] = [];
  for (let s = 0; s < pts.length; s += 2) {
    const p = pts[s];
    const nrm = line.normals[s];
    const hw = width[s] * scale;
    L.push(`${L.length === 0 ? "M" : "L"} ${(p.x + nrm.x * hw).toFixed(2)} ${(p.y + nrm.y * hw).toFixed(2)}`);
    R.push(`L ${(p.x - nrm.x * hw).toFixed(2)} ${(p.y - nrm.y * hw).toFixed(2)}`);
  }
  return `${L.join(" ")} ${R.reverse().join(" ")} Z`;
}

/** Ghost path as a tapered polygon (root = channel width, tip ~ 0). */
export const ghostPolygon = (g: Ghost, wScale = 1) =>
  taperedPolygon(g.pts, (t) => Math.max(0.05, g.rootW * wScale * (1 - t * 0.94)));

/** Plain polyline `d` for scars / thin strokes. */
export const polylineD = (pts: Pt[]) =>
  pts.map((p, k) => `${k === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
