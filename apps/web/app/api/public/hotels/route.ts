import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";

// 1. Force dynamic (No caching) so new approvals show instantly
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  await initAdmin();
  const db = getFirestore();

  try {
    // 2. Fetch ONLY 'APPROVED' (Uppercase) hotels
    const snapshot = await db
      .collection("hotels")
      .where("status", "==", "APPROVED")
      .get();

    const hotels = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 3. (Optional) Debug Log to see what's happening in your terminal
    console.log(`Public API found ${hotels.length} approved hotels.`);

    return NextResponse.json({ hotels });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
