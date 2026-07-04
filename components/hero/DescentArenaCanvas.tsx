"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";

silenceThreeClockDeprecation();

/**
 * THE DESCENT ARENA (plan.md) — home's signature set-piece: a live, playable
 * gradient-descent run on an iridescent loss landscape.
 *
 * The terrain is the retired HeroShader objective surface (simplex fbm hills sinking
 * into one broad basin, iso-contours crowding the steep walls, indigo→violet→cyan
 * emissive lines under bloom, distance fog, left-column darkness guard) — now made a
 * SYSTEM rather than a backdrop:
 *
 * - ~14 optimizer probes run momentum gradient-descent on the CPU against a JS mirror
 *   of the exact shader height function (parity: probes visibly ride the surface).
 *   Each drags a decaying light trail (ring-buffered additive points). Reaching the
 *   basin fires a small flare and the probe respawns at the rim. Probes that stall in
 *   a local minimum get an SGD-style random kick (on-thesis, and it reads as life).
 * - The POINTER raises a gaussian bump in the height function (same term in GLSL and
 *   JS): you deform the objective and the optimizers physically swerve around it.
 * - CLICK drops a new probe at the cursor with a birth flare (window listener —
 *   the canvas layer itself stays pointer-events-none; clicks on links/buttons are
 *   ignored; spawning is limited to the hero fold).
 * - SCROLL past the fold pulls the camera up toward a quiet top-down contour view and
 *   dims everything (uDim) — the arena becomes ambient cartography for the page body.
 *
 * Governance: DPR-capped, FPS-guarded (strain drops bloom first), desktop-tier only
 * mounts this file at all (the DescentArena gate); reduced-motion / mobile / no-WebGL
 * live on the poster. All motion is time+scroll-driven uniforms and one small typed-
 * array update per frame — no per-frame allocations.
 */

const BASE_HEX = "#0b0b11";
const PROBES = 14;
const TRAIL = 64; // ring-buffer slots per probe (~2s of trail at 30 writes/s)
const WRITE_HZ = 30;
const PLANE_W = 64;
const PLANE_H = 96;
const BASIN = { x: 6, y: 18 }; // plane coords (world x, -z)
const COL_A = "#6b7cff";
const COL_B = "#8b7cff";
const COL_C = "#67e8f9";

// ── The objective, in GLSL (vertex displacement) and JS (probe physics) ────────
// Both MUST stay in lockstep: hills fbm + basin well + pointer bump.

const NOISE_GLSL = /* glsl */ `
  // Simplex 2D noise (Ashima / Ian McEwan, public domain).
  vec3 permute(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m; m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.6;
    for (int i = 0; i < 3; i++) { v += a * snoise(p); p *= 2.05; a *= 0.5; }
    return v;
  }
`;

const TERRAIN_VERT = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uBump; // xy = plane coords, z = amplitude (the pointer's loss spike)
  varying float vHeight;
  varying float vNdcX;
  varying float vNdcY;
  varying float vFog;
  ${NOISE_GLSL}
  // The objective surface: rolling hills minus a broad basin (the minimum), plus the
  // visitor's perturbation.
  float terrainHeight(vec2 p) {
    float hills = fbm(p * 0.16 + vec2(uTime * 0.018, uTime * 0.012));
    vec2 c = vec2(${BASIN.x.toFixed(1)}, ${BASIN.y.toFixed(1)});
    float d2 = dot(p - c, p - c);
    float basin = exp(-d2 / 230.0);
    vec2 bd = p - uBump.xy;
    float bump = uBump.z * exp(-dot(bd, bd) / 14.0);
    return hills * 3.1 - basin * 5.2 + bump;
  }
  void main() {
    float h = terrainHeight(position.xy);
    vec3 pos = position;
    pos.z += h;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip = projectionMatrix * mv;
    vHeight = h;
    vNdcX = clip.x / clip.w;
    vNdcY = clip.y / clip.w;
    vFog = -mv.z;
    gl_Position = clip;
  }
`;

const TERRAIN_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uBase, uColorA, uColorB, uColorC;
  uniform float uTime, uScroll, uIntensity, uFogNear, uFogFar;
  varying float vHeight;
  varying float vNdcX;
  varying float vNdcY;
  varying float vFog;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

  void main() {
    float h = vHeight;
    // Iso-contours: fwidth keeps them crisp; lines crowd on the steep valley walls.
    float freq = 2.1;
    float hc = h * freq;
    float aw = max(fwidth(hc), 1e-3);
    float fm = abs(fract(hc - 0.5) - 0.5);
    float minorLine = 1.0 - smoothstep(0.0, aw + 0.012, fm);
    float fM = abs(fract(hc / 5.0 - 0.5) - 0.5);
    float majorLine = 1.0 - smoothstep(0.0, aw / 5.0 + 0.009, fM);
    float steep = smoothstep(0.0, 0.7, fwidth(h));

    // Keep the left text column + the very top dark (the H1 is a DOM overlay there).
    float leftGuard = smoothstep(0.12, 0.62, vNdcX);
    float topGuard = 1.0 - smoothstep(0.72, 1.0, vNdcY);
    float gate = leftGuard * topGuard;

    // Valley-floor wash so the basin reads as depth, not just outline.
    float basin = smoothstep(2.0, -5.2, h);

    // A band of light sweeps from the ridges down into the basin (the optimizer
    // stepping downhill; scroll advances it).
    float level = mix(3.0, -5.5, fract(uTime * 0.05 + uScroll * 0.6));
    float descend = 1.0 - smoothstep(0.0, 0.5, abs(h - level));
    float live = 1.0 + 0.6 * descend;

    vec3 col = uBase;
    col = mix(col, uColorB, basin * 0.22 * gate * uIntensity);
    col = mix(col, uColorA, minorLine * (0.5 + 0.4 * steep) * gate * live * uIntensity);
    col = mix(col, uColorB, majorLine * (0.7 + 0.3 * steep) * gate * live * uIntensity);
    float crest = majorLine * descend * gate;
    col = mix(col, uColorC, clamp(crest, 0.0, 1.0) * uIntensity * 0.6);

    float fog = smoothstep(uFogNear, uFogFar, vFog);
    col = mix(col, uBase, fog);
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 3.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

const TRAIL_VERT = /* glsl */ `
  precision highp float;
  attribute float aSlot; attribute float aProbe; attribute float aHue;
  uniform float uHeads[${PROBES}];
  uniform float uPixelRatio, uDim;
  varying float vA; varying float vHue;
  void main(){
    float head = uHeads[int(aProbe + 0.5)];
    float K = ${TRAIL.toFixed(1)};
    float age = mod(head - aSlot + K, K) / K;
    vA = pow(1.0 - age, 1.8) * uDim;
    vHue = aHue;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPixelRatio * (2.0 + 7.0 * vA);
  }
`;

const TRAIL_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColA, uColB, uColC;
  varying float vA; varying float vHue;
  vec3 ramp(float t){ t = clamp(t,0.0,1.0); return t < 0.5 ? mix(uColA,uColB,t*2.0) : mix(uColB,uColC,(t-0.5)*2.0); }
  void main(){
    vec2 q = gl_PointCoord - 0.5;
    float d2 = dot(q, q);
    float soft = smoothstep(0.25, 0.0, d2);
    vec3 col = ramp(vHue);
    gl_FragColor = vec4(col * (0.25 + vA), soft * vA * 0.55);
  }
`;

const HEAD_VERT = /* glsl */ `
  precision highp float;
  attribute float aProbe; attribute float aHue;
  uniform float uFlare[${PROBES}];
  uniform float uPixelRatio, uDim;
  varying float vF; varying float vHue;
  void main(){
    vF = uFlare[int(aProbe + 0.5)];
    vHue = aHue;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uPixelRatio * (10.0 + 26.0 * vF) * (0.7 + 0.3 * uDim);
  }
`;

const HEAD_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uColA, uColB, uColC;
  uniform float uDim;
  varying float vF; varying float vHue;
  vec3 ramp(float t){ t = clamp(t,0.0,1.0); return t < 0.5 ? mix(uColA,uColB,t*2.0) : mix(uColB,uColC,(t-0.5)*2.0); }
  void main(){
    vec2 q = gl_PointCoord - 0.5;
    float d2 = dot(q, q);
    float core = exp(-d2 * 90.0);
    float halo = exp(-d2 * 14.0);
    vec3 col = mix(ramp(vHue), vec3(1.0), core * 0.8);
    float a = (core * 1.1 + halo * 0.45) * (0.55 + 0.45 * vF) * (0.6 + 0.4 * uDim);
    gl_FragColor = vec4(col * (0.8 + 1.4 * vF), a);
  }
`;

// ── JS mirror of the objective (probe physics runs on the REAL surface) ────────
function snoiseJS(vx: number, vy: number): number {
  const C0 = 0.211324865405187;
  const C1 = 0.366025403784439;
  const C2 = -0.577350269189626;
  const C3 = 0.024390243902439;
  const s = (vx + vy) * C1;
  let ix = Math.floor(vx + s);
  let iy = Math.floor(vy + s);
  const t = (ix + iy) * C0;
  const x0x = vx - ix + t;
  const x0y = vy - iy + t;
  const i1x = x0x > x0y ? 1 : 0;
  const i1y = 1 - i1x;
  const x1x = x0x + C0 - i1x;
  const x1y = x0y + C0 - i1y;
  const x2x = x0x + C2;
  const x2y = x0y + C2;
  ix = ((ix % 289) + 289) % 289;
  iy = ((iy % 289) + 289) % 289;
  const perm = (x: number) => ((x * 34 + 1) * x) % 289;
  const p0 = perm(perm(iy) + ix);
  const p1 = perm(perm(iy + i1y) + ix + i1x);
  const p2 = perm(perm(iy + 1) + ix + 1);
  const contrib = (p: number, xx: number, yy: number) => {
    let m = Math.max(0.5 - (xx * xx + yy * yy), 0);
    m *= m;
    m *= m;
    const pc = p * C3;
    const x2 = 2 * (pc - Math.floor(pc)) - 1;
    const h = Math.abs(x2) - 0.5;
    const ox = Math.floor(x2 + 0.5);
    const a0 = x2 - ox;
    const norm = 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    return m * norm * (a0 * xx + h * yy);
  };
  return 130 * (contrib(p0, x0x, x0y) + contrib(p1, x1x, x1y) + contrib(p2, x2x, x2y));
}

function fbmJS(px: number, py: number): number {
  let v = 0;
  let a = 0.6;
  for (let i = 0; i < 3; i++) {
    v += a * snoiseJS(px, py);
    px *= 2.05;
    py *= 2.05;
    a *= 0.5;
  }
  return v;
}

export function terrainHeightJS(
  px: number,
  py: number,
  time: number,
  bx: number,
  by: number,
  bAmp: number,
): number {
  const hills = fbmJS(px * 0.16 + time * 0.018, py * 0.16 + time * 0.012);
  const dx = px - BASIN.x;
  const dy = py - BASIN.y;
  const basin = Math.exp(-(dx * dx + dy * dy) / 230);
  const bdx = px - bx;
  const bdy = py - by;
  const bump = bAmp * Math.exp(-(bdx * bdx + bdy * bdy) / 14);
  return hills * 3.1 - basin * 5.2 + bump;
}

/** Deterministic PRNG (seeded; no Math.random so behaviour is reproducible). */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ADDITIVE = {
  transparent: true,
  depthWrite: false,
  depthTest: false,
  blending: THREE.AdditiveBlending,
} as const;

type Tier = "high" | "low";

// Mutable probe simulation state — lives in a ref, created lazily on the first frame
// (never touched during render; the React compiler's immutability rules hold).
type Sim = {
  rand: () => number;
  px: Float32Array;
  py: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  flare: Float32Array;
  stuck: Float32Array;
  heads: Float32Array;
  spawnCursor: number;
  writeTimer: number;
};

function createSim(): Sim {
  return {
    rand: mulberry32(20260704),
    px: new Float32Array(PROBES),
    py: new Float32Array(PROBES),
    vx: new Float32Array(PROBES),
    vy: new Float32Array(PROBES),
    flare: new Float32Array(PROBES),
    stuck: new Float32Array(PROBES),
    heads: new Float32Array(PROBES),
    spawnCursor: 0,
    writeTimer: 0,
  };
}

// ── scene ─────────────────────────────────────────────────────────────────────
function ArenaScene({ segments, onStrain }: { segments: [number, number]; onStrain: () => void }) {
  const gl = useThree((s) => s.gl);
  const px = useMemo(() => gl.getPixelRatio(), [gl]);

  const colA = useMemo(() => new THREE.Color(COL_A), []);
  const colB = useMemo(() => new THREE.Color(COL_B), []);
  const colC = useMemo(() => new THREE.Color(COL_C), []);

  const terrainUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntensity: { value: 1.0 },
      uFogNear: { value: 14.0 },
      uFogFar: { value: 62.0 },
      uBump: { value: new THREE.Vector3(0, 0, 0) },
      uBase: { value: new THREE.Color(BASE_HEX) },
      uColorA: { value: colA },
      uColorB: { value: colB },
      uColorC: { value: colC },
    }),
    [colA, colB, colC],
  );

  // Probe state (plane coords): lazy ref — see Sim above.
  const simRef = useRef<Sim | null>(null);

  // Trail ring buffers (positions are filled by the first-frame spawn pass).
  const trailGeo = useMemo(() => {
    const N = PROBES * TRAIL;
    const pos = new Float32Array(N * 3);
    const slot = new Float32Array(N);
    const probe = new Float32Array(N);
    const hue = new Float32Array(N);
    for (let i = 0; i < PROBES; i++) {
      const h = (i * 0.618034) % 1;
      for (let k = 0; k < TRAIL; k++) {
        const idx = i * TRAIL + k;
        slot[idx] = k;
        probe[idx] = i;
        hue[idx] = h;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSlot", new THREE.BufferAttribute(slot, 1));
    g.setAttribute("aProbe", new THREE.BufferAttribute(probe, 1));
    g.setAttribute("aHue", new THREE.BufferAttribute(hue, 1));
    return g;
  }, []);

  const trailMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: TRAIL_VERT,
        fragmentShader: TRAIL_FRAG,
        uniforms: {
          uHeads: { value: new Float32Array(PROBES) },
          uPixelRatio: { value: px },
          uDim: { value: 1 },
          uColA: { value: colA },
          uColB: { value: colB },
          uColC: { value: colC },
        },
        ...ADDITIVE,
      }),
    [px, colA, colB, colC],
  );

  const headGeo = useMemo(() => {
    const pos = new Float32Array(PROBES * 3);
    const probe = new Float32Array(PROBES);
    const hue = new Float32Array(PROBES);
    for (let i = 0; i < PROBES; i++) {
      probe[i] = i;
      hue[i] = (i * 0.618034) % 1;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aProbe", new THREE.BufferAttribute(probe, 1));
    g.setAttribute("aHue", new THREE.BufferAttribute(hue, 1));
    return g;
  }, []);

  const headMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: HEAD_VERT,
        fragmentShader: HEAD_FRAG,
        uniforms: {
          uFlare: { value: new Float32Array(PROBES) },
          uPixelRatio: { value: px },
          uDim: { value: 1 },
          uColA: { value: colA },
          uColB: { value: colB },
          uColC: { value: colC },
        },
        ...ADDITIVE,
      }),
    [px, colA, colB, colC],
  );

  useEffect(
    () => () => {
      trailGeo.dispose();
      trailMat.dispose();
      headGeo.dispose();
      headMat.dispose();
    },
    [trailGeo, trailMat, headGeo, headMat],
  );

  // Pointer (NDC) + bump state + click-to-spawn.
  const pointerNdc = useRef({ x: 0, y: 0, lastMove: -10 });
  const bump = useRef({ x: 0, y: 0, amp: 0 });
  const spawnQueue = useRef<{ x: number; y: number }[]>([]);
  const camRef = useRef<THREE.Camera | null>(null);
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const ndcVec = useMemo(() => new THREE.Vector2(), []);

  useEffect(() => {
    const toPlane = (clientX: number, clientY: number) => {
      const cam = camRef.current;
      if (!cam) return null;
      ndcVec.set((clientX / window.innerWidth) * 2 - 1, -((clientY / window.innerHeight) * 2 - 1));
      raycaster.setFromCamera(ndcVec, cam);
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;
      if (d.y >= -1e-4) return null;
      const t = -o.y / d.y;
      const wx = o.x + d.x * t;
      const wz = o.z + d.z * t;
      // world (x, 0, z) -> plane coords (x, -z) (group is rotated -PI/2 about X)
      return { x: wx, y: -wz };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointerNdc.current.x = e.clientX;
      pointerNdc.current.y = e.clientY;
      pointerNdc.current.lastMove = performance.now() / 1000;
    };
    const onClick = (e: MouseEvent) => {
      // Only a "playing the arena" click: hero fold, not on an interactive element.
      if (window.scrollY > window.innerHeight * 1.1) return;
      const el = e.target as HTMLElement | null;
      if (el?.closest("a,button,input,textarea,select,[role='button'],[data-no-spawn]")) return;
      const hit = toPlane(e.clientX, e.clientY);
      if (!hit) return;
      if (Math.abs(hit.x) > PLANE_W / 2 || Math.abs(hit.y) > PLANE_H / 2) return;
      spawnQueue.current.push(hit);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, [raycaster, ndcVec]);

  const guard = useMemo(() => createFpsGuard({ onStrain }), [onStrain]);

  // Camera rig: hero 3/4 establishing shot -> quiet top-down cartography below fold.
  const START_POS = useMemo(() => new THREE.Vector3(0, 10.5, 24), []);
  const TOP_POS = useMemo(() => new THREE.Vector3(BASIN.x, 32, -BASIN.y + 14), []);
  const START_LOOK = useMemo(() => new THREE.Vector3(3, -1, 2), []);
  const TOP_LOOK = useMemo(() => new THREE.Vector3(BASIN.x, 0, -BASIN.y), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);
  const eased = useRef({ scroll: 0, camX: 0, camY: 0 });
  const trailRef = useRef<THREE.Points>(null);
  const headRef = useRef<THREE.Points>(null);
  const terrainRef = useRef<THREE.Mesh>(null);

  // Respawn probe i (rim of the basin, or an explicit click position). Touches only
  // ref-held state + scene objects reached through refs (React-compiler safe).
  const respawn = (i: number, atX?: number, atY?: number) => {
    const sim = simRef.current;
    const trail = trailRef.current;
    if (!sim || !trail) return;
    let nx: number;
    let ny: number;
    if (atX !== undefined && atY !== undefined) {
      nx = atX;
      ny = atY;
    } else {
      const ang = sim.rand() * Math.PI * 2;
      const rad = 24 + sim.rand() * 12;
      nx = Math.max(-PLANE_W / 2 + 4, Math.min(PLANE_W / 2 - 4, BASIN.x + Math.cos(ang) * rad));
      ny = Math.max(-PLANE_H / 2 + 4, Math.min(PLANE_H / 2 - 4, BASIN.y + Math.sin(ang) * rad));
    }
    sim.px[i] = nx;
    sim.py[i] = ny;
    sim.vx[i] = 0;
    sim.vy[i] = 0;
    sim.stuck[i] = 0;
    sim.flare[i] = 1;
    // Reset the whole ring to the new position so there is no teleport streak.
    const pos = trail.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    for (let k = 0; k < TRAIL; k++) {
      const idx = (i * TRAIL + k) * 3;
      arr[idx] = nx;
      arr[idx + 1] = ny;
      arr[idx + 2] = 0;
    }
    pos.needsUpdate = true;
  };

  useFrame((state, delta) => {
    guard(delta);
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 1 / 20);
    const cam = state.camera;
    camRef.current = cam;

    // Lazy sim init + first spawn pass (rim ring, no flares yet).
    if (!simRef.current) {
      simRef.current = createSim();
      for (let i = 0; i < PROBES; i++) respawn(i);
      simRef.current.flare.fill(0);
    }
    const sim = simRef.current;
    const trail = trailRef.current;
    const head = headRef.current;
    const terrain = terrainRef.current;
    if (!trail || !head || !terrain) return;
    const tU = (terrain.material as THREE.ShaderMaterial).uniforms;

    // Scroll: 0..1 over ~1.25 viewports; camera pull-up + global dim.
    const raw = Math.min(window.scrollY / Math.max(window.innerHeight * 1.25, 1), 1);
    const ease = 1 - Math.exp(-3 * dt);
    eased.current.scroll += (raw - eased.current.scroll) * ease;
    const s = eased.current.scroll;
    const dim = 1 - 0.68 * THREE.MathUtils.smoothstep(s, 0.25, 1);

    // Pointer bump: follows the cursor while it moves over the fold, relaxes when idle.
    const now = performance.now() / 1000;
    const active = now - pointerNdc.current.lastMove < 1.4 && raw < 0.85;
    if (active && camRef.current) {
      ndcVec.set(
        (pointerNdc.current.x / window.innerWidth) * 2 - 1,
        -((pointerNdc.current.y / window.innerHeight) * 2 - 1),
      );
      raycaster.setFromCamera(ndcVec, camRef.current);
      const o = raycaster.ray.origin;
      const d = raycaster.ray.direction;
      if (d.y < -1e-4) {
        const tt = -o.y / d.y;
        const hx = o.x + d.x * tt;
        const hy = -(o.z + d.z * tt);
        bump.current.x += (hx - bump.current.x) * (1 - Math.exp(-8 * dt));
        bump.current.y += (hy - bump.current.y) * (1 - Math.exp(-8 * dt));
      }
    }
    const ampTarget = active ? 2.3 : 0;
    bump.current.amp += (ampTarget - bump.current.amp) * (1 - Math.exp(-4 * dt));
    (tU.uBump.value as THREE.Vector3).set(bump.current.x, bump.current.y, bump.current.amp);
    tU.uTime.value = t;
    tU.uScroll.value = s;
    tU.uIntensity.value = dim;

    // Spawns (clicks) — replace probes round-robin.
    while (spawnQueue.current.length) {
      const at = spawnQueue.current.shift()!;
      respawn(sim.spawnCursor % PROBES, at.x, at.y);
      sim.spawnCursor++;
    }

    // ── momentum gradient descent on the live objective ──
    // Constants tuned in scratchpad/sim-check3.mjs (variant D "calm", softened): the
    // wide EPS samples a SMOOTHED loss (rolls through micro-minima), the weak L2
    // "weight decay" pull guarantees eventual convergence to the basin, continuous
    // SGD noise keeps motion organic — journeys average ~6-9s, never frantic.
    const EPS = 1.6;
    const ACC = 8.5;
    const FRIC = 0.7;
    const WD = 0.032;
    const NOISE = 4.5;
    const posAttr = trail.geometry.getAttribute("position") as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const headPos = head.geometry.getAttribute("position") as THREE.BufferAttribute;
    const headArr = headPos.array as Float32Array;
    const bx = bump.current.x;
    const by = bump.current.y;
    const ba = bump.current.amp;

    for (let i = 0; i < PROBES; i++) {
      const x = sim.px[i];
      const y = sim.py[i];
      let gx =
        (terrainHeightJS(x + EPS, y, t, bx, by, ba) - terrainHeightJS(x - EPS, y, t, bx, by, ba)) /
        (2 * EPS);
      let gy =
        (terrainHeightJS(x, y + EPS, t, bx, by, ba) - terrainHeightJS(x, y - EPS, t, bx, by, ba)) /
        (2 * EPS);
      gx += (x - BASIN.x) * WD; // L2 weight decay toward the minimum
      gy += (y - BASIN.y) * WD;
      const dampen = Math.exp(-FRIC * dt);
      sim.vx[i] = (sim.vx[i] - gx * ACC * dt + (sim.rand() - 0.5) * NOISE * dt) * dampen;
      sim.vy[i] = (sim.vy[i] - gy * ACC * dt + (sim.rand() - 0.5) * NOISE * dt) * dampen;
      const sp = Math.hypot(sim.vx[i], sim.vy[i]);
      const MAX = 6.5;
      if (sp > MAX) {
        sim.vx[i] *= MAX / sp;
        sim.vy[i] *= MAX / sp;
      }
      sim.px[i] += sim.vx[i] * dt;
      sim.py[i] += sim.vy[i] * dt;

      // walls: reflect softly
      const HX = PLANE_W / 2 - 2;
      const HY = PLANE_H / 2 - 2;
      if (Math.abs(sim.px[i]) > HX) {
        sim.px[i] = Math.sign(sim.px[i]) * HX;
        sim.vx[i] *= -0.4;
      }
      if (Math.abs(sim.py[i]) > HY) {
        sim.py[i] = Math.sign(sim.py[i]) * HY;
        sim.vy[i] *= -0.4;
      }

      // hard-stall insurance (continuous noise handles almost every minimum)
      if (sp < 0.25) sim.stuck[i] += dt;
      else sim.stuck[i] = 0;
      if (sim.stuck[i] > 2.5) {
        sim.vx[i] += (sim.rand() - 0.5) * 3;
        sim.vy[i] += (sim.rand() - 0.5) * 3;
        sim.stuck[i] = 0;
      }
      // arrival -> flare + rim respawn
      const ddx = sim.px[i] - BASIN.x;
      const ddy = sim.py[i] - BASIN.y;
      if (ddx * ddx + ddy * ddy < 7) respawn(i);

      sim.flare[i] *= Math.exp(-2.6 * dt);

      const hh = terrainHeightJS(sim.px[i], sim.py[i], t, bx, by, ba);
      headArr[i * 3] = sim.px[i];
      headArr[i * 3 + 1] = sim.py[i];
      headArr[i * 3 + 2] = hh + 0.4;
    }
    headPos.needsUpdate = true;

    // trail ring writes at WRITE_HZ
    sim.writeTimer += dt;
    const step = 1 / WRITE_HZ;
    while (sim.writeTimer >= step) {
      sim.writeTimer -= step;
      for (let i = 0; i < PROBES; i++) {
        sim.heads[i] = (sim.heads[i] + 1) % TRAIL;
        const idx = (i * TRAIL + sim.heads[i]) * 3;
        posArr[idx] = sim.px[i];
        posArr[idx + 1] = sim.py[i];
        posArr[idx + 2] = terrainHeightJS(sim.px[i], sim.py[i], t, bx, by, ba) + 0.3;
      }
      posAttr.needsUpdate = true;
    }

    // uniforms for trails/heads
    const tm = trail.material as THREE.ShaderMaterial;
    (tm.uniforms.uHeads.value as Float32Array).set(sim.heads);
    tm.uniforms.uDim.value = dim;
    const hm = head.material as THREE.ShaderMaterial;
    (hm.uniforms.uFlare.value as Float32Array).set(sim.flare);
    hm.uniforms.uDim.value = dim;

    // camera rig + pointer parallax
    const nx = (pointerNdc.current.x / Math.max(window.innerWidth, 1)) * 2 - 1;
    const ny = -((pointerNdc.current.y / Math.max(window.innerHeight, 1)) * 2 - 1);
    eased.current.camX += (nx - eased.current.camX) * ease;
    eased.current.camY += (ny - eased.current.camY) * ease;
    cam.position.lerpVectors(START_POS, TOP_POS, s);
    cam.position.x += eased.current.camX * 2.0 * (1 - s);
    cam.position.y += eased.current.camY * 1.2 * (1 - s);
    lookTarget.lerpVectors(START_LOOK, TOP_LOOK, s);
    cam.lookAt(lookTarget);
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={terrainRef} frustumCulled={false}>
        <planeGeometry args={[PLANE_W, PLANE_H, segments[0], segments[1]]} />
        <shaderMaterial
          vertexShader={TERRAIN_VERT}
          fragmentShader={TERRAIN_FRAG}
          uniforms={terrainUniforms}
        />
      </mesh>
      <points ref={trailRef} geometry={trailGeo} material={trailMat} frustumCulled={false} renderOrder={1} />
      <points ref={headRef} geometry={headGeo} material={headMat} frustumCulled={false} renderOrder={2} />
    </group>
  );
}

export default function DescentArenaCanvas() {
  // Tier once at mount (this file only mounts on the governed desktop path, but the
  // pointer/width tier still splits bloom + mesh density).
  const [tier] = useState<Tier>(() => {
    if (typeof window === "undefined") return "low";
    const fine =
      window.matchMedia("(pointer: fine)").matches && window.matchMedia("(hover: hover)").matches;
    return fine && window.innerWidth >= 768 ? "high" : "low";
  });
  const [bloom, setBloom] = useState(tier === "high");

  const segments: [number, number] = tier === "high" ? [96, 128] : [40, 56];
  const dpr: [number, number] = tier === "high" ? DPR_CAP : [1, 1.5];

  return (
    <Canvas
      className="size-full"
      dpr={dpr}
      gl={{
        antialias: false,
        alpha: false,
        powerPreference: tier === "high" ? "high-performance" : "low-power",
      }}
      camera={{ fov: 46, near: 0.1, far: 140, position: [0, 10.5, 24] }}
      frameloop="always"
      aria-hidden
    >
      <color attach="background" args={[BASE_HEX]} />
      <ArenaScene segments={segments} onStrain={() => setBloom(false)} />
      {bloom && (
        <EffectComposer multisampling={0} enableNormalPass={false}>
          <Bloom
            intensity={0.85}
            luminanceThreshold={0.2}
            luminanceSmoothing={0.5}
            radius={0.7}
            mipmapBlur
          />
          <Vignette offset={0.28} darkness={0.62} />
        </EffectComposer>
      )}
    </Canvas>
  );
}
