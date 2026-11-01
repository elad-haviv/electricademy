import "server-only";
import { cache } from "react";
import { ANONYMOUS_ACCESS, getAccess, type Access } from "@electricademy/auth";
import { getDb } from "@electricademy/db";
import { auth } from "@/auth";

export const getSessionUser = cache(async () => {
  const session = await auth();
  return session?.user?.id ? { id: session.user.id, name: session.user.name ?? null, email: session.user.email ?? null } : null;
});

export const getCurrentAccess = cache(async (): Promise<Access> => {
  const user = await getSessionUser();
  if (!user) return ANONYMOUS_ACCESS;
  return getAccess(getDb(), user.id);
});
