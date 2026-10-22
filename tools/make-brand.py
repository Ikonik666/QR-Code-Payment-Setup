#!/usr/bin/env python3
"""
Renders the brand marks: PWA icons (32/192/512) and the Open Graph card
(1200x630). Uses the same aurora look as the pack covers.

Run:  python tools/make-brand.py
"""

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
BLACK = r"C:\Windows\Fonts\segoeuiz.ttf"
REG = r"C:\Windows\Fonts\segoeui.ttf"


def font(path, size):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def aurora(size, seed=0):
    ys, xs = np.mgrid[0:size, 0:size]
    x, y = xs / size, ys / size
    img = np.zeros((size, size, 3), dtype=np.float32)
    img[:] = np.array((10, 6, 8), dtype=np.float32)
    spots = [(0.22, 0.18, 0.60, (255, 59, 78)), (0.82, 0.30, 0.55, (255, 107, 61)), (0.48, 0.92, 0.68, (168, 85, 247))]
    for ax, ay, rad, col in spots:
        d = np.sqrt((x - ax) ** 2 + (y - ay) ** 2) / rad
        fall = np.clip(1 - d, 0, 1) ** 2.3
        img += fall[..., None] * np.array(col, dtype=np.float32) * 0.5
    vx, vy = x - 0.5, y - 0.5
    vig = np.clip(1 - (vx * vx + vy * vy) * 1.5, 0, 1)
    img *= (0.45 + 0.55 * vig)[..., None]
    rng = np.random.default_rng(seed)
    img += rng.normal(0, 2.6, img.shape).astype(np.float32)
    return Image.fromarray(np.clip(img, 0, 255).astype(np.uint8), "RGB")


def make_icon(size, path):
    im = aurora(size, seed=7).convert("RGBA")
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=(10, 6, 8, 235))
    # gradient badge
    badge = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    bd = ImageDraw.Draw(badge)
    m = int(size * 0.16)
    bd.rounded_rectangle((m, m, size - m, size - m), radius=int(size * 0.16), fill=(255, 59, 78, 255))
    bd.rounded_rectangle((m, int(size * 0.52), size - m, size - m), radius=int(size * 0.16), fill=(255, 107, 61, 255))
    im.alpha_composite(badge)

    f = font(BLACK, int(size * 0.40))
    txt = "DT"
    bbox = d.textbbox((0, 0), txt, font=f)
    d.text(((size - (bbox[2] - bbox[0])) / 2 - bbox[0], (size - (bbox[3] - bbox[1])) / 2 - bbox[1]),
           txt, font=f, fill=(255, 255, 255, 255))
    im.convert("RGB").save(path, "PNG", optimize=True)
    print(f"icon   {os.path.relpath(path, ROOT):34s} {size}x{size}")


def make_og(path):
    W, H = 1200, 630
    im = aurora(W, seed=3).convert("RGBA")
    d = ImageDraw.Draw(im)

    # soft corner glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W - 460, -260, W + 220, 300), fill=(255, 59, 78, 70))
    glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(120))
    im.alpha_composite(glow)

    # ---- cover tile cluster on the right ----
    tiles = ["aivideo", "pdf", "audio", "ai"]
    tp = os.path.join(ROOT, "assets", "packs")
    tw, th = 178, 178
    positions = [(812, 96), (966, 178), (812, 300), (966, 382)]
    for (name, (px, py)) in zip(tiles, positions):
        src = os.path.join(tp, f"{name}.webp")
        if not os.path.exists(src):
            continue
        card = Image.open(src).convert("RGB").resize((tw, th), Image.LANCZOS)
        mask = Image.new("L", (tw, th), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, tw - 1, th - 1), radius=22, fill=255)
        shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        ImageDraw.Draw(shadow).rounded_rectangle((px + 5, py + 9, px + tw + 5, py + th + 9), radius=22, fill=(0, 0, 0, 120))
        shadow = shadow.filter(__import__("PIL.ImageFilter", fromlist=["ImageFilter"]).GaussianBlur(14))
        im.alpha_composite(shadow)
        im.paste(card, (px, py), mask)

    # ---- text block, vertically centred ----
    d.rounded_rectangle((84, 214, 184, 314), radius=24, fill=(255, 59, 78, 255))
    d.rounded_rectangle((84, 264, 184, 314), radius=24, fill=(255, 107, 61, 255))
    d.text((109, 236), "DT", font=font(BLACK, 42), fill=(255, 255, 255, 255))

    d.text((212, 238), "Desi", font=font(BLACK, 56), fill=(246, 241, 243, 255))
    d.text((212 + d.textlength("Desi", font=font(BLACK, 56)), 238), "Tease",
           font=font(BLACK, 56), fill=(255, 59, 78, 255))

    d.text((84, 366), "Premium archive · Lifetime access", font=font(REG, 29), fill=(246, 241, 243, 205))
    d.text((84, 410), "Original stories · Audio drama · AI content",
           font=font(REG, 25), fill=(246, 241, 243, 140))

    chips = ["UPI", "PayPal", "Crypto", "Instant delivery"]
    x = 84
    for c in chips:
        w = int(d.textlength(c, font=font(REG, 20))) + 32
        d.rounded_rectangle((x, 476, x + w, 518), radius=21, outline=(255, 255, 255, 60), width=2)
        d.text((x + 16, 485), c, font=font(REG, 20), fill=(246, 241, 243, 190))
        x += w + 11

    d.text((84, 552), "desitease.netlify.app", font=font(REG, 21), fill=(246, 241, 243, 120))

    # bottom accent rule
    bar = Image.new("RGBA", (W, 6), (0, 0, 0, 0))
    bd2 = ImageDraw.Draw(bar)
    for i in range(W):
        t = i / W
        r = int(255 * (1 - t) + 168 * t)
        g = int(59 * (1 - t) + 85 * t)
        b = int(78 * (1 - t) + 247 * t)
        bd2.point((i, 2), fill=(r, g, b, 235))
    im.alpha_composite(bar)

    im.convert("RGB").save(path, "PNG", optimize=True)
    jpg = path.replace(".png", ".jpg")
    im.convert("RGB").save(jpg, "JPEG", quality=86, optimize=True, progressive=True)
    print(f"og     {os.path.relpath(path, ROOT):34s} 1200x630")
    print(f"og     {os.path.relpath(jpg, ROOT):34s} 1200x630")


def main():
    make_icon(32, os.path.join(ROOT, "favicon-32x32.png"))
    make_icon(192, os.path.join(ROOT, "icon-192.png"))
    make_icon(512, os.path.join(ROOT, "icon-512.png"))
    make_og(os.path.join(ROOT, "assets", "brand", "og-card.png"))


if __name__ == "__main__":
    main()
