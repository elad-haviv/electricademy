"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Award, Calculator, Check, ChevronLeft, Play, Sliders, Sparkles, X } from "lucide-react";
import { STANDARD_SECTIONS_MM2, voltageDrop, type ConductorMaterial } from "@electricademy/calc";
import type { ShowcaseSample } from "@/lib/licenseExam";

type Tab = "simulators" | "calculators" | "licensing";

const SIMULATORS = [
  {
    slug: "hv-edu",
    code: "SIM-01 · 24kV",
    title: "לוחות מיתוג מתח בינוני בתלת־ממד",
    subtitle: "יחידות תפקוד של לוח SM6, סדר פעולות מיתוג, נעילות מכניות וחשמליות ותרגילי נוהל.",
    tier: "free",
    shots: [
      { src: "/images/labs/hv-edu-lineup.webp", caption: "לוח SM6 שלם בתלת־ממד: מפעילים מפסקים ומנתקים עם נעילות" },
      { src: "/images/labs/hv-edu-units.webp", caption: "קטלוג יחידות התפקוד: IM, QM, PM, DM1 ועוד" },
    ],
  },
  {
    slug: "genset-edu",
    code: "SIM-02 · GENSET",
    title: "גנרטורים: תורת פעולה ובטיחות",
    subtitle: "גנרטור דיזל בתלת־ממד, חדר גנרטור עם מפגעים וסימולטור העברה (ATS).",
    tier: "free",
    shots: [
      { src: "/images/labs/genset-explorer.webp", caption: "סייר גנרטור דיזל בתלת־ממד, רכיב אחר רכיב" },
      { src: "/images/labs/genset-simulator.webp", caption: "סימולטור מערכת חשמל ו־ATS: רשת, גנרטור ועומסים" },
    ],
  },
  {
    slug: "protect-edu",
    code: "SIM-03 · TT / TN",
    title: "הגנה בפני חשמול והארקות",
    subtitle: "הארקת הגנה, איפוס, מפסק פחת, שנאי הפרדה, בידוד כפול, SELV/PELV ושוות פוטנציאל.",
    tier: "free",
    shots: [
      { src: "/images/labs/protect-rcd.webp", caption: "מפסק מגן (פחת): סופרים את הזרם שחוזר" },
      { src: "/images/labs/protect-tn.webp", caption: "איפוס (TN): הופכים תקלה לקצר כדי שההגנה תנתק" },
    ],
  },
  {
    slug: "agl-edu",
    code: "SIM-04 · AGL / CCR",
    title: "תאורת שדות תעופה ומעגלי זרם קבוע",
    subtitle: "ווסתי זרם קבוע (CCR), שנאי בידוד בטור, איתור קצרים ונתקים ובדיקות בידוד במעגל מסלול.",
    tier: "pro",
    shots: [
      { src: "/images/labs/agl-find-short.webp", caption: "מצאו את הקצר: נועלים את הווסת, מפצלים את הלולאה ובודקים בידוד" },
      { src: "/images/labs/agl-series.webp", caption: "סימולטור מעגל טורי: זרם אחד, שמונה פנסים ווסת אחד" },
    ],
  },
] as const;

const TABS: { id: Tab; kicker: string; title: string; Icon: typeof Sliders }[] = [
  { id: "simulators", kicker: "01 · ללמוד בידיים", title: "מעבדת סימולטורים", Icon: Sliders },
  { id: "calculators", kicker: "02 · כלים הנדסיים", title: "מחשבונים לשטח ולתכנון", Icon: Calculator },
  { id: "licensing", kicker: "03 · הכנה לוועדה", title: "סימולטור בחינות רישוי", Icon: Award },
];

export interface LicensingTeaser {
  samples: ShowcaseSample[];
  total: number;
  version: string | null;
}

export function LabShowcase({ licensing }: { licensing: LicensingTeaser }) {
  const [tab, setTab] = useState<Tab>("simulators");

  return (
    <section id="lab" className="on-dark relative isolate scroll-mt-20 overflow-hidden rounded-3xl bg-slate-900 px-4 py-12 text-slate-100 sm:px-8 lg:px-10 lg:py-16">
      <Image src="/images/simulators.webp" alt="" fill sizes="100vw" className="-z-20 object-cover object-left opacity-25" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-l from-slate-900 via-slate-900/95 to-slate-900/70" />

      <div className="mb-8 max-w-3xl">
        <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/15 px-3 py-1 text-xs font-extrabold text-amber-300">
          <Sparkles className="size-3.5" aria-hidden />
          נסו עכשיו, ישר מהדף
        </span>
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">לא רק הרצאות: מעבדה הנדסית בדפדפן</h2>
        <p className="mt-2 text-slate-400">סימולטורים לתחנות משנה והארקות, מחשבונים לעבודה בשטח וסימולטור לבחינות הרישוי על המאגר הרשמי.</p>
      </div>

      <div role="group" aria-label="בחירת מעבדה" className="mb-6 grid gap-3 md:grid-cols-3">
        {TABS.map(({ id, kicker, title, Icon }) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
            className={`flex items-center justify-between rounded-2xl border p-4 text-start transition-all ${
              tab === id
                ? "border-amber-400 bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
                : "border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-800"
            }`}
          >
            <span>
              <span className="block text-xs font-extrabold opacity-80">{kicker}</span>
              <span className="mt-0.5 block text-lg font-black">{title}</span>
            </span>
            <Icon className="size-6 shrink-0" aria-hidden />
          </button>
        ))}
      </div>

      <div>
        {tab === "simulators" && <SimulatorsPanel />}
        {tab === "calculators" && <CalculatorPanel />}
        {tab === "licensing" && <LicensingPanel {...licensing} />}
      </div>
    </section>
  );
}

function SimulatorsPanel() {
  const [active, setActive] = useState<(typeof SIMULATORS)[number]["slug"]>(SIMULATORS[0].slug);
  const sim = SIMULATORS.find((s) => s.slug === active)!;
  return (
    <div className="grid items-start gap-6 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-5">
        {SIMULATORS.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => setActive(s.slug)}
            aria-pressed={s.slug === active}
            className={`block w-full rounded-2xl border p-4 text-start transition-all ${
              s.slug === active ? "border-amber-400 bg-slate-800 shadow-md" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
            }`}
          >
            <span className="mb-1 flex items-center justify-between gap-2">
              <span dir="ltr" className="font-mono text-xs font-bold text-sky-400">
                {s.code}
              </span>
              <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-0.5 text-[11px] font-bold text-amber-400">
                {s.tier === "pro" ? "Pro" : "חינם"}
              </span>
            </span>
            <span className="block text-base font-black text-white">{s.title}</span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-400">{s.subtitle}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#090E1A] p-6 lg:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <span dir="ltr" className="font-mono text-xs font-bold text-amber-400">
              {sim.code}
            </span>
            <h3 className="mt-0.5 text-2xl font-black text-white">{sim.title}</h3>
          </div>
          <Link href={`/simulators/${sim.slug}`} className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-xs font-extrabold text-slate-950 hover:bg-amber-400">
            <Play className="size-3.5 fill-slate-950" aria-hidden />
            לפתיחת הסימולטור
          </Link>
        </div>
        <LabGallery key={sim.slug} title={sim.title} shots={sim.shots} />
      </div>
    </div>
  );
}

function LabGallery({ title, shots }: { title: string; shots: readonly { src: string; caption: string }[] }) {
  const [i, setI] = useState(0);
  const shot = shots[i] ?? shots[0]!;
  return (
    <figure className="mt-5">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-700 bg-slate-950 shadow-lg">
        <Image src={shot.src} alt={`${title}: ${shot.caption}`} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover object-top" />
      </div>
      <figcaption className="mt-2.5 text-xs text-slate-300">{shot.caption}</figcaption>
      {shots.length > 1 && (
        <div className="mt-3 flex gap-2.5">
          {shots.map((s, idx) => (
            <button
              key={s.src}
              type="button"
              onClick={() => setI(idx)}
              aria-label={`צילום מסך ${idx + 1}: ${s.caption}`}
              aria-pressed={idx === i}
              className={`relative aspect-[16/10] w-28 overflow-hidden rounded-lg border-2 transition-all ${
                idx === i ? "border-amber-400" : "border-slate-700 opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={s.src} alt="" fill sizes="112px" className="object-cover object-top" />
            </button>
          ))}
        </div>
      )}
    </figure>
  );
}

const SECTIONS = STANDARD_SECTIONS_MM2.filter((s) => s >= 6);
const DROP_LIMIT = 3;

function CalculatorPanel() {
  const [loadKw, setLoadKw] = useState(85);
  const [length, setLength] = useState(110);
  const [section, setSection] = useState<number>(35);
  const [material, setMaterial] = useState<ConductorMaterial>("copper");
  const [pf1, setPf1] = useState(0.76);
  const [pf2, setPf2] = useState(0.93);

  const r = useMemo(() => {
    const iBefore = (loadKw * 1000) / (Math.sqrt(3) * 400 * pf1);
    const iAfter = (loadKw * 1000) / (Math.sqrt(3) * 400 * pf2);
    const drop = voltageDrop({ phases: 3, voltage: 400, current: iBefore, length, section, material, powerFactor: pf1 });
    const qc = loadKw * (Math.tan(Math.acos(pf1)) - Math.tan(Math.acos(pf2)));
    return { iBefore, iAfter, saved: ((iBefore - iAfter) / iBefore) * 100, qc: Math.max(0, qc), ...drop, ok: drop.percent <= DROP_LIMIT };
  }, [loadKw, length, section, material, pf1, pf2]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-[#090E1A] p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <span dir="ltr" className="font-mono text-xs font-bold text-sky-400">
            3~ 400V · 50Hz
          </span>
          <h3 className="mt-0.5 text-2xl font-black text-white">מפל מתח ושיפור מקדם הספק</h3>
        </div>
        <Link href="/tools" className="flex items-center gap-1 text-sm font-extrabold text-amber-400 hover:text-amber-300">
          לכל המחשבונים
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      </div>

      <div className="mt-6 grid items-center gap-8 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-7">
          <Slider label="הספק פעיל (P)" value={loadKw} display={`${loadKw} kW`} min={10} max={350} step={5} onChange={setLoadKw} accent="accent-amber-400" tone="text-amber-400" />
          <Slider label="אורך הקו (L)" value={length} display={`${length} m`} min={15} max={400} step={5} onChange={setLength} accent="accent-sky-400" tone="text-sky-400" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-400">חתך מוליך</span>
              <select
                value={section}
                onChange={(e) => setSection(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
              >
                {SECTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s} ממ״ר
                  </option>
                ))}
              </select>
            </label>
            <fieldset>
              <legend className="mb-1.5 block text-xs font-bold text-slate-400">חומר המוליך</legend>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["copper", "נחושת (Cu)"],
                    ["aluminium", "אלומיניום (Al)"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={material === id}
                    onClick={() => setMaterial(id)}
                    className={`rounded-xl border py-2.5 text-xs font-extrabold ${
                      material === id ? "border-amber-400 bg-amber-500/20 text-amber-300" : "border-slate-700 bg-slate-900 text-slate-400"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            <Slider label="cos φ קיים" value={pf1} display={pf1.toFixed(2)} min={0.6} max={0.9} step={0.01} onChange={setPf1} accent="accent-amber-400" tone="text-amber-400" small />
            <Slider label="cos φ יעד" value={pf2} display={pf2.toFixed(2)} min={0.9} max={0.98} step={0.01} onChange={setPf2} accent="accent-emerald-400" tone="text-emerald-400" small />
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-5 lg:col-span-5" aria-live="polite">
          <div className={`rounded-xl border p-4 ${r.ok ? "border-emerald-700/70 bg-emerald-950/40" : "border-rose-700/80 bg-rose-950/50"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-300">מפל מתח (ΔU)</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${r.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}>
                {r.ok ? `בתוך יעד התכנון (≤ ${DROP_LIMIT}%)` : `חורג מיעד התכנון (${DROP_LIMIT}%)`}
              </span>
            </div>
            <div dir="ltr" className="mt-2 text-end font-mono text-3xl font-black text-white">
              {r.percent.toFixed(2)}% <span className="text-sm font-normal text-slate-400">({r.volts.toFixed(1)} V)</span>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="text-xs font-bold text-slate-400">סוללת קבלים נדרשת (Qc)</div>
            <div dir="ltr" className="mt-1 text-end font-mono text-2xl font-black text-amber-400">
              {r.qc.toFixed(1)} kVAr
            </div>
            <div dir="ltr" className="mt-1 text-end font-mono text-[11px] text-slate-400">
              Qc = P·(tan φ1 − tan φ2)
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="text-[11px] text-slate-400">זרם לפני השיפור</div>
              <div dir="ltr" className="mt-0.5 text-end font-mono text-lg font-extrabold text-slate-200">
                {r.iBefore.toFixed(1)} A
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <div className="text-[11px] text-slate-400">זרם אחרי השיפור</div>
              <div dir="ltr" className="mt-0.5 text-end font-mono text-lg font-extrabold text-sky-400">
                {r.iAfter.toFixed(1)} A <span className="text-xs">(−{r.saved.toFixed(0)}%)</span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">חישוב לימודי: מוליך ב־70°C ותגובה 0.08 Ω/km. מפל המתח מחושב לפני השיפור.</p>
        </div>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  display,
  min,
  max,
  step,
  onChange,
  accent,
  tone,
  small = false,
}: {
  label: string;
  value: number;
  display: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  accent: string;
  tone: string;
  small?: boolean;
}) {
  return (
    <label className="block">
      <span className={`mb-1.5 flex justify-between font-bold ${small ? "text-xs" : "text-sm"}`}>
        <span className={small ? "text-slate-400" : "text-slate-300"}>{label}</span>
        <span dir="ltr" className={`font-mono ${tone}`}>
          {display}
        </span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className={`h-2 w-full cursor-pointer ${accent}`} />
    </label>
  );
}

function LicensingPanel({ samples, total, version }: LicensingTeaser) {
  const [idx, setIdx] = useState(0);
  // the learner's pick per sample, so the progress dots remember what was answered
  const [picks, setPicks] = useState<(number | null)[]>(() => samples.map(() => null));
  const q = samples[idx];
  if (!q) return null;
  const chosen = picks[idx] ?? null;
  const answered = picks.filter((p) => p !== null).length;
  const correctCount = picks.filter((p, i) => p !== null && p === samples[i]?.correct).length;
  const pick = (i: number) => setPicks((cur) => cur.map((p, j) => (j === idx ? i : p)));
  const nextUnanswered = picks.findIndex((p, i) => p === null && i !== idx);
  const isLast = nextUnanswered === -1;

  return (
    <div className="space-y-6 rounded-2xl border border-slate-800 bg-[#090E1A] p-5 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="text-amber-400">שאלה מהמאגר הרשמי{version && ` · גרסה ${version}`}</span>
          <span className="rounded-md border border-sky-800/70 bg-sky-950/60 px-2.5 py-0.5 text-sky-400">{q.topic}</span>
        </div>
        <p className="text-base leading-relaxed font-bold text-slate-100 sm:text-lg" dangerouslySetInnerHTML={{ __html: q.question }} />
        {q.figures.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {q.figures.map((f) => (
              // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP crops, served as-is
              <img
                key={f.src}
                src={f.src}
                alt={f.alt}
                width={f.w}
                height={f.h}
                loading="lazy"
                style={{ width: Math.round(f.w * 0.5) }}
                className="h-auto max-w-full rounded-lg bg-white p-1"
              />
            ))}
          </div>
        )}

        <div className="space-y-2.5">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correct;
            let style = "border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500";
            if (chosen !== null) {
              if (isCorrect) style = "border-emerald-500 bg-emerald-950/80 text-emerald-200";
              else if (i === chosen) style = "border-rose-500 bg-rose-950/80 text-rose-200";
              else style = "border-slate-800 bg-slate-900/50 text-slate-500";
            }
            return (
              <button
                key={i}
                type="button"
                disabled={chosen !== null}
                onClick={() => pick(i)}
                className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-start text-sm font-bold transition-all ${style}`}
              >
                <span className="flex items-center gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-xs">{i + 1}</span>
                  <span dangerouslySetInnerHTML={{ __html: opt }} />
                </span>
                {chosen !== null && isCorrect && <Check className="size-5 shrink-0 text-emerald-400" aria-label="תשובה נכונה" />}
                {chosen === i && !isCorrect && <X className="size-5 shrink-0 text-rose-400" aria-label="תשובה שגויה" />}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <div
            aria-live="polite"
            className={`space-y-3 rounded-2xl border p-4 ${chosen === q.correct ? "border-emerald-500/40 bg-emerald-950/40" : "border-rose-500/40 bg-rose-950/40"}`}
          >
            <p className={`text-sm font-extrabold ${chosen === q.correct ? "text-emerald-300" : "text-rose-300"}`}>
              {chosen === q.correct ? "✓ תשובה נכונה!" : `✗ לא נכון. התשובה הנכונה היא ${q.correct + 1}.`}
            </p>
            {q.formula && (
              <div className="space-y-1 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-3 text-sm text-amber-300">
                {q.formula.map((line, i) => (
                  <div key={i} dir="auto" dangerouslySetInnerHTML={{ __html: line }} />
                ))}
              </div>
            )}
            <p className="text-sm leading-relaxed text-slate-200" dangerouslySetInnerHTML={{ __html: q.explanation }} />
            {q.source && (
              <p className="text-xs text-slate-400">
                מקור:{" "}
                {q.source.href ? (
                  <Link href={q.source.href} className="font-bold text-sky-400 underline">
                    {q.source.label}
                  </Link>
                ) : (
                  q.source.label
                )}
              </p>
            )}
            {isLast ? (
              <p className="text-sm font-bold text-slate-200">
                סיימתם את שאלות הדוגמה: {correctCount} מתוך {samples.length} נכונות. רוצים עוד? למטה מחכה בחינה מלאה.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setIdx(nextUnanswered)}
                className="w-full rounded-xl bg-amber-500 py-3 text-sm font-extrabold text-slate-950 transition-colors hover:bg-amber-400"
              >
                לשאלה הבאה ←
              </button>
            )}
          </div>
        )}

        <nav aria-label="שאלות הדוגמה" className="flex items-center justify-center gap-3 pt-1">
          {samples.map((s, i) => {
            const p = picks[i];
            const color =
              p === null || p === undefined ? "bg-slate-600" : p === s.correct ? "bg-emerald-500" : "bg-rose-500";
            return (
              <button
                key={s.n}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`שאלה ${i + 1} מתוך ${samples.length}${p === null ? "" : p === s.correct ? ", נענתה נכון" : ", נענתה לא נכון"}`}
                aria-current={i === idx ? "step" : undefined}
                className={`size-3.5 rounded-full transition-all ${color} ${i === idx ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-[#090E1A]" : ""}`}
              />
            );
          })}
          <span className="ms-1 text-xs font-bold text-slate-400 tabular-nums">
            {idx + 1}/{samples.length}
          </span>
        </nav>
        <p className="sr-only" aria-live="polite">
          נענו {answered} מתוך {samples.length}
        </p>
      </div>

      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
        <p className="font-black text-white">מוכנים לבחינה האמיתית?</p>
        <p className="mt-1 text-sm text-slate-400">
          סימולציה של 50 שאלות לפי סוג הרישיון, או עיון בכל {total.toLocaleString("he-IL")} השאלות במאגר, עם הסבר ודיון לכל שאלה.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Link
            href="/license-exam/exam"
            className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-extrabold text-slate-950 transition-colors hover:bg-amber-400"
          >
            <Play className="size-4" aria-hidden />
            סימולציית מבחן מלא
          </Link>
          <Link
            href="/license-exam/browse"
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-center text-sm font-extrabold text-slate-100 hover:bg-slate-800"
          >
            עיון בכל שאלות המאגר
          </Link>
        </div>
      </div>
    </div>
  );
}
