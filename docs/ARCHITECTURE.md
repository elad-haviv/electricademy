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

## Accessibility
- **Standard:** Israeli law (Equal Rights for Persons with Disabilities, Service Accessibility Regulations 2013, regulation 35) requires Israeli Standard **ת"י 5568**, which is WCAG 2.0 AA. We test against **WCAG 2.1 AA**. No accessibility overlay widget: compliance is built into the markup.
- **Statement:** `/accessibility` (Hebrew), linked from the footer on every page; on phones a slim footer row above the tab bar keeps the link. Owner details (coordinator, phone, email, postal address) and the review date live in `apps/web/src/lib/siteOwner.ts`; values in `[להשלמה: …]` are placeholders and show highlighted on the page until filled in. Update `ACCESSIBILITY_REVIEWED_AT` after each review.
- **Skip link and landmarks:** the first focusable element is "דילוג לתוכן הראשי", which targets `<main id="main" tabIndex={-1}>`. Every page has one `<h1>` (`SectionHeading level={1}` when it is the page title) and a unique `<title>`; `<html lang="he" dir="rtl">`.
- **Focus:** one global `:focus-visible` outline in `globals.css` (brand-600 in light, brand-300 in dark). Containers that are dark in both themes (footer, `PageBanner`, the home hero, the lab showcase) carry the class `on-dark`, which switches the outline to spark-400. Don't remove outlines; if a component draws its own ring (inputs), keep it at least 2px and brand-coloured.
- **Contrast tokens** (`packages/ui/src/theme.css`): `brand-600` is `#1f6ce0` so white text on it passes 4.5:1; `control` / `control-dark` are form-control borders at 3:1 or more (WCAG 1.4.11): use `ring-control dark:ring-control-dark`. Body text that is `text-slate-500` needs `dark:text-slate-400`; never `text-slate-400` on a light surface. Amber CTAs use `buttonClass("spark")` (dark text); amber text on white is `amber-700`, not 600.
- **Dialogs:** `components/Modal.tsx` wraps the native `<dialog>` with `showModal()`: the page behind is inert (focus stays inside), Escape and a backdrop click close it, focus returns to the opener (or to `returnFocus` if the opener is gone), and `data-autofocus` picks the initial focus. Never open a modal that is `display:none` at the current breakpoint (the exam's `openOverview` uses the side panel on desktop instead).
- **Live regions:** short, one per purpose. The exam announces time only at 30, 5 and 1 minutes left (assertive) and the question number on navigation (polite); the visual timer is `role="timer"` (not live). Toggle groups are buttons with `aria-pressed` in a `role="group"`, not ARIA tabs.
- **Math and figures:** KaTeX renders HTML + MathML (its default output), so screen readers read the MathML; keep it that way in `lib/richText.ts` and `rehype-katex`. Exam questions shown as a picture of text carry the text in an `sr-only` element and the image gets `alt=""`. Decorative icons and emoji get `aria-hidden`.
- **Motion:** `prefers-reduced-motion: reduce` stops animations and transitions globally (`globals.css`).
- **Check:** `pnpm --filter @electricademy/web test:a11y` (`apps/web/scripts/a11y.mjs`) runs axe-core with the WCAG 2.0/2.1 A and AA tags, plus heading and landmark best-practice rules, on every route type and on the licence exam's states (setup, running, overview sheet, submit dialog, results, practice, browse, question page), on iPhone 13 and 1440×900, light and dark. It needs a running site with a seeded DB and `AUTH_DEV_LOGIN=true` for the signed-in routes; set `A11Y_BASE_URL` (default `http://localhost:3000`). Options: `--only=license-exam,home`, `--variants=mobile-dark`, `--verbose`, `--json=out.json`. It exits 1 on any violation. axe catches about a third of WCAG issues: also test keyboard-only use, 200% zoom and 320px width by hand when changing UI.
- **Known gaps:** generic alt text for circuit drawings in exam questions, third-party simulators in iframes (mouse/touch only), external PDFs and user-generated content. They are listed on the statement page.

## Testing
- `pnpm test` runs vitest for `calc` (checked against hand-calculated values), `auth` (feature rules), `sim-sdk` (origin filtering) and `content` (catalog integrity and path-traversal guards).
- `pnpm --filter @electricademy/web test:a11y` runs the axe accessibility check against a running site (see Accessibility).
- `pnpm lint`, `pnpm typecheck` and `pnpm build` run in CI (`.github/workflows/ci.yml`).
