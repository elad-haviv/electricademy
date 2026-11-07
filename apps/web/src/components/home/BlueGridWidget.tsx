"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Activity, ChevronLeft, ClipboardList, Play, RotateCcw, Settings, Zap } from "lucide-react";

/*
 * A pocket version of Blue Grid (bluegrid.haviv.pro): same drawing language
 * (T-bar grid source, P/S transformer rings, boxed breakers, load triangles),
 * phase-coloured animated wires in SIM mode, and Blue Grid's breaker rules:
 * click to open/close, a fault trips the feeder, clicking a tripped breaker resets it to open.
 */

type Mode = "edit" | "sim";
type BreakerId = "q0" | "q1" | "q2" | "q3";
type BreakerState = "closed" | "open" | "trip";
type CompId = "grid" | "tx" | "bus" | BreakerId | "l1" | "l2" | "l3";

// Blue Grid's getPhaseColor(phase 0°, voltage): lighter for lower voltages.
const COLOR_22KV = "hsl(0, 100%, 50%)";
const COLOR_400V = "hsl(0, 100%, 76%)";
const DEAD_SIM = "#64748b";
const EDIT_STROKE = "#e2e8f0";
const SELECT = "#3b82f6";

const FEEDERS = [
  { breaker: "q1", load: "l1", x: 170, name: "תאורה", kva: 25, rating: 63 },
  { breaker: "q2", load: "l2", x: 300, name: "מיזוג אוויר", kva: 60, rating: 125 },
  { breaker: "q3", load: "l3", x: 430, name: "משאבות", kva: 40, rating: 80 },
] as const;

const PROPS: Record<CompId, { code: string; name: string; rows: [string, string][] }> = {
  grid: { code: "GRI", name: "רשת חשמל", rows: [["מתח נקוב", "22 kV"], ["הספק קצר", "250 MVA"], ["תדר", "50 Hz"]] },
  tx: { code: "TRA", name: "שנאי חלוקה", rows: [["הספק", "630 kVA"], ["יחס", "22/0.4 kV"], ["uk", "6%"], ["קבוצת חיבור", "Dyn11"]] },
  q0: { code: "BRE", name: "מפסק ראשי", rows: [["זרם נקוב", "1000 A"], ["כושר ניתוק", "25 kA"]] },
  bus: { code: "BUS", name: "לוח חלוקה ראשי", rows: [["מתח נקוב", "400 V"], ["זרם נקוב", "1250 A"]] },
  q1: { code: "BRE", name: "Q1 · תאורה", rows: [["זרם נקוב", "63 A"], ["כושר ניתוק", "10 kA"]] },
  q2: { code: "BRE", name: "Q2 · מיזוג אוויר", rows: [["זרם נקוב", "125 A"], ["כושר ניתוק", "25 kA"]] },
  q3: { code: "BRE", name: "Q3 · משאבות", rows: [["זרם נקוב", "80 A"], ["כושר ניתוק", "25 kA"]] },
  l1: { code: "LOA", name: "עומס תאורה", rows: [["הספק", "25 kVA"], ["cos φ", "0.95"]] },
  l2: { code: "LOA", name: "עומס מיזוג אוויר", rows: [["הספק", "60 kVA"], ["cos φ", "0.85"]] },
  l3: { code: "LOA", name: "עומס משאבות", rows: [["הספק", "40 kVA"], ["cos φ", "0.8"]] },
};

const INITIAL: Record<BreakerId, BreakerState> = { q0: "closed", q1: "closed", q2: "closed", q3: "closed" };

interface LogEntry {
  id: number;
  time: string;
  text: string;
  tone: "ok" | "warn" | "fault";
}

const now = () => new Date().toLocaleTimeString("he-IL", { hour12: false });

export function BlueGridWidget() {
  const [mode, setMode] = useState<Mode>("sim");
  const [breakers, setBreakers] = useState(INITIAL);
  const [selected, setSelected] = useState<CompId>("tx");
  const [log, setLog] = useState<LogEntry[]>([]);

  const sim = mode === "sim";
  const busLive = sim && breakers.q0 === "closed";
  const feederLive = (b: BreakerId) => busLive && breakers[b] === "closed";

  const t = useMemo(() => {
    const kva = FEEDERS.reduce((s, f) => s + (busLive && breakers[f.breaker] === "closed" ? f.kva : 0), 0);
    const volts = busLive ? 400 * (1 - 0.0055 * (kva / 125)) : 0;
    const amps = busLive ? (kva * 1000) / (Math.sqrt(3) * volts) : 0;
    return { kva, volts, amps };
  }, [busLive, breakers]);

  const addLog = (text: string, tone: LogEntry["tone"]) =>
    setLog((l) => [{ id: Date.now() + Math.random(), time: now(), text, tone }, ...l].slice(0, 6));

  const operate = (id: BreakerId) => {
    const state = breakers[id];
    const label = id === "q0" ? "מפסק ראשי" : id.toUpperCase();
    const next: BreakerState = state === "closed" ? "open" : state === "trip" ? "open" : "closed";
    setBreakers((b) => ({ ...b, [id]: next }));
    addLog(
      state === "trip" ? `${label}: איפוס לאחר ניתוק (פתוח)` : next === "open" ? `${label}: פתיחה` : `${label}: סגירה`,
      next === "closed" ? "ok" : "warn",
    );
  };

  const fault = (f: (typeof FEEDERS)[number]) => {
    if (!feederLive(f.breaker)) return;
    setBreakers((b) => ({ ...b, [f.breaker]: "trip" }));
    addLog(`${f.breaker.toUpperCase()}: ניתוק (TRIP), קצר בעומס ${f.name}`, "fault");
  };

  const click = (id: CompId) => {
    if (!sim) {
      setSelected(id);
      return;
    }
    if (id === "q0" || id === "q1" || id === "q2" || id === "q3") operate(id);
    const feeder = FEEDERS.find((f) => f.load === id);
    if (feeder) fault(feeder);
  };

  const reset = () => {
    setBreakers(INITIAL);
    setLog([]);
  };

  // Wire colours
  const wire = (live: boolean, mv = false) => (!sim ? EDIT_STROKE : live ? (mv ? COLOR_22KV : COLOR_400V) : DEAD_SIM);
  const flow = (live: boolean) => (sim && live ? "animate-bg-flow" : undefined);
  const dash = (live: boolean) => (sim && live ? "10 5" : undefined);

  const interactive = (id: CompId, label: string) => ({
    role: "button" as const,
    tabIndex: 0,
    "aria-label": label,
    onClick: () => click(id),
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        click(id);
      }
    },
    className: "cursor-pointer outline-none [&:focus-visible>.hit]:stroke-sky-400",
  });

  const selBox = (id: CompId, x: number, y: number, w: number, h: number) =>
    !sim && selected === id ? <rect x={x} y={y} width={w} height={h} fill="none" stroke={SELECT} strokeDasharray="4" /> : null;

  const breaker = ({ id, x, y, live, label, rating }: { id: BreakerId; x: number; y: number; live: boolean; label: string; rating: string }) => {
    const state = breakers[id];
    const stroke = !sim ? EDIT_STROKE : state === "trip" ? "#ef4444" : live ? COLOR_400V : EDIT_STROKE;
    const w = 20;
    const h = 32;
    return (
      <g {...interactive(id, `${label}: ${state === "closed" ? "סגור" : state === "trip" ? "נפל" : "פתוח"}`)}>
        <rect x={x - 6} y={y - 4} width={w + 44} height={h + 10} fill="transparent" />
        {selBox(id, x - 5, y - 5, w + 10, h + 10)}
        <rect className="hit" x={x} y={y} width={w} height={h} rx="4" fill={sim && live ? stroke : "#1e293b"} fillOpacity={sim && live ? 0.2 : 1} stroke={stroke} strokeWidth={sim && live ? 3 : 2} />
        <rect x={x + w / 2 - 4} y={y + h / 2 - 4} width="8" height="8" fill={state === "closed" ? stroke : state === "trip" ? "red" : "none"} stroke={stroke} />
        {state !== "closed" && <path d={`M${x + w / 2},${y + h / 2 + 10} L${x + w / 2 + 10},${y + h / 2 - 10}`} stroke={state === "trip" ? "red" : stroke} strokeWidth="2" />}
        <text x={x + w + 6} y={y + 12} fill="#e2e8f0" fontSize="10" fontWeight="700" direction="ltr">
          {id === "q0" ? "Q0" : id.toUpperCase()}
        </text>
        <text x={x + w + 6} y={y + 24} fill="#93c5fd" fontSize="8" direction="ltr">
          {rating}
        </text>
        {sim && state === "trip" && (
          <text x={x + w / 2} y={y + h + 12} textAnchor="middle" fill="red" fontSize="8" fontWeight="700">
            TRIP
          </text>
        )}
      </g>
    );
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/70 bg-[#070b17] text-slate-100 shadow-2xl">
      {/* Floating glass toolbars, as in Blue Grid */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 bg-[#0b1224]/90 px-2.5 py-2 backdrop-blur">
        <div className="flex items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-900/70 px-2.5 py-1.5">
          <span className="grid size-7 place-items-center rounded-lg bg-blue-600 shadow-[0_0_14px_rgba(37,99,235,0.6)]">
            <Zap className="size-4 fill-white text-white" aria-hidden />
          </span>
          <span dir="ltr" className="hidden text-sm font-black whitespace-nowrap italic min-[420px]:inline">
            Blue Grid <span className="text-[9px] font-medium text-slate-400 not-italic">lite</span>
          </span>
          <span className="hidden border-s border-slate-700 ps-2 text-xs font-bold text-slate-300 sm:inline">רשת חלוקה לדוגמה</span>
        </div>

        <div role="radiogroup" aria-label="מצב עבודה" className="flex items-center gap-1 rounded-xl border border-slate-700/70 bg-slate-900/70 p-1">
          <button
            type="button"
            role="radio"
            aria-checked={!sim}
            onClick={() => {
              // As in Blue Grid, leaving SIM wipes the simulation state.
              setMode("edit");
              reset();
            }}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${!sim ? "bg-blue-600/25 text-blue-300" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Settings className="size-3.5" aria-hidden />
            עריכה
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={sim}
            onClick={() => setMode("sim")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold transition-colors ${sim ? "bg-emerald-500/15 text-emerald-400" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Play className={`size-3.5 ${sim ? "fill-emerald-400" : ""}`} aria-hidden />
            סימולציה
          </button>
        </div>

        <button
          type="button"
          onClick={reset}
          aria-label="איפוס הרשת"
          title="איפוס"
          className="grid size-9 place-items-center rounded-xl border border-slate-700/70 bg-slate-900/70 text-slate-300 hover:text-white"
        >
          <RotateCcw className="size-4" aria-hidden />
        </button>
      </div>

      {/* Canvas */}
      <div className="bg-[linear-gradient(rgba(148,163,184,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.07)_1px,transparent_1px)] bg-[size:20px_20px]">
        <p className="px-3 pt-2 text-[11px] text-slate-400">
          {sim ? "לחצו על מפסק כדי למתג · לחצו על עומס כדי ליצור בו קצר" : "מצב עריכה: לחצו על רכיב כדי לראות את המאפיינים שלו"}
        </p>
        <svg viewBox="96 14 408 322" className="h-auto w-full select-none [direction:ltr]" role="group" aria-label="דיאגרמה חד־קווית של Blue Grid">
          {/* Grid source (T-bar) */}
          <g {...interactive("grid", "רשת חשמל 22kV")}>
            <rect x="276" y="18" width="100" height="42" fill="transparent" />
            {selBox("grid", 272, 22, 56, 40)}
            <path className="hit" d="M300,58 L300,28 M282,28 L318,28" fill="none" stroke={wire(sim, true)} strokeWidth={sim ? 3 : 2} />
            <text x="324" y="32" fill="#e2e8f0" fontSize="10" fontWeight="700">
              רשת חשמל
            </text>
            <text x="324" y="44" fill="#93c5fd" fontSize="8" direction="ltr">
              22kV
            </text>
          </g>
          <line x1="300" y1="58" x2="300" y2="66" stroke={wire(sim, true)} strokeWidth={sim ? 3 : 2} strokeDasharray={dash(sim)} className={flow(sim)} />

          {/* Transformer (P/S rings) */}
          <g {...interactive("tx", "שנאי 630kVA")}>
            <rect x="284" y="64" width="116" height="58" fill="transparent" />
            {selBox("tx", 280, 62, 40, 64)}
            <circle className="hit" cx="300" cy="80" r="13" fill="none" stroke={wire(sim, true)} strokeWidth={sim ? 3 : 2} />
            <text x="300" y="83.5" textAnchor="middle" fill={wire(sim, true)} fontSize="10" fontWeight="700">
              P
            </text>
            <circle cx="300" cy="106" r="13" fill="none" stroke={wire(sim)} strokeWidth={sim ? 3 : 2} />
            <text x="300" y="109.5" textAnchor="middle" fill={wire(sim)} fontSize="10" fontWeight="700">
              S
            </text>
            <text x="320" y="90" fill="#e2e8f0" fontSize="10" fontWeight="700">
              שנאי
            </text>
            <text x="320" y="102" fill="#93c5fd" fontSize="8" direction="ltr">
              630kVA · 22/0.4kV
            </text>
          </g>
          <line x1="300" y1="119" x2="300" y2="132" stroke={wire(sim)} strokeWidth={sim ? 3 : 2} strokeDasharray={dash(sim)} className={flow(sim)} />

          {breaker({ id: "q0", x: 290, y: 132, live: sim, label: "מפסק ראשי", rating: "1000A" })}
          <line x1="300" y1="164" x2="300" y2="186" stroke={wire(busLive)} strokeWidth={busLive ? 3 : 2} strokeDasharray={dash(busLive)} className={flow(busLive)} />

          {/* Busbar */}
          <g {...interactive("bus", "לוח חלוקה ראשי")}>
            <rect x="105" y="168" width="390" height="26" fill="transparent" />
            {selBox("bus", 105, 178, 390, 16)}
            <line className="hit" x1="110" y1="186" x2="490" y2="186" stroke={busLive ? COLOR_400V : sim ? DEAD_SIM : "#cbd5e1"} strokeWidth="7" strokeLinecap="round" />
            {Array.from({ length: 19 }, (_, i) => (
              <circle key={i} cx={116 + i * 20.5} cy="186" r="2" fill={busLive ? "#fff1f2" : "#94a3b8"} />
            ))}
            <text x="300" y="176" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="700">
              לוח חלוקה ראשי
            </text>
          </g>

          {/* Feeders */}
          {FEEDERS.map((f) => {
            const live = feederLive(f.breaker);
            const loadStroke = !sim ? EDIT_STROKE : live ? COLOR_400V : breakers[f.breaker] === "trip" ? "#ef4444" : DEAD_SIM;
            return (
              <g key={f.breaker}>
                <line x1={f.x} y1="186" x2={f.x} y2="212" stroke={wire(busLive)} strokeWidth={busLive ? 3 : 2} strokeDasharray={dash(busLive)} className={flow(busLive)} />
                {breaker({ id: f.breaker, x: f.x - 10, y: 212, live: busLive, label: `מפסק ${f.breaker.toUpperCase()}`, rating: `${f.rating}A` })}
                <line x1={f.x} y1="244" x2={f.x} y2="276" stroke={wire(live)} strokeWidth={live ? 3 : 2} strokeDasharray={dash(live)} className={flow(live)} />
                <g {...interactive(f.load, `עומס ${f.name} ${f.kva}kVA`)}>
                  <rect x={f.x - 36} y={271} width={72} height={62} fill="transparent" />
                  {selBox(f.load, f.x - 18, 271, 36, 38)}
                  <path
                    className="hit"
                    d={`M${f.x - 13},276 L${f.x + 13},276 L${f.x},302 Z`}
                    fill={sim && live ? COLOR_400V : "#1e293b"}
                    fillOpacity={sim && live ? 0.2 : 1}
                    stroke={loadStroke}
                    strokeWidth={sim && live ? 3 : 2}
                  />
                  <text x={f.x} y="286" textAnchor="middle" fill={loadStroke} fontSize="6" direction="ltr">
                    Load
                  </text>
                  <text x={f.x} y="318" textAnchor="middle" fill="#e2e8f0" fontSize="9" fontWeight="700">
                    {f.name}
                  </text>
                  <text x={f.x} y="329" textAnchor="middle" fill="#93c5fd" fontSize="8" direction="ltr">
                    {f.kva}kVA
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Side panels, stacked under the canvas */}
      <div className="grid gap-2.5 border-t border-slate-800 bg-[#0b1224] p-2.5 sm:grid-cols-2">
        {sim ? (
          <>
            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <Activity className="size-3.5 text-blue-400" aria-hidden />
                נתוני חשמל חיים
              </h3>
              <div className="grid grid-cols-2 gap-1.5">
                <Tile label="מתח" value={t.volts.toFixed(1)} unit="V" />
                <Tile label="זרם" value={t.amps.toFixed(1)} unit="A" />
                <Tile label="תדר" value={busLive ? "50.00" : "0.00"} unit="Hz" />
                <Tile label="הספק" value={String(t.kva)} unit="kVA" />
              </div>
            </section>
            <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5" aria-live="polite">
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-200">
                <ClipboardList className="size-3.5 text-blue-400" aria-hidden />
                יומן מיתוגים
              </h3>
              {log.length === 0 ? (
                <p className="py-4 text-center text-[11px] text-slate-500">היומן ריק. בצעו פעולת מיתוג כדי להוסיף שורה.</p>
              ) : (
                <ol className="max-h-[92px] space-y-1 overflow-y-auto text-[11px]">
                  {log.map((e) => (
                    <li key={e.id} className="flex items-center gap-2">
                      <span dir="ltr" className="font-mono text-slate-500">
                        {e.time}
                      </span>
                      <span className={e.tone === "fault" ? "text-rose-400" : e.tone === "warn" ? "text-amber-300" : "text-emerald-400"}>{e.text}</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        ) : (
          <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-2.5 sm:col-span-2">
            <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-200">
              <Settings className="size-3.5 text-blue-400" aria-hidden />
              מאפייני בחירה
              <span dir="ltr" className="ms-auto rounded-md border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                {PROPS[selected].code}
              </span>
            </h3>
            <p className="mb-2 text-sm font-bold text-white">{PROPS[selected].name}</p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {PROPS[selected].rows.map(([k, v]) => (
                <div key={k} className="rounded-lg border border-slate-800 bg-[#070b17] px-2 py-1.5">
                  <div className="text-[10px] text-slate-400">{k}</div>
                  <div dir="ltr" className="text-end font-mono text-xs font-bold text-slate-100">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <Link
        href="/products"
        className="flex items-center justify-center gap-1 border-t border-slate-800 bg-[#070b17] px-3 py-2 text-center text-xs font-bold text-blue-300 transition-colors hover:text-blue-200"
      >
        Blue Grid המלא: 40+ רכיבים, זרמי קצר, תיאום הגנות ופקודות מיתוג
        <ChevronLeft className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function Tile({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-[#070b17] px-2 py-1.5">
      <div className="text-[10px] text-slate-400">{label}</div>
      <div dir="ltr" className="text-end font-mono text-sm font-bold text-white">
        {value}
        <span className="text-[10px] text-blue-400">{unit}</span>
      </div>
    </div>
  );
}
