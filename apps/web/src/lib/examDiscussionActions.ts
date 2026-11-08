"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { can } from "@electricademy/auth";
import { loadExamBank } from "@electricademy/content";
import { examComments, getDb } from "@electricademy/db";
import type { FormState } from "./actions";
import { guardExamContent } from "./contentGuard";
import { getCurrentAccess, getSessionUser } from "./session";

const commentSchema = z.object({
  n: z.coerce.number().int().positive(),
  parentId: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().positive().optional()),
  body: z.string().trim().min(2, "התגובה קצרה מדי").max(5000, "התגובה ארוכה מדי"),
  suggestedAnswer: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().int().min(1).max(4).optional()),
});

export async function addExamComment(_: FormState, formData: FormData): Promise<FormState> {
  const n = formData.get("n");
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(`/license-exam/q/${/^\d+$/.test(String(n)) ? n : ""}`)}`);
  if (!can(await getCurrentAccess(), "community.post")) return { error: "אין הרשאה לפרסם" };
  // shares the per-minute request limit with the rest of the bank
  const guard = await guardExamContent(user.id, {});
  if (!guard.ok) return { error: guard.message };

  const parsed = commentSchema.safeParse({
    n,
    parentId: formData.get("parentId"),
    body: formData.get("body"),
    suggestedAnswer: formData.get("suggestedAnswer"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  const q = loadExamBank().byNumber.get(parsed.data.n);
  if (!q) return { error: "השאלה לא נמצאה" };

  const db = getDb();
  let parentId = parsed.data.parentId ?? null;
  if (parentId) {
    const [parent] = await db
      .select({ id: examComments.id, parentId: examComments.parentId, n: examComments.questionN })
      .from(examComments)
      .where(eq(examComments.id, parentId))
      .limit(1);
    if (!parent || parent.n !== q.n) return { error: "התגובה שעניתם עליה לא נמצאה" };
    parentId = parent.parentId ?? parent.id; // replies stay one level deep
  }

  await db.insert(examComments).values({
    questionN: q.n,
    questionSerial: q.serial,
    authorId: user.id,
    parentId,
    body: parsed.data.body,
    suggestedAnswer: parentId ? null : (parsed.data.suggestedAnswer ?? null),
  });
  revalidatePath(`/license-exam/q/${q.n}`);
  return { ok: true };
}

export async function deleteExamComment(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return;
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;
  const [row] = await getDb()
    .update(examComments)
    .set({ deletedAt: new Date() })
    .where(and(eq(examComments.id, id), eq(examComments.authorId, user.id), isNull(examComments.deletedAt)))
    .returning({ n: examComments.questionN });
  if (row) revalidatePath(`/license-exam/q/${row.n}`);
}
