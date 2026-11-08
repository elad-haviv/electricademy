#!/usr/bin/env node
/**
 * Accessibility check: runs axe-core (WCAG 2.0 / 2.1, levels A and AA) on the site's key routes and states,
 * on mobile and desktop, in light and dark mode. Exits with 1 when any violation is found.
 *
 *   pnpm --filter @electricademy/web test:a11y                 # against http://localhost:3000
 *   A11Y_BASE_URL=http://localhost:3103 pnpm --filter @electricademy/web test:a11y
 *   ... test:a11y -- --only=license-exam --variants=mobile-dark --json=out.json --verbose
 *
 * Needs a running site with a seeded database. The signed-in routes (dashboard, licence exam) use the
 * dev login, so start the server with AUTH_DEV_LOGIN=true; without it they are skipped with a warning.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium, devices } from "playwright";

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve("axe-core/axe.min.js"), "utf8");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const BASE = (process.env.A11Y_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
/** Best-practice rules that back up manual checks of headings and landmarks (1.3.1, 2.4.1, 2.4.6). */
const EXTRA_RULES = ["page-has-heading-one", "landmark-one-main", "landmark-unique", "heading-order", "region", "landmark-no-duplicate-banner", "landmark-no-duplicate-contentinfo"];
const VARIANTS = {
  "mobile-light": { ...devices["iPhone 13"], colorScheme: "light" },
  "mobile-dark": { ...devices["iPhone 13"], colorScheme: "dark" },
  "desktop-light": { viewport: { width: 1440, height: 900 }, colorScheme: "light" },
  "desktop-dark": { viewport: { width: 1440, height: 900 }, colorScheme: "dark" },
};
const variantNames = typeof args.variants === "string" ? args.variants.split(",") : Object.keys(VARIANTS);

/** Public pages: [name, path]. */
const PAGES = [
  ["home", "/"],
  ["tracks", "/tracks"],
  ["track", "/tracks/basics"],
  ["lesson", "/tracks/basics/circuits/ohms-law"],
  ["simulators", "/simulators"],
  ["simulator", "/simulators/hv-edu"],
  ["tools", "/tools"],
  ["tool-cable", "/tools/cable-selection"],
  ["tool-voltage-drop", "/tools/voltage-drop"],
  ["tool-short-circuit", "/tools/transformer-short-circuit"],
  ["law", "/law"],
  ["law-doc", "/law/electricity-law"],
  ["articles", "/articles"],
  ["article", "/articles/why-power-factor-matters"],
  ["community", "/community"],
  ["community-thread", "/community/1"],
  ["login", "/login"],
  ["pricing", "/pricing"],
  ["products", "/products"],
  ["accessibility", "/accessibility"],
  ["license-exam", "/license-exam"],
  ["not-found", "/no-such-page"],
];

/** Signed-in pages and interactive states. Each step returns the states to audit. */
const FLOWS = [
  ["dashboard", async (page, audit) => {
    await open(page, "/dashboard");
    await audit("dashboard");
  }],
  ["license-exam", async (page, audit, mobile) => {
    await open(page, "/license-exam/exam");
    await audit("exam-setup");
    await page.getByRole("button", { name: "התחלת בחינה" }).click();
    await page.getByText(/שאלה 1 מתוך/).waitFor();
    await page.getByRole("list", { name: "תשובות" }).getByRole("button").first().click();
    await audit("exam-running");
    if (mobile) {
      await page.getByRole("button", { name: /סקירה/ }).click();
      await page.getByRole("dialog").waitFor();
      await audit("exam-overview-sheet");
      await page.getByRole("dialog").getByRole("button", { name: "הגשת הבחינה" }).click();
    } else {
      await page.getByRole("complementary").getByRole("button", { name: "הגשת הבחינה" }).click();
    }
    await page.getByRole("dialog", { name: "להגיש את הבחינה?" }).waitFor();
    await audit("exam-submit-dialog");
    await page.getByRole("button", { name: "הגשה סופית" }).click();
    await page.getByRole("button", { name: "בחינה חדשה" }).waitFor({ timeout: 30_000 });
    await audit("exam-results");

    await open(page, "/license-exam/practice");
    await audit("practice-setup");
    await page.getByRole("button", { name: "התחלת תרגול" }).click();
    await page.getByRole("list", { name: "תשובות" }).waitFor();
    await audit("practice-question");
    await page.getByRole("list", { name: "תשובות" }).getByRole("button").first().click();
    await audit("practice-answered");

    await open(page, "/license-exam/browse");
    await audit("browse");
    await open(page, "/license-exam/q/12");
    await audit("question-page");
  }],
];

async function open(page, path) {
  const res = await page.goto(BASE + path, { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  return res;
}

async function runAxe(page) {
  if (!(await page.evaluate(() => "axe" in window))) await page.addScriptTag({ content: axeSource });
  return page.evaluate(
    ([tags, extra]) =>
      // the Next.js dev overlay is not part of the site
      window.axe.run({ exclude: [["nextjs-portal"]] }, { runOnly: { type: "tag", values: tags }, rules: Object.fromEntries(extra.map((r) => [r, { enabled: true }])), resultTypes: ["violations"] }),
    [TAGS, EXTRA_RULES],
  );
}

async function signIn(page) {
  await open(page, "/login");
  const form = page.locator("form", { has: page.locator('input[name="provider"][value="dev"]') });
  if (!(await form.count())) return false;
  await form.locator('input[type="email"]').fill("a11y@example.com");
  await Promise.all([page.waitForURL((u) => !u.pathname.startsWith("/login")), form.getByRole("button").click()]);
  return true;
}

const only = typeof args.only === "string" ? args.only.split(",") : null;
const want = (name) => !only || only.some((o) => name.startsWith(o));

const results = []; // { variant, name, violations: [{ id, impact, nodes: [targets] }] }
const browser = await chromium.launch();
let failed = false;
try {
  for (const variant of variantNames) {
    const mobile = variant.startsWith("mobile");
    const context = await browser.newContext({ ...VARIANTS[variant], locale: "he-IL" });
    const page = await context.newPage();
    const audit = async (name) => {
      await page.waitForTimeout(400); // let CSS transitions settle, or axe measures colours mid-fade
      const { violations } = await runAxe(page);
      const v = violations.map((x) => ({ id: x.id, impact: x.impact, help: x.help, nodes: x.nodes.map((n) => ({ target: n.target.join(" "), summary: n.failureSummary })) }));
      results.push({ variant, name, violations: v });
      if (v.length) failed = true;
      const count = v.reduce((s, x) => s + x.nodes.length, 0);
      console.log(`${v.length ? "✗" : "✓"} ${variant.padEnd(13)} ${name.padEnd(22)} ${v.length ? `${v.length} rules, ${count} nodes: ${v.map((x) => x.id).join(", ")}` : "ok"}`);
      if (args.verbose) for (const x of v) for (const n of x.nodes.slice(0, 5)) console.log(`    ${x.id}: ${n.target}\n      ${n.summary?.split("\n").slice(0, 3).join(" | ")}`);
    };
    for (const [name, path] of PAGES) {
      if (!want(name)) continue;
      await open(page, path);
      await audit(name);
    }
    if (FLOWS.some(([n]) => want(n))) {
      if (await signIn(page)) {
        for (const [name, flow] of FLOWS) {
          if (!want(name)) continue;
          try {
            await flow(page, audit, mobile);
          } catch (e) {
            failed = true;
            console.log(`✗ ${variant.padEnd(13)} ${name.padEnd(22)} flow error: ${e.message.split("\n")[0]}`);
          }
        }
      } else console.warn(`! ${variant}: dev login is off (AUTH_DEV_LOGIN), signed-in routes skipped`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (typeof args.json === "string") writeFileSync(args.json, JSON.stringify(results, null, 2));
const total = results.reduce((s, r) => s + r.violations.length, 0);
console.log(`\n${results.length} checks, ${total} rule violations`);
process.exit(failed ? 1 : 0);
