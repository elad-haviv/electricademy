import Link from "next/link";
import { BrandEmblem } from "./home/EngineeringIcons";

export function Logo() {
  return (
    <Link href="/" className="group flex min-w-0 items-center gap-2 min-[360px]:gap-2.5">
      <BrandEmblem className="size-10 transition-transform duration-200 group-hover:scale-105" />
      <span className="flex flex-col leading-tight">
        <span dir="ltr" className="text-end text-base font-black tracking-tight min-[360px]:text-lg">
          Electricademy
        </span>
        <span className="sr-only">דף הבית</span>
        <span aria-hidden className="hidden text-[11px] font-medium text-slate-500 sm:block dark:text-slate-400">לומדים חשמל, מאפס ועד מומחיות</span>
      </span>
    </Link>
  );
}
