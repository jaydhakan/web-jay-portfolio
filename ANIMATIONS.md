# Animation Catalog — current state, all pages

Full inventory of every animation/motion effect shipped on the site today, page by
page. Companion to `DESIGN.md` (which states *intent* — "one motion moment per
section"); this file is the exhaustive *implementation* list underneath that intent,
meant to be handed to another Claude session as design context (e.g. "here is
everything currently animated on the site").

## Stack

- **GSAP** (+ ScrollTrigger, SplitText, DrawSVG, Flip, ScrambleText, Draggable,
  InertiaPlugin, CustomEase) via `lib/gsap.ts`. Only core + ScrollTrigger + CustomEase
  register eagerly; the rest lazy-load post-mount.
- **react-three-fiber / Three.js** for every WebGL set piece (5 total: hero
  DescentArena, Flight backdrop, ParticleFinale, FlowImage cover flowmap, LatentField).
- **Lenis** smooth scroll, driven off the GSAP ticker — publishes a "velocity bus"
  (`velocity`, `progress`, `direction`) that several effects read.
- **Native CSS scroll-driven animations** (`animation-timeline: scroll()/view()`) for
  the hero parallax drift and the case-study cover's ken-burns zoom — zero JS cost.
- No framer-motion anywhere.
- **Design tokens:** durations `DUR = { micro: 0.4s, std: 0.8s, hero: 1.2s }`; easings
  `expo.out` / `cubic-bezier(0.16,1,0.3,1)` for all reveals, custom `jdFlow`
  (`CustomEase "M0,0 C0.7,0 0.18,1 1,1"`) reserved for the signature family (page
  wipe, preloader wipe, line-draws, clip-reveals). Scrubbed tweens use `ease:"none"`.
- **Universal rule:** every effect ships a fully visible/static fallback for
  reduced-motion, no-JS, and (for WebGL) mobile/no-WebGL/context-loss. Reveals always
  *enhance* already-visible markup — hidden start states are set at runtime by GSAP,
  never authored in CSS (no blank-section bug). CLS is 0 everywhere motion is added.

---

## Shared engine — "The Flight" (`lib/flight/*` + `components/flight/*`)

ONE engine, both content pages: **/work** (9 projects) and **/about** (7 career
epochs). It supersedes the Constellation Spine (`SerpentineTimeline`), the WebGL
`FlightBackdrop`, and the separate "Training Signal" loss curve — those told the
same story two or three times and are deleted.

A full-bleed 2D-canvas 3D flight. The camera flies a circular spiral; one beacon
(particle swarm + glowing core) sits at each station, offset alternately left and
right of the path. Scroll drives camera position; cards are DOM, positioned every
frame by projecting their beacon into screen space.

**Layout.** The flight is a STICKY SECTION, not a page-level fixed overlay: the
`<section>` is the scroll runway (height = `items × 105vh + 60vh`, set by the
engine) and the sticky child is the stage. Camera progress is section-relative,
so /about keeps its bio, toolkit, "How I Work" and CTA around the flight.

**Files.**
- `lib/flight/path.ts` — pure, allocation-free geometry: `path()`, `warp()`,
  `uToScroll()`, `updateCamera()`, `project()`. No DOM. Unit-tested (`npm test`).
- `lib/flight/engine.ts` — the imperative render loop. Owns the canvas and writes
  card/HUD/rail DOM directly; never calls setState.
- `lib/flight/tiers.ts` / `palette.ts` — quality ladder, canvas colour.
- `components/flight/*` — Stage (orchestrator), Canvas (engine lifecycle), HoloCard,
  FlightRail, FlightHUD, FlightFallback.
- `data/work.ts` / `data/about.ts` — typed projections of `data/content.ts`.

**Motion.**
- **Dwell-warped scroll** — `warp()` pins the camera for a readable beat at each
  station, then smoothsteps through transit. Monotonic; `uToScroll()` is its exact
  inverse at station centres (the round-trip the rail and deep links rely on).
- **Camera** — exponential damping (frame-rate independent), banking into turns,
  FOV stretch with speed, idle bob, cursor parallax (mice) or autonomous drift
  (touch).
- **Beacons** — swarm condenses on approach, arrival shockwave, lock-on reticle,
  cached radial bloom sprite blitted under `lighter` so a core reads as a light.
- **Tether** — animated dashed line beacon → card, with a packet running along it.
- **Constellation bridges** — faint arcs between nearby stations that share a link
  key (category on /work, `connections` tag on /about). The knowledge-graph idea
  from the old Spine, drawn in 3D.
- **Card materialise** — 3D tilt → quantised blur resolve → clip-wipe → glow flash
  → staggered children (WAAPI, all tracked and cancellable).
- **Warp burst** — a rail click or keyboard hop of >1 station spikes speed, so dust
  streaks, FOV punches and the chromatic split fire together.
- **Filter (/work)** — a staggered dim WAVE radiating from the camera's station;
  non-matching beacons dim to 18% AND their swarms scatter, in sync with the cards.
  (Re-flowing stations was rejected: it would renumber deep links mid-flight.)

**Performance** (all verified, see "Notes for design work"):
- Exactly ONE rAF; zero layout reads in the frame loop; diffed DOM writes; no
  per-frame allocation; dust bucketed into 6 prebuilt alpha bands.
- Parks the loop entirely — stops scheduling — when offscreen, scrolled past,
  below the breakpoint, or converged + idle 6s. Any input wakes it.
- 3-tier adaptive ladder seeded from `hardwareConcurrency`, demoting on rolling
  frame time. One-way ratchet per session.
- `transform`/`opacity` only; rail uses `scaleX`, never `width`; blur quantised to
  0.5px; `will-change` toggles with visibility.
- Dev overlay: `?flightdebug=1` (also exposes `window.__flight`).

**Fallback stack.** `FlightFallback` is ALWAYS in the DOM below the flight — real
headings, real links, correct order. It is the accessible content, not an error
state: screen readers and keyboard users (the card layer is `aria-hidden` with
`tabIndex={-1}` inside), no-JS and crawlers, <680px viewports, and anyone who uses
the "Skip the flight" link all land on it. Both pages fully prerender.

## Shared motion-primitive library (`components/motion/*`, reused across pages)

| Primitive | Effect | Mechanism |
|---|---|---|
| `RevealText` | Masked line/word rise-in on scroll (the sitewide reveal grammar) | GSAP SplitText, `yPercent 110→0`, `duration 0.8, ease expo.out, stagger 0.08`, once |
| `FadeUp` | Baseline reveal-on-scroll (subheadings, lists) | `opacity 0→1, y 24→0`, `duration 0.8, ease expo.out`, optional stagger, once |
| `ClipReveal` | Clip-path wipe reveal (grids/cards) | `clip-path inset(0% 100%→0%)`, `duration 0.8, ease jdFlow`, once |
| `LineDraw` | SVG stroke draw-on, entry or scroll-scrub mode | GSAP DrawSVG, entry: `duration 1.2, ease jdFlow, stagger 0.1`; scrub: tied 1:1 to scroll |
| `ScrambleHeading` / `ScrambleText` | Character-scramble decode into real text | GSAP ScrambleText plugin over an aria-hidden span (sr-only span carries real text) |
| `Counter` | Number ticks 0 → final value | GSAP tween on a plain object, `duration 1.2, ease power2.out`, writes `textContent` directly, once |
| `Teleprompter` | Words light up dim→bright as you scroll past | GSAP SplitText(words) + scrubbed color tween, `ease:none` |
| `ScrubReveal` | Scale + fade tied continuously to scroll (not once) | `gsap.fromTo(scale 0.86→1, autoAlpha 0.35→1)`, scrub |
| `VelocityText` | Heading skews with live scroll velocity | `skewY` written directly from the velocity bus, no GSAP |
| `Spotlight` | Cursor-tracked ambient radial glow | CSS custom properties updated via rAF-throttled pointermove |
| `KineticHeadline` / `HeroHeadlineKinetic` | Per-letter variable-font weight wave follows the cursor | `font-variation-settings` transition, gaussian falloff from cursor distance; each letter width-pinned so it never reflows |
| `SlideText` | Two-copy vertical slide swap on hover (nav links) | CSS transform, 450ms cubic-bezier |
| `MagneticButton` | Button is cursor-attracted within a radius | GSAP `quickTo` x/y, springs back on pointer-leave |
| `Button` (primary/ghost) | Controlled-neon glow bloom / fill-wipe / diagonal dual-arrow swap on hover | CSS transitions, opacity+scale only (never box-shadow tween) |
| `Skeleton` | Loading placeholder pulse | Tailwind `animate-pulse`, used in every route's `loading.tsx` |

---

## Global chrome (every page)

- **OpeningChoreo** — desktop-only, first-visit-only preloader: scramble-decodes
  "JAY DHAKAN", hairline bar draws, then a `jdFlow` clip-wipe exit overlaps an
  orchestrated hero entrance (nav slide, masked H1 line-rise, copy stagger). Mobile
  skips straight to the LCP-safe CSS entrance.
- **CustomCursor** — dot (fast lerp) + lagging, velocity-stretched ring + trailing
  blob, `mix-blend-difference`; magnetically pulled toward hovered interactive
  elements; scales up and shows a "VIEW" label over previewable cards. Desktop
  fine-pointer + motion-safe only.
- **PageTransition** — every client-side route change dissolves a 10×6 grid of tiles
  in random stagger order plus a radial flash, then scrolls to top and refocuses
  content. Skipped on first load and under reduced motion.
- **ScrollProgress** — top hairline bound 1:1 to scroll position (no easing).
- **Header** — sliding active-nav-link indicator dot (measured + CSS-transitioned),
  scroll-driven show/hide + blur chrome, mobile overlay with staggered link entrance.
- **Footer** — `KineticHeadline` CTA, `SlideText` nav links, scramble-decoded email,
  spinning `AvailabilityBadge` ring.
- **FilmGrain** — static noise texture, **not animated** (flagged because it's often
  mistaken for a live-grain effect).

---

## Home (`/`)

Render order: DescentArena (hero WebGL) → Hero copy → Marquee → ImpactStats →
FeaturedWork/WorkReel → BentoCapabilities → Process → Testimonials → TechStack →
CTABanner.

- **DescentArena — "The Field" (hero signature WebGL)**: ~14 simulated optimizer
  probes running live gradient descent across a shader terrain, leaving age-faded
  trails, flaring and respawning on arrival at the basin; cursor deforms the terrain
  as a "bump" the probes visibly swerve around; clicking spawns a new probe; camera
  pulls up into a top-down view as you scroll; bloom/vignette postprocessing that
  self-disables under frame strain.
- **Hero copy**: availability badge + pulsing dot fade in; H1 lines rise from masked
  overflow (desktop opening-gate only — mobile/repeat-visit ship static for LCP);
  subhead/CTA/proof-stats stagger in; whole copy column drifts up and dims via a
  **native CSS scroll-driven animation** as the first viewport scrolls away.
  `HeroHeadlineKinetic` adds the cursor-reactive per-letter weight wave.
- **Marquee**: infinite horizontal logo ticker, speed and direction coupled live to
  scroll velocity; a skew "streak" proportional to velocity.
- **ImpactStats**: velocity-skewed heading, line-reveal, a "before → after"
  transformation block with an underline that draws in, three stat tiles with
  count-up numbers, staggered fade-up.
- **FeaturedWork / WorkReel**: pinned horizontal scroll ("reel") on desktop — page
  scroll drives a GSAP-pinned track sideways past project panels, each layer
  (cover/copy/index number) parallaxing at a different depth; a scrub-bound progress
  bar; covers use the FlowImage WebGL flowmap. Mobile falls back to a plain vertical
  stack, no pin.
- **BentoCapabilities**: skewed heading + line-reveal, clip-wipe reveal across 5
  tiles, hover lift on every tile, and always-on ambient "computational motifs" per
  tile — an agent node-graph (flowing dashed edges + breathing nodes), a pipeline
  flow (3 dashed lanes), an API pulse (concentric rings, hover-triggered ripple), a
  live "15M+" ticking metric with a pulsing status dot, and chat typing dots
  (hover-triggered bounce).
- **Process**: steps stagger in with a connector line that fills right after
  (desktop: horizontal fill; mobile: vertical).
- **Testimonials**: heading line-reveal, each quote fades up individually.
- **TechStack**: heading reveal; a mouse-tracked circular color "spotlight" reveals a
  full-color duplicate of an otherwise grayscale logo grid, following the cursor via
  a CSS radial-gradient mask.
- **CTABanner**: two slow-drifting ambient gradient orbs (26s/32s loops), heading
  reveal, staggered fade-ups, magnetic primary CTA.

---

## About (`/about`)

- **Header**: scramble-decode H1.
- **Identity tile**: gradient overlay + ring color fade out on hover.
- **Teleprompter bio statement**: words light up dim→bright, scrubbed to scroll.
- **Contour divider**: 3 concentric circles stroke-draw, scroll-scrubbed.
- **"What I Work With"**: heading reveal, then `SkillBag` — a throwable chip cluster
  you can drag-and-fling with real inertia/momentum; chips pop on press, lean into
  the throw direction, settle on release, and self-heal back to their grid position
  via a `Flip` animation ~2.6s after being left idle. Static wrap-grid fallback on
  touch/no-motion.
- **"The Training Run"**: The Flight (see shared section) — the career timeline and
  the old loss curve merged into one converging orbit. Each epoch card carries a
  `LOSS x.xx` readout and a mini sparkline, both derived from one fitted
  exponential decay (2.41 → 0.09) in `data/about.ts`, so the readout and the curve
  can never disagree and adding an entry re-fits the whole run.
- **"How I Work"**: heading reveal, clip-wipe reveal across 3 value cards, icon
  lift + letter-spacing widen on hover.
- **Platform/social row**: icon hover color/background shift.

---

## Work — list (`/work`)

- **The Flight** (see shared section) IS the page: its intro carries the page's only
  `h1`, and the nine projects are its stations. The static header and the
  `ProjectCard` left column are gone.
- **Filter pills**: `aria-pressed` toggle; a staggered dim wave radiates from the
  camera's station, dimming non-matching beacons, swarms and cards in sync
  (opacity-only, no reflow, no renumbering).
- **Deep links**: `#station-N` (or `?station=N`) lands the camera on a project, and
  the hash follows the station in view via `replaceState`.

## Work — case study (`/work/[slug]`)

- **Back link**: hover color + arrow nudge.
- **Title**: `RevealText` masked line reveal.
- **Cover hero image**: duotone gradient overlay; **ken-burns slow zoom** driven by
  a native CSS scroll-timeline (zero JS, scales 1.001→1.08 as the image scrolls
  through view); layered with the `FlowImage` WebGL flowmap (ambient liquid
  shimmer, scroll-velocity ripple, cursor "melt" lens, chromatic/RGB smear) over the
  still `next/image`.
- **Results set-piece**: `ScrubReveal` (scale+fade tied continuously to scroll) around
  stat blocks, each stat is a `Counter` ticking 0→value once in view.
- **Next-project card**: thumbnail zoom, title color shift, arrow nudge — all
  hover-only CSS transitions.
- **CaseStudySidebar**: active-section indicator glides (CSS transform+height
  transition) as an IntersectionObserver flips which heading is "current."

---

## Contact (`/contact`)

- **Left column**: `Spotlight` cursor-tracked glow; `KineticHeadline` H1.
- **Subhead / availability / contact list**: staggered `FadeUp` entrances;
  availability dot pulses continuously.
- **"What happens next"**: heading + 3-step list stagger in.
- **ContactForm**: field focus glow transition; submit button glow+brighten on
  hover, press-scale, spinner while pending; on success, the whole panel rises in,
  a checkmark "pops" (overshoot-then-settle scale), radial glow appears behind it.
- **ParticleFinale** ("the closing argument," second-heaviest WebGL set piece): a
  GPU particle cloud scattered at rest that **forms into the wordmark text** when
  scrolled into view (particles sampled from a rasterized canvas of the logotype),
  with an ambient breathing drift and a cursor-repulsion force field pushing
  particles away from the pointer. The real DOM wordmark ghosts down to near-zero
  opacity only after the canvas actually renders its first frame (never before, to
  avoid an invisible-heading gap).

## Services (`/services`)

- **LatentField**: page-wide ambient WebGL particle background that morphs from a
  flow field at the top into clustered "latent" groupings by the footer, scroll-tied.
- **Header/subhead**: scramble-decode H1, fade-up subhead.
- **Pricing grid**: clip-wipe reveal across 3 plan cards; the highlighted tier gets
  an extra "growth ring" — 3 concentric circles stroke-drawing in on scroll entry.
- **Bento service grid**: clip-wipe reveal, hover lift + ring/background glow per
  tile, plus the same always-on ambient computational-motif system as home's
  BentoCapabilities (agent/pipeline/API/chat motifs — implemented separately here as
  `ServiceMotif`, visually consistent but a distinct component).
- **CTABanner**: shared with home (ambient orb drift, etc).

## Error & Not Found (`/error`, `/not-found`)

- Identical "off the mapped terrain" moment on both: a 3-circle contour-ring icon
  stroke-draws in, headline uses the standard `RevealText` word-reveal grammar,
  primary/ghost buttons use the standard hover treatments. No WebGL, fully static
  under reduced motion/no-JS.

---

## Notes for design work

- The only two WebGL "signature" moments per `DESIGN.md` are **The Field** (home
  hero) and **The Flight** (/about + /work) — everything else is intentionally
  restrained CSS/GSAP so those two don't get diluted. `ParticleFinale` (/contact)
  and `LatentField` (/services) are the next tier down in visual weight, not
  official "signatures."
- Reduced-motion/no-JS/mobile fallbacks are a hard requirement baked into every
  primitive above — assume any redesign must preserve a fully-static, fully-legible
  version of each effect, not just the animated happy path.
- All hover/press micro-interactions (button glows, card lifts, arrow nudges,
  link color shifts) are plain CSS transitions, not GSAP — cheap to restyle without
  touching animation logic.
