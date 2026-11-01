import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

/** Locates the /content directory: CONTENT_DIR, or the nearest ancestor containing it. */
export function contentRoot(): string {
  if (process.env.CONTENT_DIR) return process.env.CONTENT_DIR;
  let dir = process.cwd();
  for (;;) {
    const candidate = path.join(dir, "content");
    if (fs.existsSync(path.join(candidate, "lessons"))) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) throw new Error("Could not locate the content directory; set CONTENT_DIR");
    dir = parent;
  }
}

export interface LessonFrontmatter {
  title: string;
  summary: string;
  minutes: number;
  /** Product slugs to promote contextually, e.g. ["blue-grid"]. */
  promote?: string[];
}

export interface LessonDoc {
  frontmatter: LessonFrontmatter;
  body: string;
}

const SAFE_SEGMENT = /^[a-z0-9-]+$/;

function readMdx<T>(file: string): { frontmatter: T; body: string } | null {
  if (!fs.existsSync(file)) return null;
  const { data, content } = matter(fs.readFileSync(file, "utf8"));
  return { frontmatter: data as T, body: content };
}

export function getLesson(track: string, module: string, lesson: string): LessonDoc | null {
  if (![track, module, lesson].every((s) => SAFE_SEGMENT.test(s))) return null;
  return readMdx<LessonFrontmatter>(path.join(contentRoot(), "lessons", track, module, `${lesson}.mdx`));
}

export function hasLesson(track: string, module: string, lesson: string): boolean {
  if (![track, module, lesson].every((s) => SAFE_SEGMENT.test(s))) return false;
  return fs.existsSync(path.join(contentRoot(), "lessons", track, module, `${lesson}.mdx`));
}

export type ArticleCategory = "power-systems" | "regulations" | "installations" | "innovation" | "news";

export const ARTICLE_CATEGORIES: Record<ArticleCategory, string> = {
  "power-systems": "מערכות הספק",
  regulations: "תקנות ותקינה",
  installations: "מתקנים",
  innovation: "חידושים",
  news: "חדשות",
};

export interface ArticleFrontmatter {
  title: string;
  summary: string;
  date: string;
  author: string;
  category: ArticleCategory;
}

export interface ArticleDoc extends ArticleFrontmatter {
  slug: string;
}

export function listArticles(): ArticleDoc[] {
  const dir = path.join(contentRoot(), "articles");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => {
      const slug = f.replace(/\.mdx$/, "");
      const doc = readMdx<ArticleFrontmatter>(path.join(dir, f))!;
      return { slug, ...doc.frontmatter, date: String(doc.frontmatter.date) };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getArticle(slug: string): { meta: ArticleDoc; body: string } | null {
  if (!SAFE_SEGMENT.test(slug)) return null;
  const doc = readMdx<ArticleFrontmatter>(path.join(contentRoot(), "articles", `${slug}.mdx`));
  return doc ? { meta: { slug, ...doc.frontmatter, date: String(doc.frontmatter.date) }, body: doc.body } : null;
}
