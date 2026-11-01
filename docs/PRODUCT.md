# Electricademy: Product Spec

## Vision
**From Zero to Hero in electricity.** Electricademy is a Hebrew-first learning community that takes people from "what is voltage?" all the way to power-system analysis and licensing exams. It also serves working electricians, designers and engineers with tools, calculations, news and innovations. The focus is on power systems, electrical regulations and installations.

The platform also showcases and sells our own products: **Blue Grid**, the upcoming **licensing-exam simulator**, and the standalone simulators (**hv-edu**, **genset-edu**, **protect-edu**, **agl-edu**).

## Personas
| Persona | Goal | What they use most |
|---|---|---|
| Absolute beginner | Understand the basics, no background | Basics track, mini-quizzes, community Q&A |
| Bagrut student (electrical stream) | Pass Ministry of Education exams | Bagrut track, practice questions, past-exam style quizzes |
| Technician / practical-engineer student | Pass the MAHAT exams | Technician track, machines and power systems, simulators |
| EE degree student | Understand the theory deeply, pass courses | Academic track, calculators, articles |
| Licensing candidate | Pass the electrician licensing exam | Licensing track, regulations, **license-exam simulator** |
| Field electrician | Get quick answers and calculations on site | Tools (mobile), community, regulation updates |
| Designer / engineer | Advanced calculations, niche topics, news | Professional tools, articles, simulators, Blue Grid |

## Pillars
1. **Learn**: tracks, then modules, then lessons (MDX with formulas, interactive calculators and mini-quizzes).
2. **Practice**: question bank, quizzes, timed practice exams, and the licensing simulator as a separate product.
3. **Simulate**: 3D and interactive simulators, linked or embedded from their standalone apps.
4. **Calculate**: calculators powered by the shared `@electricademy/calc` engine.
5. **Community**: Q&A by topic, threads linked to lessons, reputation (XP) and moderation.
6. **Stay current**: articles, news and innovations in power systems, regulations and installations (with RSS).

## Free vs. Pro (Freemium)
The single source of truth is `FEATURE_RULES` in `packages/auth/src/features.ts`.

| Feature | Anonymous | Free (signed in) | Pro | Separate purchase |
|---|---|---|---|---|
| Basics, Bagrut and Licensing tracks | ✓ | ✓ | ✓ | |
| Technician, Academic and Professionals tracks | | | ✓ | |
| Articles and news | ✓ | ✓ | ✓ | |
| Read community | ✓ | ✓ | ✓ | |
| Post in community, save progress | | ✓ | ✓ | |
| Basic calculators (voltage drop, cable sizing) | ✓ | ✓ | ✓ | |
| Professional calculators (short circuit, …) | | | ✓ | |
| Free simulators | ✓ | ✓ | ✓ | |
| Pro simulators | | | ✓ | |
| Practice exams | | | ✓ | |
| Licensing-exam simulator | | | | ✓ `license_exam` |
| Blue Grid | | | | ✓ `blue_grid` |

Pricing is a placeholder: ₪39 per month or ₪349 per year (see `PRICING` in `packages/auth/src/payments.ts`).

## Product promotion inside the platform
- A `/products` page and the `product` table.
- **Contextual banners**: lesson frontmatter `promote: ["blue-grid"]` renders a product card at the end of the lesson.
- A `/license-exam` landing page with a **waitlist** to validate demand before launch.
- Home-page hero cards.

## KPIs
- **Acquisition:** weekly sign-ups, and the share of organic search traffic.
- **Activation:** percentage of sign-ups who complete their first lesson within 7 days.
- **Engagement:** weekly active learners, lessons completed per week, community posts and replies.
- **Monetization:** conversion from free to Pro, waitlist-to-buyer conversion for license-exam, and churn.
- **Quality:** share of questions with an accepted answer, and time to first reply.

## Principles
- Hebrew and RTL first. Formulas are always LTR. The site is mobile first.
- **Safety:** content is educational. Regulatory values must reference the current official text, and every calculator says so.
- Accurate, transparent calculations: every formula is shown, and the calc engine is unit-tested.
