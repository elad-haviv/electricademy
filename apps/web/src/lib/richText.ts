import "server-only";
import katex from "katex";

/**
 * Bank text → HTML: `$…$` inline and `$$…$$` display math through KaTeX, GitHub-style pipe tables,
 * everything else escaped. Math is wrapped in a left-to-right span so it keeps its order inside Hebrew.
 * The input is our own content (content/license-exam), never user input.
 */
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function tex(src: string, display: boolean): string {
  try {
    const html = katex.renderToString(src, { displayMode: display, throwOnError: true, strict: "ignore" });
    return display ? `<div class="rich-math" dir="ltr">${html}</div>` : `<span class="rich-math" dir="ltr">${html}</span>`;
  } catch {
    return escapeHtml(display ? `$$${src}$$` : `$${src}$`);
  }
}

export function inlineHtml(text: string): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(/\$\$([\s\S]+?)\$\$|(?<!\\)\$([^$]+?)(?<!\\)\$/g)) {
    out += escapeHtml(text.slice(last, m.index).replace(/\\\$/g, "$"));
    out += m[1] !== undefined ? tex(m[1], true) : tex(m[2]!, false);
    last = m.index! + m[0].length;
  }
  return out + escapeHtml(text.slice(last).replace(/\\\$/g, "$"));
}

function tableHtml(lines: string[]): string {
  const cells = (line: string) =>
    line
      .trim()
      .replace(/^\||\|$/g, "")
      .split("|")
      .map((c) => c.trim());
  const hasRule = lines[1] !== undefined && /^\s*\|?\s*:?-{2,}/.test(lines[1]);
  const head = hasRule ? `<thead><tr>${cells(lines[0]!).map((c) => `<th>${inlineHtml(c)}</th>`).join("")}</tr></thead>` : "";
  const rows = hasRule ? lines.slice(2) : lines;
  const body = rows.map((r) => `<tr>${cells(r).map((c) => `<td>${inlineHtml(c)}</td>`).join("")}</tr>`).join("");
  return `<div class="rich-table"><table>${head}<tbody>${body}</tbody></table></div>`;
}

/** One stem paragraph or option: a pipe table, or text with math. */
export function richHtml(text: string): string {
  const lines = text.split("\n");
  if (lines.length > 1 && lines.every((l) => l.trim().startsWith("|"))) return tableHtml(lines);
  return lines.map(inlineHtml).join("<br>");
}

/** Plain text for search and screen-reader labels: math source without the dollars. */
export function plainText(text: string): string {
  return text
    .replace(/\\text\{([^}]*)\}/g, "$1")
    .replace(/\$+/g, "")
    .replace(/\\[a-zA-Z]+/g, " ")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
