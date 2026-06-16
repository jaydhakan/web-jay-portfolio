# Jay Dhakan — Portfolio

A premium, motion-led portfolio for Jay Dhakan (Python & AI/ML engineer). Dark,
indigo-accented, editorial; the site is itself the engineering proof — Lighthouse
**Performance ≥ 95 / Accessibility = 100** is a hard gate, not a nice-to-have.

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4**
- **GSAP** (ScrollTrigger, SplitText, Flip, DrawSVG, ScrambleText, CustomEase) for all motion
- **Lenis** smooth scroll, driven off the GSAP ticker
- **three / @react-three/fiber** for one hero shader ("The Field"), lazy + interaction-armed
- `react-hook-form` + `zod` (contact form) · `resend` (email) · `lucide-react` (icons)

No `motion`/framer-motion — every animation is GSAP or CSS.

## Scripts

```bash
npm run dev     # dev server (http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Structure

```
app/                 routes (App Router) + globals.css + opengraph-image + error/not-found
components/
  layout/            Header, Footer, SmoothScrollProvider, CustomCursor, FilmGrain,
                     OpeningChoreo, PageTransition, ScrollProgress, AnchorScroll
  motion/            reveal primitives: RevealText, FadeUp, Parallax, Pin, LineDraw,
                     Counter, ClipReveal, Spotlight, Teleprompter
  sections/ ui/ work/ contact/   page sections + UI atoms
data/content.ts      ALL copy (single source — no hardcoded strings in components)
lib/gsap.ts          single GSAP registration point (core eager, heavy plugins lazy)
```

## Docs

- **`DESIGN.md`** — the shipped design system (tokens, type, motion, components, z-scale, signature).
- **`plan.md`** — the design bible (rationale, technical patterns, risk register).
- **`PHASES.md`** — live build tracker (phase status, exit gates, changelog).
- **`docs/final_prompt.md`** — the master spec (effects catalog, hard rules, banned list, DoD).

## Conventions

- All visible copy lives in `data/content.ts`; no em/en dashes in copy.
- Animate only `transform` / `opacity` / `clip-path` / `filter`; `prefers-reduced-motion`
  fully handled; mobile is a deliberately simplified experience.
- Closed z-index scale (see DESIGN.md); nothing may create a blend-isolating context
  beneath the `mix-blend-difference` cursor.

## Before launch (content / env — owner: Jay)

- Real project covers → `public/images/projects/<slug>.jpg`, profile photo →
  `public/images/profile/jay.jpg` (currently honest gradient placeholders).
- Replace the 3 placeholder testimonials in `data/content.ts`.
- Confirm email / LinkedIn / Upwork URLs and resume timeline dates.
- Set `RESEND_API_KEY` + a verified `from:` domain, and `NEXT_PUBLIC_SITE_URL`.
