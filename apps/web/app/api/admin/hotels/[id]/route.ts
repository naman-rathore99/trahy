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

    // Return the hotel data
    return NextResponse.json({
      hotel: { id: docSnap.id, ...docSnap.data() },
    });
  } catch (error) {
    console.error("Error fetching hotel:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Update Hotel (PUT)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await initAdmin();
  const db = getFirestore();
  const { id } = await params;
  const body = await request.json();

  try {
    await db
      .collection("hotels")
      .doc(id)
      .update({
        ...body,
        updatedAt: new Date(),
      });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating hotel:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
