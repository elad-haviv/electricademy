"use client";

import { useMemo, useState } from "react";
import { sizeCable } from "@electricademy/calc";
import { Card } from "@electricademy/ui";
import { fmt, NumberField, ResultBox, SelectField } from "./Field";

export function CableSizingCalculator() {
  const [phases, setPhases] = useState<1 | 3>(3);
  const [current, setCurrent] = useState(32);
  const [length, setLength] = useState(40);
  const [pf, setPf] = useState(0.9);
  const [maxDrop, setMaxDrop] = useState(3);
  const [derating, setDerating] = useState(1);

  const voltage = phases === 3 ? 400 : 230;
  const result = useMemo(() => {
    try {
      return sizeCable({ phases, voltage, current, length, powerFactor: pf, maxDropPercent: maxDrop, deratingFactor: derating });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [phases, voltage, current, length, pf, maxDrop, derating]);

  return (
    <Card>
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
        <NumberField label="זרם עומס" unit="A" value={current} onChange={setCurrent} />
        <NumberField label="אורך" unit="m" value={length} onChange={setLength} />
        <NumberField label="מקדם הספק (cos φ)" value={pf} onChange={setPf} step={0.01} />
        <NumberField label="מפל מתח מרבי" unit="%" value={maxDrop} onChange={setMaxDrop} step={0.5} />
        <NumberField label="מקדם תיקון (טמפ׳/קיבוץ)" value={derating} onChange={setDerating} step={0.05} />
      </div>
      {result === null ? (
        <ResultBox tone="error">אין חתך עד 240 ממ״ר שעומד בתנאים. שקלו כבלים מקבילים או קיצור הקו.</ResultBox>
      ) : "error" in result ? (
        <ResultBox tone="error">יש לבדוק את הנתונים: {result.error}</ResultBox>
      ) : (
        <ResultBox>
          <p className="text-lg">
            חתך מומלץ: <strong dir="ltr">{result.section} mm²</strong> (נחושת)
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            זרם מותר אחרי תיקון: {fmt(result.ampacity, 1)}A · מפל מתח: {fmt(result.dropPercent)}% ·{" "}
            {result.governedBy === "ampacity" ? "החתך נקבע לפי הזרם המותר" : "החתך הוגדל בגלל מפל המתח"}
          </p>
        </ResultBox>
      )}
      <p className="mt-3 text-xs text-slate-500">
        ערכי הייחוס לקוחים מ־IEC 60364-5-52, נחושת עם בידוד PVC, שיטת התקנה C וטמפרטורת סביבה של 30°C. הכלי מיועד ללימוד. בתכנון בפועל יש לפעול לפי התקנות והתקנים התקפים בישראל.
      </p>
    </Card>
  );
}
