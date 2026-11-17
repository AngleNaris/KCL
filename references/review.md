# KCL review

Use after the page renders. Open the real screenshots at the designed canvas and the narrow width. Walk the tells first; they catch most failures in seconds. Then run the ID checklist for the record.

## The tells (十四病)

A page with any of these is not finished, regardless of what the audit numbers say.

1. **Medium crowd (中景堆积).** Many elements of similar size and no decisive scale gap. Fix at SKL-7: enlarge one, shrink or remove the rest.
2. **Surviving midtones (中间调残留).** A photograph still has gray gradients or a color cast. Fix at MAT-1: reprocess.
3. **Timid overflow (怯溢).** An element nicks a bar or frame by a few pixels. Fix at SKL-6: push it a fifth out, or pull it fully in.
4. **Dead-end lines (断线).** A construction line stops inside the canvas. Fix at SKL-3: extend to the edges or delete.
5. **Second hue (串色).** A second accent hue, a pastel, a gradient or a glow appeared. Fix at COL-5.
6. **Shadowed flatness (假平).** A drop shadow, glass panel, bevel or bloom. Fix at TEX-4.
7. **Centered bands (居中病).** In Scroll Bands, every subject is centered and the horizon never moves. Fix at the archetype's anchor alternation.
8. **Marketing voice (广告腔).** Calls to action, slogans, "explore", "discover", feature bullets. Fix at IMG-5: cut, or rewrite as declaration or archive.
9. **Literal marks (图标病).** Stars that became icons, arrows that mean scroll, pictograms. Fix at IMG-4.
10. **Metronome rhythm (等距).** Rhythm points of equal size or equal spacing on a curve; marks spread evenly. Fix at SKL-2 and SKL-8.

Four tells that machine-made pages in this idiom fail most often, learned from comparing test output against working pages:

11. **No path (无动线).** Elements sit in their zones and the eye has nowhere to go; or the path runs beside the subject instead of through it. Fix at FLW-1 and FLW-2, in the spec, then re-sketch.
12. **Even spread (匀质).** Every region is moderately busy; no knot, no air; fragments and marks distributed evenly. Fix at SKL-12 and SKL-10: gather the marks into one core, let the fragments thin away.
13. **Juxtaposition (并置).** The subject and the apparatus are both present but merely side by side: no line crosses the body, no ring holds it, no bar runs behind it. Fix at SKL-11.
14. **Sketch drift (草图失真).** The render moved a locked subject, bar, container or station without a recorded reason. Fix at VER-5: overlay, then move the render or record the deviation.

Four tells learned from a rendered-character series that passed every box check and still failed:

15. **Hairline apparatus (发丝装置).** Rings, frames and lines all at one thin weight and partial opacity; the apparatus decorates instead of measuring. Fix at SKL-14: three rungs and one solid plane.
16. **Signal on punctuation only (信号仅标点).** The red lives in a few 12px stars; at arm's length the plate is monochrome. Fix at COL-6: give the signal one carrier larger than a mark.
17. **Portrait plus title (立绘＋大字).** A rendered character, a large title and faint ornament, each in its own zone; nothing crosses the body, the second level is an 8% ghost. Fix at MAT-7 and SKL-11: a line-weight apparatus through the figure, an opaque offset line level, fragments from the figure's own material.
18. **Series clones (系列同模).** Plates that swap the subject and title but keep the skeleton. Fix at SER-1: vary container, weighting or flow per plate and record it.

One tell learned from the next series, which passed the eighteen above and still looked unfinished:

19. **Empty plate (空版).** The plate measures over 72% paper or its densest ninth under 40%; the character, a title and a few rings float in blank paper, and the brief records the measure's warning as a deviation. Fix at SKL-16: a textured field, an echo of the subject at a second size and level, ticks, a dotted arc, glyphs along the flow, tags and a grid, placed by the flow and the weighting; then measure again. An emptiness warning on a fixed plate is work left, not a deviation the model records on its own.

And one learned from the plate that answered tell 19 by adding things:

20. **Scatter (散乱).** Many small families at once, each jittered, each on its own short path; rectangles of different patterns dropped around the canvas; seven lines crossing; eight pieces of type. Every count is high and nothing has a rule. Fix at SKL-17 and SKL-16: keep one or two systems and run each along one large path with even spacing or a monotonic size step; merge the rectangles into one organic plane or one band; cut the lines to those that connect; cut the type to title, one voice line and a mark.

Two learned from a second machine-made series, well drawn piece by piece and still messy:

21. **Orphan lines (孤线).** Arcs with their own centres, diagonals at two angles, a sweep crossing the rings at a third angle, an ellipse tilted a little away from the family, each drawn well and none related. Fix at SKL-18: one centre, one axis; re-anchor the arcs to the centre, tilt the ellipses to the axis, run the one gesture along it, and let the fragments ride the same path. `plate.mjs check` names the orphan, the near-relation and the free centre.
22. **Double exposure (重影).** The line level of the figure shifted a few dozen pixels from the rendered one, a blue ghost around the hair and the sleeves, read as misregistration. Fix at MAT-7: clip the second level to a column or window, knock it out inside a plane, or scale it into an echo; and ask whether the figure should have been reduced in the first place.

Two softer tells worth a second look: a soft element that is not alone (TEX-2), and a plane type that is merely large rather than cut, clipped or stretched (TYP-1).

When the page moves, two more: **restless page (多动)**, more than three loops per stage or a quick loop that is not alone (MOT-3, MOT-4); and **wandering element (漂移)**, a loop whose extreme leaves the composition different from its steady state (MOT-2).

## ID checklist

| ID | Check | Level |
| --- | --- | --- |
| GOV-6 | Spec and sketch approved before assets and build; later changes to imagery, composition or flow re-sketched | required |
| IMG-1 | Tension line recorded and visible in the render | required |
| IMG-2 | Subject and apparatus both legible at a glance | required |
| SKL-1 | Layers exist in the stated order and are separable in the DOM | required |
| SKL-6 | Each band/frame has a decisive overflow | required |
| SKL-11 | At least two apparatus elements pass through or behind the first subject | required |
| FLW-1, 2 | A flow is recorded; it passes through the first subject and every ranked station | required |
| COL-1 | Only role tokens are used | required |
| COL-3 | One mode per stage; switches only at bars | required |
| COL-5 | Nothing forbidden present | required |
| MAT-1 | No midtone photograph outside the Duotone exception | required |
| MAT-3 | Cutouts hard-edged | required |
| IMG-4 | Marks mute | required |
| IMG-5 | Copy in the designer's voice | required |
| TYP-1 | Only plane, mark and voice roles | required |
| TYP-4 | Apparatus text real or declared fiction | required |
| TEX-2 | Exactly one soft element | required |
| TEX-4 | Flat finish | required |
| VER-1 | Screenshots at designed and narrow canvas inspected | required |
| MOT-1, 2, 6 | Loops only, composition intact at extremes, transform/opacity only | required |
| VER-4 | Motion check run and later frame inspected (when loops exist) | required |
| VER-5 | Sketch overlay on the screenshot inspected; locked elements in place or deviations recorded | required |
| SKL-14 | Apparatus uses three weight rungs and one solid plane | required |
| COL-6 | Signal has a carrier larger than a mark | required |
| MAT-7 | Rendered-character exception bounded: face is the soft element, opaque second level, line-weight crossing, own-material fragments | required when used |
| VER-6 | Pixel measure run after assets are placed; numbers interpreted | required |
| VER-7 | Composition iterated against the final render (Studio or shot), not a wireframe | required |
| SER-1 | Series plates vary by skeleton and record it | default |
| SKL-2, 3, 4, 5, 7, 8, 9, 10, 12, 13 | Skeleton defaults followed or deviation recorded | default |
| FLW-3, 4 | Stepping stones along the path, exit off the canvas | default |
| COL-2, 4 | Signal budget and hue choice | default |
| MAT-2, 4, 5, 6 | Processing levels, preprocess, registers, ink compositing | default |
| LAY-2, 3, 4 | Quiet zone, reflow rule, edge discipline | default |
| TYP-2, 3, 5 | Pairing, distortion, sparse voice | default |
| TEX-1, 3 | One overlay, chromatic split bounds | default |
| MOT-3, 4, 5, 7, 8 | Tempos, budget of three, desynchronized, no bounce, reduced motion | default |
| VER-2 | Audit numbers recorded and interpreted | advisory |
| TYP-6 | Open-licensed faces, CJK subset | advisory |

## Reading the sketch check

`tools/sketch.mjs check` runs on the spec, before anything is built, and prints whitespace, scale ratio, flow coverage, interweave count, 3×3 density, overflow, soft and mark budgets. Its warnings are questions for the sketch round (see [spec.md](spec.md)); a warning silenced by moving a number the composition needs is a defect with better statistics.

## Reading the pixel measure

`tools/plate.mjs measure` screenshots the plate four times (full, subject only, apparatus only, signal only) and compares them. Read it in this order: `apparatus.classesPresent` (are there three rungs and a plane?), `interweave.apparatusOverSubject` (does anything cross the body?), `signalBlobPx` (is the signal a carrier or confetti?), the 3×3 grid (one knot, one void?), then paper and midtone. Paper above 72% or a densest ninth under 40% is tell 19: enrich before anything else. The human reference plates measure paper 49–69%, densest ninth 44–85%, emptiest 7–28%. The Studio shows the same numbers and paints the grid over the canvas.

## Reading the audit

`tools/audit_canvas.py` prints JSON with:

- `signal_fraction`: share of pixels near `--signal`. Mono default ceiling about 0.10. A frame-heavy page may legitimately exceed it; record the reason.
- `midtone_fraction`: share of pixels that are neither near paper, ink, signal nor signal-2 and have low chroma. Above about 0.08 usually means a photograph kept its gradients, or a large grain overlay is too strong. Duotone pages with a full-tonal central subject will read higher; judge by eye.
- `hue_clusters`: distinct chromatic hue clusters found. Mono expects 1, Duotone expects 2. More means a stray color.
- `soft_edge_estimate`: share of sampled edge pixels with gradual transitions; a rough proxy for TEX-2. Grain, scanlines, dot screens and antialiased hairlines inflate it (the shipped examples read 0.6–0.9), so compare it between iterations of the same page; a jump with no intended soft element usually means blur or glow crept in.

The audit judges pixels, not composition. A page can pass every number and still fail tell 1, 7 or 8.
