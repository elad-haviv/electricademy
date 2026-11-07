"use client";

import { useMemo, useState } from "react";
import {
  IL_GROUPING_ARRANGEMENTS,
  IL_INSTALLATION_METHODS,
  IL_SOIL_RESISTIVITY_FACTORS,
  ilMethod,
  ilReferenceTemperature,
  ilTabulatedTemperatures,
  INSTALLATION_METHODS,
  methodInfo,
  referenceTemperature,
  sizeCable,
  sizeCableIL,
  TABULATED_TEMPERATURES,
  type CableSizingResult,
  type IlInsulation,
  type InstallationMethod,
} from "@electricademy/calc";
import { Card, cn } from "@electricademy/ui";
import { fmt, NumberField, ResultBox, SelectField } from "./Field";

type Source = "il" | "iec";

const IEC_GROUP_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 16, 20].map((n) => ({
  value: n,
  label: n === 1 ? "מעגל יחיד" : `${n} מעגלים`,
}));

const SINGLE = "single";

export function CableSizingCalculator() {
  const [source, setSource] = useState<Source>("il");
  const [phases, setPhases] = useState<1 | 3>(3);
  const [current, setCurrent] = useState(32);
  const [length, setLength] = useState(40);
  const [pf, setPf] = useState(0.9);
  const [maxDrop, setMaxDrop] = useState(3);

  // IEC 60364-5-52
  const [iecMethod, setIecMethod] = useState<InstallationMethod>("C");
  const [iecTemp, setIecTemp] = useState(30);
  const [iecCircuits, setIecCircuits] = useState(1);

  // Israeli regulations
  const [ilMethodId, setIlMethodId] = useState("יב");
  const [insulation, setInsulation] = useState<IlInsulation>(70);
  const [ilTemp, setIlTemp] = useState(35);
  const [arrangement, setArrangement] = useState(SINGLE);
  const [ilCircuits, setIlCircuits] = useState(2);
  const [spacing, setSpacing] = useState(0);
  const [soil, setSoil] = useState(2.5);

  const iecInfo = methodInfo(iecMethod);
  const ilInfo = ilMethod(ilMethodId);
  const ilArrangements = IL_GROUPING_ARRANGEMENTS.filter((a) => a.kind === ilInfo.grouping);
  const arr = ilArrangements.find((a) => a.id === arrangement);
  const voltage = phases === 3 ? 400 : 230;

  const changeIecMethod = (m: InstallationMethod) => {
    // Air and ground use different reference temperatures; reset when the medium changes.
    if (methodInfo(m).medium !== iecInfo.medium) setIecTemp(referenceTemperature(m));
    setIecMethod(m);
  };
  const changeIlMethod = (id: string) => {
    const next = ilMethod(id);
    if (next.medium !== ilInfo.medium) setIlTemp(ilReferenceTemperature(next.medium));
    if (next.grouping !== ilInfo.grouping) setArrangement(SINGLE);
    setIlMethodId(id);
  };
  const changeInsulation = (ins: IlInsulation) => {
    if (!ilTabulatedTemperatures(ins).includes(ilTemp)) setIlTemp(ilReferenceTemperature(ilInfo.medium));
    setInsulation(ins);
  };
  const changeArrangement = (id: string) => {
    const next = IL_GROUPING_ARRANGEMENTS.find((a) => a.id === id);
    if (next) {
      const counts = next.rows.map(([n]) => n).filter((n) => n > 1);
      if (!counts.includes(ilCircuits)) setIlCircuits(counts[0]!);
      if (spacing >= next.spacings.length) setSpacing(0);
    }
    setArrangement(id);
  };

  const result = useMemo((): CableSizingResult | null | { error: string } => {
    const common = { phases, voltage, current, length, powerFactor: pf, maxDropPercent: maxDrop };
    try {
      if (source === "iec") {
        return sizeCable({ ...common, method: iecMethod, ambientTemperature: iecTemp, groupedCircuits: iecCircuits });
      }
      return sizeCableIL({
        ...common,
        method: ilMethodId,
        insulation,
        ambientTemperature: ilTemp,
        grouping: arrangement === SINGLE ? undefined : { arrangement, circuits: ilCircuits, spacing },
        soilResistivity: soil,
      });
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [source, phases, voltage, current, length, pf, maxDrop, iecMethod, iecTemp, iecCircuits,
    ilMethodId, insulation, ilTemp, arrangement, ilCircuits, spacing, soil]);

  const buried = source === "il" ? ilInfo.medium === "ground" : iecInfo.medium === "ground";
  const methodCode = source === "il" ? ilInfo.code : iecMethod;
  const tableName = source === "il" ? `טבלה ${insulation}.${ilInfo.table}` : "IEC 60364-5-52";

  return (
    <Card>
      <fieldset className="mb-5">
        <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">לפי</legend>
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(
            [
              { value: "il", label: "חוק החשמל (תקנות 2014)" },
              { value: "iec", label: "תקן IEC 60364-5-52" },
            ] as const
          ).map((o) => (
            <label
              key={o.value}
              className={cn(
                "cursor-pointer rounded-lg px-3 py-2 text-center text-sm font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-500",
                source === o.value
                  ? "bg-white text-brand-700 shadow-sm dark:bg-slate-950 dark:text-brand-300"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              <input
                type="radio"
                name="cable-source"
                value={o.value}
                checked={source === o.value}
                onChange={() => setSource(o.value)}
                className="sr-only"
              />
              {o.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          {source === "il" ? (
            <>
              <SelectField
                label="שיטת התקנה (תוספת שלישית)"
                value={ilMethodId}
                options={IL_INSTALLATION_METHODS.map((m) => ({ value: m.id, label: `${m.code} – ${m.description}` }))}
                onChange={changeIlMethod}
              />
              <p className="mt-1 text-xs text-slate-500">
                ערכי Iz לפי טבלה {insulation}.{ilInfo.table} בתוספת השנייה
              </p>
            </>
          ) : (
            <>
              <SelectField
                label="שיטת התקנה"
                value={iecMethod}
                options={INSTALLATION_METHODS.map((m) => ({ value: m.method, label: m.label }))}
                onChange={changeIecMethod}
              />
              <p className="mt-1 text-xs text-slate-500">{iecInfo.description}</p>
            </>
          )}
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
        <NumberField label="זרם עומס (Ib)" unit="A" value={current} onChange={setCurrent} />
        <NumberField label="אורך" unit="m" value={length} onChange={setLength} />
        <NumberField label="מקדם הספק (cos φ)" value={pf} onChange={setPf} step={0.01} />
        <NumberField label="מפל מתח מרבי" unit="%" value={maxDrop} onChange={setMaxDrop} step={0.5} />

        {source === "il" ? (
          <>
            <SelectField
              label="בידוד"
              value={insulation}
              options={[
                { value: 70, label: "70°C (PVC)" },
                { value: 90, label: "90°C (XLPE)" },
              ]}
              onChange={changeInsulation}
            />
            <SelectField
              label={buried ? "טמפרטורת הקרקע" : "טמפרטורת הסביבה"}
              value={ilTemp}
              options={ilTabulatedTemperatures(insulation).map((t) => ({ value: t, label: `${t}°C` }))}
              onChange={setIlTemp}
            />
            <SelectField
              label="קיבוץ מעגלים"
              value={arr ? arrangement : SINGLE}
              options={[{ value: SINGLE, label: "מעגל יחיד" }, ...ilArrangements.map((a) => ({ value: a.id, label: a.label }))]}
              onChange={changeArrangement}
            />
            {arr && (
              <SelectField
                label="מספר מעגלים"
                value={ilCircuits}
                options={arr.rows.filter(([n]) => n > 1).map(([n]) => ({ value: n, label: `${n} מעגלים` }))}
                onChange={setIlCircuits}
              />
            )}
            {arr && arr.spacings.length > 1 && (
              <SelectField
                label="מרחק בין המעגלים"
                value={spacing}
                options={arr.spacings.map((label, i) => ({ value: i, label }))}
                onChange={setSpacing}
              />
            )}
            {ilInfo.grouping === "buried-direct" && (
              <SelectField
                label="התנגדות תרמית סגולית של הקרקע"
                value={soil}
                options={IL_SOIL_RESISTIVITY_FACTORS.map(([r]) => ({ value: r, label: `${r} K·m/W` }))}
                onChange={setSoil}
              />
            )}
          </>
        ) : (
          <>
            <SelectField
              label={buried ? "טמפרטורת הקרקע" : "טמפרטורת הסביבה"}
              value={iecTemp}
              options={TABULATED_TEMPERATURES.map((t) => ({ value: t, label: `${t}°C` }))}
              onChange={setIecTemp}
            />
            <SelectField label="מעגלים מקובצים יחד" value={iecCircuits} options={IEC_GROUP_OPTIONS} onChange={setIecCircuits} />
          </>
        )}
      </div>

      {result === null ? (
        <ResultBox tone="error">אין חתך בטבלה שעומד בתנאים. שקלו כבלים מקבילים, שיטת התקנה אחרת או קיצור הקו.</ResultBox>
      ) : "error" in result ? (
        <ResultBox tone="error">יש לבדוק את הנתונים: {result.error}</ResultBox>
      ) : (
        <ResultBox>
          <p className="text-lg">
            חתך מומלץ: <strong dir="ltr">{result.section} mm²</strong> (נחושת
            {source === "il" ? `, בידוד ${insulation}°C` : ", בידוד PVC"})
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {result.governedBy === "ampacity" ? "החתך נקבע לפי הזרם המותר" : "החתך הוגדל בגלל מפל המתח"} · מפל מתח:{" "}
            {fmt(result.dropPercent)}%
          </p>
          <dl className="mt-3 grid max-w-md gap-y-1 text-sm">
            <Row label={`Iz מהטבלה (${tableName}, שיטה ${methodCode})`} value={`${fmt(result.tableAmpacity, 1)} A`} />
            <Row label="מקדם טמפרטורה" value={fmt(result.factors.temperature)} />
            <Row label="מקדם קיבוץ" value={fmt(result.factors.grouping)} />
            {source === "il" && ilInfo.grouping === "buried-direct" && (
              <Row label="מקדם התנגדות תרמית של הקרקע" value={fmt(result.factors.extra)} />
            )}
            <Row label={source === "il" ? "I'z = Iz · c" : "זרם מותר אחרי תיקון"} value={`${fmt(result.ampacity, 1)} A`} strong />
          </dl>
        </ResultBox>
      )}
      <p className="mt-3 text-xs text-slate-500">
        {source === "il" ? (
          <>
            לפי תקנות החשמל (העמסה והגנה על מוליכים מבודדים וכבלים במתח נמוך), התשע״ד–2014: ערכי Iz מהתוספת השנייה
            (טמפרטורה אופפת 35°C באוויר, 30°C ו־2.5 K·m/W בקרקע), ומקדמי התיקון מהתוספת הראשונה. לפי תקנה 6 נדרש גם
            Ib ≤ In ≤ I&apos;z בבחירת המבטח.
          </>
        ) : (
          <>
            ערכי הייחוס לקוחים מ־IEC 60364-5-52 (נספח B): נחושת עם בידוד PVC, טמפרטורת ייחוס 30°C באוויר או 20°C בקרקע
            (התנגדות תרמית 2.5 K·m/W). מקדמי הקיבוץ הם למעגלים צמודים.
          </>
        )}{" "}
        הכלי מיועד ללימוד ואינו מחליף תכנון על ידי חשמלאי מוסמך.
      </p>
    </Card>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn("flex justify-between gap-2", strong && "font-semibold")}>
      <dt className={strong ? undefined : "text-slate-600 dark:text-slate-400"}>{label}</dt>
      <dd dir="ltr">{value}</dd>
    </div>
  );
}
