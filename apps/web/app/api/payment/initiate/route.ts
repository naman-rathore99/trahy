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
      source, // "web" or "mobile" — sent by the client
    } = body;

    if (!listingId || !totalAmount || !source) {
      return NextResponse.json(
        { error: "Missing required fields (listingId, totalAmount, or source)" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(totalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // 1. Create Firestore booking
    const bookingRef = adminDb.collection("bookings").doc();
    const bookingId = bookingRef.id;

    // ✅ FIX: Truncate BEFORE storing so status-check API can match it
    const transactionId = bookingId.substring(0, 34);

    await bookingRef.set({
      customer: { userId: userId || "guest" }, // ✅ Matches CustomerBookings query
      userId: userId || "guest",
      listingId,
      listingName: listingName || "Booking",
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      totalAmount: parsedAmount,
      serviceType: serviceType || "hotel_stay",
      customerName: customerName || "",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "",
      transactionId,        // ✅ Store truncated ID for status-check API
      status: "pending",
      paymentStatus: "pending",
      source,               // "web" or "mobile"
      createdAt: new Date().toISOString(),
    });

    // 2. Init PhonePe
    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, env);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

    // 3. Pick the right callback based on source
    const callbackUrl =
      source === "mobile"
        ? `${baseUrl}/api/payment/callback-app?id=${bookingId}`
        : `${baseUrl}/api/payment/callback?id=${bookingId}`;

    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(Math.round(parsedAmount * 100))
      .redirectUrl(callbackUrl)
      .build();

    // 4. Get PhonePe checkout URL
    const phonepeResponse = await client.pay(payRequest);
    const checkoutPageUrl = phonepeResponse?.redirectUrl;

    if (!checkoutPageUrl) {
      await bookingRef.delete();
      throw new Error("No redirect URL from PhonePe");
    }

    return NextResponse.json({
      url: checkoutPageUrl,
      bookingId,
    });

  } catch (error: any) {
    console.error("❌ Initiate Error:", error);
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