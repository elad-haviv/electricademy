import Link from "next/link";
import { buttonClass } from "@electricademy/ui";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <p className="text-6xl" aria-hidden>
        🔌
      </p>
      <h1 className="mt-4 text-3xl font-extrabold">המעגל פתוח, הדף לא נמצא</h1>
      <Link href="/" className={buttonClass("primary", "mt-6")}>
        לדף הבית
      </Link>
    </div>
  );
}
