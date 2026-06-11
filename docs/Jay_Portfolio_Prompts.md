# Jay Dhakan — Portfolio Site Prompts for Claude Code
### Attach the Build Guide PDF alongside these prompts in your AI IDE

---

> **How to use these:**
> 1. Open VS Code → start a Claude Code session
> 2. Attach the **Build Guide file** in the context
> 3. Run **Prompt 1** first — full project scaffold
> 4. Once it runs without errors, run **Prompt 2** — polish & uniqueness layer
> 5. Finally run **Prompt 3** — final QA, SEO, performance, deployment-ready

---

---

# PROMPT 1 — Full Project Scaffold

```
I am attaching a research build guide (see attached file). Read it fully before writing a single line of code. It contains specific portfolio site references, design decisions, tech stack rationale, and conversion UX patterns derived from studying sites like brittanychiang.com (v4), rauno.me, basement.studio, Ponpon Mania (Awwwards SOTY 2025), Linear, Stripe, Vercel, and Resend. Every decision below is grounded in that research.

---

## WHO I AM

I am Jay Dhakan — a full-stack developer based in India. I build web apps, mobile apps, SaaS platforms, and digital products for clients. I source projects through Upwork, LinkedIn, referrals, and direct outreach. Think of me as a boutique solo developer: focused output, no fluff, direct communication.

---

## TECH STACK — DO NOT DEVIATE

- Framework: Next.js 14 (App Router) + TypeScript
- Styling: Tailwind CSS with a custom design token system in tailwind.config.ts
- Animations: Framer Motion (component-level) + GSAP ScrollTrigger (scroll storytelling sections only)
- Icons: Lucide React
- Contact/Email: React Email + Resend (server action in app/actions/contact.ts)
- Font: "Plus Jakarta Sans" (Google Fonts) — display weight for headings, regular for body
- Deploy target: Vercel

---

## DESIGN SYSTEM — SET THIS UP FIRST IN tailwind.config.ts

Build a proper token system before any components. Here are the exact tokens:

Colors (dark-first, following the Linear/Vercel approach):
- bg-base: #0A0A0F (near-black, the page canvas)
- bg-surface: #111118 (card/panel backgrounds)
- bg-elevated: #1A1A26 (hover states, active panels)
- accent-primary: #5B6EF5 (electric indigo — my signature color)
- accent-secondary: #8B5CF6 (violet — complementary, use sparingly)
- text-primary: #F0F0FF (near-white with a blue tint)
- text-secondary: #8A8AA8 (muted, for labels and meta)
- text-muted: #4A4A6A (placeholders, dividers)
- border: rgba(255,255,255,0.07) (subtle glass borders)
- success: #22C55E
- gradient-hero: linear-gradient(135deg, #5B6EF5 0%, #8B5CF6 50%, #EC4899 100%)

Typography scale in tailwind.config.ts:
- font-display: ['Plus Jakarta Sans', sans-serif]
- font-body: ['Plus Jakarta Sans', sans-serif]
- Heading sizes: text-7xl (hero), text-5xl (section), text-3xl (card), text-xl (sub)
- Body: text-base leading-relaxed
- Label/meta: text-sm tracking-widest uppercase (for eyebrows and tags)

Spacing: use an 8px base grid (p-2=8px, p-4=16px, p-8=32px, p-16=64px, p-24=96px)

---

## FILE & FOLDER STRUCTURE

Generate this exact structure:

```
/app
  /layout.tsx              ← root layout, font loading, metadata
  /page.tsx                ← homepage (all homepage sections)
  /work
    /page.tsx              ← projects grid
    /[slug]
      /page.tsx            ← individual case study
  /about
    /page.tsx
  /services
    /page.tsx
  /contact
    /page.tsx
  /actions
    /contact.ts            ← Resend server action
/components
  /ui
    Button.tsx
    Card.tsx
    Tag.tsx
    SectionLabel.tsx       ← the "eyebrow" labels like "MY WORK"
    AnimatedText.tsx       ← character-by-character text reveal
    MagneticButton.tsx     ← magnetic hover effect
    CustomCursor.tsx       ← global cursor component
    ScrollProgress.tsx     ← top-of-page reading progress bar
  /sections
    Hero.tsx
    Stats.tsx
    Services.tsx
    FeaturedWork.tsx
    Process.tsx
    Testimonials.tsx
    TechStack.tsx
    AboutMe.tsx
    CTABanner.tsx
  /layout
    Header.tsx
    Footer.tsx
    PageTransition.tsx
/data
  content.ts               ← ALL site content lives here, zero hardcoded strings in components
/lib
  animations.ts            ← reusable Framer Motion variants
  utils.ts
/public
  /images
    /profile
    /projects
    /logos
```

---

## HOMEPAGE SECTIONS — BUILD THESE IN ORDER

### Section 1: Hero
- Full-viewport height
- Left-aligned content (NOT centered — this feels more editorial, like Linear)
- Top eyebrow label: a pulsing green dot + "Available for new projects" in text-sm text-success
- H1: "I Build Products" — line break — "That Actually Ship." (Use AnimatedText component for a staggered character reveal on load using Framer Motion)
- Subheading (text-secondary, max-w-lg): "Jay Dhakan — full-stack developer based in India. I've shipped 50+ products for clients across Upwork, LinkedIn, and direct referrals."
- Two CTAs side by side: Primary = MagneticButton "See My Work" → /work | Ghost = "Let's Talk →" → /contact
- Right side (desktop): an abstract animated mesh/gradient orb using CSS radial gradients + Framer Motion animate loop (NOT Three.js — keep it lightweight)
- Below the fold: a horizontal marquee/ticker of client types: "SaaS Platforms · E-Commerce · Mobile Apps · Web Apps · Admin Dashboards · API Integrations ·" — infinite loop, slow scroll

### Section 2: Stats Bar
- 4 stat cards in a row (bento-style on desktop, 2x2 grid on mobile)
- Stats from content.ts: "50+ Projects Delivered" / "30+ Happy Clients" / "4+ Years Experience" / "Top Rated on Upwork"
- Each stat: large number in accent-primary with a CountUp animation that fires when the section enters the viewport (use IntersectionObserver hook)
- Subtle bg-surface background with border border-token and rounded-2xl
- Small text-secondary descriptor below each number

### Section 3: Featured Work (3 projects)
- Section eyebrow: "MY WORK"
- Section heading: "Projects That Moved the Needle"
- Layout: large card on left (60% width) + two stacked smaller cards on right (40% width) — asymmetric bento grid
- Each card: full-bleed image area (bg-elevated as placeholder), project name, client industry tag, 2-3 tech stack pills, a one-line result metric ("↑ 3x faster load time", "↑ 40% conversion"), and "View Case Study →" link
- On hover: card lifts (scale 1.02), image area shows a subtle overlay gradient with a "View →" CTA in the center
- Staggered fade-up animation on scroll entry (Framer Motion, stagger 0.1s)
- Below cards: a "View All Work →" link in text-accent-primary

### Section 4: Services
- Section eyebrow: "WHAT I DO"
- Section heading: "End-to-End Digital Execution"
- 6 service cards in a 3x2 grid (2x3 on tablet, 1 col on mobile)
- Services from content.ts: Full-Stack Web Dev / Mobile App Dev (React Native) / SaaS Development / UI/UX Design / API & Integrations / Technical Consulting
- Each card: Lucide icon (accent-primary tint), service name in text-xl, 2-line description in text-secondary
- Card style: bg-surface, border border-token, rounded-2xl, p-6
- Hover: border color shifts to accent-primary with a glow effect (box-shadow: 0 0 20px rgba(91,110,245,0.2))

### Section 5: How I Work (Process)
- Section eyebrow: "MY PROCESS"
- Section heading: "From Idea to Live Product"
- 4-step horizontal timeline on desktop, vertical accordion on mobile
- Steps: 01 Discovery → 02 Design → 03 Build → 04 Launch
- Each step: step number (text-7xl text-muted, behind the card for depth), step title, 2-sentence description
- The connector line between steps animates in (width from 0 to 100%) as section scrolls into view using GSAP ScrollTrigger

### Section 6: Testimonials
- Section eyebrow: "CLIENT LOVE"
- Section heading: "Words from People I've Shipped With"
- Auto-scrolling carousel (no visible controls, infinite loop with Framer Motion drag)
- 5-6 testimonial cards: client name, company/platform (e.g., "via Upwork"), star rating (5 gold stars), quote (2-3 sentences max)
- Card style: bg-surface, border border-token, rounded-2xl, p-8

### Section 7: Tech Stack Visual
- Section eyebrow: "BUILT WITH"
- Section heading: "My Toolkit"
- Grouped grid of tech icons with labels, grouped by: Frontend / Backend / Mobile / Database / DevOps
- Use devicons or simple SVG logos (reference: devicons.dev)
- Each icon: grayscale by default, full color + lift on hover
- Subtle staggered fade-in on scroll

### Section 8: CTA Banner
- Full-width dark section with the gradient-hero as a subtle background tint (low opacity, 10-15%)
- Heading: "Have a project in mind?"
- Sub: "I take on 2–3 new projects per month. Let's see if we're a good fit."
- Big MagneticButton: "Start a Project →" → /contact
- Small text below: "Or reach me directly at hello@jaydhakan.com"

---

## GLOBAL COMPONENTS

### Header (sticky, smart-hide on scroll down, show on scroll up)
- On mount: transparent with no background
- On scroll > 60px: bg-base/80 backdrop-blur-xl border-b border-token
- Left: Logo — "JD" in a small monogram badge + "Jay Dhakan" in text-secondary
- Right nav: Work / About / Services / Contact + "Let's Talk" primary button (hide on mobile, show in drawer)
- Mobile: hamburger icon → full-screen overlay nav with large link text and stagger-in animation

### Footer
- Two columns: left = logo + one-line tagline + social links (GitHub, LinkedIn, Upwork, Twitter)
- Right = quick nav links
- Bottom bar: "© 2025 Jay Dhakan · Built with Next.js · Deployed on Vercel"
- Subtle top border border-token

### CustomCursor (desktop only, disabled on touch devices via window.matchMedia)
- Small 8px dot that follows mouse with a slight lag (Framer Motion useSpring)
- On hover over any link or button: expands to a 40px ring with a mix-blend-mode: difference effect
- Disable entirely if prefers-reduced-motion

### PageTransition
- Wrap all page content in an AnimatePresence + motion.div
- On exit: fade + 20px slide up (0.2s)
- On enter: fade + 20px slide up from below (0.3s)

---

## CONTENT FILE — /data/content.ts

Create this file with TypeScript types and export all site content:
- siteConfig: { name, tagline, email, upworkUrl, linkedinUrl, githubUrl }
- profile: { name, role, bio, skills[], photo, linkedinUrl, githubUrl }
- stats: array of { value, label }
- services: array of { icon, title, description }
- projects: array of { slug, title, client, industry, description, tech[], result, coverImage, caseStudy: { problem, approach, solution, results } }
- testimonials: array of { name, company, platform, quote, rating }
- process: array of { step, title, description }
- techStack: grouped by category

---

## ANIMATIONS LIBRARY — /lib/animations.ts

Export these Framer Motion variants for reuse:
- fadeUp: { hidden: { opacity:0, y:30 }, visible: { opacity:1, y:0 } }
- fadeIn: { hidden: { opacity:0 }, visible: { opacity:1 } }
- staggerContainer: { visible: { transition: { staggerChildren: 0.1 } } }
- scaleIn: { hidden: { opacity:0, scale:0.95 }, visible: { opacity:1, scale:1 } }
- slideInLeft: { hidden: { opacity:0, x:-40 }, visible: { opacity:1, x:0 } }
All transitions: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } (custom cubic bezier, feels premium)

---

## ACCESSIBILITY & PERFORMANCE RULES

- All animations must check and respect prefers-reduced-motion (wrap in a useReducedMotion hook)
- All images must have descriptive alt text
- All interactive elements must have visible keyboard focus rings (ring-2 ring-accent-primary ring-offset-2 ring-offset-bg-base)
- Lazy load all images below the fold (Next.js Image component with loading="lazy")
- Code-split each page route with dynamic imports
- Target: Lighthouse score 95+ on Performance, 100 on Accessibility

---

## START COMMAND

1. Run: npx create-next-app@latest jay-dhakan-portfolio --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"
2. Install: framer-motion gsap lucide-react resend react-email @react-email/components clsx tailwind-merge
3. Set up tailwind.config.ts with the full token system above
4. Create /lib/animations.ts
5. Create /data/content.ts with placeholder content (I will fill in real content later)
6. Build components in order: ui/ → layout/ → sections/ → pages
7. At each step, confirm with me before moving to the next major section

Do not rush. Build one section at a time, confirm it renders correctly, then continue.
```

---

---

# PROMPT 2 — The Work Page, Case Studies & About Page

```
The base scaffold is running. Now build the three inner pages that are most important for converting clients: /work (project grid with filters), /work/[slug] (full case study), and /about (personal profile + story). Reference the build guide (attached) — specifically the Brittany Chiang sidebar pattern, the basement.studio case study structure, and first-person solo developer framing.

---

## PAGE: /work — Project Grid

Layout:
- Page hero: full-width, short. Eyebrow "ALL PROJECTS", H1 "Work That Speaks For Itself", subtext "50+ projects shipped across web, mobile, and SaaS."
- Filter bar below hero: pill buttons for "All / Web Apps / Mobile / SaaS / Design" — active filter has bg-accent-primary text-white; inactive = bg-surface border border-token. Clicking filters the grid with a Framer Motion layout animation (AnimatePresence + layoutId for smooth reorder)
- Project grid: masonry-style alternating layout. NOT a uniform grid — vary card heights. First card is always a "featured" large card (full-width, 400px tall). Then 3-col grid below.
- Each project card:
  - Full-bleed cover image (bg-elevated placeholder)
  - On hover: image scales to 1.05, an overlay fades in with "View Case Study →" centered
  - Below image: project name (text-xl font-semibold), industry tag + year, tech stack pills, result metric in text-success ("↑ 3x conversion")
  - Card: rounded-2xl overflow-hidden, no external border
- Page entry: staggered fadeUp (0.08s stagger between cards)

---

## PAGE: /work/[slug] — Case Study Detail

This is the highest-value page on the site. Modeled on the basement.studio case study approach: immersive, story-first, proof-focused.

Layout (single column, max-w-3xl centered, generous padding):

1. Back link: "← All Work" in text-secondary, top left
2. Project header:
   - Industry tag + year as eyebrow
   - Large H1: project name
   - One-sentence outcome in text-xl text-secondary (e.g., "I rebuilt their checkout flow and tripled their conversion rate in 6 weeks.")
   - Meta row: Client / Timeline / My Role / Tech Stack (4 items in a horizontal pill-grid)
   - Hero image: full-width, rounded-2xl, slight shadow
3. Case study body (from content.ts caseStudy field):
   - Section: "The Problem" — 2-3 paragraphs
   - Section: "My Approach" — can include a small 2-column breakdown grid
   - Section: "What I Built" — 2-3 feature highlights with inline screenshots/mockups
   - Section: "The Results" — 3 big result metrics in a stat row (same CountUp component as homepage), then a short narrative
4. Testimonial pull quote (if available) — large blockquote in accent-primary, italicized, with client name below
5. Tech stack used: icon grid (same component as homepage TechStack section)
6. "Next Project →" navigation at the bottom linking to the next slug
7. Sticky sidebar on desktop (left side, 240px wide):
   - Inspired by Brittany Chiang's v4 sidebar pattern
   - Shows: project name (small), smooth-scroll section links that highlight as you scroll past them (IntersectionObserver), and a "Start a Similar Project →" CTA button
   - Collapses to nothing on mobile

---

## PAGE: /about — Personal Profile + Story

This is the page that sets me apart from other freelancers. First-person, personal, direct — not a résumé.

### Sub-section 1: About Hero
- Eyebrow: "ABOUT ME"
- H1: "Builder. Problem Solver. Shipping Machine."
- Subtext (max-w-2xl): "I'm Jay Dhakan — a full-stack developer who's been shipping production-grade products for 4+ years. I'm not an agency. You talk directly to me, I build directly for you."
- Below: a horizontal divider, then the profile card

### Sub-section 2: Profile Card (centered or left-aligned, single prominent card)

Card structure (bg-surface, rounded-2xl, p-8, border border-token):
- Photo area: large rounded circle placeholder (160px) with a colored ring in accent-primary
- Name: text-3xl font-bold — "Jay Dhakan"
- Role: text-secondary — "Full-Stack Developer · Top Rated on Upwork"
- Bio: 4-5 sentences, first-person voice. NOT a resume. Conversational. Focus on: what I build, who I build for, my approach to client work, and what makes me different (direct, ships fast, no handoffs).
- Skill tags: 8-10 pills in a flex-wrap row (bg-elevated, text-xs, rounded-full)
- Social links: GitHub icon + LinkedIn icon + Upwork icon (Lucide), links to real profiles

### Sub-section 3: My Story Timeline
- Eyebrow: "HOW I GOT HERE"
- A vertical timeline (left-aligned, with a thin vertical line in border-token color)
- 4-5 milestone entries from content.ts (e.g., "Started freelancing on Upwork → First international client → Hit Top Rated → First SaaS product → [Current]")
- Each entry: year/month on the left, title + description on the right
- Animate: each entry fades in from the left as you scroll past it (Framer Motion + IntersectionObserver)

### Sub-section 4: How I Work
- 3-column grid (or 1 col mobile): each column is a short value statement
  - "Direct Communication" — "No PMs or middlemen. You talk to the person writing your code."
  - "Full Accountability" — "I own every project start to finish. Your success is my success."
  - "Shipped, Not Promised" — "I measure success in deployed products, not deliverables."
- Style: just an icon (Lucide), a bold title, and 2 sentences. No card borders here — let them breathe.

### Sub-section 5: Platforms & Presence
- Small section: "Find me on"
- Logo row: Upwork / LinkedIn / GitHub — greyscale, full-color on hover, link to real profiles

### Sub-section 6: About Page CTA
- Repeat the global CTA banner: "Ready to build something?" → "Start a Project →"

---

## ALSO: Fix these things across the whole site

1. Make the Header active nav item detection work with Next.js usePathname() — the current page link should have text-accent-primary and a subtle underline
2. Add a <ScrollProgress /> component (thin accent-primary line at the very top of the viewport, grows as user scrolls — use Framer Motion's useScroll)
3. Add a floating "Back to Top" button (bottom-right, appears after scrolling 400px, smooth scroll to top on click)
4. Add dark/light mode toggle to the Header using next-themes — the light mode palette should be: bg-base #F8F8FF, bg-surface #FFFFFF, text-primary #0A0A1A, accent-primary #4A5CF4 (slightly adjusted for contrast on light)

Confirm each page renders at 375px (mobile), 768px (tablet), and 1440px (desktop) before marking complete.
```

---

---

# PROMPT 3 — Polish, SEO, Performance & Deployment

```
The main pages are built. Now do the final production pass. This is about making the site feel premium and perform like a professional engineer built it — because I am one. Reference the build guide (attached): the Lighthouse 95+ target, the Core Web Vitals gate, the Linear/Vercel clean-code standards.

---

## 1. CONTACT PAGE — /contact

Full-width split layout (50/50 on desktop, stacked on mobile):

Left side:
- Eyebrow: "GET IN TOUCH"
- H2: "Let's Build Something Together"
- Subtext: "I take on 2–3 new projects a month. Tell me what you're building."
- Info rows with Lucide icons:
  - 📧 hello@jaydhakan.com (make this a real mailto link)
  - ⏱ "I reply within 24 hours"
  - 📍 "Based in India · Available worldwide"
  - ⭐ "Top Rated on Upwork" (link to Upwork profile)
- Social links row: GitHub / LinkedIn / Upwork icons, spacing-4 between them
- A small "availability badge": pulsing green dot + "Currently accepting projects for Q3 2025"

Right side (the form):
- React Hook Form + Zod validation
- Fields:
  - Name (text input)
  - Email (email input, Zod .email() validation)
  - Budget Range (select: "Under $1k / $1k–$5k / $5k–$15k / $15k+ / Let's discuss")
  - Project Type (select: "Web App / Mobile App / SaaS Platform / E-Commerce / API Integration / Other")
  - Message (textarea, min 20 chars, placeholder: "Tell me about your project — what you're building, the problem it solves, and any timeline constraints.")
- Submit button: full-width MagneticButton "Send Message →"
- On submit success: the form slides out (Framer Motion) and a success state slides in: a large checkmark SVG (animated with Framer Motion pathLength), "Message sent!", and "I'll be in touch within 24 hours."
- On submit error: inline error message below the form in text-red-400

Wire the form to Resend via /app/actions/contact.ts (Next.js server action). The email template should use React Email to format a clean notification email to hello@jaydhakan.com with all form fields.

---

## 2. SERVICES PAGE — /services

This page is the "pricing/scope" signal that helps clients self-qualify.

Top section:
- Eyebrow: "SERVICES"
- H1: "What I Build & How I Charge"
- Subtext: "Clear scope, clear pricing. No surprises."

Packages section (3 cards, horizontal on desktop):
- Card 1: "Starter" — bg-surface, border border-token
  - Best for: MVPs, landing pages, quick builds
  - Price: "From $1,500"
  - Deliverables list (checkmarks): Up to 5 pages / Responsive design / Basic animations / Deployed + handoff / 1 round of revisions
  - CTA: "Get Started →" (ghost button)

- Card 2: "Growth" — bg-elevated, border-2 border-accent-primary (the "most popular" card)
  - "Most Popular" badge: small pill above the card, bg-accent-primary text-white text-xs
  - Best for: SaaS MVPs, full web apps, client portals
  - Price: "From $5,000"
  - Everything in Starter + Custom features / Auth + database / API integrations / 3 rounds of revisions / 30-day post-launch support
  - CTA: Primary MagneticButton "Let's Talk →" → /contact?plan=growth (pre-fills the Budget field)

- Card 3: "Custom" — bg-surface, border border-token
  - Best for: Complex SaaS, mobile apps, long-term partnerships
  - Price: "Let's Scope It"
  - Description: "Large-scale products, mobile apps, ongoing development partnerships. We scope it together."
  - CTA: "Start a Conversation →" → /contact?plan=custom

Below packages: a simple comparison table (HTML table, styled with Tailwind) with a checkmark/dash grid for features across all 3 plans.

Bottom: Services detail section — for each of the 6 services, a two-column row (icon + title left, description + bullet points right). This gives more detail than the homepage service cards.

---

## 3. SEO & METADATA

For every page, add metadata using Next.js generateMetadata():

- /: title "Jay Dhakan — Full-Stack Developer", description "Full-stack developer building web apps, mobile apps, and SaaS platforms. Top Rated on Upwork. Based in India, working worldwide."
- /work: title "My Work — Jay Dhakan", description "Case studies and projects from 50+ clients across SaaS, e-commerce, mobile, and web."
- /about: title "About Jay Dhakan — Full-Stack Developer"
- /services: title "Services & Pricing — Jay Dhakan"
- /contact: title "Start a Project — Jay Dhakan"

Add open graph tags: og:title, og:description, og:image (generate a static 1200x630 OG image at /public/og-image.png — a dark card with my name and tagline), og:url, og:type.

Add a /app/sitemap.ts that generates a sitemap.xml with all page URLs.
Add a /app/robots.ts that generates robots.txt.

---

## 4. PERFORMANCE OPTIMIZATIONS

- Wrap every page-level component with React.lazy() + Suspense with a skeleton fallback
- All Next.js <Image> components: sizes prop set correctly, priority on above-fold hero image only
- Fonts: load Plus Jakarta Sans with next/font/google, swap display, subset: ['latin']
- GSAP: import dynamically on client only (no SSR issues)
- Remove all console.log statements
- Add loading.tsx skeleton files for each route segment (/work, /about, /services, /contact)
- Bundle analyzer: add @next/bundle-analyzer and run a build — flag anything over 100kb that shouldn't be

---

## 5. FINAL ACCESSIBILITY AUDIT

- Add skip-to-content link as the very first focusable element in layout.tsx: <a href="#main-content" class="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-white focus:rounded-lg">Skip to content</a>
- Ensure all form inputs have associated <label> elements (not just placeholders)
- Ensure all icon-only buttons have aria-label
- Check color contrast: all text-secondary on bg-surface must pass WCAG AA (4.5:1 minimum)
- Wrap the custom cursor in aria-hidden="true"
- The marquee/ticker in the hero must have aria-hidden="true" (decorative, not informational)

---

## 6. ENVIRONMENT & DEPLOYMENT CONFIG

Create these files:

.env.local.example:
```
RESEND_API_KEY=your_resend_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

vercel.json:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

README.md:
- Project overview
- Tech stack list
- Local setup steps (clone → npm install → copy .env.local.example → npm run dev)
- How to add a new project (update /data/content.ts)
- How to deploy to Vercel
- How to update the availability status (the green dot in the hero — it's a boolean in content.ts)

---

## 7. FINAL CHECK — RUN THESE BEFORE CALLING IT DONE

1. `npm run build` — must complete with zero TypeScript errors and zero ESLint errors
2. Open on mobile (375px) — every section must be legible, no overflow
3. Tab through the entire homepage with keyboard only — every interactive element must be reachable and visually focused
4. Disable JavaScript in browser DevTools — the content (text, structure) must still be readable
5. Run Lighthouse in Chrome DevTools on the homepage — flag anything under 90 on any metric and fix it before finishing

When all 5 checks pass, the site is production-ready. Output a final summary of what was built, what placeholder content needs to be replaced with real content, and any remaining tasks.
```

---

---

## CHEAT SHEET — Things to Replace With Real Content After Build

Once the site is running, swap these out in `/data/content.ts`:

| Placeholder | Replace With |
|---|---|
| hello@jaydhakan.com | Your real contact email |
| Upwork profile URL | Your actual Upwork profile link |
| LinkedIn URL | Your real LinkedIn profile URL |
| GitHub URL | Your real GitHub profile |
| Profile photo | Real photo (recommended: 400x400 square, good lighting) |
| 3 featured projects | Your 3 strongest real projects with result metrics |
| 5-6 testimonials | Real client quotes (from Upwork reviews works great) |
| Timeline milestones | Your real story/journey with accurate dates |
| Availability status | Toggle `isAvailable: true/false` in siteConfig |
| OG image | Generate at og-image-generator.com or similar |

---

*Prompts authored based on research into: brittanychiang.com (v4), bruno-simon.com, rauno.me, basement.studio, Ponpon Mania (Awwwards SOTY 2025), Linear, Stripe, Vercel, Resend, adrianhajdin/project_3D_developer_portfolio, bchiang7/v4, namanbarkiya/minimal-next-portfolio, and the full attached Build Guide.*
