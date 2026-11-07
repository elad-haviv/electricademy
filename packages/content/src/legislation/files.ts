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
