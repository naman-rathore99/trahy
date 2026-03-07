// app/api/payment/status/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get("id");

        if (!bookingId) {
            return NextResponse.json({ error: "Missing Booking ID" }, { status: 400 });
        }

        // ✅ With Razorpay, we don't poll an external API.
        // The callback route already updated Firestore when payment succeeded.
        // So we just read Firestore directly.
        let docRef = adminDb.collection("bookings").doc(bookingId);
        let docSnap = await docRef.get();

        if (!docSnap.exists) {
            docRef = adminDb.collection("vehicle_bookings").doc(bookingId);
            docSnap = await docRef.get();
        }

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Booking not found" }, { status: 404 });
        }

        const data = docSnap.data()!;

        return NextResponse.json({
            status: data.status,
            paymentStatus: data.paymentStatus,
        });

    } catch (error: any) {
        console.error("Status Check Error:", error?.message);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}