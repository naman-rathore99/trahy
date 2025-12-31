import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

// 1. GET Single Hotel
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // ✅ Await params
    await initAdmin();
    const db = getFirestore();

    const docRef = db.collection("hotels").doc(id);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
    }

    // ✅ CORRECT: Returns a single "hotel" object
    return NextResponse.json({
      hotel: {
        id: docSnap.id,
        ...docSnap.data(),
      },
    });
  } catch (error) {
    console.error("Get Hotel Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// 2. PUT (Update) Hotel
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    await initAdmin();
    const db = getFirestore();

    // Remove 'id' from body to prevent overwriting document ID
    const { id: _, ...updateData } = body;

    await db
      .collection("hotels")
      .doc(id)
      .update({
        ...updateData,
        updatedAt: new Date(),
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update Hotel Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
