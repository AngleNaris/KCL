#!/usr/bin/env python3
"""KCL audit_canvas: pixel diagnostics for a rendered screenshot (VER-2).

Reports signal_fraction (COL-2), midtone_fraction (MAT-1), hue_clusters (COL-5)
and soft_edge_estimate (TEX-2). Diagnostics only; they do not judge composition.

  python3 -I audit_canvas.py shot.png --signal "#ff3b1f" --paper "#f3efe6" --ink "#111111" [--signal2 "#..."] [--json out.json]
"""
import argparse
import colorsys
import json
import sys

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.stderr.write("Pillow is required: pip install Pillow\n")
    sys.exit(2)


def hex_rgb(value):
    v = value.lstrip('#')
    if len(v) == 3:
        v = ''.join(c * 2 for c in v)
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def near(c, t, tol):
    return abs(c[0] - t[0]) <= tol and abs(c[1] - t[1]) <= tol and abs(c[2] - t[2]) <= tol


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('image')
    p.add_argument('--signal', required=True)
    p.add_argument('--paper', default='#ffffff')
    p.add_argument('--ink', default='#000000')
    p.add_argument('--signal2')
    p.add_argument('--tolerance', type=int, default=48, help='per-channel distance counted as "near" a token')
    p.add_argument('--width', type=int, default=480, help='downsample width for speed')
    p.add_argument('--json', help='write the report to this path as well')
    a = p.parse_args()

    img = Image.open(a.image).convert('RGB')
    if img.width > a.width:
        img = img.resize((a.width, max(1, round(img.height * a.width / img.width))), Image.BOX)
    w, h = img.size
    px = list(img.getdata())
    n = len(px)
    tokens = {'paper': hex_rgb(a.paper), 'ink': hex_rgb(a.ink), 'signal': hex_rgb(a.signal)}
    if a.signal2:
        tokens['signal2'] = hex_rgb(a.signal2)

    counts = {k: 0 for k in tokens}
    midtone = 0
    hue_bins = [0] * 36
    chroma_px = 0
    for c in px:
        hit = None
        for k, t in tokens.items():
            if near(c, t, a.tolerance):
                hit = k
                break
        if hit:
            counts[hit] += 1
            continue
        mx, mn = max(c), min(c)
        chroma = mx - mn
        if chroma < 28:
            midtone += 1
        elif chroma > 60:
            hh, _, _ = colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255)
            hue_bins[int(hh * 36) % 36] += 1
            chroma_px += 1

    # Also bin the signal tokens so clusters count them.
    for k in ('signal', 'signal2'):
        if k in tokens and counts[k]:
            t = tokens[k]
            hh, _, _ = colorsys.rgb_to_hsv(t[0] / 255, t[1] / 255, t[2] / 255)
            hue_bins[int(hh * 36) % 36] += counts[k]
            chroma_px += counts[k]
    clusters = 0
    threshold = max(1, int(0.002 * n))
    active = [b >= threshold for b in hue_bins]
    for i in range(36):
        if active[i] and not active[i - 1]:
            clusters += 1
    if all(active) and clusters == 0:
        clusters = 1

    # Soft-edge estimate: among horizontal neighbours that differ, how many differ gradually.
    gray = img.convert('L')
    g = list(gray.getdata())
    soft = hard = 0
    for y in range(0, h, 2):
        row = y * w
        for x in range(0, w - 1, 2):
            d = abs(g[row + x] - g[row + x + 1])
            if d >= 56:
                hard += 1
            elif d >= 10:
                soft += 1
    edge_total = soft + hard

    report = {
        'image': a.image,
        'sampled_size': [w, h],
        'signal_fraction': round((counts['signal'] + counts.get('signal2', 0)) / n, 4),
        'paper_fraction': round(counts['paper'] / n, 4),
        'ink_fraction': round(counts['ink'] / n, 4),
        'midtone_fraction': round(midtone / n, 4),
        'hue_clusters': clusters,
        'soft_edge_estimate': round(soft / edge_total, 4) if edge_total else 0.0,
        'notes': {
            'signal_fraction': 'Mono default ceiling ~0.10 (COL-2); frames and bars may justify more.',
            'midtone_fraction': 'Above ~0.08 usually means surviving photographic gradients or a heavy overlay (MAT-1).',
            'hue_clusters': 'Mono expects 1, Duotone expects 2 (COL-5).',
            'soft_edge_estimate': 'Rough proxy for TEX-2; compare between iterations rather than against a fixed bar.',
        },
    }
    text = json.dumps(report, indent=2)
    print(text)
    if a.json:
        with open(a.json, 'w', encoding='utf-8') as fh:
            fh.write(text + '\n')


if __name__ == '__main__':
    main()
