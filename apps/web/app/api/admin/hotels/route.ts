import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function GET() {
  try {
    await initAdmin();
    const db = getFirestore();

    // Fetch all hotels
    const snapshot = await db.collection("hotels").get();

    const hotels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ hotels });
  } catch (error) {
    console.error("Admin Hotels API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
