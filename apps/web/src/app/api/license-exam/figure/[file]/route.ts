import fs from "node:fs/promises";
import path from "node:path";
import { FIGURE_FILE, verifyFigure } from "@electricademy/auth/content-guard";
import { contentRoot } from "@electricademy/content";
import { isDemoFigure } from "@/lib/licenseExam";

/**
 * GET /api/license-exam/figure/<file>?e=<expiry>&s=<signature>
 * Serves a bank figure from content/license-exam/figures (they are not in public/). Pages that passed the
 * sign-in and the content limits hand out URLs signed with AUTH_SECRET (lib/licenseExam.ts, figureUrl);
 * the home-page demo questions' figures need no signature. Anything else is a 404, so the endpoint does
 * not even confirm which file names exist.
 */
export async function GET(request: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  if (!FIGURE_FILE.test(file)) return notFound();

  const demo = isDemoFigure(file);
  const url = new URL(request.url);
  const exp = Number(url.searchParams.get("e"));
  if (!demo && !verifyFigure(file, exp, url.searchParams.get("s") ?? "", process.env.AUTH_SECRET ?? "")) return notFound();

  const body = await fs.readFile(path.join(contentRoot(), "license-exam", "figures", file)).catch(() => null);
  if (!body) return notFound();
  const maxAge = demo ? 86_400 : Math.max(0, Math.min(exp - Math.floor(Date.now() / 1000), 86_400));
  return new Response(new Uint8Array(body), {
    headers: {
      "Content-Type": "image/webp",
      // signed URLs stay in this browser only; shared caches (Cloudflare) do not keep them
      "Cache-Control": demo ? `public, max-age=${maxAge}` : `private, max-age=${maxAge}`,
      "X-Robots-Tag": "noindex, noimageindex",
      "X-Content-Type-Options": "nosniff",
      // other sites cannot embed the figures
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
