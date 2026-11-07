"use client";

import { useMemo, useState } from "react";
import {
  INSTALLATION_METHODS,
  methodInfo,
  referenceTemperature,
  sizeCable,
  TABULATED_TEMPERATURES,
  type InstallationMethod,
} from "@electricademy/calc";
import { Card } from "@electricademy/ui";
import { fmt, NumberField, ResultBox, SelectField } from "./Field";

const GROUP_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20].map((n) => ({
  value: n,
  label: n === 1 ? "מעגל יחיד" : `${n} מעגלים`,
}));

export function CableSizingCalculator() {
  const [method, setMethod] = useState<InstallationMethod>("C");
  const [phases, setPhases] = useState<1 | 3>(3);
  const [current, setCurrent] = useState(32);
  const [length, setLength] = useState(40);
  const [pf, setPf] = useState(0.9);
  const [maxDrop, setMaxDrop] = useState(3);
  const [temperature, setTemperature] = useState(30);
  const [circuits, setCircuits] = useState(1);

  const info = methodInfo(method);
  const buried = info.medium === "ground";
  const voltage = phases === 3 ? 400 : 230;

  const changeMethod = (m: InstallationMethod) => {
    // Air and ground use different reference temperatures; reset when the medium changes.
    if (methodInfo(m).medium !== info.medium) setTemperature(referenceTemperature(m));
    setMethod(m);
  };

  const result = useMemo(() => {
    try {
      return sizeCable({
        phases, voltage, current, length, powerFactor: pf, maxDropPercent: maxDrop,
        method, ambientTemperature: temperature, groupedCircuits: circuits,
      });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [phases, voltage, current, length, pf, maxDrop, method, temperature, circuits]);

  return (
    <Card>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <SelectField
            label="שיטת התקנה"
            value={method}
            options={INSTALLATION_METHODS.map((m) => ({ value: m.method, label: m.label }))}
            onChange={changeMethod}
          />
          <p className="mt-1 text-xs text-slate-500">{info.description}</p>
        </div>
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
        <SelectField
          label={buried ? "טמפרטורת הקרקע" : "טמפרטורת הסביבה"}
          value={temperature}
          options={TABULATED_TEMPERATURES.map((t) => ({ value: t, label: `${t}°C` }))}
          onChange={setTemperature}
        />
        <SelectField label="מעגלים מקובצים יחד" value={circuits} options={GROUP_OPTIONS} onChange={setCircuits} />
      </div>
      {result === null ? (
        <ResultBox tone="error">אין חתך עד 240 ממ״ר שעומד בתנאים. שקלו כבלים מקבילים, שיטת התקנה אחרת או קיצור הקו.</ResultBox>
      ) : "error" in result ? (
        <ResultBox tone="error">יש לבדוק את הנתונים: {result.error}</ResultBox>
      ) : (
        <ResultBox>
          <p className="text-lg">
            חתך מומלץ: <strong dir="ltr">{result.section} mm²</strong> (נחושת, בידוד PVC)
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {result.governedBy === "ampacity" ? "החתך נקבע לפי הזרם המותר" : "החתך הוגדל בגלל מפל המתח"} · מפל מתח:{" "}
            {fmt(result.dropPercent)}%
          </p>
          <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600 dark:text-slate-400">זרם מותר מהטבלה (שיטה {method})</dt>
              <dd dir="ltr">{fmt(result.tableAmpacity, 1)} A</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600 dark:text-slate-400">מקדם טמפרטורה</dt>
              <dd dir="ltr">{fmt(result.factors.temperature)}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-600 dark:text-slate-400">מקדם קיבוץ</dt>
              <dd dir="ltr">{fmt(result.factors.grouping)}</dd>
            </div>
            <div className="flex justify-between gap-2 font-semibold">
              <dt>זרם מותר אחרי תיקון</dt>
              <dd dir="ltr">{fmt(result.ampacity, 1)} A</dd>
            </div>
          </dl>
        </ResultBox>
      )}
      <p className="mt-3 text-xs text-slate-500">
        ערכי הייחוס לקוחים מ־IEC 60364-5-52 (נספח B): נחושת עם בידוד PVC, טמפרטורת ייחוס 30°C באוויר או 20°C בקרקע
        (התנגדות תרמית 2.5 K·m/W). מקדמי הקיבוץ הם למעגלים צמודים. הכלי מיועד ללימוד. בתכנון בפועל יש לפעול לפי התקנות
        והתקנים התקפים בישראל.
      </p>
    </Card>
  );
}
