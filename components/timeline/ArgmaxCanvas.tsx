"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";
import { CX, hash01, type Pt, type StarPlot, type BridgePlot, type SpurPlot } from "./geometry";
import { type ArgmaxBuild, type Beat, type Ghost, widthAtFrac } from "./argmax";

silenceThreeClockDeprecation();

/**
 * ArgmaxCanvas — the "ARGMAX / Paths Not Taken" WebGL set-piece (see
 * TIMELINE_IMPLEMENTATION.md). The bolt is DECODED live: ahead of the head the future
 * exists only as quantized token ticks; behind it the channel is continuous light. The
 * scroll clock is WARPED — slow leaving each decision, accelerating into the next kink
 * (derivative capped ~1.6×), with fixed points at every node so head, blooms and DOM
 * cards agree exactly at arrivals. Arrival fires an asymmetric one-time bloom (sharp
 * attack, slow release — never a symmetric pre-fire) and a return-stroke pulse that runs
 * ~6% ahead into the chosen segment. Everything is a pure function of progress
 * (scrub-safe, reversible); the head's comet tail is the one velocity-aware touch, and
 * it always lags BEHIND the direction of travel.
 *
 * Same rendering idiom as the rest of the site: HDR-style ADDITIVE glow (no post
 * bloom pass — the canvas stays transparent over the page's LatentField), centerline
 * baked into a float DataTexture sampled in vertex shaders, all per-frame work =
 * uniform writes. NO random dendrites — every stroke on screen carries narrative state.
 * Ghost fans / evaporation / scars land in Act 2 (Phase 4).
 */

const COL_A = "#6b7cff"; // indigo
const COL_B = "#8b7cff"; // violet
const COL_C = "#67e8f9"; // cyan
const PARTICLES = 1200;
const HEAD = 16;
const TICKS = 110;
const EVAP = 600;
const MAX_NODES = 24;

export type ArgmaxCanvasProps = {
  vbw: number;
  vbh: number;
  build: ArgmaxBuild;
  beats: Beat[];
  stars: StarPlot[];
  spurs: SpurPlot[];
  bridges: BridgePlot[];
  progressRef: React.RefObject<number>;
  /** Attention masking (/work filter): mask[i]=1 dims node i's bloom and collapses its
   *  live fan to a scar. Smoothed per-frame on the GPU clock — never a hard pop. */
  mask?: number[];
  /** false = keep the context alive but stop the frameloop (off-view pause). */
  running?: boolean;
  /** Fires once after the first real frames render (poster fade handoff). */
  onLive?: () => void;
};

// ── geometry helpers (ribbon quad-strips, shared idiom) ───────────────────────
function computeNormals(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (let s = 0; s < pts.length; s++) {
    const a = pts[Math.max(0, s - 1)];
    const b = pts[Math.min(pts.length - 1, s + 1)];
    const tx = b.x - a.x;
    const ty = b.y - a.y;
    const m = Math.hypot(tx, ty) || 1;
    out.push({ x: -ty / m, y: tx / m });
  }
  return out;
}

function sampleQuadratic(a: Pt, c: Pt, b: Pt, n = 16): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const mt = 1 - t;
    out.push({
      x: mt * mt * a.x + 2 * mt * t * c.x + t * t * b.x,
      y: mt * mt * a.y + 2 * mt * t * c.y + t * t * b.y,
    });
  }
  return out;
}

export type RibbonSpec = {
  pts: Pt[];
  normals: Pt[];
  wCore: (u: number) => number;
  wAura: (u: number) => number;
  lit: (u: number) => number;
  tip: (u: number) => number;
  colT: (u: number) => number;
  /** Owning milestone for masking (-1 = the channel itself, never masked). */
  node?: number;
};

export function buildRibbon(specs: RibbonSpec[], vbh: number, mode: "core" | "aura") {
  const pos: number[] = [];
  const u: number[] = [];
  const side: number[] = [];
  const lit: number[] = [];
  const tip: number[] = [];
  const colT: number[] = [];
  const nodeA: number[] = [];
  const idx: number[] = [];
  let vcount = 0;

  for (const spec of specs) {
    const M = spec.pts.length;
    if (M < 2) continue;
    const base = vcount;
    const nd = spec.node ?? -1;
    for (let s = 0; s < M; s++) {
      const p = spec.pts[s];
      const nrm = spec.normals[s];
      const t = s / (M - 1);
      const hw = mode === "core" ? spec.wCore(t) : spec.wAura(t);
      const wx = p.x;
      const wy = vbh - p.y;
      const nx = nrm.x;
      const ny = -nrm.y;
      const lf = spec.lit(t);
      const tf = spec.tip(t);
      const ct = spec.colT(t);
      pos.push(wx + nx * hw, wy + ny * hw, 0);
      u.push(t); side.push(1); lit.push(lf); tip.push(tf); colT.push(ct); nodeA.push(nd);
      pos.push(wx - nx * hw, wy - ny * hw, 0);
      u.push(t); side.push(-1); lit.push(lf); tip.push(tf); colT.push(ct); nodeA.push(nd);
    }
    for (let s = 0; s < M - 1; s++) {
      const i0 = base + s * 2;
      idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
    }
    vcount += M * 2;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aU", new THREE.Float32BufferAttribute(u, 1));
  g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute("aLit", new THREE.Float32BufferAttribute(lit, 1));
  g.setAttribute("aTip", new THREE.Float32BufferAttribute(tip, 1));
  g.setAttribute("aColT", new THREE.Float32BufferAttribute(colT, 1));
  g.setAttribute("aNode", new THREE.Float32BufferAttribute(nodeA, 1));
  g.setIndex(idx);
  return g;
}

/** Ghost fans / scars: tapered ribbons carrying their node's arc-fraction (the collapse
 *  clock) and their ROOT (so the vertex shader can scale/expand around it). */
function buildGhostRibbon(ghosts: Ghost[], vbh: number, open: (g: Ghost) => boolean) {
  const pos: number[] = [];
  const u: number[] = [];
  const side: number[] = [];
  const lit: number[] = [];
  const colT: number[] = [];
  const isOpen: number[] = [];
  const root: number[] = [];
  const nodeA: number[] = [];
  const idx: number[] = [];
  let vcount = 0;

  for (const g of ghosts) {
    const M = g.pts.length;
    if (M < 2) continue;
    const normals = computeNormals(g.pts);
    const base = vcount;
    const rx = g.pts[0].x;
    const ry = vbh - g.pts[0].y;
    const op = open(g) ? 1 : 0;
    for (let s = 0; s < M; s++) {
      const t = s / (M - 1);
      // wide enough to hold the aura falloff; the frag shapes the core inside it
      const hw = Math.max(0.08, g.rootW * 2.0 * (1 - t * 0.9));
      const wx = g.pts[s].x;
      const wy = vbh - g.pts[s].y;
      const nx = normals[s].x;
      const ny = -normals[s].y;
      pos.push(wx + nx * hw, wy + ny * hw, 0);
      u.push(t); side.push(1); lit.push(g.frac); colT.push(g.frac); isOpen.push(op); root.push(rx, ry); nodeA.push(g.node);
      pos.push(wx - nx * hw, wy - ny * hw, 0);
      u.push(t); side.push(-1); lit.push(g.frac); colT.push(g.frac); isOpen.push(op); root.push(rx, ry); nodeA.push(g.node);
    }
    for (let s = 0; s < M - 1; s++) {
      const i0 = base + s * 2;
      idx.push(i0, i0 + 1, i0 + 2, i0 + 1, i0 + 3, i0 + 2);
    }
    vcount += M * 2;
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aU", new THREE.Float32BufferAttribute(u, 1));
  g.setAttribute("aSide", new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute("aLit", new THREE.Float32BufferAttribute(lit, 1));
  g.setAttribute("aColT", new THREE.Float32BufferAttribute(colT, 1));
  g.setAttribute("aOpen", new THREE.Float32BufferAttribute(isOpen, 1));
  g.setAttribute("aRoot", new THREE.Float32BufferAttribute(root, 2));
  g.setAttribute("aNode", new THREE.Float32BufferAttribute(nodeA, 1));
  g.setIndex(idx);
  return g;
}

function makeRadial(inner: string, hot = 1): THREE.CanvasTexture {
  const S = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = S;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, `rgba(255,255,255,${hot})`);
  g.addColorStop(0.18, inner);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

// ── the warp clock (CPU): slow leaving a node, accelerating into the next ─────
/** warp(f_i) = f_i exactly (cards/blooms/head agree at nodes); within a segment the
 *  local time is t^γ with γ = lerp(1.2, 1.6, weight of the segment's DESTINATION) —
 *  derivative capped at γ ≤ 1.6, zero at departure (the exhale). */
export function makeWarp(nodeFrac: number[], beats: Beat[]) {
  return (p: number) => {
    const n = nodeFrac.length;
    if (n < 2) return p;
    const x = Math.min(Math.max(p, 0), 1);
    let i = 0;
    while (i < n - 2 && nodeFrac[i + 1] < x) i++;
    const f0 = nodeFrac[i];
    const f1 = nodeFrac[i + 1];
    const span = Math.max(1e-6, f1 - f0);
    const t = Math.min(Math.max((x - f0) / span, 0), 1);
    const g = 1.2 + 0.4 * (beats[i + 1]?.weight ?? 0.5);
    return f0 + span * Math.pow(t, g);
  };
}

// ── shaders ───────────────────────────────────────────────────────────────────
// per-node attention-mask lookup (vertex-shader only: ES 1.0 forbids dynamic uniform
// array indexing in fragments). aNode < 0 (the channel) is never masked.
const MASK_SAMPLE = /* glsl */ `
  uniform float uMask[${MAX_NODES}];
  float maskAt(float nodeIdx){
    if (nodeIdx < 0.0) return 0.0;
    return uMask[int(nodeIdx + 0.5)];
  }
`;
const RIBBON_VERT = /* glsl */ `
  attribute float aU; attribute float aSide; attribute float aLit; attribute float aTip; attribute float aColT; attribute float aNode;
  varying float vU; varying float vSide; varying float vLit; varying float vTip; varying float vColT; varying float vMask;
  ${MASK_SAMPLE}
  void main() {
    vU = aU; vSide = aSide; vLit = aLit; vTip = aTip; vColT = aColT;
    vMask = maskAt(aNode);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const RIBBON_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime, uWp, uMode;
  uniform vec3 uColA, uColB, uColC;
  uniform float uNodeFrac[${MAX_NODES}];
  uniform float uNodeW[${MAX_NODES}];
  uniform int uNodeCount;
  varying float vU; varying float vSide; varying float vLit; varying float vTip; varying float vColT; varying float vMask;
  vec3 ramp(float t){ t = clamp(t,0.0,1.0); return t < 0.5 ? mix(uColA,uColB,t*2.0) : mix(uColB,uColC,(t-0.5)*2.0); }
  void main(){
    float across = abs(vSide);
    float core = smoothstep(0.62, 0.0, across);
    float aura = exp(-across * across * 2.6);
    float f1 = 0.5 + 0.5 * sin(vU * 70.0 - uTime * 2.4 + vSide * 2.5);
    float f2 = 0.5 + 0.5 * sin(vU * 33.0 + uTime * 1.5 - vSide * 1.2);
    float fil = mix(f1, f2, 0.5);
    vec3 col = ramp(vColT);
    col = mix(col, vec3(1.0), core * core * 0.72);
    // decoded vs not-yet-decoded: the future is near-dark (token ticks carry it)
    float lit = 1.0 - smoothstep(uWp, uWp + 0.04, vLit);
    float front = exp(-pow((vLit - uWp) / 0.016, 2.0)) * 2.1;
    // return strokes: after each arrival a bright packet runs ~6% into the chosen path
    float rs = 0.0;
    for (int i = 0; i < ${MAX_NODES}; i++) {
      if (i >= uNodeCount) break;
      float f = uNodeFrac[i];
      float prog = clamp((uWp - f) / 0.02, 0.0, 1.0);
      float env = prog * (1.0 - prog) * 4.0;
      rs += exp(-pow((vLit - (f + 0.06 * prog)) / 0.01, 2.0)) * env * uNodeW[i];
    }
    float bright = (mix(0.13, 1.0, lit) + front + rs * 1.6) * mix(1.0, 0.22, vMask);
    float shape = mix(core, aura * 0.8, uMode);
    float a = shape * bright * vTip * (0.75 + 0.25 * fil);
    gl_FragColor = vec4(col * bright, a);
  }
`;
const GLINT_VERT = /* glsl */ `
  attribute float aSize; attribute float aColT; attribute float aFrac; attribute float aTwinkle; attribute float aNode;
  uniform float uWp, uTime, uPixelRatio;
  varying float vB; varying float vColT;
  ${MASK_SAMPLE}
  void main(){
    float lit = smoothstep(aFrac, aFrac + 0.015, uWp);
    // asymmetric one-time flare: sharp attack, slow release (pure in uWp -> reversible)
    float d = uWp - aFrac;
    float pulse = exp(-pow(min(d, 0.0) / 0.005, 2.0)) * exp(-pow(max(d, 0.0) / 0.03, 2.0));
    float tw = 0.78 + 0.22 * sin(uTime * aTwinkle + aColT * 30.0);
    float dim = mix(1.0, 0.22, maskAt(aNode));
    vB = ((0.26 + 0.85 * lit) * tw + pulse * 1.9) * dim;
    vColT = aColT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.5 + 0.55 * lit + 0.75 * pulse) * mix(1.0, 0.8, maskAt(aNode));
  }
`;
const POINT_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec3 uColA, uColB, uColC;
  varying float vB; varying float vColT;
  vec3 ramp(float t){ t = clamp(t,0.0,1.0); return t < 0.5 ? mix(uColA,uColB,t*2.0) : mix(uColB,uColC,(t-0.5)*2.0); }
  void main(){
    vec4 tex = texture2D(uTex, gl_PointCoord);
    vec3 c = mix(ramp(vColT), vec3(1.0), 0.4);
    gl_FragColor = vec4(c * vB, tex.a * clamp(vB, 0.0, 1.6));
  }
`;
// shared centerline-texture sampler (manual lerp -> no float-linear extension needed)
const CL_SAMPLE = /* glsl */ `
  uniform sampler2D uClTex; uniform float uTexSize;
  vec4 clAt(float s){
    float fx = clamp(s, 0.0, 1.0) * (uTexSize - 1.0);
    float i0 = floor(fx); float f = fx - i0;
    vec4 c0 = texture2D(uClTex, vec2((i0 + 0.5) / uTexSize, 0.5));
    vec4 c1 = texture2D(uClTex, vec2((i0 + 1.5) / uTexSize, 0.5));
    return mix(c0, c1, f);
  }
`;
const FLOW_VERT = /* glsl */ `
  attribute float aSeed; attribute float aSpeed; attribute float aLat; attribute float aSize; attribute float aColT;
  uniform float uTime, uWp, uPixelRatio;
  varying float vB; varying float vColT;
  ${CL_SAMPLE}
  void main(){
    float s = fract(aSeed + uTime * aSpeed);
    vec4 cl = clAt(s);
    float wob = aLat * (0.6 + 0.4 * sin(uTime * 2.0 + aSeed * 30.0));
    vec2 pos = cl.xy + cl.zw * wob;
    // current flows ONLY through the decoded channel — nothing streams in the future
    float decoded = 1.0 - smoothstep(uWp - 0.004, uWp + 0.008, s);
    vB = decoded * (0.5 + 0.5 * sin(uTime * 3.0 + aSeed * 50.0)) * 0.9;
    vColT = aColT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.5 + vB);
  }
`;
// The decoding head: hot core + a comet tail that lags BEHIND the direction of travel.
const HEAD_VERT = /* glsl */ `
  attribute float aIndex; attribute float aSize; attribute float aBase;
  uniform float uTime, uWp, uTailDir, uSpeed, uJitter, uPixelRatio;
  varying float vB; varying float vColT;
  ${CL_SAMPLE}
  void main(){
    float back = aIndex * (0.0038 + 0.028 * uSpeed);
    float s = clamp(uWp - back * uTailDir, 0.0, 1.0);
    vec4 cl = clAt(s);
    float on = smoothstep(0.0, 0.006, uWp) * 0.4 + 0.6; // breathe in, never pop
    float flick = 1.0 + uJitter * 0.24 * sin(uTime * 34.0 + aIndex * 3.7);
    vB = aBase * on * flick;
    vColT = 0.92;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(cl.xy, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.55 + 0.5 * vB);
  }
`;
// Token ticks: the future, quantized. Erased (overwritten into light) as the head passes.
const TICK_VERT = /* glsl */ `
  attribute float aFrac; attribute float aSize;
  uniform float uTime, uWp, uPixelRatio;
  varying float vB; varying float vColT;
  ${CL_SAMPLE}
  void main(){
    vec4 cl = clAt(aFrac);
    float ahead = smoothstep(0.006, 0.028, aFrac - uWp);
    float near = exp(-pow((aFrac - uWp - 0.04) / 0.035, 2.0));
    vB = ahead * (0.16 + 0.34 * near) * (0.8 + 0.2 * sin(uTime * 2.0 + aFrac * 90.0));
    vColT = aFrac;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(cl.xy, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.75 + 0.6 * near);
  }
`;

// Ghost fans (uScar=0) and scars (uScar=1) share one shader pair. Everything is a pure
// function of uWp: approach -> the distribution becomes visible; arrival -> flash +
// outward evaporation; after -> only the scar remains. The open delta (aOpen=1) never
// collapses — it breathes.
const GHOST_VERT = /* glsl */ `
  attribute float aU; attribute float aSide; attribute float aLit; attribute float aColT; attribute float aOpen; attribute float aNode;
  attribute vec2 aRoot;
  uniform float uWp, uScar;
  varying float vU; varying float vSide; varying float vColT; varying float vOpen;
  varying float vAppr; varying float vEvap; varying float vD; varying float vMask;
  ${MASK_SAMPLE}
  void main(){
    vU = aU; vSide = aSide; vColT = aColT; vOpen = aOpen;
    vMask = maskAt(aNode);
    float d = uWp - aLit; // delta ghosts carry aLit=1 -> d <= 0 always (never collapse)
    vD = d;
    vAppr = smoothstep(-0.09, 0.0, d);
    vEvap = (1.0 - uScar) * (1.0 - aOpen) * smoothstep(0.0, 0.024, d);
    vec2 fromRoot = position.xy - aRoot;
    float scale = 1.0 + (1.0 - uScar) * (0.12 * vAppr + 0.6 * vEvap);
    vec2 pos = aRoot + fromRoot * scale;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
  }
`;
const GHOST_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime, uScar;
  uniform vec3 uColA, uColB, uColC;
  varying float vU; varying float vSide; varying float vColT; varying float vOpen;
  varying float vAppr; varying float vEvap; varying float vD; varying float vMask;
  vec3 ramp(float t){ t = clamp(t,0.0,1.0); return t < 0.5 ? mix(uColA,uColB,t*2.0) : mix(uColB,uColC,(t-0.5)*2.0); }
  void main(){
    float across = abs(vSide);
    float core = smoothstep(0.55, 0.0, across);
    float aura = exp(-across * across * 2.4);
    float shape = core + aura * 0.55;
    // arrival flash: sharp attack, quick release — the collapse
    float flash = exp(-pow(min(vD, 0.0) / 0.006, 2.0)) * exp(-pow(max(vD, 0.0) / 0.014, 2.0));
    float breathe = vOpen * (0.5 + 0.5 * sin(uTime * 0.9 + vColT * 24.0 + vU * 3.0));
    float live = (0.06 + 0.6 * vAppr + 0.14 * breathe) * (1.0 - vEvap) + flash * 1.5 * (1.0 - vOpen);
    float scar = 0.3 * smoothstep(0.0, 0.02, vD);
    float b = mix(live, scar, uScar);
    // attention masking: a masked node's live fan reads as a scar, its scar dims
    b *= mix(1.0, mix(0.15, 0.5, uScar), vMask);
    float tipFade = 1.0 - vU * (0.5 + 0.35 * (1.0 - vOpen));
    vec3 col = ramp(vColT);
    col = mix(col, vec3(1.0), core * 0.35 + flash * 0.3);
    gl_FragColor = vec4(col * (b * 1.15), shape * b * tipFade);
  }
`;
// Evaporation dust: the rejected futures blowing away. One burst per collapse, pure in
// uWp (scrubbing back replays the recording in reverse).
const EVAP_VERT = /* glsl */ `
  attribute float aFrac; attribute float aSeed; attribute float aSize; attribute float aColT; attribute float aNode;
  attribute vec2 aDir;
  uniform float uTime, uWp, uPixelRatio;
  varying float vB; varying float vColT;
  ${MASK_SAMPLE}
  void main(){
    float d = uWp - aFrac;
    float w = clamp(d / 0.05, 0.0, 1.0);
    float env = smoothstep(0.0, 0.12, w) * (1.0 - smoothstep(0.25, 1.0, w));
    vec2 pos = position.xy + aDir * w * (5.0 + 7.0 * aSeed);
    vB = env * (0.9 + 0.8 * aSeed) * (1.0 - 0.85 * maskAt(aNode));
    vColT = aColT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (1.0 - 0.7 * w) * (0.4 + vB);
  }
`;
// Delta ticks: the quantized "still sampling" trail past the open fork (finale only).
const DTICK_VERT = /* glsl */ `
  attribute float aPhase; attribute float aSize;
  uniform float uTime, uWp, uPixelRatio;
  varying float vB; varying float vColT;
  void main(){
    float end = smoothstep(0.9, 0.995, uWp);
    vB = end * (0.4 + 0.3 * sin(uTime * 1.3 + aPhase * 6.2832));
    vColT = 0.95;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.6 + 0.5 * vB);
  }
`;

const ADDITIVE = {
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
} as const;

// ── scene ─────────────────────────────────────────────────────────────────────
function Scene({ vbw, vbh, build, beats, stars, spurs, bridges, progressRef, mask, onLive }: ArgmaxCanvasProps) {
  const gl = useThree((s) => s.gl);
  const px = useMemo(() => gl.getPixelRatio(), [gl]);
  const liveTicks = useRef(0);

  const { line, width, nodes } = build;
  const nodeFrac = line.nodeFrac;

  const colA = useMemo(() => new THREE.Color(COL_A), []);
  const colB = useMemo(() => new THREE.Color(COL_B), []);
  const colC = useMemo(() => new THREE.Color(COL_C), []);
  const softTex = useMemo(() => makeRadial("rgba(140,170,255,0.55)", 0.8), []);
  const hotTex = useMemo(() => makeRadial("rgba(103,232,249,0.9)", 1), []);

  // centerline baked into a float texture (RG = world pos, BA = world normal)
  const clTex = useMemo(() => {
    const M = line.pts.length;
    const data = new Float32Array(M * 4);
    for (let i = 0; i < M; i++) {
      const p = line.pts[i];
      const nr = line.normals[i];
      data[i * 4] = p.x;
      data[i * 4 + 1] = vbh - p.y;
      data[i * 4 + 2] = nr.x;
      data[i * 4 + 3] = -nr.y;
    }
    const tex = new THREE.DataTexture(data, M, 1, THREE.RGBAFormat, THREE.FloatType);
    tex.minFilter = THREE.NearestFilter;
    tex.magFilter = THREE.NearestFilter;
    tex.needsUpdate = true;
    return tex;
  }, [line, vbh]);
  const texSize = line.pts.length;

  // node uniforms (return strokes + Act 2 collapse state)
  const nodeArrays = useMemo(() => {
    const frac = new Float32Array(MAX_NODES);
    const w = new Float32Array(MAX_NODES);
    for (let i = 0; i < Math.min(MAX_NODES, nodeFrac.length); i++) {
      frac[i] = nodeFrac[i];
      w[i] = beats[i]?.weight ?? 0.5;
    }
    return { frac, w, count: Math.min(MAX_NODES, nodeFrac.length) };
  }, [nodeFrac, beats]);

  // Attention mask: each material owns a uMask Float32Array; useFrame eases the shared
  // smoothed state toward the target and copies it in, so filtering never pops.
  const maskTarget = useRef<number[] | undefined>(undefined);
  const maskSmooth = useRef<Float32Array | null>(null);
  useEffect(() => {
    maskTarget.current = mask;
  }, [mask]);

  // ── ribbons: the channel (caliber-varying) + knowledge-graph spurs/bridges ──
  const { coreGeo, auraGeo } = useMemo(() => {
    const specs: RibbonSpec[] = [];
    specs.push({
      pts: line.pts,
      normals: line.normals,
      wCore: (t) => widthAtFrac(width, t),
      wAura: (t) => widthAtFrac(width, t) * 2.6,
      lit: (t) => t,
      tip: () => 1,
      colT: (t) => t,
    });
    for (const sp of spurs) {
      const mid = { x: (sp.a.x + sp.b.x) / 2, y: (sp.a.y + sp.b.y) / 2 };
      const q = sampleQuadratic(sp.a, mid, sp.b, 12);
      specs.push({
        pts: q,
        normals: computeNormals(q),
        wCore: () => 0.28,
        wAura: () => 0.55,
        lit: () => nodeFrac[sp.milestone] ?? 1,
        tip: (t) => 1 - t * 0.35,
        colT: () => nodeFrac[sp.milestone] ?? 1,
        node: sp.milestone,
      });
    }
    for (const br of bridges) {
      const cxp = br.a.x > CX && br.b.x > CX ? 99 : br.a.x < CX && br.b.x < CX ? 1 : (br.a.x + br.b.x) / 2;
      const q = sampleQuadratic(br.a, { x: cxp, y: (br.a.y + br.b.y) / 2 }, br.b, 22);
      specs.push({
        pts: q,
        normals: computeNormals(q),
        wCore: () => 0.24,
        wAura: () => 0.5,
        lit: () => nodeFrac[br.at] ?? 1,
        tip: () => 0.8,
        colT: () => nodeFrac[br.at] ?? 1,
        node: br.at,
      });
    }
    return { coreGeo: buildRibbon(specs, vbh, "core"), auraGeo: buildRibbon(specs, vbh, "aura") };
  }, [line, width, spurs, bridges, nodeFrac, vbh]);

  const ribbonUniforms = () => ({
    uTime: { value: 0 },
    uWp: { value: 0 },
    uColA: { value: colA },
    uColB: { value: colB },
    uColC: { value: colC },
    uNodeFrac: { value: nodeArrays.frac },
    uNodeW: { value: nodeArrays.w },
    uNodeCount: { value: nodeArrays.count },
    uMask: { value: new Float32Array(MAX_NODES) },
  });
  const coreMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, uniforms: { ...ribbonUniforms(), uMode: { value: 0 } }, ...ADDITIVE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colA, colB, colC, nodeArrays],
  );
  const auraMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, uniforms: { ...ribbonUniforms(), uMode: { value: 1 } }, ...ADDITIVE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colA, colB, colC, nodeArrays],
  );

  // ── glints: node blooms (weight-sized) + capability stars ──
  const glintGeo = useMemo(() => {
    const pos: number[] = [];
    const size: number[] = [];
    const colT: number[] = [];
    const frac: number[] = [];
    const twk: number[] = [];
    const nodeA: number[] = [];
    nodes.forEach((p, i) => {
      pos.push(p.x, vbh - p.y, 0);
      size.push(56 + 64 * (beats[i]?.weight ?? 0.5));
      colT.push(0.5 + 0.5 * (i / Math.max(1, nodes.length - 1)));
      frac.push(nodeFrac[i] ?? 0);
      twk.push(1.1);
      nodeA.push(i);
    });
    stars.forEach((s) => {
      pos.push(s.x, vbh - s.y, 0);
      size.push(30);
      colT.push(0.7);
      frac.push(nodeFrac[s.milestone] ?? 1);
      twk.push(2.4 + hash01(s.key) * 2.0);
      nodeA.push(s.milestone);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute("aColT", new THREE.Float32BufferAttribute(colT, 1));
    g.setAttribute("aFrac", new THREE.Float32BufferAttribute(frac, 1));
    g.setAttribute("aTwinkle", new THREE.Float32BufferAttribute(twk, 1));
    g.setAttribute("aNode", new THREE.Float32BufferAttribute(nodeA, 1));
    return g;
  }, [nodes, beats, stars, nodeFrac, vbh]);

  const glintMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uWp: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: px }, uTex: { value: hotTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC }, uMask: { value: new Float32Array(MAX_NODES) } },
        ...ADDITIVE,
      }),
    [px, hotTex, colA, colB, colC],
  );

  // ── flow particles: current through the decoded channel only ──
  const flowGeo = useMemo(() => {
    const position = new Float32Array(PARTICLES * 3);
    const seed = new Float32Array(PARTICLES);
    const speed = new Float32Array(PARTICLES);
    const lat = new Float32Array(PARTICLES);
    const size = new Float32Array(PARTICLES);
    const colT = new Float32Array(PARTICLES);
    for (let i = 0; i < PARTICLES; i++) {
      seed[i] = hash01(`p.${i}.s`);
      speed[i] = 0.016 + hash01(`p.${i}.v`) * 0.05;
      lat[i] = (hash01(`p.${i}.l`) * 2 - 1) * 1.9;
      size[i] = 2 + hash01(`p.${i}.z`) * 5;
      colT[i] = hash01(`p.${i}.c`);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    g.setAttribute("aLat", new THREE.BufferAttribute(lat, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aColT", new THREE.BufferAttribute(colT, 1));
    return g;
  }, []);

  const flowMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: FLOW_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uTime: { value: 0 }, uWp: { value: 0 }, uPixelRatio: { value: px }, uClTex: { value: clTex }, uTexSize: { value: texSize }, uTex: { value: softTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC } },
        ...ADDITIVE,
      }),
    [px, clTex, texSize, softTex, colA, colB, colC],
  );

  // ── the decoding head + comet tail ──
  const headGeo = useMemo(() => {
    const position = new Float32Array(HEAD * 3);
    const index = new Float32Array(HEAD);
    const size = new Float32Array(HEAD);
    const base = new Float32Array(HEAD);
    for (let i = 0; i < HEAD; i++) {
      index[i] = i;
      size[i] = i === 0 ? 64 : 30 * (1 - i / HEAD);
      base[i] = i === 0 ? 1.7 : 1.1 * (1 - i / HEAD);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aIndex", new THREE.BufferAttribute(index, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aBase", new THREE.BufferAttribute(base, 1));
    return g;
  }, []);

  const headMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HEAD_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uTime: { value: 0 }, uWp: { value: 0 }, uTailDir: { value: 1 }, uSpeed: { value: 0 }, uJitter: { value: 0 }, uPixelRatio: { value: px }, uClTex: { value: clTex }, uTexSize: { value: texSize }, uTex: { value: hotTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC } },
        ...ADDITIVE,
      }),
    [px, clTex, texSize, hotTex, colA, colB, colC],
  );

  // ── token ticks: the quantized future ──
  const tickGeo = useMemo(() => {
    const position = new Float32Array(TICKS * 3);
    const frac = new Float32Array(TICKS);
    const size = new Float32Array(TICKS);
    for (let i = 0; i < TICKS; i++) {
      frac[i] = (i + 0.5) / TICKS;
      size[i] = 9 + hash01(`tk.${i}`) * 5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aFrac", new THREE.BufferAttribute(frac, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return g;
  }, []);

  const tickMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TICK_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uTime: { value: 0 }, uWp: { value: 0 }, uPixelRatio: { value: px }, uClTex: { value: clTex }, uTexSize: { value: texSize }, uTex: { value: softTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC } },
        ...ADDITIVE,
      }),
    [px, clTex, texSize, softTex, colA, colB, colC],
  );

  // ── Act 2: ghost fans (live futures), scars (dead ones), evaporation, delta ticks ──
  const ghostGeo = useMemo(() => {
    const all: Ghost[] = [...build.fans.flatMap((f) => f.ghosts), ...build.delta.ghosts];
    return buildGhostRibbon(all, vbh, (g) => g.frac >= 1);
  }, [build, vbh]);
  const scarGeo = useMemo(() => buildGhostRibbon(build.scars, vbh, () => false), [build, vbh]);

  const ghostUniforms = (scarVal: number) => ({
    uTime: { value: 0 },
    uWp: { value: 0 },
    uScar: { value: scarVal },
    uColA: { value: colA },
    uColB: { value: colB },
    uColC: { value: colC },
    uMask: { value: new Float32Array(MAX_NODES) },
  });
  const ghostMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: GHOST_VERT, fragmentShader: GHOST_FRAG, uniforms: ghostUniforms(0), ...ADDITIVE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colA, colB, colC],
  );
  const scarMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: GHOST_VERT, fragmentShader: GHOST_FRAG, uniforms: ghostUniforms(1), ...ADDITIVE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colA, colB, colC],
  );

  const evapGeo = useMemo(() => {
    const interior = build.fans.flatMap((f) => f.ghosts);
    const position = new Float32Array(EVAP * 3);
    const frac = new Float32Array(EVAP);
    const seed = new Float32Array(EVAP);
    const size = new Float32Array(EVAP);
    const colT = new Float32Array(EVAP);
    const dir = new Float32Array(EVAP * 2);
    const nodeA = new Float32Array(EVAP);
    const G = Math.max(1, interior.length);
    for (let i = 0; i < EVAP; i++) {
      const g = interior[i % G];
      if (!g) break;
      nodeA[i] = g.node;
      const t = hash01(`ev.${i}.t`);
      const seg = Math.min(g.pts.length - 2, Math.floor(t * (g.pts.length - 1)));
      const f = t * (g.pts.length - 1) - seg;
      const a = g.pts[seg];
      const b = g.pts[seg + 1];
      const px2 = a.x + (b.x - a.x) * f;
      const py2 = a.y + (b.y - a.y) * f;
      const root = g.pts[0];
      let dx = px2 - root.x;
      let dy = py2 - root.y;
      const m = Math.hypot(dx, dy) || 1;
      dx /= m;
      dy /= m;
      const j = (hash01(`ev.${i}.j`) - 0.5) * 0.9;
      const rx = dx * Math.cos(j) - dy * Math.sin(j);
      const ry = dx * Math.sin(j) + dy * Math.cos(j);
      position[i * 3] = px2 + (hash01(`ev.${i}.x`) - 0.5) * 1.2;
      position[i * 3 + 1] = vbh - (py2 + (hash01(`ev.${i}.y`) - 0.5) * 1.2);
      frac[i] = g.frac;
      seed[i] = hash01(`ev.${i}.s`);
      size[i] = 4 + hash01(`ev.${i}.z`) * 8;
      colT[i] = g.frac;
      dir[i * 2] = rx;
      dir[i * 2 + 1] = -ry; // world y is flipped
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aFrac", new THREE.BufferAttribute(frac, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aColT", new THREE.BufferAttribute(colT, 1));
    g.setAttribute("aDir", new THREE.BufferAttribute(dir, 2));
    g.setAttribute("aNode", new THREE.BufferAttribute(nodeA, 1));
    return g;
  }, [build, vbh]);

  const evapMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: EVAP_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uTime: { value: 0 }, uWp: { value: 0 }, uPixelRatio: { value: px }, uTex: { value: softTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC }, uMask: { value: new Float32Array(MAX_NODES) } },
        ...ADDITIVE,
      }),
    [px, softTex, colA, colB, colC],
  );

  const dtickGeo = useMemo(() => {
    const N = build.delta.ticks.length;
    const position = new Float32Array(Math.max(1, N) * 3);
    const phase = new Float32Array(Math.max(1, N));
    const size = new Float32Array(Math.max(1, N));
    build.delta.ticks.forEach((t, i) => {
      position[i * 3] = t.p.x;
      position[i * 3 + 1] = vbh - t.p.y;
      phase[i] = hash01(`dt.${i}`);
      size[i] = Math.max(6, 16 - t.k * 1.6);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    return g;
  }, [build, vbh]);

  const dtickMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: DTICK_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uTime: { value: 0 }, uWp: { value: 0 }, uPixelRatio: { value: px }, uTex: { value: hotTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC } },
        ...ADDITIVE,
      }),
    [px, hotTex, colA, colB, colC],
  );

  const coreRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const glintRef = useRef<THREE.Points>(null);
  const flowRef = useRef<THREE.Points>(null);
  const headRef = useRef<THREE.Points>(null);
  const tickRef = useRef<THREE.Points>(null);
  const ghostRef = useRef<THREE.Mesh>(null);
  const scarRef = useRef<THREE.Mesh>(null);
  const evapRef = useRef<THREE.Points>(null);
  const dtickRef = useRef<THREE.Points>(null);
  const eased = useRef(0);
  const prevEased = useRef(0);
  const speed = useRef(0);
  const tailDir = useRef(1);
  const sizeKey = useRef("");
  const guardRef = useRef<((d: number) => void) | null>(null);

  const warp = useMemo(() => makeWarp(nodeFrac, beats), [nodeFrac, beats]);

  useEffect(() => {
    guardRef.current = createFpsGuard({
      budgetMs: 22,
      onStrain: () => flowRef.current?.geometry.setDrawRange(0, Math.floor(PARTICLES * 0.55)),
      onRelief: () => flowRef.current?.geometry.setDrawRange(0, PARTICLES),
    });
  }, []);

  useEffect(
    () => () => {
      coreGeo.dispose();
      auraGeo.dispose();
      coreMat.dispose();
      auraMat.dispose();
      glintGeo.dispose();
      glintMat.dispose();
      flowGeo.dispose();
      flowMat.dispose();
      headGeo.dispose();
      headMat.dispose();
      tickGeo.dispose();
      tickMat.dispose();
      ghostGeo.dispose();
      ghostMat.dispose();
      scarGeo.dispose();
      scarMat.dispose();
      evapGeo.dispose();
      evapMat.dispose();
      dtickGeo.dispose();
      dtickMat.dispose();
      clTex.dispose();
      softTex.dispose();
      hotTex.dispose();
    },
    [coreGeo, auraGeo, coreMat, auraMat, glintGeo, glintMat, flowGeo, flowMat, headGeo, headMat, tickGeo, tickMat, ghostGeo, ghostMat, scarGeo, scarMat, evapGeo, evapMat, dtickGeo, dtickMat, clTex, softTex, hotTex],
  );

  useFrame((state, delta) => {
    guardRef.current?.(delta);

    // Live handoff: after a couple of real frames, the parent fades its poster.
    if (liveTicks.current < 3) {
      liveTicks.current += 1;
      if (liveTicks.current === 2) onLive?.();
    }

    const cam = state.camera as THREE.OrthographicCamera;
    const key = `${state.size.width}x${state.size.height}`;
    if (sizeKey.current !== key) {
      sizeKey.current = key;
      cam.left = 0;
      cam.right = vbw;
      cam.top = vbh;
      cam.bottom = 0;
      cam.near = 0.1;
      cam.far = 200;
      cam.position.set(0, 0, 50);
      cam.updateProjectionMatrix();
    }

    const t = state.clock.elapsedTime;
    const dt = Math.max(delta, 1e-4);
    const target = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1);
    eased.current += (target - eased.current) * (1 - Math.exp(-6 * dt));
    const wp = warp(eased.current);

    // velocity state (rendering-only): tail direction + stretch, head temperature
    const vel = (eased.current - prevEased.current) / dt;
    prevEased.current = eased.current;
    speed.current += (Math.min(Math.abs(vel) * 6, 1) - speed.current) * (1 - Math.exp(-5 * dt));
    const dirTarget = vel > 0.0004 ? 1 : vel < -0.0004 ? -1 : tailDir.current;
    tailDir.current += (dirTarget - tailDir.current) * (1 - Math.exp(-8 * dt));
    let fNext = 1;
    for (let i = 0; i < nodeFrac.length; i++) {
      if (nodeFrac[i] > wp + 1e-4) {
        fNext = nodeFrac[i];
        break;
      }
    }
    const jitter = (1 - THREE.MathUtils.clamp((fNext - wp) / 0.05, 0, 1)) * (0.4 + 0.6 * speed.current);

    // ease the attention mask toward its target (filter changes glide, never pop)
    if (!maskSmooth.current) maskSmooth.current = new Float32Array(MAX_NODES);
    const ms = maskSmooth.current;
    const tgt = maskTarget.current;
    const mk = 1 - Math.exp(-10 * dt);
    for (let i = 0; i < nodeArrays.count; i++) {
      const goal = tgt?.[i] ? 1 : 0;
      ms[i] += (goal - ms[i]) * mk;
    }

    const mats = [
      coreRef.current?.material,
      auraRef.current?.material,
      glintRef.current?.material,
      flowRef.current?.material,
      headRef.current?.material,
      tickRef.current?.material,
      ghostRef.current?.material,
      scarRef.current?.material,
      evapRef.current?.material,
      dtickRef.current?.material,
    ] as (THREE.ShaderMaterial | undefined)[];
    for (const m of mats) {
      if (!m) continue;
      m.uniforms.uTime.value = t;
      m.uniforms.uWp.value = wp;
      const um = m.uniforms.uMask;
      if (um) for (let i = 0; i < nodeArrays.count; i++) (um.value as Float32Array)[i] = ms[i];
    }
    const hm = headRef.current?.material as THREE.ShaderMaterial | undefined;
    if (hm) {
      hm.uniforms.uTailDir.value = tailDir.current;
      hm.uniforms.uSpeed.value = speed.current;
      hm.uniforms.uJitter.value = jitter;
    }
  });

  return (
    <>
      <mesh ref={auraRef} geometry={auraGeo} material={auraMat} frustumCulled={false} renderOrder={0} />
      <mesh ref={scarRef} geometry={scarGeo} material={scarMat} frustumCulled={false} renderOrder={1} />
      <mesh ref={coreRef} geometry={coreGeo} material={coreMat} frustumCulled={false} renderOrder={2} />
      <mesh ref={ghostRef} geometry={ghostGeo} material={ghostMat} frustumCulled={false} renderOrder={3} />
      <points ref={glintRef} geometry={glintGeo} material={glintMat} frustumCulled={false} renderOrder={4} />
      <points ref={tickRef} geometry={tickGeo} material={tickMat} frustumCulled={false} renderOrder={5} />
      <points ref={dtickRef} geometry={dtickGeo} material={dtickMat} frustumCulled={false} renderOrder={6} />
      <points ref={flowRef} geometry={flowGeo} material={flowMat} frustumCulled={false} renderOrder={7} />
      <points ref={evapRef} geometry={evapGeo} material={evapMat} frustumCulled={false} renderOrder={8} />
      <points ref={headRef} geometry={headGeo} material={headMat} frustumCulled={false} renderOrder={9} />
    </>
  );
}

export default function ArgmaxCanvas(props: ArgmaxCanvasProps) {
  const { vbw, vbh, running } = props;
  return (
    <Canvas
      className="size-full"
      orthographic
      dpr={DPR_CAP}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "high-performance" }}
      camera={{ manual: true }}
      frameloop={running === false ? "never" : "always"}
      aria-hidden
      onCreated={({ camera }) => {
        const cam = camera as THREE.OrthographicCamera;
        cam.left = 0;
        cam.right = vbw;
        cam.top = vbh;
        cam.bottom = 0;
        cam.near = 0.1;
        cam.far = 200;
        cam.position.set(0, 0, 50);
        cam.updateProjectionMatrix();
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
