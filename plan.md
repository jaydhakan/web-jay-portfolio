# Jay Dhakan Portfolio — V3 "Go Loud" Animation Plan

> Fresh start. Supersedes the V2 motion rebuild + the P1–P12 elevation track (both shipped,
> their docs deleted). **Single source of truth** for the bold redesign: design bible **and**
> live execution tracker. Built from a deep-research pass (4 web lanes: Awwwards-cinematic /
> kinetic-type / playful-experimental / 2026 trends) + a full codebase map + a synthesis pass.
>
> `PRODUCT.md` (brand/users) and `DESIGN.md` (the *shipped V2 baseline*) remain for context.
> Where they disagree with this plan, **this plan wins.**

---

## 0. The mandate

The V2 site is polished — and forgettable. It reads as a premium SaaS page, not a site people
screenshot and send to a friend. **We are done playing safe.** The goal now: a portfolio that
makes a visitor say "how is this real," on *every* page, in the first three seconds.

This plan is **maximal by default.** Every page gets a flagship moment. Sections can layer
*multiple* effects. The hero is a full 3D world. Imagery is never flat. The cursor is alive.
Type is loud. Transitions are liquid. The finale is a GPU particle storm. We spend the boldness
budget everywhere and only pull back where pulling back is the difference between "wild" and
"broken."

### What changed from the first draft (why it read safe, and the fix)
| Was (timid) | Now (loud) |
|---|---|
| "Bold the signature, restrain everything else." | **Every surface is alive.** The signature leads; nothing else is sleepy. |
| "One moment per section." | **Layered moments** — orchestrated, not minimal. Sections can have entrance + ambient + interaction. |
| "Home is the showcase." | **Every route is a showcase.** /work, /about, /services, /contact each get a flagship set-piece. |
| "Compositor-cheap connective tissue so the gate is never spent." | **We spend the GPU freely on desktop.** Bloom, particles, real 3D, post-processing. |
| "Perf ≥ 95 hard gate." | **Perf measured, not capped** (see §2). The only hard line is "doesn't break / still loads." |

### Decisions (locked with the owner)
| # | Decision | Value |
|---|---|---|
| **V3-1** | Posture | **Maximal.** Crazy, attractive, best-in-class UI/UX is the primary goal. Spectacle on every page. |
| **V3-2** | Direction | **Awwwards-cinematic + kinetic-typography + playful-experimental** — full 3D, particles, physics, liquid transitions, loud type. |
| **V3-3** | Perf | Desktop: **spend freely**, no Lighthouse cap — just must load fast + run smooth on a real machine. Mobile: **bold but functional** (target ~80+, never broken/janky). **A11y = 100 always. CLS = 0.** |
| **V3-4** | Content | **Placeholder / temporary data allowed** to make pages full and let effects ship; always flag (`TODO(JAY)` / `isPlaceholder`), never silently fake a metric or testimonial. |
| **V3-5** | Docs | Deleted old `plan.md`/`new_plan.md`/`PHASES.md`/`docs/final_prompt.md`; this `plan.md` + `DESIGN.md` + `PRODUCT.md` + `README.md` remain. |
| **V3-6** | Brand | Dark-first, electric-indigo + **iridescent indigo→violet→cyan**, now with **controlled neon glow / bloom** (more energy than V2). First-person voice, **no em/en dashes**, copy in `data/content.ts`. |

---

## 1. North star — the ONE idea that makes the crazy cohere

> **THE SITE COMPILES ITSELF — a portfolio that runs like a live ML system, and you can touch it.**

The crazy is not random spectacle — it's *one concept executed obsessively* so the site couldn't
be mistaken for anyone else's. Every effect is an ML system in motion, all driven from one shared
signal (Lenis velocity/scroll, already feeding The Field). The whole experience reads as inference
running on the page:

- **DECODES** on load (scramble/binary → Syne — already shipped in `OpeningChoreo`, now louder).
- **CONVERGES** on scroll — you fly down into a 3D loss-landscape as the optimizer finds its basin.
- **REACTS** to you — the field warps, type fattens and skews, imagery ripples, the cursor morphs,
  everything leaning on one momentum signal.
- **MORPHS** between states — your portrait is "just data" that assembles from a particle cloud;
  every page change is an interpolation through latent space (liquid shader transition).
- **CLOSES** with a GPU particle storm that is physically impossible to fake in the DOM.

This is the thread that turns "a pile of effects" into a site that wins awards: a visitor doesn't
*read* that Jay engineers state and motion — they *feel* a living, converging system the whole way
down. **The medium proves the message.** That coherence is what makes "loud" land as "designed"
instead of "noisy."

### The only filter for an effect
Does it make "a live ML system you can perturb" more visceral, more attractive, or more fun? If
yes, go big. If it's just decoration that could sit on any template, it's not crazy enough — make
it on-concept or make it bigger.

---

## 2. Non-negotiables — the rig that lets us go loud without breaking

Not restraint. These are the things that keep "wild" from becoming "crashed phone / dead lead."

- **A11y = 100, always.** Free wow, and real clients (and their legal teams) need it. DOM/text
  stays authoritative under every effect: WebGL is `aria-hidden` + `pointer-events-none`; a real
  heading lives under every kinetic/3D word; sr-only copy backs every aria-hidden statement.
- **It must still LOAD fast.** Heavy WebGL/particles lazy-mount and *arm after first paint* (the
  pattern The Field already uses). The first screen paints instantly; the spectacle ignites a beat
  later. Spectacle that delays the LCP past ~2.5s is retuned, never shipped as-is.
- **Don't kill the GPU.** You can have several big canvases across the site — but only what's
  on-screen runs. Off-screen canvases pause (`frameloop` gated) or unmount. Cap `dpr [1,2]`; an FPS
  guard drops particle resolution if a frame takes > 20ms. (This is about *simultaneity*, not
  ambition — go as big as you want on the surface the user is looking at.)
- **`prefers-reduced-motion` is a real, designed path** (`gsap.matchMedia`) — a premium static
  poster (reuse `lib/blur.ts` LQIP) for every WebGL set-piece. A fraction of users get motion sick;
  this is one media query and it keeps A11y at 100.
- **Mobile is bold, not broken.** It gets its own tuned spectacle (lighter particle counts, native
  scroll-driven CSS, no scroll-jacking on touch) — never a stripped or janky desktop.
- **Animate** `transform`/`opacity`/`clip-path`/`filter`/shader uniforms. Never width/height/margin.
- **Quality bar (replaces the old "slop test"):** every effect is unmistakably *intentional* and
  *on-concept*. Loud is the goal; sloppy is not. If it looks like a default AOS/template effect,
  it's not bold enough.

> Strategic note (read once): your sales pitch is "I build fast, polished software," and most
> prospects arrive on a phone. The above keeps the crazy from undercutting that pitch. If you want
> to push mobile even harder at some perf cost, that's a knob we can turn — flag it and I will.

---

## 3. Signature moves — the things people screenshot

Maximal set. Each is grounded in the research dossier. Most reuse the one hero WebGL context;
the heaviest get their own route-scoped canvas.

| # | Move | Where | The wow |
|---|---|---|---|
| **S1** | **3D loss-landscape hero you fly into** — promote The Field from a flat shader to a real 3D terrain: camera parallaxes on mouse, *dives into the basin* on scroll, bloom-lit glowing descent path, sparks. The H1 lives in/over the 3D space and resolves as the optimizer converges. Full-bleed, commands the screen. | Home hero | The first screen is a living 3D ML visualization, not a gradient. Immediate "how is this real." |
| **S2** | **One velocity bus** — read Lenis velocity once/frame, broadcast to marquee speed+direction, headline skew/scale + variable `wght`, section-label streak, AND the hero uniforms. The whole page moves like one physical system. | Global | The Lando-Norris "Site of the Year" momentum feel — everything connected, motion as inertia. |
| **S3** | **Gooey morphing cursor + magnetic everything** — the cursor is a liquid indigo blob that stretches toward velocity, morphs into labels/arrows ("view ↗", "drag", "play"), leaves a faint trail; every interactive element leans toward it. | Global | The Cuberto "cursor is the brand" signature. Makes the entire site feel hand-built. |
| **S4** | **Bloom + post-processing glow layer** — an EffectComposer pass (bloom, subtle chromatic aberration, grain) over the WebGL so the iridescence *glows* like expensive liquid light. | Hero + finale | The "this cost money" sheen that separates Awwwards sites from CSS gradients. |
| **S5** | **WebGL flowmap on ALL imagery** — every cover (work grid, featured, case study) is a WebGL plane that ripples + chromatically smears with cursor velocity and melts through a displacement map on hover. Imagery is never flat anywhere. | /work, home, case study | Each project reacts to *how* you approach it (Cyd Stumpel / Codrops flowmap). |
| **S6** | **Horizontal cinematic work reel** — a pinned sideways scroll act through featured projects with WebGL covers, parallax layers, and scrubbed clip-reveals. Vertical wheel drives a cinematic lateral journey. | Home (or /work) | The Unseen "year in review" rhythm-break — a film, not a list. |
| **S7** | **"You, as data" particle portrait** — your headshot assembles from ~60–100k GPU particles (color + depth WebP, ~30KB), breathes with curl noise, and disperses → reforms into your first project on a CTA. | /about | The Phantom.land "photo becomes a living cloud." The gag *is* the ML thesis. |
| **S8** | **Cinematic camera-flight "training run"** — pin a 3D skill-graph / data landscape and fly a keyframed camera through it on scroll (epochs as scroll, descending to a converged cluster), copy resolving char-by-char in sync. | /about journey | Scrolling becomes operating a film camera through your own career. |
| **S9** | **Liquid-metal latent-space page transitions** — every route change is a full-screen shader morph: pixels dissolve in noise order with a chromatic flash / mercury blob wipe, framed as walking the latent space between projects. | Global routes | The Active-Theory "one continuous experience" — navigation itself is a set-piece. |
| **S10** | **Loud kinetic + distortion typography** — oversized Syne headings; key words run a distortion/wave shader; scramble-decode on load, scroll, and hover; marquees that streak and flip with scroll. | Global / section headers | Type that "refuses to be ignored" (Obys / kinetic-type lane). |
| **S11** | **Throwable physics playground** — skill chips you grab, fling, and watch settle, self-healing back to a grid; draggable project cards; an idle easter-egg toy that wakes after a few seconds. | /about toolkit, /work, global | Tactile, memorable, "controlled chaos" — people stay and play (GSAP Draggable/Inertia/Flip, free). |
| **S12** | **GPU particle finale** — one flagship surface runs 200k+ compute-driven particles (WebGPU/TSL, ships inside three 0.184) forming the logo / "LET'S BUILD," morphing on interaction; graceful WebGL2 fallback. | Contact CTA | Particle counts impossible to fake in DOM = self-evidently real engineering. The closing argument. |

---

## 4. Per-page elevation — no route left at "fine"

- **`/` Home** — S1 3D hero you fly into · S2 velocity bus · S4 bloom · S6 horizontal work reel ·
  S5 flowmap covers · S10 loud headers + reactive marquee · loud impact-stats set-piece. *The site's overture.*
- **`/work` Index** — S5 flowmap on every cover · S11 draggable/throwable cards · S3 morphing
  cursor with "view" state · animated filter morphs (Flip) · ambient index numbers. *The proof, alive.*
- **`/work/[slug]` Case study** — cinematic WebGL cover hero (flowmap + ken-burns + bloom) ·
  oversized scrubbed results set-piece · S9 morph into the next project. *The depth.*
- **`/about`** — S7 particle portrait · S8 camera-flight training run · S11 throwable skill bag ·
  loud kinetic intro · cinematic timeline. *The person, as a system.*
- **`/services`** — bento tiles with live computational motifs (always-on, not hover-only) ·
  neon-glow hover · oversized header · a process visualization that draws on scroll. *The offer, animated.*
- **`/contact`** — S12 GPU particle finale behind the form · kinetic statement headline · charged
  focus states + satisfying submit animation. *The close, unforgettable.*
- **404 / error** — keep the branded "off the contour" pages; inherit the louder palette + glow.

---

## 5. The phased build plan

> Cadence: **one shippable loud move per phase → exit gate (build green + perf sane + RM/no-JS/
> responsive shots + no leaks) → owner reviews → next.** Foundation + the global "loud" layers
> first (they change everything beneath them), then page by page, riskiest GPU work last.

| # | Phase | Ships | Risk |
|---|---|---|---|
| **P1** | Velocity bus + GPU governance rig | `useVelocityBus` + `useWebGLVisibility`/FPS-guard + centralized `gsap.matchMedia` RM branches + leak counter extended to GPU. First proof: marquee + hero H1 react to the bus. | low |
| **P2** | 3D loss-landscape hero + bloom (S1, S4) | The Field becomes a 3D terrain you fly into on scroll; mouse-parallax camera; EffectComposer bloom/CA/grain; glowing descent path; H1 converges. | med |
| **P3** | Velocity bus everywhere (S2, S10) | Marquee speed+direction, headline skew/scale + `wght`, section-label streak; scramble-decode headers; reactive marquees. | low |
| **P4** | Gooey morphing cursor + magnetic (S3) | Liquid cursor with velocity stretch + contextual label morphs + trail; magnetic lean on all interactive elements. | low |
| **P5** | Liquid-metal page transitions (S9) | Shader block-dissolve / mercury wipe via View Transitions API + `flushSync`; scramble loading string; CSS-curtain RM fallback. | med |
| **P6** | WebGL flowmap on all imagery (S5) | DOM-synced WebGL cover planes inside the hero context; flowmap ripple + chromatic smear + hover displacement, on /work + home + case study. | med |
| **P7** | Horizontal cinematic work reel (S6) | Pinned lateral scroll act with parallax + scrubbed reveals over the flowmap covers; vertical-list RM/mobile fallback. | med |
| **P8** | Throwable physics playground (S11) | Draggable/Inertia/Flip skill bag + draggable cards + idle easter-egg toy. Zero new deps. | low |
| **P9** | Particle portrait (S7) | ~60–100k-point depth-map portrait (offline color+depth WebP), curl-noise drift, scatter→reform on CTA; poster fallback. | med |
| **P10** | Camera-flight training run (S8) | Pinned instanced 3D skill-graph; CatmullRom camera path on scroll; char-by-char copy in sync. | med |
| **P11** | GPU particle finale (S12) | WebGPU/TSL compute particles on /contact forming the logo; mouse repulsion; WebGL2 fallback; lazy, one route. | high |
| **P12** | /services + /work/[slug] elevation | Live bento motifs + neon hover (services); cinematic cover hero + scrubbed results + next-project morph (case study). | med |
| **P13** | Mobile parity + full QA + cleanup | Tuned mobile spectacle (scroll-driven CSS, lighter particles), full LH/A11y/leak/no-JS sweep, content swap-in, this board updated. | low |

> Recommended start: **P1 → P2.** P1 is the rig that lets every loud move run without killing the
> GPU; P2 (the 3D hero you fly into) is the single biggest "how is this real" and sets the tone.

---

## 6. Risk register (top items + mitigation)

1. **Multiple WebGL contexts killing the GPU / context-loss.** → Only on-screen canvases run;
   off-screen pause or unmount (P1 governance). Prefer rendering extra effects into the existing
   hero context; give the heaviest (finale, camera-flight) their own *route-scoped* canvas that
   unmounts the others. Cap `dpr`, FPS-guard the particle counts.
2. **Spectacle delaying load / LCP.** → Everything heavy lazy-mounts and *arms after first paint*;
   the first screen paints instantly. Retune anything that pushes LCP past ~2.5s.
3. **A11y regression from canvas text/imagery.** → DOM/text authoritative + visible; canvases
   aria-hidden; real headings under kinetic words; sr-only copy for aria-hidden statements
   (SplitText has put a prohibited `aria-label` on `<p>` twice here — watch it). Re-verify A11y=100 each phase.
4. **Scroll-jacking feeling trapped** (pinned hero, horizontal reel, camera-flight). → Lenis stays
   the single scroll source; use `scrub` not snap-traps; cap pin length; clear progress cues;
   native scroll under RM; never disable scroll on touch.
5. **Mobile reading cheap or janky.** → P13 is a dedicated parity pass; lighter particle counts +
   scroll-driven CSS + premium posters; mobile target ~80+, never broken.
6. **Scope: 13 loud phases is a lot.** → One move per phase with a hard exit gate; ship and review
   before the next; cut/reorder freely — the goal leads.
7. **New deps.** → WebGPU/TSL ship inside three 0.184 (no install); depth-map gen is offline (no
   runtime dep); flowmap/curl are inline GLSL; GSAP physics is free. Add `@react-three/postprocessing`
   for bloom (P2 — the one likely new dep) and avoid OGL (a 2nd WebGL pathway).

---

## 7. Reuse vs new

**REUSE:** the hero R3F Canvas + The Field shader (+ uniforms) — extend it; `HeroBackground` mount
gates; `SmoothScrollProvider` Lenis↔ticker sync (the bus reads here); `lib/gsap.ts` (jdFlow, DUR,
lazy free plugins); `Pin`/`RevealText`/`ClipReveal`/`FadeUp`/`LineDraw`/`Counter`;
`SlideText`/`ScrambleText`/`KineticHeadline`/`MagneticButton`; `PageTransition` (→ RM fallback for
the shader transition); `CustomCursor` (→ upgraded to the gooey morphing cursor); `lib/blur.ts` +
`image-blur.ts` (posters); `ScrollTriggerLeakCounter`.

**NEW:** `useVelocityBus` + `useWebGLVisibility`/FPS-guard (P1); a 3D-terrain Field + EffectComposer
bloom (P2, likely `@react-three/postprocessing`); flowmap RG ping-pong + DOM-synced plane (P6,
inline GLSL); offline depth-map gen + depth-particle component (P9); View-Transitions router shim +
shader morph quad (P5); a `SkillBag`/draggable system (P8, free GSAP); a CatmullRom camera scene
(P10); a `WebGPURenderer` gl-factory + TSL compute module (P11, inside three — no install).

---

## 8. Content / placeholder track *(runs alongside any phase)*

Placeholders allowed (V3-4), always flagged. **Blocked on Jay — the biggest single upgrade:**
- [ ] Real project **covers** → `public/images/projects/*` (placeholders in place; overwrite + re-run `scripts/gen-placeholders.mjs` to refresh the LQIP map).
- [ ] Real **profile photo** → `public/images/profile/jay.jpg` (drives the P9 particle portrait — ships from the `JD` placeholder until then).
- [ ] Real **testimonials** (6 placeholders) · replace the **3 placeholder projects** on /work.
- [ ] Confirm email / LinkedIn / Upwork URLs, timeline dates, the "50+ projects" claim.
- [ ] `RESEND_API_KEY` + verified `from:` domain; `NEXT_PUBLIC_SITE_URL`.

---

## 9. Reference sites (study the feeling + the technique)
Active Theory `activetheory.net` · Lusion `lusion.co` · Unseen `2025.unseen.co` · Cyd Stumpel
(SOTD solo dev) · Phantom.land particle face (Codrops "Invisible Forces") · Codrops "Cinematic 3D
Scroll with GSAP" (2025-11) + "Shader Uniforms to Clip-Path Wipes" (2026-05) · three.js
`webgpu_tsl_compute_attractors_particles` · Obys `obys.agency` · Lando Norris (SOTY, velocity bus) ·
Cuberto `cuberto.com` (morphing cursor) · Bruno Simon `bruno-simon.com` (the "navigation as game"
reference — we borrow the *energy*, not the literal car).

---

## 10. Definition of done (every effect)
1. Makes "a live ML system you can perturb" more visceral / attractive / fun — and is unmistakably intentional.
2. `transform`/`opacity`/`clip-path`/`filter`/uniforms only; RM + mobile paths designed in.
3. Only on-screen canvases run; LCP never covered on first paint; loads fast.
4. DOM/text authoritative; A11y = 100; CLS = 0.
5. Runs smooth on a real machine (desktop) / functional + bold on mobile; no leaks.
6. Copy in `content.ts`; no em/en dashes; placeholders flagged.

---

## 11. Status board

`[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

| Phase | Title | Status |
|---|---|---|
| P1  | Velocity bus + GPU governance rig | `[x]` |
| P2  | 3D loss-landscape hero + bloom (S1, S4) | `[x]` |
| P3  | Velocity bus everywhere (S2, S10) | `[x]` |
| P4  | Gooey morphing cursor + magnetic (S3) | `[x]` |
| P5  | Liquid-metal page transitions (S9) | `[x]` |
| P6  | WebGL flowmap on all imagery (S5) | `[x]` |
| P7  | Horizontal cinematic work reel (S6) | `[x]` |
| P8  | Throwable physics playground (S11) | `[ ]` |
| P9  | Particle portrait (S7) | `[ ]` |
| P10 | Camera-flight training run (S8) | `[ ]` |
| P11 | GPU particle finale (S12) | `[ ]` |
| P12 | /services + case-study elevation | `[ ]` |
| P13 | Mobile parity + QA + cleanup | `[ ]` |

### Changelog
- 2026-06-17 — V3 "Go Loud" plan. Recalibrated from the first (too-cautious) V3 draft: maximal
  posture, spectacle on every page, perf measured-not-capped (A11y 100 + CLS 0 held, mobile must
  stay functional). Old V2 trackers deleted.
- 2026-06-17 — **P1 DONE — velocity bus + GPU governance rig.** New `lib/velocity-bus.ts` (one
  imperative per-frame signal: smoothed scroll velocity + progress + direction, eased + decaying,
  on the GSAP ticker only while subscribed; `subscribeVelocity` for non-React consumers like the
  shader + `useVelocityFrame` hook, RM-gated). `lib/webgl-governance.ts` (`useInViewport`,
  `DPR_CAP`, `createFpsGuard` — the standard gate for every WebGL surface). `SmoothScrollProvider`
  feeds the bus every frame from the live Lenis instance off the ticker (robust to ref timing).
  `Marquee` is the first proof: velocity-reactive `skewX` streak on a wrapper (compositor-only,
  never overwrites the CSS loop), RM-off. `HeroBackground` adopts `useInViewport`.
  `ScrollTriggerLeakCounter` extended to log canvas + bus-subscriber counts. Also fixed a
  pre-existing `react-hooks/refs` lint error in `KineticHeadline` (render-time ref mutation →
  query chars in the effect). **Verified:** build + lint + tsc green; bus logic PASS via a
  deterministic tsx node test (peak velocity 44.5 under per-frame feed, decays to 0, progress/
  direction captured); RM path correct in a real prod-build browser (no skew, zero console/
  hydration errors). Note: the *visible* skew couldn't be exercised in headless because headless
  Chrome races `prefers-reduced-motion` emulation against hydration and the provider locks the RM
  decision — a test-harness limit, not a code issue (logic proven separately).
- 2026-06-17 — **P2 DONE, 3D loss-landscape hero + bloom (S1 + S4).** Rewrote `HeroShader` from a
  flat fullscreen quad into a real 3D terrain: a displaced plane mesh (vertex fbm = rolling hills
  sinking into a glowing basin), iridescent iso-contours (indigo/violet/cyan, crisp via `fwidth`),
  a light band sweeping ridges to basin (the optimizer descending; scroll advances it). A perspective
  camera DIVES from a wide establishing shot down toward the basin as you scroll the first viewport,
  plus desktop pointer parallax. Desktop-tiered: fine-pointer >=768 gets 96x128 segments + `dpr [1,2]`
  + an `EffectComposer` Bloom + Vignette (glow + edge-darkening that also protects headline contrast);
  mobile/coarse gets 40x56 + `dpr [1,1.5]` + no post (the audit profile measures the cheap path).
  Energy biased right via a screen-space `leftGuard` + `topGuard` so the left H1 column stays
  AAA-dark; distance fog fades far terrain to base. Added `@react-three/postprocessing@3.0.4` +
  `postprocessing@6.39.1` (compatible with R3F 9 / three 0.184 / React 19). Uses the P1 governance
  rig (`DPR_CAP`, `createFpsGuard` drops bloom on sustained frame strain). Still ONE WebGL context;
  lazy-mount + arm-on-interaction + off-screen-unmount unchanged. **Verified** (prod build, puppeteer
  + SwiftShader, desktop tier forced via a matchMedia patch): 3D terrain with glowing contours,
  camera dives on scroll, bloom + vignette glow, headline crisp on dark left, RM gives the iridescent
  gradient fallback (no canvas), **0 console + 0 shader-compile errors**; build/lint/tsc green. Bloom
  intensity (0.85) is tunable if more glow is wanted.
- 2026-06-17 — **P3 DONE, velocity bus everywhere + loud type (S2 + S10).** (a) `Marquee` converted
  from a CSS loop to a GSAP loop fully on the velocity bus: scroll velocity scales its speed and
  FLIPS direction (scroll up reverses it), plus the skew streak; static under reduced motion.
  (b) New `VelocityText` wrapper (compositor skewY from the bus, off under RM) applied to the two
  big home statements (ImpactStats + BentoCapabilities headings) so they lean as you scroll past.
  (c) New `ScrambleHeading` (decode-from-glyphs on scroll-in via the lazy ScrambleText plugin)
  replaces the plain RevealText h1 on /work, /about, /services (contact already has the kinetic
  headline) — the "site compiles itself" loud-type signature. a11y/LCP-safe: real text ships as an
  sr-only span (the accessible name + no-JS/SSR copy) with a separate aria-hidden visual span that
  scrambles; screen readers always read the real copy. **Verified** (prod build, puppeteer): SSR
  shows the correct sr-only + aria-hidden structure with real text, scramble resolves to the real
  heading on all three routes, the marquee GSAP loop animates, and **0 console/hydration errors**
  across / /work /about /services; build/lint/tsc green.
- 2026-06-17 — **P4 DONE, gooey morphing cursor + magnetic (S3).** Rewrote `CustomCursor` from a
  dot+ring into a liquid, morphing cursor driven by one `gsap.ticker` loop: an instant dot, a
  lagging ring that STRETCHES along its velocity (elongates + rotates toward motion, settles to a
  circle at rest), a soft trailing blob, and a contextual label (VIEW over project rows/cards, or
  any element's `[data-cursor-label]`). The ring is MAGNETIC — over a button/link it eases toward
  the element's center (0.45 pull) so the cursor "sticks". Kept the z-60 `mix-blend-difference`
  blend contract and the fine-pointer + hover + motion-safe mount gate (touch / reduced motion
  return null and keep the native cursor). **Verified** (prod build, puppeteer, fine-pointer forced
  via matchMedia patch): blend layer present at z-60 with `mix-blend-difference`, `has-custom-cursor`
  set, ring stretches on fast movement (peak scaleX/scaleY ratio 2.31), and on coarse-pointer the
  cursor is absent + the native cursor kept; **0 console errors** in both; build/lint/tsc green.
- 2026-06-17 — **P5 DONE, latent-space page transitions (S9).** Upgraded `PageTransition` from the
  single clip-path curtain into a BLOCK/TILE DISSOLVE: the curtain is a 10x6 grid of `--base` tiles
  that dissolve out in random ("decode") order (`gsap` grid stagger `from:"random"`, scale+autoAlpha)
  to reveal the new page, with an iridescent indigo->violet->cyan energy flash. Reads as morphing
  through latent space / the site recompiling itself. **Engineering call (documented deviation):**
  did NOT use the View-Transitions API or a 2nd live WebGL context (the plan's literal S9) — both
  are fragile here (VT-in-Next-App-Router + the one-context rule); a compositor-only CSS/GSAP
  dissolve is loud AND robust, and keeps the existing contracts intact. Kept: SIBLING-of-children
  blend-safe leaf (no mix-blend/isolation/opacity<1 at rest), first-paint-never-covered (prevPath
  null), RM/no-JS = identical markup + instant settle, and the route-reset (scroll-top + double-rAF
  ScrollTrigger.refresh + focus #main-content). **Verified** (prod build, puppeteer, real client nav
  via a footer link): first paint hidden, the curtain appears + tiles transform mid-nav, lands on
  /work with scrollY reset to 0 and activeEl = main-content, and reduced motion does an instant swap
  with the curtain staying hidden; **0 console errors** in both; build/lint/tsc green. View-Transitions
  shared-element morph stays available as a future polish. **Next: P6 (WebGL flowmap on all imagery).**
- 2026-06-17 — **P6 DONE, WebGL flowmap on all imagery (S5).** New `components/media/FlowImage.tsx`
  (mount gate) + `FlowImageCanvas.tsx` (R3F leaf, dynamic `ssr:false`). Each project cover gets a
  textured plane that renders the image as "data the page is processing": an always-on faint liquid
  shimmer (domain-warp) at REST so the screenshot stays legible, a travelling RIPPLE + chromatic
  (RGB) smear along the scroll axis whose amplitude is driven by the **P1 velocity bus**
  (`subscribeVelocity`), and a cursor-centred displacement "melt" + iridescent lens on HOVER
  (eased in/out). **Engineering call (documented deviation):** did NOT build the plan's literal S5
  (ONE full-screen canvas tracking every image's DOM rect). That fights our own governance rule
  (canvases unmount off-screen; /work has no hero context; the case-study cover is the priority/LCP
  image) and repeats the fragility P5 chose to avoid. Instead each cover is a SEPARATE governed
  canvas: mounts only while in view (`useInViewport`, 300px margin), `dpr` capped (`DPR_CAP`),
  `createFpsGuard` fades the canvas back to the still image on sustained frame strain (and stops the
  frameloop so the GPU work is actually shed, not just hidden behind opacity:0), and it ARMS after
  first paint (double-rAF) so it never competes with LCP/hydration. Desktop-gated exactly like the
  hero/cursor (fine-pointer + hover + >=768 + motion-allowed); coarse/mobile + reduced motion keep the
  crisp still image. The `next/image` underneath stays the authoritative SSR / LCP / no-JS / a11y
  layer (real alt, blur-up, `priority`) — the canvas is `aria-hidden` decoration over it. Wired into
  the home FeaturedStack covers and the case-study cover hero (priority/LCP). The /work index keeps
  plain `next/image`: its only desktop cover is the cursor-follow preview, which is
  `pointer-events-none` (the hover-melt could never fire) and swaps on every row hover (a WebGL canvas
  would churn GL contexts for no interactive payoff) — the flowmap belongs on the IN-PLACE covers. The
  small next-project card + the /work mobile thumb also stay plain (tiny / below the fold = off-budget
  for GPU). Marker `data-flow-canvas` added for the leak counter / verification. **Senior review
  (self) caught + fixed before commit:** (1) the orthographic Canvas was given manual frustum bounds
  (-1..1), but R3F resets the ortho frustum to PIXEL bounds on every resize — a fixed [2,2] plane
  would have rendered as a ~2px speck; fixed by scaling a unit quad to `state.viewport` each frame
  (resize-proof). (2) the FPS-guard strain path only set opacity:0, so the loop kept rendering at full
  cost; now it also stops the frameloop. **Verified** (prod build, puppeteer + SwiftShader): home
  desktop mounts 3 flow canvases over the 3 still covers; case-study desktop mounts 1 over the LCP
  cover with the real alt intact; a **pixel sample of the case-study canvas = 100% non-base color**
  (proves the plane FILLS the frame — the speck bug would have failed this); **reduced motion = 0
  canvases**; **mobile/coarse = 0 canvases** (still image kept in both); off-screen scroll UNMOUNTS the
  canvas (1 -> 0, governance proven, no GPU leak); **0 console + 0 shader-compile errors**; tsc + lint
  + build green. Note: the *animated* ripple/chroma/melt motion still wants a real-machine eyeball (the
  bus needs real scroll momentum + a real hover; headless can't drive those) — but plane-fills-frame +
  texture-renders are now proven, not assumed. Known tradeoff: the cover is fetched twice (next/image
  optimized URL + TextureLoader raw URL) — standard flowmap cost, the placeholder PNGs are tiny. Zero
  new deps (reuses three/R3F + the P1 bus + the P1 governance rig). **Next: P7 (horizontal cinematic
  work reel).**
- 2026-06-17 — **P7 DONE, horizontal cinematic work reel (S6).** New
  `components/sections/WorkReel.tsx` replaces the home sticky card stack (`FeaturedStack.tsx` deleted;
  it was fully superseded) as the featured-work treatment — the projects as "a film, not a list." On
  desktop + motion the section PINS and the vertical wheel drives a lateral journey: a track of
  full-height panels translates horizontally via a single scrubbed ScrollTrigger (`x: -(scrollWidth -
  innerWidth)`, pin length == that travel so 1px wheel ~ 1px lateral, no over-long pin). Lenis stays
  the single scroll source. Inside each panel the cover, copy, and a giant ambient index parallax at
  different rates as the panel crosses the viewport (`containerAnimation`-linked, compositor-only
  xPercent) for depth; a top progress bar tracks the journey so it never feels trapped (risk #4). The
  covers REUSE the P6 `FlowImage` (governed WebGL flowmap; still next/image underneath as SSR / a11y /
  LCP). `FeaturedWork` keeps its header OUTSIDE the pin trigger so it scrolls away before the reel
  pins. **Reduced motion + mobile = a normal vertical column** (no pin, no horizontal travel, no
  scroll-jack on touch). **Bug caught + fixed in-loop:** the row layout was first gated on `md:` alone,
  so reduced-motion on a DESKTOP viewport kept an unreachable horizontal row clipped by
  `overflow-hidden`; re-gated to `motion-safe:md:` (row only when motion is allowed AND >=768) so RM at
  any width falls back to the column. **Verified** (prod build, puppeteer + SwiftShader): desktop pins
  (position flips to fixed mid-scroll) and the track travels exactly 0 -> -2880 = scrollWidth(4320) -
  innerWidth(1440), progress bar fills 0 -> 1, pin RELEASES cleanly at the last panel (back to relative,
  no trap); reduced-motion desktop = `flex-direction: column` + no transform + no pin; mobile = column +
  no transform; off-screen scroll leaves 0 reel canvases (P6 governance still holds, no accumulation);
  **0 console errors**; tsc + lint + build green. Note: the *buttery-ness* of the parallax / scrub wants
  a real-machine eyeball (headless proves the transforms fire and the travel math is exact, not the
  feel). Zero new deps (GSAP ScrollTrigger pin + containerAnimation, all free). **Next: P8 (throwable
  physics playground).**
