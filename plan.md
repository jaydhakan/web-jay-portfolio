# Jay Dhakan Portfolio — V2 Motion Rebuild Plan

> Living build plan derived from `docs/final_prompt.md` (the master spec), the locked `DESIGN.md` / `PRODUCT.md` / `where_are_we.md`, a full multi-agent codebase audit, three design lenses (motion, design-system, performance/a11y), a completeness critique against the spec, and web-verified GSAP/Lenis facts (2025–2026).
>
> **How to use this doc:** Phase 0 is an approval gate — nothing gets built until the decisions in §3 are confirmed. After that, build **one section/tree per move** and show the result before starting the next (spec rule W5). Each phase has an explicit **exit gate**; do not advance until it passes.

---

## 1. North Star

Make it read like **a premium product website**, not "a developer portfolio with animations." The formula (spec M3): large characterful type + massive whitespace + smooth scroll + *subtle* motion + a minimal palette + one signature motion language. **Premium = restraint** — exactly ONE intentional motion moment per section; if removing an effect loses nothing, it's removed.

References: Apple, Linear, Stripe, Framer, current Awwwards winners. Avoid: templates, random animations, 3D overuse, gaming visuals.

### Non-negotiables (carried from spec + locked docs)
- **Lighthouse Performance ≥ 95, Accessibility = 100** (PRODUCT.md hard gate — stricter than the spec's ≥85). An effect that tanks the score gets cut (spec R9).
- Animate only `transform`, `opacity`, `clip-path`, `filter`. Never width/height/top/left/margin (R1).
- `prefers-reduced-motion` fully handled; mobile is a *deliberate* simplified experience, not a broken desktop one (R3, R4).
- Reveals enhance already-visible content — never gate visibility on a class that may not fire (R7, the "blank-section bug").
- Motion and GSAP never mix in one component tree — migrate one whole tree per commit (locked rule).
- All copy lives in `data/content.ts`; no em/en dashes in visible copy; no agency-speak; no fabricated metrics/testimonials/screenshots.
- One signature element gets the whole boldness budget; everything else stays quiet (F21).

---

## 2. Current State (the truth we're building on)

| Fact | Value | Source |
|---|---|---|
| Lighthouse Performance | **64** (gate 95+) — FAIL | `where_are_we.md` |
| Lighthouse Accessibility | **96** (gate 100) — FAIL | `where_are_we.md` |
| Cause of low perf | TBT 3,350ms (R3F shader inits on main thread), LCP 3.0s (hero text starts `opacity:0`) | audit |
| Lenis | **NOT installed** | `package.json` |
| gsap / @gsap/react / three / R3F | 3.15.0 / 2.1.2 / 0.184 / 9.6 — all present | `package.json` |
| `node_modules` | **stale** (Next 14 / React 18 on disk vs Next 16 / React 19 in lockfile) | audit |
| Free disk | **~1.8GB** — `rm -rf .next` on ENOSPC | `where_are_we.md` |
| `/public/images/*` | **only `.gitkeep`** — every cover renders gradient, about renders "JD" monogram | audit |
| Reveal pattern today | every below-fold section uses the same `fadeUp` — this is exactly the banned identical-AOS look (B2). **This is the core reason to rebuild.** | audit |

**Verified tech facts (web-checked, 2025–2026):**
- GSAP 3.13+ made **all** former-premium plugins free in the single public `gsap` npm package (SplitText, ScrollTrigger, ScrollSmoother, Flip, DrawSVGPlugin, MorphSVGPlugin, MotionPathPlugin, CustomEase, ScrambleTextPlugin). No Club membership, no private registry. ✅
- `useGSAP()` from `@gsap/react` is StrictMode-safe (context revert on teardown). React 19 OK (`peerDependencies.react: ">=17"`). ✅
- SplitText supports `mask: "lines"`, `autoSplit: true` (create tweens **inside `onSplit()`**), `aria: "auto"`; use `SplitText.create()`. ✅
- Lenis package is **`lenis`** (`@studio-freight/lenis` is deprecated). Use `lenis/react`'s `<ReactLenis>`. **Critical footgun:** core `autoRaf` defaults to `true` — you MUST set `autoRaf: false` when driving rAF from the GSAP ticker, or you get two loops and doubled/janky scroll. ✅
- On route change, ScrollTrigger holds stale measurements — fix with `ScrollTrigger.refresh()` after a double-`requestAnimationFrame` (or `refresh(true)`). ✅
- `syncTouch` default is `false` and should stay `false` (native momentum on touch). ✅
- Remove `html { scroll-behavior: smooth }` when Lenis lands — they double-smooth. ✅

---

## 3. Decisions to Confirm Before Phase 1 (the W4 approval gate)

The spec mandates explicit approval before any code. Each row has a **recommendation** (what the three lenses + critique converged on). Confirm, override, or tweak.

| # | Decision | Recommendation | Why |
|---|---|---|---|
| **D-1** | Performance gate | **95+** (adopt PRODUCT.md) | Already the project's hard gate; current score 64 needs the baseline fixes regardless. |
| **D-2** | Display + body + mono fonts | **Syne** (display, variable 400–800) + **DM Sans** (body) + **JetBrains Mono** (eyebrows/meta/numerals) | Syne is characterful, Google-hosted variable (unlocks kinetic-weight moment), not Awwwards-ubiquitous like Clash. Mono gives tabular figures for counters. Alternate offered: Clash Display + General Sans. |
| **D-3** | Palette | **5 OKLCH tokens** (`base`, `surface`, `ink`, `ink-dim`, `accent`-electric-indigo); **delete** `accent-violet`, `accent-warm`, and `bg-gradient-hero` | The current 3-accent indigo→violet→pink 135° gradient *is* the banned "purple-blue AI gradient" (B3). One electric indigo is the ownable, Linear-grade move. |
| **D-4** | Light theme | **Dark-only** — remove `next-themes`, `.light`, `light:` variants | Spec is dark-only; halves the QA matrix at a failing-gate moment; strengthens the brand. Var indirection kept so light can return post-launch. |
| **D-5** | Card radius | **24px outer / 18px inner** double-bezel | Splits spec's `rounded-[2rem]` (32px, too soft for an engineering brand) vs locked 12–16px (kills the bezel). |
| **D-6** | **Signature element** | **"The Field"** — rewrite the existing hero R3F shader into a monochrome-indigo flowing contour field (gradient-descent / loss-landscape metaphor, native to an AI/ML engineer). The **drawn line** becomes its sitewide *echo*. | Only candidate that is brand-specific, **perf-neutral** (reuses the already-gated WebGL mount — no new budget), and seen by every visitor in the first viewport. |
| **D-7** | Preloader concept | **Scramble-decode of "JAY DHAKAN"** (signal-from-noise), minimal, ≤1.6s, hero painted underneath, session-once, skipped under reduced-motion | On-brand for an AI/ML/data engineer and distinctive. Safe fallback if it costs LCP: a hairline bar + mono 0→100 counter. The preloader is **not** the signature — The Field is. |
| **D-8** | Page transitions | **Enter-only wipe via `template.tsx` remount** (delete `.page-enter`) | Lower-risk for the 95+ gate than intercepting `<Link>` clicks (which delays `router.push` and fights App Router prefetch). Revisit if the feel is inadequate. |
| **D-9** | Hero entrance | Keep the **server-rendered, `opacity:1` H1**; GSAP masks/animates it **at runtime only while covered by the overlay**, behind a `js-choreo` gate. CSS entrance stays the repeat-visit / no-JS / reduced-motion path. | Renegotiates the locked "don't convert the hero" rule *without* breaking it — the server DOM never changes, only who animates it. Protects LCP. |
| **D-10** | ContactForm (last Motion island) | **Port the whole tree to GSAP in the final section phase**, then remove the `motion` package | Keeps the never-mix rule clean; alternative is to grandfather it as a permanent Motion island. |

> Everything below is written assuming the recommendations are accepted. If any change, the affected phase notes call out the dependency.

---

## 4. Design System Spec

### 4.1 Color — OKLCH, dark-only
```
--base       oklch(14.5% 0.012 278)   ~#0b0b11   page canvas
--surface    oklch(18.5% 0.014 278)   ~#14141c   cards/panels
--elevated   oklch(22.5% 0.016 278)   ~#1a1a26   hover / inner-card core
--ink        oklch(94.5% 0.012 280)   ~#ebecfa   headings + body  (~17:1)
--ink-dim    oklch(72%   0.028 278)   ~#a3a4c4   secondary/meta   (~8:1)  ← replaces text-muted everywhere readable
--accent     oklch(63%   0.21  272)   ~#6b7cff   THE electric indigo
--accent-solid oklch(54% 0.215 272)   ~#4356ee   CTA fills (white-on-solid = 5.07:1 AA)
--line       oklch(94.5% 0.012 280 / 8%)         hairline rings/rules
--glow       0 0 40px -12px oklch(63% 0.21 272 / 35%)
--ok         oklch(72% 0.17 152)                 availability dot / result metrics
--err        oklch(68% 0.18 25)                  form errors
```
Rules: no cream/beige; no two-hue gradient (single-hue→transparent radials only); accent ≤ ~5% of any viewport. **`text-muted` (2.9:1) is deleted as a readable token** — this single change fixes the flagged a11y contrast failures (ProjectCard year, case-study `dt`s, footer ©). Keep hex twins in `HeroShader.tsx` (THREE.Color can't parse oklch) and `emails/ContactEmail.tsx`, synced via a comment table in `globals.css`. Regenerate `og-image.png` (currently bakes the banned gradient).

### 4.2 Typography (contrast-axis pairing)
- **Syne** display (variable 400–800), **DM Sans** body, **JetBrains Mono** micro — all `next/font/google`, `display: "swap"`, mapped onto the existing `--font-display` / `--font-body` seam (+ new `--font-mono`).
- Hero H1 clamp ceiling **6.5rem** (within spec's ≤9rem; Syne is much wider than Jakarta — "That Actually Ship." overflows `max-w-7xl` past ~7rem). Tracking floor ≥ −0.04em (our scale stops at −0.02em). `text-wrap: balance` on headings, body ≤ 65ch.
- **Syne never below ~24px and never for numerals** (its figures aren't tabular) — counters/meta use JetBrains Mono `tabular-nums`.
- Variable-font kinetic-weight moment (effect 5): **footer nav links only** (`transition: font-variation-settings`), off under reduced-motion. CPU-rasterized, so micro elements only.

### 4.3 Motion vocabulary (locked — both CSS and GSAP consume these)
- **Two easings:** `--ease-out-expo: cubic-bezier(0.16,1,0.3,1)` (≈ `expo.out` / GSAP) for all reveals/fades/micro; **`jdFlow`** = one registered `CustomEase.create("jdFlow","M0,0 C0.7,0 0.18,1 1,1")` reserved exclusively for the signature family (wipes, panels, line draws). Scrubbed tweens use `ease:"none"` (the only exemption — feel comes from Lenis lerp).
- **Three durations:** `--dur-1: 0.4s` micro, `--dur-2: 0.8s` standard, `--dur-3: 1.2s` hero. Nothing else. (Counters use 1.2s, honoring this over catalog #27's "~2s.")
- **One reveal language:** "content emerges from behind an edge" — text rises from `overflow:hidden` line masks (SplitText), blocks reveal via clip-path inset wipes. Same grammar everywhere. That consistency *is* the authored feel (F15).
- Ambient loops (marquee 30s, orb drift, shader time) are documented exemptions from the duration rule.

### 4.4 Component craft
- **Double-bezel card:** outer `rounded-3xl(24px) bg-white/[0.02] p-1.5 ring-1 ring-white/[0.06]` → inner `rounded-[1.125rem](18px) bg-surface ring-inset ring-white/[0.04]` + inset top highlight. Hover glow = pre-rendered opacity-only layer (never a `box-shadow` tween). No backdrop-blur on cards. Reserve the full bezel for project/pricing cards; quieter content gets single-shell.
- **Pill CTA (button-in-button):** `rounded-full`, label `pl-6`, 36px arrow circle flush right (`pr-1.5`), arrow does a diagonal dual-swap on hover, `active:scale-[0.98]`. Ghost variant adds the fill-wipe (catalog 26: `scaleX` from `origin-left`, transform-only, never a color fade). MagneticButton composes around it unchanged.
- **Eyebrow:** JetBrains Mono `text-xs uppercase tracking-[0.2em] text-ink-dim` + 24px accent tick, optional `/ 01` index. ≤3 per page.
- **Spacing:** sections `py-24 md:py-32 lg:py-40`; container `max-w-7xl mx-auto px-6`; 8px grid; one canvas color site-wide (depth from cards/hairlines, never alternating section backgrounds).
- **Focus (load-bearing — custom cursor hides the pointer):** global `:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px }`; pills get offset 4px. Keyboard focus on list rows = hover-equivalent state minus pointer-only effects.

### 4.5 Atmosphere
- **Film grain (35):** one fixed `pointer-events-none` div at z-30, feTurbulence data-URI tiled, **static**, 3.5% opacity, no blend mode (avoid interfering with the z-60 difference cursor). Cut first if it costs a Lighthouse point.
- **Ambient orbs (36):** max 2 site-wide (CTABanner + the one featured "noise+glow" card), never in the hero (The Field owns it). Pre-baked radial gradients, transform-drift only, ≤1 on mobile.
- **Divider motif (38):** a "contour tick" (concentric arc strokes) echoing The Field — eyebrow tick's big sibling, section-boundary hairlines, /work row bullets. The D4 SVG line-draw moment is the /about contour divider drawing via dashoffset scrub.

### 4.6 z-index scale (closed — no new values, no `z-[9999]`)
`grain 30 < header 40 < scroll-progress 45 < mobile-overlay / skip-link 50 < transition-curtain & preloader 55 < cursor 60`. Nothing between body and the cursor may create a stacking/blend-isolating context (transform/filter/opacity<1 on a full-screen wrapper kills the `mix-blend-difference` cursor — test after every atmosphere layer).

---

## 5. Per-Section Effect Matrix (one catalog effect each)

The masked-line / clip-wipe **reveal language** is the sitewide baseline (not counted as a section's "moment"); each section then gets exactly ONE catalog effect on top.

| Page / Section | Effect (catalog #) | Notes |
|---|---|---|
| Global — ScrollProgress | top progress bar (8) | rebuilt off Lenis progress, Motion spring deleted, **solid accent** (not gradient — B3) |
| Global — Cursor | dot+ring+VIEW states (22) | quickTo; VIEW over project rows/cards; off on touch/RM |
| Global — Buttons | fill-wipe (26) + arrow-in-circle (F18) | micro vocabulary, not a section moment |
| Home — Hero | orchestrated opening (Phase 3 / built on 1) + The Field shader (30) | the opening *is* the moment; shader is the signature, pre-approved budget |
| Home — Marquee | scroll-velocity skew (4) | keep CSS loop, add lenis-velocity `skewY` clamp 6°, hover-pause; off mobile/RM |
| Home — Stats | kinetic counters (27) + LineDraw underline | 1.2s, tabular mono, accent underline draws with the count |
| Home — FeaturedWork | **sticky stacked cards (12)** | satisfies D8 #1; 3 fixed featured projects; mobile = vertical stack, no pin |
| Home — Services | clip-path wipe reveal (15) | 120ms stagger; reveal grammar as block reveal |
| Home — Process | connector line-draw (9) | KEEP (already shipped GSAP); ruled a *connector*, not a timeline → preserves D9 |
| Home — Testimonials | per-line masked quote reveal (1) | **delete the carousel** (3 placeholder quotes don't earn one; also kills a stale-resize bug) → calm grid |
| Home — TechStack | mouse-tracked spotlight (24) | radial accent glow saturates icons within radius; desktop only; readable without it (R7) |
| Home — CTABanner | magnetic CTA (23) | one magnetic pull on the most important button; +1 orb pair replaces the deleted gradient tint |
| /about — Bio | teleprompter scroll-lit words (2) | words 13%→100% opacity on scrub; trigger ends fully resolved (≥4.5:1) |
| /about — Experience | **timeline draw (8)** — THE only timeline (D9) | vertical `scaleY` spine scrubbed, nodes pop, entries slide in; the motif's flagship |
| /about — How I Work | staggered slide-in list (19) | rows from left 100ms apart; hover expands letter-spacing, tints number |
| /work — Gallery | **hover preview follows cursor (18)** | satisfies D8 #2 (deliberately different from home); filters via Flip + refresh-after-filter; mobile = rows + inline thumbs |
| /work/[slug] — Case study | sticky split scrollytelling (13) | formalize the existing sticky sidebar; active item gets a LineDraw indicator; counters reuse Stats component |
| /services — Pricing | clip-path wipe (15) + Growth ring LineDraw | mirrors home Services grammar; drawn ring is the single emphasis on the highlighted tier |
| Footer | LineDraw divider (once) + kinetic-weight hover (5) | the one variable-font moment |
| Global — Page transitions | enter wipe (34) | `template.tsx` remount; curtain leading edge is the signature line |

**Deliberately unspent** (restraint is the brief; D8 already satisfied twice): horizontal gallery (11), Flip morph (21), scramble outside the preloader (3), glitch (6), dual-wave (7), tilt (16), gradient borders (17), all extra WebGL (29/31/32/33). The hero shader is the entire WebGL budget.

---

## 6. Verified Technical Patterns (follow exactly)

### 6.1 `lib/gsap.ts` — single registration point (client-only)
```ts
'use client'
import { gsap } from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Flip } from 'gsap/Flip'
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin'
import { CustomEase } from 'gsap/CustomEase'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, Flip, DrawSVGPlugin, ScrambleTextPlugin, CustomEase)
CustomEase.create('jdFlow', 'M0,0 C0.7,0 0.18,1 1,1')
export const DUR = { micro: 0.4, std: 0.8, hero: 1.2 } as const
export { gsap, useGSAP, ScrollTrigger, SplitText, Flip }
```

### 6.2 `SmoothScrollProvider` — Lenis, StrictMode-safe, RM-gated
```tsx
'use client'
import { ReactLenis, type LenisRef } from 'lenis/react'
import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'

export function SmoothScrollProvider({ children }) {
  const reduce = useRef(typeof window !== 'undefined'
    && matchMedia('(prefers-reduced-motion: reduce)').matches).current
  const lenisRef = useRef<LenisRef>(null)

  useEffect(() => {
    if (reduce) return                       // RM → native scroll, no Lenis
    function update(time: number) { lenisRef.current?.lenis?.raf(time * 1000) }
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)
    const onScroll = () => ScrollTrigger.update()
    lenisRef.current?.lenis?.on('scroll', onScroll)
    return () => { gsap.ticker.remove(update) }   // named callback; ReactLenis owns destroy()
  }, [reduce])

  if (reduce) return <>{children}</>
  return <ReactLenis root options={{ lerp: 0.09, wheelMultiplier: 1.1, autoRaf: false /* CRITICAL */, syncTouch: false }} ref={lenisRef}>{children}</ReactLenis>
}
```
- Delete `html { scroll-behavior: smooth }` in the same commit. Route skip-link + case-study anchors through `lenis.scrollTo(target, { immediate: true })` then `focus({ preventScroll: true })`. Rewire Header mobile-menu lock from `documentElement.style.overflow` to `lenis.stop()/start()`. Rebuild ScrollProgress + Header smart-hide off the single Lenis callback (delete the Motion spring).

### 6.3 Reveal primitive (runtime-set states — never CSS-hidden)
```tsx
useGSAP(() => {
  const mm = gsap.matchMedia()
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    const split = SplitText.create(ref.current, { type: 'lines', mask: 'lines', aria: 'auto', autoSplit: true,
      onSplit(self) {                                   // re-runs on font-load/resize; revert is automatic
        return gsap.from(self.lines, { yPercent: 110, duration: DUR.std, stagger: 0.08, ease: 'expo.out',
          scrollTrigger: { trigger: ref.current, start: 'top 80%', once: true } })
      }})
    return () => split.revert()
  })
}, { scope: ref })
```
No-JS / RM render the text fully visible (it ships `opacity:1`); GSAP only *animates* what's already there (R7). Retire the `noscript [data-reveal]` hack only in the same commit the last Motion reveal is gone.

### 6.4 Route-change cleanup (in the transition provider / template)
```tsx
useEffect(() => {
  lenisRef.current?.lenis?.scrollTo(0, { immediate: true })
  const r = requestAnimationFrame(() => requestAnimationFrame(() => ScrollTrigger.refresh()))
  return () => cancelAnimationFrame(r)
}, [pathname])
```
Component-scoped `useGSAP({ scope })` auto-reverts each route's triggers/splits on unmount — assert `ScrollTrigger.getAll().length` returns to the chrome baseline in dev.

### 6.5 LCP-safe opening
H1 ships server-rendered, `opacity:1`, final position. A pre-paint inline `<head>` script reads `sessionStorage('jd-seen')` + reduced-motion and sets `html[data-preloader="pending"]` *before first paint*. The overlay is `display:none` unless that attribute is set (no-JS/crawlers never see it; LCP fires on the painted H1 underneath). CSS failsafe: overlay `visibility:hidden` after 3s so a JS error can't strand anyone. `lenis.start()` + `sessionStorage.set` + `ScrollTrigger.refresh()` in the timeline's `onComplete`. Strip `.anim-char`/`.anim-rise` from the hero in the same commit the GSAP opening lands. **Cut criterion:** if mobile Perf < 95 after two mitigation rounds, ship without the preloader (R9) — the CSS entrance remains.

---

## 7. The Phased Build Plan

> Dependency chain: **0 → 1 → 2 → 3 → 4 → 5(per section) → 6 → 7 → 8 → 9.** The only parallel track is content/launch cleanup (§8 items, can run alongside any phase).

### Phase 0 — Approval gate *(this document)*
- **Goal:** lock the §3 decisions.
- **Exit:** Jay confirms/overrides D-1…D-10. Rewrite `DESIGN.md` to the approved system (it currently declares the old tokens locked — this plan is the explicit unlock request).

### Phase 1 — Environment + perf/a11y baseline *(blocker, no rebuild work yet)*
- `rm -rf .next`, audit disk, `npm ci` (sync the stale tree), `npm i lenis`, `next build` green.
- Apply the three already-diagnosed fixes **on the current code**: (a) HeroBackground idle-gate the shader mount behind `window load` + `requestIdleCallback(~2500ms)`; (b) tighten hero `anim-rise` delays (subtext 0.75→~0.4s, CTAs 0.9→~0.55s); (c) `text-muted` → readable token contrast sweep.
- **Exit gate:** Lighthouse on `/`, `/work`, `/work/custom-google-search-kit`, `/about`, `/contact` → **Performance ≥ 95, Accessibility = 100** (mobile + desktop). This is the reference number every later phase is diffed against. *No rebuild work starts until this is green* — otherwise regressions can't be attributed.

### Phase 2 — Design foundation
- OKLCH tokens in `globals.css` (register **both** old `text-primary/secondary` and new `text-ink/ink-dim` names against the same vars for a no-big-bang rename; delete aliases in Phase 9). Delete violet/pink/`bg-gradient-hero`/`--shadow-glow`. Hex-twin conversion table comment.
- Dark-only: remove `next-themes`, `ThemeProvider`, `ThemeToggle`, `.light` block, `light:` usages, shader `isLight`; add `color-scheme: dark` + `themeColor`.
- Fonts: Syne + DM Sans + JetBrains Mono via `next/font`; clamp scale; motion vocabulary custom properties (`--ease-out-expo`, `--dur-1/2/3`); global `:focus-visible` rule; `::selection` recolor.
- Component primitives (pure CSS/markup, no GSAP dependency): Button (pill + arrow-circle + fill-wipe), Card (double-bezel), SectionLabel (mono eyebrow + tick), contour-tick SVG asset.
- **Parallel cheap wins (§8):** fix the planToBudget select bug, unify base-URL fallback, wire or delete `seo.home`, move hardcoded headings into `content.ts`.
- **Exit gate:** build green; full-site visual QA at 375/768/1440 (Syne is wider — re-check hero overflow); Lighthouse delta ≥ −2; CLS spot-check on font swap.

### Phase 3 — Motion infrastructure (no new visual effects yet)
- `lib/gsap.ts` (§6.1), `SmoothScrollProvider` (§6.2) mounted in root layout, remove `scroll-behavior: smooth`, anchor/skip-link/menu-lock rewiring, rebuild ScrollProgress + Header smart-hide off Lenis, dev ScrollTrigger leak counter.
- Build the primitives: `RevealText` (§6.3), `FadeUp`, `Parallax`, `Pin`, `LineDraw`, `Counter` — all `useGSAP({ scope })`, `gsap.matchMedia` RM + `<768px` branches, runtime-set states.
- **Exit gate:** scroll has zero jank, no double-smoothing; navigate all routes twice with no ScrollTrigger leaks; RM path uses native scroll; JS-off renders everything; Lighthouse delta ≥ −2.

### Phase 4 — "The Field" (signature shader)
- Rewrite the fragment shader inside the existing gated mount into the monochrome-indigo contour field; recolor `.hero-fallback` to single-accent radials; delete `isLight` plumbing; uniforms read hex twins of `accent`/`accent-deep`.
- **Exit gate:** must be **perf-neutral vs the old shader** (iterate down iso-line count / dpr if not) before anything else proceeds. Off-screen unmount + idle-gate intact. `.hero-fallback` carries the brand on mobile if a CPU trace forces the shader cut (R4).

### Phase 5 — Section-by-section rebuild *(one tree per move; show each before the next — W5)*
Order (cheapest/lowest-risk first, riskiest pin last on a proven base):
1. **Stats** (Counter + LineDraw) — smallest surface, proves the primitives
2. **Services** + **/services pricing** (clip-wipe grammar)
3. **TechStack** (spotlight)
4. **CTABanner** + **/contact** (magnetic; spotlight on the dark column)
5. **Testimonials** (delete carousel → calm masked-line grid)
6. **/about** — teleprompter bio + **Experience timeline** (the D9 timeline + D4 line-draw flagship)
7. **/work** list + hover-preview-follow (WorkGrid Flip filtering + refresh-after-filter)
8. **Home FeaturedWork** — sticky stacked cards (the only new pin; after Lenis behavior is proven)
9. **/work/[slug]** — sticky split scrollytelling formalization
- Each section in the same commit: adopts new token names, the new primitives, its ONE assigned effect, **and** its matching `loading.tsx` geometry update.
- **Exit gate per section:** build green; the section's RM + no-JS + 375/768/1440 screenshots pass; 4×-CPU frame trace shows <5% dropped frames and no paint storms; Lighthouse spot-check after sections 4, 7, 8.

### Phase 6 — Custom cursor states
- Enhance to dot + lagging ring + **VIEW** state (over project rows/cards) via `quickTo`; keep `pointer:fine` / RM-off / `has-custom-cursor` symmetry / z-60 blend contract. Slotted here so VIEW targets exist.
- **Exit gate:** native cursor never lost on unmount; off on touch/RM; blend works above all layers.

### Phase 7 — Page transitions + atmosphere
- Enter-only wipe via `template.tsx` remount at z-55 (delete `.page-enter`); `ScrollTrigger.refresh()` after the wipe (§6.4). Film grain (static, z-30) + orbs (pre-baked, ≤2) with cursor-blend verification after each.
- **Exit gate:** RM = instant route swap + focus to `#main-content`; cursor still inverts above grain/curtain; no CLS from the wipe.

### Phase 8 — The choreographed opening *(LAST — highest LCP risk)*
- Preloader (scramble-decode, §6.5 LCP pattern) + GSAP master timeline (nav slide → SplitText masked H1 → subcopy → Field scale-in), `lenis.stop()/start()` around it, strip hero `anim-*` in the same commit.
- **Exit gate:** cold-profile mobile Lighthouse **≥ 95**. If it fails after two mitigation rounds → **cut the preloader** (R9); the CSS entrance is the permanent opening.

### Phase 9 — Full QA matrix + D13 + launch cleanup
- All 5 routes × Lighthouse (mobile + desktop) ≥ 95 / 100; 375/768/1440 × default/RM screenshots; JS-off pass; keyboard pass; 10-navigation leak check; em-dash grep on touched copy.
- Delete old token aliases; retire `noscript [data-reveal]` (only if every reveal is now runtime-set); regenerate `og-image.png`; rewrite README + `DESIGN.md`.
- **D13:** prod build, screenshot every section, self-critique against this plan + the spec checklist, fix gaps, then report done.

---

## 8. Operational / Launch Cleanup Track (under-owned — do not let it slip)

These are real and separate from the motion work. Cheap ones land in Phase 2; content blockers are Jay's.

| Item | Action | Owner |
|---|---|---|
| **planToBudget select bug** | `contact/page.tsx:16-19` maps `"$1k - $5k"` (spaces) but options are `"$1k-$5k"` — `?plan=` pre-select silently fails. Fix the strings. | Phase 2 |
| **Dead `seo.home`** | `content.ts:743` never imported; `/` uses root default title. Wire it or delete it. | Phase 2 |
| **Base-URL fallback divergence** | `layout.tsx` → `localhost:3000`, `sitemap.ts`/`robots.ts` → `jaydhakan.com`. Unify. | Phase 2 |
| **Hardcoded strings** | Move into `content.ts`: about "The Short Version"/"How I Work", services "What Each Service Covers", `work/[slug]` section labels, Footer ©, ContactForm placeholder, skip-link, OG alt. | Phase 2/5 |
| **No error / 404 pages** | Add branded `not-found.tsx` + `error.tsx` (an "Awwwards-level" site shouldn't fall to the default 404). | Phase 7 |
| **5 `loading.tsx` skeletons** | Update geometry alongside each rebuilt section (same commit). | Phase 5 |
| **Missing images** | `/public/images/*` are `.gitkeep` only — 6 project covers + profile photo. **Flag, don't fake.** Caps S3/D13 until real assets land. | **Jay** |
| **Placeholder testimonials** | All 3 `isPlaceholder:true`; `content.ts:434` says replace before launch. | **Jay** |
| **Resend** | `RESEND_API_KEY` unset; `from` still `onboarding@resend.dev`; verify `jaydhakan.com` + swap sender. | **Jay** |
| **Content TODOs** | Email/LinkedIn/Upwork URLs, timeline date conflicts, positioning, unverified "50+ projects" claim. | **Jay** |

---

## 9. Risk Register (top items, each with prevention)

1. **Preloader sinks the 95+ LCP gate** → baseline fixes first; hero painted `opacity:1` under the overlay; session-once pre-paint attr; ≤1.6s; CSS visibility failsafe; measured with an explicit cut threshold (Phase 8).
2. **Build environment ENOSPC / stale tree** → Phase 1 is purely environmental before any code.
3. **Blank sections (R7)** → runtime `gsap.set` states only; `noscript` hack retired in the same commit as the last reveal; refresh after route/filter/font/image; JS-off screenshot every phase.
4. **Double-smoothing jank** → remove `scroll-behavior: smooth`, `autoRaf:false`, one rAF via gsap.ticker, delete the ScrollProgress spring.
5. **Mixed Motion+GSAP trees** → whole-tree migration per commit; grep for `motion/react` inside any tree that gained `useGSAP`.
6. **SplitText lifecycle** → `autoSplit`/`fonts.ready` gating, tweens inside `onSplit`, revert before re-split, scoped cleanup.
7. **ScrollTrigger leaks / stale pin math** → `useGSAP({ scope })`, dev leak counter, `refresh()` after wipe, `invalidateOnRefresh` on pins.
8. **Reduced-motion regressions** → matchMedia-conditioned setup (never post-hoc disable); kill-list update is part of every new CSS animation's DoD; Playwright RM screenshot pass per phase.
9. **A11y slips from 100** → contrast sweep in Phase 1; focus-visible audit per phase; scramble/glitch ≤2 changes/sec; teleprompter rests ≥4.5:1.
10. **Mobile main-thread saturation** → shader idle-gated + off-screen unmount; WebGL budget stays at one shader; 4×-throttle traces per phase.

---

## 10. Definition of Done (spec D1–D13)

- [ ] D1 — Opening = one orchestrated timeline (preloader → wipe → hero reveal), scroll locked until complete *(first-visit, motion-allowed; skipped under RM/repeat by design)*
- [ ] D2 — Lenis + ScrollTrigger synced, zero jank
- [ ] D3 — Scroll progress indicator (top bar + /about timeline draw)
- [ ] D4 — ≥1 SVG line-draw moment (the /about contour divider)
- [ ] D5 — Every section exactly ONE catalog moment (§5 matrix)
- [ ] D6 — One signature motif repeats (The Field + drawn-line echo)
- [ ] D7 — Custom cursor with states, off on touch
- [ ] D8 — Project displays use ≥1 of the four (stacked cards on home + hover-preview on /work)
- [ ] D9 — Timeline ONLY in /about Experience (Process ruled a connector)
- [ ] D10 — `prefers-reduced-motion` fully handled; mobile deliberately simplified
- [ ] D11 — Characterful display face, contrast verified, spacing rules respected
- [ ] D12 — Lighthouse ≥ 95, 60 FPS, responsive mobile
- [ ] D13 — Run site, screenshot every section, self-critique, fix, then report *(passes on motion/layout fidelity; content gaps stay logged as Jay blockers)*
```
