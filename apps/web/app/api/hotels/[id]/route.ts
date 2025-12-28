import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initAdmin();
    const db = getFirestore();
    const { id } = await params; // This is "vishal-hotel-mathura"

    console.log(`🔍 API Searching for: ${id}`);

    // STRATEGY 1: Check if this is a SLUG (The pretty name)
    // We query the "slug" field to see if it matches "vishal-hotel-mathura"
    const slugQuery = await db.collection("hotels")
      .where("slug", "==", id)
      .limit(1)
      .get();

    if (!slugQuery.empty) {
      const doc = slugQuery.docs[0];
      const hotelData = doc.data();

      // Security Check
      if (hotelData?.status !== "approved") {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }

      console.log("✅ Found by Slug");
      return NextResponse.json({
        hotel: { id: doc.id, ...hotelData },
      });
    }

    // STRATEGY 2: Check if this is a Document ID (The random code)
    // Fallback for old links or admin tools
    const docRef = db.collection("hotels").doc(id);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const hotelData = docSnap.data();

      // Security Check
      if (hotelData?.status !== "approved") {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }

      console.log("✅ Found by ID");
      return NextResponse.json({
        hotel: { id: docSnap.id, ...hotelData },
      });
    }

    console.log("❌ Not found");
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

  } catch (error) {
    console.error("Error fetching hotel:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}