"use server";

import { z } from "zod";
import { signExamTicket, verifyExamTicket } from "@electricademy/auth/content-guard";
import {
  BOOKMARK_PRACTICE_MAX,
  EXAM_LEVELS,
  EXAM_TOPICS,
  loadExamBank,
  PRACTICE_MAX,
  questionsForLevel,
  sample,
  type ExamLevel,
  type ExamTopic,
} from "@electricademy/content";
import { getDb, quizAttempts } from "@electricademy/db";
import { guardExamContent, logContentAbuse, requestIp, type LimitHit } from "./contentGuard";
import { answerFor, clientKey, EXAM_SIZE, toClient, type ClientKey, type ClientQuestion } from "./licenseExam";
import { getSessionUser } from "./session";

/*
 * Every action here is for signed-in users, validates its input with safeParse (no parser errors reach the
 * browser) and goes through the content limits in ./contentGuard.ts. Failures come back as values with a
 * Hebrew message rather than thrown errors.
 */

const levelSchema = z.enum(Object.keys(EXAM_LEVELS) as [ExamLevel, ...ExamLevel[]]);
const topicSchema = z.enum(Object.keys(EXAM_TOPICS) as [ExamTopic, ...ExamTopic[]]);
const questionNumber = z.number().int().positive().max(100_000);

export type Failure = Pick<LimitHit, "ok" | "message"> & { retry?: LimitHit["retry"] };

const SIGNED_OUT: Failure = { ok: false, message: "צריך להתחבר כדי להמשיך. אם התנתקתם, היכנסו שוב והכול יחכה לכם." };
const BAD_INPUT: Failure = { ok: false, message: "משהו בבקשה לא הסתדר. רעננו את הדף ונסו שוב." };

const failure = (hit: LimitHit): Failure => ({ ok: false, message: hit.message, retry: hit.retry });

export type DrawExamResult = { ok: true; questions: ClientQuestion[]; ticket: string } | Failure;

/**
 * A fresh simulated exam: EXAM_SIZE random questions from the licence's pool, without answers, plus a signed
 * ticket that gradeExam needs. The answers are reserved in the daily budget now, so a learner who has started
 * an exam can always submit it.
 */
export async function drawExam(level: ExamLevel): Promise<DrawExamResult> {
  const user = await getSessionUser();
  if (!user) return SIGNED_OUT;
  const parsed = levelSchema.safeParse(level);
  if (!parsed.success) return BAD_INPUT;
  const qs = sample(questionsForLevel(loadExamBank(), parsed.data), EXAM_SIZE);
  const ns = qs.map((q) => q.n);
  const guard = await guardExamContent(user.id, { view: ns, answer: ns });
  if (!guard.ok) return failure(guard);
  return { ok: true, questions: qs.map((q) => toClient(q)), ticket: signExamTicket({ sub: user.id, level: parsed.data, ns }, process.env.AUTH_SECRET ?? "") };
}

const practiceSchema = z.object({
  level: levelSchema,
  topics: z.array(topicSchema).max(Object.keys(EXAM_TOPICS).length),
  count: z.number().int().min(1).max(PRACTICE_MAX),
  /** Saved questions; the browser sends at most BOOKMARK_PRACTICE_MAX of them. */
  numbers: z.array(questionNumber).max(BOOKMARK_PRACTICE_MAX).optional(),
});

export type DrawPracticeResult = { ok: true; questions: ClientQuestion[] } | Failure;

/** Practice questions by topic or by question number. No answers: each one is revealed by revealAnswer. */
export async function drawPractice(input: z.input<typeof practiceSchema>): Promise<DrawPracticeResult> {
  const user = await getSessionUser();
  if (!user) return SIGNED_OUT;
  const parsed = practiceSchema.safeParse(input);
  if (!parsed.success) return BAD_INPUT;
  const { level, topics, count, numbers } = parsed.data;
  const bank = loadExamBank();
  let pool = numbers ? [...new Set(numbers)].map((n) => bank.byNumber.get(n)).filter((q) => q !== undefined) : questionsForLevel(bank, level);
  if (topics.length) pool = pool.filter((q) => topics.includes(q.topic));
  const qs = sample(pool, numbers ? BOOKMARK_PRACTICE_MAX : count);
  const guard = await guardExamContent(user.id, { view: qs.map((q) => q.n) });
  if (!guard.ok) return failure(guard);
  return { ok: true, questions: qs.map((q) => toClient(q)) };
}

export type RevealResult = { ok: true; key: ClientKey | null } | Failure;

/** One question's answer and explanation, on demand (practice, browse, the question page). */
export async function revealAnswer(n: number): Promise<RevealResult> {
  const user = await getSessionUser();
  if (!user) return SIGNED_OUT;
  const parsed = questionNumber.safeParse(n);
  if (!parsed.success || !loadExamBank().byNumber.has(parsed.data)) return BAD_INPUT;
  const guard = await guardExamContent(user.id, { view: [parsed.data], answer: [parsed.data] });
  if (!guard.ok) return failure(guard);
  return { ok: true, key: answerFor(parsed.data) };
}

const gradeSchema = z.object({
  ticket: z.string().max(4096),
  /** question number → chosen option (1-4); unanswered questions are absent. */
  answers: z.record(z.string().regex(/^\d{1,6}$/), z.number().int().min(1).max(4)),
});

export interface ExamGrade {
  keys: Record<number, ClientKey>;
  keyed: number;
  correct: number;
  saved: boolean;
}

export type GradeResult = ({ ok: true } & ExamGrade) | Failure;

/** Scores the exam the ticket names against the answer key and records the attempt. */
export async function gradeExam(input: z.input<typeof gradeSchema>): Promise<GradeResult> {
  const user = await getSessionUser();
  if (!user) return SIGNED_OUT;
  const parsed = gradeSchema.safeParse(input);
  if (!parsed.success) return BAD_INPUT;
  const ticket = verifyExamTicket(parsed.data.ticket, process.env.AUTH_SECRET ?? "", user.id);
  const level = levelSchema.safeParse(ticket?.level);
  if (!ticket || !level.success || ticket.ns.length > EXAM_SIZE) {
    await logContentAbuse(user.id, await requestIp().catch(() => null), "bad-exam-ticket");
    return { ok: false, message: "לא הצלחנו לבדוק את הבחינה הזו (אולי עבר יותר מיום וחצי מאז שהתחילה). אפשר להתחיל בחינה חדשה." };
  }
  // the answers were reserved when the exam was drawn: record them, but never refuse a finished exam
  await guardExamContent(user.id, { answer: ticket.ns }, { force: true, rate: false });
  const { answers } = parsed.data;
  const bank = loadExamBank();
  const keys: Record<number, ClientKey> = {};
  let correct = 0;
  for (const n of ticket.ns) {
    const k = bank.answers.get(n);
    if (!k) continue;
    keys[n] = clientKey(k);
    if (answers[String(n)] === k.answer) correct++;
  }
  const keyed = Object.keys(keys).length;
  const picked = Object.fromEntries(ticket.ns.filter((n) => answers[String(n)]).map((n) => [String(n), answers[String(n)]!]));
  const saved = await getDb()
    .insert(quizAttempts)
    .values({ userId: user.id, quizKey: `license-exam:${level.data}`, score: correct, total: keyed, answers: picked })
    .then(() => true)
    .catch(() => false);
  return { ok: true, keys, keyed, correct, saved };
}
