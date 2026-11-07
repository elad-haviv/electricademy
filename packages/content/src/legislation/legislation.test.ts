import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { contentRoot } from "../files";
import { LEGISLATION } from "./manifest";
import { lawToc, parseLaw, type Block } from "./parse";

const all = (bs: Block[]): string[] =>
  bs.flatMap((b) =>
    b.type === "section" ? [b.title ?? "", ...all(b.body)] : b.type === "table" ? b.rows.flatMap((r) => r.cells.map((c) => c.html)) : b.type === "rule" ? [] : [b.html],
  );

describe("Open Law Book parser", () => {
  it("parses sections, definitions, notes and links", () => {
    const doc = parseLaw(
      [
        '<שם> חוק לדוגמה, תשפ"ו-2026',
        '<מבוא> בתוקף סמכותי לפי [[+|סעיף 13]] [[=החוק|לחוק החשמל, התשי"ד-1954]]:',
        "== פרק א': פרשנות ==",
        '@ 1. הגדרות (תיקון: תשע"א)',
        ": בחוק זה -",
        ':- "מתקן" - כמשמעותו [[בסעיף 3א]];',
        "@ 2. (תיקון: תשנ\"ו) : (((בוטל).))",
        "<פרסום> נתקבל בכנסת.",
        "<חתימות>",
        "* משה, ראש הממשלה",
      ].join("\n"),
      { lawHref: (name) => (name === "החוק" ? "/law/electricity-law" : null) },
    );
    expect(doc.title).toBe('חוק לדוגמה, תשפ"ו-2026');
    expect(doc.intro).toContain('href="/law/electricity-law#s-13"');
    expect(doc.intro).toContain('<a href="/law/electricity-law" class="law-ref">לחוק החשמל');
    const [heading, s1, s2] = doc.blocks;
    expect(heading).toMatchObject({ type: "heading", level: 2 });
    expect(s1).toMatchObject({ type: "section", id: "s-1", number: "1", title: "הגדרות", amendment: 'תשע"א' });
    expect(s1?.type === "section" && s1.body[1]).toMatchObject({ type: "para", definition: true });
    expect(all(s1 ? [s1] : []).join("")).toContain('href="#s-3א"');
    expect(s2).toMatchObject({ type: "section", number: "2", title: null });
    expect(s2?.type === "section" && s2.body[0]).toMatchObject({ html: '<span class="law-note">(בוטל).</span>' });
    expect(doc.signatures).toEqual(["משה, ראש הממשלה"]);
    expect(lawToc(doc).map((t) => t.id)).toEqual([heading?.type === "heading" ? heading.id : "", "s-1", "s-2"]);
  });

  it("links references to other laws only when that law is available", () => {
    const doc = parseLaw("@ 1. x\n: [[בתקנה 42(א)(2) לתקנות החשמל (הארקות), התשנ\"א-1991]] ו[[סעיף 2(ב) לחוק העונשין]]", {
      lawHref: (name) => (name.startsWith("תקנות החשמל (הארקות)") ? "/law/earthing" : null),
    });
    const html = all(doc.blocks).join("");
    expect(html).toContain('href="/law/earthing#s-42"');
    expect(html).not.toContain('href="#s-2"');
    expect(html).toContain("סעיף 2(ב) לחוק העונשין");
  });

  it("does not guess the enabling law for a bare + reference", () => {
    const doc = parseLaw("<מבוא> לפי [[+#סעיף 22א|סעיפים 3]] [[סעיף 22א לפקודת הקרקעות]]", {
      lawHref: (name) => (name === "החוק" ? "/law/electricity-law" : null),
    });
    expect(doc.intro).toBe("לפי סעיפים 3 סעיף 22א לפקודת הקרקעות");
  });

  it("escapes source text and only emits its own tags", () => {
    const doc = parseLaw('@ 1. ניסיון\n: <script>alert(1)</script> <img src=x onerror="a"> 10A < In');
    const html = all(doc.blocks).join("");
    expect(html).not.toContain("<script");
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;script&gt;");
  });

  it("parses tables with header cells, spans and multi-line cells", () => {
    const doc = parseLaw(
      ['@ 1. טבלה', ': {|', '! rowspan="2" | חתך !! colspan="2" | זרם', "|-", "| 1.5 || 14 || 13", "|-", "| : שורה ראשונה", ": שורה שנייה", "|}"].join("\n"),
    );
    const s = doc.blocks[0];
    const table = s?.type === "section" ? s.body[0] : undefined;
    expect(table?.type).toBe("table");
    if (table?.type !== "table") return;
    expect(table.rows[0]?.cells[0]).toMatchObject({ header: true, rowspan: 2, html: "חתך" });
    expect(table.rows[0]?.cells[1]).toMatchObject({ colspan: 2 });
    expect(table.rows[1]?.cells.map((c) => c.html)).toEqual(["1.5", "14", "13"]);
    expect(table.rows[2]?.cells[0]?.html).toBe("שורה ראשונה<br>שורה שנייה");
  });

  it("handles templates, escaped parentheses and math", () => {
    const doc = parseLaw("@ 1. x\n: {{מוקטן|קטן}} {{ש}} [[תקנה 3(א)((())1(()))]] <math>I^2</math>", { renderMath: (t) => `<m>${t}</m>` });
    const html = all(doc.blocks).join("");
    expect(html).toContain("<small>קטן</small>");
    expect(html).toContain("<br>");
    expect(html).toContain('<a href="#s-3" class="law-ref">תקנה 3(א)(1)</a>');
    expect(html).toContain("<m>I^2</m>");
  });
});

describe("committed legislation sources", () => {
  for (const entry of LEGISLATION) {
    it(`${entry.slug} parses cleanly`, () => {
      const text = fs.readFileSync(path.join(contentRoot(), "legislation", `${entry.slug}.txt`), "utf8");
      const doc = parseLaw(text, { renderMath: () => "" });
      expect(doc.title).toContain(entry.wikisourceTitle.replace(/\s*\(.*$/, "").slice(0, 8));
      expect(doc.blocks.length).toBeGreaterThan(3);
      expect(doc.published).toBeTruthy();
      const html = all(doc.blocks).join("\n");
      for (const leftover of ["{{", "}}", "[[", "]]", "{|", "|}", "((", ""]) expect(html).not.toContain(leftover);
    });
  }
});
