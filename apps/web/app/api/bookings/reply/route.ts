import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        const { bookingId, message } = await request.json();

        if (!bookingId || !message) {
            return NextResponse.json({ error: "Missing fields" }, { status: 400 });
        }

        await initAdmin();
        const db = getFirestore();
        const bookingRef = db.collection("bookings").doc(bookingId);

        // Save the Admin's reply into a separate array 'adminReplies'
        // We also remove the 'hasOpenTicket' flag because we responded
        await bookingRef.update({
            adminReplies: FieldValue.arrayUnion({
                message,
                createdAt: new Date().toISOString(),
                adminName: "Support Team"
            }),
            hasOpenTicket: false // Mark as "Handled"
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Reply API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}