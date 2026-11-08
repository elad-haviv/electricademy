# Electricademy ⚡

**From Zero to Hero in electricity.** A Hebrew-first (RTL) learning platform and community covering the basics, Bagrut, MAHAT technician and practical-engineer programs, academic electrical engineering, licensing exams, and professional tools for electricians, designers and engineers.

## Docs
- [Product spec](docs/PRODUCT.md): vision, personas, free vs. Pro, KPIs
- [Architecture](docs/ARCHITECTURE.md): monorepo, data, auth, simulators, deployment
- [Curriculum map](docs/CURRICULUM.md): the full topic tree
- [Roadmap](docs/ROADMAP.md)

## Quick start
```bash
pnpm install
cp .env.example apps/web/.env.local     # then edit
docker compose up -d db                 # or any Postgres 16
export DATABASE_URL=postgres://electricademy:electricademy@localhost:5432/electricademy
pnpm db:migrate && pnpm db:seed
pnpm dev                                # http://localhost:3000
```
With `AUTH_DEV_LOGIN=true` (development only), you can sign in with any email and no password.

## Scripts
| Command | What it does |
|---|---|
| `pnpm dev` | Runs the web app in dev mode |
| `pnpm build` | Builds all apps |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Runs the checks (also in CI) |
| `pnpm db:generate` | Creates SQL migrations after a schema change |
| `pnpm db:migrate` / `pnpm db:seed` | Applies migrations, seeds products, simulators and sample data |
| `packages/content/scripts/license-exam/extract.py` | Rebuilds the licensing-exam question bank from the ministry's PDF (see the README next to it) |
| `pnpm --filter @electricademy/web test:a11y` | Accessibility check: axe-core (WCAG 2.1 AA) on every route type, mobile and desktop, light and dark. Needs a running site with `AUTH_DEV_LOGIN=true`; set `A11Y_BASE_URL` (default `http://localhost:3000`). See [Architecture → Accessibility](docs/ARCHITECTURE.md#accessibility) |
| `pnpm --filter @electricademy/content legislation:import` | Refreshes the Electricity Law and regulations (`content/legislation`) from Hebrew Wikisource |

## Layout
```
apps/web          Next.js site
packages/{ui,db,auth,calc,content,sim-sdk}
content/          MDX lessons & articles; legislation/ holds the Electricity Law and regulations (Open Law Book markup)
docs/             Spec documents
docker/           Dockerfiles for Coolify
```

Code, identifiers and docs are in English. Everything users see is in Hebrew.
