import { NextResponse } from "next/server";
``
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";;

export async function GET(request: Request) {
    // initAdmin auto-initialized
    const db = adminDb;

    try {
        const token = request.headers.get("Authorization")?.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const decodedToken = await getAuth().verifyIdToken(token);

        // 1. First, find the Hotel ID owned by this partner
        const hotelQuery = await db.collection("hotels").where("ownerId", "==", decodedToken.uid).limit(1).get();

        if (hotelQuery.empty) {
            return NextResponse.json({ bookings: [] }); // No hotel = No bookings
        }
        const hotelId = hotelQuery.docs[0].id;

        // 2. Fetch bookings for this hotelId
        const snapshot = await db.collection("bookings")
            .where("hotelId", "==", hotelId)
            .orderBy("checkInDate", "desc") // Show newest first
            .get();

        const bookings = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Format dates safely
            checkInDate: doc.data().checkInDate?.toDate ? doc.data().checkInDate.toDate().toISOString() : null,
            checkOutDate: doc.data().checkOutDate?.toDate ? doc.data().checkOutDate.toDate().toISOString() : null,
        }));

        return NextResponse.json({ bookings });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}