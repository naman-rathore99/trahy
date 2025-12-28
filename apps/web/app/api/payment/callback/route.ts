import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("id");

  // LOGGING: See exactly what the URL looks like in your terminal
  console.log("Payment Callback Params:", Object.fromEntries(searchParams));

  const code = searchParams.get("code");
  const status = searchParams.get("status");
  const failureMessage = searchParams.get("message");

  // --- LOGIC UPDATE ---
  // 1. It is a FAILURE if explicit error codes exist.
  const isExplicitFailure =
    code === "PAYMENT_ERROR" ||
    status === "failed" ||
    status === "failure" ||
    (code && code !== "PAYMENT_SUCCESS"); // If code exists but isn't SUCCESS

  // 2. It is SUCCESS if:
  //    a) Explicit Success Code OR
  //    b) No code at all (Likely a dev manual test) AND no failure flags
  const isSuccess = !isExplicitFailure;

  if (!bookingId) {
    return NextResponse.json({ error: "No Booking ID found" }, { status: 400 });
  }

  try {
    await initAdmin();
    const db = getFirestore();
    const bookingRef = db.collection("bookings").doc(bookingId);

    if (isSuccess) {
      console.log(`✅ Payment Confirmed for ${bookingId}`);

      await bookingRef.update({
        status: "confirmed",
        paymentStatus: "paid",
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.redirect(new URL(`/book/success/${bookingId}`, request.url));

    } else {
      console.warn(`❌ Payment Failed for ${bookingId} (Code: ${code})`);

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
    return NextResponse.redirect(new URL(`/trips?error=server_error`, request.url));
  }
}