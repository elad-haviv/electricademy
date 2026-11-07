/**
 * Parser for "ספר החוקים הפתוח" (Open Law Book) markup, as used on Hebrew Wikisource "מקור:" pages.
 *
 * Block structure comes out as plain data; inline text comes out as HTML that this module builds
 * itself: every piece of source text is escaped, and only a fixed set of tags is ever emitted,
 * so the result is safe to render with dangerouslySetInnerHTML.
 */

export interface LawDoc {
  title: string;
  /** Publication references from <מקור> (HTML). */
  sources: string | null;
  /** Enacting formula from <מבוא> (HTML). */
  intro: string | null;
  blocks: Block[];
  /** <פרסום> line (HTML). */
  published: string | null;
  signatures: string[];
}

export type Block =
  | { type: "heading"; level: 2 | 3 | 4; html: string; amendment: string | null; id: string }
  | { type: "section"; id: string; number: string | null; title: string | null; amendment: string | null; body: Block[] }
  | { type: "para"; depth: number; definition: boolean; html: string }
  | { type: "table"; depth: number; rows: TableRow[] }
  | { type: "rule" };

export interface TableRow {
  cells: { header: boolean; colspan: number; rowspan: number; html: string }[];
}

export interface ParseOptions {
  /** Renders TeX to HTML (e.g. KaTeX). Without it, formulas are shown as LTR code. */
  renderMath?: (tex: string, display: boolean) => string;
  /**
   * Href for another law, by name: [[=name|text]], "[[תקנה 5 לתקנות ...]]", and the enabling-law
   * pattern "[[+|סעיף 13]] [[=החוק|...]]". Return null to keep the reference as plain text.
   */
  lawHref?: (name: string) => string | null;
  /**
   * Image for the n-th [[תמונה:...]] link in the document (0-based). Return null to drop the
   * link, or undefined to show a placeholder.
   */
  image?: (index: number, name: string) => LawFigure | null | undefined;
  /** Figures for the n-th editorial omission note, e.g. "(((איור הושמט)))" (0-based). */
  omitted?: (index: number) => LawFigure[] | undefined;
}

export interface LawFigure {
  /** Image URL. */
  src: string;
  alt: string;
  /** Where the figure comes from, e.g. "קובץ התקנות 5375, עמ' 1101". */
  source?: string;
}

/** Editorial notes that stand in for content left out of the source ("(((איור הושמט)))"). */
const OMISSION_RE = /^\((?:איור|איורים|שרטוט|הטבלה|התוספת)[^)]*הושמט/;

/* ───────────────────────── helpers ───────────────────────── */

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Anchor id for a section/regulation number, e.g. "3א" → "s-3א". */
export const sectionAnchor = (number: string) => `s-${number.replace(/[.\s]/g, "")}`;

/** Splits on `sep` at nesting depth 0 with respect to {{ }}, [[ ]] and (( )). */
function splitTopLevel(s: string, sep: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (two === "{{" || two === "[[") {
      depth++;
      i++;
      continue;
    }
    if ((two === "}}" || two === "]]") && depth > 0) {
      depth--;
      i++;
      continue;
    }
    if (depth === 0 && s.startsWith(sep, i)) {
      out.push(s.slice(start, i));
      i += sep.length - 1;
      start = i + 1;
    }
  }
  out.push(s.slice(start));
  return out;
}

/** Index of the "}}" closing the "{{" at `open`, or -1. */
function matchBraces(s: string, open: string, close: string, from: number): number {
  let depth = 0;
  for (let i = from; i < s.length - 1; i++) {
    if (s.startsWith(open, i)) {
      depth++;
      i++;
    } else if (s.startsWith(close, i)) {
      depth--;
      if (depth === 0) return i;
      i++;
    }
  }
  return -1;
}

/* ───────────────────────── inline ───────────────────────── */

const TOKEN_OPEN = "\uE000";
const TOKEN_CLOSE = "\uE001";

class Inline {
  private fragments: string[] = [];
  private imageCount = 0;
  private omissionCount = 0;
  constructor(private opts: ParseOptions) {}

  private figure(f: LawFigure, caption: boolean): string {
    const img = `<img src="${escapeHtml(f.src)}" alt="${escapeHtml(f.alt)}" loading="lazy" decoding="async"${f.source ? ` title="${escapeHtml(f.source)}"` : ""}>`;
    if (!caption) return `<span class="law-figure law-figure-inline">${img}</span>`;
    const source = f.source ? ` <span class="law-figure-source">(${escapeHtml(f.source)})</span>` : "";
    return `<span class="law-figure">${img}<span class="law-figure-caption">${escapeHtml(f.alt)}${source}</span></span>`;
  }

  private token(html: string): string {
    this.fragments.push(html);
    return `${TOKEN_OPEN}${this.fragments.length - 1}${TOKEN_CLOSE}`;
  }

  /** Escape remaining text and expand tokens into their HTML. */
  private finish(s: string): string {
    const tokenRe = new RegExp(`${TOKEN_OPEN}(\\d+)${TOKEN_CLOSE}`, "g");
    let html = escapeHtml(s).replace(/'''(.+?)'''/g, "<strong>$1</strong>").replace(/''(.+?)''/g, "<em>$1</em>");
    // Fragments may contain tokens themselves.
    for (let guard = 0; tokenRe.test(html) && guard < 10; guard++) {
      tokenRe.lastIndex = 0;
      html = html.replace(tokenRe, (_, i: string) => this.fragments[Number(i)] ?? "");
    }
    return html;
  }

  render(src: string): string {
    return this.finish(this.tokenize(src));
  }

  /** Replace every markup construct with a token, leaving plain text. */
  private tokenize(input: string): string {
    let s = input.replace(/<!--[\s\S]*?-->/g, "").replace(/<nowiki\s*\/>/g, "").replace(/__TOC__/g, "");
    s = s.replace(/<nowiki>([\s\S]*?)<\/nowiki>/g, (_, t: string) => this.token(escapeHtml(t)));
    s = s.replace(/<math(?:\s[^>]*)?>([\s\S]*?)<\/math>/g, (_, tex: string) => this.token(this.math(tex.trim())));
    s = this.links(s);
    s = this.templates(s);
    s = this.notes(s);
    s = this.tags(s);
    return s;
  }

  private math(tex: string): string {
    if (this.opts.renderMath) {
      try {
        return `<span class="law-math" dir="ltr">${this.opts.renderMath(tex, false)}</span>`;
      } catch {
        /* fall through to code */
      }
    }
    return `<code dir="ltr">${escapeHtml(tex)}</code>`;
  }

  private links(s: string): string {
    let out = "";
    let i = 0;
    while (i < s.length) {
      const open = s.indexOf("[[", i);
      if (open < 0) break;
      const close = matchBraces(s, "[[", "]]", open);
      if (close < 0) break;
      out += s.slice(i, open);
      const inner = s.slice(open + 2, close);
      const bar = inner.indexOf("|");
      const target = bar >= 0 ? inner.slice(0, bar) : inner;
      const text = bar >= 0 ? inner.slice(bar + 1) : inner;
      // "[[+|סעיף 13]] [[=החוק|לחוק החשמל]]": "+" refers to the law named by the next "=" link.
      const enabling = /^\s*\[\[=([^|\]]*)/.exec(s.slice(close + 2))?.[1]?.trim() ?? null;
      out += this.token(this.link(target.trim(), text, enabling));
      i = close + 2;
    }
    return out + s.slice(i);
  }

  private link(target: string, text: string, enabling: string | null = null): string {
    const file = /^(?:תמונה|קובץ|File|Image):(.+)$/i.exec(target);
    if (file?.[1]) {
      const fig = this.opts.image?.(this.imageCount++, file[1].trim());
      if (fig === null) return "";
      return fig ? this.figure(fig, false) : `<span class="law-note">(איור)</span>`;
    }
    const label = this.render(text);
    let href: string | null = null;
    if (target.startsWith("=")) {
      href = this.opts.lawHref?.(target.slice(1).trim()) ?? null;
    } else {
      const parent = target.startsWith("+");
      const ref = parent ? text : target;
      const m = /(?:סעיפים|סעיף|תקנות משנה|תקנת משנה|תקנות|תקנה)\s*(\d+[א-ת]{0,2})/.exec(ref);
      const anchor = m?.[1] ? sectionAnchor(m[1]) : null;
      // "תקנה 42(א) לתקנות החשמל (...)" / "סעיף 2 לחוק העונשין": a section of another law.
      const other = parent ? null : /(?:^|\s)(?:ל|של\s+)((?:תקנות|חוק|פקודת)[\s\S]*)$/.exec(ref);
      if (other?.[1]) {
        const base = this.opts.lawHref?.(other[1].trim()) ?? null;
        href = base && anchor ? `${base}#${anchor}` : base;
      } else if (parent) {
        // Linked only when the enabling law is one we carry (normally the Electricity Law).
        const base = enabling === null ? null : (this.opts.lawHref?.(enabling) ?? null);
        href = base && anchor ? `${base}#${anchor}` : null;
      } else if (anchor) {
        href = `#${anchor}`;
      }
    }
    return href ? `<a href="${escapeHtml(href)}" class="law-ref">${label}</a>` : label;
  }

  /** {{...}} templates, innermost first. */
  private templates(s: string): string {
    for (let guard = 0; guard < 200; guard++) {
      const m = /\{\{([^{}]*)\}\}/.exec(s);
      if (!m) break;
      s = s.slice(0, m.index) + this.token(this.template(m[1] ?? "")) + s.slice(m.index + m[0].length);
    }
    return s;
  }

  private template(body: string): string {
    const parts = body.split("|");
    const name = (parts.shift() ?? "").trim();
    const args = parts.map((a) => a.replace(/^\s*1=/, ""));
    const arg = (i: number) => this.render(args[i] ?? "");
    switch (name) {
      case "ש":
        return "<br>";
      case "=":
        return "=";
      case "ריק":
        return "";
      case "מוקטן":
        return `<small>${arg(0)}</small>`;
      case "מוגדל":
        return `<span class="law-large">${arg(0)}</span>`;
      case "ממורכז":
        return `<span class="law-center">${arg(0)}</span>`;
      case "שבר":
        return `<span class="law-frac"><span>${arg(0)}</span><span>${arg(1)}</span></span>`;
      case "דוכיווני":
        return args
          .map((a) => a.trim())
          .filter(Boolean)
          .map((a) => `<span dir="auto" class="law-bidi">${this.render(a)}</span>`)
          .join(" ");
      case "טורים שווים":
      case "טורים שווים ממורכז": {
        const cls = name.endsWith("ממורכז") ? "law-columns law-center" : "law-columns";
        return `<span class="${cls}">${args.map((a) => `<span>${this.multiline(a)}</span>`).join("")}</span>`;
      }
      default:
        return args.map((_, i) => arg(i)).join(" ");
    }
  }

  /** Content made of ": x" lines inside a template argument. */
  private multiline(a: string): string {
    return a
      .split("\n")
      .map((l) => l.replace(/^\s*:+\s?/, "").trim())
      .filter(Boolean)
      .map((l) => this.render(l))
      .join("<br>");
  }

  /**
   * Open Law notes, matched with a balanced-parenthesis scan because the text inside often has
   * its own parentheses: ((inserted text)), ((text|tooltip)), and (((editorial note))) — the last
   * one is "((" + "(...)" + "))" and is shown muted. "((())" and "(()))" escape a literal "(" / ")".
   */
  private notes(s: string): string {
    s = s.replace(/\(\(\(\)\)/g, "(").replace(/\(\(\)\)\)/g, ")");
    let out = "";
    let i = 0;
    for (;;) {
      const open = s.indexOf("((", i);
      if (open < 0) break;
      let depth = 0;
      let end = -1;
      for (let j = open; j < s.length; j++) {
        if (s[j] === "(") depth++;
        else if (s[j] === ")" && --depth === 0) {
          end = j;
          break;
        }
      }
      if (end < 0 || s[end - 1] !== ")") {
        out += s.slice(i, open + 2);
        i = open + 2;
        continue;
      }
      out += s.slice(i, open) + this.token(this.note(s.slice(open + 2, end - 1)));
      i = end + 1;
    }
    return out + s.slice(i);
  }

  private note(inner: string): string {
    if (OMISSION_RE.test(inner)) {
      const figs = this.opts.omitted?.(this.omissionCount++);
      if (figs?.length) return figs.map((f) => this.figure(f, true)).join("");
    }
    if (inner.startsWith("(")) return `<span class="law-note">${this.render(inner)}</span>`;
    const [text = "", title] = splitTopLevel(inner, "|");
    return title ? `<span title="${escapeHtml(title)}">${this.render(text)}</span>` : this.render(text);
  }

  /** The handful of HTML tags the sources use, plus <עוגן> anchors. */
  private tags(s: string): string {
    for (const tag of ["sup", "sub", "u", "s"]) {
      const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
      s = s.replace(re, (_, t: string) => this.token(`<${tag}>${this.render(t)}</${tag}>`));
    }
    s = s.replace(/<span[^>]*dir="?ltr"?[^>]*>([\s\S]*?)<\/span>/g, (_, t: string) => this.token(`<span dir="ltr">${this.render(t)}</span>`));
    s = s.replace(/<span[^>]*>([\s\S]*?)<\/span>/g, (_, t: string) => this.token(this.render(t)));
    s = s.replace(/<עוגן\s+([^>]+)>/g, (_, name: string) => this.token(`<span id="${escapeHtml(anchorFor(name))}"></span>`));
    return s;
  }
}

const anchorFor = (name: string) => `a-${name.trim().replace(/\s+/g, "-")}`;

/* ───────────────────────── blocks ───────────────────────── */

/** Joins physical lines into logical ones while a {{ }} template is still open. */
function logicalLines(text: string): string[] {
  const out: string[] = [];
  let buf: string | null = null;
  let depth = 0;
  for (const line of text.replace(/\r/g, "").split("\n")) {
    buf = buf === null ? line : `${buf}\n${line}`;
    depth += (line.match(/\{\{/g)?.length ?? 0) - (line.match(/\}\}/g)?.length ?? 0);
    if (depth <= 0) {
      out.push(buf);
      buf = null;
      depth = 0;
    }
  }
  if (buf !== null) out.push(buf);
  return out;
}

const AMENDMENT_RE = /\s*\(תיקון:([^()]*(?:\([^()]*\)[^()]*)*)\)\s*$/;

function splitAmendment(s: string): { text: string; amendment: string | null } {
  const m = AMENDMENT_RE.exec(s);
  return m ? { text: s.slice(0, m.index).trim(), amendment: (m[1] ?? "").trim() } : { text: s.trim(), amendment: null };
}

function parseAttrs(attrs: string) {
  const num = (name: string) => Number(new RegExp(`${name}\\s*=\\s*"?(\\d+)`).exec(attrs)?.[1] ?? 1) || 1;
  return { colspan: num("colspan"), rowspan: num("rowspan") };
}

/** Cell "attrs | content": attrs only count when they look like HTML attributes. */
function cellParts(raw: string): { attrs: string; content: string } {
  const parts = splitTopLevel(raw, "|");
  if (parts.length > 1 && /^\s*(?:[a-z-]+\s*=\s*("[^"]*"|\S+)\s*)+$/i.test(parts[0] ?? "")) {
    return { attrs: parts[0] ?? "", content: parts.slice(1).join("|") };
  }
  return { attrs: "", content: raw };
}

export function parseLaw(text: string, opts: ParseOptions = {}): LawDoc {
  const inline = new Inline(opts);
  const html = (s: string) => inline.render(s.trim());
  const cellHtml = (s: string) =>
    s
      .split("\n")
      .map((l) => l.replace(/^\s*:+\s?/, "").trim())
      .filter(Boolean)
      .map((l) => inline.render(l))
      .join("<br>");

  const doc: LawDoc = { title: "", sources: null, intro: null, blocks: [], published: null, signatures: [] };
  let section: Extract<Block, { type: "section" }> | null = null;
  const usedIds = new Set<string>();
  const uniqueId = (base: string) => {
    let id = base;
    for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
    usedIds.add(id);
    return id;
  };
  const push = (b: Block) => (section ? section.body.push(b) : doc.blocks.push(b));

  // Comments can span lines; drop them before splitting.
  const lines = logicalLines(text.replace(/<!--[\s\S]*?-->/g, ""));
  let inSignatures = false;

  for (let i = 0; i < lines.length; i++) {
    const line = (lines[i] ?? "").trimEnd();
    const trimmed = line.trim();
    if (!trimmed || trimmed === "__TOC__" || /^<!--[\s\S]*-->$/.test(trimmed)) continue;

    // Document-level tags
    const tag = /^<(שם|מאגר|מקור|מבוא|פרסום|חתימות|חתימה)(?:\s[^>]*)?>\s*([\s\S]*)$/.exec(trimmed);
    if (tag) {
      const [, name, rest = ""] = tag;
      if (name === "שם") doc.title = rest.trim();
      else if (name === "מקור") doc.sources = html(rest);
      else if (name === "מבוא") doc.intro = html(rest);
      else if (name === "פרסום") doc.published = html(rest);
      else if (name === "חתימות" || name === "חתימה") {
        inSignatures = true;
        if (rest.trim()) doc.signatures.push(html(rest.replace(/^\*\s*/, "")));
      }
      continue;
    }
    if (inSignatures && trimmed.startsWith("*")) {
      doc.signatures.push(html(trimmed.replace(/^\*+\s*/, "")));
      continue;
    }

    // Headings (== פרק ==, === סימן ===, ==== reference ====)
    const heading = /^(={2,4})\s*(.*?)\s*\1\s*$/.exec(trimmed);
    if (heading) {
      const level = (heading[1] ?? "==").length as 2 | 3 | 4;
      const { text: t, amendment } = splitAmendment(heading[2] ?? "");
      section = null;
      doc.blocks.push({ type: "heading", level, html: html(t), amendment, id: uniqueId(`h-${doc.blocks.length}`) });
      continue;
    }

    if (/^-{4,}$/.test(trimmed)) {
      push({ type: "rule" });
      continue;
    }

    // Sections: "@ 1. title (תיקון: ...)" with optional " : first paragraph"
    if (trimmed.startsWith("@")) {
      let rest = trimmed.slice(1).trim();
      let anchor: string | null = null;
      const a = /^<עוגן\s+([^>]+)>\s*/.exec(rest);
      if (a) {
        anchor = anchorFor(a[1] ?? "");
        rest = rest.slice(a[0].length);
      }
      let head = rest;
      let first: string | null = null;
      const sep = rest.startsWith(":") ? 0 : rest.search(/\s:\s|\s:$/);
      if (sep >= 0) {
        head = rest.slice(0, sep).trim();
        first = rest.slice(sep).replace(/^\s*:\s?/, "");
      }
      const num = /^(\d+[א-ת]{0,3}\.|\([^)]{1,6}\))\s*/.exec(head);
      const number = num ? (num[1] ?? "").replace(/\.$/, "") : null;
      const { text: title, amendment } = splitAmendment(num ? head.slice(num[0].length) : head);
      section = {
        type: "section",
        id: uniqueId(anchor ?? (number && /^\d/.test(number) ? sectionAnchor(number) : `p-${i}`)),
        number,
        title: title ? html(title) : null,
        amendment,
        body: [],
      };
      doc.blocks.push(section);
      if (first !== null && first.trim()) {
        // Re-read the rest of the line as the section's first paragraph (or table).
        lines[i] = `: ${first}`;
        i--;
      }
      continue;
    }

    // Tables, optionally indented with colons
    const tableStart = /^(:*)\s*\{\|/.exec(trimmed);
    if (tableStart) {
      const depth = (tableStart[1] ?? "").length;
      const rows: TableRow[] = [];
      let row: TableRow | null = null;
      let lastCell: { header: boolean; colspan: number; rowspan: number; raw: string } | null = null;
      const pending: { header: boolean; colspan: number; rowspan: number; raw: string }[] = [];
      const flushRow = () => {
        if (row && pending.length) row.cells.push(...pending.map((c) => ({ header: c.header, colspan: c.colspan, rowspan: c.rowspan, html: cellHtml(c.raw) })));
        pending.length = 0;
        if (row && row.cells.length) rows.push(row);
        row = { cells: [] };
        lastCell = null;
      };
      row = { cells: [] };
      for (i = i + 1; i < lines.length; i++) {
        const l = (lines[i] ?? "").trim();
        if (l.startsWith("|}")) break;
        if (l.startsWith("|-")) {
          flushRow();
          continue;
        }
        if (l.startsWith("!") || l.startsWith("|")) {
          const header = l.startsWith("!");
          for (const raw of splitTopLevel(l.slice(1), header ? "!!" : "||")) {
            const { attrs, content } = cellParts(raw);
            lastCell = { header, ...parseAttrs(attrs), raw: content };
            pending.push(lastCell);
          }
          continue;
        }
        if (lastCell) (lastCell as { raw: string }).raw += `\n${l}`;
      }
      flushRow();
      push({ type: "table", depth, rows });
      continue;
    }

    // Paragraphs ": text", definitions ":- text"
    const para = /^(:+)(-?)\s?([\s\S]*)$/.exec(trimmed);
    if (para) {
      push({ type: "para", depth: (para[1] ?? ":").length, definition: para[2] === "-", html: html(para[3] ?? "") });
      continue;
    }
    if (trimmed.startsWith("*")) {
      push({ type: "para", depth: 1, definition: true, html: html(trimmed.replace(/^\*+\s*/, "")) });
      continue;
    }
    push({ type: "para", depth: 0, definition: false, html: html(line) });
  }
  return doc;
}

/** Table of contents: chapters and numbered sections. */
export function lawToc(doc: LawDoc): { id: string; label: string; level: 2 | 3 | 4 | 5 }[] {
  const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&quot;/g, '"').replace(/&amp;/g, "&").trim();
  const out: { id: string; label: string; level: 2 | 3 | 4 | 5 }[] = [];
  for (const b of doc.blocks) {
    if (b.type === "heading" && b.level < 4) out.push({ id: b.id, label: strip(b.html), level: b.level });
    if (b.type === "section" && b.number && /^\d/.test(b.number)) {
      out.push({ id: b.id, label: `${b.number}. ${b.title ? strip(b.title) : ""}`.trim(), level: 5 });
    }
  }
  return out;
}
