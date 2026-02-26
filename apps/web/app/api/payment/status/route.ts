import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const bookingId = searchParams.get("id");

        if (!bookingId) {
            return NextResponse.json({ error: "Missing Booking ID" }, { status: 400 });
        }

        const db = adminDb;

        // Check both collections
        let docRef = db.collection("bookings").doc(bookingId);
        let docSnap = await docRef.get();

        if (!docSnap.exists) {
            docRef = db.collection("vehicle_bookings").doc(bookingId);
            docSnap = await docRef.get();
        }

        if (!docSnap.exists) {
            return NextResponse.json({ error: "Booking Not Found" }, { status: 404 });
        }

        const bookingData = docSnap.data();

        // Already final — return immediately
        if (bookingData?.status === "confirmed" || bookingData?.status === "failed") {
            return NextResponse.json({
                status: bookingData.status,
                paymentStatus: bookingData.paymentStatus,
            });
        }

        const merchantId = process.env.PHONEPE_MERCHANT_ID;
        const saltKey = process.env.PHONEPE_SALT_KEY;
        const saltIndex = process.env.PHONEPE_SALT_INDEX;

        if (!merchantId || !saltKey || !saltIndex) {
            return NextResponse.json({ status: bookingData?.status || "pending" });
        }

        // ✅ FIX: Use stored transactionId, not bookingId
        const actualTransactionId = bookingData?.transactionId;

        if (!actualTransactionId) {
            return NextResponse.json({ status: "failed", paymentStatus: "failed" });
        }

        const statusUrl = `https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status/${merchantId}/${actualTransactionId}`;
        const stringToSign = `/pg/v1/status/${merchantId}/${actualTransactionId}` + saltKey;
        const sha256 = crypto.createHash("sha256").update(stringToSign).digest("hex");
        const checksum = `${sha256}###${saltIndex}`;

        const phonePeRes = await fetch(statusUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-VERIFY": checksum,
                "X-MERCHANT-ID": merchantId,
            },
            cache: "no-store",
        });

        const paymentData = await phonePeRes.json();

        if (paymentData.code === "PAYMENT_SUCCESS") {
            await docRef.update({
                status: "confirmed",
                paymentStatus: "paid",
                updatedAt: new Date().toISOString(),
            });
            return NextResponse.json({ status: "confirmed", paymentStatus: "paid" });
        } else if (
            paymentData.code === "PAYMENT_ERROR" ||
            paymentData.code === "PAYMENT_DECLINED"
        ) {
            await docRef.update({
                status: "failed",
                paymentStatus: "failed",
                updatedAt: new Date().toISOString(),
            });
            return NextResponse.json({ status: "failed", paymentStatus: "failed" });
        }

        return NextResponse.json({ status: "pending", paymentStatus: "pending" });

    } catch (error) {
        console.error("Status Check Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}