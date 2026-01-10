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

    let realId = id;

    // 1. Check if 'id' is a valid doc ID by trying to read it
    const docRef = db.collection("hotels").doc(id);
    const docSnap = await docRef.get();

    // 2. If document doesn't exist, it might be a SLUG. Search for it.
    if (!docSnap.exists) {
      console.log(`Resolving slug for rooms: ${id}`);
      const querySnap = await db
        .collection("hotels")
        .where("slug", "==", id)
        .limit(1)
        .get();
      if (!querySnap.empty) {
        realId = querySnap.docs[0].id; // Found the real ID!
      } else {
        console.log(`No hotel found for identifier: ${id}`);
        return NextResponse.json({ rooms: [] });
      }
    }

    // 3. Now fetch rooms using the REAL ID
    console.log(`Fetching rooms for Real ID: ${realId}`);

    const snapshot = await db
      .collection("hotels")
      .doc(realId)
      .collection("rooms")
      .orderBy("price", "asc")
      .get();

    const rooms = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ rooms });
  } catch (error) {
    console.error("Fetch Rooms Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}
