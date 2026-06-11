# Design

Dark-first, indigo-accented, editorial-premium. SaaS-product feel (Linear/Vercel lineage), Brittany Chiang v4 and rauno.me as interaction-craft references. Per the master prompt: do not deviate from these tokens.

## Color (dark = default theme)

| Token | Dark | Light (next-themes toggle) | Role |
|---|---|---|---|
| `base` | `#0A0A0F` | `#F8F8FF` | page canvas |
| `surface` | `#111118` | `#FFFFFF` | cards / panels |
| `elevated` | `#1A1A26` | `#EFEFF8` | hover states, active panels |
| `accent-primary` | `#5B6EF5` | `#4A5CF4` | electric indigo, signature color |
| `accent-violet` | `#8B5CF6` | `#7C4DEF` | gradient complement, sparing |
| `accent-warm` | `#EC4899` | `#DB2777` | hot pink, very sparing third accent |
| `primary` (text) | `#F0F0FF` | `#0A0A1A` | headings, body |
| `secondary` (text) | `#8A8AA8` | `#5A5A78` | labels, meta |
| `muted` (text) | `#4A4A6A` | `#9898B0` | placeholders, dividers |
| `token` (border) | `rgba(255,255,255,0.07)` | `rgba(10,10,26,0.08)` | hairline borders |
| `success` | `#22C55E` | `#16A34A` | availability dot, result metrics |
| `gradient-hero` | `linear-gradient(135deg, #5B6EF5 0%, #8B5CF6 50%, #EC4899 100%)` | same | CTA banner tint (10-15% opacity), OG image |

Implemented as CSS variables in `globals.css` (RGB triplets for alpha support), referenced from `tailwind.config.ts`, switched by `next-themes` class.

## Typography

- Single family: **Plus Jakarta Sans** via `next/font/google` (`--font-jakarta`). Semibold/bold for headings, regular for body.
- Scale: `text-7xl` hero H1 · `text-5xl` section headings · `text-3xl` card headings · `text-xl` sub-headings · `text-base leading-relaxed` body · `text-sm tracking-widest uppercase` eyebrow labels (SectionLabel).
- Body copy max-width ~65ch (`max-w-lg`/`max-w-2xl` per spec). `text-wrap: balance` on h1-h3.

## Spacing & Layout

- Strict 8px grid (`p-2`=8 … `p-24`=96). Sections breathe: `py-24` typical.
- Page container `max-w-7xl mx-auto px-6`.
- Left-aligned hero (never centered). Asymmetric bento for featured work (60/40).
- Radius: `rounded-2xl` cards (per master prompt), `rounded-full` pills/tags/buttons.
- Z-scale (semantic): content < sticky header < mobile-nav overlay < modal < toast < cursor.

## Motion

- Framer Motion variants in `/lib/animations.ts`; shared transition `{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }`.
- GSAP ScrollTrigger only for scroll storytelling (Process connector line). Never mixed with Motion in the same component tree.
- Signature moves: character-stagger hero reveal (AnimatedText), CountUp stats on viewport entry, magnetic CTAs (40px radius), custom cursor (8px dot → 40px difference ring), glass header after 60px scroll, R3F indigo/violet liquid shader hero background with subtle mouse parallax.
- Everything gated by `useReducedMotion()`; cursor also disabled on `pointer: coarse`.

## Components

`Button` (primary/ghost), `Card` (hover glow: border → accent + `0 0 20px rgba(91,110,245,0.2)`), `Tag` pill, `SectionLabel` eyebrow, `AnimatedText`, `MagneticButton`, `CustomCursor`, `ScrollProgress`, `CountUp`. Header: transparent → glass (`backdrop-blur-xl bg-base/80 border-b border-token`). Focus rings: `ring-2 ring-accent-primary ring-offset-2 ring-offset-base`.
