import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import crypto from "crypto";
import { sendInvoiceEmail } from "@/lib/mail";

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
    let isVehicle = false;

    if (!bookingSnap.exists) {
      bookingRef = adminDb.collection("vehicle_bookings").doc(bookingId);
      bookingSnap = await bookingRef.get();
      isVehicle = true;
    }

    if (!bookingSnap.exists) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Extract the data so we can use it for the notification and email
    const bookingData = bookingSnap.data();

    // 3. Update booking status
    await bookingRef.update({
      status: "confirmed",
      paymentStatus: "paid",
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      updatedAt: new Date().toISOString(),
    });

    // 🚨 4. SEND INVOICE EMAIL TO CUSTOMER (FIXED FOR VERCEL) 🚨
    const customerEmail = bookingData?.customer?.email || bookingData?.userEmail;

    if (customerEmail) {
      const displayId = bookingId.slice(0, 8).toUpperCase();
      const displayName = bookingData?.listingName || bookingData?.hotelName || bookingData?.vehicleName || "Shubh Yatra Stay";
      const displayAmount = bookingData?.totalAmount?.toLocaleString('en-IN') || "0";
      const checkInDate = bookingData?.checkIn || bookingData?.startDate || "TBD";
      const checkOutDate = bookingData?.checkOut || bookingData?.endDate || "TBD";
      const guestCount = bookingData?.guests || bookingData?.customer?.guests || 1;

      // We MUST use 'await' here so Vercel doesn't kill the function before Resend finishes
      try {
        console.log(`✉️ Attempting to send invoice email to: ${customerEmail}`);
        await sendInvoiceEmail(customerEmail, {
          id: displayId,
          hotelName: displayName,
          amount: displayAmount,
          date: `${checkInDate} to ${checkOutDate}`,
          guests: guestCount,
        });
        console.log(`✅ Email sent successfully to ${customerEmail}`);
      } catch (err) {
        console.error("❌ Failed to send customer email via Resend:", err);
      }
    } else {
      console.log("⚠️ No customer email provided, skipping invoice email.");
    }

    // 5. TRIGGER REAL-TIME NOTIFICATION FOR THE PARTNER
    if (bookingData?.partnerId && bookingData.partnerId !== "UNKNOWN") {
      const customerName = bookingData.customer?.name || "A guest";
      const amount = bookingData.totalAmount || "0";
      const itemName = bookingData.listingName || (isVehicle ? "a vehicle" : "a property");

      await adminDb.collection("notifications").add({
        partnerId: bookingData.partnerId,
        title: "New Booking Confirmed! 🎉",
        message: `${customerName} just booked ${itemName} for ₹${amount}.`,
        isRead: false,
        type: "new_booking",
        bookingId: bookingId,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Notification successfully created for partner: ${bookingData.partnerId}`);
    } else {
      console.log(`⚠️ Booking ${bookingId} has no valid partnerId. Notification skipped.`);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("❌ Callback Error:", error?.message);
    return NextResponse.json({ error: "Callback failed" }, { status: 500 });
  }
}