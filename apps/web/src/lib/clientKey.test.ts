import { describe, expect, it } from "vitest";
import { clientKey } from "./clientKey";

const base = { answer: 2 as const, serial: "1" };

describe("clientKey calculation lines", () => {
  it("splits plain steps on newlines and on '; ' between steps", () => {
    const k = clientKey({ ...base, calculation: "In = S/U = 909 A; Ik = In/Uk = 15.16 kA" });
    expect(k.html.calculation).toHaveLength(2);
  });
  it("never splits on a '; ' inside a formula", () => {
    const k = clientKey({ ...base, calculation: "$I_n=250\\,[\\text{A}];\\ S=240$\n$I_k = 15\\,\\text{kA}$" });
    expect(k.html.calculation).toHaveLength(2);
    expect(k.html.calculation![0]).toContain("katex");
  });
  it("renders math in the explanation and leaves the serial out", () => {
    const k = clientKey({ ...base, explanation: "מתקבל $15.16\\,\\text{kA}$." });
    expect(k.html.explanation).toContain('class="katex"');
    expect("serial" in k).toBe(false);
  });
});
