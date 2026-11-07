import Link from "next/link";
import { BrandEmblem } from "./home/EngineeringIcons";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Electricademy – דף הבית">
      <BrandEmblem className="size-10 transition-transform duration-200 group-hover:scale-105" />
      <span className="flex flex-col leading-tight">
        <span dir="ltr" className="text-end text-lg font-black tracking-tight">
          Electricademy
        </span>
        <span className="hidden text-[11px] font-medium text-slate-500 sm:block dark:text-slate-400">לומדים חשמל, מאפס ועד מומחיות</span>
      </span>
    </Link>
  );
}
