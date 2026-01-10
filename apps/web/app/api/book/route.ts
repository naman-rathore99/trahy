import { NextResponse } from "next/server";
import {
    StandardCheckoutClient,
    Env,
    StandardCheckoutPayRequest,
} from "pg-sdk-node";
``
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";;

export async function POST(request: Request) {
    // Initialize Firebase
    // initAdmin auto-initializedinitialized
    const db = adminDb;
    const auth = getAuth();

    try {
        // 1. Verify User Authentication
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.split("Bearer ")[1];
        const decodedToken = await auth.verifyIdToken(token);
        const userId = decodedToken.uid;

        // 2. Parse Request Body
        const body = await request.json();
        const {
            listingId,
            listingName,
            listingImage,
            checkIn,
            checkOut,
            guests,
            totalAmount,
            serviceType,
            vehicleIncluded,
            vehicleType,
            vehiclePricePerDay,
            vehicleTotalAmount,
            mobile // Optional: Pass mobile number if you have it
        } = body;

        // 3. Save "Pending" Booking to Firestore
        const bookingRef = await db.collection("bookings").add({
            userId,
            listingId,
            listingName,
            listingImage: listingImage || "",
            serviceType: serviceType || "hotel",
            checkIn,
            checkOut,
            guests,
            totalAmount,
            vehicleIncluded: vehicleIncluded || false,
            vehicleType: vehicleType || null,
            vehiclePrice: vehiclePricePerDay || 0,
            vehicleTotalAmount: vehicleTotalAmount || 0,
            status: "pending",       // Booking status
            paymentStatus: "pending", // Payment status
            createdAt: new Date().toISOString(),
        });

        const merchantTransactionId = bookingRef.id; // Use Booking ID as Transaction ID
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        // 4. Initialize PhonePe SDK
        const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
        const clientSecret = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
        const clientVersion = 1;
        const env = Env.SANDBOX; // Change to Env.PRODUCTION for live

        if (!clientId || !clientSecret) {
            throw new Error("Missing PhonePe Credentials");
        }

        const client = StandardCheckoutClient.getInstance(
            clientId,
            clientSecret,
            clientVersion,
            env
        );

        // 5. Build Payment Request
        const amountInPaise = Math.round(totalAmount * 100);
        const callbackRoute = `${baseUrl}/api/payment/status`;

        // Create the builder with standard fields
        const requestBuilder = StandardCheckoutPayRequest.builder()
            .merchantOrderId(merchantTransactionId)
            .amount(amountInPaise)
            .redirectUrl(callbackRoute);

        // 🛠️ TYPESCRIPT FIXES:
        // Cast builder to 'any' to bypass missing type definitions in SDK

        // 1. Force Redirect Mode to POST
        (requestBuilder as any).redirectMode("POST");

        // 2. Force Merchant User ID (Required)
        (requestBuilder as any).merchantUserId(userId);

        // 3. Force Callback URL (Server-to-Server)
        (requestBuilder as any).callbackUrl(callbackRoute);

        // Optional: Add mobile if available
        if (mobile) {
            (requestBuilder as any).mobileNumber(mobile);
        }

        const payRequest = requestBuilder.build();

        // 6. Execute Payment
        const response = await client.pay(payRequest);
        const checkoutPageUrl = response.redirectUrl;

        if (!checkoutPageUrl) {
            throw new Error("Failed to generate payment link");
        }

        return NextResponse.json({ url: checkoutPageUrl });

    } catch (error: any) {
        console.error("❌ Booking/Payment Error:", error);
        return NextResponse.json(
            {
                error: "Payment initiation failed",
                details: error.message || "Unknown Error"
            },
            { status: 500 }
        );
    }
}