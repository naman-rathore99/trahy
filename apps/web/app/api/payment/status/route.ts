import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            bookingId
        } = body;

        // 1. Security Check: Verify the Razorpay Signature
        // This ensures nobody can fake a successful payment
        const secret = process.env.RAZORPAY_KEY_SECRET || process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET || "";

        if (!secret) {
            console.error("❌ RAZORPAY_KEY_SECRET is missing from environment variables.");
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json({ error: "Invalid payment signature. Payment rejected." }, { status: 400 });
        }

        // 2. Fetch the Pending Booking from Firestore
        const bookingRef = adminDb.collection("bookings").doc(bookingId);
        const bookingSnapshot = await bookingRef.get();

        if (!bookingSnapshot.exists) {
            return NextResponse.json({ error: "Booking not found in database" }, { status: 404 });
        }

        const bookingData = bookingSnapshot.data();

        // 3. Update the Booking to "Confirmed" and "Paid"
        await bookingRef.update({
            status: "confirmed",
            paymentStatus: "paid",
            paymentId: razorpay_payment_id,
            updatedAt: new Date().toISOString()
        });

        // 🚨 4. CREATE THE REAL-TIME NOTIFICATION FOR THE PARTNER 🚨
        if (bookingData?.partnerId && bookingData.partnerId !== "UNKNOWN") {
            // Safely get the customer name and total amount
            const customerName = bookingData.customer?.name || "A guest";
            const amount = bookingData.totalAmount || "0";

            // Add the alert to the 'notifications' collection
            await adminDb.collection("notifications").add({
                partnerId: bookingData.partnerId,
                title: "New Booking Confirmed! 🎉",
                message: `${customerName} just booked ${bookingData.listingName} for ₹${amount}.`,
                isRead: false,
                type: "new_booking",
                bookingId: bookingId,
                createdAt: new Date().toISOString() // This powers the real-time sorting!
            });
        }

        // (Optional Future Step: You can trigger Resend/Nodemailer emails here too!)

        return NextResponse.json({ success: true, status: "confirmed" });

    } catch (error: any) {
        console.error("❌ Payment Status Update Error:", error);
        return NextResponse.json({ error: "Failed to update payment status", details: error.message }, { status: 500 });
    }
}