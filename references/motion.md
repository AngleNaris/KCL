# KCL motion

Static work is complete. Add motion only when it contributes a specific observation, reveal or narrative relation. The bundled plate renderer outputs static SVG; implement time/interaction in the surrounding web layer. Do not describe a Motion Score as an engine feature that already exists.

## Motion Score

Record purpose, affected layers, trigger (ambient/time/scroll/input), start/end or loop duration, transform origin/path, range, occlusion, text protection and reduced-motion state. Start with one meaningful motion: an exact orbital layer, staged ink impression, a masked diagram reveal, or ordered specimen states. Do not float every image.

Keep related material and exact geometry aligned. Split a generated assembly only where independently moving parts are needed. A raster ornament can rotate or reveal behind a vector mask; it need not be redrawn as primitive SVG just to move.

Prefer transform/opacity and inexpensive masks. Test expensive texture/filter changes at actual size. A useful starting budget is three moving systems, not a requirement or universal ceiling. Ambient loops can have differing periods; deliberate sequences may synchronize. Avoid incidental bounce, flicker and unmotivated drift.

Provide a complete stable reduced-motion frame. CSS pause rules do not stop JavaScript or SMIL: explicitly disable/pause those mechanisms as well. Test the fallback. Inspect representative extremes and transitions, not only two nearby frames.

The following recipes are optional building blocks for restrained ambient motion; choose only those that serve the Score.

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

It captures two frames three seconds apart and prints the changed-pixel fraction and the bounding box of change. Compare change with the intended regions. Zero in a short interval may mean a slow or event-triggered motion; it does not establish a failure. Check start/end, extremes, trigger states and reduced motion separately. Then open the later frame and walk the tells again; a loop extreme must still compose.
