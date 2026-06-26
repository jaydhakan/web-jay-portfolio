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
