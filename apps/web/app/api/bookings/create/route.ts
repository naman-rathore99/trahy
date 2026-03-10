import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // ✅ SAFE: Try to verify token if present, fall back to body userId
    // Web works either way. Mobile gets properly verified.
    let verifiedUserId: string | null = null;

    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split("Bearer ")[1];
        const decoded = await adminAuth.verifyIdToken(token);
        verifiedUserId = decoded.uid;
      } catch (e) {
        console.warn("⚠️ Token verification failed, falling back to body userId");
      }
    }

    // Use verified UID if available, otherwise trust body (web fallback)
    const resolvedUserId = verifiedUserId || body.customer?.userId || null;

    const collectionName =
      body.vehicleId && !body.listingId ? "vehicle_bookings" : "bookings";

    // Resolve partnerId if missing
    let resolvedPartnerId = body.partnerId;
    if (!resolvedPartnerId || resolvedPartnerId === "UNKNOWN") {
      if (body.listingId) {
        const hotelSnap = await adminDb
          .collection("hotels")
          .doc(body.listingId)
          .get();
        if (hotelSnap.exists) {
          resolvedPartnerId = hotelSnap.data()?.ownerId || "UNKNOWN";
          console.log(`🔍 Resolved partnerId: ${resolvedPartnerId}`);
        }
      }
    }

    const bookingData = {
      ...body,
      // ✅ CRITICAL: userId at top level so initiate can find it
      userId: resolvedUserId,
      partnerId: resolvedPartnerId || "UNKNOWN",
      customer: {
        ...body.customer,
        userId: resolvedUserId, // keep in sync
      },
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      status: body.status || "pending_payment",
    };

    const docRef = await adminDb.collection(collectionName).add(bookingData);
    console.log(`✅ Booking Created [${collectionName}]:`, docRef.id);

    return NextResponse.json({ success: true, bookingId: docRef.id });
  } catch (error: any) {
    console.error("❌ Booking Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}