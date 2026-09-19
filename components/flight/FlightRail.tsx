"use client";

import type { FlightItem } from "@/lib/flight/types";

/**
 * Station navigation rail.
 *
 * Real buttons with real labels: this is the one piece of flight chrome that IS
 * in the tab order, because it is the keyboard user's way to fly. Active/near
 * state is painted by the engine (colour + a scaleX tick), never by React
 * state, so scrubbing the rail costs no renders.
 *
 * Touch targets: the engine swaps the vertical padding to 21px on coarse
 * pointers, taking each row past the 44px minimum.
 */
export function FlightRail({
  items,
  onJump,
}: {
  items: FlightItem[];
  onJump: (index: number) => void;
}) {
  return (
    <div
      data-flight-railgroup
      className="absolute right-4 top-1/2 z-[7] flex -translate-y-1/2 flex-col items-end gap-3 md:right-7"
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          data-flight-rail={i}
          onClick={() => onJump(i)}
          aria-label={`Fly to station ${i + 1}: ${item.title}`}
          title={item.title}
          className="flex cursor-pointer items-center justify-end gap-2.5 border-none bg-transparent py-2.5 pl-4 font-mono text-[9.5px] font-semibold tracking-[0.14em] text-muted transition-colors duration-300 hover:text-accent-cyan focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
        >
          <span className="opacity-0 transition-opacity duration-300">{item.num}</span>
          <span className="block h-0.5 w-10 origin-right scale-x-[0.4] rounded-sm bg-current transition-transform duration-[350ms] ease-[cubic-bezier(.16,1,.3,1)]" />
        </button>
      ))}
    </div>
  );
}
