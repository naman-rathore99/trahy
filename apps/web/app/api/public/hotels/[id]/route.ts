import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";;
``

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // initAdmin auto-initialized
    const db = adminDb;

    let docSnap;
    let finalId = id;

    // 1. Try to fetch directly by ID
    const docRef = db.collection("hotels").doc(id);
    docSnap = await docRef.get();

    // 2. If not found by ID, try finding by "slug"
    if (!docSnap.exists) {
      console.log(`Not a direct ID. Searching for slug: ${id}`);
      const querySnap = await db
        .collection("hotels")
        .where("slug", "==", id)
        .limit(1)
        .get();

      if (!querySnap.empty) {
        docSnap = querySnap.docs[0];
        finalId = docSnap.id; // Get the REAL ID
      } else {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }
    }

    const data = docSnap.data();

    // 3. FETCH ROOMS (Crucial Step!)
    // We use 'finalId' because 'id' might be a slug string
    const roomsSnap = await db
      .collection("hotels")
      .doc(finalId)
      .collection("rooms")
      .get();

    const rooms = roomsSnap.docs.map((r) => ({
      id: r.id,
      ...r.data(),
    }));

    // 4. Sanitize Hotel Data (Security)
    // Handle Image Array vs String fallback
    let imageList = [];
    if (Array.isArray(data?.images) && data.images.length > 0) {
      imageList = data.images;
    } else if (data?.imageUrl) {
      imageList = [data.imageUrl];
    }

    const safeHotel = {
      id: finalId,
      name: data?.name,
      description: data?.description,
      location: data?.location || data?.address || "Mathura",
      city: data?.city,
      images: imageList, // Guaranteed Array
      price: data?.price || data?.pricePerNight || 0,
      amenities: data?.amenities || [],
      rating: data?.rating || 5,
      slug: data?.slug || finalId,
    };

    // Return Hotel + Rooms in one call
    return NextResponse.json({
      hotel: safeHotel,
      rooms: rooms,
    });
  } catch (error: any) {
    console.error("Get Hotel Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
