#!/usr/bin/env python3
"""Generates all app icons from itch-icons/source.png:

- kitch-icons/source.png (hue-rotated copy of the itch source)
- iconNN.png at every size for both variants
- itch.ico for Windows (single 256px entry, same as before)
- tray PNGs under src/static/images/tray/
- macOS itch.icns + dock PNGs under src/static/images/window/, masked into
  the standard macOS icon shape (macos-squircle-mask-1024.png) with a
  background gradient, rim light, and glyph shadow applied

The macOS part expects source art with a solid background and a white
glyph. Replaces the old resize-icons.rb (ruby + ImageMagick).

Note: Pillow's Lanczos resampling differs slightly from ImageMagick's, so
rerunning this regenerates every output with small pixel diffs. Only run
it when the source art actually changes.

Needs Pillow + numpy, plus iconutil. Run from this directory:
python3 make-icons.py
"""

import os
import shutil
import subprocess
import tempfile

import numpy as np
from PIL import Image, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
STATIC_IMAGES = os.path.join(HERE, "..", "..", "src", "static", "images")
MASK_PATH = os.path.join(HERE, "macos-squircle-mask-1024.png")

PNG_SIZES = [16, 32, 36, 48, 64, 72, 114, 128, 144, 150, 256, 512, 1024]

# equivalent of the old `convert -modulate 100,100,15`: (15 - 100) * 1.8
KITCH_HUE_ROTATE = -153.0

CANVAS = 1024
SQUIRCLE = 824  # solid artwork size on Apple's 1024 grid
OVERFILL = 8  # bleed past the mask edge to avoid fringing, per side

# @1x sizes required by iconutil; @2x is derived
ICONSET_SIZES = [16, 32, 128, 256, 512]

# squircle vertical extent on the canvas, for gradient/rim math
SQ_TOP = (CANVAS - SQUIRCLE) // 2
SQ_BOTTOM = SQ_TOP + SQUIRCLE

# glass treatment tuning (all at 1024 scale)
GLYPH_SCALE = 0.94  # slight shrink to Apple-like content margins (~83% of tile)
GLYPH_CENTER_Y = 505  # optical vertical center (slightly above geometric)
GRADIENT_LIGHTEN = 0.14  # background blend toward white at the top
GRADIENT_DARKEN = 0.90  # background multiplier at the bottom
GLYPH_SHADOW_BLUR = 9
GLYPH_SHADOW_OFFSET = 10
GLYPH_SHADOW_OPACITY = 0.22
RIM_WIDTH = 9  # erosion kernel; rim band is about half this
RIM_BLUR = 2.5
# rim light strength at the top edge / sides / bottom edge
RIM_TOP, RIM_MID, RIM_BOTTOM = 0.55, 0.16, 0.30


def hue_rotate(img, degrees):
    """Rotate the hue of an RGBA image, leaving alpha alone."""
    rgba = np.asarray(img.convert("RGBA")).astype(np.float64) / 255.0
    r, g, b = rgba[..., 0], rgba[..., 1], rgba[..., 2]
    mx = rgba[..., :3].max(axis=-1)
    mn = rgba[..., :3].min(axis=-1)
    c = mx - mn

    h = np.zeros_like(mx)
    m = c > 0
    with np.errstate(invalid="ignore", divide="ignore"):
        idx = m & (mx == r)
        h[idx] = ((g - b)[idx] / c[idx]) % 6
        idx = m & (mx == g) & (mx != r)
        h[idx] = (b - r)[idx] / c[idx] + 2
        idx = m & (mx == b) & (mx != r) & (mx != g)
        h[idx] = (r - g)[idx] / c[idx] + 4

    h = (h + degrees / 60.0) % 6
    x = c * (1 - np.abs(h % 2 - 1))
    z = np.zeros_like(c)
    hi = h.astype(int) % 6
    comps = [(c, x, z), (x, c, z), (z, c, x), (z, x, c), (x, z, c), (c, z, x)]
    conds = [hi == i for i in range(6)]
    base = mx - c
    out = np.stack(
        [
            np.select(conds, [t[0] for t in comps]) + base,
            np.select(conds, [t[1] for t in comps]) + base,
            np.select(conds, [t[2] for t in comps]) + base,
            rgba[..., 3],
        ],
        axis=-1,
    )
    return Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8))


def compose_flat(src_path):
    """Crop the full-bleed source to its solid artwork rect and place it
    on the 1024 canvas, slightly overfilled past the mask edge."""
    src = Image.open(src_path).convert("RGBA")
    assert src.size == (CANVAS, CANVAS), f"{src_path} is not 1024x1024"

    # crop to the fully-opaque artwork rect, discarding any old
    # baked-in shadow or rounded-corner padding
    solid = src.getchannel("A").point(lambda v: 255 if v >= 250 else 0)
    art = src.crop(solid.getbbox())

    size = SQUIRCLE + OVERFILL * 2
    art = art.resize((size, size), Image.LANCZOS)

    canvas = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    canvas.paste(art, (SQ_TOP - OVERFILL, SQ_TOP - OVERFILL))
    return canvas


def vertical_ramp(top, mid, bottom):
    """Per-row weight: piecewise linear over the squircle's vertical span."""
    y = np.arange(CANVAS)
    ramp = np.interp(y, [SQ_TOP, CANVAS / 2, SQ_BOTTOM], [top, mid, bottom])
    return ramp[:, None]


def compose_master(src_path, mask):
    flat = np.asarray(compose_flat(src_path)).astype(np.float64) / 255.0
    rgb = flat[..., :3]

    # separate the white glyph from the solid background: project each
    # pixel onto the bg->white color axis, giving an antialiased matte
    bg = rgb[150, 512].copy()  # top center, always background
    axis = 1.0 - bg
    glyph = np.clip(
        ((rgb - bg) * axis).sum(axis=2) / max((axis * axis).sum(), 1e-6), 0.0, 1.0
    )

    # kill stray speck pixels (leftover corner AA from the old artwork)
    # before taking the bbox, or they inflate it and push the glyph
    # off-center; morphological opening removes anything smaller than the
    # kernel, then a dilated gate keeps the real glyph's AA fringe intact
    matte = Image.fromarray((glyph * 255).astype(np.uint8))
    opened = matte.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    gate = np.asarray(opened.filter(ImageFilter.MaxFilter(9)), dtype=np.float64) > 0
    glyph = glyph * gate

    # rescale and re-center the glyph to match the content margins of
    # first-party icons
    ys, xs = np.where(glyph > 0.5)
    crop = Image.fromarray((glyph * 255).astype(np.uint8)).crop(
        (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1)
    )
    w = round(crop.width * GLYPH_SCALE)
    h = round(crop.height * GLYPH_SCALE)
    crop = crop.resize((w, h), Image.LANCZOS)
    glyph = np.zeros_like(glyph)
    x0 = (CANVAS - w) // 2
    y0 = GLYPH_CENTER_Y - h // 2
    glyph[y0 : y0 + h, x0 : x0 + w] = np.asarray(crop, dtype=np.float64) / 255.0

    # background: vertical gradient, light at the top, dimmer at the bottom
    top_col = bg + (1.0 - bg) * GRADIENT_LIGHTEN
    bottom_col = bg * GRADIENT_DARKEN
    s = vertical_ramp(0.0, 0.5, 1.0)[..., None]
    grad = top_col * (1.0 - s) + bottom_col * s  # (CANVAS, 1, 3)
    out = np.broadcast_to(grad, (CANVAS, CANVAS, 3)).copy()

    # soft shadow under the glyph
    shadow = np.asarray(
        Image.fromarray((glyph * 255).astype(np.uint8)).filter(
            ImageFilter.GaussianBlur(GLYPH_SHADOW_BLUR)
        ),
        dtype=np.float64,
    ) / 255.0
    shadow = np.roll(shadow, GLYPH_SHADOW_OFFSET, axis=0)
    shadow[:GLYPH_SHADOW_OFFSET, :] = 0.0
    out *= 1.0 - shadow[..., None] * GLYPH_SHADOW_OPACITY

    # the glyph itself, back on top in white
    out = out * (1.0 - glyph[..., None]) + glyph[..., None]

    # inset rim light: a thin band just inside the squircle edge,
    # brightest along the top, faint on the sides, mild at the bottom
    eroded = mask.filter(ImageFilter.MinFilter(RIM_WIDTH))
    band = Image.fromarray(
        np.clip(
            np.asarray(mask, dtype=np.int16) - np.asarray(eroded, dtype=np.int16),
            0,
            255,
        ).astype(np.uint8)
    ).filter(ImageFilter.GaussianBlur(RIM_BLUR))
    rim = (np.asarray(band, dtype=np.float64) / 255.0) * vertical_ramp(
        RIM_TOP, RIM_MID, RIM_BOTTOM
    )
    out = out * (1.0 - rim[..., None]) + rim[..., None]

    master = Image.fromarray((np.clip(out, 0, 1) * 255).astype(np.uint8))
    master = master.convert("RGBA")
    master.putalpha(mask)
    return master


def build_icns(master, out_path):
    with tempfile.TemporaryDirectory() as tmp:
        iconset = os.path.join(tmp, "app.iconset")
        os.mkdir(iconset)
        for size in ICONSET_SIZES:
            for scale in (1, 2):
                px = size * scale
                img = master.resize((px, px), Image.LANCZOS)
                suffix = "@2x" if scale == 2 else ""
                img.save(os.path.join(iconset, f"icon_{size}x{size}{suffix}.png"))
        subprocess.run(
            ["iconutil", "-c", "icns", iconset, "-o", os.path.join(tmp, "app.icns")],
            check=True,
        )
        shutil.copyfile(os.path.join(tmp, "app.icns"), out_path)


def main():
    itch_dir = os.path.join(HERE, "itch-icons")
    kitch_dir = os.path.join(HERE, "kitch-icons")

    itch_source = Image.open(os.path.join(itch_dir, "source.png")).convert("RGBA")
    kitch_source = hue_rotate(itch_source, KITCH_HUE_ROTATE)
    kitch_source.save(os.path.join(kitch_dir, "source.png"))
    print("kitch: wrote source.png")

    mask = Image.open(MASK_PATH).convert("L")
    for app, source in (("itch", itch_source), ("kitch", kitch_source)):
        icons_dir = os.path.join(HERE, f"{app}-icons")

        for size in PNG_SIZES:
            resized = source.resize((size, size), Image.LANCZOS)
            resized.save(os.path.join(icons_dir, f"icon{size}.png"))
        print(f"{app}: wrote icon{{{','.join(map(str, PNG_SIZES))}}}.png")

        Image.open(os.path.join(icons_dir, "icon256.png")).save(
            os.path.join(icons_dir, "itch.ico"), sizes=[(256, 256)]
        )
        print(f"{app}: wrote itch.ico")

        shutil.copyfile(
            os.path.join(icons_dir, "icon256.png"),
            os.path.join(STATIC_IMAGES, "tray", f"{app}.png"),
        )
        shutil.copyfile(
            os.path.join(icons_dir, "icon16.png"),
            os.path.join(STATIC_IMAGES, "tray", f"{app}-small.png"),
        )
        print(f"{app}: wrote tray PNGs")

        master = compose_master(os.path.join(icons_dir, "icon1024.png"), mask)
        master.save(os.path.join(icons_dir, "icon1024-macos.png"))
        build_icns(master, os.path.join(icons_dir, "itch.icns"))
        # runtime dock icon, used by app.dock.setIcon (see winds.ts getIconPath)
        master.resize((512, 512), Image.LANCZOS).save(
            os.path.join(STATIC_IMAGES, "window", app, "icon-macos.png")
        )
        print(f"{app}: wrote icon1024-macos.png + itch.icns + icon-macos.png")


if __name__ == "__main__":
    main()
