# KCL principles (平面构成原理)

The grammar in [grammar.md](grammar.md) lists rules. This file lists the **principles the rules serve**, in the order the composition spec is filled. Each principle names its variants in the working vocabulary, what KCL asks you to decide, which spec field records the decision and which tell in [review.md](review.md) catches its failure. The order is not arbitrary: each step constrains the next, and the sketch gate sits after step 9, before any asset or pixel work.

A principle is a question to answer in the spec, not a box to tick. If a step has no honest answer for the page, write "none" and the reason; the sketch will show whether the page can stand without it.

## 0 · Imagery (意象) — what collides

A KCL page is a collision: a subject from one register held, measured or cut by an apparatus from another (IMG-1). Decide it first because every later principle is applied *to* it.

- Decide: the tension line; the subject register (MAT-5); the apparatus; the motifs (母题), the few things that may recur; the **fragments** (碎片), the parts of a motif that may shed and travel (feathers, phases, petals, pieces, letters); the voice words.
- Spec: `imagery.tension`, `imagery.subjectRegister`, `imagery.apparatus`, `imagery.motifs`, `imagery.fragments`, `imagery.voice`.
- Fails as: an illustration (subject, no apparatus) or a diagram (apparatus, no subject). Tell: IMG-2.

## 1 · Hierarchy (层级) — who speaks first

Rank the information: one primary, one secondary, the rest tertiary. Then pick the **dimensions** that make the rank visible; a rank stated by one dimension alone reads as accident.

| Dimension (变化维度) | What varies | KCL default |
| --- | --- | --- |
| Size (大小) | area, proportion | the 1:12 scale pair (SKL-7) |
| Weight (轻重) | thickness, darkness | solid silhouette vs hairline apparatus |
| Solid vs faint (虚实) | opacity, processing level | silhouette vs line ghost (MAT-2) |
| Color (颜色) | hue, chroma | the signal on the smallest important thing |
| Depth (空间) | overlap, front/back | subject in front of bars, behind type |
| Guidance (引导) | path, pointers | the flow (step 5) |

- Decide: the ranked list; at least two dimensions.
- Spec: `principles.hierarchy.ranks`, `principles.hierarchy.dimensions`; sizes become `subject.rank` and the boxes.
- Fails as: the medium crowd. Tell 1.

## 2 · Balance (平衡) — where the weight sits

Balance is the placement of visual mass, not symmetry. Choose one **weighting** (配重) and let everything heavy obey it; asymmetry is fine, indecision is not.

| Weighting (配重) | Mass sits | Typical KCL use |
| --- | --- | --- |
| top / centre / bottom (顶部 / 中心 / 底部) | one horizontal band | Icon Center uses centre; a horizon band uses top or bottom |
| top-bottom / left-right (上下 / 左右) | two opposed bands | Scroll Bands with mirrored subjects; a pair of bars |
| perimeter (外围) | the edges, empty middle | framed stage, subject as a ring |
| diagonal (对角) | two opposite corners | Asymmetric Grid: subject one corner, type the other |
| scatter (散点满布) | many small masses evenly | fragments and marks only, never subjects |
| irregular (不规则) | deliberately off-axis | one huge subject off-centre, counterweighted by signal |

- Decide: one weighting; the counterweight (what balances the subject: plane type, a bar, the signal mark).
- Spec: `principles.balance`; the sketch shows whether the counterweight is enough.
- Fails as: a page that tips, or a centred page pretending to be composed. Tell 7.

## 3 · Alignment (对齐) — the datum

Alignment needs a **datum** (基准) and a **reference line** (参考线). The datum may be straight, diagonal or curved; what matters is that several things share it. KCL's construction lines are reference lines made visible (SKL-3).

- Variants: left / centre / right, top / middle / bottom; diagonal (斜边); dynamic, where a family of lines fans from one point (动态); curved (曲线), where elements sit on an arc.
- Decide: the diagonal family angle; horizons; which elements sit on which line (subject anchor, voice plate edge, mark baseline, rhythm path).
- Spec: `principles.alignment` (`datum`, `angle`, `horizon`); the `lines`, `horizon`, `rings` elements.
- Fails as: dead-end lines or lines that touch nothing. Tells 4 and 11.

## 4 · Proximity (亲近) — what belongs together

Group by relation so the eye reads clusters, not items. Means: by region (分区), by type or form (类型 / 形式), by typeface (字型), by size (大小), by color, by an explicit connector (提示: a line, a dotted path, a leader).

- Decide: the groups (voice with its folio; subject with its rings and soft element; marks with corners); the **quiet zone** where the reading group lives (LAY-2).
- Spec: `principles.proximity`, the `quiet` element.
- Fails as: voice type stranded in the field, or marks drifting between groups. LAY-2 and LAY-4 in the checklist.

## 5 · Flow (动线) — where the eye goes

The eye enters, travels, pauses and leaves. A page with no path is a page the eye wanders and abandons. The flow is drawn in the sketch as a red line with an **entry** (入口, a square), **arrows**, numbered **stations** (停留) and an **exit** (出口). The flow is the principle most often missing from machine-made pages, so it is a required gate (FLW-1).

| Flow type (动线) | Shape | When |
| --- | --- | --- |
| diagonal sweep (对角) | one long diagonal, entry corner to exit corner | Asymmetric Grid; the diagonal family is the path |
| loop (回旋) | diagonal that turns back once | a stage with a secondary subject opposite the first |
| orbit (环绕) | a closed curve around the centre | Icon Center; the eye circles the container |
| descent (下行) | top to bottom with lateral swings | Scroll Bands; the path crosses every bar |
| spiral (螺旋) | tightening toward the subject | one huge subject with fragments spiralling in |
| Z or S (折线) | two or three reversals | editorial pages with prose |

Rules of a good flow: it passes **through** the first-ranked subject, not beside it; it touches every station the hierarchy ranked; its stations are not evenly spaced; the longest stretch between stations carries the fragments and rhythm points, so the eye has stepping stones; the exit leaves the canvas, usually at the edge the subject does not bleed from.

- Decide: type, entry, path points, stations with holds, exit, optional secondary flow (dashed; typically the plane type read vertically).
- Spec: `flow`.
- Fails as: no path; a path that avoids the subject; a path with equal steps. Tell 11.

## 6 · Repetition (重复) — what recurs

Repetition unifies and makes rhythm. Variants: regular (规律), random (随机), pattern fill (图案满铺, a texture, used once as the overlay), layout repetition across pages, element repetition that builds a figure (元素重复构成), feature repetition (特征, the same hue or mark across a series).

In KCL three things repeat: rhythm points (SKL-2), punctuation marks (SKL-8) and **fragments** (SKL-10). Every repetition varies along one axis (size, spacing, density or opacity), never none, and runs along the flow or a construction line.

- Decide: what repeats, how many, which axis varies, where it runs.
- Spec: `principles.repetition`; `rhythm`, `trail` and `mark` elements.
- Fails as: metronome rhythm, or one of everything. Tells 10 and 12.

## 7 · Contrast (对比) — what differs

Contrast makes hierarchy visible and gives the page its drama. Kinds: size and weight (大小轻重), color mood (色彩情绪: the one signal against neutral ground), solid vs faint (虚实), material and texture (材质肌理: engraving against hairline), positive vs negative (正负形: the subject reversed inside a container), semantic (语意: a classical statue under an astronomical grid, the tension itself).

- Decide: the two or three contrasts that carry the page, named, so the build knows which to protect.
- Spec: `principles.contrast`.
- Fails as: a uniform page where everything is medium in every dimension. Tells 1 and 12.

## 8 · White space (留白) — what is left

Two layers. **Visual**: the ratio of empty ground, large for calm, small for density; decided as a target fraction. **Conscious** (意识层面): the space the viewer completes. Three devices: narrative white (叙事留白, the subject is incomplete and the viewer finishes it), breaking the frame (次元破界, an element leaves its plane; KCL's overflow, SKL-6) and white as form (形式做白, the empty shape is the shape).

Density (疏密) is the local face of white space: one dense core and one airy region, never an even spread (SKL-12).

- Decide: the target ratio; the airy region; one narrative device.
- Spec: `principles.whitespace` (`target`, `zone`, `narrative`); the sketch check reports the estimate and the 3×3 density.
- Fails as: uniform density; timid overflow. Tells 3 and 12.

## 9 · Color (色彩) — the one decision

Color in KCL is budgeted (COL-1 to COL-5). The principle behind the budget: purpose first, then feeling with a reason. Four uses: emphasis (强调, the signal on the smallest important thing), mood (情绪, warm or cold paper, the signal temperature against it), series (系列, one hue family across plates) and cultural narrative (文化叙事, a hue that means something for the subject).

- Decide: mode, paper, ink, signal hue with the reason, where the signal appears (hard marks plus the one soft element).
- Spec: `color`; `mark`, `soft`, `rule` elements.
- Fails as: a second hue, a muted signal, signal as background. Tell 5.

## 10 · Sketch gate (草图关)

With steps 0–9 in the spec, render the sketch with `tools/sketch.mjs render`, run `check`, screenshot and **look at it** before showing it. The sketch shows skeleton, masses, type zones, signal, the single soft element and the flow. It does not show material, texture or motion; those are not what the gate decides. The user approves a sketch, or chooses one from a contact sheet, and the approved spec becomes the baseline for assets and build. A later change to imagery, composition or flow reopens this gate for the affected region; a change to material, type face, texture or motion does not.

## Reading the references of the idiom

Pages in this idiom that work share four habits that machine-made pages often lack. Each is now a rule:

1. The apparatus passes **through** the subject: a ring around the torso, a line across the eye, a bar behind the legs (SKL-11). Beside is not enough.
2. The subject **sheds fragments** along the flow: feathers, phases, pieces, letters, shrinking and thinning away from it (SKL-10).
3. Density is **uneven**: one knot of marks and lines, then air (SKL-12).
4. The signal appears as **both** hard marks and one soft stroke, and the soft stroke is large enough to count (TEX-2, COL-2).
