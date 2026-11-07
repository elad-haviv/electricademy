"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw, ShieldAlert } from "lucide-react";
import { transformerShortCircuit } from "@electricademy/calc";

/*
 * A small 22/0.4 kV substation: utility feeder → CB-1 → 1000 kVA transformer (uk 6%) → CB-2 → LV bus,
 * with a standby generator, an automatic capacitor bank and a fault-injection point.
 */
const TX_KVA = 1000;
const TX_UK = 6;
const LOAD_MW = 0.68;
const LOAD_MVAR = 0.6; // inductive, cos φ ≈ 0.75 without compensation
const CAP_MVAR = 0.38;
const GEN_MW = 0.3;
const FAULT_KA = transformerShortCircuit(TX_KVA, 400, TX_UK) / 1000; // ≈ 24.06 kA
const TRIP_DELAY_MS = 1700;

const LIVE_MV = "#38BDF8";
const LIVE_LV = "#F59E0B";
const DEAD = "#475569";

function Breaker({
  x,
  y,
  width = 66,
  label,
  closed,
  onText,
  offText,
  idleWhenOpen = false,
  onToggle,
}: {
  x: number;
  y: number;
  width?: number;
  label: string;
  closed: boolean;
  onText: string;
  offText: string;
  idleWhenOpen?: boolean;
  onToggle: () => void;
}) {
  const cx = x + width / 2;
  const openFill = idleWhenOpen ? "#1E293B" : "#450A0A";
  const openStroke = idleWhenOpen ? "#64748B" : "#F43F5E";
  return (
    <g
      role="button"
      tabIndex={0}
      aria-pressed={closed}
      aria-label={`${label}: ${closed ? onText : offText}`}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onToggle();
        }
      }}
      className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-white"
    >
      <rect x={x} y={y} width={width} height="27" rx="5" fill={closed ? "#064E3B" : openFill} stroke={closed ? "#10B981" : openStroke} strokeWidth="1.8" />
      <text x={cx} y={y + 12} textAnchor="middle" fill="#F8FAFC" fontSize="10" fontWeight="800" direction="ltr">
        {label}
      </text>
      <text x={cx} y={y + 23} textAnchor="middle" fill={closed ? "#6EE7B7" : idleWhenOpen ? "#94A3B8" : "#FDA4AF"} fontSize="9" fontWeight="700">
        {closed ? onText : offText}
      </text>
    </g>
  );
}

export function HeroSldSimulator() {
  const [cb1, setCb1] = useState(true);
  const [cb2, setCb2] = useState(true);
  const [gen, setGen] = useState(false);
  const [caps, setCaps] = useState(true);
  const [tap, setTap] = useState(0);
  const [fault, setFault] = useState(false);
  const [tripMsg, setTripMsg] = useState<string | null>(null);

  const t = useMemo(() => {
    const gridOnLv = cb1 && cb2;
    const energizedMV = cb1;
    const energizedLV = gridOnLv || gen;
    const lvKv = gridOnLv ? 0.4 * (1 + tap / 100) : energizedLV ? 0.4 : 0;

    if (fault && energizedLV) {
      return {
        energizedMV,
        energizedLV,
        lvKv: 0.02,
        mvKv: energizedMV ? 21.1 : 0,
        pMw: 0.05,
        qMvar: 0,
        pf: 0.15,
        currentKa: FAULT_KA,
        level: "fault" as const,
        status: "קצר תלת־פאזי: הגנת זרם יתר מיידית (ANSI 50/51) מנתקת",
      };
    }
    if (!energizedLV) {
      return {
        energizedMV,
        energizedLV,
        lvKv: 0,
        mvKv: energizedMV ? 22 : 0,
        pMw: 0,
        qMvar: 0,
        pf: 1,
        currentKa: 0,
        level: "warning" as const,
        status: energizedMV ? "פסי צבירה 0.4kV ללא מתח (CB-2 פתוח)" : "הזנת 22kV מנותקת: המתקן ללא מתח",
      };
    }
    const qMvar = LOAD_MVAR - (caps ? CAP_MVAR : 0);
    const sMva = Math.hypot(LOAD_MW, qMvar);
    return {
      energizedMV,
      energizedLV,
      lvKv,
      mvKv: energizedMV ? 22 : 0,
      pMw: LOAD_MW,
      qMvar,
      pf: LOAD_MW / sMva,
      currentKa: sMva / (Math.sqrt(3) * lvKv),
      level: "normal" as const,
      status: gridOnLv
        ? gen
          ? `עבודה במקביל לרשת: הגנרטור נושא ${GEN_MW} MW`
          : "מערכת תקינה · הגנות 50/51/51N דרוכות"
        : "אי־חשמלי (Island): הגנרטור מזין לבדו את העומס",
    };
  }, [cb1, cb2, gen, caps, tap, fault]);

  // Protection relay: clear the fault by opening CB-2 and the generator breaker.
  useEffect(() => {
    if (!fault || !t.energizedLV) return;
    const timer = setTimeout(() => {
      setCb2(false);
      setGen(false);
      setFault(false);
      setTripMsg(`ממסר 50/51 פתח את CB-2 ואת מפסק הגנרטור (Ik ≈ ${FAULT_KA.toFixed(1)} kA).`);
    }, TRIP_DELAY_MS);
    return () => clearTimeout(timer);
  }, [fault, t.energizedLV]);

  const reset = () => {
    setCb1(true);
    setCb2(true);
    setGen(false);
    setCaps(true);
    setTap(0);
    setFault(false);
    setTripMsg(null);
  };

  const phiDeg = Math.round((Math.acos(Math.min(1, t.pf)) * 180) / Math.PI);
  const pfOk = t.pf >= 0.92;
  const tapLabel = `${tap > 0 ? "+" : ""}${tap}%`;
  const lvColor = fault && t.energizedLV ? "#F43F5E" : t.energizedLV ? LIVE_LV : DEAD;
  // Phase shift of the current trace, in SVG units (55 units = quarter period → 90°).
  const shift = (phiDeg / 90) * 55;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/80 bg-slate-950/85 text-slate-100 shadow-2xl backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 bg-slate-900/90 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="flex gap-1.5">
            <span className="size-2.5 rounded-full bg-rose-500/90" />
            <span className="size-2.5 rounded-full bg-amber-400/90" />
            <span className="size-2.5 rounded-full bg-emerald-500/90" />
          </span>
          <span className="text-xs font-bold text-slate-200 sm:text-sm">תחנת השנאה 22/0.4kV · דיאגרמה חד־קווית חיה</span>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-1 rounded-md border border-slate-600 bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          איפוס
        </button>
      </div>

      <div
        role="status"
        className={`flex items-center justify-between gap-2 border-b px-4 py-2 text-xs font-bold ${
          t.level === "fault"
            ? "animate-pulse border-rose-700 bg-rose-950/90 text-rose-200"
            : t.level === "warning"
              ? "border-amber-800/80 bg-amber-950/70 text-amber-200"
              : "border-emerald-900/60 bg-emerald-950/50 text-emerald-300"
        }`}
      >
        <span className="flex items-center gap-2">
          {t.level === "fault" ? (
            <ShieldAlert className="size-4 shrink-0 text-rose-400" aria-hidden />
          ) : t.level === "warning" ? (
            <AlertTriangle className="size-4 shrink-0 text-amber-400" aria-hidden />
          ) : (
            <CheckCircle2 className="size-4 shrink-0 text-emerald-400" aria-hidden />
          )}
          {t.status}
        </span>
        <span dir="ltr" className="font-mono text-[11px] opacity-90">
          f = {t.energizedLV || t.energizedMV ? "50.00" : "0.00"} Hz
        </span>
      </div>

      {tripMsg && (
        <div className="flex items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-xs text-amber-200">
          <span>{tripMsg}</span>
          <button type="button" onClick={() => setTripMsg(null)} className="shrink-0 font-bold text-amber-300 underline hover:text-white">
            סגירה
          </button>
        </div>
      )}

      <div className="space-y-3 p-3 sm:p-4">
        <div className="rounded-xl border border-slate-800 bg-[#090E1A] p-2 sm:p-3">
          <p className="mb-1 px-1 text-[11px] text-slate-400">לחצו על המפסקים ועל סוללת הקבלים כדי למתג:</p>
          <svg viewBox="0 0 540 275" className="h-auto w-full select-none" role="group" aria-label="דיאגרמה חד־קווית אינטראקטיבית">
            <defs>
              <pattern id="sldGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148,163,184,0.07)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="540" height="275" fill="url(#sldGrid)" rx="8" />

            {/* Utility source */}
            <circle cx="195" cy="24" r="12" fill="#0F172A" stroke={LIVE_MV} strokeWidth="2" />
            <path d="M188 24 Q191.5 18 195 24 T202 24" fill="none" stroke={LIVE_MV} strokeWidth="1.8" />
            <text x="215" y="28" fill="#94A3B8" fontSize="11" fontWeight="700" textAnchor="end" direction="rtl">
              רשת חלוקה 22kV
            </text>
            <line x1="195" y1="36" x2="195" y2="52" stroke={LIVE_MV} strokeWidth="2.5" />
            <Breaker x={162} y={52} label="CB-1 22kV" closed={cb1} onText="סגור" offText="פתוח" onToggle={() => setCb1((v) => !v)} />
            <line x1="195" y1="79" x2="195" y2="98" stroke={t.energizedMV ? LIVE_MV : DEAD} strokeWidth="2.5" />

            {/* MV bus */}
            <line x1="70" y1="98" x2="320" y2="98" stroke={t.energizedMV ? "#0EA5E9" : DEAD} strokeWidth="5" strokeLinecap="round" />
            <text x="75" y="90" fill={LIVE_MV} fontSize="11" fontWeight="800" direction="ltr" className="font-mono">
              BUS-1: {t.mvKv.toFixed(1)} kV
            </text>

            {/* Transformer */}
            <line x1="195" y1="98" x2="195" y2="114" stroke={t.energizedMV ? LIVE_MV : DEAD} strokeWidth="2.5" />
            <circle cx="195" cy="126" r="12" fill="#0F172A" stroke={t.energizedMV ? LIVE_MV : "#64748B"} strokeWidth="2.2" />
            <circle cx="195" cy="141" r="12" fill="#0F172A" stroke={t.energizedMV ? LIVE_LV : "#64748B"} strokeWidth="2.2" />
            <path d="M178 144 L212 122" stroke={LIVE_LV} strokeWidth="1.5" />
            <polygon points="212,122 206,123 210,127" fill={LIVE_LV} />
            <text x="160" y="136" fill="#E2E8F0" fontSize="10" fontWeight="700" textAnchor="start" direction="rtl">
              שנאי {TX_KVA}kVA
            </text>
            <text x="160" y="149" fill={LIVE_LV} fontSize="10" fontWeight="700" textAnchor="start" direction="rtl">
              <tspan>דרגה: </tspan>
              <tspan direction="ltr" unicodeBidi="embed">
                {tapLabel}
              </tspan>
            </text>
            <line x1="195" y1="153" x2="195" y2="164" stroke={t.energizedMV ? LIVE_LV : DEAD} strokeWidth="2.5" />
            <Breaker x={162} y={164} label="CB-2 0.4kV" closed={cb2} onText="סגור" offText="פתוח" onToggle={() => setCb2((v) => !v)} />
            <line x1="195" y1="191" x2="195" y2="208" stroke={cb1 && cb2 ? LIVE_LV : DEAD} strokeWidth="2.5" />

            {/* Generator */}
            <text x="435" y="102" fill="#CBD5E1" fontSize="10" fontWeight="700" textAnchor="middle">
              גנרטור סינכרוני
            </text>
            <circle cx="435" cy="126" r="16" fill="#0F172A" stroke={gen ? "#10B981" : "#64748B"} strokeWidth="2.2" />
            <text x="435" y="131" textAnchor="middle" fill={gen ? "#34D399" : "#94A3B8"} fontSize="13" fontWeight="900">
              G
            </text>
            <line x1="435" y1="142" x2="435" y2="164" stroke={gen ? "#10B981" : DEAD} strokeWidth="2.5" />
            <Breaker x={398} y={164} width={74} label="CB-GEN" closed={gen} onText="מסונכרן" offText="בהמתנה" idleWhenOpen onToggle={() => setGen((v) => !v)} />
            <line x1="435" y1="191" x2="435" y2="208" stroke={gen ? "#10B981" : DEAD} strokeWidth="2.5" />

            {/* LV bus */}
            <line x1="50" y1="208" x2="490" y2="208" stroke={lvColor} strokeWidth="5" strokeLinecap="round" />
            {t.energizedLV && <line x1="55" y1="208" x2="485" y2="208" stroke="#FEF08A" strokeWidth="2" className="animate-current-flow" />}
            <text x="55" y="200" fill="#FBBF24" fontSize="11" fontWeight="800" direction="ltr" className="font-mono">
              BUS-2: {t.lvKv.toFixed(3)} kV
            </text>

            {/* Load feeder */}
            <line x1="125" y1="208" x2="125" y2="243" stroke={t.energizedLV ? LIVE_LV : DEAD} strokeWidth="2.5" />
            <polygon points="125,255 118,242 132,242" fill={t.energizedLV ? LIVE_LV : DEAD} />
            <text x="125" y="270" textAnchor="middle" fill="#CBD5E1" fontSize="10" fontWeight="700">
              עומס מנועים
            </text>

            {/* Capacitor bank */}
            <line x1="285" y1="208" x2="285" y2="230" stroke={t.energizedLV && caps ? LIVE_MV : DEAD} strokeWidth="2.2" />
            <g
              role="button"
              tabIndex={0}
              aria-pressed={caps}
              aria-label={`סוללת קבלים: ${caps ? "פעילה" : "מנותקת"}`}
              onClick={() => setCaps((v) => !v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setCaps((v) => !v);
                }
              }}
              className="cursor-pointer outline-none [&:focus-visible>rect]:stroke-white"
            >
              <rect x="248" y="230" width="74" height="24" rx="4" fill={caps ? "#0C4A6E" : "#1E293B"} stroke={caps ? LIVE_MV : "#64748B"} strokeWidth="1.5" />
              <text x="285" y="246" textAnchor="middle" fill="#E0F2FE" fontSize="10" fontWeight="700">
                קבלים: {caps ? "פעיל" : "מנותק"}
              </text>
            </g>
            <text x="285" y="270" textAnchor="middle" fill={LIVE_MV} fontSize="10" fontWeight="700">
              שיפור cos φ
            </text>

            {/* Fault point */}
            <line x1="415" y1="208" x2="415" y2="243" stroke={fault ? "#F43F5E" : "#64748B"} strokeWidth="2.2" strokeDasharray="4 3" />
            {fault && (
              <g>
                <circle cx="415" cy="245" r="14" fill="rgba(244,63,94,0.3)" className="animate-ping [transform-box:fill-box] [transform-origin:center]" />
                <path d="M418 232 L408 245 H416 L411 258 L423 243 H415 Z" fill="#F43F5E" />
              </g>
            )}
            <text x="415" y="270" textAnchor="middle" fill={fault ? "#FDA4AF" : "#94A3B8"} fontSize="10" fontWeight="700">
              {fault ? "קצר תלת־פאזי!" : "נקודת בדיקת קצר"}
            </text>
          </svg>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/90 pt-3">
            <label className="flex min-w-[220px] flex-1 items-center gap-2.5">
              <span className="text-xs font-bold whitespace-nowrap text-slate-300">מחליף דרגות (Tap):</span>
              <input
                type="range"
                min={-10}
                max={10}
                step={2.5}
                value={tap}
                onChange={(e) => setTap(Number(e.target.value))}
                className="h-1.5 w-full cursor-pointer accent-amber-400"
              />
              <span dir="ltr" className="w-12 font-mono text-xs font-bold text-amber-400">
                {tapLabel}
              </span>
            </label>
            <button
              type="button"
              onClick={() => {
                setTripMsg(null);
                setFault((v) => !v);
              }}
              disabled={!t.energizedLV}
              className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                !t.energizedLV
                  ? "cursor-not-allowed border-slate-700 bg-slate-800 text-slate-500"
                  : fault
                    ? "border-rose-400 bg-rose-600 text-white shadow-lg shadow-rose-600/30"
                    : "border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25"
              }`}
            >
              <ShieldAlert className="size-3.5" aria-hidden />
              {fault ? "קצר פעיל, ההגנה מנתקת…" : "הדמיית קצר תלת־פאזי"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <Readout label="מתח פסי צבירה" value={`${t.lvKv.toFixed(3)} kV`} tone="text-amber-400" sub={`MV: ${t.mvKv.toFixed(1)} kV`} />
          <Readout
            label="זרם עומס (RMS)"
            value={`${t.currentKa.toFixed(2)} kA`}
            tone={fault ? "text-rose-400" : "text-sky-400"}
            sub={fault ? "זרם קצר Ik3" : "עומס תקין"}
          />
          <Readout label="הספק P / Q" value={`${t.pMw.toFixed(2)} MW`} tone="text-slate-100" sub={`${t.qMvar.toFixed(2)} MVAr`} />
          <Readout
            label="מקדם הספק"
            value={t.pf.toFixed(2)}
            tone={pfOk ? "text-emerald-400" : "text-amber-400"}
            sub={pfOk ? "תקין (≥ 0.92)" : "נדרשים קבלים"}
          />
        </div>

        <div className="rounded-xl border border-slate-800 bg-[#090E1A] p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-300">אוסצילוסקופ: מתח וזרם</span>
            <span dir="ltr" className="font-mono text-[10px] text-slate-400">
              <span className="text-amber-400">CH1 V(t)</span> · <span className={fault ? "text-rose-400" : "text-sky-400"}>CH2 I(t)</span>
            </span>
          </div>
          <svg viewBox="0 0 220 60" className="my-1 h-16 w-full rounded-lg border border-slate-800/80 bg-slate-950" aria-hidden>
            {[55, 110, 165].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="60" stroke="#1E293B" strokeWidth="1" />
            ))}
            <line x1="0" y1="30" x2="220" y2="30" stroke="#1E293B" strokeWidth="1" />
            {t.energizedLV ? (
              <>
                <path
                  d={fault ? "M 0 30 Q 27 27, 55 30 T 110 30 T 165 30 T 220 30" : "M 0 30 Q 27 4, 55 30 T 110 30 T 165 30 T 220 30"}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2"
                />
                <path
                  d={fault ? "M -20 30 Q 7 -40, 35 30 T 90 30 T 145 30 T 200 30 T 255 30" : "M -110 30 Q -83 12, -55 30 T 0 30 T 55 30 T 110 30 T 165 30 T 220 30"}
                  transform={fault ? undefined : `translate(${shift} 0)`}
                  fill="none"
                  stroke={fault ? "#F43F5E" : LIVE_MV}
                  strokeWidth="1.8"
                  strokeDasharray={fault ? undefined : "3 2"}
                />
              </>
            ) : (
              <line x1="0" y1="30" x2="220" y2="30" stroke={DEAD} strokeWidth="2" />
            )}
          </svg>
          <div className="flex items-center justify-between text-[10px] text-slate-400">
            <span>
              הזזת מופע: <span dir="ltr">φ ≈ {t.energizedLV && !fault ? phiDeg : 0}°</span> {t.energizedLV && !fault && !pfOk ? "(השראתי)" : ""}
            </span>
            <span dir="ltr" className="font-mono text-amber-400">
              50 Hz
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Readout({ label, value, sub, tone }: { label: string; value: string; sub: string; tone: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-[#090E1A] p-3">
      <div className="text-[11px] font-semibold text-slate-400">{label}</div>
      <div dir="ltr" className={`mt-0.5 text-end font-mono text-base font-extrabold ${tone}`}>
        {value}
      </div>
      <div className="text-[10px] text-slate-500">{sub}</div>
    </div>
  );
}
