---
name: kasidia-concept-law
description: "KCL, Kasidia's Concept Law: art-direct graphic web artworks, key visuals, editorial spreads, exhibition pages, character posters and visual essays. Combine illustration, generated or sourced printmaking materials, precise vector composition and live typography. Develop a concept, style bible, asset plan and visual proof; preserve established project styles. Includes an optional reduced-plate mode for limited-ink geometric work. For dashboards, forms and task-heavy interfaces, use kasidia-frontend-law."
---

# KCL · Kasidia's Concept Law

Create graphic compositions with a deliberate relationship between image, space, type and material. The core reference language is scientific and occult illustration, surreal collage, printmaking and editorial composition. Learn its relationships, not a compulsory inventory of circles, stars, grids and blue or red ink.

## Governing decisions

1. Follow the latest user request, then the established project and approved brief, then these defaults. Preserve existing artwork, palettes, rendering and identity unless the request changes them. A small maintenance edit does not trigger new imagery or a redesign.
2. Diagnose concept, composition **and source material** before polishing. A crude procedural ornament cannot acquire engraved craftsmanship by adding circles or noise. A beautiful image cannot fix a weak hierarchy.
3. Choose production per element. Generate or source craft-dependent material; use code for exact geometry, readable type, layout, masks and interaction. Use both when an object needs tactile detail and exact structure. See [assets.md](references/assets.md).
4. Do not fill quotas. No universal minimum for image count, ornament count, ink coverage, crossed lines, subject echoes or soft elements. Never fill intentional negative space to clear a warning.
5. Record sources and inspect actual output. A generated asset, numeric check or written prompt is not evidence of visual quality. Do not report unperformed checks as passed.

## Choose a mode

| Mode | Use | Material policy |
| --- | --- | --- |
| `hybrid` | Default for new illustrated, engraved, archival or collage work, unless the user/project says otherwise | Preserve useful color, tones, fine marks and alpha. Generate supporting material as well as the hero when its craft matters. |
| `reduced` | Deliberately limited-ink, geometric or typographic work | Mono/Duotone, reduction and weight ladders are selected style tools. |

Write `artDirection.mode` into new specs. Existing specs without it retain legacy `reduced` diagnostics for compatibility; do not silently change an existing page. Rule scopes and stable IDs are in [grammar.md](references/grammar.md). `Core` applies to both modes, `Mode` only to the named mode, `Optional` only when selected. Numeric defaults are diagnostics, never aesthetic pass/fail tests.

## Workflow

| Stage | Work and output | Check before continuing |
| --- | --- | --- |
| Load | Read this file and [art-direction.md](references/art-direction.md); inspect references, current render, brief/spec and assets. Read [grammar.md](references/grammar.md) to resolve rules. | Distinguish style references, identity references and failure examples. |
| Direct | Record purpose, canvas, concept, mode and a compact Style Bible in [the brief](references/brief-template.md). Use [principles.md](references/principles.md). | Every intended effect has a reason; established decisions preserved. |
| Plan materials | Use [assets.md](references/assets.md) to list hero, supporting illustration, ornament, surface and precise graphics. Choose supplied / generated / licensed / procedural per item. | No craft-critical material silently replaced by a primitive; no generation quota. |
| Prototype | Make a rough mass/flow sketch and, when fidelity is uncertain, a representative material sample. Place it at final display size. | Test drawing quality and compatibility before producing all assets or locking coordinates. |
| Compose | Refine `kcl-spec.json` with actual silhouettes and texture masses; show a sketch or material proof as appropriate. | Respect requested approval gates; authorization to proceed is sufficient. A proof is not a new mandatory permission loop. |
| Produce | Generate/source only missing assets. Inspect each, preserve an original, prepare placement exports and update the asset table. | Check detail, alpha, palette, perspective, crop and source. |
| Build | Render fixed plates with `plate.mjs` / Studio; use DOM/SVG/CSS for editorial/interactive work. Follow [spec.md](references/spec.md) and [cookbook.md](references/cookbook.md). | Keep type, measurements and controls live; keep artistic materials separable. |
| Review | Follow [review.md](references/review.md): thumbnail, target size, detail crop, narrow viewport, motion extremes if applicable. | Fix the weakest visual layer. Numbers cannot certify artistic quality. |
| Report | Deliver the work, relevant changes, verification and remaining limits. | Never claim final visual validation from a wireframe or plan. |

For a new ambiguous direction, propose a small number of distinct concepts. With a supplied direction or authorization to proceed autonomously, choose and record a reasonable interpretation, then build. Ask only for missing information that changes the work materially, an explicitly requested review, or a decision that would replace approved identity/direction.

## Art direction and composition

State the concept in one sentence. “A subject measured by an apparatus” is useful for an atlas, not a required formula. Decide hierarchy, mass balance, negative shape, reading route and the relationship between illustration and geometry. Integration can use occlusion, shared contour, crop, material, color or alignment; it need not involve a line across the body or face.

Use [archetypes.md](references/archetypes.md) as starting structures, not templates. Support expressive character gestures, multi-object specimen archives or dense engraved instruments without forcing each into one circular container. Let image detail and typography provide rhythm before adding marks.

For a series, share drawing language, color logic and type treatment; vary the dominant relation, scale, crop and density. Repeating the same ring, star border, red offset silhouette and halftone block is not meaningful variation.

## Materials: route by visual responsibility

Read [assets.md](references/assets.md) before producing assets:

- **Generated/sourced:** engraved birds, hands, botanicals, anatomical studies, filigree, complex instrument housings, weathered ink, torn paper and expressive brush marks when their internal craft matters. These may be secondary/background elements.
- **Vector/DOM:** exact orbits, coordinates, scales, simple symbols, masks, flat planes, editable type and controls. Reuse supplied fine vector artwork; do not rasterize it merely to follow a mode.
- **Hybrid:** an engraved instrument body plus vector ticks and real labels; a painted rosette plus exact centre/masking; an ink stroke with a vector reveal mask.
- **No-asset route:** valid for intentionally abstract/type-led work or an identified prototype. Tool unavailability is not permission to disguise a crude substitute as a finished engraving.

Preserve color, antialiasing and local shading by default in hybrid mode. `process_image.py --mode preserve` keeps RGBA; its historical default remains `threshold`, so always select the mode explicitly. Reduce only when the transformation helps. Fine engraving already contains its drawing; do not destroy it with an additional coarse dot screen.

Do not flatten a working page into a generated screenshot. Generate coherent independent assets, including multi-part ornament when its parts need not be independently edited. Keep type, exact diagrams and interaction outside generated imagery. No compulsory number or percentage of generated images.

## Build and inspect

```sh
node tools/sketch.mjs check docs/page.kcl-spec.json --json
node tools/plate.mjs check docs/page.kcl-spec.json --json
node tools/plate.mjs render docs/page.kcl-spec.json -o scratch/page.svg --inline
node tools/plate.mjs shot docs/page.kcl-spec.json -o scratch/page.png --scale 2
node tools/plate.mjs measure docs/page.kcl-spec.json --json
node tools/studio/server.mjs docs/page.kcl-spec.json --port 4777
```

`kind: "material"` places an image in the chosen layer without pretending it is another subject. Use `src`, `box`, `fit`, `align`, `opacity`, `blend`, optional `clip` and explicit `tint` only when recoloring is intended. Subjects retain `levels`; one preserved level is valid in hybrid mode. See [spec.md](references/spec.md) for executable fields.

The renderer is a compositor, not a limit on art direction. If its primitives cannot express an approved idea, keep geometry in the spec and use an asset or documented custom DOM/SVG layer. Do not change the artwork to fit the menu.

For readable pages, use live DOM text and working controls with narrow-screen reflow; a static preview does not verify interactions. Make motion optional. Consult [motion.md](references/motion.md) when used, record triggers/ranges, inspect extremes and reduced motion.

## Resume

Read the brief, asset plan, latest spec and render. Reuse accepted materials and decisions. If a sample changes silhouette or visual mass, revise the affected region and document why; reopen user approval only when requested or when replacing an approved direction.
