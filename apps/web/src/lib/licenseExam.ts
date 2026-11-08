import "server-only";
import { redirect } from "next/navigation";
import {
  EXAM_LEVELS,
  EXAM_TOPICS,
  lawSectionHref,
  loadExamBank,
  questionsForLevel,
  SCOPE_LABELS,
  type AnswerKeyEntry,
  type BankFigure,
  type ExamLevel,
  type ExamQuestion,
  type ExamTopic,
  type QuestionScope,
} from "@electricademy/content";
import { getSessionUser } from "./session";

export const EXAM_SIZE = 50;
export const IMAGE_BASE = "/images/license-exam/";

/** What the browser gets: no answer unless asked for (exam mode grades on the server). */
export interface ClientFigure extends BankFigure {
  alt: string;
}

export interface ClientQuestion {
  n: number;
  serial: string | null;
  level: QuestionScope;
  topic: ExamTopic;
  /** Paragraphs rebuilt from the PDF's line breaks. */
  stem: string[];
  stemRendered: boolean;
  figures: ClientFigure[];
  options: { text: string; figures: ClientFigure[]; rendered: boolean }[];
  /** Present only where the caller asked for the key and one exists. */
  key?: ClientKey;
}

/** The answer key entry as shown to learners (the serial is only used for matching). */
export type ClientKey = Omit<AnswerKeyEntry, "serial">;

export function clientKey(entry: AnswerKeyEntry): ClientKey {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { serial, ...rest } = entry;
  return rest;
}

/** Joins the PDF's visual lines into paragraphs: a line that ends a sentence closes its paragraph. */
export function paragraphs(lines: string[]): string[] {
  const out: string[] = [];
  let cur = "";
  for (const line of lines) {
    const startsItem = /^[•\-–]\s|^\d+[.)]\s/.test(line);
    if (cur && startsItem) {
      out.push(cur);
      cur = "";
    }
    cur = cur ? `${cur} ${line}` : line;
    if (/[.?:!]["״']?$/.test(line)) {
      out.push(cur);
      cur = "";
    }
  }
  if (cur) out.push(cur);
  return out;
}

const figure = (f: BankFigure, alt: string): ClientFigure => ({ ...f, src: IMAGE_BASE + f.src, alt });

export function toClient(q: ExamQuestion, withKey = false): ClientQuestion {
  const key = withKey ? loadExamBank().answers.get(q.n) : undefined;
  return {
    n: q.n,
    serial: q.serial,
    level: q.level,
    topic: q.topic,
    stem: paragraphs(q.stem),
    stemRendered: Boolean(q.stemRendered),
    figures: q.figures.map((f, i) => figure(f, q.stemRendered ? q.stem.join(" ") : `איור ${i + 1} לשאלה ${q.n}`)),
    options: q.options.map((o, i) => ({
      text: o.text,
      rendered: Boolean(o.rendered),
      figures: o.figures.map((f) => figure(f, o.rendered ? o.text : `איור לתשובה ${i + 1}`)),
    })),
    ...(key ? { key: clientKey(key) } : {}),
  };
}

export function bankSummary() {
  const bank = loadExamBank();
  const perLevel = Object.fromEntries(
    (Object.keys(EXAM_LEVELS) as ExamLevel[]).map((l) => [l, questionsForLevel(bank, l).length]),
  ) as Record<ExamLevel, number>;
  const perTopic = Object.fromEntries((Object.keys(EXAM_TOPICS) as ExamTopic[]).map((t) => [t, 0])) as Record<ExamTopic, number>;
  for (const q of bank.questions) perTopic[q.topic]++;
  return { meta: bank.meta, perLevel, perTopic, keyed: bank.answers.size };
}

export function topicCountsByLevel(): Record<ExamLevel, Record<ExamTopic, number>> {
  const bank = loadExamBank();
  const out = {} as Record<ExamLevel, Record<ExamTopic, number>>;
  for (const level of Object.keys(EXAM_LEVELS) as ExamLevel[]) {
    const counts = Object.fromEntries((Object.keys(EXAM_TOPICS) as ExamTopic[]).map((t) => [t, 0])) as Record<ExamTopic, number>;
    for (const q of questionsForLevel(bank, level)) counts[q.topic]++;
    out[level] = counts;
  }
  return out;
}

/** A bank question with its keyed answer, for the home-page teaser. */
export interface ShowcaseSample {
  n: number;
  topic: string;
  level: string;
  question: string;
  options: string[];
  /** 0-based. */
  correct: number;
  formula: string | null;
  explanation: string;
  source: { label: string; href: string | null } | null;
}

/** Hand-picked: text-only, high-confidence answers across topics (a calculation, regulations, live work). */
const SHOWCASE = [247, 3, 368];

export function showcaseSamples(): { samples: ShowcaseSample[]; total: number; version: string | null } {
  const bank = loadExamBank();
  const samples = SHOWCASE.flatMap((n) => {
    const q = bank.byNumber.get(n);
    const k = bank.answers.get(n);
    if (!q || !k || q.figures.length || q.options.some((o) => !o.text || o.figures.length)) return [];
    const ref = k.references?.[0];
    return [
      {
        n,
        topic: EXAM_TOPICS[q.topic].title,
        level: SCOPE_LABELS[q.level],
        question: q.stem.join(" "),
        options: q.options.map((o) => o.text),
        correct: k.answer - 1,
        formula: k.calculation ?? null,
        explanation: k.explanation ?? "",
        source: ref ? { label: `${ref.title}${ref.section ? `, סעיף ${ref.section}` : ""}`, href: lawSectionHref(ref) } : null,
      },
    ];
  });
  return { samples, total: bank.meta.count, version: bank.meta.version };
}

/** The simulator is for signed-in users: guests go to the login page and come back to `returnTo`. */
export async function requireExamUser(returnTo: string) {
  const user = await getSessionUser().catch(() => null);
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(returnTo)}`);
  return user;
}
