import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        const url = new URL(request.url);
        const bookingId = url.searchParams.get("id");
        // Grab the deep link we passed earlier
        const redirectUrl = url.searchParams.get("redirect");

        if (!bookingId || !redirectUrl) {
            return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
        }

        const formData = await request.formData();
        const code = formData.get("code")?.toString() || "";

        const bookingRef = adminDb.collection("bookings").doc(bookingId);

        if (code === "PAYMENT_SUCCESS") {
            // Update Firestore so the mobile app's onSnapshot triggers!
            await bookingRef.update({
                status: "confirmed",
                paymentStatus: "paid",
                updatedAt: new Date().toISOString()
            });
        } else {
            await bookingRef.update({
                status: "failed",
                paymentStatus: "failed",
                updatedAt: new Date().toISOString()
            });
        }

        // 🔥 THE MAGIC: Redirect to the Expo Deep Link! 
        // This instantly forces the WebBrowser on the phone to close.
        return NextResponse.redirect(redirectUrl, 302);

    } catch (error) {
        console.error("Callback App Error:", error);
        return NextResponse.json({ error: "Callback processing failed" }, { status: 500 });
    }
}