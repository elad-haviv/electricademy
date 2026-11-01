import { and, eq, gt, inArray, isNull, or } from "drizzle-orm";
import { entitlements, subscriptions, type Database } from "@electricademy/db";
import { ANONYMOUS_ACCESS, type Access } from "./features";

/** Resolves a user's plan and entitlements from the database. */
export async function getAccess(db: Database, userId: string | null | undefined): Promise<Access> {
  if (!userId) return ANONYMOUS_ACCESS;
  const now = new Date();

  const [subs, grants] = await Promise.all([
    db
      .select({ plan: subscriptions.plan })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          inArray(subscriptions.status, ["active", "trialing"]),
          or(isNull(subscriptions.currentPeriodEnd), gt(subscriptions.currentPeriodEnd, now)),
        ),
      ),
    db
      .select({ feature: entitlements.feature })
      .from(entitlements)
      .where(and(eq(entitlements.userId, userId), or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, now)))),
  ]);

  return {
    plan: subs.some((s) => s.plan === "pro") ? "pro" : "free",
    entitlements: new Set(grants.map((g) => g.feature)),
  };
}
