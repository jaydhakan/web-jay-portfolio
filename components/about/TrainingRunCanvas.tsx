"use client";

import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { silenceThreeClockDeprecation } from "@/lib/three-console";
import { DPR_CAP, createFpsGuard } from "@/lib/webgl-governance";

silenceThreeClockDeprecation();

/**
 * Camera-flight "training run" (V3 P10 / S8) — scrolling becomes operating a
 * film camera through a 3D data landscape. An instanced node cloud (a skill /
 * knowledge graph) is wired with glowing edges; a CatmullRom camera path flies
 * from a wide establishing shot down through the cloud toward a converged
 * cluster as scroll progress (the "epochs") advances. The DOM captions over it
 * resolve char-by-char in sync (owned by the parent). One governed canvas
 * (dpr-capped, FPS-guarded, mounted + run only while the pinned section is in
 * view); a static gradient + the caption list are the reduced-motion / mobile
 * fallback (parent-owned).
 *
 * `progress` (0..1) is fed imperatively from the parent's ScrollTrigger via a
 * ref — never React state — so the flight scrubs at 60fps without re-rendering.
 */

const NODE_COUNT = 220;
const EDGE_COUNT = 150;

function buildGraph() {
  const rng = mulberry32(20260618);
  const nodes: THREE.Vector3[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    // A long tunnel of nodes that tightens into a converged cluster at the end
    // (z from +far to ~0); spread widens early, collapses late (the basin).
    const t = i / (NODE_COUNT - 1);
    const spread = THREE.MathUtils.lerp(7, 0.9, t * t);
    nodes.push(
      new THREE.Vector3(
        (rng() - 0.5) * 2 * spread,
        (rng() - 0.5) * 2 * spread,
        THREE.MathUtils.lerp(2, -56, t) + (rng() - 0.5) * 3,
      ),
    );
  }
  // Edges connect each node to a nearby later node (forward-flowing graph).
  const edges: [number, number][] = [];
  for (let e = 0; e < EDGE_COUNT; e++) {
    const a = Math.floor(rng() * NODE_COUNT);
    const b = Math.min(NODE_COUNT - 1, a + 1 + Math.floor(rng() * 6));
    edges.push([a, b]);
  }
  return { nodes, edges };
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLOR_A = new THREE.Color("#6b7cff");
const COLOR_C = new THREE.Color("#67e8f9");

function Flight({ progress, onStrain }: { progress: React.RefObject<number>; onStrain: () => void }) {
  const { nodes, edges } = useMemo(() => buildGraph(), []);
  const instRef = useRef<THREE.InstancedMesh>(null);
  const eased = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Camera path: a smooth curve threading the tunnel, wide -> diving -> into
  // the converged cluster. lookAt always leads slightly down the path.
  const curve = useMemo(
    () =>
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 4.5, 16),
        new THREE.Vector3(3.5, 1.5, 2),
        new THREE.Vector3(-3, -1, -14),
        new THREE.Vector3(2.5, 1.2, -28),
        new THREE.Vector3(-1.2, 0.4, -42),
        new THREE.Vector3(0, 0, -52),
      ]),
    [],
  );

  // Edge line segments as one buffer geometry (cheap; updated never).
  const lineGeo = useMemo(() => {
    const positions = new Float32Array(edges.length * 2 * 3);
    edges.forEach(([a, b], i) => {
      positions.set([nodes[a].x, nodes[a].y, nodes[a].z], i * 6);
      positions.set([nodes[b].x, nodes[b].y, nodes[b].z], i * 6 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return g;
  }, [nodes, edges]);

  // Geometry passed as a `geometry` prop (not a declarative child) is not
  // auto-disposed by R3F on unmount — dispose it explicitly to free the buffer.
  useEffect(() => () => lineGeo.dispose(), [lineGeo]);

  // Seed the instanced node colours/positions once.
  const colors = useMemo(() => {
    const arr = new Float32Array(NODE_COUNT * 3);
    nodes.forEach((_, i) => {
      const t = i / (NODE_COUNT - 1);
      const c = COLOR_A.clone().lerp(COLOR_C, t);
      arr.set([c.r, c.g, c.b], i * 3);
    });
    return arr;
  }, [nodes]);

  const guard = useMemo(() => createFpsGuard({ onStrain }), [onStrain]);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    guard(delta);
    const inst = instRef.current;
    if (!inst) return;

    // Place nodes once (first frame): set matrices + colours.
    if (!inst.userData.seeded) {
      nodes.forEach((n, i) => {
        dummy.position.copy(n);
        const s = THREE.MathUtils.lerp(0.16, 0.05, i / (NODE_COUNT - 1));
        dummy.scale.setScalar(s);
        dummy.updateMatrix();
        inst.setMatrixAt(i, dummy.matrix);
        inst.setColorAt(i, COLOR_A.clone().fromArray(colors, i * 3));
      });
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.userData.seeded = true;
    }

    // Ease the scroll progress and fly the camera along the curve.
    const target = progress.current ?? 0;
    eased.current += (target - eased.current) * (1 - Math.exp(-4 * delta));
    const p = THREE.MathUtils.clamp(eased.current, 0, 1);
    curve.getPointAt(p, pos);
    curve.getPointAt(Math.min(1, p + 0.06), look);
    const cam = state.camera;
    cam.position.copy(pos);
    cam.lookAt(look);
  });

  return (
    <>
      <instancedMesh ref={instRef} args={[undefined, undefined, NODE_COUNT]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial color="#6b7cff" transparent opacity={0.28} toneMapped={false} />
      </lineSegments>
      {/* subtle fill so depth reads */}
      <fogExp2 attach="fog" args={["#0b0b11", 0.022]} />
    </>
  );
}

export default function TrainingRunCanvas({ progress }: { progress: React.RefObject<number> }) {
  return (
    <Canvas
      className="size-full"
      dpr={DPR_CAP}
      gl={{ antialias: false, alpha: false, powerPreference: "high-performance" }}
      camera={{ fov: 55, near: 0.1, far: 120, position: [0, 4.5, 16] }}
      frameloop="always"
      aria-hidden
    >
      <color attach="background" args={["#0b0b11"]} />
      <SceneStrainBridge>
        {(onStrain) => <Flight progress={progress} onStrain={onStrain} />}
      </SceneStrainBridge>
    </Canvas>
  );
}

// Tiny bridge so the FPS guard can drop dpr via R3F's setter on strain.
function SceneStrainBridge({ children }: { children: (onStrain: () => void) => React.ReactNode }) {
  const setDpr = useThree((s) => s.setDpr);
  const onStrain = useMemo(() => () => setDpr(1), [setDpr]);
  return <>{children(onStrain)}</>;
}
