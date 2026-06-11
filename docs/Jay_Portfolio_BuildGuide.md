# The Best Portfolio Websites of 2024–2026: A Build Guide for a Solo Full-Stack Developer

## TL;DR
- **The best dev portfolios in 2024–2026 win on restraint plus one signature idea, not effect-stacking.** Brittany Chiang's dark, accent-green single page (bchiang7/v4, 8.2k GitHub stars) is the most-cloned template; Bruno Simon's drivable-car WebGL site is the most-celebrated (Awwwards Site of the Year 2019, and Site of the Month January 2026 for its new build); Rauno Freiberg's "operating system" site (rauno.me) is the taste benchmark. For a solo developer, the model to copy is a sharp personal portfolio that pairs a strong positioning line, 3–5 deep case studies, and a clear contact CTA.
- **The dominant, durable 2025–2026 trends are bento grids and first-class dark mode, with glassmorphism, scroll-driven storytelling, custom cursors, magnetic buttons, and selective WebGL as accents** — but trend "reality checks" show kinetic typography and full-page 3D/WebGL hurt Core Web Vitals and rarely ship in production, so use them sparingly.
- **Build it in Next.js + Tailwind + Framer Motion**, study the SaaS canon (Linear, Stripe, Vercel, Resend) for clean typographic dark UI, and structure for conversion: positioning hero → 3–5 results-led case studies → process → social proof/testimonials → optional pricing/packages → repeated "Start a project" CTAs.

## Key Findings

**1. Individual developer portfolios set the design vocabulary.** A handful of personal sites are referenced repeatedly across every "best of" list and have effectively defined what a modern dev portfolio looks like — Brittany Chiang (dark theme, green accent, sticky sidebar, timeline), Bruno Simon (3D game), Josh Comeau (playful, whimsical animation), Adham Dannaway (split designer/developer face concept), Cassie Evans (SVG/GSAP motion), and Rauno Freiberg (OS-style interaction craft).

**2. For a solo developer, the right reference class is the personal brand portfolio, not the agency.** Sites like Brittany Chiang's (clarity, restraint, first-person voice), Josh Comeau's (show-don't-tell with interactive demos), and Rauno Freiberg's (a consistent metaphor that unifies everything) prove a single developer can present with authority and personality. The goal is: "I know exactly who this person is and what they build" within the first 5 seconds.

**3. Award winners cluster around WebGL/Three.js, GSAP, scroll storytelling, and unusual navigation** — but the technique is always in service of a concept. For a client-facing portfolio, the priority is trust and speed-to-answer over spectacle.

**4. The pragmatic build stack is Next.js + Tailwind + Framer Motion (+ optional React Three Fiber).** This is what the most-starred portfolio repos and SaaS starters use.

**5. Conversion depends on structure, not decoration.** Visible pricing, results-led case studies with real numbers, multi-format testimonials, and CTAs repeated at every scroll break are what move visitors to inquiries.

## Details

### 1. Best individual developer portfolio websites

**Brittany Chiang — brittanychiang.com** (current) and **v4.brittanychiang.com** (the famous prior version). A front-end engineer (ex-Apple, currently Klaviyo). The signature look: near-black background, a single mint/teal-green accent, and a two-column layout where a sticky left sidebar holds her name, role, and nav while the right column scrolls through About → Experience → Projects. The current version uses a hover spotlight that follows the cursor and highlights the active section. The design is so admired it's the most-cloned dev portfolio on the web; the source (Gatsby + styled-components + anime.js) lives at **github.com/bchiang7/v4** — **8.2k stars and 4.2k forks** per the GitHub repo header (June 2026), labeled "Fourth iteration of my personal website built with Gatsby." Note the licensing nuance: the README states, "Many people have contacted me asking me if they can use this code for their own website, and the answer to that question is usually yes, with attribution… Please give me proper credit by linking back to brittanychiang.com." One Page Love praised its "subtle hover effects, the beautiful work history carousel … and the consistent color scheme with green accent." Takeaway: a fixed identity panel + scrolling content column is a clean, low-risk pattern that scans in seconds.

**Bruno Simon — bruno-simon.com.** The benchmark for creative/3D portfolios. Instead of a site, you drive a little car around a 3D physics world to bump into and explore projects. The original (2019) build won **Awwwards Site of the Month (November 2019) and Site of the Year 2019**, drawing more than 400,000 visitors. His current portfolio is built with Three.js and, in Simon's own words, uses "TSL… enabling the use of both WebGL and WebGPU, making this portfolio possible" — and it won **Awwwards Site of the Month (January 2026)**. His earlier source (folio-2019, Three.js/WebGL/Webpack, MIT-licensed with Blender files) is open on GitHub (~4.7k stars). Takeaway: this is the "moonshot" end of the spectrum — extremely memorable, but heavy. Only attempt if 3D is your actual selling point.

**Josh Comeau — joshwcomeau.com.** A blog/portfolio hybrid (ex-Khan Academy, Gatsby) that's the reference for *whimsical* front-end. Black base, rainbow/gradient accents, and dozens of bespoke micro-interactions and interactive demos (animated React/CSS components inline). It's the model for "show, don't tell" — the site itself proves his animation and CSS skill. Takeaway: embed live, interactive demos rather than static screenshots.

**Adham Dannaway — adhamdannaway.com.** Famous for the hero: a photo of his face split down the middle to symbolize "half designer, half developer," with a toggle that flips the framing. A Sydney product designer, his minimalist single page is a masterclass in contrast and personal branding (Awwwards Honorable Mention). Takeaway: a single strong visual metaphor for your combined skills is more memorable than a generic hero.

**Cassie Evans — cassie.codes.** A creative developer on the GSAP/GreenSock core team. Her site showcases SVG + GSAP animation and playful motion with personality; she's known for teaching the FLIP technique, motion-with-purpose ("use motion to signal change"), and responsible animation (respecting `prefers-reduced-motion`). Takeaway: if you want motion as a differentiator, GSAP (now free/open-source) is the production tool, and animation should signal change, not just decorate.

**Rauno Freiberg — rauno.me.** Staff Design Engineer at Vercel (previously The Browser Company / Arc; creator of the `cmdk` command-menu library downloaded millions of times weekly). His site is built as an "operating system" — a desktop with a dock, interface sounds, horizontal-scrolling galleries, and an exquisitely tuned dark mode (Awwwards Honorable Mention, "Portfolio 2025"). It's the taste/craft benchmark for interaction detail. Takeaway: a consistent *metaphor* (OS, music player, terminal) can unify a portfolio more elegantly than a section list.

Other names that recur on curated lists: **Henri Heymans** (artistic creative dev, France), **Jordan Cruz-Correa** (Windows 98 nostalgia, playable Notepad), **Keita Yamada** (clarity/brevity, Japan), **Cyd Stumpel** (cydstumpel.nl — Awwwards SOTD, built with new CSS View Transitions), and the curated directory **github.com/emmabostian/developer-portfolios** — **21.5k stars / 4.3k forks** (June 2026), described by author Emma Bostian (Software Engineer at Spotify, Stockholm) as "A list of developer portfolios for your inspiration."

### 2. Best freelance / solo developer portfolio references

As a solo developer, study people who present themselves with authority without needing a team:

- **Brittany Chiang** — the definitive example of a solo dev portfolio that converts. First-person throughout, specific role clarity, results-led work section.
- **Josh Comeau** — shows that a solo developer can build a genuinely impressive, memorable site by letting the site itself demonstrate your skills.
- **Rauno Freiberg** — raises the bar for what a solo developer can achieve with a consistent metaphor and obsessive attention to interaction detail.
- **Keita Yamada** — minimalism and brevity; proves less is more when your work speaks clearly.
- Patterns from well-regarded personal sites: **make your niche/skill obvious in the first screen, treat case studies as decision tools, use a small number of sharp case studies over a giant undifferentiated grid, and use your personality to differentiate from agencies.**

How solo developers stand out: a clear "About Me" with personality and first-person voice, role clarity (what you do and who you do it for), a personal origin/story, "small team, direct access" positioning, and named individual contributions in each case study.

### 3. Award-winning portfolio sites (Awwwards / CSSDA / FWA) and their techniques

- **Ponpon Mania (by Patrick Heng & Justine Soulié) — Awwwards Site of the Month (October 2025) and Site of the Year 2025 honoree.** An interactive WebGL comic with a music-player navigation metaphor. Tech: OGL/WebGL + GSAP + Nuxt.js; techniques tagged include parallax, unusual navigation, storytelling, 3D, microinteractions. A perfect proof-of-concept that a small team can win the industry's top award.
- Recent Awwwards portfolio/SOTD winners to study: **Bruno's Portfolio** (SOTD Mar 2026), **Artiom Yakushev, Olha Lazarieva, Form&Fun Studio, Jam Area, Caffè Design, Studio Null, Elliott Mangham, Gianluca Gradogna**. Other 2025 Sites of the Month: **Cartier Watches & Wonders 2025** (Immersive Garden), **Terminal Industries, Tracing Art, Anime.js** (Julian Garnier).
- Common winning techniques: WebGL/Three.js scenes, GSAP ScrollTrigger scroll animations, parallax, custom cursors and mouse-interaction effects, page-transition animations, microinteractions, and "unusual navigation." Awwwards judges on Design (40%), Usability (30%), Creativity (20%), Content (10%) — usability is weighted heavily, so effects can't break the experience.

### 4. Best React / Next.js portfolio boilerplates & open-source examples (GitHub)

Verified repos worth cloning or studying (star counts are GitHub's rounded figures as of mid-2026):

- **bchiang7/v4** — 8.2k stars / 4.2k forks. "Fourth iteration of my personal website built with Gatsby." Gatsby + React + styled-components + anime.js. The canonical dark-theme dev portfolio. (Author asks for attribution/link-back; not built as a starter, but heavily forked.)
- **adrianhajdin/project_3D_developer_portfolio** (JavaScript Mastery) — ~7.1k stars. React + Three.js + React Three Fiber/drei + Tailwind + Framer Motion + EmailJS + Vite. Customizable 3D hero (desktop model), 3D skills geometries, animated starfield, 3D Earth contact form. The best-documented learning path for a 3D React portfolio.
- **soumyajit4419/Portfolio** — ~6.1k stars. "My self coded personal website build with React.js." React + Node/Express + React-Bootstrap, deployed on Vercel. Multi-page, easy color customization.
- **brunosimon/folio-2019** — ~4.7k stars. Three.js/WebGL/Webpack source of the drivable-car portfolio. MIT licensed (Blender files included).
- **codewithsadee/vcard-personal-portfolio** — ~7.7k stars. ⚠️ Plain HTML/CSS/JS (not React), but one of the most-starred portfolio templates overall; useful for structure ideas.
- **namanbarkiya/minimal-next-portfolio** — "Modern and easy-to-use Next.js 16 portfolio template. Simple object-driven structure." Next.js + React + TypeScript + Tailwind + Framer Motion; config-file-driven, animated timeline, SEO built in (structured data, meta tags). Excellent clean starting point.
- **sanidhyy/space-portfolio** — ~467 stars. Next.js 14 + TypeScript + Tailwind + Framer Motion + Three.js, space/galaxy theme.
- **1hanzla100/developer-portfolio** — ~781 stars (now archived). Next.js + React + Bootstrap, single-config-file customization (portfolio.js) with Summary/Skills/Education/Experience/Projects/Feedbacks/GitHub sections.
- **emmabostian/developer-portfolios** — 21.5k stars. Not code — a curated inspiration list of developer portfolios.

Underlying libraries for the 3D/animation route (from pmndrs/react-three-fiber): **@react-three/drei** (helpers), **@react-three/postprocessing**, **react-spring**, **framer-motion**, **zustand** (state), **leva** (GUI controls), **maath** (math helpers). R3F is used in production by Vercel, basement, Studio Freight, and 14islands.

### 5. UX patterns that convert clients

Essential sections, in conversion order:
1. **Hero / positioning** — name, role, and a single sharp value proposition (Linear-style: how it feels, not a feature list). Include a primary CTA ("Start a project" / "Book a call") above the fold. First impressions are fast: TheLadders' 2018 eye-tracking study (cited by ERE.net) found recruiters spend ~7.4 seconds on an initial screening — your best work must be instantly visible.
2. **Case studies (3–5, not a dump)** — frame each as problem → approach → your specific contribution → measurable result. "One case study with real numbers is worth 100 portfolio images"; case studies are cited as increasing conversion ~3x, and are the highest-value lever for higher-ticket work.
3. **Process / how you work** — gives a sneak peek of methodology; reduces perceived risk for higher-priced engagements.
4. **Social proof / testimonials** — stack 5–10 with name, company, and the specific result; combine text + video + star ratings; a documented multivariate test (comScore via Optimizely) increased conversions ~69% by emphasizing testimonial design/placement. ~92% of clients reportedly check testimonials before hiring.
5. **Pricing / packages (optional but powerful)** — visible starter/growth/premium packages help clients self-qualify; one builder reports ~68% fewer time-waster calls with visible pricing.
6. **Contact + repeated CTAs** — put a CTA in the hero, after case studies, and in the footer; benefit-led CTAs ("Get a strategy review") outperform generic "Contact me." Every scroll section should have an "escape route" to the contact form (reported ~55% lift in form fills from multiple CTAs).

Anti-patterns to avoid: showing every project (dilutes best work), desktop-only design, generic descriptions ("built a website using PHP"), buried contact info, and slow/janky performance (which itself signals weak engineering).

### 6. Current 2025–2026 design trends

Durable/winning (per multiple trend reports and a mid-2026 "reality check" from StudioMeyer):
- **Bento grids** — modular, varied-size card layouts (Apple/Samsung/Microsoft/Google use them); ideal for a portfolio home that mixes work, skills, and stats. Called the "must-have format" and a trend that "compounds."
- **First-class dark mode** — not just a toggle; a designed dark theme. Universally recommended for 2026, especially for tech/SaaS audiences.
- **Glassmorphism 2.0 ("Liquid Glass")** — frosted, translucent panels with `backdrop-filter: blur()`, thin ~1px borders, used functionally for hierarchy on nav/modals/cards (Linear uses it for functional focus). Survived in restrained form; watch text contrast and performance on older devices.
- **Scroll-driven storytelling** — Apple-style sequential reveal; "gold standard" for turning browsing into a guided journey.

Accent-only / use sparingly:
- **Kinetic typography** — everywhere on Awwwards/Dribbble demos but "almost never ships in production" because it fights screen readers, crawlers, and Core Web Vitals; limit to hero headlines.
- **3D / WebGL** — only when "the brand is the experience" (creative agencies, fashion, art portfolios); otherwise it drains performance budgets and drops mobile/4G users. The "everyone gets a 3D hero" prediction was wrong; "creative agencies push 3D harder" was right.
- **Custom cursors, magnetic buttons, micro-animations, soft/colored shadows, parallax 3.0** — strong differentiators in moderation.
- **Anti-grid brutalism** — an emerging counter-movement for tech-heavy audiences who reward positioning over polish.

Also rising: hand-drawn/scribble accents (a human pushback against AI-perfect aesthetics), variable/adaptive fonts, and AI-readability layers (llms.txt, schema markup) for discoverability. Accessibility is now table stakes (the European Accessibility Act took effect June 28, 2025).

### 7. SaaS-clean inspiration: Linear, Stripe, Vercel, Resend

These are the canonical "clarity-first" references for applying SaaS polish to a portfolio:
- **Linear (linear.app)** — uncompromising minimalism; opens with one sharp positioning sentence about how the product *feels*, real product clips (not placeholders), deliberate restraint below the fold. Built on Radix UI + a custom design system; LCH-based theme generation from just three variables (base, accent, contrast), an 8px spacing scale, and dark-first design. **Steal:** open with one positioning line; design a token-based dark theme.
- **Stripe (stripe.com)** — long-form storytelling at scale; every product page is a self-contained essay with custom (never stock) illustrations and on-page code samples that speak to developers and CFOs simultaneously. **Steal:** modular sections for distinct audiences; consistent custom illustration.
- **Vercel (vercel.com)** — dark, type-dense, spec-and-code-forward; "specificity is the design" for developer audiences. **Steal:** if your audience arrives pre-educated, optimize for speed-to-answer over persuasion.
- **Resend (resend.com)** — frequently cited alongside these as the modern transactional-email brand with clean, developer-first design; commonly paired in Next.js stacks for contact/notification emails (React Email + Resend).

For implementation, **shadcn/ui** (built on Radix) is the closest path to the Linear aesthetic; HeroUI, Untitled UI, and Magic UI / Aceternity UI are alternatives. Linear's own team uses Radix UI.

## Recommendations

**Stage 1 — Foundation (week 1).** Build in **Next.js (App Router) + TypeScript + Tailwind + Framer Motion**, deploy on Vercel, wire contact email via **Resend + React Email**. Start from **namanbarkiya/minimal-next-portfolio** (clean, config-driven, SEO built in) or scaffold fresh with **shadcn/ui** for a Linear-style token system and first-class dark mode. Benchmark target: Lighthouse 95+ and passing Core Web Vitals — treat this as a hard gate, since the site is itself your engineering proof.

**Stage 2 — Structure for conversion (week 2).** Implement the section order: positioning hero (your name — Jay Dhakan — with one sharp value line and a primary CTA) → 3–5 results-led case studies (problem → approach → your specific contribution → measurable result) → "how I work" process → testimonials (5–10, with names/companies/results) → optional packages/pricing → contact with CTAs repeated at every scroll break. Use a **bento grid** for the home overview and a **two-up mosaic with hover overlays** for the work index.

**Stage 3 — Signature + polish (week 3).** Choose *one* memorable concept (a personal metaphor à la Adham Dannaway's split face; an OS/terminal metaphor à la Rauno; or a single GSAP scroll-story). Add restrained accents: custom cursor, magnetic buttons, glassmorphic nav, micro-animations — all behind `prefers-reduced-motion`. Reserve WebGL/R3F only if interactive 3D is a service you're selling; if so, study adrianhajdin's R3F repo and pmndrs/drei.

**Thresholds that change the plan:**
- If mobile/4G traffic is significant or Lighthouse drops below ~90 → cut WebGL and kinetic type; keep CSS/Framer animations only.
- If inbound is high but unqualified → add visible pricing/packages to self-qualify leads.
- If your differentiator is motion/3D craft (à la Bruno Simon / Cassie Evans) → invest in one showpiece interaction and aim for an Awwwards submission.
- If the audience is enterprise/technical buyers → go Vercel/Linear-clean (specificity, code, dark, minimal) over decorative.

## Caveats
- **Star counts are GitHub's rounded "k" figures from mid-2026 snapshots and drift upward over time**; verify live before citing. bchiang7/v4 is explicitly *not* a starter theme and the author requests attribution/link-back ("give me proper credit by linking back to brittanychiang.com") — don't copy it wholesale.
- **Awwwards labeling can be ambiguous between "winner" and "honoree/nominee."** Ponpon Mania is confirmed Site of the Month (October 2025) and appears among Site of the Year 2025 honorees; the public Site-of-the-Year vote ran January 12–22, 2026. Bruno Simon's Site of the Year was for 2019 (original build); his new build won Site of the Month January 2026.
- **Trend reporting is partly promotional.** Several sources are agency/tool blogs with an interest in selling redesigns; the most credible signal is the mid-2026 "reality check" that bento + dark mode held up while kinetic type and full 3D underdelivered on performance. Treat single-vendor conversion stats (e.g., "+69%", "3x", "92%", "+55%", "−68%") as directional, vendor-reported figures, not peer-reviewed data. The ~7.4-second screening figure is from a 2018 recruiter eye-tracking study and is about resumes specifically.
- **Awwwards rankings reward creativity that can hurt usability and performance** if copied literally; judging weights usability at 30%, so winners balance both — your portfolio should too.
- Some "best portfolio" listicles are SEO content from site-builders (Wix, Hostinger, Colorlib) promoting their own templates; their *examples* are useful, their *rankings* are not authoritative.
- The current Brittany Chiang site differs from the famous "v4" version most people mean — link the right one (v4.brittanychiang.com for the classic dark/green layout).
