import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";;
import { getFirestore, FieldValue } from "firebase-admin/firestore";

export async function POST(request: Request) {
    try {
        const { bookingId, newCheckIn, newCheckOut } = await request.json();

        if (!bookingId || !newCheckIn || !newCheckOut) {
            return NextResponse.json({ error: "Missing dates" }, { status: 400 });
        }

        // initAdmin auto-initialized
        const db = adminDb;
        const bookingRef = db.collection("bookings").doc(bookingId);

        // Update Dates & Add System Message
        await bookingRef.update({
            checkIn: newCheckIn,
            checkOut: newCheckOut,
            hasOpenTicket: false, // Close the ticket automatically
            updatedAt: new Date().toISOString(),
            adminReplies: FieldValue.arrayUnion({
                message: `✅ Request Approved: Your dates have been successfully changed to ${newCheckIn} - ${newCheckOut}.`,
                createdAt: new Date().toISOString(),
                adminName: "System"
            })
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}