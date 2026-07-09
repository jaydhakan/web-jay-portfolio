/**
 * beacon-field.ts — builds THE one particle draw of the Flight (timelineplan.md §11.3):
 * every beacon's glyph cloud, every ghost tendril, and the ambient dust, merged into a
 * single BufferGeometry + ShaderMaterial + THREE.Points (one draw call; per-row
 * behavior rides attributes — see beacon-shaders.ts).
 *
 * Deterministic (seeded mulberry32); rebuilt only when the DOM re-measures or the
 * canvas aspect changes (anchors move), reusing the cached local glyph samples —
 * no re-rasterization on rebuild.
 */
import * as THREE from "three";
import type { Beat } from "@/components/timeline/argmax";
import type { BeaconAnchor } from "./flight-path";
import { BEACON_FRAG, BEACON_VERT } from "./beacon-shaders";
import { mulberry32 } from "./sample-points";

const COL_A = "#6b7cff";
const COL_B = "#8b7cff";
const COL_C = "#67e8f9";

/** indigo → violet → cyan (chronology = hue). */
export function rampColor(t: number): THREE.Color {
  const a = new THREE.Color(COL_A);
  const b = new THREE.Color(COL_B);
  const c = new THREE.Color(COL_C);
  return t < 0.5 ? a.lerp(b, t * 2) : b.lerp(c, (t - 0.5) * 2);
}

export type BeaconFieldSpec = {
  anchors: BeaconAnchor[];
  beats: Beat[];
  /** Arc fraction of each station (aMeta.x — the shader's arrival clock). */
  stationS: number[];
  /** Cached LOCAL unit-plane glyph samples, one Float32Array(N*3) per beacon. */
  glyphLocals: Float32Array[];
  dustCount: number;
  /** World-space bounds to scatter dust through (from the path LUT). */
  dustBounds: { min: THREE.Vector3; max: THREE.Vector3 };
  seed: number;
  /** T2 rebuilds drop ghost tendrils entirely (§13.1) — default true. */
  tendrils?: boolean;
};

export type BeaconField = {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
  /** /work filter: dim beacon k (and its tendrils) in place. */
  setDimmed(mask: boolean[] | undefined): void;
  dispose(): void;
};

export function buildBeaconField(spec: BeaconFieldSpec): BeaconField {
  const { anchors, beats, stationS, glyphLocals, dustCount, dustBounds, seed } = spec;
  const withTendrils = spec.tendrils !== false;
  const n = anchors.length;

  // ── row budget ──
  let total = 0;
  for (const g of glyphLocals) total += g.length / 3;
  const tendrilCounts = beats.map((b): number => (withTendrils ? (b.weight >= 0.8 ? 2 : 1) : 0));
  const TENDRIL_PTS = 36;
  const tendrilTotal = tendrilCounts.reduce((s, c) => s + c, 0) * TENDRIL_PTS;
  total += tendrilTotal + dustCount;

  const aHome = new Float32Array(total * 3);
  const aTarget = new Float32Array(total * 3);
  const aColor = new Float32Array(total * 3);
  const aAnchor = new Float32Array(total * 3);
  const aMeta = new Float32Array(total * 4);
  const aCull = new Float32Array(total);
  const aDim = new Float32Array(total);
  const aSizeJ = new Float32Array(total);

  /** Row ranges per beacon (glyph + its tendrils) for setDimmed. */
  const ranges: { start: number; count: number; beacon: number }[] = [];
  let row = 0;

  const writeRow = (
    home: THREE.Vector3,
    target: THREE.Vector3,
    color: THREE.Color,
    anchor: THREE.Vector3,
    meta: [number, number, number, number],
    cull: number,
    sizeJ: number,
  ) => {
    aHome[row * 3] = home.x;
    aHome[row * 3 + 1] = home.y;
    aHome[row * 3 + 2] = home.z;
    aTarget[row * 3] = target.x;
    aTarget[row * 3 + 1] = target.y;
    aTarget[row * 3 + 2] = target.z;
    aColor[row * 3] = color.r;
    aColor[row * 3 + 1] = color.g;
    aColor[row * 3 + 2] = color.b;
    aAnchor[row * 3] = anchor.x;
    aAnchor[row * 3 + 1] = anchor.y;
    aAnchor[row * 3 + 2] = anchor.z;
    aMeta[row * 4] = meta[0];
    aMeta[row * 4 + 1] = meta[1];
    aMeta[row * 4 + 2] = meta[2];
    aMeta[row * 4 + 3] = meta[3];
    aCull[row] = cull;
    aSizeJ[row] = sizeJ;
    row++;
  };

  const home = new THREE.Vector3();
  const target = new THREE.Vector3();

  // ── beacon glyph clouds ──
  for (let k = 0; k < n; k++) {
    const rng = mulberry32(0x9e3779b9 ^ (seed + k * 101));
    const A = anchors[k];
    const w = beats[k]?.weight ?? 0.5;
    // slightly tighter than the spec's 2.6+1.0w: stroke icons are sparse, and a
    // denser dot lattice reads brighter (the filled numerals were fine either way)
    const worldSize = 2.3 + 0.9 * w;
    const rampT = n <= 1 ? 1 : k / (n - 1);
    const locals = glyphLocals[k];
    const N = locals.length / 3;
    const start = row;

    for (let i = 0; i < N; i++) {
      // swarm rest point: seeded sphere around the anchor
      const u = rng() * 2 - 1;
      const th = rng() * Math.PI * 2;
      const rr = 1.6 * Math.cbrt(rng());
      const s1 = Math.sqrt(1 - u * u);
      home
        .set(Math.cos(th) * s1, Math.sin(th) * s1, u)
        .multiplyScalar(rr)
        .add(A.pos);
      // glyph point: local plane → world via the anchor basis (faces arrival camera)
      const lx = locals[i * 3] * worldSize;
      const ly = locals[i * 3 + 1] * worldSize;
      const lz = locals[i * 3 + 2] * worldSize;
      target
        .copy(A.pos)
        .addScaledVector(A.right, lx)
        .addScaledVector(A.up, ly)
        .addScaledVector(A.normal, lz);
      const col = rampColor(rampT);
      col.offsetHSL(0, 0, (rng() - 0.5) * 0.12); // lightness-only jitter (taste rule)
      writeRow(home.clone(), target.clone(), col, A.pos, [stationS[k], w, rng(), 1], rng(), 0.8 + rng() * 0.5);
    }

    // ── ghost tendrils: the paths not taken (kind 0 — approach glow, never flare) ──
    const tCount = tendrilCounts[k];
    for (let tt = 0; tt < tCount; tt++) {
      const side = A.right.clone().multiplyScalar(rng() > 0.5 ? 1 : -1);
      const back = A.normal.clone().negate();
      const p0 = A.pos.clone();
      const ctrl = p0
        .clone()
        .addScaledVector(side, 3)
        .addScaledVector(back, 5)
        .addScaledVector(A.up, -1);
      const p2 = p0
        .clone()
        .addScaledVector(side, 5 + rng() * 4)
        .addScaledVector(back, 9 + rng() * 5)
        .addScaledVector(A.up, -(1 + rng() * 2));
      for (let i = 0; i < TENDRIL_PTS; i++) {
        const t = i / (TENDRIL_PTS - 1);
        const mt = 1 - t;
        target.set(
          mt * mt * p0.x + 2 * mt * t * ctrl.x + t * t * p2.x + (rng() - 0.5) * 0.3,
          mt * mt * p0.y + 2 * mt * t * ctrl.y + t * t * p2.y + (rng() - 0.5) * 0.3,
          mt * mt * p0.z + 2 * mt * t * ctrl.z + t * t * p2.z + (rng() - 0.5) * 0.3,
        );
        // indigo end of the ramp only, brightness tapering to the tip
        const col = rampColor(0.08);
        const bright = 0.45 * (1 - Math.pow(t, 1.4));
        col.multiplyScalar(bright);
        writeRow(target.clone(), target.clone(), col, A.pos, [stationS[k], 0, rng(), 0], rng(), 0.45 + rng() * 0.3);
      }
    }
    ranges.push({ start, count: row - start, beacon: k });
  }

  // ── ambient dust: permanent DISTANT drift through the flight volume ──
  {
    const rng = mulberry32(0xc0ffee ^ seed);
    const { min, max } = dustBounds;
    for (let i = 0; i < dustCount; i++) {
      home.set(
        min.x + (max.x - min.x) * rng(),
        min.y + (max.y - min.y) * rng(),
        min.z + (max.z - min.z) * rng(),
      );
      const col = rampColor(rng() * 0.3).multiplyScalar(0.35 + 0.35 * rng());
      writeRow(home.clone(), home.clone(), col, home, [2.0, 0, rng(), 0], rng(), 0.3 + rng() * 0.4);
    }
  }

  // ── assemble ──
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(aHome.slice(), 3)); // three requires it
  geo.setAttribute("aHome", new THREE.BufferAttribute(aHome, 3));
  geo.setAttribute("aTarget", new THREE.BufferAttribute(aTarget, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(aColor, 3));
  geo.setAttribute("aAnchor", new THREE.BufferAttribute(aAnchor, 3));
  geo.setAttribute("aMeta", new THREE.BufferAttribute(aMeta, 4));
  geo.setAttribute("aCull", new THREE.BufferAttribute(aCull, 1));
  geo.setAttribute("aDim", new THREE.BufferAttribute(aDim, 1));
  geo.setAttribute("aSizeJ", new THREE.BufferAttribute(aSizeJ, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader: BEACON_VERT,
    fragmentShader: BEACON_FRAG,
    uniforms: {
      uArc: { value: 0 },
      uGap: { value: 1 / Math.max(1, n) },
      uTime: { value: 0 },
      uSize: { value: 30 },
      uPixelRatio: { value: 1 },
      uKeep: { value: 1 },
      uFocus: { value: 20 },
      uFocusRange: { value: 28 },
      uCoc: { value: 1 },
      uHot: { value: new THREE.Color(COL_C) },
    },
    transparent: true,
    depthWrite: false,
    depthTest: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geo, material);
  points.frustumCulled = false;
  points.renderOrder = 2;

  return {
    points,
    material,
    setDimmed(mask) {
      const attr = geo.getAttribute("aDim") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      for (const r of ranges) {
        const v = mask?.[r.beacon] ? 1 : 0;
        arr.fill(v, r.start, r.start + r.count);
      }
      attr.needsUpdate = true;
    },
    dispose() {
      geo.dispose();
      material.dispose();
    },
  };
}
