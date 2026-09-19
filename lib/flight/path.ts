/**
 * The Flight — pure geometry. No DOM, no canvas, no React: every function here
 * is deterministic and unit-testable (see path.test.ts).
 *
 * These constants and curves are TUNED. They came out of the design prototype
 * and are ported verbatim; treat changes as design changes, not refactors.
 *
 * ALLOCATION CONTRACT: nothing in this module allocates on a hot path. Every
 * function that produces a vector writes into a caller-owned scratch object and
 * returns a scalar (or the scratch). The render loop therefore runs with a flat
 * GC profile — no per-frame garbage from the thousands of projections a frame.
 */

export type Vec3 = { x: number; y: number; z: number };

/** Mutable 3-vector, for scratch buffers. */
export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

// ── Path constants ──────────────────────────────────────────────────────────

/** Radius of the circular spiral the camera flies. */
export const PATH_RADIUS = 340;
/** Distance travelled down +z per station. */
export const PATH_STRIDE = 560;
/** Lateral offset of a beacon from the path centreline, before viewport clamp. */
export const BEACON_SPREAD = 150;

/**
 * Fraction of the scroll range spent flying IN from u = -0.3 to station 0.
 * The intro headline cross-fades out across exactly this window.
 */
export const LEAD = 0.05;

/** Camera start parameter — behind station 0, so the run flies *in*. */
export const U_START = -0.3;

/** Dwell (fraction of each inter-station beat spent parked at the station). */
export const HOLD_MIN = 0;
export const HOLD_MAX = 0.8;
export const HOLD_DEFAULT = 0.5;

/**
 * Camera follow stiffness (exponential damping lambda).
 *
 * TUNING NOTE (port deviation): the prototype read raw `window.scrollY` and used
 * 6.5. This site scrolls through Lenis (lerp 0.09), which ALREADY smooths the
 * position we read — so 6.5 here stacks a second smoothing pass on top and the
 * camera lags the page noticeably. Raised to 11 so the total response matches
 * the prototype's feel. Under native scroll (reduced motion) the camera snaps
 * anyway, so this only ever applies to the Lenis path.
 */
export const GLIDE_MIN = 3;
export const GLIDE_MAX = 16;
export const GLIDE_DEFAULT = 11;

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/** Smoothstep, 0..1. */
export const smoothstep = (x: number) => x * x * (3 - 2 * x);

// ── The path ────────────────────────────────────────────────────────────────

/**
 * The flight path: a circular spiral advancing down +z, one station per unit of
 * `u`. Writes into `out` and returns it.
 */
export function path(u: number, out: Vec3): Vec3 {
  out.x = Math.cos(u * 1.25) * PATH_RADIUS;
  out.y = Math.sin(u * 0.8) * 110;
  out.z = u * PATH_STRIDE;
  return out;
}

/**
 * Where station `i`'s beacon sits: on the path, pushed alternately left/right.
 * Deterministic — the same index always yields the same point, so a rebuild
 * can't shuffle the scene.
 */
export function beaconPosition(i: number, out: Vec3): Vec3 {
  path(i, out);
  const side = i % 2 ? 1 : -1;
  out.x += Math.cos(i * 1.25) * BEACON_SPREAD * side;
  out.y += Math.sin(i * 0.8) * 40;
  return out;
}

/** Which side of the path station `i` sits on: -1 left, 1 right. */
export const beaconSide = (i: number) => (i % 2 ? 1 : -1);

// ── Dwell-warped scroll mapping ─────────────────────────────────────────────

/**
 * Map scroll progress (0..1 over the flight section) to the camera parameter
 * `u` (station space).
 *
 * This is the heart of the feel: the camera does NOT move linearly with scroll.
 * Each station gets a `hold` slice of its beat where `u` is pinned — a readable
 * dwell — and then smoothsteps through the remaining transit to the next one.
 * Set hold = 0 and it degrades to a plain smoothstepped ramp.
 *
 * Monotonic non-decreasing over fp ∈ [0,1] (asserted in path.test.ts), which is
 * what lets scroll direction and flight direction never disagree.
 */
export function warp(fp: number, n: number, hold: number): number {
  if (fp <= LEAD) return U_START + (fp / LEAD) * -U_START;
  if (n < 2) return 0;
  const H = clamp(hold, HOLD_MIN, HOLD_MAX);
  const s = ((fp - LEAD) / (1 - LEAD)) * (n - 1);
  const i = Math.floor(s);
  const f = s - i;
  const x = f <= H ? 0 : (f - H) / (1 - H);
  return Math.min(n - 1, i + smoothstep(x));
}

/**
 * Inverse of `warp` at the station centres: the scroll offset (within the
 * flight section) that parks the camera exactly on station `i`.
 *
 * Lands mid-dwell, so `warp(uToScroll(i)/range) === i` exactly for every station
 * that fits before the end of the run — the round-trip the rail and deep links
 * depend on.
 */
export function uToScroll(i: number, n: number, hold: number, range: number): number {
  const H = clamp(hold, HOLD_MIN, HOLD_MAX);
  const s = Math.min(n - 1, i + H * 0.5);
  const q = n > 1 ? Math.min(1, s / (n - 1)) : 0;
  return (LEAD + q * (1 - LEAD)) * (range || 1);
}

// ── Camera ──────────────────────────────────────────────────────────────────

/**
 * The camera basis for a frame: position, forward/right/up after banking, and
 * the focal length. Allocated ONCE per canvas and mutated in place every frame.
 */
export type Camera = {
  /** Eye position. */
  px: number; py: number; pz: number;
  /** Forward. */
  fx: number; fy: number; fz: number;
  /** Right, after roll. */
  rx: number; ry: number; rz: number;
  /** Up, after roll. */
  ux: number; uy: number; uz: number;
  /** Bank angle, radians. Cards counter-rotate by a fraction of this. */
  roll: number;
  /** Focal length in device pixels (stretches with speed — the FOV punch). */
  focal: number;
  /** Half-viewport, device pixels. */
  hw: number; hh: number;
};

export const createCamera = (): Camera => ({
  px: 0, py: 0, pz: 0,
  fx: 0, fy: 0, fz: 1,
  rx: 1, ry: 0, rz: 0,
  ux: 0, uy: 1, uz: 0,
  roll: 0, focal: 1, hw: 0, hh: 0,
});

// Module-level scratch. Safe: updateCamera is synchronous, single-threaded, and
// never re-entered.
const _eye = vec3();
const _tgt = vec3();
const _ahead = vec3();

/**
 * Recompute the camera basis for parameter `u`.
 *
 * - Eye trails the look-at point (u - 0.75 vs u + 0.3), so you always fly
 *   *toward* something rather than sitting on it.
 * - Bank: sampling the path a further 0.9 ahead and measuring its lateral
 *   offset gives a signed turn rate, which rolls the camera into the corner.
 * - `speed` (0..1) stretches the focal length — the FOV punch on fast scroll.
 */
export function updateCamera(
  cam: Camera,
  u: number,
  lookX: number,
  lookY: number,
  bob: number,
  viewW: number,
  viewH: number,
  speed: number,
): Camera {
  const eye = path(u - 0.75, _eye);
  const tgt = path(u + 0.3, _tgt);

  let fx = tgt.x - eye.x, fy = tgt.y - eye.y, fz = tgt.z - eye.z;
  const fl = Math.hypot(fx, fy, fz) || 1;
  fx /= fl; fy /= fl; fz /= fl;

  // Right = forward × worldUp, flattened (no roll yet).
  let rx = fz, rz = -fx;
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl; rz /= rl;
  const ry = 0;

  // Up = forward × right.
  const upx = fy * rz - fz * ry;
  const upy = fz * rx - fx * rz;
  const upz = fx * ry - fy * rx;

  // Bank into the turn.
  const ahead = path(u + 0.9, _ahead);
  const lat = (ahead.x - eye.x) * rx + (ahead.z - eye.z) * rz;
  const roll = clamp(-lat * 0.00045, -0.3, 0.3);
  const cr = Math.cos(roll), sr = Math.sin(roll);

  cam.fx = fx; cam.fy = fy; cam.fz = fz;
  cam.rx = rx * cr + upx * sr;
  cam.ry = ry * cr + upy * sr;
  cam.rz = rz * cr + upz * sr;
  cam.ux = upx * cr - rx * sr;
  cam.uy = upy * cr - ry * sr;
  cam.uz = upz * cr - rz * sr;
  cam.roll = roll;

  // Cursor parallax rides the (rolled) right vector; bob is world-up.
  cam.px = eye.x + cam.rx * lookX;
  cam.py = eye.y + lookY + bob;
  cam.pz = eye.z + cam.rz * lookX;

  cam.focal = (0.9 + speed * 0.16) * viewH;
  cam.hw = viewW / 2;
  cam.hh = viewH / 2;
  return cam;
}

/** Near plane. Anything closer is behind/through the camera and is culled. */
export const NEAR = 55;

/**
 * Perspective-project a world point into device-pixel screen space.
 *
 * Writes x/y into `out` and RETURNS THE CAMERA-SPACE DEPTH — or 0 when the
 * point is behind the near plane. `0` is therefore the cull signal, and callers
 * read it as falsy. `out` is never cleared on a cull, so callers must check the
 * return before reading it.
 */
export function project(cam: Camera, x: number, y: number, z: number, out: Vec3): number {
  const dx = x - cam.px, dy = y - cam.py, dz = z - cam.pz;
  const depth = dx * cam.fx + dy * cam.fy + dz * cam.fz;
  if (depth < NEAR) return 0;
  const s = cam.focal / depth;
  out.x = cam.hw + (dx * cam.rx + dy * cam.ry + dz * cam.rz) * s;
  out.y = cam.hh - (dx * cam.ux + dy * cam.uy + dz * cam.uz) * s;
  out.z = depth;
  return depth;
}

/**
 * Exponential damping — frame-rate independent, unlike a raw lerp. `lambda` is
 * "how fast", in e-folds per second.
 */
export const damp = (cur: number, target: number, lambda: number, dt: number) =>
  cur + (target - cur) * (1 - Math.exp(-lambda * dt));

/**
 * Per-station proximity envelope, 0..1: 1 at the station, 0 a full station
 * away. Drives condensation, card opacity/scale, reticle and rail state.
 */
export const envelope = (u: number, i: number) => Math.max(0, 1 - Math.abs(u - i));
