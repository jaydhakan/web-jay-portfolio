# Jay Dhakan Portfolio — V3 Phase 2: "Latent Space" Elevation Plan *(LOCKED)*

> The 13-phase V3 "Go Loud" build shipped + an R1 refactor (governed-canvas hooks). **This plan
> is the LOCKED direction for Phase 2** — the decision-making is done; what follows is the build.
> Done history (P1–P13 + R1) lives in git, not here. `DESIGN.md` / `PRODUCT.md` / `README.md`
> remain for context; where they disagree, this plan wins.

---

## 0. The locked decision

After an options pass (page-wide backdrop architectures A1–A3 × styles B1–B5, plus the "navigation
rewrite" concepts — infinite zoom / graph-as-nav — which were **rejected** for being unusable to a
recruiter and hostile to A11y/SEO/mobile), the owner locked this:

> **One latent-space particle system, three views. Particles FLOW as noise and CONVERGE into
> meaning** — chaos → structure — which *is* the "site compiles itself / the model learns" thesis,
> made literal for an AI/ML engineer.

- **Architecture: A1, on EVERY route (home, about, work).** A persistent, **page-wide** governed
  WebGL layer that **morphs by scroll** — fixed behind the *whole* page, top-to-bottom, **not** a
  hero trapped in one viewport. Each route runs exactly ONE such field (so the cardinal one-canvas
  rule holds); the per-page "scene" below is just *where/what* that page-wide field converges into.
- **Style: latent-space embedding cloud ⇄ curl-noise flow field.** These are **one engine** with two
  force modes; the morph between them is the signature. (B1 "flow" = the unlearned state; the cloud
  "clusters" = the learned state.)
- **Spread: one family, a different *scene* per page** (not identical, not three unrelated effects) —
  so the three pages tell one story.
- **Signature side-piece:** the /about career timeline becomes a **curved, interactive "geoline"
  trajectory** (left→right, not a straight rule).
- Build difficulty is **de-prioritized** (AI-assisted build). Mobile stays **functional via a static
  poster** (one media query, free) but the desktop spectacle is pushed hard.

---

## 1. North star (unchanged) — THE SITE COMPILES ITSELF

A portfolio that runs like a **live ML system you can touch.** Everything is driven from one shared
signal (Lenis velocity/scroll via the velocity bus): DECODE on load → CONVERGE on scroll → REACT to
the cursor → MORPH between states → CLOSE on a particle storm. The latent-space system below is the
purest expression yet: a visitor literally watches noise resolve into structure as they read.

**The only filter for any effect:** does it make "a live ML system you can perturb" more visceral,
attractive, or fun? If it could sit on any template, make it more on-concept or bigger.

---

## 2. The concept, made concrete — one system, three views

The whole site is **one neural/latent system**; each page is a different stage of it. Same visual DNA
everywhere (additive-glow particles, indigo→violet→cyan, soft round sprites), different *behavior* and
*target shape* per page:

| Page      | Particle behavior                                                                                                   | What it means                                                                 | Reuses                                                           |
|-----------|---------------------------------------------------------------------------------------------------------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------|
| **Home**  | starts as a **flowing field** at the hero → **converges into clusters** as you scroll to the footer (page-wide, A1) | "raw data → the model finds structure" — the whole-page convergence narrative | new `LatentField` (§4), built on the P9/P11 particle code        |
| **About** | the cloud **forms your face** (you, as data), and skill domains read as clusters around it                          | "you, embedded in the system"                                                 | reuses/absorbs `ParticlePortrait` as a `LatentField` face target |
| **Work**  | the field **settles into per-project clusters** you hover/click to open                                             | "your outputs, as points in latent space"                                     | `LatentField` + the existing `FlowImage` covers as node previews |

Every one of these is a **page-wide** field (fixed behind the whole route, top-to-bottom) — the
"behavior" column is what the *single* per-page field does as you scroll it, not a hero-only effect.
Plus the **geoline** on /about (§5, E3) and the already-in-family `/contact` particle finale +
`/services` node motifs, so the entire site reads as one language.

> **What gets replaced/absorbed (explicit, so one canvas per route holds):**
> - **Home:** the page-wide `LatentField` **replaces** the scoped P2 loss-landscape shader as the
>   home backdrop (loss-landscape code stays in the repo for reuse / poster inspiration).
> - **About:** the page-wide field **absorbs** the existing /about set-pieces into ONE field — the
>   `TrainingRun` "flight through molecules" canvas is retired (its molecule look becomes the
>   page-wide field's behavior) and `ParticlePortrait` becomes a *convergence target* within the same
>   field (the cloud forms the face where the portrait sits). No two live canvases on /about.
> - **Work:** the page-wide field sits behind the whole index and converges into the project clusters
>   at the grid; the `FlowImage` covers stay as the per-node hover preview.

---

## 3. Guardrails — every move obeys these (carried from the shipped build)

- **A11y = 100, CLS = 0, always.** DOM/text authoritative under every effect; canvases `aria-hidden`
  + `pointer-events-none`; a real heading under every kinetic/3D word; sr-only copy behind aria-hidden
  statements. (Footgun: SplitText has twice put a prohibited `aria-label` on a `<p>` here.) The
  interactive bits (Work clusters, geoline waypoints) keep a **real DOM control underneath** (link /
  button / list) — the canvas is decoration over a working, accessible page.
- **One governed WebGL context. NEVER a 2nd live `<Canvas>`.** Everything goes through
  **`useGovernedCanvas`** (`lib/webgl-governance.ts`): eligibility profile + WebGL probe + in-view +
  arm-after-paint, DPR-capped, FPS-guarded. Only the on-screen surface runs.
- **Load fast.** Heavy WebGL lazy-mounts + arms after first paint; never delay LCP past ~2.5s. The
  first screen paints the static poster instantly; particles ignite a beat later.
- **`prefers-reduced-motion` + mobile + no-WebGL = a premium static iridescent poster** for every
  particle surface (designed, not blank). Mobile is functional, never broken.
- **Animate `transform`/`opacity`/`clip-path`/`filter`/shader uniforms only.** Desktop perf measured,
  not capped.
- **Brand:** dark-first, electric-indigo + iridescent indigo→violet→cyan, controlled bloom;
  first-person voice; **no em/en dashes**; all copy in `data/content.ts`; placeholders flagged.

> Cadence: one shippable phase → exit gate (build/lint/tsc green + RM/no-JS/responsive checks + no
> leaks + A11y re-checked) → owner reviews on the real site → next.

---

## 4. Architecture — the shared `LatentField` rig *(built once in E1, reused by all)*

**New:** `components/three/LatentField.tsx` (mount gate via `useGovernedCanvas`) +
`LatentFieldCanvas.tsx` (R3F leaf, `dynamic ssr:false`). Generalizes the existing
`ParticlePortrait` / `ParticleFinale` particle code into one reusable system.

**Particle data (BufferGeometry):** per particle — `position` (live), `target` (cluster/shape goal),
`seed` (random, for per-particle phase), `cluster` (id → color). Custom `ShaderMaterial` points:
soft round sprite, additive blend for glow, color ramped indigo→violet→cyan by cluster/depth, real
`gl_PointSize` (needs a real GPU to read — same documented headless caveat as P9/P11).

**Per-frame force model (`useFrame`)** — the morph is the whole trick:
- **flow force** = `curlNoise(position, time)` → a velocity field (the B1 "flow" / unlearned state).
- **cluster force** = spring toward `target[i]` + mild jitter (the latent-space "learned" state).
- **blend** = `lerp(flowForce, clusterForce, progress)` where `progress` ∈ 0..1 comes from scroll
  (home: whole-page scroll; about/work: the section's in-view progress). `progress 0` = pure flow,
  `1` = settled clusters.
- **cursor force** = unproject the pointer to the particle plane; repel/attract within a radius
  ("you can perturb it"). Spring back when the cursor leaves.
- integrate + damping; writes go through a ref (immutability-lint-safe, matches `HeroShader`).

**Targets (the only per-page difference):**
- **Home:** K procedural Gaussian cluster centroids ("learned structure", abstract).
- **About:** sample the profile image → `target` = pixel positions, color = pixel color (reuse the
  `ParticlePortrait` sampler; swaps to a real depth map when Jay's photo lands).
- **Work:** one centroid per project; particles colored per project; a hovered/clicked cluster maps to
  that project (DOM `<a>` underneath does the real navigation).

**Governance & fallback:** `useGovernedCanvas` (one canvas, in-view mount, `DPR_CAP`, `createFpsGuard`
→ drop particle count + demand frameloop on strain), arm-after-paint. RM / mobile / no-WebGL render a
static iridescent poster (reuse `hero-fallback` / `lib/blur.ts`). On EVERY route the instance is
`fixed` page-wide behind the content (`-z`), `progress` driven by that route's whole-page scroll, with
a contrast guard (dim alpha behind text columns, like the hero's `leftGuard`) so copy stays
AAA-readable over every state.

---

## 5. The build phases *(locked, in order)*

### E1 — `LatentField` core + Home page-wide flow→converge backdrop  ·  *flagship, build first*
Build the §4 rig, then wire Home: one page-wide governed canvas, particles flowing (chaotic) at the
hero and **converging into clusters** down the page, scroll-driven via the velocity bus. Hero H1 +
all content stay authoritative on top. Retire the scoped loss-landscape as the home backdrop (keep the
code). **Exit gate:** desktop morph works end-to-end; static poster on mobile/RM/no-WebGL; LCP not
covered; A11y 100; no leaks. *Risk: med (scroll→progress driver + contrast over every state).*

### E2 — Work as a latent-space project constellation
Mount the **page-wide** `LatentField` behind the *whole* /work route (same A1 fixed backdrop as Home),
with `targets` = per-project clusters; as you scroll, the field converges so projects become hover/click
nodes (flowmap cover as the preview on hover/focus). The existing filter + row list stay as the **a11y /
mobile / no-JS fallback** (real links). *Risk: med. Depends on E1's rig.*

### E3 — About: one page-wide field (absorbs the portrait + molecules) + the **geoline** timeline
1. **Page-wide field:** mount the A1 `LatentField` behind the *whole* /about route. It absorbs the two
   existing /about canvases into ONE: the `TrainingRun` molecule-flight is retired (its look becomes the
   page-wide field's behavior) and `ParticlePortrait` becomes a **convergence target** within this same
   field (the cloud forms the face where the portrait sits, then reorganizes into skill clusters as you
   scroll). One canvas on /about.
2. **Geoline (the signature side-piece):** replace the short vertical `ExperienceTimeline` spine with a
   **curved, interactive trajectory** running **left→right** across the section — a wide SVG path that
   gently descends/curves like a loss/optimization curve (NOT a straight line). **DrawSVG-scrubbed** so
   it draws as you scroll; a soft **glow pulse travels along the path** (MotionPath) and a **marker
   glides** to the current epoch; each career entry is a **waypoint node ON the curve** that pops +
   reveals its card as the draw reaches it and **expands on hover/focus** (interactive); period numbers
   parallax above/below. Waypoint dots/edges use the same particle-family styling so it reads as one
   language. **Fallback:** RM / mobile / no-JS keep the readable timeline (real DOM; mobile may fall
   back to the vertical spine — confirm at build). *Reuse: GSAP DrawSVG + MotionPath (free, lazy).*
   *Risk: low–med.*

### E4 — Cohere the rest (echoes)
`/contact` already closes with the particle finale and `/services` has the node/data motifs — both are
already in-family. Add only quiet, *varied* echoes if a page still feels flat (e.g. a faint drifting
field behind a header), each governed, **one rich instance per route**. *Risk: low. Optional / last.*

### E5 — Housekeeping & lean-up
- [x] Dead-file cleanup (done): removed `Card`/`Pin`/`Parallax`/`AnimatedText`, the pnpm lockfiles,
  `scripts/screenshot.mjs`, the temp `udpated_plan.md`. (npm is canonical.)
- [x] `next/image`: explicit `formats` (AVIF/WebP) + `qualities: [75]` allowlist in `next.config.mjs`.
- [x] Reconcile the stale README "Lighthouse ≥95 hard gate" line (now: A11y=100 + CLS=0 hard, perf
  measured-not-capped) + the stale "one hero shader" line (now the page-wide `LatentField`).

### Side animations / micro-delights *(small, on-concept, optional — pick as we go)*
- **Geoline** (E3) — the headline one, above.
- **Connective edges:** thin lines that *draw* between sections as you scroll (the network wiring
  itself) — pairs with the latent-space language.
- **Cursor perturbs the field:** the custom cursor seeds a small ripple into `LatentField` ("you can
  touch it") — reinforces the thesis cheaply.
- **"Compute-up" counters:** stat numbers tick up with a brief monospace scramble.
- **Token-index section labels:** section eyebrows decode from glyphs on enter (reuse `ScrambleHeading`).

---

## 6. Content / placeholder track — BLOCKED ON JAY *(runs alongside any phase)*
- [ ] Real project **covers** → `public/images/projects/*` (re-run `scripts/gen-placeholders.mjs` after).
- [ ] Real **profile photo** → `public/images/profile/jay.jpg` (drives the About face target).
- [ ] Real **testimonials** (6 placeholders) · replace the **3 placeholder projects** on /work.
- [ ] Confirm email / LinkedIn / Upwork URLs, timeline dates, the "50+ projects" claim.
- [ ] `RESEND_API_KEY` + verified `from:` domain; `NEXT_PUBLIC_SITE_URL`.

---

## 7. Definition of done (every phase)
1. On-concept (a live ML system you can perturb), unmistakably intentional.
2. `transform`/`opacity`/`clip-path`/`filter`/uniforms only; RM + mobile poster designed in.
3. Goes through `useGovernedCanvas`; one canvas per route; LCP never covered on first paint.
4. DOM/text authoritative; interactive 3D has a real DOM control underneath; A11y = 100; CLS = 0.
5. Smooth on desktop; functional + posters on mobile; no leaks (leak counter flat across nav).
6. Copy in `content.ts`; no em/en dashes; placeholders flagged.

---

## 8. Reference sites (the feeling + the technique)
Lusion `lusion.co` (liquid/particle shaders) · Active Theory `activetheory.net` (cinematic scroll) ·
Lando Norris / OFF+BRAND (2026 SOTY) · Codrops particle / "Invisible Forces" (Phantom.land face) +
"Horizontal Parallax Gallery: DOM→WebGL" (2026-02) · three.js
`webgpu_tsl_compute_attractors_particles` · t-SNE / UMAP embedding visualizations (the latent-space
clustering reference) · Cuberto `cuberto.com`.

---

## 9. Status board

`[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

| Phase | Title                                                                | Status               |
|-------|----------------------------------------------------------------------|----------------------|
| E1    | `LatentField` core + Home page-wide flow→converge backdrop           | `[x]` shipped → review |
| E2    | Work: page-wide field → project constellation                       | `[x]` shipped → review |
| E3    | About: one page-wide field (absorbs portrait+molecules) + **geoline** | `[x]` shipped → review |
| E4    | Cohere the rest (contact/services echoes)                            | `[x]` shipped → review |
| E5    | Housekeeping & lean-up                                               | `[x]`                |
| —     | Content / placeholders                                               | `[!]` blocked on Jay |

**Build order:** **E1 (Home, flagship) → review on the real site → E3 (geoline + portrait) → E2 (Work
constellation) → E4 → E5.** E1 first because it builds the shared rig everything else reuses and sets
the palette/feel.

---

## 10. Changelog
- 2026-06-18 — **Phase 2 build COMPLETE (E2, E4, E5).** *E2 (Work):* added a **"constellation"**
  layout (many tight near-point clusters spread wide = "your outputs as points in latent space") and
  mounted the page-wide `LatentField` (clusterCount = projects.length) behind the whole /work route;
  `WorkList` stays the interactive + a11y layer (real links / filter / flowmap preview) — no
  clickable-particle nav (rejected as recruiter/A11y-hostile). *E4 (cohere the rest):* mounted a quiet
  default-scatter `LatentField` on /services (ambient behind the opaque cards) so all four content
  routes speak one language; **/contact left as-is** (its particle finale is the in-family piece; a
  field there would be a 2nd live canvas). *E5 (housekeeping):* `next.config.mjs` → `images.formats`
  AVIF+WebP and `qualities:[75]`; reconciled the README (dropped the stale ≥95 hard-gate line → A11y=100
  + CLS=0 hard, perf measured-not-capped; updated the stale "one hero shader" line to the page-wide
  `LatentField`). **All five Phase-2 phases (E1–E5) now shipped to main; pending owner real-site
  review. The "Latent Space" plan is fully built.** Remaining: §6 content track (BLOCKED ON JAY — real
  photo unlocks the field's face-target on /about; real covers/testimonials/URLs).
- 2026-06-18 — **E3 shipped (About), two commits.** *E3a:* generalized the rig with a cluster
  `layout` ("scatter" = Home unchanged; **"radial"** = About: a dense core + ring of satellites =
  "you, embedded, skill domains around you"); mounted the **page-wide `LatentField` (radial)** behind
  the whole /about route; **retired the two extra /about canvases** to hold the one-canvas rule —
  `TrainingRun`'s pinned WebGL camera-flight is gone (rewritten as a static transparent narrative
  section, epochs in translucent cards the field glows through; its molecule look is now the field's
  behavior), and the headshot tile renders the still `next/image` (the cloud-forms-the-face gag moves
  into the page-wide field, ready to sample the real photo when it lands). `TrainingRunCanvas` /
  `ParticlePortrait` kept in the repo. *E3b:* the **geoline** — `components/about/Geoline.tsx`
  replaces `ExperienceTimeline`: a curved SVG loss-trajectory (Catmull-Rom through evenly-spaced
  waypoints, descends + arcs — NOT a straight line) that **DrawSVG-scrubs** as you scroll, a cyan glow
  **marker glides** along the real curve (`getPointAtLength`), and each entry is a **waypoint node that
  pops + reveals its card** at its fraction of the draw (cards lift on hover). Particle-family accent +
  glow. **No MotionPath** (deliberate — used native `getPointAtLength` instead; MotionPath isn't in the
  lazy chunk). Fallback: mobile = clean vertical list, RM/no-JS = full static curve + visible entries
  (R7). Build/lint/tsc green. *Pending owner real-site review.*
- 2026-06-18 — **E1 shipped (Home).** Built the shared rig: `components/three/LatentField.tsx`
  (page-wide `fixed -z-10` governed mount gate + `.hero-fallback` static poster) +
  `LatentFieldCanvas.tsx` (R3F leaf). One WebGL2 point cloud morphs **curl-noise flow → latent
  clusters** entirely in the vertex shader (uniform-driven, no CPU particle loop), driven by the
  velocity-bus page `progress` (settles ~85% down so the footer is calm); cursor perturbs it via a
  window listener (canvas is `pointer-events-none`). Glow is additive soft-halo sprites — **no
  post-process Bloom** (kept the canvas transparent so the iridescent poster shows through, and cut
  the continuous full-page cost; the FPS guard sheds point size on strain). Wired into `app/page.tsx`;
  **retired the loss-landscape hero backdrop on home** (removed `HeroBackground` + the hero's local
  `.hero-fallback` from `Hero.tsx`; `HeroBackground`/`HeroShader` kept in the repo). `OpeningChoreo`
  now reveals the page-wide poster (its `.hero-fallback` query resolves to the field's poster).
  Build/lint/tsc green; mobile/RM/no-WebGL = static poster. *Pending owner real-site review before E2/E3
  reuse the rig.*
- 2026-06-18 — **Phase 2 LOCKED: "Latent Space".** Resolved the options pass to one decision: a single
  governed particle system that **morphs between a curl-noise flow field (B1) and a latent-space
  embedding cloud**, page-wide (A1), spread as **one family / a different scene per page** across home
  (flow→converge backdrop), about (you-as-face + skill clusters), and work (project clusters you
  explore). Rejected the navigation-rewrite concepts (infinite zoom, graph-as-nav) as recruiter-/
  A11y-/SEO-hostile. Added the **geoline**: the /about career timeline as a curved, interactive,
  left→right trajectory. Rewrote `plan.md` from an option menu into this locked implementation plan
  (shared `LatentField` rig in §4; phases E1–E5 in §5). Home's page-wide field will replace the scoped
  loss-landscape hero (code kept). No feature code written yet — E1 is next.
- 2026-06-18 — **Clarified per owner: WHOLE-PAGE on EVERY route, not hero-only.** The field is A1
  page-wide (fixed, top-to-bottom) on home, about, AND work — each route's per-page "scene" is just
  where its single page-wide field converges. Consequence locked: /about's two existing canvases fold
  into the one page-wide field (`TrainingRun` molecule-flight retired into the field's behavior;
  `ParticlePortrait` becomes a convergence target), and /work's page-wide field sits behind the whole
  index with `FlowImage` covers as per-node previews. Still one live canvas per route.
