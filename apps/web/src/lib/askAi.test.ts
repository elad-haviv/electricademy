import { describe, expect, it } from "vitest";
import { questionContext } from "./askAi";

describe("questionContext", () => {
  it("attaches the text of the regulation sections our key cites", () => {
    const ctx = questionContext(2)!;
    expect(ctx.key?.answer).toBeGreaterThan(0);
    expect(ctx.sections.length).toBeGreaterThan(0);
    expect(ctx.sections[0]!.title).toContain("הארקות");
    expect(ctx.sections[0]!.text.length).toBeGreaterThan(50);
  });
  it("returns null for a question that does not exist", () => {
    expect(questionContext(999999)).toBeNull();
  });
});
