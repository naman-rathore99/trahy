import { MetadataRoute } from "next";
import { adminDb } from "@/lib/firebaseAdmin";;
``

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://shubhyatra.world";

  // 1. Static Pages
  const routes = ["", "/packages", "/join", "/login", "/destinations"].map(
    (route) => ({
      url: `${baseUrl}${route}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    })
  );

  // 2. Dynamic Hotel Pages (Fetch from Database)
  let hotelRoutes: any[] = [];
  try {
    // initAdmin auto-initialized
    const db = adminDb;
    const snapshot = await db.collection("hotels").get(); // Change "hotels" to your actual collection name

    hotelRoutes = snapshot.docs.map((doc) => ({
      url: `${baseUrl}/book/${doc.id}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("Sitemap Error:", error);
  }

  return [...routes, ...hotelRoutes];
}
