# KCL tools

Dependency-light tools. Node 18+ for the `.mjs` tools; Python 3 with Pillow for the two image tools; an installed Playwright (the global `playwright` package with Chromium, or `KCL_PLAYWRIGHT=<dir with node_modules>`) for screenshots and the pixel measure. Run image tools with `python3 -I` and keep input and output in scratch directories outside the skill.

## Hybrid materials and compatibility

Set `artDirection.mode: "hybrid"` for new mixed illustration/material compositions. Missing mode keeps reduced diagnostics; `reduced` selects them explicitly. Hybrid renders preserved color/alpha and does not enforce legacy weight/echo/softness/paper quotas. Numbers remain descriptive. Checks still report pending materials, duplicate IDs and missing clip targets; invalid material geometry is rejected.

Use `kind: "material"` for supporting images: `src`, positive `box`, `fit: contain|cover|stretch`, `align: [0|0.5|1, 0|0.5|1]`, `opacity`, `blend`, `rotate`, optional `clip`, `layer` and opt-in `tint`. Source resolves through existing asset/inline export mechanisms; default layer is plane. The image keeps its original RGB unless tinted. A missing source is a visible placeholder, not a finished asset.

`process_image.py --mode preserve` retains RGB and fractional alpha through trim/resize; its legacy default remains threshold, so pass the mode explicitly. `--alpha auto|preserve|hard` controls existing alpha; auto preserves for preserve mode and uses historical hard masks for reduction. Explicit hard binarizes output alpha. `preserve --knockout` is rejected. These are basic cutouts, not semantic matting.

## kcl-render.mjs

The final renderer, shared by the Studio, `plate.mjs` and the tests. `renderAll(spec, { assets, resolve })` returns the normalized spec, the plate SVG, the wire overlay and the structural check; `migrateSpec` lifts v1 to v2; `normalizeSpec` resolves anchors and `along`; `renderPlate(spec, { layers, extra, id })` draws the layers of SKL-1 at the weights of SKL-14, including the richness kinds `field`, `sweep`, `ticks`, `arc`, `glyphs`, `blob`, `ribbon`, `tag` and `grid`, subject echoes with per-level `box`, `scale`, `rotate` and `mirror`, and level clips in canvas space; `wireOverlay` draws skeleton, landmarks, flow, stations and the optional grid; `checkStructure` reports weight rungs, solid plane, signal carrier, MAT-7, series and SKL-16 richness warnings. Mode-aware checks avoid imposing these reduced-style heuristics on hybrid materials. No dependencies; runs in Node and in the browser.

## plate.mjs

| Command | Does |
| --- | --- |
| `render spec.json -o out.svg [--inline] [--wire] [--layers a,b] [--root dir]` | final SVG; `--inline` embeds assets and fonts as data URIs; `--root` resolves `assets/…` from another folder than the spec's |
| `migrate spec.json [-o out.json]` | spec-v1 → spec-v2 with explicit weight, fill and ink |
| `check spec.json [--json]` | structure checks: ≥ 3 weight rungs, a solid plane, a signal carrier, MAT-7 bounds, richness and order, line kinship (centres, axis, families, gestures, the face), series variation |
| `shot spec.json -o out.png [--scale 2] [--wire] [--layers …] [--root dir] [--url http://127.0.0.1:4777]` | screenshot through Playwright; starts a loopback server when no `--url` is given |
| `measure spec.json [--json] [--root dir]` | four layered screenshots → coverage, 3×3 grid, stroke-weight histogram, signal blob, apparatus-over-subject (VER-6) |
| `anatomy asset.png [--mode alpha\|luma] [--thresh 0.5]` | bbox, centroid, top point, principal axis, five mass bands of a cutout, normalized for `subject.anatomy` |

## studio/server.mjs

```sh
node tools/studio/server.mjs /abs/docs/page.kcl-spec.json --port 4777 --refs /abs/references [--root /abs/project]
```

Serves the Studio on loopback: `/` the canvas, `/plate` a bare render for screenshots, `/api/spec` (GET, PUT with history in `.kcl-history/`), `/api/state` (change signature the page polls), `/api/refs`, `/api/measure`, `/api/shot`. Assets resolve relative to the spec's folder (or `--root`) and never outside it. The page shows the final render with skeleton, flow, grid and 3×3 heat overlays, per-layer toggles, an element list and inspector, reference images side by side, and drag/resize/nudge editing that writes back to the spec. Nothing is stored in the browser; the spec file is the state.

## sketch.mjs

Draws, checks and compares the composition spec (`kcl-spec.json`, format in [spec.md](../references/spec.md)). Output is SVG; screenshot it with Playwright to look at it or show it.

| Command | Does |
| --- | --- |
| `render spec.json -o out.svg [--grid] [--no-flow] [--scale n]` | wireframe sketch: masses, bars, container, line family, rings, rhythm points, fragment trails, signal marks, an optional soft element, type zones, quiet zone, the red flow with entry, arrows, stations and exit, plus a legend of the recorded principles and check results |
| `sheet a.json b.json [c.json] -o sheet.svg` | candidates A/B/C side by side for the user to choose |
| `check spec.json [--json]` | whitespace, scale ratio, flow length and coverage, interweave, 3×3 density, overflow, soft/mark/voice budgets, with warnings |
| `overlay spec.json shot.png -o overlay.svg` | the locked skeleton and flow drawn over a screenshot (VER-5) |


## compose.mjs

Generates SVG snippets for the System layer and for no-asset subjects. Prints a `<g>`; add `--full WxH` to wrap it in an `<svg>`, `--indexed` to give every child `style="--i:N"` for staggered motion. Common flags: `--box 1440x900`, `--stroke`, `--fill`, `--width`, `--seed`.

| Command | Role | Key flags |
| --- | --- | --- |
| `lines` | construction lines (SKL-3) | `--angle 27 --count 3 --perp 1 --horizon 0.62 --dash` |
| `dots` | rhythm points (SKL-2) | `--path "x,y x,y"` or `--arc "cx,cy,r,a0,a1"`, `--count --ratio --start --jitter --reverse` |
| `stars` | punctuation (SKL-8) | `--at "x,y x,y" --size 14 --sharp 0.1 --vary` (astroid: concave sides, thin waist) |
| `radial` | burst between radii | `--center --inner --outer --count --every --extra` |
| `rings` | concentric circles | `--center --radii 270,300,330 --dash "0,4 8,0"` |
| `orbit` | tilted base ellipse | `--center --rx --ry --tilt` |
| `ridge` | mountain/coast silhouette | `--base 0.68 --amp 0.28 --octaves 4 --freq 2.2 --seed` |
| `flock` | bird glyphs along a curve | `--curve "x,y x,y x,y" --count --min --max --spread --seed` |
| `contours` | topographic rings | `--center --count --inner --outer --amp --seed` |

## process_image.py

Pipeline: load → rotate/flip → crop → cutout → trim/pad → tone → scale → reduce → export.

```sh
python3 -I process_image.py gen.png --cutout flood --tol 40 --trim --pad 24 --mode threshold --level 0.55 --knockout -o out.png
python3 -I process_image.py photo.jpg --crop 12%,0,60%,100% --cutout luma --key dark --tol 70 --erode 2 --keep-largest --trim --mode halftone --cell 5 --knockout -o out.png
```

- Cutout: `--cutout flood|color|luma` with `--key` (`#hex` for color; `light`/`dark` for luma) and `--tol`; mask cleaning `--despeckle`, `--erode`, `--keep-largest`. Mask hardness is explicit; preserve mode retains existing fractional alpha. Basic color/flood removal still creates a binary removal mask.
- Geometry: `--rotate`, `--flip h|v`, `--crop x,y,w,h` (px or %), `--trim`, `--pad`, `--scale`, `--max`.
- Tone: `--levels lo,hi`, `--contrast`, `--gamma`, `--blur-pre`.
- Reduce: `--mode preserve|threshold|dither|halftone|line|silhouette|negative|posterize|duotone` with `--level`, `--cell`, `--stagger`, `--thick`, `--blur`, `--levels-n`, `--ink`, `--paper`, `--knockout`.

## audit_canvas.py

```sh
python3 -I audit_canvas.py shot.png --signal "#ff3b1f" --paper "#f3efe6" --ink "#111111" --json report.json
```

Prints signal, paper, ink and midtone fractions, chromatic hue clusters and a soft-edge estimate. Read them with [review.md](../references/review.md). Exit code is always 0 on a readable image; the numbers are diagnostics, not a verdict.

## motion_check.sh

```sh
bash motion_check.sh /abs/page.html /abs/out-dir 1440,900 [--full-page]
```

Two frames three seconds apart; prints the changed-pixel fraction and bounding box. Loops should change a small region; zero means they are not running; page-wide means the overlay or a layout property animates.

## Tests

```sh
cd tools && node --test tests/*.test.mjs && bash tests/smoke.sh && python3 -I tests/process_image_test.py
```
