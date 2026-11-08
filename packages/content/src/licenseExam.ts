/**
 * Loads the licensing-exam bank from /content/license-exam (server only). Types, labels and topic
 * rules are in ./licenseExamMeta.ts, which is safe for the browser.
 */
import fs from "node:fs";
import path from "node:path";
import { contentRoot } from "./files";
import {
  classifyQuestion,
  EXAM_LEVELS,
  type AnswerKeyEntry,
  type BankMeta,
  type BankQuestion,
  type ExamLevel,
  type ExamTopic,
} from "./licenseExamMeta";

export * from "./licenseExamMeta";

/* ───────────── Loading ───────────── */

export interface ExamQuestion extends BankQuestion {
  topic: ExamTopic;
}

export interface ExamBank {
  meta: BankMeta;
  questions: ExamQuestion[];
  byNumber: Map<number, ExamQuestion>;
  answers: Map<number, AnswerKeyEntry>;
}

let cached: ExamBank | null = null;

function readJson<T>(file: string): T | null {
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as T) : null;
}

export function loadExamBank(): ExamBank {
  if (cached) return cached;
  const dir = path.join(contentRoot(), "license-exam");
  const raw = readJson<{ meta: BankMeta; questions: BankQuestion[] }>(path.join(dir, "bank.json"));
  if (!raw) throw new Error("content/license-exam/bank.json is missing");
  const edits = readJson<{ overrides: Record<string, QuestionOverride> }>(path.join(dir, "overrides.json"))?.overrides ?? {};
  const questions = raw.questions.map((q) => {
    const edited = applyOverride(q, edits[String(q.n)]);
    return { ...edited, topic: classifyQuestion(edited) };
  });
  const byNumber = new Map(questions.map((q) => [q.n, q]));
  const key = readJson<{ answers: Record<string, AnswerKeyEntry> }>(path.join(dir, "answers.json"));
  const answers = new Map<number, AnswerKeyEntry>();
  for (const [n, entry] of Object.entries(key?.answers ?? {})) {
    const q = byNumber.get(Number(n));
    // an entry whose serial no longer matches belongs to an older numbering: ignore it
    if (q && entry.serial === q.serial && entry.answer >= 1 && entry.answer <= q.options.length) answers.set(q.n, entry);
  }
  cached = { meta: raw.meta, questions, byNumber, answers };
  return cached;
}

/**
 * A hand-checked rewrite of one question (content/license-exam/overrides.json): text and LaTeX instead of
 * cropped pictures of text, extraction glitches fixed. Figures are kept by file name.
 */
export interface QuestionOverride {
  serial: string | null;
  stem: string[];
  figures: string[];
  options: { text: string; figures?: string[] }[];
}

/** Applies an override when it still matches the question (same serial and option count). */
export function applyOverride(q: BankQuestion, o: QuestionOverride | undefined): BankQuestion {
  if (!o || o.serial !== q.serial || o.options.length !== q.options.length) return q;
  const all = new Map([...q.figures, ...q.options.flatMap((x) => x.figures)].map((f) => [f.src, f]));
  const pick = (names: string[] | undefined) => (names ?? []).flatMap((src) => (all.has(src) ? [all.get(src)!] : []));
  return {
    ...q,
    stem: o.stem,
    figures: pick(o.figures),
    stemRendered: false,
    options: o.options.map((x) => ({ text: x.text, figures: pick(x.figures) })),
  };
}

export function questionsForLevel(bank: ExamBank, level: ExamLevel): ExamQuestion[] {
  const scopes = EXAM_LEVELS[level].scopes;
  return bank.questions.filter((q) => scopes.includes(q.level));
}

