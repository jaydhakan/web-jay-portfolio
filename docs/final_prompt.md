
---
# JAY PORTFOLIO V2 — MASTER BUILD PROMPT
### (Paste everything below this line into your AI IDE)

You are a principal creative developer + design lead from an Awwwards-winning studio. Your mission: audit my existing Next.js portfolio and rebuild it into a premium, cinematic, choreographed motion experience worthy of Site of the Day — Apple-level restraint with award-site craft. Not a template with effects sprinkled on. Not an animation showcase. A portfolio with a distinctive visual identity that could not be mistaken for anyone else's.

---

## MISSION & PHILOSOPHY

The portfolio must feel: **Premium. Modern. Intentional. Memorable. Fast. Professional.**

When someone visits, they should think: *"This feels like a premium product website"* — NOT *"this is a developer portfolio with animations."*

The site should communicate: **Confidence. Craft. Attention to detail. Professionalism.**

**Think:** Apple, Linear, Stripe, Framer, current Awwwards winners.
**Avoid:** Generic portfolio templates, random animations, overuse of 3D, flashy effects, gaming-style visuals.

**Core formula:**
Large typography + massive whitespace + smooth scrolling + subtle motion + minimal color palette + strong storytelling + ONE signature motion language.

> **Premium = Restraint.** Every animation must support storytelling. If an effect can be removed without hurting the experience, remove it. Orchestration beats decoration — exactly ONE intentional motion moment per section.

---

## PHASE 0 — AUDIT FIRST (before any code)

1. Read my entire project structure. List every page, section, component, and the content (projects, skills, bio, links) that must be preserved.
2. Identify which sections are keepable, which need rebuilding.
3. Output a rebuild plan: each section + the ONE effect assigned to it (from the catalog below) + the design direction (palette, type pairing, signature element).
4. **WAIT for my approval before executing anything.**

---

## PHASE 1 — INSTALL THE MOTION STACK

```bash
npm install gsap @gsap/react lenis
npm install three @react-three/fiber @react-three/drei
```

- GSAP is now 100% FREE including ALL premium plugins: ScrollTrigger, SplitText, ScrollSmoother, Flip, DrawSVG, MorphSVG, MotionPath. Use them freely.
- Use the official `useGSAP()` hook from `@gsap/react` — it handles React cleanup automatically.
- Lenis smooth scroll, synced with ScrollTrigger:

```js
const lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1.1 });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
```

Wrap this in a client-only `<SmoothScrollProvider>` in the root layout. Use Three.js / R3F sparingly — 3D should enhance, never dominate.

---

## PHASE 2 — DESIGN SYSTEM (foundation before effects)

### Color
- Use OKLCH. Define 4–6 named tokens: `bg`, `surface`, `ink`, `ink-dim`, `accent` (one bold electric color), optional second accent.
- Deep dark background, strong contrast.
- NO cream/beige defaults. NO purple-blue AI gradients. NO neon overload.
- The palette must feel chosen for ME, not generated for "a portfolio."

### Typography (typography is the hero)
- Display face with real character: **Syne, Clash Display, Cabinet Grotesk, General Sans, Fraunces, Anybody, or Bebas Neue.** Pair on a contrast axis with a clean body face.
- NEVER Inter / Roboto / Arial / Open Sans as display fonts.
- Hero `clamp()` ceiling: ≤ 9rem. Letter-spacing floor: ≥ -0.04em (tighter = letters touch = amateur).
- `text-wrap: balance` on headings. Body line length ≤ 75ch. Body contrast ≥ 4.5:1 — no washed-out gray text.
- Consider one variable font so kinetic weight/width animation is possible.

### Motion vocabulary (the whole site uses ONLY these)
- **Two easings:** `cubic-bezier(0.16,1,0.3,1)` (ease-out-expo) + one custom GSAP ease. NEVER linear or ease-in-out on user-facing motion.
- **Three durations:** 0.4s (micro), 0.8s (standard), 1.2s (hero moments). Nothing else.
- **One reveal language used consistently** — if sections wipe in, EVERYTHING wipes. That consistency is the "authored" feel.

### Reusable motion primitives (build these first, every effect derives from them)
- `<RevealText>` (SplitText line-mask reveal), `<FadeUp>`, `<Parallax speed={n}>`, `<Pin>` — declarative, consistent, auto-cleaned via `useGSAP`.

### Component craft
- Premium cards use a nested "double-bezel" structure: outer shell (subtle bg + hairline ring + p-1.5 + rounded-[2rem]) containing an inner core (own bg + inset highlight + concentric smaller radius).
- CTA buttons: rounded-full pills; trailing arrows live inside their own small circular wrapper flush right (button-in-button), which translates diagonally on hover.
- Generous macro-whitespace: sections `py-24` minimum. Sections must breathe; content never crowded. Strong vertical rhythm.
- Eyebrow labels above headings: tiny uppercase mono, letter-spacing 0.2em, with an accent tick/line.

### Signature element
Pick ONE memorable thing this site is remembered by (the preloader, a recurring wipe motif, the cursor behavior, a WebGL moment) and spend the entire boldness budget there. Keep everything around it quiet and disciplined.

---

## PHASE 3 — THE CHOREOGRAPHED OPENING (non-negotiable)

One orchestrated GSAP master timeline:

1. **Preloader:** counter ticking 0→100 with progress bar, OR my name assembling letter-by-letter, OR a scramble-decode of my name. Scroll LOCKED (`lenis.stop()`).
2. **The reveal:** preloader exits via clip-path wipe or column-stagger wipe (NOT a fade).
3. **Hero entrance:** nav slides down → headline SplitText masked-line reveal (lines slide up from behind `overflow:hidden` masks, 80ms stagger) → sub-copy fades up → hero media/3D scales in.
4. `lenis.start()` only after the timeline completes.

This single sequence is worth more than ten scattered effects.

---

## PHASE 4 — THE COMPLETE EFFECTS CATALOG

Assign from this catalog in Phase 0. Implement ONLY what's approved. One effect per section maximum.

### A. Typography & Text
1. **SplitText masked line reveal** — lines/words/chars slide up from overflow-hidden masks on scroll entry. THE staple. Revert SplitText before re-splitting.
2. **Scroll-lit word reveal (teleprompter)** — words start at 13% opacity, light up sequentially tied to scroll progress (`scrub: true`). Perfect for the about statement.
3. **Text scramble / decode** — characters cycle through random glyphs before resolving. Use for name, role, or section labels. Fires on view + on hover.
4. **Scroll-velocity skew/stretch** — text or marquee skews proportional to Lenis velocity (`lenis.on('scroll', e => e.velocity)`). Makes scrolling feel physical.
5. **Variable-font kinetic hover** — font-weight/width animates on hover via CSS transition on `font-variation-settings`.
6. **Glitch text** — chromatic-aberration clones (cyan/magenta offset) with clip-path slices, randomized every few seconds. ONE hero word max.
7. **Dual-wave text columns** — two text columns undulate in opposing sine waves driven by scroll (advanced; only if a manifesto section suits it).

### B. Scroll Storytelling
8. **Scroll progress line / timeline draw** — vertical line alongside the experience timeline DRAWS DOWNWARD as I scroll (`scaleY 0→1`, transform-origin top, scrubbed). Timeline nodes pop in + their card slides in as the line passes them. Also add a thin top-of-page scroll progress bar (fixed, scaleX = scroll progress, accent gradient).
9. **SVG line drawing** — strokes draw themselves on scroll (DrawSVG or manual stroke-dasharray/dashoffset scrub). Use for: a signature/logo that hand-draws in, connector paths between sections, underlines under key phrases, animated arrows.
10. **Pinned transform hero** — section pins (`pin: true, scrub: 1`), content morphs through 3–4 states while scrolled. Apple-style storytelling: content appears gradually, text reveals naturally, images scale slightly, sections transition smoothly.
11. **Horizontal-scroll project gallery** — pinned section, track translateX driven by scroll progress, live counter "02 / 05" + progress bar. ONLY ONE section may use this.
12. **Sticky stacked cards** — each project card pins, then scales down/fades as the next slides over it.
13. **Sticky split scrollytelling** — left column pins (title + intro), right column steps activate/dim as each crosses viewport center.
14. **Subtle parallax** — image moves slower than content, background shifts gently, layered depth. Never dramatic.

### C. Cards & Project Displays
15. **Clip-path wipe reveal** — cards revealed via `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`, staggered 120ms. Cinematic curtain feel.
16. **3D perspective tilt** — cards rotate (rotateX/rotateY ≤ 8°) following cursor, inner content at translateZ(20px) for parallax depth, spring back on leave.
17. **Animated gradient borders** — CSS mask trick (padding + `mask-composite: exclude`) so a gradient border fades in on hover.
18. **Hover image preview follows cursor** — project list rows; a fixed-position preview image lerps after the cursor while hovering each row, crossfading per row. Award-site staple.
19. **Staggered slide-in list** — rows slide from left 100ms apart; on row hover: number→accent, arrow rotates 45°, letter-spacing expands slightly.
20. **Noise + ambient glow card** — film-grain SVG overlay (3–4% opacity) + two blurred orbs drifting behind + 3D tilt. For the featured project only.
21. **Flip card→detail morph** — GSAP Flip plugin morphs the clicked card into the project detail layout.

### D. Interaction & Cursor
22. **Custom cursor system** — dot + lagging ring (lerp 0.1), states: hover (expand), drag, view ("VIEW" label over projects). Hidden via `@media (pointer: coarse)`.
23. **Magnetic elements** — buttons/words translate toward cursor within radius (delta × 0.2), spring back with ease-out-expo. Use on nav links, CTAs, skill tags.
24. **Mouse-tracked spotlight** — radial glow follows cursor over a dark zone revealing hidden text/skills underneath.
25. **Link roll hover** — text rolls up, duplicate rolls in from below (overflow hidden + translateY swap).
26. **Button fill wipe** — bg wipes in via scaleX/clip-path on hover, never a color fade. `active:scale-[0.98]` for a physical press.

### E. Numbers & Data
27. **Kinetic counters** — stats count 0→target with easeOutQuart over ~2s on scroll entry, staggered, gradient underline bar draws simultaneously.
28. **Marquee strips** — infinite CSS loop (translateX -50%, duplicated content), hover-pause, optional velocity skew. Tech stack, awards, or "available for work."

### F. WebGL / R3F (pick MAX 1–2, lazy-loaded)
29. **Image hover distortion** — R3F plane per project image, shader displacement/ripple on hover (drei `<Image>` + custom shader material).
30. **Fluid/ripple hero background** — shader reacting to mouse, fixed canvas behind hero only.
31. **Particle field** — 1500–2000 GPU particles in brand colors drifting behind hero.
32. **3D floating object** — abstract only: glass blob, torus, distorted sphere with MeshTransmissionMaterial. NEVER a cheesy laptop, rocket, or developer mascot.
33. **3D skills sphere** — tech stack labels on a rotating sphere, mouse controls rotation, front items glow.

**ALL WebGL:** `next/dynamic({ ssr: false })`, render nothing while loading (no spinner, no skeleton), pause render loop off-screen via `frameloop="demand"` or visibility checks. No heavy scenes, no large particle systems, no gaming environments.

### G. Transitions & Atmosphere
34. **Page transitions** — full-screen column/clip-path wipe between routes (template.tsx exit/enter pattern or View Transitions API). Kill all ScrollTriggers + revert SplitText on route exit, re-init on enter.
35. **Film grain overlay** — fixed, pointer-events-none, SVG feTurbulence, 3–4% opacity.
36. **Ambient gradient orbs** — 1–2 large blurred (100px) brand-color orbs drifting slowly (transform only) behind content.
37. **Scanlines / grid lines** — faint, hero only, optional.
38. **Section divider motifs** — a repeated geometric mark (rotated square, tick, plus) that becomes part of the brand language.

---

## SECTION-BY-SECTION DIRECTION

### Hero
Strong first impression: large headline, bold typography, short supporting text, strong CTA.
Motion: preloader → wipe reveal → orchestrated entrance (Phase 3).
Optional: ONE subtle abstract 3D element (glass sphere, floating geometry). No cheesy 3D models.

### About
Tell my story. Focus on readability.
Motion: scroll-based text reveal (teleprompter or SplitText) + subtle parallax.

### Projects (most important section)
Premium project cards, strong screenshots, clean layout. Projects must feel like **products, not assignments**.
Motion: stagger reveal + hover effects. Must use at least ONE of: hover-preview-follow, horizontal gallery, stacked cards, or Flip morph.

### Experience
Timeline animation — the ONLY timeline on the site: animated vertical line draws while scrolling, dots/nodes activate when reached, content reveals beside them.

### Skills
Clean and minimal. Possible: marquee, hover interactions, subtle animation.
**Avoid skill bars and percentage indicators entirely.**

### Contact
Simple, elegant, clear CTA. Motion: magnetic button, subtle glow, smooth hover states.

---

## HARD RULES — PERFORMANCE & QUALITY

1. Animate ONLY `transform`, `opacity`, `clip-path`, `filter`. NEVER width/height/top/left/margin.
2. Every ScrollTrigger/SplitText instance killed + reverted on unmount (useGSAP auto-cleanup). SplitText reverted before re-splitting — nesting breaks the DOM.
3. `prefers-reduced-motion: reduce` → all scroll animations become instant opacity fades, preloader skips, Lenis disabled, marquees static. **Mandatory, not optional.**
4. Mobile (<768px): horizontal-scroll sections → vertical stack; custom cursor OFF; particle counts -70%; pinned sections ≤ 150vh; magnetic effects OFF; tilt OFF; heavy 3D OFF. Mobile gets a deliberate simplified experience, not a broken desktop one.
5. `will-change: transform` only on actively animating elements, removed after.
6. `backdrop-blur` ONLY on fixed/sticky elements (nav, overlays). Never on scrolling content.
7. Reveal animations enhance already-visible content — never gate visibility on a class that may not fire (blank-section bug).
8. Semantic z-index scale (nav → overlay → modal → cursor). No `z-[9999]`.
9. Lighthouse performance ≥ 85 after rebuild, smooth 60 FPS. An effect that tanks it gets cut.
10. All animation components are isolated `'use client'` leaf components; server components own layout. Never `useState` for continuous values (cursor pos, scroll) — refs + rAF or GSAP only.
11. No flashing > 3×/second (WCAG seizure risk).
12. Accessibility: visible keyboard focus states survive the redesign, full keyboard navigation, readable contrast throughout.

---

## BANNED (instant fail)

- Inter / Roboto / Arial / Open Sans as display fonts
- Identical fade-up applied to every section (the generic AOS look)
- Purple-blue AI gradient meshes; three identical feature cards; emoji as icons
- `linear` / `ease-in-out` easings; instant state changes without interpolation
- Harsh dark drop shadows; generic 1px solid gray borders
- Cream/beige "AI default" backgrounds
- Spinners or skeleton loaders for WebGL scenes
- Skill bars / percentage indicators
- Cheesy 3D (laptops, rockets, mascots), heavy 3D scenes, gaming visuals
- Animation overload, mixed motion styles, random effects
- Effects without purpose — if removing it loses nothing, remove it

---

## DEFINITION OF DONE

- [ ] Opening = one orchestrated timeline (preloader → wipe → hero reveal), scroll locked until complete
- [ ] Lenis + ScrollTrigger synced, zero scroll jank
- [ ] Scroll progress indicator present (top bar and/or timeline line draw)
- [ ] At least one SVG line-draw moment
- [ ] Every section has exactly ONE intentional motion moment from the catalog
- [ ] One signature "motion motif" repeats across the site (same wipe/hover language) — the site feels authored
- [ ] Custom cursor with states, off on touch
- [ ] Project displays use at least one of: hover-preview-follow, horizontal gallery, stacked cards, or Flip morph
- [ ] Timeline animation exists ONLY in the Experience section
- [ ] `prefers-reduced-motion` fully handled; mobile is a deliberate simplified experience
- [ ] Typography: characterful display face, contrast verified, spacing rules respected
- [ ] Lighthouse ≥ 85, 60 FPS, responsive on mobile
- [ ] Run the site, screenshot every section, self-critique against this checklist, fix gaps, THEN report done

---

## WORKFLOW

Audit first. Present the plan. Wait for approval. Then build section by section — after each section, show me what you built before moving to the next.