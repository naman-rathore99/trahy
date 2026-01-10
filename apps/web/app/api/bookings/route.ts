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
  // initAdmin auto-initialized
  const db = adminDb;
  const auth = getAuth();

  try {
    // 1. Verify User
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    // 2. Get Data
    const body = await request.json();
    const {
      listingId, listingName, listingImage, checkIn, checkOut,
      guests, totalAmount, serviceType,
      vehicleIncluded, vehicleType, vehiclePricePerDay, vehicleTotalAmount
    } = body;

    // 3. Save Pending Booking
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
      status: "pending",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
    });

    const merchantTransactionId = bookingRef.id;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // 4. Initialize SDK
    const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
    const clientSecret = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const clientVersion = 1;
    const env = Env.SANDBOX;

    const client = StandardCheckoutClient.getInstance(clientId, clientSecret, clientVersion, env);

    // 5. Create Payment Request
    const amountInPaise = Math.round(totalAmount * 100);

    // ✅ CORRECTION: Point to the file we created: /api/payment/status
    // We do NOT need '?id=' because PhonePe sends the ID in the body automatically.
    const callbackRoute = `${baseUrl}/api/payment/status`;

    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(amountInPaise)
      .redirectUrl(callbackRoute) // This ensures we hit our status handler
      .build();

    // 6. Execute
    const response = await client.pay(payRequest);
    const checkoutPageUrl = response.redirectUrl;

    return NextResponse.json({ url: checkoutPageUrl });

  } catch (error: any) {
    console.error("❌ SDK Payment Error:", error);
    return NextResponse.json({ error: "Payment initiation failed", details: error.message }, { status: 500 });
  }
}