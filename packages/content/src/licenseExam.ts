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
  const questions = raw.questions.map((q) => ({ ...q, topic: classifyQuestion(q) }));
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

export function questionsForLevel(bank: ExamBank, level: ExamLevel): ExamQuestion[] {
  const scopes = EXAM_LEVELS[level].scopes;
  return bank.questions.filter((q) => scopes.includes(q.level));
}

