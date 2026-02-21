import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { StandardCheckoutClient, Env, StandardCheckoutPayRequest } from "pg-sdk-node";
import { getAuth } from "firebase-admin/auth";

const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
const clientSecret = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const env = Env.SANDBOX;

export async function POST(request: Request) {
    try {
        // 1. Verify Firebase Auth token
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const idToken = authHeader.split("Bearer ")[1];
        const decodedToken = await getAuth().verifyIdToken(idToken);
        const userId = decodedToken.uid;

        // 2. Parse body (matches what your app sends)
        const {
            listingId,
            listingName,
            checkIn,
            checkOut,
            totalAmount,
            serviceType,
            customerName,
            customerEmail,
            customerPhone,
        } = await request.json();

        if (!listingId || !totalAmount) {
            return NextResponse.json(
                { error: "Missing Booking ID or Amount" },
                { status: 400 }
            );
        }

        // 3. Create booking doc in Firestore FIRST
        const bookingRef = adminDb.collection("bookings").doc();
        const bookingId = bookingRef.id;

        await bookingRef.set({
            userId,
            listingId,
            listingName,
            checkIn,
            checkOut,
            totalAmount,
            serviceType: serviceType || "hotel_stay",
            customerName,
            customerEmail,
            customerPhone,
            status: "pending",
            paymentStatus: "pending",
            createdAt: new Date().toISOString(),
        });

        // 4. Init PhonePe
        const client = StandardCheckoutClient.getInstance(
            clientId,
            clientSecret,
            1,
            env
        );

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shubhyatra.world";
        const callbackRoute = `${baseUrl}/api/payment/callback?id=${bookingId}`;
        const amountInPaise = Math.round(Number(totalAmount) * 100);
        const transactionId = bookingId.substring(0, 34);

        const payRequest = StandardCheckoutPayRequest.builder()
            .merchantOrderId(transactionId)
            .amount(amountInPaise)
            .redirectUrl(callbackRoute)
            .build();

        const response = await client.pay(payRequest);
        const checkoutPageUrl = response?.redirectUrl;

        if (!checkoutPageUrl) {
            // Cleanup the pending booking if PhonePe fails
            await bookingRef.delete();
            throw new Error("Redirect URL missing from PhonePe response");
        }

        // 5. Return BOTH url and bookingId (app needs both)
        return NextResponse.json({
            url: checkoutPageUrl,
            bookingId: bookingId,
        });

    } catch (error: any) {
        console.error("❌ App Payment Init Error:", error);
        return NextResponse.json(
            { error: "Payment initiation failed", details: error.message },
            { status: 500 }
        );
    }
}