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
import { figureExpiry, signFigure } from "@electricademy/auth/content-guard";
import { plainText, richHtml } from "./richText";
import { getSessionUser } from "./session";

export const EXAM_SIZE = 50;
/** Figures are served by app/api/license-exam/figure (from content/license-exam/figures), never from public/. */
export const FIGURE_ROUTE = "/api/license-exam/figure/";

/**
 * What the browser gets: never the answer. Answers come one at a time from revealAnswer (practice, browse,
 * question page) or all at once from gradeExam after an exam is submitted.
 */
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
  /** The stem paragraphs as HTML (math via KaTeX, tables); see lib/richText.ts. */
  stemHtml: string[];
  stemRendered: boolean;
  figures: ClientFigure[];
  options: { text: string; html: string; figures: ClientFigure[]; rendered: boolean }[];
  /** Filled in on the client once the answer has been revealed. */
  key?: ClientKey;
  /** Whether the bank has an answer for this question (the answer itself is not sent). */
  keyed: boolean;
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
    if (line.includes("\n") || line.trim().startsWith("|")) {
      // a table or a multi-line entry from an override stands alone
      if (cur) out.push(cur);
      out.push(line);
      cur = "";
      continue;
    }
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

/**
 * A figure URL signed for a day or two: only pages that already passed the sign-in and the limits hand
 * them out. The home-page demo questions' figures are public and need no signature.
 */
export function figureUrl(file: string): string {
  if (isDemoFigure(file)) return FIGURE_ROUTE + file;
  const exp = figureExpiry();
  return `${FIGURE_ROUTE}${file}?e=${exp}&s=${signFigure(file, exp, process.env.AUTH_SECRET ?? "")}`;
}

const figure = (f: BankFigure, alt: string): ClientFigure => ({ ...f, src: figureUrl(f.src), alt });

export function toClient(q: ExamQuestion): ClientQuestion {
  return {
    n: q.n,
    serial: q.serial,
    level: q.level,
    topic: q.topic,
    stem: paragraphs(q.stem).map(plainText),
    stemHtml: paragraphs(q.stem).map(richHtml),
    stemRendered: Boolean(q.stemRendered),
    figures: q.figures.map((f, i) => figure(f, q.stemRendered ? q.stem.join(" ") : `איור ${i + 1} לשאלה ${q.n}`)),
    options: q.options.map((o, i) => ({
      text: plainText(o.text),
      html: richHtml(o.text),
      rendered: Boolean(o.rendered),
      figures: o.figures.map((f) => figure(f, o.rendered ? o.text : `איור לתשובה ${i + 1}`)),
    })),
    keyed: loadExamBank().answers.has(q.n),
  };
}

/** The answer key entry of question n, for the reveal action (callers check the limits first). */
export function answerFor(n: number): ClientKey | null {
  const k = loadExamBank().answers.get(n);
  return k ? clientKey(k) : null;
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
  /** HTML (math via KaTeX). */
  question: string;
  /** The stem's figures (public on purpose: see isDemoFigure). */
  figures: ClientFigure[];
  options: string[];
  /** 0-based. */
  correct: number;
  formula: string | null;
  explanation: string;
  source: { label: string; href: string | null } | null;
}

/** Hand-picked: high-confidence answers across topics (a calculation, regulations, live work). Options must be text. */
const SHOWCASE = [247, 3, 368];

/** The demo questions are public on purpose, their figures included; every other figure needs a signed URL. */
export function isDemoFigure(file: string): boolean {
  const bank = loadExamBank();
  return SHOWCASE.some((n) => bank.byNumber.get(n)?.figures.some((f) => f.src === file));
}

export function showcaseSamples(): { samples: ShowcaseSample[]; total: number; version: string | null } {
  const bank = loadExamBank();
  const samples = SHOWCASE.flatMap((n) => {
    const q = bank.byNumber.get(n);
    const k = bank.answers.get(n);
    if (!q || !k || q.stemRendered || q.options.some((o) => !o.text || o.rendered || o.figures.length)) return [];
    const ref = k.references?.[0];
    return [
      {
        n,
        topic: EXAM_TOPICS[q.topic].title,
        level: SCOPE_LABELS[q.level],
        question: q.stem.map(richHtml).join(" "),
        figures: q.figures.map((f, i) => figure(f, `איור ${i + 1} לשאלה`)),
        options: q.options.map((o) => richHtml(o.text)),
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
