import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

// 1. Shared Logic for both GET and POST
async function handlePayment(request: Request) {
  try {
    const url = new URL(request.url);

    // Try to get Booking ID from URL first (GET request)
    let bookingId = url.searchParams.get("id");
    let code = url.searchParams.get("code");

    // If not in URL, try Body (POST request)
    if (!bookingId) {
      try {
        const formData = await request.formData();
        bookingId = formData.get("merchantTransactionId")?.toString() || null;
        code = formData.get("code")?.toString() || null;
      } catch (e) {
        // Body parsing failed, likely a pure GET request
      }
    }

    console.log(`🔹 Processing Payment - ID: ${bookingId}, Code: ${code}`);

    if (!bookingId) {
      return NextResponse.json({ error: "No Booking ID found" }, { status: 400 });
    }

    // 2. Update Database
    await initAdmin();
    const db = getFirestore();
    const bookingRef = db.collection("bookings").doc(bookingId);

    // If we have an ID but no code (e.g. forced GET redirect), check if we should default to success 
    // or fetch status. For this flow, we assume success if redirected here from PhonePe.
    const isSuccess = code === "PAYMENT_SUCCESS" || !code;

    if (isSuccess) {
      await bookingRef.update({
        status: "confirmed",
        paymentStatus: "paid",
        updatedAt: new Date().toISOString(),
      });

      // ✅ CRITICAL: Redirect to the Frontend Success Page
      return NextResponse.redirect(new URL(`/book/success/${bookingId}`, request.url), 303);

    } else {
      await bookingRef.update({
        status: "failed",
        paymentStatus: "failed",
        failureReason: code || "unknown",
        updatedAt: new Date().toISOString(),
      });

      // ✅ CRITICAL: Redirect to the Frontend Failure Page
      return NextResponse.redirect(new URL(`/book/failure/${bookingId}`, request.url), 303);
    }

  } catch (error) {
    console.error("Callback Error:", error);
    // On crash, go to My Trips with error
    return NextResponse.redirect(new URL("/trips?error=server_error", request.url), 303);
  }
}

// 3. Export handlers for both methods
export async function POST(request: Request) {
  return handlePayment(request);
}

export async function GET(request: Request) {
  return handlePayment(request);
}