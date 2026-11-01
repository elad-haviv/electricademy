import { listArticles } from "@electricademy/content";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);
}

export function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const items = listArticles()
    .map(
      (a) => `<item><title>${escapeXml(a.title)}</title><link>${origin}/articles/${a.slug}</link><guid>${origin}/articles/${a.slug}</guid><pubDate>${new Date(a.date).toUTCString()}</pubDate><description>${escapeXml(a.summary)}</description></item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Electricademy</title><link>${origin}</link><description>מאמרים וחדשות מעולם החשמל</description><language>he</language>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
