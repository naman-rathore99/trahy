import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: Request) {
    try {
        const { bookingId } = await request.json();

        // 1. Verify User (Security)
        // In a real app, check headers for auth token. 
        // For now, we trust the client sends the ID, but we should verify ownership in production.

        await initAdmin();
        const db = getFirestore();
        const bookingRef = db.collection("bookings").doc(bookingId);
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
            updatedAt: new Date().toISOString()
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}