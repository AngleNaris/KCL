---
name: kasidia-concept-law
description: "KCL, Kasidia's Concept Law: compose graphic, art-directed web pages in the plane-composition idiom. Point/line/plane skeletons, strict two-ground-one-signal color, photographs reduced to threshold/dither/halftone/line, classical or natural subjects measured by a systemic apparatus, type used as plane or mark, flat finish with one soft element. Use for key visuals, concept pages, campaign or exhibition pages, poster-like heroes, scroll-driven visual essays and any page whose purpose is graphic presence rather than task UI. Not for dashboards, forms, admin panels or interaction-heavy product UI; use kasidia-frontend-law there."
---

# KCL · Kasidia's Concept Law

KCL builds pages that work as graphic compositions first. Its material is the vocabulary of plane composition (平面构成): rhythm points, construction lines, dividing planes, containers, overflow, fragments, scale contrast, a flow for the eye and a single signal color, applied to reduced photographic subjects and typography. The principles (hierarchy, balance, alignment, proximity, flow, repetition, contrast, white space, color) are in [references/principles.md](references/principles.md) in the order they are decided; the rules with stable IDs and requirement levels are in [references/grammar.md](references/grammar.md). A page is specified twice: `kcl-spec.json` holds the geometry and flow and is drawn as a sketch for approval ([references/spec.md](references/spec.md)); `kcl-brief.md` from [the template](references/brief-template.md) holds the reasons, assets, gates and verification state.

KCL is a graphic discipline, not a UI discipline. It does not apply interaction, accessibility or component contracts; a page that also needs working controls hands those regions to kasidia-frontend-law and keeps KCL for the graphic field.

## Governing order

1. **Follow the latest explicit user intent, then the recorded concept brief, then KCL defaults.** A brief decision stands across turns; do not reopen it as an exception every time.
2. **Prioritize concept tension → skeleton and flow → material → type → finish.** Finish never rescues a weak skeleton. If a page looks wrong, fix the layer closest to the skeleton before touching texture or color.
3. **Numbers in the rules are defaults, not laws.** Deviate with a concrete compositional reason recorded in the brief. A deviation is a choice, never a failed measurement relabeled as a pass.
4. **Originality is required.** References teach grammar and are never copied or stored in this skill. Every photographic asset is user-owned, licensed, generated for the page or public domain, and its source is recorded in the brief.

## Four standing orders

1. **State the tension before drawing.** Every page has a one-line tension (IMG-1): a subject from one register held by an apparatus from another. No tension, no page.
2. **Reduce before adding.** A composition with two subjects and a decisive scale gap beats one with six. When the page feels empty, raise scale contrast or add a construction line, not another subject.
3. **Look at the real render.** A composition exists only as a screenshot at its designed canvas. Inspect it against [review.md](references/review.md) before reporting completion. No screenshot, no completion.
4. **Sketch before pixels.** Imagery, composition and flow are locked in a spec, drawn as a sketch and approved by the user before any asset is generated or any page built (GOV-6). No approved sketch, no build.

## Workflow

Composition is locked before pixels (GOV-6). The spec is filled in the order of [principles.md](references/principles.md), drawn as a sketch by `tools/sketch.mjs`, approved by the user, and only then given material.

| Stage | Output | Gate |
| --- | --- | --- |
| 0 Load | Read this file, grammar.md and principles.md in full. Find an existing `kcl-brief.md` and `kcl-spec.json` next to the page or in `docs/`. | Scope, existing brief, spec and assets identified |
| 1 Imagery (意象) | Tension line, registers, apparatus, motifs, fragments, voice words, archetype, color mode, hue | User confirms, or the request already fixes them; may be merged with stage 3 when the theme is given |
| 2 Spec (构图 · 动线) | `kcl-spec.json`: hierarchy → weighting → alignment → proximity → flow → repetition → contrast → white space → color, every element with coordinates; `sketch.mjs check` warnings answered | Check read; every warning answered or recorded as a deviation |
| 3 Sketch (草图) | `sketch.mjs render` (or `sheet` for 2–3 candidates) → screenshot → inspected by you → shown to the user; or the Studio, where the user watches the final render and may drag elements | **User approves a sketch.** The approved spec is the baseline |
| 4 Brief | `kcl-brief.md` from the template: assets with sources, type, finish, gates, decisions | Brief covers every layer; licensing recorded |
| 5 Assets | Subjects through the pipeline in assets.md: source, cutout, trim, tone, reduce | Hard-edged, midtone-free assets with recorded origin (MAT-1, MAT-3, GOV-4) |
| 6 Build | A fixed plate is rendered from the spec by `plate.mjs render` / the Studio (weights, assets, type, finish all from the spec); a page or component takes its geometry from the same spec, layers in the order of SKL-1, procedural layers via `tools/compose.mjs`, loops per motion.md | Renders at the designed canvas |
| 7 Verify | Screenshots at the designed canvas and one narrow width; `plate.mjs measure` (VER-6); `sketch.mjs overlay` or `plate.mjs shot --wire`; `audit_canvas.py` for pages; `motion_check.sh` when loops exist; review.md | Required checks pass with evidence; locked elements in place or deviations recorded (VER-5) |
| 8 Report | What was built, tension, archetype, flow, palette, what was verified and what was not | No unverified claim |

### Stage 1: Imagery

Resolve these from the request before asking anything; ask only what materially changes the page:

1. **Purpose and canvas.** Key visual at a fixed stage, scroll-driven essay, or grid-based editorial page. See [archetypes.md](references/archetypes.md).
2. **Tension.** Subject register and apparatus register (IMG-1, IMG-2). Propose one in a sentence; a user-supplied theme is enough to propose it.
3. **Motifs and fragments.** The few things that may recur, and which parts of them may shed and travel along the flow (SKL-10).
4. **Color mode and signal hue.** Mono or Duotone (COL-3); the hue is free (COL-4). Offer two or three hues with a recommendation if the user has not chosen; do not default to blue because the idiom is often seen in blue.
5. **Assets.** What the user supplies, whether generation is allowed, or the no-asset path (see [assets.md](references/assets.md)). Asset work starts only after stage 3.
6. **Text.** Which words are part of the artwork: title, marks, and the one or two voice sentences (TYP-1). Bilingual pairing if wanted.

When the user has not selected a direction for a new page, present two or three concepts with a tension line and hue each, with a recommendation. When the theme is already given, carry the concepts straight into stage 3 and let the sketches present them: one sheet, two or three candidates, one recommendation.

### Stage 2: Spec

Write `kcl-spec.json` per [spec.md](references/spec.md), answering the principles in order. Every subject, bar, container, line family, rhythm path, fragment trail, mark, the one soft element, every type zone and the quiet zone gets coordinates on the designed canvas. Then the flow: entry, path through the first subject and every ranked station, exit (FLW-1, FLW-2). Run:

```sh
node tools/sketch.mjs check /abs/docs/page.kcl-spec.json     # geometry: flow, interweave, density, budgets
node tools/plate.mjs  check /abs/docs/page.kcl-spec.json     # structure: weight rungs, solid plane, signal carrier
```

Answer each warning in the spec or record it as a deviation with a reason in the brief. Do not move a number the composition needs to make a warning disappear. Write `spec-v2`: every apparatus element with `weight`, `fill` and `ink` (SKL-14), rings and lines anchored to subject landmarks, fragments `along` the flow, and the series' `variesBy` when the plate belongs to one.

### Stage 3: Sketch

```sh
node tools/sketch.mjs render /abs/docs/page.kcl-spec.json -o /abs/scratch/page.sketch.svg
node tools/sketch.mjs sheet /abs/docs/a.kcl-spec.json /abs/docs/b.kcl-spec.json -o /abs/scratch/sheet.svg
npx playwright screenshot --viewport-size=1600,1300 "file:///abs/scratch/page.sketch.svg" /abs/scratch/page.sketch.png
```

Or run the Studio and look at the final render instead of the wireframe (VER-7):

```sh
node tools/studio/server.mjs /abs/docs/page.kcl-spec.json --port 4777 --refs /abs/references   # the user opens http://127.0.0.1:4777
node tools/plate.mjs shot /abs/docs/page.kcl-spec.json -o /abs/scratch/page.png --wire          # what you look at
```

The Studio draws the spec as the finished plate with skeleton and flow overlaid, refreshes when the file changes, and lets the user drag elements, resize boxes and move flow points; every drag is written back to the spec (a copy of the previous version goes to `.kcl-history/`). Re-read the spec after the user has touched it, then continue from the file, not from memory. Subjects without assets draw as hatched placeholders, so weight and mass are judged before any image exists.

Before the first look, make the plate full the way the references are full (SKL-16, SKL-17): the skeleton of container, lines and rings is a start, not a plate, and a pile of small pieces is not a plate either. Decide the one or two ordered systems (one shape, one large path, one size rule: phases on an ellipse, a loop of dots, a tick fan from one centre), the one organic or textured plane, the subject's echo, and the few lines that connect them; then place them by the flow and the weighting and look. Draw each piece as well as a human would draw it once: a star is an astroid cluster on the axis, not a sprinkle of sparkle glyphs; a band carries one texture or one cropped fragment, not three copies of the figure. Then make the lines kin (SKL-18): one centre on the subject, one axis declared in the spec, every arc concentric, every line parallel, perpendicular, radial or tangent, one gesture along the axis; `plate.mjs check` names the orphan line, the near-relation and the free centre, and those are the next edits, not notes for the brief. `plate.mjs check` reports the systems, the scattered families, the line and type counts; `plate.mjs measure` reports paper (under 72%) and the densest ninth (over 40%). A paper or richness warning is not a deviation to write into the brief; it is the next change to the spec, or a question to the user if the user asked for a sparse plate. The numbers describe the references; the judgement is yours.

Look at the PNG before showing it: masses, weighting, the red flow through the subject, the dense core and the air, the single soft element, the type zones. Then show it to the user with the tension line, the flow in one sentence (where the eye enters, pauses, leaves) and the check numbers that matter, and wait. The user approves, chooses a candidate, or asks for a change; a change is made in the spec and re-sketched, not described in prose. Record the approval in `gates.sketch` and in the brief. A sketch shows skeleton, masses and flow, not material or texture; do not promise those in the sketch and do not defend a sketch with them.

### Stage 4: Brief

Write `kcl-brief.md` from [brief-template.md](references/brief-template.md), pointing at the approved spec. The brief carries assets with sources, type, finish, motion, the gate table, decisions and verification; the spec carries the geometry. Build from both, not from improvisation.

### Stage 5: Assets

Follow the pipeline in [assets.md](references/assets.md): source → inspect → cutout → crop/trim → tone → reduce to levels → place → record.

- **Source.** User-supplied, generated, public domain or procedural. For generation, use whichever image tool the current session or team provides; KCL names none. Request one subject per image, in the register's technique, on a plain or transparent background, and inspect every output before using it. Generate to the approved subject box: pose, facing and crop are read off the sketch.
- **Cutout, crop, trim, tone.** `tools/process_image.py` does flood, color-key and luma cutouts with mask cleaning, crop and rotate, trim with padding, levels, contrast and gamma, all with hard-edged alpha (MAT-3).
- **Reduce.** The same source yields its two processing levels (MAT-2) and its fragments (SKL-10): silhouette plus line ghost, or threshold plus halftone, exported ink-on-transparent for blend compositing (MAT-6).
- **Procedural.** Columns, ridges, flocks, contours, rings and halos come from `tools/compose.mjs` or hand-authored SVG. This path never blocks on missing assets.
- **Anatomy.** `node tools/plate.mjs anatomy asset.png` gives bbox, centroid, top, axis and mass bands; record them with the eye, hand or collar landmarks in the subject's `anatomy`, then anchor rings, lines and marks to those landmarks instead of to the box.
- **Rendered characters.** When the user keeps an illustrated character's rendering, follow MAT-7: the face is the one soft element, the second level is opaque and offset (or clipped), a line-weight apparatus crosses the body, fragments are the character's own material.

### Stage 6: Build

For a fixed plate (poster, key visual, series), the render *is* `node tools/plate.mjs render spec -o plate.svg --inline` or `plate.mjs shot` at `--scale 2`; the Studio shows the same render. Change the spec, look, change again (VER-7); never build the plate a second time in hand-written SVG. For a scroll page or a component, use the layer stack of SKL-1, the tokens of COL-1 and the recipes in [cookbook.md](references/cookbook.md). Take every coordinate from the spec: line families, rhythm paths, rings, subject boxes, fragment trails, marks, the soft element, type zones. Prefer one self-contained HTML file with inline SVG for a new page; split into a component only when the page enters a framework project. Keep runtime filters on small elements and preprocess everything photographic.

Add motion as infinite loops per [motion.md](references/motion.md): at most three moving systems per stage, glacial rotation and drift, slow breathing, one quick loop at most, transform and opacity only, paused under reduced motion. Generate System geometry with `--indexed` when loops need staggering.

### Stage 7: Verify

```sh
node tools/plate.mjs measure /abs/docs/page.kcl-spec.json          # VER-6, fixed plates
node tools/plate.mjs shot /abs/docs/page.kcl-spec.json -o /abs/scratch/page.wire.png --wire
npx playwright screenshot --viewport-size=1440,900 --full-page "file:///abs/page.html" /abs/scratch/page-1440.png
npx playwright screenshot --viewport-size=768,1100 --full-page "file:///abs/page.html" /abs/scratch/page-768.png
node tools/sketch.mjs overlay /abs/docs/page.kcl-spec.json /abs/scratch/page-1440.png -o /abs/scratch/page.overlay.svg
npx playwright screenshot --viewport-size=1440,900 "file:///abs/scratch/page.overlay.svg" /abs/scratch/page.overlay.png
python3 -I tools/audit_canvas.py /abs/scratch/page-1440.png --signal "#ff3b1f" --paper "#f3efe6" --ink "#111111"
bash tools/motion_check.sh /abs/page.html /abs/scratch 1440,900
```

Read the screenshots. Read the measure in the order review.md gives: weight rungs present, apparatus over the subject, the signal blob, the 3×3 grid, then paper and midtone; paper over 72% or a densest ninth under 40% sends the plate back to enrichment (SKL-16), not into the deviation list. Read the overlay: the red flow should run through the built subject as it ran through the sketched box; bars, container and stations should sit where they were approved (VER-5). Walk [review.md](references/review.md): the fourteen tells, then the ID checklist. The audit numbers are diagnostics for COL-2 and MAT-1 only; they do not judge composition. When the page has loops, the motion check must show change confined to the intended regions, and its later frame is inspected like any screenshot (VER-4). A missing browser leaves visual checks **not tested**; say so and do not claim completion.

### Stage 8: Report

Lead with the page and its tension, archetype, flow, mode and hue. List the approved sketch and its date, what was screenshotted at which widths, the overlay result, the audit numbers, deviations from the sketch and from defaults with their reasons, assets with sources, and anything not verified.

## Stop and ask

Pause only the dependent work when the tension or direction is unresolved for a new page, at the sketch gate until the user approves or chooses (asset generation and build wait; procedural experiments in scratch may continue), when an asset's license is unknown and no substitute exists, when the request needs working UI inside the composition (hand that part to kasidia-frontend-law), or when a change would replace a confirmed brief decision the current request does not reopen. Routine compositional choices are yours; record them in the brief.

## Resume

Read the brief, its gate table and decision log, and the spec. Continue from the recorded stage. An approved sketch stays approved across sessions; reopen it only on new user intent or concrete evidence from the render, and only for the affected region, by changing the spec and re-sketching that region.
