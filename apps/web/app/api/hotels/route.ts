import { NextResponse } from "next/server";
``
import { adminDb } from "@/lib/firebaseAdmin";;

export async function GET() {
  // initAdmin auto-initialized
  const db = adminDb;

  try {
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", "approved")
      .get();

    const hotels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
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
