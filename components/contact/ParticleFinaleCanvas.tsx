"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";

silenceThreeClockDeprecation();

/**
 * GPU particle finale (V3 P11 / S12) — the closing argument. Tens of thousands of
 * particles assemble into the finale wordmark ("LET'S BUILD"), drift with curl
 * noise, and REPEL from the cursor (a force field you can push through the text),
 * springing back to their letter. Particle counts that are self-evidently real
 * engineering, not DOM trickery.
 *
 * WebGL2 points cloud (the plan's robust path; the WebGPU/TSL compute variant is
 * a later upgrade). Governed: dpr-capped, FPS-guarded, mounted + run only while
 * the finale is on-screen (parent gate), lazy on one route. The DOM heading
 * underneath is the SSR / a11y / no-JS / reduced-motion text.
 */

// Render the wordmark to an offscreen 2D canvas and sample lit pixels into
// particle target positions (centered, aspect-correct, in world units).
function sampleText(text: string, density: number) {
  const cw = 1024;
  const ch = 320;
  const c = document.createElement("canvas");
  c.width = cw;
  c.height = ch;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, cw, ch);
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 200px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillText(text, cw / 2, ch / 2 + 6);
  const data = ctx.getImageData(0, 0, cw, ch).data;

  const targets: number[] = [];
  const step = density; // sample every `density` px
  for (let y = 0; y < ch; y += step) {
    for (let x = 0; x < cw; x += step) {
      const a = data[(y * cw + x) * 4]; // red channel (white text on black)
      if (a > 128) {
        // map to world: width ~ 10 units, keep aspect
        const wx = (x / cw - 0.5) * 10;
        const wy = -(y / ch - 0.5) * (10 * (ch / cw));
        targets.push(wx, wy, (Math.random() - 0.5) * 0.6);
      }
    }
  }
  return new Float32Array(targets);
}

const vertexShader = /* glsl */ `
  precision highp float;
  attribute vec3 aTarget;
  attribute vec3 aHome;     // initial scattered position
  attribute float aSeed;
  uniform float uTime;
  uniform float uForm;      // 0 scattered .. 1 formed into the text
  uniform vec3 uMouse;      // cursor in world space (z=0 plane)
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vGlow;

  void main() {
    // Assemble: lerp from the scattered home to the text target.
    vec3 pos = mix(aHome, aTarget, uForm);

    // Ambient curl-ish breathing (bounded args -> no precision blowup).
    float t = mod(uTime, 120.0);
    pos.x += sin(t * 0.7 + aSeed * 6.2831) * 0.04;
    pos.y += cos(t * 0.6 + aSeed * 6.2831) * 0.04;

    // Cursor repulsion: push away within a radius, falloff smooth.
    vec3 d = pos - uMouse;
    float dist = length(d.xy);
    float force = smoothstep(2.4, 0.0, dist) * uForm;
    pos.xy += normalize(d.xy + 0.0001) * force * 1.7;
    vGlow = force;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.5, uSize * uPixelRatio / max(-mv.z, 0.1));
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vGlow;
  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;
    float edge = smoothstep(0.25, 0.05, d);
    vec3 col = mix(uColorA, uColorB, vGlow);
    gl_FragColor = vec4(col, edge);
  }
`;

function FinalePoints({ text, density, onStrain }: { text: string; density: number; onStrain: () => void }) {
  const { size, camera, pointer } = useThree();
  const rt = useRef<{ form: number; points: THREE.Points | null }>({ form: 0, points: null });
  const mouseWorld = useRef(new THREE.Vector3(999, 999, 0));

  // Build the cloud in an effect (sampling + Math.random are impure — kept out
  // of render). Holds the THREE.Points; rebuilt only when text/density change.
  const [built, setBuilt] = useState<{ pts: THREE.Points; count: number } | null>(null);

  useEffect(() => {
    let disposed = false;
    let made: { geom: THREE.BufferGeometry; mat: THREE.ShaderMaterial } | null = null;
    // Defer the heavy sampling + build off the mount tick (also keeps the
    // setState out of the synchronous effect body).
    const id = requestAnimationFrame(() => {
      const targets = sampleText(text, density);
      if (disposed || !targets || targets.length === 0) return;
      const count = targets.length / 3;
      const homes = new Float32Array(count * 3);
      const seeds = new Float32Array(count);
      for (let i = 0; i < count; i++) {
        // scattered start: a wide disc
        const a = Math.random() * Math.PI * 2;
        const r = 4 + Math.random() * 6;
        homes[i * 3] = Math.cos(a) * r;
        homes[i * 3 + 1] = Math.sin(a) * r * 0.6;
        homes[i * 3 + 2] = (Math.random() - 0.5) * 3;
        seeds[i] = Math.random();
      }
      const geom = new THREE.BufferGeometry();
      geom.setAttribute("position", new THREE.BufferAttribute(homes.slice(), 3));
      geom.setAttribute("aTarget", new THREE.BufferAttribute(targets, 3));
      geom.setAttribute("aHome", new THREE.BufferAttribute(homes, 3));
      geom.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uForm: { value: 0 },
          uMouse: { value: new THREE.Vector3(999, 999, 0) },
          uSize: { value: 22 },
          uPixelRatio: { value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1 },
          uColorA: { value: new THREE.Color("#8b7cff") },
          uColorB: { value: new THREE.Color("#67e8f9") },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const pts = new THREE.Points(geom, mat);
      pts.frustumCulled = false;
      made = { geom, mat };
      setBuilt({ pts, count });
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(id);
      made?.geom.dispose();
      made?.mat.dispose();
    };
  }, [text, density]);

  useEffect(() => {
    rt.current.points = built?.pts ?? null;
  }, [built]);

  const guard = useMemo(() => createFpsGuard({ onStrain }), [onStrain]);
  const raycastPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  const ray = useMemo(() => new THREE.Raycaster(), []);

  useFrame((state, delta) => {
    guard(delta);
    const pts = rt.current.points;
    if (!pts) return;
    const mat = pts.material as THREE.ShaderMaterial;
    // form-in over the first ~1.5s on-screen
    rt.current.form += (1 - rt.current.form) * (1 - Math.exp(-2.2 * delta));
    // project the pointer onto the z=0 plane for repulsion in world space
    ray.setFromCamera(pointer, camera);
    ray.ray.intersectPlane(raycastPlane, mouseWorld.current);
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uForm.value = rt.current.form;
    mat.uniforms.uMouse.value.copy(mouseWorld.current);
    mat.uniforms.uPixelRatio.value = Math.min(state.viewport.dpr, 2);
    void size;
  });

  if (!built) return null;
  return <primitive object={built.pts} />;
}

export default function ParticleFinaleCanvas({ text }: { text: string }) {
  // Lighter sampling on small screens (fewer particles); coarse density = more px gap.
  const [density] = useState(() => (typeof window !== "undefined" && window.innerWidth < 1024 ? 5 : 3));
  const [strained, setStrained] = useState(false);

  return (
    <Canvas
      className="size-full"
      dpr={DPR_CAP}
      gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 50, near: 0.1, far: 50, position: [0, 0, 9] }}
      frameloop={strained ? "demand" : "always"}
      aria-hidden
    >
      <FinalePoints text={text} density={strained ? density + 2 : density} onStrain={() => setStrained(true)} />
    </Canvas>
  );
}
