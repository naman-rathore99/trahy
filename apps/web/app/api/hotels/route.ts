import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET() {
  await initAdmin();
  const db = getFirestore();

  try {
    // Fetch ALL properties for the homepage
    const propertiesSnap = await db.collection("hotels").get();

    const properties = propertiesSnap.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ properties });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch properties" },
      { status: 500 }
    );
  }
}