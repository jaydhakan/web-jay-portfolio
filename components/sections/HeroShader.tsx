"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";

// Install before the Canvas (and thus R3F's internal THREE.Clock) mounts.
silenceThreeClockDeprecation();

/**
 * "The Field", V3 P2 — the signature, now a REAL 3D loss-landscape you fly into.
 *
 * A displaced terrain mesh is the objective surface of a gradient-descent run:
 * rolling hills (fbm) sink into a broad glowing basin (the minimum). Iridescent
 * iso-contours crowd on the steep valley walls; a band of light sweeps from the
 * ridges down into the basin like an optimizer stepping downhill. As you scroll
 * the first viewport, the camera DIVES from an establishing wide shot down toward
 * the basin; on desktop the pointer parallaxes the camera. A bloom pass makes the
 * contours and basin glow like liquid light.
 *
 * Still ONE WebGL context / one draw scene (plan.md cardinal rule). Desktop-tiered:
 * full resolution + bloom on fine-pointer >=768; mobile gets a lighter terrain and
 * no post-processing. Mounting is gated by HeroBackground (reduced-motion / WebGL /
 * in-view / armed); the .hero-fallback iridescent gradient covers everything else.
 * The headline is a DOM element on top — energy is biased right so the left text
 * column stays dark (AAA), reinforced by the vignette.
 */

const BASE_HEX = "#0b0b11";

const vertexShader = /* glsl */ `
  precision highp float;
  uniform float uTime;
  varying float vHeight;
  varying float vNdcX;
  varying float vNdcY;
  varying float vFog;

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

  // The objective surface: rolling hills minus a broad basin (the minimum).
  float terrainHeight(vec2 p) {
    float hills = fbm(p * 0.16 + vec2(uTime * 0.018, uTime * 0.012));
    vec2 c = vec2(6.0, 18.0);            // basin center (plane coords)
    float d2 = dot(p - c, p - c);
    float basin = exp(-d2 / 230.0);
    return hills * 3.1 - basin * 5.2;
  }

  void main() {
    float h = terrainHeight(position.xy);
    vec3 pos = position;
    pos.z += h;                          // displace along local normal (-> world Y)
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip = projectionMatrix * mv;
    vHeight = h;
    vNdcX = clip.x / clip.w;             // -1..1 screen X (for the left text guard)
    vNdcY = clip.y / clip.w;
    vFog = -mv.z;                         // view-space depth (positive into screen)
    gl_Position = clip;
  }
`;

const fragmentShader = /* glsl */ `
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
    // Iso-contours of the loss surface. fwidth keeps them crisp + resolution
    // independent; lines crowd where the slope (|dh|) is large -> the valley walls.
    float freq = 2.1;
    float hc = h * freq;
    float aw = max(fwidth(hc), 1e-3);
    float fm = abs(fract(hc - 0.5) - 0.5);
    float minorLine = 1.0 - smoothstep(0.0, aw + 0.012, fm);
    float fM = abs(fract(hc / 5.0 - 0.5) - 0.5);
    float majorLine = 1.0 - smoothstep(0.0, aw / 5.0 + 0.009, fM);
    float steep = smoothstep(0.0, 0.7, fwidth(h));      // 0 flat, 1 steep wall

    // Keep the left text column + the very top dark (the H1 is a DOM overlay there).
    float leftGuard = smoothstep(0.12, 0.62, vNdcX);
    float topGuard = 1.0 - smoothstep(0.72, 1.0, vNdcY);
    float gate = leftGuard * topGuard;

    // Valley-floor wash so the basin reads as depth, not just outline.
    float basin = smoothstep(2.0, -5.2, h);

    // Alive: a band of light sweeps from the ridges down into the basin (the
    // optimizer stepping downhill; scroll advances it).
    float level = mix(3.0, -5.5, fract(uTime * 0.05 + uScroll * 0.6));
    float descend = 1.0 - smoothstep(0.0, 0.5, abs(h - level));
    float live = 1.0 + 0.6 * descend;

    // Compose: iridescent indigo -> violet -> cyan, emissive so bloom catches it.
    vec3 col = uBase;
    col = mix(col, uColorB, basin * 0.22 * gate * uIntensity);
    col = mix(col, uColorA, minorLine * (0.5 + 0.4 * steep) * gate * live * uIntensity);
    col = mix(col, uColorB, majorLine * (0.7 + 0.3 * steep) * gate * live * uIntensity);
    float crest = majorLine * descend * gate;
    col = mix(col, uColorC, clamp(crest, 0.0, 1.0) * uIntensity * 0.6);

    // Distance fog -> base, so far terrain fades and the horizon stays clean.
    float fog = smoothstep(uFogNear, uFogFar, vFog);
    col = mix(col, uBase, fog);

    // Dither out gradient banding on the dark base.
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 3.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

type Tier = "high" | "low";

function HeroScene({
  segments,
  onStrain,
}: {
  segments: [number, number];
  onStrain: () => void;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const eased = useRef({ x: 0, y: 0, scroll: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uIntensity: { value: 1.0 },
      uFogNear: { value: 14.0 },
      uFogFar: { value: 62.0 },
      uBase: { value: new THREE.Color(BASE_HEX) },
      uColorA: { value: new THREE.Color("#6b7cff") }, // indigo  — minor lines
      uColorB: { value: new THREE.Color("#8b7cff") }, // violet  — major lines + basin
      uColorC: { value: new THREE.Color("#67e8f9") }, // cyan    — live-crest highlight
    }),
    [],
  );

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointer.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const guard = useMemo(() => createFpsGuard({ onStrain }), [onStrain]);

  // Camera dive: establishing wide shot -> down into the basin, by scroll.
  const START_POS = useMemo(() => new THREE.Vector3(0, 10.5, 24), []);
  const END_POS = useMemo(() => new THREE.Vector3(2.2, 4.2, 9.5), []);
  const START_LOOK = useMemo(() => new THREE.Vector3(3, -1, 2), []);
  const END_LOOK = useMemo(() => new THREE.Vector3(4.5, -3.2, -9), []);
  const lookTarget = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    guard(delta);
    const mat = materialRef.current;
    const camera = state.camera; // from useFrame state (mutable, unlike a hook return)
    const ease = 1 - Math.exp(-3 * delta);

    // Scroll progress through the first viewport (0..1), eased.
    const target = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    eased.current.scroll += (target - eased.current.scroll) * ease;
    eased.current.x += (pointer.current.x - eased.current.x) * ease;
    eased.current.y += (pointer.current.y - eased.current.y) * ease;

    if (mat) {
      mat.uniforms.uTime.value = state.clock.elapsedTime;
      mat.uniforms.uScroll.value = eased.current.scroll;
    }

    const s = eased.current.scroll;
    camera.position.lerpVectors(START_POS, END_POS, s);
    camera.position.x += eased.current.x * 2.4; // pointer parallax
    camera.position.y += eased.current.y * 1.4;
    lookTarget.lerpVectors(START_LOOK, END_LOOK, s);
    camera.lookAt(lookTarget);
  });

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} frustumCulled={false}>
      <planeGeometry args={[64, 96, segments[0], segments[1]]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function HeroShader({
  running,
}: {
  /** false = pause the frameloop (kept mounted; avoids context re-init when the
   *  hero scrolls back into view). */
  running?: boolean;
}) {
  // Tier once at mount: desktop fine-pointer gets full res + bloom; mobile/coarse
  // gets a lighter terrain and no post-processing (matches the cursor/preloader
  // desktop-gating — the audit profile (coarse pointer) measures the cheap path).
  const [tier] = useState<Tier>(() => {
    if (typeof window === "undefined") return "low";
    const fine =
      window.matchMedia("(pointer: fine)").matches &&
      window.matchMedia("(hover: hover)").matches;
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
      frameloop={running === false ? "never" : "always"}
      aria-hidden
    >
      <color attach="background" args={[BASE_HEX]} />
      <HeroScene segments={segments} onStrain={() => setBloom(false)} />
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
