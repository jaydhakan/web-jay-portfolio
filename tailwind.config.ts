import type { Config } from "tailwindcss";

/**
 * Design token system — single source of truth for color, type, spacing.
 * Color values live as CSS variables in globals.css (RGB triplets) so the
 * next-themes light/dark toggle can swap them without touching classes.
 * Dark is the default theme; see DESIGN.md for the full token table.
 */
const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        base: "rgb(var(--bg-base) / <alpha-value>)",
        surface: "rgb(var(--bg-surface) / <alpha-value>)",
        elevated: "rgb(var(--bg-elevated) / <alpha-value>)",
        // Text
        primary: "rgb(var(--text-primary) / <alpha-value>)",
        secondary: "rgb(var(--text-secondary) / <alpha-value>)",
        muted: "rgb(var(--text-muted) / <alpha-value>)",
        // Accents
        accent: {
          primary: "rgb(var(--accent-primary) / <alpha-value>)",
          violet: "rgb(var(--accent-violet) / <alpha-value>)",
          warm: "rgb(var(--accent-warm) / <alpha-value>)",
        },
        // Semantic
        success: "rgb(var(--success) / <alpha-value>)",
        // Hairline borders — pre-baked alpha, used as border-token
        token: "var(--border-token)",
      },
      fontFamily: {
        display: ["var(--font-jakarta)", "system-ui", "sans-serif"],
        body: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-hero":
          "linear-gradient(135deg, #5B6EF5 0%, #8B5CF6 50%, #EC4899 100%)",
      },
      boxShadow: {
        // Card hover glow (Services, Card.tsx)
        glow: "0 0 20px rgba(91, 110, 245, 0.2)",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.4", transform: "scale(0.85)" },
        },
      },
      animation: {
        marquee: "marquee 30s linear infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
