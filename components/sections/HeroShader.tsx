"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * "The Field" — the signature hero shader (D-6). An iridescent indigo -> violet
 * -> faint-cyan flowing contour field (palette v2) read as a gradient-descent /
 * loss-landscape: nested iso-lines
 * are the level sets of an objective surface, crowding on steep gradients
 * (the descent picture) and easing apart on the flats. A slow band of light
 * travels through the level sets toward the basin, like an optimizer stepping
 * downhill. One full-screen quad, one draw call, no postprocessing.
 *
 * Perf budget is held byte-identical to the prior shader: 2 fbm = 6 simplex
 * evals, one exp() blob, one hash dither, plus two scalar fwidth for crisp
 * resolution-independent lines (no trig, no extra noise tap, no extra pass).
 * Energy concentrates upper-right so the left text column + header band keep
 * AAA contrast; portrait viewports dim and lift the focus.
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
  uniform vec3 uColorC;
  uniform float uIntensity;
  uniform float uScroll;
  uniform float uInteract;

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

    float t = uTime * 0.04;
    // Stronger cursor displacement (desktop). uMouse is momentum-eased on the JS
    // side and stays (0,0) on touch, so quick moves slosh the terrain while
    // mobile stays calm.
    vec2 drift = uMouse * 0.18;

    // Height field = the loss surface. Slow domain warp reshapes the terrain
    // over time. 2 fbm = 6 simplex evals, the same budget as before.
    float warp = fbm(p * 0.8 + t + drift);
    float h = fbm(p + warp * 0.9 - t * 0.5 + drift);
    h = h * 0.5 + 0.5; // -> ~[0,1] elevation

    float portrait = step(aspectX, 0.85);
    // The bright basin (the optimizer's target) — larger + softer than before so
    // the field commands the screen; the cursor pulls it, scroll steps it down.
    vec2 focus = vec2(0.72 + uMouse.x * 0.08,
                      0.66 + portrait * 0.22 + uMouse.y * 0.08 - uScroll * 0.14);
    vec2 d = (uv - focus) * vec2(max(aspectX, 1.0), 1.3);
    float blob = exp(-dot(d, d) * (2.1 + portrait * 2.3));

    // Fuller bleed (P2): the field IS the hero, not a corner texture. It lives
    // across the right + the top/bottom margins; only the HEADLINE'S BOUNDING BOX
    // stays dark for AAA contrast (the H1 reaches ~uv.x 0.59, vertically centered
    // -> a column guard plus a vertical "text row" band leave just that box dark).
    float colOpen = smoothstep(0.32, 0.63, uv.x + portrait * 0.24);  // 0 over text col, 1 right
    float rowText = smoothstep(0.26, 0.36, uv.y) * (1.0 - smoothstep(0.64, 0.76, uv.y));
    float textGuard = max(colOpen, 1.0 - rowText);                   // dark only inside the text box
    float topFade = smoothstep(1.0, 0.82, uv.y);                     // keep the transparent nav band clean (AA)
    // Broad ambient presence so contours read everywhere, weighted to the right
    // and eased off near the nav.
    float ambient = mix(0.22, 0.4, uv.x) * (1.0 - 0.6 * smoothstep(0.65, 1.0, uv.y));
    float field = max(blob, ambient);
    float energy = field * textGuard * topFade * mix(1.0, 0.55, portrait);

    // Iso-contours from the single height field. Crisp, resolution-independent
    // lines via fwidth (clamped so flats don't sparkle on low-power / dpr 1).
    // Lines crowd where |grad h| is large -> the steep valley walls.
    float aw = max(fwidth(h), 1e-3);
    float MINOR = 20.0;
    float fm = abs(fract(h * MINOR - 0.5) - 0.5);
    float minorLine = 1.0 - smoothstep(0.0, aw * MINOR + 0.0015, fm);
    float MAJOR = MINOR / 5.0; // every 5th ring is a brighter "major" contour
    float fM = abs(fract(h * MAJOR - 0.5) - 0.5);
    float majorLine = 1.0 - smoothstep(0.0, aw * MAJOR + 0.0010, fM);

    float steep = smoothstep(0.0, 0.06, aw); // 0 on flats, 1 on steep walls

    // Valley-floor wash so the basin reads as depth, not just outline.
    float basin = (1.0 - smoothstep(0.22, 0.6, h)) * energy;

    // Alive: a band of light travels the level sets toward the basin (the
    // optimizer stepping downhill, scroll advances it) PLUS a cursor "torch"
    // that brightens the contours under the pointer, so the field warps and glows
    // under the hand. Both gated by energy, so they never reach the text column;
    // uInteract is 0 on touch / until the first mouse move -> no torch on mobile.
    float descend = 1.0 - smoothstep(0.0, 0.13, abs(h - fract(uTime * 0.075 + uScroll * 0.7)));
    vec2 mp = vec2(0.5 + uMouse.x * 0.5, 0.5 + uMouse.y * 0.5);
    vec2 td = (uv - mp) * vec2(max(aspectX, 1.0), 1.0);
    float torch = exp(-dot(td, td) * 6.0) * uInteract;
    float scrollGain = 1.0 + uScroll * 0.4;
    float liveGain = 1.0 + 0.4 * descend + 0.7 * torch;

    // Compose: iridescent indigo -> violet -> cyan (palette v2). One cool light
    // shifting with depth + energy; the cyan rides the live crest so the field
    // reads as alive, not as a flat 2nd hue. Fold one is the one place the accent
    // is allowed to dominate (new_plan Big Swing 1).
    vec3 col = uBase;
    col = mix(col, uColorB, basin * 0.22 * uIntensity);
    float minorE = minorLine * energy * (0.6 + 0.3 * steep) * liveGain * scrollGain;
    col = mix(col, uColorA, minorE * uIntensity);
    float majorE = majorLine * energy * (0.8 + 0.3 * steep) * liveGain * scrollGain;
    col = mix(col, uColorB, majorE * uIntensity * 0.95);
    // The duotone's far stop: a cyan highlight on the travelling crest + torch.
    float crest = majorLine * (descend + torch) * energy * scrollGain;
    col = mix(col, uColorC, clamp(crest, 0.0, 1.0) * uIntensity * 0.55);

    // Dither to stop gradient banding on the dark base.
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 3.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;

/* Hex twins of the palette v2 tokens (globals.css table) — THREE.Color can't
   parse oklch(), so these mirror --base / --accent / --accent-violet / --accent-cyan.
   Keep in sync manually. */
const BASE = new THREE.Color("#0b0b11");

function ShaderPlane() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const pointerTarget = useRef({ x: 0, y: 0 });
  // 0 until a real mouse moves; gates the cursor torch + extra warp so the field
  // stays calm on touch (where uMouse never updates and would pin the torch).
  const interacted = useRef(false);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBase: { value: new THREE.Color("#0b0b11") },
      uColorA: { value: new THREE.Color("#6b7cff") }, // indigo — field body / minor lines
      uColorB: { value: new THREE.Color("#8b7cff") }, // violet — major lines + valley wash
      uColorC: { value: new THREE.Color("#67e8f9") }, // cyan   — live-crest highlight
      uIntensity: { value: 0.6 },
      uScroll: { value: 0 },
      uInteract: { value: 0 },
    }),
    [],
  );

  // Pointer parallax from window events: the canvas is pointer-events-none.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      interacted.current = true;
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
    (material.uniforms.uBase.value as THREE.Color).copy(BASE);
    // Exponential damping toward the pointer: parallax with momentum.
    const mouse = material.uniforms.uMouse.value as THREE.Vector2;
    const ease = 1 - Math.exp(-2.5 * delta);
    mouse.x += (pointerTarget.current.x - mouse.x) * ease;
    mouse.y += (pointerTarget.current.y - mouse.y) * ease;

    // Scroll progress through the first viewport (0->1), eased with the same
    // momentum. Read directly per-frame (cheap, frame-synced, no extra listener);
    // the shader only renders while the hero is in view, so this stays bounded.
    const scrollUniform = material.uniforms.uScroll as { value: number };
    const target = Math.min(window.scrollY / Math.max(window.innerHeight, 1), 1);
    scrollUniform.value += (target - scrollUniform.value) * ease;

    // Ease the cursor torch in on the first real mouse move (stays 0 on touch).
    const interact = material.uniforms.uInteract as { value: number };
    interact.value += ((interacted.current ? 1 : 0) - interact.value) * ease;
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

export default function HeroShader() {
  return (
    <Canvas
      className="size-full"
      dpr={[1, 1.75]}
      gl={{ antialias: false, alpha: false, powerPreference: "low-power" }}
      frameloop="always"
      aria-hidden
    >
      <ShaderPlane />
    </Canvas>
  );
}
