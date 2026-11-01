import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:opacity-50 disabled:pointer-events-none";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-sm",
  secondary:
    "bg-white text-slate-900 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700",
  ghost: "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
};

export function buttonClass(variant: ButtonVariant = "primary", className?: string): string {
  return cn(buttonBase, buttonVariants[variant], className);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { variant?: ButtonVariant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function Card({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      className={cn(
        "rounded-(--radius-card) bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800",
        className,
      )}
      {...props}
    />
  );
}

type BadgeTone = "neutral" | "brand" | "pro" | "success";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  brand: "bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-200",
  pro: "bg-spark-300 text-slate-900",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
};

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone])}>
      {children}
    </span>
  );
}

type CalloutType = "tip" | "note" | "warning";

const calloutStyles: Record<CalloutType, { icon: string; className: string }> = {
  tip: { icon: "💡", className: "bg-brand-50 ring-brand-200 dark:bg-brand-950/50 dark:ring-brand-900" },
  note: { icon: "📝", className: "bg-slate-50 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" },
  warning: { icon: "⚠️", className: "bg-amber-50 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-900" },
};

export function Callout({ type = "note", children }: { type?: CalloutType; children: ReactNode }) {
  const style = calloutStyles[type];
  return (
    <aside className={cn("my-6 flex gap-3 rounded-xl p-4 ring-1 [&>div>p]:my-0", style.className)}>
      <span aria-hidden className="text-xl leading-7">
        {style.icon}
      </span>
      <div>{children}</div>
    </aside>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {subtitle && <p className="mt-1 text-slate-600 dark:text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
