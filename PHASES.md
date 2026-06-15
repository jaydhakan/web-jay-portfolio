# Build Phases — Live Execution Tracker

> **Purpose:** the *running checklist* for the V2 motion rebuild. This is the doc we
> update as work lands. It does **not** replace the design rationale.
>
> - **`plan.md`** = the design bible (why each decision, full technical patterns, risk register). Source of truth on *intent*.
> - **`docs/final_prompt.md`** = the master spec (effects catalog, hard rules, banned list, DoD).
> - **`PHASES.md`** (this file) = *what's done / in progress / next*, with per-phase exit gates.
>
> Rule of engagement: build **one section/tree per move**, meet the phase's **exit gate**
> (build green + Lighthouse target + screenshots + no leaks) before advancing. Never bulk-build.

---

## Decisions (Phase 0) — accepted as recommended defaults

Locked to the plan.md §3 recommendations (override any before Phase 2; Phase 1 is decision-independent).

| # | Decision | Locked value |
|---|---|---|
| D-1 | Perf gate | Lighthouse **Perf ≥ 95, A11y = 100** (mobile + desktop) |
| D-2 | Fonts | **Syne** (display, var 400–800) + **DM Sans** (body) + **JetBrains Mono** (meta/numerals) |
| D-3 | Palette | **5 OKLCH tokens**, one electric-indigo accent; delete violet/pink/`bg-gradient-hero` |
| D-4 | Theme | **Dark-only**; remove `next-themes`, `.light`, `light:` variants |
| D-5 | Card radius | **24px outer / 18px inner** double-bezel |
| D-6 | ⭐ Signature | **"The Field"** — monochrome-indigo contour shader; drawn-line echo sitewide |
| D-7 | Preloader | **scramble-decode "JAY DHAKAN"**, ≤1.6s, session-once, RM-skipped (fallback: counter bar) |
| D-8 | Page transitions | **enter-only wipe** via `template.tsx` remount |
| D-9 | Hero entrance | keep **server-rendered `opacity:1` H1**; GSAP animates at runtime behind `js-choreo` gate |
| D-10 | ContactForm | **port to GSAP** in final section phase, then remove `motion` package |

---

## Status legend

`[ ]` not started · `[~]` in progress · `[x]` done · `[!]` blocked (waiting on Jay/asset)

## Phase board

| Phase | Title | Status | Exit gate (short) |
|---|---|---|---|
| 0 | Approval gate | **[x]** | Decisions locked (defaults) |
| 1 | Environment + perf/a11y baseline | **[~]** | Perf ≥95 / A11y =100 on 5 routes, mobile+desktop |
| 2 | Design foundation (tokens, fonts, primitives) | [ ] | Build green; visual QA 375/768/1440; LH delta ≥ −2 |
| 3 | Motion infrastructure (Lenis, lib/gsap, primitives) | [ ] | Zero jank; no ScrollTrigger leaks; RM = native; JS-off OK |
| 4 | "The Field" signature shader | [ ] | Perf-neutral vs old shader; idle-gate + off-screen unmount intact |
| 5 | Section-by-section rebuild (9 sub-steps) | [ ] | Per-section: build green, RM + no-JS + responsive shots, frame trace clean |
| 6 | Custom cursor states (dot+ring+VIEW) | [ ] | Native cursor restored on unmount; off touch/RM; blend works |
| 7 | Page transitions + atmosphere | [ ] | RM instant swap; cursor inverts above grain/curtain; no CLS |
| 8 | Choreographed opening (preloader + master TL) | [ ] | Cold mobile LH ≥95 — else cut preloader |
| 9 | Full QA matrix + launch cleanup | [ ] | 5 routes ×LH ≥95/100; keyboard; leak check; DESIGN.md/README rewrite |

---

## Phase 1 — Environment + perf/a11y baseline  `[~]`  ← CURRENT

**Blocker phase: no rebuild work until the gate is green** (so later regressions are attributable).

Environment (verified this session):
- [x] Disk check — **46G free** (the ~1.8GB ENOSPC worry is stale; no longer a constraint)
- [ ] `rm -rf .next` (stale Next-14 build cache)
- [ ] `npm ci` (sync stale tree: Next 14.2.35/React 18.3.1 → 16.2.9/19.2.7 per lockfile)
- [ ] `npm i lenis`
- [ ] `npm run build` green

Three diagnosed fixes, **applied to current code** (from where_are_we.md §UNFINISHED):
- [ ] **(a) TBT 3,350ms** — `components/sections/HeroBackground.tsx`: gate shader mount behind `window load` + `requestIdleCallback(~2500ms timeout, setTimeout fallback)`, on top of existing RM/WebGL/in-view gates. setState inside idle callback is lint-safe.
- [ ] **(b) LCP 3.0s** — `components/sections/Hero.tsx`: tighten `anim-rise` delays (subtext 0.75→~0.4s, CTAs 0.9→~0.55s) and/or shorten H1 char stagger. Re-measure; don't gut choreography.
- [ ] **(c) a11y contrast** — `text-muted` (#4A4A6A ≈ 2.9:1) sweep on visible text → readable token. Offenders: ProjectCard year, case-study `dt` labels, "Next project", /about timeline periods, footer ©. Keep `text-muted` only on aria-hidden decoration. Pull exact list from Lighthouse `audits['color-contrast'].details.items`.

**Exit gate:** Lighthouse on `/`, `/work`, `/work/custom-google-search-kit`, `/about`, `/contact` →
**Perf ≥ 95, A11y = 100** (mobile + desktop). Record the numbers — every later phase diffs against them.

### Phase 1 baseline numbers (fill in)
| Route | Perf (mobile) | Perf (desktop) | A11y | Notes |
|---|---|---|---|---|
| `/` | — | — | — | prior baseline 64 / — / 96 |
| `/work` | — | — | — | |
| `/work/custom-google-search-kit` | — | — | — | |
| `/about` | — | — | — | |
| `/contact` | — | — | — | |

---

## Phase 2 — Design foundation  `[ ]`

- [ ] OKLCH tokens in `globals.css` (register old `text-primary/secondary` **and** new `ink/ink-dim` against same vars — no big-bang rename; delete aliases in Phase 9). Delete violet/pink/`bg-gradient-hero`/`--shadow-glow`. Hex-twin conversion comment table.
- [ ] Dark-only: remove `next-themes`, `ThemeProvider`, `ThemeToggle`, `.light` block, `light:` usages, shader `isLight`; add `color-scheme: dark` + `themeColor`.
- [ ] Fonts: Syne + DM Sans + JetBrains Mono via `next/font/google`; clamp scale (H1 ceiling 6.5rem); motion custom props (`--ease-out-expo`, `--dur-1/2/3`); global `:focus-visible`; `::selection`.
- [ ] Primitives (pure CSS/markup): Button (pill + arrow-circle + fill-wipe), Card (double-bezel 24/18), SectionLabel (mono eyebrow + tick), contour-tick SVG asset.
- [ ] **Parallel cheap wins (§8):** planToBudget select-string bug (`contact/page.tsx:16-19`); unify base-URL fallback (`layout.tsx` vs sitemap/robots); wire-or-delete `seo.home`; move hardcoded headings into `content.ts`.

**Exit gate:** build green; full-site visual QA 375/768/1440 (re-check hero overflow — Syne is wider); LH delta ≥ −2; CLS spot-check on font swap.

---

## Phase 3 — Motion infrastructure  `[ ]`

- [ ] `lib/gsap.ts` single registration (ScrollTrigger, SplitText, Flip, DrawSVG, ScrambleText, CustomEase; `jdFlow` ease; `DUR`).
- [ ] `SmoothScrollProvider` (ReactLenis, `autoRaf:false`, `syncTouch:false`, RM-gated, StrictMode-safe) in root layout.
- [ ] Remove `html { scroll-behavior: smooth }`; route skip-link/case-study anchors via `lenis.scrollTo`; Header menu-lock → `lenis.stop()/start()`.
- [ ] Rebuild ScrollProgress + Header smart-hide off single Lenis callback (delete Motion spring); dev ScrollTrigger leak counter.
- [ ] Primitives: `RevealText` (SplitText, runtime-set, onSplit tweens), `FadeUp`, `Parallax`, `Pin`, `LineDraw`, `Counter` — all `useGSAP({scope})`, matchMedia RM + <768px branches.

**Exit gate:** zero jank / no double-smooth; navigate all routes ×2 with no ScrollTrigger leaks; RM uses native scroll; JS-off renders everything; LH delta ≥ −2.

---

## Phase 4 — "The Field" signature shader  `[ ]`

- [ ] Rewrite hero fragment shader (inside existing gated mount) → monochrome-indigo contour field; recolor `.hero-fallback` to single-accent radials; delete `isLight` plumbing; uniforms read hex twins of `accent`/`accent-deep`.

**Exit gate:** **perf-neutral vs old shader** (iterate iso-line count / dpr if not); off-screen unmount + idle-gate intact; `.hero-fallback` carries brand on mobile if a CPU trace forces the cut.

---

## Phase 5 — Section-by-section rebuild  `[ ]`  (one tree per move; show each before next)

Order = cheapest/lowest-risk first, riskiest pin last on a proven base. Each sub-step in one commit adopts new tokens + new primitives + its ONE assigned effect + its `loading.tsx` geometry.

- [ ] 5.1 **Stats** — Counter + LineDraw underline (proves the primitives)
- [ ] 5.2 **Services** + **/services pricing** — clip-path wipe (+ Growth ring LineDraw)
- [ ] 5.3 **TechStack** — mouse-tracked spotlight (desktop only; readable without it)
- [ ] 5.4 **CTABanner** + **/contact** — magnetic CTA (+ spotlight on dark column)
- [ ] 5.5 **Testimonials** — delete carousel → calm masked-line grid
- [ ] 5.6 **/about** — teleprompter bio + **Experience timeline** (the ONLY timeline; D4 line-draw flagship)
- [ ] 5.7 **/work** list — hover-preview-follow + WorkGrid Flip filtering + refresh-after-filter
- [ ] 5.8 **Home FeaturedWork** — sticky stacked cards (the only new pin; after Lenis proven)
- [ ] 5.9 **/work/[slug]** — sticky split scrollytelling formalization

**Exit gate per section:** build green; section RM + no-JS + 375/768/1440 shots; 4×-CPU trace <5% dropped frames, no paint storms; LH spot-check after 5.4, 5.7, 5.8.

---

## Phase 6 — Custom cursor states  `[ ]`
- [ ] dot + lagging ring + **VIEW** state (over project rows/cards) via `quickTo`; keep `pointer:fine`/RM-off symmetry; z-60 blend contract.

**Exit gate:** native cursor never lost on unmount; off touch/RM; blend works above all layers.

## Phase 7 — Page transitions + atmosphere  `[ ]`
- [ ] enter-only wipe via `template.tsx` remount (z-55; delete `.page-enter`); `ScrollTrigger.refresh()` after wipe.
- [ ] film grain (static, z-30) + orbs (pre-baked, ≤2) with cursor-blend verification after each.
- [ ] branded `not-found.tsx` + `error.tsx`.

**Exit gate:** RM = instant route swap + focus to `#main-content`; cursor inverts above grain/curtain; no CLS from wipe.

## Phase 8 — Choreographed opening  `[ ]`  (LAST — highest LCP risk)
- [ ] preloader (scramble-decode, §6.5 LCP pattern) + GSAP master TL (nav slide → SplitText H1 → subcopy → Field scale-in); `lenis.stop()/start()`; strip hero `anim-*` same commit.

**Exit gate:** cold-profile mobile LH **≥ 95**. Fails after two mitigation rounds → **cut preloader**, CSS entrance stays.

## Phase 9 — Full QA matrix + launch cleanup  `[ ]`
- [ ] 5 routes × LH (mobile+desktop) ≥95/100; 375/768/1440 × default/RM shots; JS-off; keyboard; 10-nav leak check; em-dash grep on touched copy.
- [ ] delete old token aliases; retire `noscript [data-reveal]` hack (only if every reveal runtime-set); regenerate `og-image.png`; rewrite README + `DESIGN.md`.
- [ ] **D13:** prod build, screenshot every section, self-critique vs plan + spec checklist, fix gaps, report done.

---

## Blocked on Jay (assets/content — caps Phase 5.7/5.8 + D13)
- [!] 6 project cover screenshots → `public/images/projects/<slug>.jpg`
- [!] Profile photo → `public/images/profile/jay.jpg`
- [!] Real testimonials (3 are placeholders)
- [!] Confirm email/LinkedIn/Upwork URLs, timeline date conflict, "50+ projects" claim
- [!] `RESEND_API_KEY` + verified `from:` domain; `NEXT_PUBLIC_SITE_URL`

## Changelog
- 2026-06-15 — Phase 0 locked (defaults). PHASES.md created. Phase 1 started: env verified (46G free, stale tree confirmed, lenis absent).
