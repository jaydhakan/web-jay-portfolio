"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";

silenceThreeClockDeprecation();

/**
 * "You, as data" particle portrait (V3 P9 / S7) — the ML thesis as a self-
 * portrait. The headshot is sampled into a GPU point cloud (one particle per
 * sampled pixel); each particle's REST position is its pixel in the image plane,
 * its z pushed by luminance (pseudo-depth — swaps to a real offline depth map
 * when Jay's photo lands), its colour the pixel colour. The cloud breathes with
 * curl-style noise at rest and SCATTERS into a sphere then reforms on hover
 * (the gag: your photo is "just data" the system is converging). One governed
 * canvas (dpr-capped, FPS-guarded, mounted only in view by the parent gate);
 * the still next/image underneath stays the poster / SSR / a11y / RM layer.
 */

// Sample the image into typed arrays of positions + colours on a worker-free
// 2D canvas. Returns null if the image can't be read (CORS / not decoded).
function sampleImage(img: HTMLImageElement, grid: number) {
  const c = document.createElement("canvas");
  c.width = grid;
  c.height = grid;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  // object-fit: cover into the square grid.
  const s = Math.min(img.width, img.height);
  const sx = (img.width - s) / 2;
  const sy = (img.height - s) / 2;
  ctx.drawImage(img, sx, sy, s, s, 0, 0, grid, grid);
  let data: ImageData;
  try {
    data = ctx.getImageData(0, 0, grid, grid);
  } catch {
    return null; // tainted canvas
  }
  const count = grid * grid;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const randoms = new Float32Array(count); // per-particle scatter seed
  for (let i = 0; i < count; i++) {
    const px = i % grid;
    const py = Math.floor(i / grid);
    const r = data.data[i * 4] / 255;
    const g = data.data[i * 4 + 1] / 255;
    const b = data.data[i * 4 + 2] / 255;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // Centered, y-flipped image plane in [-1,1]; z from luminance (pseudo-depth).
    positions[i * 3] = (px / (grid - 1)) * 2 - 1;
    positions[i * 3 + 1] = -((py / (grid - 1)) * 2 - 1);
    positions[i * 3 + 2] = (lum - 0.5) * 0.5;
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
    randoms[i] = Math.random();
  }
  return { positions, colors, randoms, count };
}

const vertexShader = /* glsl */ `
  precision highp float;
  attribute vec3 aColor;
  attribute float aRandom;
  uniform float uTime;
  uniform float uScatter;   // 0 reformed (photo) .. 1 fully scattered (sphere)
  uniform float uSize;
  uniform float uPixelRatio;
  varying vec3 vColor;
  varying float vAlpha;

  // cheap hash-based 3D noise for curl-ish drift. fract() BEFORE sin() so the
  // argument stays small — sin() of large values loses precision (and can read
  // back as NaN) on some GL backends, which would blank the whole cloud.
  vec3 hash3(vec3 p) {
    p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
             dot(p, vec3(269.5, 183.3, 246.1)),
             dot(p, vec3(113.5, 271.9, 124.6)));
    return -1.0 + 2.0 * fract(sin(fract(p * 0.0173)) * 43758.5453123);
  }

  void main() {
    vColor = aColor;

    float t = mod(uTime, 100.0);
    vec3 drift = hash3(position * 2.0 + vec3(t * 0.15)) * 0.02;
    vec3 rest = position + drift;

    // Scatter target: a sphere shell, seeded per-particle so it disperses
    // chaotically and reforms deterministically.
    float a = aRandom * 6.2831853;
    float b = fract(aRandom * 17.0) * 3.1415926;
    vec3 sphere = vec3(sin(b) * cos(a), sin(b) * sin(a), cos(b)) * (1.3 + aRandom * 0.6);
    sphere += hash3(position + vec3(t * 0.4)) * 0.3 * uScatter;

    vec3 pos = mix(rest, sphere, uScatter);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.5, uSize * uPixelRatio / max(-mv.z, 0.1));
    vAlpha = mix(1.0, 0.55, uScatter);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    // round, soft-edged points
    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;
    float edge = smoothstep(0.25, 0.08, d);
    gl_FragColor = vec4(vColor, vAlpha * edge);
  }
`;

type Sampled = NonNullable<ReturnType<typeof sampleImage>>;

function PortraitPoints({
  src,
  grid,
  hovered,
  onStrain,
}: {
  src: string;
  grid: number;
  hovered: React.RefObject<boolean>;
  onStrain: () => void;
}) {
  const [data, setData] = useState<Sampled | null>(null);
  // Per-frame mutable state lives in a single ref object (the immutability lint
  // rule treats useMemo returns as frozen; refs are the sanctioned escape hatch
  // for the useFrame loop, matching HeroShader / FlowImageCanvas).
  const rt = useRef<{ scatter: number; points: THREE.Points | null }>({
    scatter: 0,
    points: null,
  });

  // Build the Points object imperatively once the image is sampled — declarative
  // <bufferAttribute> attach proved unreliable for a custom-shader points cloud
  // here (compiled + linked clean but drew nothing); constructing the geometry +
  // ShaderMaterial in JS is the robust idiom and disposes cleanly on unmount.
  const points = useMemo(() => {
    if (!data) return null;
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    geom.setAttribute("aColor", new THREE.BufferAttribute(data.colors, 3));
    geom.setAttribute("aRandom", new THREE.BufferAttribute(data.randoms, 1));
    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uScatter: { value: 0 },
        uSize: { value: 26 },
        uPixelRatio: {
          value: typeof window !== "undefined" ? Math.min(window.devicePixelRatio, 2) : 1,
        },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    const pts = new THREE.Points(geom, mat);
    pts.frustumCulled = false;
    return pts;
  }, [data]);

  // Dispose the previous geometry/material when the cloud is rebuilt or unmounts.
  useEffect(() => {
    rt.current.points = points;
    return () => {
      if (points) {
        points.geometry.dispose();
        (points.material as THREE.ShaderMaterial).dispose();
      }
    };
  }, [points]);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (cancelled) return;
      const sampled = sampleImage(img, grid);
      if (sampled) setData(sampled);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, grid]);

  const guard = useMemo(() => createFpsGuard({ onStrain }), [onStrain]);

  useFrame((state, delta) => {
    guard(delta);
    const pts = rt.current.points;
    if (!pts) return;
    const mat = pts.material as THREE.ShaderMaterial;
    const ease = 1 - Math.exp(-5 * delta);
    const target = hovered.current ? 1 : 0;
    rt.current.scatter += (target - rt.current.scatter) * ease;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uScatter.value = rt.current.scatter;
  });

  if (!points) return null;
  return <primitive object={points} />;
}

export default function ParticlePortraitCanvas({ src, grid = 260 }: { src: string; grid?: number }) {
  const hovered = useRef(false);
  const [strained, setStrained] = useState(false);

  return (
    <div
      className="absolute inset-0 transition-opacity duration-500"
      style={{ opacity: strained ? 0 : 1 }}
      onPointerEnter={() => (hovered.current = true)}
      onPointerLeave={() => (hovered.current = false)}
    >
      <Canvas
        className="size-full"
        dpr={DPR_CAP}
        gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        camera={{ fov: 40, near: 0.1, far: 10, position: [0, 0, 3.1] }}
        frameloop={strained ? "never" : "always"}
      >
        <PortraitPoints
          src={src}
          grid={strained ? Math.round(grid * 0.66) : grid}
          hovered={hovered}
          onStrain={() => setStrained(true)}
        />
      </Canvas>
    </div>
  );
}
