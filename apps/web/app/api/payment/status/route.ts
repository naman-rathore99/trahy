import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";
import crypto from "crypto";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get("id");

        if (!bookingId) {
            return NextResponse.json({ error: "Missing Booking ID" }, { status: 400 });
        }

        await initAdmin();
        const db = getFirestore();

        // --- 1. SMART CHECK (Look in both collections) ---
        let docRef = db.collection("bookings").doc(bookingId);
        let docSnap = await docRef.get();

        if (!docSnap.exists) {
            // Not found in 'bookings', check 'vehicle_bookings'
            docRef = db.collection("vehicle_bookings").doc(bookingId);
            docSnap = await docRef.get();
        }

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Booking Not Found" }, { status: 404 });
        }

        const bookingData = docSnap.data();

        // --- 2. If status is already final, return it immediately ---
        if (bookingData?.status === "confirmed" || bookingData?.status === "failed") {
            return NextResponse.json({
                status: bookingData.status,
                paymentStatus: bookingData.paymentStatus
            });
        }

        // --- 3. If still pending, ASK PHONEPE (Server-to-Server Check) ---
        // Only needed if you want real-time updates without waiting for the callback
        const merchantId = process.env.PHONEPE_MERCHANT_ID;
        const saltKey = process.env.PHONEPE_SALT_KEY;
        const saltIndex = process.env.PHONEPE_SALT_INDEX;

        if (!merchantId || !saltKey || !saltIndex) {
            // If env vars missing, just return current DB status
            return NextResponse.json({ status: bookingData?.status || "pending" });
        }

        // Check PhonePe Status API
        const statusUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${bookingId}`;
        // (Use 'https://api.phonepe.com/apis/hermes/pg/v1/status/...' for PROD)

        const stringToSign = `/pg/v1/status/${merchantId}/${bookingId}` + saltKey;
        const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
        const checksum = `${sha256}###${saltIndex}`;

        const phonePeRes = await fetch(statusUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
                "X-MERCHANT-ID": merchantId,
            },
        });

        const paymentData = await phonePeRes.json();

        // --- 4. UPDATE DB IF CHANGED ---
        if (paymentData.code === "PAYMENT_SUCCESS") {
            await docRef.update({
                status: "confirmed",
                paymentStatus: "paid",
                updatedAt: new Date().toISOString()
            });
            return NextResponse.json({ status: "confirmed", paymentStatus: "paid" });
        } else if (paymentData.code === "PAYMENT_ERROR") {
            await docRef.update({
                status: "failed",
                paymentStatus: "failed",
                updatedAt: new Date().toISOString()
            });
            return NextResponse.json({ status: "failed", paymentStatus: "failed" });
        }

        // Still pending
        return NextResponse.json({ status: "pending", paymentStatus: "pending" });

    } catch (error) {
        console.error("Payment Status Check Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}