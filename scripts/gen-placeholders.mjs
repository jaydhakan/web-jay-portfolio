/**
 * Generate on-brand PLACEHOLDER imagery (dev-only, not part of the app).
 * Dark base + iridescent palette v2 + a per-category motif + the project title.
 * Cohesive with the site so nothing renders empty until Jay drops real assets;
 * the TODO(JAY) flags in data/content.ts stay so these remain clearly temporary.
 *
 * Usage: node scripts/gen-placeholders.mjs
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import path from "node:path";

const HEX = { base: "#0b0b11", indigo: "#6b7cff", violet: "#8b7cff", cyan: "#67e8f9", ink: "#ebecfa", dim: "#a3a4c4" };

const projects = [
  { file: "prompt-to-site.png", title: "Multi-Agent Prompt-to-Site Studio", industry: "AI / Web Automation", year: "2025", category: "AI & Agents" },
  { file: "social-scraper.png", title: "Social Media Scraping Platform", industry: "Data Infrastructure", year: "2024", category: "Data Pipelines" },
  { file: "search-kit.png", title: "Custom Google Search Kit", industry: "API / SaaS Infrastructure", year: "2025", category: "APIs" },
  { file: "zillow-harvester.png", title: "Zillow Data Harvester", industry: "Real Estate Data", year: "2023", category: "Data Pipelines" },
  { file: "chatbot-creator.png", title: "1-Click WhatsApp / Web Chatbot Creator", industry: "Conversational AI", year: "2024", category: "AI & Agents" },
  { file: "cinqcare.png", title: "Patient-Specific Healthcare Automation", industry: "Healthcare", year: "2024", category: "AI & Agents" },
];

const escapeXml = (s) => s.replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);

function seeded(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280), s / 233280);
}

function motifFor(category, p, rnd) {
  if (category === "Data Pipelines") {
    let lanes = "";
    for (let i = 0; i < 4; i++) {
      const y = 210 + i * 120;
      lanes += `<line x1="760" y1="${y}" x2="1580" y2="${y}" stroke="${i % 2 ? p.b : p.a}" stroke-width="3" stroke-dasharray="3 15" stroke-linecap="round" opacity="0.55"/>`;
    }
    return lanes;
  }
  if (category === "APIs") {
    const cx = 1210, cy = 320;
    let rings = "";
    for (let i = 1; i <= 4; i++) rings += `<circle cx="${cx}" cy="${cy}" r="${i * 58}" fill="none" stroke="${p.a}" stroke-width="1.6" opacity="${0.55 - i * 0.1}"/>`;
    rings += `<circle cx="${cx}" cy="${cy}" r="11" fill="${p.b}"/>`;
    return rings;
  }
  // AI & Agents — node graph
  const cx = 1170, cy = 310;
  let edges = "";
  let nodes = `<circle cx="${cx}" cy="${cy}" r="14" fill="${p.a}"/>`;
  for (let i = 0; i < 5; i++) {
    const ang = rnd() * Math.PI * 2;
    const r = 130 + rnd() * 150;
    const wx = cx + Math.cos(ang) * r;
    const wy = cy + Math.sin(ang) * r * 0.72;
    edges += `<line x1="${cx}" y1="${cy}" x2="${wx.toFixed(0)}" y2="${wy.toFixed(0)}" stroke="${p.b}" stroke-width="1.5" stroke-dasharray="4 9" opacity="0.5"/>`;
    nodes += `<circle cx="${wx.toFixed(0)}" cy="${wy.toFixed(0)}" r="8" fill="${p.b}" opacity="0.9"/>`;
  }
  return edges + nodes;
}

function coverSvg({ title, industry, year, category }, seed) {
  const W = 1600, H = 1000;
  const palettes = {
    "AI & Agents": { a: HEX.violet, b: HEX.indigo, gx: 0.74, gy: 0.3 },
    "Data Pipelines": { a: HEX.indigo, b: HEX.cyan, gx: 0.78, gy: 0.34 },
    APIs: { a: HEX.cyan, b: HEX.indigo, gx: 0.76, gy: 0.32 },
  };
  const p = palettes[category] || palettes["AI & Agents"];
  const rnd = seeded(seed);

  let curves = "";
  for (let i = 0; i < 6; i++) {
    const y = 120 + i * 150 + rnd() * 40;
    const a1 = 40 + rnd() * 70, a2 = 30 + rnd() * 70;
    curves += `<path d="M -60 ${y.toFixed(0)} C ${W * 0.25} ${(y - a1).toFixed(0)}, ${W * 0.5} ${(y + a2).toFixed(0)}, ${W * 0.75} ${(y - a1 * 0.6).toFixed(0)} S ${W + 60} ${(y + a2).toFixed(0)}, ${W + 60} ${y.toFixed(0)}" fill="none" stroke="${p.a}" stroke-width="1.4" opacity="${(0.05 + 0.04 * rnd()).toFixed(3)}"/>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="${p.gx}" cy="${p.gy}" r="0.72">
      <stop offset="0" stop-color="${p.a}" stop-opacity="0.34"/>
      <stop offset="0.5" stop-color="${p.b}" stop-opacity="0.12"/>
      <stop offset="1" stop-color="${p.a}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.45" r="0.78">
      <stop offset="0.5" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.5"/>
    </radialGradient>
    <linearGradient id="fade" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="${HEX.base}" stop-opacity="0.96"/>
      <stop offset="0.5" stop-color="${HEX.base}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="${HEX.base}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <g>${curves}</g>
  <g>${motifFor(category, p, rnd)}</g>
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
  <rect width="${W}" height="${H}" fill="url(#fade)"/>
  <rect x="80" y="${H - 232}" width="40" height="3" fill="${p.a}"/>
  <text x="80" y="${H - 196}" font-family="Arial, Helvetica, sans-serif" font-size="22" letter-spacing="6" fill="${p.a}">${escapeXml(category.toUpperCase())}</text>
  <text x="78" y="${H - 110}" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="58" fill="${HEX.ink}">${escapeXml(title)}</text>
  <text x="80" y="${H - 56}" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="${HEX.dim}">${escapeXml(industry)} &#183; ${year}</text>
</svg>`;
}

function profileSvg() {
  const S = 800;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
  <defs>
    <radialGradient id="g" cx="0.5" cy="0.42" r="0.75">
      <stop offset="0" stop-color="${HEX.violet}" stop-opacity="0.4"/>
      <stop offset="0.55" stop-color="${HEX.indigo}" stop-opacity="0.14"/>
      <stop offset="1" stop-color="${HEX.indigo}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mono" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${HEX.ink}"/>
      <stop offset="1" stop-color="${HEX.violet}"/>
    </linearGradient>
  </defs>
  <rect width="${S}" height="${S}" fill="${HEX.base}"/>
  <rect width="${S}" height="${S}" fill="url(#g)"/>
  <circle cx="400" cy="400" r="250" fill="none" stroke="${HEX.indigo}" stroke-width="1.5" opacity="0.25"/>
  <circle cx="400" cy="400" r="320" fill="none" stroke="${HEX.violet}" stroke-width="1.5" opacity="0.15"/>
  <text x="400" y="510" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="320" fill="url(#mono)">JD</text>
</svg>`;
}

const root = process.cwd();
mkdirSync(path.join(root, "public/images/projects"), { recursive: true });
mkdirSync(path.join(root, "public/images/profile"), { recursive: true });

let n = 0;
for (let i = 0; i < projects.length; i++) {
  const out = path.join(root, "public/images/projects", projects[i].file);
  await sharp(Buffer.from(coverSvg(projects[i], i + 1))).png({ quality: 90 }).toFile(out);
  n++;
}
await sharp(Buffer.from(profileSvg())).jpeg({ quality: 88 }).toFile(path.join(root, "public/images/profile/jay.jpg"));
console.log(`generated ${n} project covers + 1 profile placeholder`);
