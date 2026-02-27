import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { StandardCheckoutClient, Env } from "pg-sdk-node";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // This is the Firestore bookingId

    const clientId = process.env.PHONEPE_MERCHANT_ID || "PGTESTPAYUAT";
    const clientSecret = process.env.PHONEPE_SALT_KEY || "099eb0cd-02cf-4e2a-8aca-3e6c6aff0399";
    const env = Env.SANDBOX;

    // 1. Get booking from Firestore first to find the real transactionId
    let bookingRef = adminDb.collection("bookings").doc(id);
    let docSnap = await bookingRef.get();

    if (!docSnap.exists) {
      bookingRef = adminDb.collection("vehicle_bookings").doc(id);
      docSnap = await bookingRef.get();
    }

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    const bookingData = docSnap.data()!;

    // ✅ If already finalized, return immediately — no need to call PhonePe
    if (bookingData.status === "confirmed" || bookingData.status === "failed") {
      return NextResponse.json({
        success: true,
        status: bookingData.status,
        paymentStatus: bookingData.paymentStatus,
        message: "Already finalized",
      });
    }

    // ✅ Use the stored transactionId, NOT the bookingId
    const transactionId = bookingData.transactionId;

    if (!transactionId) {
      console.error(`No transactionId stored for booking ${id}`);
      return NextResponse.json(
        { error: "No transactionId found for this booking" },
        { status: 400 }
      );
    }

    console.log(`🔍 Checking PhonePe status for transactionId: ${transactionId}`);

    // 2. Ask PhonePe using the correct transactionId
    const client = StandardCheckoutClient.getInstance(
      clientId,
      clientSecret,
      1,
      env
    );

    const response = await (client as any).getOrderStatus(transactionId);
    console.log("✅ PhonePe Response:", JSON.stringify(response, null, 2));

    const paymentState = response.state; // "COMPLETED", "FAILED", "PENDING"

    // 3. Still pending — don't update DB
    if (paymentState !== "COMPLETED" && paymentState !== "FAILED") {
      return NextResponse.json({
        success: false,
        status: "pending",
        paymentStatus: "pending",
        message: "Payment still processing",
      });
    }

    // 4. Update Firestore with final status
    const newStatus = paymentState === "COMPLETED" ? "confirmed" : "failed";
    const newPaymentStatus = paymentState === "COMPLETED" ? "paid" : "failed";

    await bookingRef.update({
      status: newStatus,
      paymentStatus: newPaymentStatus,
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅ Updated booking ${id} → ${newStatus}`);

    return NextResponse.json({
      success: true,
      status: newStatus,
      paymentStatus: newPaymentStatus,
    });

  } catch (error: any) {
    console.error("❌ Status Check Error:", error);
    return NextResponse.json(
      { error: "Check failed", details: error.message },
      { status: 500 }
    );
  }
}
```

The key fix is this:
```
Before: getOrderStatus(id)          ← passing bookingId (wrong)
After:  getOrderStatus(transactionId) ← passing the 34-char PhonePe ID (correct)
