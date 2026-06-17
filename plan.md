# Jay Dhakan Portfolio — V3 "Crazy Animation" Plan

> Fresh start. Supersedes the V2 motion rebuild + the P1–P12 elevation track (both shipped,
> docs deleted). This is the **single source of truth** for the bold redesign: design bible
> **and** live execution tracker in one file. Built from a deep-research pass (4 web lanes:
> Awwwards-cinematic / kinetic-type / playful-experimental / 2026 trends) + a full codebase
> map + a creative-director synthesis.
>
> `PRODUCT.md` (brand/users) and `DESIGN.md` (the *shipped* baseline system) remain — read
> them for context, but where this plan disagrees (notably the perf gate), **this plan wins.**

---

## 0. Why this plan exists

The site shipped a lot of *polished, disciplined* motion — and it reads as premium-but-safe
(a Linear/Vercel-grade page, not an Awwwards "wow"). The owner's call: stop playing it safe.
Go **genuinely bold**. The previous philosophy was "restraint = premium, crazy ≠ noisy"; we
keep the craft, but spend a much bigger boldness budget on a handful of show-stoppers.

### Decisions (locked with the owner)

| #        | Decision         | Locked value                                                                                                                                                                                       |
|----------|------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **V3-1** | Boldness vs perf | **Bold first.** Relax the hard gate to **~90 desktop / ~85 mobile** to allow heavier WebGL, scroll-storytelling, particles. A11y stays **100**, CLS stays **0**.                                   |
| **V3-2** | Direction        | **Awwwards-cinematic + kinetic-typography + playful-experimental** — a real step-change, not just cranking the current look.                                                                       |
| **V3-3** | Content          | **Placeholder / temporary data is allowed** to make pages feel full and let an effect ship; flag every placeholder (`TODO(JAY)` / `isPlaceholder`), never silently fake a metric or a testimonial. |
| **V3-4** | Docs             | **Deleted** `plan.md`(old)/`new_plan.md`/`PHASES.md`; this fresh `plan.md` + `DESIGN.md` + `PRODUCT.md` + `README.md` remain.                                                                      |
| **V3-5** | Brand invariants | Dark-only, electric-indigo (+ the iridescent indigo→violet→cyan duotone), first-person voice, **no em/en dashes**, all visible copy in `data/content.ts`.                                          |

---

## 1. North star — the ONE idea

> **THE SITE COMPILES ITSELF — a portfolio that runs like a model, not a brochure.**

Every "crazy" effect is a literal demonstration of an ML system in motion, driven by **one
shared velocity/scroll signal** (read once per frame off Lenis — the same signal that already
feeds The Field's `uScroll`/`uMouse`/`uInteract`). We promote the existing gradient-descent
shader from ambient backdrop to the site's **protagonist**, and make the whole experience read
as *inference running on the page*:

- **DECODES** on load (scramble/binary → Syne; already shipped in `OpeningChoreo`).
- **CONVERGES** on scroll (the loss landscape tightens into its basin as you descend).
- **REACTS** to you (the field warps under the cursor, type fattens, marquees streak — one signal).
- **MORPHS** between states (your portrait is "just data / an embedding" assembling from a
  particle cloud; page changes are interpolations through latent space).
- **CLOSES** with a GPU set-piece that is physically impossible to fake in the DOM.

This is still **"bold the signature, restrain everything else"** — we go genuinely crazy on
**~6 earned WebGL moments inside the ONE context we already pay for**, and keep the connective
tissue compositor-cheap so the relaxed 90/85 gate is *never actually spent*. The visitor doesn't
read that Jay engineers state and motion — they **feel** a controlled, converging system the
entire scroll. The medium proves the message.

### The decision rule

If a proposed effect doesn't make "an ML system, alive and converging, that you can perturb"
more legible, it's decoration — cut it or bend it to the idea. Bold the idea; restrain everything
that isn't it.

---

## 2. Guardrails (every new effect passes these)

The gate relaxed; the *craft rules* did not.

- **Gate:** Lighthouse **Perf ≥ 90 desktop / ≥ 85 mobile**, **A11y = 100**, **CLS 0**.
  *(Desktop measured with `lighthouse --preset=desktop`.)*
- **ONE WebGL context, always.** Never a second live `<Canvas>`. Every WebGL effect (flowmap
  planes, transition quad, particle portrait, finale) renders **inside** the existing
  `HeroShader` Canvas via render-target swaps / shared scene, **or** is its own single
  route-scoped canvas that fully unmounts the hero one. Never two live at once. (See Risks.)
- **Animate only** `transform` / `opacity` / `clip-path` / `filter` / shader uniforms.
  Never width/height/margin/top.
- **DOM/text stays authoritative.** WebGL is `aria-hidden` + `pointer-events-none`; a real DOM
  heading lives under every kinetic word; sr-only copy backs every aria-hidden kinetic statement.
- **`prefers-reduced-motion` decided up front** (`gsap.matchMedia`), never post-hoc disabled.
  Every WebGL set-piece has a **premium static poster fallback** (reuse `lib/blur.ts` LQIP).
- **Mobile is adapted, not absent** — it degrades to a deliberate lighter experience, never a
  broken desktop one and never scroll-jacked.
- **Lenis stays the single scroll source of truth** (synced to the GSAP ticker). Use `scrub`,
  not snap-traps; cap pin lengths; always a native-scroll fallback.
- **LCP element never covered on first paint.** Heavy canvases lazy-mount + pause off-screen.
- **Slop test:** couldn't be mistaken for a generic SaaS/Linear page or an AI template; it makes
  the one idea more legible, not just prettier.

---

## 3. Signature moves (the things people screenshot)

~8 earned moments. Each is grounded in the research and reuses the one WebGL context.

| #      | Move                                                                                                                                                                                                                                   | Where                       | Wow                                                                                                            | Perf risk |
|--------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------------------------------|-----------|
| **S1** | **Loss-Landscape Hero, Act II** — pin the hero ~150–200vh; a stateless `uProgress` scrub tightens the iso-contours and steps the descent band into the basin as the H1 "converges."                                                    | Home hero                   | The signature you own becomes a story you *feel*. Zero new GPU budget.                                         | low       |
| **S2** | **One velocity bus** — read Lenis velocity once/frame, broadcast to marquee timeScale+direction, headline skewY/scaleY + `wght` nudge, section-label streak, AND the Field uniforms.                                                   | Global                      | The Lando-Norris "Site of the Year" momentum signature: everything physically connected.                       | low       |
| **S3** | **WebGL flowmap work grid** — covers become WebGL planes (inside the existing Canvas, synced to DOM rects); cursor-velocity flowmap warps UVs + per-channel RGB chromatic smear; magnetic card lean + VIEW cursor.                     | /work + FeaturedWork        | Each project reacts to *how* you approach it (Cyd Stumpel / Codrops flowmap).                                  | medium    |
| **S4** | **"You, as data" particle portrait** — headshot assembles from ~50–70k GPU particles from a color+depth WebP pair (~30KB), breathes with curl noise, disperses→reforms into the first project on CTA.                                  | /about identity             | The Phantom.land "photo becomes a living cloud" for ~30KB. The gag *is* the ML thesis.                         | medium    |
| **S5** | **Latent-space page transitions** — upgrade the enter curtain to a shader block-dissolve (pixels flip in noise order + chromatic flash) via the View Transitions API + a `uProgress` noise quad in the existing context.               | Global routes               | The Active-Theory "one continuous experience," framed as walking the latent space.                             | medium    |
| **S6** | **Train-in-public camera scroll** — pin a lightweight instanced skill-graph/data landscape; fly a CatmullRom camera path on scroll (epochs = scroll, descending to a converged cluster); SplitText copy resolves char-by-char in sync. | /about journey              | Scrolling becomes operating a film camera through your own training run.                                       | medium    |
| **S7** | **Throwable skill bag** — stack chips (Python, PyTorch, FastAPI, CUDA…) you grab, fling, and watch settle, self-healing back to a grid. GSAP Draggable + Inertia + Flip (all free). DOM-synced text stays crisp/selectable.            | /about toolkit or TechStack | People spend 20s tossing your skills around; the self-healing pile reads "I model state carefully."            | low       |
| **S8** | **GPU finale** — one flagship surface runs 200k+ compute particles (WebGPU/TSL, ships inside three 0.184) forming the logo / "LET'S BUILD," morphing on interaction; feature-detect → falls back to the S4 WebGL particle path.        | Contact CTA                 | Particle counts impossible to fake in DOM = self-evidently real engineering; signals 2026 GPU-compute tooling. | high      |

---

## 4. The phased build plan

> Cadence (proven on this repo): **one shippable bold move per phase → meet the exit gate
> (build green + Lighthouse target + RM/no-JS/responsive screenshots + no ST/GPU leaks) →
> owner reviews → next phase.** Foundation first; riskiest last on a proven base. Any phase
> can be reordered/cut — the goal leads, not the list.

### P1 — Velocity bus + perf/a11y governance harness *(foundation — no visible big effect yet)*

- **Build:** a `useVelocityBus` hook (reads Lenis velocity/progress once per frame off the
  existing ticker, broadcasts via a tiny store) + a WebGL governance layer: a
  `useWebGLVisibility` gate (flip `HeroShader` from `frameloop="always"` to gated/paused
  off-screen), a `dpr` cap helper, an FPS guard that can drop particle texture res when frame
  time > 20ms, and a reduced-motion→poster swap path (reuse `lib/blur.ts`). Centralize the
  `gsap.matchMedia` RM branches. Extend `ScrollTriggerLeakCounter` discipline to GPU work.
- **First cheap proof:** hook the existing marquee `timeScale` + hero H1 skew to the bus.
- **Exit gate:** build green; desktop 100, mobile ≥ 85, A11y 100; no ST/GPU leaks over 10 navs.

### P2 — Loss-Landscape Hero, Act II *(S1)*

- **Build:** add a **stateless** `uProgress` uniform to The Field; pin the hero ~150–200vh; a
  ScrollTrigger `scrub` drives `uProgress` so contours tighten and the descent band lands in the
  basin, the H1 resolving on the same timeline. One `cinematicSilk` CustomEase. Keep the shader
  stateless (no JS branching on scroll). Reuse `Pin` + the `OpeningChoreo` H1 reveal.
- **Exit gate:** hero converges on scroll; RM = static field; no second context; desktop 100,
  mobile ≥ 85.

### P3 — One velocity bus, visible everywhere *(S2)*

- **Build:** marquee speed + direction follow scroll (flip on scroll-up) with a `skewX` streak;
  Syne headline `skewY`/`scaleY` + `wght` nudge on velocity (`gsap.quickTo`, debounced snap-back);
  section labels streak. All compositor/paint-cheap, fine-pointer + motion-safe only.
- **Exit gate:** page feels like one connected momentum system; desktop 100, mobile ≥ 85 (DOM-only),
  A11y 100.

### P4 — WebGL flowmap on the work grid *(S3)*

- **Build:** mirror /work + FeaturedWork covers as WebGL planes **inside the existing Canvas**
  (drei `<Image>` synced to DOM rects); a cursor-velocity flowmap (RG ping-pong, inline GLSL)
  offsets UVs + per-channel RGB chromatic aberration gated by velocity; displacement cross-fade
  to a 2nd texture on hover; magnetic card lean (reuse `MagneticButton` pattern) + VIEW cursor.
  DOM text authoritative; canvas `aria-hidden`.
- **Exit gate:** every tile reacts to the cursor; one context; desktop ≥ 95, mobile static fallback,
  no leak growth.

### P5 — Depth-map particle portrait *(S4)*

- **Build:** generate color+depth WebPs **offline** from Jay's headshot (Depth-Anything/MiDaS —
  no runtime model); build the ~50–70k point cloud (BufferGeometry, depth→z, color→tint,
  curl-noise drift, `uMorph` scatter/reform), lazy-mounted (`next/dynamic` `ssr:false`) +
  IntersectionObserver pause; additive blend + soft circular point mask. GSAP tweens `uMorph` on
  load and on the CTA (face disperses → reforms into the first project silhouette).
- **Placeholder note:** generate the depth pair from the current `JD` placeholder avatar so it
  ships now; `TODO(JAY)` real photo upgrade stays flagged.
- **Exit gate:** living self-portrait on /about; poster fallback under RM/no-WebGL; desktop ≥ 92,
  mobile poster, FPS guard active.

### P6 — Latent-space page transitions *(S5)*

- **Build:** upgrade the enter-only curtain to a shader **block-dissolve** rendered inside the
  existing Canvas (render-target swap; `step(noise, uProgress)` flips pixels in noise order +
  chromatic flash), wired to **Next 16 View Transitions** + `flushSync` at the cover peak; reuse
  `ScrambleText` for the loading string. Keep the current CSS clip curtain as the RM/no-JS fallback.
- **Exit gate:** site feels like one continuous GPU experience; no 2nd context; cursor blend
  verified mid-wipe; RM = instant swap; LCP never covered on first paint.

### P7 — Throwable skill bag *(S7)*

- **Build:** replace the flat toolkit/TechStack list with a Draggable + Inertia + Flip physics
  pile of stack chips (DOM-synced text, bounded, elastic, self-healing to grid; slight rotation
  on throw). Desktop-only; static readable grid under RM/mobile. **Zero new deps** (all free GSAP).
- **Exit gate:** tactile, memorable skills section; desktop 100, mobile static, A11y 100 (text
  selectable/readable).

### P8 — Train-in-public camera-path scroll *(S6)*

- **Build:** pin a lightweight **instanced** 3D skill-graph/data landscape on /about; fly a
  `CatmullRomCurve3` camera path on scroll (descending toward a converged cluster) with SplitText
  copy resolving char-by-char on position labels; matcaps + instancing, no realtime shadows.
  Reuse `Pin` + SplitText + the ticker. (Renders in a route-scoped canvas that unmounts cleanly.)
- **Exit gate:** a journey act that restates the optimization theme; desktop ≥ 92; mobile collapses
  to a static/vertical narrative; no leaks.

### P9 — GPU finale: WebGPU/TSL compute particles *(S8 — highest risk, last)*

- **Build:** on ONE flagship surface (contact CTA), switch that Canvas to `WebGPURenderer` via
  the R3F `gl` factory; ~200k+ particles via TSL `Fn().compute(n)` (`instancedArray`,
  `SpriteNodeMaterial`) forming the logo / "LET'S BUILD," morphing on interaction + mouse
  repulsion; **feature-detect `navigator.gpu`** → fall back to the P5 depth-map/GPGPU WebGL
  particles. Lazy-loaded, one route only. (WebGPU/TSL ship inside three 0.184 — no install.)
- **Exit gate:** the closing-argument set-piece; desktop ≥ 90 (relaxed gate); hard fallback
  verified; FPS guard + dpr cap; one context.

### P10 — Mobile motion parity pass

- **Build:** address the "desktop-first animation" gap. Give touch users an *adapted* experience:
  native **scroll-driven CSS animations** (`animation-timeline: view()`, compositor, zero JS) for
  entrance parity, a lighter scroll-scrubbed Field, the velocity-marquee (bus-lite), and verified
  premium static posters for every WebGL set-piece. No scroll-jacking on touch.
- **Exit gate:** mobile reads as "motion that adapts to device"; mobile Perf ≥ 85 all routes; A11y
  100; no horizontal overflow at 375.

### P11 — Full QA matrix + leak/perf sweep + launch cleanup

- **Build:** re-run the 5-route × mobile/desktop Lighthouse matrix at the relaxed gate
  (`--preset=desktop` for the 100); 10-nav ScrollTrigger + GPU-context leak sweep; RM + no-JS +
  JS-off verification; em-dash grep; content/asset swap-in where real assets have landed. Confirm
  every WebGL surface lazy-mounts, pauses off-screen, caps dpr, and has a static RM fallback.
- **Exit gate:** desktop ~100, mobile ≥ 85, A11y 100, CLS 0, zero leaks, single context honored;
  this `plan.md` status board updated.

---

## 5. Risk register (top items + mitigation)

1. **Second WebGL context = the cardinal sin** (doubles memory, context-loss risk, extra rAF).
   → Everything WebGL renders **inside the one existing Canvas** via render-target swaps / shared
   scene, OR is a single route-scoped canvas that fully unmounts the hero one. Never two live.
   Enforced in P1's governance layer.
2. **The relaxed 90/85 gate getting actually spent** by heavy WebGL (P5/P8/P9).
   → Every canvas lazy-mounts (`ssr:false`), pauses off-screen, caps `dpr [1,1.75]`,
   `antialias:false` + low-power on ambient / high-performance only on the finale; FPS guard drops
   particle res when frame time > 20ms; WebGPU finale is one lazy route.
3. **A11y regression from canvas-rendered text/imagery** (loses selection + SR access; SplitText
   has put a prohibited `aria-label` on `<p>` twice on this project).
   → DOM/text authoritative + visible, canvases `aria-hidden` + `pointer-events-none`; real
   headings under every kinetic word; sr-only copy for aria-hidden statements; re-verify A11y=100
   every phase.
4. **Scroll-jacking** on pinned hero (P2), horizontal/work acts, camera-path (P8).
   → Lenis stays the single source of truth; `scrub` not snap-traps; cap pin length; clear visual
   progress; native vertical fallback under RM; never disable scroll on touch.
5. **Mobile reading cheap** (the dossier's "desktop-first" flag).
   → P10 is a dedicated parity pass: scroll-driven CSS + bus-lite + premium static posters for
   every WebGL set-piece; mobile gate ≥ 85.
6. **Scope creep diluting the "wow."** 11 phases of crazy can become noise.
   → ONE bold move per phase with a hard exit gate before the next; only ~6 earned WebGL moments,
   the rest compositor-cheap; apply the slop test each phase.
7. **New dependency surface.** → WebGPU/TSL ship inside three 0.184 (no install); depth generation
   is **offline** (no runtime dep); curl/flowmap are inline GLSL; add `@react-three/postprocessing`
   only if bloom is truly needed on the finale; prefer 2D GSAP physics (free) over `matter-js`;
   avoid OGL (would add a 2nd WebGL pathway).

---

## 6. Reuse vs new

**REUSE (do not rebuild):**

- The single `HeroShader` R3F Canvas + "The Field" shader and its `uTime`/`uScroll`/`uMouse`/
  `uInteract` uniforms — **add a stateless `uProgress`; render the flowmap planes / transition
  quad / portrait into THIS context.**
- `HeroBackground` mount gates (RM probe, WebGL probe, IntersectionObserver, deferred-arm).
- `SmoothScrollProvider` Lenis↔GSAP ticker sync (the velocity bus reads from here).
- `lib/gsap.ts` (`jdFlow` ease, `DUR` scale, lazy SplitText/DrawSVG/Flip/ScrambleText — all free,
  installed).
- Motion primitives `Pin`/`RevealText`/`ClipReveal`/`FadeUp`/`LineDraw`/`Counter`.
- UI `SlideText`/`ScrambleText`/`KineticHeadline`/`MagneticButton` (the V2.1 award layer).
- `PageTransition` curtain → becomes the **RM fallback** for the shader transition.
- `CustomCursor` + its VIEW state; `lib/blur.ts` + `image-blur.ts` (LQIP posters = the WebGL
  static fallbacks); `ScrollTriggerLeakCounter` (extend to GPU); `gsap.matchMedia` RM branching.

**NEW (add only when a phase proves it):**

- `useVelocityBus` + `useWebGLVisibility`/FPS-guard hooks (P1).
- A `uProgress` scrubbed-Field controller (P2).
- A flowmap RG ping-pong + DOM-synced WebGL plane component (P4 — inline GLSL, no dep).
- Offline depth-map generation (build-time) + a depth-particle component (P5).
- A View-Transitions router shim + shader block-dissolve quad (P6).
- A `SkillBag` using already-installed GSAP Draggable/Inertia/Flip (P7 — zero deps).
- A camera-path /about scene with drei CatmullRom + Instances (P8).
- A `WebGPURenderer` gl-factory + TSL compute module — ships inside three 0.184, **no install** (
  P9).
- *Optional, only if proven needed:* `@react-three/postprocessing` (bloom on the finale);
  `@react-three/rapier` (only if the skill bag goes 3D — its WASM is already a transitive).

---

## 7. Content / placeholder track *(can run alongside any phase)*

Placeholder data is allowed (V3-3) so pages feel full and effects can ship. Flag everything.

**Standing — blocked on Jay (the biggest real upgrade, far more than any effect):**

- [ ] Real project **covers** → `public/images/projects/*.png` (branded placeholders in place;
  overwrite, then re-run `scripts/gen-placeholders.mjs` to refresh the LQIP map).
- [ ] Real **profile photo** → `public/images/profile/jay.jpg` (needed for the P5 depth portrait;
  placeholder depth pair ships from the `JD` avatar until then).
- [ ] Real **testimonials** (6 are `isPlaceholder`).
- [ ] Replace the **3 placeholder projects** on /work (currently `// PLACEHOLDER`).
- [ ] Confirm **email / LinkedIn / Upwork URLs**, timeline date conflict, the "50+ projects" claim.
- [ ] `RESEND_API_KEY` + verified `from:` domain; `NEXT_PUBLIC_SITE_URL`.

---

## 8. Reference sites (study the *feeling* + the technique, not the code)

**Cinematic / WebGL**

- Active Theory — `activetheory.net` (one continuous GPU experience; no "pages").
- Lusion — `lusion.co` (physical, throwable 3D with weight/momentum).
- Unseen 2025 — `2025.unseen.co` (horizontal scroll cinematic journey; Developer Award).
- Cyd Stumpel — `awwwards.com/sites/cyd-stumpel-portfolio-2025` (a SOLO dev hitting SOTD with
  tasteful WebGL — our exact situation).
- Phantom.land particle face — Codrops "Invisible Forces" (depth-map particle portrait; the single
  most ML-relevant technique).
- Codrops "Cinematic 3D Scroll with GSAP" (2025-11) and "Shader Uniforms to Clip-Path Wipes" (
  2026-05) — our exact stack patterns.
- three.js `webgpu_tsl_compute_attractors_particles` (the 2026-forward finale path).

**Kinetic type**

- Obys Agency — `obys.agency` (type-as-layout-system).
- Lando Norris — `awwwards.com/sites/lando-norris` (Site of the Year: one velocity signal drives
  everything — our S2).
- Codrops dual-wave (2026-01) + organic text distortion (2024-11) — DOM-only velocity waves (cheap
  big-wow).

**Playful**

- Bruno Simon — `bruno-simon.com` (the canonical "navigation as game" — and the trope we
  deliberately do NOT imitate; too gamey for a precise-engineer brand).
- Cuberto — `cuberto.com` (morphing cursor as brand).
- Codrops free-GSAP-plugins demos (InertiaPlugin spring-away grid, Physics2D text smash, MorphSVG).

---

## 9. Definition of done (every new effect)

1. Makes the one idea (an ML system, alive and converging, that you can perturb) more legible.
2. `transform`/`opacity`/`clip-path`/`filter`/uniforms only; RM + mobile paths designed in.
3. One WebGL context honored; LCP never covered on first paint.
4. DOM/text authoritative; A11y = 100; CLS = 0.
5. Verified: desktop ≥ 90 (`--preset=desktop`), mobile ≥ 85; no ST/GPU leaks.
6. Copy in `content.ts`; no em/en dashes; placeholders flagged.
7. Passes the slop test.

---

## 10. Status board

`[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

| Phase | Title                                       | Status |
|-------|---------------------------------------------|--------|
| P1    | Velocity bus + perf/a11y governance harness | `[ ]`  |
| P2    | Loss-Landscape Hero, Act II (S1)            | `[ ]`  |
| P3    | One velocity bus, visible everywhere (S2)   | `[ ]`  |
| P4    | WebGL flowmap on the work grid (S3)         | `[ ]`  |
| P5    | Depth-map particle portrait (S4)            | `[ ]`  |
| P6    | Latent-space page transitions (S5)          | `[ ]`  |
| P7    | Throwable skill bag (S7)                    | `[ ]`  |
| P8    | Train-in-public camera-path scroll (S6)     | `[ ]`  |
| P9    | GPU finale: WebGPU/TSL particles (S8)       | `[ ]`  |
| P10   | Mobile motion parity pass                   | `[ ]`  |
| P11   | Full QA matrix + leak/perf sweep + cleanup  | `[ ]`  |

> Recommended start: **P1 → P2.** P1 is the spine every bold move hangs on; P2 (the hero becoming
> a convergence story) is the single highest concept-payoff move and reuses the GPU you already pay
> for.

### Changelog

- 2026-06-17 — V3 plan created from a deep-research pass (4 web lanes + codebase map + synthesis).
  Old V2 trackers (`plan.md`/`new_plan.md`/`PHASES.md`) deleted per owner. Gate relaxed to
  90/85 (A11y 100, CLS 0 held). Awaiting owner go-ahead on P1.
