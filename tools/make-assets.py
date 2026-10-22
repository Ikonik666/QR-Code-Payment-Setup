#!/usr/bin/env python3
"""
DesiTease - asset build script.

Regenerates every image the site ships:
  * assets/packs/<id>.webp   -> procedurally generated pack cover art (800x800)
  * assets/bg/hero.webp      -> resized hero backdrop
  * assets/bg/footer.webp    -> resized footer backdrop
  * assets/brand/upi-qr.webp -> optimised UPI QR (webp)
  * assets/brand/upi-qr.png  -> lossless UPI QR (for download / printing)

Run:  python tools/make-assets.py
Requires: Pillow, numpy
"""

import math
import os
import shutil

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PACKS = os.path.join(ROOT, "assets", "packs")
OUT_BG = os.path.join(ROOT, "assets", "bg")
OUT_BRAND = os.path.join(ROOT, "assets", "brand")

SIZE = 800


# --------------------------------------------------------------------------
# pack definitions: id -> (base rgb, [accent rgb...], icon, accent angle deg)
# --------------------------------------------------------------------------
PACKS = {
    "pdf": (
        (26, 16, 12),
        [(255, 159, 67), (255, 94, 98)],
        "doc",
    ),
    "audio": (
        (24, 15, 18),
        [(255, 122, 122), (255, 176, 84)],
        "wave",
    ),
    "ai": (
        (18, 12, 28),
        [(168, 85, 247), (99, 102, 241)],
        "node",
    ),
    "aivideo": (
        (16, 12, 30),
        [(139, 92, 246), (236, 72, 153)],
        "play",
    ),
    "avatar": (
        (20, 11, 24),
        [(217, 70, 239), (59, 130, 246)],
        "avatar",
    ),
    "writer": (
        (14, 16, 30),
        [(129, 140, 248), (45, 212, 191)],
        "pencil",
    ),
    "series": (
        (30, 12, 18),
        [(244, 63, 94), (251, 146, 60)],
        "film",
    ),
    "master": (
        (24, 18, 8),
        [(250, 204, 21), (249, 115, 22)],
        "spark",
    ),
}


# --------------------------------------------------------------------------
# gradient helpers
# --------------------------------------------------------------------------
def _grid(size):
    ys, xs = np.mgrid[0:size, 0:size]
    return xs / size, ys / size


def render_cover(base, accents, size=SIZE):
    """Dark tinted base + additive aurora blobs + vignette + grain."""
    x, y = _grid(size)
    img = np.zeros((size, size, 3), dtype=np.float32)
    img[:] = np.array(base, dtype=np.float32)

    # aurora blobs
    spots = [
        (0.26, 0.22, 0.62, 0.0),
        (0.78, 0.34, 0.55, 1.1),
        (0.52, 0.88, 0.70, 2.2),
    ]
    for i, (ax, ay, rad, rot) in enumerate(spots):
        color = np.array(accents[i % len(accents)], dtype=np.float32)
        dx, dy = x - ax, y - ay
        if rot:
            c, s = math.cos(rot), math.sin(rot)
            dx, dy = dx * c - dy * s, dx * s + dy * c
        d = np.sqrt(dx * dx + dy * dy) / rad
        fall = np.clip(1.0 - d, 0.0, 1.0) ** 2.4
        img += fall[..., None] * color * 0.55

    # a soft diagonal sheen
    sheen = np.clip(1.0 - np.abs((x + y) - 0.85) / 0.9, 0, 1) ** 3
    img += sheen[..., None] * 28.0

    # vignette
    vx, vy = x - 0.5, y - 0.5
    vig = np.clip(1.0 - (vx * vx + vy * vy) * 1.55, 0.0, 1.0)
    img *= (0.42 + 0.58 * vig)[..., None]

    # grain
    rng = np.random.default_rng(abs(hash(base[0] * 1000 + base[2])) % (2**32))
    img += rng.normal(0, 3.2, img.shape).astype(np.float32)

    out = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")
    return out


# --------------------------------------------------------------------------
# icon glyphs (drawn white, composited over the gradient)
# --------------------------------------------------------------------------
def _rrect(draw, box, radius, outline=None, width=1, fill=None):
    draw.rounded_rectangle(box, radius=radius, outline=outline, width=width, fill=fill)


def icon_doc(d, cx, cy, s, w):
    bw, bh = s * 0.62, s * 0.82
    _rrect(d, (cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2), s * 0.07, outline=(255, 255, 255, 235), width=w)
    for i, frac in enumerate((0.30, 0.50, 0.70)):
        y = cy - bh / 2 + bh * frac
        half = bw / 2 * (0.72 if i < 2 else 0.48)
        d.line((cx - half, y, cx + half, y), fill=(255, 255, 255, 190), width=w)


def icon_wave(d, cx, cy, s, w):
    heights = (0.30, 0.58, 0.86, 0.62, 0.40, 0.70, 0.34)
    step = s * 0.105
    bw = s * 0.055
    for i, hf in enumerate(heights):
        x = cx + (i - 3) * step
        hh = s * hf
        _rrect(d, (x - bw / 2, cy - hh / 2, x + bw / 2, cy + hh / 2), bw / 2, fill=(255, 255, 255, 225))


def icon_node(d, cx, cy, s, w):
    pts = [
        (cx - s * 0.30, cy - s * 0.24),
        (cx + s * 0.30, cy - s * 0.24),
        (cx - s * 0.34, cy + s * 0.22),
        (cx + s * 0.34, cy + s * 0.22),
        (cx, cy),
    ]
    for a, b in ((4, 0), (4, 1), (4, 2), (4, 3), (0, 2), (1, 3)):
        d.line([pts[a], pts[b]], fill=(255, 255, 255, 150), width=w)
    for i, (px, py) in enumerate(pts):
        r = s * (0.085 if i == 4 else 0.065)
        d.ellipse((px - r, py - r, px + r, py + r), fill=(255, 255, 255, 240))


def icon_play(d, cx, cy, s, w):
    bw, bh = s * 0.78, s * 0.56
    _rrect(d, (cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2), s * 0.10, outline=(255, 255, 255, 235), width=w)
    r = s * 0.14
    d.polygon(
        [
            (cx - r * 0.55, cy - r),
            (cx - r * 0.55, cy + r),
            (cx + r * 0.95, cy),
        ],
        fill=(255, 255, 255, 235),
    )
    # film sprockets
    for i in range(5):
        sx = cx - bw / 2 + bw * (i + 0.5) / 5
        d.rectangle((sx - s * 0.018, cy - bh / 2 - s * 0.055, sx + s * 0.018, cy - bh / 2 - s * 0.012), fill=(255, 255, 255, 120))
        d.rectangle((sx - s * 0.018, cy + bh / 2 + s * 0.012, sx + s * 0.018, cy + bh / 2 + s * 0.055), fill=(255, 255, 255, 120))


def icon_avatar(d, cx, cy, s, w):
    d.ellipse((cx - s * 0.40, cy - s * 0.40, cx + s * 0.40, cy + s * 0.40), outline=(255, 255, 255, 120), width=w)
    d.ellipse((cx - s * 0.30, cy - s * 0.30, cx + s * 0.30, cy + s * 0.30), outline=(255, 255, 255, 190), width=w)
    hr = s * 0.105
    d.ellipse((cx - hr, cy - s * 0.16, cx + hr, cy + s * 0.05), fill=(255, 255, 255, 240))
    d.arc((cx - s * 0.20, cy + s * 0.02, cx + s * 0.20, cy + s * 0.30), 180, 360, fill=(255, 255, 255, 240), width=w)


def icon_pencil(d, cx, cy, s, w):
    ang = math.radians(-38)
    L, H = s * 0.70, s * 0.115
    dx, dy = math.cos(ang) * L / 2, math.sin(ang) * L / 2
    nx, ny = -math.sin(ang) * H / 2, math.cos(ang) * H / 2
    d.polygon(
        [
            (cx - dx - nx, cy - dy - ny),
            (cx + dx - nx, cy + dy - ny),
            (cx + dx + nx, cy + dy + ny),
            (cx - dx + nx, cy - dy + ny),
        ],
        fill=(255, 255, 255, 235),
    )
    # tip
    tx, ty = cx + math.cos(ang) * L / 2, cy + math.sin(ang) * L / 2
    d.polygon(
        [
            (tx + nx, ty + ny),
            (tx - nx, ty - ny),
            (tx + math.cos(ang) * s * 0.14, ty + math.sin(ang) * s * 0.14),
        ],
        fill=(255, 255, 255, 255),
    )
    # spark
    sp = s * 0.20
    sx, sy = cx - s * 0.34, cy + s * 0.28
    d.polygon(
        [
            (sx, sy - sp), (sx + sp * 0.24, sy - sp * 0.24), (sx + sp, sy),
            (sx + sp * 0.24, sy + sp * 0.24), (sx, sy + sp), (sx - sp * 0.24, sy + sp * 0.24),
            (sx - sp, sy), (sx - sp * 0.24, sy - sp * 0.24),
        ],
        fill=(255, 255, 255, 210),
    )


def icon_film(d, cx, cy, s, w):
    bw, bh = s * 0.82, s * 0.56
    _rrect(d, (cx - bw / 2, cy - bh / 2, cx + bw / 2, cy + bh / 2), s * 0.06, outline=(255, 255, 255, 235), width=w)
    for i in range(6):
        sx = cx - bw / 2 + bw * (i + 0.5) / 6
        d.rectangle((sx - s * 0.022, cy - bh / 2 + s * 0.03, sx + s * 0.022, cy - bh / 2 + s * 0.11), fill=(255, 255, 255, 150))
        d.rectangle((sx - s * 0.022, cy + bh / 2 - s * 0.11, sx + s * 0.022, cy + bh / 2 - s * 0.03), fill=(255, 255, 255, 150))
    r = s * 0.11
    d.polygon([(cx - r * 0.5, cy - r), (cx - r * 0.5, cy + r), (cx + r * 0.9, cy)], fill=(255, 255, 255, 235))


def icon_spark(d, cx, cy, s, w):
    r = s * 0.36
    d.polygon(
        [(cx, cy - r), (cx + r * 0.22, cy - r * 0.22), (cx + r, cy), (cx + r * 0.22, cy + r * 0.22),
         (cx, cy + r), (cx - r * 0.22, cy + r * 0.22), (cx - r, cy), (cx - r * 0.22, cy - r * 0.22)],
        outline=(255, 255, 255, 235), width=w,
    )
    d.polygon(
        [(cx, cy - r * 0.52), (cx + r * 0.12, cy - r * 0.12), (cx + r * 0.52, cy),
         (cx + r * 0.12, cy + r * 0.12), (cx, cy + r * 0.52), (cx - r * 0.12, cy + r * 0.12),
         (cx - r * 0.52, cy), (cx - r * 0.12, cy - r * 0.12)],
        fill=(255, 255, 255, 230),
    )


ICONS = {
    "doc": icon_doc,
    "wave": icon_wave,
    "node": icon_node,
    "play": icon_play,
    "avatar": icon_avatar,
    "pencil": icon_pencil,
    "film": icon_film,
    "spark": icon_spark,
}


def build_cover(pid, base, accents, icon_name):
    img = render_cover(base, accents)
    layer = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    ICONS[icon_name](d, SIZE / 2, SIZE / 2 - SIZE * 0.02, SIZE * 0.62, max(4, int(SIZE * 0.017)))
    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    out = Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")
    path = os.path.join(OUT_PACKS, f"{pid}.webp")
    out.save(path, "WEBP", quality=78, method=6)
    return path


# --------------------------------------------------------------------------
# existing artwork -> resized / recompressed
# --------------------------------------------------------------------------
def save_webp(src, dst, width, quality=74):
    im = Image.open(src).convert("RGB")
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=quality, method=6)
    return os.path.getsize(dst)


def main():
    for d in (OUT_PACKS, OUT_BG, OUT_BRAND):
        os.makedirs(d, exist_ok=True)

    for pid, (base, accents, icon) in PACKS.items():
        p = build_cover(pid, base, accents, icon)
        print(f"cover  {os.path.relpath(p, ROOT):42s} {os.path.getsize(p)/1024:7.1f} KB")

    legacy = os.path.join(ROOT, "tools", "source")
    if os.path.isdir(legacy):
        hero = os.path.join(legacy, "header-bg.webp")
        foot = os.path.join(legacy, "footer-bg.webp")
        qr = os.path.join(legacy, "upi-qr.png")
        if os.path.exists(hero):
            n = save_webp(hero, os.path.join(OUT_BG, "hero.webp"), 1600, 70)
            print(f"bg     assets/bg/hero.webp{'':23s} {n/1024:7.1f} KB")
        if os.path.exists(foot):
            n = save_webp(foot, os.path.join(OUT_BG, "footer.webp"), 1400, 68)
            print(f"bg     assets/bg/footer.webp{'':21s} {n/1024:7.1f} KB")
        if os.path.exists(qr):
            im = Image.open(qr).convert("RGB").resize((600, 600), Image.LANCZOS)
            im.save(os.path.join(OUT_BRAND, "upi-qr.png"), "PNG", optimize=True)
            im.save(os.path.join(OUT_BRAND, "upi-qr.webp"), "WEBP", quality=92, method=6)
            print("brand  assets/brand/upi-qr.{png,webp}")


if __name__ == "__main__":
    main()
