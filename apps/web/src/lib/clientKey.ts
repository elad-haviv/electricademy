import "server-only";
import type { AnswerKeyEntry } from "@electricademy/content/license-exam";
import { richHtml } from "./richText";

/** The answer key entry as shown to learners (the serial is only used for matching). */
export type ClientKey = Omit<AnswerKeyEntry, "serial"> & {
  /** The prose fields as HTML ($LaTeX$ via KaTeX, lib/richText.ts); the calculation one line per step. */
  html: { explanation?: string; note?: string; interpretation?: string; calculation?: string[] };
};

export function clientKey(entry: AnswerKeyEntry): ClientKey {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { serial, ...rest } = entry;
  const html = (s?: string) => (s ? richHtml(s) : undefined);
  return {
    ...rest,
    html: {
      explanation: html(entry.explanation),
      note: html(entry.note),
      interpretation: html(entry.interpretation),
      calculation: entry.calculation
        ?.split(/\n|;\s+(?=[^$]*(?:\$[^$]*\$[^$]*)*$)/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map(richHtml),
    },
  };
}

