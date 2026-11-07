import Link from "next/link";
import type { Metadata } from "next";
import { ExamSimulator } from "@/components/license-exam/ExamSimulator";
import { bankSummary, EXAM_SIZE } from "@/lib/licenseExam";

export const metadata: Metadata = {
  title: "סימולציית בחינת רישוי",
  description: "50 שאלות אקראיות מהמאגר הרשמי של משרד העבודה, לפי סוג הרישיון: טכנאי, הנדסאי או מהנדס.",
};

export default function ExamPage() {
  const { meta, perLevel } = bankSummary();
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <nav aria-label="פירורי לחם" className="text-sm text-brand-700 dark:text-brand-300">
        <Link href="/license-exam">סימולטור בחינות רישוי</Link> / סימולציית בחינה
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight">סימולציית בחינה</h1>
      <ExamSimulator poolSizes={perLevel} examSize={EXAM_SIZE} bankVersion={meta.version} />
    </div>
  );
}
