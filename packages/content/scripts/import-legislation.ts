/**
 * Refreshes /content/legislation/<slug>.txt from Hebrew Wikisource ("ספר החוקים הפתוח").
 * Usage: pnpm --filter @electricademy/content legislation:import [slug ...]
 *
 * Uses index.php?action=raw (one request every few seconds) with an identifying User-Agent,
 * per https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits.
 */
import fs from "node:fs";
import path from "node:path";
import { LEGISLATION } from "../src/legislation/manifest";
import { contentRoot } from "../src/files";
import { parseLaw } from "../src/legislation/parse";

const USER_AGENT = "ElectricademyContentImport/1.0 (https://electricademy.haviv.pro; public legislation import)";
const DELAY_MS = 4000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchSource(title: string): Promise<string> {
  const url = `https://he.wikisource.org/w/index.php?${new URLSearchParams({ title: `מקור:${title}`, action: "raw" })}`;
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.ok) return res.text();
    if (attempt >= 4 || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} for ${title}`);
    await sleep(DELAY_MS * 5 * attempt);
  }
}

const only = new Set(process.argv.slice(2));
const dir = path.join(contentRoot(), "legislation");
fs.mkdirSync(dir, { recursive: true });

for (const entry of LEGISLATION.filter((e) => only.size === 0 || only.has(e.slug))) {
  const text = (await fetchSource(entry.wikisourceTitle)).trimEnd() + "\n";
  const doc = parseLaw(text);
  if (!doc.title || doc.blocks.length === 0) throw new Error(`Unexpected content for ${entry.slug}`);
  const file = path.join(dir, `${entry.slug}.txt`);
  const changed = !fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text;
  fs.writeFileSync(file, text);
  console.log(`${changed ? "updated  " : "unchanged"} ${entry.slug} (${doc.blocks.length} blocks)`);
  await sleep(DELAY_MS);
}
