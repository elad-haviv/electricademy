import { describe, expect, it } from "vitest";
import {
  currentFromPower,
  faultLoopCurrent,
  ohmsLaw,
  power,
  resistivityAt,
  sizeCable,
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
