# timelineplan.md — THE FLIGHT (wow-factor timeline, v2 implementation spec)

> Status: **specified, not started.** v1 (research + 3 directions) was expanded on
> 2026-07-06 into this implementation-grade spec via a 4-subsystem parallel design pass
> (workflow `wf_5c2b8f8c-526`; full raw specs in its journal) plus an adversarial
> reconciliation (§8). Direction locked (owner default, overridable): **C+B hybrid —
> "The Flight" — as progressive enhancement** over the shipped Constellation Spine.
> Nothing here is built; Phase 1 starts only after the §16 asks are answered.

---

## Part I — Context, research, decision (from v1, updated)

## 0. The tension — read this first

This plan knowingly deviates from the repo's own rules, as an explicit owner decision:

- **`PRODUCT.md` → Anti-references:** *"Heavy 3D spectacle (Bruno Simon-style worlds):
  the only 3D allowed is one lightweight hero shader that never competes with text or
  Lighthouse."*
- **`README.md`:** *"Accessibility = 100 and CLS = 0 are hard gates."* Lighthouse 95+
  named as a hard gate in `PRODUCT.md`.

The resolution (owner accepted the recommendation by proceeding): **progressive
enhancement, not replacement.** The shipped DOM Constellation Spine stays the
authoritative, complete experience — A11y 100 / CLS 0 stay provable because the canvas
is `aria-hidden`, `pointer-events-none`, `position:fixed` behind the page, mounts only
on desktop-motion + WebGL, and vanishes cleanly (poster restored) on context loss.
The knowing cost: **desktop Lighthouse perf on /about + /work relaxes from ≥95 to ≥85**
— documented in `PRODUCT.md` via the §12.6 amendment, so the docs never lie.

Research receipts (v1, verified via live fetches — Awwwards scorecards, Codrops
write-ups): every reference-class site (Monolith, Zajno 7-Years, Midwam, BlueYard)
scores its *lowest* category on Accessibility (6.0–6.8/10). The pattern is real; the
architecture above is how we don't join it.

## 1. What already exists to build on

| Piece | File | Liftable |
|---|---|---|
| Home hero arena | `components/hero/DescentArenaCanvas.tsx` | camera-rig-from-scroll, Bloom/Vignette config, tier split, fps-guard wiring, ref-laundering patterns, ADDITIVE preset, mulberry32 |
| (retired from these routes) | `components/three/LatentFieldCanvas.tsx` | the flow↔target particle **morph shader** (curl noise, aHome/aTarget/smoothstep mix, rampColor, discard-disc fragment) — ~70% of the beacon material |
| Contact finale | `components/contact/ParticleFinaleCanvas.tsx` | `sampleText()` — rasterize→scan→points (the /work numeral glyphs use this near-verbatim) |
| Governance | `lib/webgl-governance.ts` | `useGovernedCanvas` (desktop-motion profile, external ref, arm), spike-clamped `createFpsGuard` (commit e2f001f fix — never copy pre-fix versions from git history) |
| The Spine | `components/timeline/SerpentineTimeline.tsx` | THE one scrubbed ScrollTrigger (`scrub: 0.4`, start/end at the 62% line), measured `offsets[]` (refresh-safe), marker ignition epsilon `0.001`, `MARKER_TOP` |

## 2. Research summary (verified, v1)

Full table in git history (v1 of this file). Load-bearing findings: (a) award-tier
"journey" spectacle is real but concentrated where the piece IS the product; (b) the
consistent craft differentiators are **purpose-built scene transitions** (Monolith's mix
materials), **scroll-scrubbed — never autoplayed — choreography** (Zajno), and obsessive
micro-detail (Bruno Simon); (c) the #1 engineering trap is **scroll/rAF desync** (Lusion
documented + open-sourced the fix; this codebase's equivalent rule: ONE smoothing stage,
the trigger's scrub — a lesson already paid for once by the ARGMAX lag postmortem).

## 3–7. Directions, recommendation, v1 phases, open decisions — resolved

- **Direction:** C+B hybrid ("The Flight": spline flythrough + particle-glyph beacons).
- **Progressive enhancement:** yes (§0).
- **Perf floor:** no visible stutter on a mid-range 60Hz laptop; guard budget 20ms;
  desktop LH ≥85 on these two routes; **mobile scores byte-identical** (canvas can never
  mount <768px).
- **`PRODUCT.md`:** gets the licensed-exception paragraph (§12.6) in the same PR as the
  first canvas landing.
- **/work scope (CHANGED from v1's suggestion):** ALL 9 systems get stations + beacons.
  The warp's fixed-point guarantee (§10.2) needs a station per card, and `weight`
  already modulates drama — featured systems (3) flare loud, the rest resolve and settle
  quietly. "Featured-only waypoints" would desync card ignition from camera dwell.

---

## Part II — Implementation spec (reconciled)

## 8. Adversarial reconciliation (what the four parallel specs disagreed on, and the calls)

The 4 subsystem specs were designed in parallel and conflicted. Canonical resolutions —
these override anything contrary in the raw specs:

| # | Conflict | Call | Why |
|---|---|---|---|
| 1 | Bus type/name/location (`FlightBus` in flight-path vs `SpineProgress` in a types module vs two loose refs) | **`SpineProgress { p, offsets, litCount, dimmed? }` in `components/timeline/flight-progress.ts` (types-only)** | canvas chunk must never import the engine; one superset type; adapters own the ref |
| 2 | Flare one-shot: CPU `uFlare[i] *= exp(-2.6*dt)` vs pure-in-arc shader envelope | **Pure-in-arc** (`d = uArc − u_i` attack/decay in the vertex shader) | time-based one-shots break on backward scrub — the exact ARGMAX reversibility lesson; also deletes per-beacon CPU state |
| 3 | Per-beacon `uniform float[10]` arrays vs per-particle `aMeta` attributes | **Attributes** (`aMeta = vec4(u_i, weight, seed, puff)`) | kills the GLSL300/ANGLE uniform-array risk, zero per-frame array writes, one code path for 7 or 9 beacons |
| 4 | Context loss: `preventDefault()` + once vs no-preventDefault + once | **No `preventDefault()`**, `{ once: true }`, one-way `dead` latch | preventDefault *enables* restoration; policy is die-forever + poster restore, so don't invite a restore event |
| 5 | Off-view: unmount on section exit vs sticky mount + frameloop pause | **Sticky mount, `running={inView}` → `frameloop: never` off-view** | remount churn is this repo's documented Context-Lost cause (ParticleFinale/Serpentine comments); paused frameloop costs zero GPU |
| 6 | Tendrils: separate `LineSegments` vs rows in the merged sprite buffer | **Merged rows** (`aHome==aTarget`, `aMeta.w=0`) | zero extra draw calls/programs; inherits shed + palette rules for free |
| 7 | Camera sampling: `curve.getPointAt` per frame vs precomputed LUT | **512-entry position+tangent LUTs, lerped** | deterministic, cheaper, one build site (rebuilt with `measure()` so DOM offsets and dwell can never drift) |
| 8 | Files: `components/timeline/Flight*` vs `components/flight/*`; shell name | **`components/flight/` directory; shell = `FlightBackdrop.tsx`** | new subsystem owns a directory; "backdrop" states the architecture |
| 9 | Extra `FlightSection.tsx` wrapper vs adapters owning the bus | **Adapters own it** (Geoline / WorkGeoline render `FlightBackdrop` inside their existing root) | RSC pages untouched; one less layer; adapters already own route-specific data |
| 10 | Test runner: Playwright vs existing tooling | **puppeteer-core scripts + Lighthouse CLI** (no new deps) | repo already proved this harness this week; dependency budget stays frozen |
| 11 | Base `uSize` 30 vs 34 | **30**, shed to 22 | flight sprites are perspective-attenuated along a deep path; 34 was LatentField's flat-field value |

## 9. Canonical architecture

```
components/flight/
  FlightBackdrop.tsx    governed mount shell: fixed -z-10 wrapper, poster/scrim/left-guard/
                        vignette, sticky-mount + dead latches, contextlost kill, live latch
  FlightCanvas.tsx      R3F scene (dynamic ssr:false): camera LUT rig, merged beacon cloud,
                        dust field, spline ribbon, sprite-CoC, tier-gated composer, ladder
  flight-path.ts        PURE math: buildFlightPath, station solve, monotone warp,
                        camera rig eval, beacon NDC anchor solver, LUTs, constants table,
                        FLIGHT_START_POS (single source for <Canvas camera> AND the rig)
  glyph-data.ts         hardcoded lucide iconNode geometry (7 KIND icons, ISC, index-locked
                        to data/content.ts timeline[]) + /work numeral config
  sample-points.ts      sampleGlyph (stroke-rasterize → alpha-scan → seeded fixed-N
                        resample) + sampleNumeral (ParticleFinale sampleText variant,
                        awaits document.fonts.ready, 1500ms timeout)
  beacon-field.ts       buildBeaconField(specs, tier): merged BufferGeometry +
                        ShaderMaterial factory (incl. tendril rows, world-baked targets,
                        dispose())
  beacon-shaders.ts     GLSL (LatentField-derived; adds aMeta/aAnchor/aCull/uArc/uGap/
                        uKeep/uFocus/uFocusRange/uCocStrength)

components/timeline/
  flight-progress.ts    types only: SpineProgress { p, offsets, litCount, dimmed? }
  SerpentineTimeline.tsx  +optional flightRef prop — 3 write lines total:
                          offsets in measure(), p at top of onUpdate, litCount on change
                          (+ className "spine-head" on the head-dot span)

components/about/Geoline.tsx    owns the SpineProgress ref + flightLive state; renders
                                FlightBackdrop; sets data-flight-live on its root
components/work/WorkGeoline.tsx same + writes spine.current.dimmed on filter change
lib/webgl-governance.ts         +createTierLadder (additive) + useArmedAfterIdle (additive)
app/globals.css                 .flight-fallback poster; .spine-head glow handoff
PRODUCT.md / DESIGN.md          licensed-exception paragraph + gate pointer
```

**Data flow (the whole thing):**

```
ScrollTrigger (THE one, scrub:0.4)          [SerpentineTimeline — unchanged trigger]
  └─ onUpdate: p ──────────────► spine.current.p          (write, 1 line)
  └─ measure(): offsets ───────► spine.current.offsets    (refresh-safe, 1 line)
                                      │
FlightCanvas useFrame (per frame, read-only):
  guard(delta)                        │  fps ladder first line
  p = spine.current.p                 │  raw — NO lerp, NO ease, NO warp clock
  s = warp(p)                         │  static monotone bijection (§10.2)
  cameraPose = LUT(s)                 │  precomputed position/tangent tables
  uArc = s; uTime; uSize; uMouse; uFocus/uFocusRange   ← the only uniform writes
```

The camera, every beacon state, the rail, the markers, the HUD and the card `active`
state are all derivations of the **same** `self.progress` sample. Desync is structurally
impossible for values; the only residual is ≤1 rAF frame-order lag (GSAP ticker vs R3F
loop), measured by a dev probe, never "fixed" with smoothing.

## 10. Engine spec — spline, warp, camera

### 10.1 Path from beats[] (no new data shape)

World frame: fly toward −Z, descend in Y (loss-going-down), serpentine in X. Knots from
the SAME `Beat[]` the Spine consumes (`ABOUT_SCORE` / `scoreForCount`), deterministic via
`hash01`:

```
x = ±(LANE_BASE 2.2 + LANE_PER_WEIGHT 3.4 · w + hash jitter ≤1.2)   (alternating sign)
y = −k · DROP_Y 3.2 (± hash ≤0.8)
z advance per beat = BASE_RUN 18 + RUN_PER_WEIGHT 10 · w             (weight ⇒ longer approach)
+ 2 finale tail knots: rise +9 / recentre, then high pull-back over the path centroid
  (tail deliberately holds the last ~12–20% of arc for the finale)
curve = CatmullRomCurve3(knots, false, "centripetal", 0.5)           (centripetal = cusp-free
  on uneven spacing — mandatory), arcLengthDivisions 512
```

Stations: the curve passes exactly through knot k at t = k/(knots−1); convert via the
cumulative-lengths table to arc fractions `stationS[k]` (strictly increasing; last
station ≈0.8–0.88).

### 10.2 The warp p→s — monotone Hermite with dwell (the ARGMAX-lag antidote)

Requirements: pure, stateless, monotone, bijective, `warp(0)=0`, `warp(1)=1`, and the
sync-critical fixed points **`warp(offsets[k]) = stationS[k]`** — the camera stands at
station k at the exact scroll progress where card k's marker ignites (the 62% line).
Implementation: per-segment monotone cubic Hermite between the fixed points with
prescribed global slopes; station slope `0.45 → 0.22` scaled by weight (heavier ⇒ longer
dwell); slopes clamped into the Fritsch–Carlson monotone box. Zero time, zero state —
`scrub: 0.4` stays the ONLY smoothing stage. Guards: clamp offsets into [0.02, 0.94],
min gap 0.02, uniform fallback `(k+0.5)/n` until the first `measure()` lands.

### 10.3 Camera rig (pure functions of p; constants = the tuning table)

```
TRAIL_DIST 3.0 / TRAIL_LIFT 1.1     camera behind/above the curve head
LOOK_AHEAD 0.035 arc                 lookAt anticipation
banking: signed horizontal turn rate from tangent delta × ROLL_GAIN 55, clamp ±8°,
         × (1 − finaleFactor)
FOV: BASE 50 − PUNCH 4·proximity(nearest station, σ 0.018)·(0.6+0.4w) + FINALE_OPEN 8
finaleFactor f = smoothstep(stationS[last], 1, s): lookAt lerps to path centroid,
  roll → 0, FOV opens — the pull-back reveals all beacons as a constellation.
Build-time dev assert: at f=1 all beacons project inside NDC ±0.9; if not, push the
  tail knot back iteratively (≤3 × +10%).
```

Per frame: `guard(delta)` → read `p` → `s = warp(p)` → position/tangent from the LUTs →
lookAt/bank/FOV. **Banned by grep gate:** any `exp(−`/lerp touching `p` in
`components/flight/` (§14 battery #3).

### 10.4 Right-45% guarantee (exact, not vibes)

Beacons are not hand-placed. At build time, per station k: evaluate the FULL rig (trail,
roll, dwelled FOV) at `p = offsets[k]` on a scratch camera with the live aspect, then
place the beacon at fixed NDC **(x 0.50, y 0.05)** at depth 13 in that camera's frame.
By construction the beacon sits dead-centre of the empty right half at the moment its
card ignites; dwell slopes bound drift, and the acceptance test asserts NDC stays inside
x∈[0.15, 0.92], y∈[−0.45, 0.55] across the dwell window. Anchors (and the world-baked
glyph targets that hang off them) rebuild whenever `offsets` identity or canvas aspect
changes — same code path as `measure()`, so they cannot drift from the DOM.

## 11. Beacon spec — particle glyphs

### 11.1 Glyphs

- **/about:** the 7 lucide icons the cards already use (KIND map): Terminal,
  GraduationCap, Building2, BrainCircuit, Award, Sparkles, Compass. Path data hardcoded
  in `glyph-data.ts` (ISC; freezes shapes against lucide upgrades; index-locked to
  `timeline[]` — add the dev-only length/lockstep assertion, this is now a FOURTH
  parallel array).
- **/work:** JetBrains Mono numerals `01`–`09` via the ParticleFinale `sampleText`
  technique (await `document.fonts.ready`, 1500ms fallback).
- Sampling: offscreen 192px canvas, stroke the `Path2D`s (lucide is stroke-art; fill
  only the sub-1px circles), scan the **alpha** channel at stride 2, Fisher–Yates with
  seeded mulberry32, resample to **fixed N** (wrap+jitter when sparse — Terminal's ~2
  strokes thicken pleasingly). Local plane coords, thin z slab, world-baked against the
  §10.4 anchor basis at build time. Glyph size `2.6 + 1.0·weight` world units (invariant:
  ≈22–30% of viewport height at arrival).

### 11.2 State machine — in-shader, pure in arc distance

`d = uArc − aMeta.x` (signed), `uGap = 1/count`:

| State | Window | Read |
|---|---|---|
| DISTANT | d < −0.70G | dim curl-drift cluster around anchor (alpha floor 0.30) |
| APPROACH | −0.70G → −0.10G | seed-staggered lock-in: noise collapses onto the glyph (`form` smoothstep − seed·0.3 stagger = "resolving from noise", fully resolved BEFORE arrival) |
| ARRIVAL | −0.10G → ~+0.28G | asymmetric flare: smoothstep attack over 0.10G, `exp(−d/0.28G)` decay, amplitude `0.6+0.9·weight`; radial puff along `aTarget−aAnchor`; HDR push `×(1+2.2·flare)` — **the flare IS the bloom** (crosses Bloom's 0.2 threshold) and still reads bloomless via size-pop + hot tint |
| SETTLED | d > ~0.35G | glyph holds, breathing; beyond 2G eases to 0.55 brightness — never to 0, so the finale reads as a constellation |

Gap-relative windows mean one shader serves 7 and 9 beacons. Scrub back = exact replay
in reverse, by construction.

### 11.3 Buffers & material

**One merged `THREE.Points` + one ShaderMaterial for beacons AND tendrils** (tendrils =
rows with `aHome==aTarget`, `aMeta.w=0`, brightness ≤9% pure-indigo, +20% during their
parent's approach — "the road not taken glows as you choose"). Second small Points for
dust/starfield (shares program family). Spline ribbon as one faint `Line` along the LUT.
**Hard caps: ≤4 scene draw calls, ≤3 programs, 0 scene textures**; assert via
`gl.info.render.calls` behind `?flightdebug`.

Attribute diff vs LatentField: keep `aHome/aTarget/aColor` (+HSL-lightness-only jitter),
fold seed into `aMeta.z`, add `aMeta`, `aAnchor`, `aCull` (shed), replace `uProgress`
with **`uArc` (raw warped progress — no easing)**, drop `uVelocity` (fights the scrub),
keep `uMouse/uHot` cursor repulsion (settled glyphs shy from the cursor; window-level
pointermove since the canvas is pointer-events-none), keep `mod(uTime, 120.0)` guard.
`position` attr = copy of aHome; `frustumCulled = false`; ADDITIVE preset spread.

### 11.4 Palette discipline (the taste contract, on #0b0b11)

1. **Chronology = hue**: `rampT = i/(n−1)` — the journey literally travels
   indigo → violet → cyan; the finale lays the full ramp across space.
2. **Cyan is earned**: full `#67e8f9` only as uHot (cursor+flare) and the last
   milestone.
3. **Indigo owns the dark**: tendrils locked ≤ rampT 0.15 at ≤9% brightness.
4. Jitter is lightness-only ±0.06 — hue jitter reads as chromatic noise on near-black.
5. **White comes from bloom, not the palette.**
6. Global ×0.8 calm multiplier; the DOM cards always win contrast (scrims §12.1).

### 11.5 Per-milestone art table (/about, index-locked)

| i | rampT | Milestone | Glyph | w | flare | size | Notes |
|---|---|---|---|---|---|---|---|
| 0 | 0.000 | 2018 — First lines of Python | Terminal | 0.55 | 1.10 | 3.15 | sparsest icon → wrap-jitter thickens the chevron; rough "high-loss start" texture is on-brand; 1 tendril |
| 1 | 0.167 | 2019–23 — B.Tech in AI, Marwadi | GraduationCap | 0.35 | 0.92 | 2.95 | quietest beacon; longest shimmer |
| 2 | 0.333 | 2021–24 — Python Dev, BotPro | Building2 | 0.80 | 1.32 | 3.40 | dense rectilinear grid; 2 tendrils |
| 3 | 0.500 | 2023 — First AI agents in production | BrainCircuit | 1.00 | 1.50 | 3.60 | densest icon (fill its dot-circles!); the pivot milestone at the pivot hue; loudest act-one flare |
| 4 | 0.667 | 2024 — Mr Perfectionist Award | Award | 0.50 | 1.05 | 3.10 | the only circular glyph until Compass — shape carries it |
| 5 | 0.833 | 2024–25 — Python & AI/ML, VRSEN | Sparkles | 0.70 | 1.23 | 3.30 | first clearly-cyan beacon; telegraphs the destination |
| 6 | 1.000 | 2025–Now — Independent | Compass | 1.00 | 1.50 | 3.60 | full cyan, max flare; rotate needle ≈−20° to point along the spline's exit — the finale shows the compass pointing onward |

(/work: numerals 01–09, `rampT = i/8`, weights from `scoreForCount` with featured→0.9;
featured flare loud, rest settle quietly; `dimmed` mask dims beacons in place, never
removes — the CLS doctrine, mirrored.)

## 12. Composition, a11y, governance

### 12.1 Layer stack (DescentArena contract, adapted)

```
fixed inset-0 -z-10 pointer-events-none aria-hidden, hidden md:block
  L0 poster        .flight-fallback CSS radials ≤8% alpha — ALWAYS painted on md+
  {(everShown||show) && !dead &&
    L1 canvas      rise-in 1.2s (opacity only), FlightCanvas (dynamic ssr:false)
    L2 scrim       bg-base/25 flat (over LIVE canvas only)
    L3 left-guard  90° gradient: base/0.40 → base/0.28 @50% → transparent @72%
                   (extra darkening under the card column — cards live LEFT, unlike home)
  }
  L4 vignette      always painted (poster AND live) — DescentArena formula verbatim
```

Plus the **shader-side gate**: beacon/dust brightness × `smoothstep(0.02, 0.34, ndcX)` —
spectacle physically cannot wander under the card column (the arena's leftGuard,
mirrored; the numbers are per-composition, re-tuned at Phase 3, never copied).
z: `-z-10` sits below the whole closed z-scale; no text container may take a negative z
(grep-audited). **New documented invariant:** no ancestor of the adapters may ever gain
`transform`/`filter`/`will-change` (it would re-parent the fixed layer) — concretely:
never wrap `<Geoline/>`/`<WorkGeoline/>` in FadeUp/ClipReveal.

### 12.2 Mount + lifecycle

`useGovernedCanvas({ ref: sectionRef, profile: "desktop-motion", rootMargin: "600px 0px",
arm: true })` — the IO watches the **timeline section**, not the fixed wrapper (a fixed
inset-0 wrapper always intersects). Sticky mount (`everShown` latch), `running={inView}`
→ `frameloop: "never"` off-view. `/work` additionally gates mount on
`useArmedAfterIdle` (new additive hook: `requestIdleCallback` timeout 4000ms OR first
scroll/wheel/touch) because its timeline sits near the fold — /about's sits ~3 viewports
down and structurally never loads during a no-scroll Lighthouse pass.

**Context loss = one-way death.** `webglcontextlost` (`{once:true}`, **no
preventDefault**) → `dead=true` → canvas/scrim/guard unmount, poster + vignette + full
Spine remain, **and the live-latch resets** (`data-flight-live` removed → head-dot glow
returns). No restore path. GL config: `{ antialias:false, alpha:false,
powerPreference: tier-dependent }` + opaque `#0b0b11` background.

### 12.3 The one DOM delta

When (and only when) the canvas proves live (first useFrame tick with particles — the
ParticleFinale latch), the adapter sets `data-flight-live`; CSS halves the Spine
head-dot's outer bloom (dot stays — DOM keeps the *instrument*, canvas takes the
*spectacle*; two glowing cyan travellers would read as a bug and bust the ≤5% iridescent
budget). Rail, markers, cards: zero change. Reversible on death (§12.2).

### 12.4 Sync

Beacon i's arrival threshold ≡ marker ignition: `p >= offsets[i] − 0.001`, same epsilon,
same source. WorkGeoline writes `spine.current.dimmed` on filter clicks. The engine
keeps sole ownership of React state; the canvas never sets state per-frame.

### 12.5 Invariants × tests (the "provably additive" table)

| Invariant | Test |
|---|---|
| Canvas never mounts: <768px, RM, no-WebGL, SSR/no-JS | puppeteer: emulate each → `querySelector('canvas') === null` on both routes; curl HTML → no three.js chunk |
| Spine DOM byte-identical, flight on vs off (pre-live) | serialize the `<ol>` subtree both ways → equal; axe tree equal |
| CLS = 0 | Lighthouse CI: `cumulative-layout-shift === 0` both routes |
| Canvas can't intercept input / reach AT | click-through a card link at coords inside the canvas half; axe zero violations |
| Context loss → poster + full Spine, latch reset | dev hook `window.__flightLoseContext()` mid-scroll → canvas gone, `[data-flight-live]` absent, head-dot shipped styles |
| Exactly ONE scrubbed trigger | `grep -rn "scrub:" components/ | wc -l` == 1; dev assert `ScrollTrigger.getAll().filter(t=>t.vars.scrub).length` unchanged after mount |
| No-JS = finished timeline | existing check re-run (rail drawn, nodes lit, cards visible) |
| Resize <768px mid-session | wrapper `hidden md:block` → nothing painted; no zombie |

### 12.6 PRODUCT.md amendment (verbatim, ships with the first canvas PR)

> **Licensed exception — "The Flight" (/about, /work):** the one-hero-shader rule gains
> exactly two more surfaces: a single governed, scroll-driven WebGL flythrough per
> timeline route, staged in the empty right half of the viewport behind the DOM
> timeline. It is progressive enhancement in the strict sense: the DOM Constellation
> Spine remains the authoritative, complete experience — the canvas is `aria-hidden`,
> `pointer-events-none`, position-fixed behind the page, mounts only on desktop-motion
> devices with WebGL, and vanishes (poster restored, DOM untouched) on reduced motion,
> mobile, no-JS, or GPU context loss. Hard gates for these two routes only:
> Accessibility stays 100, CLS stays 0, mobile scores stay untouched, and desktop
> Lighthouse Performance may relax from ≥95 to **≥85** — the cost of the one deliberate
> set-piece, paid nowhere else on the site. Everything else in this document (real
> numbers, no effect-stacking, motion as proof) still applies to it.

## 13. Performance — tiers, fake DoF, the ladder

### 13.1 Tiers (initial pick once at mount; ladder only moves DOWN)

| Tier | Beacon+tendril pts | Dust | Post | CoC | DPR | uSize |
|---|---|---|---|---|---|---|
| T0 HIGH (fine pointer + ≥1280w) | ~6.6k (/about) – 8.4k (/work) | 2,000 | Bloom+Vignette | 1.0 | [1,2] | 30 |
| T1 MID | ×0.6 via `uKeep` | 1,200 | Bloom+Vignette | 0.5 | ≤1.5 | 30 |
| T2 LOW/strain | ×0.4, tendrils dropped at build | 800 | none (composer unmounted) | 0 | 1.25 | 22 |
| T3 DEAD | canvas unmounted; poster + Spine | — | — | — | — | — |

Shedding is flicker-free: per-particle `aCull` random; vertex shader discards
`aCull > uKeep` (fill cost drops proportionally; every glyph thins evenly, none go bald).
Frame budget at T0: useFrame JS ≤1.5ms (LUT lookup + ~10 scalar uniforms), scene ≤6ms,
composer ≤3ms (`multisampling:0`, `mipmapBlur` — arena values), ≥6ms headroom.

### 13.2 DoF: FAKE it — sprite-CoC, never a DepthOfField pass

Real DoF (depth prepass + CoC + multi-tap blur) is the single most expensive thing we
could add, and composer churn on toggle lands exactly at the calmest camera moments.
This scene is additive sprites — defocus is just "bigger, dimmer, softer", computable
per-vertex: `coc = clamp((|viewZ − uFocus| − uFocusRange)/(2·uFocusRange), 0, 1.5) ·
uCocStrength`; size ×(1+1.6·coc), alpha ×1/(1+2.5·coc²) (energy-conserving, so bloom
doesn't pump). CPU per frame: two floats — `uFocus` = nearest beacon's view depth,
`uFocusRange` narrows 28→6 inside dwell windows. "DoF at waypoint holds" costs nothing
to fade. Tendrils are permanently out-of-focus by art direction (pre-dimmed constants).

### 13.3 `createTierLadder` (additive to webgl-governance; `createFpsGuard` untouched)

Multi-rung guard inheriting the spike clamp (`ms > 100 → return` — the e2f001f fix):
soft shed first (uSize 30→22, reversible on relief), then one rung per 3s of sustained
strain: T1 (uKeep 0.6, CoC 0.5, DPR 1.5 — imperative `setDpr` via laundered ref, no
re-render) → T2 (composer unmounted, uKeep 0.4, DPR 1.25) → T3 (`kill()`). **Tiers are
one-way ratchets** (re-promote = composer rebuild = strain spike = oscillation); only
uSize relieves. Ladder tick is the first line of useFrame; callbacks `useCallback`-wrapped
(the arena's un-memoized onStrain is a documented gotcha); `?flighttier=T1|T2` dev
override; 3s cooldown means a single GC storm cannot cascade to T3 (~9s+ of genuine
slowness required).

## 14. Build phases (each independently shippable; nothing user-visible until Phase 5)

**Shared verification battery (every phase):**
1. `npx tsc --noEmit` + `npm run lint` + `npm run build` clean.
2. Shader-compile harness (scratchpad `gen-shader-test.mjs` pattern — transpile like
   three's GLSL300; raw ESSL1 lacks `fwidth`) → ALL_OK for any new/changed GLSL.
3. **Grep gates:** `grep -rn "scrub:" components/ | wc -l` == 1; zero `lerp`/`exp(-`
   touching the progress value inside `components/flight/`.
4. puppeteer-core screenshots of the **production** build (kill stray servers first —
   the stale-:3000 lesson): poster / mid-flight / finale / reduced-motion (Spine 07/07).
5. Lighthouse 12: A11y **100**, CLS **0**, desktop ≥**85**, mobile byte-identical.
6. plan.md Resume-notes checkpoint.

| Phase | Scope | Size | DoD |
|---|---|---|---|
| **1 — Skeleton + shell** | `flight-progress.ts` + 3-line Spine diff + `.spine-head`; `FlightBackdrop` with full governance (tier init, dead latch, poster/scrim/vignette, `__flightLoseContext` hook); `flight-path.ts` pure math + LUTs; placeholder emissive spheres at stations lighting on `p ≥ offsets[i]` | M (2 sessions) | scroll up/down/flick feels 1:1 with the rail head-dot at 1280/1536/1920; resize re-measures without desync; 10× HMR no context leak; invisible to ineligible users |
| **2 — Beacons (no post)** | glyph-data + sample-points + beacon-field + shaders; merged cloud + tendrils + dust; state machine against uArc | L (3) | every glyph readable when resolved; fixed N per beacon; deterministic across reloads; ≤4 draw calls; ≥55fps sustained post-OFF on the reference laptop; grayscale screenshot still reads as a timeline |
| **3 — Choreography** ⚠ | dwell warp tuning, banking, sprite-CoC, ghost tendril glow, finale pull-back + frustum fit | L (3, **hard timebox**) | a skeptical viewer calls it cinematic and nobody calls it laggy; holds centred on card ignition at 3 breakpoints; grep gate re-run |
| **4 — Bloom + ladder** | composer block (arena values as start), `createTierLadder` + wiring, `?flighttier` | M (1–2) | forced-tier screenshots; synthetic-load run walks shed→T1→T2→T3 with ≥3s dwell, relief restores only uSize; tab-hide/return does not poison the average |
| **5 — Ship + audit** | mount in Geoline (7 waypoints) + WorkGeoline (9, featured loud, `dimmed` mirror); PRODUCT/DESIGN amendments; full battery + context-loss sim + route-flip memory check (`gl.info.memory` flat over /about↔/work ×3) | M (1–2) | both routes live; audit numbers in plan.md; mobile unchanged; A11y 100; CLS 0 |

## 15. Estimates + the schedule-killer

**Total: ~10–13 focused sessions.** The single most likely blow-up is **Phase 3's
"does it feel cinematic" loop** — the only phase graded by eye, and the historical
failure mode on this exact site (the stacked-smoothing lag) was born from feel-chasing.
Structural mitigations: camera-as-pure-function-of-progress makes the worst fix class
(adding smoothing) impossible without failing the grep gate; dwell math is a pure
unit-testable builder; hard 3-session timebox (ship the best LUT and move on — Phases
4–5 don't depend on taste). Runner-up risks: /work desktop LH under 85 despite
idle-arming (documented fallback: `rootMargin: "200px 0px"` on /work only — decided by
measurement); first ~1–2s on a weak GPU runs T0 before the average can demote (if it
reads badly: 500ms warmup at T1); content edits during the build desyncing the FOUR
index-locked arrays (freeze `timeline[]` content with Jay before Phase 2 — several
entries are still `TODO(JAY)` placeholders).

## 16. Remaining asks (small now — everything else is decided)

1. **Green-light Phase 1?** (Everything through Phase 4 is invisible to visitors; the
   real go/no-go is Phase 5.)
2. **Confirm the /work call in §3–7:** all 9 systems get beacons (numerals), featured
   flare loud — replaces v1's "featured-only waypoints" idea, for sync-integrity reasons.
3. **Content freeze:** the 7 `timeline[]` entries include `TODO(JAY)` placeholders
   (2018 origin, BotPro dates, 2023 agents milestone, Independent status). Glyph art is
   stable against wording, but the ORDER must freeze before Phase 2.
4. **Reference laptop:** name the actual mid-range 60Hz machine the "no visible stutter"
   floor is graded on (otherwise it defaults to whatever Jay tests on, undocumented).
