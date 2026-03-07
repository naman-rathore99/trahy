import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";

// 1. Initialize Razorpay SDK (Replaces PhonePe)
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

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
      partnerId, // 🚨 ADDED: We must receive this from the mobile app!
      listingId, listingName, listingImage, checkIn, checkOut,
      guests, totalAmount, serviceType,
      vehicleIncluded, vehicleType, vehiclePricePerDay, vehicleTotalAmount
    } = body;

    // 3. Save Pending Booking to Firestore
    const bookingRef = await db.collection("bookings").add({
      userId,
      partnerId: partnerId || "UNKNOWN", // 🚨 Links booking to the partner's dashboard
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
      status: "pending_payment", // Changed to match Razorpay flow
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const merchantTransactionId = bookingRef.id;

    // 4. Create Razorpay Payment Request
    const amountInPaise = Math.round(totalAmount * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: merchantTransactionId, // Links Razorpay to your Firestore Booking ID
    };

    const order = await razorpay.orders.create(options);

    // 5. Send data back to frontend so it can open the Razorpay popup
    return NextResponse.json({
      success: true,
      bookingId: merchantTransactionId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error("❌ SDK Payment Error:", error);
    return NextResponse.json({ error: "Payment initiation failed", details: error.message }, { status: 500 });
  }
}