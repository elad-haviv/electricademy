# usage: extract.py <reshumot dir> <out dir> <spec.json>
# spec: [{"name":..., "issue":..., "page":..., "box":[x0,y0,x1,y1] (fractions), "rotate": 0|90|-90}]
import json, os, subprocess, sys
from PIL import Image, ImageOps
d, out, spec = sys.argv[1], sys.argv[2], json.load(open(sys.argv[3]))
os.makedirs(out, exist_ok=True)
for s in spec:
    color = s.get("color", False)
    base = f"{d}/pages/hi{'c' if color else ''}-{s['issue']}-{s['page']}"
    if not os.path.exists(base + ".png"):
        subprocess.run(["pdftoppm", "-r", "200", *([] if color else ["-gray"]), "-png", "-f", str(s["page"]), "-l", str(s["page"]), "-singlefile", f"{d}/{s['issue']}.pdf", base], check=True)
    im = Image.open(base + ".png").convert("RGB" if color else "L")
    x0, y0, x1, y1 = s["box"]
    im = im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))
    if s.get("rotate"):
        im = im.rotate(s["rotate"], expand=True, fillcolor="white" if color else 255)
    # trim near-white margins (ignore faint scan noise)
    bw = im.convert("L").point(lambda v: 0 if v < 160 else 255)
    bbox = ImageOps.invert(bw).getbbox()
    if bbox:
        pad = 12
        im = im.crop((max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(im.width, bbox[2] + pad), min(im.height, bbox[3] + pad)))
    if im.width > 1400:
        im = im.resize((1400, round(1400 * im.height / im.width)), Image.LANCZOS)
    path = f"{out}/{s['name']}.webp"
    im.save(path, "WEBP", quality=82, method=6)
    print(f"{s['name']:32} {im.size} {os.path.getsize(path)//1024}KB")
