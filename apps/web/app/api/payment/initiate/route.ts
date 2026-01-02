import { NextResponse } from "next/server";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";

// 1. Initialize SDK Config
const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
const clientSecret =
  process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const clientVersion = 1;
const env = Env.SANDBOX;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bookingId, amount, mobile } = body;

    if (!bookingId || !amount) {
      return NextResponse.json(
        { error: "Missing Booking ID or Amount" },
        { status: 400 }
      );
    }

    // 2. Initialize the Client
    const client = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      clientVersion,
      env
    );

    // 3. Define Redirect URL
    // PhonePe will redirect the user here after payment (Success or Failure)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const callbackRoute = `${baseUrl}/api/payment/callback?id=${bookingId}`;

    const amountInPaise = Math.round(Number(amount) * 100);

    // Ensure ID is a string and strictly within limits (34 chars max to be safe)
    const transactionId = String(bookingId).substring(0, 34);

    // 4. Build Request (Strictly matching documentation)
    // - uses merchantOrderId
    // - uses redirectUrl
    // - NO callbackUrl
    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(amountInPaise)
      .redirectUrl(callbackRoute)

      .build();

    // 5. Execute Payment
    const response = await client.pay(payRequest);

    // 6. Get Page URL
    const checkoutPageUrl = response?.redirectUrl;

    if (!checkoutPageUrl) {
      throw new Error("Redirect URL missing from Payment Gateway response");
    }

    console.log("✅ SDK Payment Init Success. URL:", checkoutPageUrl);

    return NextResponse.json({ url: checkoutPageUrl });
  } catch (error: any) {
    console.error("❌ SDK Error Details:", error);
    return NextResponse.json(
      {
        error: "Payment initiation failed",
        details: error.message || "Unknown SDK Error",
      },
      { status: 500 }
    );
  }
}
