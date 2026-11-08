import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { classifyQuestion, EXAM_LEVELS, loadExamBank, questionsForLevel, sample, searchKey } from "./licenseExam";
import { contentRoot } from "./files";

const bank = loadExamBank();
const imageDir = path.join(contentRoot(), "..", "apps", "web", "public", "images", "license-exam");

describe("license-exam bank", () => {
  it("has sequential question numbers and a version", () => {
    expect(bank.meta.version).toMatch(/^\d+\.\d+$/);
    expect(bank.questions.length).toBe(bank.meta.count);
    bank.questions.forEach((q, i) => expect(q.n).toBe(i + 1));
  });

  it("gives every question a stem and four non-empty options", () => {
    for (const q of bank.questions) {
      expect(q.stem.length + q.figures.length, `q${q.n}`).toBeGreaterThan(0);
      expect(q.options, `q${q.n}`).toHaveLength(4);
      for (const o of q.options) expect(o.text.length + o.figures.length, `q${q.n}`).toBeGreaterThan(0);
    }
  });

  it("ships every figure it references", () => {
    for (const q of bank.questions)
      for (const f of [...q.figures, ...q.options.flatMap((o) => o.figures)])
        expect(fs.existsSync(path.join(imageDir, f.src)), f.src).toBe(true);
  });

  it("nests the licence levels", () => {
    const t = questionsForLevel(bank, "technician").length;
    const p = questionsForLevel(bank, "practical-engineer").length;
    const e = questionsForLevel(bank, "engineer").length;
    expect(t).toBeGreaterThan(50);
    expect(t).toBeLessThan(p);
    expect(p).toBeLessThan(e);
    expect(e).toBe(bank.questions.length);
    expect(Object.keys(EXAM_LEVELS)).toHaveLength(3);
  });

  it("keeps the answer key in step with the bank", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(contentRoot(), "license-exam", "answers.json"), "utf8")) as {
      answers: Record<string, { serial: string | null }>;
    };
    const stale = Object.entries(raw.answers).filter(([n, a]) => bank.byNumber.get(Number(n))?.serial !== a.serial);
    expect(stale.map(([n]) => n)).toEqual([]);
    expect(bank.answers.size).toBe(Object.keys(raw.answers).length);
  });
});

describe("license-exam overrides", () => {
  it("apply only where they still match the bank", () => {
    const raw = JSON.parse(fs.readFileSync(path.join(contentRoot(), "license-exam", "overrides.json"), "utf8")) as {
      overrides: Record<string, { serial: string | null; options: unknown[] }>;
    };
    for (const [n, o] of Object.entries(raw.overrides)) {
      const q = bank.byNumber.get(Number(n));
      expect(q?.serial, `override ${n}`).toBe(o.serial);
      expect(q?.options.length, `override ${n}`).toBe(o.options.length);
    }
  });
});

describe("license-exam helpers", () => {
  it("classifies by keywords", () => {
    expect(classifyQuestion({ stem: ["מה שיטת ההגנה בפני חישמול בהזנת גנרטור? איפוס TN-C-S"], options: [] })).toBe("earthing");
    expect(classifyQuestion({ stem: ["מהו זרם הקצר של שנאי 630kVA במתח גבוה?"], options: [] })).toBe("transformers-hv");
    expect(classifyQuestion({ stem: ["משהו אחר לגמרי"], options: [] })).toBe("general");
  });

  it("samples distinct items", () => {
    const items = Array.from({ length: 100 }, (_, i) => i);
    const picked = sample(items, 50);
    expect(new Set(picked).size).toBe(50);
    expect(sample(items, 500)).toHaveLength(100);
  });

  it("normalises search text", () => {
    expect(searchKey('פה"פ  (TN-C-S)?')).toBe("פהפ tn-c-s");
  });
});
