# Portfolio Upgrade Plan — "Premium AI Engineer / Product Builder"

> Goal: make Jay Dhakan's portfolio feel **cinematic, premium, polished, and memorable** —
> wow factor without noise. Keep the dark cosmic identity, reduce visual noise, make
> spacing / typography / cards / animation feel intentional and high-end.

## Codebase reality check (research findings)

This is **not** a generic starter. It is a mature, heavily-tuned system. Honoring its
conventions is part of "premium" — fighting them would regress quality.

- **Framework:** Next.js 16 (App Router) + React 19, TypeScript, Tailwind **v4** (`@theme inline`).
- **Styling system:** OKLCH design tokens in `app/globals.css` (`--base / --surface / --elevated /
  --ink / --ink-dim / --accent / --accent-violet / --accent-cyan / --ok / --line`). Dark-only.
  Accent is the **indigo → violet → cyan iridescent duotone**, capped at ~5% of any viewport.
- **Motion stack:** **GSAP** (+ ScrollTrigger, DrawSVG, SplitText, Flip, ScrambleText, CustomEase,
  Draggable) via `lib/gsap.ts`, **Lenis** smooth scroll on the GSAP ticker, and **CSS**
  scroll-driven animations. **No framer-motion** — do not add it. Heavy plugins lazy-load behind
  `useExtraPlugins()`.
- **The "starfield"** the brief refers to is actually **"The Field"** — `components/three/LatentField*.tsx`,
  a governed React-Three-Fiber particle cloud (curl-noise flow → latent clusters, scroll-driven),
  fixed behind every route. One canvas per route (cardinal rule). Mobile / reduced-motion / no-WebGL
  get a static iridescent poster (`.hero-fallback`).
- **The "journey"** is `components/about/Geoline.tsx` on `/about` ("How I Got Here") — already a
  premium scroll-drawn SVG meridian with a glowing orb, igniting nodes, dotted connectors, and
  glass milestone cards that alternate left/right and collapse to a clean left-rail timeline on
  mobile. **Phase 3 is mostly a polish + consistency pass, not a rebuild.**
- **Work** lives in two places: home `FeaturedWork` → `WorkReel` (pinned horizontal cinematic reel)
  and `/work` → `WorkList` (hairline row list + cursor-follow preview). The brief's "project list +
  faint right-side preview" description maps to **`/work` `WorkList`** — that is where the new
  geoline/timeline interaction will live. The home reel is already a signature moment and will be
  polished, not replaced.

### Hard gates that must not regress
Lighthouse Perf ≥ 95 · A11y = 100 · CLS = 0 · `prefers-reduced-motion` honored everywhere ·
one WebGL canvas per route · motion uses transform/opacity/clip-path/filter/uniforms only
(never box-shadow / layout tweens) · all copy from `data/content.ts` · no em/en dashes.

---

## Phase 1 — Foundation, background, hero, global polish

### Design goals
- Calm, layered, cinematic background that recedes behind text (less noise, more depth).
- A hero that feels **balanced** on large screens: keep the headline, fill the empty right
  side with a relevant, custom, premium visual, and add **credibility proof** near the fold.
- Consistent eyebrows, readable body, intentional spacing rhythm and section separation.

### Files likely to change
- `components/three/LatentFieldCanvas.tsx` — particle count, flow speed, brightness.
- `components/three/LatentField.tsx` — vignette / depth-scrim layering, contrast guard.
- `app/globals.css` — vignette tokens, separator utility, type rhythm tweaks.
- `components/sections/Hero.tsx` — 2-column composition (left copy keeps LCP, right visual).
- `components/sections/HeroVisual.tsx` — **new** premium right-side panel (CSS/SVG, no canvas).
- `data/content.ts` — `hero.proof` credibility metrics + hero-visual copy (data-driven).
- `components/layout/Header.tsx` — minor CTA / active-state polish.

### Animation goals
- Background: **~40–60% fewer particles**, **~40% slower** curl flow, gentler scroll-velocity
  kick, slightly smaller / dimmer cores — calm cinematic drift, never jitter.
- Hero visual: subtle, intentional, looping-but-slow motion (a "live system" panel) that
  reinforces "I build products that ship" — fully CSS/SVG, `motion-safe` gated.
- Credibility metrics: reuse the existing scroll-counted `Counter` grammar.

### Responsiveness goals
- Hero: stacks cleanly on mobile (copy first, visual below or hidden if it crowds); the right
  visual never causes horizontal overflow; metrics wrap into a tidy 2×2.
- Background poster + vignette read well on every breakpoint.

### Performance risks
- Lowering particle count is pure win. Vignette = static CSS gradient (cheap).
- Hero visual must stay **CSS/SVG only** (no 2nd canvas, no heavy JS) to protect LCP/Perf.
- Keep the H1 the LCP element — the right visual must render after / beside it, not block it.

### Acceptance checklist
- [ ] Field is visibly calmer + sparser; text remains AAA-readable over it.
- [ ] Vignette / radial depth makes sections feel seated, not floating on noise.
- [ ] Hero is balanced on ≥1280px; right visual is relevant and premium, not filler.
- [ ] Credibility metrics present near the fold and count up on reveal.
- [ ] Reduced-motion: field poster + static hero visual; no animation.
- [ ] No horizontal overflow at 320 / 768 / 1280 / 1536px.
- [ ] Lint + build clean.

---

## Phase 2 — Work section: geoline / timeline wow factor (`/work`)

### Design goals
- Turn the flat `/work` row list into a **premium interactive project timeline** — "shipped
  systems connected as a product-building journey."
- Reuse the proven Geoline grammar (drawn meridian + orb + igniting nodes) adapted for projects.
- Project cards read like real shipped products; the preview becomes useful, not faint.

### Files likely to change / add
- `components/work/WorkGeoline.tsx` — **new** scroll-drawn SVG path + nodes + orb (desktop),
  clean vertical rail (mobile), arc-length node ignition (Geoline pattern).
- `components/work/ProjectCard.tsx` — **new** premium project card: index · title · category ·
  year · impact line · tech tags · arrow; hover glow / border / node activation.
- `components/work/ProjectPreview.tsx` — **new** (or reworked) floating preview panel that
  swaps on active/hovered project (product type · stack · result · cover/mock).
- `components/work/WorkList.tsx` — refactor into the geoline layout (keeps filters + Flip + a11y
  links + cursor-follow option), or is superseded by the three components above.
- `app/work/page.tsx` — wire the new timeline; keep `LatentField` constellation backdrop.
- `app/globals.css` — any shared geoline keyframes (reuse `geo-flow`).

### Animation goals
- Base path at low opacity; **active path draws with scroll progress** (DrawSVG, scrubbed).
- A small **glowing orb** rides the drawn leading edge.
- Nodes **activate** as their project enters view (hollow → lit, one-shot ping — Geoline style).
- Cards reveal smoothly on scroll; active card gets a restrained glow; arrow nudges on hover.
- Filtering still reflows with GSAP Flip and refreshes ScrollTrigger.

### Responsiveness goals
- Mobile: geoline collapses to a **clean vertical left-rail timeline**; cards full-width stacked;
  tags wrap; no horizontal overflow; preview becomes an inline thumb (no cursor-follow on touch).

### Performance risks
- Cache `getTotalLength()` once; never per frame. `getPointAtLength` ≤ 1/frame for the orb.
- Keep node ignition on the scrubbed timeline (no per-frame React state).
- Don't add a second canvas; preview stays `next/image` (no WebGL churn on hover swaps).

### Acceptance checklist
- [ ] A drawn guided line connects all projects; base + active path + orb + nodes present.
- [ ] Nodes ignite as their project reaches the orb; reverse on scroll up.
- [ ] Cards show index/title/category/year/impact/tags/arrow and feel clickable.
- [ ] Preview is legible and meaningful (no broken-looking low-opacity element).
- [ ] Mobile = clean vertical timeline, full-width cards, readable, no overflow.
- [ ] Filters + a11y (`<ol>`/links announced; SVG aria-hidden) intact; CLS = 0.
- [ ] Lint + build clean.

---

## Phase 3 — Journey polish, card system, motion / responsive / perf

### Design goals
- Bring the already-strong `Geoline` journey to final polish and ensure it shares one
  **consistent premium card/surface system** with the new Work cards.
- Site-wide: dark translucent surfaces, subtle borders, soft shadows, gradient highlights,
  restrained glow, consistent radius/padding, readable text — no cheap default boxes.

### Files likely to change
- `components/about/Geoline.tsx` — refinement only (spacing, glow restraint, active state,
  connector cleanliness); confirm mobile rail + reduced-motion.
- `components/about/Geoline.tsx` + `components/work/ProjectCard.tsx` — shared card surface
  tokens / utility (extract common glass-card classes if it reduces drift).
- `app/globals.css` — a small reusable `.glass-card` / surface helper if warranted.
- Light touch on other section cards (`BentoCapabilities`, etc.) for consistency.

### Animation goals
- Smooth reveals where useful; hover micro-interactions; active states for cards/nodes/buttons.
- Keep motion controlled; respect reduced-motion; reduce heavy work on low-power/mobile.

### Responsiveness goals
- Desktop cinematic, tablet preserves structure, mobile intentionally designed (not compressed).
- Fix awkward empty space, tiny text, overflow; all CTAs tappable.

### Performance risks
- No expensive scroll re-renders; reuse `useScroll`-equivalent (Lenis bus / ScrollTrigger).
- Keep the heavy GSAP plugins lazy; don't regress initial JS.

### Acceptance checklist
- [ ] Journey path is an elegant bezier with base + drawn active path + orb + igniting nodes.
- [ ] Journey + Work cards share one premium surface language.
- [ ] Card system consistent site-wide (radius, padding, border, glow restraint).
- [ ] Reduced-motion honored across new + existing motion.
- [ ] Responsive at 320 / 768 / 1024 / 1280 / 1536px; no overflow; CTAs tappable.
- [ ] `eslint .` clean · `npm run build` clean · no ScrollTrigger leaks across nav.

---

## Final checklist (before done)
- [ ] `PORTFOLIO_UPGRADE_PLAN.md` exists (this file).
- [ ] All three phases implemented.
- [ ] Work section has geoline/timeline interaction.
- [ ] Journey timeline cards look premium.
- [ ] Star/field background is slower + less noisy.
- [ ] Hero has stronger credibility proof + a better right-side composition.
- [ ] Mobile layout polished.
- [ ] Animations respect `prefers-reduced-motion`.
- [ ] Lint + build pass; errors fixed.

> This plan is guidance, not law. Improve the implementation where a better design or
> technical choice presents itself, and record notable deviations in the summary.

---

# PHASE 4 — TIMELINE REBUILD: "Synapse" (the living dendrite)

> Added 2026-06-27. The /about journey and /work list both still read flat. The user
> wants a BOLD serpentine that swings full-left to full-right down the page as you
> scroll, with tasteful gamification, on BOTH pages. This is a from-scratch rebuild of
> the timeline, chosen via a 5-concept design exploration + judge panel (see below).

## Decision (why this concept)

Five serpentine concepts were generated and judged on a "wow + fidelity to vision"
lens. **"Synapse — the living dendrite" won (9/10).** It is the most faithful
translation of the user's actual reference image (an organic winding line with
iridescent blobs clustered at the wide bends) into the site's native cosmic identity:
a synaptic vine swinging full edge to full edge, with glowing synaptic blooms at each
bend, that you watch WAKE UP synapse-by-synapse as a charge races down the wire. It is
uniquely on-brand for an AI/ML engineer whose entire site is a particle latent field.
Runner-up ideas were grafted in (below). Rejected: the "hand-drawn graphite wobble"
sketch (fights the premium/never-messy mandate) and a skeuomorphic XP/stamp HUD
(reads game-y/cheap).

Grafts folded into Synapse:
- **Constellation stitch** (from the cosmic-route concept): a faint straight chord
  ignites between each pair of consecutive fired synapses, so by the bottom of the
  scroll you have visibly DRAWN A SHAPE out of the milestones. The single best
  gamification payoff in the set; rendered as a distinct faint thin layer so it never
  reads as a path-drawing bug.
- **Banking orb** (from the expedition concept): the charge-orb leans into each turn
  (heading from a 2nd getPointAtLength sample + atan2) with a short cyan comet tail.
- **Ambient live counter** (de-risked, from the signal concept): one small mono chip
  "NODES LIVE 4 / 7" (/about) / "SYSTEMS LIVE 4 / 9" (/work) + a thin progress bar,
  driven by ONE CSS var + integer-only textContent writes from the single scrubbed
  onUpdate. NOT a packets/latency dashboard.

## Geometry (parameterized on n; CLS=0, zero JS measurement)

Reuse the proven trick: fixed SVG `viewBox "0 0 100 VBH"` inside a container with
`aspect-ratio: 100/VBH` (md+ only). A path point (x,y) maps to container percent
(x%, y/VBH*100%) with no measurement. Cards get `top:%` inline + a left/right lane
class; they ship visible.

- Constants: `CX=50`, `AMP≈32` (x swings ~18..82 — bold, with a card-safe gutter),
  `PAD=28`, `SEG≈40` (tall pitch so wide bends read calm). `VBH = PAD*2 + (n-1)*SEG`.
- Counts are REAL: **/about n=7, /work n=9** (every concept wrongly assumed 8 — fixed).
- Waypoints: `x_i = CX + AMP*cos(i*PI)` -> pure FULL alternation 82,18,82,18,... (no node
  sits center, unlike sin(i*PI/2) which center-crosses every odd node and reads as a
  timid weave). `y_i = PAD + i*SEG`, STRICTLY MONOTONIC — the load-bearing invariant
  that keeps the orb's arc-length->node bisection provably valid on a non-monotonic-x
  path. n=7 -> 6 lateral traversals; n=9 -> 8. Both exceed the "4-5 swings" ask.
- Path: cubic spline through the waypoints with HORIZONTAL-DOMINANT control handles
  (inverse of the rejected meridian's vertical handles) so the line bows boldly to each
  wall like a road, not a zigzag. Optional tiny seeded (NOT Math.random) per-node
  variation for organic life — kept minimal so it stays intentional.

## Choreography (ONE scrubbed ScrollTrigger; no per-frame React; glow = stacked strokes)

Armed only inside `gsap.matchMedia("(min-width:768px) and (prefers-reduced-motion: no-preference)")`
after `useExtraPlugins()` (DrawSVG) is ready. `getTotalLength()` cached once;
`nodeFrac[i]` via 18-step bisection on monotonic y.
1. **Draw** the vine: halo (wide, low-opacity) + core stroke `drawSVG 0->100%` together.
2. **Orb** on the same 0->1 clock: per frame ~2 `getPointAtLength` (position + heading
   sample) + 1 `setAttribute(transform translate/rotate)`; short cyan comet tail.
3. **Synapse fire** at each `nodeFrac[i]`: hollow indigo bead -> cyan core, one-shot
   radar ping (single tween, NEVER a looping CSS keyframe over the WebGL field),
   synaptic bloom brighten, dendritic stem draws to the card.
4. **Constellation chord** to the previous node draws in.
5. **Card reveal** at the same beat (autoAlpha + y/x slide-in from the bend side).
6. **HUD + active glow** in one `eventCallback("onUpdate")`: write `--draw`/`--live`
   CSS vars + integer-only counter textContent; toggle `.is-active` (CSS owns the glow
   cross-fade — box-shadow is NEVER tweened on scroll).
Backward scroll runs the whole timeline in reverse for free.

## Architecture (one engine, two data adapters — the real fix)

- **NEW `components/timeline/SerpentineTimeline.tsx`** (client): owns geometry, the SVG
  (vine base/glow/core/idle-current/gradient, synapses, blooms, constellation chords,
  stems, orb+tail), the one scrubbed timeline + nodeFrac, the HUD counter, the
  accessible `<ol>` wrapper + mobile left-rail, matchMedia/RM/CLS. Content-agnostic.
  Props: `count`, `renderCard(i, side, isActive)`, `hudLabel`, `hudUnit`,
  `dimmed?(i)`. The `<li>` CONTENT comes from `renderCard`.
- **`components/about/Geoline.tsx`** -> thin wrapper: maps 7 `TimelineEntry` + the KIND
  icon/tag map -> `renderCard` returns the glass journey card. No filter.
- **`components/work/WorkGeoline.tsx`** -> thin wrapper: holds filter state, maps 9
  `Project` -> `renderCard` returns the clickable `ProjectCard`; passes
  `dimmed=(i)=>!matches`; renders filter pills above. **Drops the sticky ProjectPreview**
  (a deliberate call: it competed with a full-width bold swing and was redundant with
  the rich card + the case-study page; removing it unifies /work and /about into ONE
  bold engine). `components/work/ProjectPreview.tsx` is DELETED.
- `ProjectCard.tsx` adapted for in-band placement (cover thumb only in the mobile
  rail-list). Home `WorkReel` is untouched (it is the signature, not a timeline).

## Responsive / RM / a11y / perf

- **Mobile/tablet <md:** the wide swing is impossible at 390px -> SVG is `hidden md:block`;
  fall back to the proven clean stacked `<ol>` with a left indigo->violet->cyan gradient
  rail + one bead per card. /work inlines a cover thumb; no horizontal overflow.
- **Reduced motion / no-JS:** the vine ships FULLY DRAWN and lit (synapses in their
  gradient position-color so the indigo->now narrative survives), cards visible (CSS
  placement, never gsap.set), orb/ping/comet `motion-reduce:hidden`, idle current
  `motion-safe:` only. A finished, beautiful static star-chart.
- **a11y=100:** one real `<ol>` (announced text /about; links /work); entire SVG +
  HUD aria-hidden; filter pills `role=group` + `aria-pressed`, spotlight is opacity
  only (dimmed cards stay focusable); DOM order = reading order regardless of L/R lane.
- **CLS=0 / Perf>=95:** aspect-ratio reserves height pre-paint; one ScrollTrigger;
  per-frame = a few getPointAtLength + setAttribute + CSS-var writes; ZERO blur on any
  scroll-animated layer (all glow = stacked SVG strokes + pre-rendered radial blooms);
  no second canvas.

## Acceptance checklist (Phase 4)

- [ ] Bold serpentine swings full-left to full-right on BOTH /about and /work (md+).
- [ ] Charge-orb travels on scroll, banking into turns, igniting each synapse on arrival.
- [ ] Constellation chords stitch between fired synapses; "NODES/SYSTEMS LIVE n/N" ticks.
- [ ] One shared engine; /about and /work differ only in data + card render-prop + filter.
- [ ] Geometry correct for n=7 and n=9; no card collisions; no horizontal overflow.
- [ ] Mobile = clean left-rail list; RM/no-JS = fully-lit static vine; a11y intact.
- [ ] CLS=0, no per-frame React in the scroll loop, no blur over WebGL, no looping ping.
- [ ] Lint + typecheck + build pass; verified via screenshots (desktop/tablet/mobile, motion+RM).
