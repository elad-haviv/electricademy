# Architecture

## Monorepo
pnpm workspaces and Turborepo.

```
apps/web            Next.js 16 (App Router, React 19, Tailwind v4). Main site.
apps/license-exam   (phase 4) Licensing-exam simulator app.
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
- The hub lists them through the `simulator` table (URL, level, topics, tier) and links to them. When `embeddable` is true, they can be opened in an iframe.
- **Optional integration** (phase 5) through `@electricademy/sim-sdk`:
  - The simulator calls `createSimClient(slug, { hubOrigin }).progress(module, pct)`. When it runs standalone, this does nothing.
  - The hub calls `listenToSimulators(allowedOrigins, handler)` and records events in `sim_session`.
  - The hub sends a short-lived signed token (`session` message) so the simulator can read the user and plan.
- New simulators (license-exam) live in the monorepo under `apps/` and reuse `ui`, `db` and `auth`.

## Deployment (Coolify)
- **web:** `docker/web.Dockerfile` (Next.js standalone on port 3000). Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` and the provider variables.
- **db:** a Postgres 16 resource in Coolify.
- **migrations:** the web container runs the bundled `db/migrate.mjs` and the idempotent `db/seed.mjs` on every start, before `server.js`.
- **Production:** https://electricademy.haviv.pro (Coolify project "electricademy").
- **Local:** run `docker compose up -d db`. `docker compose --profile full up` also runs the web image.

## Testing
- `pnpm test` runs vitest for `calc` (checked against hand-calculated values), `auth` (feature rules), `sim-sdk` (origin filtering) and `content` (catalog integrity and path-traversal guards).
- `pnpm lint`, `pnpm typecheck` and `pnpm build` run in CI (`.github/workflows/ci.yml`).
