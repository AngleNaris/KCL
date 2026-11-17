# KCL motion (动)

Motion in KCL is a set of infinite loops that keep a composition alive without ever changing it. Nothing enters, nothing leaves, nothing lands somewhere else. A page paused at any instant must still pass [review.md](review.md). Rules are in the MOT section of [grammar.md](grammar.md); this file is the vocabulary and the recipes.

## Principles

- **Loop, not entrance.** Every moving element has a steady state and returns to it. One settle animation at load is allowed (construction lines drawing in); everything else loops forever.
- **Three tempos.** *Glacial*: rotation at 120–360s per revolution, drift at 40–90s per cycle. *Slow*: breathing and oscillation at 7–20s. *Quick*: twinkle, flicker, reseed at 0.6–4s. A stage uses at most one quick loop.
- **Budget of three.** At most three moving systems per stage or band, not counting the overlay. The subject moves last and least; marks and voice type never move.
- **Desynchronize.** Give coexisting loops durations that are not simple multiples (37s, 53s, 71s) and negative `animation-delay` offsets so they never align or visibly restart together.
- **Small ranges.** Drift within 1–2% of the stage, breathe within 3–6% of scale, oscillate within 2–6px. A loop that moves an element across the composition is a layout change, not motion.
- **Transform and opacity only.** No animated layout, color, blur or filter on large elements. SVG attributes that cannot be reached from CSS (grain `seed`, `stroke-dashoffset` on some engines) use SMIL `<animate>`.
- **Reduced motion.** Under `prefers-reduced-motion: reduce`, pause every loop in its steady state; the composition is complete without motion.

## What may move, by layer

| Layer | Loops | Tempo |
| --- | --- | --- |
| Ground | nothing | |
| Plane | nothing; bars, frames and containers are the fixed order | |
| Subject | one float (translate ≤ 1.5%) or a slow rotation if the subject is radial; a line ghost may oscillate its offset | glacial / slow |
| System | rings rotate; radial bursts breathe; construction lines march their dash; rhythm points drift along their path or pulse in sequence; flocks drift; contours ripple by staggered scale; orbits wobble | glacial / slow |
| Signal | ribbon flows (dash offset on its hard core); chromatic split oscillates; stars twinkle | slow / quick |
| Type | plane type drifts or breathes along its stretch axis, very slowly; mark and voice type never | glacial |
| Overlay | grain reseeds; scanlines roll; dot screen never | quick / slow |

## Recipes

Generate System geometry with `--indexed` so each child carries `--i` for staggering:

```sh
node tools/compose.mjs dots --path "200,90 1150,1190" --count 7 --indexed
node tools/compose.mjs contours --count 11 --indexed
```

```css
/* Reduced motion first: everything pauses in its steady state. */
@media (prefers-reduced-motion: reduce) { .stage * { animation-play-state: paused !important; } }

/* Rings and radial subjects: glacial rotation around the container center. */
.rings { transform-origin: 980px 520px; transform-box: view-box; animation: spin 180s linear infinite; }
@keyframes spin { to { transform: rotate(1turn); } }

/* Radial burst: breathing. */
.radial { transform-origin: 720px 470px; transform-box: view-box; animation: breathe 9s ease-in-out infinite; }
@keyframes breathe { 50% { transform: scale(1.045); } }

/* Construction lines: the dash marches; the line never moves. */
.construction line { stroke-dasharray: 6 10; animation: march 23s linear infinite; }
@keyframes march { to { stroke-dashoffset: -160; } }

/* Rhythm points: pulse in sequence using the generated index. */
.rhythm circle { transform-box: fill-box; transform-origin: center; animation: pulse 5.3s ease-in-out infinite; animation-delay: calc(var(--i) * -0.7s); }
@keyframes pulse { 50% { transform: scale(1.18); } }

/* Flock: drift along the curve direction and back. */
.flock { animation: drift 47s ease-in-out infinite alternate; }
@keyframes drift { to { transform: translate(18px, -8px); } }

/* Contours: ripple outward by staggered breathing. */
.contours path { transform-box: fill-box; transform-origin: center; animation: breathe 13s ease-in-out infinite; animation-delay: calc(var(--i) * -1.1s); }

/* Ribbon: the hard core flows; the blurred body stays still (filters do not animate). */
.ribbon-core { stroke-dasharray: 90 30; animation: flow 11s linear infinite; }
@keyframes flow { to { stroke-dashoffset: -240; } }

/* Chromatic split: oscillation of the offset copies. */
.split .c.r { animation: sway 7s ease-in-out infinite alternate; }
.split .c.b { animation: sway 7s ease-in-out infinite alternate-reverse; }
@keyframes sway { from { transform: translateX(-2px); } to { transform: translateX(4px); } }

/* Stars: the one quick loop. */
.marks path { transform-box: fill-box; transform-origin: center; animation: twinkle 2.9s ease-in-out infinite; animation-delay: calc(var(--i) * -0.9s); }
@keyframes twinkle { 50% { transform: scale(0.72); opacity: 0.75; } }

/* Plane type: breathing along its stretch axis. */
.plane-type { animation: stretch 41s ease-in-out infinite alternate; }
@keyframes stretch { from { transform: scaleY(1.8); } to { transform: scaleY(1.86); } }

/* Scanlines: a slow roll. */
.l-overlay.scan { animation: roll 11s linear infinite; }
@keyframes roll { to { background-position-y: 32px; } }
```

Grain reseed, inside the filter (SMIL):

```html
<feTurbulence type="fractalNoise" baseFrequency="0.92" numOctaves="2" stitchTiles="stitch" seed="1">
  <animate attributeName="seed" values="1;5;2;7;3;8;4;6" dur="0.8s" calcMode="discrete" repeatCount="indefinite"/>
</feTurbulence>
```

Drift along a path for rhythm points (modern engines):

```css
.rhythm circle { offset-path: path("M200,90 L1150,1190"); offset-distance: calc(var(--i) * 14%); animation: along 71s linear infinite alternate; }
@keyframes along { to { offset-distance: calc(var(--i) * 14% + 4%); } }
```

`transform-box: view-box` lets `transform-origin` use viewBox units for groups; `fill-box` centers on the element itself. Set `will-change: transform` only on the one or two elements that rotate continuously.

## Performance

- Keep moving elements under about 2,000 SVG nodes per stage; a 220-sample contour set of 14 rings is fine, a 10,000-dot halftone is not.
- A blurred element must not animate; animate an unblurred twin instead.
- Grain reseed is a full-canvas repaint at 8–12 fps; keep its alpha low and never combine it with a rolling scanline on the same page.
- Scroll pages: loops in off-screen bands cost little under transform-only animation, but pause them with an `IntersectionObserver` if the page has more than five bands.

## Verification (VER-4)

```sh
bash tools/motion_check.sh /abs/page.html /abs/scratch 1440,900
```

It captures two frames three seconds apart and prints the changed-pixel fraction and the bounding box of change. Expect a small fraction confined to the regions that are meant to move. A large or page-wide fraction means the overlay or a layout property is animating; zero means the loops are not running. Then open the later frame and walk the tells again; a loop extreme must still compose.
