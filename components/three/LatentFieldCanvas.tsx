"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";
import { subscribeVelocity } from "@/lib/velocity-bus";

silenceThreeClockDeprecation();

/**
 * LatentField (V3 Phase 2 / E1) — the shared latent-space particle engine. ONE
 * governed point cloud that lives in two force modes and morphs between them:
 *   - FLOW (uProgress 0): particles drift through a curl-noise velocity field —
 *     the "raw data / unlearned" state (chaos).
 *   - CLUSTERS (uProgress 1): particles settle onto procedural latent centroids —
 *     the "the model found structure / learned" state (meaning).
 * Scroll drives the morph (the velocity bus's page `progress`), so a visitor
 * literally watches noise resolve into structure as they read. The cursor perturbs
 * the field ("a live system you can touch"). This is the rig E2 (Work clusters) and
 * E3 (About face target) reuse — only the `targets` differ per page.
 *
 * WebGL2 points + custom ShaderMaterial (additive glow, soft round sprites,
 * indigo->violet->cyan ramp). The morph + curl flow + cursor repulsion all live in
 * the vertex shader (uniform-driven, no per-frame CPU particle loop), matching the
 * P9/P11 engine. Glow comes from additive blending of soft-haloed sprites (no
 * post-process pass), so the canvas stays transparent and the iridescent poster
 * shows through behind it. Governed: dpr-capped, FPS-guarded (sheds point size on
 * strain), mounted only while the parent gate says so. The page reads fine with this
 * gone — it is decoration over the DOM.
 */

const PALETTE = ["#6b7cff", "#8b7cff", "#67e8f9"]; // indigo -> violet -> cyan

/** Sample the indigo->violet->cyan ramp at t in 0..1. */
function rampColor(t: number): THREE.Color {
  const stops = PALETTE.map((h) => new THREE.Color(h));
  const x = THREE.MathUtils.clamp(t, 0, 1) * (stops.length - 1);
  const i = Math.min(Math.floor(x), stops.length - 2);
  return stops[i].clone().lerp(stops[i + 1], x - i);
}

const vertexShader = /* glsl */ `
  precision highp float;
  attribute vec3 aHome;       // wide-scatter flow home
  attribute vec3 aTarget;     // cluster centroid + offset (the learned goal)
  attribute vec3 aColor;      // per-cluster ramp color
  attribute float aSeed;      // per-particle phase
  uniform float uTime;
  uniform float uProgress;    // 0 flow .. 1 clustered
  uniform float uVelocity;    // smoothed |scroll velocity| (turbulence kick)
  uniform vec3 uMouse;        // cursor projected to the z=0 plane
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vGlow;
  varying float vDepth;

  // Simplex 2D noise (Ashima / Ian McEwan, public domain) — same as the hero.
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

  // Curl of the noise field -> a divergence-free (swirling) flow direction.
  vec2 curl(vec2 p) {
    float e = 0.12;
    float a = snoise(p + vec2(0.0, e));
    float b = snoise(p - vec2(0.0, e));
    float c = snoise(p + vec2(e, 0.0));
    float d = snoise(p - vec2(e, 0.0));
    return vec2(a - b, -(c - d)) / (2.0 * e);
  }

  void main() {
    // FLOW: advected curl drift around the scattered home (bounded time -> no
    // precision blowup); a faster scroll kicks the turbulence up. Calmed pass
    // (premium): time scale + curl magnitude + velocity coupling all dialed down
    // ~35-40% so the field drifts slowly and cinematically instead of churning.
    float t = mod(uTime, 200.0) * 0.032;
    vec2 q = aHome.xy * 0.075 + vec2(t, t * 0.7);
    vec3 flow = aHome;
    flow.xy += curl(q) * (1.05 + uVelocity * 0.32);
    flow.z += sin(uTime * 0.32 + aSeed * 6.2831) * 0.5;

    // CLUSTERED: settle onto the target with a faint breathing so it stays alive.
    vec3 clustered = aTarget;
    clustered.x += sin(uTime * 0.8 + aSeed * 6.2831) * 0.05;
    clustered.y += cos(uTime * 0.7 + aSeed * 6.2831) * 0.05;

    float p = smoothstep(0.0, 1.0, uProgress);
    vec3 pos = mix(flow, clustered, p);

    // Cursor repulsion — felt more once structure has formed ("perturb it").
    vec3 dm = pos - uMouse;
    float dist = length(dm.xy);
    float force = smoothstep(3.0, 0.0, dist);
    pos.xy += normalize(dm.xy + 0.0001) * force * (1.0 + 1.8 * p);
    vGlow = force;

    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vDepth = -mv.z;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, uSize * uPixelRatio / max(-mv.z, 0.1));
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uHot;          // cursor / convergence flourish (cyan)
  varying vec3 vColor;
  varying float vGlow;
  varying float vDepth;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d2 = dot(uv, uv);
    if (d2 > 0.25) discard;
    // Bright core + soft outer halo -> a bloom-like glow under additive blending,
    // no post-process pass needed (keeps the canvas transparent + cheap).
    float disc = smoothstep(0.25, 0.0, d2);
    float glow = disc * disc;                    // tighter falloff = hot core
    float halo = disc * 0.35;                    // wide soft skirt
    vec3 col = mix(vColor, uHot, vGlow * 0.85);
    // Gentle depth fade so far particles recede into the base (keeps text legible).
    float fade = clamp(1.0 - (vDepth - 11.0) / 36.0, 0.22, 1.0);
    // Calmed pass: overall alpha dialed back ~20% so the field reads as a quiet,
    // dim cinematic backdrop rather than a bright particle storm behind the copy.
    gl_FragColor = vec4(col * (1.0 + glow * 0.55), (glow + halo) * fade * 0.8);
  }
`;

type Built = { pts: THREE.Points; geom: THREE.BufferGeometry; mat: THREE.ShaderMaterial };

/**
 * Cluster centroid arrangement — the only per-page difference (the "scene"):
 *  - "scatter":       K centroids spread across the frame (Home — abstract structure).
 *  - "radial":        one dense core + a ring of satellites (About — "you, embedded,
 *                     with skill domains clustered around you").
 *  - "constellation": many TIGHT points spread wide (Work — discrete projects as
 *                     stars/points in latent space).
 */
export type FieldLayout = "scatter" | "radial" | "constellation";

type Centroid = { x: number; y: number; z: number; r: number; color: THREE.Color };

function makeCentroids(clusterCount: number, layout: FieldLayout): Centroid[] {
  const denom = Math.max(clusterCount - 1, 1);
  if (layout === "constellation") {
    // Each cluster is a tight, near-point "star" (one per project), spread wide.
    return Array.from({ length: clusterCount }, (_, k) => ({
      x: (Math.random() * 2 - 1) * 12.5,
      y: (Math.random() * 2 - 1) * 6.5,
      z: (Math.random() * 2 - 1) * 1.5,
      r: 0.45 + Math.random() * 0.5,
      color: rampColor(k / denom),
    }));
  }
  if (layout === "radial") {
    return Array.from({ length: clusterCount }, (_, k) => {
      if (k === 0) {
        // The core ("you") — central, larger, mid-ramp violet.
        return { x: 0, y: 0, z: 0, r: 1.8, color: rampColor(0.5) };
      }
      // Satellites evenly placed on a slightly squashed ring.
      const a = ((k - 1) / Math.max(clusterCount - 1, 1)) * Math.PI * 2 + 0.4;
      return {
        x: Math.cos(a) * 8.5,
        y: Math.sin(a) * 4.6,
        z: (Math.random() * 2 - 1) * 1.0,
        r: 0.8 + Math.random() * 1.0,
        color: rampColor(k / denom),
      };
    });
  }
  return Array.from({ length: clusterCount }, (_, k) => ({
    x: (Math.random() * 2 - 1) * 10,
    y: (Math.random() * 2 - 1) * 5.5,
    z: (Math.random() * 2 - 1) * 1.2,
    r: 0.9 + Math.random() * 1.5,
    color: rampColor(k / denom),
  }));
}

/** Build the flow homes + cluster targets once (Math.random is impure -> effect). */
function buildField(count: number, clusterCount: number, layout: FieldLayout): Built {
  const homes = new Float32Array(count * 3);
  const targets = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const seeds = new Float32Array(count);

  const centroids = makeCentroids(clusterCount, layout);

  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    // Flow home: a wide scatter that overfills the frame (full-bleed drift).
    homes[i * 3] = (Math.random() * 2 - 1) * 16;
    homes[i * 3 + 1] = (Math.random() * 2 - 1) * 9.5;
    homes[i * 3 + 2] = (Math.random() * 2 - 1) * 2;

    // Cluster target: a center-dense disc around an evenly-assigned centroid.
    const c = centroids[i % clusterCount];
    const a = Math.random() * Math.PI * 2;
    const rr = Math.pow(Math.random(), 0.7) * c.r;
    targets[i * 3] = c.x + Math.cos(a) * rr;
    targets[i * 3 + 1] = c.y + Math.sin(a) * rr;
    targets[i * 3 + 2] = c.z + (Math.random() * 2 - 1) * 0.4;

    // Per-cluster color with a touch of per-particle variance.
    tmp.copy(c.color).offsetHSL(0, 0, (Math.random() - 0.5) * 0.12);
    colors[i * 3] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;

    seeds[i] = Math.random();
  }

  const geom = new THREE.BufferGeometry();
  // `position` is required by three but unused by the shader (it reads aHome).
  geom.setAttribute("position", new THREE.BufferAttribute(homes.slice(), 3));
  geom.setAttribute("aHome", new THREE.BufferAttribute(homes, 3));
  geom.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
  geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));

  const mat = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uProgress: { value: 0 },
      uVelocity: { value: 0 },
      uMouse: { value: new THREE.Vector3(999, 999, 0) },
      uSize: { value: 40 },
      uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
      uHot: { value: new THREE.Color("#67e8f9") },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const pts = new THREE.Points(geom, mat);
  pts.frustumCulled = false;
  return { pts, geom, mat };
}

function FieldPoints({
  count,
  clusterCount,
  layout,
}: {
  count: number;
  clusterCount: number;
  layout: FieldLayout;
}) {
  const { camera } = useThree();
  const [built, setBuilt] = useState<Built | null>(null);
  // Mutate uniforms through a ref (not the useState value) — the per-frame writes
  // are immutability-lint-safe this way, matching the finale/hero pattern.
  const rt = useRef<THREE.ShaderMaterial | null>(null);

  // Live morph driver (read off the velocity bus; never React state -> no re-render).
  const driver = useRef({ progress: 0, velocity: 0 });
  const eased = useRef({ progress: 0, velocity: 0 });
  const pointerNdc = useRef(new THREE.Vector2(2, 2)); // offscreen until first move

  // Build the cloud off the mount tick (sampling + Math.random kept out of render).
  useEffect(() => {
    let disposed = false;
    let made: Built | null = null;
    const id = requestAnimationFrame(() => {
      if (disposed) return;
      made = buildField(count, clusterCount, layout);
      rt.current = made.mat;
      setBuilt(made);
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(id);
      rt.current = null;
      made?.geom.dispose();
      made?.mat.dispose();
    };
  }, [count, clusterCount, layout]);

  // One shared signal: scroll progress + smoothed velocity from the velocity bus.
  useEffect(() => {
    return subscribeVelocity((s) => {
      driver.current.progress = s.progress;
      driver.current.velocity = s.velocity;
    });
  }, []);

  // Cursor in NDC from a window listener (the canvas is pointer-events-none, so
  // R3F's own pointer never updates — same approach as the hero shader).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointerNdc.current.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -((e.clientY / window.innerHeight) * 2 - 1),
      );
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // On sustained strain, shed point size (the dominant fill cost for big additive
  // sprites); recover it when frames do. No rebuild, no frozen frameloop. setState
  // runs in the guard callback (not during render); useFrame reads the latest value.
  const [strained, setStrained] = useState(false);
  const guard = useMemo(
    () => createFpsGuard({ onStrain: () => setStrained(true), onRelief: () => setStrained(false) }),
    [],
  );
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const mouseWorld = useRef(new THREE.Vector3(999, 999, 0));

  useFrame((state, delta) => {
    guard(delta);
    const mat = rt.current;
    if (!mat) return;
    const k = 1 - Math.exp(-4 * delta);

    // Morph reaches "settled" a touch before the very bottom so the footer is calm.
    const targetProgress = Math.min(driver.current.progress / 0.85, 1);
    eased.current.progress += (targetProgress - eased.current.progress) * k;
    const targetVel = THREE.MathUtils.clamp(Math.abs(driver.current.velocity) * 0.04, 0, 2);
    eased.current.velocity += (targetVel - eased.current.velocity) * (1 - Math.exp(-6 * delta));

    // Project the cursor onto the z=0 plane for world-space repulsion.
    ray.setFromCamera(pointerNdc.current, camera);
    ray.ray.intersectPlane(plane, mouseWorld.current);

    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uProgress.value = eased.current.progress;
    mat.uniforms.uVelocity.value = eased.current.velocity;
    mat.uniforms.uMouse.value.copy(mouseWorld.current);
    mat.uniforms.uSize.value = strained ? 22 : 34;
    mat.uniforms.uPixelRatio.value = Math.min(state.viewport.dpr, 2);
  });

  if (!built) return null;
  return <primitive object={built.pts} />;
}

export default function LatentFieldCanvas({
  count,
  clusterCount = 9,
  layout = "scatter",
}: {
  count?: number;
  clusterCount?: number;
  layout?: FieldLayout;
}) {
  // Tier once at mount (the parent gate already guarantees desktop + motion).
  const [tier] = useState<"high" | "low">(() =>
    typeof window !== "undefined" && window.innerWidth >= 1280 ? "high" : "low",
  );
  // Calmed pass (premium): density cut ~50% (14000->7000 / 8000->4200) for a
  // sparser, less-noisy cinematic field. Pairs with the slower flow + dimmer
  // alpha above; net effect is "calm deep space", not a busy particle storm.
  const resolvedCount = count ?? (tier === "high" ? 7000 : 4200);

  return (
    <Canvas
      className="size-full"
      dpr={DPR_CAP}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.1, far: 60, position: [0, 0, 14] }}
      frameloop="always"
      aria-hidden
    >
      <FieldPoints count={resolvedCount} clusterCount={clusterCount} layout={layout} />
    </Canvas>
  );
}
