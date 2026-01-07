import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await initAdmin();
  const db = getFirestore();

  try {
    // ✅ FIX: Change "APPROVED" to "approved" (lowercase) to match your database
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", "approved")
      .orderBy("createdAt", "desc") // Recommended: Sort by newest
      .get();

    const hotels = snapshot.docs.map((doc) => {
      const data = doc.data();

      // Handle both 'images' (Array) and 'imageUrl' (String)
      let imageList = [];

      if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
        imageList = data.imageUrls; // Use the standard plural name
      } else if (Array.isArray(data.images) && data.images.length > 0) {
        imageList = data.images;    // Fallback for older data
      } else if (data.imageUrl) {
        imageList = [data.imageUrl]; // Fallback for oldest data
      }

      return {
        id: doc.id,
        name: data.name,
        location: data.location || data.address || "Mathura",
        city: data.city,
        images: imageList,
        price: data.price || data.pricePerNight || 0,
        rating: data.rating || 5,
        slug: data.slug || doc.id,
        amenities: data.amenities || []
      };
    });

    return NextResponse.json({ hotels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}