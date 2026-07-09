"use client";

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";
import type { Beat } from "@/components/timeline/argmax";
import type { SpineProgress } from "@/components/timeline/flight-progress";
import {
  BASE_FOV,
  applyRig,
  buildRig,
  solveBeaconAnchors,
  type FlightRig,
} from "./flight-path";

silenceThreeClockDeprecation();

/**
 * FlightCanvas — the live scene of "The Flight" (timelineplan.md §9–§13).
 *
 * Phase-1 scope: the camera LUT rig flying the spline off the Spine's progress bus,
 * a faint path ribbon, and PLACEHOLDER beacon spheres that ignite at exactly the same
 * epsilon as the DOM markers — proving the sync contract before any art lands.
 * Phase 2 replaces the spheres with the particle-glyph beacon field.
 *
 * Hard rules enforced here (the ARGMAX postmortem): the camera is a PURE function of
 * `spine.current.p` — no canvas-side lerp, no time-based easing of progress, ever.
 * All mutable sim state lives in lazily-created refs (react-compiler ref-laundering).
 */

const COL_A = "#6b7cff";
const COL_B = "#8b7cff";
const COL_C = "#67e8f9";

/** indigo → violet → cyan, the site ramp (chronology = hue). */
function rampColor(t: number): THREE.Color {
  const a = new THREE.Color(COL_A);
  const b = new THREE.Color(COL_B);
  const c = new THREE.Color(COL_C);
  return t < 0.5 ? a.lerp(b, t * 2) : b.lerp(c, (t - 0.5) * 2);
}

export type FlightCanvasProps = {
  beats: Beat[];
  spine: React.RefObject<SpineProgress>;
  /** false = keep the context alive but stop the frameloop (off-view pause). */
  running?: boolean;
  /** Fires once after the first real frames render (head-dot glow handoff). */
  onLive?: () => void;
  /** GPU context died: parent unmounts the canvas for the session (poster stays). */
  onDead?: () => void;
};

type Sim = {
  rig: FlightRig;
  /** Identity of the offsets array we last built against (bus writes fresh arrays). */
  offsetsId: number[];
  aspect: number;
  guard: (d: number) => void;
  liveTicks: number;
  ribbon: THREE.Line | null;
};

/** Re-anchor the placeholder beacons + rebuild the path ribbon. Module-scope on
 *  purpose: it mutates sim/scene objects, which the react-compiler lint only allows
 *  outside render scope (the repo's ref-laundering pattern). Cheap; runs on refresh. */
function rebuildStage(
  S: Sim,
  group: THREE.Group,
  beacons: (THREE.Mesh | null)[],
  aspect: number,
) {
  const anchors = solveBeaconAnchors(S.rig, aspect);
  anchors.forEach((a, i) => beacons[i]?.position.copy(a.pos));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(S.rig.path.posLut.slice(), 3));
  if (!S.ribbon) {
    const mat = new THREE.LineBasicMaterial({
      color: new THREE.Color(COL_B),
      transparent: true,
      opacity: 0.22,
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
}

function Scene({ beats, spine, onLive }: FlightCanvasProps) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const simRef = useRef<Sim | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  const beaconRefs = useRef<(THREE.Mesh | null)[]>([]);
  const n = beats.length;

  // Dispose imperative objects (ribbon line) with the scene.
  useEffect(() => {
    const sim = simRef;
    return () => {
      const r = sim.current?.ribbon;
      if (r) {
        r.geometry.dispose();
        (r.material as THREE.Material).dispose();
      }
    };
  }, []);

  useFrame((state, delta) => {
    // Lazy init — all mutable sim state in one ref (ref-laundering pattern #1).
    if (!simRef.current) {
      simRef.current = {
        rig: buildRig(beats, spine.current?.offsets ?? []),
        offsetsId: spine.current?.offsets ?? [],
        aspect: state.size.width / Math.max(1, state.size.height),
        guard: createFpsGuard({
          // Phase 1 has nothing to shed yet; the tier ladder lands in Phase 4.
          onStrain: () => {},
        }),
        liveTicks: 0,
        ribbon: null,
      };
      if (groupRef.current) {
        rebuildStage(simRef.current, groupRef.current, beaconRefs.current, simRef.current.aspect);
      }
    }
    const S = simRef.current;
    S.guard(delta);

    // Live handoff: after a couple of real frames the parent may dim the head-dot glow.
    if (S.liveTicks < 3) {
      S.liveTicks += 1;
      if (S.liveTicks === 2) onLive?.();
    }

    // Rebuild anchors/ribbon when the DOM re-measures (resize/font-swap) or aspect flips.
    const sp = spine.current;
    const offs = sp?.offsets ?? [];
    const aspect = state.size.width / Math.max(1, state.size.height);
    if (offs !== S.offsetsId || Math.abs(aspect - S.aspect) > 1e-3) {
      S.offsetsId = offs;
      S.aspect = aspect;
      S.rig = buildRig(beats, offs);
      if (groupRef.current) rebuildStage(S, groupRef.current, beaconRefs.current, aspect);
    }

    // THE contract: read the scrubbed progress raw, apply pure functions only.
    const p = sp?.p ?? 0;
    applyRig(camera, p, S.rig);

    // Placeholder ignition — same threshold + epsilon as the DOM markers.
    for (let i = 0; i < n; i++) {
      const m = beaconRefs.current[i];
      if (!m) continue;
      const lit = p >= (S.rig.offsets[i] ?? 1) - 0.001;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = lit ? 0.95 : 0.16;
      m.scale.setScalar(lit ? 1 : 0.55);
    }
  });

  return (
    <group ref={groupRef}>
      {beats.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            beaconRefs.current[i] = el;
          }}
          frustumCulled={false}
        >
          <sphereGeometry args={[0.5 + 0.45 * b.weight, 24, 16]} />
          <meshBasicMaterial
            color={rampColor(i / Math.max(1, n - 1))}
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
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
