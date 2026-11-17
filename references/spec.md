# KCL composition spec (构成规格)

`kcl-spec.json` is the machine-readable half of the brief: numbers in canvas pixels that `tools/sketch.mjs` draws as a wireframe, that `tools/kcl-render.mjs` draws as the final plate (in the Studio, in `plate.mjs` and in screenshots) and that the build reuses. The current format is `spec-v2`; a `spec-v1` file is migrated on read (defaults filled, weights made explicit) and written back as v2 the first time the Studio saves it. The brief keeps the prose (assets, licenses, decisions, verification); the spec keeps the geometry. Keep both next to the page or in `docs/`.

Fill the spec in the order of [principles.md](principles.md). Every number is a decision; a number you cannot defend in one sentence belongs to the sketch round, not the build.

## Material modes and supporting assets

Set `artDirection.mode` explicitly in new work: `hybrid` for preserved illustration/material assemblage, `reduced` for the historical limited-ink diagnostics. Missing mode remains reduced for compatibility; unknown values are rejected. The mode selects checks, not a filter: images are never automatically desaturated. The brief carries the Style Bible and production plan; optional `artDirection.concept`/`styleBible` text is descriptive metadata.

```json
{
  "kcl": "spec-v2",
  "artDirection": { "mode": "hybrid", "concept": "An observatory reclaimed by plants" },
  "canvas": { "w": 1440, "h": 900 },
  "color": { "paper": "#ece5d9", "ink": "#141414", "signal": "#687b8e" },
  "elements": [
    { "id": "engraved-housing", "kind": "material", "src": "assets/housing.png",
      "box": { "x": 120, "y": 90, "w": 700, "h": 700 }, "fit": "contain", "layer": "plane" },
    { "id": "observer", "kind": "subject", "render": "rendered",
      "box": { "x": 600, "y": 80, "w": 600, "h": 800 },
      "levels": [{ "src": "assets/observer.png", "mode": "rendered" }] }
  ]
}
```

This is an asset placement example, not an implemented artwork: the referenced assets must be supplied/produced and verified. A `material` is not an extra ranked character. It renders in the same Studio/CLI path as other elements, participates in inline export and can be moved/resized by its `box`.

| Material field | Meaning |
| --- | --- |
| `src` | image path relative to spec/root; absent shows an explicit asset-pending placeholder |
| `box` | finite `x y w h` in canvas pixels, positive width/height |
| `layer` | default `plane`; any renderer layer from `ground`, `plane`, `typePlane`, `subject`, `system`, `fragment`, `signal`, `type`, `overlay` (`quiet` is a non-rendered guide) |
| `fit` | `contain` (default), `cover` (clips to the box), `stretch` (intentional distortion) |
| `align` | `[horizontal, vertical]`, each `0`, `0.5` or `1`; default centered |
| `opacity`, `blend` | default `1` and `normal`; explicit blend such as `multiply` only when intended |
| `clip` | id of a frame/container/boxed element, applied in canvas space outside asset rotation |
| `rotate` | degrees around the image box centre |
| `tint` | optional role token or CSS color, recolors alpha silhouette; omit to preserve image RGB |

Use more than one material element to represent separate front/back parts. Use `layer` to change depth and element order to order peers. An opaque white-backed raster with `tint` becomes a rectangle; use real alpha or an appropriate compositing export. Exact scales and text remain vector/DOM.

Hybrid checks retain pending-material, duplicate-ID, clip-reference and field validation while skipping historical style quotas. `sketch.mjs` keeps descriptive geometry, flow and chosen whitespace-target checks. Coverage numbers remain available but are not judged by reduced-mode limits. The legacy tables below document reduced diagnostics only; they do not demand echoes, lines, filled planes, a soft element or extra texture.

## Shape

```json
{
  "kcl": "spec-v2",
  "title": "…",
  "page": "…html",
  "archetype": "chosen structure or custom",
  "artDirection": { "mode": "hybrid | reduced" },
  "axis": 27,
  "canvas": { "w": 1440, "h": 900, "bands": [{ "id": "I", "y": 0, "h": 900, "label": "…" }] },
  "imagery": { "tension": "…", "subjectRegister": "…", "apparatus": "…", "motifs": [], "fragments": [], "voice": [] },
  "principles": {
    "hierarchy": { "ranks": [{ "id": "…", "role": "subject | apparatus | fragments | type" }], "dimensions": ["size", "solid/line"] },
    "balance": "top | centre | bottom | top-bottom | left-right | perimeter | diagonal | scatter | irregular",
    "alignment": { "datum": "diagonal | grid | curve", "angle": 27, "horizon": 0.62 },
    "proximity": [{ "group": "…", "members": [] }],
    "repetition": [{ "what": "…", "count": 9, "variation": "…" }],
    "contrast": ["…"],
    "whitespace": { "target": 0.55, "zone": "…", "narrative": "…" }
  },
  "color": { "mode": "Mono | Duotone", "paper": "#…", "ink": "#…", "signal": "#…", "signal2": "#…", "ground": "paper | ink", "reason": "…" },
  "fonts": [{ "family": "…", "src": "assets/fonts/….ttf", "role": "display | text | mono", "weight": 600 }],
  "finish": { "overlay": "none | grain | dots | scan", "opacity": 0.05 },
  "series": { "name": "…", "plate": 1, "of": 4, "variesBy": ["container: solid disc", "flow: entry top-left"] },
  "elements": [ … ],
  "flow": { "type": "…", "entry": [x, y], "path": [[x, y], …], "exit": [x, y], "stations": [{ "at": [x, y], "label": "…" }], "secondary": { "path": [[x, y], …] } },
  "gates": { "imagery": { "status": "pending | approved", "date": "…" }, "sketch": { "status": "pending | approved", "date": "…", "file": "…" } }
}
```

`bands` is for scroll pages: the canvas is the full scroll (1440 × total height) and each band is listed so the sketch draws its boundary and the check counts voice sentences per band. A fixed stage omits `bands`.

## Elements

One flat list. Each element has a `kind`; the renderer sorts them into the layer order of SKL-1 (plane → subject → system → fragment → signal → type → quiet). Add `"layer": "…"` only to override.

| kind | layer | fields | Draws as |
| --- | --- | --- | --- |
| `bar` | plane | `x y w h` | solid ink bar (SKL-4) |
| `block` | plane | `x y w h label` | ink plane, lighter |
| `frame` | plane | `x y w h` | outline frame |
| `container` | plane | `shape: circle` + `cx cy r`, or `square|arch` + `x y w h`, `label` | a container (SKL-5) |
| `material` | plane | `src box fit align opacity blend clip rotate tint layer` | preserved supporting image or explicit pending placeholder |
| `subject` | subject | `id label rank levels[] box{x y w h} bleed[]` | hatched box (denser for rank 1), rank badge, levels, thick bleed edges; the box may extend past the canvas |
| `lines` | system | `angle` (degrees rising to the right, or `axis` / `perp`) `count perp through[x,y] spread dash` | one diagonal family exiting the canvas, as `compose.mjs lines` (SKL-3, SKL-18) |
| `line` | system | `x1 y1 x2 y2 extend dash`, or born from a centre: `radial: { at, from, to }` / `tangent: { r, at, len }` with `anchor` or `cx cy` (`at` in degrees or `axis` / `perp`) | one line, extended to the edges unless `extend: false`; a radius or a tangent of the plate's centre (SKL-18) |
| `horizon` | system | `y` (fraction ≤ 1 or px) | dashed horizontal |
| `rings` | system | `cx cy radii[] dash` | concentric circles |
| `radial` | system | `cx cy inner outer count` | burst |
| `orbit` | system | `cx cy rx ry tilt` (`tilt` in degrees or `axis` / `perp`; also on `system` and `field`) | tilted ellipse, tilted to the axis by name (SKL-18) |
| `rhythm` | system | `path[[x,y],…] count ratio start reverse seed` | rhythm points stepping by ratio along the path (SKL-2) |
| `trail` | fragment | `id label path[] count size[min,max] taper: away|toward|flat spread seed` | fragments along a path, shrinking in the taper direction (SKL-10) |
| `mark` | signal | `shape: star|dot|cross|ring` `x y size`; star: `sharp` (waist, 0.1) `aspect` (1.3) `outline: weight` `inner: 0.4` `innerInk` `satellites: [[dx, dy, scale]]` `rotate` `straight` | punctuation (SKL-8); a star is an astroid, outlined with a nested filled star and offset satellites when it is the plate's one star cluster |
| `soft` | signal | `x y w h angle` | an optional soft element, blurred (TEX-2) |
| `rule` | signal | `x1 y1 x2 y2 width` | a signal-colored rule |
| `field` | plane | `x y w h` or `cx cy r` or `shape: polygon|star` + `points`/`size`, `pattern: dots|halftone|hatch|grid|cross|rings|waves|tiles|stars|noise`, `cell angle density scale seed base outline` | a plane made of texture (SKL-16); `base` fills a solid color under the pattern, `outline` strokes the shape at that weight |
| `sweep` | plane | `path[] width taper: start|end power` | a tapered brush arc; bulges in the middle by default, thick at `taper` end otherwise |
| `ticks` | system | `cx cy r start end inside` or `x1 y1 x2 y2 side: both`, `count len every extra` | ruler ticks around a circle or along a line; every `every`-th tick is `extra` times longer |
| `arc` | system | `cx cy r start end dots dot dash` | an arc stroke, or `dots` dots along it (degrees clockwise from +x) |
| `system` | system | `cx cy rx ry tilt start end` (ellipse arc, anchorable) or `path[]` / `along` + `from to`, `count shape` (`phase star dot ring cross drop shard tick square tri image`) or `shapes[]`, `size sizes[min,max] grow: up|down|bulge|steps phases: true|half align rotate jitter guide guideDash` | an ordered system (SKL-17): one shape on one large path, even spacing, size by rule; `phases: true` runs the moon from new to full to new, `guide` draws the path at that weight |
| `glyphs` | fragment | `path[]` or `along`, `count shapes[] size sizes[min,max] grow: start|end jitter align seed src` | a fragment alphabet cycling along a path: `phase star dot ring cross drop shard tri image` (SKL-10) |
| `blob` | signal | `cx cy r rough points stretch angle seed blur opacity` | an organic ink or signal splotch, hard-edged unless `blur` |
| `ribbon` | signal | `path[] width wobble blur opacity seed` | a brush stroke of varying width along a path; `blur` makes it an optional soft element (TEX-2), otherwise hard |
| `tag` | type | `x y text size font tracking pad w h angle upper` | a label knocked out of a small ink box; `ink: bg` gives a paper box with ink text |
| `grid` | system | `x y w h cols rows dash` | a coordinate grid (Technical register) |
| `type` | type | `role: plane|mark|voice` `text` (string or lines) `box orientation: vertical` | dashed zone with a role badge; plane type ghosted at box size, mark as spaced caps, voice as lines (TYP-1) |
| `quiet` | quiet | `box` | the quiet zone (LAY-2) |

## spec-v2: weight, material and relations

v1 recorded where things are. v2 also records how heavy they are, what they are made of and what they are attached to, so that the final render is a function of the spec and the checks measure the render.

**Every procedural non-subject element** carries three material fields (defaults per kind are filled by the migration):

| field | values | meaning |
| --- | --- | --- |
| `weight` | `hairline` `line` `rule` `band` `bar` | the rung of SKL-14, drawn at 0.75 / 2 / 5 / 14 px at a 900px short side, scaled with the canvas; `bar` means a solid plane |
| `fill` | `solid` `outline` `ghost` | solid ink, stroked at `weight`, or solid at 12% ink (a conventional partial opacity) |
| `ink` | `fg` `bg` `signal` `signal2` | which role token; `fg` is ink on a paper ground and paper on an ink ground (`color.ground`) |

**Relations** replace hand-copied coordinates:

| field | on | meaning |
| --- | --- | --- |
| `anchor: { to, at, offset }` | any element | centre the element on a subject landmark: `centroid`, `top`, `centre`, a named landmark from `anatomy.landmarks`, or `box:u,v`; `offset` in px. `lines` take it as `through`, circles as `cx cy`, boxes as their centre |
| `along: { from, to, samples }` | `trail`, `rhythm` | take the path from the flow between two fractions of its length |
| `clip` | plane kinds, subject levels, type | id of a container or frame that clips this element, in canvas coordinates (a `hidden: true` frame makes an invisible clip) |
| `layer` | any element | override the layer of SKL-1 (`plane`, `subject`, `system`, `fragment`, `signal`, `type`), e.g. a field drawn above the subject |
| `weights[]` | `rings` | one weight per radius, so a band ring and a hairline ring share a centre |

**Subjects** gain placement and anatomy:

```json
{ "id": "heir", "kind": "subject", "rank": 1, "box": { "x": 850, "y": 62, "w": 840, "h": 1000 }, "bleed": ["right", "bottom"],
  "render": "reduced | rendered | placeholder", "fit": "contain | cover | stretch", "align": [0.5, 0],
  "anatomy": { "centroid": [0.48, 0.60], "top": [0.45, 0], "axisDeg": 88, "landmarks": { "eyes": [0.42, 0.185], "collar": [0.56, 0.45] } },
  "levels": [
    { "src": "assets/heir-line.png", "mode": "line", "offset": [26, 18], "opacity": 1, "tint": "signal2" },
    { "src": "assets/heir.png", "mode": "rendered" }
  ] }
```

`anatomy` is in normalized asset coordinates (0–1); `plate.mjs anatomy asset.png` computes `bbox`, `centroid`, `top`, `axisDeg` and five horizontal mass bands from the alpha or luma mask, and the landmarks are read off the asset by eye (or clicked in the Studio later). Levels draw in order; each has `src`, `mode` (threshold, dither, halftone, line, silhouette, negative, rendered, ghost), optional `offset`, `opacity`, `tint` (role token, recolors the ink), `blend`, `clip`, and its own placement: `box`, `fit`, `align` (a level placed elsewhere than the subject box), `scale`, `rotate` and `mirror` about the level's centre. An optional echo of the subject is a second `subject` element with `rank` ≥ 2 and one reduced level, often `tint: bg` inside a solid plane or `mirror: true` beside the original (SKL-16). A subject without `src` renders as a hatched placeholder so mass can be judged before assets exist. `render: "rendered"` preserves a subject; a single level is valid in hybrid. Historical MAT-7 quota warnings are limited to reduced diagnostics.

**Type** gains `size`, `lineHeight`, `tracking`, `align`, `stretch: [sx, sy]`, `font` (role), `fill: outline`, and for vertical plane type `vertical: stack | rotate | rotate-ccw` (CJK stacks upright by default, Latin rotates).

**Trail** gains `shape: star | dot | shard | image` and `src` (an image fragment of the subject's own material, tinted to `ink`).

Migration: `node tools/plate.mjs migrate page.kcl-spec.json -o page.kcl-spec.json`. The migration is lossless for v1 fields and adds defaults; review the weights it chose, since v1 had no way to say them.

## Flow

`entry`, `path` points and `exit` are joined by a smooth curve. The renderer marks the entry with a square, arrows at every point, numbered stations and an arrowhead at the exit. `secondary.path` is drawn dashed. Put the stations on the ranked subjects, the soft element and the voice, in reading order.

## Commands

```sh
node tools/plate.mjs check   docs/page.kcl-spec.json            # structure: weight rungs, solid plane, signal carrier, MAT-7, series
node tools/plate.mjs render  docs/page.kcl-spec.json -o scratch/page.svg [--inline] [--wire] [--layers plane,subject]
node tools/plate.mjs shot    docs/page.kcl-spec.json -o scratch/page.png [--wire] [--scale 2]   # final render through Playwright
node tools/plate.mjs measure docs/page.kcl-spec.json [--json]   # pixel diagnostics (VER-6)
node tools/plate.mjs anatomy assets/subject.png                 # bbox, centroid, top, axis, mass bands for `anatomy`
node tools/studio/server.mjs docs/page.kcl-spec.json --port 4777 --refs /abs/references   # live canvas for the human
node tools/sketch.mjs check  docs/page.kcl-spec.json            # geometry diagnostics, add --json for a report
node tools/sketch.mjs render docs/page.kcl-spec.json -o scratch/page.sketch.svg [--grid] [--no-flow]
node tools/sketch.mjs sheet  a.kcl-spec.json b.kcl-spec.json c.kcl-spec.json -o scratch/sheet.svg
npx playwright screenshot --viewport-size=1600,1300 "file:///abs/scratch/page.sketch.svg" /abs/scratch/page.sketch.png
node tools/sketch.mjs overlay docs/page.kcl-spec.json scratch/page-1440.png -o scratch/page.overlay.svg
```

The SVG is the sketch; the PNG is what you show and what you look at. Size the viewport to the SVG's `width`/`height` or larger; Chromium renders the SVG file directly.

## Check (legacy reduced diagnostics below)

Two checks, both diagnostics, never verdicts. `plate.mjs check` reads the spec's structure; `plate.mjs measure` reads the rendered pixels; `sketch.mjs check` reads the geometry boxes (kept for the sketch round).

| `plate.mjs check` / `measure` field | Meaning | Warns when |
| --- | --- | --- |
| `weightClasses`, `solidPlane` | distinct rungs among apparatus; a solid plane exists | fewer than 3 rungs, or no solid plane (SKL-14) |
| `signalCarriers` | signal-colored elements that are not marks | none at least 3% of S (COL-6) |
| MAT-7 lines | rendered subject has an opaque second level that is clipped, boxed or scaled; a line-or-heavier apparatus crosses it; no extra soft; trails carry `src` | any missing; a second level that is only shifted (≥ 1.5% of S) reads as misregistration (重影); a rank-1 `rendered` level without a clip is not the default |
| `coverage.paper/ink/signal/material/mid` | pixel shares by role | paper below 30% or above 72% (references 49–69%); signal below 0.1% or above 8% |
| `grid[9]`, `densest`, `emptiest` | 3×3 ink shares | densest below 40% (references 44–85%), emptiest above 28% (references 7–28%), more than three cells under 8% (SKL-12, SKL-16) |
| `richness` | families, fields, organic planes, rank-1 levels, echoes, ordered systems, scattered families, line count, scattered rectangular fields, type pieces | no ordered system, no organic or textured plane, one level, no echo (SKL-16/17); more than one jittered family, more than three fragment families, more than six lines, more than two scattered rectangular fields, more than five type pieces (SKL-17, SKL-3, TYP-7) |
| `kinship` | centres (clustered within 2% of S, each on a landmark, on a subject's axis, or free), the axis (declared `axis`, else the largest diagonal family), angle families mod 90 (grid, diagonals, a mirrored pair), gestures (sweep, ribbon, trail, glyph and path systems grouped when they share the flow or lie within 5% of S) | a free centre; two diagonal families that are not mirrors; a line 3–12° off a family; an ellipse tilt or gesture chord more than 12° from every family and the grid; an orphan single line through no centre or landmark; more than one gesture, or two gestures within 20% of S; a construction line or gesture within the face window; plane type over the face (SKL-18, SKL-3, TYP-1) |
| `apparatus.strokes`, `classesPresent` | stroke-weight histogram of plane+system+signal layers alone | fewer than 3 rungs present, or no band/plane (SKL-14) |
| `interweave.apparatusOverSubject` | share of subject pixels covered by apparatus | below 1% (SKL-11) |
| `signalBlobPx` | longest side of the largest signal blob | below 3% of S (COL-6) |
| `midtone` | share of mid-luminance pixels | above 20% (MAT-1); rendered characters and placeholders raise it legitimately |

`sketch.mjs check` prints:

| Field | Meaning | Warns when |
| --- | --- | --- |
| `whitespace` | 1 − area covered by subjects, bars, blocks, type boxes and the soft element | more than 0.12 from `principles.whitespace.target` |
| `scaleRatio` | largest subject side ÷ smallest mark, fragment or rhythm point | below 12 (SKL-7) |
| `flowLength`, `flowHits` | path length in canvas diagonals; whether the curve passes through each rank-1 and rank-2 subject box | shorter than 0.8 diagonals; a ranked subject missed (FLW-2) |
| `interweave` | lines, horizons, rings, container and bars that cross the rank-1 subject box | fewer than 2 (SKL-11) |
| `densest`, `emptyCells` | share of element centres in the fullest 3×3 cell; empty cells | fullest cell below 0.3 or no empty cell (SKL-12) |
| `overflowOk` | closers (bars, frames, container) crossed decisively by some element | none crossed (SKL-6) |
| `softCount`, `marks`, voice per band | budgets | soft ≠ 1 (TEX-2); marks outside 3–7 (SKL-8); voice > 2 per band (TYP-5) |

A warning is a question for review, never an instruction to fill a visual quota. Answer it in the spec or record the deviation in the brief (GOV-3); never silence it by moving a number that the composition needs.

## From spec to build

The spec's numbers are the build's numbers. `lines` → `compose.mjs lines --angle --count --perp`; `rhythm` → `compose.mjs dots --path --count --ratio --start`; `rings` → `compose.mjs rings`; `trail` → `compose.mjs flock` or hand-placed fragments along the same path; subject boxes → the placed asset's box; type boxes → the type zones; `soft` → the ribbon's box. After the build, `overlay` draws the locked skeleton and flow over the screenshot so the sketch and the render can be compared side by side (VER-5).
