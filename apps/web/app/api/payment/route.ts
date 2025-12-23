import { NextResponse } from "next/server";
import {
  StandardCheckoutClient,
  Env,
  StandardCheckoutPayRequest,
} from "pg-sdk-node";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { initAdmin } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  await initAdmin();
  const db = getFirestore();
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

    // 2. Get Data (Updated to capture Vehicle Fields)
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
      // --- NEW FIELDS ---
      vehicleIncluded,
      vehicleType,
      vehiclePricePerDay,
      vehicleTotalAmount
    } = body;

    // 3. Save Pending Booking (Now includes Vehicle Data)
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

      // --- CRITICAL UPDATE: Saving Vehicle Info ---
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
    const clientId = process.env.PHONEPE_MERCHANT_ID as string;
    const clientSecret = process.env.PHONEPE_SALT_KEY as string;
    const clientVersion = 1;
    const env = Env.SANDBOX;

    const client = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      clientVersion,
      env
    );

    // 5. Create Payment Request
    const amountInPaise = Math.round(totalAmount * 100);
    const callbackRoute = `${baseUrl}/api/payment/callback?id=${merchantTransactionId}`;

    const payRequest = StandardCheckoutPayRequest.builder()
      .merchantOrderId(merchantTransactionId)
      .amount(amountInPaise)
      .redirectUrl(callbackRoute)
      .build();

    // 6. Execute
    const response = await client.pay(payRequest);
    const checkoutPageUrl = response.redirectUrl;

    return NextResponse.json({ url: checkoutPageUrl });
  } catch (error: any) {
    console.error("❌ SDK Payment Error:", error);
    return NextResponse.json(
      {
        error: "Payment initiation failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}