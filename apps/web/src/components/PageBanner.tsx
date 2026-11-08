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
    <header className="on-dark relative mb-8 grid overflow-hidden rounded-3xl bg-[#0d1a4a] text-white md:grid-cols-[1.2fr_1fr]">
      <div className="relative z-10 flex flex-col justify-center gap-2 p-6 sm:p-10">
        {eyebrow}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="max-w-xl text-brand-100">{subtitle}</p>}
        {children}
      </div>
      <div className="relative order-first aspect-[16/9] md:order-none md:aspect-auto md:min-h-64">
        <Image src={image} alt="" fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" priority />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#0d1a4a] via-transparent to-transparent md:bg-gradient-to-l md:from-[#0d1a4a] md:via-[#0d1a4a]/10" />
      </div>
    </header>
  );
}
