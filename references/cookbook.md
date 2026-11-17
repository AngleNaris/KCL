# KCL cookbook

Optional implementation recipes, mainly for reduced-mode geometry. Apply the selected mode and material routing first; this file is not an element checklist. Use `kind: "material"` or positioned images for generated/sourced supporting artwork, keep live text and exact geometry separate.

Web recipes for each layer. Everything here is plain HTML, CSS and SVG; no build step is required for a single page. Preprocess photographs with `tools/process_image.py`; generate procedural System layers with `tools/compose.mjs` or adapt the inline snippets.

## Tokens and layer stack (COL-1, SKL-1)

```css
:root {
  --paper: #f3efe6;
  --ink: #111111;
  --signal: #ff3b1f;
  --signal-2: #ff3b1f;            /* Duotone only; same as signal in Mono */
  --ghost: color-mix(in oklab, var(--ink) 12%, transparent);
  --hair: 1px;                    /* 0.75px on high-density screens if wanted */
}
.stage { position: relative; overflow: hidden; background: var(--paper); color: var(--ink); }
.stage > * { position: absolute; inset: 0; }
.l-ground  { z-index: 0; }
.l-plane   { z-index: 1; }
.l-type-plane { z-index: 2; }     /* plane type sits under the subject */
.l-subject { z-index: 3; }
.l-system  { z-index: 4; pointer-events: none; }
.l-signal  { z-index: 5; pointer-events: none; }
.l-type    { z-index: 6; }
.l-overlay { z-index: 7; pointer-events: none; }
```

Keep each layer a separate element so a reviewer can toggle it. Positioned children inside a layer use percentages of the stage so the skeleton survives scaling.

## Ground and overlay (TEX-1)

Grain, generated once for the whole canvas:

```html
<svg class="l-overlay" aria-hidden="true" width="100%" height="100%">
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
    <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/>
  </filter>
  <rect width="100%" height="100%" filter="url(#grain)"/>
</svg>
```

Dot screen without an image:

```css
.l-overlay.dots {
  background-image: radial-gradient(var(--ink) 0.6px, transparent 0.7px);
  background-size: 4px 4px;
  opacity: 0.18;
}
```

Scanlines: `repeating-linear-gradient(0deg, transparent 0 3px, var(--ghost) 3px 4px)`.

## Dividing planes, frames, container (SKL-4, SKL-5)

```css
.bar { position: absolute; left: 0; right: 0; height: 4vh; background: var(--ink); }
.frame { position: absolute; inset: 2%; border: var(--hair) solid var(--ink); }
.container { position: absolute; left: 50%; top: 50%; width: 60vh; aspect-ratio: 1; translate: -50% -50%;
  border-radius: 50%; border: var(--hair) solid var(--ink); }
.container.filled { background: var(--signal); border: 0; }
```

A frame that clips plane type: give the frame `overflow: hidden` and place the type inside it, or clip the type with `clip-path: inset(0 0 40% 0)`.

## Construction lines (SKL-3)

Full-bleed hairlines must exit the canvas. Draw them in an SVG that covers the stage and extend endpoints past the viewBox:

```html
<svg class="l-system" viewBox="0 0 1440 900" preserveAspectRatio="none" aria-hidden="true">
  <g stroke="var(--ink)" stroke-width="1" vector-effect="non-scaling-stroke" fill="none" opacity="0.7">
    <!-- 27° family: y = tan(27°) * x + c ; endpoints pushed outside the box -->
    <line x1="-100" y1="620" x2="1540" y2="-215"/>
    <line x1="-100" y1="980" x2="1540" y2="145"/>
    <!-- perpendicular -->
    <line x1="300" y1="-100" x2="810" y2="1000"/>
    <!-- horizon at 62% -->
    <line x1="-10" y1="558" x2="1450" y2="558" stroke-dasharray="2 6"/>
    <!-- concentric with the container -->
    <circle cx="720" cy="450" r="270"/><circle cx="720" cy="450" r="330"/><circle cx="720" cy="450" r="420"/>
  </g>
</svg>
```

`preserveAspectRatio="none"` keeps endpoints on the stage edges when the stage scales; `vector-effect="non-scaling-stroke"` keeps the hairline a hairline. Generate the geometry with `node tools/compose.mjs lines --angle 27 --count 3`.

## Rhythm points and marks (SKL-2, SKL-8)

```sh
node tools/compose.mjs dots --path "120,780 1100,160" --count 7 --ratio 1.5 --start 4
node tools/compose.mjs dots --arc "720,450,380,200,340" --count 6 --ratio 1.45 --start 5
node tools/compose.mjs stars --at "40,40 1400,40 40,860 1400,860 720,120" --size 14
```

Each prints an SVG `<g>` to paste into the System layer. A star is a four-point shape, not a glyph; use the generated path, never the ✦ character.

## Radial burst, rings and orbits

```sh
node tools/compose.mjs radial --center 720,450 --inner 240 --outer 330 --count 96 --every 4
node tools/compose.mjs rings --center 720,450 --radii 270,300,330,420 --dash "0,0,4 8,0"
node tools/compose.mjs orbit --center 720,760 --rx 420 --ry 60 --tilt -6
```

## Subjects (MAT)

Export reduced subjects from the tool as ink-on-transparent PNG and composite with blend modes so one asset serves both grounds (MAT-6):

```css
.subject { mix-blend-mode: multiply; }                /* ink on light paper */
.stage.dark .subject { mix-blend-mode: screen; filter: invert(1); } /* paper-colored ink on dark ground */
```

Optional two-level treatment (MAT-2), only when the visual concept benefits: compare against the preserved source and avoid an unintended offset duplicate. One preserved level is valid; use a meaningful crop/scale/clip when an echo is needed.

```html
<img class="subject ghost" src="statue-line.png" style="left:46%; top:22%; width:34%">
<img class="subject"       src="statue-silhouette.png" style="left:48%; top:24%; width:34%">
```

Runtime reduction, only for small elements (MAT-4):

```html
<svg width="0" height="0" aria-hidden="true">
  <filter id="threshold" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncR type="discrete" tableValues="0 1"/><feFuncG type="discrete" tableValues="0 1"/><feFuncB type="discrete" tableValues="0 1"/></feComponentTransfer>
  </filter>
  <filter id="duotone" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <!-- map luminance 0..1 to signal-2 .. paper; set the two colors as table endpoints per channel -->
    <feComponentTransfer>
      <feFuncR type="table" tableValues="0.16 0.95"/>
      <feFuncG type="table" tableValues="0.10 0.94"/>
      <feFuncB type="table" tableValues="0.88 0.90"/>
    </feComponentTransfer>
  </filter>
</svg>
<img src="small.jpg" style="filter:url(#threshold)">
```

Negative: `filter: invert(1)`. Posterize to three levels: `tableValues="0 0.5 1"` with `type="discrete"`.

## Optional chromatic split (TEX-2, TEX-3)

```html
<div class="split">
  <img src="wing.png" class="c r"><img src="wing.png" class="c g"><img src="wing.png" class="c b">
</div>
```
```css
.split { position: absolute; left: 60%; top: 30%; width: 22%; }
.split .c { position: absolute; inset: 0; mix-blend-mode: screen; }
.split .r { filter: url(#onlyR); translate: -3px 0; }
.split .g { filter: url(#onlyG); }
.split .b { filter: url(#onlyB); translate: 3px 0; }
```
with `feColorMatrix` filters that keep one channel each. On a light ground use `multiply` with CMY-style matrices instead of `screen`.

Brush ribbon as the soft element: an SVG path with `stroke="var(--signal)"`, `stroke-width` 40–120, `stroke-linecap="round"`, `filter="url(#soft)"` where `#soft` is `feGaussianBlur stdDeviation="3"`, plus a second copy without blur at `stroke-width` 6 to keep one hard edge inside the softness.

## Type (TYP)

Plane type, stretched along one axis and clipped by bars:

```css
.plane-type {
  position: absolute; left: 50%; top: 50%; translate: -50% -50%;
  font: 700 28vw/0.8 var(--display); letter-spacing: -0.04em;
  transform: scaleY(1.8); transform-origin: center;
  color: transparent; -webkit-text-stroke: 1px var(--ink);   /* outline variant */
  white-space: nowrap; user-select: none;
}
.plane-type.ghost { color: var(--ghost); -webkit-text-stroke: 0; }
```

Mark type:

```css
.mark { position: absolute; font: 500 11px/1 var(--text); letter-spacing: 0.3em; text-transform: uppercase; }
.mark.tl { left: 2%; top: 2%; } .mark.tr { right: 2%; top: 2%; }
.mark.bl { left: 2%; bottom: 2%; } .mark.br { right: 2%; bottom: 2%; }
.mark.vertical { writing-mode: vertical-rl; }
```

Voice type: `font: 400 clamp(14px, 1.2vw, 20px)/1.5 var(--text); max-width: 60ch;`.

Vertical CJK: `writing-mode: vertical-rl; text-orientation: upright;`.

### Faces

Open-licensed faces that carry the idiom (all on Google Fonts under OFL unless noted):

| Role | Latin | CJK |
| --- | --- | --- |
| Display serif, high contrast | Bodoni Moda, Playfair Display, Instrument Serif, Cormorant Garamond | Noto Serif SC/TC, LXGW WenKai (OFL, self-host) |
| Display condensed / blackletter | Anton, Bebas Neue, Big Shoulders Display, UnifrakturMaguntia, Pirata One | Noto Sans SC at heavy weight, stretched |
| Text mono for technical registers | Space Mono, JetBrains Mono, IBM Plex Mono | Noto Sans Mono CJK (system) |
| Text serif | Cormorant Garamond, EB Garamond, Newsreader | Noto Serif SC |

Always set a system fallback stack (`"Noto Serif CJK SC", "Liberation Serif", serif`). Subset CJK webfonts to used glyphs (TYP-6); a full Noto Serif SC is several megabytes.

## Motion (MOT)

Loops, tempos, budgets and per-layer recipes are in [motion.md](motion.md). Generate System geometry with `node tools/compose.mjs <cmd> --indexed` so each child carries `--i` for staggered delays.

## Performance

- Photographs: preprocess. A full-viewport `feTurbulence` or `feComponentTransfer` filter on a large image costs frames on every scroll.
- One grain overlay for the page, never one per band.
- No `backdrop-filter`; it is both slow and forbidden (COL-5 glass).
- `will-change` only on the one element that animates.

## Screenshots

```sh
npx playwright screenshot --viewport-size=1440,900 --full-page "file:///abs/page.html" /abs/scratch/page-1440.png
npx playwright screenshot --viewport-size=768,1100 --full-page "file:///abs/page.html" /abs/scratch/page-768.png
```

Keep scratch output outside the skill directory. Open the PNG and look before reporting.
