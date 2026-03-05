// app/api/payment/initiate/route.ts
import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    // 1. Verify Auth
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const userId = decodedToken.uid;

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { bookingId, source = "web" } = body;
    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    // 2. Find booking (hotels or vehicles)
    let bookingRef = adminDb.collection("bookings").doc(bookingId);
    let bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      bookingRef = adminDb.collection("vehicle_bookings").doc(bookingId);
      bookingSnap = await bookingRef.get();
    }

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const bookingData = bookingSnap.data()!;
    const bookingOwner = bookingData.userId || bookingData.customer?.userId;

    if (bookingOwner !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const amount = Math.round(Number(bookingData.totalAmount || bookingData.totalPrice) * 100);

    // 3. Create Razorpay Order
    const order = await razorpay.orders.create({
      amount,                      // in paise
      currency: "INR",
      receipt: bookingId.substring(0, 40),
      notes: {
        bookingId,
        userId,
        source,
      },
    });

    // 4. Save orderId to booking
    await bookingRef.update({ razorpayOrderId: order.id });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      bookingId,
      keyId: process.env.RAZORPAY_KEY_ID,
    });

  } catch (error: any) {
    console.error("❌ Payment Initiate Error:", error?.message);
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