import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

async function handlePayment(request: Request) {
  const url = new URL(request.url);

  // 1. Get Params (Supports both GET redirect and POST webhook)
  let bookingId = url.searchParams.get("id");
  let code = url.searchParams.get("code");
  const failureMessage = url.searchParams.get("message");

  // Fallback: Try body if URL params are missing (for POST webhooks)
  if (!bookingId) {
    try {
      const formData = await request.formData();
      bookingId = formData.get("merchantTransactionId")?.toString() || null;
      code = formData.get("code")?.toString() || null;
    } catch (e) { }
  }

  if (!bookingId) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  // 2. Initialize DB
  await initAdmin();
  const db = getFirestore();

  // --- 🆕 SMART COLLECTION CHECK (Hotels vs Vehicles) ---
  let docRef = db.collection("bookings").doc(bookingId);
  let docSnap = await docRef.get();

  if (!docSnap.exists) {
    // Not in hotels? Check vehicles
    docRef = db.collection("vehicle_bookings").doc(bookingId);
    docSnap = await docRef.get();
  }

  if (!docSnap.exists) {
    console.error(`Booking ${bookingId} not found in any collection.`);
    return NextResponse.redirect(new URL("/trips?error=not_found", request.url), 303);
  }

  // --- 3. HANDLE STATUS CODES ---

  // ✅ CASE A: SUCCESS
  if (code === "PAYMENT_SUCCESS") {
    console.log(`✅ Payment Success: ${bookingId}`);
    await docRef.update({
      status: "confirmed",
      paymentStatus: "paid",
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.redirect(new URL(`/book/success/${bookingId}`, request.url), 303);
  }

  // ⏳ CASE B: PENDING (Redirect to Verify Page)
  // If the bank says "Pending" OR if we have no code (manual test), go to waiting room
  if (code === "PAYMENT_PENDING" || !code) {
    console.log(`⏳ Payment Pending: ${bookingId} -> Redirecting to Verify`);
    // We do NOT update the DB yet. Let the Verify Page poll for the final status.
    return NextResponse.redirect(new URL(`/book/verify/${bookingId}`, request.url), 303);
  }

  // ❌ CASE C: FAILURE
  console.warn(`❌ Payment Failed: ${bookingId} (Code: ${code})`);
  await docRef.update({
    status: "failed",
    paymentStatus: "failed",
    failureReason: failureMessage || code || "unknown",
    updatedAt: new Date().toISOString(),
  });

  return NextResponse.redirect(new URL(`/book/failure/${bookingId}`, request.url), 303);
}

// Export Handlers
export async function GET(request: Request) {
  return handlePayment(request);
}

export async function POST(request: Request) {
  return handlePayment(request);
}