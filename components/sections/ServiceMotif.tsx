/**
 * Always-on "computational motif" behind a services bento tile (V3 P12 / S of
 * the services elevation). A faint, perpetually-running SVG animation keyed to
 * the service type — data lanes streaming, a node graph pulsing, request rings
 * radiating, throughput bars breathing — so the tiles read as LIVE systems, not
 * static cards (the plan: "live computational motifs, always-on, not hover-only").
 *
 * Pure SVG + CSS (compositor-only stroke-dashoffset / opacity / transform), no
 * canvas — cheap enough to run several at once without touching the WebGL budget.
 * Brightens slightly on tile hover (the parent `group`). Decorative: aria-hidden,
 * and every animation is disabled under `prefers-reduced-motion` via motion-safe.
 */
export function ServiceMotif({ icon }: { icon: string }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.5] transition-opacity duration-500 group-hover:opacity-100"
    >
      <svg
        viewBox="0 0 200 200"
        preserveAspectRatio="xMidYMid slice"
        className="absolute -right-6 -top-6 h-44 w-44 text-accent/40"
        fill="none"
        stroke="currentColor"
      >
        {icon === "Database" || icon === "Server" ? <Lanes /> : null}
        {icon === "Bot" || icon === "MessageSquareText" ? <Graph /> : null}
        {icon === "Zap" || icon === "Globe" ? <Rings /> : null}
      </svg>
    </span>
  );
}

/** Streaming data lanes — dashed lines flowing left to right (Data / Infra). */
function Lanes() {
  return (
    <g strokeWidth="1.4" strokeLinecap="round">
      {[40, 80, 120, 160].map((y, i) => (
        <line
          key={y}
          x1="-20"
          y1={y}
          x2="220"
          y2={y}
          strokeDasharray="3 14"
          className="motion-safe:animate-[lane-flow_2.4s_linear_infinite]"
          style={{ animationDelay: `${i * 0.3}s`, opacity: 0.4 + i * 0.12 }}
        />
      ))}
    </g>
  );
}

/** Pulsing node graph — a hub with satellites breathing (AI / Agents / Chat). */
function Graph() {
  const sats = [
    [60, 50],
    [150, 70],
    [140, 150],
    [55, 140],
  ] as const;
  return (
    <g strokeWidth="1.3">
      {sats.map(([x, y], i) => (
        <line
          key={`e${i}`}
          x1="100"
          y1="100"
          x2={x}
          y2={y}
          className="motion-safe:animate-[edge-pulse_3s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
      {sats.map(([x, y], i) => (
        <circle
          key={`n${i}`}
          cx={x}
          cy={y}
          r="4"
          fill="currentColor"
          stroke="none"
          className="motion-safe:animate-[node-breathe_3s_ease-in-out_infinite]"
          style={{ animationDelay: `${i * 0.4}s` }}
        />
      ))}
      <circle cx="100" cy="100" r="7" fill="currentColor" stroke="none" />
    </g>
  );
}

/** Radiating request rings — concentric circles expanding out (APIs / Web). */
function Rings() {
  return (
    <g strokeWidth="1.3">
      {[0, 1, 2].map((i) => (
        <circle
          key={i}
          cx="150"
          cy="50"
          r="20"
          className="origin-[150px_50px] motion-safe:animate-[ring-radiate_3.2s_ease-out_infinite]"
          style={{ animationDelay: `${i * 1.05}s` }}
        />
      ))}
      <circle cx="150" cy="50" r="4" fill="currentColor" stroke="none" />
    </g>
  );
}
