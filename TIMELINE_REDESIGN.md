# Timeline Redesign — First-Principles Exploration

> **Working document / session checkpoint.** Produced by a multi-agent design review
> (4 critique lenses + 8 independent concept teams + adversarial scoring).
> Sections are appended incrementally so progress survives session limits.
> **No implementation has been started** — per the brief, code waits for explicit
> approval of a direction.
>
> Status: Part 1 ✅ · Part 2 (8 concepts) ✅ · Part 3 (ranking) ✅ · Part 4 (recommendation) ✅

---

## Part 1 — Critique: why "Constellation Spine / Living Fiber" fails the vision

### Verdict in one line

**A beautifully governed generic**: the engineering chassis is genuinely excellent, but the
path — the thing that must be the hero — was never *designed*. It is a layout container
that got decorated with expensive light.

### The five structural failures

Every complaint in the brief traces to code, and most are **architecture-level**, not
styling-level. This is why iteration was the wrong move and a redesign is right.

**1. The silhouette is a metronome, not a designed object.**
`geometry.ts:29-34` — waypoints are `x = 50 + 32·cos(iπ)`, `y = 28 + i·34`. Fixed
amplitude, fixed 34-unit pitch, same K=0.5 handles on every bend. Verified numerically:
all six segments of the 7-milestone path have **identical arc length (76.17 units)**, so
`nodeFrac` is literally `i/(n-1)` — card reveals fire at perfectly even scroll intervals.
This is the default alternating-timeline template of the whole internet, rendered with
2,400 particles. Remove the cards and what remains is a uniform S-curve with seeded
random twigs — a handsome screensaver, not artwork.

**2. Milestone weight is unrepresentable — at the type-signature level.**
Every poster node is the same r=2.6 ring; every WebGL glint is `size.push(86)` flat;
every node shares one ignition envelope; every card gets the identical ±16px entrance.
The engine's only narrative input is `count`. `RenderCard` receives `(i, side, isActive)`
— there is **no weight/importance/chapter channel anywhere in the pipeline**. The 2024
award, the 17h→80min war story, and "first Python scripts" are choreographically
interchangeable. Drama isn't missing; it has no slot to exist in.

**3. The orb scrubs; it cannot travel.**
Position is `clAt(uProgress − i·0.006)` — a lookup, not motion. The only "physics" is a
lag filter (`eased += (target−eased)·(1−e^{−6δ})`): no velocity state, no banking (a round
point sprite has no orientation), no acceleration into bends (there are no differentiated
bends to accelerate into). The 14-point comet tail is fixed arc offsets — it never
stretches with speed, and on upward scroll it sits **ahead** of the orb, physically
backwards. The orb pops in at `p=0.001` and hard-vanishes at `p=0.999` via `step()`:
no birth, no finale. Ignition blooms are symmetric Gaussians in *scroll space* — they
half-fire before arrival, freeze at maximum if you stop on a node, and replay in reverse
when you scroll up. "One-time energy bloom" requires latched state + a time-domain
envelope; stateless shaders make that impossible by construction.

**4. Anticipation is pre-spent.**
The unlit road ahead already glows at ~50% brightness (`mix(0.5, 1.05, lit)`) and all
2,400 particles stream the *entire* path from frame 0 on `fract()` loops (banned looping
motion; unlit-future particles still glow at 0.4). The lit region trails *behind* the
traveler — the exact inverse of "illuminate the ribbon ahead." There is no darkness left
to conquer, so arriving anywhere reveals nothing. The poster's infinite dash-march
(`geo-flow_5s_linear_infinite`) is literally a perpetual dotted trail — the banned thing.

**5. Cards are not attached to the path — and in flagship mode the connection doesn't exist.**
Connector stems exist ONLY in the static SVG poster, which fades to `opacity-0` the moment
the WebGL canvas goes live. The canvas renders **no stem geometry at all**. On every
capable desktop — the best-case experience — cards float in two fixed lanes and slide in
from *offstage* (fromX = away from the path), materializing before the orb even arrives
(cards run on the raw scrub clock, the orb on the extra-lagged eased clock — effect
precedes cause). "Cards on a star background" is not a feeling; it is what the code computes.

### Compounding failures

- **Metaphor drift / no thesis.** The site's through-line is *optimization / gradient
  descent* (hero loss-landscape shader, TrainingRun, "the high-loss start of the curve"
  in the actual copy) — but this piece speaks "synapse / dendrite / neural highway /
  constellation," three metaphors at once, none of them the site's. Color is mapped
  `colT(t)=t` — the iridescent duotone is just a progress bar, encoding nothing. An
  Awwwards jury rewards a concept you can state in one sentence; this piece doesn't have one.
- **The same silhouette renders twice** (/about and /work at different lengths), so even a
  visitor who remembered the shape would remember the *engine*, not the *story*.
- **The knowledge graph is illegible glitter.** `StarPlot` carries labels no renderer ever
  draws; bridges render at opacity 0.22 / width 0.4. The graph's story ("Python threads
  through my whole career") exists in the data model and dies before reaching the retina.
- **Mobile + reduced-motion visitors get the anti-goal verbatim**: a plain stacked list.
  The journey doesn't degrade — it disappears. Narrative fallbacks don't need animation
  (sequencing, scale, era-markers survive `prefers-reduced-motion`), but this fallback
  abandons narrative rather than translating it.
- **No temporal axis anywhere.** y is index-based: the 3-year BotPro chapter and a
  single-year beat occupy identical track. The HUD counts "04/07" — a quantity, not a
  location. A journey needs "where am I / how far to go"; this answers neither in story terms.

### Concrete bugs found during review (worth fixing regardless of direction)

1. **/work filter is broken on the flagship path**: `dimmed` is applied only to poster SVG
   layers; `LivingFiber` never receives it. Since the poster is `opacity-0` whenever WebGL
   is live, on capable desktops the category filter dims the cards but the path/nodes/stars
   stay fully lit (`WorkGeoline.tsx:74` → `SerpentineTimeline.tsx:325-339`).
2. **Hard-gate violation**: `Geoline.tsx:65` puts `backdrop-filter: blur(10px)` glass cards
   directly over the WebGL canvas (dendrites reach x≈97, under the card lanes); the HUD adds
   `backdrop-blur-sm` over the stage. DESIGN.md forbids backdrop-blur over WebGL.
3. **Ease-inside-scrub violation**: card entrances use `expo.out` inside a scrubbed timeline
   (DESIGN.md's own rule: scrubbed tweens use `ease:none`) — cards pop within the first
   pixels of their window and flicker on jittery scrolls.
4. **Tail direction inverts on upward scroll** (offsets always subtracted).
5. **Orb step-function pop-in/pop-out** at p=0.001 / 0.999.

### What must survive any redesign (the chassis is genuinely rare engineering)

- **The one-clock model**: ONE scrubbed ScrollTrigger writing a shared `progressRef` the
  canvas reads per-frame. Any redesign adds a *retiming/velocity layer on top of* this
  clock, never a second trigger.
- **The arc-length machinery** (`sampleCenterline` → arc-length table → even resample →
  monotonic `nodeFrac`, `pointAtFrac` + normals): it is **curve-agnostic**. Only
  `waypoints()` is the metronome — a hand-authored dramatic path drops into this exact
  contract and the entire ignition/reveal clock keeps working.
- **The GPU idiom**: centerline baked into a float DataTexture, manual-lerp sampling in
  vertex shaders, per-frame CPU = two uniform writes to five materials. 2,400 particles
  cost ~nothing; a far more ambitious object rides this for free.
- **The governance rig**: DPR cap, FPS-guard hysteresis shedding particles via
  `setDrawRange`, sticky mount (context-loss fix), 600px pre-arm + chunk warm-up, the
  poster-until-live `onLive` handshake. Production-grade; most award sites never build this.
- **The accessibility skeleton**: real `<ol>` of real content, deterministic SSR-stable
  geometry (CLS=0), static lit poster fallback, dim-without-reflow filtering.
- **`buildRibbon`'s per-vertex attribute channels** (`u/side/lit/tip/colT`) — the plumbing
  where per-milestone width/weight/color modulation *should* be injected; the generator is
  more capable than the uniform values currently fed into it.

### Root cause (all four lenses converged)

> The entire pipeline is parameterized by a single anonymous scalar at each end —
> `count` in, `uProgress` through. **Narrative has no representation anywhere in the data
> flow.** The path is derived FROM the card layout (constant pitch chosen so alternating
> cards never collide) rather than cards being placed ON a designed path; every visual is
> a stateless pure function of one scroll scalar, so velocity, one-time events, dwell,
> and weight are unrepresentable. It is a layout engine that emits decoration, when the
> brief requires an artwork that carries annotations. You cannot light your way out of a
> silhouette that was never designed.

---

## Part 2 — Eight concepts

All eight satisfy the hard gates (CLS=0, one ScrollTrigger, governed transparent canvas,
poster/`<ol>` fallbacks) and reuse the surviving chassis. Complexity: 1 = evolution,
5 = major rebuild.

---

### Concept 1 — THE DESCENT (Expedition Map of a Gradient) · complexity 4

> *Seven minima, one route: the hero flies over the loss landscape; the timeline is the
> expedition map of the descent through it.*

**Metaphor.** The career is one gradient-descent run, and the timeline is the plan-view
**topographic map of the same loss landscape the hero shader flies into** — the site
becomes one world seen from two camera angles. Milestones are depression basins (local
minima): nested wobbly contour rings, hachures, crowded contours where the slope was steep
(big career jumps), wide-spaced lines on calm traverses. Ahead of the probe the route is a
faint *dashed planned line* (expedition-map convention); behind it, a solid burning traced
path. Scroll turns the plan into the lived path. A monospace LOSS readout falls stepwise
at each convergence; the finale is the iconic image — a 270° spiral into the global minimum.

**Silhouette.** A dark cartographic sheet: hairline graphite index contours bowing around
seven ring-fields of deliberately different sizes (2 rings for minor beats, up to 6 nested
loops + hachures for majors), stitched by ONE confident route — wide switchbacks, a rim
pause, a near-vertical plunge where contours crowd, a hairpin, a long anticipatory lip, a
second plunge, the spiral. Printed in one gray it still reads as "a topo map with a descent
route." Natively 2D — the orthographic camera is its habitat, not a limitation.

**Motion.** The probe's position is a warped function s = W(p): decelerates to a near-stop
on rim lips (anticipation), eases-in down plunges — crossing more canvas per scroll unit
because the geometry is actually steeper. Tail spacing scales with velocity; a curvature·v²
term banks it wide through the hairpin. Headlight lobe lights the next ~4% of route.
Arrival: rings ignite outward-first, one shock pulse, haze well warms, LOSS snaps down,
then settles into persistent altitude-lit relief.

**Rhythm (7 beats).** Faint 2-ring dimple (2018) → longest calm switchbacks (B.Tech) →
rim-pause + first plunge into a deep 4-ring hachured basin (BotPro, 17h→80min) → tight
hairpin into a side basin (first agents — the banking showcase) → smallest dimple with a
starred *checkpoint* flag (award) → longest lip, steepest plunge, 5-ring basin (VRSEN) →
widest ring field + spiral to center (independent: convergence). "Converged — still
descending" hands off to the CTA.

**Cards** = survey callouts: elbow leader lines (45°-then-horizontal) that draw outward as
the basin ignites; cards clip-wipe in from the leader's arrival edge. Finale card gets a
center lane under the spiral.

**/work.** Basin depth from `featured` weight; route exits the bottom edge as a dashed
continuation ("the map continues"). Tech tags become **survey stations** (triangulation
glyphs) with dashed sight-lines as bridges. Filter = non-matching basins drop to graphite.

**Perf.** *Cheaper than today*: dendrites deleted, particles 2400→~1200 lit-region
droplets, one haze quad (≤16 gaussians + fbm), six draw calls.

**Key risks.** Bullseye/clipart risk on rings (needs a dedicated tuning pass); glow
discipline — pre-ignition terrain must hold at graphite or it collapses into soup; scroll
warp can feel laggy past ~20% deviation; spiral breaks monotonic-y + two-lane system;
page grows ~15-25% taller.

```
      .x'. init scatter                          LOSS 2.31
-------\--------------- index contour --------------------
        \    .-.
         `-(( o ))   '18 first scripts (2 faint rings)
    ___,---`-'---.__________ contour ____________
   /   B.Tech: wide calm switchbacks             \
   \_____________________.                       /
==========================\==== lines crowd ====
    BotPro ((( ( o ) )))<-'   deep 4-ring basin
                 |  hairpin
              (( o ))  '23 agents in prod
   ____________/__________   award: (o)* checkpoint
      lip . . . pause . . .
============ PLUNGE =============
   VRSEN (((( ( o ) ))))__
                          `~._ spiral -> ((((@)))) LOSS 0.03
```

---

### Concept 2 — BRAIDED LIGHT · complexity 4

> *Three threads of a career — engineering, intelligence, leadership — braid, knot, and
> fuse into one luminous cable. Mastery is integration, and the shape says so before you
> read a word.*

**Metaphor.** Three strands, each carrying ONE stop of the site's duotone: ENGINEERING
(indigo, born 2018), INTELLIGENCE (cyan, born at B.Tech), PEOPLE/LEADERSHIP (violet, born
at BotPro). Strands are born by forking off an existing strand, fuse at milestones into
bright junction knots, and by the finale wind into a single thick cable — where the three
additive cores *physically sum to the white-hot full-duotone light*. The gradient stops
being decoration and becomes the physics of the piece. (Parallel descent paths converging
— still the optimization metaphor, not neurons.)

**Silhouette.** Topology IS the story, readable with zero cards: one thin thread → FORK →
long calm two-strand reach → second FORK → first tight three-strand KNOT → two-strand
PINCH with the third swinging wide → the neatest plait on the page → winding rope → ONE
thick cable off the bottom edge. 1 → 3 → 1. Forks and knots are *shape events*, not
styling. Crossings use braid gap-under notches + depth-based width/brightness modulation.

**Motion.** The traveler is a SIGNAL: a pulse front whose pace table slows ~0.85× into
junctions and whips ~1.6× through knots; tail widens toward the outside of bends
(curvature-baked banking); in loose sections the tail visibly **splits into three thin
tails, one per strand, and merges entering knots** — the traveler's body narrates fusion.
Headlight term lights the strand ahead. Fork beats fill the newborn strand with light
outward from the fork.

**Rhythm (7 beats).** Hesitant single thread (2018) → first fork + LONGEST calm reach
(B.Tech — four years of parallel learning felt as scroll distance) → violet forks mid-reach
then hard swing into the first 3-strand KNOT (BotPro) → tight two-strand PINCH (agents) →
the CALMEST beat: a perfectly even plait + a one-time gleam pass (the perfectionist joke)
→ continuously tightening S-curve (VRSEN) → full fusion, straight confident cable pointing
at the contact CTA.

**Hierarchy.** Four independent dials: topology (fork/knot/pinch vs modulation), physical
brightness (core overlap = hotter), scroll real-estate, bloom scale.

**Cards** grow from junctions as thin strands *pulled out of the plait* (same material,
tapering, docking into the card's accent bar). Cards inherit their strand's identity —
tint AND named tag text ("Engineering thread"), never color alone.

**/work — the killer feature.** STRANDS = CATEGORIES. Filter pills dim entire strands:
select "AI Agents" and the cyan thread blazes through the whole history while others fall
to 25% (one `uDim[3]` uniform; CSS opacity on three poster groups). The filter finally has
a hero-object answer.

**Perf.** 3 strand ribbons paid for by deleting 18 dendrites (~net neutral); particles
stay 2400, confined inside filaments; poster ~8 paths.

**Key risks.** THE legibility risk: three additive lines in 1040px can mush into one fat
spline — must validate with the static poster *first* (1-day kill-switch); crossings have
no true occlusion; three hues strain the "one shifting light" rule (needs design review);
strand fold-over needs an S·curvature clamp.

```
        |                 2018  one indigo thread
        +--.              2019  FORK: cyan strand born
        |   \
        |    \             ...college: two threads,
        |     |               wide apart, calm
        +--.  |           2021  FORK: violet strand born
         \  \ |
          \  X|           2021-24 BotPro: first tight
           X=XX----[card]         3-strand KNOT
          /  | \
         |   X--.         2023  agents: 2-strand PINCH
         |  / \ |
         \ |   X'         2024  award: neat plait + gleam
          \X  /
           XXX            2024-25 winding into rope
            #             2025  ONE luminous cable  v
```

---

### Concept 3 — DICHROIC (The Glass Ribbon) · complexity 4

> *A career annealed into one strip of dichroic glass: every fold is a decision, every
> edge a flash of light.*

**Metaphor.** The hero shader shows the SEARCH; the timeline shows the PATH THE SEARCH
FOUND — the trajectory annealed into a single strip of dichroic glass. A line has no
memory; **a ribbon has a FACE, and a face records orientation.** Every career pivot is a
fold: the ribbon turns over, its hue flips (front face indigo→violet, back face
violet→cyan — the duotone becomes literal thin-film physics), and light piles up at the
crease. The traveler is a pulse of light INSIDE the glass; refraction index rises in folds,
so the pulse physically slows into them and whips out.

**Silhouette.** The only object on the site whose primary mark is a bounded translucent
SURFACE, not a stroke. Three unmistakable states: FACE-ON (a wide glass plane bounded by
two brilliant edge rails), EDGE-ON (collapses to a single searing knife-line — all the
light through zero area; energy conservation makes the thinnest moments the brightest),
and THE FOLD (rails converge, cross at a triangular crease, hue flips as the back rotates
into view). Reproducible from memory like a logotype: *hairline → widening sweep → fold →
double-twist knot → polished plateau → banked turn → unfurling fan.* No free-floating dots
anywhere — sparks live only inside the face, as impurities in glass.

**Motion.** A monotonic retime table R(p): the pulse decelerates, compresses, and
brightens entering dense (folded) glass, spikes on exit. Tail sprite spacing ∝ local speed
(stretches when fast). Banking is baked into the object — the ribbon rolls into its own
curves; the pulse inherits it by living inside. Fold arrival: decelerate → compress +
brighten → knife-edge white flash → back-face hue snap → card sliver draws → card lands →
release streak. Finale: θ→0, width→max, the pulse diffuses and floods the final face.

**Rhythm (7 beats).** Born EDGE-ON as a hairline ("one line of code") unrolling to 40%
width → longest calm sweep, face slowly opening (B.Tech, 1.6× pitch) → FOLD ONE: hard bank,
180° roll, first knife flash, first cyan back-face (BotPro) → FOLD TWO: double-twist knot
with one luminous self-crossing (agents) → the BREATH: dead-flat mirror plateau, zero roll
— perfectionism as the most flawless stretch (award) → confident wide bank + 90° edge
flash (VRSEN) → the UNFURL: widest face, runs off open-ended, still unrolling.

**Cards** grow from the outer edge rail as **glass slivers** — thin tapered shards of the
same material that peel off and reach into the card lane; sliver gauge encodes tier
(fold = 4px root, calm = 1.5px hairline).

**/work.** `beatsFor(projects)`: featured → Tier-1 folds; category changes flip the
ribbon's side (the shape encodes portfolio structure); year gaps stretch pitch; rhythm
guard caps consecutive majors. Filter: per-vertex milestone attribute samples a 1×N dim
texture — non-matching spans fade to ghost-glass, pulse passes through like unlit territory.

**Perf.** ~5 draw calls, 600 sparks vs today's 2400 particles — cheaper than current.
Also fixes the HUD backdrop-blur gate violation.

**Key risks.** THE core risk: does a fold actually read in additive 2D, or collapse into
a glowing spline? Mitigation: a 2-day single-fold shader spike is the go/no-go gate before
any engine work. Additive = no occlusion (fold-overs read as X-ray laminations — planned
fallback: roll-only folds, zero crossings). Monotonic-y forbids true hairpins. The
split-clock (cards on raw p, pulse on R(p)) is the subtlest code in the design.

```
'18 `                                    born edge-on:
     \.                                  a hairline of light
      \##\_
       \####\__.        '19-23  the long calm sweep --
        \######\__      face slowly opening (1.6x pitch)
         \########\
       ___\########|
   ==<#####KNIFE###>==   '21-24  FOLD 1: 180 flip, crease
       /_back-face_\             flash, cyan back revealed
      (#############)
      (####><#######)    '23  FOLD 2: double-twist knot
       \##/  \######/
       |###########|
       |===========|     '24  the polished plateau (flat)
        \############\_  '24-25  wide bank, edge flash
         \#############\####>  '25->  unfurling, flooded
```

---

### Concept 4 — GRADIENT FLOW (Liquid Intelligence) · complexity 4

> *A career poured as liquid light: it races through the narrows, pools at every hard-won
> minimum, and overflows into the next descent.*

**Metaphor.** Gradient *flow* — the continuous-time form of gradient descent, literally
what the hero shader depicts. The timeline is the stream light-water takes down the loss
landscape: it accelerates where the channel narrows, pools in wide basins at each local
minimum, and each basin fills until it **overflows** (the saddle escape) — spilling into
the card stem and finding the next descent. Scroll = volume poured, not distance traveled.

**Silhouette.** A frozen Plateau–Rayleigh breakup — the shape honey makes mid-pour: one
continuous body whose WIDTH varies 10-15× along its length. Hairline necks swell into
lens-shaped basins; pendant teardrops hang at necks; it ends in a fanned delta, not a dot.
**Fill it flat black on white and it still reads as beaded liquid** — the acid test is
built into the process (`channelOutline(plan)` exported and checked before any shader
work). The only concept where the path occupies real AREA.

**Motion.** ONE physical law drives everything: continuity (A·v = const). The wavefront
races through necks and lingers in basins with *zero hand-tuned easing*. The traveler is a
density wave (bore-wave kernel: sharp leading edge, long wake, edges physically bulge as it
passes); superelevation shifts the crest to the outer bank in bends. Arrival: the basin
visibly FILLS over its volume interval (structural anticipation), damped slosh, brim
ignition flash, then OVERFLOW draws the card stem and spits three one-shot droplets.

**Rhythm.** Droplet strike + hairline wobbly rill (2018) → longest laminar calm (B.Tech)
→ channel tightens into the first major basin (BotPro) → **the absolute thinnest neck then
a near-vertical chute — fastest front of the piece by pure physics — crashing into a
turbulent plunge pool** (agents) → the only perfectly circular, glass-still pool (award —
hierarchy through form, not size) → broad confident meander (VRSEN) → the DELTA: one
stream generalizing into many distributaries (independent).

**Cards** grow from overflow: brim notch → stem rivulet draws → card reveal re-keyed from
`nodeFrac` to *overflow-completion*, clip-path rising from the stem side. A "wet notch"
droplet marks where the stem lands on the card border.

**/work.** `riverPlan(count, weights)` — flagship systems get visibly bigger pools. Filter
= **draining**: non-matching basins empty to dry glass outlines while matching pools stay
full. Tech tags = condensation beads; shared tags = capillary films.

**Perf.** Equal or cheaper than today (dendrites + orb mesh deleted; SDF math confined to
7 small quads; 6 draw calls).

**Key risks.** Liquid-ness rests on three cues (continuity speed, fill+overflow, meniscus
rim) — prototype the shader pair FIRST; continuity remap can teleport the front through
the thinnest neck between scroll frames (needs ds/dp clamp); pendant beads can regress
into "dotted trail" if overused (hard cap 3); uneven pitch needs a card-collision test.

```
     o                          2018  a single drop
     |
    (_)                         first pool
      \____
           \_____
                 (===)          2019-23  the long calm reach
             ____/
       _____/
    ((#####))                   2021-24  BotPro basin  MAJOR
         \\
          ||                    the neck: hairline chute
       ((#####))                2023  production plunge  MAJOR
         /
       (o)                      2024  the still circle (award)
         \______(====)          2024-25  the meander
              \\\|///           2025  the delta -- independent
```

---

### Concept 5 — COSMIC CURRENT (The Gradient River) · complexity 4

> *Water finds the minimum. Scroll downstream through the river a career carved.*

**Metaphor.** A river is nature's gradient descent. The /about journey is a single body of
aurora-colored water: hairline creek → tributaries join → braids around obstacles → shoots
a narrows → rests in a still pool → widest meander → a delta emptying into the world.
**Milestones are not dots ON a line — they are ISLANDS IN the water**: dark voids the
current visibly splits around, negotiates, and rejoins carrying more mass.

**Silhouette.** A satellite night-photograph of a river — defined by NEGATIVE SPACE and
variable width. Two crisp luminous bank-lines (the brightest thing on screen) enclose a
dimmer textured interior of flow streaks. Islands are true dark holes punched through the
light — the page's LatentField cosmos shows through them. One-off features a designer
could sketch blind: tributary confluence, a long braid where both banks split, a
narrows-and-drop, a round pool with one perfect stone, the widest meander, a five-fingered
delta dissolving into particles.

**Motion.** One baked scalar field does all choreography: τ(s,r) = flow arrival time from
real potential-flow streamlines (closed-form doublets per island, baked once, <10ms). The
traveler is a **tidal-bore SURGE** in the fragment shader. Everything the brief demands
falls out physically for free: the crest bows downstream mid-channel (center water is
fastest), accelerates through the narrows (mass conservation), piles brightness onto the
outer bank in bends (superelevation), **splits around each island — the two halves race
the two sides, and where they rejoin the wake CLAPS**: a one-time bloom that lights the
island rim and grows the card.

**Rhythm.** Creek slipping out of the dark (2018) → two tributaries join (B.Tech) →
**the great braid: both banks split around a long island and rejoin — a squad splitting a
17-hour job into parallel channels rejoining at 80 minutes, literally drawn** (BotPro) →
hard pinch + drop, the only white-out moment (agents) → wide still pool, slowest water,
one perfect stone (award — the calm IS the drama) → widest meander (VRSEN) → the delta,
whose dissolving particles speak the same language as the contact ParticleFinale: **the
river empties into the "talk to me" sea.**

**Cards** moor to islands like river settlements: each island's downstream tip sheds a
distributary that thins into a hairline stem meeting the card's accent bar — one
continuous line of water → light → ink.

**/work.** `buildWorkPlan(weights)`: island tier from impact; exactly one Tier-S braid for
the flagship. Tags = **aquifers**: spring-pools in the dark land; a shared tag is an
underground stream surfacing at every island that uses it ("Python has flowed under
everything I've built"). Filter dims islands, not the river — the current keeps flowing;
only the stops you asked about stay lit.

**Perf.** Same budget shape; river mesh ≈ 6k triangles with island cells simply not
emitted (occlusion by absence — the honest answer to additive-can't-darken).

**Key risks.** A wide additive band can fog into a fat glowing spline — banks carry ~70%
of the brightness budget, interior alpha capped 0.25, and the pre-agreed fallback (drop
interior fill, keep banks + streaks + voids) is arguably stronger; card lanes vs meander
width needs a build-time clearance validator; overlaps Braided Light on the braid beat
(kept to exactly one braid); N=3 risks a stubby river, N=15 a very tall page.

```
   .~(            2018 · a creek slips out of the dark
    ) )
    ( (---[card]
 ~._) )      2019-23 · tributaries join, channel gathers
  `--.( (
   ( (  ____
  ( ( .:####:. ) )    2021-24 · BRAID: banks split around
   ) ) `####' ( (----[card]    a long dark island, rejoin
    `.( (__) ).'
       )||(       2023 · narrows + drop: fast, white-hot
      _)||(_
     (  ....  )   2024 · still pool, one perfect stone
      ( .(). )-----[card]
   .--' )  ( '--.     2024-25 · widest meander
  ( ( .:###:. ) )----[card]
   `-.| | | | .-'    2025 -> · delta fans into the sea
```

---

### Concept 6 — THE TRAINING SIGNAL · complexity 3

> *A career plotted as its own training run — noise in, signal out. The path is the loss
> curve of becoming an engineer, drawn live by a plotter head that settles from chaos to
> convergence.*

**Metaphor.** The timeline IS a training curve. Scroll = training steps; horizontal
deviation = instability/loss. 2018 is random init: the trace whips violently across the
full chart width, drenched in high-frequency noise. Every era is an epoch that visibly
changes the signal's character — amplitude collapses, frequency slows, noise decays —
until 2025, where the trace locks onto the center axis: **converged, but still training.**
The hero shows the loss LANDSCAPE; the timeline shows the loss CURVE over time. Signal
character *is* the storytelling medium.

**Silhouette.** A vertical **funnel of decaying oscillation** — a seismogram settling
after the quake, rotated to fall down the page. Two faint mirrored envelope hairlines
(±σ bands) start ~64 units apart and pinch to a needle — the funnel is visible full-length
before you scroll, so **the destiny of the line is legible from the first glance** (this
is the "illuminate the road ahead" ask, solved structurally). Trace stroke width ∝ local
amplitude: a wide indigo mist early, a thin white-cyan blade late. Fingerprints: a
plateau-then-CLIFF (17h→80min as a visible discontinuity in learning rate), one violent
SPIKE (first agents — a real training phenomenon: loss gets worse before recovery), one
tender dip that kisses the axis (the award), then a long straight luminous runway.
Sketchable in five strokes: funnel, damped zigzag, cliff, spike, straight tail.

**Motion.** All motion derives from ONE physical fact: the pen tracks scroll in arc
length, and arc-length-per-scroll-unit varies wildly by construction. Early
high-amplitude sections force the pen to WHIP across the chart — automatic acceleration,
no choreography needed. The stylus rotates to the tangent (banking); tail spacing scales
with head speed (motion-stretch); sparks emit only near the head, density scaled by the
local noise channel — **the pen throws sparks fighting the noisy early signal and runs
clean and quiet at the end.** Phosphor persistence: the trace is brightest just behind the
pen, decaying to steady dim — history visibly *written*, not uniformly lit. Finale:
deceleration onto the axis, one full-envelope breath, then a steady glow captioned
"training continues."

**Rhythm (authored spans, not pitch).** Raw noise, loudest passage (2018, span 30) →
longest span, slowly decaying amplitude (B.Tech, 44) → plateau then CLIFF (BotPro, major)
→ short violent SPIKE + recovery (agents, the drop) → quietest passage, amp 8, dip kisses
the axis — smallest but BRIGHTEST bloom, the only node ON the axis (award: high value,
low ego) → elegant slow S (VRSEN) → convergence runway amp 4→0.5 (now).

**Cards** = chart annotations (wandb/TensorBoard run-note grammar, elevated): hairline
leader leaves along the local normal, elbows once, terminates in a tick + mono epoch chip
("EPOCH 03 · 2021-24"). Cards drop their competing edge-glow — the trace is always the
brightest object; cards are matte annotations on a plot, a relationship every viewer
already understands.

**/work.** `beatsFor(n)` with monotone amplitude decay — *the portfolio itself converges*;
flagship = weight 3, may own the one spike/cliff. Tags = channel markers (square ticks,
mono labels); bridges = straight bus lines hugging the gutter (chart grammar, not swoopy
arcs). HUD: "SYSTEMS 04/09 · signal locked."

**Perf.** Budget goes DOWN: dendrites cut, sparks ≤1200, trace ~700 samples ≈ 6k verts.
Mobile left rail gains a static mini-sparkline SVG (~300 bytes) so even the stacked list
carries the funnel identity. **Complexity 3 — the cheapest concept** (y stays monotonic,
so the ENTIRE existing arc-length machinery is reused unchanged; `buildRibbon` survives
verbatim).

**Key risks.** A damped sine can still degrade into "another glowing squiggle" — the
grayscale poster test is the kill criterion; high-frequency early swings vs ~34-unit beat
heights need tuning against real 900px viewports; long leaders at converged nodes risk
callout spaghetti exactly where the design needs calm; the spike needs card copy to carry
its meaning for non-ML visitors.

```
·.  \    /\      /\    .·   <- envelope (±σ), full width
 ·.  \  /  \    /  \  .·       2018 · raw noise, pen whips
  ·.  \/    \  /    o———[ B.Tech 2019-23 ]
   ·.  /\    \/    .·
[ BotPro ]—o  \    /.·   plateau...
     ·.  \ \   \  /.·
      ·.  \_\   \o·   ...CLIFF (17h->80min)
       ·.    \  /.·
        ·.    \/ |\      SPIKE
[ agents ]————o  | \   (2023 · production)
          ·.   \ |,·
           ·.   o———[ award ] dip kisses the axis
            ·.  |.·
 [ VRSEN ]———o  |    smoothing
             ·\ |·
               o————[ independent 2025-> ]
               |  converged · training continues
```

---

### Concept 7 — THE GROWING MIND · complexity 4

> *You don't scroll a timeline — you watch a mind assemble itself, one thought at a time,
> and it never ungrows.*

**Metaphor.** Not a path that gets lit — **an organism that gets BUILT.** At scroll start
the column is almost empty: one seed node, vast dark. The growth frontier (a neuronal
growth cone) extends a single axon downward; at each life-beat it pauses and blossoms a
ganglion — a designed golden-angle rosette of capability nodes. Skills compound literally:
later ganglia fire long commissure arcs BACK to earlier ones, and the trunk gains a
visible internal strand at every major beat — the artery at the bottom is 3 strands thick
where the top was one thread. **Growth is monotonic (a watermark, not the scrub value):
scrolling back never un-grows the mind — a dim attention pulse revisits instead, because
minds don't ungrow.**

**Silhouette.** Sketchable in one sentence: a seed at the top, a thickening artery
descending with authored bends, seven differently-sized rosette clusters hanging off it,
big external arc loops stitching old clusters to new ones, ending in an open fan of live
growth tips. Three shape rules: caliber growth (read the biography from line weight
alone), designed rosettes (golden-angle fans, never scatter), and **the lineage rule — no
element may exist without a visible parent edge.** Zero free-floating stars: the
structural guarantee against "cards on a star background."

**Motion.** The growth cone DRAWS the artery behind itself; ahead of it the path does not
exist. Approaching a ganglion, 5 filopodia probe ahead and pulse (what real growth cones
do before synapsing) — anticipation that is physically real. Arrival ignition is **strictly
one-time** (per-milestone timestamps in a `uIgnite[]` uniform): hub flash → satellites pop
outward with damped-spring overshoot → commissure pulses launch *from ancestor hubs* and
travel forward into the new hub (old knowledge flowing into the new moment) → card stem
draws → card grows out.

**Rhythm.** Seed + LONG lonely thread (2018 — the loneliness is the design) → wide shallow
coursework rosette (B.Tech) → big ganglion, 2nd strand accretes (BotPro) → tightest bend,
largest ignition, hottest core (agents — the drop) → one crystalline ring-node, no fuzz
(award — precision rendered as precision) → commissures rain back to earlier beats, graph
densifies, 3rd strand (VRSEN) → the finale fan, open, drifting subtly toward the cursor
(the hero shader's `uInteract` idiom): **the organism notices you.**

**Cards** are leaves: tapered curved branches with slight gravity droop; a petiole bead at
the junction; light continues artery → stem → card ring. Cards stay one size — hierarchy
lives entirely in the organism.

**/work.** Weight from data; tags = satellites; shared tech = commissures. Filter =
per-milestone dim uniform; finale fan points into the CTA: "yours next."

**Perf.** LESS geometry than today (dendrites deleted, particles 1200); ~6 draw calls;
one-shots fired imperatively from the ONE ScrollTrigger's onUpdate.

**Key risks.** Serial viewing: at 1040px you see ~1.5 beats at a time, so the macro
silhouette is experienced serially (mitigation: HUD becomes a living mini-map — needs
taste review); **between clusters the trunk is still a glowing spline** — identity rests
on rosette quality + caliber legibility (mandatory isolated spike before committing);
monotonic growth trades replay drama for honesty; golden-angle rosettes can tip into
dandelion clipart without jitter.

```
       o                       2018 seed - one lonely node
        \
         `.                    long calm, a single thread
       *  (o) *
        `--|--'                2019-23 B.Tech rosette
        ,--'         ____
  *    ||           /    \
   `=((O))=*       |      |    2021-24 BotPro MAJOR hub
  *    |||`--------'      |    (trunk gains a strand)
       |||| ,-------------'
     =(((O)))=~ *              2023 AGENTS - the drop
      |||||  `(o)              2024 award - one crystal ring
      ||||||________
 *==((((O))))==*               2024-25 VRSEN - re-links back
    \\\|||||///
     \|||||||/ . . .           2025 open growth fan, still alive
```

---

### Concept 8 — ARGMAX (The Paths Not Taken) · complexity 4 · *wildcard*

> *A life, decoded: at every milestone the futures fan out, one branch is chosen, and the
> rest evaporate — until the final fork, which is deliberately left open.*

**Metaphor.** The timeline is an **inference trajectory**. This engineer builds AI agents;
his own story is rendered as an agent's rollout through decision space. A decoding head
writes the path token by token; at each milestone a distribution of candidate futures
becomes visible — 2-5 ghost branches fanning forward. Arrival is the argmax: probability
mass collapses into the chosen branch, the rejected futures evaporate into brief particle
dust and leave permanent faint scars. The physical reference everyone recognizes:
**lightning** — a stepped leader branches into the dark, but the return stroke illuminates
only the channel that connected. Argmax is THE selection operator of the site's
optimization metaphor — without a single neuron.

**Silhouette.** A "slow lightning bolt": one luminous, mostly-vertical channel with
deliberate KINKS at decision points — not a smooth sine. At every kink, a feather of
extinct branches fans forward and dies within 80-200px, leaving thin dark scar stubs. The
channel gains caliber across the story (thin scripts-era line → wide agents-era conduit)
and terminates in an OPEN DELTA — a breathing fan of live ghosts, the one fork never
collapsed. **A tree pruned to a path** — no other concept has "the death of alternatives"
as its gesture. Ahead of the head, the future exists only as quantized token ticks that
the head overwrites into continuous light (dots that *mean* "not yet decoded").

**Motion.** Pure function of scrub (reversible, scrub-safe): `warp(p)` with fixed points
at every `nodeFrac` — slow leaving a node, accelerating into the next fork (capped 1.6×),
head/blooms/cards agree exactly at nodes. Approach: the upcoming fan brightens and spreads
(the distribution becomes visible), head temperature jitter rises. Arrival — **the
collapse, the signature moment**: one-time bloom, ghosts flare then evaporate outward, a
return-stroke pulse runs ~6% ahead into the chosen segment, the head whips through the
kink with its tail lagging outward. Then an exhale.

**Rhythm.** Ignition spark + 2-ghost fan (2018, a curious kid's options) → LONGEST
straightest calm (B.Tech) → tightest hairpin + heavy collapse (BotPro — an optimization
hairpin, literally) → widest fan, biggest bloom, permanent caliber step (agents — the
drop) → fast double-hit: 1-ghost fan + precision starburst (award — awards decorate a
trajectory, they don't bend it) → wide sweeping arc (VRSEN) → **the widest fork of a life,
5 ghosts, and no collapse.** HUD 07/07; a single mono caption: "currently sampling." The
open ghosts fade toward the contact section — the next branch is, literally, the visitor.

**Cards** are decision records: on collapse a stem-ribbon grows laterally out of the node,
and one beat later the card slides in as if extruded from it — *the card is the one branch
that survived sideways.*

**/work.** Each system is a decision the engineer ran. Tags = context tokens the decision
attended to; bridges = the same token attended across projects. **The filter becomes
MASKING — exactly what filtering is in attention**: non-matching nodes dim, their fans
collapse to scars. "Attend to Agents; everything else is masked."

**Perf.** Improves on current (dendrites die; ~1200 flow + ~600 evaporation particles;
~6 draw calls; all collapse logic in-shader from uniforms).

**Key risks.** Ghost fans regress into "more random dendrites" if thin/jittered/ambient —
mitigations are structural (fans only at nodes, rooted at full channel width, carrying
narrative state) but must be policed with cards hidden; ghosts below ~1.2 units core width
collapse into fuzz (enforce minimum); scrubbing backwards re-inflates dead fans (fine as
"scrubbing a recording," but must never be stateful); kinks + variable amplitude vs fixed
card lanes needs a layout audit per beat.

```
* 2018 ignition
 `.         .··.
   `.      ·    ·        <- ghost fan (live futures)
     o━━┓ ·      ·
        ┃ `·....·        collapse: one channel survives
        ┃                long calm run — B.Tech
        ┃
   ┏━━━━┛
 ··o   BotPro — hairpin kink (17h -> 80min)
   ┗━━━━━━━┓   ····
       ····┃ ··    ··    AGENTS — widest fan;
           o━━━━┓        channel steps up in caliber
                o━┓      award: precision starburst
          ┏━━━━━━━┛      VRSEN — wide sweep
          o┈ ┈ ┈         2025 — the fork stays OPEN
         /  ┊  \         "currently sampling"
```

---

## Part 3 — Ranking

> **Honesty note:** the planned 3-agent judge panel (award juror / pragmatist architect /
> story-UX) hit the session limit and never ran. The scoring below is a single-judge
> synthesis applying the same adversarial tests: (a) will it *actually render* as
> described in a ~1040px 2D orthographic additive canvas, or collapse back into a glowing
> spline; (b) does it survive 7 story milestones AND 10+ filterable projects; (c) does
> filter-dimming break its visual logic; (d) is mobile/reduced-motion a real experience;
> (e) will it look good in 3 years. Re-running the panel later is cheap if wanted.

Scores 1-10. *Feasibility* = ease of shipping **excellently** under the hard gates
(10 = easy). *Avg* is unweighted and indicative only — the decision below weighs the
brief's priorities (path-as-hero, memorability, award-level) more heavily.

| # | Concept | Orig. | Story | Usab. | Perf. | A11y | Feas. | Wow | Avg |
|---|---------|------:|------:|------:|------:|-----:|------:|----:|----:|
| 1 | **ARGMAX** | 9.5 | 9.5 | 8.5 | 8.5 | 8 | 7 | 9 | **8.6** |
| 2 | **Training Signal** | 8.5 | 9 | 8.5 | 9 | 9 | 8.5 | 7.5 | **8.6** |
| 3 | **The Descent** | 9 | 9 | 8 | 9 | 8 | 6.5 | 8.5 | **8.3** |
| 4 | Gradient Flow (Liquid) | 8 | 8.5 | 8.5 | 8.5 | 8.5 | 6.5 | 8 | 8.1 |
| 5 | Cosmic Current (River) | 8.5 | 8.5 | 8 | 8 | 8 | 6 | 8.5 | 7.9 |
| 6 | Braided Light | 8.5 | 8.5 | 7.5 | 8 | 8 | 5.5 | 8 | 7.7 |
| 7 | Growing Mind | 8 | 8.5 | 7 | 8 | 8 | 6 | 8 | 7.6 |
| 8 | Dichroic (Glass Ribbon) | 8.5 | 7.5 | 7.5 | 8.5 | 8 | 5 | 8 | 7.6 |

### Adversarial notes (why the scores land where they do)

- **ARGMAX** — the most original narrative device of the eight ("the death of
  alternatives"; a tree pruned to a path) and the most *personal*: Jay builds AI agents,
  and this renders his own life as an agent rollout, ending on an open fork pointed at the
  visitor. Kinked line-art + node-rooted fans render safely in additive 2D. Keeps y
  monotonic (no engine surgery the Descent's spiral needs). The one real danger — ghost
  fans regressing into "more random dendrites" — has structural mitigations (fans only at
  nodes, full channel width at the root, narrative state) but must be policed with cards
  hidden. Filter-as-attention-masking is the most semantically honest /work filter of all
  eight.
- **Training Signal** — the highest confidence to ship at 100% quality (complexity 3,
  monotonic y, `buildRibbon` verbatim, arc-length machinery untouched), the tightest
  site-metaphor lock (the copy already says "the high-loss start of the curve"), the best
  mobile/reduced-motion story (mini-sparkline rail; the funnel is legible in a grayscale
  still). Ceiling concern: it is a *diagram* — brilliantly executed, but the wow ceiling
  is lower than terrain/lightning, and Awwwards juries have seen waveforms.
- **The Descent** — the strongest *site unification* play (hero shader = fly-in view,
  timeline = map view of the same loss landscape) and cartography is natively 2D, so the
  silhouette is the safest render bet of the top tier. Costs: the most authored-geometry
  tuning surface (rings, contours, hachures, warp, spiral), the spiral breaks monotonic-y
  and the two-lane card system, and contour-line aesthetics skirt a 2019-21 print trend —
  the *living* quality must come from probe physics, or it reads as a beautiful infographic.
- **Gradient Flow vs Cosmic Current** — these two overlap heavily (water, pools/islands,
  delta finales, continuity physics). Liquid's geometry-first silhouette (10-15× width
  variation, flat-black acid test) is the safer of the pair; River's negative-space
  islands are the single cleverest compositional idea in the whole exploration (voids the
  cosmos shines through) but a wide additive band fogs more easily. Neither ties to the
  engineer's identity as tightly as the top three.
- **Braided Light** — topology-as-story is genuinely strong and strand=category gives the
  best /work filter interaction of all eight. But it carries the worst render risk: three
  additive strands in a 100-unit viewBox can mush into one fat spline, crossings have no
  occlusion, and on /work "every project = all strands converge" re-invites the metronome.
  The day-1 poster kill-switch is the right control; it's still the riskiest top-half bet.
- **Growing Mind** — beautiful growth choreography and the only topology-changing object,
  but two strikes: it is the concept *closest to the failure being replaced* (glowing
  trunk + node clusters + arcs = Constellation Spine 2.0 with better manners, and between
  clusters the trunk is still a glowing spline), and ganglia/axons/commissures is
  literally the "generic neurons" direction this repo's own design guidance warns against.
  The serial-viewing problem (you never see the whole organism at once) undercuts the
  "one memorable object" goal.
- **Dichroic** — the highest ceiling *if* the fold reads, and the biggest unknown: the
  entire concept rests on a width-collapse + brightness + hue-flip illusion that has no
  occlusion to lean on. The 2-day fold spike is the right gate, but among eight options,
  betting the redesign on the least-certain render is hard to justify. Weakest tie to the
  optimization story ("the path the search found" is a reach).

---

## Part 4 — Recommendation

### Primary: **ARGMAX — The Paths Not Taken**

The critique's root cause was that *narrative had no representation in the geometry* — the
path was a material effect applied to a metronome. The brief's own concept list (neural
highway, fiber optic, energy ribbon…) is, honestly, more materials. ARGMAX is the concept
where the story **is** the shape at every level:

1. **The silhouette is information.** Kinks are decisions, fans are the futures that
   existed, scars are their memory, caliber steps are growth, the open delta is the
   present. Remove every card and the object still narrates a life. It is falsifiable in
   one sentence — "a slow lightning bolt with feathered dead forks and one fork still
   open" — which is exactly what a juror remembers.
2. **It is the most personal concept possible for this portfolio.** Jay's profession is
   building agents; his timeline rendered as an agent's rollout — with the final
   distribution left uncollapsed, captioned "currently sampling," fading toward the
   contact section — is a thesis, not a decoration. No other candidate makes the *visitor*
   the next branch.
3. **Every brief requirement lands structurally, not cosmetically.** Anticipation = the
   fan brightening before arrival. Impact = the collapse. Momentum = warp(p) with fixed
   points at nodes. Illuminate-ahead = the return stroke. Cards grow from the path = the
   surviving lateral branch. Milestone weight = fan count, kink sharpness, bloom type,
   caliber steps. Rhythm = the authored 7-beat score (short-LONG-tight-tight-short-sweep-open).
4. **It ships on the existing chassis.** Monotonic y preserved (no lane surgery), all
   rendering is existing idioms (ribbon specs, glint pulses, particle vertex shaders,
   warp table), scrub-pure and reversible, budget *below* today's scene. Complexity 4,
   but with no exotic rendering technology — the risk is design discipline, not physics.

**Condition of success (the one thing to police):** the ghost fans. They must never be
thin, ambient, or jittered — fans only at nodes, rooted at full channel width, minimum
core width enforced, judged with cards hidden. If the fans read as fuzz in the week-1
poster, the fallback is the Descent.

### Runner-up: **The Descent** — choose this instead if you value the one-world site
unification (hero and timeline as two views of the same landscape) over maximum
originality, and accept a bigger tuning budget (rings, warp, spiral, center lane).

### Pragmatic option: **Training Signal** — if you want ~80% of the storytelling value at
~60% of the cost with the highest shipping confidence and the best fallbacks. Also the
strongest choice if the /about page's primary audience is recruiters skimming for signal
rather than design juries.

### Regardless of direction (do these anyway)

1. Fix the five concrete bugs from Part 1 (filter not reaching WebGL, backdrop-blur over
   canvas, ease-inside-scrub, tail inversion, orb step-pop).
2. Delete the 18 random dendrites — every concept team independently identified them as
   the "scattered dots" generator.
3. Adopt the **poster-first workflow**: author the new geometry and ship the static SVG
   poster *before* any WebGL — it is the cheap kill-switch for silhouette failure, and it
   upgrades the reduced-motion/no-JS experience from consolation prize to finished artwork.
4. Adopt the **grayscale acid test**: the silhouette must read in a flat-gray screenshot
   with all cards hidden, or the geometry isn't done.
5. Add a `weight` channel to the engine API (`Beat`/score table) — every concept needs it,
   and it is the schema change that makes drama representable at all.

### Next step

Awaiting direction approval. On approval: full implementation architecture (module
breakdown, geometry contracts, shader plan, phased milestones with kill-switches) —
still no code until explicitly requested.

