"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Liquid indigo/violet hero background. One full-screen quad, one draw call,
 * no postprocessing: a domain-warped fbm field blends base -> indigo ->
 * violet with subtle pointer parallax. Color energy lives top-right so the
 * left text column keeps AAA contrast.
 */

const vertexShader = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform vec3 uBase;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uIntensity;

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
    m = m * m;
    m = m * m;
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
    float value = 0.0;
    float amplitude = 0.55;
    for (int i = 0; i < 3; i++) {
      value += amplitude * snoise(p);
      p *= 2.1;
      amplitude *= 0.5;
    }
    return value;
  }

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    float aspectX = uResolution.x / uResolution.y;
    vec2 p = uv * vec2(aspectX, 1.0) * 0.9;

    float t = uTime * 0.05;
    vec2 drift = uMouse * 0.1;

    // Slow domain warp: large soft forms, not marble texture.
    float warp = fbm(p * 0.8 + t + drift);
    float n = fbm(p + warp * 0.9 - t * 0.5 + drift);

    // Energy is one soft gaussian blob upper-right; portrait viewports push
    // it higher and dim it so mobile copy never sits on color.
    float portrait = step(aspectX, 0.85);
    vec2 focus = vec2(0.76 + uMouse.x * 0.04, 0.7 + portrait * 0.2 + uMouse.y * 0.04);
    vec2 d = (uv - focus) * vec2(max(aspectX, 1.0), 1.35);
    float blob = exp(-dot(d, d) * (3.6 + portrait * 2.4));
    // Hard protection for the left text column and the header band.
    float sideFade = smoothstep(0.2, 0.6, uv.x + portrait * 0.25);
    float topFade = smoothstep(1.0, 0.86, uv.y);
    float energy = blob * sideFade * topFade * mix(1.0, 0.5, portrait);

    // Sparse fields: only noise peaks glow, so the form stays soft.
    float fieldA = smoothstep(0.3, 1.0, n * 0.5 + 0.5);
    float fieldB = smoothstep(0.58, 1.05, (n + warp * 0.5) * 0.5 + 0.5);

    vec3 col = uBase;
    col = mix(col, uColorA, fieldA * energy * uIntensity);
    col = mix(col, uColorB, fieldB * energy * uIntensity * 0.8);

    // Dither to stop gradient banding on the dark base.
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 3.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;

type ShaderPlaneProps = { isLight: boolean };

const DARK_BASE = new THREE.Color("#0a0a0f");
const LIGHT_BASE = new THREE.Color("#f8f8ff");

function ShaderPlane({ isLight }: ShaderPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBase: { value: new THREE.Color("#0a0a0f") },
      uColorA: { value: new THREE.Color("#5b6ef5") },
      uColorB: { value: new THREE.Color("#8b5cf6") },
      uIntensity: { value: 0.55 },
    }),
    [],
  );

  // Pointer parallax from window events: the canvas is pointer-events-none.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      pointerTarget.current = {
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -((e.clientY / window.innerHeight) * 2 - 1),
      };
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame(({ clock, size, viewport }, delta) => {
    const material = materialRef.current;
    if (!material) return;
    material.uniforms.uTime.value = clock.elapsedTime;
    material.uniforms.uResolution.value.set(
      size.width * viewport.dpr,
      size.height * viewport.dpr,
    );
    // Theme applied per frame (R3F mutates in the loop, not in effects).
    (material.uniforms.uBase.value as THREE.Color).copy(isLight ? LIGHT_BASE : DARK_BASE);
    material.uniforms.uIntensity.value = isLight ? 0.24 : 0.45;
    // Exponential damping toward the pointer: parallax with momentum.
    const mouse = material.uniforms.uMouse.value as THREE.Vector2;
    const ease = 1 - Math.exp(-2.5 * delta);
    mouse.x += (pointerTarget.current.x - mouse.x) * ease;
    mouse.y += (pointerTarget.current.y - mouse.y) * ease;
  });

  return (
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        depthTest={false}
        depthWrite={false}
      />
    </mesh>
  );
}

export default function HeroShader({ isLight }: ShaderPlaneProps) {
  return (
    <Canvas
      className="size-full"
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      frameloop="always"
      aria-hidden
    >
      <ShaderPlane isLight={isLight} />
    </Canvas>
  );
}
