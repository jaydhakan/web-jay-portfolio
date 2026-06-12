# Where Are We — Build Handoff

> Context doc for continuing this build in a fresh AI chat. Read this, then
> `PRODUCT.md` + `DESIGN.md` (the locked product/design specs) before writing
> any code. Source brief lives in `docs/Jay_Portfolio_Prompts.md` and
> `docs/Jay_Portfolio_BuildGuide.md`; resume facts in `docs/jay_information/`.

## What this is

Premium dark-first portfolio for **Jay Dhakan, Python & AI/ML engineer**
(LLM chatbots, multi-agent automation, data pipelines). Agency-grade visual
bar: think Linear/Vercel, not a template. All copy lives in
`data/content.ts` (single source of truth, zero hardcoded strings in
components; every metric traces to a resume bullet, open questions are marked
`TODO(JAY)` at the top of that file).

**Stack:** Next 16 (App Router, async params/searchParams), React 19,
Tailwind v4 (CSS-first config — no `tailwind.config`, everything in
`app/globals.css` via `@theme`), `motion` package (not framer-motion), GSAP +
ScrollTrigger + `@gsap/react`, R3F 9 + three, react-hook-form + zod v4,
Resend + React Email, lucide-react, next-themes (dark default = `:root`,
light = `.light` class — there is NO `dark:` variant; a custom `light:`
variant exists in globals.css).

## Status: ~95% built. Everything is committed on `main`.

```
38af217 feat: SEO infrastructure + loading skeletons
f511296 feat: inner pages (/work, /work/[slug], /about, /services, /contact)
8c92b78 feat: homepage sections (Stats, FeaturedWork, ..., CTABanner)
9ed33b8 feat: hero with R3F liquid shader, CSS entrance choreography, marquee
4ffbc1a feat: layout shell (Header, Footer, CustomCursor, ScrollProgress, ThemeProvider)
4ebec4d feat: UI primitives (Button, Card, Tag, ..., CountUp)
7ef2463 feat: upgrade to Next 16, React 19, Tailwind v4, motion, R3F 9
```

All pages exist and were visually verified at 375/1440 (screenshots via
`scripts/screenshot.mjs`): `/` (Hero+shader, Marquee, Stats, FeaturedWork
bento, Services, Process, Testimonials carousel, TechStack, CTABanner),
`/work` (filter pills + Motion layout grid), `/work/[slug]` (SSG, sticky
IntersectionObserver sidebar, CountUp results), `/about`, `/services`
(pricing trio, Growth highlighted), `/contact` (zod form → Resend server
action, honeypot, `?plan=` budget pre-select). sitemap/robots/OG image/
loading skeletons done. `tsc`, `eslint`, `next build` all green.

## ⛔ UNFINISHED: Final QA gates (this is the next task)

Lighthouse was run once against the production build (`npm run build && npm
run start`, then `npx lighthouse http://localhost:3000 ...`):

| Category | Score | Gate |
|---|---|---|
| Performance | **64** ❌ | 95+ |
| Accessibility | **96** ❌ | 100 |
| Best practices | 100 ✓ | |
| SEO | 100 ✓ | |

Diagnosed causes + planned fixes (not yet applied):

1. **TBT 3,350ms** (the big one): three.js/R3F initializes on the main
   thread during the load window. Fix: in
   `components/sections/HeroBackground.tsx`, gate the shader mount behind
   window `load` + `requestIdleCallback` (timeout ~2500ms, `setTimeout`
   fallback) in addition to the existing reduced-motion/WebGL/in-view gates.
   The CSS `.hero-fallback` gradient (globals.css) is designed to show
   meanwhile, and the canvas already fades in. NOTE: the strict
   `react-hooks/set-state-in-effect` lint rule forbids *synchronous*
   setState in effects — setState inside the idle callback is fine.
2. **LCP 3.0s**: the hero subheading/H1 start at opacity 0 (entrance
   choreography), so LCP fires only when the rise animation completes.
   Tighten `anim-rise` delays in `components/sections/Hero.tsx` (subtext
   0.75s → ~0.4s, CTAs 0.9s → ~0.55s) and/or shorten char stagger in the H1.
   Re-measure; don't gut the choreography.
3. **a11y color-contrast (one failing audit)**: almost certainly
   `text-muted` (#4A4A6A ≈ 2.9:1 on base) used on small *visible* text.
   Audit usages: card year labels (`ProjectCard`), `dt` labels on case-study
   meta, "Next project" label, timeline periods (`/about`), footer © line.
   Bump those to `text-secondary`; keep `text-muted` only for aria-hidden
   decoration (Process ghost numbers are fine). Get exact offenders from the
   Lighthouse JSON (`audits['color-contrast'].details.items`).

Remaining QA checklist after those fixes:
- [ ] Re-run Lighthouse on prod build → 95+/100/100/100 (run on `/`, spot
      check `/work/custom-google-search-kit` and `/contact`)
- [ ] Keyboard pass: Tab from top — skip-link appears first, visible focus
      ring everywhere, theme toggle/menu/filters/form all operable
- [ ] No-JS check: hero text + all sections visible (CSS entrance runs
      without JS; below-fold Motion reveals are forced visible by the
      `<noscript>` style in `app/layout.tsx` targeting `[data-reveal]`)
- [ ] Reduced-motion check: globals.css kills all animation; shader replaced
      by static gradient; testimonials become a grid
- [ ] 768px (tablet) sweep — 375/1440 already verified
- [ ] Light theme sweep of inner pages (homepage verified)
- [ ] Update README.md (it's still the create-next-app boilerplate)
- [ ] `npm run build` green, commit, done

## Hard rules in force (do not regress)

- **Em/en dashes are banned in visible copy** (use commas/colons/hyphens for
  ranges). Already swept; keep new copy clean. Code comments exempt.
- Motion and GSAP must NEVER mix in one component tree. GSAP is isolated to
  `Process.tsx` (via `useGSAP` + `gsap.matchMedia`). Everything else uses
  `motion/react` or pure CSS.
- Hero entrance is **server-rendered CSS** (`anim-rise`, char spans), not JS,
  for LCP and no-JS resilience. Don't convert it to Motion.
- Every Motion reveal element carries `data-reveal` (noscript contract).
- All tokens in `app/globals.css` `@theme`. Accents: indigo `#5B6EF5`
  (washes/text) and `--accent-solid #4A5CF4` (solid CTA fills, white text).
  Shapes: buttons/pills full, cards `rounded-2xl`, inputs `rounded-xl`.
  No gradient text, no glassmorphism, no emoji as icons (lucide only).
- Eyebrow labels: max ~3 per page (budgeted; don't add one to every section).
- Real images or designed placeholder slots only — `lib/images.ts
  publicImageExists()` is checked **server-side** and passed down as
  `hasCover`/`hasPhoto` props (fs cannot be called in client components).
- Placeholder testimonials stay clearly labeled until Jay supplies real ones.
- Strict React lint rules are on: no sync setState in effects (use
  `useSyncExternalStore` — see `HeroBackground.tsx`/`CustomCursor`), no
  mutating memoized objects in effects (R3F uniforms are mutated inside
  `useFrame` instead — see `HeroShader.tsx`).

## Environment quirks (will bite you)

- **Disk is nearly full** (96GB disk, ~1.8GB free after cleanup). `.next`
  (~500MB) and `~/.npm` caches were deleted to make room and regenerate on
  demand. If a build/install fails with ENOSPC: `rm -rf .next` and retry.
  Don't delete anything outside the project / npm caches without asking.
- Visual verification: `node scripts/screenshot.mjs <url> <outPrefix>
  [fullPage 0|1] [theme light]` → writes `<prefix>-desktop.png` (1440x900)
  + `<prefix>-mobile.png` (375x812). Uses system Chrome via puppeteer-core
  with SwiftShader so the WebGL shader renders headless. Full-page mobile
  captures show a duplicated hero at the bottom — known Chrome
  fullPage+`100dvh` stitching artifact, not a real bug; use viewport shots
  at scroll offsets to verify mobile sections.
- Dev server: `npm run dev` (Turbopack). Kill with `pkill -f "next dev"`.
- devicon CDN icons: slugs were verified with curl; `huggingface` doesn't
  exist (text fallback), AWS uses `plain-wordmark`, and monochrome marks
  (GitHub/AWS/Flask) use `iconInvertDark` + the `light:` variant.
- `RESEND_API_KEY` is not set anywhere — the contact action returns a
  graceful "email me directly" error until Jay adds it (plus a verified
  `from:` domain; currently `onboarding@resend.dev`).

## Open items for Jay (all marked TODO(JAY) in data/content.ts)

1. Real project cover screenshots → `public/images/projects/<slug>.jpg`
   (paths already wired; placeholders render until files exist)
2. Profile photo → `public/images/profile/jay.jpg` (400x400+)
3. Real testimonials (current three are labeled placeholders)
4. Confirm: email domain (hello@jaydhakan.com vs gmail), Upwork URL
   (link hidden while empty), LinkedIn handle, years-of-experience
   discrepancy between the two resumes, positioning line
5. RESEND_API_KEY env var + domain verification in Resend
6. `NEXT_PUBLIC_SITE_URL` env (defaults to https://jaydhakan.com in
   sitemap/robots)

## Suggested next-session opening move

```
1. npm run dev → confirm boots
2. Apply the three perf/a11y fixes above (HeroBackground idle-gate,
   Hero delays, text-muted → text-secondary sweep)
3. pkill -f "next dev"; npm run build && npm run start
4. npx lighthouse http://localhost:3000 --quiet
   --chrome-flags="--headless=new --no-sandbox" --output=json
   --output-path=/tmp/lh.json   (watch disk space)
5. Iterate until 95+/100, then run the remaining QA checklist, rewrite
   README, commit.
```
