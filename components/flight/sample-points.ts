/**
 * sample-points.ts — procedural halo sampling for the Flight beacons (holo pivot,
 * plan.md 2026-07-13): beacons no longer resolve into glyph/numeral shapes — a crisp
 * DOM hologram card carries the information (FlightBackdrop's HoloLayer), and the
 * particles condense into the luminous HALO that frames it: a main elliptical ring,
 * a fainter outer orbit, and two short "scan ticks" flanking the card.
 *
 * Pure math (no rasterization, no font wait — the old 2D-canvas pipeline is gone).
 * Deterministic: seeded mulberry32 throughout, so reloads produce identical clouds.
 * Output contract is unchanged: n LOCAL unit-plane points in [-0.5, 0.5] with a thin
 * z slab, world-baked against the beacon anchor basis in beacon-field.ts.
 */

/** Tiny seeded PRNG (same generator family the arena uses). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Halo proportions (of the unit plane) — the DOM card sits INSIDE the main ring,
// so the ring is wider than tall (card aspect) with breathing room around it.
// HALO_RING_RX is exported: the holo driver sizes the DOM card off the ring's
// PROJECTED pixel radius, so card and halo stay nested on every viewport.
export const HALO_RING_RX = 0.46;
const RING_RX = HALO_RING_RX;
const RING_RY = 0.30;
const RING_THICK = 0.035;
const ORBIT_SCALE = 1.35;

/** Sample the holo-card halo into exactly n local-plane points. */
export function sampleHalo(n: number, rng: () => number): Float32Array {
  const out = new Float32Array(n * 3);
  const mainN = Math.floor(n * 0.62);
  const orbitN = Math.floor(n * 0.26);
  for (let i = 0; i < n; i++) {
    let x: number;
    let y: number;
    let z: number;
    if (i < mainN) {
      // main ring: dense ellipse with gaussian-ish thickness (sum of two uniforms)
      const th = rng() * Math.PI * 2;
      const r = 1 + (rng() + rng() - 1) * RING_THICK * 2;
      x = Math.cos(th) * RING_RX * r;
      y = Math.sin(th) * RING_RY * r;
      z = (rng() - 0.5) * 0.06;
    } else if (i < mainN + orbitN) {
      // outer orbit: sparse, slightly tilted ellipse behind the plane (parallax depth)
      const th = rng() * Math.PI * 2;
      const r = 1 + (rng() + rng() - 1) * RING_THICK * 4;
      x = Math.cos(th) * RING_RX * ORBIT_SCALE * r;
      y = Math.sin(th) * RING_RY * ORBIT_SCALE * r + Math.cos(th) * 0.05;
      z = -0.12 + (rng() - 0.5) * 0.1;
    } else {
      // scan ticks: two short vertical dashes flanking the card (HUD framing)
      const side = rng() > 0.5 ? 1 : -1;
      x = side * RING_RX * 1.12 + (rng() - 0.5) * 0.02;
      y = (rng() - 0.5) * RING_RY * 1.1;
      z = (rng() - 0.5) * 0.05;
    }
    out[i * 3] = x;
    out[i * 3 + 1] = y;
    out[i * 3 + 2] = z;
  }
  return out;
}
