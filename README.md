# KCL · Kasidia's Concept Law

KCL is a graphic-composition skill for web pages whose purpose is presence rather than task UI: key visuals, concept pages, exhibition and campaign pages, scroll-driven visual essays. It encodes the plane-composition idiom (平面构成) as a cast of roles, a color discipline, a material rule, three layout archetypes and a flat finish, so a page in any hue and on any subject carries the same conviction.

KCL is the graphic sibling of kasidia-frontend-law. KFL governs interfaces; KCL governs pictures made of markup. A page with both hands its controls to KFL and its field to KCL.

## What the idiom is

| System | The rule in one line |
| --- | --- |
| Skeleton (骨架) | Rhythm points, construction lines that exit the canvas, dividing planes, one container, decisive overflow, 1:12 scale contrast, mute punctuation, fragments shed along the path, apparatus through the subject, one dense core and air. |
| Flow (动线) | Entry, path through the first subject, numbered stations, exit; drawn in red on the sketch and still present in the build. |
| Color (色彩纪律) | Two grounds, one signal. Mono or Duotone. The hue is free; the budget is not. |
| Material (素材) | Photographs lose their midtones: threshold, dither, halftone, line, silhouette, negative. Two processing levels make depth. |
| Imagery (意象) | A subject from one register held by an apparatus from another, stated as one tension line. |
| Layout (版式) | Scroll Bands, Icon Center or Asymmetric Grid, with reflow by rule and a quiet zone for prose. |
| Type (字) | Plane type, mark type, voice type. Nothing else. |
| Finish (质感) | One overlay, one soft element, otherwise flat. |
| Motion (动) | Infinite loops only, three tempos, a budget of three moving systems per stage, transform and opacity, paused under reduced motion. |

Principles in the order they are decided (hierarchy, balance, alignment, proximity, flow, repetition, contrast, white space, color): [references/principles.md](references/principles.md). Rules with IDs and levels: [references/grammar.md](references/grammar.md). The composition spec and sketch tool: [references/spec.md](references/spec.md). Archetypes with proportions and reflow: [references/archetypes.md](references/archetypes.md). Web recipes: [references/cookbook.md](references/cookbook.md). Asset pipeline (source, cutout, trim, tone, reduce) and licensing: [references/assets.md](references/assets.md). Motion vocabulary and recipes: [references/motion.md](references/motion.md). Review: [references/review.md](references/review.md).

## Workflow

Load → Imagery (tension, motifs, fragments, hue) → Spec (`kcl-spec.json`, principles in order, flow, weights) → **Sketch approved by the user**, on the wireframe or live in the Studio → Brief (assets, type, finish) → Assets → Build from the spec (a fixed plate is rendered straight from it) → Verify by screenshot, pixel measure, sketch overlay and audit → Report. Composition is locked before pixels; a change to imagery, composition or flow goes back to the sketch. See [SKILL.md](SKILL.md).

## Tools

- `tools/kcl-render.mjs` + `tools/plate.mjs`: the final renderer. One ES module turns a `spec-v2` into the finished SVG (weight ladder, assets with processing levels, anchors to subject anatomy, type roles, finish) for the Studio, the CLI and screenshots; `plate.mjs` renders, migrates, checks structure, screenshots through Playwright, measures pixels and reads asset anatomy.
- `tools/studio/`: KCL Studio, a loopback web canvas. The human watches the final render update as the model edits the spec, toggles layers, skeleton, flow, grid and the 3×3 heat, compares against reference images side by side, and drags elements, boxes and flow points; every edit is written back to the spec file, which stays the single source of truth.
- `tools/sketch.mjs`: renders a spec as a wireframe sketch (masses, skeleton, type zones, signal, the red flow), checks its numbers, lays candidates side by side and overlays the locked skeleton on a screenshot.
- `tools/compose.mjs`: construction lines, rhythm points, stars, radial bursts, rings, orbits, ridges, flocks and contours as SVG.
- `tools/process_image.py`: cutout (flood, color key, luma), crop, trim, tone and reduction of photographs or generated images, with hard-edged alpha and knockout output for blend compositing.
- `tools/audit_canvas.py`: signal, midtone, hue-cluster and soft-edge diagnostics for a screenshot.
- `tools/motion_check.sh`: two frames three seconds apart, with the changed fraction and bounding box, to prove loops run and stay in their regions.

The skill names no image-generation tool. Generated assets come from whichever tool the session or team provides, then pass through the same pipeline.

## Examples

Three original pages on the no-asset path, one per archetype, each in a different signal hue, each with infinite loops within the motion budget:

| File | Archetype | Mode | Signal |
| --- | --- | --- | --- |
| `examples/scroll-bands.html` | Scroll Bands | Mono | vermilion on cream |
| `examples/icon-center.html` | Icon Center | Duotone | emerald and deep teal on near-black |
| `examples/asymmetric-grid.html` | Asymmetric Grid | Mono | cadmium yellow on bone |

`examples/scroll-bands.kcl-brief.md` is the filled brief for the first page. `examples/tide-heron.kcl-spec.json` is a complete composition spec with flow, and `examples/tide-heron.sketch.svg` is its rendered sketch, the artifact the user approves before any asset or build work.

## Originality

The skill stores no reference artwork. Its grammar was distilled from study of the idiom; every example is an original composition built from procedural geometry and type. Assets used with the skill must be owned, licensed, generated for the page or public domain, with sources recorded in the page's brief.
