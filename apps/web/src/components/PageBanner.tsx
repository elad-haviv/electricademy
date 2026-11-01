import Image from "next/image";
import type { ReactNode } from "react";

/** Page header with a 3D render on a deep-navy panel. Text sits at the start (right in RTL). */
export function PageBanner({
  title,
  subtitle,
  image,
  eyebrow,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  image: string;
  eyebrow?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="relative mb-8 grid overflow-hidden rounded-3xl bg-navy-900 text-white shadow-(--shadow-raised) md:grid-cols-[1.25fr_1fr]">
      <div className="relative z-10 flex flex-col justify-center gap-3 p-6 sm:p-10">
        {eyebrow}
        <h1 className="text-3xl leading-tight font-extrabold tracking-tight sm:text-[2.5rem]">{title}</h1>
        {subtitle && <p className="max-w-xl text-base leading-relaxed text-brand-100 sm:text-lg">{subtitle}</p>}
        {children}
      </div>
      <div className="relative order-first aspect-[16/7] md:order-none md:aspect-auto md:min-h-64">
        <Image src={image} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" priority />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-navy-900 via-navy-900/10 to-transparent md:bg-gradient-to-l md:from-navy-900 md:via-navy-900/10"
        />
      </div>
    </header>
  );
}
