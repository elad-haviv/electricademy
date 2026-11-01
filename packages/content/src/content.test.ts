import { describe, expect, it } from "vitest";
import { allLessonPaths, getArticle, getLesson, listArticles, TRACKS } from "./index";

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
