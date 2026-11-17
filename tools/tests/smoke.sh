#!/usr/bin/env bash
# Smoke test for the Python tools: synthesize a photo-like image, run cutout + every mode, audit the result.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
tools="$here/.."
scratch="$(mktemp -d)"
trap 'rm -rf "$scratch"' EXIT

python3 -I - "$scratch/src.png" "$scratch/gen.png" <<'PY'
import sys
from PIL import Image, ImageDraw
w, h = 320, 240
img = Image.new('RGB', (w, h))
px = img.load()
for y in range(h):
    for x in range(w):
        v = int(255 * x / w)
        px[x, y] = (v, v, v)
d = ImageDraw.Draw(img)
d.ellipse((90, 50, 230, 190), fill=(40, 40, 40))
img.save(sys.argv[1])
# a "generated" subject on near-white with a speck
gen = Image.new('RGB', (300, 300), (250, 248, 244))
d = ImageDraw.Draw(gen)
d.ellipse((80, 60, 220, 240), fill=(60, 60, 60))
d.rectangle((140, 200, 160, 290), fill=(90, 90, 90))
d.point((20, 20), fill=(0, 0, 0))
gen.save(sys.argv[2])
PY

for mode in threshold dither halftone line silhouette negative posterize duotone; do
  python3 -I "$tools/process_image.py" "$scratch/src.png" --mode "$mode" --knockout -o "$scratch/$mode.png" >/dev/null
  test -s "$scratch/$mode.png"
done
python3 -I "$tools/process_image.py" "$scratch/src.png" --mode threshold -o "$scratch/flat.png" >/dev/null
python3 -I "$tools/audit_canvas.py" "$scratch/flat.png" --signal "#ff3b1f" --paper "#ffffff" --ink "#111111" --json "$scratch/report.json" >/dev/null
# cutout pipeline on the generated subject
python3 -I "$tools/process_image.py" "$scratch/gen.png" --cutout flood --tol 30 --trim --pad 10 --mode silhouette --knockout -o "$scratch/cut.png" >/dev/null
python3 -I "$tools/process_image.py" "$scratch/gen.png" --crop 10%,10%,80%,80% --rotate 90 --cutout luma --key light --tol 20 --keep-largest --trim --mode line --thick 2 --knockout -o "$scratch/cutline.png" >/dev/null
python3 -I - "$scratch/report.json" "$scratch/cut.png" "$scratch/cutline.png" <<'PY'
import json, sys
from PIL import Image
r = json.load(open(sys.argv[1]))
assert r['midtone_fraction'] < 0.05, r
assert r['hue_clusters'] == 0, r
assert 0.2 < r['paper_fraction'] < 0.8 and 0.2 < r['ink_fraction'] < 0.8, r
cut = Image.open(sys.argv[2])
assert cut.mode == 'RGBA'
assert 150 < cut.width < 200 and 240 < cut.height < 270, cut.size   # trimmed to subject + pad
a = cut.getchannel('A')
assert a.getpixel((0, 0)) == 0 and a.getpixel((cut.width // 2, cut.height // 2)) == 255
assert set(a.getdata()) <= {0, 255}, 'alpha must be hard-edged'
line = Image.open(sys.argv[3])
assert line.mode == 'RGBA' and line.width > 40
print('smoke ok', r['paper_fraction'], r['ink_fraction'], cut.size, line.size)
PY
