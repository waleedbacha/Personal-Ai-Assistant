import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/_next/"], // Block APIs and Next.js internal files
    },
    sitemap: "https://personal-ai-assistant-theta-self.vercel.app/sitemap.xml",
  };
}
