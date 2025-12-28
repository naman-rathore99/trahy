import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/"], // Protect Admin & API routes from Google
    },
    sitemap: "https://shubhyatra.world/sitemap.xml",
  };
}
