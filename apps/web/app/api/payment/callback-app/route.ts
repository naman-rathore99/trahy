import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        // 1. Extract the booking ID and the Mobile Deep Link from the URL
        const url = new URL(request.url);
        const bookingId = url.searchParams.get("id");
        const redirectUrl = url.searchParams.get("redirect");

        if (!bookingId || !redirectUrl) {
            console.error("❌ Callback App: Missing bookingId or redirectUrl");
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        // 2. Read PhonePe's response code (Sent as FormData)
        const formData = await request.formData();
        const code = formData.get("code")?.toString() || "";
        const transactionId = formData.get("transactionId")?.toString() || "";

        console.log(`🔔 App Callback Received: Status [${code}] for Booking [${bookingId}]`);

        const bookingRef = adminDb.collection("bookings").doc(bookingId);

        // 3. Update Firestore 
        if (code === "PAYMENT_SUCCESS") {
            await bookingRef.update({
                status: "confirmed",
                paymentStatus: "paid",
                transactionId: transactionId || null,
                updatedAt: new Date().toISOString()
            });
            console.log("✅ Booking marked as confirmed.");
        } else {
            await bookingRef.update({
                status: "failed",
                paymentStatus: "failed",
                updatedAt: new Date().toISOString()
            });
            console.log("❌ Booking marked as failed.");
        }

        // 4. 🔥 REDIRECT TO APP: This closes the mobile browser instantly
        return NextResponse.redirect(redirectUrl, 302);

    } catch (error) {
        console.error("Callback App Error:", error);
        return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
    }
}