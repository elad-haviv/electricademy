import fs from "node:fs";
import path from "node:path";
import { contentRoot } from "../files";
import { getLegislationEntry } from "./manifest";

/** Raw Open Law Book source for a manifest slug, or null. */
export function readLegislationSource(slug: string): string | null {
  if (!getLegislationEntry(slug)) return null;
  const file = path.join(contentRoot(), "legislation", `${slug}.txt`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
}

export interface LegislationFigures {
  /** One entry per [[תמונה:...]] link, in document order; null drops the link. */
  images?: (LegislationFigure | null)[];
  /** One entry per omission note ("(((איור הושמט)))"), in document order. */
  omitted?: LegislationFigure[][];
}

export interface LegislationFigure {
  /** Path under /images/legislation/. */
  src: string;
  alt: string;
  source?: string;
}

let figuresCache: Record<string, LegislationFigures> | null = null;

/** Figures extracted from the original Reshumot scans (content/legislation/figures.json). */
export function readLegislationFigures(slug: string): LegislationFigures {
  if (!figuresCache) {
    const file = path.join(contentRoot(), "legislation", "figures.json");
    figuresCache = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, LegislationFigures>) : {};
  }
  return figuresCache[slug] ?? {};
}
