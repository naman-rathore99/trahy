import { NextResponse } from "next/server";
import { app } from "@/lib/firebase";
import {
  getFirestore,
  collection,
  addDoc,
  doc,        // 🚨 ADDED
  getDoc,     // 🚨 ADDED
  serverTimestamp,
} from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getFirestore(app);

    const collectionName =
      body.vehicleId && !body.listingId ? "vehicle_bookings" : "bookings";

    // ====================================================================
    // 🚨 THE BULLETPROOF FIX: SECURE BACKEND LOOKUP FOR PARTNER ID
    // ====================================================================
    let resolvedPartnerId = body.partnerId;

    // If the frontend didn't send it, or sent "UNKNOWN", let's find it ourselves!
    if (!resolvedPartnerId || resolvedPartnerId === "UNKNOWN") {
      if (body.listingId) {
        const hotelRef = doc(db, "hotels", body.listingId);
        const hotelSnap = await getDoc(hotelRef);

        if (hotelSnap.exists()) {
          // Grab the ownerId directly from the database!
          resolvedPartnerId = hotelSnap.data().ownerId || "UNKNOWN";
          console.log(`🔍 Backend automatically matched partnerId: ${resolvedPartnerId}`);
        }
      }
    }

    // 2. Prepare Booking Data
    const bookingData = {
      ...body,
      partnerId: resolvedPartnerId || "UNKNOWN", // 🚨 Now it will definitely save the correct UID
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: body.status || "pending_payment",
    };

    // 3. Save to Firestore
    const docRef = await addDoc(collection(db, collectionName), bookingData);

    console.log(`✅ Booking Created in [${collectionName}]:`, docRef.id);

    // 4. Return the ID
    return NextResponse.json({
      success: true,
      bookingId: docRef.id,
      message: "Booking created successfully",
    });
  } catch (error: any) {
    console.error("❌ Booking Creation Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}