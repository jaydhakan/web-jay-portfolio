"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";
import type { Beat } from "@/components/timeline/argmax";
import type { SpineProgress } from "@/components/timeline/flight-progress";
import {
  BASE_FOV,
  FOV_SIGMA,
  applyRig,
  buildRig,
  solveBeaconAnchors,
  type FlightRig,
} from "./flight-path";
import { ABOUT_GLYPHS } from "./glyph-data";
import { fontsReady, mulberry32, sampleGlyph, sampleNumeral } from "./sample-points";
import { buildBeaconField, type BeaconField } from "./beacon-field";

silenceThreeClockDeprecation();

/**
 * FlightCanvas — the live scene of "The Flight" (timelineplan.md §9–§13).
 *
 * Phase 2: the particle-glyph beacon field. Each milestone is a swarm that resolves
 * from curl-noise into its glyph (the SAME lucide icon its card wears; /work uses
 * JetBrains Mono numerals), flares on arrival, and settles into the constellation the
 * finale pull-back reveals. Beacons + ghost tendrils + ambient dust are ONE draw call
 * (merged buffer, beacon-field.ts); the path ribbon is the second; that's the scene.
 *
 * Hard rules (the ARGMAX postmortem): the camera and every particle state are PURE
 * functions of `spine.current.p` — no canvas-side lerp/warp-clock, ever. All mutable
 * sim state lives in lazily-created refs (react-compiler ref-laundering); scene
 * mutation helpers are module-scope.
 */

const COL_B = "#8b7cff";

export type FlightCanvasProps = {
  beats: Beat[];
  spine: React.RefObject<SpineProgress>;
  /** Which glyphs the beacons resolve into. */
  glyphSet: "icons" | "numerals";
  /** false = keep the context alive but stop the frameloop (off-view pause). */
  running?: boolean;
  /** Fires once after the first real frames render (head-dot glow handoff). */
  onLive?: () => void;
  /** GPU context died: parent unmounts the canvas for the session (poster stays). */
  onDead?: () => void;
};

type Tier = {
  glyphN: number;
  dustCount: number;
  coc: number;
  baseSize: number;
  post: boolean;
};

type Sim = {
  rig: FlightRig;
  offsetsId: number[];
  aspect: number;
  guard: (d: number) => void;
  liveTicks: number;
  ribbon: THREE.Line | null;
  field: BeaconField | null;
  /** Solved anchor positions (for the mid-gap aim assist). */
  anchorPts: THREE.Vector3[];
  dimmedId: boolean[] | undefined;
  tier: Tier;
  strained: boolean;
};

/** Initial quality tier — decided once at mount (site precedent; ladder in Phase 4). */
function pickTier(glyphSet: "icons" | "numerals"): Tier {
  const fine =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    window.innerWidth >= 1280;
  const icons = glyphSet === "icons";
  return fine
    ? { glyphN: icons ? 900 : 700, dustCount: 2000, coc: 1, baseSize: 30, post: true }
    : { glyphN: icons ? 540 : 420, dustCount: 1200, coc: 0.5, baseSize: 30, post: true };
}

/** Rebuild everything that depends on (rig, aspect): beacon anchors → field, ribbon.
 *  Module-scope on purpose: mutates scene objects (react-compiler ref-laundering). */
function rebuildStage(
  S: Sim,
  group: THREE.Group,
  glyphLocals: Float32Array[] | null,
  aspect: number,
  dpr: number,
) {
  // path ribbon
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(S.rig.path.posLut.slice(), 3));
  if (!S.ribbon) {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(COL_B),
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    S.ribbon = new THREE.Line(geo, mat);
    S.ribbon.frustumCulled = false;
    group.add(S.ribbon);
  } else {
    S.ribbon.geometry.dispose();
    S.ribbon.geometry = geo;
  }

  // beacon anchors (also feeds the camera's mid-gap aim assist)
  const anchors = solveBeaconAnchors(S.rig, aspect);
  S.anchorPts = anchors.map((a) => a.pos);

  // beacon field (needs the cached local glyph samples)
  if (!glyphLocals) return;
  if (S.field) {
    group.remove(S.field.points);
    S.field.dispose();
    S.field = null;
  }
  const lut = S.rig.path.posLut;
  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
  for (let i = 0; i < lut.length; i += 3) {
    min.x = Math.min(min.x, lut[i] - 12);
    min.y = Math.min(min.y, lut[i + 1] - 8);
    min.z = Math.min(min.z, lut[i + 2] - 12);
    max.x = Math.max(max.x, lut[i] + 12);
    max.y = Math.max(max.y, lut[i + 1] + 8);
    max.z = Math.max(max.z, lut[i + 2] + 12);
  }
  S.field = buildBeaconField({
    anchors,
    beats: S.rig.beats,
    stationS: S.rig.path.stationS,
    glyphLocals,
    dustCount: S.tier.dustCount,
    dustBounds: { min, max },
    seed: 7,
  });
  S.field.material.uniforms.uPixelRatio.value = Math.min(dpr, 2);
  S.field.material.uniforms.uCoc.value = S.tier.coc;
  S.field.material.uniforms.uSize.value = S.strained ? 22 : S.tier.baseSize;
  if (S.dimmedId) S.field.setDimmed(S.dimmedId);
  group.add(S.field.points);
}

function Scene({ beats, spine, glyphSet, onLive }: FlightCanvasProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const dpr = useThree((s) => s.viewport.dpr);
  const simRef = useRef<Sim | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const glyphLocalsRef = useRef<Float32Array[] | null>(null);
  const [glyphsReady, setGlyphsReady] = useState(false);
  // Bloom is a one-way ratchet (arena doctrine): strain drops it for the session;
  // flares survive bloomless via the size-pop + hot tint (palette rule 5).
  const [bloom, setBloom] = useState(() => pickTier(glyphSet).post);
  const n = beats.length;

  // ── glyph prep: rasterize→sample ONCE per glyph; world-baking happens per rebuild ──
  useEffect(() => {
    let cancelled = false;
    const tier = pickTier(glyphSet);
    const prep = async () => {
      if (glyphSet === "numerals") await fontsReady();
      if (cancelled) return;
      const locals: Float32Array[] = [];
      for (let i = 0; i < n; i++) {
        const rng = mulberry32(0x51f7 ^ (i * 977));
        if (glyphSet === "icons") {
          if (process.env.NODE_ENV !== "production" && n !== ABOUT_GLYPHS.length) {
            console.warn(
              `[flight] glyph lockstep: ${n} beats vs ${ABOUT_GLYPHS.length} glyphs — check data/content.ts timeline[] vs glyph-data.ts`,
            );
          }
          const def = ABOUT_GLYPHS[Math.min(i, ABOUT_GLYPHS.length - 1)];
          locals.push(sampleGlyph(def, tier.glyphN, rng));
        } else {
          locals.push(sampleNumeral(String(i + 1).padStart(2, "0"), tier.glyphN, rng));
        }
      }
      if (!cancelled) {
        glyphLocalsRef.current = locals;
        setGlyphsReady(true);
      }
    };
    void prep();
    return () => {
      cancelled = true;
    };
  }, [beats, glyphSet, n]);

  // Dispose imperative scene objects with the component.
  useEffect(() => {
    const sim = simRef;
    return () => {
      const S = sim.current;
      if (!S) return;
      if (S.ribbon) {
        S.ribbon.geometry.dispose();
        (S.ribbon.material as THREE.Material).dispose();
      }
      S.field?.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    if (!simRef.current) {
      const tier = pickTier(glyphSet);
      const S: Sim = {
        rig: buildRig(beats, spine.current?.offsets ?? []),
        offsetsId: spine.current?.offsets ?? [],
        aspect: state.size.width / Math.max(1, state.size.height),
        guard: createFpsGuard({
          // Mini-ladder (full multi-rung ladder is Phase 4): first sustained strain
          // drops bloom (one-way), further strain sheds sprite fill (reversible).
          onStrain: () => {
            const s = simRef.current;
            if (!s) return;
            if (!s.strained) {
              s.strained = true;
              setBloom(false);
              if (s.field) s.field.material.uniforms.uSize.value = 22;
            }
          },
          onRelief: () => {
            const s = simRef.current;
            if (!s) return;
            s.strained = false;
            if (s.field) s.field.material.uniforms.uSize.value = s.tier.baseSize;
          },
        }),
        liveTicks: 0,
        ribbon: null,
        field: null,
        anchorPts: [],
        dimmedId: undefined,
        tier,
        strained: false,
      };
      simRef.current = S;
      if (groupRef.current) {
        rebuildStage(S, groupRef.current, glyphLocalsRef.current, S.aspect, dpr);
      }
    }
    const S = simRef.current;
    S.guard(delta);

    if (S.liveTicks < 3) {
      S.liveTicks += 1;
      if (S.liveTicks === 2) onLive?.();
    }

    // Rebuild when the DOM re-measures / aspect flips / glyphs finish sampling.
    const sp = spine.current;
    const offs = sp?.offsets ?? [];
    const aspect = state.size.width / Math.max(1, state.size.height);
    const needField = glyphsReady && !S.field;
    if (offs !== S.offsetsId || Math.abs(aspect - S.aspect) > 1e-3 || needField) {
      S.offsetsId = offs;
      S.aspect = aspect;
      S.rig = buildRig(beats, offs);
      if (groupRef.current) {
        rebuildStage(S, groupRef.current, glyphLocalsRef.current, aspect, dpr);
      }
    }

    // THE contract: read the scrubbed progress raw; everything below is pure in p.
    const p = sp?.p ?? 0;
    const s = applyRig(camera, p, S.rig, S.anchorPts);

    if (S.field) {
      const U = S.field.material.uniforms;
      U.uArc.value = s;
      U.uTime.value = state.clock.elapsedTime;

      // Fake-DoF focus (pure in p): the anchor solver parks every beacon exactly
      // BEACON_DEPTH in front of the dwell-centre camera, so a constant focus depth
      // is EXACT where it matters; the band narrows into dwells and opens between
      // them (28 world units ≈ everything in focus ≈ "DoF off" for free).
      let prox = 0;
      for (let k = 0; k < n; k++) {
        const d = (p - (S.rig.offsets[k] ?? 1)) / FOV_SIGMA;
        const b = Math.exp(-d * d);
        if (b > prox) prox = b;
      }
      const dwell = THREE.MathUtils.smoothstep(prox, 0.35, 0.9);
      U.uFocus.value = 13; // = BEACON_DEPTH
      U.uFocusRange.value = THREE.MathUtils.lerp(28, 6, dwell);

      // /work filter mask → dim beacons in place
      if (sp?.dimmed !== S.dimmedId) {
        S.dimmedId = sp?.dimmed;
        S.field.setDimmed(S.dimmedId);
      }
    }
  });

  return (
    <>
      <group ref={groupRef} />
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
    </>
  );
}

export default function FlightCanvas(props: FlightCanvasProps) {
  const { running, onDead } = props;
  return (
    <Canvas
      className="size-full"
      dpr={DPR_CAP}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: BASE_FOV, near: 0.1, far: 400, position: [0, 2, 22] }}
      frameloop={running === false ? "never" : "always"}
      aria-hidden
      onCreated={({ gl }) => {
        // Context loss = one-way death (NO preventDefault — we do not want a restore
        // event; the poster + full-strength Spine are the degraded state by design).
        gl.domElement.addEventListener(
          "webglcontextlost",
          () => {
            onDead?.();
          },
          { once: true },
        );
        if (process.env.NODE_ENV !== "production") {
          (window as unknown as Record<string, unknown>).__flightLoseContext = () =>
            gl.getContext().getExtension("WEBGL_lose_context")?.loseContext();
        }
      }}
    >
      <color attach="background" args={["#0b0b11"]} />
      <Scene {...props} />
    </Canvas>
  );
}
