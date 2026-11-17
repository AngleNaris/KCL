# KCL · Kasidia's Concept Law

Art direction and graphic composition for illustrated web artworks, editorial spreads, posters and visual essays. KCL combines fine illustration/printmaking material with precise geometry and live typography. Its core reference language includes scientific and occult illustration, surreal collage and editorial design.

## Production approach

- Establish a concept and compact Style Bible; preserve accepted project styles on later edits.
- Choose assets per visual task. Characters, engraved ornament, botanicals, instrument housings, ink and paper may be generated or sourced. Exact paths, ticks, labels, text and controls stay vector/DOM.
- Prototype uncertain material before locking the final composition. Preserve useful tones, colors and transparent edges.
- Review actual artwork at thumbnail, intended size, detail and narrow-screen scales. No mandatory paper coverage, repeated character, crossed-line count or generation quota.

`hybrid` is the normal mode for new illustrated work; `reduced` retains the original limited-ink geometric vocabulary. Existing specs without `artDirection.mode` retain reduced diagnostics. The same geometry renderer and Studio support both.

## Guide

Start with [SKILL.md](SKILL.md), [art direction](references/art-direction.md), [asset routing](references/assets.md) and [review](references/review.md). [Grammar](references/grammar.md) separates Core, Mode and Optional rules. [Spec](references/spec.md) documents executable fields, including independent `material` images; [the brief template](references/brief-template.md) records decisions and sources.

## Tools

- `tools/plate.mjs` / `tools/kcl-render.mjs`: shared static SVG compositor, asset placement, masks, typography, structural and pixel diagnostics.
- `tools/studio/`: live render and geometry editing, preserving the spec as source of truth.
- `tools/sketch.mjs`: wireframe, geometry checks and proof overlays.
- `tools/compose.mjs`: exact/simple procedural graphics; not a substitute for craft-dependent drawing.
- `tools/process_image.py`: explicit `--mode preserve` for RGB/alpha, plus optional reduction/cutout tools. Historical default remains threshold.
- `tools/audit_canvas.py`, `tools/motion_check.sh`: limited-purpose diagnostics, not artistic verdicts.

See [tools/README.md](tools/README.md) for commands and tests. KCL is the graphic sibling of KFL; use the existing UI system or KFL for functional interface regions.

## Examples and limits

`scroll-bands.html`, `icon-center.html`, `asymmetric-grid.html` and `tide-heron.kcl-spec.json` are legacy procedural/reduced examples. They demonstrate geometry and rendering, not the achievable fidelity of generated engraved material. The hybrid regression tests use synthetic fixtures to verify compositing and preservation; they are not art-quality demonstrations.

Use the available image-generation tool when suitable; KCL includes no model-specific API or credentials. A production asset still needs to be generated/sourced and visually reviewed. Static SVG export is supported; motion is directed in the workflow and implemented in the surrounding web page.

The repository contains no third-party reference artwork. Record rights and provenance per asset in each project.
