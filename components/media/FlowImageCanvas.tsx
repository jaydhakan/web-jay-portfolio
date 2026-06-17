"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";
import { subscribeVelocity } from "@/lib/velocity-bus";

// Install before any Canvas (R3F's internal THREE.Clock) mounts.
silenceThreeClockDeprecation();

/**
 * The WebGL leaf of a flowmap cover (V3 P6 / S5). A single textured plane fills
 * the wrapper and renders the project cover as "data the page is processing":
 *
 *  - REST: a faint liquid shimmer (curl-style domain warp) so the image is alive
 *    but the screenshot stays legible (it is portfolio proof, not just texture).
 *  - SCROLL: the velocity bus drives a travelling RIPPLE + a chromatic (RGB)
 *    smear along the scroll axis — the cover reacts to how fast you move past it.
 *  - HOVER: a displacement "melt" ramps up (and eases back on leave) — the image
 *    momentarily liquefies under the cursor, with a soft cursor-centred lens.
 *
 * One context PER cover, but governed: this only mounts while the cover is in
 * view (parent's useInViewport), dpr is capped, and an FPS guard sheds the effect
 * to a still image on sustained frame strain. The plain next/image underneath
 * (parent) stays the SSR / LCP / no-JS / a11y authoritative layer — this canvas
 * is aria-hidden decoration that fades in over it.
 */

const vertexShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform vec2 uResolution;   // plane pixel size, for aspect-correct cover()
  uniform vec2 uImageSize;    // source texture pixel size
  uniform vec2 uMouse;        // cursor in uv space (0..1), eased
  uniform float uTime;
  uniform float uVelocity;    // smoothed scroll velocity from the bus
  uniform float uHover;       // 0..1, eased hover intensity
  varying vec2 vUv;

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

  // object-fit: cover — map plane uv to texture uv keeping the image aspect.
  vec2 coverUv(vec2 uv) {
    float planeAspect = uResolution.x / uResolution.y;
    float imgAspect = uImageSize.x / uImageSize.y;
    vec2 scale = planeAspect > imgAspect
      ? vec2(1.0, imgAspect / planeAspect)
      : vec2(planeAspect / imgAspect, 1.0);
    return (uv - 0.5) * scale + 0.5;
  }

  void main() {
    vec2 uv = vUv;
    float vel = clamp(abs(uVelocity) * 0.06, 0.0, 1.0);

    // 1) Ambient liquid shimmer — a slow domain warp, always on but tiny.
    vec2 warp = vec2(
      snoise(uv * 3.0 + vec2(uTime * 0.12, 0.0)),
      snoise(uv * 3.0 + vec2(0.0, uTime * 0.10) + 11.0)
    );
    uv += warp * 0.0045;

    // 2) Scroll ripple — a band of displacement travelling down the cover, its
    // amplitude driven by scroll velocity (the cover reacts to how fast you pass).
    float ripple = sin(uv.y * 11.0 - uTime * 2.2 - uVelocity * 0.4);
    uv.x += ripple * (0.006 + 0.05 * vel);

    // 3) Hover melt — a cursor-centred displacement lens that liquefies the image
    // where the pointer is, plus extra noisy warp scaled by hover intensity.
    float d = distance(uv, uMouse);
    float lens = smoothstep(0.42, 0.0, d) * uHover;
    vec2 dir = normalize(uv - uMouse + 1e-4);
    uv += dir * lens * 0.07;
    uv += warp * uHover * 0.03;

    vec2 tUv = coverUv(uv);

    // 4) Chromatic smear — split RGB along the scroll axis (+ a touch on hover),
    // the "expensive liquid light" RGB fringe that says this image is being
    // processed, not just displayed.
    float chroma = 0.004 + 0.012 * vel + 0.01 * lens;
    vec2 off = vec2(0.0, chroma);
    float r = texture2D(uTex, coverUv(uv + off)).r;
    float g = texture2D(uTex, tUv).g;
    float b = texture2D(uTex, coverUv(uv - off)).b;
    vec3 col = vec3(r, g, b);

    // Subtle iridescent lift inside the hover lens (indigo->cyan) — on-brand glow.
    col += vec3(0.05, 0.04, 0.12) * lens;

    gl_FragColor = vec4(col, 1.0);
  }
`;

function FlowPlane({
  src,
  onStrain,
}: {
  src: string;
  onStrain: () => void;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const { size, gl } = useThree();

  // Eased state the shader reads each frame (imperative; never React state).
  const velocity = useRef(0);
  const hover = useRef({ target: 0, eased: 0 });
  const mouse = useRef({ tx: 0.5, ty: 0.5, x: 0.5, y: 0.5 });

  const uniforms = useMemo(
    () => ({
      uTex: { value: null as THREE.Texture | null },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uImageSize: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
      uVelocity: { value: 0 },
      uHover: { value: 0 },
    }),
    [],
  );

  // Load the cover texture (same file next/image renders underneath).
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(src, (tex) => {
      if (cancelled) {
        tex.dispose();
        return;
      }
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.anisotropy = Math.min(4, gl.capabilities.getMaxAnisotropy());
      uniforms.uTex.value = tex;
      uniforms.uImageSize.value.set(tex.image.width, tex.image.height);
    });
    return () => {
      cancelled = true;
      const tex = uniforms.uTex.value;
      if (tex) tex.dispose();
    };
  }, [src, uniforms, gl]);

  // Subscribe the velocity bus for the shared scroll-velocity signal.
  useEffect(() => subscribeVelocity((s) => (velocity.current = s.velocity)), []);

  // Hover + cursor position, tracked on the canvas's DOM element.
  useEffect(() => {
    const el = gl.domElement;
    const onEnter = () => (hover.current.target = 1);
    const onLeave = () => (hover.current.target = 0);
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mouse.current.tx = (e.clientX - r.left) / r.width;
      mouse.current.ty = 1 - (e.clientY - r.top) / r.height; // flip to uv space
    };
    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointermove", onMove);
    };
  }, [gl]);

  const guard = useMemo(() => createFpsGuard({ onStrain }), [onStrain]);

  useFrame((state, delta) => {
    guard(delta);
    const mat = materialRef.current;
    const mesh = meshRef.current;
    if (!mat || !mesh) return;
    const ease = 1 - Math.exp(-6 * delta);
    hover.current.eased += (hover.current.target - hover.current.eased) * ease;
    mouse.current.x += (mouse.current.tx - mouse.current.x) * ease;
    mouse.current.y += (mouse.current.ty - mouse.current.y) * ease;

    // Scale the unit quad to fill the frame. R3F resets the ortho frustum to
    // pixel bounds on every resize (camera.left = -width/2, ...), so a fixed
    // [2,2] world plane would render as a speck — viewport gives the world-unit
    // size that exactly fills the current frame, resize-proof.
    const { width, height } = state.viewport;
    mesh.scale.set(width, height, 1);

    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uVelocity.value = velocity.current;
    mat.uniforms.uHover.value = hover.current.eased;
    mat.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);
    mat.uniforms.uResolution.value.set(size.width, size.height);
  });

  return (
    <mesh ref={meshRef} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function FlowImageCanvas({ src }: { src: string }) {
  // If the FPS guard trips, fade the canvas out to reveal the still next/image
  // AND stop the render loop so the GPU work is actually shed (opacity:0 alone
  // would keep rendering at full cost behind a hidden layer).
  const [strained, setStrained] = useState(false);

  return (
    <div
      aria-hidden
      className="absolute inset-0 transition-opacity duration-500"
      style={{ opacity: strained ? 0 : 1 }}
    >
      <Canvas
        className="size-full"
        dpr={DPR_CAP}
        gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
        // Orthographic; the plane is scaled to state.viewport each frame so it
        // fills the frame regardless of the (pixel-sized) ortho frustum R3F sets.
        orthographic
        camera={{ position: [0, 0, 1], near: 0.1, far: 10, zoom: 1 }}
        frameloop={strained ? "never" : "always"}
      >
        <FlowPlane src={src} onStrain={() => setStrained(true)} />
      </Canvas>
    </div>
  );
}
