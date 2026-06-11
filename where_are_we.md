# WHERE ARE WE — Jay Dhakan Portfolio Build Handoff
> Continuation doc for the next Claude Code session. Read this FIRST, fully.
> Last updated: 2026-06-11 (end of session 1).

---

## 1. What this project is

A world-class, Awwwards-feel personal portfolio for **Jay Dhakan** (Python & AI/ML engineer, India) that converts visitors into client inquiries. Dark-first, electric-indigo (#5B6EF5), editorial, premium, "code as craft, motion as proof."

**Authoritative inputs (read in this order next session):**
1. `where_are_we.md` (this file)
2. The MASTER INITIAL PROMPT (pasted in chat session 1 — its full spec is mirrored in §6 + `docs/Jay_Portfolio_Prompts.md` which is ~95% the same content)
3. `docs/Jay_Portfolio_BuildGuide.md` — research foundation (reference sites, conversion structure, trends)
4. `docs/jay_information/Jay_Dhakan_Resume_2.pdf` + `Jay_Dhakan_Resume_4.pdf` — single source of truth for content
5. `PRODUCT.md` + `DESIGN.md` — strategy + visual system (written, done)
6. `data/content.ts` — ALL site content, populated from resumes, with `TODO(JAY)` flags

**Skills to load next session** (user has them installed; invoke before building UI):
- `/impeccable` (process + anti-slop bans)
- `/high-end-visual-design` (agency execution: double-bezel cards, button-in-button CTAs, island nav, spring physics)
- `/design-taste-frontend` (hard layout rules, em-dash ban, pre-flight checklist)
- Persistent memory also has the full status: `portfolio-project-status.md` in auto-memory.

---

## 2. Where we are vs. the Build Guide stages

| Build Guide stage | Status |
|---|---|
| **Stage 1 — Foundation** (Next + TS + Tailwind + tokens + Resend wiring) | ~80% done. Scaffold + tokens + libs done; Resend action NOT yet written; **package upgrade pending (§4)** |
| **Stage 2 — Structure for conversion** (hero → case studies → process → testimonials → pricing → contact) | Content layer done (`data/content.ts`); **zero UI built yet** |
| **Stage 3 — Signature + polish** (R3F shader hero, custom cursor, magnetic buttons, glass nav, micro-interactions) | Not started |

### Master prompt's 15-step build order — progress
- [x] 1. Scaffold (Next.js **14.2.35** — see §4, must upgrade)
- [x] 2. Dependencies installed (currently React-18-era pins — see §4)
- [x] 3. `tailwind.config.ts` token system (CSS vars in `app/globals.css`, dark `:root` + `.light` override)
- [x] 4. `lib/animations.ts` (+ `lib/utils.ts` with `cn()`)
- [x] 5. `data/content.ts` populated from resumes — **CHECKPOINT shown to user; answers still pending (§5)**
- [ ] 6. UI primitives: `Button → Card → Tag → SectionLabel → AnimatedText → MagneticButton` (+ `CountUp`)
- [ ] 7. Layout: `CustomCursor → ScrollProgress → Header → Footer → PageTransition`
- [ ] 8. Homepage sections in order: `Hero → Stats → FeaturedWork → Services → Process → Testimonials → TechStack → CTABanner`
- [ ] 9. Inner pages: `/work` → `/work/[slug]` → `/about` → `/services` → `/contact`
- [ ] 10. Resend contact server action (`app/actions/contact.ts`, React Email template)
- [ ] 11. SEO metadata per page + `app/sitemap.ts` + `app/robots.ts` + OG image
- [ ] 12. Dark/light toggle (next-themes; CSS vars already support it)
- [ ] 13. `loading.tsx` skeletons per route
- [ ] 14. `npm run build` zero errors / zero ESLint errors
- [ ] 15. Lighthouse 95+ perf / 100 a11y; mobile 375 / tablet 768 / desktop 1440 checks; keyboard-only pass; JS-disabled readability

**Last verified state: `npm run build` passes green** (placeholder homepage only).

---

## 3. What exists in the repo right now

```
app/layout.tsx        ← Plus Jakarta Sans (next/font), metadata from content.ts, skip-link
app/page.tsx          ← TEMPORARY placeholder hero (replace in step 8)
app/globals.css       ← all color tokens as CSS vars (dark default, .light theme), base styles, reduced-motion safety net
tailwind.config.ts    ← token system: bg base/surface/elevated, text primary/secondary/muted,
                        accent primary/violet/warm, border-token, shadow-glow, gradient-hero,
                        animate-marquee (30s), animate-pulse-dot, font-display/body
lib/animations.ts     ← fadeUp/fadeIn/staggerContainer/scaleIn/slideInLeft + shared cubic-bezier transition + viewportOnce
lib/utils.ts          ← cn()
data/content.ts       ← THE single source of truth. All copy, projects, stats, pricing, SEO. Read it fully before building UI.
components/{ui,sections,layout}/   ← empty dirs, ready
app/actions/          ← empty dir, ready
public/images/{profile,projects,logos}/ ← empty, awaiting assets
.env.local.example, vercel.json, PRODUCT.md, DESIGN.md
```

---

## 4. ⚠️ NEW USER DIRECTIVES (override earlier instructions — given end of session 1)

1. **Use LATEST packages, not older ones.** This OVERRIDES the master prompt's "Next.js 14 do not deviate". **First task next session = upgrade pass:**
   - `next@latest` + `react@latest` (React 19) + matching `eslint-config-next`
   - `tailwindcss@4` — migrate tokens from `tailwind.config.ts` to CSS-first `@theme` in `globals.css` (CSS vars already exist, so migration is mostly mechanical; keep class names `bg-base`, `text-secondary`, `border-token`, etc. identical so future UI code is unaffected)
   - `framer-motion` → **`motion`** package (import from `"motion/react"`)
   - `@react-three/fiber@9` + `@react-three/drei@10` + latest `three` (+ matching `@types/three`) — R19 compatible
   - latest `lucide-react`, `resend`, `@react-email/components`, `react-hook-form`, `@hookform/resolvers`, `zod` (v4 — update schema syntax if needed), `gsap`, `@gsap/react`, `next-themes`
   - After upgrade: `npm run build` must pass before any UI work. Check breaking changes: Next async `params`/`searchParams` in pages, `next/font`, Tailwind v4 config style, zod v4 API.
2. **Step-by-step, not everything in one go.** Build ONE step at a time (one component / one section per move), verify it renders/compiles, then continue. User wants to follow along.
3. **"Attractive, unique, best."** Execution quality per the three loaded skills. Keep the master prompt's identity (indigo tokens, Plus Jakarta Sans, dark-first, custom cursor, R3F shader hero, section structure) but execute at agency grade, and where the prompt is *silent*, prefer the skills' rules:
   - No em-dashes anywhere in visible copy (content.ts already complies)
   - Motion: spring/custom-bezier only, never linear/ease-in-out; every animation motivated; `useReducedMotion()` gates everything
   - Glass only on fixed/sticky elements (header, mobile overlay)
   - One radius system (rounded-2xl cards / rounded-full pills per master prompt)
   - Hero: max 4 text elements, fits viewport, `min-h-[100dvh]` never `h-screen`
   - Animate only transform/opacity; no `window.addEventListener('scroll')` (use Motion `useScroll`/GSAP ScrollTrigger/IntersectionObserver)
   - No `useState` for continuous values (cursor/magnetic = `useMotionValue`/`useSpring`)
   - GSAP isolated in client leaf components with cleanup (`gsap.context` + revert); never mixed with Motion in the same tree
   - Section layout variety (don't repeat the same grid family every section); bento cells = exact content count
   - Real images or labeled placeholder slots; no div-based fake screenshots; no hand-rolled SVG illustrations
   - WCAG AA contrast everywhere; focus rings `ring-2 ring-accent-primary ring-offset-2 ring-offset-base`

---

## 5. OPEN QUESTIONS for Jay (all marked `TODO(JAY)` in data/content.ts — ask or proceed with current assumptions)

1. **Resume conflict:** Resume_2 = "2+ yrs", BotPro 2023–present. Resume_4 = "4+ yrs", BotPro 2021–2024, VRSEN 2024–2025. Timeline currently follows Resume_4 + assumes "2025–Now: Independent".
2. **Positioning:** resumes say "Python & AI/ML Engineer"; original brief said "full-stack developer". Site currently uses resume positioning (stronger niche). Confirm.
3. **Stats:** brief's "50+ projects / 30+ clients / Top Rated on Upwork" are NOT in resumes → currently using 15M+ queries/day, 99.9% uptime, 70M records, 50% SaaS cost cut. `contact.upworkBadge` ("Top Rated on Upwork") also unverified.
4. **Email:** `hello@jaydhakan.com` (brief) vs `jaydhakan11@gmail.com` (resume). Domain exists?
5. **Links:** Upwork URL empty (UI should hide it while empty); LinkedIn assumed `/in/jay-dhakan`.
6. **Client attribution:** OK to publicly name VRSEN / BotPro Solutions / CinqCare? (6 case studies currently attribute them.)
7. **Testimonials:** 3 entries are `isPlaceholder: true` — must be replaced before launch.
8. **Assets needed:** profile photo (`public/images/profile/jay.jpg`) + 6 project covers (`public/images/projects/*.png`) + OG image (1200×630).

---

## 6. Key design/spec decisions already locked (do not re-litigate)

- **Register:** brand (portfolio = design is the product). PRODUCT.md has principles; DESIGN.md has the full token table (dark + light values).
- **Tokens:** bg `#0A0A0F / #111118 / #1A1A26`; accent indigo `#5B6EF5`, violet `#8B5CF6`, warm pink `#EC4899` (very sparing); text `#F0F0FF / #8A8AA8 / #4A4A6A`; border `rgba(255,255,255,0.07)`; success `#22C55E`; gradient-hero 135deg indigo→violet→pink (CTA banner tint @ ~12% + OG image only).
- **Type:** Plus Jakarta Sans only (`--font-jakarta`, already wired in layout.tsx). Scale: 7xl hero / 5xl section / 3xl card / xl sub / base body / sm-tracking-widest-uppercase eyebrows.
- **Visual signature:** R3F liquid indigo/violet shader hero bg (dynamic import, ssr:false, minimal draw calls, mouse parallax, must not hurt Lighthouse) + character-stagger H1 ("I Build Products / That Actually Ship.") + custom cursor (8px dot → 40px difference ring; off for touch + reduced-motion) + magnetic CTAs + glass header after 60px scroll + CountUp stats + GSAP connector line in Process.
- **Homepage section order:** Hero → Stats → FeaturedWork (asymmetric 60/40 bento, 3 featured projects) → Services (6 cards) → Process (4 steps) → Testimonials (drag carousel) → TechStack (grouped icons, grayscale→color hover) → CTABanner.
- **Conversion rules (Build Guide §5):** CTA above fold + after case studies + footer; case studies = problem → approach → built → results (real numbers, already structured in content.ts); visible pricing on /services (Starter $1,500 / Growth $5,000 ★ / Custom).
- **Hard gates:** Lighthouse 95+ perf, 100 a11y; skip-link (done); labels on all inputs; aria-hidden marquee + cursor; keyboard focus visible everywhere.

---

## 7. Exact plan for next session (in order, one step at a time)

1. Read this file + `data/content.ts` + `DESIGN.md`; load the three skills.
2. **Upgrade pass (§4.1)** → `npm run build` green. Commit.
3. Step 6 — UI primitives, one at a time: Button → Card → Tag → SectionLabel → AnimatedText → MagneticButton → CountUp. Each: build, typecheck, show user.
4. Step 7 — layout components (CustomCursor, ScrollProgress, Header, Footer, PageTransition), wire into `app/layout.tsx`.
5. Step 8 — homepage sections one by one, starting with Hero (R3F shader is the riskiest piece — build it early, verify Lighthouse impact, have a CSS-gradient fallback ready).
6. Then steps 9–15 per §2 checklist.
7. Git: repo has only the initial commit; start committing per completed step (user hasn't asked for pushes).

**Run dev server:** `npm run dev` (port 3000). **Verify:** `npm run build`.
