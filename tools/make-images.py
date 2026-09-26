"""Regenerates the site's images in assets/ from the brand and marketing originals.

Usage:  py tools/make-images.py        (needs Pillow: py -m pip install pillow)
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

LOGOS = Path(r"D:\N Dimensional Games\Company\Logos")
MARKETING = Path(r"E:\NDVDBTest\Marketing")
OUT = Path(__file__).resolve().parent.parent / "assets"


def crop_to_content(im, margin=0.02):
    """Crops away transparent padding, keeping a small margin."""
    left, top, right, bottom = im.getchannel("A").getbbox()
    m = round(max(right - left, bottom - top) * margin)
    return im.crop((max(left - m, 0), max(top - m, 0), min(right + m, im.width), min(bottom + m, im.height)))


def fit(im, width=None, height=None):
    scale = min(width / im.width if width else 1e9, height / im.height if height else 1e9)
    return im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)


def save(im, name, **opts):
    path = OUT / name
    if name.endswith(".jpg"):
        im.convert("RGB").save(path, quality=84, optimize=True, progressive=True)
    elif name.endswith(".webp"):
        im.save(path, quality=82, method=6)
    else:
        im.save(path, optimize=True)
    print(f"{name:24} {im.width}x{im.height}  {path.stat().st_size // 1024} KB")


# Header mark and footer lockup: white on transparent; the CSS inverts them for the light theme.
mark = crop_to_content(Image.open(LOGOS / "NDLogoWhite_Transparency.png").convert("RGBA"))
save(fit(mark, height=96), "ndg-mark.png")
lockup = crop_to_content(Image.open(LOGOS / "NDLogoTitleWhite_Transparency.png").convert("RGBA"))
save(fit(lockup, height=144), "ndg-lockup.png")


def icon(size, thicken, rounded):
    """White mark on black. Strokes are thickened for small sizes so they don't vanish."""
    art = fit(mark, 400, 400)
    alpha = art.getchannel("A")
    if thicken:
        alpha = alpha.filter(ImageFilter.MaxFilter(thicken))
    white = Image.new("RGBA", art.size, (255, 255, 255, 0))
    white.putalpha(alpha)
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 255))
    canvas.alpha_composite(white, ((512 - art.width) // 2, (512 - art.height) // 2))
    if rounded:
        corners = Image.new("L", (512, 512), 0)
        ImageDraw.Draw(corners).rounded_rectangle((0, 0, 511, 511), radius=112, fill=255)
        canvas.putalpha(corners)
    return canvas.resize((size, size), Image.LANCZOS)


save(icon(32, thicken=9, rounded=True), "favicon-32.png")
save(icon(192, thicken=3, rounded=True), "favicon-192.png")
save(icon(180, thicken=3, rounded=False), "apple-touch-icon.png")

# Home page banner and the NDVDB product image.
banner = Image.open(LOGOS / "NDimensionalGamesLLC_StoreBanner.png").convert("RGB")
save(banner, "ndg-banner.webp")
cover = Image.open(MARKETING / "NDVDB-Cover-Image-1950x1300.png").convert("RGB")
save(fit(cover, width=1200), "ndvdb-cover.webp")

# Link previews (1200x630). The banner loses only scenery at its sides; the NDVDB cover
# is fitted whole and its sides fade into black, so the title and tagline stay in frame.
w = round(banner.height * 1200 / 630)
x = (banner.width - w) // 2
save(banner.crop((x, 0, x + w, banner.height)).resize((1200, 630), Image.LANCZOS), "og-home.jpg")

fitted = fit(cover, height=630)
edge = 110
fade = Image.new("L", (fitted.width, 1))
fade.putdata([min(255, round(255 * min(i, fitted.width - 1 - i) / edge)) for i in range(fitted.width)])
preview = Image.new("RGB", (1200, 630), (0, 0, 0))
preview.paste(fitted, ((1200 - fitted.width) // 2, 0), fade.resize(fitted.size))
save(preview, "og-ndvdb.jpg")
