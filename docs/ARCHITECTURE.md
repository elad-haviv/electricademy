# Architecture

## Monorepo
pnpm workspaces and Turborepo.

```
apps/web            Next.js 16 (App Router, React 19, Tailwind v4). Main site.
packages/ui         Design tokens (Tailwind @theme) + shared React components.
packages/db         Drizzle ORM schema, migrations, seed (Postgres).
packages/auth       Entitlements (`can()`), access resolution, PaymentProvider abstraction.
packages/calc       Pure TS electrical calculations + vitest.
packages/content    Learning catalog + MDX loaders for /content.
packages/sim-sdk    postMessage contract between the hub and simulators.
content/            Lessons and articles (MDX, git-based CMS).
```

Workspace packages ship TypeScript source. `apps/web` compiles them through `transpilePackages`, so there is no build step per package.

## Content
- The **catalog** (tracks, modules and lesson titles) is in `packages/content/src/catalog.ts`. It is versioned with the code, so slugs are type-checked and stable.
- **Lesson bodies** are in `content/lessons/<track>/<module>/<lesson>.mdx`. A lesson listed in the catalog without a file is shown as "coming soon".
- **Articles** are in `content/articles/<slug>.mdx`, with frontmatter `title`, `summary`, `date`, `author` and `category`.
- MDX is rendered with `next-mdx-remote/rsc`, plus `remark-math`, `rehype-katex` and `remark-gfm`. MDX components available in content: `<Callout type="tip|note|warning">`, `<MiniQuiz question choices answer explanation />` and `<VoltageDropDemo />`.
- The content is trusted (it comes from the repo), so JSX expressions are allowed (`blockJS: false`). Dangerous JS is still blocked. **Never render user-generated content through MDX.**
- Later, if non-developers need to author content, move the catalog and lessons to the DB or a headless CMS, keeping the same slugs.

## Data (Postgres + Drizzle)
Schema: `packages/db/src/schema.ts`. Migrations: `packages/db/migrations` (`pnpm db:generate` creates them, `pnpm db:migrate` applies them).

- **Auth.js tables:** `user` (with `role`, `level`, `xp`), `account`, `session`, `verificationToken`.
- **Learning:** `lesson_progress` (keyed by lesson path), `question` (tagged by topic, level, source and difficulty), `quiz_attempt`.
- **Community:** `thread` (optionally linked to a lesson), `post`, `vote`, `report`.
- **Commerce:** `subscription`, `entitlement`, `product`, `waitlist`.
- **Simulators:** `simulator` (the registry), `sim_session` (progress events from sim-sdk).

`getDb()` creates the connection lazily, so `next build` doesn't need a database. Pages that query the DB are marked `dynamic = "force-dynamic"`.

## Auth and authorization
- **Auth.js v5** (`apps/web/src/auth.ts`) with JWT sessions and the Drizzle adapter for users and accounts. Providers are enabled by environment variables:
  - Google: `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET`.
  - Email magic link: `EMAIL_SERVER` (SMTP URL) and `EMAIL_FROM`.
  - Dev login (passwordless): `AUTH_DEV_LOGIN=true`. It is **always disabled when NODE_ENV=production**.
- **Authorization:** `can(access, feature)` in `packages/auth`. `getAccess(db, userId)` derives `plan` from active `subscription` rows and `entitlements` from unexpired `entitlement` rows. Server actions re-check `can()`; never rely on UI gating alone.

## Payments
`PaymentProvider` interface (`packages/auth/src/payments.ts`). The MVP uses `stubPaymentProvider`, which redirects back with `?checkout=unavailable`. To go live:
1. Implement a provider (Stripe, or an Israeli processor such as Grow or Cardcom).
2. Add `/api/payments/webhook` to verify the signature and upsert `subscription` and `entitlement`.
3. Swap the provider in `startCheckout`.

## Simulators
- The existing simulators stay **standalone in their own repos** and are deployed separately (hv-edu: Vite + three.js; genset-edu: Next 14 + R3F; agl-edu and protect-edu: static HTML).
- The `simulator` table is the registry (URL, level, topics, tier, `embeddable`). `/simulators/[slug]` opens an embeddable simulator in an iframe inside the site layout; Pro simulators show the paywall. None of the four labs sends `X-Frame-Options` or `frame-ancestors`, so all are embeddable.
- **Hub side (implemented):** `components/SimFrame.tsx` listens with `listenToSimulators([simulator origin])`. On `ready` it calls the `issueSimSession` server action and replies with `sendSession` (user, plan, signed token). `progress` and `completed` go to the `recordSimEvent` server action, which writes `sim_session` for signed-in users: only progress that beats the best recorded value is stored, and the first `completed` per module awards 20 XP. Every visit is logged as `opened`, so the dashboard ("המעבדות שלי") shows labs even before they report progress.
- **Tokens:** `@electricademy/auth/sim-token` (server-only) signs `{ sub, name, plan, sim, exp }` with HMAC-SHA256 under `AUTH_SECRET`, valid 15 minutes and bound to one simulator. Simulators verify with `POST /api/sim/verify`; CORS is open only to the registered simulator origins.
- **Simulator side (to do per lab repo):** see [SIMULATOR_INTEGRATION.md](SIMULATOR_INTEGRATION.md).
- New simulators live in the monorepo under `apps/` and reuse `ui`, `db` and `auth`.

## Licensing-exam simulator (`/license-exam`)
- **Data:** the ministry's question bank PDF is converted by `packages/content/scripts/license-exam/extract.py` (see its README) into `content/license-exam/bank.json` and figure crops in `apps/web/public/images/license-exam/`. Each question keeps its bank number, serial and licence scope (`all`, `practical-engineer`, `engineer`, from the tables at the end of the PDF).
- **Answers:** the official bank has none. `content/license-exam/answers.json` is our key, keyed by question number and checked against the serial; unkeyed questions are shown for self-review and left out of the score.
- **Topics:** assigned by keyword rules in `packages/content/src/licenseExamMeta.ts` (browser-safe, exported as `@electricademy/content/license-exam`); `licenseExam.ts` loads the bank on the server.
- **Modes:** `/license-exam/exam` (50 random questions per licence, optional timer, graded by the `gradeExam` server action, which also writes `quiz_attempt` for signed-in users), `/practice` (by topic or bookmarks), `/browse` (search and filters, server-rendered) and `/q/[n]`. Bookmarks and exam history are kept in `localStorage`.
- **Access:** free while in beta. `can(access, "license_exam")` is ready if it becomes a paid product.

## Deployment (Coolify)
- **web:** `docker/web.Dockerfile` (Next.js standalone on port 3000). Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` and the provider variables.
- **db:** a Postgres 16 resource in Coolify.
- **migrations:** the web container runs the bundled `db/migrate.mjs` and the idempotent `db/seed.mjs` on every start, before `server.js`.
- **Production:** https://electricademy.haviv.pro (Coolify project "electricademy").
- **Local:** run `docker compose up -d db`. `docker compose --profile full up` also runs the web image.

## Testing
- `pnpm test` runs vitest for `calc` (checked against hand-calculated values), `auth` (feature rules), `sim-sdk` (origin filtering) and `content` (catalog integrity and path-traversal guards).
- `pnpm lint`, `pnpm typecheck` and `pnpm build` run in CI (`.github/workflows/ci.yml`).
