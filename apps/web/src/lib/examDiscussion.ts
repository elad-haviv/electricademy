import "server-only";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { loadExamBank } from "@electricademy/content";
import { examComments, getDb, users } from "@electricademy/db";

export interface ExamCommentView {
  id: number;
  parentId: number | null;
  authorId: string;
  author: string;
  body: string;
  suggestedAnswer: number | null;
  createdAt: Date;
  deleted: boolean;
}

/** Comments that belong to the bank's current question n (same serial), oldest first. */
export async function getExamDiscussion(n: number): Promise<{ comments: ExamCommentView[]; tally: Record<number, number> }> {
  const q = loadExamBank().byNumber.get(n);
  if (!q) return { comments: [], tally: {} };
  const rows = await getDb()
    .select({
      id: examComments.id,
      parentId: examComments.parentId,
      authorId: examComments.authorId,
      author: users.name,
      body: examComments.body,
      suggestedAnswer: examComments.suggestedAnswer,
      createdAt: examComments.createdAt,
      deletedAt: examComments.deletedAt,
    })
    .from(examComments)
    .innerJoin(users, eq(users.id, examComments.authorId))
    .where(and(eq(examComments.questionN, n), serialMatches(q.serial)))
    .orderBy(asc(examComments.createdAt));

  // the community's answer: each user's latest suggestion counts once
  const latest = new Map<string, number>();
  for (const r of rows) if (!r.deletedAt && r.suggestedAnswer) latest.set(r.authorId, r.suggestedAnswer);
  const tally: Record<number, number> = {};
  for (const a of latest.values()) tally[a] = (tally[a] ?? 0) + 1;

  const live = new Set(rows.filter((r) => !r.deletedAt).map((r) => r.id));
  const comments = rows
    // a deleted comment stays only as a placeholder for its replies
    .filter((r) => !r.deletedAt || rows.some((c) => c.parentId === r.id && live.has(c.id)))
    .map((r) => ({
      id: r.id,
      parentId: r.parentId,
      authorId: r.authorId,
      author: r.author ?? "משתמש",
      body: r.deletedAt ? "" : r.body,
      suggestedAnswer: r.deletedAt ? null : r.suggestedAnswer,
      createdAt: r.createdAt,
      deleted: Boolean(r.deletedAt),
    }));
  return { comments, tally };
}

function serialMatches(serial: string | null) {
  return serial === null ? isNull(examComments.questionSerial) : eq(examComments.questionSerial, serial);
}

/** Comment counts for a page of questions; empty when the database is unavailable. */
export async function getCommentCounts(ns: number[]): Promise<Record<number, number>> {
  if (ns.length === 0) return {};
  try {
    const rows = await getDb()
      .select({ n: examComments.questionN, serial: examComments.questionSerial, count: sql<number>`count(*)::int` })
      .from(examComments)
      .where(and(inArray(examComments.questionN, ns), isNull(examComments.deletedAt)))
      .groupBy(examComments.questionN, examComments.questionSerial);
    const bank = loadExamBank();
    const out: Record<number, number> = {};
    for (const r of rows) if (bank.byNumber.get(r.n)?.serial === r.serial) out[r.n] = (out[r.n] ?? 0) + r.count;
    return out;
  } catch {
    return {};
  }
}
