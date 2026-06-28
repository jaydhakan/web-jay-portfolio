"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";
import {
  type Centerline,
  type Pt,
  type StarPlot,
  type BridgePlot,
  type SpurPlot,
  pointAtFrac,
  hash01,
  CX,
} from "./geometry";

silenceThreeClockDeprecation();

/**
 * LivingFiberCanvas — the "Neural Highway / Living Energy Fiber" set-piece (max-fidelity
 * WebGL). The thin SVG wire becomes a VOLUMETRIC channel of light: a white-hot core
 * wrapped in an indigo→violet→cyan aura, energy filaments twisting along its length,
 * thousands of particles forever streaming through it (alive even at idle), organic
 * dendrites branching into the dark, bloom-bright nodes that ignite as the charge orb
 * passes, and the knowledge-graph stars + bridge arcs lighting across milestones.
 *
 * Glow is HDR-style ADDITIVE (wide soft aura ribbon + bright core + soft sprite points),
 * NOT a post-process bloom pass — so the canvas stays transparent and composites over the
 * page's LatentField. ALL motion is uniform-driven in the shaders (the centerline is
 * baked into a float DataTexture the particle/orb vertex shaders sample), so the per-frame
 * work is just uniform writes through material refs — matching the LatentFieldCanvas idiom
 * (no CPU particle loop, lint-clean, and cheap enough to run thousands of particles). ONE
 * scroll-progress ref drives every reveal, in lockstep with the DOM cards. Governed +
 * desktop-only; reduced-motion / mobile / no-WebGL never mount it.
 */

const jit = (seed: string, min: number, max: number) => min + hash01(seed) * (max - min);

const COL_A = "#6b7cff"; // indigo
const COL_B = "#8b7cff"; // violet
const COL_C = "#67e8f9"; // cyan
const PARTICLES = 2400;
const ORB = 14;

export type LivingFiberProps = {
  vbw: number;
  vbh: number;
  centerline: Centerline;
  waypoints: Pt[];
  nodeFrac: number[];
  stars: StarPlot[];
  spurs: SpurPlot[];
  bridges: BridgePlot[];
  progressRef: React.RefObject<number>;
};

// ── geometry helpers ──────────────────────────────────────────────────────────
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

type RibbonSpec = {
  pts: Pt[];
  normals: Pt[];
  wCore: (u: number) => number;
  wAura: (u: number) => number;
  lit: (u: number) => number;
  tip: (u: number) => number;
  colT: (u: number) => number;
};

function buildRibbon(specs: RibbonSpec[], vbh: number, mode: "core" | "aura") {
  const pos: number[] = [];
  const u: number[] = [];
  const side: number[] = [];
  const lit: number[] = [];
  const tip: number[] = [];
  const colT: number[] = [];
  const idx: number[] = [];
  let vcount = 0;

  for (const spec of specs) {
    const M = spec.pts.length;
    if (M < 2) continue;
    const base = vcount;
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
      u.push(t); side.push(1); lit.push(lf); tip.push(tf); colT.push(ct);
      pos.push(wx - nx * hw, wy - ny * hw, 0);
      u.push(t); side.push(-1); lit.push(lf); tip.push(tf); colT.push(ct);
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

// ── shaders ────────────────────────────────────────────────────────────────
const RIBBON_VERT = /* glsl */ `
  attribute float aU; attribute float aSide; attribute float aLit; attribute float aTip; attribute float aColT;
  varying float vU; varying float vSide; varying float vLit; varying float vTip; varying float vColT;
  void main() {
    vU = aU; vSide = aSide; vLit = aLit; vTip = aTip; vColT = aColT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const RIBBON_FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime, uProgress, uMode;
  uniform vec3 uColA, uColB, uColC;
  varying float vU; varying float vSide; varying float vLit; varying float vTip; varying float vColT;
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
    float lit = 1.0 - smoothstep(uProgress, uProgress + 0.05, vLit);
    float front = exp(-pow((vLit - uProgress) / 0.02, 2.0)) * 1.7;
    // always a bold glowing channel; brighter behind the orb, hot frontier at it
    float bright = mix(0.5, 1.05, lit) + front;
    float shape = mix(core * 1.0, aura * 0.78, uMode);
    float a = shape * bright * vTip * (0.6 + 0.4 * fil);
    gl_FragColor = vec4(col * bright, a);
  }
`;
const GLINT_VERT = /* glsl */ `
  attribute float aSize; attribute float aColT; attribute float aFrac; attribute float aTwinkle;
  uniform float uProgress, uTime, uPixelRatio;
  varying float vB; varying float vColT;
  void main(){
    float lit = smoothstep(aFrac, aFrac + 0.02, uProgress);
    float pulse = exp(-pow((uProgress - aFrac) / 0.012, 2.0));
    float tw = 0.78 + 0.22 * sin(uTime * aTwinkle + aColT * 30.0);
    vB = (0.32 + 0.78 * lit) * tw + pulse * 1.5;
    vColT = aColT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.55 + 0.55 * lit + 0.7 * pulse);
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
  uniform float uTime, uProgress, uPixelRatio;
  varying float vB; varying float vColT;
  ${CL_SAMPLE}
  void main(){
    float s = fract(aSeed + uTime * aSpeed);
    vec4 cl = clAt(s);
    float wob = aLat * (0.6 + 0.4 * sin(uTime * 2.0 + aSeed * 30.0));
    vec2 pos = cl.xy + cl.zw * wob;
    float lit = 1.0 - smoothstep(uProgress, uProgress + 0.06, s);
    vB = (0.4 + 0.75 * lit) * (0.6 + 0.4 * sin(uTime * 3.0 + aSeed * 50.0));
    vColT = aColT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.5 + vB);
  }
`;
const ORB_VERT = /* glsl */ `
  attribute float aIndex; attribute float aSize; attribute float aColT; attribute float aBase;
  uniform float uTime, uProgress, uPixelRatio;
  varying float vB; varying float vColT;
  ${CL_SAMPLE}
  void main(){
    float s = clamp(uProgress - aIndex * 0.006, 0.0, 1.0);
    vec4 cl = clAt(s);
    vB = aBase * step(0.001, uProgress) * step(uProgress, 0.999);
    vColT = aColT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(cl.xy, 0.0, 1.0);
    gl_PointSize = aSize * uPixelRatio * (0.6 + vB);
  }
`;

const ADDITIVE = {
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
} as const;

// ── scene ────────────────────────────────────────────────────────────────────
function Scene({ vbw, vbh, centerline, waypoints, nodeFrac, stars, spurs, bridges, progressRef }: LivingFiberProps) {
  const gl = useThree((s) => s.gl);
  const px = useMemo(() => gl.getPixelRatio(), [gl]);

  const colA = useMemo(() => new THREE.Color(COL_A), []);
  const colB = useMemo(() => new THREE.Color(COL_B), []);
  const colC = useMemo(() => new THREE.Color(COL_C), []);
  const softTex = useMemo(() => makeRadial("rgba(140,170,255,0.55)", 0.8), []);
  const hotTex = useMemo(() => makeRadial("rgba(103,232,249,0.9)", 1), []);

  // centerline baked into a float texture (RG = world pos, BA = world normal)
  const clTex = useMemo(() => {
    const M = centerline.pts.length;
    const data = new Float32Array(M * 4);
    for (let i = 0; i < M; i++) {
      const p = centerline.pts[i];
      const nr = centerline.normals[i];
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
  }, [centerline, vbh]);
  const texSize = centerline.pts.length;

  // ── ribbon geometry: main fiber + dendrites + spurs + bridges ──
  const { coreGeo, auraGeo } = useMemo(() => {
    const specs: RibbonSpec[] = [];
    const endTaper = (t: number) => Math.min(1, Math.min(t, 1 - t) / 0.05);

    specs.push({
      pts: centerline.pts,
      normals: centerline.normals,
      wCore: (t) => 2.3 * (0.5 + 0.5 * endTaper(t)),
      wAura: (t) => 5.4 * (0.5 + 0.5 * endTaper(t)),
      lit: (t) => t,
      tip: () => 1,
      colT: (t) => t,
    });

    const COUNT = 18;
    for (let i = 0; i < COUNT; i++) {
      const rf = (i + 0.5) / COUNT;
      const { pos, normal } = pointAtFrac(centerline, rf);
      const wallSign = pos.x >= CX ? 1 : -1;
      let dir = { x: normal.x, y: normal.y };
      if (Math.sign(dir.x || wallSign) !== wallSign) dir = { x: -dir.x, y: -dir.y };
      let ang = Math.atan2(dir.y, dir.x) + jit(`d.${i}.a`, -0.5, 0.5);
      const len = jit(`d.${i}.l`, 7, 15);
      const steps = 7;
      const main: Pt[] = [{ ...pos }];
      let cx = pos.x;
      let cy = pos.y;
      for (let s = 1; s <= steps; s++) {
        ang += jit(`d.${i}.${s}`, -0.34, 0.34);
        const st = len / steps;
        cx += Math.cos(ang) * st;
        cy += Math.sin(ang) * st;
        main.push({ x: cx, y: cy });
      }
      specs.push({
        pts: main,
        normals: computeNormals(main),
        wCore: (t) => 0.55 * (1 - t) + 0.04,
        wAura: (t) => 1.15 * (1 - t) + 0.05,
        lit: () => rf,
        tip: (t) => 1 - t * 0.9,
        colT: () => rf,
      });
      const bi = Math.max(2, Math.floor(steps * 0.55));
      const bp = main[bi];
      const flip = jit(`d.${i}.bs`, 0, 1) > 0.5 ? 1 : -1;
      let ba = ang + jit(`d.${i}.b`, 0.3, 0.9) * flip;
      const blen = jit(`d.${i}.bl`, 4, 8);
      const bsteps = 5;
      const branch: Pt[] = [{ ...bp }];
      let bx = bp.x;
      let by = bp.y;
      for (let s = 1; s <= bsteps; s++) {
        ba += jit(`d.${i}.bb.${s}`, -0.3, 0.3);
        const st = blen / bsteps;
        bx += Math.cos(ba) * st;
        by += Math.sin(ba) * st;
        branch.push({ x: bx, y: by });
      }
      specs.push({
        pts: branch,
        normals: computeNormals(branch),
        wCore: (t) => 0.32 * (1 - t) + 0.03,
        wAura: (t) => 0.7 * (1 - t) + 0.04,
        lit: () => rf,
        tip: (t) => 1 - t * 0.95,
        colT: () => rf,
      });
    }

    for (const sp of spurs) {
      const mid = { x: (sp.a.x + sp.b.x) / 2, y: (sp.a.y + sp.b.y) / 2 };
      const q = sampleQuadratic(sp.a, mid, sp.b, 12);
      specs.push({
        pts: q,
        normals: computeNormals(q),
        wCore: () => 0.3,
        wAura: () => 0.6,
        lit: () => nodeFrac[sp.milestone] ?? 1,
        tip: (t) => 1 - t * 0.3,
        colT: () => nodeFrac[sp.milestone] ?? 1,
      });
    }

    for (const br of bridges) {
      const cxp = br.a.x > CX && br.b.x > CX ? 99 : br.a.x < CX && br.b.x < CX ? 1 : (br.a.x + br.b.x) / 2;
      const q = sampleQuadratic(br.a, { x: cxp, y: (br.a.y + br.b.y) / 2 }, br.b, 22);
      specs.push({
        pts: q,
        normals: computeNormals(q),
        wCore: () => 0.26,
        wAura: () => 0.55,
        lit: () => nodeFrac[br.at] ?? 1,
        tip: () => 1,
        colT: () => nodeFrac[br.at] ?? 1,
      });
    }

    return { coreGeo: buildRibbon(specs, vbh, "core"), auraGeo: buildRibbon(specs, vbh, "aura") };
  }, [centerline, spurs, bridges, nodeFrac, vbh]);

  const ribbonUniforms = () => ({
    uTime: { value: 0 },
    uProgress: { value: 0 },
    uColA: { value: colA },
    uColB: { value: colB },
    uColC: { value: colC },
  });
  const coreMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, uniforms: { ...ribbonUniforms(), uMode: { value: 0 } }, ...ADDITIVE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colA, colB, colC],
  );
  const auraMat = useMemo(
    () => new THREE.ShaderMaterial({ vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, uniforms: { ...ribbonUniforms(), uMode: { value: 1 } }, ...ADDITIVE }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colA, colB, colC],
  );

  // ── glints: node blooms + capability stars ──
  const glintGeo = useMemo(() => {
    const pos: number[] = [];
    const size: number[] = [];
    const colT: number[] = [];
    const frac: number[] = [];
    const twk: number[] = [];
    waypoints.forEach((p, i) => {
      pos.push(p.x, vbh - p.y, 0);
      size.push(86);
      colT.push(0.5 + 0.5 * (i / Math.max(1, waypoints.length - 1)));
      frac.push(nodeFrac[i] ?? 0);
      twk.push(1.1);
    });
    stars.forEach((s) => {
      pos.push(s.x, vbh - s.y, 0);
      size.push(34);
      colT.push(0.7);
      frac.push(nodeFrac[s.milestone] ?? 1);
      twk.push(2.4 + hash01(s.key) * 2.0);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("aSize", new THREE.Float32BufferAttribute(size, 1));
    g.setAttribute("aColT", new THREE.Float32BufferAttribute(colT, 1));
    g.setAttribute("aFrac", new THREE.Float32BufferAttribute(frac, 1));
    g.setAttribute("aTwinkle", new THREE.Float32BufferAttribute(twk, 1));
    return g;
  }, [waypoints, stars, nodeFrac, vbh]);

  const glintMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: GLINT_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uProgress: { value: 0 }, uTime: { value: 0 }, uPixelRatio: { value: px }, uTex: { value: hotTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC } },
        ...ADDITIVE,
      }),
    [px, hotTex, colA, colB, colC],
  );

  // ── flow particles (GPU-driven) ──
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
      lat[i] = (hash01(`p.${i}.l`) * 2 - 1) * 2.4;
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
        uniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uPixelRatio: { value: px }, uClTex: { value: clTex }, uTexSize: { value: texSize }, uTex: { value: softTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC } },
        ...ADDITIVE,
      }),
    [px, clTex, texSize, softTex, colA, colB, colC],
  );

  // ── orb + comet trail (GPU-driven) ──
  const orbGeo = useMemo(() => {
    const position = new Float32Array(ORB * 3);
    const index = new Float32Array(ORB);
    const size = new Float32Array(ORB);
    const colT = new Float32Array(ORB);
    const base = new Float32Array(ORB);
    for (let i = 0; i < ORB; i++) {
      index[i] = i;
      size[i] = i === 0 ? 66 : 32 * (1 - i / ORB);
      colT[i] = 0.95;
      base[i] = i === 0 ? 1.7 : 1.15 * (1 - i / ORB);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(position, 3));
    g.setAttribute("aIndex", new THREE.BufferAttribute(index, 1));
    g.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    g.setAttribute("aColT", new THREE.BufferAttribute(colT, 1));
    g.setAttribute("aBase", new THREE.BufferAttribute(base, 1));
    return g;
  }, []);

  const orbMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: ORB_VERT,
        fragmentShader: POINT_FRAG,
        uniforms: { uTime: { value: 0 }, uProgress: { value: 0 }, uPixelRatio: { value: px }, uClTex: { value: clTex }, uTexSize: { value: texSize }, uTex: { value: hotTex }, uColA: { value: colA }, uColB: { value: colB }, uColC: { value: colC } },
        ...ADDITIVE,
      }),
    [px, clTex, texSize, hotTex, colA, colB, colC],
  );

  const coreRef = useRef<THREE.Mesh>(null);
  const auraRef = useRef<THREE.Mesh>(null);
  const glintRef = useRef<THREE.Points>(null);
  const flowRef = useRef<THREE.Points>(null);
  const orbRef = useRef<THREE.Points>(null);
  const eased = useRef(0);
  const sizeKey = useRef("");
  const guardRef = useRef<((d: number) => void) | null>(null);

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
      orbGeo.dispose();
      orbMat.dispose();
      clTex.dispose();
      softTex.dispose();
      hotTex.dispose();
    },
    [coreGeo, auraGeo, coreMat, auraMat, glintGeo, glintMat, flowGeo, flowMat, orbGeo, orbMat, clTex, softTex, hotTex],
  );

  useFrame((state, delta) => {
    guardRef.current?.(delta);

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
    const target = THREE.MathUtils.clamp(progressRef.current ?? 0, 0, 1);
    eased.current += (target - eased.current) * (1 - Math.exp(-6 * delta));
    const p = eased.current;

    const mats = [
      coreRef.current?.material,
      auraRef.current?.material,
      glintRef.current?.material,
      flowRef.current?.material,
      orbRef.current?.material,
    ] as (THREE.ShaderMaterial | undefined)[];
    for (const m of mats) {
      if (!m) continue;
      m.uniforms.uTime.value = t;
      m.uniforms.uProgress.value = p;
    }
  });

  return (
    <>
      <mesh ref={auraRef} geometry={auraGeo} material={auraMat} frustumCulled={false} renderOrder={0} />
      <mesh ref={coreRef} geometry={coreGeo} material={coreMat} frustumCulled={false} renderOrder={1} />
      <points ref={glintRef} geometry={glintGeo} material={glintMat} frustumCulled={false} renderOrder={2} />
      <points ref={flowRef} geometry={flowGeo} material={flowMat} frustumCulled={false} renderOrder={3} />
      <points ref={orbRef} geometry={orbGeo} material={orbMat} frustumCulled={false} renderOrder={4} />
    </>
  );
}

export default function LivingFiberCanvas(props: LivingFiberProps) {
  const { vbw, vbh } = props;
  return (
    <Canvas
      className="size-full"
      orthographic
      dpr={DPR_CAP}
      gl={{ alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "high-performance" }}
      camera={{ manual: true }}
      frameloop="always"
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
