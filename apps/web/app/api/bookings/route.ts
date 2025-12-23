import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("id");

  // --- DEBUGGING LOG ---
  // This will print exactly what the payment gateway sent to your terminal
  console.log("--- PAYMENT CALLBACK ---");
  console.log("ID:", bookingId);
  searchParams.forEach((value, key) => console.log(`${key}: ${value}`));

  // 1. GET STATUS FLAGS
  const code = searchParams.get("code");
  const status = searchParams.get("status");
  const failureMessage = searchParams.get("message");

  // 2. DETERMINE SUCCESS VS FAILURE
  // We define FAILURE explicitly. If it's not a known failure, we treat it as success.
  // This prevents valid payments from failing just because the code string didn't match perfectly.
  const isExplicitFailure =
    (code && code !== "PAYMENT_SUCCESS" && code !== "SUCCESS") ||
    (status && status !== "success" && status !== "paid");

  // If it's not a failure, we assume it's a success.
  const isSuccess = !isExplicitFailure;

  if (!bookingId) {
    return NextResponse.json({ error: "No Booking ID" }, { status: 400 });
  }

  try {
    await initAdmin();
    const db = getFirestore();
    const bookingRef = db.collection("bookings").doc(bookingId);

    if (isSuccess) {
      // --- CASE: SUCCESS ---
      console.log(`✅ Payment CONFIRMED for ${bookingId}`);

      await bookingRef.update({
        status: "confirmed",
        paymentStatus: "paid",
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.redirect(new URL(`/book/success/${bookingId}`, request.url));

    } else {
      // --- CASE: FAILED ---
      console.warn(`❌ Payment FAILED for ${bookingId} (Code: ${code})`);

      await bookingRef.update({
        status: "failed",
        paymentStatus: "failed",
        failureReason: failureMessage || code || "unknown",
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.redirect(new URL(`/book/failure/${bookingId}`, request.url));
    }

  } catch (error) {
    console.error("Callback Error:", error);
    // If server error, still try to show the user their trips page
    return NextResponse.redirect(new URL(`/trips?error=server_error`, request.url));
  }
}