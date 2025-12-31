import { NextResponse } from "next/server";
import {
    StandardCheckoutClient,
    Env,
    StandardCheckoutPayRequest,
} from "pg-sdk-node";

// 1. Initialize SDK Config
// ⚠️ Ensure these are in your .env.local file
const clientId = process.env.PHONEPE_MERCHANT_ID || "PHONEPE_MERCHANT_ID";
const clientSecret = process.env.PHONEPE_SALT_KEY || "PHONEPE_SALT_KEY";
const clientVersion = 1;
const env = Env.SANDBOX; // Change to Env.PRODUCTION for live

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { bookingId, amount } = body;

        if (!bookingId || !amount) {
            return NextResponse.json({ error: "Missing Booking ID or Amount" }, { status: 400 });
        }

        // 2. Initialize the Client
        const client = StandardCheckoutClient.getInstance(
            clientId,
            clientSecret,
            clientVersion,
            env
        );

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        // ✅ FIX: Calculate amount BEFORE using it
        const amountInPaise = Math.round(Number(amount) * 100);

        // ✅ FIX: Add ID to URL for the GET fallback
        const callbackRoute = `${baseUrl}/api/payment/status?id=${bookingId}`;

        // 3. Build Request (Defined only once)
        const payRequest = StandardCheckoutPayRequest.builder()
            .merchantOrderId(bookingId)
            .amount(amountInPaise)
            .redirectUrl(callbackRoute)
            .build();

        // 4. Execute Payment
        const response = await client.pay(payRequest);
        const checkoutPageUrl = response.redirectUrl;

        console.log("✅ SDK Payment URL:", checkoutPageUrl);

        return NextResponse.json({ url: checkoutPageUrl });

    } catch (error: any) {
        console.error("❌ SDK Error:", error);
        return NextResponse.json({
            error: "Payment initiation failed",
            details: error.message
        }, { status: 500 });
    }
}