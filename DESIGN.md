# Design — V2 motion rebuild

Dark-only, indigo-accented, editorial-premium. Linear/Vercel lineage. The site
*is* the engineering proof: **Lighthouse Performance ≥ 95 / Accessibility = 100**
is a hard gate. **Premium = restraint** — exactly one intentional motion moment
per section; the boldness budget is spent on one signature ("The Field").

> Source of truth for *intent* is `plan.md`; live status is `PHASES.md`. This file
> documents the shipped system.

## Color — OKLCH, dark-only

Defined as CSS vars in `app/globals.css`. Hex twins are kept for `THREE.Color`
(shader) and email templates only.

| Token             | OKLCH                                      | Hex twin  | Role                                                         |
|-------------------|--------------------------------------------|-----------|--------------------------------------------------------------|
| `--base`          | `oklch(14.5% 0.012 278)`                   | `#0b0b11` | page canvas (one color site-wide)                            |
| `--surface`       | `oklch(18.5% 0.014 278)`                   | `#14141c` | cards / panels                                               |
| `--elevated`      | `oklch(22.5% 0.016 278)`                   | `#1a1a26` | hover / inner-card                                           |
| `--ink`           | `oklch(94.5% 0.012 280)`                   | `#ebecfa` | headings + body (~17:1)                                      |
| `--ink-dim`       | `oklch(72% 0.028 278)`                     | `#a3a4c4` | secondary / meta (~8:1)                                      |
| `--accent`        | `oklch(63% 0.21 272)`                      | `#6b7cff` | the electric indigo (primary)                                |
| `--accent-solid`  | `oklch(54% 0.215 272)`                     | `#4356ee` | CTA fills (white-on-solid AA)                                |
| `--accent-violet` | `oklch(66% 0.19 285)`                      | `#8b7cff` | iridescent duotone — The Field + hero glow (P2/P3)           |
| `--accent-cyan`   | `oklch(86% 0.115 207)`                     | `#67e8f9` | iridescent duotone — faint far stop                          |
| `--ok`            | `oklch(85.5% 0.125 181)`                   | `#5eead4` | mint/teal: availability dot / result metrics (~13:1 on base) |
| `--err`           | `oklch(68% 0.18 25)`                       | —         | form errors                                                  |
| `--line`          | `oklch(94.5% 0.012 280 / 8%)`              | —         | hairline rings / rules                                       |
| `--glow`          | `0 0 40px -12px oklch(63% 0.21 272 / 35%)` | —         | pre-rendered hover glow                                      |

Tailwind 4 `@theme inline` maps these to `bg-base`, `text-ink`, `text-ink-dim`,
`text-accent`, `text-accent-violet`, `text-accent-cyan`, `border-line`,
`bg-accent-solid`, `text-ok`, `text-err`, etc.
Rules: no cream/beige; **no rainbow two-hue gradient** — the only gradient is the
iridescent duotone (`--accent` → `--accent-violet` → `--accent-cyan`), kept to
**adjacent cool hues so it reads as one shifting light**, scoped to The Field +
hero glow, and still ≤ ~5% of any viewport; depth comes from cards + hairlines,
never alternating section backgrounds. (`text-muted` is retired as a readable token
— the lone `--color-muted` survivor is only the aria-hidden Process ghost number.)

> **Palette v2 (Direction A, "Electric Indigo+")** supersedes the original mono-indigo
> D-3/D-6: indigo stays primary, the iridescent violet→cyan duotone is added for the
> signature, and the off-key status green became mint. See `new_plan.md` P1.

## Typography

- **Syne** display (variable 400–800), **DM Sans** body, **JetBrains Mono**
  eyebrows/meta/numerals — all `next/font/google`, `display: "swap"`, mapped to
  `--font-display` / `--font-body` / `--font-mono`.
- Hero H1 `clamp(2.75rem, 8vw, 4.9rem)`, tracking −0.03em (≥ −0.04em floor). Desktop
  fine-pointer + motion-safe adds a **kinetic Syne `wght` wave** (`HeroHeadlineKinetic`):
  a one-shot load weight-settle + a cursor-reactive per-letter weight, with each letter
  pinned to its rest width so the wave thickens glyphs in place and never reflows the
  masked line. Enhancement-only — the H1 ships server-rendered at rest weight (the LCP
  element); no-JS / reduced motion / mobile keep the static headline. `text-wrap: balance`
  on h1–h3; body ≤ 65ch. Syne never below ~24px and never for numerals (JetBrains Mono
  `tabular-nums`).

## Motion

- **Two easings:** `--ease-out-expo` `cubic-bezier(0.16,1,0.3,1)` for all
  reveals/fades/micro; `jdFlow` (`CustomEase "M0,0 C0.7,0 0.18,1 1,1"`) reserved
  for the signature family only (page wipe, preloader wipe, line draws). Scrubbed
  tweens use `ease:"none"`.
- **Three durations:** `--dur-1` 0.4s / `--dur-2` 0.8s / `--dur-3` 1.2s. Ambient
  loops (marquee, orb drift, shader time) are documented exemptions.
- **One reveal grammar:** "content emerges from behind an edge" — masked line
  rises (SplitText) + clip-path inset wipes, everywhere. Reveals always *enhance*
  already-visible content; start states are set at runtime via GSAP, never
  CSS-hidden (no blank-section bug; no-JS / reduced-motion render the final state).
- **Stack:** GSAP (+ ScrollTrigger, SplitText, Flip, DrawSVG, ScrambleText,
  CustomEase) via `lib/gsap.ts`, and Lenis smooth scroll driven off the GSAP
  ticker (`autoRaf:false`). **Perf:** only gsap core + ScrollTrigger + CustomEase
  are registered eagerly; the heavy plugins lazy-load after mount behind a
  `useExtraPlugins()` readiness gate (keeps the initial JS small). No `motion`
  (framer-motion) dependency — all motion is GSAP or CSS.
- **Reduced motion** is mandatory and decided up front (matchMedia / `gsap.matchMedia`),
  never post-hoc disabled. Mobile is a deliberately simplified experience, not a
  broken desktop one (no custom cursor, no preloader, no parallax/tilt).

## Components

- **Pill button** (`Button`): `rounded-full`, label + 36px arrow circle flush
  right (button-in-button) with a diagonal dual-swap on hover; ghost variant adds
  a transform-only fill-wipe; `active:scale-[0.98]`. **Primary** carries a controlled-neon
  glow — a pre-rendered blurred accent layer behind the pill, animated by opacity + scale
  only (never a box-shadow tween), faint at rest and blooming on hover / `:focus-visible`
  (the crisp accent outline stays the a11y indicator). Renders `<button>` when no `href`.
  `MagneticButton` (GSAP `quickTo`) composes around it (desktop only).
- **Double-bezel card** (`Card`): 24px outer shell (`bg-white/[0.02]`, `p-1.5`,
  hairline ring) → 18px inner core + inset top highlight. Glow is a pre-rendered
  opacity layer, never a `box-shadow` tween. No backdrop-blur on scrolling content.
- **Eyebrow** (`SectionLabel`): JetBrains Mono `text-xs uppercase tracking-[0.2em]
  text-ink-dim` + a 24px accent tick.
- **Focus** (load-bearing — the custom cursor hides the pointer): global
  `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }`;
  pills get `.focus-pill` offset 4px.

## z-index scale (closed)

`grain 30 < header 40 < scroll-progress 45 < mobile-overlay/skip-link 50 <
transition-curtain/preloader 55 < cursor 60`. Nothing between `<body>` and the
cursor may create a stacking/blend-isolating context (transform/filter/opacity<1/
isolation/mix-blend on a full-screen wrapper) — it would kill the
`mix-blend-difference` cursor.

## Signature & atmosphere

- **"The Field"** — the hero WebGL shader and the site's one signature: an iridescent
  indigo → violet → cyan topographic contour field (gradient-descent / loss-landscape) that
  **commands the first viewport** (fuller bleed across the right + margins; only the headline's
  bounding box stays dark, so AAA holds). **Alive:** a travelling descent band + a cursor
  "torch" that warps and brightens the contours under the pointer (desktop only; touch/mobile
  stay calm via `uInteract`). One draw call, interaction-armed + offscreen-unmounted (the
  `.hero-fallback` iridescent radials carry it until then and on mobile/no-WebGL/reduced-motion).
  The **drawn line** (DrawSVG contour ticks) is its sitewide echo. *Fold one is the one licensed
  exception to accent ≤ ~5% (P2 / new_plan Big Swing 1).*
- **"The Flight"** (/about, /work) — the second licensed WebGL exception (see the
  PRODUCT.md Anti-references amendment): a scroll-driven flythrough staged in the empty
  right half behind the DOM timeline. The camera rides a spline past one particle
  "beacon" per milestone — a curl-noise swarm that condenses into that milestone's own
  glyph (the card's lucide icon on /about, JetBrains Mono numerals on /work), flares on
  arrival, and settles into the constellation the finale pull-back reveals. Two draw
  calls total (merged points buffer + path ribbon); every particle state and the camera
  are pure functions of the Spine's scrubbed progress (`scrub: 0.4` stays the single
  smoothing stage — no canvas-side lerp, ever); governed by the full mount gate +
  `createTierLadder` (soft shed → T1 → T2 → dead poster). The DOM Constellation Spine
  is byte-identical with the canvas on or off; spec + reconciliation history live in
  `timelineplan.md`.
- **Choreographed opening** (desktop only — `pointer:fine`, first visit): a
  session-once preloader scramble-decodes "JAY DHAKAN" from binary, then a `jdFlow`
  clip wipe reveals an orchestrated hero (nav slide → masked H1 line-rise → copy
  stagger). Mobile keeps the LCP-safe CSS entrance (a full-screen overlay would
  delay the hero LCP past the gate).
- **Page transitions:** enter-only clip wipe via `template.tsx` remount (z-55),
  accent leading edge, first-load suppressed to protect LCP.
- **Film grain** (static feTurbulence, z-30, 3.2%, no blend mode) + **ambient
  orbs** (CTABanner, pre-baked single-hue radials, transform-drift, ≤1 on mobile).
- **Custom cursor:** dot + lagging ring + VIEW state, `mix-blend-difference`,
  off on touch / reduced motion.

## Per-section motion (one moment each)

Home: orchestrated opening + The Field + kinetic-weight H1 (hero), velocity-skew
marquee, **oversized impact set-piece** (`ImpactStats` — 18h→1.2h transformation +
scroll-counted figures, each bound to its system), sticky stacked cards (featured work),
**"What I Build" bento** (`BentoCapabilities` — varied-size tiles with live
computational motifs: agent node-graph, pipeline flow, API pulse, live 15M+ metric,
chat typing; staggered clip-reveal + tactile hover; replaced the home services list,
full detail on /services), connector line-draw (process), masked-line quotes
(testimonials), mouse-tracked spotlight (tech stack), magnetic CTA + orbs (CTA
banner). /about:
teleprompter bio (lights words from `--ink-dim` → `--ink`, contrast-safe) +
the only timeline (experience) + contour line-draw divider + a categorized tactile
Toolkit grid + avatar hover treatment. /work: hover-preview row list + Flip filtering
+ ambient index numbers + oversized header. /work/[slug]: sticky split scrollytelling +
cinematic cover hero (ken-burns + LQIP) + oversized results set-piece + bold
next-project card. /services + /contact: bento coverage + kinetic statement page.
Covers + profile use **LQIP blur-up** placeholders sitewide (`lib/blur.ts`).
