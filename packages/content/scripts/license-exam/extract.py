"""
Extracts the licensing-exam question bank (Ministry of Labor, "מאגר שאלות לבחינות רישוי בחשמל
לטכנאים, הנדסאים ומהנדסים") from its PDF into content/license-exam/bank.json plus figure crops.

Usage (see README.md):
  python -I extract.py <bank.pdf> <content/license-exam> <apps/web/public/images/license-exam>

The PDF is exported from Word with every glyph placed in *visual* order, so Hebrew lines with
Latin/number runs ("S=630kVA, Uk=6%.") come out scrambled from ordinary text extractors. Each line
is rebuilt here from its glyph positions: read right to left, keep runs of Latin letters/digits
left to right, then check the result with the Unicode bidi algorithm (python-bidi) and join
space-separated runs until it renders exactly like the PDF.

Figures (embedded images and vector drawings, tables included) are cropped from the page at
200 dpi; text drawn inside a figure stays in the crop and is left out of the question text.

Requires PyMuPDF, Pillow and python-bidi (pip install pymupdf pillow python-bidi).
"""
import io
import itertools
import json
import re
import sys
import unicodedata
from pathlib import Path

import pymupdf
from bidi import get_display
from PIL import Image, ImageOps

BLUE = 0x0070C0  # "שאלה N" heading
SERIAL_GREENS = {0x92D050, 0x00B050}  # serial number under the heading
TOP, BOTTOM = 55, 800  # the running header and the page number live outside this band
DPI = 200
SEGMENT_GAP = 25  # points; wider horizontal gaps split a line into segments (figure-option grids)

HEBREW = re.compile(r"[֐-׿]")
LTR = re.compile(r"[A-Za-z0-9°-³µ¹Ͱ-Ͽ⁰-₟Ω]")
# Symbol / Wingdings glyphs that come out as private-use code points
SYMBOLS = {"\uf0df": "←", "\uf0e0": "→", "\uf0b7": "•", "\uf064": "δ"}
BRACKETS = str.maketrans("()[]{}<>", "||||||||")

# ───────────────────────── visual → logical text ─────────────────────────


def char_kind(ch: str) -> str:
    if HEBREW.match(ch):
        return "H"
    if ch.isspace():
        return "S"
    if ch in "()[]{}<>":
        return "B"
    if LTR.match(ch):
        return "L"
    return "P"


def visual_string(chars):
    """chars sorted left→right; inserts spaces where glyphs are visibly apart."""
    out, prev = [], None
    for c in chars:
        if prev is not None and c["c"] != " " and prev["c"] != " ":
            if c["bbox"][0] - prev["bbox"][2] > 0.22 * c["size"]:
                out.append(" ")
        out.append(c["c"])
        prev = c
    return re.sub(r"\s+", " ", "".join(out)).strip()


def tokenize(visual: str):
    """Left→right tokens: ("L", run) for runs holding Latin letters/digits, else ("N", char)."""
    tokens, buf = [], ""

    def flush():
        nonlocal buf
        if not buf:
            return
        if any(char_kind(ch) == "L" for ch in buf):
            # punctuation on the run's visual edges belongs to the right-to-left text around it
            lead = re.match(r"^[.,:;?!]*", buf).group(0)
            trail = re.search(r"[.,:;?!\-]*$", buf[len(lead):]).group(0)
            core = buf[len(lead): len(buf) - len(trail)]
            tokens.extend(("N", ch) for ch in lead)
            tokens.append(("L", core))
            tokens.extend(("N", ch) for ch in trail)
        else:
            tokens.extend(("N", ch) for ch in buf)
        buf = ""

    for ch in visual:
        if char_kind(ch) in "LP":
            buf += ch
        else:
            flush()
            tokens.append(("N", ch))
    flush()
    return tokens


def logical(tokens, spans=()):
    """Reads tokens right→left. Each span (i, j) keeps tokens i..j together, left to right."""
    starts = dict(spans)
    items, i = [], 0
    while i < len(tokens):
        if i in starts:
            items.append("".join(t for _, t in tokens[i: starts[i] + 1]))
            i = starts[i] + 1
        else:
            items.append(tokens[i][1])
            i += 1
    return "".join(reversed(items))


def rendered(s):
    return get_display(s, base_dir="R").translate(BRACKETS)


def rebuild_line(chars):
    chars = sorted(chars, key=lambda c: (c["bbox"][0] + c["bbox"][2]) / 2)
    visual = visual_string(chars)
    if not HEBREW.search(visual) and chars[0]["bbox"][0] < 70 and chars[-1]["bbox"][2] < 480:
        return visual  # a left-aligned, left-to-right paragraph
    tokens = tokenize(visual)
    target = visual.translate(BRACKETS)
    best = logical(tokens)
    if rendered(best) == target:
        return best
    # gaps between consecutive LTR runs that hold only spaces / brackets
    ltr = [k for k, t in enumerate(tokens) if t[0] == "L"]
    gaps = [(a, b) for a, b in zip(ltr, ltr[1:])
            if all(not HEBREW.match(tokens[k][1]) and tokens[k][1] not in ".,:;?!" for k in range(a + 1, b))]

    def spans_for(chosen):
        spans = []
        for a, b in chosen:
            if spans and spans[-1][1] == a:
                spans[-1] = (spans[-1][0], b)
            else:
                spans.append((a, b))
        return spans

    if len(gaps) <= 10:
        for r in range(1, len(gaps) + 1):
            for chosen in itertools.combinations(gaps, r):
                trial = logical(tokens, spans_for(chosen))
                if rendered(trial) == target:
                    return trial
    else:
        trial = logical(tokens, spans_for(gaps))
        if rendered(trial) == target:
            return trial
    return best


UNIT_FIRST = re.compile(r"(?<![A-Za-z0-9])(Ω|k?[AV]|mA|kW|kVA)(\d+\.\d+)(?![A-Za-z0-9])")
# multi-letter units are safe to swap for whole numbers too ("kV33"); "A1" / "IP44" are not units
UNIT_FIRST_INT = re.compile(r"(?<![A-Za-z0-9])(kV|kVA|kW|kA|mA|MVA|kVAr|Hz)(\d+)(?![A-Za-z0-9.])")


def norm(s: str) -> str:
    s = "".join(unicodedata.normalize("NFKC", ch) if 0x1D400 <= ord(ch) <= 0x1D7FF else ch for ch in s)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"\s+([.,:;?!])(?=\s|$)", r"\1", s)
    # "Ω8.82" / "A0.03": a unit typed in the right-to-left run lands before the number
    s = UNIT_FIRST.sub(r"\2\1", s)
    s = UNIT_FIRST_INT.sub(r"\2\1", s)
    return s


# ───────────────────────── page layout ─────────────────────────


def merge_rects(rects, pad=6):
    rects = [pymupdf.Rect(r) for r in rects]
    changed = True
    while changed:
        changed, out = False, []
        for r in rects:
            for o in out:
                if (r + (-pad, -pad, pad, pad)).intersects(o) and (pad >= 0 or (r & o).get_area() > 1):
                    o |= r
                    changed = True
                    break
            else:
                out.append(pymupdf.Rect(r))
        rects = out
    return rects


def figure_regions(page):
    """Embedded images, plus clusters of vector drawings (tables, schematics, boxes)."""
    images = [pymupdf.Rect(i["bbox"]) for i in page.get_image_info()]
    drawings = merge_rects([d["rect"] for d in page.get_drawings() if d["rect"].y0 > TOP and d["rect"].y1 < BOTTOM])
    figs = []
    for r in images:  # images that merely touch stay separate (stacked answer drawings)
        for d in drawings:
            if d.intersects(r) and d.get_area() > 0:
                r |= d
        figs.append(r)
    figs += [d for d in drawings if not any(d.intersects(f) for f in figs)]
    # thin clusters are highlight boxes or underlines behind text, not figures
    return merge_rects([f for f in figs if f.width > 8 and f.height > 15], pad=-1)


def attach_raised_bits(lines):
    """A few raised/lowered glyphs ("tgδ" set as an inline object) form their own line; put them
    back into the line whose gap they fill."""
    def ink(ln):
        return [c for c in ln if c["c"].strip()]

    def cy(ln):
        return sum((c["bbox"][1] + c["bbox"][3]) / 2 for c in ln) / len(ln)

    out = list(lines)
    for ln in lines:
        bits = ink(ln)
        if not bits or len(bits) > 6 or any(HEBREW.match(c["c"]) or c["math"] for c in bits):
            continue
        x0, x1 = min(c["bbox"][0] for c in bits), max(c["bbox"][2] for c in bits)
        for other in out:
            if other is ln or not ink(other) or abs(cy(other) - cy(ln)) > 10:
                continue
            oi = ink(other)
            spans = min(c["bbox"][0] for c in oi) < x0 and max(c["bbox"][2] for c in oi) > x1
            clear = not any(c["bbox"][2] > x0 + 1 and c["bbox"][0] < x1 - 1 for c in oi)
            if spans and clear and len(oi) > len(bits):
                other.extend(ln)
                out.remove(ln)
                break
    return out


def page_elements(page):
    """Lines (logical text + segments) and figure regions of one page, top to bottom."""
    figs = figure_regions(page)

    chars = []
    for b in page.get_text("rawdict", flags=0)["blocks"]:
        for l in b.get("lines", []):
            for s in l["spans"]:
                for c in s["chars"]:
                    x0, y0, x1, y1 = c["bbox"]
                    cy = (y0 + y1) / 2
                    if cy < TOP or cy > BOTTOM:
                        continue
                    p = pymupdf.Point((x0 + x1) / 2, cy)
                    if any(p in (f + (-1, -1, 1, 1)) for f in figs):
                        continue
                    chars.append({**c, "c": SYMBOLS.get(c["c"], c["c"]), "size": s["size"], "color": s["color"],
                                  "math": "Math" in s["font"]})
    chars.sort(key=lambda c: (c["bbox"][1] + c["bbox"][3]) / 2)
    lines, cur, cur_y = [], [], None
    for c in chars:
        cy = (c["bbox"][1] + c["bbox"][3]) / 2
        if cur and abs(cy - cur_y) > 0.45 * c["size"]:
            lines.append(cur)
            cur = []
        if not cur:
            cur_y = cy
        cur.append(c)
    if cur:
        lines.append(cur)
    lines = attach_raised_bits(lines)

    els = []
    for ln in lines:
        text = rebuild_line(ln).strip()
        if not text:
            continue
        ink = [c for c in ln if c["c"].strip()]
        segs, group = [], []
        for c in sorted(ink, key=lambda c: c["bbox"][0]):
            if group and c["bbox"][0] - group[-1]["bbox"][2] > SEGMENT_GAP:
                segs.append(group)
                group = []
            group.append(c)
        if group:
            segs.append(group)
        els.append({
            "type": "line",
            "text": text,
            "colors": {c["color"] for c in ink},
            "y": min(c["bbox"][1] for c in ln),
            "y1": max(c["bbox"][3] for c in ln),
            "x1": max(c["bbox"][2] for c in ink) if ink else 0,
            # a line drawn only in the equation font is part of a stacked formula
            "math": any(c["math"] for c in ink) and not HEBREW.search(text),
            "segments": [{"x0": g[0]["bbox"][0], "x1": g[-1]["bbox"][2], "text": rebuild_line(g).strip()}
                         for g in segs],
        })
    for f in figs:
        els.append({"type": "fig", "rect": f, "y": f.y0, "y1": f.y1})
    els.sort(key=lambda e: e["y"])
    for e in els:
        e["page"] = page.number
    return els


# ───────────────────────── questions ─────────────────────────

QHEAD = re.compile(r"^שאלה\s*(\d+)$")
OPTION = re.compile(r"^([1-4])\s*\.\s*(.*)$")
MARKER = re.compile(r"^([1-4])\s*\.$")
MARKER_X = 532  # option numbers sit at the right margin; wrapped lines are indented


def is_tail(page) -> bool:
    return "המיועדות לבחינת הרישוי" in "".join(e["text"] for e in page_elements(page) if e["type"] == "line")


def parse(doc):
    stream, tail_pages = [], []
    for page in doc:
        if page.number < 2:
            continue
        if tail_pages or "מיועדות" in page.get_text() and is_tail(page):
            tail_pages.append(page)
            continue
        stream += page_elements(page)

    questions, cur = [], None
    for e in stream:
        if e["type"] == "line" and e["colors"] == {BLUE} and (m := QHEAD.match(e["text"])):
            cur = {"n": int(m.group(1)), "serial": None, "body": []}
            questions.append(cur)
            continue
        if cur is None:
            continue
        if e["type"] == "line" and cur["serial"] is None and e["colors"] & SERIAL_GREENS and " " not in e["text"]:
            cur["serial"] = e["text"]
            continue
        cur["body"].append(e)
    return [build(q) for q in questions], tail_pages


def find_marks(body, min_x):
    """Option markers: "N. text" at the right margin, or bare "N." segments beside figures.
    Returns the last run that holds 1, 2, 3 and 4 as (body index, number, info), or []."""
    marks = []
    for i, e in enumerate(body):
        if e["type"] != "line":
            continue
        segs = e["segments"]
        if segs and all(MARKER.match(s["text"]) for s in segs) and segs[-1]["x1"] > min_x:
            for s in sorted(segs, key=lambda s: -s["x1"]):
                marks.append((i, int(MARKER.match(s["text"]).group(1)), {"x": s["x1"], "grid": True}))
        elif (m := OPTION.match(e["text"])) and e["x1"] > min_x:
            marks.append((i, int(m.group(1)), {"x": e["x1"], "grid": False}))
    start = None
    for k, (_, n, _) in enumerate(marks):
        if n == 1 and {m[1] for m in marks[k:]} >= {1, 2, 3, 4}:
            start = k
    if start is None:
        return []
    seen, kept = set(), []
    for mk in marks[start:]:
        if mk[1] not in seen:
            seen.add(mk[1])
            kept.append(mk)
    return kept[:4]


def build(q):
    body = q["body"]
    marks = find_marks(body, MARKER_X) or find_marks(body, 0)
    problems = [] if marks else ["options not found"]

    first = marks[0][0] if marks else len(body)
    stem_els = body[:first]
    stem_lines = [e["text"] for e in stem_els if e["type"] == "line"]
    stem_figs = [e for e in stem_els if e["type"] == "fig"]
    options = {n: {"lines": [], "figs": []} for n in range(1, 5)} if marks else {}

    # text of each option: from its marker line to the next marker line
    line_marks = sorted({i for i, _, info in marks})
    for i, n, info in marks:
        if info["grid"]:
            continue
        nxt = next((j for j in line_marks if j > i), len(body))
        options[n]["lines"] = [OPTION.match(body[i]["text"]).group(2)] + \
            [e["text"] for e in body[i + 1: nxt] if e["type"] == "line"]
        options[n]["figs"] = [e for e in body[i + 1: nxt] if e["type"] == "fig"]

    # figures drawn beside a grid of bare markers ("1. 3." under two drawings)
    if any(info["grid"] for _, _, info in marks):
        last_text = max((k for k, e in enumerate(stem_els) if e["type"] == "line"), default=-1)
        candidates = [e for e in stem_els[last_text + 1:] if e["type"] == "fig"]
        candidates += [e for e in body[first:] if e["type"] == "fig" and not any(e in o["figs"] for o in options.values())]
        if len(candidates) >= 2:
            for fig in candidates:
                def dist(mk):
                    i, n, info = mk
                    el = body[i]
                    if el["page"] != fig["page"]:
                        return 1e9
                    my = (el["y"] + el["y1"]) / 2
                    dy = abs(my - fig["y1"]) + (1000 if my < fig["y"] - 5 else 0)
                    dx = info["x"] - fig["rect"].x1
                    return dy * 3 + (dx if dx >= -5 else 1000)
                n = min(marks, key=dist)[1]
                options[n]["figs"].append(fig)
                if fig in stem_figs:
                    stem_figs.remove(fig)

    # stacked formulas (fractions, roots) do not survive as text: crop those parts of the page
    stem_render, option_render = [], {}
    if marks:
        centers = [((body[i]["y"] + body[i]["y1"]) / 2, body[i]["page"]) for i, _, _ in marks]
        same_page = len({p for _, p in centers}) == 1
        step = (centers[-1][0] - centers[0][0]) / 3 if same_page else 14
        bands = {}
        for k, (_, n, _) in enumerate(marks):
            y, page = centers[k]
            top = (centers[k - 1][0] + y) / 2 if k and centers[k - 1][1] == page else y - step / 2
            bottom = (centers[k + 1][0] + y) / 2 if k < 3 and centers[k + 1][1] == page else y + step / 2
            bands[n] = (page, top, bottom)
        math_in_options = [e for e in body if e["type"] == "line" and e["math"]
                           and any(p == e["page"] and t <= (e["y"] + e["y1"]) / 2 <= b for p, t, b in bands.values())]
        if math_in_options and not any(o["figs"] for o in options.values()):
            for n, (page, top, bottom) in bands.items():
                inside = [e for e in body if e["type"] == "line" and e["page"] == page
                          and top <= (e["y"] + e["y1"]) / 2 <= bottom]
                if inside:  # hug the glyphs so neighbouring options do not bleed in
                    top, bottom = min(e["y"] for e in inside) - 2, max(e["y1"] for e in inside) + 2
                option_render[n] = {"type": "fig", "band": True, "page": page, "y": top, "y1": bottom,
                                    "rect": pymupdf.Rect(40, top, 530, bottom)}
            # formula lines that belong to the first option are not stem text
            p1, t1, _ = bands[marks[0][1]]
            stem_els = [e for e in stem_els if not (e["page"] == p1 and e["type"] == "line" and e["math"] and e["y1"] > t1)]
            stem_lines = [e["text"] for e in stem_els if e["type"] == "line"]
    if any(e["type"] == "line" and e["math"] for e in stem_els):
        for page in sorted({e["page"] for e in stem_els}):
            part = [e for e in stem_els if e["page"] == page]
            top, bottom = min(e["y"] for e in part), max(e["y1"] for e in part)
            if option_render and bands[marks[0][1]][0] == page:
                bottom = min(bottom, bands[marks[0][1]][1])
            x0 = min([40] + [e["rect"].x0 for e in part if e["type"] == "fig"])
            stem_render.append({"type": "fig", "page": page, "y": top, "y1": bottom,
                                "rect": pymupdf.Rect(x0, top - 2, 545, bottom + 2)})

    built = []
    for n in range(1, 5):
        if not options:
            break
        o = options[n]
        o["figs"].sort(key=lambda f: (f["page"], f["y"], -f["rect"].x1))
        if n in option_render:
            built.append({"text": norm(" ".join(o["lines"])), "figs": [option_render[n]], "rendered": True})
            continue
        built.append({"text": norm(" ".join(o["lines"])), "figs": o["figs"]})
    for o in built:
        if not o["text"] and not o["figs"]:
            problems.append("empty option")
    return {"n": q["n"], "serial": q["serial"], "stem_lines": stem_lines,
            "stem_figs": stem_render or stem_figs, "stem_rendered": bool(stem_render),
            "options": built, "problems": problems}


def parse_levels(tail_pages):
    """The two tables at the end: questions for engineers only, and for engineers + practical engineers."""
    eng, pe, mode = set(), set(), None
    for page in tail_pages:
        for e in page_elements(page):
            if e["type"] != "line":
                continue
            heb = re.sub(r"[^א-ת]", "", e["text"])
            if "המיועדותלבחינתהרישוי" in heb:
                mode = "pe" if "והנדסאים" in heb else "eng"
                continue
            if "שאינןמופיעות" in heb or "שינויים" in heb:
                mode = None
                continue
            if mode:
                (eng if mode == "eng" else pe).update(int(x) for x in re.findall(r"\d+", e["text"]))
        if mode is None and (eng or pe):
            break
    return eng, pe


def render(doc, fig, path: Path):
    page = doc[fig["page"]]
    pad = 0 if fig.get("band") else 3
    clip = (fig["rect"] + (-pad, -pad, pad, pad)) & page.rect
    pix = page.get_pixmap(dpi=DPI, clip=clip)
    img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
    # trim the white margin (formula bands span the whole text column)
    ink = ImageOps.invert(img.convert("L")).point(lambda v: 255 if v > 24 else 0).getbbox()
    if ink:
        m = 8
        img = img.crop((max(ink[0] - m, 0), max(ink[1] - m, 0), min(ink[2] + m, img.width), min(ink[3] + m, img.height)))
    img.save(path, "WEBP", quality=78, method=6)
    return {"src": path.name, "w": img.width, "h": img.height}


def main():
    pdf, content_dir, img_dir = map(Path, sys.argv[1:4])
    doc = pymupdf.open(pdf)
    ver = re.search(r"גרסה\s*(\d+\.\d+)", doc[2].get_text())
    questions, tail = parse(doc)
    eng, pe = parse_levels(tail)

    img_dir.mkdir(parents=True, exist_ok=True)
    for old in img_dir.glob("*.webp"):
        old.unlink()
    out = []
    for q in questions:
        def figs(fs, tag):
            return [render(doc, f, img_dir / f"q{q['n']:04d}-{tag}{k + 1}.webp") for k, f in enumerate(fs)]

        level = "engineer" if q["n"] in eng else "practical-engineer" if q["n"] in pe else "all"
        item = {
            "n": q["n"],
            "serial": q["serial"],
            "level": level,
            "stem": [norm(l) for l in q["stem_lines"]],
            "figures": figs(q["stem_figs"], "s"),
            "options": [{"text": o["text"], "figures": figs(o["figs"], f"o{j + 1}-"),
                         **({"rendered": True} if o.get("rendered") else {})}
                        for j, o in enumerate(q["options"])],
        }
        if q["stem_rendered"]:
            item["stemRendered"] = True  # the figure is the whole stem (formulas); text is for search
        if q["problems"]:
            item["problems"] = q["problems"]
        out.append(item)

    created = doc.metadata.get("creationDate", "")
    meta = {
        "version": ver.group(1) if ver else None,
        "published": f"{created[2:6]}-{created[6:8]}-{created[8:10]}" if created.startswith("D:") else None,
        "count": len(out),
    }
    content_dir.mkdir(parents=True, exist_ok=True)
    (content_dir / "bank.json").write_text(
        json.dumps({"meta": meta, "questions": out}, ensure_ascii=False, separators=(",", ":")) + "\n")
    bad = {q["n"]: q["problems"] for q in out if q.get("problems")}
    levels = {k: sum(q["level"] == k for q in out) for k in ("all", "practical-engineer", "engineer")}
    print(f"{len(out)} questions, version {meta['version']} ({meta['published']}), levels {levels}")
    print(f"figures: {sum(len(q['figures']) + sum(len(o['figures']) for o in q['options']) for q in out)}")
    if bad:
        print("needs review:", bad)


if __name__ == "__main__":
    main()
