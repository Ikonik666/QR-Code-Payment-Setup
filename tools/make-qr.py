#!/usr/bin/env python3
"""
Rebuild the UPI QR from its decoded payload so it is a clean, correctly
padded, reliably-scannable image (the original was cropped 918x915 with no
quiet zone on two edges and could fail in real UPI apps).

Payload is decoded from the legacy artwork, then re-rendered with a
4-module quiet zone and the Google Pay badge composited in the centre.
"""

import os

import qrcode
from qrcode.constants import ERROR_CORRECT_H
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEGACY = os.path.join(ROOT, "legacy-assets", "upi-qr.png")
OUT = os.path.join(ROOT, "assets", "brand")

PAYLOAD = "upi://pay?pa=gursherweb@okaxis&pn=Gursher%20Web&aid=uGICAgKCDwoiFPw"
TARGET = 600


def extract_badge(src):
    """Pull the circular Google Pay badge out of the legacy QR."""
    im = Image.open(src).convert("RGBA")
    w, h = im.size
    cx, cy = w / 2, h / 2
    r = int(min(w, h) * 0.16)
    badge = im.crop((int(cx - r), int(cy - r), int(cx + r), int(cy + r))).resize((256, 256), Image.LANCZOS)

    # circular alpha mask so the badge sits cleanly on the QR
    mask = Image.new("L", (256, 256), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 255, 255), fill=255)
    badge.putalpha(mask)
    return badge


def main():
    os.makedirs(OUT, exist_ok=True)

    qr = qrcode.QRCode(
        error_correction=ERROR_CORRECT_H,
        box_size=10,
        border=4,
    )
    qr.add_data(PAYLOAD)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGBA")
    img = img.resize((TARGET, TARGET), Image.NEAREST)

    if os.path.exists(LEGACY):
        badge = extract_badge(LEGACY)
        size = int(TARGET * 0.21)
        badge = badge.resize((size, size), Image.LANCZOS)
        # white plate behind the badge keeps the high-contrast modules intact
        plate = Image.new("RGBA", (size, size), (255, 255, 255, 255))
        plate.alpha_composite(badge)
        pos = ((TARGET - size) // 2, (TARGET - size) // 2)
        img.alpha_composite(plate, pos)

    out = img.convert("RGB")
    out.save(os.path.join(OUT, "upi-qr.png"), "PNG", optimize=True)
    out.save(os.path.join(OUT, "upi-qr.webp"), "WEBP", quality=94, method=6)
    print("wrote assets/brand/upi-qr.png + .webp")


if __name__ == "__main__":
    main()
