import {
  boolean,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

/* ───────────── Users & Auth.js ───────────── */

export const roleEnum = pgEnum("role", ["member", "author", "moderator", "admin"]);

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
  role: roleEnum("role").notNull().default("member"),
  /** Self-declared learning level / persona, e.g. "bagrut", "licensing". */
  level: text("level"),
  bio: text("bio"),
  xp: integer("xp").notNull().default(0),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ───────────── Learning ───────────── */

/** Tracks, modules and lessons live in /content as MDX; progress references them by path. */
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** "<track>/<module>/<lesson>" */
    lessonPath: text("lesson_path").notNull(),
    completedAt: timestamp("completed_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonPath] })],
);

export const questionSourceEnum = pgEnum("question_source", ["original", "bagrut", "mahat", "licensing", "academic"]);

export const questions = pgTable(
  "question",
  {
    id: serial("id").primaryKey(),
    topic: text("topic").notNull(),
    level: text("level").notNull(),
    source: questionSourceEnum("source").notNull().default("original"),
    difficulty: integer("difficulty").notNull().default(1),
    prompt: text("prompt").notNull(),
    choices: jsonb("choices").$type<string[]>().notNull(),
    answerIndex: integer("answer_index").notNull(),
    explanation: text("explanation"),
    isPro: boolean("is_pro").notNull().default(false),
  },
  (t) => [index("question_topic_idx").on(t.topic)],
);

export const quizAttempts = pgTable("quiz_attempt", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  quizKey: text("quiz_key").notNull(),
  score: integer("score").notNull(),
  total: integer("total").notNull(),
  answers: jsonb("answers").$type<Record<string, number>>().notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/* ───────────── Community ───────────── */

export const threads = pgTable(
  "thread",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    tag: text("tag").notNull(),
    authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** Optional link to the lesson the discussion is about. */
    lessonPath: text("lesson_path"),
    acceptedPostId: integer("accepted_post_id"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("thread_tag_idx").on(t.tag), index("thread_created_idx").on(t.createdAt)],
);

export const posts = pgTable(
  "post",
  {
    id: serial("id").primaryKey(),
    threadId: integer("thread_id").notNull().references(() => threads.id, { onDelete: "cascade" }),
    authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("post_thread_idx").on(t.threadId)],
);

/** Discussion under a licensing-exam bank question (/license-exam/q/<n>). */
export const examComments = pgTable(
  "exam_comment",
  {
    id: serial("id").primaryKey(),
    /** Question number in the bank ("שאלה N"). */
    questionN: integer("question_n").notNull(),
    /** The question's serial when the comment was written; a renumbered bank hides stale threads. */
    questionSerial: text("question_serial"),
    authorId: text("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    /** One level of replies. */
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    /** Optional "I think the answer is N" (1-4), tallied as the community's answer. */
    suggestedAnswer: integer("suggested_answer"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { mode: "date" }),
  },
  (t) => [index("exam_comment_question_idx").on(t.questionN)],
);

export const voteTargetEnum = pgEnum("vote_target", ["thread", "post"]);

export const votes = pgTable(
  "vote",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    targetType: voteTargetEnum("target_type").notNull(),
    targetId: integer("target_id").notNull(),
    value: integer("value").notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.targetType, t.targetId] })],
);

export const reports = pgTable("report", {
  id: serial("id").primaryKey(),
  reporterId: text("reporter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  targetType: voteTargetEnum("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  reason: text("reason").notNull(),
  resolved: boolean("resolved").notNull().default(false),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/* ───────────── Commerce ───────────── */

export const planEnum = pgEnum("plan", ["free", "pro"]);
export const subscriptionStatusEnum = pgEnum("subscription_status", ["active", "trialing", "past_due", "canceled"]);

export const subscriptions = pgTable("subscription", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: planEnum("plan").notNull(),
  status: subscriptionStatusEnum("status").notNull(),
  provider: text("provider").notNull(),
  providerRef: text("provider_ref"),
  currentPeriodEnd: timestamp("current_period_end", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});

/** Grants for separately sold products (e.g. "license_exam", "blue_grid"). */
export const entitlements = pgTable(
  "entitlement",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    source: text("source").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.feature] })],
);

export const productStatusEnum = pgEnum("product_status", ["live", "beta", "coming_soon"]);

export const products = pgTable("product", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  url: text("url"),
  status: productStatusEnum("status").notNull().default("live"),
  featured: boolean("featured").notNull().default(false),
  /** Content topics where a contextual banner for this product should appear. */
  topics: text("topics").array().notNull().default([]),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const waitlist = pgTable(
  "waitlist",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    productSlug: text("product_slug").notNull().references(() => products.slug, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("waitlist_email_product_idx").on(t.email, t.productSlug)],
);

/* ───────────── Simulators ───────────── */

export const tierEnum = pgEnum("tier", ["free", "pro"]);

/** Registry of simulators. Existing ones are standalone apps in their own repos. */
export const simulators = pgTable("simulator", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  url: text("url").notNull(),
  repo: text("repo"),
  level: text("level").notNull(),
  topics: text("topics").array().notNull().default([]),
  tier: tierEnum("tier").notNull().default("free"),
  embeddable: boolean("embeddable").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

/** Progress reported by simulators through @electricademy/sim-sdk. */
export const simSessions = pgTable(
  "sim_session",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    simulatorSlug: text("simulator_slug").notNull().references(() => simulators.slug, { onDelete: "cascade" }),
    /** "opened" | "ready" | "progress" | "completed" */
    event: text("event").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("sim_session_user_sim_idx").on(t.userId, t.simulatorSlug)],
);
