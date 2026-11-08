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
    // a display formula may scroll sideways on a phone: make it reachable by keyboard (WCAG 2.1.1)
    return display
      ? `<div class="rich-math" dir="ltr">${html.replace('<span class="katex-display">', '<span class="katex-display" tabindex="0">')}</div>`
      : `<span class="rich-math" dir="ltr">${html}</span>`;
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
  // tables scroll sideways on narrow screens: focusable and named so keyboard users can scroll them
  return `<div class="rich-table" tabindex="0" role="group" aria-label="טבלה"><table>${head}<tbody>${body}</tbody></table></div>`;
}

/** One stem paragraph or option: a pipe table, or text with math. */
export function richHtml(text: string): string {
  const lines = text.split("\n");
  if (lines.length > 1 && lines.every((l) => l.trim().startsWith("|"))) return tableHtml(lines);
  return lines.map(inlineHtml).join("<br>");
}

/** Plain text for search and screen-reader labels: math source without the dollars. */
const SYMBOLS: Record<string, string> = {
  times: "×", cdot: "·", le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈", pm: "±",
  Omega: "Ω", omega: "ω", varphi: "φ", phi: "φ", Phi: "Φ", Delta: "Δ", delta: "δ", alpha: "α", beta: "β",
  theta: "θ", eta: "η", rho: "ρ", mu: "μ", pi: "π", sum: "Σ", infty: "∞", circ: "°", to: "→", rightarrow: "→",
  backslash: "\\", cos: "cos", sin: "sin", tan: "tan", ln: "ln", log: "log",
};

/** Plain text for search and screen readers: "$I_n=250\,[\text{A}]$" → "I_n=250 [A]". */
export function plainText(text: string): string {
  let s = text.replace(/\$/g, "");
  // innermost-first, so nested fractions and roots unwrap
  for (let i = 0; i < 4; i++) {
    s = s
      .replace(/\\(?:d|t)?frac\{([^{}]*)\}\{([^{}]*)\}/g, "($1)/($2)")
      .replace(/\\sqrt\{([^{}]*)\}/g, "√($1)")
      // the word joiner keeps "\circ\text{C}" from fusing into the unknown command "\circC"
      .replace(/\\(?:text|mathrm|mathit|operatorname)\{([^{}]*)\}/g, "\u2060$1")
      .replace(/\\left|\\right/g, "");
  }
  return s
    .replace(/\\[,;:! ]/g, " ")
    .replace(/\\([a-zA-Z]+)/g, (_, cmd: string) => SYMBOLS[cmd] ?? " ")
    .replace(/\^\{?2\}?/g, "²")
    .replace(/\^\{?3\}?/g, "³")
    .replace(/\^\{?\\?circ\}?|\^°/g, "°")
    .replace(/\\([%$#&_{}])/g, "$1")
    .replace(/[{}\u2060]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
