import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { initAdmin } from "@/lib/firebaseAdmin";
import { headers } from "next/headers";

export async function GET() {
  await initAdmin();
  const db = getFirestore();
  const auth = getAuth();

  try {
    const headerList = await headers();
    const authHeader = headerList.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ user: null });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // OPTIMIZATION: Run both DB queries at the same time
    const [propertySnap, vehicleSnap] = await Promise.all([
      db.collection("hotels").where("ownerId", "==", userId).limit(1).get(),
      db.collection("vehicles").where("ownerId", "==", userId).limit(1).get(),
    ]);

    return NextResponse.json({
      user: {
        uid: userId,
        email: decodedToken.email,
        name: decodedToken.name || null, // Good to pass name if available
        picture: decodedToken.picture || null, // Pass profile pic if available
        role: decodedToken.role || "user",
        hasProperty: !propertySnap.empty,
        hasVehicle: !vehicleSnap.empty,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    // Returning 401 might be better for debugging, but returning null (200) is fine for soft failures
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
