"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { can, stubPaymentProvider } from "@electricademy/auth";
import { allLessonPaths } from "@electricademy/content";
import { getDb, lessonProgress, posts, threads, users, waitlist } from "@electricademy/db";
import { signIn, signOut } from "@/auth";
import { COMMUNITY_TAGS } from "./labels";
import { getCurrentAccess, getSessionUser } from "./session";

const LESSON_XP = 10;

export async function toggleLessonComplete(lessonPath: string, completed: boolean) {
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=/tracks/${lessonPath}`);
  if (!allLessonPaths().includes(lessonPath)) throw new Error("Unknown lesson");
  const db = getDb();
  if (completed) {
    const inserted = await db
      .insert(lessonProgress)
      .values({ userId: user.id, lessonPath })
      .onConflictDoNothing()
      .returning();
    if (inserted.length > 0) {
      await db.update(users).set({ xp: sql`${users.xp} + ${LESSON_XP}` }).where(eq(users.id, user.id));
    }
  } else {
    const removed = await db
      .delete(lessonProgress)
      .where(and(eq(lessonProgress.userId, user.id), eq(lessonProgress.lessonPath, lessonPath)))
      .returning();
    if (removed.length > 0) {
      await db.update(users).set({ xp: sql`greatest(${users.xp} - ${LESSON_XP}, 0)` }).where(eq(users.id, user.id));
    }
  }
  revalidatePath(`/tracks/${lessonPath}`);
  revalidatePath("/dashboard");
}

export type FormState = { error?: string; ok?: boolean } | undefined;

const threadSchema = z.object({
  title: z.string().trim().min(5, "הכותרת קצרה מדי").max(200, "הכותרת ארוכה מדי"),
  body: z.string().trim().min(10, "התוכן קצר מדי").max(10_000, "התוכן ארוך מדי"),
  tag: z.enum(Object.keys(COMMUNITY_TAGS) as [string, ...string[]]),
  lessonPath: z.string().optional(),
});

export async function createThread(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/community/new");
  if (!can(await getCurrentAccess(), "community.post")) return { error: "אין הרשאה לפרסם" };

  const parsed = threadSchema.safeParse({
    title: formData.get("title"),
    body: formData.get("body"),
    tag: formData.get("tag"),
    lessonPath: formData.get("lessonPath") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  const lessonPath = parsed.data.lessonPath && allLessonPaths().includes(parsed.data.lessonPath) ? parsed.data.lessonPath : null;

  const [thread] = await getDb()
    .insert(threads)
    .values({ ...parsed.data, lessonPath, authorId: user.id })
    .returning({ id: threads.id });
  revalidatePath("/community");
  redirect(`/community/${thread!.id}`);
}

const postSchema = z.object({
  threadId: z.coerce.number().int().positive(),
  body: z.string().trim().min(2, "התגובה קצרה מדי").max(10_000, "התגובה ארוכה מדי"),
});

export async function createPost(_: FormState, formData: FormData): Promise<FormState> {
  const user = await getSessionUser();
  const threadId = formData.get("threadId");
  if (!user) redirect(`/login?callbackUrl=/community/${threadId}`);
  if (!can(await getCurrentAccess(), "community.post")) return { error: "אין הרשאה לפרסם" };

  const parsed = postSchema.safeParse({ threadId, body: formData.get("body") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };

  const db = getDb();
  const [exists] = await db.select({ id: threads.id }).from(threads).where(eq(threads.id, parsed.data.threadId)).limit(1);
  if (!exists) return { error: "הדיון לא נמצא" };

  await db.insert(posts).values({ ...parsed.data, authorId: user.id });
  revalidatePath(`/community/${parsed.data.threadId}`);
  return { ok: true };
}

const waitlistSchema = z.object({
  email: z.email("כתובת אימייל לא תקינה"),
  product: z.enum(["license-exam", "blue-grid"]),
});

export async function joinWaitlist(_: FormState, formData: FormData): Promise<FormState> {
  const parsed = waitlistSchema.safeParse({ email: formData.get("email"), product: formData.get("product") });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "קלט לא תקין" };
  await getDb()
    .insert(waitlist)
    .values({ email: parsed.data.email.toLowerCase(), productSlug: parsed.data.product })
    .onConflictDoNothing();
  return { ok: true };
}

export async function startCheckout(formData: FormData) {
  const sku = String(formData.get("sku") ?? "");
  const user = await getSessionUser();
  if (!user) redirect("/login?callbackUrl=/pricing");
  const origin = (await headers()).get("origin") ?? process.env.AUTH_URL ?? "http://localhost:3000";
  const { redirectUrl } = await stubPaymentProvider.createCheckout({
    userId: user.id,
    email: user.email ?? "",
    sku,
    successUrl: `${origin}/dashboard?checkout=success`,
    cancelUrl: `${origin}/pricing`,
  });
  redirect(redirectUrl);
}

function safeCallback(url: FormDataEntryValue | null): string {
  const value = typeof url === "string" ? url : "";
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function signInWith(formData: FormData) {
  const provider = String(formData.get("provider"));
  const redirectTo = safeCallback(formData.get("callbackUrl"));
  if (provider === "dev") {
    await signIn("dev", { email: formData.get("email"), redirectTo });
  } else if (provider === "nodemailer") {
    await signIn("nodemailer", { email: formData.get("email"), redirectTo });
  } else {
    await signIn(provider, { redirectTo });
  }
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
