import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await initAdmin();
  const db = getFirestore();

  try {
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", "APPROVED")
      .get();

    const hotels = snapshot.docs.map((doc) => {
      const data = doc.data();

      // 🔧 FIX: Handle both 'images' (Array) and 'imageUrl' (String)
      let imageList = [];

      if (Array.isArray(data.images) && data.images.length > 0) {
        // Case A: It's already a list
        imageList = data.images;
      } else if (data.imageUrl) {
        // Case B: It's a single string (Old format)
        imageList = [data.imageUrl];
      }

      return {
        id: doc.id,
        // ✅ Public Data
        name: data.name,
        location: data.location || data.address || "Mathura",
        city: data.city,
        images: imageList, // <--- Now guaranteed to be an Array
        price: data.price || data.pricePerNight || 0,
        rating: data.rating || 5,
        slug: data.slug || doc.id,
      };
    });

    return NextResponse.json({ hotels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
