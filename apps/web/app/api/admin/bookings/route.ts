import { NextResponse } from "next/server";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
// ✅ FIX: Import from the NEW file 'firebaseAdmin', NOT 'firebase'
import { initAdmin } from "@/lib/firebaseAdmin";

export async function GET() {
  await initAdmin();
  const db = getFirestore();

  try {
    const bookingsSnap = await db
      .collection("bookings")
      .orderBy("createdAt", "desc")
      .get();

    const bookings = await Promise.all(
      bookingsSnap.docs.map(async (doc: any) => {
        const data = doc.data();

        let userName = "Guest User";
        let userEmail = "No Email";
        let propertyName = "Unknown Property";

        // 1. Lookup User Name
        if (data.userId) {
          try {
            const userRecord = await getAuth().getUser(data.userId);
            userName = userRecord.displayName || "No Name";
            userEmail = userRecord.email || "No Email";
          } catch (e) {
            console.log("User lookup failed", e);
          }
        }

        // 2. Lookup Property Name
        if (data.propertyId) {
          try {
            const propSnap = await db
              .collection("properties")
              .doc(data.propertyId)
              .get();
            if (propSnap.exists) {
              propertyName = propSnap.data()?.name || "Unknown Property";
            }
          } catch (e) {
            console.log("Property lookup failed", e);
          }
        }

        // 3. Return Combined Data
        return {
          id: doc.id,
          ...data,
          userName,
          userEmail,
          propertyName,
          // Convert Firebase Timestamps to JS Dates
          startDate: data.startDate?.toDate
            ? data.startDate.toDate()
            : new Date(data.startDate),
          endDate: data.endDate?.toDate
            ? data.endDate.toDate()
            : new Date(data.endDate),
          bookedAt: data.createdAt?.toDate
            ? data.createdAt.toDate()
            : new Date(),
        };
      })
    );

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}
