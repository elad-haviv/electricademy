"use server";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { signSimToken } from "@electricademy/auth/sim-token";
import { getDb, simSessions, users } from "@electricademy/db";
import { getCurrentAccess, getSessionUser } from "./session";
import { canUseSimulator, getSimulator } from "./simulators";

/** XP for finishing a simulator module, awarded once per module. */
const SIM_MODULE_XP = 20;

const moduleId = z.string().trim().min(1).max(80);
const eventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("opened") }),
  z.object({ type: z.literal("ready") }),
  z.object({ type: z.literal("progress"), module: moduleId, percent: z.number().min(0).max(100) }),
  z.object({ type: z.literal("completed"), module: moduleId, score: z.number().min(0).max(100).optional() }),
]);

export type SimEventInput = z.input<typeof eventSchema>;
export type RecordResult = { saved: false; reason: "anonymous" | "invalid" | "locked" | "duplicate" } | { saved: true; xp: number };

async function usableSimulator(slug: string) {
  const [sim, access] = await Promise.all([getSimulator(slug), getCurrentAccess()]);
  return sim && canUseSimulator(sim, access) ? { sim, access } : null;
}

/** Called by the hub page (SimFrame) for events from the embedded simulator. Signed-in users only. */
export async function recordSimEvent(slug: string, input: SimEventInput): Promise<RecordResult> {
  const user = await getSessionUser();
  if (!user) return { saved: false, reason: "anonymous" };
  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { saved: false, reason: "invalid" };
  if (!(await usableSimulator(slug))) return { saved: false, reason: "locked" };

  const event = parsed.data;
  const db = getDb();
  const sameModule = (type: string, module: string) =>
    and(
      eq(simSessions.userId, user.id),
      eq(simSessions.simulatorSlug, slug),
      eq(simSessions.event, type),
      sql`${simSessions.payload}->>'module' = ${module}`,
    );

  if (event.type === "progress") {
    // Keep the log small: only store progress that beats the best recorded value for the module.
    const [best] = await db
      .select({ percent: sql<number>`max((${simSessions.payload}->>'percent')::numeric)` })
      .from(simSessions)
      .where(sameModule("progress", event.module));
    if (best?.percent != null && Number(best.percent) >= event.percent) return { saved: false, reason: "duplicate" };
  }

  let xp = 0;
  if (event.type === "completed") {
    const [prior] = await db.select({ id: simSessions.id }).from(simSessions).where(sameModule("completed", event.module)).limit(1);
    if (!prior) xp = SIM_MODULE_XP;
  }

  const { type, ...payload } = event;
  await db.insert(simSessions).values({
    userId: user.id,
    simulatorSlug: slug,
    event: type,
    payload: Object.keys(payload).length ? payload : null,
  });
  if (xp) await db.update(users).set({ xp: sql`${users.xp} + ${xp}` }).where(eq(users.id, user.id));
  return { saved: true, xp };
}

export interface HubSession {
  user: { id: string; name: string | null; plan: "anonymous" | "free" | "pro" } | null;
  token: string | null;
}

/** What the hub tells an embedded simulator about the viewer (sent via sim-sdk `sendSession`). */
export async function issueSimSession(slug: string): Promise<HubSession> {
  const [user, usable] = await Promise.all([getSessionUser(), usableSimulator(slug)]);
  if (!user || !usable) return { user: null, token: null };
  const plan = usable.access.plan;
  const secret = process.env.AUTH_SECRET;
  const token = secret ? signSimToken({ sub: user.id, name: user.name, plan, sim: slug }, secret) : null;
  return { user: { id: user.id, name: user.name, plan }, token };
}
