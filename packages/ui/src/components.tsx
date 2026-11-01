import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";
import { IconAlert, IconBulb, IconChevronLeft, IconInfo } from "./icons";

/* ---------------------------------------------------------------- Buttons */

type ButtonVariant = "primary" | "secondary" | "ghost" | "spark" | "onDark";
type ButtonSize = "sm" | "md" | "lg";

// Every size keeps a ≥40px hit area; md/lg meet the 44px touch-target guideline.
const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:pointer-events-none select-none";

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-10 px-3 text-sm",
  md: "min-h-11 px-4 text-[0.95rem]",
  lg: "min-h-12 px-6 text-base",
};

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800",
  secondary:
    "bg-white text-slate-900 ring-1 ring-slate-300 hover:bg-slate-50 hover:ring-slate-400 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700",
  ghost: "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white",
  /** High-emphasis call to action, mainly on dark navy panels. */
  spark: "bg-spark-400 text-slate-950 shadow-sm hover:bg-spark-300 active:bg-spark-500",
  /** Secondary action on dark panels. */
  onDark: "bg-white/10 text-white ring-1 ring-white/30 backdrop-blur hover:bg-white/20",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string, size: ButtonSize = "md"): string {
  return cn(buttonBase, buttonSizes[size], buttonVariants[variant], className);
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, className, size)} {...props} />;
}

/* ---------------------------------------------------------------- Inputs */

export const inputClass =
  "block w-full min-h-11 rounded-xl bg-white px-3.5 py-2.5 text-base text-slate-900 ring-1 ring-slate-300 outline-none transition placeholder:text-slate-400 hover:ring-slate-400 focus:ring-2 focus:ring-brand-500 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:ring-slate-600";

export const labelClass = "mb-1.5 block text-sm font-semibold text-slate-800 dark:text-slate-200";

/* ---------------------------------------------------------------- Surfaces */

export function Card({
  className,
  interactive = false,
  ...props
}: ComponentPropsWithoutRef<"div"> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-(--radius-card) bg-white p-5 shadow-(--shadow-card) ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-800 sm:p-6",
        interactive &&
          "transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-(--shadow-raised) group-hover:ring-brand-300 group-focus-visible:ring-2 group-focus-visible:ring-brand-500 motion-reduce:group-hover:translate-y-0 dark:group-hover:ring-brand-700",
        className,
      )}
      {...props}
    />
  );
}

/* ---------------------------------------------------------------- Labels */

type BadgeTone = "neutral" | "brand" | "pro" | "success" | "warning";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200",
  pro: "bg-spark-300 text-slate-900",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  warning: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs leading-5 font-semibold whitespace-nowrap",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Small uppercase-style label above a heading. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm font-semibold text-brand-700 dark:text-brand-300", className)}>{children}</p>;
}

/* ---------------------------------------------------------------- Callouts */

type CalloutType = "tip" | "note" | "warning";

const calloutStyles: Record<CalloutType, { Icon: typeof IconInfo; label: string; className: string; iconClass: string }> = {
  tip: {
    Icon: IconBulb,
    label: "טיפ",
    className: "bg-brand-50 border-brand-500 dark:bg-brand-950/40",
    iconClass: "text-brand-600 dark:text-brand-300",
  },
  note: {
    Icon: IconInfo,
    label: "לתשומת לב",
    className: "bg-slate-100 border-slate-400 dark:bg-slate-900 dark:border-slate-600",
    iconClass: "text-slate-600 dark:text-slate-300",
  },
  warning: {
    Icon: IconAlert,
    label: "זהירות",
    className: "bg-amber-50 border-amber-500 dark:bg-amber-950/30",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
};

export function Callout({ type = "note", children }: { type?: CalloutType; children: ReactNode }) {
  const { Icon, label, className, iconClass } = calloutStyles[type];
  return (
    <aside className={cn("my-8 flex gap-3 rounded-xl border-s-4 p-4 sm:p-5 [&>div>p]:my-0", className)}>
      <Icon className={cn("mt-1 size-5 shrink-0", iconClass)} />
      <div>
        <p className="sr-only">{label}</p>
        {children}
      </div>
    </aside>
  );
}

/* ---------------------------------------------------------------- Headings */

export function SectionHeading({
  title,
  subtitle,
  action,
  as: Tag = "h2",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  as?: "h1" | "h2";
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="max-w-2xl">
        <Tag className={cn("font-extrabold tracking-tight text-slate-950 dark:text-white", Tag === "h1" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-[1.75rem]")}>
          {title}
        </Tag>
        {subtitle && <p className="mt-2 text-base text-slate-600 sm:text-lg dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------------------------------------------------------- Breadcrumbs */

/**
 * Accessible breadcrumb trail. Pass `href` for every crumb except the current page.
 * Takes a link renderer so the UI package does not depend on Next.js.
 */
export function Breadcrumbs({
  items,
  renderLink,
  className,
}: {
  items: { label: ReactNode; href?: string }[];
  renderLink: (href: string, label: ReactNode, className: string) => ReactNode;
  className?: string;
}) {
  return (
    <nav aria-label="פירורי לחם" className={cn("mb-4 text-sm", className)}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-slate-600 dark:text-slate-400">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={i} className="flex items-center gap-1">
              {item.href && !last ? (
                renderLink(
                  item.href,
                  item.label,
                  "rounded-md px-1 py-0.5 font-medium text-brand-700 underline-offset-4 hover:underline dark:text-brand-300",
                )
              ) : (
                <span aria-current={last ? "page" : undefined} className="px-1 font-medium text-slate-800 dark:text-slate-200">
                  {item.label}
                </span>
              )}
              {!last && <IconChevronLeft className="size-4 shrink-0 text-slate-400" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------------------------------------------------------------- Progress */

export function ProgressBar({ value, label, className }: { value: number; label: string; className?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn("h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", className)}
    >
      <div className="h-full rounded-full bg-gradient-to-l from-brand-500 to-brand-600 transition-[width] duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------------------------------------------------------------- Notices */

type NoticeTone = "success" | "warning" | "info";

const noticeTones: Record<NoticeTone, string> = {
  success: "bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-100 dark:ring-emerald-900",
  warning: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-900",
  info: "bg-brand-50 text-brand-900 ring-brand-200 dark:bg-brand-950/40 dark:text-brand-100 dark:ring-brand-900",
};

export function Notice({ tone = "info", children, className }: { tone?: NoticeTone; children: ReactNode; className?: string }) {
  return (
    <p role="status" className={cn("rounded-xl p-4 font-medium ring-1", noticeTones[tone], className)}>
      {children}
    </p>
  );
}

/* ---------------------------------------------------------------- Avatar */

/** Initial-letter avatar with a stable colour per name. */
export function Avatar({ name, className }: { name: string | null | undefined; className?: string }) {
  const text = (name ?? "?").trim() || "?";
  const palette = [
    "bg-brand-100 text-brand-800 dark:bg-brand-900 dark:text-brand-100",
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-100",
    "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100",
    "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-100",
    "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-100",
  ];
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold", palette[h % palette.length], className)}
    >
      {[...text][0]}
    </span>
  );
}
