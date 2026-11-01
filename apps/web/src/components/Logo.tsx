import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight" aria-label="Electricademy – דף הבית">
      <svg viewBox="0 0 64 64" className="size-8" aria-hidden>
        <rect width="64" height="64" rx="14" fill="#2574eb" />
        <path d="M36 6 16 36h13l-4 22 23-32H34z" fill="#facc15" />
      </svg>
      <span dir="ltr" className="text-lg">
        Electric<span className="text-brand-600 dark:text-brand-400">ademy</span>
      </span>
    </Link>
  );
}
