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
- **License-exam content protection:** `exam_content_access`, `rate_limit_counter`, `content_abuse_event` (see "Content protection" below).

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
- **Data:** the ministry's question bank PDF is converted by `packages/content/scripts/license-exam/extract.py` (see its README) into `content/license-exam/bank.json` and figure crops in `content/license-exam/figures/` (served only through a signed-URL route; see "Content protection"). Each question keeps its bank number, serial and licence scope (`all`, `practical-engineer`, `engineer`, from the tables at the end of the PDF).
- **Answers:** the official bank has none. `content/license-exam/answers.json` is our key, keyed by question number and checked against the serial; unkeyed questions are shown for self-review and left out of the score.
- **Topics:** assigned by keyword rules in `packages/content/src/licenseExamMeta.ts` (browser-safe, exported as `@electricademy/content/license-exam`); `licenseExam.ts` loads the bank on the server.
- **Modes:** `/license-exam/exam` (50 random questions per licence, optional timer, graded by the `gradeExam` server action against the signed ticket the draw returned; it also writes `quiz_attempt`), `/practice` (by topic or bookmarks; each answer is fetched with `revealAnswer` when the learner picks), `/browse` (search and filters, server-rendered, "show answer" on demand) and `/q/[n]`. All of them need sign-in. Bookmarks and exam history are kept in `localStorage`.
- **Access:** free while in beta. `can(access, "license_exam")` is ready if it becomes a paid product.

### Content protection
The bank (questions, our answers and explanations, figures) should not be easy to copy wholesale. This is a realistic level of protection against bulk extraction, not DRM: anyone who can read a question can copy it by hand.

- **What is public on purpose:** the `/license-exam` landing page and the three demo questions with their answers on the home page (`showcaseSamples` in `lib/licenseExam.ts`). Their figures, if they ever have any, are served without a signature (`isDemoFigure`).
- **Sign-in:** the exam, practice, browse and `/q/[n]` pages call `requireExamUser`; the server actions `drawExam`, `drawPractice`, `revealAnswer` and `gradeExam` refuse guests.
- **No answers in the page:** questions reach the browser without their key (`toClient` only says whether one exists). Practice fetches one answer when the learner picks an option; browse and `/q/[n]` fetch it when the learner presses "הצגת התשובה". The discussion tally no longer marks the official answer. The exam keeps the key on the server until submission: `drawExam` returns a ticket (`@electricademy/auth/content-guard`, HMAC under `AUTH_SECRET`, bound to the user and the 50 drawn numbers, valid 36 hours), and `gradeExam` grades only the numbers in that ticket, so it cannot be asked for the keys of arbitrary questions.
- **Caps per request:** practice draws at most 50 questions (`PRACTICE_MAX`), or 100 saved questions (`BOOKMARK_PRACTICE_MAX`, a random subset if more are saved); browse shows 20 per page. All action inputs are validated with `safeParse`, and failures return a Hebrew message, never parser output.
- **Limits** (`lib/contentGuard.ts`, pure parts in `packages/auth/src/contentGuard.ts`): every page view, draw and reveal of bank content goes through `guardExamContent`.

  | Limit | Default | Environment variable |
  | --- | --- | --- |
  | Requests per user per minute | 40 | `CONTENT_LIMIT_USER_PER_MINUTE` |
  | Requests per IP per minute | 150 | `CONTENT_LIMIT_IP_PER_MINUTE` |
  | Distinct questions per user per day | 400 | `CONTENT_LIMIT_USER_VIEWS_PER_DAY` |
  | Distinct answers per user per day | 300 | `CONTENT_LIMIT_USER_ANSWERS_PER_DAY` |
  | Distinct questions per IP per day | 1000 | `CONTENT_LIMIT_IP_VIEWS_PER_DAY` |
  | Distinct answers per IP per day | 800 | `CONTENT_LIMIT_IP_ANSWERS_PER_DAY` |

  Days run midnight to midnight, Israel time. Seeing the same question again the same day is free, so honest learners never get near the budgets (six full exams are 300 questions). Starting an exam takes 50 views and reserves 50 answers, so a learner who started an exam can always submit it. To change a limit, set its variable in Coolify and restart; the defaults are `DEFAULT_CONTENT_LIMITS`. When a limit is hit, the learner sees a calm Hebrew notice (`components/license-exam/LimitNotice.tsx`) that says when it resets; nothing is recorded for the refused request. If the database is unreachable the guard lets requests through and logs an error.
- **Client IP:** `CF-Connecting-IP` when present (production runs behind Cloudflare), otherwise the X-Forwarded-For entry appended by our own proxy (the rightmost; `TRUSTED_PROXY_HOPS` if there are more proxies), never the client-supplied leftmost one. `CLIENT_IP_HEADER` pins a single header instead (for example `x-real-ip` without Cloudflare). IPv6 addresses count per /64.
- **Tables:** `exam_content_access` (one row per subject, day, kind and question; subject `u:<user id>` or `ip:<address>`; pruned after a week), `rate_limit_counter` (one-minute windows; pruned after a day) and `content_abuse_event` (refused requests and forged or expired exam tickets, at most one row per user and reason every 10 minutes, also printed to the server log as `[content-guard] …`). To review abuse: `select reason, user_id, ip, count(*), max(created_at) from content_abuse_event group by 1,2,3 order by 5 desc;`.
- **Figures:** not in `public/`. `GET /api/license-exam/figure/<file>?e=<expiry>&s=<signature>` serves them from `content/license-exam/figures/`; pages hand out URLs signed with `AUTH_SECRET` that expire at a day boundary 1-2 days ahead (stable within a day, so the browser cache works). Anything unsigned, expired or malformed is a 404. Responses are `private`, `noindex` and `Cross-Origin-Resource-Policy: same-origin`.
- **Search engines:** `app/robots.ts` disallows `/api/` and `/license-exam/(exam|practice|browse|q/)`, and those pages send `noindex, nofollow`. The `/q/[n]` metadata no longer contains the question text (it is rendered even for guests on their way to the login page).
- **Residual risks:** a patient scraper with many accounts and many IPs (or a botnet) can still collect the bank over days; the limits make that slow and visible in `content_abuse_event`, not impossible. Signed figure URLs can be shared until they expire. `CF-Connecting-IP` is only trustworthy if the origin accepts traffic from Cloudflare alone (Cloudflare Tunnel, or a firewall allowing only Cloudflare's IP ranges); otherwise a client that reaches the origin directly can fake it and dodge the per-IP limits (the per-user limits still apply). The bank files are in the git repository (currently public) and inside the Docker image: keep the repository and any image registry private. Sign-up is free and automatic, so the per-IP limits are the main check on mass account creation; adding a CAPTCHA or email verification to sign-up would raise the cost further.

## Deployment (Coolify)
- **web:** `docker/web.Dockerfile` (Next.js standalone on port 3000). Set `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL` and the provider variables.
- **db:** a Postgres 16 resource in Coolify.
- **migrations:** the web container runs the bundled `db/migrate.mjs` and the idempotent `db/seed.mjs` on every start, before `server.js`.
- **Production:** https://electricademy.haviv.pro (Coolify project "electricademy").
- **Local:** run `docker compose up -d db`. `docker compose --profile full up` also runs the web image.

## Testing
- `pnpm test` runs vitest for `calc` (checked against hand-calculated values), `auth` (feature rules, sim tokens, content-guard limits, client IP and signatures), `sim-sdk` (origin filtering) and `content` (catalog integrity and path-traversal guards).
- `pnpm lint`, `pnpm typecheck` and `pnpm build` run in CI (`.github/workflows/ci.yml`).
