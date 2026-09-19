/**
 * Pure-geometry invariants for The Flight.
 *
 * Run: `npm test` (node:test + native TS stripping — no test framework dep).
 * These lock the tuned curves: if a refactor changes the feel, it fails here
 * rather than silently in a browser.
 */
import test from "node:test";
import assert from "node:assert/strict";

import {
  HOLD_DEFAULT,
  HOLD_MAX,
  LEAD,
  NEAR,
  U_START,
  beaconPosition,
  beaconSide,
  createCamera,
  damp,
  envelope,
  path,
  project,
  updateCamera,
  uToScroll,
  vec3,
  warp,
} from "./path.ts";

const HOLDS = [0, 0.25, HOLD_DEFAULT, HOLD_MAX];
const COUNTS = [2, 3, 7, 9, 24];

// ── warp: monotonicity ──────────────────────────────────────────────────────

test("warp() is monotonically non-decreasing across the whole scroll range", () => {
  for (const n of COUNTS) {
    for (const hold of HOLDS) {
      let prev = -Infinity;
      for (let k = 0; k <= 20000; k++) {
        const u = warp(k / 20000, n, hold);
        assert.ok(
          u >= prev - 1e-12,
          `warp went backwards at fp=${k / 20000} (n=${n}, hold=${hold}): ${u} < ${prev}`,
        );
        prev = u;
      }
    }
  }
});

test("warp() is continuous — no jump larger than a station between adjacent samples", () => {
  for (const n of COUNTS) {
    for (const hold of HOLDS) {
      let prev = warp(0, n, hold);
      for (let k = 1; k <= 20000; k++) {
        const u = warp(k / 20000, n, hold);
        // 20k samples over n-1 stations: a step can never legitimately exceed
        // a few thousandths of a station. 0.05 catches any discontinuity.
        assert.ok(u - prev < 0.05, `warp jumped ${u - prev} at fp=${k / 20000} (n=${n}, hold=${hold})`);
        prev = u;
      }
    }
  }
});

test("warp() spans exactly U_START..n-1 and clamps at both ends", () => {
  for (const n of COUNTS) {
    for (const hold of HOLDS) {
      assert.equal(warp(0, n, hold), U_START, "run must start behind station 0");
      assert.ok(Math.abs(warp(LEAD, n, hold)) < 1e-12, "camera reaches station 0 exactly at LEAD");
      assert.equal(warp(1, n, hold), n - 1, "run must end on the last station");
      // Out-of-range input is clamped by the caller, but must not explode here.
      assert.ok(Number.isFinite(warp(-1, n, hold)));
      assert.ok(Number.isFinite(warp(2, n, hold)));
    }
  }
});

test("warp() dwells: u is pinned for the hold slice of each station's beat", () => {
  const n = 9;
  const hold = 0.5;
  // Mid-dwell of station 3 and a hair later must be the same u.
  const at = (i: number, f: number) => warp(LEAD + ((i + f) / (n - 1)) * (1 - LEAD), n, hold);
  assert.equal(at(3, 0.05), 3, "start of dwell");
  assert.equal(at(3, 0.45), 3, "end of dwell — still parked");
  assert.ok(at(3, 0.75) > 3.2, "transit has begun after the dwell");
  // hold = 0 means no dwell at all: u must move immediately.
  const noHold = (f: number) => warp(LEAD + ((3 + f) / (n - 1)) * (1 - LEAD), n, 0);
  assert.ok(noHold(0.05) > 3, "hold=0 leaves the station immediately");
});

// ── uToScroll: round-trip ───────────────────────────────────────────────────

test("uToScroll() round-trips through warp() exactly for every station", () => {
  const range = 8123; // deliberately not a round number
  for (const n of COUNTS) {
    for (const hold of HOLDS) {
      for (let i = 0; i < n; i++) {
        const y = uToScroll(i, n, hold, range);
        const back = warp(y / range, n, hold);
        assert.ok(
          Math.abs(back - i) < 1e-9,
          `station ${i} of ${n} (hold=${hold}) round-tripped to ${back}`,
        );
      }
    }
  }
});

test("uToScroll() is strictly increasing and stays inside the section", () => {
  const range = 5000;
  for (const n of COUNTS) {
    for (const hold of HOLDS) {
      let prev = -Infinity;
      for (let i = 0; i < n; i++) {
        const y = uToScroll(i, n, hold, range);
        assert.ok(y > prev, `station ${i} did not advance (n=${n}, hold=${hold})`);
        assert.ok(y >= 0 && y <= range, `station ${i} scrolled outside the section: ${y}`);
        prev = y;
      }
    }
  }
});

test("uToScroll() tolerates a zero range without dividing by zero", () => {
  assert.ok(Number.isFinite(uToScroll(0, 9, 0.5, 0)));
});

// ── projection ──────────────────────────────────────────────────────────────

function cameraAt(u: number) {
  return updateCamera(createCamera(), u, 0, 0, 0, 1440, 900, 0);
}

test("project() culls points behind the camera and returns depth in front", () => {
  const cam = cameraAt(3);
  const out = vec3();
  const ahead = beaconPosition(4, vec3());
  const behind = beaconPosition(1, vec3());

  const dAhead = project(cam, ahead.x, ahead.y, ahead.z, out);
  assert.ok(dAhead > 0, "a station ahead of the camera must project");
  assert.ok(dAhead >= NEAR, "returned depth must be at or beyond the near plane");

  const dBehind = project(cam, behind.x, behind.y, behind.z, out);
  assert.equal(dBehind, 0, "a station behind the camera must be culled (0)");
});

test("project() culls exactly at the near plane", () => {
  const cam = cameraAt(0);
  const out = vec3();
  // Walk straight out along forward from the eye.
  const at = (d: number) =>
    project(cam, cam.px + cam.fx * d, cam.py + cam.fy * d, cam.pz + cam.fz * d, out);
  assert.equal(at(NEAR - 0.001), 0, "just inside the near plane is culled");
  assert.ok(at(NEAR + 0.001) > 0, "just outside the near plane projects");
  assert.equal(at(-500), 0, "behind the eye is culled");
});

test("project() puts the look-at point near the centre of the screen", () => {
  const cam = cameraAt(2);
  const out = vec3();
  const lookAt = path(2 + 0.3, vec3());
  assert.ok(project(cam, lookAt.x, lookAt.y, lookAt.z, out) > 0);
  assert.ok(Math.abs(out.x - cam.hw) < 2, `look-at x off-centre: ${out.x} vs ${cam.hw}`);
  assert.ok(Math.abs(out.y - cam.hh) < 2, `look-at y off-centre: ${out.y} vs ${cam.hh}`);
});

test("project() does not allocate — it writes into the caller's scratch", () => {
  const cam = cameraAt(1);
  const out = vec3();
  const before = { ...out };
  const p = beaconPosition(2, vec3());
  project(cam, p.x, p.y, p.z, out);
  assert.notDeepEqual({ x: out.x, y: out.y, z: out.z }, before, "scratch must be written in place");
});

test("project() scales inversely with depth (true perspective)", () => {
  const cam = cameraAt(0);
  const a = vec3();
  const b = vec3();
  // Same lateral offset, one twice as far: screen offset must halve.
  const at = (d: number, out: typeof a) =>
    project(cam, cam.px + cam.fx * d + cam.rx * 100, cam.py + cam.fy * d + cam.ry * 100, cam.pz + cam.fz * d + cam.rz * 100, out);
  at(400, a);
  at(800, b);
  assert.ok(Math.abs((a.x - cam.hw) / (b.x - cam.hw) - 2) < 1e-6, "half the size at twice the distance");
});

// ── camera basis ────────────────────────────────────────────────────────────

test("updateCamera() produces an orthonormal basis at every point on the path", () => {
  for (let u = -1; u <= 12; u += 0.13) {
    const c = cameraAt(u);
    const len = (x: number, y: number, z: number) => Math.hypot(x, y, z);
    assert.ok(Math.abs(len(c.fx, c.fy, c.fz) - 1) < 1e-9, `forward not unit at u=${u}`);
    assert.ok(Math.abs(len(c.rx, c.ry, c.rz) - 1) < 1e-9, `right not unit at u=${u}`);
    assert.ok(Math.abs(len(c.ux, c.uy, c.uz) - 1) < 1e-9, `up not unit at u=${u}`);
    const dot = c.fx * c.rx + c.fy * c.ry + c.fz * c.rz;
    assert.ok(Math.abs(dot) < 1e-9, `forward/right not perpendicular at u=${u}: ${dot}`);
    const dot2 = c.rx * c.ux + c.ry * c.uy + c.rz * c.uz;
    assert.ok(Math.abs(dot2) < 1e-9, `right/up not perpendicular at u=${u}: ${dot2}`);
  }
});

test("updateCamera() banks into turns and stays within the roll clamp", () => {
  let sawPositive = false;
  let sawNegative = false;
  for (let u = 0; u < 14; u += 0.05) {
    const { roll } = cameraAt(u);
    assert.ok(roll >= -0.3 && roll <= 0.3, `roll escaped its clamp at u=${u}: ${roll}`);
    if (roll > 0.02) sawPositive = true;
    if (roll < -0.02) sawNegative = true;
  }
  assert.ok(sawPositive && sawNegative, "the spiral must bank both ways across a full turn");
});

test("updateCamera() stretches focal length with speed (the FOV punch)", () => {
  const still = updateCamera(createCamera(), 2, 0, 0, 0, 1440, 900, 0);
  const fast = updateCamera(createCamera(), 2, 0, 0, 0, 1440, 900, 1);
  assert.ok(fast.focal > still.focal, "focal must grow with speed");
  // focal = (0.9 + speed * 0.16) * viewH — a ~17.8% stretch at full speed.
  assert.ok(Math.abs(fast.focal / still.focal - 1.06 / 0.9) < 1e-9, "focal stretch must stay at the tuned 0.9 -> 1.06");
  assert.equal(still.focal, 0.9 * 900);
});

test("updateCamera() applies cursor parallax along the rolled right vector", () => {
  const none = updateCamera(createCamera(), 2, 0, 0, 0, 1440, 900, 0);
  const base = { px: none.px, py: none.py, pz: none.pz };
  const looked = updateCamera(createCamera(), 2, 90, -60, 0, 1440, 900, 0);
  assert.ok(Math.hypot(looked.px - base.px, looked.pz - base.pz) > 1, "parallax must move the eye laterally");
  assert.ok(Math.abs(looked.py - base.py + 60) < 1e-9, "vertical look is applied straight to y");
});

// ── beacons ─────────────────────────────────────────────────────────────────

test("beaconPosition() is deterministic and alternates sides", () => {
  const a = beaconPosition(4, vec3());
  const b = beaconPosition(4, vec3());
  assert.deepEqual(a, b, "same index must always give the same point");
  assert.equal(beaconSide(0), -1);
  assert.equal(beaconSide(1), 1);
  assert.equal(beaconSide(2), -1);
});

test("beaconPosition() offsets away from the path centreline", () => {
  for (let i = 0; i < 9; i++) {
    const on = path(i, vec3());
    const off = beaconPosition(i, vec3());
    assert.ok(Math.hypot(off.x - on.x, off.y - on.y) > 1, `beacon ${i} sits on the path`);
    assert.equal(off.z, on.z, "beacons share the path's z so dwell lines up");
  }
});

test("stations advance monotonically down +z", () => {
  let prev = -Infinity;
  for (let i = 0; i < 9; i++) {
    const p = beaconPosition(i, vec3());
    assert.ok(p.z > prev);
    prev = p.z;
  }
});

// ── helpers ─────────────────────────────────────────────────────────────────

test("damp() is frame-rate independent", () => {
  // One 100ms step must land within a hair of ten 10ms steps.
  const oneBig = damp(0, 1, 6, 0.1);
  let many = 0;
  for (let k = 0; k < 10; k++) many = damp(many, 1, 6, 0.01);
  assert.ok(Math.abs(oneBig - many) < 1e-12, `${oneBig} vs ${many}`);
});

test("damp() converges and never overshoots", () => {
  let v = 0;
  for (let k = 0; k < 500; k++) {
    v = damp(v, 1, 11, 1 / 60);
    assert.ok(v <= 1, "overshoot");
  }
  assert.ok(v > 0.9999);
});

test("envelope() peaks at the station and dies a station away", () => {
  assert.equal(envelope(3, 3), 1);
  assert.equal(envelope(3.5, 3), 0.5);
  assert.equal(envelope(4, 3), 0);
  assert.equal(envelope(9, 3), 0, "never negative");
});
