import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // ✅ Accept collectionName from the frontend
        const { bookingId, message, type, collectionName } = body;

        if (!bookingId || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await initAdmin();
        const db = getFirestore();

        // ✅ SMART TARGETING
        // If collectionName is sent (new frontend), use it.
        // If not (backward compatibility), default to "bookings".
        const targetCollection = collectionName || "bookings";

        const bookingRef = db.collection(targetCollection).doc(bookingId);

        // Verify it exists (Optional but good practice)
        const docSnap = await bookingRef.get();
        if (!docSnap.exists) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        // Add ticket
        await bookingRef.update({
            supportTickets: FieldValue.arrayUnion({
                type: type || 'general',
                message,
                createdAt: new Date().toISOString(),
                status: 'open'
            }),
            hasOpenTicket: true
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Support API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}