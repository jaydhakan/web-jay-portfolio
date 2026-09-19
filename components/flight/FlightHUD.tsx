/**
 * Flight HUD — station counter, run progress, active station label.
 *
 * Every value here is written imperatively by the engine via `data-flight-*`
 * hooks (diffed, so a node is only touched when its value actually changes).
 * Nothing in this component is React state: a 60fps readout must never
 * re-render a tree. The markup ships with sensible initial values so it reads
 * correctly before the first frame and under no-JS.
 *
 * aria-hidden: this duplicates information the fallback list already carries in
 * a readable form. The progress bar is scaleX-driven — never `width`.
 */
export function FlightHUD({ count }: { count: number }) {
  const total = String(count).padStart(2, "0");
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute bottom-7 left-6 z-[7] flex items-center gap-3.5 md:left-11"
    >
      <span className="size-1.5 shrink-0 rounded-full bg-accent-cyan shadow-[0_0_10px_var(--color-accent-cyan)]" />
      <span
        data-flight-count
        className="font-mono text-[11px] font-semibold tabular-nums tracking-[0.2em] text-ink-dim"
      >
        01 / {total}
      </span>
      <span className="block h-0.5 w-[150px] overflow-hidden rounded-sm bg-line">
        <span
          data-flight-bar
          className="block h-full w-full origin-left scale-x-0 rounded-sm bg-gradient-to-r from-accent to-accent-cyan"
        />
      </span>
      <span
        data-flight-label
        className="max-w-[28vw] truncate font-mono text-[10px] tracking-[0.16em] text-accent-cyan/80"
      />
    </div>
  );
}
