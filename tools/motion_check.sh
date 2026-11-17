#!/usr/bin/env bash
# KCL motion_check: capture two frames of a page three seconds apart and report what changed (VER-4).
# usage: motion_check.sh /abs/page.html /abs/out-dir [WxH as 1440,900] [--full-page]
set -euo pipefail
page="$1"; out="$2"; size="${3:-1440,900}"; full="${4:-}"
mkdir -p "$out"
PW="${KCL_PLAYWRIGHT:-npx playwright}"   # override with an absolute playwright CLI if npx cannot resolve it
cd "$out"
$PW screenshot --viewport-size="$size" $full --wait-for-timeout 600 "file://$page" "$out/frame-a.png" >"$out/shot-a.log" 2>&1 || { cat "$out/shot-a.log"; exit 2; }
$PW screenshot --viewport-size="$size" $full --wait-for-timeout 3600 "file://$page" "$out/frame-b.png" >"$out/shot-b.log" 2>&1 || { cat "$out/shot-b.log"; exit 2; }
python3 -I - "$out/frame-a.png" "$out/frame-b.png" <<'PY'
import json, sys
from PIL import Image, ImageChops
a = Image.open(sys.argv[1]).convert('RGB'); b = Image.open(sys.argv[2]).convert('RGB')
if a.size != b.size:
    print(json.dumps({'error': 'frame sizes differ', 'a': a.size, 'b': b.size})); sys.exit(0)
d = ImageChops.difference(a, b).convert('L').point(lambda p: 255 if p > 24 else 0)
n = a.width * a.height
changed = sum(1 for v in d.getdata() if v)
print(json.dumps({'frames': [sys.argv[1], sys.argv[2]], 'size': a.size, 'changed_fraction': round(changed / n, 4), 'change_bbox': d.getbbox(),
                  'note': 'small fraction inside the intended regions = loops running; 0 = not running; page-wide = overlay or layout animating'}))
PY
