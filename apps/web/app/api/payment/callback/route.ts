import { NextResponse } from "next/server";
import { initAdmin } from "@/lib/firebaseAdmin";
import { getFirestore } from "firebase-admin/firestore";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("id");

  if (!bookingId) {
    return NextResponse.json({ error: "No Booking ID found" }, { status: 400 });
  }

  try {
    await initAdmin();
    const db = getFirestore();

    // 1. Update Booking Status to "Confirmed"
    const bookingRef = db.collection("bookings").doc(bookingId);
    await bookingRef.update({
      status: "confirmed",
      paymentStatus: "paid",
      updatedAt: new Date().toISOString(),
    });

    // 2. REDIRECT to the Success Page
    // We use a 307 Temporary Redirect to keep the method (though GET is standard here)
    // Note: ensure your base URL is correct. In dev, localhost:3000 is fine.
    const successUrl = new URL(`/book/success/${bookingId}`, request.url);
    return NextResponse.redirect(successUrl);

  } catch (error) {
    console.error("Callback Error:", error);
    // Even if update fails, try to show the user the booking page (it might show 'pending')
    return NextResponse.redirect(new URL(`/book/success/${bookingId}?error=update_failed`, request.url));
  }
}