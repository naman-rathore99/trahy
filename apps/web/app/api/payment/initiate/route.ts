import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";
import { getAuth } from "firebase-admin/auth";

const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
const clientSecret = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export async function POST(request: Request) {
  const auth = getAuth();

  try {
    // 1. Verify Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body = await request.json();
    const source: string = body.source || "web";

    // ─────────────────────────────────────────────
    // WEB FLOW: booking already created by /api/bookings/create
    // Just initiate payment for the existing booking
    // ─────────────────────────────────────────────
    if (body.bookingId) {
      const bookingRef = adminDb.collection("bookings").doc(body.bookingId);
      const bookingSnap = await bookingRef.get();

      if (!bookingSnap.exists) {
        return NextResponse.json({ error: "Booking not found" }, { status: 404 });
      }

      const bookingData = bookingSnap.data()!;

      // Security: make sure this booking belongs to the authenticated user
      if (bookingData.userId !== userId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      const transactionId = body.bookingId.substring(0, 34);
      await bookingRef.update({ transactionId });

      const callbackUrl = `${baseUrl}/api/payment/callback?id=${body.bookingId}`;
      const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, Env.SANDBOX);

      const requestBuilder = StandardCheckoutPayRequest.builder()
        .merchantOrderId(transactionId)
        .amount(Math.round(Number(bookingData.totalAmount) * 100))
        .redirectUrl(callbackUrl);

      (requestBuilder as any).redirectMode("POST");
      (requestBuilder as any).merchantUserId(userId);
      (requestBuilder as any).callbackUrl(callbackUrl);

      if (body.mobile) {
        (requestBuilder as any).mobileNumber(body.mobile);
      }

      const payRequest = requestBuilder.build();
      const response = await client.pay(payRequest);

      if (!response.redirectUrl) {
        throw new Error("Failed to generate payment link");
      }

      return NextResponse.json({
        url: response.redirectUrl,
        bookingId: body.bookingId,
      });
    }

    // ─────────────────────────────────────────────
    // MOBILE FLOW: create booking + initiate payment in one step
    // ─────────────────────────────────────────────
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
      customerName,
      customerEmail,
      customerPhone,
      mobile,
    } = body;

    if (!listingId || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields (listingId or totalAmount)" },
        { status: 400 }
      );
    }

    const parsedAmount = Number(totalAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    // Create booking in Firestore
    const bookingRef = await adminDb.collection("bookings").add({
      userId,
      customer: { userId },
      listingId,
      listingName,
      listingImage: listingImage || "",
      serviceType: serviceType || "hotel_stay",
      checkIn: checkIn || null,
      checkOut: checkOut || null,
      guests: guests || 1,
      totalAmount: parsedAmount,
      vehicleIncluded: vehicleIncluded || false,
      vehicleType: vehicleType || null,
      vehiclePrice: vehiclePricePerDay || 0,
      vehicleTotalAmount: vehicleTotalAmount || 0,
      customerName: customerName || "",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || mobile || "",
      status: "pending",
      paymentStatus: "pending",
      source: "mobile",
      createdAt: new Date().toISOString(),
    });

    const bookingId = bookingRef.id;
    const transactionId = bookingId.substring(0, 34);
    await bookingRef.update({ transactionId });

    const callbackUrl = `${baseUrl}/api/payment/callback-app?id=${bookingId}`;
    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, 1, Env.SANDBOX);

    const requestBuilder = StandardCheckoutPayRequest.builder()
      .merchantOrderId(transactionId)
      .amount(Math.round(parsedAmount * 100))
      .redirectUrl(callbackUrl);

    (requestBuilder as any).redirectMode("POST");
    (requestBuilder as any).merchantUserId(userId);
    (requestBuilder as any).callbackUrl(callbackUrl);

    if (mobile) {
      (requestBuilder as any).mobileNumber(mobile);
    }

    const payRequest = requestBuilder.build();
    const response = await client.pay(payRequest);

    if (!response.redirectUrl) {
      await bookingRef.delete();
      throw new Error("Failed to generate payment link");
    }

    return NextResponse.json({
      url: response.redirectUrl,
      bookingId,
    });

  } catch (error: any) {
    console.error("❌ Payment Initiate Error:", error);
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