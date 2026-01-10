import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";;
``

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // ✅ NOW ACCEPT collectionName from the frontend
        const { bookingId, collectionName } = body;

        if (!bookingId) {
            return NextResponse.json({ error: "Missing Booking ID" }, { status: 400 });
        }

        // initAdmin auto-initialized
        const db = adminDb;

        // ✅ SMART TARGETING
        // If collectionName is sent (new frontend), use it.
        // If not (old requests), default to "bookings" (Hotels).
        const targetCollection = collectionName || "bookings";

        const bookingRef = db.collection(targetCollection).doc(bookingId);
        const docSnap = await bookingRef.get();

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // 2. Check if already cancelled
        if (docSnap.data()?.status === "cancelled") {
            return NextResponse.json({ error: "Already cancelled" }, { status: 400 });
        }

        // 3. Update Status
        await bookingRef.update({
            status: "cancelled",
            updatedAt: new Date().toISOString(),
            cancelledAt: new Date().toISOString() // Good for analytics
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Cancellation Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}