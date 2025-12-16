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

    // If not logged in, just return user: null (Don't crash)
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ user: null });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // Check Permissions
    const propertySnap = await db
      .collection("properties")
      .where("ownerId", "==", userId)
      .limit(1)
      .get();
    const vehicleSnap = await db
      .collection("vehicles")
      .where("ownerId", "==", userId)
      .limit(1)
      .get();

    return NextResponse.json({
      user: {
        uid: userId,
        email: decodedToken.email,
        role: decodedToken.role || "user", // This allows admins in
        hasProperty: !propertySnap.empty,
        hasVehicle: !vehicleSnap.empty,
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    // Return null user on error so the frontend doesn't break completely
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
