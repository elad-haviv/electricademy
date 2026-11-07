"use server";

import { z } from "zod";
import { EXAM_LEVELS, EXAM_TOPICS, loadExamBank, questionsForLevel, sample, type ExamLevel, type ExamTopic } from "@electricademy/content";
import { getDb, quizAttempts } from "@electricademy/db";
import { clientKey, EXAM_SIZE, toClient, type ClientKey, type ClientQuestion } from "./licenseExam";
import { getSessionUser } from "./session";

const levelSchema = z.enum(Object.keys(EXAM_LEVELS) as [ExamLevel, ...ExamLevel[]]);
const topicSchema = z.enum(Object.keys(EXAM_TOPICS) as [ExamTopic, ...ExamTopic[]]);

/** A fresh simulated exam: EXAM_SIZE random questions from the licence's pool, without answers. */
export async function drawExam(level: ExamLevel): Promise<ClientQuestion[]> {
  const bank = loadExamBank();
  return sample(questionsForLevel(bank, levelSchema.parse(level)), EXAM_SIZE).map((q) => toClient(q));
}

const practiceSchema = z.object({
  level: levelSchema,
  topics: z.array(topicSchema).max(20),
  count: z.number().int().min(1).max(2000),
  numbers: z.array(z.number().int().positive()).max(2000).optional(),
});

/** Practice questions (with the answer key where we have one), by topic or by question number. */
export async function drawPractice(input: z.input<typeof practiceSchema>): Promise<ClientQuestion[]> {
  const { level, topics, count, numbers } = practiceSchema.parse(input);
  const bank = loadExamBank();
  let pool = numbers ? numbers.map((n) => bank.byNumber.get(n)).filter((q) => q !== undefined) : questionsForLevel(bank, level);
  if (topics.length) pool = pool.filter((q) => topics.includes(q.topic));
  return sample(pool, count).map((q) => toClient(q, true));
}

const gradeSchema = z.object({
  level: levelSchema,
  /** question number → chosen option (1-4); unanswered questions are absent. */
  answers: z.record(z.string().regex(/^\d+$/), z.number().int().min(1).max(4)),
  numbers: z.array(z.number().int().positive()).min(1).max(EXAM_SIZE),
});

export interface ExamGrade {
  keys: Record<number, ClientKey>;
  keyed: number;
  correct: number;
  saved: boolean;
}

/** Scores the exam against the answer key and, for signed-in users, records the attempt. */
export async function gradeExam(input: z.input<typeof gradeSchema>): Promise<ExamGrade> {
  const { level, answers, numbers } = gradeSchema.parse(input);
  const bank = loadExamBank();
  const keys: Record<number, ClientKey> = {};
  let correct = 0;
  for (const n of numbers) {
    const k = bank.answers.get(n);
    if (!k) continue;
    keys[n] = clientKey(k);
    if (answers[String(n)] === k.answer) correct++;
  }
  const keyed = Object.keys(keys).length;
  const user = await getSessionUser();
  const saved = user
    ? await getDb()
        .insert(quizAttempts)
        .values({ userId: user.id, quizKey: `license-exam:${level}`, score: correct, total: keyed, answers })
        .then(() => true)
        .catch(() => false)
    : false;
  return { keys, keyed, correct, saved };
}
