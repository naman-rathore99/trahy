import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
// 1. Import FieldValue directly here
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        const { bookingId, message, type } = await request.json();

        if (!bookingId || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await initAdmin();
        const db = getFirestore();
        const bookingRef = db.collection("bookings").doc(bookingId);

        // 2. Use FieldValue.arrayUnion directly (not db.FieldValue)
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