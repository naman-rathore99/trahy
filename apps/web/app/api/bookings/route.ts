import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getAuth } from "firebase-admin/auth";
import { adminDb } from "@/lib/firebaseAdmin";

// Initialize Razorpay SDK (replaces PhonePe SDK)
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
      listingId, listingName, listingImage, checkIn, checkOut,
      guests, totalAmount, serviceType,
      vehicleIncluded, vehicleType, vehiclePricePerDay, vehicleTotalAmount,
      partnerId // 🚨 We need to pass this from the app so the partner can see it!
    } = body;

    // 3. Save Pending Booking to Firestore
    const bookingRef = await db.collection("bookings").add({
      userId,
      partnerId: partnerId || "UNKNOWN", // Links the booking to the hotel owner
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
      status: "pending_payment",
      paymentStatus: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const merchantTransactionId = bookingRef.id;

    // 4. Create Payment Request (Razorpay)
    const amountInPaise = Math.round(totalAmount * 100); // Razorpay uses paise

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: merchantTransactionId, // Links Razorpay to your Firestore Booking ID
    };

    const order = await razorpay.orders.create(options);

    // 5. Send data back to mobile app to open the popup
    return NextResponse.json({
      success: true,
      bookingId: merchantTransactionId, // So app knows which booking to update on success
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