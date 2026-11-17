# KCL grammar

The composition rules used by [SKILL.md](../SKILL.md). Cite stable IDs in the brief, in findings and in reports. Each rule carries a requirement level: **required** (the idiom breaks without it), **default** (follow unless the brief records a compositional reason) or **advisory** (a diagnostic or a taste note). Chinese role names in parentheses are the working vocabulary; use them in sketches and conversation.

Prefixes: GOV governing · SKL skeleton · FLW flow · COL color · MAT material · IMG imagery · LAY layout · TYP type · TEX texture · MOT motion · SER series · VER verification. The principles behind the rules, in the order the spec is filled, are in [principles.md](principles.md).

## Governing

- **GOV-1 Precedence.** Latest explicit user intent within its scope, then the recorded brief, then KCL defaults. (required)
- **GOV-2 Priorities.** Tension → skeleton → material → type → finish. Diagnose a weak page from the skeleton outward. (required)
- **GOV-3 Defaults are defaults.** Numeric values below guide; a recorded compositional reason may deviate. Never report a deviation as a passed measurement. (required)
- **GOV-4 Originality and rights.** No reference artwork is stored or copied. Photographic assets are owned, licensed, generated for the page or public domain, with sources recorded in the brief. (required)
- **GOV-5 Scope.** KCL governs the graphic field. Interaction, accessibility, components and data truth of working UI are outside KCL; regions that need them use kasidia-frontend-law. (required)
- **GOV-6 Lock before pixels.** Imagery, composition and flow are recorded in the spec and approved as a sketch before any asset is processed or any page is built. After approval they are the baseline; a change to them reopens the sketch gate for the affected region, a change to material, type face, texture or motion does not. (required)

## SKL · Skeleton (骨架)

The skeleton is a cast of roles, not a set of shapes. Any shape can play a role; what matters is the relationship.

- **SKL-1 Layer stack (层序).** Build every composition in this z-order, bottom to top, and keep each layer in its own element: (required)
  1. **Ground (底)**: paper color, optional full-canvas texture.
  2. **Plane (面)**: dividing bars, frames, containers, textured rectangles.
  3. **Subject (主体)**: reduced photographic or vector subjects.
  4. **System (系统)**: construction lines, rings, radials, rhythm points, punctuation marks.
  5. **Signal (信号)**: the signal-colored shapes, including the single soft element.
  6. **Type (字)**: plane type may sit below Subject; mark and voice type sit on top.
  7. **Overlay (罩)**: one full-canvas grain, dot screen or scanline layer.
- **SKL-2 Rhythm points (节奏点).** One shape repeated 4–12 times along one large path (arc, ellipse, diagonal or horizon), sizes stepping monotonically (ratio about 1.3–1.6) toward the subject, or held equal while the spacing is even. Equal spacing is an order device, not a fault; what reads as a metronome is equal size *and* equal spacing with no relation to the subject. Vary size, not position. At most two paths per canvas. (default)
- **SKL-3 Construction lines (辅助线).** Hairlines that enter from one canvas edge and exit at another. Use one diagonal family per canvas (default angles: 18°, 27° or 36° from horizontal, plus the perpendicular), horizontals at 38% or 62% of height, and concentric circles sharing one center with the container. Few lines: the references carry three to six per plate, parallel or radiating from one centre, each connecting two elements or passing through the subject's body, none crossing the face. Every line is kin to the plate's centre or axis (SKL-18). A line that stops inside the canvas is a stroke, not a construction line; a dashed family may exist once. (default)
- **SKL-4 Dividing planes (分隔面).** Full-bleed bars in ink, 2–6% of viewport height on scroll pages, 1–3% on a fixed stage. Bars come in pairs to close a band; frames nest with one consistent inset. (default)
- **SKL-5 Container (容器面).** One primary shape holding the main subject: a circle by default, a square or arch as alternatives. On a fixed stage its size is 55–75% of the shorter side. The container may be filled, outlined or implied by a ring. (default)
- **SKL-6 Overflow (溢出).** Every band or frame has at least one element that decisively crosses its edge: at least a fifth of the element lies outside. A timid nick reads as an error. (required)
- **SKL-7 Scale contrast (尺度差).** The largest and smallest meaningful elements differ by at least 1:12. Prefer huge plus tiny; avoid a crowd of medium elements. (default)
- **SKL-8 Punctuation marks (标点).** Four-point stars, dots, crosshairs or registration marks, placed on construction lines, path endpoints or corners. They carry no meaning. The star the references draw is an astroid: concave sides, a thin waist, needle points, taller than wide; the straight-edged sparkle glyph is a different, cheaper object. A star is a point mark, not a family: one large star on the axis or a path endpoint, often outlined with a small filled star inside, with one or two satellites offset from it, and three or four stars on the whole plate. Stars sprinkled along a path at random sizes, or placed in symmetric pairs, are the first thing a viewer reads as disorder. (default)
- **SKL-9 Symmetry contract.** The Plane and System layers either obey strict bilateral symmetry (icon-center archetype) or a declared asymmetry (bands, grid). The Subject may break symmetry by a small, deliberate offset. Mixed, accidental near-symmetry is a defect. (default)
- **SKL-10 Fragments (碎片).** The main subject or a motif sheds 5–12 fragments (feathers, phases, petals, pieces, letters, birds) along the flow or a construction line, shrinking and thinning away from the subject. Fragments are the subject's own material at a smaller processing level, never a new subject. One shape per path: a path of phases, a path of stars, a path of shards; mixing shapes along one path reads as noise, and jitter is spent on at most one family per plate. (default)
- **SKL-11 Interweave (穿插).** At least two apparatus elements pass through or behind the first-ranked subject: a construction line across it, a ring around it, a bar or horizon behind it, a container cutting it. Apparatus placed only beside the subject is juxtaposition, not tension. (required)
- **SKL-12 Density (疏密).** One dense core and one airy region per stage or band: roughly a third of the canvas carries most of the marks, lines and fragments, and at least one ninth carries none. Even spread is a defect. (default)
- **SKL-13 Weighting (配重).** Declare one balance weighting from principles.md (top, centre, bottom, top-bottom, left-right, perimeter, diagonal, scatter, irregular) and a counterweight for the subject. Everything heavy obeys it. (default)
- **SKL-14 Weight ladder (重量阶).** Every apparatus element declares one of five weights and nothing in between: *hairline* (0.75px at a 900px short side), *line* (2px), *rule* (5px), *band* (14px), *bar* (a solid plane). The apparatus of a stage uses at least three rungs, and at least one element is a solid plane: a filled container, a bar, a block or a band-weight ring. An apparatus made only of hairlines is decoration, not measurement; the renderer draws the rungs at full ink, with `ghost` (12% ink) as the only lighter fill. (required)
- **SKL-15 Scale ladder (尺度阶).** Default sizes as fractions of the short side S: rank-1 subject 55–140% (it may bleed), container 55–75%, plane type 20–35%, largest rhythm point 2–5%, punctuation 1–4%, fragments 0.5–4%. A medium element that belongs to no rung is the "medium crowd" of review.md; move it to a rung or delete it. (default)
- **SKL-16 Richness (饱满).** A fixed plate in this idiom is full before it is empty: the human references carry 50–70% paper, their densest ninth 45–85% ink, their emptiest 7–28%. Their fullness comes from few large things done completely, never from many small ones: one or two ordered systems (SKL-17) that span half the canvas, one organic or textured plane (an ink `blob`, a `sweep`, a band with a patterned edge, a `field` inside the container or across the whole ground), the subject's own echo at a second size and level, and grain over everything. Scattered rectangles of different patterns, a tag here and a grid there, add count and subtract order. A plate measuring over 72% paper is unfinished, not a deviation to record: add a system or enlarge the plane, then measure again. (default; the measure is required once assets exist)
- **SKL-17 Ordered systems (秩序系统).** The small elements of a plate belong to systems, and a system is one shape, one large path, one size rule: ten phases on an ellipse growing from new moon to full; a closed loop of equal dots; a fan of ticks radiating from one centre; a band whose texture is one pattern at one cell. Each system is executed completely along its path, with even spacing or a monotonic size step, and no jitter unless the system is the one that scatters (feathers, drops). Two systems per plate is the norm, three when they share a centre or a path; a plate whose small marks do not belong to a system looks busy at any count. Repeating the subject itself at equal intervals is not a system but wallpaper: the human references never repeat the figure, and their lower bands carry something different in kind, a texture, a text block, one cropped fragment of the figure, a feather. This is a way of seeing, not a quota: the test is whether the eye can name the rule of each group at arm's length, and whether each group is drawn as well as a human would draw it once. (default)
- **SKL-18 Line kinship (一心一轴).** A plate has one centre and one axis. The centre sits on the subject, at a landmark; the axis is the one diagonal of SKL-3, and the gesture runs along it. Every line on the plate is kin to one or the other: rings, arcs, tick fans, dot loops, radii and tangents share the centre; straight lines are the axis, its perpendicular, its mirror in a symmetric plate, or the grid; ellipses tilt to the axis; the sweep, ribbons and streaks run along the axis or along the flow that follows it; the star cluster sits at the ends of the axis. The test is to pick any line and point to its relative: concentric, radial, tangent, parallel, perpendicular. A line with no relative is an orphan. A near-relation is worse than an orphan: an arc almost concentric with the container, a line a few degrees off the family, an ellipse tilted a little away from the axis, two fragment paths that almost coincide, all read as mistakes, because the eye assumes the relation and sees it fail. A second centre exists only for a second subject; a second axis never. One gesture per plate: when a plate wants a sweep, a ribbon and a trail, they share one path. The human references hold ten or twenty lines this way without a stray one, so the limit is not the count but the kinship; declare the axis in the spec (`axis`) and let lines, tilts, radials and tangents be born from it rather than placed by coordinates. (default)

## FLW · Flow (动线)

- **FLW-1 One path.** Every stage or band records a flow: entry, path, stations, exit. The sketch draws it in red; the build must still produce it. A page with no path is not finished. (required)
- **FLW-2 Through the subject.** The path passes through the first-ranked subject and touches every station the hierarchy ranked. Beside is not through. (required)
- **FLW-3 Stepping stones.** The longest stretch between stations carries the rhythm points, fragments or marks, so the eye has footing; stations are never evenly spaced. (default)
- **FLW-4 Exit.** The path leaves the canvas, by default at the edge the subject does not bleed from; a secondary path (dashed) may read the plane type. (default)

## COL · Color discipline (色彩纪律)

- **COL-1 Role tokens.** Exactly these roles: `--paper`, `--ink`, `--signal`, optional `--signal-2` (adjacent hue, Duotone only), derived `--ghost` (ink at 8–15% for textures and lines). No other named colors. (required)
- **COL-2 Signal budget.** In Mono mode the signal covers no more than about 10% of the canvas. It appears in at least two registers: the hardest shapes (stars, dots, frames, rules) and the single soft element (TEX-2). (default)
- **COL-3 Two modes.** *Mono*: paper and ink ground, one signal hue. *Duotone*: the ground is tinted by `--signal` and `--signal-2`, the subject is rendered in paper-to-ink grays, bars stay pure ink. One mode per stage; a scroll page may switch modes only at a dividing plane. (required)
- **COL-4 Hue freedom.** The signal hue is free and should be chosen for the tension, not inherited from the idiom's habit. Preferred signals are high-chroma and unmixed: ultramarine, cobalt, vermilion, cadmium yellow, acid green, viridian, magenta, safety orange. Paper may be pure, warm (cream) or cold (bone); ink may be pure black or a deep tinted near-black. (default)
- **COL-6 Signal carrier (信号载体).** The signal hue appears at least once on an element larger than a punctuation mark: the soft element, a rule, a band, a filled container or a type plane, at least 3% of the short side. Signal that lives only on stars and dots is invisible at a glance; the pixel measure reports the largest signal blob. (required)
- **COL-5 Forbidden.** Multi-hue gradients, gradients on type, glow or bloom, drop shadows, translucent white glass, a second signal hue in Mono mode, signal used as a large background fill (frames and bars excepted), pastel or muted signals. (required)

## MAT · Material (素材)

- **MAT-1 No midtones.** Every photographic element is reduced to one of: threshold (阈值), dither (抖动), halftone (网点), line (线稿), silhouette (剪影), negative (负片). A full-tonal grayscale may appear once per stage, only as the central subject in Duotone mode. Color photographs never appear. (required)
- **MAT-2 Two levels.** The main subject appears in at least two processing levels (for example silhouette plus an offset line ghost, or threshold plus negative inside the container). Depth comes from processing, not from shading. (default)
- **MAT-3 Hard cutouts.** Backgrounds are removed or knocked out with a hard edge. No feathered masks, no soft vignette to hide an edge. (required)
- **MAT-4 Preprocess photographs.** Photographic reduction happens in `tools/process_image.py` before the page loads. Runtime SVG filters are allowed on elements under about a quarter of the viewport. Vector and procedural layers may be generated at runtime. (default)
- **MAT-5 Registers (语域).** Choose subjects from a register and keep at most three distinct subjects per band or stage: *Classical* (statues, columns, cathedrals, engravings, friezes), *Natural* (ridges, birds, deer, botanicals, waves, clouds), *Technical* (diagrams, charts, maps, instruments, type specimens), *Human* (hands, faces, figures in archival photography). (default)
- **MAT-7 Rendered character (原画主体).** An illustrated or anime character enters the plate the way every subject does: reduced to line, threshold or silhouette so that it is made of the same ink as the apparatus and lines, rings and planes can pass through it. What the user wants to keep of the rendering is kept through a window: the rendered level clipped to a circle or frame around the face (or the hands), which becomes the plate's one soft element (TEX-2 is spent), or the rendered figure placed small as an echo while the reduced figure carries the plate. A fully rendered figure at full size is used only when the user asks for it explicitly, and then the bounds apply: an opaque second level that is clipped to a column or window, knocked out inside a plane, or scaled to another size as an echo, never the same figure shifted a few dozen pixels (a shifted copy reads as misregistration, a blue ghost around the hair, not as a second level), at least one apparatus element of line weight or heavier crossing the body (SKL-11), fragments from the character's own material. The character is placed by its anatomy (eyes, hands, centroid), so rings and lines are anchored to landmarks rather than to the asset box. (default; the bounds are required when full rendering is kept)
- **MAT-6 Ink on paper.** Export reduced subjects as ink on transparent or ink on white and composite with `mix-blend-mode: multiply` on light grounds or `screen` with paper-colored ink on dark grounds, so the same asset serves both modes. (default)

## IMG · Imagery and concept (意象)

- **IMG-1 Tension line.** Every page records one sentence of the form "*subject* held/measured/cut by *apparatus*". It is the brief's first line and the test for every later addition. (required)
- **IMG-2 Both sides visible.** The organic or classical subject and the systemic apparatus (lines, points, marks, coordinates, labels) must both be legible at a glance. A subject without apparatus is an illustration; apparatus without a subject is a diagram. (required)
- **IMG-3 Restraint.** Two subjects with a decisive scale gap beat six. When a canvas feels empty, add scale contrast or one construction line before adding a subject. (default)
- **IMG-4 Mute marks.** Punctuation marks never become literal icons: no arrows meaning scroll, no social glyphs, no emoji, no pictograms explaining content. (required)
- **IMG-5 Copy is artwork.** Words on the page are chosen by the designer as part of the composition: declarative, liturgical, archival or technical in voice. No marketing voice, no calls to action, no "explore / discover / unleash". Bilingual pairing is welcome when both languages are set with equal care. (required)

## LAY · Layout (版式)

- **LAY-1 One archetype per stage.** Choose Scroll Bands, Icon Center or Asymmetric Grid from [archetypes.md](archetypes.md) and record it. A scroll page may chain archetypes band by band. (required)
- **LAY-2 Quiet zone (静区).** If the page carries readable prose, reserve a zone where Subject and System thin to ghost intensity and the overlay stays. Prose never sits on a busy field. (default)
- **LAY-3 Reflow by rule.** Record how the composition reflows at narrow widths using the archetype's reflow table: what folds, what keeps angle, what collapses. Scaling the whole stage down is acceptable for a fixed stage; reflowing a band by simple squashing is not. (default)
- **LAY-4 Edge discipline.** Mark type and punctuation live on edges and corners at one consistent inset; subjects and plane type bleed off edges; nothing floats at an arbitrary middle distance from an edge. (default)

## TYP · Type (字)

- **TYP-1 Three roles only.** *Plane type* (字作面): display set at 25vw or larger, or stretched, used as texture, may be clipped by bars, outlined or ghosted. Outlined plane type is a line family, two contours per letter, so it is used on a plate whose lines are few; plane type is cut by the subject or by bars, but never lies behind the face, which is the plate's one soft element. *Mark type* (标记字): 10–12px spaced caps or small CJK, tracking 0.2–0.35em, placed on edges, corners or along construction lines. *Voice type* (声部字): the one or two sentences the concept needs, 14–20px, measure at most 60 characters. No other text roles. (required)
- **TYP-2 Pairing.** One display face and one text face per page. CJK with Latin: a Song/Ming serif with a high-contrast Latin serif, or a condensed or blackletter display; for technical registers a CJK sans with a Latin mono. (default)
- **TYP-3 Distortion.** Plane type may be stretched or compressed along one axis by 1.4–2.2×. Never skew, never two-axis distortion, never distort mark or voice type. (default)
- **TYP-4 Apparatus text.** Coordinates, dates, catalogue numbers, folios and version strings in mark type let the System layer speak. They are real values or clearly part of the fiction stated in the brief; never invented statistics about a real product. (required)
- **TYP-5 Sparse voice.** At most two voice sentences per band or stage. (default)
- **TYP-6 Faces.** Prefer open-licensed faces so the page can ship; see the list in [cookbook.md](cookbook.md). Subset CJK webfonts to the glyphs used. (advisory)
- **TYP-7 Type budget (字量).** The references carry little type: a title, one line of voice, one or two marks (a folio, a catalogue string). A fixed plate stays near that; a tag, a caption, a coordinate string and a vertical Latin title all at once make the type a fourth apparatus competing with the systems. (default)

## TEX · Texture and finish (质感)

- **TEX-1 One overlay.** A single full-canvas overlay per page: grain at 4–8% opacity, dot screen, or scanlines. Never per-element texture. (default)
- **TEX-2 Softness budget.** Exactly one soft element per stage: a brush ribbon, a blurred ghost, a chromatic split. Everything else is hard-edged. The soft element usually carries the signal hue. (required)
- **TEX-3 Chromatic split.** Used on at most one element, offset 2–6px, screen or difference blend, never on type. (default)
- **TEX-4 Flatness.** No shadows, bevels, gloss, inner glow or 3D. Depth is created by processing levels (MAT-2), overlap and scale. (required)

## MOT · Motion (动)

Vocabulary, recipes and budgets are in [motion.md](motion.md).

- **MOT-1 Loops only.** Motion is a set of infinite loops that return to their steady state; nothing enters, leaves or lands elsewhere. One settle animation at load (lines drawing in) is the only exception. (required)
- **MOT-2 Composition first.** A page paused at any instant, including a loop's extreme, must still pass review. Loops stay within small ranges: drift 1–2% of the stage, breathe 3–6% of scale, oscillate 2–6px. (required)
- **MOT-3 Three tempos.** Glacial rotation and drift (120–360s per revolution, 40–90s per drift cycle), slow breathing and oscillation (7–20s), quick twinkle, flicker and reseed (0.6–4s). At most one quick loop per stage. (default)
- **MOT-4 Budget of three.** At most three moving systems per stage or band, not counting the overlay. Marks and voice type never move; the subject moves last and least. (default)
- **MOT-5 Desynchronized.** Coexisting loops use durations that are not simple multiples and negative delays, so they never align or restart together. (default)
- **MOT-6 Transform and opacity.** Animate only transform, opacity, dash offset and the overlay's grain seed. No animated layout, color, blur or filter on large elements; a blurred element never animates, its unblurred twin does. (required)
- **MOT-7 No bounce.** Linear or ease-in-out, no overshoot or spring, no parallax that breaks the System layer's alignment. (default)
- **MOT-8 Reduced motion.** Under `prefers-reduced-motion: reduce` every loop pauses in its steady state. (default)

## SER · Series (系列)

- **SER-1 Variation by skeleton.** Plates of one series share color, type and material and differ in skeleton: each plate records what it changes against the others in `series.variesBy` (archetype, weighting, container shape, flow entry or exit, which element is the solid plane). Four plates that only swap the character and the title are one plate printed four times. (default)

## VER · Verification (验证)

- **VER-1 Screenshot evidence.** Completion requires screenshots at the designed canvas (1440×900 for a fixed stage; 1440 wide full page for scroll) and at one narrow width, inspected by eye against [review.md](review.md). (required)
- **VER-2 Audit numbers.** `tools/audit_canvas.py` reports signal fraction (COL-2), midtone fraction (MAT-1) and hue count (COL-5). They are diagnostics with thresholds that mirror the defaults; interpret them, do not obey them blindly. (advisory)
- **VER-3 Honest report.** Not tested is not passed. A recorded deviation stays a deviation. (required)
- **VER-4 Motion evidence.** A page with loops is checked with `tools/motion_check.sh`: two frames three seconds apart show change confined to the intended regions, and the later frame is inspected like any screenshot. (required when motion is present)
- **VER-5 Sketch fidelity.** After the build, `tools/sketch.mjs overlay` draws the approved skeleton and flow over the screenshot. Locked elements (subject boxes, bars, container, flow stations) that moved by more than about 3% of the canvas are fixed or recorded as deviations with a reason; the overlay is inspected like any screenshot. (required)
- **VER-6 Pixel measure.** `tools/plate.mjs measure` screenshots the plate in layers through Playwright and reports paper, ink, signal and material coverage, the 3×3 ink grid, the apparatus stroke-weight histogram, the largest signal blob and the share of subject pixels crossed by apparatus. These replace the box-based checks for SKL-11, SKL-12, SKL-14 and COL-6 once assets exist; the sketch check stays for the geometry round. The thresholds are calibrated on the human reference plates (paper 49–69%, densest ninth 44–85%, emptiest ninth 7–28%): the measure warns above 72% paper, below 40% in the densest ninth, above 28% in the emptiest ninth, with more than three ninths under 8%, below 30% paper, with signal under 0.1% or over 8%, a signal blob under 3% of S, or midtone over 20%. Numbers are diagnostics (GOV-3), but a paper or richness warning on a fixed plate is answered by enriching the plate (SKL-16) or by asking the user, never by recording it alone as a deviation. (required once assets are placed)
- **VER-7 Look while composing.** Composition is done against the final render, not against a wireframe or a mental image: run the Studio (`tools/studio/server.mjs`) or `plate.mjs shot` after every spec change and read the PNG before the next change. The human may edit the same spec in the Studio; the spec on disk is the single source of truth and is re-read before each step. (required)
