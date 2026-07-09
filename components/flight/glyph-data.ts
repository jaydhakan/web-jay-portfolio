/**
 * glyph-data.ts — frozen lucide icon geometry for the /about beacon glyphs
 * (timelineplan.md §11.1). Copied verbatim from lucide-react's iconNode data (ISC
 * license) so bundler quirks and lucide upgrades can never alter the sampled shapes.
 *
 * KEEP IN LOCKSTEP (positional, index === milestone): data/content.ts `timeline[]`
 * ↔ Geoline.tsx `KIND` ↔ argmax.ts `ABOUT_SCORE` ↔ this array. A dev-only length
 * assertion lives in FlightCanvas's glyph prep.
 */

export type GlyphDef = {
  /** SVG path `d` strings in the lucide 24×24 viewBox (stroke-drawn, width 2). */
  paths: string[];
  /** lucide circle primitives (sub-1px radii get FILLED at sample time or they vanish). */
  circles: { cx: number; cy: number; r: number }[];
};

export const ABOUT_GLYPHS: GlyphDef[] = [
  /* 0 Terminal — 2018 First lines of Python */
  { paths: ["M12 19h8", "m4 17 6-6-6-6"], circles: [] },
  /* 1 GraduationCap — 2019-2023 B.Tech in AI */
  {
    paths: [
      "M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z",
      "M22 10v6",
      "M6 12.5V16a6 3 0 0 0 12 0v-3.5",
    ],
    circles: [],
  },
  /* 2 Building2 — 2021-2024 Python Developer, BotPro */
  {
    paths: [
      "M10 12h4",
      "M10 8h4",
      "M14 21v-3a2 2 0 0 0-4 0v3",
      "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2",
      "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
    ],
    circles: [],
  },
  /* 3 BrainCircuit — 2023 First AI agents in production */
  {
    paths: [
      "M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z",
      "M9 13a4.5 4.5 0 0 0 3-4",
      "M6.003 5.125A3 3 0 0 0 6.401 6.5",
      "M3.477 10.896a4 4 0 0 1 .585-.396",
      "M6 18a4 4 0 0 1-1.967-.516",
      "M12 13h4",
      "M12 18h6a2 2 0 0 1 2 2v1",
      "M12 8h8",
      "M16 8V5a2 2 0 0 1 2-2",
    ],
    circles: [
      { cx: 16, cy: 13, r: 0.5 },
      { cx: 18, cy: 3, r: 0.5 },
      { cx: 20, cy: 21, r: 0.5 },
      { cx: 20, cy: 8, r: 0.5 },
    ],
  },
  /* 4 Award — 2024 Mr Perfectionist Award */
  {
    paths: [
      "m15.477 12.89 1.515 8.526a.5.5 0 0 1-.81.47l-3.58-2.687a1 1 0 0 0-1.197 0l-3.586 2.686a.5.5 0 0 1-.81-.469l1.514-8.526",
    ],
    circles: [{ cx: 12, cy: 8, r: 6 }],
  },
  /* 5 Sparkles — 2024-2025 Python & AI/ML Engineer, VRSEN */
  {
    paths: [
      "M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z",
      "M20 2v4",
      "M22 4h-4",
    ],
    circles: [{ cx: 4, cy: 20, r: 2 }],
  },
  /* 6 Compass — 2025-Now Independent */
  {
    paths: [
      "m16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z",
    ],
    circles: [{ cx: 12, cy: 12, r: 10 }],
  },
];
