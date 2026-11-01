"use client";

import { useMemo, useState } from "react";
import { transformerShortCircuit } from "@electricademy/calc";
import { Card } from "@electricademy/ui";
import { fmt, NumberField, ResultBox } from "./Field";

export function ShortCircuitCalculator() {
  const [kva, setKva] = useState(1000);
  const [voltage, setVoltage] = useState(400);
  const [uk, setUk] = useState(6);

  const result = useMemo(() => {
    try {
      return { isc: transformerShortCircuit(kva, voltage, uk) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [kva, voltage, uk]);

  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-3">
        <NumberField label="הספק השנאי" unit="kVA" value={kva} onChange={setKva} />
        <NumberField label="מתח שלוב במשני" unit="V" value={voltage} onChange={setVoltage} />
        <NumberField label="מתח קצר uk" unit="%" value={uk} onChange={setUk} step={0.1} />
      </div>
      {"error" in result ? (
        <ResultBox tone="error">יש לבדוק את הנתונים: {result.error}</ResultBox>
      ) : (
        <ResultBox>
          <p className="text-lg">
            זרם קצר תלת־פאזי בהדקי השנאי: <strong dir="ltr">{fmt(result.isc / 1000)} kA</strong>
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            בהנחת רשת אינסופית לפני השנאי, ללא העכבה של רשת ההזנה. זהו ערך עליון לבדיקת כושר ניתוק.
          </p>
        </ResultBox>
      )}
    </Card>
  );
}
