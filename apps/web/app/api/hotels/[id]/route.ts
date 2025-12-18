import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initAdmin();
  const db = getFirestore();
  const { id } = await params;

  try {
    const docRef = db.collection("hotels").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    const hotelData = docSnap.data();

    // 🔒 SECURITY CHECK:
    // If a hacker tries to guess the ID of a "banned" or "pending" hotel,
    // we pretend it doesn't exist.
    if (hotelData?.status !== "approved") {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json({
      hotel: { id: docSnap.id, ...hotelData },
    });
  } catch (error) {
    console.error("Error fetching hotel:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
