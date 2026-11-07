# Detects table grid lines on a scanned page and crops the drawing column cell of every body row.
import sys, subprocess, os, json
import numpy as np
from PIL import Image
R, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
pages = [23, 24, 25, 26, 27]
cells = []
for p in pages:
    base = f"{R}/pages/hi-7349-{p}"
    if not os.path.exists(base + ".png"):
        subprocess.run(["pdftoppm", "-r", "200", "-gray", "-png", "-f", str(p), "-l", str(p), "-singlefile", f"{R}/7349.pdf", base], check=True)
    im = Image.open(base + ".png").convert("L"); a = np.array(im) < 140
    H, W = a.shape
    y_lo = int(0.58 * H) if p == 23 else int(0.04 * H)   # page 23: the methods table is the lower one
    y_hi = int((0.52 if p == 27 else 0.9) * H)
    # vertical lines: columns dark over most of the table height
    colfrac = a[y_lo:y_hi].mean(axis=0)
    xs = [x for x in range(W) if colfrac[x] > 0.55]
    vlines = []
    for x in xs:
        if not vlines or x - vlines[-1][-1] > 3: vlines.append([x])
        else: vlines[-1].append(x)
    vx = [int(np.mean(v)) for v in vlines]
    left, right = vx[0], vx[-1]
    rowfrac = a[:, left:right].mean(axis=1)
    ys = [y for y in range(y_lo, y_hi) if rowfrac[y] > 0.6]
    hl = []
    for y in ys:
        if not hl or y - hl[-1][-1] > 3: hl.append([y])
        else: hl[-1].append(y)
    hy = [int(np.mean(h)) for h in hl]
    # drawing column = between the 2nd-to-last and last vertical line... (RTL: rightmost col is the method letter)
    x0, x1 = vx[-3], vx[-2]
    print(f"page {p}: vlines={vx} hlines={hy}")
    # body rows: skip the header row (first gap) and tiny gaps
    for i in range(1, len(hy) - 1):
        top, bot = hy[i], hy[i + 1]
        if bot - top < 60: continue
        cell = im.crop((x0 + 6, top + 6, x1 - 6, bot - 6))
        cells.append({"page": p, "box": [x0, top, x1, bot]})
        cell.save(f"{out}/cell-{len(cells):02d}.png")
print(len(cells), "cells")
json.dump(cells, open(f"{out}/cells.json", "w"))
