import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";
import { sendInvoiceEmail } from "@/lib/mail"; // 🚨 IMPORTED THE EMAIL FUNCTION

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

        // 🚨 3.5 SEND INVOICE EMAIL TO CUSTOMER 🚨
        // We use .catch() instead of 'await' so the server replies instantly to the frontend
        if (bookingData?.customer?.email) {
            sendInvoiceEmail(
                bookingData.customer.email,
                {
                    id: bookingId.slice(0, 8).toUpperCase(), // Keep it short and readable
                    hotelName: bookingData.listingName || "Shubh Yatra Stay",
                    amount: bookingData.totalAmount?.toLocaleString('en-IN') || "0",
                    date: `${bookingData.checkIn} to ${bookingData.checkOut}`,
                    guests: bookingData.guests || 1,
                }
            ).catch(err => console.error("❌ Failed to send customer email:", err));
        }

        // 4. CREATE NOTIFICATIONS FOR THE PARTNER
        if (bookingData?.partnerId && bookingData.partnerId !== "UNKNOWN") {
            const customerName = bookingData.customer?.name || "A guest";
            const amount = bookingData.totalAmount || "0";

            // A. Create the IN-APP Notification (Red Dot in Dashboard)
            await adminDb.collection("notifications").add({
                partnerId: bookingData.partnerId,
                title: "New Booking Confirmed! 🎉",
                message: `${customerName} just booked ${bookingData.listingName} for ₹${amount}.`,
                isRead: false,
                type: "new_booking",
                bookingId: bookingId,
                createdAt: new Date().toISOString()
            });

            // B. SEND THE EXPO PUSH NOTIFICATION (Wakes up the phone!)
            try {
                // Look up the partner's profile to get their Push Token
                const partnerDoc = await adminDb.collection("users").doc(bookingData.partnerId).get();
                const pushToken = partnerDoc.data()?.expoPushToken;

                if (pushToken) {
                    console.log(`📲 Sending Push Notification to Partner: ${pushToken}`);

                    await fetch('https://exp.host/--/api/v2/push/send', {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Accept-encoding': 'gzip, deflate',
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            to: pushToken,
                            sound: 'default', // Plays the phone's default notification ping
                            title: '🎉 New Booking Confirmed!',
                            body: `${customerName} just booked ${bookingData.listingName} for ₹${amount}.`,
                            data: { bookingId: bookingId }, // Hidden data the app can read when tapped
                        }),
                    });
                } else {
                    console.log("⚠️ No Expo Push Token found for partner:", bookingData.partnerId);
                }
            } catch (pushError) {
                console.error("❌ Failed to send Expo push notification:", pushError);
            }
        }

        return NextResponse.json({ success: true, status: "confirmed" });

    } catch (error: any) {
        console.error("❌ Payment Status Update Error:", error);
        return NextResponse.json({ error: "Failed to update payment status", details: error.message }, { status: 500 });
    }
}