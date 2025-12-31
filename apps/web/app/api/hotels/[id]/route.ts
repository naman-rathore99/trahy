import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await initAdmin();
    const db = getFirestore();

    let docSnap;
    let finalId = id;

    // 1. Try to fetch directly by ID
    const docRef = db.collection("hotels").doc(id);
    docSnap = await docRef.get();

    // 2. If not found by ID, try finding by "slug"
    if (!docSnap.exists) {
      console.log(`Not a direct ID. Searching for slug: ${id}`);
      const querySnap = await db.collection("hotels").where("slug", "==", id).limit(1).get();
      
      if (!querySnap.empty) {
        docSnap = querySnap.docs[0];
        finalId = docSnap.id; // Get the REAL ID
      } else {
        return NextResponse.json({ error: "Hotel not found" }, { status: 404 });
      }
    }

    // Return the hotel data + the REAL ID (crucial for fetching rooms later)
    return NextResponse.json({
      hotel: {
        id: finalId, // Always return the real database ID
        ...docSnap.data(),
      },
    });
  } catch (error) {
    console.error("Get Hotel Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}