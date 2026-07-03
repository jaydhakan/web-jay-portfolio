# ARGMAX Timeline — Implementation Plan & Progress Tracker

> **Direction approved:** Concept 8 — **ARGMAX (The Paths Not Taken)** from
> [TIMELINE_REDESIGN.md](./TIMELINE_REDESIGN.md) Part 4.
> **This file is the session checkpoint.** Each phase is independently shippable; the
> site builds green at every checkpoint. If a session dies, resume at the first phase
> not marked ✅ — the "Resume notes" under each phase say exactly where things stand.

---

## The one-sentence brief

The timeline is an **inference trajectory**: a slow lightning bolt, mostly vertical,
with deliberate kinks at decision points. At every milestone a fan of 2–5 ghost futures
becomes visible; arrival is the **argmax** — the collapse: one branch survives (the
channel), the rest evaporate into particle dust and leave permanent faint scars. The
channel gains caliber (width) across the story and ends in an **open delta** — the one
fork never collapsed, captioned `currently sampling`, fading toward contact. Cards are
decision records: the one branch that survived sideways.

**Acid tests (from the exploration):**
- Grayscale screenshot with all cards hidden must still narrate a life.
- Ghost fans must NEVER read as dendrites: fans only at nodes, rooted at full channel
  width, min root core width ~1.2 viewBox units, deterministic, carrying narrative state.
- Everything scrub-pure (pure function of progress; backwards scrub = scrubbing a
  recording, never stateful).
- Hard gates hold: ONE scrubbed ScrollTrigger, governed canvas, CLS=0, A11y 100,
  no backdrop-blur over WebGL, reduced-motion/mobile/no-JS get the finished poster.

---

## Architecture

### New module: `components/timeline/argmax.ts` (pure, deterministic, SSR-stable)

```ts
type Beat = {
  weight: number;        // 0..1 — kink sharpness, bloom size, fan spread, bead size
  ghosts: number;        // ghost futures fanning at this decision (0 = starburst only)
  run: number;           // relative length of the segment LEAVING this beat (1 = base)
  turn: -1 | 0 | 1;      // which side the channel kinks toward at this node
  kink: number;          // 0..1 — 0 gentle bend … 1 hairpin (corner radius lerp(5.5, 0.9))
  caliber: number;       // 0..1 — channel width AFTER this beat (steps up at collapse)
  bloom: "ignition" | "collapse" | "surge" | "starburst" | "open";
};

buildArgmax(beats): {
  line:  Centerline & { width: number[] };  // arc-length resampled, per-sample caliber
  nodes: Pt[];                              // node positions (uneven y!)
  sides: ("left"|"right")[];                // card side = opposite of node excursion
  fans:  { node: number; ghosts: { pts: Pt[]; rootW: number }[] }[];
  scars: same paths, first ~38% of each ghost;
  delta: the final open fan (longer, wider, dotted tails);
  vbh:   number;                            // PAD*2 + Σ run_i * SEG_BASE
}
ABOUT_SCORE: Beat[7]      // authored, see rhythm below
scoreForCount(n, weights?) // procedural score for /work (varied runs/turns, deterministic)
```

Geometry rules:
- Node x: walk from center; excursion amplitude `lerp(8, 30, kink)` in `turn` direction,
  clamped to [26, 74] so cards + stems always fit the lanes (LANE edges 48/52 unchanged).
- Corner rounding at nodes: cut the corner at radius `r = lerp(5.5, 0.9, kink)`, insert a
  quadratic — hairpins nearly sharp, calm bends soft.
- Segments: straight + ONE subtle deterministic bow (perp offset 1.5–3u at midpoint) —
  large-scale intent, never jitter/noise.
- Fans: centered between incoming-direction-extended and the chosen outgoing direction;
  half-spread `lerp(0.35, 1.1 rad, weight)`; ghost length `lerp(9, 20, weight)`; 2–3
  curling segments each; the REAL next segment is the surviving candidate.
- `nodeFrac` still exact arc-length fractions → card sync + the ONE clock survive as-is.

### The 7-beat ABOUT score (rhythm from the concept)

| # | Beat | ghosts | run | kink | caliber | bloom |
|---|------|-------:|----:|-----:|--------:|-------|
| 0 | 2018 first Python | 2 | 1.0 | .45 | .18 | ignition |
| 1 | B.Tech (longest calm) | 2 | 1.7 | .25 | .28 | collapse |
| 2 | BotPro 17h→80min (hairpin) | 3 | 0.85 | 1.0 | .42 | surge |
| 3 | Agents in prod (widest fan, caliber step) | 5 | 1.0 | .7 | .8 | surge |
| 4 | Award (double-hit) | 1 | 0.55 | .35 | .8 | starburst |
| 5 | VRSEN (wide sweep) | 3 | 1.2 | .5 | .9 | collapse |
| 6 | Independent (open delta) | 5 | 0.9 | .0 | 1.0 | open |

### Rendering split

- **Poster (SVG in SerpentineTimeline)** — the fully-decoded artwork: tapered channel
  polygons (aura/core/hot-center) built from centerline+normals+width in JS, all fans as
  SCARS + the live open delta, weighted node beads, stems, `currently sampling` caption.
  This IS the reduced-motion / mobile / no-JS / no-WebGL experience — finished art.
- **WebGL (`ArgmaxCanvas.tsx`, replaces LivingFiberCanvas)** — same idioms (additive,
  CL_SAMPLE DataTexture, uniform-driven vertex shaders, no post-processing):
  - `warp(p)` baked into a 1×256 DataTexture; fixed points at every nodeFrac
    (`warp(f_i)=f_i` → cards/blooms/head agree at nodes); slow leaving, accelerating
    into kinks, derivative capped 1.6×. Shaders sample `wp = warpAt(uProgress)` once.
  - Channel ribbon with per-sample caliber width; lit frontier vs wp; return-stroke
    pulse = moving gaussian packet running ~6% ahead after each node.
  - Head: bright point + tail that lags BEHIND via scroll-velocity sign (fixes tail
    inversion); temperature jitter rises approaching a node; smoothstep fade at ends
    (fixes step-pop).
  - Token ticks: quantized dots along the UNdecoded path ahead, erased as wp passes.
  - Ghost fans: tapered ribbons; envelope pure-in-wp: approach [f−.06,f] brighten+spread
    → collapse flare at f → evaporation window [f, f+.025] (600 GPU particles puff
    outward) → scars persist (opacity smoothstep after f).
  - Open delta: last fan never collapses; slow breathing; dotted tick tails.
  - Filter masking (/work): per-node mask uniform array — masked nodes dim, their live
    fans render as scars ("attention masking").
  - DELETED: the 18 random dendrites, the 5-color always-on flow loop dashes.

### Bug fixes woven in (from TIMELINE_REDESIGN.md Part 1)

1. /work filter dimming reaches WebGL (mask uniforms) — Phase 6
2. backdrop-blur over canvas removed (Geoline cards + HUD pill) — Phases 2/5
3. `expo.out` inside scrubbed timeline → `none` — Phase 2
4. comet tail ahead of head on reverse scroll → velocity-signed tail — Phase 3
5. orb step-pop at p=0.001/0.999 → smoothstep fades — Phase 3

---

## Phase tracker

| Phase | Scope | Status |
|-------|-------|--------|
| 1 | `argmax.ts` — Beat schema, bolt/fans/scars/delta geometry, scores; tsc green | ✅ |
| 2 | Poster + engine surgery: SVG bolt in SerpentineTimeline, uneven VBH, sides-from-x, HUD blur fix, ease fix, caption | ✅ |
| 3 | `ArgmaxCanvas` Act 1: channel + caliber, warp texture, head + velocity tail, token ticks, return stroke; swap into LivingFiber; no dendrites | ✅ |
| 4 | `ArgmaxCanvas` Act 2: live ghost fans, collapse choreography, evaporation particles, scars, weighted blooms, open delta | ✅ |
| 5 | /about: ABOUT_SCORE wiring, card weight hierarchy, Geoline blur fix, contact fade-out | ✅ |
| 6 | /work: procedural score, filter→mask uniforms, fans-to-scars masking, ProjectCard audit | ✅ |
| 7 | Cleanup (delete LivingFiberCanvas + dead geometry), lint+build, reduced-motion/mobile audit, grayscale acid test, docs | ✅ |

Legend: ⬜ todo · 🔶 in progress · ✅ done (build green)

### Resume notes

*(appended at each checkpoint — newest first)*

- 2026-07-04 — **Phase 7 ✅ — ALL PHASES COMPLETE.** Deleted LivingFiber.tsx +
  LivingFiberCanvas.tsx; geometry.ts stripped to shared primitives (VBW/CX/PAD/LANE/
  Pt/Centerline/hash01/buildConstellation). tsc + eslint + full build green (20 pages).
  Governance audit: ONE scrubbed ScrollTrigger (ease none) · CLS=0 deterministic
  aspect-ratio · governed canvas untouched (DPR cap, FPS guard, sticky mount,
  poster→live handoff) · no backdrop-blur over the stage (HUD + Geoline fixed;
  Header/TrainingRun are site chrome, flagged but out of scope) · reduced-motion /
  no-JS / mobile get the finished poster artwork · real <ol> intact · particles
  1200 flow + 600 evap (< old 2400 + dendrites). All 5 critique bugs fixed. /work
  screenshot: scratchpad/work-final.png. Memory updated (portfolio-design-language).
  OUTSTANDING (needs a human + real GPU): scroll-feel pass of the live canvas —
  warp intensity, collapse flash strength, fan brightness, head tail length are all
  single-constant tunables in ArgmaxCanvas.tsx shaders; and a Lighthouse run.

- 2026-07-04 — **Phases 5 + 6 ✅.** /about (Geoline): backdrop-filter removed over the
  canvas (bug 2, hard gate) → near-opaque gradient; card hierarchy from ABOUT_SCORE
  weight (padding/title/accent-bar scale w≥0.8 / ≥0.5 / rest). /work (WorkGeoline):
  featured projects → weight 0.9 beats via scoreForCount(n, weights); filter →
  ATTENTION MASKING reaches WebGL (bug 1): per-node uMask[24] on channel-spurs-bridges /
  glints / ghosts / scars / evap (lookup in vertex shaders only — ES 1.0 forbids dynamic
  uniform indexing in fragments), masked live fans read as scars, eased at 10/s in
  useFrame so filtering glides. React-compiler lint clean (mask target via useEffect,
  smoothing state in a ref, per-material Float32Array uniforms). All 8 shader programs
  re-validated ALL_OK incl. masking. Build green. NOTE: ProjectCard has no
  backdrop-filter (clean); Header/TrainingRun blurs are site chrome outside this scope.

- 2026-07-04 — **Phase 4 ✅.** Act 2 in ArgmaxCanvas: GHOST/scar shader pair (uScar flag;
  approach-brighten + 12% spread, collapse flash, evaporation with outward scale, scars
  appear post-collapse; delta ghosts aOpen=1 breathe and never collapse), 600 EVAP dust
  particles (one burst per collapse, pure in wp), delta tick points (appear ≥0.9).
  ALL 8 shader programs compile+link verified in real WebGL (scratchpad/shader-test.html
  → ALL_OK). Also fixed a REGRESSION found via full-page screenshot: constellation stars
  were still at stage edges (x=87/13) creating the old "far-flung web" — geometry.ts
  buildConstellation now clusters stars ~12u from their node and bows bridges near the
  cluster lane. Full-page /about screenshots (poster path): scratchpad/about-live2.png.
  REMAINING QA: live-canvas visuals need a real (non-headless) browser pass — headless
  validated mount + gate + shaders but not the animated frames.

- 2026-07-04 — **Phase 3 ✅.** `ArgmaxCanvas.tsx` + `ArgmaxFiber.tsx` created and swapped
  into SerpentineTimeline (old LivingFiber* files now DEAD — delete in Phase 7). Act 1
  shipped: caliber-varying channel ribbon (undecoded road at 0.13 brightness — the
  future is dark), CPU `makeWarp` clock (t^γ per segment, γ=lerp(1.2,1.6,dest weight),
  fixed points at nodes), head with velocity-signed comet tail (bug 4 fixed) + arrival
  temperature jitter, 110 token ticks on the undecoded road (erased as the head passes),
  per-node return-stroke packets (+6% after arrival), asymmetric one-time node blooms
  (sharp attack 0.005 / slow release 0.03 — no more symmetric pre-fire), flow particles
  gated to the decoded channel, weight-sized blooms. No dendrites. No step-pop (bug 5
  fixed). Build green. Next: Phase 4 — ghost fans / evaporation / scars / open delta in
  the same file (plan: single GHOST shader pair with uScar flag; EVAP burst particles
  pure in wp; delta ghosts flagged aOpen=1 breathe with time).

- 2026-07-04 — **Phase 2 ✅.** SerpentineTimeline.tsx rewritten around `buildArgmax`:
  tapered channel polygons (aura/mid/core + hot centerline), scars, open delta + ticks,
  weight-sized beads/blooms, uneven VBH, sides-from-node-x, DOM caption "currently
  sampling", HUD backdrop-blur removed (bug 2), card ease "none" (bug 3). Geoline passes
  ABOUT_SCORE. Grayscale acid test PASSED after one tuning round (excursions
  lerp(12,38,kink), bows capped 1.3u, stepped-leader micro-kink on runs ≥1.35, corner cut
  lerp(4.5,0.7,kink), scars 0.8×root @ 0.3 opacity) — renders at
  scratchpad/poster-about-{gray,color}.png + poster-work-gray.png (headless Chrome).
  Full `npm run build` green (all 20 pages). KNOWN INTERIM STATE: old LivingFiberCanvas
  renders on the new centerline (works, but shows obsolete dendrites) until Phase 3.

- 2026-07-04 — **Phase 1 ✅.** `components/timeline/argmax.ts` created; tsc green.
  Numerically verified (scratchpad/check-argmax.mjs): nodeFrac strictly monotonic with
  real rhythm (ABOUT gaps: .152/.261/.155/.154/.109/.169 — the long B.Tech calm and the
  award quick-hit are visible in the numbers), y monotonic, x∈[26,74], fans 2,2,3,5,1,3
  + delta 5, fan roots ≥0.6u. Next: Phase 2 (poster + engine surgery in
  SerpentineTimeline.tsx). NOTE for resume: after Phase 2, the OLD LivingFiberCanvas
  still renders on the NEW centerline (generic Centerline consumer) — works but shows
  obsolete dendrites until Phase 3 swaps in ArgmaxCanvas.
- 2026-07-04 — Plan file created. Nothing implemented yet. Start at Phase 1.

---

## Verification per checkpoint

- `npx tsc --noEmit` after every phase; `npm run build` after phases 2, 4, 6, 7.
- Poster kill-switch (end of Phase 2): screenshot the poster grayscale, cards hidden —
  if the fans read as fuzz, stop and re-tune geometry before ANY WebGL work.
- The ONE ScrollTrigger, CLS=0 aspect-ratio box, governed-canvas gate, sticky-mount and
  poster→live handoff are NOT touched by the redesign — do not regress them.
