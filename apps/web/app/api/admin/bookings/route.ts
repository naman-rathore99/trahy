import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await initAdmin();
  const db = getFirestore();
  const auth = getAuth();

  try {
    // 1. Fetch Hotel Bookings
    const bookingsSnap = await db.collection("bookings").orderBy("createdAt", "desc").get();

    // 2. Fetch Vehicle Bookings (The missing piece!)
    const vehiclesSnap = await db.collection("vehicle_bookings").orderBy("createdAt", "desc").get();

    // 3. Helper to look up User Name safely
    const getUserName = async (uid: string) => {
      if (!uid) return "Guest";
      try {
        const user = await auth.getUser(uid);
        return user.displayName || user.email || "Unknown User";
      } catch (e) {
        return "Unknown User";
      }
    };

    // 4. Process Hotel Data
    const hotelBookings = await Promise.all(bookingsSnap.docs.map(async (doc) => {
      const data = doc.data();
      const customerName = data.userName || await getUserName(data.userId); // Fallback lookup

      return {
        id: doc.id,
        type: "Hotel",
        sourceCollection: "bookings",
        ...data,
        // Standardized Fields for UI
        listingName: data.listingName || data.propertyName || "Hotel Booking",
        customerName: customerName,
        customerContact: data.userEmail || data.contactEmail || "N/A",
        amount: data.totalAmount || 0,
        date: data.checkIn || data.startDate, // Hotels use checkIn
        status: data.status || "pending",
        paymentStatus: data.paymentStatus || "pending",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    }));

    // 5. Process Vehicle Data
    const vehicleBookings = await Promise.all(vehiclesSnap.docs.map(async (doc) => {
      const data = doc.data();
      const customerName = data.userName || await getUserName(data.userId);

      return {
        id: doc.id,
        type: "Vehicle",
        sourceCollection: "vehicle_bookings",
        ...data,
        // Standardized Fields for UI
        listingName: data.vehicleName || "Vehicle Rental",
        customerName: customerName,
        customerContact: data.userEmail || data.contactEmail || "N/A",
        amount: data.totalPrice || data.totalAmount || 0,
        date: data.startDate, // Vehicles use startDate
        status: data.status || "pending",
        paymentStatus: data.paymentStatus || "pending",
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
      };
    }));

    // 6. Merge & Sort (Newest First)
    const allBookings = [...hotelBookings, ...vehicleBookings].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    return NextResponse.json({ bookings: allBookings });

  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}