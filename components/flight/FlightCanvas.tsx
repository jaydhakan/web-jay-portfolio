"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createTierLadder } from "@/lib/webgl-governance";
import type { Beat } from "@/components/timeline/argmax";
import type { SpineProgress } from "@/components/timeline/flight-progress";
import {
  BASE_FOV,
  FOV_SIGMA,
  applyRig,
  buildRig,
  holoEnvelope,
  solveBeaconAnchors,
  type FlightRig,
} from "./flight-path";
import { HALO_RING_RX, mulberry32, sampleHalo } from "./sample-points";
import { buildBeaconField, haloWorldSize, type BeaconField } from "./beacon-field";

silenceThreeClockDeprecation();

/**
 * FlightCanvas — the live scene of "The Flight" (timelineplan.md §9–§13; holo pivot
 * plan.md 2026-07-13).
 *
 * Each milestone is a curl-noise swarm that condenses into a luminous HALO ring and
 * flares on arrival; the readable information rides a crisp DOM hologram card that
 * this scene positions INSIDE the ring every frame (FlightBackdrop's HoloLayer —
 * `driveHolo` below projects each beacon anchor to CSS pixels and drives the cards'
 * transform/opacity; no tweens, ever). The settled halos string into the constellation
 * the finale pull-back reveals. Halos + ghost tendrils + ambient dust are ONE draw
 * call (merged buffer, beacon-field.ts); the path ribbon is the second; that's the
 * scene.
 *
 * Hard rules (the ARGMAX postmortem): the camera, every particle state AND every
 * holo card style are PURE functions of `spine.current.p` — no canvas-side
 * lerp/warp-clock, ever. All mutable sim state lives in lazily-created refs
 * (react-compiler ref-laundering); scene mutation helpers are module-scope.
 */

const COL_B = "#8b7cff";
/** Design width of a holo card at scale 1 (must match HoloLayer's w-[320px]). */
const HOLO_BASE_W = 320;

export type FlightCanvasProps = {
  beats: Beat[];
  spine: React.RefObject<SpineProgress>;
  /** HoloLayer root — child k is beacon k's hologram card (see FlightBackdrop). */
  holoLayer: React.RefObject<HTMLDivElement | null>;
  /** false = keep the context alive but stop the frameloop (off-view pause). */
  running?: boolean;
  /** Fires once after the first real frames render (head-dot glow handoff). */
  onLive?: () => void;
  /** GPU context died: parent unmounts the canvas for the session (poster stays). */
  onDead?: () => void;
};

type Tier = {
  haloN: number;
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
  /** Cached local halo samples (procedural, per beacon). */
  haloLocals: Float32Array[];
  /** Solved anchor positions (aim assist + holo card projection). */
  anchorPts: THREE.Vector3[];
  /** Last written per-card visibility (skip DOM writes while a card stays hidden). */
  holoVis: number[];
  dimmedId: boolean[] | undefined;
  tier: Tier;
  /** Ladder rung (0=T0 … 3=dead) — a one-way ratchet (§13.3). */
  rung: number;
  /** Live fraction of particle rows (uKeep — flicker-free aCull shed). */
  keep: number;
  strained: boolean;
};

/** Initial quality tier — decided once at mount; the ladder only moves DOWN from here. */
function pickTier(): Tier {
  const fine =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: fine)").matches &&
    window.matchMedia("(hover: hover)").matches &&
    window.innerWidth >= 1280;
  return fine
    ? { haloN: 520, dustCount: 2000, coc: 1, baseSize: 26, post: true }
    : { haloN: 340, dustCount: 1200, coc: 0.5, baseSize: 26, post: true };
}

/** `?flighttier=T1|T2` — forced start rung for tier screenshots / weak-GPU testing. */
function readTierOverride(): 0 | 1 | 2 {
  if (typeof window === "undefined") return 0;
  const v = new URLSearchParams(window.location.search).get("flighttier");
  return v === "T1" ? 1 : v === "T2" ? 2 : 0;
}

/** Demote to `rung`, applying every tier the jump crosses (§13.1). Module-scope on
 *  purpose — mutates Sim + uniforms + renderer DPR (react-compiler ref-laundering). */
function applyRung(
  S: Sim,
  rung: number,
  setDpr: (dpr: [number, number]) => void,
  setBloom: (b: boolean) => void,
  onDead?: () => void,
) {
  if (rung <= S.rung) return;
  if (S.rung < 1 && rung >= 1) {
    // T1: shed 40% of rows, halve the fake-DoF, cap DPR at 1.5 (imperative — no remount)
    S.keep = 0.6;
    S.tier.coc = Math.min(S.tier.coc, 0.5);
    S.tier.dustCount = Math.min(S.tier.dustCount, 1200);
    setDpr([1, 1.5]);
  }
  if (S.rung < 2 && rung >= 2) {
    // T2: composer unmounts (one-way), deeper shed, DoF off, DPR 1.25
    S.keep = 0.4;
    S.tier.coc = 0;
    S.tier.dustCount = Math.min(S.tier.dustCount, 800);
    S.tier.post = false;
    setBloom(false);
    setDpr([1, 1.25]);
  }
  S.rung = rung;
  if (S.field) {
    const U = S.field.material.uniforms;
    U.uKeep.value = S.keep;
    U.uCoc.value = S.tier.coc;
    U.uPixelRatio.value = Math.min(window.devicePixelRatio || 1, rung >= 2 ? 1.25 : 1.5);
  }
  if (rung >= 3) {
    // T3: same one-way exit as context loss — parent unmounts us, poster + Spine stay.
    onDead?.();
  }
}

// ── the holo card driver: DOM styles as a pure function of the warped arc ──────
const _hv = new THREE.Vector3();
const _hp = new THREE.Vector3();

/**
 * Projects each beacon anchor through the LIVE camera and drives its hologram card
 * (transform/opacity + glow-layer opacity). The card is designed at HOLO_BASE_W px
 * and scaled to ~76% of its halo ring's PROJECTED width, so card and ring stay
 * nested on every viewport and the card grows as the camera approaches — no
 * layout writes, only transform/opacity (contained in the fixed backdrop layer).
 * Module-scope on purpose: mutates DOM + reads Sim (react-compiler ref-laundering).
 */
function driveHolo(
  S: Sim,
  layer: HTMLDivElement,
  camera: THREE.PerspectiveCamera,
  s: number,
  w: number,
  h: number,
  dimmed: boolean[] | undefined,
) {
  const cards = layer.children;
  const stations = S.rig.path.stationS;
  const gap = 1 / Math.max(1, stations.length);
  camera.updateMatrixWorld();
  for (let k = 0; k < cards.length && k < stations.length; k++) {
    const weight = S.rig.beats[k]?.weight ?? 0.5;
    const env = holoEnvelope(s, stations[k], gap, weight);
    let vis = env.vis;

    const A = S.anchorPts[k];
    let x = 0;
    let y = 0;
    let scale = 1;
    if (A && vis > 0.004) {
      // hide when the anchor is behind/at the camera (projection would mirror)
      _hv.copy(A).applyMatrix4(camera.matrixWorldInverse);
      if (_hv.z > -0.5) {
        vis = 0;
      } else {
        _hp.copy(A).project(camera);
        x = (_hp.x * 0.5 + 0.5) * w;
        y = (-_hp.y * 0.5 + 0.5) * h;
        // same right-stage gate as the shader: never over the card column
        vis *= THREE.MathUtils.smoothstep(_hp.x, -0.1, 0.15);
        // ring's projected half-width → card scale (76% of ring width); measured
        // along the CAMERA's right axis — exact at dwell, where the anchor plane
        // faces the camera by construction (solver guarantee)
        _hv.set(1, 0, 0).applyQuaternion(camera.quaternion);
        _hv.multiplyScalar(HALO_RING_RX * haloWorldSize(weight)).add(A);
        _hv.project(camera);
        const ringPx = Math.abs(((_hv.x - _hp.x) * 0.5) * w);
        scale = ((ringPx * 2 * 0.76) / HOLO_BASE_W) * (0.94 + 0.06 * env.vis);
      }
    } else {
      vis = 0;
    }
    if (dimmed?.[k]) vis *= 0.22;

    // skip DOM writes while a card stays hidden
    if (vis < 0.004 && S.holoVis[k] < 0.004) continue;
    S.holoVis[k] = vis;

    const el = cards[k] as HTMLElement;
    el.style.opacity = vis < 0.004 ? "0" : vis.toFixed(3);
    if (vis >= 0.004) {
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
      const glow = el.firstElementChild as HTMLElement | null;
      if (glow) glow.style.opacity = Math.min(1, env.flare).toFixed(3);
    }
  }
}

/** Rebuild everything that depends on (rig, aspect): beacon anchors → field, ribbon.
 *  Module-scope on purpose: mutates scene objects (react-compiler ref-laundering). */
function rebuildStage(S: Sim, group: THREE.Group, aspect: number, dpr: number) {
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

  // beacon anchors (aim assist + holo card projection)
  const anchors = solveBeaconAnchors(S.rig, aspect);
  S.anchorPts = anchors.map((a) => a.pos);

  // halo field (local samples are procedural + cached in the Sim)
  const glyphLocals = S.haloLocals;
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
    tendrils: S.rung < 2, // T2+: ghost tendrils dropped at build (§13.1)
  });
  S.field.material.uniforms.uPixelRatio.value = Math.min(dpr, 2);
  S.field.material.uniforms.uCoc.value = S.tier.coc;
  S.field.material.uniforms.uKeep.value = S.keep;
  S.field.material.uniforms.uSize.value = S.strained ? 22 : S.tier.baseSize;
  if (S.dimmedId) S.field.setDimmed(S.dimmedId);
  group.add(S.field.points);
}

function Scene({ beats, spine, holoLayer, onLive, onDead }: FlightCanvasProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const dpr = useThree((s) => s.viewport.dpr);
  const setDpr = useThree((s) => s.setDpr);
  const simRef = useRef<Sim | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  // Bloom is a one-way ratchet (arena doctrine): T2 drops it for the session;
  // flares survive bloomless via the size-pop + hot tint (palette rule 5).
  const [bloom, setBloom] = useState(() => pickTier().post && readTierOverride() < 2);
  const n = beats.length;

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
      const tier = pickTier();
      const startRung = readTierOverride();
      const S: Sim = {
        rig: buildRig(beats, spine.current?.offsets ?? []),
        offsetsId: spine.current?.offsets ?? [],
        aspect: state.size.width / Math.max(1, state.size.height),
        // procedural halo samples — pure math, no rasterization, no font wait
        haloLocals: beats.map((_, i) => sampleHalo(tier.haloN, mulberry32(0x51f7 ^ (i * 977)))),
        holoVis: beats.map(() => 0),
        // The full ladder (§13.3): soft shed (uSize, reversible) → T1 → T2 → T3,
        // one rung per 3s of *continuous* strain. Tiers are one-way ratchets.
        guard: createTierLadder({
          startRung,
          onShed: () => {
            const s = simRef.current;
            if (!s) return;
            s.strained = true;
            if (s.field) s.field.material.uniforms.uSize.value = 22;
          },
          onRelief: () => {
            const s = simRef.current;
            if (!s) return;
            s.strained = false;
            if (s.field) s.field.material.uniforms.uSize.value = s.tier.baseSize;
          },
          onTier: (rung) => {
            const s = simRef.current;
            if (!s) return;
            applyRung(s, rung, setDpr, setBloom, onDead);
          },
        }),
        liveTicks: 0,
        ribbon: null,
        field: null,
        anchorPts: [],
        dimmedId: undefined,
        tier,
        rung: 0,
        keep: 1,
        strained: false,
      };
      simRef.current = S;
      if (startRung > 0) applyRung(S, startRung, setDpr, setBloom, onDead);
      if (groupRef.current) {
        rebuildStage(S, groupRef.current, S.aspect, dpr);
      }
    }
    const S = simRef.current;
    S.guard(delta);

    if (S.liveTicks < 3) {
      S.liveTicks += 1;
      if (S.liveTicks === 2) onLive?.();
    }

    // Rebuild when the DOM re-measures / the aspect flips.
    const sp = spine.current;
    const offs = sp?.offsets ?? [];
    const aspect = state.size.width / Math.max(1, state.size.height);
    if (offs !== S.offsetsId || Math.abs(aspect - S.aspect) > 1e-3 || !S.field) {
      S.offsetsId = offs;
      S.aspect = aspect;
      S.rig = buildRig(beats, offs);
      if (groupRef.current) {
        rebuildStage(S, groupRef.current, aspect, dpr);
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

    // Hologram cards: DOM transforms/opacity, pure in the same warped arc.
    if (holoLayer.current) {
      driveHolo(S, holoLayer.current, camera, s, state.size.width, state.size.height, sp?.dimmed);
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
          const w = window as unknown as Record<string, unknown>;
          w.__flightLoseContext = () =>
            gl.getContext().getExtension("WEBGL_lose_context")?.loseContext();
          // invariant suite: per-mount GPU resource counts must be identical on
          // every visit (route-flip /about↔/work leaks show up as drift here)
          w.__flightGlInfo = () => ({ ...gl.info.memory, calls: gl.info.render.calls });
        }
      }}
    >
      <color attach="background" args={["#0b0b11"]} />
      <Scene {...props} />
    </Canvas>
  );
}
