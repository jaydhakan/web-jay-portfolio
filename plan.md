# Jay Dhakan Portfolio — V3 Phase 2: Pending Elevation Plan

> The 13-phase V3 "Go Loud" build **shipped** (every route has its flagship moment, one
> ML-system concept throughout, A11y 100 + CLS 0, governed GPU, designed RM/mobile/no-JS
> fallbacks) plus an **R1 refactor** (governed-canvas hooks + design-taste fixes).
>
> **This plan tracks ONLY what is still pending** — the post-launch elevation moves and
> housekeeping. The full done-history (P1–P13 + R1) lives in git; it is not repeated here.
>
> `DESIGN.md` (shipped baseline system) · `PRODUCT.md` (brand/users) · `README.md` remain for
> context. Where they disagree with this plan, **this plan wins.**

---

## 1. North star (unchanged) — THE SITE COMPILES ITSELF

> **A portfolio that runs like a live ML system, and you can touch it.**

Every effect is one ML system in motion, driven from one shared signal (Lenis velocity/scroll
via the velocity bus): the site **DECODES** on load, **CONVERGES** on scroll, **REACTS** to the
cursor, **MORPHS** between states, and **CLOSES** with a GPU particle storm. The visitor *feels* a
living, converging system the whole way down — the medium proves the message.

**The only filter for any new effect:** does it make "a live ML system you can perturb" more
visceral, more attractive, or more fun? If it could sit on any template, it is not on-concept
enough — make it on-concept or make it bigger.

---

## 2. Guardrails — every pending move obeys these (carried from the shipped build)

These are the rig that lets "loud" stay shippable. Non-negotiable.

- **A11y = 100, CLS = 0, always.** DOM/text is authoritative under every effect: WebGL is
  `aria-hidden` + `pointer-events-none`; a real heading lives under every kinetic/3D word; sr-only
  copy backs every aria-hidden statement. (Footgun watch: SplitText has twice put a prohibited
  `aria-label` on a `<p>` here.) Re-verify A11y each phase.
- **One governed WebGL context. NEVER a 2nd live `<Canvas>`.** Every WebGL surface goes through
  **`useGovernedCanvas`** (`lib/webgl-governance.ts`): it resolves eligibility (`"desktop-fine"` /
  `"desktop-motion"` profiles) + WebGL probe + in-view + arm-after-paint, is DPR-capped and
  FPS-guarded. Only the on-screen surface runs; every other heavy surface is a static poster. Two
  contexts = doubled memory + context-loss risk.
- **Load fast.** Heavy WebGL/particles lazy-mount and arm after first paint; the first screen
  paints instantly. Anything that pushes LCP past ~2.5s is retuned, never shipped.
- **`prefers-reduced-motion` is a real, designed path** (`gsap.matchMedia`) — a premium static
  iridescent poster for every WebGL set-piece.
- **Mobile is bold, not broken.** Tuned spectacle (lighter particles, native scroll-driven CSS,
  no scroll-jacking on touch); never a stripped or janky desktop. Target ~80+.
- **Animate `transform`/`opacity`/`clip-path`/`filter`/shader uniforms only.** Never
  width/height/margin. Desktop perf is measured, not capped.
- **Brand:** dark-first, electric-indigo + iridescent indigo→violet→cyan, controlled bloom;
  first-person voice; **no em/en dashes**; all copy in `data/content.ts`; placeholders flagged
  (`TODO(JAY)` / `isPlaceholder`), never silently faked.

> Cadence (unchanged): one shippable move per phase → exit gate (build green + RM/no-JS/responsive
> shots + no leaks + A11y re-checked) → owner reviews → next. Cut/reorder freely; the goal leads.

---

## 3. Pending elevation moves (prioritized)

> Renumbered + deduped from the owner's earlier P14–P17/OPT notes: the page-wide-home want and the
> "molecules everywhere" want were the same idea (now **E1**); the "sticky timeline" and "trajectory
> line" wants were both the /about timeline (now **E3**). Mapping: **E1** = old P16 + P17·Part-1 ·
> **E2** = old P14 · **E3** = old P15 + P17·Part-2 · **E4** = old P17·Part-1 (other-pages remainder) ·
> **E5** = old OPT.

### E1 — Home: one page-wide 3D animation *(the headline ask — gated on an owner pick)*
**Why:** the home 3D Field is trapped in the first viewport (it unmounts on scroll; below the fold is
flat `bg-base` + grain), so the "wow" dies after one screen. The owner wants **one rich 3D animation
in the spirit of the /about "molecules"** (alive, depthy, indigo→cyan) running across the **whole home
page**. The 2026 award winners read as one continuous living environment top to bottom.
**Ship:** ONE governed, page-wide WebGL backdrop that **morphs by scroll progress** instead of
unmounting (hero = its first state; it evolves down to a convergence at the footer). Still one
context, DPR-capped, FPS-guarded, in-view/strain aware; text contrast preserved over every state; RM
/ mobile / no-WebGL = a static iridescent gradient.
**Decision required first:** pick an architecture × style from the **option menu in §4**. Lead recs:
**A1 + B5** (the node-field they liked, made page-wide — most literal to the ask) or **A1 + B4** (the
loss-landscape you descend — most on-concept), with **A1 + B2** as the lowest-risk loud option.
**Risk:** med–high (scroll→uniform driver + a section state machine; contrast over every state).

### E2 — /work: WebGL cover gallery
**Why:** /work is the *proof* page but shipped as a flat hairline row-list — the flowmap covers only
appear in a small cursor-follow preview, so the proof has no wow.
**Ship:** covers become a responsive **WebGL grid** — each plane parallaxes within its frame on scroll
(lerp-smoothed) and ripples/melts on hover (**reuse the P6 `FlowImage` flowmap shader**), with a
drag-nudge. The filter + row list stay as the **a11y / mobile / no-JS fallback**.
**Reuse:** `FlowImage`/`FlowImageCanvas` shader, `useGovernedCanvas`. **Risk:** med. Independent of
E1 — buildable now.

### E3 — /about: timeline as an animated horizontal trajectory
**Why:** the "How I got here" timeline is a standard short vertical spine. The owner wants the line
made **longer, horizontal left→right, trajectory-style, animated**, and the entries to reveal as you
scroll.
**Ship:** replace the `ExperienceTimeline` spine with a wide **DrawSVG-scrubbed trajectory** sweeping
left→right and gently descending like a loss/optimization curve (on-concept: "the path that
converges"); a soft **glow pulse travels along it** and a **marker glides** to the current epoch. Each
entry becomes a **waypoint node ON the curve** that pops + reveals (sticky scroll-reveal: dim→vibrant
as it crosses center); period numbers parallax above/below. Waypoint dots/edges use the same
node-graph styling as the E1/E4 motif so it reads as one language.
**Fallback:** RM / mobile / no-JS keep the readable timeline (mobile may fall back to the vertical
spine — confirm at build). **Reuse:** DrawSVG (already in the lazy GSAP chunk). **Risk:** low–med.
Independent of E1 — buildable now.

### E4 — Same 3D family, quieter, on the other routes *(depends on E1's pick)*
**Why:** the owner wants "more of THAT kind of 3D" elsewhere — **varied, not copy-pasted**.
**Ship:** extract the shared rig from E1/`TrainingRunCanvas` (palette, instancing, DPR/FPS guard,
in-view mount, SVG poster) and place a *different, quieter* member of the same 3D language per page:
e.g. /work a slow drifting node-field behind the header; /contact a 3D field that **resolves INTO the
P11 particle finale**; /services keep the P12 tile motifs + at most a faint depth layer. **ONE rich
instance on screen at a time** — the rest are static posters (the strain rig enforces it).
**Risk:** med. Do after E1 so they echo the chosen home system; if E1 ships a page-wide backdrop,
fold these in rather than running separate canvases.

---

## 4. The E1 decision — page-wide home backdrop option menu

Nothing here is built; the owner picks **one architecture (A) × one style (B)**.

**Part A — how far the backdrop reaches**
- **A1 — Persistent page-wide WebGL backdrop *(recommended)*.** One governed canvas `position:fixed`
  behind the entire page that **morphs section-to-section by scroll progress** instead of unmounting.
  Reads as "one system converging." Most ambitious (needs a scroll→uniform driver + state machine +
  contrast care over every state).
- **A2 — Keep the heavy hero scoped; add a CHEAP always-on ambient layer below.** Hero stays the
  one-viewport 3D Field; a cheap layer (aurora / drifting gradient mesh / faint particles) keeps the
  rest of the page from going flat. Lowest risk; reads as "atmosphere," not "one world."
- **A3 — Hybrid.** A1's fixed canvas, but rich only in the hero viewport and a quiet ambient mode for
  the rest of the scroll — alive everywhere, GPU spent where the eye is. Mid cost.

**Part B — which animation drives it** *(any runs under A1/A2/A3)*
- **B1 — Flowing GPU particle field (curl-noise).** Tens of thousands of particles flowing + reacting
  to cursor/scroll, recoloring per section. Very alive, dead-on concept. *Reuses the P9/P11 stack.*
  Cost med–high; needs a real GPU to read.
- **B2 — Liquid/metaball iridescent shader.** Full-screen frag shader, indigo→violet→cyan blobs that
  morph toward the cursor. **Cheapest page-wide WebGL**, renders fine headless. Cost low–med.
- **B3 — Aurora / gradient-mesh drift.** Soft animated gradient mesh (Stripe/Linear grade but bolder).
  Extremely cheap, trivial static fallback. Best as the A2 ambient layer or the universal RM/mobile
  fallback for the others.
- **B4 — Loss-landscape, made page-wide.** Keep the P2 3D terrain but **fly the camera THROUGH it down
  the whole page**, converging to the basin at the footer. Most on-concept, **reuses P2**. Cost med.
- **B5 — Page-wide node-FIELD (the "/about molecules", whole-page).** The exact node-graph texture the
  owner liked (instanced nodes + edges, indigo→cyan) as the page-wide backdrop, **densifying /
  reorganizing by scroll** (sparse hero → connected mid-page → converged cluster at footer),
  cursor-reactive. Most literal to the ask. **Reuses the `TrainingRun` rig.** Cost med.

**Recommendation:** **A1 + B5** (closest to "put that molecules animation across the whole home page")
or **A1 + B4** (most on-concept); **A1 + B2** as the lowest-risk loud option; **A2 + B3** as the safe
"never go flat" minimum. All keep one governed context, DPR cap + FPS guard, preserved text contrast,
and a static iridescent-gradient fallback.

---

## 5. E5 — Housekeeping & lean-up

- [x] **Dead-file cleanup (done in this pass):** removed unused components `Card`, `Pin`, `Parallax`,
  `AnimatedText`; the unused `pnpm-lock.yaml` + `pnpm-workspace.yaml` (npm is canonical — Dockerfile
  `npm ci`, README all-npm); the dev-only `scripts/screenshot.mjs`; and the temp `udpated_plan.md`.
- [ ] **`next/image` config:** set explicit `formats` (AVIF/WebP) + a sensible `quality` default in
  `next.config.mjs`.
- [ ] **Doc reconcile:** the README still implies a "Lighthouse ≥95 hard gate" — V3-3 dropped the cap
  (perf is measured, not capped). Reword to match.

---

## 6. Content / placeholder track — BLOCKED ON JAY *(runs alongside any phase)*

The single biggest polish upgrade; blocks nothing technical, but caps how finished the site looks.
- [ ] Real project **covers** → `public/images/projects/*` (placeholders in place; overwrite + re-run
  `scripts/gen-placeholders.mjs` to refresh the LQIP map).
- [ ] Real **profile photo** → `public/images/profile/jay.jpg` (drives the particle portrait — ships
  from the `JD` placeholder until then).
- [ ] Real **testimonials** (6 placeholders) · replace the **3 placeholder projects** on /work.
- [ ] Confirm email / LinkedIn / Upwork URLs, timeline dates, the "50+ projects" claim.
- [ ] `RESEND_API_KEY` + verified `from:` domain; `NEXT_PUBLIC_SITE_URL`.

---

## 7. Definition of done (every pending effect)
1. Makes "a live ML system you can perturb" more visceral / attractive / fun — unmistakably intentional.
2. `transform`/`opacity`/`clip-path`/`filter`/uniforms only; RM + mobile paths designed in.
3. Goes through `useGovernedCanvas`; only on-screen canvases run; LCP never covered on first paint.
4. DOM/text authoritative; A11y = 100; CLS = 0.
5. Runs smooth on a real machine (desktop) / functional + bold on mobile; no leaks (leak counter flat).
6. Copy in `content.ts`; no em/en dashes; placeholders flagged.

---

## 8. Reference sites (study the feeling + the technique)
Active Theory `activetheory.net` · Lando Norris / OFF+BRAND (2026 SOTY — cinematic scroll, 3D that
tracks your reading) · Lusion `lusion.co` · Unseen `2025.unseen.co` · Cyd Stumpel · Phantom.land
particle face (Codrops "Invisible Forces") · Codrops "Horizontal Parallax Gallery: DOM→WebGL"
(2026-02) + "Cinematic 3D Scroll with GSAP" (2025-11) · three.js `webgpu_tsl_compute_attractors` ·
Obys `obys.agency` · Cuberto `cuberto.com`.

---

## 9. Status board *(pending only)*

`[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked

| Phase | Title | Status |
|---|---|---|
| E1  | Home: one page-wide 3D animation *(owner pick from §4 first)* | `[ ]` |
| E2  | /work: WebGL cover gallery | `[ ]` |
| E3  | /about: animated horizontal trajectory timeline | `[ ]` |
| E4  | Same 3D family, quieter, on other routes *(after E1)* | `[ ]` |
| E5  | Housekeeping & lean-up | `[~]` |
| —   | Content / placeholders | `[!]` blocked on Jay |

**Recommended sequence:** owner picks E1 (§4) → build **E2 or E3** (independent, buildable now, high
payoff) in the meantime → **E1** → **E4** (echo the chosen home system) → finish **E5** + swap in
content as it arrives.

---

## 10. Changelog
- 2026-06-18 — **Plan reset to forward-only.** Stripped the shipped P1–P13 + R1 history (now in git)
  and rewrote `plan.md` to track only pending work. Deduped + reprioritized the owner's earlier
  P14–P17/OPT into **E1–E5** (E1 = page-wide home 3D + "molecules everywhere", which were one ask;
  E3 = the /about timeline, merging the "sticky reveal" and "trajectory line" asks). Did the E5
  dead-file cleanup (removed `Card`/`Pin`/`Parallax`/`AnimatedText`, the pnpm lockfiles,
  `scripts/screenshot.mjs`, `udpated_plan.md`). No feature code written yet; E1 awaits an owner pick.
