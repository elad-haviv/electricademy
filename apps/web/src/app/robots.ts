import type { MetadataRoute } from "next";

/**
 * The license-exam bank is for signed-in members (see "Content protection" in docs/ARCHITECTURE.md):
 * crawlers keep away from its pages and from the API. The /license-exam landing page stays indexable.
 * The pages also send noindex, for crawlers that ignore robots.txt but honour meta tags.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/license-exam/exam", "/license-exam/practice", "/license-exam/browse", "/license-exam/q/"],
      },
    ],
  };
}
