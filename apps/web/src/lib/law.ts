import "server-only";
import { cache } from "react";
import katex from "katex";
import { getLegislationEntry, LEGISLATION, parseLaw, readLegislationSource, type LawDoc } from "@electricademy/content";

const LAW_SLUG = "electricity-law";

/** "=name" references inside the sources → a page on this site, when we carry that document. */
const squash = (s: string) => s.replace(/[,\s]/g, "");

function lawHref(name: string): string | null {
  if (name === "החוק" || /^חוק החשמל(?:\s|,|$)/.test(name)) return `/law/${LAW_SLUG}`;
  const hit = LEGISLATION.find((e) => {
    const inner = /\((.+)\)$/.exec(e.wikisourceTitle)?.[1];
    return inner ? squash(name).includes(squash(inner)) : false;
  });
  return hit ? `/law/${hit.slug}` : null;
}

export const getLawDoc = cache((slug: string): LawDoc | null => {
  const entry = getLegislationEntry(slug);
  const source = entry && readLegislationSource(slug);
  if (!source) return null;
  return parseLaw(source, {
    renderMath: (tex, display) => katex.renderToString(tex, { displayMode: display, throwOnError: false, output: "html" }),
    lawHref,
  });
});
