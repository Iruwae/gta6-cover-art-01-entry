#!/usr/bin/env python3
"""Downscale the 8 demo-cast portraits to ~900px wide JPEG q80 and place
them as app/samples/cast-1.jpg .. cast-8.jpg for the Sunset Circuit app.
Also copies the vendored OFL fonts into app/fonts/ (Oswald's three files
are the same variable font, so only one copy is kept)."""
import os
import shutil
from PIL import Image

SRC_DIR = "/home/hatch/workspace/makefun/cover-art-assets/portraits"
FONT_DIR = "/home/hatch/workspace/makefun/cover-art-assets/fonts"
REPO = "/home/hatch/workspace/makefun/gta6-cover-art-01-entry"

CAST = [
    ("media-generation-cast-1-boss-0-20d50185-6a78-4ca2-8875-f131503e4ea9.jpg", "cast-1.jpg"),
    ("media-generation-cast-2-driver-0-24bce3f6-5ecb-49f8-bebd-3bd5441ad083.jpg", "cast-2.jpg"),
    ("media-generation-cast-3-mechanic-0-2b021ae2-c8cd-483d-aece-19c147d15d97.jpg", "cast-3.jpg"),
    ("media-generation-cast-4-captain-0-a275d153-91d5-4170-b341-20323562ca62.jpg", "cast-4.jpg"),
    ("media-generation-cast-5-rider-0-e99a8d73-530d-4a1f-b855-8ee13bc4cacd.jpg", "cast-5.jpg"),
    ("media-generation-cast-6-fixer-0-7b3895f0-d330-4b58-9421-019bcaaaa9c4.jpg", "cast-6.jpg"),
    ("media-generation-cast-7-lookout-0-ad3640c0-9589-491c-ab6d-5462cdca50c8.jpg", "cast-7.jpg"),
    ("media-generation-cast-8-queen-0-b60e2d28-5d13-44fe-ab13-148205fd0d88.jpg", "cast-8.jpg"),
]

samples = os.path.join(REPO, "app", "samples")
fonts = os.path.join(REPO, "app", "fonts")
os.makedirs(samples, exist_ok=True)
os.makedirs(fonts, exist_ok=True)

for src_name, dst_name in CAST:
    src = os.path.join(SRC_DIR, src_name)
    dst = os.path.join(samples, dst_name)
    im = Image.open(src).convert("RGB")
    w, h = im.size
    if w > 900:
        im = im.resize((900, round(h * 900 / w)), Image.LANCZOS)
    im.save(dst, "JPEG", quality=80, optimize=True)
    print(dst_name, im.size, os.path.getsize(dst), "bytes")

shutil.copy(os.path.join(FONT_DIR, "Anton-Regular.woff2"),
            os.path.join(fonts, "Anton-Regular.woff2"))
shutil.copy(os.path.join(FONT_DIR, "Yellowtail-Regular.woff2"),
            os.path.join(fonts, "Yellowtail-Regular.woff2"))
# Oswald Medium/SemiBold/Bold are the same variable-font file; keep one.
shutil.copy(os.path.join(FONT_DIR, "Oswald-SemiBold.woff2"),
            os.path.join(fonts, "Oswald-Variable.woff2"))
for name in sorted(os.listdir(fonts)):
    print("font:", name, os.path.getsize(os.path.join(fonts, name)), "bytes")
print("done")
