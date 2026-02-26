import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";
import { getAuth } from "firebase-admin/auth";

export async function POST(request: Request) {
  const db = adminDb;
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

    // 2. Parse Body
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
      mobile,
    } = body;

    // ✅ source defaults to "web" if not sent — fixes your frontend
    const source: string = body.source || "web";

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

    // 3. Save Pending Booking
    const bookingRef = await db.collection("bookings").add({
      userId,
      customer: { userId }, // ✅ Needed for CustomerBookings query
      listingId,
      listingName,
      listingImage: listingImage || "",
      serviceType: serviceType || "hotel",
      checkIn,
      checkOut,
      guests,
      totalAmount: parsedAmount,
      vehicleIncluded: vehicleIncluded || false,
      vehicleType: vehicleType || null,
      vehiclePrice: vehiclePricePerDay || 0,
      vehicleTotalAmount: vehicleTotalAmount || 0,
      status: "pending",
      paymentStatus: "pending",
      source,
      createdAt: new Date().toISOString(),
    });

    const bookingId = bookingRef.id;

    // ✅ Truncate for PhonePe (max 34 chars), store so status-check API can match
    const transactionId = bookingId.substring(0, 34);
    await bookingRef.update({ transactionId });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // 4. Init PhonePe
    const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
    const clientSecret =
      process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const client = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      1,
      Env.SANDBOX
    );

    // 5. Pick callback URL based on source
    const callbackUrl =
      source === "mobile"
        ? `${baseUrl}/api/payment/callback-app?id=${bookingId}`
        : `${baseUrl}/api/payment/callback?id=${bookingId}`;

    // 6. Build Payment Request
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

    // 7. Execute Payment
    const response = await client.pay(payRequest);
    const checkoutPageUrl = response.redirectUrl;

    if (!checkoutPageUrl) {
      await bookingRef.delete();
      throw new Error("Failed to generate payment link");
    }

    return NextResponse.json({
      url: checkoutPageUrl,
      bookingId, // ✅ Returned so mobile app can start onSnapshot listener
    });
  } catch (error: any) {
    console.error("❌ Booking/Payment Error:", error);
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