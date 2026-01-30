import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAuth } from "firebase-admin/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const db = adminDb;
  const auth = getAuth();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // =================================================================
  // CASE 1: FETCH SINGLE BOOKING (Invoice Page)
  // =================================================================
  if (id) {
    try {
      let docSnap = null;
      let type = "Hotel";

      // 1. Try Vehicle Bookings (Root Collection - Fast Direct Lookup)
      const vehicleDoc = await db.collection("vehicle_bookings").doc(id).get();

      if (vehicleDoc.exists) {
        docSnap = vehicleDoc;
        type = "Vehicle";
      } else {
        // 2. Try Hotel Bookings (Scan Strategy)
        // We fetch recent bookings (limit 500) and find the match in memory.
        // This avoids the "Odd number of segments" Firestore error.
        const hotelQuery = await db
          .collectionGroup("bookings")
          .orderBy("createdAt", "desc")
          .limit(500)
          .get();

        const foundDoc = hotelQuery.docs.find((doc) => doc.id === id);

        if (foundDoc) {
          docSnap = foundDoc;
          type = "Hotel";
        }
      }

      // If still not found after checking both
      if (!docSnap || !docSnap.exists) {
        return NextResponse.json(
          { error: "Booking not found" },
          { status: 404 },
        );
      }

      const data = docSnap.data();
      if (!data)
        return NextResponse.json({ error: "Empty Data" }, { status: 500 });

      // --- Smart User Lookup ---
      // If name is missing on the booking, fetch it from the User Profile
      let customerName = data.userName || data.customerName;
      let customerEmail = data.userEmail || data.contactEmail;
      let customerContact = data.phone || data.contactNumber;

      if ((!customerName || !customerEmail) && data.userId) {
        try {
          const user = await auth.getUser(data.userId);
          if (!customerName) customerName = user.displayName;
          if (!customerEmail) customerEmail = user.email;
          if (!customerContact) customerContact = user.phoneNumber;
        } catch (e) {
          /* ignore auth error */
        }
      }

      // Final Fallbacks to prevent "undefined" in UI
      customerName = customerName || "Guest";
      customerEmail = customerEmail || "N/A";
      customerContact = customerContact || "N/A";

      // Format for Invoice UI
      const booking = {
        id: docSnap.id,
        type,
        listingName:
          data.listingName ||
          data.propertyName ||
          data.vehicleName ||
          "Service Booking",
        customerName,
        customerEmail,
        customerContact,
        amount: Number(data.totalAmount || data.totalPrice || 0),
        status: data.status || "pending",
        paymentStatus: data.paymentStatus || "pending",
        checkIn: data.checkIn || data.startDate || null,
        checkOut: data.checkOut || data.endDate || null,
        createdAt: data.createdAt?.toDate
          ? data.createdAt.toDate().toISOString()
          : new Date().toISOString(),
        roomType: data.roomType || "Standard Room",
      };

      return NextResponse.json({ booking });
    } catch (error: any) {
      console.error("Single Booking Fetch Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  // =================================================================
  // CASE 2: FETCH ALL BOOKINGS (Dashboard List)
  // =================================================================
  try {
    const bookingsSnap = await db
      .collectionGroup("bookings")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();
    const vehiclesSnap = await db
      .collectionGroup("vehicle_bookings")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const getUserName = async (uid: string) => {
      if (!uid) return "Guest";
      try {
        const user = await auth.getUser(uid);
        return user.displayName || user.email || "Unknown User";
      } catch (e) {
        return "Unknown User";
      }
    };

    const hotelBookings = await Promise.all(
      bookingsSnap.docs.map(async (doc) => {
        const data = doc.data();
        if (!data) return null;
        return {
          id: doc.id,
          type: "Hotel",
          listingName: data.listingName || data.propertyName || "Hotel",
          customerName: data.userName || (await getUserName(data.userId)),
          customerContact: data.userEmail || "N/A",
          amount: data.totalAmount || 0,
          checkIn: data.checkIn || data.startDate,
          checkOut: data.checkOut || data.endDate,
          status: data.status || "pending",
          paymentStatus: data.paymentStatus || "pending",
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
          roomType: data.roomType,
        };
      }),
    );

    const vehicleBookings = await Promise.all(
      vehiclesSnap.docs.map(async (doc) => {
        const data = doc.data();
        if (!data) return null;
        return {
          id: doc.id,
          type: "Vehicle",
          listingName: data.vehicleName || "Vehicle",
          customerName: data.userName || (await getUserName(data.userId)),
          customerContact: data.userEmail || "N/A",
          amount: data.totalPrice || 0,
          checkIn: data.startDate,
          checkOut: data.endDate,
          status: data.status || "pending",
          paymentStatus: data.paymentStatus || "pending",
          createdAt: data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString(),
        };
      }),
    );

    const validHotels = hotelBookings.filter((b) => b !== null);
    const validVehicles = vehicleBookings.filter((b) => b !== null);

    const allBookings = [...validHotels, ...validVehicles].sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({ bookings: allBookings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
