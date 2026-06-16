# 🚀 Portfolio Animation Roadmap — Jay Dhakan

> **Living roadmap, tailored to this codebase.** This replaces the original generic
> Awwwards prompt. We do **not** follow any plan to the letter — we cherry-pick what
> raises the bar and cut what doesn't.

---

## ⭐ The Goal (north star)

An **awesome-looking, god-level-UX/UI portfolio** with **attractive design and crazy-but-disciplined
animations** — a site that makes a visitor say "wow" and can't quite explain why. Every motion either
**guides attention**, **rewards interaction**, or **communicates a transition**. If it does none of
those three, cut it.

**Crazy ≠ noisy.** The boldness budget is spent on one signature ("The Field") and one intentional
moment per section. Restraint is what makes it read as *designed* instead of an effects demo.

### The one idea (the concept the whole site dramatizes)

Award-level sites win on **one idea executed obsessively**, not a pile of effects. This site already has its
idea — it's just being treated as decoration instead of the spine. Promote it:

> **The page behaves like a live ML system finding its answer.** "The Field" is a real gradient-descent /
> loss-landscape; the cursor perturbs it; scrolling advances the descent. The motion *means* "this is how Jay
> does AI/ML" — **the medium is the proof.** That's the line between a portfolio that lists skills and one
> that *demonstrates* them in the first second.

Decision rule: if a proposed effect doesn't make "a computational system, alive and converging" more legible,
it's decoration — cut it or bend it to serve the idea. This is what turns a polished page into one people
screenshot and can't quite explain. **Bold the idea; restrain everything that isn't it.**

### Non-negotiables (the guardrails every new animation passes)
- **Gate:** Lighthouse **Perf ≥ 95 / Accessibility = 100**, **CLS 0**. *(Measure desktop with
  `lighthouse --preset=desktop` → 100/100; a hand-rolled `--throttling-method=devtools` mis-reports ~80.)*
- **Animate only** `transform` / `opacity` / `clip-path` / `filter`. Never width/height/margin/top.
- **`prefers-reduced-motion`** decided up front (never post-hoc disabled). **Mobile is a deliberately
  simpler experience**, not a broken desktop one.
- **One moment per section.** Entrance reveals are the *baseline grammar* (content emerges from behind
  an edge), not "the moment."
- **LCP element is never hidden/covered on first paint.** Reveals enhance already-visible content;
  start states set at runtime, never CSS-hidden (no-JS / reduced-motion show the final state).
- **Closed z-scale** — nothing may create a blend-isolating full-screen context under the `z-60`
  `mix-blend-difference` cursor.
- **All visible copy lives in `data/content.ts`. No em/en dashes.** Dark-only, single indigo accent.

### Anti-cliché craft rules (so "bold" never ships as AI slop)

The boldness above is only worth anything if it doesn't read as *generated*. Every Big Swing also clears these:
- **Type: presence over size.** Hero H1 `clamp` ceiling **~6rem (96px)** — past that it's shouting, not
  designing. "Oversized" comes from variable-weight kinetics + the field behind it + air around it, not raw px.
  Display tracking floor **≥ -0.04em** (we're already there; never tighter, or the letters touch).
- **Neon = pre-rendered, compositor-only.** A glow is an opacity/transform layer, never a `box-shadow` tween
  and never the `1px border + ≥16px soft shadow` "ghost-card" pattern. Iridescence lives in the **shader and
  atmosphere only** — never `background-clip:text` gradient text (decorative, never meaningful).
- **Bento ≠ a uniform card grid.** Tiles must differ in *size and function* (a live metric tile ≠ a label
  tile); a same-size icon+heading+text grid repeated is the banned "identical card grid." Radius 12–24px.
- **Impact numbers ≠ the SaaS hero-metric template** (big figure / tiny label / supporting stats / gradient
  accent). Differentiate: bind each figure to the system it came from, or animate the *unit*, so it reads as
  proof — not a pricing-page stat band.
- **Eyebrow cadence.** A mono `SectionLabel` kicker above *every* section is now an AI-scaffold tell. Keep it
  only where it earns its place; vary the other section openings (a number that's truly a sequence, a hairline,
  or nothing).
- **Mobile is its own "wow," not a stripped desktop.** Most visitors arrive on a phone; the calm version still
  needs one deliberate, well-tuned moment per page. The jury (and the client) judges it too.

> Sources of truth: `PHASES.md` (status) · `plan.md` (design bible) · `DESIGN.md` (shipped system) ·
> `docs/final_prompt.md` (master spec). This file is the **forward-looking animation backlog**.

---

## ✅ Already shipped (don't rebuild)

**Foundation** — Lenis smooth scroll on the GSAP ticker · custom cursor (dot + lagging ring + "VIEW",
`mix-blend-difference`, gated) · desktop scramble-decode preloader (`OpeningChoreo`, first-visit, LCP-safe) ·
enter-only page-transition clip wipe (`template.tsx`) · static film grain · ambient drift orbs.

**Hero** — "The Field" WebGL contour shader (interaction-armed, offscreen-unmounted) **now scroll-reactive**
(`uScroll` advances the descent + lifts contour energy) · choreographed opening (nav slide → masked H1
rise → copy stagger) · **hero scroll-out parallax** (native CSS `animation-timeline: scroll()`,
compositor-only) · single-accent radial fallback.

**Micro-interactions** — text-slide nav hovers (`SlideText`, header + footer) · sliding active-link
accent dot · footer email **scramble-on-hover** · rotating **"available for work" badge** · magnetic
CTA buttons · **Syne variable-font kinetic footer statement** (`KineticHeadline`, per-letter `wght`
follows the cursor).

**Sections** — velocity-skew marquee · kinetic counters + LineDraw (stats) · sticky stacked featured
cards · clip-wipe services · connector line-draw process · masked-line testimonials · mouse-tracked
spotlight (tech stack) · magnetic CTA + orbs.

**Pages** — /about: teleprompter bio + experience timeline + contour line-draw divider. /work:
hover-preview row list + Flip filtering + staggered row reveal. /work/[slug]: sticky split scrollytelling.

**Perf** — heavy GSAP plugins lazy-loaded behind a readiness gate; `framer-motion` removed entirely.
**Current gate: desktop 100/100 · mobile Perf 95–96 / A11y 100 · CLS 0.**

> **Honest critique (June 2026):** the site is *premium* but plays it safe. The home hero reads as a
> polished Linear/Vercel page, not an Awwwards "wow." Three gaps vs. the goal: (1) **the signature is
> too quiet** — The Field hides in the upper-right at low contrast instead of commanding the screen;
> (2) **the palette is conservative** — one indigo on near-black, and the **green** availability chip is
> the one genuinely off-key note; (3) **no single bold moment** anchors the screen (nothing oversized,
> iridescent, or interactive). The Big Swings below fix exactly this.
>
> **The deeper read:** we escaped freelancer-template slop and landed in the *Linear/Vercel-minimal* lane —
> which by 2026 is its own reflex (the second-order trap: avoid one default, adopt the next). More effects on
> that page still read as *that page*. The real escape isn't louder polish — it's committing to **the one
> idea** above so the home couldn't be mistaken for a SaaS marketing site. Bolder ≠ busier; bolder = the
> concept becomes unmissable in the first second.

---

  ## 🗺️ Execution — strictly phase by phase

**One phase at a time. Never everything at once.** Each phase = one focused, shippable move; I build it,
verify the gate (desktop 100 · mobile Perf ≥ 95 · A11y 100 · CLS 0), commit it, **you review**, *then* the
next phase starts. (Same cadence as the V2 build + the repo's "one whole section per move" rule.) Any phase
can be reordered, paused, or cut — the goal leads, not the list.

| #          | Phase                    | Scope                                                                                | Gated on          |
|------------|--------------------------|--------------------------------------------------------------------------------------|-------------------|
| **P1**     | Palette v2 foundation    | tokens (violet/cyan/mint) + status-green→mint + shader hex twins + contrast re-pass  | —                 |
| **P2**     | Field-as-star (home)     | iridescent duotone + fuller bleed + stronger cursor displacement                     | P1                |
| **P3**     | Hero type + neon         | oversized kinetic H1 (load settle) + controlled-neon CTA glow + charged focus states | P1                |
| **P4**     | Home: Bento capabilities | Bento 2.0 grid (agents · pipelines · APIs · live metric tile)                        | P1                |
| **P5**     | Home: impact set-piece   | oversized scroll-counted numbers (15M+/day · 99.9% · 18h→1.2h)                       | P1                |
| **P6**     | /work elevation          | ambient index numbers · kinetic header · logo scramble                               | P1                |
| **P7**     | /services                | rebuild as Bento 2.0 tiles + neon-accent micro-interactions                          | P1                |
| **P8**     | /contact                 | statement page (`KineticHeadline`) + charged form + submit animation                 | P1                |
| **P9**     | /about                   | kinetic intro · skills bento · richer timeline                                       | P1                |
| **P10**    | /work/[slug]             | case-study cover hero · impact set-piece · scroll-to-next-project morph              | P1                |
| **P11** 🔒 | Real-imagery cinematic   | cover ken-burns · LQIP blur-up · galleries · photo treatment                         | real covers/photo |
| **P12**    | Polish pass              | page-transition timing · orb/grain balance · micro-language consistency              | P2–P10            |

> Recommended start: **P1 → P2** (palette is the foundation; Field-as-star is the highest-impact single move).

---

## 🔥 BIG SWINGS — the moves that make it unmistakably "wow"

> These are the priority for the goal. Each is grounded in 2026 award-direction research (dark-first +
> controlled electric/iridescent energy + oversized expressive type + a signature that commands the
> screen + bento showcase), and each still passes the guardrails. **Crazy, but disciplined.** Each also clears
> the **Anti-cliché craft rules** above — that's the line between bold and slop — and earns its keep only by
> making **the one idea** (a computational system, alive and converging) more legible.

### 1. Make "The Field" the STAR of the hero  *(highest impact — this IS the one idea)*
Today it's a faint corner texture. Turn the signature into the thing people screenshot:
- **Lead with the meaning.** It already *is* a loss-landscape / gradient-descent picture — so dramatize that:
  this person does AI/ML, and you're watching a system converge. The visual *means* something; that's the
  whole game. Everything below serves this, not the reverse.
- **Fuller bleed + higher contrast** behind the type (with the left text column still protected for AAA),
  so the contour field reads as the hero, not a watermark.
- **Iridescent duotone** (indigo → violet → faint cyan) instead of flat mono-indigo — the "computational /
  hyperreal" look that signals AI without a mascot. (Palette v2 below; adjacent-hue = one light, not a rainbow.)
- **Visibly alive:** the descent band actually travels; **cursor displacement** warps the field with real
  momentum (we already feed `uMouse` + `uScroll` — push the amplitude up on desktop, keep mobile calm).
- **Earn a fold-one exception to "accent ≤ 5%".** This is the deliberate place the field is *allowed* to be the
  dominant surface — that's what makes it the star instead of a watermark. The 5% rule resumes below the fold.
- Guardrails: stays one draw call, interaction-armed, offscreen-unmounted; LCP H1 still paints first.

### 2. Oversized, kinetic hero headline
Award heroes use type that "refuses to be ignored" (Dropbox, Charles Leclerc).
- Raise the clamp ceiling to the **~6rem (96px) floor-of-shouting**, no higher; bring the **variable-Syne
  kinetic weight** (currently footer-only) onto the H1 — a one-shot **weight-settle on load** (after LCP) and an
  optional subtle cursor-reactive `wght` on desktop. The "oversized" feeling comes from the kinetics + the
  living field behind it, not from breaking the px ceiling.
- Keep it LCP-safe: H1 ships at rest weight, server-rendered `opacity:1`; kinetics enhance after paint.

### 3. "Controlled neon" energy layer
2026 = neon is back, but as micro-glow / focus / CTA outlines on dark, not highlighter chaos.
- A real (pre-rendered, transform/opacity-only) **glow** on the primary CTA + key accents; tighter, more
  electric focus/hover states. Makes the indigo feel charged instead of flat.

### 4. A bento "capabilities" showcase on the home  *(Bento 2.0)*
A modular grid (12–24px radius, tactile micro-interactions) that shows what he does — AI agents · pipelines ·
APIs · a live metric tile (15M+/day, 99.9%, 18h→1.2h) · a "currently building" tile. Replaces or augments a
flatter current section; gives the home a genuine showcase beat without needing project imagery.

### 5. Oversized impact-stats set-piece
Promote the numbers (15M+ queries/day · 99.9% uptime · 18h → 1.2h ETL) into a **bold, animated impact
moment** — huge tabular figures, scroll-counted, one strong section instead of a quiet row.

---

## 🎨 Palette & Theme v2  *(proposed — needs your pick; touches the token system + a contrast re-pass)*

Dark-first stays (correct + on-trend). The move is **adding one disciplined "energy" layer** and fixing the
off-key green, then re-verifying A11y 100.

**✅ DECIDED — Direction A: "Electric Indigo+".** Keep `base`/`ink`; keep electric-indigo as primary; add a
single **iridescent duotone for The Field + hero glow** (indigo `#6b7cff` → violet `#8b7cff` → faint cyan
`#67e8f9`, adjacent hues so it reads as one light, not a rainbow). Re-tune the availability status from pure
green to a **harmonious mint/teal** (≈ `#5eead4`) so nothing fights the theme. 2026 "controlled energy" with
minimal brand risk. *Implementation: new tokens in `globals.css` + shader hex twins (`HeroShader` `uColorA/B`
+ a cyan), status-color swap, contrast re-pass to hold A11y 100.*

_Not chosen (kept for the record):_ **B — "Computational Iridescent"** (full indigo↔violet↔cyan shimmer;
bolder, higher contrast/coherence risk) · **C — "Moody Statement"** (deep plum/wine secondary; off-brand for
the precise engineer identity).

> Rule we keep either way: accent ≤ ~5% of any viewport; depth from cards + hairlines, not alternating
> backgrounds; any gradient stays **adjacent-hue** (one light), never a two-hue rainbow.

---

## 📄 Per-page elevation (every route, to the goal)

The Big Swings are mostly home. This is the **per-page refactor map** so *no page is left at "fine"* —
each gets the palette v2 + one bold moment, while keeping one-moment-per-section restraint and the gate.

### `/` Home  — *the showcase*
- **Shipped:** scroll-reactive Field, opening choreo, hero parallax, marquee, stats, featured stack,
  services, process, testimonials, tech-stack spotlight, CTA + orbs.
- **Elevate (= the Big Swings):** Field-as-star (iridescent) · oversized kinetic H1 · neon CTA glow ·
  **Bento 2.0 capabilities grid** · oversized impact-stats set-piece.

### `/work` Index  — *the proof*
- **Shipped:** hover-preview row list + Flip filtering + staggered row reveal.
- **Elevate:** 🔜 ambient index numbers · oversized/kinetic page header · 🔒 cover ken-burns on real
  images · 💭 a "featured / latest" hero project pinned above the list · 💭 View-Transitions row→detail morph.

### `/work/[slug]` Case study  — *the depth*
- **Shipped:** sticky split scrollytelling.
- **Elevate:** 🔒 cinematic cover **hero** (real image + duotone/grain) · bold project-title moment ·
  **results/impact as an oversized number set-piece** · 💭 **scroll-to-next-project morph** (Codrops scrub
  clip-path + progress ring) so case studies chain cinematically · 🔒 in-body image galleries w/ parallax.

### `/about` — *the person*
- **Shipped:** teleprompter bio + experience timeline + contour line-draw divider.
- **Elevate:** oversized kinetic intro line · 🔒 **profile-photo treatment** (duotone + grain + subtle
  parallax/hover) · skills/tools as a **tactile bento grid** · richer, more cinematic timeline reveal.

### `/services` — *the offer*
- **Shipped:** clip-wipe services.
- **Elevate:** rebuild services as **Bento 2.0 tiles** (12–24px radius, "squishy" micro-interactions,
  neon-accent hover) · oversized section header · a compact process/▶ visualization.

### `/contact` — *the close*
- **Shipped:** static form (react-hook-form + zod), plan→budget prefill.
- **Elevate:** make it a **statement page** — a big **`KineticHeadline`** ("Let's build …") + availability ·
  **charged focus states** + a satisfying submit/success micro-animation · a small "what happens next" beat.

### `/_not-found` + `/error` — *the edges*
- **Shipped:** branded "Off the contour" pages (contour ring + reveal). **Keep**; just inherit palette v2.

> Cross-cutting (applies to all routes): palette v2 tokens · controlled-neon focus/hover · consistent
> slide/scramble micro-language · page-transition curtain already global. Real imagery (covers + photo)
> unlocks the 🔒 items.

---

## 🎯 Backlog (smaller, cherry-picked)

Status key: ⬜ todo · 🔜 next · 🔒 blocked on real content · 💭 evaluate

### Wave A — signature echoes & editorial polish *(gate-safe, no content needed)*
- 🔜 **Logo scramble-on-hover** — the decode signature on the wordmark (header + footer). *Needs a small
  `ariaHidden={false}` option on `ScrambleText` so the wordmark stays the link's accessible name; mark the
  "JD" badge `aria-hidden`, no conflicting `aria-label`.*
- 🔜 **Ambient project index numbers** on /work rows — faint mono "01 / 02 …", editorial depth that pairs
  with the row reveal. Decorative (`aria-hidden`), `tabular-nums`.
- ⬜ **Slide-text hover consistency** — extend the `SlideText` treatment (or a shared underline-wipe) to the
  remaining prominent text links ("View case study", inline links) so the micro-language is uniform.
- ⬜ **Footer social-icon micro-lift** — subtle magnetic/translate on hover to match the CTA language.

### Wave B — cinematic, unlocked by real imagery *(do when covers land)*
- 🔒 **Cover ken-burns / parallax** — native CSS scroll-driven `view()` scale on real project covers
  (featured stack + /work). Zero payoff over gradient placeholders; shines with screenshots.
- 🔒 **LQIP blur-up image loading** — base64 blur placeholders + intrinsic dimensions for project covers:
  zero CLS + a premium "develops into focus" load. The single biggest *image* polish upgrade.
- 💭 **Card → case-study morph** on /work click — a shared-element transition into the detail page using the
  **View Transitions API** (now broadly supported; degrades cleanly). Cinematic route change, on-brand,
  reuses our Flip mindset. Higher effort — prototype behind the gate.

### Wave C — bold set-pieces *(evaluate; higher effort/risk)*
- 🔒💭 **Horizontal cinematic reel** for featured work — only worthwhile with real cover imagery, and must
  keep a vertical mobile fallback + avoid scroll-jacking. Deliberately deferred (see Removed).
- 💭 **Sticky "chapter" sequence** for /about or /services — only if it genuinely deepens the story beyond
  the current timeline; otherwise skip (restraint).

### Wave D — atmosphere refinements *(taste passes)*
- ⬜ Page-transition polish (timing/colour of the curtain) once the rest settles.
- ⬜ Revisit orb/grain intensity for balance after Waves A–B land.

---

## 🚫 Removed / deliberately NOT doing (and why)

These appear in generic "make it crazy" plans but would hurt *this* site's goal or gate:
- **Barba.js** — doesn't fit Next App Router; we already have an enter-wipe via `template.tsx`.
- **ScrollSmoother** — conflicts with our Lenis-on-GSAP-ticker setup (would double-drive scroll).
- **Counter (00→100) preloader over the hero** — re-breaks mobile LCP; our scramble preloader is
  desktop-gated for exactly this reason.
- **Global `cursor:none` + a "Perf > 85" target** — our cursor is gated, and the bar is **≥ 95**.
- **Hero floating tech tags** — redundant: the subheading states the stack and the velocity marquee
  right below already scrolls the tech themes. Tags there = clutter, not polish.
- **Full-screen WebGL everywhere / particle fields / 3D object galleries** — perf + off-brand for an engineer.
- **A second WebGL context** (e.g. flowmap cursor text-distortion) — one shader budget; protects the gate.
- **Scroll-jacking / heavy pinned multi-state sequences** — perf + breaks the one-moment-per-section rule.
- **Lottie-heavy decoration** — bundle weight for little signal.
- **Adding a second motion moment to a section that already has one** — the fastest way to make it feel
  like AOS noise instead of an authored site.

---

## 🔑 The biggest lever is still REAL CONTENT (owner: Jay)

Most of Wave B/C is gated on assets that don't exist yet — and **real project screenshots are the single
biggest "is-this-Apple-level" upgrade left**, far more than any new effect. Flag placeholders, never fake them.
- Real project **covers** → `public/images/projects/<slug>.jpg`; **profile photo** → `public/images/profile/jay.jpg`.
- Replace the **3 placeholder testimonials** in `data/content.ts`.
- Confirm **email / LinkedIn / Upwork URLs** and résumé **timeline dates**.
- Set **`RESEND_API_KEY`** + a verified `from:` domain, and **`NEXT_PUBLIC_SITE_URL`**.

---

## ✔️ Definition of Done (every new animation)

1. Reads as **intentional** — guides attention, rewards interaction, or communicates a transition.
2. `transform`/`opacity`/`clip-path`/`filter` only; reduced-motion + mobile paths designed in.
3. Doesn't add a second "moment" to a section that already has one.
4. **Verified:** desktop **100** (`--preset=desktop`), mobile Perf **≥ 95**, A11y **100**, CLS **0**.
5. No blend-isolating full-screen context under the `z-60` cursor; LCP element never covered on first paint.
6. Copy in `content.ts`; no em/en dashes.
7. **Passes the slop test:** couldn't be mistaken for a generic SaaS/Linear page or an AI-generated template,
   and it makes **the one idea** (a computational system, alive and converging) more legible — not just prettier.

---

## 🧭 Reference sites (study the *feeling*, not the code)
Award-winning restrained portfolios in our lineage — note how little they actually move, and how
deliberate each beat is:
- **Codrops — "From Shader Uniforms to Clip-Path Wipes"** (2026): our exact stack (shader + GSAP +
  clip-wipes + Lenis), with the "effects as intentional style, not tech demos" philosophy.
- **grainandmortar.com** — agency restraint.
- **Linear / Vercel** — the editorial-premium baseline this site descends from.

### 2026 direction research (basis for Big Swings + Palette v2)
- Dark-first as brand expression; **neon back as "controlled energy"** (micro-glow, focus, CTA outlines) —
  [Lounge Lizard](https://www.loungelizard.com/blog/web-design-color-trends/) ·
  [Recursion — UI color trends 2026](https://www.recursion.agency/blog/ui-color-trends-2026)
- **Oversized confident / kinetic type** in heroes; variable fonts that respond to interaction —
  [Envato Elements](https://elements.envato.com/learn/web-design-trends) ·
  [Figma — Web design trends 2026](https://www.figma.com/resource-library/web-design-trends/)
- **Bento 2.0** grids (12–24px radius, tactile micro-interactions) —
  [Desinance](https://desinance.com/design/bento-grid-web-design/)
- **Gradients as structure** + **iridescent / metallic "computational" color**; grain/CSS-noise depth over
  heavy WebGL — [DIT Blog](https://www.designingit.com/blog/2026-web-design-color-trends/) ·
  [Joliciatype — Color Forecast 2026](https://joliciatype.com/color-forecast-2026-the-most-popular-color-palettes-shaping-the-future-of-design/)

> **Golden rule:** Animation serves the content, not the other way round. The visitor should feel the
> craft without being able to point at it. **Bold the signature, restrain everything else** — that
> contrast is what reads as "wow," not more motion everywhere.
