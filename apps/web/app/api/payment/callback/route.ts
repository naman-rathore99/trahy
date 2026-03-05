// app/api/payment/callback/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = body;

    // 1. Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      console.error("❌ Invalid Razorpay signature");
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    // 2. Find booking
    let bookingRef = adminDb.collection("bookings").doc(bookingId);
    let bookingSnap = await bookingRef.get();

    if (!bookingSnap.exists) {
      bookingRef = adminDb.collection("vehicle_bookings").doc(bookingId);
      bookingSnap = await bookingRef.get();
    }

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // 3. Update booking status
    await bookingRef.update({
      status: "confirmed",
      paymentStatus: "paid",
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Callback Error:", error?.message);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}