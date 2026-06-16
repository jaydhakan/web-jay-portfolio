import { ImageResponse } from "next/og";
import { siteConfig, hero } from "@/data/content";

/**
 * Branded OG card, generated at build time (replaces the old static og-image.png
 * that baked the deprecated tri-colour gradient — D-3). Dark --base canvas, one
 * electric-indigo accent, and the concentric contour-ring motif of "The Field".
 * No gradient mesh, on-brand and unmistakable.
 */
export const alt = `${siteConfig.name}, ${siteConfig.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BASE = "#0b0b11";
const INK = "#ebecfa";
const INK_DIM = "#a3a4c4";
const ACCENT = "#6b7cff";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: BASE,
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Contour-ring motif (echo of The Field), upper-right */}
        <div style={{ position: "absolute", top: -120, right: -120, display: "flex" }}>
          {[420, 320, 220, 120].map((d) => (
            <div
              key={d}
              style={{
                position: "absolute",
                top: 240 - d / 2,
                right: 240 - d / 2,
                width: d,
                height: d,
                borderRadius: d,
                border: `1px solid ${ACCENT}`,
                opacity: 0.22,
              }}
            />
          ))}
        </div>

        {/* Mono eyebrow with accent tick */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 2, background: ACCENT }} />
          <div
            style={{
              color: INK_DIM,
              fontSize: 22,
              letterSpacing: 6,
              textTransform: "uppercase",
            }}
          >
            {siteConfig.role}
          </div>
        </div>

        {/* Name + tagline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ color: INK, fontSize: 120, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>
            {hero.h1Line1}
          </div>
          <div style={{ color: INK, fontSize: 120, fontWeight: 800, lineHeight: 1.05, letterSpacing: -3 }}>
            {hero.h1Line2}
          </div>
        </div>

        {/* Footer: name + domain on a hairline */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid rgba(235,236,250,0.10)",
            paddingTop: 28,
          }}
        >
          <div style={{ color: INK, fontSize: 30, fontWeight: 700 }}>{siteConfig.name}</div>
          <div style={{ color: INK_DIM, fontSize: 26 }}>jaydhakan.com</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
