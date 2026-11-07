import "server-only";
import {
  EXAM_LEVELS,
  EXAM_TOPICS,
  loadExamBank,
  questionsForLevel,
  type BankFigure,
  type ExamLevel,
  type ExamQuestion,
  type ExamTopic,
  type QuestionScope,
} from "@electricademy/content";

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

export interface ClientKey {
  answer: number;
  explanation?: string;
  source?: string;
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
    ...(key ? { key: { answer: key.answer, explanation: key.explanation, source: key.source } } : {}),
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
