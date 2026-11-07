import "server-only";
import { cache } from "react";
import { asc, desc, eq } from "drizzle-orm";
import { can, type Access } from "@electricademy/auth";
import { getDb, simSessions, simulators } from "@electricademy/db";

export type SimulatorRow = typeof simulators.$inferSelect;

export const getSimulator = cache(async (slug: string): Promise<SimulatorRow | null> => {
  if (!/^[a-z0-9-]{1,64}$/.test(slug)) return null;
  const [row] = await getDb().select().from(simulators).where(eq(simulators.slug, slug)).limit(1);
  return row ?? null;
});

export const listSimulators = cache(() => getDb().select().from(simulators).orderBy(asc(simulators.sortOrder)));

/** The exact origin a simulator runs on; postMessage traffic is only accepted from / sent to it. */
export function simulatorOrigin(sim: Pick<SimulatorRow, "url">): string | null {
  try {
    const url = new URL(sim.url);
    return url.protocol === "https:" || url.hostname === "localhost" ? url.origin : null;
  } catch {
    return null;
  }
}

export function canUseSimulator(sim: Pick<SimulatorRow, "tier">, access: Access): boolean {
  return sim.tier === "free" || can(access, "simulators.pro");
}

/** A user's simulator events, latest first (dashboard). */
export function listSimEvents(userId: string, limit = 500) {
  return getDb()
    .select({ slug: simSessions.simulatorSlug, event: simSessions.event, payload: simSessions.payload, at: simSessions.createdAt })
    .from(simSessions)
    .where(eq(simSessions.userId, userId))
    .orderBy(desc(simSessions.createdAt))
    .limit(limit);
}
