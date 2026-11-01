"use client";

import { useMemo, useState } from "react";
import { STANDARD_SECTIONS_MM2, voltageDrop, type ConductorMaterial } from "@electricademy/calc";
import { Card } from "@electricademy/ui";
import { fmt, NumberField, ResultBox, SelectField } from "./Field";

export function VoltageDropCalculator({ compact = false }: { compact?: boolean }) {
  const [phases, setPhases] = useState<1 | 3>(1);
  const [current, setCurrent] = useState(16);
  const [length, setLength] = useState(30);
  const [section, setSection] = useState<number>(2.5);
  const [material, setMaterial] = useState<ConductorMaterial>("copper");
  const [pf, setPf] = useState(1);
  const [limit, setLimit] = useState(3);

  const voltage = phases === 3 ? 400 : 230;
  const result = useMemo(() => {
    try {
      return voltageDrop({ phases, voltage, current, length, section, material, powerFactor: pf });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [phases, voltage, current, length, section, material, pf]);

  return (
    <Card className={compact ? "my-8" : undefined}>
      {compact && <p className="mb-4 font-semibold">🧮 מחשבון מפל מתח</p>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SelectField
          label="סוג מעגל"
          value={phases}
          options={[
            { value: 1, label: "חד־פאזי (230V)" },
            { value: 3, label: "תלת־פאזי (400V)" },
          ]}
          onChange={setPhases}
        />
        <NumberField label="זרם" unit="A" value={current} onChange={setCurrent} />
        <NumberField label="אורך הכבל (בכיוון אחד)" unit="m" value={length} onChange={setLength} />
        <SelectField
          label="חתך"
          value={section}
          options={STANDARD_SECTIONS_MM2.map((s) => ({ value: s as number, label: `${s} ממ״ר` }))}
          onChange={setSection}
        />
        {!compact && (
          <>
            <SelectField
              label="חומר המוליך"
              value={material}
              options={[
                { value: "copper", label: "נחושת" },
                { value: "aluminium", label: "אלומיניום" },
              ]}
              onChange={setMaterial}
            />
            <NumberField label="מקדם הספק (cos φ)" value={pf} onChange={setPf} step={0.01} />
            <NumberField label="מפל מותר לתכנון" unit="%" value={limit} onChange={setLimit} step={0.5} />
          </>
        )}
      </div>
      {"error" in result ? (
        <ResultBox tone="error">יש לבדוק את הנתונים: {result.error}</ResultBox>
      ) : (
        <ResultBox tone={result.percent > limit ? "warn" : "ok"}>
          <p className="text-lg">
            מפל מתח: <strong dir="ltr">{fmt(result.volts)} V</strong> ·{" "}
            <strong dir="ltr">{fmt(result.percent)}%</strong>
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {result.percent > limit
              ? `חורג מהגבול שהוגדר (${fmt(limit, 1)}%). כדאי לשקול חתך גדול יותר או כבל קצר יותר.`
              : `בתוך הגבול שהוגדר (${fmt(limit, 1)}%).`}{" "}
            החישוב נעשה בטמפרטורת מוליך של 70°C, עם היגב של 0.08Ω/km.
          </p>
        </ResultBox>
      )}
    </Card>
  );
}
