import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET() {
  await initAdmin();
  const db = getFirestore();

  try {
    // Fetch from the 'requests' collection (Make sure this collection exists in Firestore!)
    const snapshot = await db
      .collection("requests")
      .orderBy("createdAt", "desc")
      .get();

    const requests = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firebase Timestamps to readable dates
      createdAt: doc.data().createdAt?.toDate
        ? doc.data().createdAt.toDate()
        : new Date(),
    }));

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}
