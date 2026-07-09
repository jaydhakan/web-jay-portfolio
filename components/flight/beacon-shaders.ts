/**
 * beacon-shaders.ts — the ONE particle program of the Flight (timelineplan.md §11).
 * Beacons, ghost tendrils AND ambient dust are rows of the same merged buffer drawn
 * in a single call; per-row behavior is encoded in attributes, not uniforms:
 *
 *   aMeta = vec4( u_i  — owning station's arc fraction (dust uses +2.0 = never reached,
 *                        so it stays in the DISTANT drift state forever),
 *                 weight — beat emphasis (flare amplitude),
 *                 seed   — per-particle phase/stagger,
 *                 kind   — 1 = beacon (flare + arrival puff), 0 = tendril/dust (never
 *                          flares white; approach glow only) )
 *
 * The whole lifecycle is a pure function of ONE scalar uniform `uArc` (the warped
 * scroll progress): scrubbing backward replays the exact flight in reverse. The
 * `exp()` here is an ARC-DISTANCE envelope (spatial shape, like the FOV bell), not
 * temporal smoothing — the one-smoothing-stage rule stays intact.
 *
 * Fake DoF (sprite-CoC): defocus for additive sprites is just bigger+dimmer, computed
 * per-vertex from view depth vs uFocus/uFocusRange — no DepthOfField pass, ever.
 * Right-stage gate: brightness falls to 0 left of NDC x ≈ −0.1 so the spectacle can
 * never wander under the card column (the arena's text-guard idiom, mirrored).
 */

export const BEACON_VERT = /* glsl */ `
  attribute vec3 aHome;
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute vec3 aAnchor;
  attribute vec4 aMeta;
  attribute float aCull;
  attribute float aDim;
  attribute float aSizeJ;
  uniform float uArc, uGap, uTime, uSize, uPixelRatio, uKeep;
  uniform float uFocus, uFocusRange, uCoc;
  varying vec3 vColor;
  varying float vB;
  varying float vFlare;
  varying float vFade;

  // compact value-noise curl for the swarm drift (bounded time via mod, no banding)
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = hash2(i).x;
    float b = hash2(i + vec2(1.0, 0.0)).x;
    float c = hash2(i + vec2(0.0, 1.0)).x;
    float d = hash2(i + vec2(1.0, 1.0)).x;
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  vec2 curl(vec2 p) {
    float e = 0.12;
    float n1 = vnoise(p + vec2(0.0, e));
    float n2 = vnoise(p - vec2(0.0, e));
    float n3 = vnoise(p + vec2(e, 0.0));
    float n4 = vnoise(p - vec2(e, 0.0));
    return vec2(n1 - n2, n4 - n3) / (2.0 * e) * 0.35;
  }

  void main() {
    // flicker-free count shedding: culled rows collapse to a degenerate clip position
    if (aCull > uKeep) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
      vColor = vec3(0.0); vB = 0.0; vFlare = 0.0; vFade = 0.0;
      return;
    }
    float t = mod(uTime, 120.0);

    // ── the state machine: DISTANT → APPROACH → ARRIVAL → SETTLED, pure in uArc ──
    // The approach window spans a FULL gap (starts at -1.5G): as the camera leaves
    // beacon k, beacon k+1 is already condensing — the stage is never empty mid-gap.
    float d = uArc - aMeta.x;
    float form = smoothstep(-1.5 * uGap, -0.15 * uGap, d);
    // seed-staggered lock-in: heavier-seeded particles resolve last ("condensing")
    float f = smoothstep(0.0, 1.0, clamp(form * 1.3 - aMeta.z * 0.3, 0.0, 1.0));
    float attack = smoothstep(-0.10 * uGap, 0.0, d);
    float flare = attack * exp(-max(d, 0.0) / (0.28 * uGap))
                * (0.6 + 0.9 * aMeta.y) * aMeta.w;
    float behind = smoothstep(2.0 * uGap, 4.0 * uGap, d);

    // ── position: curl swarm → glyph, with the arrival puff ──
    vec2 cxy = curl(aHome.xy * 0.35 + vec2(t * 0.05, aMeta.z * 7.0));
    float cz = vnoise(aHome.xz * 0.4 + vec2(aMeta.z * 9.0, t * 0.04)) - 0.5;
    vec3 swarm = aHome + vec3(cxy, cz) * 1.4 * (1.0 - 0.6 * form);
    vec3 breathe = vec3(
      sin(t * 0.7 + aMeta.z * 6.28318),
      cos(t * 0.6 + aMeta.z * 4.0),
      0.0
    ) * 0.025;
    vec3 glyph = aTarget + breathe
               + normalize(aTarget - aAnchor + vec3(1e-4)) * flare * 0.20 * aMeta.w;
    vec3 pos = mix(swarm, glyph, f);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    // ── fake DoF: bigger × dimmer with distance from the focus band ──
    float coc = clamp((abs(-mv.z - uFocus) - uFocusRange) / (uFocusRange * 2.0), 0.0, 1.5) * uCoc;
    // ── right-stage gate: never under the card column ──
    float ndcX = gl_Position.x / max(1e-4, gl_Position.w);
    float gate = smoothstep(-0.10, 0.30, ndcX);

    vColor = aColor;
    vFlare = flare;
    vFade = 1.0 / (1.0 + coc * coc * 2.5);
    vB = mix(0.42, 1.0, form) * mix(1.0, 0.55, behind) * mix(1.0, 0.22, aDim) * gate;

    float sizeEnv = (0.75 + 0.6 * f + 1.4 * flare) * (1.0 + coc * 1.6) * aSizeJ;
    float persp = 24.0 / max(4.0, -mv.z);
    gl_PointSize = clamp(uSize * uPixelRatio * sizeEnv * persp * 0.14, 1.5, 64.0);
  }
`;

export const BEACON_FRAG = /* glsl */ `
  precision highp float;
  uniform vec3 uHot;
  varying vec3 vColor;
  varying float vB;
  varying float vFlare;
  varying float vFade;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float r2 = dot(q, q);
    if (r2 > 0.25) discard;
    float disc = smoothstep(0.25, 0.0, r2);
    float core = disc * disc;
    // white comes from bloom (Phase 4) via the HDR push — base stays in the ramp,
    // so the strained/bloomless tiers still look intentional, just quieter
    vec3 col = mix(vColor, uHot, clamp(vFlare * 0.85, 0.0, 1.0));
    col *= 1.0 + 2.2 * vFlare;
    float alpha = (core + 0.35 * disc) * vB * vFade * 0.8;
    gl_FragColor = vec4(col * (0.55 + 0.45 * core), alpha);
  }
`;
