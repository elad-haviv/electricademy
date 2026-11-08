import { describe, expect, it } from "vitest";
import { plainText, richHtml } from "./richText";

describe("plainText", () => {
  it("turns LaTeX into readable text", () => {
    expect(plainText("$15.16\\,\\text{kA}$")).toBe("15.16 kA");
    expect(plainText("$I_n=250\\,[\\text{A}]$")).toBe("I_n=250 [A]");
    expect(plainText("$\\dfrac{33k}{\\sqrt{3}}$")).toBe("(33k)/(√(3))");
    expect(plainText("$I_b \\le I_n \\le I_z$")).toBe("I_b ≤ I_n ≤ I_z");
    expect(plainText("$3\\times 240\\,\\text{mm}^2$")).toBe("3× 240 mm²");
    expect(plainText("$U_k=6\\%$")).toBe("U_k=6%");
    expect(plainText("$40^\\circ\\text{C}$")).toBe("40°C");
    expect(plainText("$\\cos\\varphi=0.8$")).toBe("cosφ=0.8");
  });
  it("leaves plain Hebrew alone", () => {
    expect(plainText("מותר רק בתנאי שהמתקן כולו ממוקם במבנה אחד.")).toBe("מותר רק בתנאי שהמתקן כולו ממוקם במבנה אחד.");
  });
});

describe("richHtml", () => {
  it("renders math and escapes text", () => {
    const html = richHtml("זרם <b> של $I=5\\,\\text{A}$");
    expect(html).toContain("&lt;b&gt;");
    expect(html).toContain('class="katex"');
    expect(html).toContain('dir="ltr"');
  });
  it("renders pipe tables", () => {
    expect(richHtml("| a | b |\n|---|---|\n| 1 | 2 |")).toContain("<th>a</th>");
  });
});
