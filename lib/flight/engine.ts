/**
 * The Flight — imperative render engine.
 *
 * Deliberately NOT a React component. It owns one rAF loop and writes straight
 * to the canvas and to DOM nodes React rendered; React owns structure, this owns
 * per-frame presentation. Nothing here ever calls setState, so a 60fps camera
 * never re-renders a tree.
 *
 * INVARIANTS (each one is load-bearing; see ANIMATIONS.md "The Flight"):
 *   1. EXACTLY ONE rAF in flight. `loop` is the only place that schedules, and
 *      it schedules exactly once per frame — or not at all when parked.
 *   2. ZERO layout reads in `frame()`. Every offsetWidth / getBoundingClientRect
 *      lives in `size()` / `measure()`, which run on mount, resize, rebuild and
 *      fonts-ready only.
 *   3. DIFFED DOM WRITES. `sv` / `st` never assign a value a node already has.
 *   4. NO PER-FRAME ALLOCATION. Particles, dust and bridges are preallocated
 *      Float32Arrays; projection writes into scratch objects.
 *   5. Each beacon carries its OWN item reference — never an index into a shared
 *      array that could be swapped underneath a running frame.
 */
import {
  type Camera,
  type Vec3,
  GLIDE_DEFAULT,
  GLIDE_MAX,
  GLIDE_MIN,
  HOLD_DEFAULT,
  HOLD_MAX,
  HOLD_MIN,
  LEAD,
  PATH_STRIDE,
  U_START,
  beaconPosition,
  beaconSide,
  createCamera,
  damp,
  envelope,
  path,
  project,
  smoothstep,
  updateCamera,
  uToScroll,
  vec3,
  warp,
} from "@/lib/flight/path";
import { BASE, CYAN, INK, VIOLET, beaconRamp, bloomSprite, dustBucket, rgba } from "@/lib/flight/palette";
import {
  DEMOTE_GRACE_MS,
  DEMOTE_MS,
  FLIGHT_MIN_WIDTH,
  MAX_DUST,
  MAX_PARTS,
  TIERS,
  seedTier,
} from "@/lib/flight/tiers";
import type { FlightItem } from "@/lib/flight/types";

const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);

/**
 * Clamp into a band that may be INVERTED. On a short viewport (a phone in
 * landscape, a 500px-tall window) a card can be taller than the space between
 * the nav and the HUD, so `hi < lo`; centring is the only sane answer, and
 * without it the card slams to one edge and clips.
 */
const clampBand = (v: number, lo: number, hi: number) =>
  hi < lo ? (lo + hi) / 2 : v < lo ? lo : v > hi ? hi : v;

/**
 * Minimum vertical exclusion at the top of the stage: the 64px fixed site
 * header plus margin. /work also floats a filter row below the header, so the
 * real inset is MEASURED in size() and can be larger than this.
 */
const NAV_BOTTOM = 88;
/** Viewport padding cards are clamped inside. */
const EDGE_PAD = 22;
/** Bottom exclusion: the HUD strip lives here and cards must clear it. */
const HUD_BAND = 58;
/** Scroll runway per station, in vh. */
const VH_PER_STATION = 105;
/** Extra runway so the last station gets a full dwell before the section ends. */
const VH_TAIL = 60;

/** Stations per second the filter wave travels outward from the camera. */
const FILTER_WAVE_SPEED = 9;
/** Opacity a filtered-out station falls to. */
const FILTER_DIM = 0.18;

export type FlightEngineOptions = {
  /** The <section> that provides the scroll runway. */
  root: HTMLElement;
  canvas: HTMLCanvasElement;
  items: FlightItem[];
  /** Dwell 0..0.8 — fraction of each beat spent parked at a station. */
  dwell?: number;
  /** Camera follow stiffness. */
  glide?: number;
  /** Read the current scroll position. Injected so Lenis stays the one authority. */
  getScroll?: () => number;
  /** Scroll to an absolute document position through the active authority. */
  scrollTo?: (y: number, immediate: boolean) => void;
  /** Fires when the SETTLED station changes — drives the URL hash. Never per-frame. */
  onStation?: (index: number, item: FlightItem) => void;
  /**
   * Dev FPS overlay target, read LAZILY: the overlay is mounted from an effect
   * (after the URL flag is read), so it does not exist when the engine does.
   */
  getDebugEl?: () => HTMLElement | null;
};

type Beacon = {
  x: number; y: number; z: number;
  side: number;
  /** Own reference — never an index into a swappable array (invariant 5). */
  item: FlightItem;
  /** xyz + phase per particle, preallocated. */
  parts: Float32Array;
  /** "r,g,b", hoisted once so the swarm never rebuilds a colour string. */
  rgb: string;
  /** Pre-rendered radial bloom, blitted under "lighter" — built once. */
  bloom: HTMLCanvasElement | null;
  /** Current / target filter opacity, and the value held when the wave started. */
  dim: number;
  dimFrom: number;
  /** performance.now() of the arrival flare, or 0. */
  flareAt: number;
  /** Card materialise has fired. */
  ignited: boolean;
};

/** A faint arc between two related stations — the Constellation Spine callback. */
type Bridge = { a: number; b: number; pts: Float32Array };

export class FlightEngine {
  private opt: FlightEngineOptions;
  private cv: HTMLCanvasElement;
  private cx: CanvasRenderingContext2D | null = null;

  // --- lifecycle -----------------------------------------------------------
  private dead = false;
  private raf = 0;
  private resizeRaf = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private anims: Animation[] = [];
  private io: IntersectionObserver | null = null;
  private mq: MediaQueryList | null = null;
  private ready = false;
  private booted = false;
  private warned = false;

  // --- scene ---------------------------------------------------------------
  private items: FlightItem[] = [];
  private beacons: Beacon[] = [];
  private bridges: Bridge[] = [];
  private n = 0;
  private dust = new Float32Array(MAX_DUST * 3);
  private dustN = MAX_DUST;
  private partsN = MAX_PARTS;
  private ribbon = new Float32Array(0);
  private dustBuf: { n: number; a: Float32Array }[] = [];
  private dustFill: string[] = [];
  private vig: CanvasGradient | null = null;

  // --- DOM -----------------------------------------------------------------
  private cards: (HTMLElement | null)[] = [];
  private cardDims: { w: number; h: number }[] = [];
  private rails: (HTMLElement | null)[] = [];
  private el: {
    intro?: HTMLElement | null;
    stage?: HTMLElement | null;
    nebula?: HTMLElement | null;
    count?: HTMLElement | null;
    bar?: HTMLElement | null;
    label?: HTMLElement | null;
    boot?: HTMLElement | null;
  } = {};

  // --- camera / input ------------------------------------------------------
  private cam: Camera = createCamera();
  private camU = U_START;
  private velU = 0;
  private look = { x: 0, y: 0 };
  private mouse = { x: 0.5, y: 0.5 };
  private lastT = 0;
  private idleAt = 0;
  private dirty = true;
  private lastScroll = -1;
  private dtAvg = 16;
  private tier = 0;
  private parked = false;
  private onScreen = true;
  private rm = false;
  private fine = true;
  private mobile = false;
  private settled = -1;
  private frameCount = 0;

  /** Hyperspace burst, 0..1, decaying — fired by a multi-station jump. */
  private burst = 0;

  // --- filter --------------------------------------------------------------
  private filter = "All";
  private filterAt = -1e9;
  private filterOrigin = 0;

  // --- measured layout (invariant 2) ---------------------------------------
  private vw = 0;
  private vh = 0;
  private dpr = 1;
  private sectionTop = 0;
  private range = 1;
  private railGutter = EDGE_PAD;
  /** Measured top exclusion: the header, plus the filter row where present. */
  private topInset = NAV_BOTTOM;

  // --- scratch (invariant 4) -----------------------------------------------
  private readonly S: Vec3 = vec3();
  private readonly S2: Vec3 = vec3();
  private readonly P: Vec3 = vec3();
  private dash: number[] = [];
  private nodash: number[] = [];

  private binds!: {
    resize: () => void;
    move: (e: PointerEvent) => void;
    wake: () => void;
    key: (e: KeyboardEvent) => void;
    vis: () => void;
    mqc: (e: MediaQueryListEvent) => void;
  };

  constructor(options: FlightEngineOptions) {
    this.opt = options;
    this.cv = options.canvas;
    this.items = options.items;
  }

  // ═══ diffed DOM writes (invariant 3) ══════════════════════════════════════

  private sv(el: HTMLElement | null | undefined, prop: string, val: string) {
    if (!el) return;
    const cache = (el as ElWithCache).__sv ?? ((el as ElWithCache).__sv = {});
    if (cache[prop] !== val) {
      cache[prop] = val;
      (el.style as unknown as Record<string, string>)[prop] = val;
    }
  }

  private st(el: HTMLElement | null | undefined, val: string) {
    if (!el) return;
    const e = el as ElWithCache;
    if (e.__st !== val) {
      e.__st = val;
      el.textContent = val;
    }
  }

  // ═══ lifecycle ════════════════════════════════════════════════════════════

  mount() {
    this.dead = false;
    const ctx = this.cv.getContext("2d", { alpha: true, desynchronized: true });
    if (!ctx) return;
    this.cx = ctx;

    this.mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.rm = this.mq.matches;
    this.tier = seedTier();
    this.idleAt = performance.now();
    this.lastT = performance.now();

    this.binds = {
      resize: () => {
        // Coalesce resize AND orientationchange through a single rAF so a
        // rotation storm can never run two measure passes in one frame.
        if (this.resizeRaf || this.dead) return;
        this.resizeRaf = requestAnimationFrame(() => {
          this.resizeRaf = 0;
          if (this.dead) return;
          this.size();
          this.measure();
          this.dirty = true;
          this.wake();
        });
      },
      move: (e) => {
        this.wake();
        if (!this.fine) return;
        this.mouse.x = e.clientX / this.vw;
        this.mouse.y = e.clientY / this.vh;
        this.dirty = true;
      },
      wake: () => this.wake(),
      key: (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey || this.mobile || !this.inView()) return;
        const cur = Math.round(this.camU);
        if (e.key === "ArrowRight" || (e.key === "ArrowDown" && e.shiftKey)) {
          e.preventDefault();
          this.jumpTo(Math.min(this.n - 1, cur + 1));
        } else if (e.key === "ArrowLeft" || (e.key === "ArrowUp" && e.shiftKey)) {
          e.preventDefault();
          this.jumpTo(Math.max(0, cur - 1));
        } else if (e.key === "Home") {
          e.preventDefault();
          this.jumpTo(0);
        } else if (e.key === "End") {
          e.preventDefault();
          this.jumpTo(this.n - 1);
        }
      },
      vis: () => {
        // Coming back from a background tab: the first dt would be enormous and
        // would instantly trip the demotion heuristic. Reset both.
        this.lastT = performance.now();
        this.dtAvg = 16;
        this.dirty = true;
        this.wake();
      },
      mqc: (e) => {
        this.rm = e.matches;
        this.dirty = true;
        if (this.rm) this.stopAnims();
        this.wake();
      },
    };

    addEventListener("resize", this.binds.resize, { passive: true });
    addEventListener("orientationchange", this.binds.resize, { passive: true });
    addEventListener("pointermove", this.binds.move, { passive: true });
    addEventListener("keydown", this.binds.key);
    addEventListener("scroll", this.binds.wake, { passive: true });
    addEventListener("wheel", this.binds.wake, { passive: true });
    addEventListener("touchstart", this.binds.wake, { passive: true });
    document.addEventListener("visibilitychange", this.binds.vis);
    this.mq.addEventListener("change", this.binds.mqc);

    this.io = new IntersectionObserver(
      (entries) => {
        this.onScreen = entries[0].isIntersecting;
        if (this.onScreen) this.wake();
      },
      { threshold: 0 },
    );
    this.io.observe(this.cv);

    this.rebuild();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.dead = true;
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = 0;
    this.io?.disconnect();
    this.io = null;
    for (const t of this.timers) clearTimeout(t);
    this.timers.length = 0;
    this.stopAnims();

    if (this.binds) {
      removeEventListener("resize", this.binds.resize);
      removeEventListener("orientationchange", this.binds.resize);
      removeEventListener("pointermove", this.binds.move);
      removeEventListener("keydown", this.binds.key);
      removeEventListener("scroll", this.binds.wake);
      removeEventListener("wheel", this.binds.wake);
      removeEventListener("touchstart", this.binds.wake);
      document.removeEventListener("visibilitychange", this.binds.vis);
    }
    this.mq?.removeEventListener("change", this.binds.mqc);
    this.mq = null;

    // Release every backing store (a 2x 1440x900 canvas is ~10MB, and each of
    // the nine bloom sprites is another 128x128x4) and drop every retained DOM
    // reference so a route switch can't pin the old tree. Shrinking a canvas to
    // 1x1 is the only way to hand its buffer back before GC gets around to it —
    // without this, repeated /work <-> /about switches climbed ~50KB a nav.
    try {
      this.cv.width = 1;
      this.cv.height = 1;
    } catch {
      /* canvas already detached */
    }
    for (const b of this.beacons) {
      if (b.bloom) {
        b.bloom.width = 1;
        b.bloom.height = 1;
        b.bloom = null;
      }
    }
    this.cx = null;
    this.vig = null;
    this.dust = new Float32Array(0);
    this.dustFill = [];
    // `opt` holds `root` — the ENTIRE flight section subtree — plus the canvas
    // and three closures over React scope. Anything that outlives the engine by
    // even one navigation would pin all of it, so the options object is
    // replaced with an inert one rather than left pointing at a dead tree.
    this.opt = { root: DETACHED, canvas: DETACHED as unknown as HTMLCanvasElement, items: [] };
    this.cv = DETACHED as unknown as HTMLCanvasElement;
    this.cards = [];
    this.rails = [];
    this.cardDims = [];
    this.beacons = [];
    this.bridges = [];
    this.items = [];
    this.el = {};
    this.ribbon = new Float32Array(0);
    this.dustBuf = [];
  }

  private stopAnims() {
    for (const a of this.anims) {
      try {
        a.cancel();
      } catch {
        /* already finished */
      }
    }
    this.anims.length = 0;
  }

  /** Any real input restores full ambient motion and restarts the loop. */
  private wake = () => {
    this.idleAt = performance.now();
    this.dirty = true;
    if (!this.raf && !this.dead) {
      this.lastT = performance.now();
      this.raf = requestAnimationFrame(this.loop);
    }
  };

  private inView() {
    const y = this.scroll();
    return y > this.sectionTop - this.vh && y < this.sectionTop + this.range + this.vh;
  }

  private scroll() {
    return this.opt.getScroll?.() ?? window.scrollY;
  }

  // ═══ public control surface ═══════════════════════════════════════════════

  /** Scroll so station `i` is centred. Multi-station hops fire a warp burst. */
  jumpTo(i: number) {
    if (this.dead) return;
    const target = clamp(i, 0, this.n - 1);
    const hops = Math.abs(target - this.camU);
    if (hops > 1.4 && !this.rm) this.burst = Math.min(1, hops / 4);
    const y = this.sectionTop + uToScroll(target, this.n, this.dwell, this.range);
    this.opt.scrollTo?.(y, this.rm);
    this.wake();
  }

  /** Push the category filter in without re-rendering the card tree. */
  setFilter(next: string) {
    if (next === this.filter) return;
    this.filter = next;
    this.filterAt = performance.now();
    // The dim wave radiates outward from wherever the camera is standing.
    this.filterOrigin = this.camU;
    for (const b of this.beacons) b.dimFrom = b.dim;
    this.wake();
  }

  /** Current station, for deep-link restore. */
  get station() {
    return Math.round(this.camU);
  }

  /** Frames this engine has drawn. Dev introspection (see FlightCanvas debug). */
  get frames() {
    return this.frameCount;
  }

  /** True while a rAF is scheduled. False means the loop is genuinely parked. */
  get running() {
    return this.raf !== 0;
  }

  /** Park the camera on a station with no animation (deep-link landing). */
  snapTo(i: number) {
    const target = clamp(i, 0, this.n - 1);
    this.camU = target;
    this.velU = 0;
    const y = this.sectionTop + uToScroll(target, this.n, this.dwell, this.range);
    this.opt.scrollTo?.(y, true);
    this.dirty = true;
    this.wake();
  }

  private get dwell() {
    return clamp(this.opt.dwell ?? HOLD_DEFAULT, HOLD_MIN, HOLD_MAX);
  }

  private get glide() {
    return clamp(this.opt.glide ?? GLIDE_DEFAULT, GLIDE_MIN, GLIDE_MAX);
  }

  // ═══ build ════════════════════════════════════════════════════════════════

  private killBoot() {
    const b = this.el.boot;
    if (!b || b.dataset.gone) return;
    b.dataset.gone = "1";
    b.style.opacity = "0";
    b.style.pointerEvents = "none";
    this.timers.push(
      setTimeout(() => {
        b.style.display = "none";
      }, 480),
    );
  }

  private rebuild() {
    // Hard timeout: the overlay clears whatever happens below it. A build that
    // throws must degrade to the readable list, never to an empty screen.
    this.timers.push(setTimeout(() => this.killBoot(), 1500));
    this.timers.push(
      setTimeout(() => {
        if (this.dead) return;
        try {
          this.build();
        } catch (err) {
          console.warn("[flight] build failed — falling back to the list", err);
          this.mobile = true;
          this.sv(this.cv, "display", "none");
        } finally {
          this.ready = true;
          this.killBoot();
        }
      }, 32),
    );
  }

  private build() {
    const root = this.opt.root;
    const items = this.items;
    const n = (this.n = items.length);
    this.stopAnims();
    const T = TIERS[this.tier];

    // One batched query pass; never repeated per frame.
    this.el = {
      stage: root.querySelector<HTMLElement>("[data-flight-stage]"),
      intro: root.querySelector<HTMLElement>("[data-flight-intro]"),
      nebula: root.querySelector<HTMLElement>("[data-flight-nebula]"),
      boot: root.querySelector<HTMLElement>("[data-flight-boot]"),
      count: root.querySelector<HTMLElement>("[data-flight-count]"),
      bar: root.querySelector<HTMLElement>("[data-flight-bar]"),
      label: root.querySelector<HTMLElement>("[data-flight-label]"),
    };
    this.cards = items.map((_, i) =>
      root.querySelector<HTMLElement>(`[data-flight-card="${i}"]`),
    );
    this.rails = items.map((_, i) =>
      root.querySelector<HTMLElement>(`[data-flight-rail="${i}"]`),
    );

    // Beacons. Each carries its own item (invariant 5) and a preallocated swarm.
    const p = vec3();
    this.beacons = items.map((item, i) => {
      beaconPosition(i, p);
      const parts = new Float32Array(MAX_PARTS * 4);
      for (let k = 0; k < MAX_PARTS; k++) {
        const th = Math.random() * 6.283;
        const ph = Math.acos(2 * Math.random() - 1);
        const r = 26 + Math.random() * 60;
        parts[k * 4] = r * Math.sin(ph) * Math.cos(th);
        parts[k * 4 + 1] = r * Math.sin(ph) * Math.sin(th);
        parts[k * 4 + 2] = r * Math.cos(ph);
        parts[k * 4 + 3] = Math.random() * 6.28;
      }
      return {
        x: p.x, y: p.y, z: p.z,
        side: beaconSide(i),
        item,
        parts,
        rgb: beaconRamp(i, n),
        bloom: bloomSprite(beaconRamp(i, n)),
        dim: 1,
        dimFrom: 1,
        flareAt: 0,
        ignited: false,
      };
    });

    // Constellation bridges: a faint arc between nearby stations that share a
    // link key (category on /work, connection tag on /about). Callback to the
    // site's existing Constellation Spine knowledge-graph language.
    this.bridges = [];
    const a = vec3();
    const b = vec3();
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < Math.min(n, i + 4); j++) {
        const li = items[i].links;
        const lj = items[j].links;
        if (!li?.length || !lj?.length) continue;
        if (!li.some((k: string) => lj.includes(k))) continue;
        beaconPosition(i, a);
        beaconPosition(j, b);
        const STEPS = 10;
        const pts = new Float32Array((STEPS + 1) * 3);
        for (let s = 0; s <= STEPS; s++) {
          const t = s / STEPS;
          const bow = Math.sin(t * Math.PI) * 90 * (j - i);
          pts[s * 3] = a.x + (b.x - a.x) * t + bow * 0.35;
          pts[s * 3 + 1] = a.y + (b.y - a.y) * t + bow;
          pts[s * 3 + 2] = a.z + (b.z - a.z) * t;
        }
        this.bridges.push({ a: i, b: j, pts });
      }
    }

    // Star dust — allocated once, reused forever.
    for (let i = 0; i < MAX_DUST; i++) {
      this.dust[i * 3] = (Math.random() * 2 - 1) * 1600;
      this.dust[i * 3 + 1] = (Math.random() * 2 - 1) * 1000;
      this.dust[i * 3 + 2] = Math.random();
    }
    this.dustN = T.dust;
    this.partsN = T.parts;
    // Six alpha buckets with prebuilt colour strings: fillStyle is assigned 6
    // times a frame instead of once per particle.
    this.dustBuf = Array.from({ length: 6 }, () => ({ n: 0, a: new Float32Array(MAX_DUST * 4) }));
    this.dustFill = Array.from({ length: 6 }, (_, k) =>
      dustBucket(k, 6, Number((0.06 + k * 0.075).toFixed(3))),
    );

    // The path ribbon, sampled once — never recomputed per frame.
    const pts: number[] = [];
    for (let k = -0.5; k <= n + 0.5; k += 0.08) {
      path(k, p);
      pts.push(p.x, p.y, p.z);
    }
    this.ribbon = new Float32Array(pts);

    // The scroll runway. Set here (not in CSS) because it depends on item count.
    root.style.height = `${n * VH_PER_STATION + VH_TAIL}vh`;

    this.size();
    this.measure();
    this.ready = true;

    // Re-measure once webfonts land, so card clamping uses final metrics.
    document.fonts?.ready
      .then(() => {
        if (this.dead || !this.cx) return;
        this.measure();
        this.dirty = true;
        this.wake();
      })
      .catch(() => {});
  }

  // ═══ sizing — the ONLY place layout is read (invariant 2) ═════════════════

  private size() {
    const T = TIERS[this.tier];
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.fine = window.matchMedia("(pointer:fine)").matches;
    const m = (this.mobile = this.vw < FLIGHT_MIN_WIDTH);
    const d = (this.dpr = m ? 1 : Math.min(window.devicePixelRatio || 1, T.dpr));

    if (!m && this.cx) {
      const w = Math.round(this.vw * d);
      const h = Math.round(this.vh * d);
      if (this.cv.width !== w || this.cv.height !== h) {
        this.cv.width = w;
        this.cv.height = h;
        const g = this.cx.createRadialGradient(w / 2, h / 2, h * 0.32, w / 2, h / 2, h * 0.9);
        g.addColorStop(0, rgba(BASE, 0));
        g.addColorStop(1, rgba(BASE, 0.72));
        this.vig = g;
      }
    }
    this.sv(this.cv, "display", m ? "none" : "block");

    // Below the flight breakpoint the whole stage collapses and the fallback
    // list carries the page — the section keeps no runway at all.
    const stage = this.el.stage;
    this.sv(stage, "display", m ? "none" : "block");
    this.opt.root.style.height = m ? "0px" : `${this.n * VH_PER_STATION + VH_TAIL}vh`;

    // Coarse pointers get 44px rail targets (the gap shrinks, padding grows).
    for (const r of this.rails) {
      if (r) this.sv(r, "padding", this.fine ? "9px 0 9px 16px" : "21px 0 21px 16px");
    }

    // --- the only forced-layout reads in the whole engine ---
    const rect = this.opt.root.getBoundingClientRect();
    this.sectionTop = rect.top + this.scroll();
    this.range = Math.max(1, this.opt.root.offsetHeight - this.vh);
    const rail = this.opt.root.querySelector<HTMLElement>("[data-flight-railgroup]");
    this.railGutter =
      rail && !m ? Math.max(EDGE_PAD, this.vw - rail.getBoundingClientRect().left + 16) : EDGE_PAD;
    // The /work filter row floats below the header; cards must clear it. Measured
    // rather than hard-coded so the two can never drift apart — on a landscape
    // phone the row and a card were colliding at the hard-coded 88px.
    const filters = this.opt.root.querySelector<HTMLElement>("[data-flight-filters]");
    this.topInset = filters
      ? Math.max(NAV_BOTTOM, filters.getBoundingClientRect().bottom + 14)
      : NAV_BOTTOM;
  }

  /** One batched measure pass for every card — no per-frame offsetWidth. */
  private measure() {
    this.cardDims = this.cards.map((el) =>
      el ? { w: el.offsetWidth || 390, h: el.offsetHeight || 220 } : { w: 390, h: 220 },
    );
    const rect = this.opt.root.getBoundingClientRect();
    this.sectionTop = rect.top + this.scroll();
    this.range = Math.max(1, this.opt.root.offsetHeight - this.vh);
  }

  private demote() {
    if (this.tier >= TIERS.length - 1) return;
    this.tier++;
    const T = TIERS[this.tier];
    this.dustN = Math.min(MAX_DUST, T.dust);
    this.partsN = Math.min(MAX_PARTS, T.parts);
    if (!T.glass) {
      // Nine permanently-promoted backdrop-filter layers is the single most
      // expensive thing on the page; the bottom tier drops them entirely.
      for (const el of this.cards) el?.setAttribute("data-noglass", "1");
    }
    this.size();
    this.dtAvg = 16;
  }

  // ═══ the frame ════════════════════════════════════════════════════════════

  private loop = (t: number) => {
    if (this.dead) {
      this.raf = 0;
      return;
    }
    let park = false;
    try {
      park = this.frame(t) === false;
    } catch (err) {
      if (!this.warned) {
        this.warned = true;
        console.warn("[flight] frame skipped", err);
      }
    }
    // INVARIANT 1: exactly one rAF per frame, and none at all once parked.
    if (park || this.dead) {
      this.raf = 0;
      return;
    }
    this.raf = requestAnimationFrame(this.loop);
  };

  private frame(t: number): boolean | void {
    const dtMs = Math.min(64, t - this.lastT);
    this.lastT = t;
    const dt = dtMs / 1000;
    const cx = this.cx;
    if (!this.ready || !cx || !this.beacons.length) return;
    this.frameCount++;

    this.dtAvg += (dtMs - this.dtAvg) * 0.05;
    if (this.dtAvg > DEMOTE_MS && t > DEMOTE_GRACE_MS) this.demote();
    const dbg = this.opt.getDebugEl?.();
    if (dbg) {
      this.st(
        dbg,
        `${(1000 / this.dtAvg).toFixed(0)} fps · ${this.dtAvg.toFixed(1)}ms · tier ${this.tier} · dust ${this.dustN} · swarm ${this.partsN}`,
      );
    }

    const sy = this.scroll();
    const n = this.n;
    const scrolled = Math.abs(sy - this.lastScroll) > 0.01;
    this.lastScroll = sy;
    if (scrolled) this.idleAt = t;

    const fp = clamp((sy - this.sectionTop) / this.range, 0, 1);
    const targetU = warp(fp, n, this.dwell);

    // Intro headline cross-fade — lives entirely inside the LEAD window.
    const introO = clamp((LEAD - fp) / LEAD, 0, 1);
    if (this.el.intro && !this.mobile) {
      this.sv(this.el.intro, "opacity", introO.toFixed(3));
      this.sv(this.el.intro, "visibility", introO <= 0 ? "hidden" : "visible");
      this.sv(this.el.intro, "pointerEvents", introO > 0.5 ? "auto" : "none");
    }
    const cardGate = 1 - introO;

    if (!this.booted) {
      this.booted = true;
      this.killBoot();
    }

    // ---- park conditions: stop scheduling entirely ----
    if (this.mobile) return false; // below the breakpoint the list carries the page
    if (!this.onScreen) return false; // canvas out of view

    const past = fp >= 1 && sy > this.sectionTop + this.range + this.vh * 0.35;
    if (past) {
      if (!this.parked) {
        this.parked = true;
        this.sv(this.cv, "visibility", "hidden");
        for (const el of this.cards) {
          this.sv(el, "visibility", "hidden");
          this.sv(el, "opacity", "0");
          this.sv(el, "willChange", "auto");
        }
      }
      return false;
    }
    if (this.parked) {
      this.parked = false;
      this.sv(this.cv, "visibility", "visible");
    }

    // ---- reduced motion: no idle repaint at all, only on real input ----
    if (this.rm && !scrolled && !this.dirty) return false;

    const waveRunning = t - this.filterAt < ((n + 2) / FILTER_WAVE_SPEED) * 1000;
    const converged =
      Math.abs(targetU - this.camU) < 4e-4 && Math.abs(this.velU) < 4e-4 && this.burst < 0.01;
    // ---- settled: camera converged and the user idle -> freeze the frame ----
    if (!this.rm && !scrolled && !this.dirty && converged && !waveRunning && t - this.idleAt > 6000) {
      return false;
    }
    this.dirty = false;

    // ---- camera ----
    const prevU = this.camU;
    this.camU = this.rm ? targetU : damp(this.camU, targetU, this.glide, dt);
    const u = this.camU;
    this.velU = dt > 0 ? damp(this.velU, (u - prevU) / dt, 9, dt) : 0;
    const T = TIERS[this.tier];

    if (!this.rm) this.burst = damp(this.burst, 0, 2.4, dt);
    const speed = this.rm ? 0 : Math.min(1, Math.abs(this.velU) * 0.55 + this.burst * 0.85);

    // Cursor parallax for mice; a slow autonomous drift keeps touch alive.
    if (this.rm) {
      this.look.x = 0;
      this.look.y = 0;
    } else if (this.fine) {
      this.look.x = damp(this.look.x, (this.mouse.x - 0.5) * 90, 3.2, dt);
      this.look.y = damp(this.look.y, (this.mouse.y - 0.5) * -60, 3.2, dt);
    } else {
      this.look.x = Math.sin(t * 0.00022) * 46;
      this.look.y = Math.cos(t * 0.00017) * 26;
    }
    const bob = this.rm ? 0 : Math.sin(t * 0.0006) * 14 * (1 - speed);

    const W = this.cv.width;
    const H = this.cv.height;
    const d = this.dpr;
    const cam = updateCamera(this.cam, u, this.look.x, this.look.y, bob, W, H, speed);
    const S = this.S;

    // Nebula parallax: a CSS layer behind the canvas, moved on the compositor.
    if (this.el.nebula) {
      this.sv(
        this.el.nebula,
        "transform",
        `translate3d(${(-this.look.x * 0.18).toFixed(1)}px,${(-this.look.y * 0.18 - (u % 2) * 6).toFixed(1)}px,0) scale(1.08)`,
      );
    }

    cx.clearRect(0, 0, W, H);

    // ══ star dust — bucketed by alpha, so fillStyle is set 6x, not 280x ══
    const span = n * PATH_STRIDE + 1200;
    const streak = T.fx ? speed * 90 : 0;
    const drift = this.rm ? 0 : t * 0.006;
    const buf = this.dustBuf;
    for (let k = 0; k < 6; k++) buf[k].n = 0;
    const dust = this.dust;
    for (let i = 0; i < this.dustN; i++) {
      const dx = dust[i * 3];
      const dy = dust[i * 3 + 1];
      const z = ((((dust[i * 3 + 2] * span + drift) % span) + span) % span) - 400;
      if (!project(cam, dx, dy, z, S)) continue;
      const px = S.x;
      const py = S.y;
      if (px < -40 || px > W + 40 || py < -40 || py > H + 40) continue; // frustum cull
      const alpha = Math.min(0.5, 90 / S.z);
      const bi = Math.min(5, (alpha * 12) | 0);
      const b = buf[bi];
      if (streak > 4) {
        if (!project(cam, dx, dy, z - streak * 6, S)) continue;
        b.a[b.n++] = px; b.a[b.n++] = py; b.a[b.n++] = S.x; b.a[b.n++] = S.y;
      } else {
        b.a[b.n++] = px; b.a[b.n++] = py; b.a[b.n++] = NaN; b.a[b.n++] = 0;
      }
    }
    cx.lineWidth = 1.2 * d;
    const dsz = 1.3 * d;
    for (let k = 0; k < 6; k++) {
      const b = buf[k];
      if (!b.n) continue;
      if (streak > 4) {
        cx.strokeStyle = this.dustFill[k];
        cx.beginPath();
        for (let i = 0; i < b.n; i += 4) {
          cx.moveTo(b.a[i], b.a[i + 1]);
          cx.lineTo(b.a[i + 2], b.a[i + 3]);
        }
        cx.stroke();
      } else {
        cx.fillStyle = this.dustFill[k];
        for (let i = 0; i < b.n; i += 4) cx.fillRect(b.a[i], b.a[i + 1], dsz, dsz);
      }
    }

    // ══ the path ribbon, from the precomputed sample buffer ══
    const rb = this.ribbon;
    cx.beginPath();
    let onPath = false;
    for (let i = 0; i < rb.length; i += 3) {
      if (!project(cam, rb[i], rb[i + 1], rb[i + 2], S)) {
        onPath = false;
        continue;
      }
      if (!onPath) {
        cx.moveTo(S.x, S.y);
        onPath = true;
      } else {
        cx.lineTo(S.x, S.y);
      }
    }
    cx.strokeStyle = rgba(VIOLET, Number((0.32 + speed * 0.3).toFixed(3)));
    cx.lineWidth = 1.2 * d;
    cx.stroke();

    // ══ constellation bridges between related stations ══
    if (this.bridges.length) {
      cx.lineWidth = 1 * d;
      for (const br of this.bridges) {
        const near = Math.max(envelope(u, br.a), envelope(u, br.b));
        if (near <= 0.02) continue;
        const dimA = this.beacons[br.a].dim;
        const dimB = this.beacons[br.b].dim;
        const alpha = near * 0.3 * Math.min(dimA, dimB);
        if (alpha < 0.01) continue;
        cx.beginPath();
        let on = false;
        const pts = br.pts;
        for (let i = 0; i < pts.length; i += 3) {
          if (!project(cam, pts[i], pts[i + 1], pts[i + 2], S)) {
            on = false;
            continue;
          }
          if (!on) {
            cx.moveTo(S.x, S.y);
            on = true;
          } else {
            cx.lineTo(S.x, S.y);
          }
        }
        cx.strokeStyle = rgba(CYAN, Number(alpha.toFixed(3)));
        cx.stroke();
      }
    }

    // ══ beacons + hologram cards ══
    let nearest = -1;
    let nearestEnv = 0;
    let nqx = 0;
    let nqy = 0;
    cx.font = `600 ${10 * d}px var(--font-jetbrains), ui-monospace, monospace`;
    const dims = this.cardDims;
    const wave = ((t - this.filterAt) / 1000) * FILTER_WAVE_SPEED;

    for (let i = 0; i < n; i++) {
      const b = this.beacons[i];
      const item = b.item;

      // Staggered filter dim: the wave radiates out from where the camera stood
      // when the filter changed, so the scene re-sorts itself rather than
      // cross-fading as one flat block.
      const matches = this.filter === "All" || item.category === this.filter;
      const rawDim = matches ? 1 : FILTER_DIM;
      const reached = Math.abs(i - this.filterOrigin) <= wave;
      const dimTarget = reached ? rawDim : b.dimFrom;
      b.dim = this.rm ? dimTarget : damp(b.dim, dimTarget, 9, dt);
      const dim = b.dim;

      const du = u - i;
      const adu = Math.abs(du);
      const env = Math.max(0, 1 - adu);
      if (env > nearestEnv) {
        nearestEnv = env;
        nearest = i;
      }

      const depth = project(cam, b.x, b.y, b.z, S);
      let qx = 0;
      let qy = 0;
      if (depth) {
        qx = S.x;
        qy = S.y;
        if (nearest === i) {
          nqx = qx;
          nqy = qy;
        }
        const onScreen = qx > -260 && qx < W + 260 && qy > -260 && qy < H + 260;

        // Swarm culling: skip the whole point cloud when off-screen, far behind,
        // or so distant its points are sub-pixel. Visually identical, ~90% fewer ops.
        if (onScreen && !this.rm && adu < 2.6 && depth < 3400 && dim > 0.2) {
          // Filtered-out stations scatter instead of condensing — a dimmed swarm
          // that also loosens reads as "excluded", not just "darker".
          const scatter = 1 + (1 - dim) * 2.2;
          const condense = (0.3 + 0.7 * (1 - env)) * scatter;
          const parts = b.parts;
          const cnt = this.partsN;
          cx.fillStyle = `rgba(${b.rgb},${((0.12 + env * 0.55) * dim).toFixed(3)})`;
          for (let k = 0; k < cnt; k++) {
            const o = k * 4;
            const wob = Math.sin(t * 0.0013 + parts[o + 3]) * 7;
            if (
              !project(
                cam,
                b.x + (parts[o] + wob) * condense,
                b.y + parts[o + 1] * condense,
                b.z + parts[o + 2] * condense,
                S,
              )
            ) {
              continue;
            }
            const sz = Math.min(3.4, 40 / Math.sqrt(S.z)) * d;
            cx.fillRect(S.x, S.y, sz, sz);
          }
        }

        if (onScreen) {
          const core = (2.5 + env * 6) * d;

          // Volumetric bloom: a cached sprite blitted additively. This is what
          // makes a beacon read as a LIGHT rather than a filled circle — and it
          // costs one drawImage, not a per-frame gradient.
          if (b.bloom && dim > 0.05) {
            const br = (16 + env * 58) * d * (1 + speed * 0.35);
            cx.globalCompositeOperation = "lighter";
            cx.globalAlpha = Math.min(1, (0.2 + env * 0.62) * dim);
            cx.drawImage(b.bloom, qx - br, qy - br, br * 2, br * 2);
            cx.globalAlpha = 1;
            cx.globalCompositeOperation = "source-over";
          }

          // Chromatic split on fast motion.
          if (T.fx && speed > 0.25) {
            const off = speed * 5 * d;
            cx.fillStyle = rgba(CYAN, Number((0.3 * dim).toFixed(3)));
            cx.beginPath(); cx.arc(qx - off, qy, core, 0, 7); cx.fill();
            cx.fillStyle = rgba(VIOLET, Number((0.3 * dim).toFixed(3)));
            cx.beginPath(); cx.arc(qx + off, qy, core, 0, 7); cx.fill();
          }
          cx.fillStyle = `rgba(${b.rgb},${((0.5 + env * 0.5) * dim).toFixed(3)})`;
          cx.beginPath(); cx.arc(qx, qy, core, 0, 7); cx.fill();

          // Lock-on approach ring.
          if (env > 0.55) {
            const fr = (env - 0.55) / 0.45;
            cx.strokeStyle = rgba(CYAN, Number(((1 - fr) * 0.7 * dim).toFixed(3)));
            cx.lineWidth = 1.6 * d;
            cx.beginPath(); cx.arc(qx, qy, (12 + fr * 70) * d, 0, 7); cx.stroke();
          }

          // Arrival shockwave — one-shot, ~700ms, fired on ignition.
          if (b.flareAt) {
            const age = (t - b.flareAt) / 700;
            if (age >= 1) {
              b.flareAt = 0;
            } else {
              const ease = 1 - (1 - age) * (1 - age);
              cx.strokeStyle = rgba(CYAN, Number(((1 - age) * 0.6 * dim).toFixed(3)));
              cx.lineWidth = (2.4 - age * 1.8) * d;
              cx.beginPath(); cx.arc(qx, qy, (10 + ease * 150) * d, 0, 7); cx.stroke();
            }
          }

          cx.fillStyle = rgba(INK, Number(((0.25 + env * 0.5) * dim).toFixed(3)));
          cx.fillText(item.num, qx - 26 * d * b.side, qy - 14 * d);
        }
      }

      // ---- the hologram card ----
      const el = this.cards[i];
      if (!el) continue;
      const visible = env > 0.08 && depth > 0 && cardGate > 0.05;
      if (!visible) {
        this.sv(el, "opacity", "0");
        this.sv(el, "visibility", "hidden");
        // will-change is released the moment a card leaves — nine permanently
        // promoted backdrop-filter layers would cost more than the animation.
        this.sv(el, "willChange", "auto");
        if (env < 0.14) b.ignited = false;
        continue;
      }
      const e = smoothstep(env);
      const dm = dims[i] ?? { w: 390, h: 220 };
      // Fit-to-band: a deep card is ~430px tall, which does not fit between the
      // nav and the HUD on a landscape phone (690x420 -> a 274px band). Capping
      // the scale so the card can never exceed the usable band is what makes
      // short viewports genuinely good rather than merely clamped-and-clipped.
      const maxSc = Math.min(
        (this.vh - this.topInset - HUD_BAND) / dm.h,
        (this.vw - this.railGutter - EDGE_PAD * 2) / dm.w,
      );
      const sc = Math.min(0.5 + e * 0.55, maxSc);
      const hw = (dm.w * sc) / 2;
      const hh = (dm.h * sc) / 2;
      const off = b.side * Math.min(this.vw * 0.2, 290) * (0.55 + 0.45 * e);
      const tiltY = clamp(du * -46, -38, 38) * (1 - e * 0.8);
      const lift = 60 * (1 - e);
      const cxp = clampBand(qx / d + off, hw + EDGE_PAD, this.vw - hw - this.railGutter);
      const cyp = clampBand(qy / d + lift, this.topInset + hh, this.vh - hh - HUD_BAND);

      this.sv(el, "visibility", "visible");
      this.sv(el, "willChange", "transform,opacity");
      this.sv(el, "opacity", (Math.min(1, env * 2.2) * dim * cardGate).toFixed(3));
      // Blur quantised to 0.5px steps: same softening, a fraction of the re-rasters.
      const bl = T.fx ? Math.round((1 - e) * 3.2 * 2) / 2 : 0;
      this.sv(el, "filter", bl < 0.25 ? "none" : `blur(${bl}px)`);
      this.sv(
        el,
        "transform",
        `translate3d(${cxp.toFixed(1)}px,${cyp.toFixed(1)}px,0) translate(-50%,-50%) perspective(900px) rotateY(${tiltY.toFixed(2)}deg) rotateX(${(8 * (1 - e)).toFixed(2)}deg) scale(${sc.toFixed(3)}) rotate(${(cam.roll * -8).toFixed(2)}deg)`,
      );

      // ---- tether: dashed line beacon -> card, with a travelling pulse ----
      if (depth && e > 0.25) {
        const tx = cxp * d - b.side * 6 * d;
        const ty = cyp * d;
        const alpha = 0.45 * e * dim;
        cx.strokeStyle = `rgba(${b.rgb},${alpha.toFixed(3)})`;
        cx.lineWidth = 1 * d;
        if (!this.dash.length) this.dash = [4 * d, 5 * d];
        cx.setLineDash(this.dash);
        cx.lineDashOffset = -t * 0.03;
        cx.beginPath(); cx.moveTo(qx, qy); cx.lineTo(tx, ty); cx.stroke();
        cx.setLineDash(this.nodash);
        // Anchor dot at the card end.
        cx.fillStyle = `rgba(${b.rgb},${(0.8 * e * dim).toFixed(3)})`;
        cx.beginPath(); cx.arc(tx, ty, 2.4 * d, 0, 7); cx.fill();
        // A packet running the tether — the data actually moving to the card.
        if (!this.rm) {
          const pt = ((t * 0.0007 + i * 0.37) % 1 + 1) % 1;
          cx.fillStyle = rgba(CYAN, Number((0.9 * e * dim).toFixed(3)));
          cx.beginPath();
          cx.arc(qx + (tx - qx) * pt, qy + (ty - qy) * pt, 1.9 * d, 0, 7);
          cx.fill();
        }
      }

      // ---- materialise choreography, once per approach ----
      if (!b.ignited && env > 0.3 && !this.rm) {
        b.ignited = true;
        b.flareAt = t;
        this.ignite(el);
      }
    }

    // ══ lock-on reticle on the nearest station ══
    if (nearestEnv > 0.5) {
      const r = (26 + (1 - nearestEnv) * 40) * d;
      const alpha = (nearestEnv - 0.5) * 2;
      const L = 9 * d;
      cx.strokeStyle = rgba(CYAN, Number((alpha * 0.85).toFixed(3)));
      cx.lineWidth = 1.4 * d;
      const spin = this.rm ? 0 : t * 0.0004;
      cx.beginPath();
      for (let k = 0; k < 4; k++) {
        const ang = spin + (k * Math.PI) / 2;
        const ca = Math.cos(ang);
        const sa = Math.sin(ang);
        const bx = nqx + ca * r;
        const by = nqy + sa * r;
        cx.moveTo(bx - sa * L, by + ca * L);
        cx.lineTo(bx, by);
        cx.lineTo(bx + sa * L, by - ca * L);
      }
      cx.stroke();
    }

    if (this.vig) {
      cx.fillStyle = this.vig;
      cx.fillRect(0, 0, W, H);
    }

    // ══ HUD + rail — diffed writes, transform-driven bars (never `width`) ══
    const idx = clamp(Math.round(u) + 1, 1, n);
    this.st(this.el.count, `${String(idx).padStart(2, "0")} / ${String(n).padStart(2, "0")}`);
    this.sv(this.el.bar, "transform", `scaleX(${fp.toFixed(4)})`);
    this.st(
      this.el.label,
      nearest >= 0 && nearestEnv > 0.4 ? this.beacons[nearest].item.title.toUpperCase() : "",
    );

    for (let i = 0; i < this.rails.length; i++) {
      const dot = this.rails[i];
      if (!dot) continue;
      const active = i === nearest && nearestEnv > 0.35;
      const near = Math.abs(u - i) < 1.6;
      this.sv(dot, "color", active ? "var(--accent-cyan)" : near ? "var(--ink-dim)" : "var(--muted)");
      const num = dot.firstElementChild as HTMLElement | null;
      const tick = dot.lastElementChild as HTMLElement | null;
      this.sv(num, "opacity", active ? "1" : "0");
      // scaleX, never width — the rail must stay on the compositor.
      this.sv(tick, "transform", `scaleX(${active ? 1 : near ? 0.65 : 0.4})`);
      if (active) this.sv(dot, "opacity", this.beacons[i].dim.toFixed(2));
      else this.sv(dot, "opacity", Math.max(0.35, this.beacons[i].dim).toFixed(2));
    }

    // Settled-station callback (deep links). Fires on CHANGE only, never per frame.
    if (nearestEnv > 0.6 && nearest !== this.settled) {
      this.settled = nearest;
      this.opt.onStation?.(nearest, this.beacons[nearest].item);
    }
  }

  /**
   * The card materialise: clip-wipe up, a glow flash at the peak, then the
   * children stagger in. WAAPI so it runs off the main thread, and every
   * animation is tracked so unmount can cancel it.
   */
  private ignite(host: HTMLElement) {
    const card = host.firstElementChild as HTMLElement | null;
    if (!card) return;
    this.anims.push(
      card.animate(
        [
          { clipPath: "inset(0 0 100% 0)", boxShadow: "0 0 0 rgba(103,232,249,0)" },
          {
            clipPath: "inset(0 0 0 0)",
            boxShadow: "0 0 90px rgba(103,232,249,.55)",
            offset: 0.6,
          },
          { clipPath: "inset(0 0 0 0)", boxShadow: "0 0 40px rgba(107,124,255,.2)" },
        ],
        { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" },
      ),
    );
    const kids = card.children;
    for (let k = 0; k < kids.length; k++) {
      this.anims.push(
        kids[k].animate(
          [
            { opacity: 0, transform: "translateY(14px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 500,
            delay: 120 + k * 70,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "backwards",
          },
        ),
      );
    }
    // Cap the tracked array so a long session can't grow it without bound.
    if (this.anims.length > 120) {
      for (const a of this.anims.splice(0, 60)) {
        try {
          a.cancel();
        } catch {
          /* already done */
        }
      }
    }
  }
}

type ElWithCache = HTMLElement & { __sv?: Record<string, string>; __st?: string };

/**
 * Inert stand-in installed over the engine's DOM references at teardown, so a
 * destroyed engine can never keep a detached tree alive. Created lazily and
 * shared — it is never rendered, only pointed at.
 */
const DETACHED: HTMLElement =
  typeof document !== "undefined" ? document.createElement("div") : ({} as HTMLElement);
