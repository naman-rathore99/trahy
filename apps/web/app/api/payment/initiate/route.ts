import { NextResponse } from "next/server";
import {
    StandardCheckoutClient,
    Env,
    StandardCheckoutPayRequest,
} from "pg-sdk-node";

// 1. Initialize SDK Config
const clientId = process.env.PHONEPE_MERCHANT_ID || "PHONEPE_MERCHANT_ID";
const clientSecret = process.env.PHONEPE_SALT_KEY || "PHONEPE_SALT_KEY";
const clientVersion = 1;
const env = Env.SANDBOX;

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

        // ✅ Uses your preferred variable name
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

        const amountInPaise = Math.round(Number(amount) * 100);

        // ✅ FIX: Point to 'callback', NOT 'status'
        const callbackRoute = `${baseUrl}/api/payment/callback?id=${bookingId}`;

        // 3. Build Request
        const payRequest = StandardCheckoutPayRequest.builder()
            .merchantOrderId(bookingId)
            .amount(amountInPaise)
            .redirectUrl(callbackRoute) // <--- Updated URL used here
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