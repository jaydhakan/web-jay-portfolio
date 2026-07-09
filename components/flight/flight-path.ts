/**
 * flight-path.ts — the PURE math core of "The Flight" (timelineplan.md §10).
 *
 * Everything here is a deterministic function of (beats[], offsets[], aspect):
 * same inputs ⇒ same flight, SSR-safe, no Math.random (hash01 only), no React,
 * no DOM. The camera and every beacon state derive from ONE scalar — the Spine's
 * scrubbed ScrollTrigger progress — through a static, monotone, bijective warp.
 * There is deliberately NO temporal smoothing anywhere in this module: `scrub: 0.4`
 * on the DOM trigger is the site's single smoothing stage (the ARGMAX lag rule).
 *
 * Only the Flight's dynamic chunk imports this module (it pulls in three.js).
 */
import * as THREE from "three";
import { hash01 } from "@/components/timeline/geometry";
import type { Beat } from "@/components/timeline/argmax";

// ── Tuning table (timelineplan.md §10.3 — change values HERE, nowhere else) ────
export const BASE_RUN = 18; //         z advance per milestone (world units)
export const RUN_PER_WEIGHT = 10; //   heavier milestone = longer approach run
export const DROP_Y = 3.2; //          vertical descent per milestone
export const LANE_BASE = 2.2; //       serpentine x amplitude floor
export const LANE_PER_WEIGHT = 3.4;
export const LANE_JITTER = 1.2; //     deterministic hash01 jitter
export const TRAIL_DIST = 3.0; //      camera sits behind the curve head
export const TRAIL_LIFT = 1.1; //      and slightly above it
export const LOOK_AHEAD = 0.035; //    lookAt anticipation (arc fraction)
export const ROLL_MAX_DEG = 8; //      banking clamp
export const ROLL_GAIN = 55; //        deg per (rad of horizontal turn over ds=0.01)
export const BASE_FOV = 50;
export const FOV_PUNCH = 4; //         tighten at waypoints (zoom-kiss on arrival)
export const FOV_SIGMA = 0.018; //     bell width in p-space
export const FINALE_FOV_OPEN = 8; //   widen on the pull-back
export const BEACON_NDC_X = 0.5; //    beacons live dead-centre of the free right half
export const BEACON_NDC_Y = 0.05;
export const BEACON_DEPTH = 13; //     world units in front of the camera
const DWELL_SLOPE_MAX = 0.45; //       ds/dp at a station (light milestone)
const DWELL_SLOPE_MIN = 0.22; //       ds/dp at a station (heavy = longer dwell)
const LUT_N = 512;

const clamp01 = (v: number) => THREE.MathUtils.clamp(v, 0, 1);

// ── Path construction ──────────────────────────────────────────────────────────
export type FlightPath = {
  posLut: Float32Array; //  (LUT_N+1)×3, arc-length spaced
  tanLut: Float32Array;
  /** Arc fraction of each milestone station, strictly inside (0, 1). */
  stationS: number[];
  centroid: THREE.Vector3;
  n: number;
};

/**
 * World frame: fly toward −Z, descend in Y (loss going down), serpentine in X.
 * A LEAD-IN knot before milestone 0 gives the first station real approach travel
 * (without it stationS[0] would be 0 and the first warp segment degenerate — a
 * hole the subsystem spec missed; see plan §8 reconciliation). Two TAIL knots
 * hold the last ~12–20% of arc for the finale pull-back.
 */
export function buildFlightPath(beats: Beat[]): FlightPath {
  const n = beats.length;
  const mile: THREE.Vector3[] = [];
  let z = 0;
  for (let k = 0; k < n; k++) {
    const w = beats[k].weight;
    const dir = k % 2 === 0 ? 1 : -1;
    const x = dir * (LANE_BASE + LANE_PER_WEIGHT * w + hash01(`fl.${k}.x`) * LANE_JITTER);
    const y = -k * DROP_Y + (hash01(`fl.${k}.y`) - 0.5) * 1.6;
    mile.push(new THREE.Vector3(x, y, z));
    z -= BASE_RUN + RUN_PER_WEIGHT * w;
  }
  const centroid = mile
    .reduce((a, v) => a.add(v), new THREE.Vector3())
    .divideScalar(Math.max(1, n));

  const lead = mile[0].clone().add(new THREE.Vector3(-mile[0].x * 0.5, 2.4, 14));
  const last = mile[n - 1];
  const tail1 = last.clone().add(new THREE.Vector3(-last.x * 0.6, 9, -8));
  const tail2 = new THREE.Vector3(0, centroid.y + 34, centroid.z + 0.55 * Math.abs(last.z));
  const knots = [lead, ...mile, tail1, tail2];

  // centripetal = provably cusp-free on uneven knot spacing (runs vary 18–28 units)
  const curve = new THREE.CatmullRomCurve3(knots, false, "centripetal", 0.5);
  curve.arcLengthDivisions = LUT_N;

  const spaced = curve.getSpacedPoints(LUT_N); // LUT_N+1 arc-length-spaced points
  const posLut = new Float32Array((LUT_N + 1) * 3);
  const tanLut = new Float32Array((LUT_N + 1) * 3);
  const tmp = new THREE.Vector3();
  for (let i = 0; i <= LUT_N; i++) {
    posLut[i * 3] = spaced[i].x;
    posLut[i * 3 + 1] = spaced[i].y;
    posLut[i * 3 + 2] = spaced[i].z;
  }
  for (let i = 0; i <= LUT_N; i++) {
    const a = spaced[Math.max(0, i - 1)];
    const b = spaced[Math.min(LUT_N, i + 1)];
    tmp.subVectors(b, a).normalize();
    tanLut[i * 3] = tmp.x;
    tanLut[i * 3 + 1] = tmp.y;
    tanLut[i * 3 + 2] = tmp.z;
  }

  // Stations: the curve passes exactly through knot j at t = j/(knots-1); milestone k
  // is knot k+1 (lead-in shifts everything by one). Convert t → arc fraction via the
  // cumulative-lengths table (uniform-t sampled, same LUT_N).
  const lengths = curve.getLengths(LUT_N);
  const total = lengths[LUT_N] || 1;
  const stationS: number[] = [];
  const knotTotal = knots.length;
  for (let k = 0; k < n; k++) {
    const t = (k + 1) / (knotTotal - 1);
    const x = t * LUT_N;
    const i0 = Math.min(LUT_N - 1, Math.floor(x));
    const L = lengths[i0] + (lengths[i0 + 1] - lengths[i0]) * (x - i0);
    stationS.push(L / total);
  }
  return { posLut, tanLut, stationS, centroid, n };
}

// ── Offsets sanitizer (DOM measurements can be absent/degenerate on frame 0) ──
export function sanitizeOffsets(raw: number[], n: number): number[] {
  if (raw.length !== n || n === 0) {
    return Array.from({ length: n }, (_, k) => (k + 0.5) / Math.max(1, n));
  }
  const out = raw.map((v) => THREE.MathUtils.clamp(v, 0.02, 0.94));
  for (let i = 1; i < n; i++) out[i] = Math.max(out[i], out[i - 1] + 0.02);
  if (out[n - 1] > 0.97) {
    // compress back into range, preserving order
    const first = out[0];
    const span = out[n - 1] - first || 1;
    for (let i = 0; i < n; i++) out[i] = 0.02 + ((out[i] - first) / span) * 0.92;
  }
  return out;
}

// ── The dwell warp p → s (monotone Hermite; timelineplan.md §10.2) ─────────────
/**
 * Fixed points: warp(0)=0, warp(1)=1, warp(offsets[k]) = stationS[k] — the camera
 * stands at station k at the exact progress where card k's marker ignites. Between
 * fixed points: monotone cubic Hermite with prescribed global slopes; small slope at
 * stations = dwell (heavier beat ⇒ slower ⇒ longer hold). Slopes are clamped into the
 * Fritsch–Carlson monotone box, so the map is strictly increasing ⇒ bijective, and it
 * is pure in p — scrubbing backward replays the exact flight in reverse.
 */
export function makeWarp(
  offsets: number[],
  stationS: number[],
  beats: Beat[],
): (p: number) => number {
  const P = [0, ...offsets, 1];
  const S = [0, ...stationS, 1];
  const M = [
    1,
    ...beats.map((b) => DWELL_SLOPE_MAX + (DWELL_SLOPE_MIN - DWELL_SLOPE_MAX) * b.weight),
    1,
  ];
  return (p: number): number => {
    const pc = clamp01(p);
    let j = 1;
    while (j < P.length - 1 && pc > P[j]) j++;
    const dp = Math.max(1e-6, P[j] - P[j - 1]);
    const dsg = Math.max(0, S[j] - S[j - 1]);
    const t = (pc - P[j - 1]) / dp;
    const sec = Math.max(1e-4, dsg / dp);
    const m0 = THREE.MathUtils.clamp(M[j - 1] / sec, 0.05, 3);
    const m1 = THREE.MathUtils.clamp(M[j] / sec, 0.05, 3);
    const h = m0 * t + (3 - 2 * m0 - m1) * t * t + (m0 + m1 - 2) * t * t * t;
    return S[j - 1] + dsg * h;
  };
}

// ── The rig ────────────────────────────────────────────────────────────────────
export type FlightRig = {
  path: FlightPath;
  /** Sanitized DOM ignition fractions (the warp's fixed points). */
  offsets: number[];
  warp: (p: number) => number;
  beats: Beat[];
};

export function buildRig(beats: Beat[], rawOffsets: number[]): FlightRig {
  const path = buildFlightPath(beats);
  const offsets = sanitizeOffsets(rawOffsets, beats.length);
  const warp = makeWarp(offsets, path.stationS, beats);
  return { path, offsets, warp, beats };
}

// ── Camera application (pure function of p; scratch vectors, zero alloc) ──────
const _pos = new THREE.Vector3();
const _tan = new THREE.Vector3();
const _tan2 = new THREE.Vector3();
const _ahead = new THREE.Vector3();
const _look = new THREE.Vector3();
const _right = new THREE.Vector3();
const _aim = new THREE.Vector3();

function lutAt(lut: Float32Array, s: number, out: THREE.Vector3) {
  const N = lut.length / 3 - 1;
  const x = clamp01(s) * N;
  const i = Math.min(N - 1, Math.floor(x));
  const f = x - i;
  out.set(
    lut[i * 3] + (lut[(i + 1) * 3] - lut[i * 3]) * f,
    lut[i * 3 + 1] + (lut[(i + 1) * 3 + 1] - lut[i * 3 + 1]) * f,
    lut[i * 3 + 2] + (lut[(i + 1) * 3 + 2] - lut[i * 3 + 2]) * f,
  );
}

/** Poses `cam` for progress p. Returns the warped arc fraction s (for beacon uArc).
 *
 *  `anchorPts` (optional): solved beacon anchor positions. Mid-gap, the aim blends
 *  partially toward the beacon being APPROACHED so its resolving glyph is always
 *  in-frame (without it, a bending path can leave the next anchor outside the
 *  frustum — the "dead mid-gap" bug). The blend fades to ZERO near dwell centres,
 *  so the anchor solver's exact-NDC pose still holds exactly where the right-45%
 *  guarantee is asserted. The solver itself calls this WITHOUT anchors (pure path
 *  aim) — the fixed-point geometry stays circular-dependency-free. */
export function applyRig(
  cam: THREE.PerspectiveCamera,
  p: number,
  rig: FlightRig,
  anchorPts?: THREE.Vector3[],
): number {
  const { path, warp, offsets, beats } = rig;
  const n = path.n;
  const s = warp(p);

  lutAt(path.posLut, s, _pos);
  lutAt(path.tanLut, s, _tan);
  _tan.normalize();
  cam.position.copy(_pos).addScaledVector(_tan, -TRAIL_DIST);
  cam.position.y += TRAIL_LIFT;

  // finale factor: lookAt sweeps to the constellation centroid, roll fades, FOV opens
  const f = THREE.MathUtils.smoothstep(s, path.stationS[n - 1] ?? 0.85, 1);
  lutAt(path.posLut, Math.min(s + LOOK_AHEAD, 1), _ahead);
  _look.copy(_ahead).lerp(path.centroid, f);

  cam.up.set(0, 1, 0);
  cam.lookAt(_look);

  if (anchorPts && f < 0.5) {
    // the station being approached: first k with offsets[k] >= p (clamped to last)
    let k = n - 1;
    for (let i = 0; i < n; i++) {
      if (p <= (offsets[i] ?? 1)) {
        k = i;
        break;
      }
    }
    const prev = k === 0 ? 0 : offsets[k - 1];
    const gap = Math.max(1e-4, (offsets[k] ?? 1) - prev);
    const approach = THREE.MathUtils.smoothstep((p - prev) / gap, 0.15, 0.7);
    const nearDwell = Math.exp(-Math.pow((p - (offsets[k] ?? 1)) / (FOV_SIGMA * 2), 2));
    const blend = approach * (1 - nearDwell) * Math.max(0, 1 - f * 2);
    const A = anchorPts[k];
    if (blend > 1e-3 && A) {
      // Aim not AT the anchor (that would centre it over the card column) but at a
      // point offset camera-left of it, so the resolving glyph rides ~NDC +0.5 —
      // the same right-of-centre lane the dwell pose guarantees.
      _right.set(1, 0, 0).applyQuaternion(cam.quaternion);
      const dist = Math.max(4, _aim.copy(A).sub(cam.position).length());
      const R = BEACON_NDC_X * dist * Math.tan(THREE.MathUtils.degToRad(BASE_FOV / 2)) * cam.aspect;
      _aim.copy(A).addScaledVector(_right, -R);
      _look.lerp(_aim, blend);
      cam.lookAt(_look);
    }
  }

  // banking from the horizontal turn rate (pure spatial derivative — not temporal)
  lutAt(path.tanLut, Math.min(s + 0.01, 1), _tan2);
  _tan2.normalize();
  const turn = _tan.x * _tan2.z - _tan.z * _tan2.x;
  const roll =
    THREE.MathUtils.clamp((turn / 0.01) * ROLL_GAIN, -ROLL_MAX_DEG, ROLL_MAX_DEG) * (1 - f);
  cam.rotateZ(THREE.MathUtils.degToRad(roll));

  // FOV breathing near the nearest station (bell in p-space, weight-scaled)
  let prox = 0;
  let wNear = 0.5;
  for (let k = 0; k < n; k++) {
    const d = (p - offsets[k]) / FOV_SIGMA;
    const b = Math.exp(-d * d);
    if (b > prox) {
      prox = b;
      wNear = beats[k].weight;
    }
  }
  const fov = BASE_FOV - FOV_PUNCH * prox * (0.6 + 0.4 * wNear) + FINALE_FOV_OPEN * f;
  if (Math.abs(fov - cam.fov) > 1e-3) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
  return s;
}

// ── Beacon anchors: the exact right-45% guarantee (timelineplan.md §10.4) ─────
export type BeaconAnchor = {
  pos: THREE.Vector3;
  right: THREE.Vector3;
  up: THREE.Vector3;
  /** Faces the camera's arrival position (glyph planes bake against this). */
  normal: THREE.Vector3;
};

/**
 * Beacons are never hand-placed: for each milestone, evaluate the FULL rig (trail,
 * roll, dwelled FOV) at p = offsets[k] on a scratch camera with the live aspect, then
 * park the beacon at NDC (BEACON_NDC_X, BEACON_NDC_Y) at BEACON_DEPTH in that frame.
 * By construction the beacon sits dead-centre of the empty right half at the exact
 * moment its card ignites. Recompute whenever offsets identity or aspect changes.
 */
export function solveBeaconAnchors(rig: FlightRig, aspect: number): BeaconAnchor[] {
  const cam = new THREE.PerspectiveCamera(BASE_FOV, aspect, 0.1, 400);
  return rig.offsets.map((pk) => {
    applyRig(cam, pk, rig);
    cam.updateMatrixWorld(true);
    const tanHalf = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const R = BEACON_NDC_X * BEACON_DEPTH * tanHalf * aspect;
    const U = BEACON_NDC_Y * BEACON_DEPTH * tanHalf;
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(cam.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
    const pos = cam.position
      .clone()
      .addScaledVector(fwd, BEACON_DEPTH)
      .addScaledVector(right, R)
      .addScaledVector(up, U);
    return { pos, right, up, normal: fwd.negate() };
  });
}
