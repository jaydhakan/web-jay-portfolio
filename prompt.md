# Implementation prompt — "The Flight" geo timeline on /work and /about

Paste everything below into Claude Code, with `Phase 3 - Geo Timeline v2 (Full Flight).dc.html` attached or present in the repo.

---

## Context

I have a prototype file, `Phase 3 - Geo Timeline v2 (Full Flight).dc.html`. It was generated in **Claude Design** as a standalone design artifact — a single self-contained HTML component with an inline logic class, no build step, no framework, and some host-specific scaffolding (`<x-dc>`, `sc-if`, `sc-for`, `support.js`, `data-props` tweaks).

**Treat it as a reference implementation, not code to copy.** It is the source of truth for *behaviour, motion feel, math, and visual design*. It is not the source of truth for *architecture*. You are expected to improve it as you port it — it was written outside my codebase, without access to my components, tokens, or conventions.

Port it into my Next.js App Router site as the primary content experience for **`/work`** and **`/about`**.

### Current site stack
- Next.js (App Router), React, TypeScript, Tailwind
- GSAP + ScrollTrigger (+ SplitText, DrawSVG, Flip, CustomEase) via `lib/gsap.ts`
- Lenis smooth scroll driven off the GSAP ticker, publishing a velocity bus (`velocity`, `progress`, `direction`)
- react-three-fiber for existing WebGL set pieces
- Existing design tokens: `DUR = { micro: .4s, std: .8s, hero: 1.2s }`, easings `expo.out` / `cubic-bezier(.16,1,.3,1)`, custom `jdFlow`
- Existing motion primitives in `components/motion/*` — reuse them, don't reinvent

### What this replaces
- `/work`: the `SerpentineTimeline` + `WorkGeoline` + `FlightBackdrop` combination and the static left-column project cards
- `/about`: the `Geoline` career timeline **and** the separate "The Training Signal" loss-curve section — these told the same story twice and are now merged into one experience

---

## What the thing actually is

A full-viewport 2D-canvas 3D flight. A camera flies a circular spiral path through space. One **beacon** (a particle swarm + glowing core) sits at each timeline item, offset alternately left and right of the path. As the camera approaches a beacon, its swarm condenses, it flares, a lock-on reticle draws around it, and a **hologram card** materialises beside it — DOM, not canvas — connected to the beacon by an animated dashed tether line.

Scroll drives camera position along the path. The mapping is **dwell-warped**: the camera parks at each station for a readable beat, then accelerates through transit to the next one. Cards are positioned every frame by projecting their beacon's 3D position into screen space, then clamping to the viewport.

Same component, two datasets:
- **`/work`** — 9 projects. 3 "deep dive" cards (large, with metric + description + case-study link), 6 "log" cards (compact, one line + metric). Category filter (All / Agents / Pipelines / Search) dims non-matching beacons *and* their cards to 18% opacity in sync.
- **`/about`** — 7 career epochs. Uniform epoch cards with a `LOSS x.xx` readout that descends across the run, so the flight reads as a training run converging.

---

## Non-negotiables

1. **Keep every animation and its exact feel.** Dwell-warped scroll, exponential camera damping, banking into turns, FOV stretch with speed, idle bob, cursor parallax, speed-reactive dust streaking, chromatic split on fast motion, swarm condensation, arrival flare, lock-on reticle, dashed tether, card materialise choreography (3D tilt → blur resolve → clip-wipe → glow flash → staggered children), HUD counter, progress bars, rail indicators. Nothing gets simplified because it's inconvenient to port.
2. **Preserve the math verbatim.** The path function, `warp()`, `uToScroll()`, the projection, the envelope curves and all their constants are tuned. Port them as-is into a pure, testable module. Change behaviour only where this prompt says to.
3. **60fps is the bar**, on a mid-range laptop and a mid-range phone.

---

## Architecture I want

Do not port it as one giant component.

```
lib/flight/path.ts        // path(u), warp(), uToScroll(), projection — pure, no DOM, unit-testable
lib/flight/types.ts       // FlightItem discriminated union (deep | log | epoch)
components/flight/FlightStage.tsx     // orchestrator: canvas + card layer + HUD + rail
components/flight/FlightCanvas.tsx    // the rAF render loop, canvas only
components/flight/HoloCard.tsx        // one card; variant-driven
components/flight/FlightRail.tsx      // station navigation rail
components/flight/FlightHUD.tsx       // counter, progress, active label
components/flight/FlightFallback.tsx  // the static list
data/work.ts / data/about.ts          // typed content, no content in components
```

`FlightStage` takes `items: FlightItem[]` plus optional `filter` config. `/work` and `/about` are thin pages that pass data.

---

## Performance requirements

The prototype already went through an optimisation pass. Carry all of it over, and verify each one after porting:

- **Exactly one rAF scheduler.** An earlier version accidentally scheduled two frames per frame and compounded. Assert this in review.
- **Zero layout reads in the frame loop.** No `offsetWidth`, `getBoundingClientRect`, or `scrollHeight` per frame. Card dimensions, scroll range, and rail gutter are measured once in a batched pass on mount / resize / rebuild / `document.fonts.ready`.
- **Diffed DOM writes.** Never assign a style or `textContent` value the node already has. The prototype's `sv()` / `st()` helpers do this — keep the pattern.
- **No per-frame allocation.** Particles and dust live in preallocated `Float32Array`s; projection writes into a scratch object rather than returning one. Keeps GC flat.
- **Batch canvas state changes.** Dust is bucketed into ~6 alpha bands with prebuilt colour strings and stroked as batched paths; swarm colour is hoisted per beacon. Target well under ~50 `fillStyle` assignments per frame, not 1000+.
- **Cull aggressively.** Skip swarms that are off-screen, more than ~2.6 stations behind the camera, or far enough that points are sub-pixel. Frustum-cull dust. Precompute the path ribbon once.
- **Park the loop** — stop scheduling entirely — when: the canvas leaves the viewport (IntersectionObserver), the user has scrolled past into the fallback list, the viewport is below the flight breakpoint, or the camera has converged and there's been no input for a few seconds. Any scroll / wheel / touch / pointer / visibility event wakes it.
- **Adaptive quality ladder.** 3 tiers stepping down dust count, swarm count, DPR cap, and optional effects (chromatic split, blur, glass). Seed the initial tier from `navigator.hardwareConcurrency`; demote on a rolling frame-time average. One-way ratchet per session.
- **GPU-friendly properties only.** `transform` and `opacity` for anything animating. The rail indicators must use `scaleX`, never `width`. Card blur must be quantised (0.5px steps) and dropped entirely near rest.
- **`will-change` toggles with visibility.** Never leave 9 backdrop-filtered layers permanently promoted.

Add a dev-only FPS/frame-time overlay behind a query param or env flag so this stays measurable.

---

## Accessibility

- Respect `prefers-reduced-motion` with a **live** `change` listener, not just a mount-time read. Reduced motion means: camera snaps instead of damping, no drift/bob/spin/streak, no idle repaint at all — render only on real input.
- The canvas is decorative: `aria-hidden`. The **fallback list is the accessible content** and must always exist in the DOM below the flight, not be conditionally removed. Real headings, real links, correct order.
- A visible-on-focus skip link ("Skip the flight — jump to the list") as the first focusable element.
- Rail buttons need real `aria-label`s and visible focus rings. Keyboard: ← / → to step stations, Home / End to jump to the ends.
- One `h1` per page. Card headings must be correctly nested.
- Verify contrast on card text over the canvas — the glass backgrounds carry it, so don't reduce their opacity for aesthetics without rechecking.

---

## Mobile and responsive

- The prototype disables the flight below 680px and lets the fallback list carry the page. Keep that floor, but **do better than the prototype above it**: the flight should be genuinely good on tablets and large phones in landscape, not merely not-broken.
- On touch devices, cursor parallax is replaced by a slow autonomous camera drift so the scene stays alive.
- Touch targets on the rail must be ≥44px. The prototype widens rail padding on coarse pointers — keep that.
- Verify the card clamping logic at every breakpoint. Cards must never overlap the nav, the HUD, or the rail, and must never leave the viewport. This was a repeated bug source; test 1920 / 1440 / 1024 / 834 / 768 / 680.
- Handle `orientationchange`, not just `resize`. Coalesce both through rAF.
- Check `100vh` behaviour with mobile browser chrome — prefer `100dvh`.

---

## Loading

Async data or fonts must not cause a blank flash or layout jump. The prototype has a boot overlay that fades on the first painted frame, with a hard timeout fallback so it can never strand the page. Keep that pattern, and make sure the overlay clears even if the build step throws — a failure must degrade to the readable list, never to an empty screen.

---

## Cleanup — this is a Next.js SPA, so it matters

On unmount from `/work` or `/about`:
- Cancel every rAF (including any coalesced resize frame) and set a `dead` flag so an in-flight callback can't reschedule after teardown
- Clear every `setTimeout`
- Cancel every WAAPI animation you created (keep them in a tracked array; the prototype also caps the array so it can't grow unbounded)
- Remove every listener: resize, orientationchange, pointermove, keydown, scroll, wheel, touchstart, visibilitychange, and the reduced-motion `change` listener
- Disconnect the IntersectionObserver
- Release the canvas backing store (`canvas.width = canvas.height = 1`) and null out retained DOM refs, beacon arrays, and the cached gradient

Then verify: navigate `/work → /about → /work` ten times and confirm listener count, rAF count, and heap are flat. **Switching datasets must be atomic** — an earlier bug had beacons from one page paired with the other page's item array for a few frames, which threw and killed the loop. Each beacon should carry its own item reference rather than indexing into a shared array that can be swapped mid-frame.

---

## Things to actively improve while porting

These are places I expect your judgement to beat the prototype's:

1. **Camera feel.** The dwell/glide values are exposed as tunables (`dwell`, `glide`). Wire them to sensible constants, but if you can make the transit between stations read better — a subtle ease at the hand-off, a touch more bank — do it.
2. **Deep-link / shareable state.** Stations should be addressable (`/work#station-3` or a query param) so links land on a specific project. The prototype has no URL state at all.
3. **Filter transition on /work.** Currently a straight opacity dim. A staggered dim, or re-flowing the remaining stations, would be better — as long as it stays 60fps.
4. **Card content should be real components.** Reuse my existing card/typography/button components and tokens instead of the prototype's inline styles. All inline styling in the reference is a host constraint, not a design decision.
5. **Integrate with Lenis** rather than reading `scrollY` directly, so the flight shares one scroll authority with the rest of the site. Drive it from the existing velocity bus if that's cleaner.
6. **Tests.** `path.ts` is pure — unit test `warp()` monotonicity, `uToScroll()` round-tripping, and projection behind-camera culling.

---

## Definition of done

- `/work` and `/about` both run the flight, driven by typed data files
- Motion is visually indistinguishable from the reference, at a consistent 60fps on mid-range hardware
- Reduced motion, keyboard, screen reader, and no-JS all land on fully readable content
- Clean at every breakpoint from 320px up, on touch and mouse
- No listener, rAF, timer, or memory growth across repeated route switches
- `lib/flight/path.ts` is pure and unit-tested

Work through it in stages — extract the math, then canvas, then cards, then HUD/rail, then filtering, then cleanup — and show me each stage running before moving on.
