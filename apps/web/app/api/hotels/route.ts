import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET() {
  await initAdmin();
  const db = getFirestore();

  try {
    // 1. Fetch ONLY "approved" hotels (Public shouldn't see drafts)
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", "approved")
      .get();

    const hotels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure price is a number for math/sorting
      price: Number(doc.data().pricePerNight) || 0,
    }));

    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("Error fetching public hotels:", error);
    return NextResponse.json(
      { error: "Failed to fetch hotels" },
      { status: 500 }
    );
  }
}
