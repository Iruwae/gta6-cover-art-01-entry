#!/usr/bin/env python3
"""Scale the app's own exported PNGs + the studio UI capture down to the
screenshot limits (each <=256 KiB, long side <=1280 px, short side >=480 px)
and write them as screenshots/1-cover-16x9.jpg .. 4-cover-1x1.jpg.
The exported posters shown are the app's own PNG output, scaled down
and nothing else."""
import os
from PIL import Image

SRC = "/tmp/sunset-exports"
DST = "/home/hatch/workspace/makefun/gta6-cover-art-01-entry/screenshots"
os.makedirs(DST, exist_ok=True)

JOBS = [
    ("export-16x9.png", "1-cover-16x9.jpg", (1280, 720)),
    ("ui-1280x800.png", "2-studio-ui.jpg", (1280, 800)),
    ("export-4x5.png", "3-cover-4x5.jpg", (1024, 1280)),
    ("export-1x1.png", "4-cover-1x1.jpg", (1080, 1080)),
]

for src_name, dst_name, size in JOBS:
    im = Image.open(os.path.join(SRC, src_name)).convert("RGB")
    im = im.resize(size, Image.LANCZOS)
    dst = os.path.join(DST, dst_name)
    im.save(dst, "JPEG", quality=82, optimize=True)
    n = os.path.getsize(dst)
    print(dst_name, im.size, n, "bytes", "OK" if n <= 262144 else "TOO BIG")
    assert n <= 262144, dst_name
    assert max(im.size) <= 1280 and min(im.size) >= 480, dst_name
print("all screenshots within limits")
