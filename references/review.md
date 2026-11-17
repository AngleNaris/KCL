# KCL review

Inspect the actual composite, not only its spec or a numeric report. First confirm the selected mode and established style. A reduced-mode heuristic is not a universal failure criterion.

## Review order

1. **Thumbnail:** concept, first/second focal point, mass balance, negative shape and series differentiation.
2. **Target display size:** integration, reading order, typography, line scale and local density. Compare asset detail with the original; avoid shrinking expensive craft into noise.
3. **Detail crop:** drawing quality, fake/generated text, cutout fringe, thin-line loss, alpha, moiré, unintended repeated patterns, material mismatch.
4. **Narrow view:** crop, readable prose, ornaments/text collisions, image resampling and masks. Fixed-poster scaling does not excuse unreadable article text.
5. **If animated:** start/end/extreme/transition frames, pause and reduced-motion state, meaningful controls and runtime cost. Two nearby frames only establish change, not complete motion quality.

## Diagnose before adding

| Symptom | Likely question | First repair to try |
| --- | --- | --- |
| Hero is refined; everything around it is crude circles/stars | Did code stand in for craft-dependent material? | Replace the specific ornament with a suitable generated/sourced assembly, or remove it if unnecessary. |
| Giant dots or thresholded outlines overwhelm fine drawing | Did processing destroy good source material? | Compare preserved source, reduce processing, adjust final dot scale. |
| Generic radial fan/grid on every page | Did a renderer menu become the art direction? | Reconsider the relationship, reuse material language but vary skeleton/negative shape. |
| Multiple random textured rectangles | Does each material belong to an object or surface? | Merge related surfaces, mask them meaningfully or remove them. |
| Ring/line crosses face, title and hands | Does overlap actually improve integration? | Change depth/mask/anchor or delete the line; protect focal contours. |
| Red/blue displaced duplicate around every character | Is a second processing level compulsory in practice? | Keep one useful rendering; add an echo only if it communicates something. |
| Many beautiful images look like stickers | Were perspective, line scale and black masses coordinated? | Revise the Style Bible/sample, crop into shared shapes, correct the incompatible asset. |
| Large blank region feels weak | Is it purposeful negative shape or accidental layout? | Try scale/crop/mass changes. Do not automatically add marks. |
| Work is busy without richness | Is there close-up craft, or only repeated primitives? | Remove low-information repeats; improve one meaningful material. |
| Ornate support competes with the hero | Did generation add detail without hierarchy? | Simplify, crop, lower contrast or remove the support. More generation is not the cure. |
| Decorative labels say nothing | Did metadata become filler? | Remove them or supply meaningful brief-led text. |
| Series swaps portrait/title but retains every ring and strip | Is there a real compositional change? | Compare all plates together; vary mass, crop, route and relationship. |

## Verification record

| Check | Evidence | Completion criterion |
| --- | --- | --- |
| GOV-1 / GOV-6 | brief, request/approval, chosen proof | Authorized direction retained; requested gates honored |
| GOV-7 / MAT-8 | asset plan and actual outputs | Craft-critical items have suitable sources; no concealed placeholders |
| IMG-1 / SKL-11 | thumbnail and target screenshot | Intended relationship visible; no compulsory crossing count |
| MAT-1 / MAT-3 / TEX-1 | native/placed crops | Useful tones and edges survive; texture belongs to its material |
| COL / TYP / LAY | target and narrow screenshots | Cohesive palette, real glyphs, readable content, deliberate crop/reflow |
| VER-5 | proof versus build / optional overlay | Changes justified by actual materials or requested revisions |
| SER-1 | series contact view when applicable | Shared style with meaningful variation |
| VER-4 / MOT-8 | states, extremes, reduced-motion check | Motion serves the concept and has a complete stable fallback |
| GOV-4 | asset source table | Provenance and any required attribution recorded |

## Tool interpretation

`plate.mjs check`, `sketch.mjs check` and `plate.mjs measure` report the selected mode. Hybrid skips legacy style quotas (no mandatory echo, body crossing, three weights, signal minimum, softness count or midtone ceiling) while retaining material/geometry diagnostics. Reduced retains the old diagnostic measurements for compatibility. A warning is a question, not an instruction to add objects.

`audit_canvas.py` is a limited-palette pixel analyzer. Its midtone/hue thresholds do not judge a preserved illustration or tinted paper. Coverage measures pixel colors, not the meaning or visual quality of the image. Layer-overlap statistics are not proof of intentional integration. Include only relevant numbers in the delivery, alongside visual findings.

When no browser or material output is available, mark that check **not tested**. A production plan, placeholder render, synthetic regression fixture or wireframe is not an end-to-end art-quality demonstration.
