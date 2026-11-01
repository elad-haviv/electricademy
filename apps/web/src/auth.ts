import NextAuth, { type NextAuthConfig } from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { accounts, getDb, sessions, users, verificationTokens } from "@electricademy/db";

/** Development-only passwordless login. Never active in production builds. */
export const devLoginEnabled = process.env.AUTH_DEV_LOGIN === "true" && process.env.NODE_ENV !== "production";

function providers(): Provider[] {
  const list: Provider[] = [];
  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) list.push(Google);
  if (process.env.EMAIL_SERVER) {
    list.push(Nodemailer({ server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM }));
  }
  if (devLoginEnabled) {
    list.push(
      Credentials({
        id: "dev",
        name: "Dev login",
        credentials: { email: { label: "Email", type: "email" } },
        async authorize(credentials) {
          const email = String(credentials?.email ?? "").trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return null;
          const db = getDb();
          const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
          if (existing) return existing;
          const [created] = await db.insert(users).values({ email, name: email.split("@")[0] }).returning();
          return created ?? null;
        },
      }),
    );
  }
  return list;
}

export const enabledProviders = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  email: Boolean(process.env.EMAIL_SERVER),
  dev: devLoginEnabled,
};

// Lazy config so that building the app does not require a database connection.
export const { handlers, auth, signIn, signOut } = NextAuth((): NextAuthConfig => ({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // JWT sessions are required for the credentials (dev) provider and keep requests DB-free.
  session: { strategy: "jwt" },
  providers: providers(),
  pages: { signIn: "/login", verifyRequest: "/login?sent=1" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
}));
