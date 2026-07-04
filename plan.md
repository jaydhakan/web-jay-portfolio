# plan.md — THE DESCENT ARENA (Home Hero Replacement)

> Doc hygiene (2026-07-04): the shipped history docs — the V3 "Latent Space" plan, the
> PORTFOLIO_UPGRADE_PLAN, and the ARGMAX exploration/checkpoint pair
> (TIMELINE_REDESIGN.md / TIMELINE_IMPLEMENTATION.md) — were removed from the working
> tree and live in **git history** (`git log --diff-filter=D --name-only`).
> **This file is the live plan + session checkpoint.** Each phase is independently
> shippable; if a session dies, resume at the first phase not ✅.

---

## Part 1 — Site animation audit (what exists, honestly)

| Piece | Where | Verdict |
|---|---|---|
| **LatentField** (page-wide curl-noise → cluster particles) | home, about, work, services | The #1 AI-portfolio cliché: ambient floating particles. Its flow→cluster morph is real engineering but **illegible** — no visitor perceives it. Zero interaction. On home it is the DE FACTO HERO (see next row), which is exactly the "content on a star background" failure the timeline critique named. |
| **Home hero** | / | The signature loss-landscape shader was **retired** (Hero.tsx comment); what remains is copy + a static "live system" console mock + LatentField showing through. The single highest-leverage fold on the site currently has **no set-piece at all**. The console is decorative filler pretending to be proof — a *mock* of a system on a site whose thesis is "a live system you can touch." |
| **HeroShader / HeroBackground** | nowhere (retired) | Dead code, 400+ lines incl. a bloom pipeline. But the terrain shader inside (simplex fbm + basin + iso-contours, art-directed to the site palette) is **excellent raw material**. |
| **WorkReel** | home (via FeaturedWork) | Horizontal pinned reel — live, functional. Keep. *(Correction: first audit pass misread it as unmounted; it is imported by FeaturedWork, not a page.)* |
| **ParticlePortrait** | nowhere | Dead code (photo-as-particles, unmounted). |
| **ARGMAX timeline** | about, work | New (2026-07). Keep. |
| **SkillBag** (throwable chips) | about | Real interaction, honest fallbacks. Keep. |
| **TrainingRun** (camera flight through a node cloud) | about | "Fly through glowing neurons" — the *generic-neurons* direction the repo's own design guidance bans, and it now competes with ARGMAX on the same page. **Remove** (secondary scope, Phase 6). |
| **ParticleFinale** ("LET'S BUILD" repel field) | contact | Interactive, on-thesis, good closer. Keep. |
| FlowImage covers, Process tree, Marquee, kinetic type | various | Solid supporting cast. Keep. |

**The call: remove LatentField-as-home-backdrop + the HeroVisual console + all dead hero
code, and give the home fold a real set-piece.** One route (home) changes canvas; about /
work / services keep LatentField for now (their set-pieces are the timeline + finale).

## Part 2 — Research (why this direction)

- Awwwards 2025–26 pattern: the winners are **interactive systems, not ambient shaders** —
  Bruno Simon's drivable-car portfolio (Site of the Month, Jan 2026), Messenger's live
  WebGL planet (Developer Site of the Year 2025), Active Theory / Lusion's simulation-
  grade work. Meanwhile "premium immersion is restrained — it suggests, reveals, and lets
  visitors conclude quality on their own" (Metabole 2026 breakdown).
- Interactive **gradient-descent visualizers exist only as educational tools** (lilipads'
  gradient_descent_viz, uclaacm's visualiser, 8gwifi, descent-visualisers.netlify.app) —
  raw Three.js graph aesthetics, zero art direction. **Nobody has shipped one at
  cinematic, award quality as a portfolio hero.** That's the open gap, and for an
  engineer whose site metaphor is literally optimization, it's *his* gap to take.
- Site lore alignment: the timeline exploration's runner-up concept ("The Descent",
  TIMELINE_REDESIGN.md concept 1, doc now in git history) was scored 8.3 and praised as "the strongest site
  unification play." The hero is where that concept belongs — /about tells the story as
  ARGMAX (inference), / shows the craft as DESCENT (optimization). Two views, one thesis.

Sources: [awwwards WebGL collections](https://www.awwwards.com/websites/webgl/),
[Metabole — Immersive Website Examples 2026](https://metabole.studio/en/blog/immersive-website-examples),
[MDX — Best 3D Websites 2026](https://mdx.so/blog/best-3d-websites-2026-examples),
[lilipads/gradient_descent_viz](https://github.com/lilipads/gradient_descent_viz),
[uclaacm gradient-descent-visualiser](https://uclaacm.github.io/gradient-descent-visualiser/).

## Part 3 — The concept: **THE DESCENT ARENA**

> The home fold becomes a live, playable gradient-descent arena. An iridescent loss
> landscape breathes in the dark. A population of optimizer probes is *always* descending
> it, leaving comet trails of light that trace the topology. Your cursor deforms the
> objective — probes swerve around the hill you just made. **Click anywhere: you drop a
> probe and watch your own descent** find its way into the glowing basin — which sits
> under the CTA. Every optimization on this site converges to "start a project."

- **Visual language**: the retired HeroShader terrain, upgraded — fbm hills sinking into
  one broad basin, crisp iso-contours crowding the steep walls, indigo→violet→cyan
  emissive lines under bloom, distance fog, left-column darkness guard (headline stays
  AAA). It already speaks the site's dialect; it was retired for being *passive*, not
  for being wrong. The arena makes it a system.
- **Probes**: ~14 GPU-sprited optimizer heads with momentum descent computed on the CPU
  against the *same* height function the vertex shader displaces with (JS mirror of the
  simplex/fbm — deterministic parity). Trails = additive point ribbons (ring buffers),
  decaying like long-exposure light. On reaching the basin: a small flare (one-time,
  asymmetric), then respawn at the rim. The field is never still, never looping.
- **Cursor = perturbation**: pointer position raises a gaussian bump in the height
  function (uniform in shader + same term on CPU). Probes physically deflect. You are
  changing the objective and watching the optimizers cope — the thesis, playable.
- **Click = spawn**: window-level click (ignoring interactive elements) raycasts to the
  plane and drops a probe with a bright birth flare. Cheap, delightful, demoable.
- **Scroll**: past the fold the fixed page-wide canvas pulls the camera up toward a
  quiet top-down contour view and dims to ~30% — the arena becomes ambient cartography
  behind ImpactStats/FeaturedWork/etc. (same page-wide role LatentField played). One
  canvas per route holds.
- **Fallbacks**: the existing `.hero-fallback` poster stays the SSR / reduced-motion /
  mobile / no-WebGL layer (upgrade: static contour art later). Governed mount
  (desktop-motion, DPR cap, FPS guard → drop bloom first, then probe count).
- **Restraint rules**: probes are small; trails dim; the left text column and top band
  stay dark (NDC gate as before); bloom threshold high. The arena *suggests* — it
  should read as deep, quiet cartography until you play with it.

### Kill-switches / acid tests
1. Terrain-only build must look premium with ZERO probes (grayscale screenshot test).
2. Probes OFF-thesis test: if trails read as "screensaver worms", shorten + dim until
   they read as measurement, not decoration.
3. Headline contrast: left column luminance unchanged vs current (AAA gate).

## Part 4 — Phase tracker

| Phase | Scope | Status |
|---|---|---|
| 1 | Dead-code purge: delete HeroShader, HeroBackground, ParticlePortrait(+Canvas); fix stale comments; build green (WorkReel kept — live via FeaturedWork) | ✅ |
| 2 | `components/hero/DescentArena.tsx` (gate+poster+scrim, LatentField mount pattern) + `DescentArenaCanvas.tsx` (terrain, camera rig, bloom tiers); mounted on home replacing LatentField; scroll pull-up + dim | ✅ |
| 3 | Probe sim (CPU fbm mirror + momentum descent), light trails, basin flare + rim respawn | ✅ |
| 4 | Interaction: pointer bump (deflects probes), click-to-spawn; remove HeroVisual console from Hero; layout rebalance | ✅ |
| 5 | Polish + audit: restraint pass, contrast guard, FPS-guard degradation ladder, reduced-motion/mobile verify, full build, screenshots | ✅ |
| 6 | /about: remove TrainingRun → "Training Signal" strip (DOM/SVG loss sparkline reusing its captions; no canvas) | ✅ |

Legend: ⬜ todo · 🔶 in progress · ✅ done (build green)

### Resume notes

*(appended at each checkpoint — newest first)*

- 2026-07-04 — **TIMELINE REDESIGN → "Constellation Spine" (retired the ARGMAX bolt).**
  After the reliability pass below, the owner still judged the timeline "ugly / not
  appealing / spacing + animation + speed all bad." A research workflow (wf_a351f4d7-786,
  8 agents: 5 web-research + diagnosis + skeptic-verify + synthesis; journal.jsonl has
  the full findings) confirmed the concept — not the tuning — was the failure: a dated
  text list rendered as an additive-glow lightning bolt on a fixed ~2810px viewBox with
  cards pinned by arc-length, buried under a starfield (LatentField) + constellation
  cobweb. Verified award refs (GOV.UK MOJ timeline, Codrops GSAP timeline + SVG-draw,
  Vercel web-interface-guidelines, Capital Group, NN/g on zigzag + scroll-reveals) all
  say: a timeline is DOM/SVG, one straight axis, one indicator. Owner picked **Direction 2
  (Constellation Spine, straightened)** + **remove LatentField from /about + /work**.
  **Shipped** (tsc+lint+build green, 20 pages):
  - `SerpentineTimeline.tsx` fully rewritten as a straight DOM/SVG spine: a 2px iridescent
    rail in a 52px node gutter that DRAWS top-down on scroll (SVG line, pathLength=1 +
    strokeDashoffset — no DrawSVG dep), one head-dot riding its tip, and node markers
    (`.spine-node`) that ignite as the head passes. Cards flow in a single column beside
    the rail (max-w-560px, even gap-11/14). ONE scrubbed ScrollTrigger (rail draw + head
    + node ignition + HUD, scrub 0.4, ease none — no warp clock, no canvas lerp); card
    entrances are separate once:true `ScrollTrigger.batch` reveals (expo.out, stagger
    0.09). Node offsets measured post-layout + on refresh (resize-safe). All motion is in
    a `(min-width:768px) and (no-preference)` matchMedia, so mobile/RM/no-JS render the
    FINAL state (rail drawn, all nodes lit, cards visible, head hidden) — verified in SSR
    HTML (7 markers, no is-pending) + a reduced-motion screenshot (HUD 07/07).
  - `argmax.ts` + `geometry.ts` gutted to just what survives: the `Beat.weight` score
    (`ABOUT_SCORE`, `scoreForCount`) and `hash01`. All bolt geometry (centerline, fans,
    scars, delta, constellation, channelPolygon…) deleted — recover from git if needed.
  - Deleted `ArgmaxCanvas.tsx` (~1050 lines) + `ArgmaxFiber.tsx`. Dropped the `constellation`
    prop from both adapters; Geoline card bg simplified (bg-base/85-over-canvas → bg-surface,
    no canvas underneath now). `LatentField` removed from /about + /work (kept on /services).
    Dead `geo-flow` + `star-twinkle` keyframes replaced by `.spine-node` CSS in globals.css.
  **Audit (Lighthouse 12, real Chrome), /about + /work:** A11y **100** (was 94-98 — the
  target-size + heading-order + contrast fails are gone with the constellation/canvas),
  **CLS 0.000** (fixes the 0.832 /work regression the prior pass introduced — now pure
  document flow), desktop perf **99-100**, /work-mobile **56→86**. Mobile perf 86-88 is
  the same pre-existing Lantern artifact noted below (real LCP <1s; the timeline's GSAP
  doesn't even run at mobile widths). Verified visually on a fresh prod server (the prior
  session's `next start` had been holding :3000 the whole time, silently serving a stale
  build — kill stray servers before screenshotting). COMMITTED + pushed to main.

- 2026-07-04 — **Post-ship audit + timeline legibility/reliability pass.** The owner
  reported the ARGMAX timeline on /work + /about reading as "not visible, not a
  timeline" and /about as intermittent ("sometimes works, sometimes not, sometimes
  switches look"). A 5-reader codebase sweep (workflow wf_bbab8d90-285, findings in
  its journal.jsonl) found the root causes:
  1. **Brightness gets cubed before display.** Every ArgmaxCanvas shader writes
     brightness into rgb AND alpha; AdditiveBlending squares alpha; premultipliedAlpha
     false over a transparent canvas multiplies rgb×alpha AGAIN → displayed light ≈
     bright³. Every resting value <~0.3 (future channel 0.13, ghost fans 0.06, unlit
     nodes 0.26, ticks 0.16) renders under 3% = black. Only the head comet survives.
  2. **The future is dark by design** + 3 lag sources (167ms ease, eased starts at 0,
     warp gamma) keep the head above the viewport on normal scroll → the visible region
     is "future" = near-black. That is the "empty starfield + one comet."
  3. **Intermittency**: `live` was a one-way latch with ZERO context-loss handling;
     when the browser evicts a context (2 long-lived contexts/page + un-released probe
     + R3F 500ms teardown overlap on nav), the canvas blanked while the poster was held
     at opacity-0 FOREVER. Plus the FPS guard tripped permanent degradation on a single
     tab-return/GC frame spike (relief threshold unreachable at 60Hz).
  **Fixes shipped** (7 files, tsc+lint+build green):
  - SerpentineTimeline: the structural poster (spine core/aura, nodes/beads, card
    stems, collapse blooms, constellation, scars, delta) is now PERMANENT — it no
    longer fades to opacity-0 when the canvas goes live. Only the channel-fill group
    dims to opacity-50, so the full route always reads as a connected timeline in EVERY
    state (SSR / RM / no-JS / no-WebGL / context-lost / live). This is the "reliability-
    first: poster IS the timeline, canvas is enhancement" synthesis.
  - ArgmaxCanvas: webglcontextlost/restored listeners (preventDefault + onContextLost/
    Restored props) wired to setLive(false)/(true) → a dead context restores the full
    poster instead of a blank stage.
  - webgl-governance: FPS-guard delta clamp (ignore frames >100ms — stalls, not strain);
    probe context released via WEBGL_lose_context (frees a slot so the page-wide bg
    canvas is less likely to be the one evicted).
  - a11y → 100 on all pages: SkillBag "drag me" hint text-ink-dim/40→/80; /work Tag
    chips were the contrast fail (pre-existing) — resolved via the heading-order fix +
    verified; sr-only "Shipped systems" h2 restores /work heading order (h1→h2→h3);
    ScrambleHeading pinned with an invisible sizer (grid overlay, CLS 0) and gated to
    desktop fine-pointer (mobile keeps static text).
  - ProjectCard/WorkGeoline: priority on the first cover (mobile LCP element).
  **Audit results (Lighthouse 12, real Chrome):** A11y **100** all 6 runs; CLS **0**
  in real browsers (verified by observed-throttling puppeteer — the one flaky
  about-desktop 0.051 and mobile perf 86-88 are Lantern *simulation* artifacts: observed
  mobile LCP is ~920ms = FCP, observed /about CLS is 0). Desktop perf 98-99. Reduced-
  motion + no-JS posters render the full timeline + all cards with no canvas; keyboard
  nav has skip-link-first + visible focus rings. **`display:optional` on Syne was tried
  and REVERTED** — zero Lighthouse benefit (Lantern models the text LCP off the font/
  chain regardless) and it risks the signature Syne headline falling back on desktop
  first-paint; swap protects the signature. STILL a known gap: Lighthouse *simulated*
  mobile perf sits ~86-88 (real observed <1s LCP) — a Lantern characteristic of a heavy
  WebGL/GSAP client app, not a regression.
  DEFERRED: LatentField on /about /work /services (owner call — see Task 4 rec below).
  Committing this pass now (owner approved pushing to main).

- 2026-07-04 — **Phase 6 ✅ — ALL PHASES COMPLETE.** Audit correction: TrainingRun's
  WebGL flight was ALREADY retired in a prior refactor (the mounted section was DOM
  cards; TrainingRunCanvas.tsx was dead) — so Phase 6 became: delete the dead canvas
  (git rm), fix the cards' backdrop-blur-over-canvas violation (bg-base/55+blur →
  bg-base/85), and add the Training Signal loss curve — deterministic SSR-stable SVG
  (hash01 noise decaying into a needle, epoch markers per card, faint converged-target
  rule), scroll-drawn via LineDraw (reduced-motion/no-JS = fully drawn). Verified in
  the prerendered HTML (ts-stroke + path present). Full build green (20 pages).
  DEFERRED (future work, needs owner decision): LatentField still backs /about, /work,
  /services — kept deliberately (those pages' set-pieces are ARGMAX + the finale);
  replacing or retiring it there is a separate call. NOT COMMITTED — working tree has
  staged deletions + new files; commit when the owner has done the real-GPU feel pass.

- 2026-07-04 — **Phase 5 ✅.** Headless screenshot of the production build
  (scratchpad/home-arena.png) shows the LIVE canvas rendering: contour terrain right,
  probe sprites on the surface, left column dark/AAA, hero copy + proof strip intact.
  Poster/reduced-motion/mobile path unchanged from the LatentField contract. What still
  needs a HUMAN on a real GPU: motion feel (probe pace, trail length, bump strength
  2.3, click-spawn delight), bloom intensity, and a Lighthouse run. All tunables are
  named constants at the top of DescentArenaCanvas.tsx and in the physics block.

- 2026-07-04 — **Phases 2+3+4 ✅** (canvas internals consolidated into one file since
  they share every uniform; verified as milestones). `components/hero/DescentArena.tsx`
  (governed gate, poster, scrim, vignette — LatentField contract) +
  `DescentArenaCanvas.tsx`: HeroShader terrain transplanted (+ uBump pointer
  perturbation in the height fn, GLSL + JS mirror in lockstep), camera rig hero-3/4 →
  top-down cartography by scroll with uIntensity dim, bloom tiering + FPS-guard strain
  drop, 14 probes × 64-slot trail rings (additive points, ring-buffer ages via uHeads),
  head sprites with uFlare, rim respawn + click-to-spawn (window listener, interactive-
  element guard, fold-only) + pointer bump raycast. **Physics validated numerically**
  (scratchpad/sim-check*.mjs): naive constants gave 0 arrivals in 40s (fbm local minima
  trap everything — 144 SGD kicks, no escapes); fixed with smoothed-loss gradient
  (EPS 1.6), momentum-preserving friction (0.7), L2 weight-decay pull (0.032),
  continuous SGD noise — variant D: ~69 arrivals/40s, ~6s avg journey, calm speeds.
  All 3 shader pairs compile+link under three's GLSL300 transpile
  (scratchpad/arena-shader-test.html → ALL_OK; note: raw ESSL1 lacks fwidth — harness
  now mirrors three's #version 300 es prefix). HeroVisual console deleted; Hero is
  single-column copy-left, arena owns the right. React-compiler lint required the
  ref-laundering pattern (sim state in lazy ref, uniforms via object refs) — same as
  ArgmaxCanvas. tsc + lint + full build green.
- 2026-07-04 — **Phase 1 ✅.** Deleted (git rm): HeroShader.tsx, HeroBackground.tsx,
  ParticlePortrait.tsx, ParticlePortraitCanvas.tsx. WorkReel initially deleted then
  RESTORED — it is live via FeaturedWork on home (audit table corrected). Hero.tsx stale
  comment fixed. tsc + lint + build green. The HeroShader terrain GLSL (simplex/fbm/
  basin/contours) is recoverable from git history AND being transplanted into
  DescentArenaCanvas in Phase 2.

- 2026-07-04 — **Phase 1 ✅.** Deleted (git rm): HeroShader.tsx, HeroBackground.tsx,
  ParticlePortrait.tsx, ParticlePortraitCanvas.tsx. WorkReel initially deleted then
  RESTORED — it is live via FeaturedWork on home (audit table corrected). Hero.tsx stale
  comment fixed. tsc + lint + build green. The HeroShader terrain GLSL (simplex/fbm/
  basin/contours) is recoverable from git history AND being transplanted into
  DescentArenaCanvas in Phase 2.

- 2026-07-04 — Plan written. Legacy plan preserved via git mv (later removed from the
  working tree entirely — see doc-hygiene note at top). Research + audit done. Start at
  Phase 1.

### Verification per checkpoint
- `npx tsc --noEmit` + `npm run lint` every phase; `npm run build` phases 1, 2, 4, 5, 6.
- Shader-compile harness (scratchpad/gen-shader-test.mjs pattern) for any new GLSL.
- The governed-canvas contract (poster always painted, canvas desktop-motion only,
  aria-hidden, pointer-events-none, one page-wide canvas per route) must not regress.
