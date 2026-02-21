import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import {
    StandardCheckoutClient,
    Env,
    StandardCheckoutPayRequest,
} from "pg-sdk-node";

const clientId = process.env.PHONEPE_MERCHANT_ID!;
const clientSecret = process.env.PHONEPE_SALT_KEY!;
const env = Env.SANDBOX; // Change to Env.PRODUCTION when going live

export async function POST(request: Request) {
    try {
        // 1. Verify Firebase Auth Token
        const authHeader = request.headers.get("Authorization");

        if (!authHeader?.startsWith("Bearer ")) {
            console.error("❌ No Authorization header found");
            return NextResponse.json(
                { error: "Unauthorized: No token provided" },
                { status: 401 }
            );
        }

        const idToken = authHeader.split("Bearer ")[1];

        // Decode token for debugging (remove in production)
        try {
            const tokenParts = idToken.split(".");
            const payload = JSON.parse(
                Buffer.from(tokenParts[1], "base64").toString()
            );
            console.log("🔍 Token project (aud):", payload.aud);
            console.log("🔍 Token issuer:", payload.iss);
            console.log("🔍 Expected project:", process.env.FIREBASE_PROJECT_ID);
        } catch (decodeErr) {
            console.error("Could not decode token for debugging:", decodeErr);
        }

        let userId: string;
        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            userId = decodedToken.uid;
            console.log("✅ Token verified for user:", userId);
        } catch (authError: any) {
            console.error("❌ Token verification failed:", authError.message);
            return NextResponse.json(
                { error: "Unauthorized", details: authError.message },
                { status: 401 }
            );
        }

        // 2. Parse Request Body
        const body = await request.json();
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
        } = body;

        console.log("📦 Request body:", {
            listingId,
            listingName,
            checkIn,
            checkOut,
            totalAmount,
            serviceType,
            customerName,
            customerEmail,
            customerPhone,
        });

        // 3. Validate Required Fields
        if (!listingId || !totalAmount) {
            console.error("❌ Missing required fields:", { listingId, totalAmount });
            return NextResponse.json(
                { error: "Missing required fields: listingId and totalAmount" },
                { status: 400 }
            );
        }

        const parsedAmount = Number(totalAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            console.error("❌ Invalid amount:", totalAmount);
            return NextResponse.json(
                { error: "Invalid amount provided" },
                { status: 400 }
            );
        }

        // 4. Create Booking Document in Firestore FIRST
        const bookingRef = adminDb.collection("bookings").doc();
        const bookingId = bookingRef.id;

        await bookingRef.set({
            userId,
            listingId,
            listingName: listingName || "Hotel Booking",
            checkIn: checkIn || null,
            checkOut: checkOut || null,
            totalAmount: parsedAmount,
            serviceType: serviceType || "hotel_stay",
            customerName: customerName || "",
            customerEmail: customerEmail || "",
            customerPhone: customerPhone || "",
            status: "pending",
            paymentStatus: "pending",
            source: "mobile_app",
            createdAt: new Date().toISOString(),
        });

        console.log("✅ Booking document created:", bookingId);

        // 5. Initialize PhonePe Client
        const client = StandardCheckoutClient.getInstance(
            clientId,
            clientSecret,
            1,
            env
        );

        // 6. Build Payment Request
        const baseUrl =
            process.env.NEXT_PUBLIC_BASE_URL || "https://shubhyatra.world";
        const callbackRoute = `${baseUrl}/api/payment/callback?id=${bookingId}`;
        const amountInPaise = Math.round(parsedAmount * 100);
        const transactionId = bookingId.substring(0, 34);

        console.log("💳 Initiating PhonePe payment:", {
            transactionId,
            amountInPaise,
            callbackRoute,
        });

        const payRequest = StandardCheckoutPayRequest.builder()
            .merchantOrderId(transactionId)
            .amount(amountInPaise)
            .redirectUrl(callbackRoute)
            .build();

        // 7. Execute Payment with PhonePe
        const phonepeResponse = await client.pay(payRequest);
        const checkoutPageUrl = phonepeResponse?.redirectUrl;

        if (!checkoutPageUrl) {
            // Cleanup the pending booking if PhonePe fails
            console.error("❌ No redirect URL from PhonePe");
            await bookingRef.delete();
            throw new Error("Redirect URL missing from PhonePe response");
        }

        console.log("✅ PhonePe payment initiated. URL:", checkoutPageUrl);

        // 8. Return URL and Booking ID to the app
        return NextResponse.json({
            url: checkoutPageUrl,
            bookingId: bookingId,
        });
    } catch (error: any) {
        console.error("❌ App Payment Init Error:", error);
        return NextResponse.json(
            {
                error: "Payment initiation failed",
                details: error.message || "Unknown error",
            },
            { status: 500 }
        );
    }
}
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
    });
}