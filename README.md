# Jay Dhakan — Portfolio

A premium, motion-led portfolio for Jay Dhakan (Python & AI/ML engineer). Dark,
indigo-accented, editorial; the site is itself the engineering proof. **Accessibility
= 100 and CLS = 0 are hard gates.** Performance is measured, not capped (V3 "Go Loud"):
the desktop WebGL spectacle spends GPU freely while loading fast, and mobile stays
bold but functional (static posters for every heavy canvas).

## Stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript** · **Tailwind CSS 4**
- **GSAP** (ScrollTrigger, SplitText, Flip, DrawSVG, ScrambleText, CustomEase) for all motion
- **Lenis** smooth scroll, driven off the GSAP ticker
- **three / @react-three/fiber** for the page-wide `LatentField` particle system (one
  governed canvas per route, lazy + armed-after-paint; static poster on mobile/RM/no-WebGL)
- `react-hook-form` + `zod` (contact form) · `resend` (email) · `lucide-react` (icons)

No `motion`/framer-motion — every animation is GSAP or CSS.

## Scripts

```bash
npm run dev     # dev server (http://localhost:3000)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # eslint
```

## Run with Docker

This is a **server app** (server components, the contact server action, SSR/SSG,
image optimization) — it must run a Node server, not be served as static files.
The image uses Next's `standalone` output (`node server.js`), so it stays small
(~230MB) and ships without `node_modules`.

```bash
# build + run on http://localhost:3000
docker compose up --build

# with a working contact form (Resend) + a real public URL:
RESEND_API_KEY=re_... NEXT_PUBLIC_SITE_URL=https://yourdomain.com \
  docker compose up --build

# or plain docker:
docker build -t jay-portfolio .
docker run -p 3000:3000 -e RESEND_API_KEY=re_... jay-portfolio
```

`NEXT_PUBLIC_SITE_URL` is a **build arg** (Next inlines `NEXT_PUBLIC_*` at build
time); `RESEND_API_KEY` is a **runtime** env (the site runs without it — the
contact form just can't send mail).

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

- **`plan.md`** — the V3 "Go Loud" design bible **and** live build tracker (single source of
  truth: mandate, signature moves S1–S12, per-phase plan P1–P13, risk register, status board + changelog).
- **`DESIGN.md`** — the shipped V2 design-system baseline (tokens, type, motion, components, z-scale).
- **`PRODUCT.md`** — brand / users / positioning.

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
