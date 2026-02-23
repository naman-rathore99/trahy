import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
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
    // 1. Parse body and grab the appReturnUrl (Deep Link)
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
      userId,
      appReturnUrl, // <-- The Deep Link from the mobile app
    } = body;

    console.log("📦 Request body received:", { listingId, totalAmount, customerName });

    if (!listingId || !totalAmount || !appReturnUrl) {
      return NextResponse.json(
        { error: "Missing required fields (listingId, totalAmount, or appReturnUrl)" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(totalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount provided" }, { status: 400 });
    }

    // 2. Create booking in Firestore
    const bookingRef = adminDb.collection("bookings").doc();
    const bookingId = bookingRef.id;

    await bookingRef.set({
      userId: userId || "guest",
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

    console.log("✅ Booking created:", bookingId);

    // 3. Initialize PhonePe
    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);

    // 4. Attach the Deep Link to the callback URL so PhonePe brings it back to us!
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shubhyatra.world";
    const callbackRoute = `${baseUrl}/api/payment/callback-app?id=${bookingId}&redirect=${encodeURIComponent(appReturnUrl)}`;

    const amountInPaise = Math.round(parsedAmount * 100);
    const transactionId = bookingId.substring(0, 34);

    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(amountInPaise)
      .redirectUrl(callbackRoute)
      .build();

    // 5. Execute payment
    const phonepeResponse = await client.pay(payRequest);
    const checkoutPageUrl = phonepeResponse?.redirectUrl;

    if (!checkoutPageUrl) {
      await bookingRef.delete();
      throw new Error("Redirect URL missing from PhonePe response");
    }

    return NextResponse.json({
      url: checkoutPageUrl,
      bookingId: bookingId,
    });

  } catch (error: any) {
    console.error("❌ Error:", error);
    return NextResponse.json(
      { error: "Payment initiation failed", details: error.message },
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