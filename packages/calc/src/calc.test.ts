import { describe, expect, it } from "vitest";
import {
  currentFromPower,
  faultLoopCurrent,
  ohmsLaw,
  power,
  resistivityAt,
  sizeCable,
  sizeCableIL,
  ilGroupingFactor,
  ilTemperatureFactor,
  IL_AMPACITY,
  selectProtection,
  trippingFactor,
  IL_INSTALLATION_METHODS,
  temperatureFactor,
  groupingFactor,
  transformerShortCircuit,
  voltageDrop,
} from "./index";

describe("ohmsLaw", () => {
  it("solves each unknown", () => {
    expect(ohmsLaw({ current: 2, resistance: 115 }).voltage).toBe(230);
    expect(ohmsLaw({ voltage: 230, resistance: 46 }).current).toBe(5);
    expect(ohmsLaw({ voltage: 12, current: 4 }).resistance).toBe(3);
  });
  it("requires exactly two values", () => {
    expect(() => ohmsLaw({ voltage: 1 })).toThrow();
    expect(() => ohmsLaw({ voltage: 1, current: 1, resistance: 1 })).toThrow();
  });
});

describe("power", () => {
  it("single-phase", () => {
    const p = power({ voltage: 230, current: 10, powerFactor: 0.8, phases: 1 });
    expect(p.apparent).toBeCloseTo(2300);
    expect(p.active).toBeCloseTo(1840);
    expect(p.reactive).toBeCloseTo(1380);
  });
  it("three-phase", () => {
    // √3 · 400 · 10 = 6928.2 VA
    const p = power({ voltage: 400, current: 10, phases: 3 });
    expect(p.apparent).toBeCloseTo(6928.2, 1);
    expect(p.reactive).toBeCloseTo(0);
  });
  it("current from power round-trips", () => {
    expect(currentFromPower({ activePower: 1840, voltage: 230, powerFactor: 0.8, phases: 1 })).toBeCloseTo(10);
    // 11 kW, 400 V, pf 0.85 → 18.68 A
    expect(currentFromPower({ activePower: 11000, voltage: 400, powerFactor: 0.85, phases: 3 })).toBeCloseTo(18.68, 2);
  });
});

describe("voltageDrop", () => {
  it("corrects resistivity for temperature", () => {
    expect(resistivityAt("copper", 20)).toBeCloseTo(0.0175);
    // 0.0175 · (1 + 0.00393·50) = 0.020939
    expect(resistivityAt("copper", 70)).toBeCloseTo(0.020939, 5);
  });

  it("single-phase resistive load at 20°C", () => {
    // ΔU = 2 · 16 A · 30 m · 0.0175 / 2.5 = 6.72 V → 2.92 % of 230 V
    const d = voltageDrop({ phases: 1, voltage: 230, current: 16, length: 30, section: 2.5, conductorTemperature: 20 });
    expect(d.volts).toBeCloseTo(6.72, 2);
    expect(d.percent).toBeCloseTo(2.922, 2);
  });

  it("three-phase with power factor and reactance", () => {
    // R = 0.0175/10 = 0.00175 Ω/m, X = 0.00008 Ω/m, cos 0.8, sin 0.6
    // ΔU = √3 · 32 · 100 · (0.00175·0.8 + 0.00008·0.6) = √3 · 3200 · 0.001448 = 8.026 V
    const d = voltageDrop({
      phases: 3, voltage: 400, current: 32, length: 100, section: 10,
      powerFactor: 0.8, conductorTemperature: 20,
    });
    expect(d.volts).toBeCloseTo(8.026, 2);
    expect(d.percent).toBeCloseTo(2.006, 2);
  });
});

describe("sizeCable", () => {
  it("picks the ampacity-governed section for short runs", () => {
    const r = sizeCable({ phases: 1, voltage: 230, current: 20, length: 10, maxDropPercent: 3 });
    expect(r?.section).toBe(2.5);
    expect(r?.governedBy).toBe("ampacity");
  });

  it("upsizes for voltage drop on long runs", () => {
    const r = sizeCable({ phases: 1, voltage: 230, current: 20, length: 60, maxDropPercent: 3 });
    // 2.5 → ~8.7 %, 4 → ~5.5 %, 6 → ~3.6 %, 10 → ~2.2 %
    expect(r?.section).toBe(10);
    expect(r?.governedBy).toBe("voltageDrop");
  });

  it("applies derating", () => {
    const r = sizeCable({ phases: 3, voltage: 400, current: 30, length: 5, maxDropPercent: 5, deratingFactor: 0.7 });
    // 32·0.7 = 22.4 < 30; 41·0.7 = 28.7 < 30; 57·0.7 = 39.9 ≥ 30 → 10 mm²
    expect(r?.section).toBe(10);
  });

  it("uses the installation method table", () => {
    // 3 loaded, 38 A: method C → 6 mm² (41 A); A1 → 10 mm² (42 A, since 6 mm² is only 31 A)
    expect(sizeCable({ phases: 3, voltage: 400, current: 38, length: 5, maxDropPercent: 5, method: "C" })?.section).toBe(6);
    expect(sizeCable({ phases: 3, voltage: 400, current: 38, length: 5, maxDropPercent: 5, method: "A1" })?.section).toBe(10);
  });

  it("applies temperature and grouping factors", () => {
    const r = sizeCable({ phases: 3, voltage: 400, current: 30, length: 5, maxDropPercent: 5, ambientTemperature: 40, groupedCircuits: 3 });
    // 0.87 · 0.70 = 0.609; 6 mm²: 41·0.609 = 25 < 30; 10 mm²: 57·0.609 = 34.7 ≥ 30
    expect(r?.factors.total).toBeCloseTo(0.609, 3);
    expect(r?.section).toBe(10);
  });

  it("uses ground reference temperature for buried cables", () => {
    expect(temperatureFactor("D1", 20)).toBe(1);
    expect(temperatureFactor("C", 20)).toBe(1.12);
    expect(temperatureFactor("C", 33)).toBe(0.94);
    expect(groupingFactor(10)).toBe(0.45);
  });

  it("returns null when nothing fits", () => {
    expect(sizeCable({ phases: 3, voltage: 400, current: 1000, length: 10, maxDropPercent: 3 })).toBeNull();
  });
});

describe("fault currents", () => {
  it("transformer secondary short circuit", () => {
    // 1000 kVA, 400 V, 6 % → 1e6 / (√3·400·0.06) = 24 056 A
    expect(transformerShortCircuit(1000, 400, 6)).toBeCloseTo(24056, 0);
  });
  it("TN earth-fault loop", () => {
    expect(faultLoopCurrent(230, 0.5)).toBe(460);
  });
});

describe("sizeCableIL (Israeli regulations 2014)", () => {
  it("covers every installation method of the third schedule", () => {
    expect(IL_INSTALLATION_METHODS).toHaveLength(34); // א׳–ל״א incl. (א)/(ב) variants of י״ח, י״ט, כ״ד
    for (const ins of [70, 90] as const)
      for (const rows of Object.values(IL_AMPACITY[ins])) {
        for (let i = 1; i < rows.length; i++) expect(rows[i]![0]).toBeGreaterThan(rows[i - 1]![0]);
        for (const [, one, three, alOne, alThree] of rows) {
          expect(one).toBeGreaterThanOrEqual(three);
          if (alOne !== null) expect(alOne).toBeLessThan(one);
          if (alThree !== null) expect(alThree).toBeLessThan(three);
        }
      }
  });

  it("uses table 70.1 for method א׳ (2.5 mm² single-phase = 18 A)", () => {
    const r = sizeCableIL({ method: "א", phases: 1, voltage: 230, current: 18, length: 5, maxDropPercent: 5 });
    expect(r?.section).toBe(2.5);
    expect(r?.tableAmpacity).toBe(18);
    expect(sizeCableIL({ method: "א", phases: 1, voltage: 230, current: 19, length: 5, maxDropPercent: 5 })?.section).toBe(4);
  });

  it("uses the 90°C table and 35°C reference", () => {
    // 90.3, 6 mm² three-phase = 46 A
    const r = sizeCableIL({ method: "ג", insulation: 90, phases: 3, voltage: 400, current: 45, length: 5, maxDropPercent: 5 });
    expect(r?.section).toBe(6);
    expect(r?.factors.temperature).toBe(1);
  });

  it("applies table 1, 4 and 3 factors", () => {
    expect(ilTemperatureFactor("air", 70, 40)).toBe(0.93);
    expect(ilTemperatureFactor("ground", 90, 20)).toBe(1.08);
    expect(() => ilTemperatureFactor("air", 70, 65)).toThrow();
    expect(ilGroupingFactor({ arrangement: "t4-1", circuits: 3 })).toBe(0.7);
    expect(ilGroupingFactor({ arrangement: "t5", circuits: 3, spacing: 4 })).toBe(0.85);
    expect(() => ilGroupingFactor({ arrangement: "t4-2", circuits: 10 })).toThrow();
    const r = sizeCableIL({ method: "לא", phases: 3, voltage: 400, current: 50, length: 5, maxDropPercent: 5, soilResistivity: 1 });
    expect(r?.factors.extra).toBe(1.18);
    // soil factor does not apply to ל׳
    expect(sizeCableIL({ method: "ל", phases: 3, voltage: 400, current: 50, length: 5, maxDropPercent: 5, soilResistivity: 1 })?.factors.extra).toBe(1);
  });
});

describe("aluminium (Israeli regulations)", () => {
  it("uses the aluminium columns and skips sections without a value", () => {
    // 70.1: aluminium starts at 6 mm² (24 A single-phase); 10 mm² = 34 A
    const r = sizeCableIL({ method: "א", material: "aluminium", phases: 1, voltage: 230, current: 5, length: 5, maxDropPercent: 5 });
    expect(r?.section).toBe(6);
    expect(r?.tableAmpacity).toBe(24);
    expect(sizeCableIL({ method: "א", material: "aluminium", phases: 1, voltage: 230, current: 30, length: 5, maxDropPercent: 5 })?.section).toBe(10);
  });

  it("refuses table 90.5 aluminium, which is erroneous in the published regulations", () => {
    expect(() => sizeCableIL({ method: "יב", insulation: 90, material: "aluminium", phases: 3, voltage: 400, current: 30, length: 5, maxDropPercent: 5 })).toThrow();
    expect(sizeCableIL({ method: "יב", insulation: 70, material: "aluminium", phases: 3, voltage: 400, current: 30, length: 5, maxDropPercent: 5 })?.section).toBe(6);
  });

  it("is refused for IEC (no verified aluminium tables yet)", () => {
    expect(() => sizeCable({ phases: 3, voltage: 400, current: 30, length: 5, maxDropPercent: 5, material: "aluminium" })).toThrow();
  });
});

describe("protective device selection", () => {
  it("uses the regulation 6 I2 factors", () => {
    expect(trippingFactor("fuse", 16, "il")).toBe(1.75);
    expect(trippingFactor("fuse", 32, "il")).toBe(1.6);
    expect(trippingFactor("fuse", 10, "il")).toBeNull();
    expect(trippingFactor("fuse", 10, "iec")).toBe(1.9);
    expect(trippingFactor("mcb", 16, "il")).toBe(1.45);
    expect(trippingFactor("adjustable", 250, "il")).toBe(1.3);
  });

  it("checks In ≤ I'z and I2 ≤ 1.45·I'z", () => {
    expect(selectProtection("mcb", 18, 24, "il")?.ratedCurrent).toBe(20);
    expect(selectProtection("mcb", 33, 39, "il")).toBeNull(); // 40 A > 39 A
    // fuse 25 A: I2 = 43.75 > 1.45·27 = 39.15 although In ≤ I'z
    expect(selectProtection("fuse", 25, 27, "il")).toBeNull();
    expect(selectProtection("adjustable", 33.2, 39, "il")?.ratedCurrent).toBe(34);
  });

  it("upsizes the cable when the breaker does not fit", () => {
    // 70.5 (method י״ב), three-phase copper: 6 mm² = 39 A, 10 mm² = 54 A. Ib = 33 A → MCB 40 A > 39 A.
    const base = { method: "יב", phases: 3 as const, voltage: 400, current: 33, length: 5, maxDropPercent: 5 };
    expect(sizeCableIL(base)?.section).toBe(6);
    const r = sizeCableIL({ ...base, protection: "mcb" });
    expect(r?.section).toBe(10);
    expect(r?.governedBy).toBe("protection");
    expect(r?.protection?.ratedCurrent).toBe(40);
    expect(sizeCableIL({ ...base, protection: "adjustable" })?.section).toBe(6);
  });

  it("rejects loads above the largest MCB", () => {
    expect(() => sizeCableIL({ method: "יב", phases: 3, voltage: 400, current: 200, length: 5, maxDropPercent: 5, protection: "mcb" })).toThrow();
  });
});
