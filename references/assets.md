# KCL materials and production routing

Use for every missing visual element, not only the central figure. Start with existing accepted assets. Generating something new must address a concrete missing role or quality gap, not a habit of using the tool.

## 1. Asset plan

For each necessary item record: role and meaning; method and reason; reference/Style Bible; target box and display size; source/prompt; color/edge policy; layer and mask; independent motion; output file; status. A compact table in the brief is enough.

| Visual task | Preferred route | Keep exact outside the image |
| --- | --- | --- |
| Main character, bird, hand, botanical/anatomical plate | Supplied art first; otherwise generate or source a suitable drawing | Identity constraints, labels, layout |
| Engraved rosette, filigree, ceremonial border, decorative celestial assembly | Generate/source as a coherent assembly when internal craft matters; reuse detailed vector art if supplied | Attachment points, precise circles, editable labels |
| Astrolabe/orrery/instrument housing | Generate/source the drawn object; combine with vector overlay | Tick count, angles, coordinates, numeric values |
| Ink bleed, torn edge, brush gesture, paper fibres, material patch | Generate/source or use a proven texture asset; procedural is fine if it already achieves the intended effect | Crop/reveal masks, clipping, motion bounds |
| Simple rings, grids, chart lines, exact moon phases, registration marks | SVG/Canvas/CSS or an existing vector | These are already the exact layer |
| Title, prose, captions, navigation, real logos | Live DOM/SVG text or supplied approved vector | Spelling, glyphs, selection, controls |

Judge **visual responsibility**, not file format. A simple four-point mark can be vector; a large finely engraved emblem may need an image. A small background asset can still be craft-critical. Do not add detail to a deliberately simple mark.

## 2. Generate/source a usable asset

Use the available image tool and obey its capabilities. Do not invent tool names, credentials or output paths. Generate a representative material proof early when quality is uncertain, then reuse its relevant reference and style decisions for the remaining family. Maintain consistency in line density, viewpoint, shading, palette and print scale.

Prompt contract:

> Create [one asset or coherent assembly] for [visual role/meaning]. Drawing: [line, hatching, shading, edge and period vocabulary from Style Bible]. Shape: [silhouette, gesture, facing, centre/attachment points and open areas]. Color/material: [preserved values and local surface]. View/light: [consistent projection and lighting]. Output: [ratio, intended placement size, transparent alpha when supported / specified flat background], full required edges with padding. Omit captions, exact scales, letters, watermarks and page/UI layout; those are separate layers. Match [reference's stated traits only].

Examples, adapt rather than copy:

- **Ornament:** a single asymmetrical engraved botanical crescent with a hollow inner opening, thin directional hatching and a few dense shadow knots; warm-black ink, no text; transparent background; designed to wrap behind a shoulder. Keep the opening clear for a vector arc.
- **Instrument:** an original copperplate-style celestial instrument housing, frontal elevation, worn dark ink with preserved fine tonal hatching; no graduations or numerals; isolated on transparent background. Add verified ticks and live labels afterward.
- **Print material:** one vermilion brush sweep with a dry broken edge and irregular pigment density; no symbolic shape, cast shadow or surrounding paper rectangle; transparent background if supported. Its silhouette follows the intended gesture.

Generate related ornament parts together when they should read as one drawing. Split only where placement, masking, recoloring or animation needs independence. Do not generate a whole finished page and then pretend it remains editable. Contact sheets are for selection; inspect and crop an individual asset before production.

When transparency is unavailable, choose a background compatible with the planned compositing. A white background is not alpha. Preserve holes and internal white pigment; do not globally key white from a white costume. Inspect edges on both light and dark test grounds. For difficult matting, use an appropriate editor/tool or a better source; do not silently apply destructive thresholding.

For external sources, verify the particular item's rights and record its item URL, licence and required attribution. A museum/collection name alone is not licence evidence. Do not put reference artwork into the skill repository.

## 3. Preserve first; reduce deliberately

Keep the source unchanged and export a derivative. Fine engraving already has line and tone. Prefer the preserved version when processing erases the features that made it worth using.

```sh
# Preserve RGB and existing antialiased/translucent alpha; trim without tonal reduction.
python3 -I tools/process_image.py source.png --mode preserve --trim --pad 24 -o assets/ornament.png
# Explicit limited-ink treatment when the art direction calls for it.
python3 -I tools/process_image.py source.png --mode halftone --cell 4 --stagger --knockout -o assets/detail-halftone.png
# Deliberately hard cutout for a flat silhouette, not a default for every image.
python3 -I tools/process_image.py source.png --mode silhouette --cutout flood --tol 30 --alpha hard --knockout -o assets/silhouette.png
```

The CLI keeps its historical `threshold` default for compatibility. **Always pass `--mode` in new work.** `preserve` skips grayscale/recoloring and rejects `--knockout`; crop, trim, resize and explicitly requested tonal adjustments still apply. `--alpha preserve` keeps existing fractional alpha when applying a cutout; `--alpha hard` intentionally binarizes it. Auto uses preserve for `--mode preserve`, hard for legacy reduction. These basic cutouts are not semantic hair matting.

Do not use `--keep-largest` or erosion indiscriminately on filigree, separated feathers or detached ink specks. They can delete legitimate parts. Match export size to the largest intended display size and device pixel ratio; about 2× display dimensions is a useful starting point for detailed raster material, not a guarantee or mandatory enlargement. Inspect actual pixels and file weight. Never upscale a tiny source and call it higher fidelity.

For halftone, determine the dot size **at display scale**, compare to the original, and inspect target and narrow layouts for moiré. A uniform screen across face, cloth, background and ornament does not reproduce engraved craft. Use etched/pencil/painted shading at source when that is the needed language.

## 4. Place independently

Use subject `levels` for versions of a subject; use `kind: "material"` for a supporting assembly, ink plane or surface. Preserve color with no `tint`. A tint filter uses alpha as the silhouette; applying it to an opaque white-backed image makes a solid rectangle. For monochrome ink on light paper, a deliberate multiply blend may preserve shading; for dark grounds use a proper transparent/reversed export. Inspect rather than assuming the blend works.

Plan front/back relationships explicitly. A generated instrument can sit behind the character while its exact arc sits in front; split artwork into separate exports only if actual crossings need it. Do not manufacture integration with a full-height red offset duplicate.

## 5. Inspect and record

Inspect every asset at native/detail size and at placed size: coherent drawing, complete required silhouette, convincing local marks, no fake text, no unintended frame/background, appropriate perspective, edge quality and shared style. Then inspect the composite for competing detail and repeated textures. Request a targeted edit or regenerate a defective asset; do not repair a weak source by burying it under more geometry.

If generation is unavailable, use accepted/sourceable material, simplify with a stated art-direction decision, or deliver a labelled prototype with missing assets listed. Do not claim a generated material exists or that a primitive substitute meets the original fidelity goal.
