import { NextResponse } from "next/server";
import { app } from "@/lib/firebase";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = getFirestore(app);

    // 1. Determine Collection (Hotels vs Vehicles)
    // If it's a vehicle-only rental, it might go to 'vehicle_bookings', otherwise 'bookings'
    // For simplicity based on your flow, we'll put Hotel Stays (even with vehicle addons) in 'bookings'
    const collectionName =
      body.vehicleId && !body.listingId ? "vehicle_bookings" : "bookings";

    // 2. Prepare Booking Data
    const bookingData = {
      ...body,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: body.status || "pending_payment", // Default status
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
