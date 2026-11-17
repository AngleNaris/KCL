# KCL assets

The idiom lives on reduced subjects, so asset production is a stage of its own. Every asset follows one pipeline, whatever its origin:

```
source  →  inspect  →  cutout  →  crop / trim  →  tone  →  reduce to levels  →  place  →  record
```

Sources are four: user-supplied (A), generated (B), public domain (C) and procedural (D). Record every asset's origin and license in the brief table (GOV-4). Never store third-party artwork, including the references that taught the grammar, in this skill.

## 1. Source

### A · User-supplied

Photographs, scans, drawings. Ask for the highest resolution available and whether the subject may be cropped, mirrored or rotated. A plain background makes the cutout trivial; a busy background needs a crop first and sometimes a manual mask from the user's editor.

### B · Generated

Generate the subject already in the idiom's terms so reduction is clean. KCL names no image tool: use whichever generation tool or skill the current session and team provide, with its own invocation and credentials. If that tool can output a transparent background, request it and still run the cutout stage to harden the edge; if it cannot, request a pure white background. Generation is an asset task; it does not reopen the composition or require a new UI approval.

Prompt skeleton, one subject per image:

> `<technique>` of `<subject>`, `<style period>`, isolated on a pure white background, hard edges, no shading gradients, no color, no text, no frame, centered, the whole subject visible with margin.

| Register | Technique and style | Subjects that reduce well |
| --- | --- | --- |
| Classical | copperplate engraving, 18th–19th century; marble photogravure; architectural elevation drawing | busts, full statues, Doric/Ionic columns, friezes, arches, cathedral facades |
| Natural | botanical plate, ornithological plate, woodcut, high-contrast silhouette | single birds in flight, deer, antlers, branches, mountain ridges, wave crests |
| Technical | diagram in black ink, instrument illustration from a catalogue, type specimen | astrolabes, sextants, orreries, compasses, gears, lettering |
| Human | archival portrait photograph, hands in studio light on black | hands, profiles, draped figures |

Settings, expressed in the tool's own terms: square or the subject's natural ratio; the tool's higher resolution tier when the asset will exceed 40% of the stage; for Duotone's one full-tonal subject ask for "soft studio light, deep blacks, full grayscale" instead of "no shading". Generate one subject at a time; a group never isolates cleanly.

Inspect each output before using it: whole subject present, no text or frame, background truly plain, no color cast that threshold would read as tone. Regenerate rather than repair a bad one.

### C · Public domain and open collections

| Collection | Strength for KCL |
| --- | --- |
| The Metropolitan Museum of Art Open Access (CC0) | sculpture, casts, engravings, friezes |
| Rijksmuseum (public domain, high resolution) | prints, etchings, botanical and bird plates |
| Smithsonian Open Access (CC0) | natural history, instruments, archival photography |
| Cleveland Museum of Art Open Access (CC0) | sculpture, prints |
| Art Institute of Chicago (CC0 subset) | prints, architecture drawings |
| Biodiversity Heritage Library (mostly PD, check item) | birds, botanicals, anatomy plates |
| NYPL Digital Collections (PD subset) | maps, architecture, archival photography |
| Library of Congress free-to-use sets | archival photography, maps |
| Wikimedia Commons (filter PD / CC0) | columns, cathedrals, statues, mountains |
| NASA image libraries (PD, credit) | planets, instruments, topography |

Download into an empty scratch directory; keep the item URL and license line.

### D · Procedural

No raster at all. Columns, arches, ridges, flocks, contours, disks and halos come from `tools/compose.mjs` or hand-authored SVG, and a single CJK character or numeral at plane scale is a complete subject. This path never blocks and is often the strongest; all three shipped examples use it.

## 2. Cutout, crop, trim, tone

All in `tools/process_image.py`, in this order, with Pillow only. The output alpha is always hard-edged (MAT-3).

| Step | Flag | When |
| --- | --- | --- |
| Rotate / mirror | `--rotate 90`, `--flip h` | reorient a profile, mirror a wing |
| Crop | `--crop x,y,w,h` (px or %) | isolate one subject from a scene before cutout |
| Cutout: flood | `--cutout flood --tol 40` | plain background touching the edges (generated images, scans) |
| Cutout: color | `--cutout color --key "#ffffff" --tol 30` | plain background that also appears inside holes |
| Cutout: luma | `--cutout luma --key dark --tol 70` | light subject on a dark studio background, or the reverse with `light` |
| Clean the mask | `--despeckle 5 --erode 2 --keep-largest` | fringes, specks, floating islands |
| Trim | `--trim --pad 24` | crop to the subject's box with transparent margin |
| Tone | `--levels 30,220 --contrast 1.3 --gamma 0.9 --blur-pre 0.8` | push a muddy photo toward clean black and white before reduction |
| Size | `--max 1600` | cap the long edge; the page never needs more |

A generated engraving on white usually needs only `--cutout flood --trim --pad 24`. A photograph needs a crop, a luma or color cutout, `--keep-largest`, then levels and contrast. If the flood leaks through a thin gap, raise `--erode` or lower `--tol`; if it stops short, raise `--tol`.

## 3. Reduce to levels

The same source produces its processing levels (MAT-2). Typical pairs:

```sh
# level 1: solid silhouette, level 2: line ghost
python3 -I tools/process_image.py src.png --cutout flood --trim --pad 24 --mode silhouette --knockout -o out/bust-silhouette.png
python3 -I tools/process_image.py src.png --cutout flood --trim --pad 24 --mode line --thick 2 --knockout -o out/bust-line.png
# level 1: threshold, level 2: halftone
python3 -I tools/process_image.py src.png --cutout flood --trim --pad 24 --mode threshold --level 0.55 --knockout -o out/bust-threshold.png
python3 -I tools/process_image.py src.png --cutout flood --trim --pad 24 --mode halftone --cell 5 --stagger --knockout -o out/bust-halftone.png
# Duotone's one full-tonal subject
python3 -I tools/process_image.py src.png --cutout luma --key dark --tol 60 --trim --mode duotone --ink "#000000" --paper "#ffffff" -o out/bust-gray.png
```

`--knockout` exports ink on transparent so the PNG composites with `multiply` on light grounds or `screen` plus `invert(1)` on dark grounds (MAT-6). Keep the same `--trim --pad` on both levels so they register when offset.

## 4. Place and verify

Place both levels in the Subject layer with a 2–3% offset between them, size by the scale pair recorded in the brief (SKL-7), and screenshot. Check at the designed canvas that no midtone survived, the edge is hard, and the subject reads at the intended scale; `tools/audit_canvas.py` confirms the first of these.

## 5. Record

One row per asset in the brief: origin (A–D), source and license or generation tool and prompt, register, processing levels, output file. A generated image is a page asset with its prompt recorded; a processed public-domain image stays public domain with its item recorded.
