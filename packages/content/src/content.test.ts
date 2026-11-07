import { describe, expect, it } from "vitest";
import { allLessonPaths, getArticle, getLesson, getLessonMinutes, hasLesson, listArticles, TRACKS } from "./index";

describe("catalog", () => {
  it("has unique lesson paths", () => {
    const paths = allLessonPaths();
    expect(new Set(paths).size).toBe(paths.length);
  });
  it("uses url-safe slugs", () => {
    for (const p of allLessonPaths()) expect(p).toMatch(/^[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+$/);
    expect(TRACKS.length).toBeGreaterThan(0);
  });
});

describe("files", () => {
  it("loads a sample lesson with frontmatter", () => {
    const lesson = getLesson("basics", "circuits", "ohms-law");
    expect(lesson?.frontmatter.title).toBeTruthy();
    expect(lesson?.body.length).toBeGreaterThan(100);
  });
  it("reads lesson minutes, null when the lesson isn't written", () => {
    expect(getLessonMinutes("basics", "circuits", "ohms-law")).toBeGreaterThan(0);
    expect(getLessonMinutes("basics", "circuits", "series-parallel")).toBeNull();
  });
  it("parses the frontmatter of every written lesson", () => {
    for (const p of allLessonPaths()) {
      const [t, m, l] = p.split("/") as [string, string, string];
      if (!hasLesson(t, m, l)) continue;
      const lesson = getLesson(t, m, l);
      expect(lesson?.frontmatter.title, p).toBeTruthy();
      expect(lesson?.frontmatter.minutes, p).toBeGreaterThan(0);
    }
  });
  it("rejects path traversal", () => {
    expect(getLesson("..", "circuits", "ohms-law")).toBeNull();
    expect(getArticle("../secrets")).toBeNull();
  });
  it("lists articles newest first", () => {
    const articles = listArticles();
    expect(articles.length).toBeGreaterThan(0);
    const dates = articles.map((a) => a.date);
    expect([...dates].sort().reverse()).toEqual(dates);
  });
});
