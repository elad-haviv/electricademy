# Roadmap

## Phase 1: MVP skeleton ✅ (this commit)
- Monorepo (pnpm and Turborepo), Next.js 16 app, Postgres with Drizzle, Auth.js v5.
- Hebrew RTL UI, mobile bottom navigation, PWA manifest, dark mode (follows the system setting).
- Tracks catalog with 3 sample lessons (MDX, KaTeX, mini-quizzes, an interactive calculator).
- Articles with RSS; tools (voltage drop, cable sizing, Pro short-circuit calculator).
- Simulator registry seeded with hv-edu, genset-edu, protect-edu and agl-edu.
- Community: threads, replies, tags, lesson-linked threads.
- Products page, license-exam waitlist, pricing page with a stub checkout and `can()` gating.
- Docker images for Coolify, and GitHub Actions CI.

## Phase 2: Content
- Finish the Basics and Bagrut tracks (all listed lessons).
- Question bank UI: module quizzes and the `quiz_attempt` history.
- Topic prerequisite graph and "next recommended lesson".
- Search (Postgres full-text to start).
- Author workflow for lessons and articles (MDX in the repo, with a preview deploy).

## Phase 3: Commerce
- Real payment provider (Stripe, or an Israeli processor such as Grow or Cardcom) and a webhook that upserts `subscription` and `entitlement`.
- Account page: manage subscription, invoices.
- Pro content: Technician and Academic tracks, practice exams, professional calculators.
- Newsletter and transactional email.

## Phase 4: Licensing-exam simulator (`/license-exam`)
- ✅ Beta: the official bank (v8.1, 1,121 questions with drawings), 50-question timed exams by licence (technician, practical engineer, engineer), practice by topic, browse and search.
- Verified answers and regulation references per question (`content/license-exam/answers.json`).
- Readiness score and a weak-topic report linking back to lessons.
- Sold as the `license_exam` entitlement; convert the waitlist at launch.

## Phase 5: Simulator integration
- Add `@electricademy/sim-sdk` to the existing simulators, in their own repos and only with the owner's approval. This is opt-in and keeps them working standalone.
- Signed short-lived tokens for SSO; record progress in `sim_session` and show it on the dashboard.
- Embed mode (iframe) where `embeddable = true`.

## Phase 6: Community and pro tools
- Votes, accepted answers, reputation and badges; moderation queue for `report`.
- Events and webinars, study groups.
- More calculators: fault-loop impedance and disconnection time, selectivity, earthing, PV sizing, power-factor correction.
- Native wrapper (Capacitor) only if PWA limits show up.
