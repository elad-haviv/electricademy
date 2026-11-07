/**
 * Line-art engineering icons (transformer coils, sine waves, busbars, earthing, pylons).
 * Drawn for a light chip background; they are always rendered on white.
 */

export function BrandEmblem({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="42" height="42" rx="10" className="fill-slate-900 stroke-spark-500" strokeWidth="2.5" />
      <path d="M14 15C17.5 15 17.5 21 14 21C17.5 21 17.5 27 14 27C17.5 27 17.5 33 14 33" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M34 15C30.5 15 30.5 21 34 21C30.5 21 30.5 27 34 27C30.5 27 30.5 33 34 33" stroke="#38BDF8" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M26.5 11L19 25H25L21.5 37L30 22H24L26.5 11Z" fill="#F59E0B" stroke="#FEF08A" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

const iconClass = "size-10";

function Basics() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <circle cx="24" cy="24" r="18" className="stroke-slate-300" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M8 24H14L17 18L21 30L25 18L29 30L32 24H40" className="stroke-amber-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="8" cy="24" r="2.5" className="fill-slate-800" />
      <circle cx="40" cy="24" r="2.5" className="fill-slate-800" />
      <path d="M20 11H28M24 7V15" className="stroke-sky-500" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Bagrut() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <rect x="8" y="10" width="32" height="28" rx="4" className="fill-slate-50 stroke-slate-800" strokeWidth="2.2" />
      <path d="M24 10V38" className="stroke-slate-300" strokeWidth="1.8" />
      <path d="M12 24C14 18 16 18 18 24C20 30 22 30 24 24" className="stroke-sky-500" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M28 19H36M28 24H36M28 29H33" className="stroke-amber-500" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function Technician() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <circle cx="20" cy="24" r="10" className="fill-white stroke-slate-800" strokeWidth="2.2" />
      <circle cx="29" cy="24" r="10" className="fill-amber-500/10 stroke-amber-500" strokeWidth="2.2" />
      <path d="M6 24H10M39 18H43M39 24H43M39 30H43" className="stroke-slate-800" strokeWidth="2.2" strokeLinecap="round" />
      <text x="15" y="27" className="fill-slate-900 font-mono text-[10px] font-bold">
        3~
      </text>
    </svg>
  );
}

function Academic() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <path d="M8 14H40" className="stroke-slate-900" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M16 14V26M32 14V26" className="stroke-slate-700" strokeWidth="2.2" />
      <circle cx="16" cy="31" r="5" className="fill-sky-50 stroke-sky-500" strokeWidth="2.2" />
      <path d="M13.5 31C14.5 28.5 15.5 28.5 16 31C16.5 33.5 17.5 33.5 18.5 31" className="stroke-sky-600" strokeWidth="1.6" />
      <rect x="27" y="26" width="10" height="10" rx="2" className="fill-amber-50 stroke-amber-500" strokeWidth="2.2" />
      <path d="M30 34L34 28M34 28H30.5M34 28V31.5" className="stroke-amber-600" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Licensing() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <path d="M24 6L38 12V23C38 32.5 31.8 39.8 24 42C16.2 39.8 10 32.5 10 23V12L24 6Z" className="fill-slate-50 stroke-slate-800" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M24 14V25M16 25H32M19 29.5H29M22 34H26" className="stroke-amber-500" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

function Professionals() {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={iconClass} aria-hidden>
      <path d="M24 6L15 40M24 6L33 40" className="stroke-slate-800" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M11 16H37M9 25H39" className="stroke-slate-800" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M18 16L24 25L30 16M16 25L24 36L32 25" className="stroke-slate-400" strokeWidth="1.6" />
      <circle cx="11" cy="19" r="2" className="fill-amber-500" />
      <circle cx="37" cy="19" r="2" className="fill-amber-500" />
      <circle cx="9" cy="28" r="2" className="fill-sky-500" />
      <circle cx="39" cy="28" r="2" className="fill-sky-500" />
    </svg>
  );
}

const TRACK_ICONS: Record<string, () => React.JSX.Element> = {
  basics: Basics,
  bagrut: Bagrut,
  technician: Technician,
  academic: Academic,
  licensing: Licensing,
  professionals: Professionals,
};

export function TrackIcon({ slug }: { slug: string }) {
  const Icon = TRACK_ICONS[slug] ?? Basics;
  return <Icon />;
}
