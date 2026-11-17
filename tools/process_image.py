#!/usr/bin/env python3
"""KCL process_image: turn a photograph or generated picture into a flat KCL material (MAT-1..MAT-3).

Pipeline, in order:
  load -> rotate/flip -> crop -> cutout -> trim/pad -> adjust -> scale -> reduce (mode) -> colorize/export

Modes: threshold | dither | halftone | line | silhouette | negative | duotone | posterize
Cutout: flood (connected background from the corners) | color (every pixel near --key) | luma (light or dark pixels)
Run with `python3 -I`. Requires Pillow only.

Examples:
  # generated engraving on white: remove the white, trim, reduce to ink-on-alpha
  python3 -I process_image.py gen.png --cutout flood --tol 40 --trim --pad 24 --mode threshold --level 0.55 --knockout -o out/statue.png
  # same subject as a line ghost
  python3 -I process_image.py gen.png --cutout flood --trim --pad 24 --mode line --thick 2 --knockout -o out/statue-line.png
  # a photo with a dark background: keep only the light subject, crop first
  python3 -I process_image.py photo.jpg --crop 12%,0,60%,100% --cutout luma --key dark --tol 70 --erode 2 --trim --mode halftone --cell 5 --knockout -o out/bust.png
  # full-tonal grayscale for the one Duotone exception
  python3 -I process_image.py photo.jpg --cutout flood --trim --mode duotone --ink "#000000" --paper "#ffffff" -o out/bust-gray.png
"""
import argparse
import sys

try:
    from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps
except ImportError:  # pragma: no cover
    sys.stderr.write("Pillow is required: pip install Pillow\n")
    sys.exit(2)

SENTINEL = (255, 0, 255)


def hex_rgb(value):
    v = value.lstrip('#')
    if len(v) == 3:
        v = ''.join(c * 2 for c in v)
    return tuple(int(v[i:i + 2], 16) for i in (0, 2, 4))


def parse_box(spec, w, h):
    """x,y,w,h in px or % -> pixel box (left, top, right, bottom)."""
    parts = spec.split(',')
    if len(parts) != 4:
        raise SystemExit('--crop expects x,y,w,h')
    vals = []
    for p, ref in zip(parts, (w, h, w, h)):
        p = p.strip()
        vals.append(round(float(p[:-1]) / 100 * ref) if p.endswith('%') else int(float(p)))
    x, y, cw, ch = vals
    return (max(0, x), max(0, y), min(w, x + cw), min(h, y + ch))


# ---------- stage 1: geometry ----------

def load(path):
    img = Image.open(path)
    img.load()
    return img.convert('RGBA')


def geometry(img, a):
    if a.rotate:
        img = img.rotate(-a.rotate, expand=True, resample=Image.BICUBIC, fillcolor=(0, 0, 0, 0))
    if a.flip == 'h':
        img = ImageOps.mirror(img)
    elif a.flip == 'v':
        img = ImageOps.flip(img)
    if a.crop:
        img = img.crop(parse_box(a.crop, img.width, img.height))
    return img


# ---------- stage 2: cutout ----------

def cutout(img, a):
    if not a.cutout:
        return img
    rgb = img.convert('RGB')
    w, h = rgb.size
    if a.cutout == 'flood':
        work = rgb.copy()
        seeds = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
        for xy in seeds:
            if work.getpixel(xy) != SENTINEL:
                ImageDraw.floodfill(work, xy, SENTINEL, thresh=a.tol)
        px = work.load()
        mask = Image.new('L', (w, h), 255)
        mp = mask.load()
        for y in range(h):
            for x in range(w):
                if px[x, y] == SENTINEL:
                    mp[x, y] = 0
    elif a.cutout == 'color':
        key = hex_rgb(a.key if a.key and a.key.startswith('#') else '#ffffff')
        mask = Image.new('L', (w, h), 255)
        mp = mask.load()
        px = rgb.load()
        t = a.tol
        for y in range(h):
            for x in range(w):
                r, g, b = px[x, y]
                if abs(r - key[0]) <= t and abs(g - key[1]) <= t and abs(b - key[2]) <= t:
                    mp[x, y] = 0
    elif a.cutout == 'luma':
        gray = rgb.convert('L')
        if (a.key or 'light') == 'dark':
            mask = gray.point(lambda p: 0 if p <= a.tol else 255, mode='L')
        else:
            mask = gray.point(lambda p: 0 if p >= 255 - a.tol else 255, mode='L')
    else:
        raise SystemExit('unknown cutout')

    if a.despeckle > 1:
        k = a.despeckle if a.despeckle % 2 else a.despeckle + 1
        mask = mask.filter(ImageFilter.MedianFilter(k))
    if a.erode > 0:
        mask = mask.filter(ImageFilter.MinFilter(a.erode * 2 + 1))
    if a.keep_largest:
        mask = largest_component(mask)
    mask = mask.point(lambda p: 255 if p >= 128 else 0, mode='L')  # hard edge (MAT-3)
    existing = img.getchannel('A')
    combined = Image.composite(mask, Image.new('L', (w, h), 0), existing.point(lambda p: 255 if p > 32 else 0, mode='L'))
    out = img.copy()
    out.putalpha(combined)
    return out


def largest_component(mask):
    """Keep only the largest opaque region (drops floating specks and stray background islands)."""
    w, h = mask.size
    work = mask.convert('RGB')
    px = work.load()
    best, best_xy = 0, None
    seen = Image.new('L', (w, h), 0)
    sp = seen.load()
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if px[x, y] == (255, 255, 255) and sp[x, y] == 0:
                probe = work.copy()
                ImageDraw.floodfill(probe, (x, y), SENTINEL, thresh=0)
                diff = probe.load()
                count = 0
                for yy in range(h):
                    for xx in range(w):
                        if diff[xx, yy] == SENTINEL:
                            count += 1
                            sp[xx, yy] = 255
                if count > best:
                    best, best_xy = count, (x, y)
    if best_xy is None:
        return mask
    ImageDraw.floodfill(work, best_xy, SENTINEL, thresh=0)
    px = work.load()
    out = Image.new('L', (w, h), 0)
    op = out.load()
    for y in range(h):
        for x in range(w):
            if px[x, y] == SENTINEL:
                op[x, y] = 255
    return out


# ---------- stage 3: trim, pad ----------

def trim(img, a):
    if a.trim:
        bbox = img.getchannel('A').point(lambda p: 255 if p > 32 else 0).getbbox()
        if bbox:
            img = img.crop(bbox)
    if a.pad:
        img = ImageOps.expand(img, border=a.pad, fill=(0, 0, 0, 0))
    return img


# ---------- stage 4: tone adjustments and scale ----------

def adjust(img, a):
    rgb, alpha = img.convert('RGB'), img.getchannel('A')
    if a.levels:
        lo, hi = (int(v) for v in a.levels.split(','))
        rgb = rgb.point(lambda p: max(0, min(255, round((p - lo) * 255 / max(1, hi - lo)))))
    if a.contrast != 1:
        rgb = ImageEnhance.Contrast(rgb).enhance(a.contrast)
    if a.gamma != 1:
        rgb = rgb.point(lambda p: round(255 * (p / 255) ** (1 / a.gamma)))
    if a.blur_pre:
        rgb = rgb.filter(ImageFilter.GaussianBlur(a.blur_pre))
    out = rgb.convert('RGBA')
    out.putalpha(alpha)
    return out


def scale(img, a):
    if a.scale and a.scale != 1:
        img = img.resize((max(1, round(img.width * a.scale)), max(1, round(img.height * a.scale))), Image.LANCZOS)
    if a.max and max(img.size) > a.max:
        k = a.max / max(img.size)
        img = img.resize((max(1, round(img.width * k)), max(1, round(img.height * k))), Image.LANCZOS)
    return img


# ---------- stage 5: reduction ----------

def luminance(img):
    """Grayscale with alpha composited onto white so cutouts read correctly."""
    bg = Image.new('RGBA', img.size, (255, 255, 255, 255))
    bg.alpha_composite(img)
    return bg.convert('L'), img.getchannel('A')


def binary_threshold(gray, level):
    cut = int(round(level * 255))
    return gray.point(lambda p: 255 if p > cut else 0, mode='L')


def mode_threshold(gray, alpha, a):
    return binary_threshold(gray, a.level)


def mode_negative(gray, alpha, a):
    return binary_threshold(ImageOps.invert(gray), a.level)


def mode_dither(gray, alpha, a):
    return gray.convert('1').convert('L')  # Floyd-Steinberg


def mode_silhouette(gray, alpha, a):
    if alpha.getextrema()[0] < 255:
        return alpha.point(lambda p: 0 if p > 32 else 255, mode='L')
    return binary_threshold(gray, a.level)


def subject_mask(alpha):
    return alpha.point(lambda p: 255 if p > 32 else 0, mode='L')


def mode_line(gray, alpha, a):
    soft = gray.filter(ImageFilter.GaussianBlur(a.blur))
    edges = soft.filter(ImageFilter.FIND_EDGES)
    cut = int(round(a.level * 255 * 0.35))
    ink = edges.point(lambda p: 0 if p > cut else 255, mode='L')
    if a.thick > 1:
        ink = ink.filter(ImageFilter.MinFilter(a.thick if a.thick % 2 else a.thick + 1))
    return Image.composite(ink, Image.new('L', ink.size, 255), subject_mask(alpha))


def mode_halftone(gray, alpha, a):
    cell = max(2, a.cell)
    w, h = gray.size
    out = Image.new('L', (w, h), 255)
    draw = ImageDraw.Draw(out)
    small = gray.resize((max(1, w // cell), max(1, h // cell)), Image.BOX)
    px = small.load()
    rmax = cell * 0.72
    for j in range(small.height):
        for i in range(small.width):
            dark = 1 - px[i, j] / 255
            if dark <= 0.02:
                continue
            r = rmax * (dark ** 0.5)
            cx = i * cell + cell / 2 + (cell / 2 if a.stagger and j % 2 else 0)
            cy = j * cell + cell / 2
            draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)
    return Image.composite(out, Image.new('L', out.size, 255), subject_mask(alpha))


def mode_posterize(gray, alpha, a):
    n = max(2, a.levels_n)
    return gray.point(lambda p: int(round(round(p / 255 * (n - 1)) / (n - 1) * 255)), mode='L')


def mode_duotone(gray, alpha, a):
    return gray  # full tones; colorized below


MODES = {
    'threshold': mode_threshold, 'negative': mode_negative, 'dither': mode_dither,
    'silhouette': mode_silhouette, 'line': mode_line, 'halftone': mode_halftone,
    'posterize': mode_posterize, 'duotone': mode_duotone,
}


def colorize(gray, ink, paper, alpha, knockout):
    """Map 0..255 gray to ink..paper. Knockout makes paper transparent; the cutout alpha always applies."""
    has_alpha = alpha.getextrema()[0] < 255
    rgb = ImageOps.colorize(gray, black=ink, white=paper)
    if not knockout and not has_alpha:
        return rgb
    a = gray.point(lambda p: 255 - p, mode='L') if knockout else Image.new('L', gray.size, 255)
    if has_alpha:
        a = Image.composite(a, Image.new('L', a.size, 0), subject_mask(alpha))
    out = Image.new('RGBA', gray.size, ink + (255,)) if knockout else rgb.convert('RGBA')
    out.putalpha(a)
    return out


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument('input')
    p.add_argument('-o', '--output', required=True)
    g = p.add_argument_group('geometry')
    g.add_argument('--rotate', type=float, default=0, help='degrees clockwise')
    g.add_argument('--flip', choices=['h', 'v'])
    g.add_argument('--crop', help='x,y,w,h in px or %% (e.g. 10%%,0,50%%,100%%)')
    c = p.add_argument_group('cutout')
    c.add_argument('--cutout', choices=['flood', 'color', 'luma'])
    c.add_argument('--key', help='color #hex for --cutout color; "light" or "dark" for --cutout luma')
    c.add_argument('--tol', type=int, default=40, help='tolerance 0..255')
    c.add_argument('--despeckle', type=int, default=3, help='median filter size on the mask (0 to disable)')
    c.add_argument('--erode', type=int, default=1, help='shrink the mask by N px to drop fringes')
    c.add_argument('--keep-largest', action='store_true', help='keep only the largest opaque region (slow on big images)')
    t = p.add_argument_group('trim and tone')
    t.add_argument('--trim', action='store_true', help='crop to the opaque bounding box')
    t.add_argument('--pad', type=int, default=0, help='transparent padding after trim')
    t.add_argument('--levels', help='lo,hi input levels to stretch, e.g. 30,220')
    t.add_argument('--contrast', type=float, default=1.0)
    t.add_argument('--gamma', type=float, default=1.0)
    t.add_argument('--blur-pre', type=float, default=0, help='blur before reduction to calm noise')
    t.add_argument('--scale', type=float, default=1.0)
    t.add_argument('--max', type=int, default=0, help='limit the long edge in px')
    r = p.add_argument_group('reduction')
    r.add_argument('--mode', choices=sorted(MODES), default='threshold')
    r.add_argument('--level', type=float, default=0.5, help='cut point 0..1 for threshold/negative/silhouette/line')
    r.add_argument('--cell', type=int, default=6, help='halftone cell size in px')
    r.add_argument('--stagger', action='store_true', help='stagger halftone rows')
    r.add_argument('--levels-n', type=int, default=3, help='posterize levels')
    r.add_argument('--blur', type=float, default=1.2, help='pre-blur for line mode')
    r.add_argument('--thick', type=int, default=1, help='line thickness in px for line mode')
    r.add_argument('--ink', default='#111111')
    r.add_argument('--paper', default='#ffffff')
    r.add_argument('--knockout', action='store_true', help='make paper transparent (ink-on-alpha PNG)')
    a = p.parse_args()

    img = load(a.input)
    img = geometry(img, a)
    img = cutout(img, a)
    img = trim(img, a)
    img = adjust(img, a)
    img = scale(img, a)
    gray, alpha = luminance(img)
    reduced = MODES[a.mode](gray, alpha, a)
    out = colorize(reduced, hex_rgb(a.ink), hex_rgb(a.paper), alpha, a.knockout)
    out.save(a.output, 'PNG')
    opaque = sum(1 for v in out.getchannel('A').getdata() if v > 0) if out.mode == 'RGBA' else out.width * out.height
    print(f"{a.mode}: {out.width}x{out.height}, opaque {opaque / (out.width * out.height):.1%} -> {a.output}")


if __name__ == '__main__':
    main()
